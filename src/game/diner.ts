// The restaurant: kitchen, guests, serving, street, festival and its screens.
// These are methods of Game (see game.ts), kept here to keep that file a readable size.

import { FONT } from '../font';
import { sfx } from '../audio';
import { haptic, save, scheduleAt } from '../platform';
import { TRACKS, babble, type TrackId } from '../audio';
import { COMPANIONS, companionLevel, shardsForNext, AREAS, AREA_MAX, RESTAURANTS, areaCost } from '../collect';
import { PASS_TIERS, PASS_XP, currentSeason, passReward, timeLeft } from '../live';
import { PRODUCTS } from '../monetize';
import { Progress, dayKey, weekKey } from '../progress';
import { settings } from '../settings';
import { t, t as tr } from '../i18n';
import { track } from '../analytics';
import { cfg } from '../config';
import { STAFF, STYLES, THEMES as REST_THEMES, styleText, themeInSeason } from '../restaurant';
import { seatPos } from '../scene';
import { DEMOTE, LEAGUES, LEAGUE_SIZE, NEMESIS_AT, PROMOTE, QUEST_POT, QUEST_STAGES, currentQuest, leagueRivals, leagueWeek, questSurvivors, settleLeague } from '../compete';
import { FLOOR_ICON, MODS, MOD_LIST, RESCUES, TOWER_FLOORS, rescueStars, towerFloors, towerReward, type Mod } from '../modes';
import { MINIS, makeMini, type MiniId } from '../minigames';
import { CHOICES } from '../book';
import { drawSake } from '../mascot';
import { CHEF_VISITS_PER_DAY, DISPLAY_BASE, DUPLICATE_COINS, EXPANSIONS, FEST_COMPLETE_COINS, FEST_COSTS, GOALS, GOAL_CHEST_COINS, GUESTBOOK_GOALS, GUEST_TYPES, LOTS, PANTRY_BASE, PANTRY_PER_FRIDGE, PIECE_SETS, REQUESTS_MAX, REQUEST_EVERY, REVIEW_TEMPLATES, RIVAL_WIN_COINS, RUSH_CHESTS, SET_TIP_BONUS, STAFF_CHEERS, STAFF_RANKS, UPGRADES, canAfford, chefLine, cookMs, dailyGoals, dishCost, dishLevel, dishNext, dishPrice, dreamPercent, emptyWeek, festivalNow, goldenHour, goldenPrize, guestTypeFor, makeReview, nextRush, pickChefGuest, pieceName, ratingPoints, ratingStars, rollPiece, rushNow, rushWindows, setsDone, staffRank, stockLayer, taskText, weekReward, weekday, type Burner, type DinerState, type GoalId, type LotId, type RatingInput, type TaskKind, type UpgradeId } from '../diner';
import { LOGO_SHORT, LOGO_TIME, PANEL_TIME, caption, drawLogo, logoSparkles, logoText, panelClosed, panelReopen, panelRival } from '../intro';
import { ACHIEVEMENTS, ACH_REWARDS, ACH_TIER_NAMES, AVATAR_LABELS, AVATAR_LOCKS, AVATAR_OPTIONS, CHAPTERS, ENDLESS_CHAPTER, GALLERY_TILES, HEART_LEVELS, HEART_REWARDS, HEART_TITLES, NAMES, PERFECTS_PER_TILE, PICTURES, PICTURE_REWARD, REGULARS, achTier, avatarChef, heartLevel, type Avatar, type Picture, type StatId } from '../meta';
import { BOOSTERS, type Ingredient } from '../shop';
import { chefFor, drawChef } from '../chef';
import { Game, WORLD_W, LAYER_H, PERFECT_TOL, Recipe, RECIPES, DISH_EMOJI, Layer, SeatGuest } from '../game';

declare module '../game' {
  interface Game {
    upLv(id: UpgradeId): number;
    pantryCap(): number;
    displayCap(): number;
    displayCount(): number;
    hasLot(id: LotId): boolean;
    knownDishes(): Recipe[];
    dishServes(name: string): number;
    priceOf(r: Recipe): number;
    beatenLevels(): number[];
    stockPantry(kind: Ingredient, perfect: boolean): void;
    goalsToday(): DinerState['goals'];
    goal(id: GoalId, n?: number): void;
    goalsDone(): boolean;
    claimGoals(): void;
    addIncome(n: number): void;
    addReview(kind: keyof typeof REVIEW_TEMPLATES, vars: { dish?: string; name?: string; h?: number }, emoji: string): void;
    dinerRollover(): void;
    ratingInput(): RatingInput;
    ratingStars(): number;
    checkRating(): void;
    dreamPct(): number;
    dreamNext(): string;
    taskHave(kind: TaskKind): number;
    expansionReady(): boolean;
    buildExpansion(): void;
    dinerTipBonus(): number;
    lotTips(): number;
    rushOn(): { name: string; end: number } | null;
    scheduleRush(): void;
    burstTap(): void;
    finishBurst(): void;
    burnerList(): (Burner | null)[];
    missingFor(r: Recipe): string;
    cook(i: number, r: Recipe): void;
    plate(i: number, quiet?: boolean): boolean;
    plateAll(): void;
    buyUpgrade(id: UpgradeId): void;
    newSeatGuest(i: number): SeatGuest;
    goldenDue(): boolean;
    refillRequests(): void;
    fillRequest(i: number): number;
    bestDish(): Recipe | null;
    recordSold(name: string): void;
    serveSeat(i: number, critic: boolean): void;
    rushServe(): void;
    serveGolden(): void;
    serveChefGuest(lv: number, sp: { x: number; y: number }): number;
    gainPiece(from: string): void;
    buyLot(id: LotId): void;
    fishDelivery(): void;
    festTokens(n: number): void;
    festBuy(i: number): void;
    dinerServe(recipe: string, level: number): void;
    dinerRunEnd(fresh: number): void;
    staffCheer(): void;
    dinerVisit(): void;
    claimReport(): void;
    shareReport(): void;
    drawRestBuild(f: { areaTop: number; areaH: number }, y: number): number;
    drawRestDecor(f: { areaTop: number; areaH: number }, y: number): number;
    drawRestStaff(f: { areaTop: number; areaH: number }, y: number): number;
    drawRestMenu(f: { areaTop: number; areaH: number }, y: number): number;
    drawRestThemes(f: { areaTop: number; areaH: number }, y: number): number;
    upgradeArea(i: number): void;
    passClaimable(): number;
    drawPass(): void;
    drawPets(): void;
    queueStory(ch: number, end: boolean): void;
    drawStoryCard(blocker: () => void): void;
    drawStory(): void;
    addHearts(who: number, n: number): void;
    drawRegulars(): void;
    achValue(id: StatId): number;
    checkAchievements(): void;
    achClaimable(): number;
    drawTrophies(): void;
    galleryPerfect(): void;
    drawPicture(pic: Picture, x: number, y: number, size: number, shown: number[] | null): void;
    drawGallery(): void;
    drawAvatar(): void;
    updateIntro(real: number): void;
    advanceIntro(): void;
    finishIntro(skipped: boolean): void;
    drawIntro(): void;
    checkLeague(): void;
    leaguePts(n: number): void;
    leagueTable(): { name: string; pts: number; me: boolean }[];
    drawLeague(): void;
    questWin(): void;
    questLose(): void;
    drawQuest(): void;
    nemesisLevel(): number;
    nemesisPower(): number;
    isNemesis(): boolean;
    nemesisReward(): number;
    beatNemesis(level: number): void;
    dropTwin(m: Layer): void;
    startRescue(i: number): void;
    updateRescue(real: number): void;
    rescueWon(): void;
    drawWater(): void;
    drawRescues(): void;
    towerState(): Progress['tower'];
    startTower(): void;
    towerFloorDone(floor: number): boolean;
    drawTower(): void;
    startModChal(m: Mod): void;
    modChalWon(m: Mod): void;
    drawModChals(): void;
    startMini(id: MiniId): void;
    updateMini(real: number): void;
    drawMiniGame(): void;
    drawMinis(): void;
  }
}

