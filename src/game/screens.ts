// Menu screens: home, shop, map, album, events, settings and the other lists.
// These are methods of Game (see game.ts), kept here to keep that file a readable size.

import { FONT } from '../font';
import { sfx } from '../audio';
import { haptic, save, scheduleAt } from '../platform';
import { TRACKS, setMusic, type TrackId } from '../audio';
import { AREAS, AREA_MAX, RESTAURANTS, TIP_HOURS, areaCost, popularity, tipRate } from '../collect';
import { CUP_SIZE, CREW_GOALS, CREW_MATES, HOLIDAY_GOAL, PASS_TIERS, PASS_XP, RACE_GOAL, RACE_POOL, TOUR_GOALS, crewMateOrders, crewWeek, cupReward, cupRivals, cupWeekend, currentHoliday, currentTour, raceEnd, raceFinishers, timeLeft } from '../live';
import { PRODUCTS } from '../monetize';
import { dayKey, weekKey } from '../progress';
import { settings } from '../settings';
import { t } from '../i18n';
import { funnel, track } from '../analytics';
import { cfg } from '../config';
import { STAFF, STYLES, criticToday, encodeRestaurant, styleText, stylesArray, themeById, themeInSeason, type RestCode, type RestTheme, type StaffId } from '../restaurant';
import { drawRestaurantScene, seatPos, type SceneGuest } from '../scene';
import type { AreaId } from '../collect';
import { LEAGUES, LEAGUE_SIZE, PROMOTE, QUEST_STAGES, currentQuest, leagueWeek } from '../compete';
import { RESCUES, TOWER_FLOORS } from '../modes';
import { SECRETS } from '../cuisine';
import { announce } from '../a11y';
import { dailyNumber } from '../daily';
import { decodeBoss } from '../bossmaker';
import { countryById, guessCountry, worldSimToday } from '../world';
import { CHEF_VISITS_PER_DAY, EXPANSIONS, FEST_COSTS, GOALS, GOAL_CHEST_COINS, GUESTBOOK_GOALS, GUEST_TYPES, LOTS, PIECE_KINDS, PIECE_SETS, RATING_STEPS, REQUESTS_MAX, REQUEST_EVERY, RIVALS, RIVAL_WIN_COINS, RUSH_CHESTS, SET_TIP_BONUS, UPGRADES, canAfford, cookMs, dishCost, dishLevel, festivalNow, nextFestival, ratingPoints, ratingStars, rivalNow, rushHoursBetween, taskText, weekReward, weekStart } from '../diner';
import { endLiveActivity, startLiveActivity, updateWidget } from '../widget';
import { AVATAR_OPTIONS, REGULARS, avatarChef } from '../meta';
import { BOOSTERS, type Ingredient } from '../shop';
import { chefFor } from '../chef';
import { Game, WORLD_W,  RECIPES, DISH_EMOJI, PUZZLES, Mode } from '../game';

declare module '../game' {
  interface Game {
    openScreen(mode: Mode, back?: Mode): void;
    screenBegin(title: string, sub?: string): { areaTop: number; areaH: number; backY: number; y0: number };
    screenEnd(frame: { areaTop: number; areaH: number; backY: number }, contentH: number): void;
    listTap(x: number, y: number, w: number, h: number, frame: { areaTop: number; areaH: number }, onTap: () => void): void;
    card(x: number, y: number, w: number, h: number, fill?: string): void;
    dot(x: number, y: number, r: number, color: string): void;
    pill(x: number, y: number, w: number, label: string, frame: { areaTop: number; areaH: number }, onTap: () => void, style?: 'primary' | 'gold' | 'quiet'): void;
    bar(x: number, y: number, w: number, frac: number, color?: string, h?: number): void;
    drawModes(): void;
    drawEvents(): void;
    drawMore(): void;
    toggleMusic(): void;
    staffLv(id: StaffId): number;
    tipsPerHour(): number;
    jarHours(): number;
    popularity(): number;
    restaurantTips(): number;
    pushWidget(): void;
    collectTips(): void;
    scheduleTipReminder(): void;
    restaurantUpgradeReady(): boolean;
    restaurantPitch(): { text: string; hot: boolean };
    apprenticeGift(): void;
    restFloat(text: string, x: number, y: number): void;
    sceneGuests(): SceneGuest[];
    startCritic(): void;
    criticResult(stars: number): void;
    styleOwned(area: AreaId, i: number): boolean;
    tapStyle(area: AreaId, i: number): void;
    hireStaff(id: StaffId): void;
    setMenu(recipe: string): void;
    tapTheme(th: RestTheme): void;
    equipTheme(th: RestTheme): void;
    myRestCode(): string;
    shareRestaurant(): void;
    openVisit(c: RestCode): void;
    heartVisit(): void;
    drawVisit(): void;
    dur(ms: number): string;
    ago(at: number): string;
    gotoTab(tab: Game['restTab']): void;
    drawRestaurant(): void;
    drawDreamCard(f: { areaTop: number; areaH: number }, y: number): number;
    drawFlagship(x: number, y: number, w: number, h: number, pct: number, alpha?: number): void;
    drawRushCard(y: number, rush: { name: string; end: number }): number;
    drawKitchenCard(f: { areaTop: number; areaH: number }, y: number): number;
    serveRequestNow(i: number): void;
    drawOrderBoard(f: { areaTop: number; areaH: number }, y: number): number;
    drawGoalsCard(f: { areaTop: number; areaH: number }, y: number): number;
    drawFestCard(f: { areaTop: number; areaH: number }, y: number, fest: { f: { name: string; icon: string; color: string }; key: string; ends: number }): number;
    ingChip(k: Ingredient, x: number, y: number, label: string, ok: boolean): number;
    drawRestKitchen(f: { areaTop: number; areaH: number }, y: number): number;
    drawRestExpand(f: { areaTop: number; areaH: number }, y: number): number;
    drawRestStreet(f: { areaTop: number; areaH: number }, y: number): number;
    drawRestShelf(y: number): number;
    drawRestGuests(y: number): number;
    drawRestReviews(y: number): number;
    drawRestRival(f: { areaTop: number; areaH: number }, y: number): number;
    drawRestFest(f: { areaTop: number; areaH: number }, y: number): number;
    drawBurst(): void;
    drawReport(blocker: () => void): void;
    drawCheer(): void;
    drawUpgradeFx(box: { x: number; y: number; w: number; h: number }): void;
  }
}

