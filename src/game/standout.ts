// Feel, sharing, Sake-chan, the book, daily roll, boss maker, world tower and other modes.
// These are methods of Game (see game.ts), kept here to keep that file a readable size.

import { FONT } from '../font';
import { audioStream, cue, playSong, sfx, songNote, stopSong, setMuted } from '../audio';
import { save, setHaptics } from '../platform';
import { TRACKS, babble, setTrack, setVoices, type TrackId } from '../audio';
import { STICKER_SETS, SET_REWARD, stickerRarity } from '../collect';
import { CITIES, cupRivals, cupWeekend, currentTour } from '../live';
import { PRODUCTS, adPrivacyOptionsAvailable, monetize, showAdPrivacyOptions } from '../monetize';
import { REACTIONS, codeEmoji, decodeChallenge, decodeGhost, encodeChallenge, encodeGhost, shareCard, shareClip, sharePhoto } from '../share';
import { BOARDS, localBoards, online } from '../services';
import { Progress, RECIPE_GOAL, dayKey, weekKey } from '../progress';
import { settings, saveSettings } from '../settings';
import { LANGS, t } from '../i18n';
import { analyticsSummary,  setAnalyticsConsent, track } from '../analytics';
import { cfg, liveEventNow } from '../config';
import { exportSave, importSave } from '../transfer';
import { clipType, clipsSupported } from '../clips';
import { decodeRestaurant } from '../restaurant';
import { BRANCH_EMOJI, BRANCH_MAX, LAB_KNOWN, LAB_TRIES, SECRETS, WORLDS, branchCost, branchRate, labHint, labMatch, type WorldId } from '../cuisine';
import { announce, mirrorButtons } from '../a11y';
import { COMBOS, METERS_PER_LAYER, landmarkFor } from '../feel';
import { CHOICES, LETTERS, MONTHS, RECIPE_CARDS, TRIVIA, inSeason, letterHint, letterUnlocked, seasonNote, type LetterStats } from '../book';
import { SAKE_LINES, drawSake } from '../mascot';
import { DAILY_LEVEL, dailyBuckets, dailyNumber, dailySeed, dailyShare, decodeSong, encodeSong } from '../daily';
import { ALL_ATTACKS, LOOK_SIZES, PHRASES, SPEEDS, bossChef, decodeBoss, encodeBoss, type BossDesign } from '../bossmaker';
import { addFriend, beatShare, forgetMe, cloudBackup, cloudBackupInfo, cloudRestore, lastError as onlineErrorText, countryRows, dailyBoard, friendList, friendScores, isOnline, postDaily, postWorld, worldTotal } from '../online';
import { COUNTRIES, WORLD_MILESTONES, countryBoard, countryById, guessCountry, worldSimToday } from '../world';
import { PIECE_SETS, dishLevel } from '../diner';
import { ACHIEVEMENTS, avatarChef } from '../meta';
import { BOOSTERS, type Ingredient } from '../shop';
import { FACES, HAIRS, HATS, chefFor, drawChef,  type Chef } from '../chef';
import { Game, WORLD_W, LAYER_H, COLORS, RECIPES, DISH_EMOJI, Layer, MASTERY, PERKS, Button } from '../game';

declare module '../game' {
  interface Game {
    dailyDone(): boolean;
    startDaily(): void;
    recordDaily(): void;
    dailyText(): string;
    shareDaily(): void;
    drawDaily(): void;
    drawDailyOnline(f: { areaTop: number; areaH: number }, y: number, mine: number | null): number;
    playerId(): string;
    startRelay(): void;
    relayLanded(perfect: boolean): void;
    relayColor(turn: number): string;
    liveEvent(): ReturnType<typeof liveEventNow>;
    startAsmr(): void;
    startCamera(): Promise<void>;
    stopCamera(): void;
    drawTable(): boolean;
    startCustom(b: BossDesign, friend: boolean): void;
    customWon(): void;
    saveDraft(): void;
    shareBoss(): void;
    drawBossMaker(): void;
    drawStudio(blocker: () => void): void;
    playRunSong(): void;
    shareSong(): void;
    renderPoster(style: number): HTMLCanvasElement;
    drawPoster(blocker: () => void): void;
    makeHighlight(): Promise<void>;
    highlightFrame(x: CanvasRenderingContext2D, t: number, layers: Layer[], marks: string, height: number, beaten: number, chefName: string, onReveal: (i: number) => void): void;
    drawHighlightProgress(blocker: () => void): void;
    recordChef(level: number, won: boolean): void;
    chefWithChoices(level: number): Chef;
    choose(id: string, opt: string): void;
    pendingChoice(): (typeof CHOICES)[number] | undefined;
    letterStats(): LetterStats;
    checkLetters(): void;
    lettersUnread(): number;
    drawLetter(blocker: () => void): void;
    sakeTap(): void;
    seasonal(): Ingredient[];
    pickTrivia(): void;
    drawBook(): void;
    wrapLeftH(str: string, x: number, y: number, maxW: number, size: number, color: string): number;
    unlockedRecipeCards(): number[];
    drawPromise(): void;
    addWorldLayers(n: number): void;
    drawWorld(): void;
    drawCountries(): void;
    worldIntro(w: WorldId): void;
    labState(): Progress['lab'];
    labTry(): void;
    drawLab(): void;
    branchCities(): typeof CITIES;
    branch(id: string): Progress['branches'][string];
    branchTips(id: string): number;
    collectBranches(): void;
    drawRestBranches(f: { areaTop: number; areaH: number }, y: number): number;
    drawJukebox(): void;
    playTrack(id: TrackId): void;
    maybeTrackDrop(): void;
    openPhoto(): void;
    renderPhoto(): HTMLCanvasElement;
    drawPhoto(blocker: () => void): void;
    startPnp(turn?: number): void;
    drawPnp(blocker: () => void): void;
    mirrorA11y(texts: NonNullable<Game['qaTexts']>): void;
    drawReactPick(blocker: () => void): void;
    chefLook(c: Chef, level: number): Chef;
    calendarReward(d: number): string;
    calendarReady(): boolean;
    claimCalendar(): void;
    drawCalendar(): void;
    drawMuseum(): void;
    drawProfile(): void;
    askPrestige(): void;
    prestige(): void;
    drawConfirm(blocker: () => void): void;
    drawBoards(): void;
    recordDuel(): void;
    openCodeInput(kind?: 'friend' | 'save' | 'cloud'): void;
    setting(key: 'haptics' | 'reducedMotion' | 'colorblind' | 'assist' | 'clips' | 'voices' | 'leftHanded' | 'hapticAssist' | 'songNotes' | 'audioOnly' | 'tilt' | 'batterySaver' | 'analytics'): void;
    drawSettings(): void;
    copy(text: string, ok: string): void;
    shareRun(emoji?: number): void;
    drawOverlays(): void;
    drawCoach(): void;
    fitText(str: string, x: number, y: number, maxW: number, size: number, color: string, align?: CanvasTextAlign, weight?: number): void;
    drawPerkChoice(blocker: () => void): void;
    drawPicker(blocker: () => void): void;
    wrapText(str: string, x: number, y: number, maxW: number, size: number, color: string, weight?: number): number;
    panel(y: number, title: string, sub: string): void;
  }
}