export const dinerMethods = {
  upLv(this: Game, id: UpgradeId): number {
    return this.diner.up[id] ?? 0;
  },

  pantryCap(this: Game): number {
    return PANTRY_BASE + PANTRY_PER_FRIDGE * this.upLv('fridge');
  },

  displayCap(this: Game): number {
    return DISPLAY_BASE + 4 * this.upLv('display');
  },

  displayCount(this: Game): number {
    return Object.values(this.diner.display).reduce((a, b) => a + b, 0);
  },

  hasLot(this: Game, id: LotId): boolean {
    return this.diner.lots.includes(id);
  },

  /** Recipes the player can cook: unlocked along the journey, secrets once discovered. */
  knownDishes(this: Game): Recipe[] {
    const p = this.progress;
    return RECIPES.filter((r) => (r.secret ? p.secrets.includes(r.name) : (r.level ?? 0) <= p.unlocked));
  },

  /** Serves count toward a dish's level: orders served in runs plus plates sold in the restaurant. */
  dishServes(this: Game, name: string): number {
    return (this.progress.recipeCounts[name] ?? 0) + (this.diner.sold[name] ?? 0);
  },

  priceOf(this: Game, r: Recipe): number {
    // Dishes made with in-season ingredients sell for 25% more.
    const season = this.seasonal();
    return Math.round(dishPrice(r.pattern, this.dishServes(r.name)) * (cfg.dishPrice / 10) * (r.pattern.some((k) => season.includes(k)) ? 1.25 : 1));
  },

  beatenLevels(this: Game): number[] {
    return Object.keys(this.progress.cards).map(Number).filter((l) => l > 0);
  },

  /** Every landed layer stocks the pantry (a PERFECT stocks two). */
  stockPantry(this: Game, kind: Ingredient, perfect: boolean): void {
    const add = stockLayer(this.diner.pantry, kind, perfect, this.pantryCap());
    if (!add) return;
    this.runStock += add;
    this.goal('layers', add);
  },

  /** Today's three restaurant goals (picked once per day). */
  goalsToday(this: Game): DinerState['goals'] {
    const d = this.diner;
    if (d.goals.day !== dayKey()) {
      const now = Date.now();
      const rushLeft = rushWindows(new Date(), this.hasLot('ramen')).some((w) => w.end > now + 30 * 60_000);
      d.goals = { day: dayKey(), ids: dailyGoals(dayKey(), { chefs: this.beatenLevels().length > 0, rushLeft }), prog: {}, claimed: false };
    }
    return d.goals;
  },

  goal(this: Game, id: GoalId, n = 1): void {
    const g = this.goalsToday();
    if (!g.ids.includes(id) || g.claimed) return;
    const was = g.ids.every((k) => (g.prog[k] ?? 0) >= GOALS[k].n);
    g.prog[id] = Math.min(GOALS[id].n, (g.prog[id] ?? 0) + n);
    if (!was && g.ids.every((k) => (g.prog[k] ?? 0) >= GOALS[k].n) && !this.lockedAt('restaurant')) this.showToast('🎯 Restaurant goals done! Open the chest in your restaurant.');
  },

  goalsDone(this: Game): boolean {
    const g = this.goalsToday();
    return g.ids.every((k) => (g.prog[k] ?? 0) >= GOALS[k].n);
  },

  claimGoals(this: Game): void {
    const g = this.goalsToday();
    if (g.claimed || !this.goalsDone()) return;
    g.claimed = true;
    this.bankCoins(GOAL_CHEST_COINS);
    this.festTokens(2);
    const piece = Math.random() < 0.3;
    this.celebrate('🎯 GOAL CHEST!', `+${GOAL_CHEST_COINS} coins${festivalNow() ? ' · +2 festival tokens' : ''}${piece ? ' · a piece of tableware' : ''}`, 2.2);
    if (piece) this.gainPiece('goal chest');
    this.progress.persist();
    track('diner_goals');
  },

  /** Restaurant income is tracked per day for the weekly report and the rival race. */
  addIncome(this: Game, n: number): void {
    this.dinerRollover();
    this.diner.week.income[weekday()] += n;
  },

  addReview(this: Game, kind: keyof typeof REVIEW_TEMPLATES, vars: { dish?: string; name?: string; h?: number }, emoji: string): void {
    const d = this.diner;
    d.reviews.unshift(makeReview(kind, vars, emoji, Math.floor(Math.random() * 1e9)));
    if (d.reviews.length > 40) d.reviews.length = 40;
  },

  /** A new week: settle the rival race and keep last week for the report. */
  dinerRollover(this: Game): void {
    const d = this.diner;
    const wk = weekKey();
    if (d.week.key === wk) return;
    const last = d.week;
    const total = last.income.reduce((a, b) => a + b, 0);
    if (last.key && d.rival.settled !== last.key) {
      d.rival.settled = last.key;
      if (total > 0 && total >= last.rivalTarget) {
        d.rival.wins.push(last.key);
        this.bankCoins(RIVAL_WIN_COINS);
      }
    }
    d.lastWeek = total > 0 || last.guests > 0 ? last : d.lastWeek;
    d.week = emptyWeek(wk, this.ratingStars(), total);
    this.progress.persist();
  },

  ratingInput(this: Game): RatingInput {
    const d = this.diner;
    return {
      popularity: this.popularity(),
      dishLevels: this.knownDishes().reduce((a, r) => a + dishLevel(this.dishServes(r.name)) - 1, 0),
      expansions: d.expansions,
      lots: d.lots.length,
      reviews: this.rest.reviews,
      styles: this.rest.ownedStyles.length,
      sets: setsDone(d.pieces),
      requests: d.reqFilled,
    };
  },

  ratingStars(this: Game): number {
    return ratingStars(ratingPoints(this.ratingInput()));
  },

  /** Each new guide star is a big moment: a new kind of guest starts visiting. */
  checkRating(this: Game): void {
    const d = this.diner;
    const stars = this.ratingStars();
    if (stars <= d.ratingSeen) return;
    d.ratingSeen = stars;
    const g = GUEST_TYPES[stars];
    this.celebrate(`✪ ${stars}-STAR GUIDE RATING!`, `${g.name} ${g.emoji[0]} now visit · they tip ${g.mult}×`, 3);
    this.addReview('star', {}, g.emoji[0]);
    this.progress.persist();
    track('diner_rating', { stars });
  },

  dreamPct(this: Game): number {
    const d = this.diner;
    const dishes = this.knownDishes();
    return dreamPercent({
      expansions: d.expansions, stars: this.ratingStars(), lots: d.lots.length, sets: setsDone(d.pieces),
      areas: this.progress.restaurant.levels.reduce((a, b) => a + b, 0) + (this.progress.restaurant.r > 0 ? 24 : 0),
      dishLv: dishes.reduce((a, r) => a + dishLevel(this.dishServes(r.name)) - 1, 0), dishes: dishes.length,
    });
  },

  /** The very next thing to do on the way to the dream restaurant. */
  dreamNext(this: Game): string {
    const d = this.diner;
    const ex = EXPANSIONS[d.expansions];
    if (ex) {
      const t = ex.tasks.find((k) => this.taskHave(k.kind) < k.n);
      return t ? `${ex.icon} ${ex.name}: ${taskText(t)}` : `${ex.icon} ${ex.name} is ready to build!`;
    }
    const lot = LOTS.find((l) => !this.hasLot(l.id));
    if (lot) return `${lot.icon} Buy the ${lot.name} on Sakura Street`;
    return '🏆 Collect every tableware set';
  },

  taskHave(this: Game, kind: TaskKind): number {
    const d = this.diner;
    switch (kind) {
      case 'sold': return d.soldTotal;
      case 'requests': return d.reqFilled;
      case 'rating': return this.ratingStars();
      case 'chefs': return d.chefsHosted.length;
      case 'lots': return d.lots.length;
      case 'coins': return this.bank;
    }
  },

  expansionReady(this: Game): boolean {
    const ex = EXPANSIONS[this.diner.expansions];
    return !!ex && ex.tasks.every((k) => this.taskHave(k.kind) >= k.n);
  },

  buildExpansion(this: Game): void {
    const d = this.diner;
    const ex = EXPANSIONS[d.expansions];
    if (!ex) return;
    const miss = ex.tasks.find((k) => this.taskHave(k.kind) < k.n);
    if (miss) return this.showToast(`Not yet: ${taskText(miss)} (${this.taskHave(miss.kind)}/${miss.n})`);
    const pay = ex.tasks.find((k) => k.kind === 'coins');
    if (pay) {
      this.bank -= pay.n;
      save.setCoins(this.bank);
    }
    d.expansions++;
    this.progress.persist();
    this.storyQueue.push({ ch: { title: `${ex.icon} ${ex.name}`, scene: [ex.icon, '🏮', '✨'], start: [ex.story], end: [] }, lines: [ex.story, `Opened! ${ex.perk}.`], end: true });
    this.celebrate(`${ex.icon} ${ex.name.toUpperCase()} OPEN!`, ex.perk, 3);
    haptic.success();
    track('diner_expand', { n: d.expansions });
  },

  /** Expansions, finished tableware sets, staff experience and festival keepsakes all raise tips. */
  dinerTipBonus(this: Game): number {
    const d = this.diner;
    const exp = EXPANSIONS.slice(0, d.expansions).reduce((a, e) => a + e.tips, 0);
    const ranks = STAFF.reduce((a, s) => a + (this.staffLv(s.id) ? staffRank(d.staffXp[s.id] ?? 0) : 0), 0);
    return exp + setsDone(d.pieces) * SET_TIP_BONUS + ranks * 0.02 + d.keepsakes.length * 0.02 + (this.progress.choices.ch2 === 'street' ? 0.1 : 0);
  },

  lotTips(this: Game): number {
    return LOTS.filter((l) => this.hasLot(l.id)).reduce((a, l) => a + l.tips, 0);
  },

  rushOn(this: Game): { name: string; end: number } | null {
    return rushNow(Date.now(), this.hasLot('ramen'));
  },

  /** Rush Hour reminders (only if the player allowed reminders). */
  scheduleRush(this: Game): void {
    if (this.lockedAt('restaurant')) return;
    const next = nextRush(Date.now() + 6 * 60_000, this.hasLot('ramen'));
    void scheduleAt(3, `🔥 ${next.name} in 5 minutes!`, 'Hungry guests and double tips at your restaurant.', new Date(next.start - 5 * 60_000));
  },

  /** Coin burst after collecting: tap fast while the coins pour out for up to +20%. */
  burstTap(this: Game): void {
    const b = this.burst;
    if (!b || b.taps >= 10) return;
    b.taps++;
    sfx.coin();
    haptic.light();
    for (let k = 0; k < 4; k++) b.sparks.push({ x: WORLD_W / 2, y: this.viewH / 2 - 10, vx: (Math.random() - 0.5) * 260, vy: -200 - Math.random() * 220, t: 0 });
  },

  finishBurst(this: Game): void {
    const b = this.burst!;
    this.burst = null;
    const bonus = Math.round(b.base * Math.min(0.2, b.taps * 0.02));
    if (bonus) {
      this.bankCoins(bonus);
      this.addIncome(bonus);
    }
    this.restFloat(`+${b.base + bonus} 🪙`, WORLD_W - 52, 0);
    this.celebrate(`💰 +${b.base + bonus} TIPS!`, bonus ? `Tap bonus +${bonus} (${b.taps} taps)` : 'Tap fast while coins pour out for up to +20%', 1.6);
    haptic.success();
    this.progress.persist();
    track('tips_burst', { base: b.base, taps: b.taps });
  },

  burnerList(this: Game): (Burner | null)[] {
    const b = this.diner.burners;
    while (b.length < 1 + this.upLv('burner')) b.push(null);
    return b;
  },

  missingFor(this: Game, r: Recipe): string {
    const cost = dishCost(r.pattern);
    return Object.entries(cost).filter(([k, n]) => (this.diner.pantry[k as Ingredient] ?? 0) < (n ?? 0))
      .map(([k, n]) => `${(n ?? 0) - (this.diner.pantry[k as Ingredient] ?? 0)} ${k}`).join(', ');
  },

  cook(this: Game, i: number, r: Recipe): void {
    const d = this.diner;
    const cost = dishCost(r.pattern);
    if (!canAfford(d.pantry, cost)) {
      this.showToast(`Need ${this.missingFor(r)}. Stack them in runs to stock the pantry!`);
      return;
    }
    for (const [k, n] of Object.entries(cost)) d.pantry[k as Ingredient] = (d.pantry[k as Ingredient] ?? 0) - (n ?? 0);
    const now = Date.now();
    // The very first dish is quick, so a new player sees the whole loop in their first session.
    const first = d.soldTotal === 0 && !d.lastDish.length && !d.burners.some((b) => b);
    const ms = first ? 8000 : Math.round(cookMs(r.pattern, this.upLv('stove')) * cfg.cookTime);
    this.burnerList()[i] = { recipe: r.name, start: now, ready: now + ms, last: r.name };
    d.lastDish[i] = r.name;
    this.kitchenPick = null;
    this.goal('cook');
    sfx.tap();
    haptic.light();
    if (ms >= 4 * 60_000) void scheduleAt(4, `${DISH_EMOJI[r.name] ?? '🍣'} ${r.name} is ready!`, 'Plate it and serve your guests.', new Date(now + ms));
    this.progress.persist();
    track('diner_cook', { recipe: r.name });
  },

  plate(this: Game, i: number, quiet = false): boolean {
    const b = this.burnerList()[i];
    if (!b || Date.now() < b.ready) return false;
    if (this.displayCount() >= this.displayCap()) {
      if (!quiet) this.showToast('The display case is full! Serve guests first (or upgrade the case).');
      return false;
    }
    const d = this.diner;
    d.display[b.recipe] = (d.display[b.recipe] ?? 0) + 1;
    this.burnerList()[i] = null;
    if (!quiet) {
      sfx.serve();
      haptic.success();
      this.restFloat(`${DISH_EMOJI[b.recipe] ?? '🍣'} plated!`, this.sceneBox.x + this.sceneBox.w * 0.56, this.sceneBox.y + 150);
    }
    this.progress.persist();
    return true;
  },

  plateAll(this: Game): void {
    let n = 0;
    this.burnerList().forEach((_, i) => { if (this.plate(i, true)) n++; });
    if (n) {
      sfx.serve();
      haptic.success();
      this.showToast(`🍽️ ${n} dish${n > 1 ? 'es' : ''} plated`);
    }
  },

  buyUpgrade(this: Game, id: UpgradeId): void {
    const u = UPGRADES.find((x) => x.id === id)!;
    const lv = this.upLv(id);
    if (lv >= 3) return;
    const cost = Math.round(u.costs[lv] * cfg.costScale);
    if (this.bank < cost) return this.showToast(`You need ${cost - this.bank} more coins`);
    this.bank -= cost;
    save.setCoins(this.bank);
    this.diner.up[id] = lv + 1;
    this.burnerList();
    this.progress.persist();
    this.celebrate(`${u.icon} ${u.name.toUpperCase()} LV ${lv + 1}`, u.perks[lv], 1.8);
    haptic.success();
    track('diner_upgrade', { id, level: lv + 1 });
  },

  /** Who sits where: the golden guest, guests with a request, rival chefs, and everyday guests. */
  newSeatGuest(this: Game, i: number): SeatGuest {
    const d = this.diner;
    const type = guestTypeFor(this.ratingStars(), Math.floor(Math.random() * 1e9));
    const local: SeatGuest = { kind: 'local', emoji: type.emoji[Math.floor(Math.random() * type.emoji.length)], type };
    if (this.guideStep()) return local; // the first day keeps it simple: everyday guests only
    if (i === 0 && this.goldenDue()) return { ...local, kind: 'golden', emoji: '🤩' };
    const taken = this.seatGuests.filter((s) => s?.kind === 'request').map((s) => s!.req);
    const open = d.requests.find((r) => !taken.includes(r.recipe));
    if (open && Math.random() < 0.7) return { ...local, kind: 'request', req: open.recipe, emoji: REGULARS[open.who]?.emoji ?? local.emoji };
    if (d.chefVisits.day !== dayKey()) d.chefVisits = { day: dayKey(), n: 0 };
    const chefSeated = this.seatGuests.some((s) => s?.kind === 'chef');
    if (!chefSeated && d.chefVisits.n < CHEF_VISITS_PER_DAY && Math.random() < 0.35) {
      const lv = pickChefGuest(this.beatenLevels(), d.chefsHosted, Math.floor(Math.random() * 1e9));
      if (lv) return { ...local, kind: 'chef', lv, emoji: '🧑‍🍳' };
    }
    return local;
  },

  goldenDue(this: Game): boolean {
    return !this.guideStep() && this.diner.golden !== dayKey() && new Date().getHours() >= goldenHour();
  },

  /** The order board: up to 3 guests waiting for a particular dish (a new one every 20 minutes). */
  refillRequests(this: Game): void {
    const d = this.diner;
    if (this.guideStep()) return; // requests start after the guided first day
    const now = Date.now();
    if (!d.reqAt) d.reqAt = now - REQUEST_EVERY * 2; // two are waiting on the first visit
    const dishes = this.knownDishes();
    let changed = false;
    while (d.requests.length < REQUESTS_MAX && now - d.reqAt >= REQUEST_EVERY && dishes.length) {
      d.reqAt += REQUEST_EVERY;
      const fresh = dishes.filter((r) => !d.requests.some((q) => q.recipe === r.name));
      const short = fresh.filter((r) => r.pattern.length <= 4);
      const pool = short.length && Math.random() < 0.7 ? short : fresh.length ? fresh : dishes;
      const regs = REGULARS.map((_, k) => k).filter((k) => REGULARS[k].level <= this.progress.unlocked);
      const free = regs.filter((k) => !d.requests.some((q) => q.who === k));
      const whoPool = free.length ? free : regs;
      d.requests.push({ recipe: pool[Math.floor(Math.random() * pool.length)].name, who: whoPool[Math.floor(Math.random() * whoPool.length)] ?? 0, at: now });
      changed = true;
    }
    if (d.requests.length >= REQUESTS_MAX) d.reqAt = now; // the clock waits while the board is full
    if (changed) this.progress.persist();
  },

  fillRequest(this: Game, i: number): number {
    const d = this.diner;
    const rq = d.requests[i];
    const rec = RECIPES.find((r) => r.name === rq.recipe);
    d.requests.splice(i, 1);
    const coins = Math.round((rec ? this.priceOf(rec) : 40) * 2 * (this.hasLot('tea') ? 1.1 : 1));
    this.bankCoins(coins);
    this.addIncome(coins);
    this.addHearts(rq.who, 2);
    d.reqFilled++;
    d.week.requests++;
    this.goal('request');
    this.festTokens(2);
    this.addReview('request', { dish: rq.recipe }, REGULARS[rq.who]?.emoji ?? '🙂');
    track('diner_request', { recipe: rq.recipe });
    return coins;
  },

  bestDish(this: Game): Recipe | null {
    const d = this.diner;
    let best: Recipe | null = null;
    for (const [name, n] of Object.entries(d.display)) {
      if (n <= 0) continue;
      const r = RECIPES.find((x) => x.name === name);
      if (r && (!best || this.priceOf(r) > this.priceOf(best))) best = r;
    }
    return best;
  },

  recordSold(this: Game, name: string): void {
    const d = this.diner;
    const before = dishLevel(this.dishServes(name));
    d.display[name] = Math.max(0, (d.display[name] ?? 0) - 1);
    if (!d.display[name]) delete d.display[name];
    d.sold[name] = (d.sold[name] ?? 0) + 1;
    d.soldTotal++;
    d.week.sold[name] = (d.week.sold[name] ?? 0) + 1;
    this.goal('sell');
    if (d.soldTotal % 3 === 0) this.festTokens(1);
    const after = dishLevel(this.dishServes(name));
    const r = RECIPES.find((x) => x.name === name);
    if (after > before && r) this.celebrate(`${DISH_EMOJI[name] ?? '🍣'} ${name.toUpperCase()} LV ${after}!`, `Now sells for ${this.priceOf(r)} coins`, 2);
  },

  /** Tapping a guest: they buy your best plated dish, or the dish they asked for. */
  serveSeat(this: Game, i: number, critic: boolean): void {
    if (critic) {
      this.startCritic();
      return;
    }
    const sg = this.seatGuests[i];
    if (!sg) return;
    const d = this.diner;
    const r = this.rest;
    const rush = this.rushOn();
    const sp = seatPos(this.sceneBox, i, this.sceneGuests().length);
    const tea = this.hasLot('tea') ? 1.1 : 1;
    let coins = 0;
    if (sg.kind === 'golden') {
      this.serveGolden();
    } else if (sg.kind === 'chef') {
      coins = this.serveChefGuest(sg.lv!, sp);
    } else if (sg.kind === 'request') {
      const ri = d.requests.findIndex((q) => q.recipe === sg.req);
      if (ri < 0) {
        this.seatGuests[i] = null;
        return;
      }
      if (!(d.display[sg.req!] > 0)) {
        this.showToast(`${DISH_EMOJI[sg.req!] ?? '🍣'} ${sg.req} isn’t cooked yet. Cook it in the Kitchen, or serve it in a run!`);
        this.restTab = 'kitchen';
        return;
      }
      this.recordSold(sg.req!);
      coins = this.fillRequest(ri);
    } else {
      const dish = this.bestDish();
      if (dish) {
        coins = Math.round(this.priceOf(dish) * sg.type.mult * tea * (rush ? cfg.rushMult : 1));
        this.recordSold(dish.name);
        if (Math.random() < 0.2) this.addReview(dish.pattern.length >= 6 ? 'tall' : 'dish', { dish: dish.name }, sg.emoji);
      } else {
        if (r.served.day !== dayKey()) r.served = { day: dayKey(), n: 0 };
        if (r.served.n >= cfg.guestSnacks) {
          this.showToast('No dishes plated and the snack bar is closed for today. Cook in the Kitchen!');
          return;
        }
        r.served.n++;
        coins = Math.round((6 + this.restTier * 3 + this.popularity() * 2) * sg.type.mult * tea * (rush ? cfg.rushMult : 1));
        if (!this.snackHint) {
          this.snackHint = true;
          this.showToast('Just a snack. Cooked dishes from the Kitchen pay 3× more!');
        }
      }
      this.bankCoins(coins);
      this.addIncome(coins);
      const regs = REGULARS.map((_, k) => k).filter((k) => REGULARS[k].level <= this.progress.unlocked);
      this.addHearts(regs[i % regs.length], this.staffLv('greeter') >= 2 ? 2 : 1);
    }
    d.week.guests++;
    this.goal('guests');
    if (rush) this.rushServe();
    this.seatGuests[i] = null;
    this.guestReady[i] = Date.now() + (rush ? 3000 + Math.random() * 6000 : 25000 + Math.random() * 25000);
    if (coins) this.restFloat(`+${coins} 🪙${rush ? ' 🔥' : ''}`, sp.x, sp.y - 40);
    sfx.coin();
    haptic.light();
    this.progress.persist();
    track('guest_served', { kind: sg.kind });
  },

  rushServe(this: Game): void {
    const d = this.diner;
    if (d.rush.day !== dayKey()) d.rush = { day: dayKey(), n: 0, claimed: [] };
    d.rush.n++;
    this.goal('rush');
    for (const c of RUSH_CHESTS) {
      if (d.rush.n < c.at || d.rush.claimed.includes(c.at)) continue;
      d.rush.claimed.push(c.at);
      const coins = c.coins * (this.hasLot('arcade') ? 2 : 1);
      this.bankCoins(coins);
      this.celebrate('🔥 RUSH CHEST!', `${c.at} guests served in Rush Hour · +${coins} coins${c.piece ? ' · rare tableware' : ''}`, 2.2);
      if (c.piece) this.gainPiece('rush chest');
      if (Math.random() < 0.5) this.addReview('rush', { dish: this.bestDish()?.name }, '🏃');
    }
  },

  serveGolden(this: Game): void {
    const d = this.diner;
    const p = this.progress;
    d.golden = dayKey();
    const prize = goldenPrize();
    let line = '';
    if (prize.kind === 'coins') {
      this.bankCoins(prize.n);
      this.addIncome(prize.n);
      line = `a golden tip of ${prize.n} coins`;
    } else if (prize.kind === 'piece') {
      this.gainPiece('golden guest');
      line = 'a rare piece of tableware';
    } else if (prize.kind === 'track') {
      const id = (Object.keys(TRACKS) as TrackId[]).find((k) => !p.tracks.includes(k));
      if (id) {
        p.tracks.push(id);
        line = `the “${TRACKS[id].name}” music track`;
      } else {
        this.bankCoins(300);
        line = 'a golden tip of 300 coins';
      }
    } else if (prize.kind === 'boosters') {
      const got: string[] = [];
      for (let k = 0; k < prize.n; k++) {
        const b = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
        this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
        got.push(b.name);
      }
      save.setBoosters(this.boosters);
      line = got.join(' + ');
    } else {
      const free = AREAS.flatMap((a) => STYLES[a.id].map((st, k) => ({ a: a.id, k, st }))).find((x) => x.st.unlock && 'coins' in x.st.unlock && !this.rest.ownedStyles.includes(`${x.a}:${x.k}`));
      if (free) {
        this.rest.ownedStyles.push(`${free.a}:${free.k}`);
        line = `the ${free.st.name} decor style`;
      } else {
        this.bankCoins(400);
        line = 'a golden tip of 400 coins';
      }
    }
    this.celebrate('✨ GOLDEN GUEST!', `They left ${line}!`, 2.8);
    this.addReview('golden', {}, '🤩');
    haptic.success();
    track('diner_golden', { kind: prize.kind });
  },

  serveChefGuest(this: Game, lv: number, sp: { x: number; y: number }): number {
    const d = this.diner;
    const c = chefFor(lv);
    const dish = this.bestDish();
    if (dish) this.recordSold(dish.name);
    const coins = Math.min(300, 40 + lv * 2) + (dish ? this.priceOf(dish) : 0);
    this.bankCoins(coins);
    this.addIncome(coins);
    if (d.chefVisits.day !== dayKey()) d.chefVisits = { day: dayKey(), n: 0 };
    d.chefVisits.n++;
    if (!d.chefsHosted.includes(lv)) {
      d.chefsHosted.push(lv);
      d.week.chefs++;
    }
    this.goal('chef');
    const line = chefLine(lv + d.chefsHosted.length, dish?.name ?? 'roll', this.progress.avatar.name);
    this.restSay = { text: `${c.name}: “${line}”`, x: sp.x, y: sp.y - 56, t: 4.5 };
    babble(line, 170 + (lv % 7) * 25);
    const next = GUESTBOOK_GOALS[d.guestbookClaimed];
    if (next && d.chefsHosted.length >= next.n) {
      d.guestbookClaimed++;
      this.bankCoins(next.coins);
      this.celebrate('📖 GUESTBOOK MILESTONE', `${next.n} rival chefs have eaten here · +${next.coins} coins`, 2.4);
    }
    if (Math.random() < 0.5) this.addReview('chef', { name: c.name }, '🧑‍🍳');
    track('diner_chef_guest', { level: lv });
    return coins;
  },

  gainPiece(this: Game, from: string): void {
    const d = this.diner;
    const id = rollPiece();
    if (d.pieces.includes(id)) {
      this.bankCoins(DUPLICATE_COINS);
      this.showToast(`🍶 Duplicate ${pieceName(id)} → +${DUPLICATE_COINS} coins`);
      return;
    }
    const before = setsDone(d.pieces);
    d.pieces.push(id);
    this.progress.persist();
    const set = PIECE_SETS[Number(id.split(':')[0])];
    if (setsDone(d.pieces) > before) this.celebrate(`🏺 ${set.name.toUpperCase()} SET!`, `Set complete · +${Math.round(SET_TIP_BONUS * 100)}% tips forever`, 2.6);
    else this.showToast(`🍶 New tableware: ${pieceName(id)} (from ${from})`);
  },

  buyLot(this: Game, id: LotId): void {
    const lot = LOTS.find((l) => l.id === id)!;
    if (this.hasLot(id)) return;
    const price = Math.round(lot.cost * cfg.costScale);
    if (this.bank < price) return this.showToast(`You need ${price - this.bank} more coins`);
    this.bank -= price;
    save.setCoins(this.bank);
    this.diner.lots.push(id);
    this.progress.persist();
    this.celebrate(`${lot.icon} ${lot.name.toUpperCase()} IS YOURS!`, `+${lot.tips} tips/hour · ${lot.perk}`, 2.6);
    haptic.success();
    track('diner_lot', { id });
  },

  /** The Fish Market sends a delivery once a day. */
  fishDelivery(this: Game): void {
    const d = this.diner;
    if (!this.hasLot('fish') || d.fishDay === dayKey()) return;
    d.fishDay = dayKey();
    const cap = this.pantryCap();
    d.pantry.salmon = Math.min(cap, (d.pantry.salmon ?? 0) + 8);
    d.pantry.tuna = Math.min(cap, (d.pantry.tuna ?? 0) + 8);
    this.showToast('🐟 The Fish Market delivered 8 salmon + 8 tuna');
    this.progress.persist();
  },

  festTokens(this: Game, n: number): void {
    const f = festivalNow();
    if (!f || this.lockedAt('restaurant')) return;
    const d = this.diner;
    if (d.fest.key !== f.key) d.fest = { key: f.key, tokens: 0, items: [], done: false };
    d.fest.tokens += n;
  },

  festBuy(this: Game, i: number): void {
    const f = festivalNow();
    if (!f) return;
    const d = this.diner;
    this.festTokens(0);
    if (d.fest.items.includes(i)) return;
    const cost = Math.round(FEST_COSTS[i] * cfg.festCost);
    if (d.fest.tokens < cost) return this.showToast(`You need ${cost - d.fest.tokens} more ${f.f.icon} tokens: beat chefs, sell dishes and fill requests`);
    d.fest.tokens -= cost;
    d.fest.items.push(i);
    sfx.celebrate();
    if (d.fest.items.length === FEST_COSTS.length && !d.fest.done) {
      d.fest.done = true;
      d.keepsakes.push(f.f.icon);
      this.bankCoins(FEST_COMPLETE_COINS);
      this.celebrate(`${f.f.icon} ${f.f.name.toUpperCase()} COMPLETE!`, `+${FEST_COMPLETE_COINS} coins · ${f.f.icon} keepsake for your restaurant (+2% tips)`, 3);
    } else this.showToast(`${f.f.items[i].emoji} ${f.f.items[i].name} added to your stall!`);
    this.progress.persist();
  },

  /** A chef served in any run: fills a matching request, earns festival tokens, sometimes tableware. */
  dinerServe(this: Game, recipe: string, level: number): void {
    const d = this.diner;
    this.goal('beat');
    this.festTokens(1);
    if (this.lockedAt('restaurant')) return;
    const i = d.requests.findIndex((r) => r.recipe === recipe);
    if (i >= 0) {
      const who = REGULARS[d.requests[i].who];
      const coins = this.fillRequest(i);
      this.runReqs++;
      this.popup(WORLD_W / 2, this.top.y - 124, `📋 ${who?.name ?? 'Guest'}’s request filled! +${coins}`, '#9fe3ff', 14, 2.2);
    }
    if (this.journey && Math.random() < (level % 10 === 0 ? cfg.pieceBoss : cfg.pieceChef)) this.gainPiece(`${chefFor(level).name}`);
  },

  dinerRunEnd(this: Game, fresh: number): void {
    this.catBonus = 0;
    if (this.runMode === 'pnp') return;
    const d = this.diner;
    const layers = Math.max(0, this.height - this.runXpAt);
    this.runXpAt = this.height;
    if (!this.revived) this.goal('run');
    this.festTokens(Math.floor(layers / 10));
    const cat = this.upLv('cat');
    if (cat && fresh > 0) {
      this.catBonus = Math.round(fresh * 0.04 * cat);
      this.bankCoins(this.catBonus);
    }
    // Staff learn from every layer you stack (double with the Bath House).
    const xp = layers * (this.hasLot('bath') ? 2 : 1);
    for (const s of STAFF) {
      if (!this.staffLv(s.id) || !xp) continue;
      const before = staffRank(d.staffXp[s.id] ?? 0);
      d.staffXp[s.id] = (d.staffXp[s.id] ?? 0) + xp;
      const after = staffRank(d.staffXp[s.id]);
      if (after > before) this.showToast(`${s.emoji} ${s.name} is now a ${STAFF_RANKS[after].name}! (+2% tips)`);
    }
    if (this.height >= 30 && !this.lockedAt('restaurant') && Math.random() < 0.35) this.addReview('run', { h: this.height }, '🤩');
  },

  /** Staff cheer you on from the side during a PERFECT streak. */
  staffCheer(this: Game): void {
    const hired = STAFF.filter((s) => this.staffLv(s.id));
    if (!hired.length || settings.reducedMotion) return;
    const s = hired[Math.floor(this.combo / 5) % hired.length];
    this.cheer = { emoji: s.emoji, name: s.name.split(' ').pop() ?? s.name, text: STAFF_CHEERS[(this.combo / 5 + this.height) % STAFF_CHEERS.length], t: 1.8 };
  },

  /** Opening the restaurant: new week, deliveries, requests, rating stars, the report. */
  dinerVisit(this: Game): void {
    this.dinerRollover();
    this.fishDelivery();
    this.checkLetters();
    this.refillRequests();
    this.checkRating();
    this.goalsToday();
    this.festTokens(0);
    const d = this.diner;
    if (!d.introSeen) {
      d.introSeen = true;
      this.storyQueue.push({ ch: { title: 'Grandma’s Kitchen', scene: ['🍳', '🧺', '🍣'], start: [], end: [] }, lines: ['Grandma’s old kitchen is open again!', 'Every layer you stack in a run goes into the pantry. Cook dishes on the burners, then tap guests to serve them.', 'Coins build your dream restaurant: a bigger kitchen, new floors and a whole street.'], end: false });
    }
    if (d.lastWeek && d.reportSeen !== d.lastWeek.key) this.reportOpen = true;
    this.scheduleRush();
    this.progress.persist();
  },

  claimReport(this: Game): void {
    const d = this.diner;
    const w = d.lastWeek;
    this.reportOpen = false;
    if (!w || d.reportSeen === w.key) return;
    d.reportSeen = w.key;
    const coins = weekReward(w);
    this.bankCoins(coins);
    this.gainPiece('weekly report');
    this.celebrate('📊 WEEKLY REPORT', `+${coins} coins and a piece of tableware`, 2.2);
    this.progress.persist();
  },

  shareReport(this: Game): void {
    const w = this.diner.lastWeek;
    if (!w) return;
    const total = w.income.reduce((a, b) => a + b, 0);
    const best = Object.entries(w.sold).sort((a, b) => b[1] - a[1])[0];
    const text = `My Sushi Stack restaurant this week: ${total} coins, ${w.guests} guests${best ? `, best dish ${best[0]}` : ''}. ✪${this.ratingStars()} guide rating!`;
    if (navigator.share) void navigator.share({ title: 'Sushi Stack', text }).catch(() => this.copy(text, 'Report copied!'));
    else this.copy(text, 'Report copied!');
  },

  drawRestBuild(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const { ctx } = this;
    const p = this.progress;
    const rs = p.restaurant;
    this.wrapLeft('Beat chefs to earn ★. Every upgrade brings more guests and bigger tips. Finish all 8 for the next restaurant (+5% coins forever).', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 44;
    AREAS.forEach((a, i) => {
      const lv = rs.levels[i];
      const max = lv >= AREA_MAX;
      const cost = max ? 0 : areaCost(this.restTier, lv + 1);
      const can = !max && p.starPool >= cost;
      this.card(16, y, WORLD_W - 32, 64, can ? 'rgba(70,50,20,0.95)' : 'rgba(48,30,52,0.95)');
      this.dot(46, y + 32, 20, 'rgba(255,255,255,0.08)');
      this.text(a.icon, 46, y + 33, 20, '#fff', 400);
      this.text(a.name, 76, y + 16, 13, '#fff', 700, 'left');
      for (let k = 0; k < AREA_MAX; k++) {
        ctx.fillStyle = k < lv ? '#ffd34d' : 'rgba(255,255,255,0.2)';
        this.roundRect(76 + k * 22, y + 27, 18, 7, 3.5);
        ctx.fill();
      }
      this.fitText(max ? 'Fully upgraded' : `Next: ${a.perks[lv]}`, 76, y + 49, WORLD_W - 216, 10.5, max ? '#8fdc93' : 'rgba(255,255,255,0.7)', 'left');
      if (max) this.text('✓ DONE', WORLD_W - 40, y + 32, 12, '#8fdc93', 700, 'right');
      else this.pill(WORLD_W - 128, y + 16, 96, `★${cost} BUILD`, f, () => this.upgradeArea(i), can ? 'gold' : 'quiet');
      if (i === 0 && !max) this.guideAt('build', WORLD_W - 128, y + 16, 96, 32);
      y += 72;
    });
    return y;
  },

  drawRestDecor(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    this.wrapLeft('Pick a look for every area. Styles show once the area is built.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 24;
    const rs = this.progress.restaurant;
    AREAS.forEach((a, ai) => {
      const cur = this.rest.styles[a.id] ?? 0;
      this.card(16, y, WORLD_W - 32, 84);
      this.text(`${a.icon} ${a.name}`, 30, y + 16, 13, '#fff', 700, 'left');
      if (!rs.levels[ai]) this.text('not built yet', WORLD_W - 30, y + 16, 10, 'rgba(255,255,255,0.5)', 600, 'right');
      const cw = (WORLD_W - 32 - 28 - 12) / 3;
      STYLES[a.id].forEach((st, i) => {
        const cx2 = 30 + i * (cw + 6);
        const own = this.styleOwned(a.id, i);
        const on = cur === i;
        this.ctx.fillStyle = on ? 'rgba(255,211,77,0.25)' : 'rgba(255,255,255,0.07)';
        this.roundRect(cx2, y + 30, cw, 44, 10);
        this.ctx.fill();
        if (on) {
          this.ctx.strokeStyle = '#ffd34d';
          this.ctx.lineWidth = 2;
          this.roundRect(cx2, y + 30, cw, 44, 10);
          this.ctx.stroke();
        }
        this.fitText(st.name, cx2 + cw / 2, y + 44, cw - 8, 11, '#fff', 'center', 700);
        this.fitText(on ? '✓ in use' : own ? 'tap to use' : `🔒 ${styleText(st.unlock)}`, cx2 + cw / 2, y + 61, cw - 8, 9.5, on ? '#8fdc93' : own ? 'rgba(255,255,255,0.7)' : '#ffd34d', 'center', 600);
        this.listTap(cx2, y + 30, cw, 44, f, () => this.tapStyle(a.id, i));
      });
      y += 92;
    });
    return y;
  },

  drawRestStaff(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    this.wrapLeft('Hire staff with coins. They learn from every layer you stack (+2% tips per rank) and cheer on your PERFECT streaks.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 24;
    for (const s of STAFF) {
      const lv = this.staffLv(s.id);
      this.card(16, y, WORLD_W - 32, 76, lv ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.dot(48, y + 38, 24, 'rgba(255,255,255,0.08)');
      this.text(s.emoji, 48, y + 39, 26, '#fff', 400);
      this.text(s.name, 82, y + 18, 13.5, '#fff', 700, 'left');
      for (let k = 0; k < 3; k++) this.dot(86 + k * 14, y + 34, 4.5, k < lv ? '#ffd34d' : 'rgba(255,255,255,0.2)');
      if (lv) {
        // Experience from your runs: every layer you stack teaches them something.
        const xp = this.diner.staffXp[s.id] ?? 0;
        const rk = staffRank(xp);
        const nx = STAFF_RANKS[rk + 1];
        this.fitText(`${'⭐'.repeat(rk) || '•'} ${STAFF_RANKS[rk].name}${nx ? ` · ${xp}/${nx.xp} xp` : ' · max'}`, 128, y + 34, WORLD_W - 270, 9.5, '#ffd34d', 'left', 700);
      }
      this.fitText(lv ? `Now: ${s.perks[lv - 1]}` : `Hire: ${s.perks[0]}`, 82, y + 50, WORLD_W - 220, 10.5, lv ? '#8fdc93' : 'rgba(255,255,255,0.75)', 'left');
      if (lv && lv < 3) this.fitText(`Next: ${s.perks[lv]}`, 82, y + 65, WORLD_W - 220, 10, 'rgba(255,255,255,0.6)', 'left');
      if (lv >= 3) this.text('★ MAX', WORLD_W - 40, y + 38, 12, '#ffd34d', 700, 'right');
      else this.pill(WORLD_W - 132, y + 22, 100, `${lv ? 'TRAIN' : 'HIRE'} ${s.costs[lv]}`, f, () => this.hireStaff(s.id), this.bank >= s.costs[lv] ? 'gold' : 'quiet');
      y += 84;
    }
    return y;
  },

  drawRestMenu(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const r = this.rest;
    const today = r.menu.day === dayKey() ? r.menu.recipe : '';
    this.wrapLeft('Choose today’s special (2x coins in runs, +20% tips). Every dish levels up as you serve it in runs and sell it: higher levels sell for more.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 44;
    for (const rec of RECIPES.filter((r) => !r.secret || this.progress.secrets.includes(r.name))) {
      const open = (rec.level ?? 0) <= this.progress.unlocked;
      const on = today === rec.name;
      this.card(16, y, WORLD_W - 32, 50, on ? 'rgba(70,50,20,0.95)' : open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.text(open ? DISH_EMOJI[rec.name] ?? '🍣' : '🔒', 40, y + 25, 20, '#fff', 400);
      this.text(rec.name, 64, y + 17, 13, open ? '#fff' : 'rgba(255,255,255,0.45)', 700, 'left');
      rec.pattern.slice(0, 6).forEach((k, i) => {
        this.ctx.fillStyle = this.color(k);
        this.roundRect(64 + i * 18, y + 30, 14, 8, 3);
        this.ctx.fill();
      });
      if (open) {
        // Dish level: serves in runs and plates sold raise its price.
        const sv = this.dishServes(rec.name);
        const nx = dishNext(sv);
        this.fitText(`Lv ${dishLevel(sv)} · ${this.priceOf(rec)}🪙${nx ? ` · ${nx - sv} to Lv ${dishLevel(sv) + 1}` : ' · MAX'}`, 64 + Math.min(6, rec.pattern.length) * 18 + 4, y + 34, WORLD_W - 130 - (64 + Math.min(6, rec.pattern.length) * 18), 9.5, '#ffd34d', 'left', 700);
      }
      if (!open) this.text(`level ${rec.level}`, WORLD_W - 32, y + 25, 11, 'rgba(255,255,255,0.5)', 600, 'right');
      else if (on) this.text('✓ TODAY', WORLD_W - 32, y + 25, 12, '#8fdc93', 700, 'right');
      else this.pill(WORLD_W - 108, y + 9, 76, 'SERVE', f, () => this.setMenu(rec.name), 'quiet');
      y += 56;
    }
    return y;
  },

  drawRestThemes(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const r = this.rest;
    this.wrapLeft('Seasonal makeovers. Each season’s theme is free to claim while it’s on.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 24;
    const cw = (WORLD_W - 32 - 10) / 2;
    REST_THEMES.forEach((th, i) => {
      const x = 16 + (i % 2) * (cw + 10);
      const yy = y + Math.floor(i / 2) * 118;
      const own = r.ownedThemes.includes(th.id) || (th.id === 'imperial' && this.restPass);
      const on = r.theme === th.id;
      const g = this.ctx.createLinearGradient(0, yy, 0, yy + 108);
      g.addColorStop(0, th.wall);
      g.addColorStop(0.7, th.wall2);
      g.addColorStop(0.71, th.floor);
      g.addColorStop(1, th.floor2);
      this.ctx.fillStyle = g;
      this.roundRect(x, yy, cw, 108, 14);
      this.ctx.fill();
      if (on) {
        this.ctx.strokeStyle = '#ffd34d';
        this.ctx.lineWidth = 3;
        this.roundRect(x, yy, cw, 108, 14);
        this.ctx.stroke();
      }
      this.text(th.icon, x + cw / 2, yy + 34, 30, '#fff', 400);
      this.ctx.fillStyle = 'rgba(20,10,25,0.75)';
      this.roundRect(x + 6, yy + 60, cw - 12, 42, 10);
      this.ctx.fill();
      this.fitText(th.name, x + cw / 2, yy + 73, cw - 20, 12, '#fff', 'center', 700);
      const status = on ? '✓ in use' : own ? 'tap to use' : th.id === 'imperial' ? '👑 Restaurant Pass' : themeInSeason(th) ? '🎁 FREE this season' : `${th.price} coins`;
      this.fitText(status, x + cw / 2, yy + 90, cw - 20, 10, on ? '#8fdc93' : themeInSeason(th) && !own ? '#ffd34d' : 'rgba(255,255,255,0.75)', 'center', 700);
      this.listTap(x, yy, cw, 108, f, () => this.tapTheme(th));
    });
    return y + Math.ceil(REST_THEMES.length / 2) * 118;
  },

  upgradeArea(this: Game, i: number): void {
    const p = this.progress;
    const rs = p.restaurant;
    const tier = rs.r + rs.michelin;
    const lv = rs.levels[i];
    if (lv >= AREA_MAX) return;
    const cost = areaCost(tier, lv + 1);
    if (p.starPool < cost) {
      this.showToast(`You need ${cost - p.starPool} more stars. Beat chefs with better stars!`);
      return;
    }
    p.starPool -= cost;
    rs.levels[i]++;
    this.bankCoins(30 * rs.levels[i]);
    this.upgradeFx = { i, t: 0 };
    this.celebrate(`${AREAS[i].icon} ${AREAS[i].name.toUpperCase()} LV ${rs.levels[i]}`, `${AREAS[i].perks[rs.levels[i] - 1]} · +${30 * rs.levels[i]} coins`, 1.8);
    sfx.serve();
    haptic.success();
    track('restaurant_upgrade', { area: AREAS[i].id, level: rs.levels[i], tier });
    if (rs.levels.every((l) => l >= AREA_MAX)) {
      const R = RESTAURANTS[Math.min(rs.r, RESTAURANTS.length - 1)];
      this.bankCoins(500);
      if (rs.r < RESTAURANTS.length - 1) {
        this.unlockExclusive(R.reward.cat, R.reward.id, R.reward.name);
        this.celebrate(`${R.name} COMPLETE!`, `+500 coins · ${R.reward.name} · next: ${RESTAURANTS[rs.r + 1].name}`);
        rs.r++;
      } else {
        if (!rs.michelin) this.unlockExclusive(R.reward.cat, R.reward.id, R.reward.name);
        rs.michelin++;
        this.celebrate(`MICHELIN STAR ${rs.michelin}!`, '+500 coins · renovate again for the next star');
      }
      rs.levels = AREAS.map(() => 0);
    }
    p.persist();
  },

  passClaimable(this: Game): number {
    const p = this.progress.pass;
    if (p.season !== currentSeason().n) return 0;
    const reached = Math.min(PASS_TIERS, Math.floor(p.xp / PASS_XP));
    let n = 0;
    for (let i = 0; i < reached; i++) {
      if (!p.free.includes(i)) n++;
      if (p.premium && !p.prem.includes(i)) n++;
    }
    return n;
  },

  drawPass(this: Game): void {
    this.addXp(0); // makes sure the pass is on the current season
    const p = this.progress.pass;
    const season = currentSeason();
    const reached = Math.min(PASS_TIERS, Math.floor(p.xp / PASS_XP));
    const th = season.theme;
    const f = this.screenBegin(`${th.icon} ${th.name.toUpperCase()}`, `Sushi Pass season ${season.n} · ${timeLeft(season.end)} · XP from chefs, missions, PERFECTs`);
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 74, 'rgba(60,20,80,0.95)');
    this.ctx.fillStyle = th.color;
    this.roundRect(16, y, 8, 74, 4);
    this.ctx.fill();
    this.text(th.icon, WORLD_W - 46, y + 62, 18, '#fff', 400);
    this.text(`Tier ${reached}/${PASS_TIERS}`, 32, y + 22, 16, '#fff', 900, 'left');
    this.text(reached >= PASS_TIERS ? 'Season complete!' : `${p.xp % PASS_XP}/${PASS_XP} XP to tier ${reached + 1}`, WORLD_W - 32, y + 22, 11, '#e0aaff', 700, 'right');
    this.bar(32, y + 38, WORLD_W - 64, reached >= PASS_TIERS ? 1 : (p.xp % PASS_XP) / PASS_XP, '#e0aaff', 9);
    this.text(p.premium ? '✓ Premium track unlocked' : `Premium: more rewards + ${th.prize} · ${PRODUCTS.pass.price}`, 32, y + 62, 11, p.premium ? '#8fdc93' : '#ffd34d', 800, 'left');
    if (!p.premium) this.listTap(16, y, WORLD_W - 32, 74, f, () => this.buy('pass'));
    y += 84;
    this.text('FREE', 120, y + 8, 11, 'rgba(255,255,255,0.7)', 900);
    this.text('PREMIUM', 290, y + 8, 11, '#e0aaff', 900);
    y += 18;
    for (let i = 0; i < PASS_TIERS; i++) {
      const got = i < reached;
      this.card(16, y, WORLD_W - 32, 54, got ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.85)');
      this.ctx.fillStyle = got ? '#ffd34d' : 'rgba(255,255,255,0.2)';
      this.ctx.beginPath();
      this.ctx.arc(38, y + 27, 15, 0, Math.PI * 2);
      this.ctx.fill();
      this.text(String(i + 1), 38, y + 28, 12, got ? '#4a2a00' : '#fff', 900);
      for (const prem of [false, true]) {
        const r = passReward(i, prem, season.n);
        const cx = prem ? 290 : 120;
        const claimed = (prem ? p.prem : p.free).includes(i);
        const can = got && !claimed && (!prem || p.premium);
        this.text(r.label, cx, y + 18, 11, prem && !p.premium ? 'rgba(224,170,255,0.6)' : '#fff', 700);
        if (claimed) this.text('✓ claimed', cx, y + 38, 10, '#8fdc93', 800);
        else if (can) this.pill(cx - 40, y + 26, 80, 'CLAIM', f, () => { (prem ? p.prem : p.free).push(i); this.giveReward(r); this.progress.persist(); }, 'gold');
        else this.text(prem && !p.premium ? '🔒 premium' : 'locked', cx, y + 38, 10, 'rgba(255,255,255,0.4)', 700);
      }
      y += 60;
    }
    this.screenEnd(f, y - f.y0);
  },

  drawPets(this: Game): void {
    const p = this.progress;
    const slots = p.rank >= 10 ? 2 : 1;
    const f = this.screenBegin('COMPANIONS', `${slots} slot${slots > 1 ? 's' : ''} · 2 slots at Chef Rank 10 · shards from chests, Pass and Crew`);
    let y = f.y0 + 4;
    for (const c of COMPANIONS) {
      const shards = p.shards[c.id] ?? 0;
      const lv = companionLevel(shards);
      const next = shardsForNext(shards);
      const on = p.companions.includes(c.id);
      this.card(16, y, WORLD_W - 32, 92, on ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(c.emoji, 52, y + 46, 40, '#fff', 400);
      this.text(`${c.name}  ${lv ? `Lv ${lv}` : '🔒'}`, 92, y + 20, 15, '#fff', 900, 'left');
      this.text(lv ? c.power(lv) : `Unlock: ${c.power(1)}`, 92, y + 40, 11, 'rgba(255,255,255,0.8)', 600, 'left');
      if (next) {
        this.bar(92, y + 56, 150, next.have / next.need, '#ffd34d');
        this.text(`${next.have}/${next.need} shards`, 92, y + 76, 10.5, 'rgba(255,255,255,0.7)', 700, 'left');
      } else this.text('MAX LEVEL', 92, y + 64, 11, '#ffd34d', 900, 'left');
      if (lv) {
        this.pill(WORLD_W - 116, y + 30, 86, on ? 'EQUIPPED' : 'EQUIP', f, () => {
          if (on) p.companions = p.companions.filter((x) => x !== c.id);
          else p.companions = [...p.companions, c.id].slice(-slots);
          p.persist();
        }, on ? 'quiet' : 'gold');
      }
      y += 100;
    }
    this.screenEnd(f, y - f.y0);
  },

  /** Queues a chapter's opening or ending, once ever (re-readable from the Story screen). */
  queueStory(this: Game, ch: number, end: boolean): void {
    const chapter = ch < CHAPTERS.length ? CHAPTERS[ch] : ch === CHAPTERS.length && !end ? ENDLESS_CHAPTER : null;
    const key = `story:${ch}:${end ? 'end' : 'start'}`;
    if (!chapter || this.progress.seen.includes(key)) return;
    this.progress.seen.push(key);
    this.progress.persist();
    // Earlier choices change how the next chapters begin.
    const echo = end ? [] : CHOICES.filter((c) => c.afterChapter < ch && this.progress.choices[c.id]).slice(-1).map((c) => c.options.find((o) => o.id === this.progress.choices[c.id])!.line);
    this.storyQueue.push({ ch: chapter, lines: end ? chapter.end : [...chapter.start, ...echo], end });
    // The end of chapters 2 and 3 asks you to choose a side.
    const pick = end ? CHOICES.find((c) => c.afterChapter === ch && !this.progress.choices[c.id]) : undefined;
    if (pick) this.storyQueue.push({ ch: { title: pick.title, scene: ['🤔', '⚖️', '🍣'], start: [], end: [] }, lines: [pick.question], end: false, choice: pick.id });
  },

  /** Story panel: a little comic frame with the scene, the player's chef and the chapter text. */
  drawStoryCard(this: Game, blocker: () => void): void {
    const { ctx } = this;
    const st = this.story!;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    ctx.fillStyle = 'rgba(12,6,18,0.9)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    const y = midY - 220;
    this.card(24, y, WORLD_W - 48, 420, '#fff8eb');
    // Scene panel.
    const g = ctx.createLinearGradient(0, y + 14, 0, y + 184);
    g.addColorStop(0, st.end ? '#ffd27a' : '#7fc8ff');
    g.addColorStop(1, st.end ? '#ff8a5b' : '#c9a7ff');
    ctx.fillStyle = g;
    this.roundRect(38, y + 14, WORLD_W - 76, 170, 12);
    ctx.fill();
    ctx.save();
    this.roundRect(38, y + 14, WORLD_W - 76, 170, 12);
    ctx.clip();
    const scene = st.ch.scene;
    scene.forEach((e, i) => this.text(e, 236 + (i - (scene.length - 1) / 2) * 64, y + 76 + Math.sin(this.time * 2 + i) * 4, 40, '#fff', 400));
    drawChef(ctx, avatarChef(this.progress.avatar), 92, y + 150, 0.8, st.end ? 'happy' : 'focused', 200, y + 70, this.time);
    ctx.restore();
    ctx.strokeStyle = '#4a2618';
    ctx.lineWidth = 3;
    this.roundRect(38, y + 14, WORLD_W - 76, 170, 12);
    ctx.stroke();
    this.fitText(st.ch.title.toUpperCase(), cx, y + 212, WORLD_W - 80, 17, '#c4501f', 'center', 700);
    if (st.end) this.text('CHAPTER COMPLETE', cx, y + 234, 11, '#2a9d5c', 700);
    let ty = y + 262;
    for (const line of st.lines) ty = this.wrapText(line, cx, ty, WORLD_W - 90, 14, '#4a2618') + 6;
    const choice = st.choice ? CHOICES.find((c) => c.id === st.choice) : undefined;
    if (choice) {
      // Two sides to choose from, each with what it changes.
      choice.options.forEach((o, i) => {
        const by = y + 300 + i * 56;
        ctx.fillStyle = i ? '#4cc9f0' : '#ff8a5b';
        this.roundRect(40, by, WORLD_W - 80, 50, 14);
        ctx.fill();
        this.fitText(o.label, cx, by + 18, WORLD_W - 100, 14, '#fff', 'center', 700);
        this.fitText(o.effect, cx, by + 36, WORLD_W - 100, 10.5, 'rgba(255,255,255,0.92)', 'center', 600);
        this.buttons.push({ x: 40, y: by, w: WORLD_W - 80, h: 50, onTap: () => this.choose(choice.id, o.id), label: `${o.label}: ${o.effect}` });
      });
      return;
    }
    this.button(cx - 90, y + 356, 180, 46, st.end ? 'ONWARD!' : 'LET’S COOK!', () => { this.story = null; }, 'gold');
  },

  drawStory(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('STORY', 'A new chapter every 10 levels');
    let y = f.y0 + 4;
    [...CHAPTERS, ENDLESS_CHAPTER].forEach((ch, i) => {
      const open = p.unlocked > i * 10;
      const done = i < CHAPTERS.length && p.unlocked > (i + 1) * 10;
      this.card(16, y, WORLD_W - 32, 76, open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.text(open ? ch.scene[0] : '🔒', 48, y + 38, 28, '#fff', 400);
      this.fitText(ch.title, 80, y + 22, WORLD_W - 190, 14, open ? '#fff' : 'rgba(255,255,255,0.5)', 'left', 700);
      this.fitText(open ? ch.start[0] : `Reach level ${i * 10 + 1}`, 80, y + 44, WORLD_W - 190, 11, 'rgba(255,255,255,0.7)', 'left');
      this.text(done ? '✓ Complete' : open ? 'In progress' : '', 80, y + 62, 10.5, done ? '#8fdc93' : '#ffd34d', 700, 'left');
      if (open) this.pill(WORLD_W - 100, y + 22, 70, 'READ', f, () => { this.story = { ch, lines: done ? [...ch.start, ...ch.end] : ch.start, end: done }; }, 'quiet');
      y += 84;
    });
    this.screenEnd(f, y - f.y0);
  },

  addHearts(this: Game, who: number, n: number): void {
    const r = REGULARS[who];
    const p = this.progress;
    const before = heartLevel(p.hearts[r.id] ?? 0);
    p.hearts[r.id] = (p.hearts[r.id] ?? 0) + n;
    const after = heartLevel(p.hearts[r.id]);
    if (after > before) {
      this.bankCoins(HEART_REWARDS[after]);
      this.showToast(`${r.emoji} ${r.name} is now your ${HEART_TITLES[after]}! +${HEART_REWARDS[after]}`);
    }
    p.persist();
  },

  drawRegulars(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('REGULARS', 'Serve them to earn hearts · friends make special requests');
    let y = f.y0 + 4;
    for (const r of REGULARS) {
      const open = r.level <= p.unlocked;
      const h = p.hearts[r.id] ?? 0;
      const lv = heartLevel(h);
      this.card(16, y, WORLD_W - 32, 96, open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.dot(52, y + 40, 26, open ? 'rgba(255,143,184,0.25)' : 'rgba(255,255,255,0.08)');
      this.text(open ? r.emoji : '❔', 52, y + 41, 30, '#fff', 400);
      if (!open) {
        this.text('Someone new', 92, y + 26, 14, 'rgba(255,255,255,0.6)', 700, 'left');
        this.text(`Starts visiting at level ${r.level}`, 92, y + 48, 11, 'rgba(255,255,255,0.5)', 600, 'left');
        y += 104;
        continue;
      }
      this.fitText(r.name, 92, y + 20, 150, 14, '#fff', 'left', 700);
      this.text(`${'♥'.repeat(lv)}${'♡'.repeat(HEART_LEVELS.length - 1 - lv)}`, WORLD_W - 32, y + 20, 13, '#ff5d8f', 700, 'right');
      this.fitText(`${HEART_TITLES[lv]} · loves ${r.favorite}`, 92, y + 40, WORLD_W - 140, 11, '#ffd34d', 'left', 700);
      this.fitText(`“${r.lines[lv]}”`, 92, y + 58, WORLD_W - 140, 11, 'rgba(255,255,255,0.8)', 'left');
      const next = HEART_LEVELS[lv + 1];
      if (next) {
        const prev = HEART_LEVELS[lv];
        this.bar(92, y + 74, WORLD_W - 190, (h - prev) / (next - prev), '#ff5d8f');
        this.text(`${h}/${next} · +${HEART_REWARDS[lv + 1]}`, WORLD_W - 32, y + 77.5, 10, 'rgba(255,255,255,0.7)', 700, 'right');
      } else this.text('Family forever ♥', 92, y + 78, 11, '#ff8fb8', 700, 'left');
      y += 104;
    }
    this.screenEnd(f, y - f.y0);
  },

  achValue(this: Game, id: StatId): number {
    const p = this.progress;
    switch (id) {
      case 'level': return p.unlocked;
      case 'stars': return p.totalStars;
      case 'rank': return p.rank;
      case 'height': return Math.max(p.stats.height ?? 0, this.best);
      case 'puzzles': return p.puzzleStars.reduce((a, b) => a + (b || 0), 0);
      case 'hearts': return Object.values(p.hearts).reduce((a, b) => a + b, 0);
      case 'pictures': return p.gallery.done.length;
      default: return p.stats[id] ?? 0;
    }
  },

  /** Announces newly reached achievement tiers (rewards are claimed on the Achievements screen). */
  checkAchievements(this: Game): void {
    const p = this.progress;
    let changed = false;
    for (const fam of ACHIEVEMENTS) {
      const t = achTier(fam, this.achValue(fam.id));
      const seen = p.achSeen[fam.id] ?? 0;
      if (t > seen) {
        // Achievements already earned before this update are granted quietly.
        if (p.seen.includes('ach:ready')) this.showToast(`🏆 ${fam.name} ${ACH_TIER_NAMES[t - 1]} unlocked!`);
        p.achSeen[fam.id] = t;
        changed = true;
      }
    }
    if (!p.seen.includes('ach:ready')) {
      p.seen.push('ach:ready');
      changed = true;
    }
    if (changed) p.persist();
  },

  achClaimable(this: Game): number {
    const p = this.progress;
    return ACHIEVEMENTS.reduce((n, fam) => n + Math.max(0, (p.achSeen[fam.id] ?? 0) - (p.achClaimed[fam.id] ?? 0)), 0);
  },

  drawTrophies(this: Game): void {
    const p = this.progress;
    const total = ACHIEVEMENTS.reduce((n, fam) => n + (p.achSeen[fam.id] ?? 0), 0);
    const f = this.screenBegin('ACHIEVEMENTS', `${total}/${ACHIEVEMENTS.length * 4} unlocked · claim coins for each tier`);
    let y = f.y0 + 4;
    for (const fam of ACHIEVEMENTS) {
      const v = this.achValue(fam.id);
      const tier = p.achSeen[fam.id] ?? 0;
      const claimed = p.achClaimed[fam.id] ?? 0;
      const next = fam.tiers[tier];
      this.card(16, y, WORLD_W - 32, 74, tier >= 4 ? 'rgba(90,70,20,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(fam.icon, 46, y + 30, 26, '#fff', 400);
      // Tier pips under the icon.
      for (let k = 0; k < 4; k++) this.dot(31 + k * 10, y + 58, 3.5, k < tier ? '#ffd34d' : 'rgba(255,255,255,0.2)');
      this.text(`${fam.name} ${tier ? ACH_TIER_NAMES[tier - 1] : ''}`, 80, y + 20, 14, '#fff', 700, 'left');
      this.fitText(next ? fam.desc(next) : 'All tiers complete!', 80, y + 40, 180, 11, 'rgba(255,255,255,0.75)', 'left');
      if (next) this.bar(80, y + 54, 170, v / next, '#ffd34d');
      if (claimed < tier) {
        const reward = ACH_REWARDS.slice(claimed, tier).reduce((a, b) => a + b, 0);
        this.pill(WORLD_W - 112, y + 21, 82, `+${reward}`, f, () => {
          p.achClaimed[fam.id] = tier;
          p.persist();
          this.bankCoins(reward);
          this.showToast(`${fam.icon} ${fam.name}: +${reward} coins`);
          sfx.coin();
        }, 'gold');
      } else this.text(next ? `${Math.min(v, next).toLocaleString('en')}/${next.toLocaleString('en')}` : '★★★★', WORLD_W - 32, y + 38, 11, 'rgba(255,255,255,0.7)', 700, 'right');
      y += 82;
    }
    this.screenEnd(f, y - f.y0);
  },

  /** Every few PERFECTs reveal a tile of the current picture; a full picture pays out. */
  galleryPerfect(this: Game): void {
    const g = this.progress.gallery;
    if (g.pic >= PICTURES.length) return;
    if (++g.perfects < PERFECTS_PER_TILE) return;
    g.perfects = 0;
    const hidden = [...Array(GALLERY_TILES).keys()].filter((i) => !g.tiles.includes(i));
    g.tiles.push(hidden[Math.floor(Math.random() * hidden.length)]);
    if (this.mode === 'playing') this.popup(WORLD_W / 2, this.top.y - 92, `🖼️ Picture tile ${g.tiles.length}/${GALLERY_TILES}`, '#9fe3ff', 13, 1.4);
    if (g.tiles.length >= GALLERY_TILES) {
      g.done.push(g.pic);
      this.bankCoins(PICTURE_REWARD);
      this.celebrate(`🖼️ ${PICTURES[g.pic].name.toUpperCase()}`, `Picture complete! +${PICTURE_REWARD} coins`);
      g.pic++;
      g.tiles = [];
    }
    this.progress.persist();
  },

  /** Draws a gallery picture; tiles not in `shown` are covered (null shows everything). */
  drawPicture(this: Game, pic: Picture, x: number, y: number, size: number, shown: number[] | null): void {
    const { ctx } = this;
    ctx.save();
    this.roundRect(x, y, size, size, 12);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + size);
    g.addColorStop(0, pic.sky[0]);
    g.addColorStop(1, pic.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
    for (const [e, ex, ey, es] of pic.items) {
      ctx.font = `${size * es}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e, x + ex * size, y + ey * size);
    }
    if (shown) {
      const t = size / 4;
      for (let i = 0; i < GALLERY_TILES; i++) {
        if (shown.includes(i)) continue;
        const tx = x + (i % 4) * t;
        const ty = y + Math.floor(i / 4) * t;
        ctx.fillStyle = (i + Math.floor(i / 4)) % 2 ? '#3a2a45' : '#33243d';
        ctx.fillRect(tx, ty, t, t);
        this.text('?', tx + t / 2, ty + t / 2, t * 0.35, 'rgba(255,255,255,0.25)', 700);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * t, y);
        ctx.lineTo(x + k * t, y + size);
        ctx.moveTo(x, y + k * t);
        ctx.lineTo(x + size, y + k * t);
        ctx.stroke();
      }
    }
    ctx.restore();
  },

  drawGallery(this: Game): void {
    const g = this.progress.gallery;
    const f = this.screenBegin('GALLERY', `${g.done.length}/${PICTURES.length} pictures · every ${PERFECTS_PER_TILE} PERFECTs reveal a tile`);
    let y = f.y0 + 4;
    if (g.pic < PICTURES.length) {
      const pic = PICTURES[g.pic];
      this.card(16, y, WORLD_W - 32, 330);
      this.text(`NOW REVEALING · ${pic.name}`, WORLD_W / 2, y + 20, 13, '#ffd34d', 700);
      this.drawPicture(pic, WORLD_W / 2 - 130, y + 38, 260, g.tiles);
      this.text(`${g.tiles.length}/${GALLERY_TILES} tiles · next tile in ${PERFECTS_PER_TILE - g.perfects} PERFECT${PERFECTS_PER_TILE - g.perfects === 1 ? '' : 's'} · +${PICTURE_REWARD} when done`, WORLD_W / 2, y + 314, 11, 'rgba(255,255,255,0.8)', 700);
      y += 342;
    } else {
      this.card(16, y, WORLD_W - 32, 60);
      this.text('Gallery complete! You’re a true art lover.', WORLD_W / 2, y + 30, 13, '#ffd34d', 700);
      y += 72;
    }
    this.text('COLLECTION', 24, y + 8, 12, 'rgba(255,255,255,0.7)', 700, 'left');
    y += 20;
    const cw = (WORLD_W - 32 - 16) / 3;
    PICTURES.forEach((pic, i) => {
      const x = 16 + (i % 3) * (cw + 8);
      const yy = y + Math.floor(i / 3) * (cw + 30);
      const done = g.done.includes(i);
      if (done) this.drawPicture(pic, x, yy, cw, null);
      else {
        this.card(x, yy, cw, cw, 'rgba(255,255,255,0.06)');
        this.text(i === g.pic ? '🖌️' : '🔒', x + cw / 2, yy + cw / 2, 24, '#fff', 400);
      }
      this.fitText(done || i === g.pic ? pic.name : '???', x + cw / 2, yy + cw + 12, cw, 11, done ? '#fff' : 'rgba(255,255,255,0.5)', 'center', 700);
    });
    y += Math.ceil(PICTURES.length / 3) * (cw + 30);
    this.screenEnd(f, y - f.y0);
  },

  drawAvatar(this: Game): void {
    const p = this.progress;
    const a = p.avatar;
    const f = this.screenBegin('MY CHEF', 'Your chef appears on the home screen, story and share cards');
    const { ctx } = this;
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 200, 'rgba(255,248,235,0.95)');
    ctx.save();
    this.roundRect(16, y, WORLD_W - 32, 200, 14);
    ctx.clip();
    drawChef(ctx, avatarChef(a), WORLD_W / 2, y + 100, 1.15, 'happy', WORLD_W / 2, y + 240, this.time);
    ctx.restore();
    y += 210;
    this.text(`Chef ${a.name}`, WORLD_W / 2, y + 14, 20, '#fff', 700);
    y += 32;
    const o = AVATAR_OPTIONS;
    type Key = Exclude<keyof Avatar, 'name'>;
    const rows: [string, Key, number, (i: number) => string][] = [
      ['Skin', 'skin', o.skin.length, (i) => `Tone ${i + 1}`],
      ['Hair', 'hair', o.hair.length, (i) => AVATAR_LABELS.hair[i]],
      ['Hair colour', 'hairColor', o.hairColor.length, (i) => `Colour ${i + 1}`],
      ['Hat', 'hat', o.hat.length, (i) => AVATAR_LABELS.hat[i]],
      ['Outfit', 'outfit', o.outfit.length, (i) => `Style ${i + 1}`],
      ['Accent', 'accent', o.accent.length, (i) => `Colour ${i + 1}`],
      ['Face', 'face', o.face.length, (i) => AVATAR_LABELS.face[i]],
    ];
    const hatOpen = (i: number) => !AVATAR_LOCKS[i] || p.unlocked >= AVATAR_LOCKS[i].level;
    const row = (label: string, value: string, swatch: string | null, step: (d: number) => void) => {
      this.card(16, y, WORLD_W - 32, 46);
      this.text(label, 30, y + 23, 13, 'rgba(255,255,255,0.8)', 700, 'left');
      if (swatch) this.dot(196, y + 23, 9, swatch);
      this.fitText(value, 268, y + 23, 108, 13, '#fff', 'center', 700);
      this.pill(150, y + 7, 30, '◀', f, () => step(-1), 'quiet');
      this.pill(WORLD_W - 46, y + 7, 30, '▶', f, () => step(1), 'quiet');
      y += 52;
    };
    row('Name', a.name, null, (d) => { a.name = NAMES[(NAMES.indexOf(a.name) + d + NAMES.length) % NAMES.length]; p.persist(); });
    for (const [label, key, n, name] of rows) {
      const list = (o as unknown as Record<string, string[]>)[key];
      const isColor = list[0].startsWith('#');
      const locked = key === 'hat' && !hatOpen(a.hat);
      row(label, locked ? `🔒 ${name(a[key])}` : name(a[key]), isColor ? list[a[key]] : null, (d) => { a[key] = (a[key] + d + n) % n; p.persist(); });
      if (locked) {
        this.text(AVATAR_LOCKS[a.hat].text, WORLD_W / 2, y - 2, 10, '#ffd34d', 700);
        y += 12;
      }
    }
    this.pill(16, y + 4, (WORLD_W - 40) / 2, '🎲 RANDOM', f, () => {
      const r = (n: number) => Math.floor(Math.random() * n);
      let hat = r(o.hat.length);
      while (!hatOpen(hat)) hat = r(o.hat.length);
      Object.assign(a, { name: NAMES[r(NAMES.length)], skin: r(o.skin.length), hair: r(o.hair.length), hairColor: r(o.hairColor.length), hat, outfit: r(o.outfit.length), accent: r(o.accent.length), face: r(o.face.length) });
      p.persist();
    }, 'quiet');
    this.pill(24 + (WORLD_W - 40) / 2, y + 4, (WORLD_W - 40) / 2, 'DONE', f, () => { if (!hatOpen(a.hat)) a.hat = 0; p.persist(); this.mode = this.screenBack; }, 'gold');
    y += 44;
    this.screenEnd(f, y - f.y0);
  },

  updateIntro(this: Game, real: number): void {
    const it = this.intro!;
    it.prev = it.t;
    it.t += real;
    const cross = (a: number) => it.prev < a && it.t >= a;
    if (it.stage === 'logo') {
      for (let i = 0; i < 5; i++) if (cross(0.34 + i * 0.13)) { sfx.drop(); haptic.light(); }
      if (cross(0.85)) sfx.whoosh();
      if (cross(1.35)) sfx.sting();
      const end = settings.reducedMotion ? 0.9 : it.full ? LOGO_TIME + 0.5 : LOGO_SHORT;
      if (it.t >= end) this.advanceIntro();
    } else {
      if (it.panel === 1) {
        if (cross(0.2)) sfx.shutter();
        for (let i = 0; i < 4; i++) if (cross(1.0 + i * 0.22)) sfx.light(i);
        if (cross(1.6)) sfx.serve();
      }
      if (it.panel === 2 && cross(0.45)) { sfx.slice(); haptic.medium(); }
      if (it.panel < 2 && it.t >= PANEL_TIME) this.advanceIntro();
    }
  },

  /** Tap or timer: logo → story panels → the first run (new players) or the home screen. */
  advanceIntro(this: Game): void {
    const it = this.intro!;
    if (it.stage === 'logo') {
      if (!it.full) return this.finishIntro(false);
      it.stage = 'story';
      it.panel = 0;
      it.t = it.prev = 0;
      return;
    }
    // Tapping while the caption is still typing finishes the caption first.
    if (it.t < 1.2 && it.panel < 2) {
      it.t = it.prev = 1.2;
      return;
    }
    if (it.panel < 2) {
      it.panel++;
      it.t = it.prev = 0;
      sfx.whoosh();
      return;
    }
    if (it.t > 1.0) this.finishIntro(false);
  },

  finishIntro(this: Game, skipped: boolean): void {
    const it = this.intro!;
    this.intro = null;
    if (!it.full) return;
    const p = this.progress;
    if (!p.seen.includes('intro')) p.seen.push('intro', 'story:0:start'); // the intro tells chapter 1's opening
    p.persist();
    track('intro', { skipped, panel: it.panel });
    this.startRun(); // straight into the first drop, skipped or not
  },

  drawIntro(this: Game): void {
    const { ctx } = this;
    const it = this.intro!;
    const L = -this.offX;
    const W = WORLD_W + this.offX * 2;
    const H = this.viewH;
    if (it.stage === 'logo') {
      const g = ctx.createRadialGradient(WORLD_W / 2, H * 0.42, 20, WORLD_W / 2, H * 0.42, H * 0.75);
      g.addColorStop(0, '#5a2a5e');
      g.addColorStop(1, '#1a0d20');
      ctx.fillStyle = g;
      ctx.fillRect(L, 0, W, H);
      const t = settings.reducedMotion ? 99 : it.t;
      // Soft spotlight that grows as the stack lands.
      const sp = ctx.createRadialGradient(WORLD_W / 2, H * 0.4, 0, WORLD_W / 2, H * 0.4, 60 + Math.min(1, t) * 140);
      sp.addColorStop(0, 'rgba(255,190,110,0.35)');
      sp.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = sp;
      ctx.fillRect(L, 0, W, H);
      drawLogo(ctx, t, WORLD_W / 2, H * 0.42, t > 1.45 ? tr('introTag') : '');
      logoSparkles(ctx, t, WORLD_W / 2, H * 0.42);
      // Sake-chan pops up beside the logo once it has landed, and winks.
      if (t > 1.2) {
        const pop = Math.min(1, (t - 1.2) / 0.25);
        drawSake(ctx, WORLD_W / 2 + 118, H * 0.42 + 70, 0.75 * (pop < 1 ? 1.2 * pop : 1), t > 1.8 ? 'wink' : 'shock', t);
      }
      // Fade out at the end.
      const end = it.full ? LOGO_TIME + 0.5 : LOGO_SHORT;
      if (!settings.reducedMotion && it.t > end - 0.3) {
        ctx.fillStyle = `rgba(10,5,15,${Math.min(1, (it.t - (end - 0.3)) / 0.3)})`;
        ctx.fillRect(L, 0, W, H);
      }
    } else {
      const o = { ctx, t: it.t, L, W, H, me: avatarChef(this.progress.avatar), rival: chefFor(1) };
      if (it.panel === 0) panelClosed(o);
      else if (it.panel === 1) panelReopen(o);
      else panelRival(o);
      // Fade in from black at the start of each panel.
      if (it.t < 0.3) {
        ctx.fillStyle = `rgba(10,5,15,${1 - it.t / 0.3})`;
        ctx.fillRect(L, 0, W, H);
      }
      caption(ctx, [t('intro1'), t('intro2'), t('intro3')][it.panel], Math.max(0, it.t - 0.3), H - this.insets.bottom - 120);
      // Progress dots, and TAP TO START on the last panel.
      for (let i = 0; i < 3; i++) this.dot(WORLD_W / 2 - 16 + i * 16, H - this.insets.bottom - 70, 4.5, i === it.panel ? '#ffd34d' : 'rgba(255,255,255,0.35)');
      if (it.panel === 2 && it.t > 1.0) {
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(it.t * 5);
        logoText(ctx, t('tapStart'), WORLD_W / 2, H - this.insets.bottom - 40, 20, '#ffffff', '#ffe2c6');
        ctx.globalAlpha = 1;
      }
    }
    // SKIP is always there.
    this.button(WORLD_W - 92 - this.insets.right, this.insets.top + 14, 80, 32, `${t('skip')} ›`, () => this.finishIntro(true), 'quiet');
  },

  checkLeague(this: Game): void {
    const p = this.progress;
    const before = p.league;
    p.league = settleLeague(p.league, p.inviteCode);
    if (p.league !== before) {
      const r = p.league.result;
      if (r) {
        if (r.coins) this.bankCoins(r.coins);
        const L = LEAGUES[p.league.tier];
        this.celebrate(r.moved > 0 ? `${L.icon} PROMOTED TO ${L.name.toUpperCase()}!` : r.moved < 0 ? `${L.icon} Back to ${L.name}` : `${L.icon} STAYED IN ${L.name.toUpperCase()}`, `Last week you finished #${r.rank}${r.coins ? ` · +${r.coins} coins` : ''}`);
        track('league_end', { rank: r.rank, tier: r.tier, moved: r.moved });
      }
      p.persist();
    }
  },

  leaguePts(this: Game, n: number): void {
    const p = this.progress;
    if (this.lockedAt('events')) return;
    this.checkLeague();
    p.league.pts += n;
  },

  leagueTable(this: Game): { name: string; pts: number; me: boolean }[] {
    const p = this.progress;
    return [...leagueRivals(p.league.week, p.league.tier, p.inviteCode).map((x) => ({ ...x, me: false })), { name: `YOU · ${p.avatar.name}`, pts: p.league.pts, me: true }]
      .sort((a, b) => b.pts - a.pts || (a.me ? -1 : 1));
  },

  drawLeague(this: Game): void {
    this.checkLeague();
    const { ctx } = this;
    const p = this.progress;
    const L = LEAGUES[p.league.tier];
    const f = this.screenBegin(`${L.icon} ${L.name.toUpperCase()} LEAGUE`, `Top ${PROMOTE} move up · bottom ${DEMOTE} move down · ${timeLeft(leagueWeek().end)} · rivals are AI`);
    let y = f.y0 + 4;
    // Tier ladder.
    const cw = (WORLD_W - 32) / LEAGUES.length;
    LEAGUES.forEach((lg, i) => {
      const on = i === p.league.tier;
      this.text(lg.icon, 16 + cw * i + cw / 2, y + 18, on ? 26 : 18, '#fff', 400);
      if (on) this.dot(16 + cw * i + cw / 2, y + 40, 3.5, lg.color);
      ctx.globalAlpha = i <= p.league.tier ? 1 : 0.35;
      this.fitText(lg.name, 16 + cw * i + cw / 2, y + 50, cw - 2, 8.5, '#fff', 'center', 700);
      ctx.globalAlpha = 1;
    });
    y += 62;
    this.wrapLeft('Earn points: +10 per chef beaten, +5 if flawless, +1 per PERFECT, +20 for the Daily Special. Top 3 win 500 / 350 / 250 coins.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 36;
    const table = this.leagueTable();
    table.forEach((row, i) => {
      const rank = i + 1;
      const zone = rank <= PROMOTE && p.league.tier < LEAGUES.length - 1 ? 'up' : rank > LEAGUE_SIZE - DEMOTE && p.league.tier > 0 ? 'down' : '';
      this.card(16, y, WORLD_W - 32, 34, row.me ? 'rgba(110,80,10,0.95)' : zone === 'up' ? 'rgba(30,70,45,0.9)' : zone === 'down' ? 'rgba(80,25,30,0.9)' : 'rgba(48,30,52,0.9)');
      this.text(`${rank}`, 36, y + 17, 12, rank <= 3 ? '#ffd34d' : 'rgba(255,255,255,0.7)', 700);
      this.fitText(row.name, 56, y + 17, 210, 12, row.me ? '#ffd34d' : '#fff', 'left', 700);
      this.text(`${row.pts}`, WORLD_W - 32, y + 17, 12.5, '#fff', 700, 'right');
      if (rank === PROMOTE && zone) this.text('▲ promotion line', WORLD_W - 90, y + 30, 8, '#8fdc93', 700, 'right');
      y += 38;
    });
    this.screenEnd(f, y - f.y0);
  },

  questWin(this: Game): void {
    const q = this.quest;
    if (!q.joined || q.out || q.stage >= QUEST_STAGES) return;
    q.stage++;
    if (q.stage >= QUEST_STAGES) this.celebrate('🌋 STREAK QUEST CLEARED!', 'Claim your share of the 10,000 coins in Events');
    else this.showToast(`🌋 Streak Quest: ${q.stage}/${QUEST_STAGES}`);
    this.progress.persist();
  },

  questLose(this: Game): void {
    const q = this.quest;
    if (!q.joined || q.out || q.stage >= QUEST_STAGES) return;
    q.out = true;
    this.showToast('🌋 Out of the Streak Quest! A new one starts soon.');
  },

  drawQuest(this: Game): void {
    const { ctx } = this;
    const q = this.quest;
    const surv = questSurvivors(q.key);
    const f = this.screenBegin('🌋 STREAK QUEST', `Beat ${QUEST_STAGES} chefs · don’t end a run empty-handed · ${timeLeft(currentQuest().end)} · AI rivals`);
    let y = f.y0 + 4;
    // The lava path: 7 platforms rising up the volcano.
    const h = 380;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#2a0d1a');
    g.addColorStop(1, '#ff5a1f');
    ctx.fillStyle = g;
    this.roundRect(16, y, WORLD_W - 32, h, 16);
    ctx.fill();
    // Lava bubbles.
    for (let i = 0; i < 10; i++) {
      const bx = 30 + ((i * 47 + this.time * 20) % (WORLD_W - 60));
      this.dot(bx, y + h - 14 - Math.abs(Math.sin(this.time * 2 + i)) * 8, 3 + (i % 3), '#ffd34d');
    }
    for (let s = 0; s <= QUEST_STAGES; s++) {
      const px = 70 + (s % 2) * 200 + (s === QUEST_STAGES ? 100 - (s % 2) * 200 : 0);
      const py = y + h - 40 - s * ((h - 70) / QUEST_STAGES);
      ctx.fillStyle = s <= q.stage ? '#8fdc93' : '#5a3a22';
      this.roundRect(px - 34, py - 6, 68, 14, 7);
      ctx.fill();
      this.text(s === QUEST_STAGES ? '🏆' : `${s}`, px, py - 16, s === QUEST_STAGES ? 22 : 11, '#fff', 700);
      this.text(`${surv[s]} left`, px + (s % 2 ? -56 : 56), py + 1, 9.5, 'rgba(255,255,255,0.8)', 700);
      if (s === q.stage && q.joined && !q.out) drawChef(ctx, avatarChef(this.progress.avatar), px, py - 30, 0.32, 'happy', px, py + 40, this.time);
    }
    y += h + 10;
    const share = Math.floor(QUEST_POT / surv[QUEST_STAGES]);
    this.card(16, y, WORLD_W - 32, 84, 'rgba(70,25,20,0.95)');
    if (!q.joined) {
      this.text('100 players · 7 stages · 10,000 coins', 32, y + 22, 13, '#ffd34d', 700, 'left');
      this.fitText('Beat chefs in journey runs. A run that beats no chef knocks you out.', 32, y + 44, WORLD_W - 64, 10.5, 'rgba(255,255,255,0.8)', 'left');
      this.pill(32, y + 54, WORLD_W - 64, 'JOIN THE QUEST', f, () => { q.joined = true; this.progress.persist(); track('quest_join'); }, 'gold');
    } else if (q.out) {
      this.text('Knocked out at stage ' + q.stage, 32, y + 24, 14, '#ff9a8a', 700, 'left');
      this.text(`A new quest starts in ${timeLeft(currentQuest().end)}`, 32, y + 48, 11, 'rgba(255,255,255,0.75)', 600, 'left');
    } else if (q.stage >= QUEST_STAGES) {
      this.text(`You made it! ${surv[QUEST_STAGES]} survivors share the pot`, 32, y + 24, 12.5, '#8fdc93', 700, 'left');
      if (!q.claimed) this.pill(32, y + 44, WORLD_W - 64, `CLAIM ${share} COINS`, f, () => { q.claimed = true; this.bankCoins(share); this.celebrate('🌋 +' + share + ' COINS', 'Your share of the Streak Quest pot'); this.progress.persist(); }, 'gold');
      else this.text('✓ Claimed', 32, y + 56, 12, '#8fdc93', 700, 'left');
    } else {
      this.text(`Stage ${q.stage}/${QUEST_STAGES} · ${surv[q.stage]} players left`, 32, y + 24, 13, '#ffd34d', 700, 'left');
      this.fitText(`Finish to share ${QUEST_POT.toLocaleString('en')} coins (about ${share} each)`, 32, y + 46, WORLD_W - 64, 11, 'rgba(255,255,255,0.8)', 'left');
      this.pill(32, y + 54, WORLD_W - 64, 'PLAY', f, () => this.startRun(), 'gold');
    }
    y += 92;
    this.screenEnd(f, y - f.y0);
  },

  /** The chef who has beaten you most (at least NEMESIS_AT times), if any. */
  nemesisLevel(this: Game): number {
    let best = 0;
    let most = NEMESIS_AT - 1;
    for (const [lv, n] of Object.entries(this.progress.losses)) {
      if (n > most && this.progress.canEnter(Number(lv))) {
        most = n;
        best = Number(lv);
      }
    }
    return best;
  },

  nemesisPower(this: Game): number {
    const lv = this.nemesisLevel();
    return lv ? Math.min(5, (this.progress.losses[lv] ?? 0) - NEMESIS_AT + 1) : 0;
  },

  isNemesis(this: Game): boolean {
    return this.journey && this.level === this.nemesisLevel();
  },

  nemesisReward(this: Game): number {
    return 150 + 100 * this.nemesisPower();
  },

  beatNemesis(this: Game, level: number): void {
    const p = this.progress;
    const reward = this.nemesisReward();
    p.losses[level] = 0;
    if (!p.badges.includes('nemesis')) p.badges.push('nemesis');
    this.bankCoins(reward);
    this.celebrate('😈 NEMESIS DEFEATED!', `${chefFor(level).name} bows to you · +${reward} coins`);
    track('nemesis_beaten', { level });
    p.persist();
  },

  /** Twins land where they are: a gap smaller than the PERFECT zone joins them cleanly. */
  dropTwin(this: Game, m: Layer): void {
    const top = this.top;
    const sep = this.twinSep;
    const tol = PERFECT_TOL + 2 + (settings.assist ? 3 : 0) + (this.fever > 0 ? 8 : 0);
    m.twin = false;
    if (sep <= tol) {
      m.x = top.x;
      m.w = top.w;
      this.combo++;
      this.orderStats.perfects++;
      this.lastPerfect = true;
      this.place(m);
      this.popup(m.x + m.w / 2, m.y - 18, this.combo > 1 ? `TWINS! PERFECT x${this.combo}` : 'TWINS! PERFECT', '#fff3b0', 18);
      this.mission('perfects');
      this.mission('streak', this.combo);
      this.sparkle(m.x, m.y + LAYER_H / 2, m.w, 24);
      sfx.perfect(this.combo);
      haptic.medium();
      return;
    }
    const w = top.w - sep * 2;
    this.lastPerfect = false;
    this.combo = 0;
    if (w < 6) {
      this.fall({ ...m, x: top.x - sep, w: m.w / 2 }, -1);
      this.fall({ ...m, x: top.x + m.w / 2 + sep, w: m.w / 2 }, 1);
      this.moving = null;
      this.die();
      return;
    }
    // The outer edge of each half hangs over and is sliced off.
    this.fall({ ...m, x: top.x - sep, w: sep }, -1);
    this.fall({ ...m, x: top.x + top.w - sep, w: sep }, 1);
    m.x = top.x + sep;
    m.w = w;
    this.orderStats.slices++;
    this.place(m);
    sfx.slice();
    haptic.light();
  },

  startRescue(this: Game, i: number): void {
    if (i > 0 && !(this.progress.rescueStars[i - 1] > 0)) return this.showToast('Finish the previous rescue first');
    this.startRun(RESCUES[i].level, 'rescue', { rescue: i });
  },

  /** Water rises (faster over time) or the quake clock ticks; tremors shove the top layer. */
  updateRescue(this: Game, real: number): void {
    const r = this.rescueRun;
    if (!r || this.mode !== 'playing' || this.perkChoice || this.story || this.picker) return;
    const rs = RESCUES[r.i];
    r.t += real;
    if (rs.kind === 'quake') {
      this.timeLeft = Math.max(0, rs.time - r.t);
      if ((r.tremor -= real) <= 0) {
        r.tremor = 3 + this.rand() * 2;
        this.runEvent('slam');
        this.popup(WORLD_W / 2, this.top.y - 60, '〰️ TREMOR!', '#ffb703', 18);
      }
      r.margin = this.timeLeft;
      if (this.timeLeft <= 0) {
        this.moving = null;
        this.die();
      }
      return;
    }
    if (r.t > 2) r.water -= rs.rise * LAYER_H * (1 + (r.t - 2) / 60) * real;
    r.margin = (r.water - this.top.y) / LAYER_H - 1;
    if (r.margin <= 0) {
      this.moving = null;
      sfx.slice();
      this.die();
    }
  },

  rescueWon(this: Game): void {
    const r = this.rescueRun!;
    const rs = RESCUES[r.i];
    const stars = rescueStars(rs.kind, rs.kind === 'quake' ? this.timeLeft : r.margin);
    const p = this.progress;
    const first = !p.rescueStars[r.i];
    p.rescueStars[r.i] = Math.max(p.rescueStars[r.i] || 0, stars);
    this.addCoins(first ? 150 + r.i * 30 : 30, WORLD_W / 2, this.top.y - 80, 'Rescued!');
    this.resultKind = 'rescue-won';
    this.specialWon = true;
    this.mode = 'dead';
    this.deadAt = this.time;
    this.moving = null;
    this.bubble = { text: '👵 Thank you, dear!', life: 99 };
    this.celebrate('🆘 RESCUED!', `${rs.name} · ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`);
    track('rescue', { i: r.i, stars });
    this.endRun();
  },

  /** Rising water with waves, and grandma's stall bobbing on it. */
  drawWater(this: Game): void {
    const r = this.rescueRun;
    if (!r || this.runMode !== 'rescue' || RESCUES[r.i].kind === 'quake') return;
    const { ctx } = this;
    const L = -this.offX;
    const W = WORLD_W + this.offX * 2;
    const y0 = r.water;
    ctx.fillStyle = 'rgba(40,120,200,0.55)';
    ctx.beginPath();
    ctx.moveTo(L, y0);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(L + x, y0 + Math.sin(this.time * 3 + x * 0.05) * 4);
    ctx.lineTo(L + W, this.camY + this.viewH + 50);
    ctx.lineTo(L, this.camY + this.viewH + 50);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) ctx.lineTo(L + x, y0 + Math.sin(this.time * 3 + x * 0.05) * 4);
    ctx.stroke();
    const bob = Math.sin(this.time * 2) * 3;
    this.qaSkip = true;
    this.text('🛖', 34, y0 - 16 + bob, 30, '#fff', 400);
    this.text('👵', 34, y0 - 40 + bob, 20, '#fff', 400);
    if (r.margin < 3) this.text('Hurry!', 70, y0 - 50 + bob, 12, '#ffffff', 700, 'left');
    this.qaSkip = false;
  },

  drawRescues(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('🆘 RESCUE', 'Save grandma’s stall from floods, quakes and storms');
    let y = f.y0 + 4;
    RESCUES.forEach((rs, i) => {
      const open = i === 0 || p.rescueStars[i - 1] > 0;
      const st = p.rescueStars[i] || 0;
      this.card(16, y, WORLD_W - 32, 70, open ? (rs.kind === 'quake' ? 'rgba(80,60,20,0.95)' : rs.kind === 'storm' ? 'rgba(40,40,80,0.95)' : 'rgba(20,60,90,0.95)') : 'rgba(30,20,35,0.8)');
      this.text(open ? (rs.kind === 'quake' ? '〰️' : rs.kind === 'storm' ? '🌀' : '🌊') : '🔒', 44, y + 35, 24, '#fff', 400);
      this.text(`${i + 1}. ${rs.name}`, 72, y + 20, 14, open ? '#fff' : 'rgba(255,255,255,0.5)', 700, 'left');
      this.fitText(rs.kind === 'quake' ? `Stack ${rs.target} in ${rs.time}s · tremors` : `Stack ${rs.target} before the water reaches you`, 72, y + 40, 200, 10.5, 'rgba(255,255,255,0.75)', 'left');
      this.text('★'.repeat(st) + '☆'.repeat(3 - st), 72, y + 57, 11, st ? '#ffd34d' : 'rgba(255,255,255,0.3)', 700, 'left');
      if (open) this.pill(WORLD_W - 108, y + 19, 78, st ? 'REPLAY' : 'SAVE!', f, () => this.startRescue(i), st ? 'quiet' : 'gold');
      y += 78;
    });
    this.screenEnd(f, y - f.y0);
  },

  towerState(this: Game) {
    const p = this.progress;
    if (p.tower.week !== weekKey()) p.tower = { week: weekKey(), cp: 0, best: 0, claimed: [] };
    return p.tower;
  },

  startTower(this: Game): void {
    const tw = this.towerState();
    if (tw.cp >= TOWER_FLOORS) return this.showToast('You conquered the tower this week! New floors on Monday.');
    this.startRun(4 + tw.cp + 1, 'tower');
  },

  /** Records a finished floor; returns true when the whole tower is done (the run ends). */
  towerFloorDone(this: Game, floor: number): boolean {
    const tw = this.towerState();
    tw.best = Math.max(tw.best, floor);
    if (floor % 10 === 0 && floor > tw.cp) {
      tw.cp = floor;
      const reward = towerReward(floor);
      if (!tw.claimed.includes(floor)) {
        tw.claimed.push(floor);
        this.bankCoins(reward);
        this.openChest(this.level);
        this.celebrate(floor === TOWER_FLOORS ? '🗼 TOWER CONQUERED!' : `🗼 CHECKPOINT ${floor}!`, `+${reward} coins and a chest · you’ll restart from here`);
        if (floor === TOWER_FLOORS && !this.progress.badges.includes('tower')) this.progress.badges.push('tower');
      }
    }
    this.progress.persist();
    if (floor >= TOWER_FLOORS) {
      this.winSpecial();
      return true;
    }
    return false;
  },

  drawTower(this: Game): void {
    const { ctx } = this;
    const tw = this.towerState();
    const floors = towerFloors();
    const f = this.screenBegin('🗼 OMAKASE TOWER', `${TOWER_FLOORS} floors · new twists every week · checkpoints every 10 · ${timeLeft(leagueWeek().end)}`);
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 74, 'rgba(60,35,70,0.95)');
    this.text(`Checkpoint: floor ${tw.cp} · best ${tw.best}`, 32, y + 22, 13, '#ffd34d', 700, 'left');
    this.fitText('Each floor is one short order with a twist. Lose and you restart from your last checkpoint.', 32, y + 42, WORLD_W - 64, 10, 'rgba(255,255,255,0.75)', 'left');
    y += 84;
    this.pill(16, y, WORLD_W - 32, tw.cp >= TOWER_FLOORS ? '✓ CONQUERED THIS WEEK' : `CLIMB FROM FLOOR ${tw.cp + 1}`, f, () => this.startTower(), 'gold');
    y += 46;
    // The tower, top floor first.
    for (let fl = TOWER_FLOORS; fl >= 1; fl--) {
      const done = fl <= tw.best;
      const cp = fl % 10 === 0;
      const next = fl === tw.cp + 1;
      const w = 220 - (fl / TOWER_FLOORS) * 60;
      const x = WORLD_W / 2 - w / 2;
      ctx.fillStyle = next ? '#ff8a5b' : done ? '#5a8a5a' : cp ? '#7a4e2a' : '#3a2a45';
      this.roundRect(x, y, w, 24, 6);
      ctx.fill();
      if (cp) {
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 2;
        this.roundRect(x, y, w, 24, 6);
        ctx.stroke();
      }
      this.text(`${fl}`, x + 18, y + 12.5, 10.5, '#fff', 700);
      this.text(FLOOR_ICON[floors[fl - 1]] ?? '🍣', WORLD_W / 2, y + 12.5, 13, '#fff', 400);
      if (cp) this.text(tw.claimed.includes(fl) ? '✓' : `🎁 ${towerReward(fl)}`, x + w - 8, y + 12.5, 10, '#ffd34d', 700, 'right');
      y += 28;
    }
    this.screenEnd(f, y - f.y0);
  },

  startModChal(this: Game, m: Mod): void {
    this.startRun(Math.max(3, this.progress.playLevel - 2), 'modchal', { mods: [m] });
  },

  modChalWon(this: Game, m: Mod): void {
    const p = this.progress;
    if (p.modchal.day !== dayKey()) p.modchal = { day: dayKey(), done: [], stars: p.modchal.stars };
    if (!p.modchal.done.includes(m)) {
      p.modchal.done.push(m);
      p.modchal.stars++;
      this.bankCoins(100);
      this.showToast(`${MODS[m].icon} ${MODS[m].name} cleared! +100 coins · ✦ ${p.modchal.stars}`);
    }
    p.persist();
  },

  drawModChals(this: Game): void {
    const p = this.progress;
    const today = p.modchal.day === dayKey() ? p.modchal.done : [];
    const f = this.screenBegin('🎭 MODIFIER CHALLENGES', `One order with a twist · first clear each day: +100 coins · ✦ ${p.modchal.stars}`);
    let y = f.y0 + 4;
    for (const m of MOD_LIST) {
      const done = today.includes(m);
      this.card(16, y, WORLD_W - 32, 66, done ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(MODS[m].icon, 44, y + 33, 26, '#fff', 400);
      this.text(MODS[m].name, 74, y + 22, 14, '#fff', 700, 'left');
      this.fitText(MODS[m].desc, 74, y + 44, 200, 10.5, 'rgba(255,255,255,0.75)', 'left');
      this.pill(WORLD_W - 104, y + 17, 74, done ? '✓ AGAIN' : 'PLAY', f, () => this.startModChal(m), done ? 'quiet' : 'gold');
      y += 74;
    }
    this.screenEnd(f, y - f.y0);
  },

  startMini(this: Game, id: MiniId): void {
    if (this.progress.unlocked < MINIS[id].unlock) return this.showToast(`${MINIS[id].name} unlocks at level ${MINIS[id].unlock}`);
    this.mini = makeMini(id);
    this.miniPaid = false;
    this.screenBack = this.mode === 'minis' ? 'minis' : 'title';
    this.mode = 'mini';
    track('mini_start', { id });
  },

  updateMini(this: Game, real: number): void {
    const g = this.mini;
    if (!g) return;
    g.update(real);
    if (g.sound) {
      ({ hit: () => sfx.drop(), perfect: () => sfx.perfect(3), miss: () => sfx.slice(), fail: () => sfx.die(), win: () => sfx.celebrate(), throw: () => sfx.whoosh() } as Record<string, () => void>)[g.sound]?.();
      if (g.sound === 'fail' || g.sound === 'miss') haptic.error();
      g.sound = null;
    }
    if (g.done && !this.miniPaid) {
      this.miniPaid = true;
      const p = this.progress;
      const rec = p.minis[g.id] ?? { best: 0, wins: 0, day: '' };
      rec.best = Math.max(rec.best, g.score);
      if (g.won) {
        const firstToday = rec.day !== dayKey();
        rec.wins++;
        rec.day = dayKey();
        const coins = firstToday ? 150 : 40;
        this.bankCoins(coins);
        this.celebrate(`${MINIS[g.id].icon} YOU WIN!`, `+${coins} coins${firstToday ? ' (first win today)' : ''}`, 1.8);
      }
      p.minis[g.id] = rec;
      p.persist();
      track('mini_end', { id: g.id, won: g.won, score: g.score });
    }
  },

  drawMiniGame(this: Game): void {
    const { ctx } = this;
    const g = this.mini!;
    const L = -this.offX;
    const W = WORLD_W + this.offX * 2;
    const bg = ctx.createLinearGradient(0, 0, 0, this.viewH);
    bg.addColorStop(0, g.id === 'fish' ? '#0b3a5a' : g.id === 'rhythm' ? '#3a1a4a' : '#4a2a1a');
    bg.addColorStop(1, '#1a0d20');
    ctx.fillStyle = bg;
    ctx.fillRect(L, 0, W, this.viewH);
    const top = this.insets.top;
    this.text(`${MINIS[g.id].icon} ${MINIS[g.id].name.toUpperCase()}`, WORLD_W / 2, top + 30, 20, '#fff', 700);
    this.text(g.status, WORLD_W / 2, top + 56, 14, '#ffd34d', 700);
    ctx.save();
    ctx.translate(0, top + 40);
    g.draw(ctx, WORLD_W, this.viewH - top - 110 - this.insets.bottom, this.time);
    ctx.restore();
    if (g.done) {
      ctx.fillStyle = 'rgba(20,10,25,0.8)';
      ctx.fillRect(L, 0, W, this.viewH);
      this.qaCover();
      this.card(40, this.viewH / 2 - 100, WORLD_W - 80, 200, '#2a1a33');
      this.text(g.won ? 'YOU WIN!' : 'SO CLOSE!', WORLD_W / 2, this.viewH / 2 - 60, 28, g.won ? '#ffd34d' : '#ff9a8a', 700);
      this.text(`Score ${g.score} · best ${this.progress.minis[g.id]?.best ?? g.score}`, WORLD_W / 2, this.viewH / 2 - 24, 14, '#fff', 600);
      this.button(60, this.viewH / 2 + 20, 130, 46, t('back'), () => { this.mini = null; this.mode = this.screenBack; }, 'quiet');
      this.button(WORLD_W - 190, this.viewH / 2 + 20, 130, 46, t('retry'), () => this.startMini(g.id));
    } else this.button(16, this.viewH - this.insets.bottom - 56, 90, 40, t('back'), () => { this.mini = null; this.mode = this.screenBack; }, 'quiet');
  },

  drawMinis(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('🎮 MINI-GAMES', 'A new one opens after each story chapter · first win each day: +150');
    let y = f.y0 + 4;
    for (const id of Object.keys(MINIS) as MiniId[]) {
      const mg = MINIS[id];
      const open = p.unlocked >= mg.unlock;
      const rec = p.minis[id];
      this.card(16, y, WORLD_W - 32, 84, open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.text(open ? mg.icon : '🔒', 46, y + 42, 30, '#fff', 400);
      this.text(mg.name, 78, y + 22, 15, open ? '#fff' : 'rgba(255,255,255,0.5)', 700, 'left');
      this.wrapLeft(open ? mg.desc : `Opens at level ${mg.unlock}`, 78, y + 42, 190, 10.5, 'rgba(255,255,255,0.75)');
      if (rec) this.text(`best ${rec.best} · ${rec.wins} wins`, 78, y + 72, 10, '#ffd34d', 700, 'left');
      if (open) this.pill(WORLD_W - 104, y + 26, 74, 'PLAY', f, () => this.startMini(id), 'gold');
      y += 92;
    }
    this.screenEnd(f, y - f.y0);
  },
};