export const screensMethods = {
  openScreen(this: Game, mode: Mode, back: Mode = 'title'): void {
    this.screenBack = back;
    this.mode = mode;
    if (mode === 'restaurant' && !funnel().find((s) => s.id === 'restaurant_open')?.at) track('restaurant_open');
    if (mode === 'restaurant') this.dinerVisit();
    this.pageScroll = 0;
    this.listMax = 0;
  },

  /** Dims the scene, draws the screen title, and clips the scrolling area. Pair with screenEnd(). */
  screenBegin(this: Game, title: string, sub?: string): { areaTop: number; areaH: number; backY: number; y0: number } {
    const { ctx } = this;
    const top = this.insets.top;
    ctx.fillStyle = 'rgba(20,10,25,0.68)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    // Kept clear of the sound button on the left and the coin counter on the right.
    this.fitText(title, WORLD_W / 2, top + 31, WORLD_W - 170, 22, '#fff', 'center', 700);
    if (title !== this.lastScreenTitle) {
      this.lastScreenTitle = title;
      announce(`${title} screen${sub ? `. ${sub}` : ''}`);
    }
    if (sub) this.fitText(sub, WORLD_W / 2, top + 56, WORLD_W - 24, 12, '#ffd34d', 'center', 700);
    const backY = this.viewH - this.insets.bottom - 60;
    const areaTop = top + (sub ? 72 : 60);
    const areaH = backY - 10 - areaTop;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-this.offX, areaTop, WORLD_W + this.offX * 2, areaH);
    ctx.clip();
    this.qaClip = [areaTop, areaTop + areaH];
    this.curFrame = { areaTop, areaH };
    return { areaTop, areaH, backY, y0: areaTop - this.pageScroll };
  },

  screenEnd(this: Game, frame: { areaTop: number; areaH: number; backY: number }, contentH: number): void {
    this.ctx.restore();
    this.qaClip = null;
    this.listMax = Math.max(0, contentH - frame.areaH + 10);
    this.pageScroll = Math.min(this.pageScroll, this.listMax);
    this.button(16, frame.backY, WORLD_W - 32, 46, t('back'), () => { this.mode = this.screenBack; }, 'quiet');
  },

  /** A tappable area inside a scrolling list: only the visible part responds. */
  listTap(this: Game, x: number, y: number, w: number, h: number, frame: { areaTop: number; areaH: number }, onTap: () => void): void {
    const hy = Math.max(y, frame.areaTop);
    const hh = Math.min(y + h, frame.areaTop + frame.areaH) - hy;
    if (hh > 0) this.buttons.push({ x, y: hy, w, h: hh, onTap });
  },

  /** Panel with a soft drop shadow and a faint inner edge. */
  card(this: Game, x: number, y: number, w: number, h: number, fill = 'rgba(48,30,52,0.95)'): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    this.roundRect(x, y + 3, w, h, 14);
    ctx.fill();
    ctx.fillStyle = fill;
    this.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  /** Filled circle, for small UI dots and badges. */
  dot(this: Game, x: number, y: number, r: number, color: string): void {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  },

  /** A small pill button inside a list. */
  pill(this: Game, x: number, y: number, w: number, label: string, frame: { areaTop: number; areaH: number }, onTap: () => void, style: 'primary' | 'gold' | 'quiet' = 'primary'): void {
    this.drawButton(x, y, w, 32, label, style, 12);
    this.listTap(x, y, w, 32, frame, onTap);
    const last = this.buttons[this.buttons.length - 1];
    if (last && last.onTap === onTap) last.label = label;
  },

  bar(this: Game, x: number, y: number, w: number, frac: number, color = '#ff8a5b', h = 7): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = color;
    this.roundRect(x, y, w * Math.max(0, Math.min(1, frac)), h, h / 2);
    ctx.fill();
  },

  drawModes(this: Game): void {
    const f = this.screenBegin('GAME MODES');
    const p = this.progress;
    let y = f.y0 + 4;
    const modes: [string, string, string, () => void, string?][] = [
      ['🍣 Chef Journey', `Continue at level ${p.playLevel} · ${chefFor(p.playLevel).name}`, 'PLAY', () => this.startRun()],
      ['🟩 Daily Roll', this.dailyDone() ? `#${dailyNumber()} done · ${p.daily.height} layers · share your grid` : `#${dailyNumber()} · the same layers for everyone today`, this.dailyDone() ? 'GRID' : 'PLAY', () => this.openScreen('daily', 'modes'), 'daily'],
      ['🧘 Zen', `No game over, no attacks, calm music · best ${p.zenBest}`, 'RELAX', () => this.startRun(p.playLevel, 'zen')],
      ['🎧 ASMR Kitchen', 'Headphones on: soft knife sounds, slow layers', 'RELAX', () => this.startAsmr(), 'relay'],
      ['🤝 Relay', `Two players, one tower, take turns · best ${p.relayBest}`, 'PLAY', () => this.startRelay(), 'relay'],
      ['🧑‍🍳 Boss Maker', 'Design a boss chef and share the code', 'CREATE', () => { const d = decodeBoss(p.myBoss); if (d) this.bossDraft = d; this.openScreen('bossmaker', 'modes'); }, 'bossmaker'],
      ['📷 Table Mode', this.tableMode ? 'ON: runs play over your camera' : 'Play over your camera, on your real table', this.tableMode ? 'TURN OFF' : 'TURN ON', () => { this.tableMode = !this.tableMode; if (!this.tableMode) this.stopCamera(); this.showToast(this.tableMode ? '📷 Table mode on: start any run' : 'Table mode off'); }, 'table'],
      ['⏱ Time Attack', `Stack as high as you can in 60 seconds · best ${p.timeBest}`, 'GO', () => this.startRun(p.playLevel, 'time')],
      ...(this.nemesisLevel() ? [['😈 Nemesis rematch', `${chefFor(this.nemesisLevel()).name} beat you ${p.losses[this.nemesisLevel()]} times · reward ${this.nemesisReward()} coins`, 'REMATCH', () => this.startRun(this.nemesisLevel())] as [string, string, string, () => void]] : []),
      ['🆘 Rescue', `Save grandma’s stall · ${this.progress.rescueStars.filter((x) => x > 0).length}/${RESCUES.length} saved`, 'OPEN', () => this.openScreen('rescues', 'modes'), 'rescue'],
      ['🗼 Omakase Tower', `${TOWER_FLOORS} weekly floors · checkpoint ${this.towerState().cp}`, 'CLIMB', () => this.openScreen('towerview', 'modes'), 'tower'],
      ['🎭 Modifiers', 'Mirror, blind, tiny, double speed, twins', 'OPEN', () => this.openScreen('modchals', 'modes'), 'modchals'],
      ['🎮 Mini-games', 'Knife Throw, Rice Rhythm, Fish Catch', 'OPEN', () => this.openScreen('minis', 'modes'), 'minis'],
      ['👥 Pass & Play', 'Two players, one phone, the same run', 'PLAY', () => this.startPnp(1)],
      ['⚔️ Gauntlet', `Boss after boss, no breaks, no perks · best ${p.gauntletBest} chefs`, 'FIGHT', () => this.startRun(Math.max(5, p.playLevel), 'gauntlet'), 'gauntlet'],
      ['🍱 Daily Special', p.specialDay === dayKey() ? 'Cleared today, practice anytime' : 'One special order, +150 coins today', 'PLAY', () => this.startRun(this.specialLevel(), 'special')],
      ['🤝 Friend Challenge', 'Enter a friend’s code and beat their score', 'ENTER CODE', () => this.openCodeInput()],
    ];
    // Modes open one by one along the journey; only the next two locked ones are shown as a preview.
    const open = modes.filter((m) => !m[4] || !this.lockedAt(m[4]));
    const soon = modes.filter((m) => m[4] && this.lockedAt(m[4])).sort((a, b) => this.lockedAt(a[4]!) - this.lockedAt(b[4]!)).slice(0, 2);
    for (const [name, desc, label, go] of open) {
      this.card(16, y, WORLD_W - 32, 70);
      this.text(name, 32, y + 24, 16, '#fff', 900, 'left');
      this.text(desc, 32, y + 48, 11, 'rgba(255,255,255,0.75)', 600, 'left');
      this.pill(WORLD_W - 128, y + 19, 98, label, f, go, 'gold');
      const lb = this.buttons[this.buttons.length - 1];
      if (lb && lb.onTap === go) lb.label = `${name}: ${label}`;
      y += 80;
    }
    for (const [name, , , , id] of soon) {
      this.card(16, y, WORLD_W - 32, 52, 'rgba(30,20,35,0.75)');
      this.text(`🔒 ${name}`, 32, y + 26, 14, 'rgba(255,255,255,0.55)', 700, 'left');
      this.text(`opens at level ${this.lockedAt(id!)}`, WORLD_W - 32, y + 26, 11, 'rgba(255,255,255,0.5)', 600, 'right');
      y += 60;
    }
    // Puzzles: fixed layers, a slice budget, three stars each.
    const solved = p.puzzleStars.filter((x) => x > 0).length;
    const total = p.puzzleStars.reduce((a, b) => a + (b || 0), 0);
    this.text(`🧩 PUZZLES · ${total}/${PUZZLES * 3}★ · stack the layers without slicing too much`, 16, y + 12, 12, 'rgba(255,255,255,0.8)', 800, 'left');
    y += 26;
    const tw = (WORLD_W - 32 - 4 * 8) / 5;
    for (let i = 0; i < PUZZLES; i++) {
      const x = 16 + (i % 5) * (tw + 8);
      const ty = y + Math.floor(i / 5) * (tw + 8);
      const open = i <= solved;
      const st = p.puzzleStars[i] || 0;
      this.card(x, ty, tw, tw, open ? (st ? 'rgba(255,248,235,0.95)' : 'rgba(255,138,91,0.9)') : 'rgba(255,255,255,0.08)');
      this.text(open ? String(i + 1) : '🔒', x + tw / 2, ty + tw * 0.42, open ? 18 : 14, st ? '#4a2618' : '#fff', 900);
      if (open) this.text('★'.repeat(st) + '☆'.repeat(3 - st), x + tw / 2, ty + tw * 0.76, 11, st ? '#e0a800' : 'rgba(255,255,255,0.8)', 900);
      if (open) this.listTap(x, ty, tw, tw, f, () => this.startRun(1, 'puzzle', { puzzle: i }));
    }
    y += Math.ceil(PUZZLES / 5) * (tw + 8);
    this.screenEnd(f, y - f.y0 + 8);
  },

  drawEvents(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('EVENTS', 'Rivals and crewmates marked (AI) are computer players');
    const { ctx } = this;
    let y = f.y0 + 4;
    const W = WORLD_W - 32;

    // League and Streak Quest.
    const half = (W - 8) / 2;
    const L = LEAGUES[p.league.tier];
    const myRank = this.leagueTable().findIndex((r) => r.me) + 1;
    this.card(16, y, half, 84, 'rgba(40,40,80,0.95)');
    this.text(`${L.icon} ${L.name.toUpperCase()}`, 16 + half / 2, y + 22, 13, '#fff', 700);
    this.text(`#${myRank} of ${LEAGUE_SIZE}`, 16 + half / 2, y + 44, 16, myRank <= PROMOTE ? '#8fdc93' : '#ffd34d', 700);
    this.text(`${p.league.pts} pts · ${timeLeft(leagueWeek().end)}`, 16 + half / 2, y + 66, 10, 'rgba(255,255,255,0.7)', 600);
    this.listTap(16, y, half, 84, f, () => this.openScreen('league', 'events'));
    const q = this.quest;
    this.card(24 + half, y, half, 84, 'rgba(90,30,20,0.95)');
    this.text('🌋 STREAK QUEST', 24 + half + half / 2, y + 22, 13, '#fff', 700);
    this.text(!q.joined ? 'JOIN · 10,000 coins' : q.out ? 'Knocked out' : q.stage >= QUEST_STAGES ? (q.claimed ? '✓ Cleared' : 'Claim reward!') : `Stage ${q.stage}/${QUEST_STAGES}`, 24 + half + half / 2, y + 44, 13, q.out ? '#ff9a8a' : '#ffd34d', 700);
    this.text(timeLeft(currentQuest().end), 24 + half + half / 2, y + 66, 10, 'rgba(255,255,255,0.7)', 600);
    this.listTap(24 + half, y, half, 84, f, () => this.openScreen('quest', 'events'));
    y += 94;
    // The Tower of the World and the Country Cup (simulated players until there's a server).
    if (!this.lockedAt('world')) {
      const wt = worldSimToday(dayKey()) + (p.world.day === dayKey() ? p.world.today : 0);
      this.card(16, y, half, 76, 'rgba(20,30,70,0.95)');
      this.text('🌍 WORLD TOWER', 16 + half / 2, y + 22, 12.5, '#fff', 700);
      this.fitText(`${Math.round(wt / 1000)}k layers today`, 16 + half / 2, y + 46, half - 16, 12, '#9fe3ff', 'center', 700);
      this.listTap(16, y, half, 76, f, () => this.openScreen('world', 'events'));
      const flag = countryById(settings.country || guessCountry()).flag;
      this.card(24 + half, y, half, 76, 'rgba(60,30,60,0.95)');
      this.text(`${flag} COUNTRY CUP`, 24 + half + half / 2, y + 22, 12.5, '#fff', 700);
      this.fitText(`your best ${p.countryWeek.week === weekKey() ? p.countryWeek.best : 0} m`, 24 + half + half / 2, y + 46, half - 16, 12, '#ffd34d', 'center', 700);
      this.listTap(24 + half, y, half, 76, f, () => this.openScreen('countries', 'events'));
      y += 86;
    }

    // World Tour
    const tour = currentTour();
    const tTokens = p.tour.key === tour.key ? p.tour.tokens : 0;
    const tClaimed = p.tour.key === tour.key ? p.tour.claimed : [];
    this.card(16, y, W, 132, 'rgba(40,30,70,0.95)');
    this.text(`🌏 WORLD TOUR · ${tour.city.name.toUpperCase()}`, 32, y + 22, 15, '#fff', 900, 'left');
    this.text(timeLeft(tour.end), WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
    this.wrapLeft(`${tour.city.name}'s skyline opens every run. Tokens: chefs +1, specials +3, missions +2.`, 32, y + 40, W - 32, 10, 'rgba(255,255,255,0.75)');
    const goalMax = TOUR_GOALS[TOUR_GOALS.length - 1].tokens;
    this.bar(32, y + 62, W - 32, tTokens / goalMax, '#ffd34d', 9);
    TOUR_GOALS.forEach((g, i) => {
      const gx = 32 + (W - 32) * (g.tokens / goalMax);
      ctx.fillStyle = tClaimed.includes(i) ? '#8fdc93' : '#ffffff';
      ctx.beginPath();
      ctx.arc(gx, y + 66.5, 6, 0, Math.PI * 2);
      ctx.fill();
      this.text(`${g.tokens}`, gx, y + 84, 10, 'rgba(255,255,255,0.8)', 800);
      this.text(tClaimed.includes(i) ? '✓' : g.label, Math.min(WORLD_W - 70, Math.max(70, gx)), y + 100 + i * 0, 9.5, tClaimed.includes(i) ? '#8fdc93' : 'rgba(255,255,255,0.7)', 700);
    });
    this.text(`${tTokens} tokens`, 32, y + 120, 12, '#ffd34d', 900, 'left');
    y += 142;

    // Holiday
    const hol = currentHoliday();
    if (hol) {
      const hTokens = p.holiday.key === hol.key ? p.holiday.tokens : 0;
      const done = p.holiday.key === hol.key && p.holiday.claimed;
      this.card(16, y, W, 92, 'rgba(70,30,20,0.95)');
      this.text(`🎉 ${hol.holiday.name.toUpperCase()}`, 32, y + 22, 15, hol.holiday.color, 900, 'left');
      this.text(timeLeft(hol.end), WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
      this.wrapLeft(`Limited: ${hol.holiday.item.name}. Themed decorations and seasonal golden layers.`, 32, y + 40, W - 32, 10, 'rgba(255,255,255,0.75)');
      this.bar(32, y + 60, W - 32, hTokens / HOLIDAY_GOAL, hol.holiday.color, 9);
      this.text(done ? '✓ Unlocked!' : `${Math.min(hTokens, HOLIDAY_GOAL)}/${HOLIDAY_GOAL} tokens`, 32, y + 80, 11, done ? '#8fdc93' : '#fff', 800, 'left');
      y += 102;
    }

    // Daily race
    const r = p.race;
    const today = r.day === dayKey();
    const fin = raceFinishers(dayKey());
    this.card(16, y, W, 112, 'rgba(20,50,60,0.95)');
    this.text('🏁 SUSHI SPRINT · daily', 32, y + 22, 15, '#fff', 900, 'left');
    this.text(timeLeft(raceEnd()), WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
    this.wrapLeft(`Beat ${RACE_GOAL} chefs in one run. ${RACE_POOL} coins are split between finishers, so finish early for a bigger share.`, 32, y + 40, W - 32, 10, 'rgba(255,255,255,0.75)');
    this.text(`AI racers finished: ${fin}/99 · your share now ≈ ${Math.max(20, Math.floor(RACE_POOL / (fin + 1)))}`, 32, y + 64, 11, '#9fe3ff', 700, 'left');
    if (!today || !r.joined) {
      this.pill(32, y + 74, 120, 'JOIN RACE', f, () => { p.race = { day: dayKey(), joined: true, best: 0, finished: false, reward: 0, claimed: false }; p.persist(); this.showToast('Joined! Beat 5 chefs in one run.'); }, 'gold');
    } else if (r.finished && !r.claimed) {
      this.pill(32, y + 74, 160, `CLAIM ${r.reward} + 2 PACKS`, f, () => { r.claimed = true; this.bankCoins(r.reward); this.openPacks(2); p.persist(); }, 'gold');
    } else {
      this.bar(32, y + 86, W - 160, r.best / RACE_GOAL, '#4cc9f0', 9);
      this.text(r.claimed ? '✓ Claimed' : `${Math.min(r.best, RACE_GOAL)}/${RACE_GOAL} chefs`, WORLD_W - 40, y + 90, 12, r.claimed ? '#8fdc93' : '#fff', 900, 'right');
    }
    y += 122;

    // Weekend cup
    const cup = cupWeekend();
    const myBest = p.cup.key === cup.key ? p.cup.best : 0;
    const rivals = cupRivals(cup.key, cup.start, cup.end);
    const table = [...rivals, { name: 'YOU', score: myBest }].sort((a, b) => b.score - a.score);
    const rank = table.findIndex((e) => e.name === 'YOU') + 1;
    this.card(16, y, W, 210, 'rgba(60,40,10,0.95)');
    this.text('🏆 SUSHI CUP · weekend', 32, y + 22, 15, '#ffd34d', 900, 'left');
    this.text(cup.live ? timeLeft(cup.end) : 'Next cup: Friday', WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
    this.wrapLeft(`Best single-run height, Fri–Sun, vs ${CUP_SIZE - 1} AI rivals. #1 wins 600 coins and the Cup Trophy flag.`, 32, y + 40, W - 32, 10, 'rgba(255,255,255,0.75)');
    table.slice(0, 5).forEach((e, i) => {
      const me = e.name === 'YOU';
      this.text(`${i + 1}. ${e.name}`, 40, y + 68 + i * 20, 12, me ? '#ffd34d' : '#fff', me ? 900 : 600, 'left');
      this.text(String(e.score), WORLD_W - 40, y + 68 + i * 20, 12, me ? '#ffd34d' : '#fff', 800, 'right');
    });
    this.text(`Your rank: ${rank}/${CUP_SIZE} · best ${myBest} · prize ${cupReward(rank)} coins`, 32, y + 172, 12, '#ffd34d', 900, 'left');
    if (!cup.live && p.cup.key === cup.key && !p.cup.claimed) {
      this.pill(WORLD_W - 150, y + 158, 118, 'CLAIM PRIZE', f, () => {
        p.cup.claimed = true;
        this.bankCoins(cupReward(rank));
        if (rank === 1) this.unlockExclusive('flag', 'trophy', 'Cup Trophy flag');
        this.celebrate(`SUSHI CUP: #${rank}`, `+${cupReward(rank)} coins`);
        p.persist();
      }, 'gold');
    }
    y += 220;

    // Kitchen crew
    const w = crewWeek();
    const mine = p.crew.key === w.key ? p.crew.mine : 0;
    const mates = crewMateOrders(w.key, w.start, w.end);
    const crewTotal = mine + mates.reduce((a, b) => a + b, 0);
    const claimed = p.crew.key === w.key ? p.crew.claimed : [];
    this.card(16, y, W, 196, 'rgba(30,60,30,0.95)');
    this.text('👩‍🍳 KITCHEN CREW · weekly', 32, y + 22, 15, '#fff', 900, 'left');
    this.text(timeLeft(w.end), WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
    this.wrapLeft('Your crew serves orders together. Real teams need online servers, so for now your crewmates are AI.', 32, y + 38, W - 32, 10, 'rgba(255,255,255,0.75)');
    [['You', mine] as [string, number], ...CREW_MATES.map((n, i) => [n, mates[i]] as [string, number])].forEach(([n, v], i) => {
      this.text(n, 40, y + 62 + i * 17, 11, i === 0 ? '#ffd34d' : '#fff', i === 0 ? 900 : 600, 'left');
      this.text(`${v} orders`, WORLD_W - 40, y + 62 + i * 17, 11, '#fff', 700, 'right');
    });
    this.bar(32, y + 150, W - 32, crewTotal / CREW_GOALS[CREW_GOALS.length - 1].orders, '#8fdc93', 9);
    CREW_GOALS.forEach((g, i) => {
      const gx = 32 + 112 * i;
      const ok = crewTotal >= g.orders;
      const got = claimed.includes(i);
      this.pill(gx, y + 160, 104, got ? '✓' : `${g.orders}: ${ok ? 'CLAIM' : g.label}`, f, () => {
        if (!ok || got) return;
        if (p.crew.key !== w.key) p.crew = { key: w.key, mine: 0, claimed: [] };
        p.crew.claimed.push(i);
        if (i === 0) this.bankCoins(300);
        else if (i === 1) this.openPacks(3);
        else this.addShards(10);
        p.persist();
      }, ok && !got ? 'gold' : 'quiet');
    });
    y += 206;

    // Free chests from ads
    const ads = p.ads;
    this.card(16, y, W, 70, 'rgba(48,30,52,0.95)');
    this.text('🎁 FREE CHESTS', 32, y + 22, 15, '#fff', 900, 'left');
    this.text(`Watch a short ad for a chest · ${3 - ads.chests} left today${p.vip ? ' · VIP: +1 free' : ''}`, 32, y + 46, 11, 'rgba(255,255,255,0.75)', 600, 'left');
    const vipFree = p.vip && !ads.vipChest;
    this.pill(WORLD_W - 130, y + 19, 100, vipFree ? 'FREE (VIP)' : ads.chests < 3 ? '▶ WATCH' : 'TOMORROW', f, () => {
      if (vipFree) { ads.vipChest = true; this.openChest(p.playLevel); p.persist(); return; }
      if (ads.chests >= 3) return;
      this.watchAd('Free chest', () => { ads.chests++; this.openChest(p.playLevel); p.persist(); });
    }, ads.chests < 3 || vipFree ? 'gold' : 'quiet');
    y += 80;
    this.screenEnd(f, y - f.y0);
  },

  drawMore(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('MORE');
    const passClaimable = this.passClaimable();
    // Grouped: the collections live in one tile, the competitions under Events.
    const tiles: [string, string, string, () => void, string][] = [
      ['🏯', 'Restaurant', `★ ${p.starPool} to spend`, () => this.openScreen('restaurant', 'more'), 'restaurant'],
      ['📚', 'Collection', this.lettersUnread() ? `${this.lettersUnread()} new letter${this.lettersUnread() > 1 ? 's' : ''}!` : this.achClaimable() ? 'Rewards ready!' : 'Book, museum, album, gallery', () => this.openScreen('collection', 'more'), ''],
      ['🎟️', 'Sushi Pass', passClaimable ? `${passClaimable} reward${passClaimable > 1 ? 's' : ''} ready!` : `Tier ${Math.min(PASS_TIERS, Math.floor(p.pass.xp / PASS_XP))}/${PASS_TIERS}`, () => this.openScreen('pass', 'more'), ''],
      ['📅', 'Calendar', this.calendarReady() ? 'Today’s reward ready!' : `Day ${p.calendar.n}/28`, () => this.openScreen('calendar', 'more'), ''],
      ['🪪', 'Profile', p.prestige ? `Prestige ${p.prestige} · badges` : 'Stats, badges, prestige', () => this.openScreen('profile', 'more'), ''],
      ['🧑‍🍳', 'My Chef', `Chef ${p.avatar.name}`, () => this.openScreen('avatar', 'more'), ''],
      ['🧪', 'Recipe Lab', `${this.progress.secrets.length}/${SECRETS.length} secrets`, () => this.openScreen('lab', 'more'), ''],
      ['🎵', 'Jukebox', TRACKS[settings.track as TrackId]?.name ?? 'Music', () => this.openScreen('jukebox', 'more'), ''],
      ['📊', 'Leaderboards', 'Your best runs and the Cup', () => this.openScreen('boards', 'more'), ''],
      ['🤝', 'Friend Code', 'Challenges, ghosts, bosses, songs', () => this.openCodeInput(), ''],
      ['⚖️', 'Fair Play', 'The No-Nonsense Promise and odds', () => this.openScreen('promise', 'more'), ''],
      ['⚙️', 'Settings', 'Sound, accessibility, language, save', () => this.openScreen('settings', 'more'), ''],
    ];
    this.drawTiles(f, tiles);
  },

  toggleMusic(this: Game): void {
    this.musicOn = !this.musicOn;
    save.setJson('music', this.musicOn);
    setMusic(this.musicOn);
  },

  staffLv(this: Game, id: StaffId): number {
    return this.rest.staff[id] ?? 0;
  },

  /** Coins per hour: upgrades and finished restaurants, boosted by the waiter, the menu board, reviews and the Pass. */
  tipsPerHour(this: Game): number {
    const rs = this.progress.restaurant;
    const waiter = [0, 0.15, 0.3, 0.5][this.staffLv('waiter')];
    const menu = this.rest.menu.day === dayKey() ? 0.2 : 0;
    return Math.round((tipRate(this.restTier, rs.levels) + this.rest.reviews * 5 + this.lotTips()) * (1 + waiter + menu + (this.restPass ? 0.5 : 0) + this.dinerTipBonus()) * cfg.tipsMult);
  },

  jarHours(this: Game): number {
    return TIP_HOURS + this.staffLv('dishwasher') * 2 + (this.restPass ? 4 : 0);
  },

  /** Popularity 1-5: upgrades, finished restaurants and the critic's reviews. */
  popularity(this: Game): number {
    return Math.min(5, popularity(this.restTier, this.progress.restaurant.levels) + Math.floor(this.rest.reviews / 2));
  },

  /** Tips waiting in the jar: they build up per hour while you play or are away. */
  restaurantTips(this: Game): number {
    const rs = this.progress.restaurant as Game['progress']['restaurant'] & { tipsAt?: number };
    if (this.lockedAt('restaurant')) return 0;
    if (!rs.tipsAt) {
      rs.tipsAt = Date.now();
      this.progress.persist();
    }
    // The jar fills twice as fast during Rush Hour.
    const now = Date.now();
    const rush = rushHoursBetween(Math.max(rs.tipsAt, now - 2 * 86_400_000), now, this.hasLot('ramen'));
    const hours = Math.min(this.jarHours(), (now - rs.tipsAt) / 3_600_000 + rush);
    return Math.floor(hours * this.tipsPerHour());
  },

  /** Sends the restaurant, tip jar and calendar to the home-screen widget (native builds only). */
  pushWidget(this: Game): void {
    if (this.lockedAt('restaurant')) return;
    const rs = this.progress.restaurant as Game['progress']['restaurant'] & { tipsAt?: number };
    updateWidget({
      restaurant: RESTAURANTS[Math.min(rs.r, RESTAURANTS.length - 1)].name, stars: this.popularity(), tips: this.restaurantTips(),
      tipsMax: this.tipsPerHour() * this.jarHours(), jarFullAt: (rs.tipsAt ?? Date.now()) + this.jarHours() * 3_600_000,
      calendarDay: this.progress.calendar.n % 28 + 1, calendarReady: this.calendarReady(), level: this.progress.unlocked, chef: this.progress.avatar.name,
    });
  },

  collectTips(this: Game): void {
    const tips = this.restaurantTips();
    if (tips <= 0) {
      this.showToast('The tip jar is empty. Come back soon!');
      return;
    }
    (this.progress.restaurant as { tipsAt?: number }).tipsAt = Date.now();
    // The base is banked right away; tapping during the coin burst adds a bonus on top.
    this.bankCoins(tips);
    this.addIncome(tips);
    this.goal('collect');
    this.progress.persist();
    this.burst = { base: tips, taps: 0, t: 0, sparks: [] };
    sfx.coin();
    haptic.medium();
    track('tips', { coins: tips });
    this.scheduleTipReminder();
    this.pushWidget();
    // Lock screen / Dynamic Island countdown until the jar is full again (iPhone, when set up).
    endLiveActivity();
    startLiveActivity('Tip jar filling', Date.now() + this.jarHours() * 3_600_000, `${RESTAURANTS[Math.min(this.progress.restaurant.r, RESTAURANTS.length - 1)].name} · ${this.tipsPerHour()} tips/hour`);
  },

  /** A local notification for when the tip jar is full (only if the player allowed reminders). */
  scheduleTipReminder(this: Game): void {
    if (this.lockedAt('restaurant')) return;
    const at = ((this.progress.restaurant as { tipsAt?: number }).tipsAt ?? Date.now()) + this.jarHours() * 3_600_000;
    void scheduleAt(2, 'Your tip jar is full! 💰', `${this.progress.avatar.name}, your guests left ${Math.floor(this.jarHours() * this.tipsPerHour())} coins in tips.`, new Date(at));
  },

  /** True when any area upgrade is affordable right now. */
  restaurantUpgradeReady(this: Game): boolean {
    const p = this.progress;
    const rs = p.restaurant;
    return rs.levels.some((lv) => lv < AREA_MAX && p.starPool >= areaCost(this.restTier, lv + 1));
  },

  /** One line that sells a visit: the critic, tips waiting, an upgrade to buy, or the hourly rate. */
  restaurantPitch(this: Game): { text: string; hot: boolean } {
    const tips = this.restaurantTips();
    const ready = this.restaurantUpgradeReady();
    if (criticToday() && !this.guideStep() && this.rest.critic.day !== dayKey()) return { text: '🧐 The Food Critic is visiting today!', hot: true };
    const d = this.diner;
    if (d.lastWeek && d.reportSeen !== d.lastWeek.key) return { text: '📊 Your weekly report and reward are ready!', hot: true };
    const rush = this.rushOn();
    if (rush) return { text: `🔥 ${rush.name}: double tips for ${this.dur(rush.end - Date.now())}!`, hot: true };
    if (this.goldenDue() && this.progress.restaurant.levels[0]) return { text: '✨ A golden guest is waiting at the counter!', hot: true };
    const plated = d.burners.find((b) => b && Date.now() >= b.ready);
    if (plated) return { text: `🍳 ${plated.recipe} is ready to plate!`, hot: true };
    if (this.goalsDone() && !this.goalsToday().claimed) return { text: '🎯 Your goal chest is ready to open!', hot: true };
    if (this.expansionReady()) return { text: `🔨 ${EXPANSIONS[d.expansions].name} is ready to build!`, hot: true };
    if (ready && tips >= 20) return { text: `Upgrade ready + 💰 ${tips} tips!`, hot: true };
    if (ready) return { text: 'Upgrade ready! Make it shine ✨', hot: true };
    if (tips >= 20) return { text: `💰 ${tips} tips waiting`, hot: true };
    if (d.requests.length && this.knownDishes().some((r) => d.requests.some((q) => q.recipe === r.name) && canAfford(d.pantry, dishCost(r.pattern)))) return { text: `📋 ${d.requests.length} guest${d.requests.length > 1 ? 's' : ''} asked for dishes you can cook`, hot: true };
    if (this.rest.menu.day !== dayKey()) return { text: 'Pick today’s menu for +20% tips', hot: true };
    return { text: `${this.tipsPerHour()} tips/hour · ${this.dreamPct()}% to your dream restaurant`, hot: false };
  },

  /** Daily help from the apprentice, given when the restaurant is visited. */
  apprenticeGift(this: Game): void {
    const lv = this.staffLv('apprentice');
    if (!lv || this.rest.apprenticeDay === dayKey()) return;
    this.rest.apprenticeDay = dayKey();
    const n = lv >= 3 ? 2 : 1;
    const got: string[] = [];
    for (let i = 0; i < n; i++) {
      const b = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
      this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
      got.push(b.name);
    }
    save.setBoosters(this.boosters);
    const coins = [0, 0, 20, 50][lv];
    if (coins) this.bankCoins(coins);
    this.progress.persist();
    this.showToast(`👦 Kei prepared: ${got.join(' + ')}${coins ? ` and ${coins} coins` : ''}`);
  },

  restFloat(this: Game, text: string, x: number, y: number): void {
    this.restFx.push({ text, x, y, t: 0 });
  },

  /** Guests at the counter: more seats with upgrades, the greeter and expansions; the critic on critic days. */
  sceneGuests(this: Game): SceneGuest[] {
    const rs = this.progress.restaurant;
    if (!rs.levels[0]) return [];
    const done = rs.levels.reduce((a, b) => a + b, 0);
    const extra = EXPANSIONS.slice(0, this.diner.expansions).reduce((a, e) => a + e.seats, 0);
    const seats = Math.min(7, Math.min(3, 1 + Math.floor(done / 4)) + [0, 1, 1, 2][this.staffLv('greeter')] + extra);
    const now = Date.now();
    const rush = !!this.rushOn();
    const d = this.diner;
    const guests: SceneGuest[] = [];
    // The golden guest takes the first seat as soon as they arrive.
    if (this.goldenDue() && this.seatGuests[0]?.kind !== 'golden') {
      this.seatGuests[0] = null;
      this.guestReady[0] = now + 1500;
    }
    for (let i = 0; i < seats; i++) {
      if (this.guestReady[i] === undefined) this.guestReady[i] = now + 2000 + Math.random() * (rush ? 4000 : 12000);
      const cur = this.seatGuests[i];
      if (cur?.kind === 'request' && !d.requests.some((q) => q.recipe === cur.req)) this.seatGuests[i] = null;
      if (cur?.kind === 'golden' && !this.goldenDue()) this.seatGuests[i] = null;
      const sg = (this.seatGuests[i] ??= this.newSeatGuest(i));
      guests.push({ emoji: sg.emoji, hungry: now >= this.guestReady[i], want: sg.kind === 'request' ? DISH_EMOJI[sg.req!] ?? '🍣' : undefined, golden: sg.kind === 'golden', chef: sg.kind === 'chef' ? chefFor(sg.lv!) : undefined });
    }
    if (criticToday() && !this.guideStep() && this.rest.critic.day !== dayKey() && guests.length) guests[guests.length - 1] = { emoji: '🧐', hungry: true, critic: true };
    return guests;
  },

  startCritic(this: Game): void {
    if (this.rest.critic.day === dayKey()) {
      this.showToast('The critic already wrote today’s review. Come back on another critic day!');
      return;
    }
    this.coach('THE FOOD CRITIC', 'One long order with a small PERFECT zone. Serve it with 2★ or better for a glowing review.', 5);
    this.startRun(this.progress.playLevel, 'critic');
  },

  /** Critic result: 2+ stars is a glowing review (popularity, coins, decor unlocks). */
  criticResult(this: Game, stars: number): void {
    const r = this.rest;
    if (stars >= 2) {
      r.critic = { day: dayKey(), done: true };
      r.reviews++;
      this.bankCoins(300);
      this.celebrate('⭐ GLOWING REVIEW!', `Review ${r.reviews} · +300 coins · popularity and tips go up`);
      track('critic', { won: true, reviews: r.reviews });
    } else {
      this.showToast('🧐 “Hmm. Not yet.” Try again: 2★ or better impresses the critic.');
      track('critic', { won: false });
    }
    this.progress.persist();
  },

  styleOwned(this: Game, area: AreaId, i: number): boolean {
    const st = STYLES[area][i];
    if (!st.unlock) return true;
    if ('critic' in st.unlock) return this.rest.reviews >= st.unlock.critic;
    if ('pass' in st.unlock) return this.restPass;
    return this.rest.ownedStyles.includes(`${area}:${i}`);
  },

  tapStyle(this: Game, area: AreaId, i: number): void {
    const st = STYLES[area][i];
    if (!this.styleOwned(area, i)) {
      if (st.unlock && 'coins' in st.unlock) {
        if (this.bank < st.unlock.coins) return this.showToast(`You need ${st.unlock.coins - this.bank} more coins`);
        this.bank -= st.unlock.coins;
        save.setCoins(this.bank);
        this.rest.ownedStyles.push(`${area}:${i}`);
        sfx.coin();
      } else if (st.unlock && 'pass' in st.unlock) {
        return this.buy('restpass');
      } else return this.showToast(`Unlocks with ${styleText(st.unlock)} (you have ${this.rest.reviews})`);
    }
    this.rest.styles[area] = i;
    this.upgradeFx = { i: AREAS.findIndex((a) => a.id === area), t: 0 };
    this.progress.persist();
    track('decor', { area, style: i });
  },

  hireStaff(this: Game, id: StaffId): void {
    const s = STAFF.find((x) => x.id === id)!;
    const lv = this.staffLv(id);
    if (lv >= 3) return;
    const cost = s.costs[lv];
    if (this.bank < cost) return this.showToast(`You need ${cost - this.bank} more coins`);
    this.bank -= cost;
    save.setCoins(this.bank);
    this.rest.staff[id] = lv + 1;
    this.progress.persist();
    this.celebrate(`${s.emoji} ${s.name.toUpperCase()}${lv ? ` LV ${lv + 1}` : ' HIRED!'}`, s.perks[lv], 1.8);
    haptic.success();
    track('staff', { id, level: lv + 1 });
    if (id === 'apprentice') this.apprenticeGift();
  },

  setMenu(this: Game, recipe: string): void {
    const fresh = this.rest.menu.day !== dayKey();
    this.rest.menu = { day: dayKey(), recipe };
    this.progress.persist();
    this.showToast(fresh ? `Today’s special: ${recipe}! +20% tips today` : `Menu changed to ${recipe}`);
    track('menu', { recipe });
  },

  tapTheme(this: Game, th: RestTheme): void {
    const r = this.rest;
    if (!r.ownedThemes.includes(th.id)) {
      if (th.id === 'imperial') return this.restPass ? this.equipTheme(th) : this.buy('restpass');
      if (themeInSeason(th)) {
        r.ownedThemes.push(th.id);
        this.celebrate(`${th.icon} ${th.name.toUpperCase()}`, 'Seasonal theme claimed for free. It’s yours to keep!');
      } else {
        if (this.bank < th.price) return this.showToast(`You need ${th.price - this.bank} more coins (or claim it free in season)`);
        this.bank -= th.price;
        save.setCoins(this.bank);
        r.ownedThemes.push(th.id);
      }
    }
    this.equipTheme(th);
  },

  equipTheme(this: Game, th: RestTheme): void {
    this.rest.theme = th.id;
    this.progress.persist();
    track('theme', { id: th.id });
  },

  myRestCode(this: Game): string {
    const p = this.progress;
    const a = p.avatar;
    return encodeRestaurant({ n: a.name, r: p.restaurant.r, m: p.restaurant.michelin, l: p.restaurant.levels, s: stylesArray(this.rest), t: this.rest.theme, a: [a.skin, a.hair, a.hairColor, a.hat, a.outfit, a.accent, a.face] });
  },

  shareRestaurant(this: Game): void {
    const code = this.myRestCode();
    const text = `Come visit my sushi restaurant in Sushi Stack! Enter this code under Friend code: ${code}`;
    track('restaurant_share');
    if (navigator.share) void navigator.share({ title: 'Sushi Stack', text }).catch(() => this.copy(code, 'Restaurant code copied!'));
    else this.copy(code, 'Restaurant code copied!');
  },

  openVisit(this: Game, c: RestCode): void {
    this.visit = c;
    this.openScreen('visit', this.mode === 'restaurant' ? 'restaurant' : 'title');
    track('restaurant_visit');
  },

  heartVisit(this: Game): void {
    const v = this.visit!;
    const r = this.rest;
    if (r.visited.day !== dayKey()) r.visited = { day: dayKey(), codes: [] };
    const key = `${v.n}|${v.l.join('')}`;
    if (r.visited.codes.includes(key)) return this.showToast('You already left a ❤️ here today');
    if (r.visited.codes.length >= 5) return this.showToast('That’s 5 visits today. Come back tomorrow!');
    r.visited.codes.push(key);
    this.bankCoins(25);
    this.progress.persist();
    this.celebrate('❤️ LEFT A HEART!', '+25 coins for visiting. (Your friend’s reward needs online accounts, coming later.)', 1.8);
  },

  drawVisit(this: Game): void {
    const v = this.visit;
    if (!v) {
      this.mode = 'title';
      return;
    }
    const R = RESTAURANTS[Math.min(v.r, RESTAURANTS.length - 1)];
    const f = this.screenBegin(`${v.n}’s ${R.name}`, `Visiting a friend · ${v.l.reduce((a, b) => a + b, 0)}/24 upgrades${v.m ? ` · ${'⭐'.repeat(Math.min(3, v.m))}` : ''}`);
    let y = f.y0 + 4;
    const o = AVATAR_OPTIONS;
    const chef = avatarChef({ name: v.n, skin: v.a[0] % o.skin.length, hair: v.a[1] % o.hair.length, hairColor: v.a[2] % o.hairColor.length, hat: v.a[3] % o.hat.length, outfit: v.a[4] % o.outfit.length, accent: v.a[5] % o.accent.length, face: v.a[6] % o.face.length });
    drawRestaurantScene(this.ctx, {
      x: 16, y, w: WORLD_W - 32, h: 300, time: this.time, levels: v.l, styles: v.s, theme: themeById(v.t),
      staff: { waiter: 1, dishwasher: 0, greeter: 1, apprentice: 0 },
      guests: v.l[0] ? ['🧑', '👩', '👴'].map((e) => ({ emoji: e, hungry: false })) : [], chef, tips: 0, menu: '', name: v.n, hour: new Date().getHours(),
    });
    y += 312;
    this.pill(16, y, WORLD_W - 32, '❤️ LEAVE A HEART (+25 COINS)', f, () => this.heartVisit(), 'gold');
    y += 44;
    this.pill(16, y, WORLD_W - 32, 'SHARE MY RESTAURANT', f, () => this.shareRestaurant(), 'quiet');
    y += 44;
    this.screenEnd(f, y - f.y0);
  },

  dur(this: Game, ms: number): string {
    const s = Math.max(0, Math.ceil(ms / 1000));
    if (s < 60) return `${s}s`;
    const m = Math.ceil(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h}h ${m % 60}m`;
    return `${Math.floor(h / 24)}d ${h % 24}h`;
  },

  ago(this: Game, at: number): string {
    const m = Math.floor((Date.now() - at) / 60_000);
    return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
  },

  /** Opens a restaurant tab and scrolls down to it. */
  gotoTab(this: Game, tab: Game['restTab']): void {
    this.restTab = tab;
    this.pageScroll = this.restTabsY;
  },

  drawRestaurant(this: Game): void {
    const { ctx } = this;
    const p = this.progress;
    const rs = p.restaurant;
    const r = this.rest;
    const d = this.diner;
    const R = RESTAURANTS[Math.min(rs.r, RESTAURANTS.length - 1)];
    const done = rs.levels.reduce((a, b) => a + b, 0);
    this.apprenticeGift();
    const name = d.expansions >= 4 ? `${R.name} Flagship` : R.name;
    const f = this.screenBegin(rs.michelin ? `${name} ${'⭐'.repeat(Math.min(rs.michelin, 3))}` : name, `✪${this.ratingStars()} guide · ★ ${p.starPool} to spend · ${done}/${AREAS.length * AREA_MAX} upgrades`);
    let y = f.y0 + 4;

    // The dream restaurant: always show the finish line and the next step.
    y = this.drawDreamCard(f, y);

    // The room. Hungry guests can be tapped.
    const guests = this.sceneGuests();
    this.sceneBox = { x: 16, y, w: WORLD_W - 32, h: 300 };
    const tips = this.restaurantTips();
    const rush = this.rushOn();
    const menuRecipe = r.menu.day === dayKey() ? RECIPES.find((x) => x.name === r.menu.recipe) : undefined;
    const plated = Object.entries(d.display).flatMap(([n, k]) => Array<string>(Math.max(0, k)).fill(DISH_EMOJI[n] ?? '🍣'));
    const cooking = this.burnerList().filter((b) => b && Date.now() < b.ready).length;
    drawRestaurantScene(ctx, {
      ...this.sceneBox, time: this.time, levels: rs.levels, styles: stylesArray(r), theme: themeById(r.theme),
      staff: { waiter: this.staffLv('waiter'), dishwasher: this.staffLv('dishwasher'), greeter: this.staffLv('greeter'), apprentice: this.staffLv('apprentice') },
      guests, chef: avatarChef(p.avatar), tips, menu: menuRecipe ? DISH_EMOJI[menuRecipe.name] ?? '🍣' : '', name: R.name, hour: new Date().getHours(),
      rush: !!rush, expansions: d.expansions, dishes: plated, keepsakes: d.keepsakes, cooking, lite: this.lite,
    });
    this.drawUpgradeFx(this.sceneBox);
    guests.forEach((g, i) => {
      const sp = seatPos(this.sceneBox, i, guests.length);
      if (g.hungry) this.listTap(sp.x - 24, sp.y - 46, 48, 66, f, () => this.serveSeat(i, !!g.critic));
      if (g.hungry && !g.critic && !g.want) this.guideAt('serve', sp.x - 24, sp.y - 46, 48, 66);
      const lb = this.buttons[this.buttons.length - 1];
      if (g.hungry && lb) lb.label = g.critic ? 'Food critic' : g.golden ? 'Golden guest' : g.chef ? `Rival chef ${g.chef.name}` : g.want ? `Guest wants ${this.seatGuests[i]?.req}` : `Hungry guest ${i + 1}`;
    });
    // Floating rewards and a rival chef's comment over the room.
    this.qaSkip = true;
    for (const fx of this.restFx) {
      ctx.globalAlpha = Math.max(0, 1 - fx.t / 1.2);
      this.text(fx.text, fx.x, (fx.y || this.sceneBox.y + 200) - fx.t * 40, 15, '#ffd34d', 700);
    }
    ctx.globalAlpha = 1;
    if (this.restSay) {
      ctx.globalAlpha = Math.min(1, this.restSay.t * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      this.roundRect(26, this.sceneBox.y + 132, WORLD_W - 52, 28, 14);
      ctx.fill();
      this.fitText(this.restSay.text, WORLD_W / 2, this.sceneBox.y + 146, WORLD_W - 70, 11.5, '#3a1d12', 'center', 700);
      ctx.globalAlpha = 1;
    }
    this.qaSkip = false;
    const hungry = guests.some((g) => g.hungry && !g.critic);
    if (hungry) this.text(plated.length || guests.some((g) => g.golden || g.chef) ? 'Tap a guest to serve them' : 'Guests are hungry! Cook dishes in the kitchen ↓', WORLD_W / 2, y + 290, 10.5, 'rgba(255,255,255,0.85)', 700);
    y += 310;

    // The critic.
    if (criticToday() && !this.guideStep() && r.critic.day !== dayKey()) {
      this.card(16, y, WORLD_W - 32, 66, 'rgba(70,20,60,0.95)');
      this.text('🧐', 44, y + 33, 26, '#fff', 400);
      this.text('THE FOOD CRITIC IS HERE!', 70, y + 20, 13, '#ffd34d', 700, 'left');
      this.fitText(`One tough order · 2★ = review ${r.reviews + 1}, +300 coins`, 70, y + 42, 170, 10.5, 'rgba(255,255,255,0.8)', 'left');
      this.pill(WORLD_W - 112, y + 17, 82, 'COOK!', f, () => this.startCritic(), 'gold');
      y += 74;
    }

    // Rush Hour.
    if (rush) y = this.drawRushCard(y, rush);

    // Popularity and the tip jar.
    const rate = this.tipsPerHour();
    const cap = rate * this.jarHours();
    this.card(16, y, WORLD_W - 32, 92, 'rgba(60,35,20,0.95)');
    this.text('POPULARITY', 32, y + 18, 11, 'rgba(255,255,255,0.7)', 700, 'left');
    for (let k = 0; k < 5; k++) this.text('★', 32 + k * 19, y + 40, 19, k < this.popularity() ? '#ffd34d' : 'rgba(255,255,255,0.2)', 700, 'left');
    this.text(`${rate} tips per hour`, 32, y + 64, 12, '#ffe2c6', 700, 'left');
    this.fitText(`jar holds ${this.jarHours()}h · 2× in Rush Hour`, 32, y + 80, 136, 10, 'rgba(255,255,255,0.55)', 'left', 600);
    const jx = 172;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    this.roundRect(jx, y + 14, 34, 64, 10);
    ctx.fill();
    const fill = Math.min(1, tips / Math.max(1, cap));
    ctx.fillStyle = '#ffd34d';
    this.roundRect(jx + 3, y + 75 - 58 * fill, 28, 58 * fill, 7);
    ctx.fill();
    this.text('💰', jx + 17, y + 46, 16, '#fff', 400);
    this.pill(WORLD_W - 158, y + 30, 126, tips > 0 ? `COLLECT ${tips}` : 'JAR EMPTY', f, () => this.collectTips(), tips > 0 ? 'gold' : 'quiet');
    y += 100;

    y = this.drawKitchenCard(f, y);
    y = this.drawOrderBoard(f, y);
    y = this.drawGoalsCard(f, y);
    const fest = festivalNow();
    if (fest) y = this.drawFestCard(f, y, fest);

    // Restaurant Pass.
    this.card(16, y, WORLD_W - 32, 56, 'rgba(80,60,10,0.95)');
    this.text('👑', 40, y + 28, 22, '#fff', 400);
    if (this.restPass) {
      this.text('RESTAURANT PASS ACTIVE', 64, y + 20, 12.5, '#ffd34d', 700, 'left');
      this.text(`${Math.ceil((r.passUntil - Date.now()) / 86_400_000)} days left · +50% tips · +4h jar · gold decor`, 64, y + 38, 10, 'rgba(255,255,255,0.8)', 600, 'left');
    } else {
      this.text('RESTAURANT PASS', 64, y + 20, 12.5, '#ffd34d', 700, 'left');
      this.fitText('+50% tips · +4h jar · Imperial theme · 4 gold styles', 64, y + 38, 190, 10, 'rgba(255,255,255,0.8)', 'left');
      this.pill(WORLD_W - 104, y + 12, 76, PRODUCTS.restpass.price.split(' ')[0], f, () => this.buy('restpass'), 'gold');
    }
    y += 64;

    // Tabs, three rows of five, with a dot where something needs you.
    this.restTabsY = y - f.y0 - 8;
    if (this.guideStep() === 'build') this.restTab = 'build';
    const tabs: [Game['restTab'], string, boolean][] = [
      ['build', 'BUILD', this.restaurantUpgradeReady()], ['kitchen', 'KITCHEN', this.burnerList().some((b) => !b || Date.now() >= b.ready)], ['menu', 'MENU', r.menu.day !== dayKey()],
      ['staff', 'STAFF', false], ['decor', 'DECOR', false], ['themes', 'THEMES', false], ['expand', 'EXPAND', this.expansionReady()],
      ['street', 'STREET', LOTS.some((l) => !this.hasLot(l.id) && this.bank >= l.cost)], ['shelf', 'SHELF', false], ['guests', 'GUESTS', false],
      ['reviews', 'REVIEWS', false], ['rival', 'RIVAL', false], ['trucks', '🚚 TRUCKS', false],
    ];
    if (fest) tabs.push(['fest', `${fest.f.icon} FEST`, FEST_COSTS.some((c, i) => !d.fest.items.includes(i) && d.fest.key === fest.key && d.fest.tokens >= c)]);
    if (this.restTab === 'fest' && !fest) this.restTab = 'build';
    const tw = (WORLD_W - 32 - 4 * 5) / 5;
    tabs.forEach(([id, label, alert], i) => {
      const tx = 16 + (i % 5) * (tw + 5);
      const ty = y + Math.floor(i / 5) * 38;
      this.pill(tx, ty, tw, label, f, () => { this.restTab = id; this.kitchenPick = null; }, this.restTab === id ? 'primary' : 'quiet');
      if (alert) this.dot(tx + tw - 5, ty + 4, 4.5, '#ff4d6d');
    });
    y += Math.ceil(tabs.length / 5) * 38 + 8;
    switch (this.restTab) {
      case 'build': y = this.drawRestBuild(f, y); break;
      case 'kitchen': y = this.drawRestKitchen(f, y); break;
      case 'decor': y = this.drawRestDecor(f, y); break;
      case 'staff': y = this.drawRestStaff(f, y); break;
      case 'menu': y = this.drawRestMenu(f, y); break;
      case 'themes': y = this.drawRestThemes(f, y); break;
      case 'expand': y = this.drawRestExpand(f, y); break;
      case 'street': y = this.drawRestStreet(f, y); break;
      case 'shelf': y = this.drawRestShelf(y); break;
      case 'guests': y = this.drawRestGuests(y); break;
      case 'reviews': y = this.drawRestReviews(y); break;
      case 'rival': y = this.drawRestRival(f, y); break;
      case 'fest': y = this.drawRestFest(f, y); break;
      case 'trucks': y = this.drawRestBranches(f, y); break;
    }

    // Friends.
    y += 4;
    this.pill(16, y, (WORLD_W - 40) / 2, '📤 SHARE MINE', f, () => this.shareRestaurant(), 'quiet');
    this.pill(24 + (WORLD_W - 40) / 2, y, (WORLD_W - 40) / 2, '🏠 VISIT A FRIEND', f, () => this.openCodeInput('friend'), 'quiet');
    y += 44;
    this.screenEnd(f, y - f.y0);
  },

  drawDreamCard(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const pct = this.dreamPct();
    this.card(16, y, WORLD_W - 32, 58, 'rgba(70,40,90,0.95)');
    this.drawFlagship(24, y + 7, 64, 44, pct, 0.6);
    this.text('DREAM RESTAURANT', 98, y + 15, 10.5, 'rgba(255,255,255,0.7)', 700, 'left');
    this.text(`${pct}%`, WORLD_W - 30, y + 16, 15, '#ffd34d', 700, 'right');
    this.bar(98, y + 26, WORLD_W - 130, pct / 100, '#ffd34d', 7);
    this.fitText(`Next: ${this.dreamNext()}`, 98, y + 46, WORLD_W - 130, 10.5, '#fff', 'left', 600);
    this.listTap(16, y, WORLD_W - 32, 58, f, () => this.gotoTab('expand'));
    const lb = this.buttons[this.buttons.length - 1];
    if (lb) lb.label = `Dream restaurant ${pct}%. Open expansions`;
    return y + 66;
  },

  /** A little painting of the finished flagship; the part you've earned is in colour. */
  drawFlagship(this: Game, x: number, y: number, w: number, h: number, pct: number, alpha = 1): void {
    const { ctx } = this;
    const paint = (color: boolean) => {
      const sky = ctx.createLinearGradient(0, y, 0, y + h);
      sky.addColorStop(0, color ? '#ff9e7a' : '#4a4458');
      sky.addColorStop(1, color ? '#ffd6a5' : '#5c566a');
      ctx.fillStyle = sky;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = color ? '#6a994e' : '#3c3a44';
      ctx.fillRect(x, y + h * 0.86, w, h * 0.14);
      const cx = x + w / 2;
      const floors = 3;
      for (let i = 0; i < floors; i++) {
        const fw = w * (0.62 - i * 0.14);
        const fy = y + h * 0.86 - (i + 1) * h * 0.22;
        ctx.fillStyle = color ? ['#c1121f', '#d62828', '#e85d04'][i] : '#2c2a34';
        ctx.fillRect(cx - fw / 2, fy, fw, h * 0.2);
        ctx.fillStyle = color ? '#3a2414' : '#1c1a22';
        ctx.beginPath();
        ctx.moveTo(cx - fw / 2 - w * 0.08, fy + 2);
        ctx.lineTo(cx, fy - h * 0.1);
        ctx.lineTo(cx + fw / 2 + w * 0.08, fy + 2);
        ctx.fill();
        if (color) {
          ctx.fillStyle = '#ffd34d';
          for (let k = 0; k < 3; k++) ctx.fillRect(cx - fw / 2 + 3 + k * (fw / 3), fy + h * 0.07, Math.max(2, fw / 6), h * 0.07);
        }
      }
      ctx.fillStyle = color ? '#ffd34d' : '#2c2a34';
      ctx.beginPath();
      ctx.arc(cx, y + h * 0.86 - floors * h * 0.22 - h * 0.12, Math.max(2, w * 0.035), 0, Math.PI * 2);
      ctx.fill();
    };
    ctx.save();
    ctx.globalAlpha = alpha;
    this.roundRect(x, y, w, h, 8);
    ctx.clip();
    paint(false);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(x, y, (w * pct) / 100, h);
    ctx.clip();
    paint(true);
    ctx.restore();
  },

  drawRushCard(this: Game, y: number, rush: { name: string; end: number }): number {
    const d = this.diner;
    const n = d.rush.day === dayKey() ? d.rush.n : 0;
    const next = RUSH_CHESTS.find((c) => n < c.at);
    this.card(16, y, WORLD_W - 32, 66, `rgba(${150 + Math.round(30 * Math.sin(this.time * 4))},50,20,0.95)`);
    this.text('🔥', 42, y + 33, 26, '#fff', 400);
    this.text(`${rush.name.toUpperCase()} · 2× TIPS`, 68, y + 18, 13, '#fff', 700, 'left');
    this.text(`${this.dur(rush.end - Date.now())} left`, WORLD_W - 30, y + 18, 11, '#ffd34d', 700, 'right');
    this.fitText(next ? `${n} served · rush chest at ${next.at}${next.piece ? ' (rare tableware!)' : ''}` : `${n} served · all rush chests opened!`, 68, y + 36, WORLD_W - 110, 10.5, 'rgba(255,255,255,0.85)', 'left', 600);
    const prev = [...RUSH_CHESTS].reverse().find((c) => n >= c.at)?.at ?? 0;
    this.bar(68, y + 48, WORLD_W - 110, next ? (n - prev) / (next.at - prev) : 1, '#ffd34d', 7);
    return y + 74;
  },

  drawKitchenCard(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const { ctx } = this;
    const d = this.diner;
    const now = Date.now();
    const h = 122;
    this.card(16, y, WORLD_W - 32, h, 'rgba(36,40,62,0.96)');
    this.text('🍳 KITCHEN', 30, y + 18, 13, '#fff', 700, 'left');
    this.text(`🍽️ ${this.displayCount()}/${this.displayCap()} plated`, WORLD_W - 30, y + 18, 11, this.displayCount() >= this.displayCap() ? '#ffb4a2' : '#9fe3ff', 700, 'right');
    const list = this.burnerList();
    list.forEach((b, i) => {
      const cx = 56 + i * 82;
      const cy = y + 62;
      const ready = !!b && now >= b.ready;
      if (!b) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        const last = d.lastDish[i];
        this.text(last ? DISH_EMOJI[last] ?? '🍣' : '+', cx, cy + 1, last ? 18 : 22, last ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.6)', 700);
        this.text(last ? 'AGAIN' : 'COOK', cx, cy + 38, 10, '#ffd34d', 700);
        const lr = last ? RECIPES.find((x) => x.name === last) : undefined;
        if (i === 0) this.guideAt('cook', cx - 32, cy - 30, 64, 76);
        this.listTap(cx - 32, cy - 30, 64, 76, f, () => {
          // During the first day, one tap cooks the first dish the pantry allows.
          const first = this.guideStep() === 'cook' ? this.knownDishes().find((r) => canAfford(d.pantry, dishCost(r.pattern))) : undefined;
          if (first) this.cook(i, first);
          else if (lr && canAfford(d.pantry, dishCost(lr.pattern))) this.cook(i, lr);
          else {
            this.kitchenPick = i;
            this.gotoTab('kitchen');
          }
        });
        const lb = this.buttons[this.buttons.length - 1];
        if (lb) lb.label = last ? `Burner ${i + 1}: cook ${last} again` : `Burner ${i + 1}: cook a dish`;
      } else {
        const frac = Math.min(1, (now - b.start) / Math.max(1, b.ready - b.start));
        if (ready) {
          const pulse = 1 + 0.06 * Math.sin(this.time * 6);
          this.dot(cx, cy, 25 * pulse, 'rgba(255,211,77,0.3)');
        } else this.dot(cx, cy, 24, 'rgba(255,255,255,0.08)');
        ctx.strokeStyle = ready ? '#ffd34d' : '#ff8a5b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
        this.text(DISH_EMOJI[b.recipe] ?? '🍣', cx, cy + 1 + (ready ? Math.sin(this.time * 5) * 2 : 0), 20, '#fff', 400);
        this.text(ready ? 'READY!' : this.dur(b.ready - now), cx, cy + 38, 10, ready ? '#8fdc93' : 'rgba(255,255,255,0.75)', 700);
        if (ready) {
          this.guideAt('plate', cx - 32, cy - 30, 64, 76);
          this.listTap(cx - 32, cy - 30, 64, 76, f, () => this.plate(i));
          const lb = this.buttons[this.buttons.length - 1];
          if (lb) lb.label = `Plate ${b.recipe}`;
        }
      }
    });
    // The glass display case with plated dishes, when there's room beside the burners.
    const caseX = 56 + (list.length - 1) * 82 + 50;
    const caseW = WORLD_W - 30 - caseX;
    if (caseW >= 90) {
      const g = ctx.createLinearGradient(0, y + 32, 0, y + 94);
      g.addColorStop(0, 'rgba(180,220,255,0.18)');
      g.addColorStop(1, 'rgba(180,220,255,0.06)');
      ctx.fillStyle = g;
      this.roundRect(caseX, y + 32, caseW, 62, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,230,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(caseX + 6, y + 62, caseW - 12, 2);
      const dishes = Object.entries(d.display).flatMap(([n, k]) => Array<string>(Math.max(0, k)).fill(DISH_EMOJI[n] ?? '🍣'));
      const cols = Math.max(1, Math.floor((caseW - 12) / 22));
      if (!dishes.length) this.text('display case empty', caseX + caseW / 2, y + 63, 9.5, 'rgba(255,255,255,0.5)', 600);
      dishes.slice(0, cols * 2).forEach((e, k) => this.text(e, caseX + 17 + (k % cols) * 22, y + 50 + Math.floor(k / cols) * 28, 15, '#fff', 400));
    }
    // Pantry summary: how many dishes you could cook right now.
    const cookable = this.knownDishes().filter((r) => canAfford(d.pantry, dishCost(r.pattern))).length;
    const stock = Object.values(d.pantry).reduce((a, b) => a + (b ?? 0), 0);
    this.fitText(`🧺 Pantry ${stock} · ${cookable} dish${cookable === 1 ? '' : 'es'} ready to cook · runs restock it ›`, WORLD_W / 2, y + h - 10, WORLD_W - 52, 10.5, 'rgba(255,255,255,0.75)', 'center', 600);
    this.listTap(16, y + h - 22, WORLD_W - 32, 22, f, () => this.gotoTab('kitchen'));
    const lb = this.buttons[this.buttons.length - 1];
    if (lb) lb.label = 'Open the kitchen and pantry';
    return y + h + 8;
  },

  /** Serve a request straight from the order board when the dish is plated. */
  serveRequestNow(this: Game, i: number): void {
    const d = this.diner;
    const rq = d.requests[i];
    if (!rq || !(d.display[rq.recipe] > 0)) return;
    this.recordSold(rq.recipe);
    const coins = this.fillRequest(i);
    this.restFloat(`+${coins} 🪙 ❤️❤️`, WORLD_W / 2, this.sceneBox.y + 200);
    sfx.serve();
    haptic.success();
    this.progress.persist();
  },

  drawOrderBoard(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const d = this.diner;
    this.refillRequests();
    const rows = Math.max(1, d.requests.length);
    const h = 36 + rows * 48;
    this.card(16, y, WORLD_W - 32, h, 'rgba(58,44,28,0.96)');
    this.text('📋 ORDER BOARD', 30, y + 18, 13, '#fff', 700, 'left');
    const wait = REQUEST_EVERY - (Date.now() - d.reqAt);
    this.text(d.requests.length >= REQUESTS_MAX ? 'board full' : `next guest in ${this.dur(wait)}`, WORLD_W - 30, y + 18, 10.5, 'rgba(255,255,255,0.6)', 600, 'right');
    if (!d.requests.length) {
      this.text('No requests right now. Guests post new ones every 20 minutes.', WORLD_W / 2, y + 58, 10.5, 'rgba(255,255,255,0.7)', 600);
      return y + h + 8;
    }
    d.requests.forEach((rq, i) => {
      const ry = y + 34 + i * 48;
      const rec = RECIPES.find((x) => x.name === rq.recipe);
      const reg = REGULARS[rq.who];
      this.ctx.fillStyle = 'rgba(255,255,255,0.06)';
      this.roundRect(26, ry, WORLD_W - 52, 42, 10);
      this.ctx.fill();
      this.text(reg?.emoji ?? '🙂', 46, ry + 21, 20, '#fff', 400);
      this.fitText(`${reg?.name ?? 'A guest'} wants`, 66, ry + 13, 150, 10, 'rgba(255,255,255,0.65)', 'left', 600);
      this.fitText(`${DISH_EMOJI[rq.recipe] ?? '🍣'} ${rq.recipe}`, 66, ry + 29, 150, 12.5, '#fff', 'left', 700);
      const pay = rec ? Math.round(this.priceOf(rec) * 2 * (this.hasLot('tea') ? 1.1 : 1)) : 0;
      this.text(`+${pay}🪙 ❤️❤️`, WORLD_W - 118, ry + 13, 10, '#ffd34d', 700, 'right');
      if (d.display[rq.recipe] > 0) this.pill(WORLD_W - 112, ry + 6, 78, 'SERVE', f, () => this.serveRequestNow(i), 'gold');
      else if (rec && canAfford(d.pantry, dishCost(rec.pattern))) {
        this.pill(WORLD_W - 112, ry + 6, 78, 'COOK', f, () => {
          const free = this.burnerList().findIndex((b) => !b);
          if (free >= 0) this.cook(free, rec);
          else this.showToast('All burners are busy. Plate a dish or add a burner in the Kitchen!');
        }, 'primary');
      } else this.fitText('or serve it in a run', WORLD_W - 118, ry + 29, 100, 9.5, 'rgba(255,255,255,0.55)', 'right', 600);
    });
    return y + h + 8;
  },

  drawGoalsCard(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const g = this.goalsToday();
    const h = 40 + g.ids.length * 24 + 38;
    this.card(16, y, WORLD_W - 32, h, 'rgba(30,58,48,0.96)');
    this.text('🎯 TODAY’S GOALS', 30, y + 18, 13, '#fff', 700, 'left');
    this.text(g.claimed ? 'chest opened ✓' : `${g.ids.filter((k) => (g.prog[k] ?? 0) >= GOALS[k].n).length}/${g.ids.length}`, WORLD_W - 30, y + 18, 11, g.claimed ? '#8fdc93' : '#ffd34d', 700, 'right');
    g.ids.forEach((id, i) => {
      const gy = y + 42 + i * 24;
      const have = g.prog[id] ?? 0;
      const need = GOALS[id].n;
      const ok = have >= need;
      this.text(ok ? '✓' : '○', 34, gy, 13, ok ? '#8fdc93' : 'rgba(255,255,255,0.5)', 700, 'left');
      this.fitText(GOALS[id].text(need), 54, gy, 200, 11.5, ok ? 'rgba(255,255,255,0.6)' : '#fff', 'left', 600);
      this.text(`${Math.min(have, need)}/${need}`, WORLD_W - 30, gy, 10.5, 'rgba(255,255,255,0.7)', 700, 'right');
      this.bar(WORLD_W - 108, gy - 3, 44, have / need, ok ? '#8fdc93' : '#ffd34d', 6);
    });
    const ready = this.goalsDone() && !g.claimed;
    this.pill(26, y + h - 38, WORLD_W - 52, g.claimed ? 'NEW GOALS TOMORROW' : ready ? `🎁 OPEN CHEST · ${GOAL_CHEST_COINS} COINS` : `🎁 CHEST · ${GOAL_CHEST_COINS} coins + surprise`, f, () => this.claimGoals(), ready ? 'gold' : 'quiet');
    return y + h + 8;
  },

  drawFestCard(this: Game, f: { areaTop: number; areaH: number }, y: number, fest: { f: { name: string; icon: string; color: string }; key: string; ends: number }): number {
    const d = this.diner;
    const mine = d.fest.key === fest.key;
    const items = mine ? d.fest.items.length : 0;
    this.card(16, y, WORLD_W - 32, 62, 'rgba(90,30,60,0.96)');
    this.text(fest.f.icon, 44, y + 31, 26, '#fff', 400);
    this.fitText(`${fest.f.name.toUpperCase()} STALL`, 70, y + 19, 190, 13, '#ffd34d', 'left', 700);
    this.fitText(`${mine ? d.fest.tokens : 0} ${fest.f.icon} tokens · ${items}/${FEST_COSTS.length} stall items · ends in ${this.dur(fest.ends - Date.now())}`, 70, y + 39, WORLD_W - 180, 10, 'rgba(255,255,255,0.8)', 'left', 600);
    this.pill(WORLD_W - 108, y + 15, 76, 'OPEN', f, () => this.gotoTab('fest'), 'gold');
    return y + 70;
  },

  ingChip(this: Game, k: Ingredient, x: number, y: number, label: string, ok: boolean): number {
    const { ctx } = this;
    ctx.font = `700 10px ${FONT}`;
    const w = ctx.measureText(label).width + 22;
    ctx.fillStyle = ok ? 'rgba(255,255,255,0.1)' : 'rgba(230,57,70,0.35)';
    this.roundRect(x, y - 8, w, 16, 8);
    ctx.fill();
    ctx.fillStyle = this.color(k);
    this.roundRect(x + 3, y - 5, 12, 10, 3);
    ctx.fill();
    this.text(label, x + 18, y + 0.5, 10, ok ? '#fff' : '#ffd6d6', 700, 'left');
    return w;
  },

  drawRestKitchen(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const d = this.diner;
    const now = Date.now();
    if (this.kitchenPick !== null) {
      const bi = this.kitchenPick;
      this.text(`Choose a dish for burner ${bi + 1}`, 18, y + 12, 14, '#fff', 700, 'left');
      this.pill(WORLD_W - 104, y - 2, 88, 'CANCEL', f, () => { this.kitchenPick = null; }, 'quiet');
      y += 36;
      const dishes = this.knownDishes().sort((a, b) => Number(canAfford(d.pantry, dishCost(b.pattern))) - Number(canAfford(d.pantry, dishCost(a.pattern))));
      for (const rec of dishes) {
        const cost = dishCost(rec.pattern);
        const can = canAfford(d.pantry, cost);
        const serves = this.dishServes(rec.name);
        this.card(16, y, WORLD_W - 32, 70, can ? 'rgba(48,40,30,0.96)' : 'rgba(40,28,44,0.9)');
        this.text(DISH_EMOJI[rec.name] ?? '🍣', 42, y + 26, 22, '#fff', 400);
        this.fitText(rec.name, 64, y + 16, 150, 13, '#fff', 'left', 700);
        this.text(`Lv ${dishLevel(serves)} · ${this.priceOf(rec)}🪙 · ${this.dur(cookMs(rec.pattern, this.upLv('stove')))}`, 64, y + 33, 10, '#ffd34d', 700, 'left');
        let cx = 26;
        for (const [k, n] of Object.entries(cost)) {
          const have = d.pantry[k as Ingredient] ?? 0;
          cx += this.ingChip(k as Ingredient, cx, y + 54, `${k} ${have}/${n}`, have >= (n ?? 0)) + 4;
          if (cx > WORLD_W - 70) break;
        }
        this.pill(WORLD_W - 98, y + 12, 70, 'COOK', f, () => this.cook(bi, rec), can ? 'gold' : 'quiet');
        y += 78;
      }
      return y;
    }

    // Burners.
    this.wrapLeft('Cook dishes from your pantry, plate them, then tap guests to sell them. Plated dishes ride the conveyor belt.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 30;
    const list = this.burnerList();
    if (list.some((b) => b && now >= b.ready)) {
      this.pill(16, y, WORLD_W - 32, '🍽️ PLATE ALL READY DISHES', f, () => this.plateAll(), 'gold');
      y += 42;
    }
    list.forEach((b, i) => {
      this.card(16, y, WORLD_W - 32, 54, 'rgba(36,40,62,0.96)');
      this.text('🔥', 38, y + 27, 18, '#fff', 400);
      if (!b) {
        this.text(`Burner ${i + 1} · free`, 58, y + 20, 12.5, '#fff', 700, 'left');
        this.text('Tap COOK to choose a dish', 58, y + 37, 10, 'rgba(255,255,255,0.6)', 600, 'left');
        const last = d.lastDish[i] ? RECIPES.find((x) => x.name === d.lastDish[i]) : undefined;
        if (last && canAfford(d.pantry, dishCost(last.pattern))) this.pill(WORLD_W - 188, y + 11, 82, `↻ ${DISH_EMOJI[last.name] ?? '🍣'} AGAIN`, f, () => this.cook(i, last), 'quiet');
        this.pill(WORLD_W - 100, y + 11, 74, 'COOK', f, () => { this.kitchenPick = i; }, 'gold');
      } else {
        const ready = now >= b.ready;
        this.fitText(`${DISH_EMOJI[b.recipe] ?? '🍣'} ${b.recipe}`, 58, y + 20, 170, 12.5, '#fff', 'left', 700);
        this.bar(58, y + 34, 150, Math.min(1, (now - b.start) / Math.max(1, b.ready - b.start)), ready ? '#8fdc93' : '#ff8a5b', 7);
        if (ready) this.pill(WORLD_W - 100, y + 11, 74, 'PLATE', f, () => this.plate(i), 'gold');
        else this.text(this.dur(b.ready - now), WORLD_W - 34, y + 27, 12, 'rgba(255,255,255,0.8)', 700, 'right');
      }
      y += 62;
    });

    // Pantry.
    y += 4;
    this.text('🧺 PANTRY', 18, y + 10, 14, '#fff', 700, 'left');
    this.text(`holds ${this.pantryCap()} of each · PERFECT stocks 2`, WORLD_W - 18, y + 10, 10, 'rgba(255,255,255,0.6)', 600, 'right');
    y += 26;
    const kinds = [...new Set(this.knownDishes().flatMap((r) => r.pattern))];
    const cw = (WORLD_W - 32 - 12) / 3;
    kinds.forEach((k, i) => {
      const x = 16 + (i % 3) * (cw + 6);
      const yy = y + Math.floor(i / 3) * 42;
      const n = d.pantry[k] ?? 0;
      this.card(x, yy, cw, 36, 'rgba(48,30,52,0.95)');
      this.ctx.fillStyle = this.color(k);
      this.roundRect(x + 8, yy + 8, 14, 20, 4);
      this.ctx.fill();
      this.fitText(k, x + 28, yy + 13, cw - 34, 10.5, '#fff', 'left', 700);
      this.text(`${n}/${this.pantryCap()}`, x + 28, yy + 26, 9.5, n ? '#ffd34d' : 'rgba(255,255,255,0.45)', 700, 'left');
      this.bar(x + 70, yy + 23, cw - 80, n / this.pantryCap(), '#9fe3ff', 5);
    });
    y += Math.ceil(kinds.length / 3) * 42 + 10;

    // Upgrades.
    this.text('🔧 KITCHEN UPGRADES', 18, y + 10, 14, '#fff', 700, 'left');
    y += 26;
    for (const u of UPGRADES) {
      const lv = this.upLv(u.id);
      this.card(16, y, WORLD_W - 32, 68, lv ? 'rgba(42,70,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.dot(46, y + 34, 21, 'rgba(255,255,255,0.08)');
      this.text(u.icon, 46, y + 35, 22, '#fff', 400);
      this.text(u.name, 76, y + 17, 13, '#fff', 700, 'left');
      if (u.run) {
        this.ctx.fillStyle = 'rgba(255,138,91,0.9)';
        this.roundRect(78 + this.ctx.measureText(u.name).width + 8, y + 9, 64, 15, 7);
        this.ctx.fill();
        this.text('RUN BOOST', 78 + this.ctx.measureText(u.name).width + 40, y + 17, 8.5, '#fff', 700);
      }
      for (let k = 0; k < 3; k++) this.dot(80 + k * 13, y + 33, 4, k < lv ? '#ffd34d' : 'rgba(255,255,255,0.2)');
      this.fitText(lv ? `Now: ${u.perks[lv - 1]}${lv < 3 ? ` · next: ${u.perks[lv]}` : ''}` : u.perks[0], 76, y + 52, WORLD_W - 210, 10, lv ? '#8fdc93' : 'rgba(255,255,255,0.75)', 'left', 600);
      if (lv >= 3) this.text('★ MAX', WORLD_W - 40, y + 34, 12, '#ffd34d', 700, 'right');
      else this.pill(WORLD_W - 122, y + 18, 92, `${Math.round(u.costs[lv] * cfg.costScale)} 🪙`, f, () => this.buyUpgrade(u.id), this.bank >= Math.round(u.costs[lv] * cfg.costScale) ? 'gold' : 'quiet');
      y += 76;
    }
    return y;
  },

  drawRestExpand(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const d = this.diner;
    const pct = this.dreamPct();
    this.card(16, y, WORLD_W - 32, 190, 'rgba(70,40,90,0.96)');
    this.drawFlagship(28, y + 12, WORLD_W - 56, 126, pct);
    this.text(`${pct}% of grandma’s dream`, WORLD_W / 2, y + 156, 15, '#ffd34d', 700);
    this.bar(40, y + 172, WORLD_W - 80, pct / 100, '#ffd34d', 8);
    y += 200;
    this.wrapLeft('Expansions, Sakura Street shops, guide stars, tableware sets, upgrades and dish levels all paint the dream in.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 32;
    EXPANSIONS.forEach((ex, i) => {
      const built = i < d.expansions;
      const current = i === d.expansions;
      const h = current ? 80 + ex.tasks.length * 22 + 44 : 62;
      this.card(16, y, WORLD_W - 32, h, built ? 'rgba(42,90,60,0.95)' : current ? 'rgba(70,50,20,0.96)' : 'rgba(40,28,44,0.9)');
      this.text(built || current ? ex.icon : '🔒', 44, y + 30, 24, '#fff', 400);
      this.text(`${i + 1}. ${ex.name}`, 70, y + 20, 14, '#fff', 700, 'left');
      this.fitText(ex.perk, 70, y + 40, WORLD_W - 170, 10.5, built ? '#8fdc93' : '#ffd34d', 'left', 600);
      if (built) this.text('✓ OPEN', WORLD_W - 32, y + 30, 12, '#8fdc93', 700, 'right');
      else if (!current) this.text('later', WORLD_W - 32, y + 30, 11, 'rgba(255,255,255,0.4)', 600, 'right');
      if (current) {
        this.wrapLeft(ex.story, 30, y + 60, WORLD_W - 60, 10, 'rgba(255,255,255,0.7)');
        ex.tasks.forEach((t, k) => {
          const ty = y + 96 + k * 22;
          const have = this.taskHave(t.kind);
          const ok = have >= t.n;
          this.text(ok ? '✓' : '○', 32, ty, 12, ok ? '#8fdc93' : 'rgba(255,255,255,0.5)', 700, 'left');
          this.fitText(taskText(t), 50, ty, WORLD_W - 170, 11, ok ? 'rgba(255,255,255,0.65)' : '#fff', 'left', 600);
          this.text(t.kind === 'coins' ? (ok ? 'ready' : `${Math.floor((have / t.n) * 100)}%`) : `${Math.min(have, t.n)}/${t.n}`, WORLD_W - 32, ty, 10.5, ok ? '#8fdc93' : 'rgba(255,255,255,0.7)', 700, 'right');
        });
        const ready = this.expansionReady();
        this.pill(26, y + h - 40, WORLD_W - 52, ready ? `🔨 BUILD THE ${ex.name.toUpperCase()}` : 'KEEP GOING!', f, () => this.buildExpansion(), ready ? 'gold' : 'quiet');
      }
      y += h + 8;
    });
    return y;
  },

  drawRestStreet(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const { ctx } = this;
    const R = RESTAURANTS[Math.min(this.progress.restaurant.r, RESTAURANTS.length - 1)];
    // The street panorama: your restaurant in the middle, three shops each side.
    const h = 168;
    ctx.save();
    this.roundRect(16, y, WORLD_W - 32, h, 14);
    ctx.clip();
    const hr = new Date().getHours();
    const night = hr < 6 || hr >= 19;
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, night ? '#14183a' : '#7fc8ff');
    sky.addColorStop(1, night ? '#3a2f6e' : '#ffe6c7');
    ctx.fillStyle = sky;
    ctx.fillRect(16, y, WORLD_W - 32, h);
    ctx.fillStyle = '#6b6b78';
    ctx.fillRect(16, y + h - 26, WORLD_W - 32, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 9; i++) ctx.fillRect(24 + i * 42, y + h - 14, 22, 3);
    const slots = [...LOTS.slice(0, 3), null, ...LOTS.slice(3)];
    const bw = (WORLD_W - 32 - 8) / 7;
    slots.forEach((lot, i) => {
      const bx = 20 + i * bw;
      const mine = !lot;
      const own = lot ? this.hasLot(lot.id) : true;
      const bh = mine ? 104 : 70 + ((i * 17) % 18);
      const by = y + h - 26 - bh;
      ctx.fillStyle = mine ? '#7a4e2a' : own ? lot!.color : 'rgba(110,105,120,0.9)';
      ctx.fillRect(bx + 2, by, bw - 4, bh);
      ctx.fillStyle = mine ? '#3a2414' : own ? lot!.roof : 'rgba(70,66,80,0.95)';
      ctx.beginPath();
      ctx.moveTo(bx - 2, by + 4);
      ctx.lineTo(bx + bw / 2, by - 14);
      ctx.lineTo(bx + bw + 2, by + 4);
      ctx.fill();
      if (own) {
        // Striped awning and a glowing window.
        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = k % 2 ? '#ffffff' : mine ? '#d7263d' : lot!.roof;
          ctx.fillRect(bx + 2 + k * ((bw - 4) / 4), by + bh - 34, (bw - 4) / 4, 8);
        }
        ctx.fillStyle = night ? 'rgba(255,211,77,0.85)' : 'rgba(255,255,255,0.5)';
        ctx.fillRect(bx + 8, by + 16, bw - 16, 16);
        this.text(mine ? '🏮' : lot!.icon, bx + bw / 2, by + bh - 12, mine ? 16 : 15, '#fff', 400);
      } else {
        ctx.fillStyle = '#f4ecd8';
        ctx.fillRect(bx + 6, by + bh / 2 - 9, bw - 12, 18);
        this.text('SALE', bx + bw / 2, by + bh / 2, 8.5, '#c1121f', 700);
      }
      if (mine) this.fitText(R.name, bx + bw / 2, by + 10, bw - 6, 7.5, '#ffd34d', 'center', 700);
    });
    ctx.restore();
    this.text('SAKURA STREET', WORLD_W / 2, y + 16, 12, night ? '#fff' : '#3a1d12', 700);
    y += h + 10;
    this.wrapLeft('Buy the shops on your street. Each one adds tips every hour and a special perk.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 26;
    for (const lot of LOTS) {
      const own = this.hasLot(lot.id);
      this.card(16, y, WORLD_W - 32, 62, own ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.dot(46, y + 31, 21, lot.color);
      this.text(lot.icon, 46, y + 32, 20, '#fff', 400);
      this.text(lot.name, 76, y + 18, 13.5, '#fff', 700, 'left');
      this.fitText(`+${lot.tips} tips/hour · ${lot.perk}`, 76, y + 40, WORLD_W - 210, 10.5, own ? '#8fdc93' : 'rgba(255,255,255,0.75)', 'left', 600);
      if (own) this.text('✓ OWNED', WORLD_W - 32, y + 31, 12, '#8fdc93', 700, 'right');
      else this.pill(WORLD_W - 124, y + 15, 94, `${Math.round(lot.cost * cfg.costScale).toLocaleString('en-US')} 🪙`, f, () => this.buyLot(lot.id), this.bank >= Math.round(lot.cost * cfg.costScale) ? 'gold' : 'quiet');
      y += 70;
    }
    return y;
  },

  drawRestShelf(this: Game, y: number): number {
    const { ctx } = this;
    const d = this.diner;
    this.wrapLeft(`Finish a set for +${Math.round(SET_TIP_BONUS * 100)}% tips forever. Pieces come from boss chefs, Rush chests, the golden guest, goal chests and the weekly report.`, 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 34;
    PIECE_SETS.forEach((set, s) => {
      const have = PIECE_KINDS.filter((_, k) => d.pieces.includes(`${s}:${k}`)).length;
      const full = have === PIECE_KINDS.length;
      const g = ctx.createLinearGradient(0, y, 0, y + 92);
      g.addColorStop(0, '#5a3a22');
      g.addColorStop(1, '#3a2414');
      ctx.fillStyle = g;
      this.roundRect(16, y, WORLD_W - 32, 92, 12);
      ctx.fill();
      if (full) {
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      this.text(set.name, 30, y + 16, 13, '#fff', 700, 'left');
      this.text(full ? `✓ +${Math.round(SET_TIP_BONUS * 100)}% tips` : `${have}/${PIECE_KINDS.length}`, WORLD_W - 30, y + 16, 11, full ? '#ffd34d' : 'rgba(255,255,255,0.7)', 700, 'right');
      // The shelf board.
      ctx.fillStyle = '#2a180c';
      ctx.fillRect(26, y + 74, WORLD_W - 52, 6);
      PIECE_KINDS.forEach((pk, k) => {
        const px = 52 + k * ((WORLD_W - 104) / 4);
        const own = d.pieces.includes(`${s}:${k}`);
        this.dot(px, y + 48, 20, own ? set.color : 'rgba(0,0,0,0.3)');
        if (own) this.text(pk.emoji, px, y + 49, 20, '#fff', 400);
        else this.text('?', px, y + 49, 16, 'rgba(255,255,255,0.3)', 700);
      });
      y += 100;
    });
    return y;
  },

  drawRestGuests(this: Game, y: number): number {
    const d = this.diner;
    const inp = this.ratingInput();
    const pts = ratingPoints(inp);
    const stars = ratingStars(pts);
    const next = RATING_STEPS[stars];
    this.card(16, y, WORLD_W - 32, 132, 'rgba(60,40,80,0.96)');
    this.text('GUIDE RATING', 30, y + 18, 11, 'rgba(255,255,255,0.7)', 700, 'left');
    for (let k = 0; k < 5; k++) this.text('✪', 30 + k * 26, y + 44, 24, k < stars ? '#ffd34d' : 'rgba(255,255,255,0.2)', 700, 'left');
    this.text(`${pts} pts`, WORLD_W - 30, y + 44, 14, '#fff', 700, 'right');
    const prev = RATING_STEPS[stars - 1] ?? 0;
    this.bar(30, y + 62, WORLD_W - 60, next ? (pts - prev) / (next - prev) : 1, '#ffd34d', 7);
    this.fitText(next ? `${next - pts} pts to ✪${stars + 1}: ${GUEST_TYPES[stars + 1].name} will visit` : 'Top of the guide! Royalty dines here.', 30, y + 80, WORLD_W - 60, 10.5, '#fff', 'left', 600);
    this.fitText(`Popularity ${inp.popularity * 6} · dish levels ${inp.dishLevels * 3} · expansions ${inp.expansions * 15} · street ${inp.lots * 8}`, 30, y + 100, WORLD_W - 60, 9.5, 'rgba(255,255,255,0.6)', 'left', 600);
    this.fitText(`Reviews ${inp.reviews * 4} · decor ${inp.styles * 2} · sets ${inp.sets * 10} · requests ${Math.min(40, Math.floor(inp.requests / 2))}`, 30, y + 116, WORLD_W - 60, 9.5, 'rgba(255,255,255,0.6)', 'left', 600);
    y += 140;
    for (const g of GUEST_TYPES) {
      const open = stars >= g.star;
      this.card(16, y, WORLD_W - 32, 50, open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.text(open ? g.emoji.slice(0, 3).join('') : '🔒', 28, y + 25, 17, '#fff', 400, 'left');
      this.text(g.name, 104, y + 17, 12.5, open ? '#fff' : 'rgba(255,255,255,0.5)', 700, 'left');
      this.fitText(g.desc, 104, y + 34, WORLD_W - 190, 10, 'rgba(255,255,255,0.6)', 'left', 600);
      this.text(open ? `${g.mult}× tips` : g.star ? `at ✪${g.star}` : '', WORLD_W - 30, y + 25, 11, open ? '#ffd34d' : 'rgba(255,255,255,0.5)', 700, 'right');
      y += 56;
    }
    // The guestbook of rival chefs who came to eat.
    y += 6;
    const nextGoal = GUESTBOOK_GOALS[d.guestbookClaimed];
    const hosted = d.chefsHosted.length;
    this.card(16, y, WORLD_W - 32, 104, 'rgba(58,44,28,0.96)');
    this.text('📖 GUESTBOOK', 30, y + 18, 13, '#fff', 700, 'left');
    this.text(`${hosted} rival chef${hosted === 1 ? '' : 's'} hosted`, WORLD_W - 30, y + 18, 11, '#ffd34d', 700, 'right');
    this.fitText(nextGoal ? `Next: ${nextGoal.n} chefs → +${nextGoal.coins} coins` : 'Every milestone reached!', 30, y + 38, WORLD_W - 60, 10.5, 'rgba(255,255,255,0.8)', 'left', 600);
    if (nextGoal) this.bar(30, y + 50, WORLD_W - 60, hosted / nextGoal.n, '#ffd34d', 6);
    const names = d.chefsHosted.slice(-6).reverse().map((l) => chefFor(l).name.replace(/^(Chef|Master|Captain|Sensei|Legend) /, ''));
    this.fitText(names.length ? `Signed by: ${names.join(', ')}` : 'Chefs you beat in the journey drop by to eat, up to 3 a day.', 30, y + 72, WORLD_W - 60, 10, 'rgba(255,255,255,0.7)', 'left', 600);
    this.fitText(`${CHEF_VISITS_PER_DAY - (d.chefVisits.day === dayKey() ? d.chefVisits.n : 0)} visits left today`, 30, y + 90, WORLD_W - 60, 10, 'rgba(255,255,255,0.5)', 'left', 600);
    return y + 112;
  },

  drawRestReviews(this: Game, y: number): number {
    const d = this.diner;
    if (!d.reviews.length) {
      this.wrapLeft('No reviews yet. Serve dishes, fill requests and host chefs, and guests will start writing about you.', 16, y + 2, WORLD_W - 32, 11, 'rgba(255,255,255,0.75)');
      return y + 40;
    }
    for (const rv of d.reviews.slice(0, 20)) {
      this.card(16, y, WORLD_W - 32, 62);
      this.text(rv.e, 40, y + 31, 22, '#fff', 400);
      this.text('★'.repeat(rv.s) + '☆'.repeat(5 - rv.s), 64, y + 15, 11, '#ffd34d', 700, 'left');
      this.text(this.ago(rv.at), WORLD_W - 30, y + 15, 9.5, 'rgba(255,255,255,0.5)', 600, 'right');
      this.wrapLeft(rv.text, 64, y + 32, WORLD_W - 96, 11, '#fff');
      y += 68;
    }
    return y;
  },

  drawRestRival(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const { ctx } = this;
    const d = this.diner;
    this.dinerRollover();
    const w = d.week;
    const rv = RIVALS[w.rivalI % RIVALS.length];
    const mine = w.income.reduce((a, b) => a + b, 0);
    const theirs = rivalNow(w);
    const ends = weekStart().getTime() + 7 * 86_400_000;
    // Their storefront across the street.
    this.card(16, y, WORLD_W - 32, 110, rv.color);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    this.roundRect(28, y + 12, 86, 86, 12);
    ctx.fill();
    this.text(rv.icon, 71, y + 55, 44, '#fff', 400);
    this.fitText(`${rv.name} (AI)`, 128, y + 26, WORLD_W - 160, 15, '#fff', 'left', 700);
    this.fitText(`${rv.chef} (AI) opened across the street`, 128, y + 48, WORLD_W - 160, 10.5, 'rgba(255,255,255,0.8)', 'left', 600);
    this.fitText(`Out-earn them by Sunday night: +${RIVAL_WIN_COINS} coins and their sign`, 128, y + 70, WORLD_W - 160, 10, '#ffd34d', 'left', 600);
    this.fitText(`Week ends in ${this.dur(ends - Date.now())}`, 128, y + 88, WORLD_W - 160, 10, 'rgba(255,255,255,0.6)', 'left', 600);
    y += 118;
    // The race.
    const top = Math.max(mine, theirs, w.rivalTarget, 1);
    this.card(16, y, WORLD_W - 32, 96);
    this.text('THIS WEEK’S RESTAURANT INCOME', 30, y + 16, 10.5, 'rgba(255,255,255,0.7)', 700, 'left');
    this.text(`You ${mine}`, 30, y + 38, 12, '#fff', 700, 'left');
    this.bar(120, y + 34, WORLD_W - 150, mine / top, mine >= theirs ? '#8fdc93' : '#ffd34d', 9);
    this.fitText(`${rv.chef.split(' ').pop()} ${theirs}`, 30, y + 64, 88, 12, '#fff', 'left', 700);
    this.bar(120, y + 60, WORLD_W - 150, theirs / top, '#ff8a5b', 9);
    this.fitText(mine >= theirs ? 'You’re ahead! Keep serving.' : `${theirs - mine} behind. Tips, dishes and requests all count.`, 30, y + 84, WORLD_W - 60, 10, mine >= theirs ? '#8fdc93' : '#ffb4a2', 'left', 600);
    y += 104;
    // Signs won.
    this.card(16, y, WORLD_W - 32, 58);
    this.text('🏆 RIVAL SIGNS ON YOUR WALL', 30, y + 18, 11, '#ffd34d', 700, 'left');
    this.fitText(d.rival.wins.length ? '🪧'.repeat(Math.min(12, d.rival.wins.length)) + ` × ${d.rival.wins.length}` : 'None yet. Win a week to take your first one!', 30, y + 40, WORLD_W - 60, 13, '#fff', 'left', 600);
    y += 66;
    if (d.lastWeek) {
      this.pill(16, y, WORLD_W - 32, '📊 LAST WEEK’S REPORT', f, () => { this.reportOpen = true; }, 'quiet');
      y += 42;
    }
    return y;
  },

  drawRestFest(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const { ctx } = this;
    const fest = festivalNow();
    if (!fest) {
      const n = nextFestival();
      this.wrapLeft(`The next festival is ${n.f.icon} ${n.f.name}, in ${this.dur(n.start - Date.now())}.`, 16, y + 2, WORLD_W - 32, 11, 'rgba(255,255,255,0.8)');
      return y + 30;
    }
    this.festTokens(0);
    const d = this.diner;
    // The stall: an awning, a counter and every item you've added.
    const g = ctx.createLinearGradient(0, y, 0, y + 160);
    g.addColorStop(0, fest.f.color);
    g.addColorStop(1, '#2a1a33');
    ctx.fillStyle = g;
    this.roundRect(16, y, WORLD_W - 32, 160, 14);
    ctx.fill();
    for (let k = 0; k < 10; k++) {
      ctx.fillStyle = k % 2 ? '#ffffff' : fest.f.color;
      ctx.beginPath();
      const ax = 28 + k * ((WORLD_W - 56) / 10);
      ctx.moveTo(ax, y + 14);
      ctx.lineTo(ax + (WORLD_W - 56) / 10, y + 14);
      ctx.lineTo(ax + (WORLD_W - 56) / 10, y + 36);
      ctx.arc(ax + (WORLD_W - 56) / 20, y + 36, (WORLD_W - 56) / 20, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = '#7a4e2a';
    ctx.fillRect(36, y + 118, WORLD_W - 72, 22);
    fest.f.items.forEach((it, i) => {
      const own = d.fest.items.includes(i);
      const ix = 56 + i * ((WORLD_W - 112) / 5);
      ctx.globalAlpha = own ? 1 : 0.18;
      this.text(it.emoji, ix, y + 92 + (own ? Math.sin(this.time * 2 + i) * 2 : 0), 26, '#fff', 400);
      ctx.globalAlpha = 1;
    });
    this.text(`${fest.f.icon} ${fest.f.name.toUpperCase()}`, WORLD_W / 2, y + 56, 15, '#fff', 700);
    y += 168;
    this.fitText(`${d.fest.tokens} ${fest.f.icon} tokens · ends in ${this.dur(fest.ends - Date.now())}`, WORLD_W / 2, y + 8, WORLD_W - 32, 13, '#ffd34d', 'center', 700);
    this.wrapLeft('Earn tokens: beat chefs (1), every 10 layers (1), fill requests (2), sell dishes (1 per 3), goal chest (2). Finish the stall for a keepsake you keep forever.', 16, y + 26, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 56;
    fest.f.items.forEach((it, i) => {
      const own = d.fest.items.includes(i);
      this.card(16, y, WORLD_W - 32, 50, own ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(it.emoji, 42, y + 25, 22, '#fff', 400);
      this.text(it.name, 66, y + 25, 13, '#fff', 700, 'left');
      if (own) this.text('✓ ON THE STALL', WORLD_W - 30, y + 25, 11, '#8fdc93', 700, 'right');
      else this.pill(WORLD_W - 112, y + 9, 82, `${Math.round(FEST_COSTS[i] * cfg.festCost)} ${fest.f.icon}`, f, () => this.festBuy(i), d.fest.tokens >= Math.round(FEST_COSTS[i] * cfg.festCost) ? 'gold' : 'quiet');
      y += 56;
    });
    if (d.fest.done) {
      this.text(`${fest.f.icon} Stall complete! Keepsake earned.`, WORLD_W / 2, y + 10, 12, '#8fdc93', 700);
      y += 26;
    }
    return y;
  },

  /** Coins pour out of the jar; every tap adds 2% (up to +20%). */
  drawBurst(this: Game): void {
    const { ctx } = this;
    const b = this.burst!;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    ctx.fillStyle = 'rgba(15,8,20,0.82)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    this.buttons.push({ x: -this.offX, y: 0, w: WORLD_W + this.offX * 2, h: this.viewH, onTap: () => this.burstTap(), label: 'Tap for bonus coins' });
    const glow = ctx.createRadialGradient(cx, midY, 10, cx, midY, 170);
    glow.addColorStop(0, 'rgba(255,211,77,0.45)');
    glow.addColorStop(1, 'rgba(255,211,77,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 170, midY - 170, 340, 340);
    this.qaSkip = true;
    for (const sp of b.sparks) {
      ctx.globalAlpha = Math.max(0, 1 - sp.t / 1.2);
      this.text('🪙', sp.x, sp.y, 18, '#fff', 400);
    }
    ctx.globalAlpha = 1;
    const shake = Math.sin(this.time * 40) * (2 + b.taps * 0.4);
    this.text('💰', cx + shake, midY + 10, 72 + b.taps * 2, '#fff', 400);
    this.qaSkip = false;
    this.text(`+${b.base}`, cx, midY - 92, 34, '#ffd34d', 900);
    const bonus = Math.min(20, b.taps * 2);
    this.text(b.taps ? `TAP BONUS +${bonus}%` : 'TAP TAP TAP!', cx, midY + 84, 20, '#fff', 900);
    this.bar(cx - 100, midY + 104, 200, bonus / 20, '#ffd34d', 10);
    this.text('Tap fast while the coins pour out!', cx, midY + 132, 12, 'rgba(255,255,255,0.75)', 600);
  },

  drawReport(this: Game, blocker: () => void): void {
    const { ctx } = this;
    const w = this.diner.lastWeek;
    if (!w) {
      this.reportOpen = false;
      return;
    }
    blocker();
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    const top = midY - 250;
    this.card(20, top, WORLD_W - 40, 500, '#2a1a33');
    this.text('📊 WEEKLY REPORT', cx, top + 30, 20, '#fff', 900);
    this.text(`Week ${w.key.split('-W')[1] ?? ''} · ${RESTAURANTS[Math.min(this.progress.restaurant.r, RESTAURANTS.length - 1)].name}`, cx, top + 54, 11, '#ffd34d', 700);
    // Income per day.
    const max = Math.max(1, ...w.income);
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const bw = (WORLD_W - 100) / 7;
    w.income.forEach((v, i) => {
      const bh = (v / max) * 100;
      const bx = 50 + i * bw;
      ctx.fillStyle = v === max && v > 0 ? '#ffd34d' : '#ff8a5b';
      this.roundRect(bx + 4, top + 184 - bh, bw - 8, Math.max(2, bh), 4);
      ctx.fill();
      this.text(days[i], bx + bw / 2, top + 196, 10, 'rgba(255,255,255,0.7)', 700);
    });
    const total = w.income.reduce((a, b) => a + b, 0);
    const best = Object.entries(w.sold).sort((a, b) => b[1] - a[1])[0];
    const won = this.diner.rival.wins.includes(w.key);
    const rv = RIVALS[w.rivalI % RIVALS.length];
    const rows: [string, string][] = [
      ['💰 Income', `${total} coins`],
      ['🧑 Guests served', String(w.guests)],
      ['🍽️ Dishes sold', String(Object.values(w.sold).reduce((a, b) => a + b, 0))],
      ['⭐ Best dish', best ? `${DISH_EMOJI[best[0]] ?? '🍣'} ${best[0]} ×${best[1]}` : '—'],
      ['📋 Requests filled', String(w.requests)],
      ['🧑‍🍳 New chef guests', String(w.chefs)],
      ['✪ Guide rating', `${w.ratingStart} → ${this.ratingStars()}`],
      [`${rv.icon} vs ${rv.name} (AI)`, won ? `WON · +${RIVAL_WIN_COINS}` : `lost (${w.rivalTarget})`],
    ];
    rows.forEach(([a, b], i) => {
      const ry = top + 220 + i * 24;
      this.fitText(a, 40, ry, 170, 12, 'rgba(255,255,255,0.8)', 'left', 600);
      this.fitText(b, WORLD_W - 40, ry, 160, 12, '#fff', 'right', 700);
    });
    const claimed = this.diner.reportSeen === w.key;
    this.button(40, top + 420, (WORLD_W - 90) / 2, 44, '📤 SHARE', () => this.shareReport(), 'quiet');
    this.button(50 + (WORLD_W - 90) / 2, top + 420, (WORLD_W - 90) / 2, 44, claimed ? 'CLOSE' : `+${weekReward(w)} 🪙`, () => (claimed ? (this.reportOpen = false) : this.claimReport()), 'gold');
    if (!claimed) this.text('Reward: coins + a piece of tableware', cx, top + 482, 10.5, 'rgba(255,255,255,0.6)', 600);
  },

  /** A staff member cheering from the side during a PERFECT streak. */
  drawCheer(this: Game): void {
    const c = this.cheer!;
    const { ctx } = this;
    const y = this.viewH - this.insets.bottom - 150;
    const x = this.progress && settings.leftHanded ? WORLD_W - 196 : 12;
    ctx.globalAlpha = Math.min(1, c.t * 3, (1.8 - c.t) * 6 + 0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    this.roundRect(x, y, 184, 40, 20);
    ctx.fill();
    this.text(c.emoji, x + 22, y + 20, 20, '#fff', 400);
    this.fitText(`${c.name}: ${c.text}`, x + 42, y + 20, 134, 11.5, '#3a1d12', 'left', 700);
    ctx.globalAlpha = 1;
  },

  drawUpgradeFx(this: Game, box: { x: number; y: number; w: number; h: number }): void {
    const fx = this.upgradeFx;
    if (!fx || fx.t >= 1.4) return;
    const { x, y, w, h } = box;
    const spots: Record<string, [number, number]> = {
      sign: [w / 2, 28], lanterns: [w * 0.2, 34], noren: [49, 115], art: [w - 61, 92],
      aquarium: [140, h * 0.6], garden: [w - 60, h * 0.62], counter: [w / 2, h * 0.72 + 14], conveyor: [w / 2, h * 0.72 - 16],
    };
    const [sx, sy] = spots[AREAS[fx.i].id];
    this.qaSkip = true;
    for (let k = 0; k < 10; k++) {
      const a = k * 0.63 + fx.t * 2;
      const r = 10 + fx.t * 50;
      this.ctx.globalAlpha = Math.max(0, 1 - fx.t / 1.4);
      this.text('✦', x + sx + Math.cos(a) * r, y + sy + Math.sin(a) * r, 12 + (k % 3) * 4, k % 2 ? '#ffd34d' : '#ffffff', 700);
    }
    this.ctx.globalAlpha = 1;
    this.qaSkip = false;
  },
};