export const standoutMethods = {
  dailyDone(this: Game): boolean {
    return this.progress.daily.day === dayKey();
  },

  /** Same layers for everyone today: one counted try, then practice. */
  startDaily(this: Game): void {
    this.dailyPractice = this.dailyDone();
    this.startRun(cfg.dailyLevel || DAILY_LEVEL, 'daily', { picked: new Set(), seed: dailySeed(dayKey()) });
    this.coach(`🟩 DAILY ROLL #${dailyNumber()}`, this.dailyPractice ? 'Practice run: your counted roll for today is already in. Same layers as everyone!' : 'The same layers for everyone today. One counted try. Make it a good grid!', 4);
  },

  recordDaily(this: Game): void {
    if (this.runMode !== 'daily' || this.dailyPractice || this.revived) return;
    const d = this.progress.daily;
    if (d.day === dayKey()) return;
    const streak = d.last === dayKey(-1) ? d.streak + 1 : 1;
    this.progress.daily = { day: dayKey(), done: true, height: this.height, grid: this.marks, streak, last: dayKey(), best: Math.max(d.best, this.height), played: d.played + 1, hist: [...d.hist, this.height].slice(-90) };
    track('daily_roll', { n: dailyNumber(), height: this.height });
    void postDaily(dayKey(), this.playerId(), this.progress.avatar.name, this.height, this.marks);
  },

  /** This device's player id: the six letters of its invite code. */
  playerId(this: Game): string {
    return this.progress.inviteCode.slice(4);
  },

  dailyText(this: Game): string {
    const d = this.progress.daily;
    const lm = landmarkFor(d.height).beat;
    return dailyShare(dailyNumber(), d.height, d.grid, d.streak, lm ? `${lm.emoji} > ${lm.name.replace(/^(the|a) /, '')}` : '');
  },

  shareDaily(this: Game): void {
    if (!this.dailyDone()) return this.showToast('Play today’s Daily Roll first!');
    const text = this.dailyText();
    track('daily_share');
    if (navigator.share) void navigator.share({ text }).catch(() => this.copy(text, 'Grid copied! Paste it anywhere.'));
    else this.copy(text, 'Grid copied! Paste it anywhere.');
  },

  drawDaily(this: Game): void {
    const { ctx } = this;
    const d = this.progress.daily;
    const done = this.dailyDone();
    const f = this.screenBegin(`DAILY ROLL #${dailyNumber()}`, 'The same layers for everyone today · one counted try');
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, done ? 240 : 150, 'rgba(30,58,48,0.96)');
    if (done) {
      this.text(`${d.height} layers`, WORLD_W / 2, y + 30, 26, '#fff', 900);
      const lm = landmarkFor(d.height).beat;
      if (lm) this.fitText(`${lm.emoji} Taller than ${lm.name}`, WORLD_W / 2, y + 56, WORLD_W - 60, 12, '#9fe3ff', 'center', 700);
      // The grid itself.
      const rows = Math.min(5, Math.ceil(d.grid.length / 10));
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < 10; k++) {
          const ch = d.grid[r * 10 + k];
          if (!ch) break;
          ctx.fillStyle = ch === 'P' ? '#2a9d5c' : ch === 'C' ? '#e9c46a' : '#e63946';
          this.roundRect(WORLD_W / 2 - 125 + k * 25, y + 72 + r * 25, 21, 21, 4);
          ctx.fill();
        }
      }
      if (d.grid.length > 50) this.text(`+${d.grid.length - 50} more`, WORLD_W / 2, y + 206, 10.5, 'rgba(255,255,255,0.7)', 700);
      this.text(`Next roll in ${this.dur(new Date(new Date().setHours(24, 0, 0, 0)).getTime() - Date.now())}`, WORLD_W / 2, y + 224, 10.5, 'rgba(255,255,255,0.7)', 600);
      y += 250;
      this.pill(16, y, WORLD_W - 32, '🟩 SHARE MY GRID', f, () => this.shareDaily(), 'gold');
      y += 42;
      this.pill(16, y, WORLD_W - 32, 'PRACTICE (NOT COUNTED)', f, () => this.startDaily(), 'quiet');
      y += 50;
    } else {
      this.text('🟩🟨🟩🟩🟥', WORLD_W / 2, y + 36, 24, '#fff', 400);
      this.wrapText('Everyone gets the same layers today. 🟩 PERFECT, 🟨 trimmed, 🟥 the drop that ended it. Share your grid when you’re done!', WORLD_W / 2, y + 68, WORLD_W - 70, 11.5, 'rgba(255,255,255,0.85)');
      y += 160;
      this.pill(16, y, WORLD_W - 32, `▶ PLAY DAILY ROLL #${dailyNumber()}`, f, () => this.startDaily(), 'gold');
      y += 50;
    }
    // Stats.
    this.card(16, y, WORLD_W - 32, 150);
    const stats: [string, string][] = [['Played', String(d.played)], ['Streak', `🔥${d.day === dayKey() || d.last === dayKey(-1) ? d.streak : 0}`], ['Best', String(d.best)], ['Average', d.hist.length ? String(Math.round(d.hist.reduce((a, b) => a + b, 0) / d.hist.length)) : '–']];
    stats.forEach(([k, v], i) => {
      const x = 16 + (WORLD_W - 32) * ((i + 0.5) / 4);
      this.text(v, x, y + 26, 18, '#fff', 900);
      this.text(k, x, y + 46, 10, 'rgba(255,255,255,0.6)', 700);
    });
    const buckets = dailyBuckets(d.hist);
    const max = Math.max(1, ...buckets);
    buckets.forEach((n, i) => {
      const by = y + 66 + i * 13;
      this.text(i === 5 ? '50+' : `${i * 10}+`, 40, by + 5, 9, 'rgba(255,255,255,0.6)', 700, 'right');
      ctx.fillStyle = done && Math.min(5, Math.floor(d.height / 10)) === i ? '#2a9d5c' : 'rgba(255,255,255,0.25)';
      this.roundRect(46, by, Math.max(4, ((WORLD_W - 110) * n) / max), 10, 3);
      ctx.fill();
      if (n) this.text(String(n), 52 + ((WORLD_W - 110) * n) / max, by + 5.5, 9, '#fff', 700, 'left');
    });
    y += 158;
    y = this.drawDailyOnline(f, y, done ? d.height : null);
    this.screenEnd(f, y - f.y0);
  },

  /** Today's players worldwide and your friends' rolls (needs the online server). */
  drawDailyOnline(this: Game, f: { areaTop: number; areaH: number }, y: number, mine: number | null): number {
    const board = isOnline() ? dailyBoard(dayKey(), this.playerId()) : null;
    if (board && board.players) {
      const rows = board.top.slice(0, 5);
      this.card(16, y, WORLD_W - 32, 44 + rows.length * 20);
      this.fitText(mine !== null ? `🌍 You beat ${beatShare(board, mine)}% of ${board.players.toLocaleString('en-US')} players${board.rank ? ` · #${board.rank}` : ''}` : `🌍 ${board.players.toLocaleString('en-US')} players rolled today`, WORLD_W / 2, y + 22, WORLD_W - 60, 12.5, '#fff', 'center', 700);
      rows.forEach((r, i) => {
        this.fitText(`${i + 1}. ${r.name}`, 34, y + 46 + i * 20, 220, 11, 'rgba(255,255,255,0.85)', 'left', 600);
        this.text(String(r.score), WORLD_W - 34, y + 46 + i * 20, 11, '#ffd34d', 700, 'right');
      });
      y += 52 + rows.length * 20;
    }
    // Friends.
    const fl = friendList();
    const scores = friendScores(dayKey());
    this.text(t('friendsToday'), 20, y + 12, 12, '#ffd34d', 700, 'left');
    y += 24;
    if (!fl.length) {
      this.wrapLeft('Add friends with their invite code (INV-…) to compare Daily Rolls. Send them yours from the button below.', 16, y + 4, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.7)');
      y += 34;
    } else {
      const me = { id: '', name: `${this.progress.avatar.name} (you)`, score: mine };
      const list = [me, ...fl.map((fr) => ({ id: fr.id, name: fr.name, score: scores?.[fr.id]?.score ?? null }))].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
      for (const r of list) {
        this.card(16, y, WORLD_W - 32, 34, r.id ? undefined : 'rgba(255,211,77,0.25)');
        this.fitText(r.name, 30, y + 17, 200, 12, '#fff', 'left', 700);
        this.fitText(r.score !== null ? `${r.score} layers` : isOnline() ? 'not yet today' : '–', WORLD_W - 30, y + 17, 120, 11.5, r.score !== null ? '#ffd34d' : 'rgba(255,255,255,0.5)', 'right', 700);
        y += 38;
      }
      if (!isOnline()) {
        this.wrapLeft('Friends’ scores appear once online play is switched on (it needs the game’s server).', 16, y + 4, WORLD_W - 32, 10, 'rgba(255,255,255,0.6)');
        y += 28;
      }
    }
    const half = (WORLD_W - 42) / 2;
    this.pill(16, y, half, t('addFriend'), f, () => this.openCodeInput('friend'), 'quiet');
    this.pill(26 + half, y, half, t('myCode'), f, () => this.copy(this.progress.inviteCode, `Your code ${this.progress.inviteCode} is copied. Send it to friends!`), 'quiet');
    return y + 50;
  },

  startRelay(this: Game): void {
    this.relay = { turn: 0, stats: [{ p: 0, c: 0 }, { p: 0, c: 0 }] };
    this.startRun(Math.max(3, Math.min(this.progress.playLevel, 25)), 'relay', { picked: new Set() });
    this.coach('👥 RELAY', 'Two players, one tower. Take turns: Player 1 drops, then Player 2, then Player 1… Don’t be the one who drops it!', 5);
  },

  /** After each drop in relay, credit the player and pass the phone. */
  relayLanded(this: Game, perfect: boolean): void {
    const r = this.relay;
    if (!r || this.runMode !== 'relay') return;
    if (perfect) r.stats[r.turn].p++;
    else r.stats[r.turn].c++;
    r.turn = r.turn === 0 ? 1 : 0;
    announce(`Player ${r.turn + 1}’s turn`);
  },

  relayColor(this: Game, turn: number): string {
    return turn === 0 ? '#ff8a5b' : '#4cc9f0';
  },

  liveEvent(this: Game) {
    return liveEventNow();
  },

  startAsmr(this: Game): void {
    this.startRun(this.progress.playLevel, 'asmr', { picked: new Set() });
    this.coach('🎧 ASMR KITCHEN', 'Headphones on. No music, no game over: just soft knife sounds and slow layers. Tap END when you’re relaxed.', 5);
  },

  async startCamera(this: Game): Promise<void> {
    if (this.camStream || !navigator.mediaDevices?.getUserMedia) {
      if (!navigator.mediaDevices?.getUserMedia) {
        this.tableMode = false;
        this.showToast('This device can’t share its camera with the game');
      }
      return;
    }
    try {
      this.camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.srcObject = this.camStream;
      await v.play();
      this.video = v;
    } catch {
      this.tableMode = false;
      this.stopCamera();
      this.showToast('Camera not available. Table mode is off.');
    }
  },

  stopCamera(this: Game): void {
    this.camStream?.getTracks().forEach((t) => t.stop());
    this.camStream = null;
    this.video = null;
  },

  /** Table mode: the camera feed replaces the backdrop, so the tower stands on your real table. */
  drawTable(this: Game): boolean {
    const v = this.video;
    if (!this.tableMode || !v || v.readyState < 2 || (this.mode !== 'playing' && this.mode !== 'dead')) return false;
    const { ctx } = this;
    const bw = WORLD_W + this.offX * 2;
    const k = Math.max(bw / v.videoWidth, this.viewH / v.videoHeight);
    const w = v.videoWidth * k;
    const h = v.videoHeight * k;
    ctx.drawImage(v, -this.offX + (bw - w) / 2, (this.viewH - h) / 2, w, h);
    ctx.fillStyle = 'rgba(20,10,25,0.18)';
    ctx.fillRect(-this.offX, 0, bw, this.viewH);
    return true;
  },

  startCustom(this: Game, b: BossDesign, friend: boolean): void {
    this.customBoss = b;
    this.customChef = bossChef(b);
    this.customFromFriend = friend;
    this.startRun(15, 'custom', { picked: new Set() });
  },

  customWon(this: Game): void {
    const b = this.customBoss;
    if (!b) return;
    const p = this.progress;
    if (this.customFromFriend && !p.customWins.includes(b.name)) {
      p.customWins.push(b.name);
      this.bankCoins(100);
      this.showToast(`🏆 You beat ${b.name}! +100 coins (${p.customWins.length} friends’ bosses beaten)`);
    }
    track('custom_boss_win', { friend: this.customFromFriend });
  },

  saveDraft(this: Game): void {
    this.progress.myBoss = encodeBoss(this.bossDraft);
    this.progress.persist();
  },

  shareBoss(this: Game): void {
    const code = encodeBoss(this.bossDraft);
    this.saveDraft();
    const text = `I made a boss chef in Sushi Stack: ${this.bossDraft.name}! Beat them: open Friend Code and enter ${code}`;
    track('boss_share');
    if (navigator.share) void navigator.share({ text }).catch(() => this.copy(code, 'Boss code copied!'));
    else this.copy(code, 'Boss code copied!');
  },

  drawBossMaker(this: Game): void {
    const b = this.bossDraft;
    const f = this.screenBegin('BOSS CHEF MAKER', 'Design a boss, then dare your friends to beat them');
    let y = f.y0 + 4;
    const chef = bossChef(b);
    // Preview.
    this.card(16, y, WORLD_W - 32, 190, 'rgba(70,30,60,0.96)');
    drawChef(this.ctx, chef, WORLD_W / 2, y + 64, 0.95, 'focused', WORLD_W / 2 + Math.sin(this.time) * 60, y + 260, this.time);
    this.fitText(b.name, WORLD_W / 2, y + 150, WORLD_W - 60, 18, '#fff', 'center', 900);
    this.fitText(`“${PHRASES[b.phrase].intro}”`, WORLD_W / 2, y + 172, WORLD_W - 60, 11, '#ffd34d', 'center', 700);
    y += 198;
    this.pill(16, y, WORLD_W - 32, '✎ RENAME', f, () => {
      const n = window.prompt('Boss chef name (up to 14 letters)', b.name);
      if (n && n.trim()) {
        b.name = n.trim().slice(0, 14);
        this.saveDraft();
      }
    }, 'quiet');
    y += 44;
    const row = (label: string, value: string, step: (d: number) => void) => {
      this.card(16, y, WORLD_W - 32, 42);
      this.text(label, 30, y + 21, 12, 'rgba(255,255,255,0.8)', 700, 'left');
      this.fitText(value, 262, y + 21, 120, 12, '#fff', 'center', 700);
      this.pill(150, y + 5, 30, '◀', f, () => { step(-1); this.saveDraft(); }, 'quiet');
      this.pill(WORLD_W - 46, y + 5, 30, '▶', f, () => { step(1); this.saveDraft(); }, 'quiet');
      y += 48;
    };
    const cyc = (v: number, d: number, n: number) => (v + d + n) % n;
    row('Skin', `Tone ${b.skin + 1}`, (d) => { b.skin = cyc(b.skin, d, LOOK_SIZES.skin); });
    row('Hair', HAIRS[b.hair], (d) => { b.hair = cyc(b.hair, d, LOOK_SIZES.hair); });
    row('Hair colour', `Colour ${b.hairColor + 1}`, (d) => { b.hairColor = cyc(b.hairColor, d, LOOK_SIZES.hairColor); });
    row('Hat', HATS[b.hat], (d) => { b.hat = cyc(b.hat, d, LOOK_SIZES.hat); });
    row('Outfit', `Style ${b.outfit + 1}`, (d) => { b.outfit = cyc(b.outfit, d, LOOK_SIZES.outfit); });
    row('Face', FACES[b.face], (d) => { b.face = cyc(b.face, d, LOOK_SIZES.face); });
    row('Catchphrase', PHRASES[b.phrase].intro, (d) => { b.phrase = cyc(b.phrase, d, PHRASES.length); });
    this.text('RULES', 20, y + 10, 12, '#ffd34d', 700, 'left');
    y += 24;
    row('Speed', SPEEDS[b.speed].name, (d) => { b.speed = cyc(b.speed, d, SPEEDS.length); });
    row('Extra layers', `+${b.extra}`, (d) => { b.extra = cyc(b.extra, d, 5); });
    row('Attack often', ['Rarely', 'Sometimes', 'A lot'][b.mean], (d) => { b.mean = cyc(b.mean, d, 3); });
    const tw = (WORLD_W - 42) / 2;
    this.pill(16, y, tw, b.wobble ? '✓ SURGES' : 'SURGES: OFF', f, () => { b.wobble = !b.wobble; this.saveDraft(); }, b.wobble ? 'primary' : 'quiet');
    this.pill(26 + tw, y, tw, b.tight ? '✓ SMALL PERFECT' : 'SMALL PERFECT: OFF', f, () => { b.tight = !b.tight; this.saveDraft(); }, b.tight ? 'primary' : 'quiet');
    y += 44;
    this.text('ATTACKS', 20, y + 10, 12, '#ffd34d', 700, 'left');
    y += 24;
    const aw = (WORLD_W - 32 - 12) / 3;
    ALL_ATTACKS.forEach((a, i) => {
      const on = b.attacks.includes(a.id);
      this.pill(16 + (i % 3) * (aw + 6), y + Math.floor(i / 3) * 40, aw, `${a.icon} ${a.name}`, f, () => {
        b.attacks = on ? b.attacks.filter((x) => x !== a.id) : [...b.attacks, a.id];
        this.saveDraft();
      }, on ? 'primary' : 'quiet');
    });
    y += Math.ceil(ALL_ATTACKS.length / 3) * 40 + 8;
    this.pill(16, y, WORLD_W - 32, '⚔️ TEST FIGHT', f, () => this.startCustom({ ...b }, false), 'gold');
    y += 44;
    this.pill(16, y, (WORLD_W - 42) / 2, '📤 SHARE CODE', f, () => this.shareBoss(), 'quiet');
    this.pill(26 + (WORLD_W - 42) / 2, y, (WORLD_W - 42) / 2, '🤝 FIGHT A FRIEND’S', f, () => this.openCodeInput('friend'), 'quiet');
    y += 44;
    if (this.progress.customWins.length) {
      this.fitText(`Friends’ bosses beaten: ${this.progress.customWins.slice(-5).join(', ')}`, WORLD_W / 2, y + 10, WORLD_W - 40, 10.5, 'rgba(255,255,255,0.7)', 'center', 600);
      y += 26;
    }
    this.screenEnd(f, y - f.y0);
  },

  /** Everything a run can be shared as: photo, poster, highlight video, its song, the Daily grid. */
  drawStudio(this: Game, blocker: () => void): void {
    const { ctx } = this;
    blocker();
    ctx.fillStyle = 'rgba(10,5,15,0.86)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    const opts: [string, string, () => void][] = [
      ['📸 PHOTO', 'Your tower with filters and frames', () => { this.studio = false; this.openPhoto(); }],
      ['🖼️ POSTER', 'A tall print with your height and landmark', () => { this.studio = false; this.poster = { style: 0, img: null }; }],
      ['🎬 HIGHLIGHT VIDEO', clipsSupported() ? '10-second vertical video for TikTok, Reels and Shorts' : 'Not supported on this device', () => { this.studio = false; void this.makeHighlight(); }],
      ['🎵 PLAY YOUR SONG', `${this.song.length} notes: your run as a tune`, () => this.playRunSong()],
      ['🔗 SHARE SONG CODE', 'Friends paste it under Friend Code to hear it', () => this.shareSong()],
    ];
    if (this.runMode === 'daily' && this.dailyDone()) opts.unshift(['🟩 DAILY GRID', 'Copy your Wordle-style grid', () => this.shareDaily()]);
    const h = 54;
    const top = this.viewH / 2 - (opts.length * (h + 8) + 120) / 2;
    this.text('SHARE STUDIO', WORLD_W / 2, top + 20, 22, '#fff', 900);
    this.fitText(`${this.height} layers · ${landmarkFor(this.height).beat ? `taller than ${landmarkFor(this.height).beat!.name}` : 'a fine roll'}`, WORLD_W / 2, top + 46, WORLD_W - 60, 12, '#ffd34d', 'center', 700);
    opts.forEach(([label, sub, go], i) => {
      const y = top + 66 + i * (h + 8);
      this.card(30, y, WORLD_W - 60, h, 'rgba(48,30,52,0.98)');
      this.text(label, 48, y + 20, 14, '#fff', 900, 'left');
      this.fitText(sub, 48, y + 39, WORLD_W - 110, 10.5, 'rgba(255,255,255,0.7)', 'left', 600);
      this.buttons.push({ x: 30, y, w: WORLD_W - 60, h, onTap: go, label });
    });
    this.button(30, top + 74 + opts.length * (h + 8), WORLD_W - 60, 44, t('back'), () => { this.studio = false; stopSong(); }, 'quiet');
  },

  playRunSong(this: Game): void {
    if (!this.song.length) return this.showToast('Stack a few layers first!');
    const len = playSong(this.song);
    this.showToast(`🎵 Playing your ${this.song.length}-note song (${Math.ceil(len)}s)`);
  },

  shareSong(this: Game): void {
    if (!this.song.length) return this.showToast('Stack a few layers first!');
    const code = encodeSong(this.song);
    const text = `Listen to my Sushi Stack run (${this.height} layers)! Open Friend Code and enter: ${code}`;
    if (navigator.share) void navigator.share({ text }).catch(() => this.copy(code, 'Song code copied!'));
    else this.copy(code, 'Song code copied!');
  },

  /** A tall 1080×1920 poster of this run's tower, next to the landmark it beat. */
  renderPoster(this: Game, style: number): HTMLCanvasElement {
    const P = Game.POSTERS[style];
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1920;
    const x = c.getContext('2d')!;
    const g = x.createLinearGradient(0, 0, 0, 1920);
    g.addColorStop(0, P.bg[0]);
    g.addColorStop(1, P.bg[1]);
    x.fillStyle = g;
    x.fillRect(0, 0, 1080, 1920);
    if (style === 0) {
      x.fillStyle = '#fff';
      for (let i = 0; i < 90; i++) x.fillRect((i * 97) % 1080, (i * 211) % 900, i % 7 ? 2 : 4, i % 7 ? 2 : 4);
    } else if (style === 1) {
      x.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 40; i++) {
        x.beginPath();
        x.ellipse((i * 131) % 1080, (i * 173) % 1920, 10, 5, i, 0, Math.PI * 2);
        x.fill();
      }
    } else {
      x.strokeStyle = 'rgba(255,211,77,0.35)';
      x.lineWidth = 6;
      x.strokeRect(40, 40, 1000, 1840);
      x.strokeRect(60, 60, 960, 1800);
    }
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = P.ink;
    x.font = `700 96px ${FONT}`;
    x.fillText('SUSHI STACK', 540, 150);
    x.font = `600 36px ${FONT}`;
    x.fillText(new Date().toLocaleDateString(), 540, 220);
    // The tower, scaled to fit.
    const layers = this.stack;
    const towerH = layers.length * LAYER_H;
    const k = Math.min(3, 1100 / Math.max(towerH, 1));
    const floor = 1450;
    const lm = landmarkFor(this.height).beat;
    if (lm) {
      // The landmark beaten, as a column of its true height beside the tower, with its name on top.
      const ch = Math.min(1150, (lm.m / METERS_PER_LAYER) * LAYER_H * k);
      x.fillStyle = style === 1 ? 'rgba(74,38,24,0.18)' : 'rgba(255,255,255,0.16)';
      x.fillRect(150, floor - ch, 130, ch);
      x.strokeStyle = P.accent;
      x.lineWidth = 4;
      x.setLineDash([14, 10]);
      x.strokeRect(150, floor - ch, 130, ch);
      x.setLineDash([]);
      x.font = '84px sans-serif';
      x.fillText(lm.emoji, 215, floor - ch - 70);
      x.fillStyle = P.ink;
      x.font = `600 30px ${FONT}`;
      x.fillText(`${lm.m} m`, 215, floor - ch - 18);
    }
    const saved = this.ctx;
    this.ctx = x;
    x.save();
    x.translate(640 - (WORLD_W / 2) * k, floor);
    x.scale(k, k);
    for (const l of layers) this.drawLayer(l);
    x.restore();
    this.ctx = saved;
    x.fillStyle = P.accent;
    x.fillRect(340, floor + 4, 600, 12);
    drawSake(x, 900, 1720, 2.2, 'proud', 0.4);
    drawChef(x, avatarChef(this.progress.avatar), 170, 1650, 2, 'happy', 540, 1400, 0);
    x.fillStyle = P.ink;
    x.font = `700 130px ${FONT}`;
    x.fillText(`${this.height * METERS_PER_LAYER} m`, 560, 1560);
    x.font = `600 44px ${FONT}`;
    x.fillStyle = P.accent;
    x.fillText(lm ? `taller than ${lm.name}` : 'and still growing', 560, 1650);
    x.fillStyle = P.ink;
    x.font = `600 36px ${FONT}`;
    x.fillText(`Chef ${this.progress.avatar.name} · ${this.ordersServed} chef${this.ordersServed === 1 ? '' : 's'} beaten`, 560, 1720);
    if (this.runMode === 'daily') x.fillText(`Daily Roll #${dailyNumber()}`, 560, 1780);
    return c;
  },

  drawPoster(this: Game, blocker: () => void): void {
    const pv = this.poster!;
    const { ctx } = this;
    blocker();
    ctx.fillStyle = '#0d0810';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    if (!pv.img) pv.img = this.renderPoster(pv.style);
    const top = this.insets.top + 16;
    const ph = this.viewH - this.insets.bottom - 130 - top;
    const pw = ph * (1080 / 1920);
    ctx.drawImage(pv.img, WORLD_W / 2 - pw / 2, top, pw, ph);
    const by = top + ph + 12;
    this.button(20, by, WORLD_W - 40, 38, `🎨 Style: ${Game.POSTERS[pv.style].name}`, () => { pv.style = (pv.style + 1) % Game.POSTERS.length; pv.img = null; }, 'quiet');
    this.button(20, by + 46, (WORLD_W - 48) / 2, 44, t('back'), () => { this.poster = null; }, 'quiet');
    this.button(28 + (WORLD_W - 48) / 2, by + 46, (WORLD_W - 48) / 2, 44, '📤 SAVE / SHARE', () => { void sharePhoto(pv.img ?? this.renderPoster(pv.style)); track('poster_share', { style: pv.style }); }, 'gold');
  },

  /**
   * Renders a 10-second vertical highlight: title card, the tower building up with its song,
   * a zoom-out to the whole tower next to the landmark it beat, then an end card.
   */
  async makeHighlight(this: Game): Promise<void> {
    if (!clipsSupported()) return this.showToast('Video recording isn’t supported on this device');
    if (this.hl) return;
    const c = document.createElement('canvas');
    c.width = 720;
    c.height = 1280;
    const x = c.getContext('2d')!;
    const stream = c.captureStream(30);
    audioStream()?.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    const type = clipType();
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 3_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise<void>((r) => { rec.onstop = () => r(); });
    const layers = this.stack.slice();
    const marks = this.marks;
    const song = this.song.slice();
    const height = this.height;
    const beaten = this.ordersServed;
    const chefName = this.chef.name;
    this.hl = { pct: 0 };
    rec.start();
    const DUR = 10;
    const start = performance.now();
    let played = -1;
    await new Promise<void>((resolve) => {
      const frame = () => {
        const t = (performance.now() - start) / 1000;
        this.highlightFrame(x, t, layers, marks, height, beaten, chefName, (i) => {
          // Play the song as the tower builds (thinned out so tall towers don't become noise).
          const every = Math.max(1, Math.ceil(layers.length / 40));
          for (let k = played + 1; k <= i; k++) if (k % every === 0 && song[k] !== undefined) songNote(song[k] >> 2, (song[k] & 2) > 0, (song[k] & 1) > 0);
          played = Math.max(played, i);
        });
        if (this.hl) this.hl.pct = Math.min(1, t / DUR);
        if (t < DUR) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    rec.stop();
    await stopped;
    this.hl = null;
    if (!chunks.length) return this.showToast('The video couldn’t be made. Try again?');
    const file = new File(chunks, `sushi-stack-highlight.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type: type.split(';')[0] });
    track('highlight', { height });
    await shareClip(file, height);
  },

  highlightFrame(this: Game, x: CanvasRenderingContext2D, t: number, layers: Layer[], marks: string, height: number, beaten: number, chefName: string, onReveal: (i: number) => void): void {
    const W = 720;
    const H = 1280;
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, this.theme.sky[0]);
    g.addColorStop(1, this.theme.sky[1]);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const ink = (s: string, y: number, size: number, color = '#fff', weight = 700) => {
      x.font = `${weight} ${size}px ${FONT}`;
      x.lineWidth = size / 6;
      x.strokeStyle = 'rgba(30,15,30,0.75)';
      x.strokeText(s, W / 2, y);
      x.fillStyle = color;
      x.fillText(s, W / 2, y);
    };
    if (t < 1.5) {
      ink('SUSHI STACK', 300, 84, '#ffd34d');
      ink(`Chef ${this.progress.avatar.name}`, 520, 56);
      ink('vs', 610, 40, '#ffb4a2');
      ink(chefName, 700, 56);
      drawSake(x, W / 2, 1000, 2.4 * Math.min(1, t * 2), 'grumpy', t);
      return;
    }
    const n = layers.length;
    const saved = this.ctx;
    this.ctx = x;
    let k = 1.8;
    let revealed = n - 1;
    if (t < 7) revealed = Math.min(n - 1, Math.floor(Math.pow((t - 1.5) / 5.5, 0.85) * n));
    else {
      const z = Math.min(1, (t - 7) / 1.4);
      const fit = Math.min(1.8, 1050 / Math.max(1, n * LAYER_H));
      k = 1.8 + (fit - 1.8) * (1 - Math.pow(1 - z, 3));
    }
    onReveal(revealed);
    const topY = layers[revealed]?.y ?? 0;
    // Follow the top while building; settle the whole tower on the floor when zoomed out.
    const follow = t < 7 ? 640 - topY * k : 1180;
    x.save();
    x.translate(W / 2 - (WORLD_W / 2) * k, Math.max(1180, follow));
    x.scale(k, k);
    for (let i = 0; i <= revealed; i++) {
      this.drawLayer(layers[i]);
      if (marks[i - 1] === 'P' && t < 7 && i > revealed - 3) {
        x.fillStyle = 'rgba(255,243,176,0.55)';
        x.fillRect(layers[i].x - 4, layers[i].y - 3, layers[i].w + 8, LAYER_H + 6);
      }
    }
    x.restore();
    this.ctx = saved;
    const m = Math.round(((revealed + 1) / Math.max(1, n)) * height) * METERS_PER_LAYER;
    if (t < 9) ink(`${m} m`, 140, 96);
    if (t >= 7 && t < 9) {
      const lm = landmarkFor(height).beat;
      ink(lm ? `${lm.emoji} Taller than ${lm.name.replace(/^the /, 'the ')}!` : `${beaten} chefs beaten!`, 240, 38, '#ffd34d');
    }
    if (t >= 9) {
      x.fillStyle = `rgba(20,10,25,${Math.min(0.85, (t - 9) * 2)})`;
      x.fillRect(0, 0, W, H);
      ink('SUSHI STACK', 360, 84, '#ffd34d');
      ink(`Can you beat ${height} m?`, 470, 48);
      drawSake(x, W / 2, 800, 2.6, 'wink', t);
    }
  },

  drawHighlightProgress(this: Game, blocker: () => void): void {
    const { ctx } = this;
    blocker();
    ctx.fillStyle = 'rgba(10,5,15,0.9)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    const midY = this.viewH / 2;
    drawSake(ctx, WORLD_W / 2, midY - 70, 1.2, 'grumpy', this.time);
    this.text('MAKING YOUR HIGHLIGHT…', WORLD_W / 2, midY + 10, 16, '#fff', 900);
    this.bar(60, midY + 34, WORLD_W - 120, this.hl!.pct, '#ffd34d', 10);
    this.text('Keep the app open for 10 seconds', WORLD_W / 2, midY + 66, 11, 'rgba(255,255,255,0.7)', 600);
  },

  /** Rival chefs remember your history with them. */
  recordChef(this: Game, level: number, won: boolean): void {
    if (!this.journey) return;
    const log = this.progress.chefLog;
    const e = log[level] ?? { f: 0, w: 0, l: 0, combo: 0, h: 0, at: 0 };
    e.f++;
    if (won) e.w++;
    else e.l++;
    e.combo = Math.max(e.combo, this.runMaxCombo);
    e.h = this.height;
    e.at = Date.now();
    log[level] = e;
  },

  /** Story choices nudge later chefs: more help, fewer attacks, or faster and richer. */
  chefWithChoices(this: Game, level: number): Chef {
    const ch = this.progress.choices;
    const key = `${level}|${ch.ch2 ?? ''}|${ch.ch3 ?? ''}`;
    const hit = this.chefMemo.get(key);
    if (hit) return hit;
    const base = chefFor(level);
    let c = base;
    if (level > 20 && level <= 40 && ch.ch2 === 'market') c = { ...c, kind: Math.min(0.9, c.kind * 1.6) };
    if (level > 30 && level <= 40 && ch.ch3 === 'mentor') c = { ...c, mean: c.mean * 0.75 };
    if (level > 30 && level <= 40 && ch.ch3 === 'solo') c = { ...c, speed: c.speed * 1.06 };
    if (this.chefMemo.size > 200) this.chefMemo.clear();
    this.chefMemo.set(key, c);
    return c;
  },

  choose(this: Game, id: string, opt: string): void {
    const c = CHOICES.find((x) => x.id === id);
    const o = c?.options.find((x) => x.id === opt);
    if (!c || !o) return;
    this.progress.choices[id] = opt;
    this.progress.persist();
    this.chefMemo.clear();
    this.story = null;
    this.celebrate(o.label.toUpperCase(), o.effect, 2.4);
    track('story_choice', { id, opt });
  },

  /** A choice you can still make (you passed its chapter but haven't chosen). */
  pendingChoice(this: Game): (typeof CHOICES)[number] | undefined {
    return CHOICES.find((c) => !this.progress.choices[c.id] && this.progress.unlocked > (c.afterChapter + 1) * 10);
  },

  letterStats(this: Game): LetterStats {
    const p = this.progress;
    return {
      level: p.unlocked, served: p.stats.served ?? 0, perfects: p.stats.perfects ?? 0, restaurant: p.restaurant.levels[0] > 0,
      expansions: this.diner.expansions, dailyPlayed: p.daily.played, combos: p.combos.length, landmark: p.landmark,
      worlds: p.seen.filter((k) => k.startsWith('world:')).map((k) => k.slice(6)),
    };
  },

  /** Grandma's letters arrive as you reach milestones. */
  checkLetters(this: Game): void {
    const p = this.progress;
    const s = this.letterStats();
    for (const l of LETTERS) {
      if (p.letters.includes(l.id) || !letterUnlocked(l, s)) continue;
      p.letters.push(l.id);
      p.persist();
      this.showToast(`💌 A letter from Grandma: “${l.title}”. Read it in Grandma’s Book!`);
      track('letter', { id: l.id });
    }
  },

  lettersUnread(this: Game): number {
    return this.progress.letters.filter((id) => !this.progress.lettersRead.includes(id)).length;
  },

  drawLetter(this: Game, blocker: () => void): void {
    const l = LETTERS.find((x) => x.id === this.letterOpen);
    if (!l) {
      this.letterOpen = null;
      return;
    }
    const { ctx } = this;
    blocker();
    ctx.fillStyle = 'rgba(10,5,15,0.82)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    const top = this.viewH / 2 - 250;
    // Paper with ruled lines.
    ctx.save();
    ctx.translate(WORLD_W / 2, top + 230);
    ctx.rotate(-0.012);
    ctx.fillStyle = '#fbf3e1';
    this.roundRect(-170, -230, 340, 440, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,150,200,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.moveTo(-150, -150 + i * 22);
      ctx.lineTo(150, -150 + i * 22);
      ctx.stroke();
    }
    ctx.restore();
    this.text('💌', WORLD_W / 2, top + 26, 26, '#fff', 400);
    this.fitText(l.title, WORLD_W / 2, top + 58, 300, 17, '#7a3b2e', 'center', 700);
    let y = top + 96;
    ctx.font = `italic 600 13px ${FONT}`;
    for (const para of l.body) {
      y = this.wrapText(para, WORLD_W / 2, y, 290, 13, '#3a2418') + 8;
    }
    this.button(WORLD_W / 2 - 80, top + 420, 160, 44, 'CLOSE', () => { this.letterOpen = null; }, 'quiet');
  },

  sakeTap(this: Game): void {
    const lines = SAKE_LINES.home;
    this.sakeSay = { text: lines[Math.floor(Math.random() * lines.length)], t: 3 };
    sfx.tap();
    babble(this.sakeSay.text, 330);
  },

  seasonal(this: Game): Ingredient[] {
    return inSeason(new Date().getMonth());
  },

  pickTrivia(this: Game): void {
    const p = this.progress;
    const unseen = TRIVIA.map((_, i) => i).filter((i) => !p.trivia.includes(i));
    const pool = unseen.length ? unseen : TRIVIA.map((_, i) => i);
    this.triviaNow = pool[Math.floor(Math.random() * pool.length)];
    if (!p.trivia.includes(this.triviaNow)) p.trivia.push(this.triviaNow);
  },

  drawBook(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('GRANDMA’S BOOK', `${p.letters.length}/${LETTERS.length} letters · ${this.unlockedRecipeCards().length}/${RECIPE_CARDS.length} recipes · ${p.trivia.length}/${TRIVIA.length} facts`);
    let y = f.y0 + 4;
    const tabs: [Game['bookTab'], string][] = [['letters', 'LETTERS'], ['recipes', 'RECIPES'], ['seasons', 'SEASONS'], ['combos', 'COMBOS'], ['trivia', 'FACTS'], ['story', 'STORY']];
    const tw = (WORLD_W - 32 - 10) / 3;
    tabs.forEach(([id, label], i) => {
      const tx = 16 + (i % 3) * (tw + 5);
      const ty = y + Math.floor(i / 3) * 38;
      this.pill(tx, ty, tw, label, f, () => { this.bookTab = id; this.recipeOpen = null; }, this.bookTab === id ? 'primary' : 'quiet');
      if (id === 'letters' && this.lettersUnread()) this.dot(tx + tw - 5, ty + 4, 4.5, '#ff4d6d');
      if (id === 'story' && this.pendingChoice()) this.dot(tx + tw - 5, ty + 4, 4.5, '#ff4d6d');
    });
    y += 84;
    if (this.recipeOpen === null) drawSake(this.ctx, WORLD_W - 46, y + 10, 0.42, 'happy', this.time);
    switch (this.bookTab) {
      case 'letters': {
        this.wrapLeft('Grandma left letters around the old bar. They turn up as you reach milestones.', 16, y + 2, WORLD_W - 90, 10.5, 'rgba(255,255,255,0.75)');
        y += 34;
        for (const l of LETTERS) {
          const have = p.letters.includes(l.id);
          const unread = have && !p.lettersRead.includes(l.id);
          this.card(16, y, WORLD_W - 32, 50, have ? 'rgba(251,243,225,0.95)' : 'rgba(40,28,44,0.9)');
          this.text(have ? (unread ? '💌' : '✉️') : '🔒', 40, y + 25, 18, '#fff', 400);
          this.fitText(have ? l.title : '???', 62, y + 18, WORLD_W - 150, 13, have ? '#4a2618' : 'rgba(255,255,255,0.6)', 'left', 700);
          this.fitText(have ? (unread ? 'New! Tap to read' : 'Read again') : letterHint(l), 62, y + 35, WORLD_W - 150, 10, have ? '#c4501f' : 'rgba(255,255,255,0.5)', 'left', 600);
          if (have) this.listTap(16, y, WORLD_W - 32, 50, f, () => {
            this.letterOpen = l.id;
            if (!p.lettersRead.includes(l.id)) p.lettersRead.push(l.id);
            p.persist();
          });
          y += 56;
        }
        break;
      }
      case 'recipes': {
        const open = this.unlockedRecipeCards();
        if (this.recipeOpen !== null) {
          const r = RECIPE_CARDS[this.recipeOpen];
          this.card(16, y, WORLD_W - 32, 34, 'rgba(251,243,225,0.95)');
          this.fitText(`${DISH_EMOJI[r.dish] ?? '🍚'} ${r.dish} · serves ${r.serves} · ${r.time}`, WORLD_W / 2, y + 17, WORLD_W - 50, 13, '#4a2618', 'center', 700);
          y += 42;
          this.text('INGREDIENTS', 20, y + 8, 11, '#ffd34d', 700, 'left');
          y += 20;
          for (const ing of r.ingredients) y = this.wrapLeftH(`• ${ing}`, 24, y, WORLD_W - 48, 11.5, '#fff') + 4;
          y += 8;
          this.text('METHOD', 20, y + 8, 11, '#ffd34d', 700, 'left');
          y += 20;
          r.steps.forEach((st, i) => { y = this.wrapLeftH(`${i + 1}. ${st}`, 24, y, WORLD_W - 48, 11.5, '#fff') + 6; });
          y += 4;
          this.card(16, y, WORLD_W - 32, 54, 'rgba(42,90,60,0.95)');
          this.wrapLeft(`💡 ${r.tip}`, 28, y + 16, WORLD_W - 56, 10.5, '#fff');
          y += 62;
          this.pill(16, y, WORLD_W - 32, '← ALL RECIPES', f, () => { this.recipeOpen = null; }, 'quiet');
          y += 44;
          break;
        }
        this.wrapLeft('Real recipes to make at home. A dish’s card unlocks when it reaches level 3 (15 serves in runs and your restaurant).', 16, y + 2, WORLD_W - 90, 10.5, 'rgba(255,255,255,0.75)');
        y += 36;
        RECIPE_CARDS.forEach((r, i) => {
          const have = open.includes(i);
          const rec = RECIPES.find((x) => x.name === r.dish);
          this.card(16, y, WORLD_W - 32, 48, have ? 'rgba(251,243,225,0.95)' : 'rgba(40,28,44,0.9)');
          this.text(have ? DISH_EMOJI[r.dish] ?? '🍚' : '🔒', 40, y + 24, 18, '#fff', 400);
          this.fitText(r.dish, 62, y + 17, WORLD_W - 150, 13, have ? '#4a2618' : 'rgba(255,255,255,0.65)', 'left', 700);
          this.fitText(have ? `${r.time} · tap for the recipe` : rec ? `${this.dishServes(rec.name)}/15 serves` : 'Always open', 62, y + 34, WORLD_W - 150, 10, have ? '#c4501f' : 'rgba(255,255,255,0.5)', 'left', 600);
          if (have) this.listTap(16, y, WORLD_W - 32, 48, f, () => { this.recipeOpen = i; this.pageScroll = 0; });
          y += 54;
        });
        break;
      }
      case 'seasons': {
        const month = new Date().getMonth();
        const now = this.seasonal();
        this.card(16, y, WORLD_W - 32, 96, 'rgba(42,70,60,0.95)');
        this.text(`IN SEASON NOW (${MONTHS[month].toUpperCase()})`, 30, y + 18, 12, '#ffd34d', 700, 'left');
        this.fitText(now.length ? now.join(', ') : 'Nothing special this month', 30, y + 40, WORLD_W - 60, 15, '#fff', 'left', 700);
        this.wrapLeft(seasonNote(month) || 'Every month something is at its best.', 30, y + 62, WORLD_W - 60, 10, 'rgba(255,255,255,0.8)');
        y += 104;
        this.wrapLeft('In-season ingredients pay +1 coin per PERFECT in runs, and dishes made with them sell for 25% more in your restaurant.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
        y += 34;
        const cw = (WORLD_W - 32 - 15) / 4;
        MONTHS.forEach((mn, i) => {
          const x = 16 + (i % 4) * (cw + 5);
          const yy = y + Math.floor(i / 4) * 62;
          const items = inSeason(i);
          this.card(x, yy, cw, 56, i === month ? 'rgba(255,211,77,0.3)' : 'rgba(48,30,52,0.95)');
          this.text(mn, x + cw / 2, yy + 14, 11, i === month ? '#ffd34d' : '#fff', 700);
          this.fitText(items.join(' · ') || '–', x + cw / 2, yy + 36, cw - 8, 9.5, 'rgba(255,255,255,0.8)', 'center', 600);
        });
        y += 3 * 62 + 6;
        break;
      }
      case 'combos': {
        this.wrapLeft('Two PERFECTs in a row on these pairs set off a combo. Watch for the hint above the sliding layer!', 16, y + 2, WORLD_W - 90, 10.5, 'rgba(255,255,255,0.75)');
        y += 36;
        for (const cb of COMBOS) {
          const have = p.combos.includes(cb.name);
          this.card(16, y, WORLD_W - 32, 50, have ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
          this.text(have ? cb.emoji : '❔', 40, y + 25, 18, '#fff', 400);
          this.fitText(have ? cb.name : 'Undiscovered combo', 62, y + 17, 170, 13, have ? '#fff' : 'rgba(255,255,255,0.55)', 'left', 700);
          this.fitText(have ? `${cb.a} → ${cb.b} · ${cb.desc}` : `${cb.a} → ?`, 62, y + 35, WORLD_W - 100, 10, have ? '#9fe3ff' : 'rgba(255,255,255,0.45)', 'left', 600);
          y += 56;
        }
        break;
      }
      case 'trivia': {
        if (!p.trivia.length) {
          this.wrapLeft('Facts appear on the results screen after each run. Collect them all!', 16, y + 2, WORLD_W - 32, 11, 'rgba(255,255,255,0.8)');
          y += 30;
        }
        for (const i of [...p.trivia].reverse()) {
          this.card(16, y, WORLD_W - 32, 58);
          this.text('💡', 36, y + 29, 16, '#fff', 400);
          this.wrapLeft(TRIVIA[i], 56, y + 18, WORLD_W - 84, 10.5, '#fff');
          y += 64;
        }
        break;
      }
      case 'story': {
        for (const c of CHOICES) {
          const chosen = p.choices[c.id];
          const open = p.unlocked > (c.afterChapter + 1) * 10;
          this.card(16, y, WORLD_W - 32, chosen ? 76 : open ? 150 : 60, 'rgba(48,30,52,0.95)');
          this.fitText(`${c.title}${open ? '' : ' 🔒'}`, 30, y + 18, WORLD_W - 60, 13, '#fff', 'left', 700);
          if (!open) this.fitText(`Opens after chapter ${c.afterChapter + 1}`, 30, y + 40, WORLD_W - 60, 10.5, 'rgba(255,255,255,0.55)', 'left', 600);
          else if (chosen) {
            const o = c.options.find((x) => x.id === chosen)!;
            this.fitText(`You chose: ${o.label}`, 30, y + 40, WORLD_W - 60, 11, '#ffd34d', 'left', 700);
            this.fitText(o.effect, 30, y + 58, WORLD_W - 60, 10, '#8fdc93', 'left', 600);
          } else {
            this.wrapLeft(c.question, 30, y + 38, WORLD_W - 60, 10.5, 'rgba(255,255,255,0.8)');
            c.options.forEach((o, k) => this.pill(26, y + 70 + k * 38, WORLD_W - 52, `${o.label} · ${o.effect}`, f, () => this.choose(c.id, o.id), 'gold'));
          }
          y += (chosen ? 76 : open ? 150 : 60) + 8;
        }
        break;
      }
    }
    this.screenEnd(f, y - f.y0);
  },

  /** Like wrapLeft but with no line limit, returning the y after the text. */
  wrapLeftH(this: Game, str: string, x: number, y: number, maxW: number, size: number, color: string): number {
    const { ctx } = this;
    ctx.font = `600 ${size}px ${FONT}`;
    let line = '';
    for (const w of str.split(' ')) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        this.text(line, x, y + size * 0.6, size, color, 600, 'left');
        y += size * 1.35;
        line = w;
      } else line = test;
    }
    if (line) {
      this.text(line, x, y + size * 0.6, size, color, 600, 'left');
      y += size * 1.35;
    }
    return y;
  },

  unlockedRecipeCards(this: Game): number[] {
    return RECIPE_CARDS.map((r, i) => ({ r, i })).filter(({ r }) => {
      const rec = RECIPES.find((x) => x.name === r.dish);
      return !rec || dishLevel(this.dishServes(rec.name)) >= 3;
    }).map(({ i }) => i);
  },

  drawPromise(this: Game): void {
    const f = this.screenBegin('THE NO-NONSENSE PROMISE', 'How Sushi Stack treats you');
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 96, 'rgba(255,248,235,0.96)');
    drawSake(this.ctx, 64, y + 52, 0.8, 'proud', this.time);
    this.wrapText('“Fair is the best seasoning.” Here is everything we promise, and every chance in the game.', 238, y + 34, 250, 12, '#4a2618');
    y += 104;
    const promises: [string, string][] = [
      ['⏳', 'No energy, no lives, no waiting. Play as much as you like.'],
      ['🎲', 'Nothing random is sold for real money. Chests, sticker packs and prizes are earned by playing.'],
      ['🏆', 'Every level can be beaten without paying. Star gates use stars you earn.'],
      ['📺', 'Ads only when you choose to watch one for a bonus. Never between runs.'],
      ['🤖', 'Computer players are always labelled (AI) or “simulated”.'],
      ['📱', 'Your progress stays on your device. The game sends nothing; ads you choose to watch come from Google AdMob.'],
      ['📊', 'All odds are shown below.'],
    ];
    for (const [icon, line] of promises) {
      this.card(16, y, WORLD_W - 32, 50);
      this.text(icon, 38, y + 25, 18, '#fff', 400);
      this.wrapLeft(line, 60, y + 18, WORLD_W - 90, 10.5, '#fff');
      y += 56;
    }
    y += 6;
    this.text('THE ODDS', 20, y + 10, 13, '#ffd34d', 700, 'left');
    y += 26;
    const stickerOdds = (() => {
      const w = [0, 50, 28, 15, 6, 1];
      const by = [0, 0, 0, 0, 0, 0];
      STICKER_SETS.forEach((s, i) => s.stickers.forEach((_, k) => { by[stickerRarity(i, k)] += w[stickerRarity(i, k)]; }));
      const tot = by.reduce((a, b) => a + b, 0);
      return by.slice(1).map((v, i) => `${'★'.repeat(i + 1)} ${((v / tot) * 100).toFixed(1)}%`).join(' · ');
    })();
    const setTot = PIECE_SETS.reduce((a, s) => a + s.weight, 0);
    const odds: [string, string][] = [
      ['Boss chest', '10–34 coins + the level (×2 for legend bosses) · 30% a booster · always a piece toward the Dragon Plate · a sticker pack'],
      ['Sticker rarity', stickerOdds],
      ['Music track from a chest', '8% when you still have tracks to find'],
      ['Tableware from chefs', '25% from a boss (every 10th level), 6% from other chefs'],
      ['Tableware sets', PIECE_SETS.map((s) => `${s.name} ${Math.round((s.weight / setTot) * 100)}%`).join(' · ')],
      ['Golden guest', 'coins 40% · tableware 25% · music track 15% · boosters 12% · decor style 8%'],
    ];
    for (const [k, v] of odds) {
      this.card(16, y, WORLD_W - 32, 62);
      this.text(k, 30, y + 16, 12, '#fff', 700, 'left');
      this.wrapLeft(v, 30, y + 34, WORLD_W - 60, 10, 'rgba(255,255,255,0.8)');
      y += 68;
    }
    y += 6;
    this.text('WHAT YOU CAN BUY (ALL OPTIONAL)', 20, y + 10, 13, '#ffd34d', 700, 'left');
    y += 26;
    for (const pr of Object.values(PRODUCTS)) {
      this.card(16, y, WORLD_W - 32, 56);
      this.fitText(`${pr.name} · ${pr.price}`, 30, y + 17, WORLD_W - 60, 12, '#fff', 'left', 700);
      this.wrapLeft(pr.desc, 30, y + 34, WORLD_W - 60, 10, 'rgba(255,255,255,0.75)');
      y += 62;
    }
    if (monetize.testMode) {
      this.fitText('Purchases are in TEST MODE in this build: nothing is charged.', WORLD_W / 2, y + 8, WORLD_W - 40, 10.5, '#9fe3ff', 'center', 700);
      y += 24;
    }
    this.screenEnd(f, y - f.y0);
  },

  /** Your layers today and all time, toward the community tower. */
  addWorldLayers(this: Game, n: number): void {
    const w = this.progress.world as { day: string; today: number; total: number; claimed?: number[] };
    if (w.day !== dayKey()) {
      w.day = dayKey();
      w.today = 0;
      w.claimed = [];
    }
    w.today += n;
    w.total += n;
    if (n > 0) postWorld(dayKey(), this.playerId(), n);
  },

  drawWorld(this: Game): void {
    const { ctx } = this;
    const w = this.progress.world as { day: string; today: number; total: number; claimed?: number[] };
    if (w.day !== dayKey()) this.addWorldLayers(0);
    // Live from the server when it's switched on; simulated (and labelled so) otherwise.
    const live = worldTotal(dayKey());
    const total = live ? Math.max(live.total, w.today) : worldSimToday(dayKey()) + w.today;
    const f = this.screenBegin('TOWER OF THE WORLD', 'Everyone’s layers today, stacked into one tower');
    let y = f.y0 + 4;
    // The tower: a tall bar climbing past the milestones.
    const top = WORLD_MILESTONES[WORLD_MILESTONES.length - 1].layers;
    const h = 300;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#05061a');
    g.addColorStop(0.5, '#3a2f6e');
    g.addColorStop(1, '#7fc8ff');
    ctx.fillStyle = g;
    this.roundRect(16, y, WORLD_W - 32, h, 14);
    ctx.fill();
    const frac = Math.min(1, total / top);
    const tx = 70;
    for (let i = 0; i < 40; i++) {
      const ly = y + h - 10 - i * 7;
      if (ly < y + h - 10 - frac * (h - 20)) break;
      ctx.fillStyle = ['#f6f1e4', '#24321f', '#ff8a5b', '#d7263d', '#9bc53d'][i % 5];
      this.roundRect(tx - 22, ly - 6, 44, 6, 2);
      ctx.fill();
    }
    for (const m of WORLD_MILESTONES) {
      const my = y + h - 10 - (m.layers / top) * (h - 20);
      const done = total >= m.layers;
      ctx.strokeStyle = done ? '#ffd34d' : 'rgba(255,255,255,0.35)';
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(tx + 30, my);
      ctx.lineTo(WORLD_W - 28, my);
      ctx.stroke();
      ctx.setLineDash([]);
      this.fitText(`${m.emoji} ${m.name}`, tx + 36, my - 8, WORLD_W - 150, 10, done ? '#ffd34d' : 'rgba(255,255,255,0.7)', 'left', 700);
      this.text(`${(m.layers / 1e6).toFixed(m.layers < 1e6 ? 1 : 1)}M`, WORLD_W - 30, my - 8, 9.5, 'rgba(255,255,255,0.6)', 700, 'right');
    }
    y += h + 8;
    this.card(16, y, WORLD_W - 32, 96);
    this.text(`${total.toLocaleString('en-US')} layers today`, WORLD_W / 2, y + 22, 18, '#fff', 900);
    this.fitText(`You: ${w.today.toLocaleString('en-US')} today · ${w.total.toLocaleString('en-US')} all time`, WORLD_W / 2, y + 46, WORLD_W - 60, 12, '#ffd34d', 'center', 700);
    this.wrapText(live ? `Live: ${live.players.toLocaleString('en-US')} players stacking today. Every layer counts.` : 'Other players are simulated until online play is switched on (it needs a server). Your own layers count for real.', WORLD_W / 2, y + 64, WORLD_W - 70, 9.5, 'rgba(255,255,255,0.6)');
    y += 104;
    const claimed = w.claimed ?? [];
    for (const m of WORLD_MILESTONES) {
      const done = total >= m.layers;
      const got = claimed.includes(m.layers);
      this.card(16, y, WORLD_W - 32, 48, done ? 'rgba(42,70,60,0.95)' : 'rgba(40,28,44,0.9)');
      this.text(m.emoji, 40, y + 24, 18, '#fff', 400);
      this.fitText(m.name, 62, y + 24, WORLD_W - 190, 12, '#fff', 'left', 700);
      if (got) this.text('✓', WORLD_W - 34, y + 24, 14, '#8fdc93', 700, 'right');
      else this.pill(WORLD_W - 112, y + 8, 82, done ? `+${m.reward} 🪙` : 'not yet', f, () => {
        if (!done || w.claimed?.includes(m.layers)) return;
        w.claimed = [...(w.claimed ?? []), m.layers];
        this.bankCoins(m.reward);
        this.progress.persist();
        this.celebrate(`${m.emoji} ${m.name.toUpperCase()}`, `The world got there together · +${m.reward} coins`, 2);
      }, done ? 'gold' : 'quiet');
      y += 54;
    }
    this.screenEnd(f, y - f.y0);
  },

  drawCountries(this: Game): void {
    const p = this.progress;
    if (!settings.country) {
      settings.country = guessCountry();
      saveSettings();
    }
    const mine = countryById(settings.country);
    const cw = p.countryWeek.week === weekKey() ? p.countryWeek : { week: weekKey(), best: 0, runs: 0 };
    const rows = countryRows(weekKey());
    const live = !!rows?.length;
    const board = live
      ? rows!.map((r) => ({ c: countryById(r.id), score: r.score, you: r.id === mine.id, players: r.players })).filter((r) => COUNTRIES.some((c) => c.id === r.c.id))
      : countryBoard({ id: mine.id, best: cw.best }).map((r) => ({ ...r, players: 0 }));
    if (live && !board.some((r) => r.you)) board.push({ c: mine, score: cw.best, you: true, players: cw.best ? 1 : 0 });
    const f = this.screenBegin('COUNTRY CUP', 'Average best height per country this week');
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 72, 'rgba(70,40,90,0.96)');
    this.text(mine.flag, 46, y + 36, 30, '#fff', 400);
    this.fitText(`You play for ${mine.name}`, 76, y + 24, 190, 14, '#fff', 'left', 700);
    this.fitText(`Your best this week: ${cw.best} · rank #${board.findIndex((r) => r.you) + 1}`, 76, y + 46, 200, 11, '#ffd34d', 'left', 700);
    const idx = COUNTRIES.findIndex((c) => c.id === mine.id);
    this.pill(WORLD_W - 110, y + 20, 80, 'CHANGE', f, () => {
      settings.country = COUNTRIES[(idx + 1) % COUNTRIES.length].id;
      saveSettings();
    }, 'quiet');
    y += 80;
    this.wrapLeft(live ? 'Live: real players’ best runs this week, averaged per country.' : 'Other countries are simulated (AI) until online leaderboards are connected. Your best run this week counts toward your country.', 16, y + 2, WORLD_W - 32, 10, 'rgba(255,255,255,0.65)');
    y += 32;
    board.forEach((r, i) => {
      this.card(16, y, WORLD_W - 32, 36, r.you ? 'rgba(255,211,77,0.3)' : i < 3 ? 'rgba(70,50,20,0.9)' : 'rgba(48,30,52,0.9)');
      this.text(`${i + 1}`, 34, y + 18, 12, '#fff', 700, 'center');
      this.text(r.c.flag, 60, y + 18, 16, '#fff', 400);
      this.fitText(`${r.c.name}${r.you ? ' (you)' : live ? ` · ${r.players}` : ' (AI)'}`, 80, y + 18, 200, 12, '#fff', 'left', 700);
      this.text(`${r.score} m`, WORLD_W - 30, y + 18, 12, '#ffd34d', 700, 'right');
      y += 40;
    });
    this.screenEnd(f, y - f.y0);
  },

  /** A story card the first time you reach the pizza, burger or pancake world. */
  worldIntro(this: Game, w: WorldId): void {
    const W = WORLDS[w];
    const key = `world:${w}`;
    if (w === 'sushi' || this.progress.seen.includes(key)) return;
    this.progress.seen.push(key);
    this.progress.persist();
    const scene = w === 'pizza' ? ['🍕', '🇮🇹', '🧀'] : w === 'burger' ? ['🍔', '🌭', '🥤'] : w === 'turkish' ? ['🥙', '🇹🇷', '🕌'] : ['🥞', '🫐', '☕'];
    this.storyQueue.push({ ch: { title: `New world · ${W.name}`, scene, start: W.intro, end: [] }, lines: W.intro, end: false });
    track('world', { id: w });
  },

  labState(this: Game) {
    const p = this.progress;
    if (p.lab.day !== dayKey()) p.lab = { day: dayKey(), tries: 0, log: p.lab.log.slice(0, 12) };
    return p.lab;
  },

  /** Mixes the three chosen ingredients: a secret recipe, or a hint of how close you are. */
  labTry(this: Game): void {
    const p = this.progress;
    const lab = this.labState();
    if (this.labMix.length < 3) return this.showToast('Pick 3 ingredients');
    if (lab.tries >= LAB_TRIES) return this.showToast('The Lab is closed for today. Come back tomorrow!');
    lab.tries++;
    const mix = [...this.labMix];
    const hit = labMatch(mix);
    if (hit && !p.secrets.includes(hit.name)) {
      p.secrets.push(hit.name);
      lab.log.unshift({ mix, hint: 3, found: hit.name });
      this.bankCoins(250);
      this.celebrate(`${hit.emoji} ${hit.name.toUpperCase()}!`, 'Secret recipe discovered! It joins your orders and menu · +250 coins');
      this.labFx = { text: `${hit.emoji} DISCOVERED!`, t: 1.6, good: true };
      track('lab_found', { name: hit.name });
    } else {
      const hint = hit ? 3 : labHint(mix, p.secrets);
      lab.log.unshift({ mix, hint });
      this.labFx = { text: hit ? 'Already discovered!' : hint === 2 ? 'So close! 2 are right' : hint === 1 ? 'Hmm… 1 is right' : 'Not even close!', t: 1.4, good: hint >= 2 };
      sfx.slice();
    }
    lab.log = lab.log.slice(0, 12);
    this.labMix = [];
    p.persist();
  },

  drawLab(this: Game): void {
    const { ctx } = this;
    const p = this.progress;
    const lab = this.labState();
    const f = this.screenBegin('🧪 RECIPE LAB', `${p.secrets.length}/${SECRETS.length} secrets · ${LAB_TRIES - lab.tries} mixes left today · ingredients need ${LAB_KNOWN} layers`);
    let y = f.y0 + 4;
    // The pot with the three slots.
    this.card(16, y, WORLD_W - 32, 150, 'rgba(40,60,70,0.95)');
    this.text('🍲', WORLD_W / 2, y + 62 + Math.sin(this.time * 3) * 2, 56, '#fff', 400);
    for (let i = 0; i < 3; i++) {
      const sx = WORLD_W / 2 - 110 + i * 110;
      const k = this.labMix[i] as Ingredient | undefined;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      this.roundRect(sx - 30, y + 102, 60, 32, 10);
      ctx.fill();
      if (k) {
        ctx.fillStyle = this.color(k);
        this.roundRect(sx - 24, y + 108, 48, 20, 6);
        ctx.fill();
        this.listTap(sx - 30, y + 102, 60, 32, f, () => { this.labMix.splice(i, 1); });
      } else this.text('?', sx, y + 118, 14, 'rgba(255,255,255,0.4)', 700);
    }
    if (this.labFx) {
      ctx.globalAlpha = Math.min(1, this.labFx.t * 2);
      this.text(this.labFx.text, WORLD_W / 2, y + 18, 15, this.labFx.good ? '#8fdc93' : '#ffb4a2', 700);
      ctx.globalAlpha = 1;
    }
    y += 160;
    // Ingredient picker (sushi ingredients only: the Lab is a sushi kitchen).
    const kinds: Ingredient[] = ['rice', 'nori', 'salmon', 'tuna', 'avocado', 'cucumber', 'egg', 'ebi', 'unagi', 'tofu', 'ikura'];
    const cw = (WORLD_W - 32 - 4 * 6) / 5;
    kinds.forEach((k, i) => {
      const x = 16 + (i % 5) * (cw + 6);
      const yy = y + Math.floor(i / 5) * 58;
      const known = (p.mastery[k] ?? 0) >= LAB_KNOWN;
      const picked = this.labMix.includes(k);
      this.card(x, yy, cw, 52, picked ? 'rgba(110,80,10,0.95)' : 'rgba(48,30,52,0.95)');
      ctx.globalAlpha = known ? 1 : 0.3;
      ctx.fillStyle = this.color(k);
      this.roundRect(x + 10, yy + 8, cw - 20, 16, 5);
      ctx.fill();
      ctx.globalAlpha = 1;
      this.fitText(known ? k : `🔒 ${p.mastery[k] ?? 0}/${LAB_KNOWN}`, x + cw / 2, yy + 38, cw - 6, 10, known ? '#fff' : 'rgba(255,255,255,0.5)', 'center', 700);
      if (known) this.listTap(x, yy, cw, 52, f, () => {
        if (picked) this.labMix = this.labMix.filter((m) => m !== k);
        else if (this.labMix.length < 3) this.labMix.push(k);
      });
    });
    y += Math.ceil(kinds.length / 5) * 58 + 4;
    this.pill(16, y, WORLD_W - 32, this.labMix.length === 3 ? '🧪 MIX!' : `PICK ${3 - this.labMix.length} MORE`, f, () => this.labTry(), this.labMix.length === 3 ? 'gold' : 'quiet');
    y += 46;
    // Discovered secrets and the last mixes with their hints.
    this.text('SECRET RECIPES', 16, y + 8, 12, '#ffd34d', 700, 'left');
    y += 22;
    SECRETS.forEach((sc, i) => {
      const x = 16 + (i % 4) * ((WORLD_W - 32 - 18) / 4 + 6);
      const bw = (WORLD_W - 32 - 18) / 4;
      const yy = y + Math.floor(i / 4) * 64;
      const got = p.secrets.includes(sc.name);
      this.card(x, yy, bw, 58, got ? 'rgba(70,50,20,0.95)' : 'rgba(30,20,35,0.85)');
      this.text(got ? sc.emoji : '❔', x + bw / 2, yy + 22, 20, '#fff', 400);
      this.fitText(got ? sc.name : '???', x + bw / 2, yy + 46, bw - 6, 9.5, got ? '#ffe2c6' : 'rgba(255,255,255,0.4)', 'center', 700);
    });
    y += Math.ceil(SECRETS.length / 4) * 64 + 4;
    if (lab.log.length) {
      this.text('RECENT MIXES', 16, y + 8, 12, 'rgba(255,255,255,0.7)', 700, 'left');
      y += 22;
      for (const e of lab.log.slice(0, 6)) {
        this.card(16, y, WORLD_W - 32, 30);
        e.mix.forEach((k, i) => {
          ctx.fillStyle = this.color(k as Ingredient);
          this.roundRect(30 + i * 34, y + 9, 28, 12, 4);
          ctx.fill();
        });
        this.text(e.found ? `✓ ${e.found}` : `${'●'.repeat(e.hint)}${'○'.repeat(3 - e.hint)} ${e.hint} right`, WORLD_W - 32, y + 15, 11, e.found ? '#8fdc93' : '#ffd34d', 700, 'right');
        y += 34;
      }
    }
    this.screenEnd(f, y - f.y0);
  },

  /** Branches open for every World Tour city whose plate you've earned. */
  branchCities(this: Game): typeof CITIES {
    return CITIES.filter((c) => this.owned.plate.includes(`city-${c.id}`));
  },

  branch(this: Game, id: string) {
    const b = this.progress.branches;
    if (!b[id]) b[id] = { lv: 1, tipsAt: Date.now() };
    return b[id];
  },

  branchTips(this: Game, id: string): number {
    const b = this.branch(id);
    return Math.floor(Math.min(8, (Date.now() - b.tipsAt) / 3_600_000) * branchRate(b.lv));
  },

  collectBranches(this: Game): void {
    let total = 0;
    for (const c of this.branchCities()) {
      total += this.branchTips(c.id);
      this.branch(c.id).tipsAt = Date.now();
    }
    if (!total) return this.showToast('The trucks are still out selling. Come back soon!');
    this.bankCoins(total);
    this.progress.persist();
    this.celebrate(`🚚 +${total} COINS`, 'Your food trucks had a good day!', 1.6);
    sfx.coin();
  },

  drawRestBranches(this: Game, f: { areaTop: number; areaH: number }, y: number): number {
    const { ctx } = this;
    const cities = this.branchCities();
    this.wrapLeft('Earn a World Tour city’s plate to open a food truck there. Trucks sell all day, up to 8 hours of tips.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 38;
    if (!cities.length) {
      this.card(16, y, WORLD_W - 32, 70, 'rgba(40,30,70,0.95)');
      this.text('🚚 No trucks yet', WORLD_W / 2, y + 26, 14, '#fff', 700);
      this.text(`Finish this week’s World Tour (${currentTour().city.name}) to open one`, WORLD_W / 2, y + 48, 11, '#9fe3ff', 600);
      return y + 78;
    }
    const total = cities.reduce((a, c) => a + this.branchTips(c.id), 0);
    this.pill(16, y, WORLD_W - 32, total ? `COLLECT ALL · ${total} COINS` : 'TRUCKS ARE SELLING…', f, () => this.collectBranches(), total ? 'gold' : 'quiet');
    y += 44;
    for (const c of cities) {
      const b = this.branch(c.id);
      this.card(16, y, WORLD_W - 32, 74, 'rgba(40,30,70,0.95)');
      const g = ctx.createLinearGradient(0, y, 0, y + 74);
      g.addColorStop(0, c.sky[0]);
      g.addColorStop(1, c.sky[1]);
      ctx.fillStyle = g;
      this.roundRect(24, y + 8, 76, 58, 10);
      ctx.fill();
      this.text(BRANCH_EMOJI[c.id] ?? '🏙️', 46, y + 30, 18, '#fff', 400);
      this.text('🚚', 70 + Math.sin(this.time * 2 + c.id.length) * 3, y + 50, 22, '#fff', 400);
      this.text(`${c.name} truck`, 112, y + 18, 13.5, '#fff', 700, 'left');
      for (let k = 0; k < BRANCH_MAX; k++) this.dot(116 + k * 13, y + 35, 4, k < b.lv ? '#ffd34d' : 'rgba(255,255,255,0.2)');
      this.text(`${branchRate(b.lv)}/h · 💰 ${this.branchTips(c.id)}`, 112, y + 55, 11, '#ffe2c6', 700, 'left');
      if (b.lv < BRANCH_MAX) this.pill(WORLD_W - 118, y + 21, 88, `⬆ ${branchCost(b.lv)}`, f, () => {
        const cost = branchCost(b.lv);
        if (this.bank < cost) return this.showToast(`You need ${cost - this.bank} more coins`);
        this.bank -= cost;
        save.setCoins(this.bank);
        b.lv++;
        this.progress.persist();
        this.showToast(`🚚 ${c.name} truck level ${b.lv}!`);
      }, this.bank >= branchCost(b.lv) ? 'gold' : 'quiet');
      else this.text('★ MAX', WORLD_W - 40, y + 37, 12, '#ffd34d', 700, 'right');
      y += 82;
    }
    return y;
  },

  drawJukebox(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('🎵 JUKEBOX', 'Tracks drop from chests, or buy them here · tap to play');
    let y = f.y0 + 4;
    for (const id of Object.keys(TRACKS) as TrackId[]) {
      const tr2 = TRACKS[id];
      const own = p.tracks.includes(id);
      const on = settings.track === id;
      this.card(16, y, WORLD_W - 32, 66, on ? 'rgba(70,50,20,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(tr2.icon, 44, y + 33, 26, '#fff', 400);
      this.text(tr2.name, 74, y + 24, 14, '#fff', 700, 'left');
      this.text(`${tr2.tempo} bpm · ${tr2.drum ? 'drums · ' : ''}${tr2.wave}`, 74, y + 44, 10.5, 'rgba(255,255,255,0.65)', 600, 'left');
      if (on) {
        const bars = 5;
        for (let k = 0; k < bars; k++) {
          const h = 6 + Math.abs(Math.sin(this.time * (4 + k) + k)) * 16;
          this.ctx.fillStyle = '#ffd34d';
          this.ctx.fillRect(WORLD_W - 90 + k * 9, y + 44 - h, 6, h);
        }
      } else if (own) this.pill(WORLD_W - 104, y + 17, 74, 'PLAY', f, () => this.playTrack(id), 'quiet');
      else this.pill(WORLD_W - 104, y + 17, 74, '300 🪙', f, () => {
        if (this.bank < 300) return this.showToast(`You need ${300 - this.bank} more coins`);
        this.bank -= 300;
        save.setCoins(this.bank);
        p.tracks.push(id);
        p.persist();
        this.playTrack(id);
      }, this.bank >= 300 ? 'gold' : 'quiet');
      y += 74;
    }
    this.screenEnd(f, y - f.y0);
  },

  playTrack(this: Game, id: TrackId): void {
    settings.track = id;
    saveSettings();
    setTrack(id);
    if (!this.musicOn) this.toggleMusic();
    this.showToast(`${TRACKS[id].icon} Now playing: ${TRACKS[id].name}`);
  },

  /** Chests sometimes contain a jukebox track you don't own yet. */
  maybeTrackDrop(this: Game): void {
    const missing = (Object.keys(TRACKS) as TrackId[]).filter((id) => !this.progress.tracks.includes(id));
    if (!missing.length || Math.random() > 0.08) return;
    const id = missing[Math.floor(Math.random() * missing.length)];
    this.progress.tracks.push(id);
    this.progress.persist();
    this.showToast(`🎵 New jukebox track: ${TRACKS[id].name}!`);
  },

  openPhoto(this: Game): void {
    this.photo = { filter: 1, frame: 0, chef: true, img: null };
    track('photo_open');
  },

  /** Builds the photo: the whole tower scaled to fit, your chef, a frame, a filter and a caption. */
  renderPhoto(this: Game): HTMLCanvasElement {
    const ph = this.photo!;
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1350;
    const x = c.getContext('2d')!;
    const inner = document.createElement('canvas');
    inner.width = 1080;
    inner.height = 1350;
    const ic = inner.getContext('2d')!;
    const g = ic.createLinearGradient(0, 0, 0, 1350);
    g.addColorStop(0, this.theme.sky[0]);
    g.addColorStop(1, this.theme.sky[1]);
    ic.fillStyle = g;
    ic.fillRect(0, 0, 1080, 1350);
    // The whole stack, scaled to fit, drawn with the game's own layer renderer.
    const layers = this.stack;
    const towerH = layers.length * LAYER_H;
    const k = Math.min(2.4, 1000 / Math.max(towerH, 1));
    const saved = this.ctx;
    this.ctx = ic;
    ic.save();
    ic.translate(540 - (WORLD_W / 2) * k, 1230);
    ic.scale(k, k);
    for (const l of layers) this.drawLayer({ ...l, y: l.y });
    ic.restore();
    if (ph.chef) drawChef(ic, avatarChef(this.progress.avatar), 170, 1080, 2.4, 'happy', 540, 700, this.time);
    this.ctx = saved;
    // Plate line.
    ic.fillStyle = 'rgba(255,255,255,0.85)';
    ic.fillRect(240, 1236, 600, 10);
    // Apply the filter onto the final canvas.
    x.filter = Game.FILTERS[ph.filter][1];
    x.drawImage(inner, 0, 0);
    x.filter = 'none';
    // Frame and caption.
    const frame = Game.FRAMES[ph.frame];
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    if (frame === 'Polaroid') {
      x.strokeStyle = '#fbf7ef';
      x.lineWidth = 60;
      x.strokeRect(30, 30, 1020, 1290);
      x.fillStyle = '#fbf7ef';
      x.fillRect(0, 1180, 1080, 170);
      x.fillStyle = '#4a2618';
      x.font = `700 58px ${FONT}`;
      x.fillText(`${this.height} layers · Chef ${this.progress.avatar.name}`, 540, 1250);
      x.font = `500 34px ${FONT}`;
      x.fillText(`Sushi Stack · ${new Date().toLocaleDateString()}`, 540, 1305);
    } else if (frame === 'Film') {
      x.fillStyle = '#111';
      x.fillRect(0, 0, 90, 1350);
      x.fillRect(990, 0, 90, 1350);
      x.fillStyle = '#ddd';
      for (let i = 0; i < 14; i++) {
        x.fillRect(28, 20 + i * 96, 34, 50);
        x.fillRect(1018, 20 + i * 96, 34, 50);
      }
      x.fillStyle = '#ffd34d';
      x.font = `700 52px ${FONT}`;
      x.fillText(`SUSHI STACK · ${this.height}`, 540, 80);
    } else if (frame === 'Gold') {
      x.strokeStyle = '#d4a537';
      x.lineWidth = 36;
      x.strokeRect(18, 18, 1044, 1314);
      x.strokeStyle = '#fff3b0';
      x.lineWidth = 6;
      x.strokeRect(46, 46, 988, 1258);
      x.fillStyle = '#fff3b0';
      x.font = `700 64px ${FONT}`;
      x.fillText(`🏆 ${this.height} LAYERS`, 540, 110);
    }
    return c;
  },

  drawPhoto(this: Game, blocker: () => void): void {
    const ph = this.photo!;
    const { ctx } = this;
    blocker();
    ctx.fillStyle = '#0d0810';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    if (!ph.img) ph.img = this.renderPhoto();
    const top = this.insets.top + 20;
    const ph2 = this.viewH - this.insets.bottom - 150 - top;
    const pw = Math.min(WORLD_W - 40, ph2 * 0.8);
    ctx.drawImage(ph.img, WORLD_W / 2 - pw / 2, top, pw, pw * 1.25);
    const by = top + pw * 1.25 + 14;
    const bw = (WORLD_W - 40 - 16) / 3;
    this.button(20, by, bw, 38, `🎨 ${Game.FILTERS[ph.filter][0]}`, () => { ph.filter = (ph.filter + 1) % Game.FILTERS.length; ph.img = null; }, 'quiet');
    this.button(28 + bw, by, bw, 38, `🖼️ ${Game.FRAMES[ph.frame]}`, () => { ph.frame = (ph.frame + 1) % Game.FRAMES.length; ph.img = null; }, 'quiet');
    this.button(36 + bw * 2, by, bw, 38, ph.chef ? '🧑‍🍳 Chef ON' : '🧑‍🍳 Chef OFF', () => { ph.chef = !ph.chef; ph.img = null; }, 'quiet');
    this.button(20, by + 48, (WORLD_W - 48) / 2, 44, t('back'), () => { this.photo = null; }, 'quiet');
    this.button(28 + (WORLD_W - 48) / 2, by + 48, (WORLD_W - 48) / 2, 44, '📤 SAVE / SHARE', () => { void sharePhoto(ph.img ?? this.renderPhoto()); track('photo_share', { filter: ph.filter, frame: ph.frame }); }, 'gold');
  },

  startPnp(this: Game, turn = 1): void {
    if (turn === 1) this.pnp = { turn: 1, scores: [], seed: Math.floor(Math.random() * 2 ** 31), level: Math.max(3, Math.min(this.progress.playLevel, 30)) };
    const pp = this.pnp!;
    pp.turn = turn;
    this.startRun(pp.level, 'pnp', { challenge: { seed: pp.seed, level: pp.level, score: turn === 2 ? pp.scores[0] : 0 }, picked: new Set() });
    this.coach(`👥 PLAYER ${turn}`, turn === 1 ? 'Same chefs, same layers for both players. Stack as high as you can!' : `Beat Player 1’s ${pp.scores[0]} layers!`, 4);
  },

  drawPnp(this: Game, blocker: () => void): void {
    const pp = this.pnp!;
    if (this.mode !== 'dead' || this.time - this.deadAt < 0.7 || pp.scores.length < pp.turn) return;
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    const bg = ctx.createLinearGradient(0, 0, 0, this.viewH);
    bg.addColorStop(0, '#2a1a40');
    bg.addColorStop(1, '#120a18');
    ctx.fillStyle = bg;
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    if (pp.turn === 1) {
      this.text('👥 PLAYER 1', cx, midY - 120, 26, '#ffd34d', 700);
      this.text(`${pp.scores[0]} layers`, cx, midY - 70, 40, '#fff', 700);
      this.text('📱➡️🙋', cx, midY - 10, 40, '#fff', 400);
      this.text('Pass the phone to Player 2', cx, midY + 40, 16, '#fff', 600);
      this.button(cx - 110, midY + 74, 220, 52, 'PLAYER 2: GO!', () => this.startPnp(2), 'gold');
      return;
    }
    const [a, b] = pp.scores;
    const win = a === b ? 0 : a > b ? 1 : 2;
    this.text(win ? `🏆 PLAYER ${win} WINS!` : '🤝 IT’S A DRAW!', cx, midY - 190, 26, '#ffd34d', 700);
    const maxH = Math.max(a, b, 1);
    [a, b].forEach((sc, i) => {
      const x = cx - 70 + i * 140;
      const h = 160 * (sc / maxH);
      ctx.fillStyle = i ? '#4cc9f0' : '#ff8a5b';
      this.roundRect(x - 34, midY + 60 - h, 68, h, 10);
      ctx.fill();
      this.text(`${sc}`, x, midY + 46 - h, 20, '#fff', 700);
      this.text(`PLAYER ${i + 1}`, x, midY + 84, 13, '#fff', 700);
      if (win === i + 1) this.text('👑', x, midY + 20 - h, 26, '#fff', 400);
    });
    this.button(40, midY + 120, 150, 48, t('home'), () => { this.pnp = null; this.mode = 'title'; this.reset(); }, 'quiet');
    this.button(WORLD_W - 190, midY + 120, 150, 48, 'REMATCH', () => this.startPnp(1), 'gold');
  },

  /** Mirrors the screen's buttons as real buttons for VoiceOver / TalkBack (see a11y.ts). */
  mirrorA11y(this: Game, texts: NonNullable<Game['qaTexts']>): void {
    const catcher = WORLD_W * this.viewH * 0.5; // tap-anywhere areas aren't buttons to a screen reader
    const words = (str?: string) => !!str && /\p{L}{2,}/u.test(str);
    const inside = (t: (typeof texts)[number], b: Button) => {
      const cx = (t.x0 + t.x1) / 2;
      const cy = (t.y0 + t.y1) / 2;
      return cx >= b.x - 2 && cx <= b.x + b.w + 2 && cy >= b.y - 2 && cy <= b.y + b.h + 2;
    };
    // Taps are checked newest first, so an overlay's full-screen blocker hides every button drawn before it.
    let from = 0;
    this.buttons.forEach((b, i) => { if (b.w * b.h > catcher) from = i + 1; });
    const real = this.buttons.slice(from);
    // The text on a button's row (outside any other button), e.g. "Knife Throw" for its PLAY pill.
    const rowOf = (b: Button, n = 2) => texts.filter((t) => words(t.str) && !inside(t, b) && Math.abs((t.y0 + t.y1) / 2 - (b.y + b.h / 2)) < b.h / 2 + 10 && !real.some((o) => o !== b && inside(t, o)))
      .slice(0, n).map((t) => t.str.trim()).join(' · ');
    const list = real.map((b) => {
      let name = b.label?.trim() ?? '';
      if (!words(name)) {
        const own = [...new Set(texts.filter((t) => inside(t, b)).map((t) => t.str.trim()).filter(Boolean))];
        if (own.some((x) => words(x))) name = own.join(', ');
        else {
          // An icon button (◀, ▶, a price): name it after the text on its row.
          const row = rowOf(b);
          const icon = name === '◀' ? 'previous' : name === '▶' ? 'next' : name;
          if (row) name = icon ? `${row}: ${icon}` : row;
        }
      }
      return { name, b };
    }).filter((x) => x.name);
    const count: Record<string, number> = {};
    for (const x of list) count[x.name] = (count[x.name] ?? 0) + 1;
    const seen: Record<string, number> = {};
    const named: { name: string; b: Button }[] = [];
    for (const { b, name: base } of list) {
      let name = base;
      // Several "PLAY"s: say which row each belongs to.
      if (count[base] > 1) {
        const row = rowOf(b, 1);
        if (row) name = `${row}: ${base}`;
      }
      if (name.length > 90) name = `${name.slice(0, 88)}…`;
      // Names still repeated get a number ("READ", "READ 2") so every button stays reachable.
      const n = (seen[name] = (seen[name] ?? 0) + 1);
      named.push({ name: n > 1 ? `${name} ${n}` : name, b });
    }
    mirrorButtons(named.map((x) => x.name), (l) => named.find((x) => x.name === l)?.b.onTap());
  },

  drawReactPick(this: Game, blocker: () => void): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    this.card(30, midY - 110, WORLD_W - 60, 220, '#2a1a33');
    this.text('Add a reaction to your code?', cx, midY - 80, 16, '#fff', 700);
    this.text('Your friend sees it when they play your run', cx, midY - 56, 11, 'rgba(255,255,255,0.7)', 600);
    REACTIONS.forEach((e, i) => {
      const x = 62 + i * 55;
      this.dot(x, midY - 6, 24, 'rgba(255,255,255,0.1)');
      this.text(e, x, midY - 5, 28, '#fff', 400);
      this.buttons.push({ x: x - 26, y: midY - 32, w: 52, h: 52, onTap: () => { this.reactPick = false; this.shareRun(i); }, label: `React ${e}` });
    });
    this.button(cx - 80, midY + 46, 160, 42, 'NO EMOJI', () => { this.reactPick = false; this.shareRun(); }, 'quiet');
  },

  /** Chefs whose card is Lv 2+ wear a gold uniform. */
  chefLook(this: Game, c: Chef, level: number): Chef {
    if (Progress.cardLevel(this.progress.cards[level] ?? 0) < 2) return c;
    return { ...c, outfit: '#d4a537', accent: '#fff3b0' };
  },

  /** Day d (1-28): coins every day, boosters on day 7 and 21, packs on 14, a big prize on 28. */
  calendarReward(this: Game, d: number): string {
    if (d === 28) return '1000 coins + 5 packs + Loyal Chef Plate';
    if (d === 14) return '3 sticker packs + 150 coins';
    if (d % 7 === 0) return '3 boosters + 120 coins';
    return `${30 + d * 5} coins`;
  },

  calendarReady(this: Game): boolean {
    return this.progress.calendar.last !== dayKey() && !this.lockedAt('gift');
  },

  /** Claims today's calendar day. Missing a day never resets it: the next claim is just the next day. */
  claimCalendar(this: Game): void {
    const p = this.progress;
    if (!this.calendarReady()) return this.showToast('Come back tomorrow for the next day!');
    const d = p.calendar.n % 28 + 1;
    p.calendar = { n: d === 28 ? 0 : p.calendar.n + 1, last: dayKey() };
    if (d === 28) {
      this.bankCoins(1000);
      this.openPacks(5);
      this.unlockExclusive('plate', 'calendar', 'Loyal Chef Plate');
      if (!p.badges.includes('calendar')) p.badges.push('calendar');
      this.celebrate('📅 DAY 28!', 'Loyal Chef Plate, 1000 coins and 5 sticker packs. The calendar starts again!');
    } else if (d === 14) {
      this.openPacks(3);
      this.bankCoins(150);
      this.celebrate('📅 DAY 14!', '3 sticker packs + 150 coins');
    } else if (d % 7 === 0) {
      for (let i = 0; i < 3; i++) {
        const b = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
        this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
      }
      save.setBoosters(this.boosters);
      this.bankCoins(120);
      this.celebrate(`📅 DAY ${d}!`, '3 boosters + 120 coins');
    } else {
      this.bankCoins(30 + d * 5);
      this.showToast(`📅 Day ${d}: +${30 + d * 5} coins`);
    }
    sfx.coin();
    p.persist();
    track('calendar', { day: d });
    this.pushWidget();
  },

  drawCalendar(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('LOGIN CALENDAR', 'One reward a day · missing a day never resets it');
    let y = f.y0 + 4;
    const cw = (WORLD_W - 32 - 6 * 6) / 7;
    const next = p.calendar.n % 28 + 1;
    const ready = this.calendarReady();
    for (let d = 1; d <= 28; d++) {
      const x = 16 + ((d - 1) % 7) * (cw + 6);
      const yy = y + Math.floor((d - 1) / 7) * (cw + 22);
      const got = d < next;
      const today = d === next;
      const big = d % 7 === 0;
      this.card(x, yy, cw, cw + 14, got ? 'rgba(42,90,60,0.95)' : today && ready ? 'rgba(110,80,10,0.95)' : big ? 'rgba(70,40,80,0.95)' : 'rgba(48,30,52,0.95)');
      if (today && ready) {
        this.ctx.strokeStyle = `rgba(255,211,77,${0.6 + 0.4 * Math.sin(this.time * 5)})`;
        this.ctx.lineWidth = 2.5;
        this.roundRect(x, yy, cw, cw + 14, 14);
        this.ctx.stroke();
      }
      this.text(String(d), x + cw / 2, yy + 11, 10, 'rgba(255,255,255,0.7)', 700);
      this.text(got ? '✓' : d === 28 ? '🏆' : d === 14 ? '🎴' : big ? '🎁' : '🪙', x + cw / 2, yy + cw / 2 + 8, d === 28 ? 22 : 18, got ? '#8fdc93' : '#fff', got ? 700 : 400);
      if (today && ready) this.listTap(x, yy, cw, cw + 14, f, () => this.claimCalendar());
    }
    y += 4 * (cw + 22) + 4;
    this.card(16, y, WORLD_W - 32, 70, 'rgba(60,35,20,0.95)');
    this.text(ready ? `TODAY: DAY ${next}` : `NEXT: DAY ${next} (tomorrow)`, 32, y + 20, 13, '#ffd34d', 700, 'left');
    this.fitText(this.calendarReward(next), 32, y + 44, 200, 12, '#fff', 'left', 600);
    this.pill(WORLD_W - 124, y + 19, 92, ready ? 'CLAIM' : 'TOMORROW', f, () => this.claimCalendar(), ready ? 'gold' : 'quiet');
    y += 78;
    this.wrapLeft('Day 7 and 21: 3 boosters · Day 14: 3 sticker packs · Day 28: the Loyal Chef Plate, 1000 coins and 5 packs.', 16, y + 4, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 40;
    this.screenEnd(f, y - f.y0);
  },

  drawMuseum(this: Game): void {
    const { ctx } = this;
    const p = this.progress;
    const f = this.screenBegin('SUSHI MUSEUM', `${RECIPES.filter((r) => (p.recipeCounts[r.name] ?? 0) > 0).length}/${RECIPES.length} dishes · ${p.stats.fancy ?? 0} fancy cuts · ${RECIPE_GOAL} serves = gold frame`);
    let y = f.y0 + 4;
    // Wooden shelves, two dishes each.
    const cw = (WORLD_W - 32) / 2;
    for (let i = 0; i < RECIPES.length; i += 2) {
      ctx.fillStyle = '#4a2f1c';
      this.roundRect(16, y, WORLD_W - 32, 112, 12);
      ctx.fill();
      ctx.fillStyle = '#7a4e2a';
      ctx.fillRect(22, y + 84, WORLD_W - 44, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(22, y + 92, WORLD_W - 44, 4);
      for (let k = 0; k < 2 && i + k < RECIPES.length; k++) {
        const r = RECIPES[i + k];
        const n = p.recipeCounts[r.name] ?? 0;
        const cx = 16 + cw * k + cw / 2;
        if (n >= RECIPE_GOAL) {
          ctx.strokeStyle = '#d4a537';
          ctx.lineWidth = 3;
          this.roundRect(cx - 70, y + 8, 140, 82, 10);
          ctx.stroke();
        }
        if (n > 0) this.drawDish(cx, y + 60, 0.62, 0, r);
        else {
          ctx.globalAlpha = 0.25;
          this.drawDish(cx, y + 60, 0.62, 0, { ...r, pattern: r.pattern.map(() => 'nori' as Ingredient) });
          ctx.globalAlpha = 1;
          this.text('?', cx, y + 46, 20, 'rgba(255,255,255,0.6)', 700);
        }
        this.fitText(n > 0 ? r.name : '???', cx, y + 102, cw - 20, 11, n > 0 ? '#ffe2c6' : 'rgba(255,255,255,0.45)', 'center', 700);
        if (n > 0) this.text(`×${n}`, cx + 58, y + 16, 10, n >= RECIPE_GOAL ? '#ffd34d' : 'rgba(255,255,255,0.7)', 700);
      }
      y += 120;
    }
    // Ingredient mastery.
    y += 4;
    this.text(`INGREDIENT MASTERY · ${MASTERY} layers each = gold layers +1 coin per PERFECT`, 16, y + 8, 11, '#ffd34d', 700, 'left');
    y += 22;
    const kinds = Object.keys(COLORS) as Ingredient[];
    kinds.forEach((k, i) => {
      const x = 16 + (i % 2) * (cw + 0);
      const yy = y + Math.floor(i / 2) * 40;
      const n = p.mastery[k] ?? 0;
      const done = n >= MASTERY;
      this.card(x + (i % 2 ? 4 : 0), yy, cw - 4, 34, done ? 'rgba(90,70,20,0.95)' : 'rgba(48,30,52,0.95)');
      ctx.fillStyle = COLORS[k];
      this.roundRect(x + 12 + (i % 2 ? 4 : 0), yy + 9, 22, 16, 4);
      ctx.fill();
      this.text(k, x + 42 + (i % 2 ? 4 : 0), yy + 12, 11, '#fff', 700, 'left');
      this.bar(x + 42 + (i % 2 ? 4 : 0), yy + 21, cw - 100, n / MASTERY, done ? '#ffd34d' : '#ff8a5b', 5);
      this.text(done ? '✨' : `${n}`, x + cw - 14 + (i % 2 ? 0 : -4), yy + 17, 10, done ? '#ffd34d' : 'rgba(255,255,255,0.7)', 700, 'right');
    });
    y += Math.ceil(kinds.length / 2) * 40 + 4;
    this.screenEnd(f, y - f.y0);
  },

  drawProfile(this: Game): void {
    const { ctx } = this;
    const p = this.progress;
    const f = this.screenBegin('PROFILE', p.prestige ? `Prestige ${p.prestige} · +${p.prestige * 10}% coins forever` : 'Your chef, your records, your badges');
    let y = f.y0 + 4;
    // Header with the avatar and a prestige crown.
    this.card(16, y, WORLD_W - 32, 150, 'rgba(60,35,70,0.95)');
    ctx.save();
    this.roundRect(16, y, WORLD_W - 32, 150, 14);
    ctx.clip();
    drawChef(ctx, avatarChef(p.avatar), 86, y + 90, 0.85, 'happy', 200, y + 160, this.time);
    ctx.restore();
    if (p.prestige) this.text(['👑', '💎', '🌟', '🔥', '🐉'][Math.min(4, p.prestige - 1)] + (p.prestige > 5 ? ` ${p.prestige}` : ''), 120, y + 24, 20, '#fff', 400);
    this.text(`Chef ${p.avatar.name}`, 160, y + 30, 20, '#fff', 700, 'left');
    this.text(`Chef Rank ${p.rank} · Level ${p.unlocked}`, 160, y + 56, 12, '#ffd34d', 700, 'left');
    this.text(`${p.totalStars}★ · ${p.chefsBeaten} chefs beaten`, 160, y + 76, 12, 'rgba(255,255,255,0.8)', 600, 'left');
    this.text(`${this.progress.rest.reviews} critic reviews · ${Object.values(p.hearts).reduce((a, b) => a + b, 0)} hearts`, 160, y + 96, 12, 'rgba(255,255,255,0.8)', 600, 'left');
    this.pill(160, y + 110, 120, 'EDIT CHEF', f, () => this.openScreen('avatar', 'profile'), 'quiet');
    y += 160;
    // Records.
    const rows: [string, string][] = [
      ['Best stack', `${this.best} layers`], ['PERFECTs', `${p.stats.perfects ?? 0}`], ['Orders served', `${p.stats.served ?? 0}`],
      ['Fancy cuts', `${p.stats.fancy ?? 0}`], ['Sous-chef wins', `${p.stats.bonus ?? 0}`], ['Gauntlet best', `${p.gauntletBest} chefs`],
      ['Coins earned', `${(p.stats.coins ?? 0).toLocaleString('en')}`], ['Days played', `${p.stats.days ?? 0}`],
    ];
    const cw = (WORLD_W - 32 - 8) / 2;
    rows.forEach(([k, v], i) => {
      const x = 16 + (i % 2) * (cw + 8);
      const yy = y + Math.floor(i / 2) * 50;
      this.card(x, yy, cw, 44);
      this.text(k, x + 12, yy + 14, 10.5, 'rgba(255,255,255,0.65)', 600, 'left');
      this.fitText(v, x + 12, yy + 31, cw - 20, 14, '#fff', 'left', 700);
    });
    y += Math.ceil(rows.length / 2) * 50 + 6;
    // Badges.
    this.text('BADGES', 16, y + 8, 12, '#ffd34d', 700, 'left');
    y += 22;
    const badges: [string, string][] = [
      ...p.badges.filter((b) => b.startsWith('season:')).map((b) => { const [, n, icon, name] = b.split(':'); return [icon, `${name} (S${n})`] as [string, string]; }),
      ...(p.badges.includes('calendar') ? [['📅', 'Loyal 28'] as [string, string]] : []),
      ...(p.badges.includes('nemesis') ? [['😈', 'Nemesis slayer'] as [string, string]] : []),
      ...ACHIEVEMENTS.filter((a) => (p.achSeen[a.id] ?? 0) >= 4).map((a) => [a.icon, `${a.name} IV`] as [string, string]),
      ...(p.restaurant.michelin ? [['⭐', `${p.restaurant.michelin} Michelin`] as [string, string]] : []),
      ...(p.prestige ? [['👑', `Prestige ${p.prestige}`] as [string, string]] : []),
    ];
    if (!badges.length) {
      this.wrapLeft('Finish a Sushi Pass season, the 28-day calendar, an achievement family or a Michelin star to earn badges.', 16, y + 4, WORLD_W - 32, 11, 'rgba(255,255,255,0.65)');
      y += 40;
    } else {
      const bw = (WORLD_W - 32 - 16) / 3;
      badges.forEach(([icon, name], i) => {
        const x = 16 + (i % 3) * (bw + 8);
        const yy = y + Math.floor(i / 3) * 76;
        this.card(x, yy, bw, 68, 'rgba(70,50,20,0.95)');
        this.text(icon, x + bw / 2, yy + 26, 24, '#fff', 400);
        this.fitText(name, x + bw / 2, yy + 54, bw - 10, 10, '#ffe2c6', 'center', 700);
      });
      y += Math.ceil(badges.length / 3) * 76;
    }
    // Prestige.
    y += 6;
    const can = p.unlocked > 100;
    this.card(16, y, WORLD_W - 32, 96, can ? 'rgba(80,20,90,0.95)' : 'rgba(40,25,45,0.9)');
    this.text('👑 PRESTIGE', 32, y + 24, 14, can ? '#e0aaff' : 'rgba(255,255,255,0.6)', 700, 'left');
    if (can) this.pill(WORLD_W - 124, y + 8, 92, 'PRESTIGE', f, () => this.askPrestige(), 'gold');
    this.wrapLeft(can ? 'Restart from level 1 for +10% coins forever, a new crown and the Prestige Plate. You keep coins, items and the restaurant.' : `Reach level 101 to prestige (you’re on level ${p.unlocked}). Each prestige gives +10% coins forever.`, 32, y + 54, WORLD_W - 64, 10.5, 'rgba(255,255,255,0.8)');
    y += 104;
    this.screenEnd(f, y - f.y0);
  },

  askPrestige(this: Game): void {
    this.confirmBox = {
      title: '👑 PRESTIGE?',
      text: `Your journey restarts at level 1 (stars and chef map reset). You keep coins, items, the restaurant, companions and collections, and get +10% coins forever.`,
      ok: 'PRESTIGE',
      go: () => this.prestige(),
    };
  },

  prestige(this: Game): void {
    const p = this.progress;
    p.prestige++;
    p.unlocked = 1;
    p.stars = [];
    p.persist();
    this.unlockExclusive('plate', 'prestige', 'Prestige Plate');
    this.celebrate(`👑 PRESTIGE ${p.prestige}!`, `+${p.prestige * 10}% coins forever · the journey begins again`);
    track('prestige', { n: p.prestige });
  },

  drawConfirm(this: Game, blocker: () => void): void {
    const c = this.confirmBox!;
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    this.card(30, midY - 120, WORLD_W - 60, 240, '#2a1a33');
    this.fitText(c.title, cx, midY - 86, WORLD_W - 100, 20, '#fff', 'center', 700);
    this.wrapText(c.text, cx, midY - 50, WORLD_W - 100, 12.5, 'rgba(255,255,255,0.85)');
    this.button(50, midY + 60, 130, 44, t('back'), () => { this.confirmBox = null; }, 'quiet');
    this.button(WORLD_W - 180, midY + 60, 130, 44, c.ok, () => { const go = c.go; this.confirmBox = null; go(); }, 'gold');
  },

  drawBoards(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('LEADERBOARDS', 'Online boards arrive with Game Center / Google Play Games');
    let y = f.y0 + 4;
    const row = (label: string, value: string, color = '#fff') => {
      this.card(16, y, WORLD_W - 32, 38, 'rgba(48,30,52,0.95)');
      this.text(label, 32, y + 19, 12.5, 'rgba(255,255,255,0.85)', 700, 'left');
      this.text(value, WORLD_W - 32, y + 19, 13, color, 900, 'right');
      y += 44;
    };
    // This week's bests (they reset every Monday), and the all-time bests beside them.
    const lb = localBoards();
    this.text(online ? 'THIS WEEK · ONLINE' : 'THIS WEEK · on this device until online boards are set up', 16, y + 8, 11, '#9fe3ff', 700, 'left');
    y += 20;
    (Object.keys(BOARDS) as (keyof typeof BOARDS)[]).forEach((k) => row(BOARDS[k].name, `${lb.best[k] ?? 0}  ·  best ever ${lb.allTime[k] ?? 0}`, '#9fe3ff'));
    y += 6;
    this.text('YOUR RECORDS', 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    row('Best height', String(this.best), '#ffd34d');
    row('Gauntlet best', `${p.gauntletBest} chefs`);
    row('Time Attack best', String(p.timeBest));
    row('Zen best', String(p.zenBest));
    row('Puzzle stars', `${p.puzzleStars.reduce((a, b) => a + (b || 0), 0)}★`);
    row('Furthest level', String(p.unlocked));
    y += 6;
    const cup = cupWeekend();
    const table = [...cupRivals(cup.key, cup.start, cup.end), { name: 'YOU', score: p.cup.key === cup.key ? p.cup.best : 0 }].sort((a, b) => b.score - a.score);
    this.text(`SUSHI CUP ${cup.live ? '(live)' : '(final)'} · AI rivals`, 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    table.slice(0, 10).forEach((e, i) => row(`${i + 1}. ${e.name}`, String(e.score), e.name === 'YOU' ? '#ffd34d' : '#fff'));
    const me = table.findIndex((e) => e.name === 'YOU');
    if (me >= 10) row(`${me + 1}. YOU`, String(table[me].score), '#ffd34d');
    y += 6;
    this.text('YOUR TOP RUNS', 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    if (!p.topRuns.length) row('No runs yet', '-');
    p.topRuns.forEach((h, i) => row(`#${i + 1}`, `${h} layers`));
    // Duels: every friend challenge played, with a rematch on the same seed.
    y += 6;
    const wins = p.duels.filter((d) => d.mine > d.theirs).length;
    this.text(`DUELS · ${wins} won, ${p.duels.length - wins} lost`, 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    if (!p.duels.length) row('Enter a friend’s code to duel', '-');
    for (const d of p.duels.slice(0, 8)) {
      const won = d.mine > d.theirs;
      this.card(16, y, WORLD_W - 32, 44, 'rgba(48,30,52,0.95)');
      this.text(`${won ? '🏆' : '💥'} ${d.mine} vs ${d.theirs}`, 32, y + 15, 13, won ? '#8fdc93' : '#ff9a8a', 700, 'left');
      this.text(`${d.code} · ${new Date(d.at).toLocaleDateString()}`, 32, y + 32, 10, 'rgba(255,255,255,0.6)', 600, 'left');
      this.pill(WORLD_W - 116, y + 6, 84, 'REMATCH', f, () => {
        const c = decodeChallenge(d.code);
        if (c) this.startRun(c.level, 'challenge', { challenge: c });
      }, 'quiet');
      y += 50;
    }
    this.screenEnd(f, y - f.y0);
  },

  recordDuel(this: Game): void {
    const c = this.challenge!;
    const code = encodeChallenge(c);
    const p = this.progress;
    p.duels = [{ code, level: c.level, theirs: c.score, mine: this.height, at: Date.now() }, ...p.duels].slice(0, 30);
    p.persist();
    track('duel', { won: this.height > c.score });
  },

  /**
   * Text box for codes (a real input, so phone keyboards work): a friend's challenge code or invite
   * code, or a save-transfer code from another device.
   */
  openCodeInput(this: Game, kind: 'friend' | 'save' | 'cloud' = 'friend'): void {
    if (this.codeInput) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,5,15,0.7);z-index:10;padding:16px;';
    const title = kind === 'save' ? 'Paste a save code' : kind === 'cloud' ? 'Restore from cloud' : 'Friend’s code';
    const hint = kind === 'save' ? 'This replaces the progress on this device.' : kind === 'cloud' ? 'Your backup ID and PIN, e.g. ABCD2345 1234. This replaces the progress on this device.' : 'A challenge (K3F9Q-7-42), ghost (G-…), boss chef (B-…), song (SONG-…), invite (INV-…) or restaurant code (R-…)';
    wrap.innerHTML = `<form style="background:#2a1a33;border-radius:18px;padding:20px;width:100%;max-width:340px;font:600 15px Fredoka,system-ui,sans-serif;color:#fff;display:grid;gap:12px">
      <label for="code-box" style="font-weight:700;font-size:18px">${title}</label>
      <p style="margin:0;font-size:13px;opacity:.75">${hint}</p>
      <input id="code-box" autocomplete="off" ${kind === 'save' ? '' : 'autocapitalize="characters"'} placeholder="${kind === 'save' ? 'SS1.…' : kind === 'cloud' ? 'ABCD2345 1234' : 'e.g. K3F9Q-7-42'}" style="font:700 18px Fredoka,system-ui;padding:12px;border-radius:12px;border:2px solid #ff8a5b;background:#fff;color:#2a1a33;${kind === 'save' ? '' : 'text-transform:uppercase'}">
      <div style="display:flex;gap:10px"><button type="button" data-close style="flex:1;padding:12px;border-radius:22px;border:0;background:rgba(255,255,255,0.15);color:#fff;font-weight:700">Cancel</button>
      <button style="flex:1;padding:12px;border-radius:22px;border:0;background:#ffd34d;color:#4a2a00;font-weight:700">${kind === 'friend' ? 'Go' : 'Restore'}</button></div>
      <p data-error style="margin:0;color:#ff9a8a;min-height:1em;font-size:13px"></p></form>`;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    const error = (msg: string) => { wrap.querySelector('[data-error]')!.textContent = msg; };
    this.codeInput = input;
    const close = () => { wrap.remove(); this.codeInput = null; };
    wrap.querySelector('[data-close]')!.addEventListener('click', close);
    wrap.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (kind === 'cloud') {
        const [id, pin] = value.split(/[\s-]+/);
        if (!id || !/^\d{4}$/.test(pin ?? '')) return error('Enter the ID, a space, then the 4-digit PIN.');
        error('Restoring…');
        void cloudRestore(id, pin).then(async (code) => {
          if (!code) return error(/pin|tries/.test(onlineErrorText) ? `That didn’t work: ${onlineErrorText}.` : 'No backup with that ID, or the server can’t be reached.');
          if (!(await importSave(code))) return error('That backup is damaged.');
          track('cloud_restore');
          location.reload();
        });
        return;
      }
      if (kind === 'save') {
        void importSave(value).then((ok) => {
          if (!ok) return error('That save code is damaged or incomplete.');
          track('save_import');
          location.reload();
        });
        return;
      }
      if (/^G-/i.test(value)) {
        const gc = decodeGhost(value);
        if (!gc) return error('That ghost code is damaged. Ask your friend to share it again.');
        close();
        this.friendEmoji = codeEmoji(value);
        this.friendGhost = gc.shape;
        this.startRun(gc.challenge.level, 'challenge', { challenge: gc.challenge });
        track('ghost_race');
        return;
      }
      if (/^B-/i.test(value)) {
        const bd = decodeBoss(value);
        if (!bd) return error('That boss code is damaged. Ask your friend to share it again.');
        close();
        this.coach(`🧑‍🍳 ${bd.name.toUpperCase()}`, 'A friend built this boss chef. One long order: beat it!', 4);
        this.startCustom(bd, true);
        return;
      }
      if (/^SONG-/i.test(value)) {
        const notes = decodeSong(value);
        if (!notes) return error('That song code is damaged.');
        close();
        playSong(notes);
        this.showToast(`🎵 Playing a friend’s ${notes.length}-note run`);
        return;
      }
      if (/^R-/i.test(value)) {
        const rc = decodeRestaurant(value);
        if (!rc) return error('That restaurant code is damaged. Ask your friend to share it again.');
        close();
        this.openVisit(rc);
        return;
      }
      if (/^INV-[A-Z0-9]{6}$/i.test(value)) {
        const p = this.progress;
        if (value.toUpperCase() === p.inviteCode) return error('That’s your own invite code. Send it to a friend!');
        const added = addFriend(value);
        if (p.seen.includes('invite:used')) {
          if (!added) return error('This friend is already on your list.');
          close();
          this.showToast('Friend added! Compare Daily Rolls on the Daily screen.');
          track('friend_added');
          return;
        }
        p.seen.push('invite:used');
        p.persist();
        close();
        this.bankCoins(cfg.inviteReward);
        this.celebrate('WELCOME GIFT!', `A friend invited you: +${cfg.inviteReward} coins`);
        track('invite_redeemed');
        return;
      }
      const c = decodeChallenge(value);
      this.friendEmoji = c ? codeEmoji(value) : '';
      if (!c) return error('That code doesn’t look right. It looks like K3F9Q-7-42 or INV-ABC123.');
      close();
      this.startRun(c.level, 'challenge', { challenge: c });
    });
    setTimeout(() => input.focus(), 50);
  },

  setting(this: Game, key: 'haptics' | 'reducedMotion' | 'colorblind' | 'assist' | 'clips' | 'voices' | 'leftHanded' | 'hapticAssist' | 'songNotes' | 'audioOnly' | 'tilt' | 'batterySaver' | 'analytics'): void {
    settings[key] = !settings[key];
    saveSettings();
    if (key === 'haptics') setHaptics(settings.haptics);
    if (key === 'analytics') setAnalyticsConsent(settings.analytics);
    if (key === 'batterySaver') this.resize();
    track('setting', { key, on: settings[key] });
  },

  drawSettings(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin(t('settings'));
    let y = f.y0 + 4;
    const toggle = (icon: string, label: string, note: string, on: boolean, go: () => void) => {
      this.card(16, y, WORLD_W - 32, 56);
      this.text(icon, 40, y + 28, 20, '#fff', 400);
      this.fitText(label, 64, y + 20, 200, 14, '#fff', 'left', 700);
      this.fitText(note, 64, y + 39, 200, 10.5, 'rgba(255,255,255,0.65)', 'left');
      // Switch.
      const sx = WORLD_W - 84;
      this.ctx.fillStyle = on ? '#2a9d5c' : 'rgba(255,255,255,0.2)';
      this.roundRect(sx, y + 16, 52, 26, 13);
      this.ctx.fill();
      this.dot(on ? sx + 39 : sx + 13, y + 29, 10, '#fff');
      this.listTap(16, y, WORLD_W - 32, 56, f, go);
      y += 62;
    };
    const header = (label: string) => {
      this.text(label, 20, y + 10, 12, '#ffd34d', 700, 'left');
      y += 24;
    };
    header(t('secSound'));
    toggle('🎵', t('music'), 'Calm generated music', this.musicOn, () => this.toggleMusic());
    toggle('🔊', t('sound'), 'Chops, coins and cheers', !this.muted, () => { this.muted = !this.muted; setMuted(this.muted); save.setMuted(this.muted); });
    toggle('🗣️', 'Chef voices', 'Little babble voices when chefs talk', settings.voices, () => { this.setting('voices'); setVoices(settings.voices); });
    toggle('📳', t('haptics'), 'Every ingredient has its own feel', settings.haptics, () => this.setting('haptics'));
    toggle('🎵', 'Run song notes', 'Each layer plays a note of your run’s tune', settings.songNotes, () => this.setting('songNotes'));
    toggle('📱', 'Tilt the tower', 'Tilting the phone nudges a tall tower’s sway', settings.tilt, () => this.setting('tilt'));
    toggle('🔋', t('batterySaver'), this.lowPower ? 'Already on: this phone runs the light version' : t('batteryNote'), settings.batterySaver, () => this.setting('batterySaver'));
    header(t('secAccess'));
    toggle('🌙', t('reducedMotion'), 'No screen shake, flashes or confetti', settings.reducedMotion, () => this.setting('reducedMotion'));
    toggle('🔣', t('colorblind'), 'A symbol on every ingredient', settings.colorblind, () => this.setting('colorblind'));
    toggle('🤝', t('assist'), 'Slower layers, bigger PERFECT zone', settings.assist, () => this.setting('assist'));
    toggle('🫲', 'Left-handed', 'Corner buttons and results flipped', settings.leftHanded, () => this.setting('leftHanded'));
    toggle('📳', 'Drop-timing tick', 'A vibration and tick when the layer lines up', settings.hapticAssist, () => this.setting('hapticAssist'));
    toggle('🔊', 'Play by ear', 'A tone guides each drop: left/right pan, higher when lined up', settings.audioOnly, () => { this.setting('audioOnly'); if (!settings.audioOnly) cue.stop(); else this.showToast('Play by ear: the tone moves left and right with the layer and rises as it lines up. A click means PERFECT.'); });
    toggle('🎬', t('clips'), clipsSupported() ? 'Save the last seconds of a run as a video' : 'Not supported on this device', settings.clips && clipsSupported(), () => { if (clipsSupported()) this.setting('clips'); else this.showToast('Video recording isn’t supported here'); });
    // Language picker.
    this.card(16, y, WORLD_W - 32, 56);
    this.text('🌐', 40, y + 28, 20, '#fff', 400);
    this.text(t('language'), 64, y + 20, 14, '#fff', 700, 'left');
    this.text('Menus and tips', 64, y + 39, 10.5, 'rgba(255,255,255,0.65)', 600, 'left');
    const li = LANGS.findIndex((l) => l.id === settings.lang);
    this.pill(WORLD_W - 150, y + 12, 118, LANGS[li].name, f, () => {
      settings.lang = LANGS[(li + 1) % LANGS.length].id;
      saveSettings();
      track('setting', { key: 'lang', value: settings.lang });
    }, 'quiet');
    y += 62;

    header(t('secFriends'));
    this.card(16, y, WORLD_W - 32, 96);
    this.text('Your invite code', 32, y + 20, 13, '#fff', 700, 'left');
    this.text(p.inviteCode, 32, y + 44, 20, '#ffd34d', 700, 'left');
    this.fitText(`Friends who enter it get ${cfg.inviteReward} coins. Rewards for you need online accounts (coming later).`, 32, y + 74, WORLD_W - 64, 10.5, 'rgba(255,255,255,0.65)', 'left');
    this.pill(WORLD_W - 116, y + 26, 84, 'COPY', f, () => this.copy(p.inviteCode, 'Invite code copied!'), 'gold');
    y += 104;
    this.pill(16, y, WORLD_W - 32, 'ENTER A FRIEND’S CODE', f, () => this.openCodeInput('friend'), 'quiet');
    y += 44;

    header(t('secSave'));
    this.card(16, y, WORLD_W - 32, 112);
    this.wrapLeft('Move your progress to another device: copy your save code here, then paste it there. (Automatic cloud save needs Game Center / Google Play Games, set up when the game is published.)', 32, y + 18, WORLD_W - 64, 11, 'rgba(255,255,255,0.8)');
    this.pill(32, y + 70, (WORLD_W - 80) / 2, 'COPY SAVE CODE', f, () => {
      void exportSave().then((code) => {
        this.saveCode = code;
        this.copy(code, `Save code copied (${code.length} characters)`);
        track('save_export', { size: code.length });
      });
    }, 'gold');
    this.pill(48 + (WORLD_W - 80) / 2, y + 70, (WORLD_W - 80) / 2, 'PASTE A CODE', f, () => this.openCodeInput('save'), 'quiet');
    y += 120;
    if (this.saveCode) {
      this.fitText(this.saveCode, WORLD_W / 2, y + 6, WORLD_W - 40, 10, 'rgba(255,255,255,0.5)');
      y += 20;
    }
    if (isOnline()) {
      // Cloud backup: the save code kept on the game's server under an ID + PIN.
      const cb = cloudBackupInfo();
      this.card(16, y, WORLD_W - 32, 104);
      this.text('☁️ Cloud backup', 32, y + 20, 13, '#fff', 700, 'left');
      this.fitText(cb ? `ID ${cb.id} · PIN ${cb.pin} · ${new Date(cb.at).toLocaleDateString()}` : 'Not backed up yet. Write down the ID and PIN you get.', 32, y + 42, WORLD_W - 64, 11, cb ? '#ffd34d' : 'rgba(255,255,255,0.7)', 'left', 700);
      this.pill(32, y + 60, (WORLD_W - 80) / 2, cb ? 'BACK UP AGAIN' : 'BACK UP NOW', f, () => {
        this.showToast('Backing up…');
        void exportSave().then((code) => cloudBackup(code)).then((r) => {
          this.showToast(r ? `Backed up! ID ${r.id} · PIN ${r.pin}. Keep these safe.` : 'The server can’t be reached. Try again later.');
          if (r) track('cloud_backup');
        });
      }, 'gold');
      this.pill(48 + (WORLD_W - 80) / 2, y + 60, (WORLD_W - 80) / 2, 'RESTORE', f, () => this.openCodeInput('cloud'), 'quiet');
      y += 112;
      this.pill(16, y, WORLD_W - 32, 'DELETE MY ONLINE DATA', f, () => {
        this.confirmBox = { title: 'Delete online data?', text: 'Your scores, world-tower layers and cloud backup are removed from the server. Progress on this phone stays.', ok: 'DELETE', go: () => {
          void forgetMe(this.playerId()).then((ok) => this.showToast(ok ? 'Your online data was deleted.' : 'The server can’t be reached. Try again later.'));
        } };
      }, 'quiet');
      y += 44;
    }

    header(t('secPrivacy'));
    if (adPrivacyOptionsAvailable()) {
      this.pill(16, y, WORLD_W - 32, t('adPrivacy'), f, () => void showAdPrivacyOptions(), 'quiet');
      y += 44;
    }
    toggle('📊', t('shareStats'), t('shareStatsNote'), settings.analytics, () => this.setting('analytics'));
    const counts = analyticsSummary();
    this.card(16, y, WORLD_W - 32, 84);
    this.wrapLeft(settings.analytics ? 'Thank you! Gameplay events (no name, no contacts, no location) are sent once analytics is set up for this game. Turn it off any time.' : 'Gameplay stats stay on this device. Nothing is sent anywhere.', 32, y + 18, WORLD_W - 64, 11, 'rgba(255,255,255,0.8)');
    this.fitText(`On-device log: ${counts.reduce((a, b) => a + b[1], 0)} events · ${counts.slice(0, 3).map(([n, c]) => `${n} ${c}`).join(' · ')}`, 32, y + 68, WORLD_W - 64, 10, 'rgba(255,255,255,0.55)', 'left');
    y += 92;
    const hw2 = (WORLD_W - 42) / 2;
    this.pill(16, y, hw2, t('myFunnel'), f, () => this.openScreen('funnel', 'settings'), 'quiet');
    this.pill(26 + hw2, y, hw2, t('diagnostics'), f, () => this.openScreen('diagnostics', 'settings'), 'quiet');
    y += 48;
    this.text('Sushi Stack · made with Capacitor', WORLD_W / 2, y + 10, 10, 'rgba(255,255,255,0.4)', 600);
    y += 24;
    this.screenEnd(f, y - f.y0);
  },

  /** Copies text to the clipboard, falling back to showing it. */
  copy(this: Game, text: string, ok: string): void {
    navigator.clipboard?.writeText(text).then(() => this.showToast(ok), () => this.showToast(text.length > 40 ? 'Copy failed: long-press the code below' : text));
    if (!navigator.clipboard) this.showToast(text.length > 40 ? 'Copy failed: long-press the code below' : text);
  },

  /** Builds the share card image and opens the share sheet (or shows the card if there isn't one). */
  shareRun(this: Game, emoji?: number): void {
    const tag = emoji === undefined ? '' : `~${emoji}`;
    const code = encodeChallenge({ seed: this.seed, level: this.startLevel, score: this.height }) + tag;
    const card = document.createElement('canvas');
    card.width = 1080;
    card.height = 1350;
    const c = card.getContext('2d')!;
    const g = c.createLinearGradient(0, 0, 0, 1350);
    g.addColorStop(0, this.theme.sky[0]);
    g.addColorStop(1, this.theme.sky[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, 1080, 1350);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.font = `900 110px ${FONT}`;
    c.fillText('SUSHI STACK', 540, 140);
    // The top of the player's actual stack.
    const layers = this.stack.slice(-14);
    layers.forEach((l, i) => {
      const yy = 1180 - (i + 1) * 46;
      c.fillStyle = this.color(l.kind);
      c.beginPath();
      c.roundRect?.(540 + (l.x - WORLD_W / 2) * 2.2, yy, l.w * 2.2, 40, 10);
      if (!c.roundRect) c.rect(540 + (l.x - WORLD_W / 2) * 2.2, yy, l.w * 2.2, 40);
      c.fill();
    });
    c.fillStyle = '#ffd34d';
    c.font = `900 220px ${FONT}`;
    c.fillText(String(this.height), 540, 360);
    c.fillStyle = '#fff';
    c.font = `800 54px ${FONT}`;
    c.fillText(`layers · level ${this.level}`, 540, 490);
    // The player's chef cheers beside the stack.
    drawChef(c, avatarChef(this.progress.avatar), 170, 1010, 2.2, 'happy', 540, 700, 0.3);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.font = `700 44px ${FONT}`;
    c.fillText(`Chef ${this.progress.avatar.name} · Can you beat me? Code: ${code}`, 540, 1270, 1000);
    const ghost = encodeGhost({ seed: this.seed, level: this.startLevel, score: this.height }, this.stack.slice(1).map((l) => [Math.round(l.x), Math.round(l.w)])) + tag;
    void shareCard(card, ghost, this.height).then((ok) => {
      if (!ok) this.shareOverlay = { image: card, code, ghost };
    });
  },

  drawOverlays(this: Game): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    // Confetti and celebration banners never block taps.
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-4, -2.5, 8, 5);
      ctx.restore();
    }
    if (this.celebration && !this.perkChoice && !this.picker) {
      const t = this.celebration.t;
      const k = Math.min(1, t * 3);
      const pop = 1 + 0.15 * Math.max(0, Math.sin(Math.min(1, (2 - t) * 3) * Math.PI));
      ctx.globalAlpha = k;
      ctx.save();
      ctx.translate(cx, midY - 120);
      ctx.scale(pop, pop);
      // Long subtitles wrap onto a second line inside a taller card.
      ctx.font = `600 12px ${FONT}`;
      const two = ctx.measureText(this.celebration.sub).width > 300;
      const hh = two ? 50 : 42;
      ctx.fillStyle = 'rgba(20,10,25,0.9)';
      this.roundRect(-170, -hh, 340, hh * 2, 20);
      ctx.fill();
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 3;
      ctx.stroke();
      this.fitText(this.celebration.title, 0, two ? -20 : -12, 310, 24, '#ffd34d', 'center', 700);
      this.wrapText(this.celebration.sub, 0, two ? 10 : 18, 300, 12, '#ffffff');
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    const blocker = () => this.buttons.push({ x: -this.offX, y: 0, w: WORLD_W + this.offX * 2, h: this.viewH, onTap: () => undefined });
    if (this.mode === 'playing' && !this.perkChoice && !this.paused) this.drawCoach();
    if (this.perkChoice && this.mode === 'playing') this.drawPerkChoice(blocker);
    if (this.picker) this.drawPicker(blocker);
    if (this.story && !this.picker) this.drawStoryCard(blocker);
    if (this.confirmBox) this.drawConfirm(blocker);
    if (this.pnp && this.runMode === 'pnp') this.drawPnp(blocker);
    if (this.reactPick) this.drawReactPick(blocker);
    if (this.photo) this.drawPhoto(blocker);
    if (this.studio && !this.photo) this.drawStudio(blocker);
    if (this.poster) this.drawPoster(blocker);
    if (this.hl) this.drawHighlightProgress(blocker);
    if (this.letterOpen !== null) this.drawLetter(blocker);
    if (this.cheer && this.mode === 'playing') this.drawCheer();
    this.drawGuide();
    if (this.reportOpen && this.mode === 'restaurant' && !this.story) this.drawReport(blocker);
    if (this.burst) this.drawBurst();
    if (this.adOverlay) {
      blocker();
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.qaCover();
      this.card(40, midY - 130, WORLD_W - 80, 260, '#1e1e2e');
      this.text('TEST AD', cx, midY - 92, 24, '#ffd34d', 900);
      this.text('(simulated — real AdMob ads play in the phone app)', cx, midY - 64, 11, 'rgba(255,255,255,0.7)', 600);
      this.text('🍣', cx, midY - 8, 54, '#fff', 400);
      this.text(`Reward: ${this.adOverlay.label}`, cx, midY + 44, 13, '#fff', 700);
      if (this.adOverlay.t > 0) this.text(`Reward in ${Math.ceil(this.adOverlay.t)}…`, cx, midY + 88, 15, 'rgba(255,255,255,0.8)', 800);
      else this.button(cx - 90, midY + 68, 180, 44, 'COLLECT REWARD', () => { const o = this.adOverlay!; this.adOverlay = null; o.onReward(); }, 'gold');
      return;
    }
    if (this.buyOverlay) {
      const pr = PRODUCTS[this.buyOverlay];
      blocker();
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.qaCover();
      this.card(30, midY - 140, WORLD_W - 60, 280, '#2a1a33');
      this.text(pr.name, cx, midY - 104, 22, '#fff', 900);
      this.text(pr.price, cx, midY - 76, 18, '#ffd34d', 900);
      this.wrapText(pr.desc, cx, midY - 40, WORLD_W - 100, 13, '#fff');
      this.text('TEST MODE · no real money is charged', cx, midY + 30, 12, '#9fe3ff', 800);
      this.text('Real purchases need the App Store / Play Store set up.', cx, midY + 50, 10.5, 'rgba(255,255,255,0.65)', 600);
      this.button(50, midY + 76, 130, 44, 'CANCEL', () => { this.buyOverlay = null; }, 'quiet');
      this.button(WORLD_W - 180, midY + 76, 130, 44, 'TEST BUY', () => { const id = this.buyOverlay!; this.buyOverlay = null; this.grant(id); }, 'gold');
      return;
    }
    if (this.shareOverlay) {
      const o = this.shareOverlay;
      blocker();
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.qaCover();
      const iw = 220;
      const ih = iw * 1.25;
      ctx.drawImage(o.image, cx - iw / 2, midY - ih / 2 - 70, iw, ih);
      this.text(`Challenge code: ${o.code}`, cx, midY + ih / 2 - 46, 15, '#ffd34d', 900);
      this.text('Send this code to a friend: they play the same chefs and see your score to beat.', cx, midY + ih / 2 - 24, 10.5, '#fff', 600);
      this.button(30, midY + ih / 2 - 4, 108, 44, 'COPY CODE', () => this.copy(o.code, 'Code copied!'), 'gold');
      this.button(146, midY + ih / 2 - 4, 108, 44, '👻 GHOST', () => this.copy(o.ghost, 'Ghost code copied: friends race your exact stack'), 'gold');
      this.button(262, midY + ih / 2 - 4, 108, 44, 'CLOSE', () => { this.shareOverlay = null; }, 'quiet');
      return;
    }
    if (this.setDetail !== null) {
      const set = STICKER_SETS[this.setDetail];
      const have = this.progress.album.have[this.setDetail] ?? [];
      blocker();
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.qaCover();
      this.card(24, midY - 190, WORLD_W - 48, 380, '#2a1a33');
      this.text(`${set.name} · ${have.filter((x: number) => x > 0).length}/9`, cx, midY - 160, 20, '#fff', 900);
      this.text(`Complete the set: +${SET_REWARD(this.setDetail)} coins`, cx, midY - 136, 11, '#ffd34d', 700);
      set.stickers.forEach((st, i) => {
        const x = 64 + (i % 3) * 110;
        const yy = midY - 96 + Math.floor(i / 3) * 92;
        const n = have[i] ?? 0;
        this.card(x - 44, yy - 8, 88, 82, n ? 'rgba(255,248,235,0.95)' : 'rgba(255,255,255,0.08)');
        ctx.globalAlpha = n ? 1 : 0.25;
        this.text(n ? st : '?', x, yy + 26, n ? 34 : 26, '#fff', 400);
        ctx.globalAlpha = 1;
        this.text('★'.repeat(stickerRarity(this.setDetail!, i)), x, yy + 60, 9, n ? '#e0a800' : 'rgba(255,255,255,0.4)', 900);
        if (n > 1) this.text(`x${n}`, x + 32, yy + 2, 10, '#4a2618', 900);
      });
      this.button(cx - 75, midY + 140, 150, 40, 'CLOSE', () => { this.setDetail = null; }, 'quiet');
    }
  },

  /** Coaching card at the bottom, plus a tapping finger for the very first drops. */
  drawCoach(this: Game): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    if (this.progress.tutorial === 0 && this.moving) {
      const bob = Math.abs(Math.sin(this.time * 5)) * 10;
      const fy = this.viewH * 0.68;
      ctx.strokeStyle = `rgba(255,255,255,${0.5 - (this.time % 0.8) / 1.6})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, fy - 22, 14 + ((this.time % 0.8) / 0.8) * 22, 0, Math.PI * 2);
      ctx.stroke();
      this.text('👆', cx, fy + bob, 40, '#fff', 400);
    }
    const tip = this.tip;
    if (!tip || this.dish) return;
    const a = Math.min(1, tip.t * 2.5);
    ctx.font = `600 12px ${FONT}`;
    const two = ctx.measureText(tip.text).width > WORLD_W - 100;
    const h = two ? 78 : 62;
    const y = this.viewH - this.insets.bottom - h - 18 + (1 - a) * 20;
    ctx.globalAlpha = a;
    this.card(24, y, WORLD_W - 48, h, 'rgba(255,248,235,0.97)');
    ctx.fillStyle = '#ff8a5b';
    this.roundRect(24, y, 8, h, 4);
    ctx.fill();
    this.text(tip.title, 46, y + 20, 14, '#c4501f', 700, 'left');
    if (two) this.wrapLeft(tip.text, 46, y + 40, WORLD_W - 100, 12, '#4a2618');
    else this.fitText(tip.text, 46, y + 42, WORLD_W - 100, 12, '#4a2618', 'left');
    ctx.globalAlpha = 1;
  },

  /** Single-line text that shrinks to fit maxW. */
  fitText(this: Game, str: string, x: number, y: number, maxW: number, size: number, color: string, align: CanvasTextAlign = 'center', weight = 600): void {
    const { ctx } = this;
    let s2 = size;
    ctx.font = `${weight} ${s2}px ${FONT}`;
    const min = Math.max(8, size * 0.75);
    while (s2 > min && ctx.measureText(str).width > maxW) {
      s2 -= 0.5;
      ctx.font = `${weight} ${s2}px ${FONT}`;
    }
    // Still too long at the smallest size: cut it with an ellipsis.
    let out = str;
    while (out.length > 1 && ctx.measureText(out).width > maxW) out = out.slice(0, -2) + '…';
    this.text(out, x, y, s2, color, weight, align);
  },

  /** After each chef in a journey: pick one of three perks for the rest of the run. */
  drawPerkChoice(this: Game, blocker: () => void): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    ctx.fillStyle = 'rgba(20,10,25,0.78)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    this.fitText(t('chefBeaten'), cx, midY - 150, WORLD_W - 40, 30, '#ffd34d', 'center', 700);
    this.fitText(t('pickPerk'), cx, midY - 118, WORLD_W - 40, 14, '#ffffff', 'center');
    const cw = 116;
    const ch = 196;
    const gap = 10;
    const x0 = cx - (cw * 3 + gap * 2) / 2;
    this.perkChoice!.forEach((id, i) => {
      const pk = PERKS[id];
      const x = x0 + i * (cw + gap);
      const y = midY - 92 + Math.sin(this.time * 3 + i) * 3;
      const have = this.perks[id] ?? 0;
      this.card(x, y, cw, ch, 'rgba(255,248,235,0.97)');
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 3;
      this.roundRect(x, y, cw, ch, 14);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,138,91,0.18)';
      ctx.beginPath();
      ctx.arc(x + cw / 2, y + 44, 30, 0, Math.PI * 2);
      ctx.fill();
      this.text(pk.icon, x + cw / 2, y + 46, 32, '#fff', 400);
      this.wrapText(pk.name, x + cw / 2, y + 96, cw - 14, 13.5, '#4a2618', 700);
      this.wrapText(pk.desc, x + cw / 2, y + 134, cw - 16, 11, '#7a5a48');
      if (have) this.text(`owned x${have}`, x + cw / 2, y + ch - 14, 10, '#2a9d5c', 700);
      this.buttons.push({ x, y, w: cw, h: ch, onTap: () => this.choosePerk(id) });
    });
    this.text(t('tapCard'), cx, midY + 132, 12, 'rgba(255,255,255,0.7)', 600);
  },

  /** Before a run: choose which owned boosters to use (unpicked ones stay in the bag). */
  drawPicker(this: Game, blocker: () => void): void {
    const { ctx } = this;
    const pk = this.picker!;
    const cx = WORLD_W / 2;
    const owned = BOOSTERS.filter((b) => (this.boosters[b.id] ?? 0) > 0);
    blocker();
    ctx.fillStyle = 'rgba(20,10,25,0.8)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    const rows = Math.ceil(owned.length / 3);
    const h = 150 + rows * 96;
    const y = Math.max(this.insets.top + 50, this.viewH / 2 - h / 2);
    this.card(20, y, WORLD_W - 40, h, '#2a1a33');
    const title = pk.mode === 'journey' ? `LEVEL ${pk.level} · ${chefFor(pk.level).name}` : pk.mode === 'special' ? 'DAILY SPECIAL' : pk.mode === 'zen' ? 'ZEN' : pk.mode === 'time' ? 'TIME ATTACK' : pk.mode === 'gauntlet' ? '⚔️ GAUNTLET' : pk.mode === 'critic' ? '🧐 FOOD CRITIC' : 'FRIEND CHALLENGE';
    this.fitText(title, cx, y + 26, WORLD_W - 80, 18, '#ffffff', 'center', 700);
    this.fitText(t('pickBoosters'), cx, y + 50, WORLD_W - 60, 11.5, 'rgba(255,255,255,0.75)');
    owned.forEach((b, i) => {
      const bx = 36 + (i % 3) * 112;
      const by = y + 70 + Math.floor(i / 3) * 96;
      const on = pk.picked.has(b.id);
      this.card(bx, by, 104, 86, on ? 'rgba(255,211,77,0.22)' : 'rgba(255,255,255,0.07)');
      if (on) {
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 2.5;
        this.roundRect(bx, by, 104, 86, 14);
        ctx.stroke();
      }
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(bx + 52, by + 26, 17, 0, Math.PI * 2);
      ctx.fill();
      this.text(b.glyph, bx + 52, by + 27, 14, '#fff', 700);
      this.fitText(b.name, bx + 52, by + 56, 96, 11.5, '#fff', 'center', 700);
      this.text(`x${this.boosters[b.id]}`, bx + 52, by + 73, 10.5, 'rgba(255,255,255,0.65)', 600);
      // Tick box in the corner.
      ctx.fillStyle = on ? '#2a9d5c' : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(bx + 90, by + 14, 9, 0, Math.PI * 2);
      ctx.fill();
      if (on) this.text('✓', bx + 90, by + 15, 12, '#fff', 700);
      this.buttons.push({ x: bx, y: by, w: 104, h: 86, onTap: () => { if (on) pk.picked.delete(b.id); else pk.picked.add(b.id); } });
    });
    const by = y + h - 64;
    const all = pk.picked.size === owned.length;
    this.button(36, by, 96, 44, t('back'), () => { this.picker = null; }, 'quiet');
    this.button(140, by, 96, 44, all ? t('none') : t('all'), () => { pk.picked = new Set(all ? [] : owned.map((b) => b.id)); }, 'quiet');
    this.button(244, by, 120, 44, pk.picked.size ? `${t('start')} (${pk.picked.size})` : t('start'), () => {
      this.progress.lastBoosters = [...pk.picked];
      this.progress.persist();
      this.picker = null;
      this.startRun(pk.level, pk.mode, { ...pk.opts, picked: pk.picked });
    }, 'gold');
  },

  /** Draws text wrapped to a width, centred on x, starting at y. */
  wrapText(this: Game, str: string, x: number, y: number, maxW: number, size: number, color: string, weight = 600): number {
    const { ctx } = this;
    ctx.font = `${weight} ${size}px ${FONT}`;
    const words = str.split(' ');
    let line = '';
    let yy = y;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        this.text(line, x, yy, size, color, weight);
        ctx.font = `${weight} ${size}px ${FONT}`;
        line = w;
        yy += size * 1.35;
      } else line = test;
    }
    if (line) this.text(line, x, yy, size, color, weight);
    return yy + size * 1.35;
  },

  panel(this: Game, y: number, title: string, sub: string): void {
    this.text(title, WORLD_W / 2, y - 30, 38, '#fff', 900);
    this.text(sub, WORLD_W / 2, y + 8, 17, 'rgba(255,255,255,0.85)', 600);
  },
};
