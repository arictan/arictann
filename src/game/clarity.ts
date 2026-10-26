// The guided first day, Next up, What’s new, battery saver, diagnostics and the funnel.
// These are methods of Game (see game.ts), kept here to keep that file a readable size.

import { Capacitor } from '@capacitor/core';
import { playSong, sfx, unlockAudio } from '../audio';
import { hapticFeel,  scheduleAt } from '../platform';
import { COMPANIONS, companionLevel } from '../collect';
import { dayKey } from '../progress';
import { settings } from '../settings';
import { t } from '../i18n';
import { analyticsLog, funnel, track } from '../analytics';
import { APP_VERSION, SAVE_VERSION, clearErrors, logError, supportReport, errorLog, readBackup, restoreBackup, storageBytes } from '../safety';
import type { Haptic } from '../feel';
import { clipsSupported } from '../clips';
import { LETTERS } from '../book';
import { dailyNumber } from '../daily';
import { CHAPTERS, PICTURES, REGULARS, chapterFor, heartLevel } from '../meta';
import { type Ingredient } from '../shop';
import { chefFor } from '../chef';
import { Game, WORLD_W, RECIPES } from '../game';

declare module '../game' {
  interface Game {
    guideStep(): string | null;
    guideAt(step: string, x: number, y: number, w: number, h: number): void;
    checkGuide(): void;
    drawGuide(): void;
    newsNext(): (typeof Game.NEWS)[number] | undefined;
    nextUp(): { icon: string; title: string; text: string; go: () => void; hot: boolean };
    drawNextUp(y: number): void;
    drawHomeTiles(y: number): void;
    drawCollection(): void;
    drawTiles(f: { areaTop: number; areaH: number; backY: number; y0: number }, tiles: [string, string, string, () => void, string][]): void;
    setLowPower(on: boolean): void;
    calm(): boolean;
    drawFunnel(): void;
    fmtSpan(ms: number): string;
    drawDiagnostics(): void;
  }
}

export const clarityMethods = {
  guideStep(this: Game): string | null {
    const g = this.progress.guide;
    return g >= 0 && g < Game.GUIDE.length ? Game.GUIDE[g].id : null;
  },

  /** Screens call this as they draw a guide target; the pointer then points at it. */
  guideAt(this: Game, step: string, x: number, y: number, w: number, h: number): void {
    if (this.guideStep() !== step) return;
    const f = this.curFrame;
    if (f && this.scrolling && this.guideScrolled !== step && (y < f.areaTop || y + h > f.areaTop + f.areaH)) {
      // Bring the target into view once.
      this.guideScrolled = step;
      this.pageScroll = Math.max(0, this.pageScroll + (y - (f.areaTop + f.areaH * 0.45)));
      return;
    }
    this.guideRect = { x, y, w, h };
  },

  /** Moves the guide on when its step is done. */
  checkGuide(this: Game): void {
    const p = this.progress;
    const step = this.guideStep();
    if (!step) return;
    const d = this.diner;
    const done = step === 'play' ? (p.stats.served ?? 0) >= 1
      : step === 'open' ? !this.lockedAt('restaurant')
      : step === 'visit' ? this.mode === 'restaurant'
      : step === 'build' ? p.restaurant.levels[0] >= 1
      : step === 'cook' ? d.burners.some((b) => b) || this.displayCount() > 0 || d.soldTotal > 0
      : step === 'plate' ? this.displayCount() > 0 || d.soldTotal > 0
      : d.soldTotal > 0;
    if (!done) return;
    p.guide++;
    track('guide', { step: p.guide });
    if (p.guide >= Game.GUIDE.length) {
      this.bankCoins(150);
      track('first_day');
      this.celebrate(t('firstDayDone'), 'Grandma’s bar is open again · +150 coins', 3);
    }
    p.persist();
  },

  /** The pointer: a pulsing ring around the target, a finger and the step's words. */
  drawGuide(this: Game): void {
    const step = this.guideStep();
    if (!step || this.story || this.picker || this.perkChoice) return;
    if (this.mode !== 'title' && this.mode !== 'restaurant') return;
    const { ctx } = this;
    const text = t(Game.GUIDE[this.progress.guide].key);
    const r = this.guideRect;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 6);
    if (r) {
      ctx.strokeStyle = `rgba(255,211,77,${0.6 + 0.4 * pulse})`;
      ctx.lineWidth = 3 + pulse * 2;
      this.roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 14);
      ctx.stroke();
      // The finger points at the target from below, or from above when the target is near the bottom.
      const below = r.y + r.h + 40 < this.viewH - this.insets.bottom - 120;
      this.text(below ? '👆' : '👇', r.x + r.w / 2 + 6, below ? r.y + r.h + 18 + pulse * 6 : r.y - 20 - pulse * 6, 26, '#fff', 400);
    }
    // The step's words at the bottom, above the navigation.
    const by = this.viewH - this.insets.bottom - (this.mode === 'title' ? 112 : 112);
    ctx.fillStyle = 'rgba(255,248,235,0.97)';
    this.roundRect(20, by, WORLD_W - 40, 40, 20);
    ctx.fill();
    this.text('🍣', 40, by + 20, 16, '#fff', 400);
    this.fitText(text, WORLD_W / 2 + 10, by + 20, WORLD_W - 100, 12.5, '#4a2618', 'center', 700);
  },

  newsNext(this: Game): (typeof Game.NEWS)[number] | undefined {
    return Game.NEWS.find((n) => !this.lockedAt(n.unlock) && !this.progress.seen.includes(`news:${n.id}`));
  },

  /** The one thing worth doing next, as a card on the home screen. */
  nextUp(this: Game): { icon: string; title: string; text: string; go: () => void; hot: boolean } {
    const p = this.progress;
    const step = this.guideStep();
    if (step) return { icon: '👉', title: t('firstDay'), text: t(Game.GUIDE[p.guide].key), go: () => (step === 'visit' || step === 'build' || step === 'cook' || step === 'plate' || step === 'serve' ? this.openScreen('restaurant') : this.startRun()), hot: true };
    if (!this.lockedAt('gift') && this.giftReady()) return { icon: '🎁', title: 'DAILY GIFT', text: 'Your daily gift is ready to open', go: () => this.claimGift(), hot: true };
    const news = this.newsNext();
    if (news) return { icon: news.icon, title: `NEW: ${news.title.toUpperCase()}`, text: news.text, go: () => { p.seen.push(`news:${news.id}`); p.persist(); news.go(this); }, hot: true };
    if (!this.lockedAt('daily') && !this.dailyDone()) return { icon: '🟩', title: `DAILY ROLL #${dailyNumber()}`, text: 'Same layers for everyone today: one try, share your grid', go: () => this.openScreen('daily'), hot: true };
    if (!this.lockedAt('restaurant')) {
      const pitch = this.restaurantPitch();
      if (pitch.hot) return { icon: '🏯', title: 'YOUR RESTAURANT', text: pitch.text, go: () => this.openScreen('restaurant'), hot: true };
    }
    if (this.lettersUnread()) return { icon: '💌', title: 'A LETTER FROM GRANDMA', text: 'Read it in Grandma’s Book', go: () => this.openScreen('book'), hot: true };
    const event = this.liveEvent();
    if (event) return { icon: event.icon, title: event.name.toUpperCase(), text: event.text, go: () => this.startRun(), hot: true };
    return { icon: '🍣', title: t('nextUp'), text: `Beat ${chefFor(p.playLevel).name} at level ${p.playLevel}`, go: () => this.startRun(), hot: false };
  },

  drawNextUp(this: Game, y: number): void {
    const { ctx } = this;
    const n = this.nextUp();
    const g = ctx.createLinearGradient(24, 0, WORLD_W - 24, 0);
    g.addColorStop(0, n.hot ? 'rgba(120,60,20,0.95)' : 'rgba(40,30,60,0.95)');
    g.addColorStop(1, 'rgba(60,30,60,0.95)');
    ctx.fillStyle = g;
    this.roundRect(24, y, WORLD_W - 48, 56, 16);
    ctx.fill();
    if (n.hot) {
      ctx.strokeStyle = `rgba(255,211,77,${0.5 + 0.4 * Math.sin(this.time * 4)})`;
      ctx.lineWidth = 2;
      this.roundRect(24, y, WORLD_W - 48, 56, 16);
      ctx.stroke();
    }
    this.text(n.icon, 50, y + 28, 22, '#fff', 400);
    this.fitText(n.title, 74, y + 19, WORLD_W - 190, 11.5, '#ffd34d', 'left', 700);
    this.fitText(n.text, 74, y + 38, WORLD_W - 190, 11, '#fff', 'left', 600);
    this.drawButton(WORLD_W - 104, y + 12, 70, 32, 'GO', n.hot ? 'gold' : 'quiet', 13);
    this.buttons.push({ x: 24, y, w: WORLD_W - 48, h: 56, onTap: n.go, label: `${n.title}: ${n.text}` });
  },

  /** Four small tiles: gift, modes, Daily Special, Daily Roll (locked ones show their level). */
  drawHomeTiles(this: Game, y: number): void {
    const { ctx } = this;
    const p = this.progress;
    const tw = (WORLD_W - 60 - 3 * 6) / 4;
    const specialDone = p.specialDay === dayKey();
    const tiles: [string, string, string, () => void, boolean][] = [
      ['gift', this.giftReady() ? '😺' : '😸', this.giftReady() ? t('gift') : t('giftTomorrow'), () => this.claimGift(), this.giftReady()],
      ['modes', '🎮', t('modes'), () => this.openScreen('modes'), false],
      ['modes', '🍱', specialDone ? '✓ SPECIAL' : 'SPECIAL +150', () => this.startRun(this.specialLevel(), 'special'), !specialDone],
      ['daily', '🟩', this.dailyDone() ? 'SHARE GRID' : `ROLL #${dailyNumber()}`, () => this.openScreen('daily'), !this.dailyDone()],
    ];
    tiles.forEach(([id, icon, label, go, hot], i) => {
      const x = 30 + i * (tw + 6);
      const lock = this.lockedAt(id);
      ctx.fillStyle = lock ? 'rgba(20,10,25,0.6)' : hot ? 'rgba(255,211,77,0.92)' : 'rgba(20,10,25,0.85)';
      this.roundRect(x, y, tw, 58, 14);
      ctx.fill();
      ctx.globalAlpha = lock ? 0.45 : 1;
      this.text(icon, x + tw / 2, y + 22 + (hot && !lock ? Math.sin(this.time * 5 + i) * 1.5 : 0), 20, '#fff', 400);
      ctx.globalAlpha = 1;
      this.fitText(lock ? `🔒 LV ${lock}` : label, x + tw / 2, y + 45, tw - 8, 9.5, lock ? 'rgba(255,255,255,0.6)' : hot ? '#4a2a00' : '#fff', 'center', 700);
      this.buttons.push({ x, y, w: tw, h: 58, onTap: lock ? () => this.lockedToast(id) : go, label: lock ? `${label} (locked)` : label });
    });
  },

  /** Grandma's Book, the Museum, the Album and the other collections in one place. */
  drawCollection(this: Game): void {
    const p = this.progress;
    const f = this.screenBegin('COLLECTION', 'Everything you’ve collected, in one place');
    const tiles: [string, string, string, () => void, string][] = [
      ['📖', 'Grandma’s Book', this.lettersUnread() ? `${this.lettersUnread()} new letter${this.lettersUnread() > 1 ? 's' : ''}!` : `${p.letters.length}/${LETTERS.length} letters · recipes`, () => { this.checkLetters(); this.openScreen('book', 'collection'); }, 'book'],
      ['🏛️', 'Museum', `${RECIPES.filter((r) => (p.recipeCounts[r.name] ?? 0) > 0).length}/${RECIPES.length} dishes · mastery`, () => this.openScreen('museum', 'collection'), ''],
      ['📒', 'Album', 'Chef cards, stickers, records', () => { this.openAlbum(); this.shopFrom = 'collection'; }, ''],
      ['🖼️', 'Gallery', `${p.gallery.done.length}/${PICTURES.length} pictures`, () => this.openScreen('gallery', 'collection'), ''],
      ['🏆', 'Achievements', this.achClaimable() ? `${this.achClaimable()} reward${this.achClaimable() > 1 ? 's' : ''} ready!` : 'Lifetime goals', () => this.openScreen('trophies', 'collection'), ''],
      ['💞', 'Regulars', `${REGULARS.filter((r) => heartLevel(p.hearts[r.id] ?? 0) >= 2).length} friends`, () => this.openScreen('regulars', 'collection'), ''],
      ['🐾', 'Companions', `${COMPANIONS.filter((c) => companionLevel(p.shards[c.id] ?? 0) > 0).length}/${COMPANIONS.length} unlocked`, () => this.openScreen('pets', 'collection'), ''],
      ['📜', 'Story', `Chapter ${Math.min(chapterFor(p.unlocked) + 1, CHAPTERS.length + 1)}`, () => this.openScreen('story', 'collection'), ''],
    ];
    this.drawTiles(f, tiles);
  },

  /** A grid of big tiles; locked ones show the level that opens them. */
  drawTiles(this: Game, f: { areaTop: number; areaH: number; backY: number; y0: number }, tiles: [string, string, string, () => void, string][]): void {
    const tw = (WORLD_W - 32 - 10) / 2;
    tiles.forEach(([icon, name, sub, go, id], i) => {
      const x = 16 + (i % 2) * (tw + 10);
      const y = f.y0 + 4 + Math.floor(i / 2) * 104;
      const lock = id ? this.lockedAt(id) : 0;
      this.card(x, y, tw, 94, lock ? 'rgba(30,20,35,0.8)' : undefined);
      this.ctx.globalAlpha = lock ? 0.45 : 1;
      this.text(icon, x + tw / 2, y + 30, 28, '#fff', 400);
      this.ctx.globalAlpha = 1;
      this.text(name, x + tw / 2, y + 62, 14, lock ? 'rgba(255,255,255,0.6)' : '#fff', 900);
      this.fitText(lock ? `🔒 opens at level ${lock}` : sub, x + tw / 2, y + 80, tw - 16, 10.5, !lock && (sub.includes('ready') || sub.includes('new')) ? '#ffd34d' : 'rgba(255,255,255,0.7)', 'center', 700);
      this.listTap(x, y, tw, 94, f, lock ? () => this.lockedToast(id) : go);
      const lb = this.buttons[this.buttons.length - 1];
      if (lb) lb.label = lock ? `${name} (locked)` : name;
    });
    this.screenEnd(f, Math.ceil(tiles.length / 2) * 104 + 8);
  },

  /** Fewer particles, simpler sky and scene: used on slow phones and with Battery saver on. */
  setLowPower(this: Game, on: boolean): void {
    this.lowPower = on;
    this.resize();
    track('low_power', { on });
    if (on) logError(new Error('Switched to lite effects: frames were slow'), 'perf');
  },

  /** True on screens that can draw at 30 fps without anyone noticing. */
  calm(this: Game): boolean {
    // Never while a finger is dragging a list, a run is on, or something is flying across the screen.
    if (this.intro || this.drag || this.burst || this.hl || this.celebration || this.confetti.length) return false;
    if (this.mode === 'playing' || this.mode === 'mini') return false;
    return settings.batterySaver || this.mode !== 'dead';
  },

  /** The keep-playing funnel on this device: which first steps happened, and when. */
  drawFunnel(this: Game): void {
    const f = this.screenBegin('MY FUNNEL', 'Your first steps, as the developer would see them');
    let y = f.y0 + 4;
    this.wrapLeft(settings.analytics ? 'You share anonymous stats: these steps help find where new players get stuck.' : 'Kept on this device only. Turn on “Share anonymous stats” to help improve the game.', 16, y + 4, WORLD_W - 32, 11, 'rgba(255,255,255,0.75)');
    y += 32;
    const steps = funnel();
    const t0 = steps[0].at;
    steps.forEach((s, i) => {
      const done = s.at !== null;
      this.card(16, y, WORLD_W - 32, 48, done ? undefined : 'rgba(20,20,40,0.6)');
      this.text(done ? '✅' : `${i + 1}`, 38, y + 25, 15, done ? '#fff' : 'rgba(255,255,255,0.4)', 700);
      this.fitText(s.label, 60, y + 20, 200, 13, done ? '#fff' : 'rgba(255,255,255,0.5)', 'left', 700);
      const when = !done ? 'not yet' : !t0 || i === 0 ? new Date(s.at!).toLocaleDateString() : `+${this.fmtSpan(s.at! - t0)}`;
      this.fitText(when, 60, y + 37, 200, 10.5, 'rgba(255,255,255,0.6)', 'left', 600);
      if (s.count > 1) this.fitText(`×${s.count}`, WORLD_W - 30, y + 28, 60, 12, '#ffd34d', 'right', 700);
      y += 54;
    });
    const ends = analyticsLog().filter((e) => e.name === 'session_end').slice(-5).reverse();
    if (ends.length) {
      this.text('LAST SESSIONS ENDED ON', 20, y + 12, 12, '#ffd34d', 700, 'left');
      y += 24;
      for (const e of ends) {
        this.fitText(`${new Date(e.t).toLocaleString()} · ${String(e.props?.screen ?? '?')} · level ${String(e.props?.level ?? '?')}`, 24, y + 8, WORLD_W - 48, 11, 'rgba(255,255,255,0.75)', 'left', 600);
        y += 20;
      }
    }
    y += 12;
    this.screenEnd(f, y - f.y0);
  },

  fmtSpan(this: Game, ms: number): string {
    const m = Math.round(ms / 60000);
    return m < 60 ? `${m} min` : m < 1440 * 2 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} days`;
  },

  drawDiagnostics(this: Game): void {
    const { ctx } = this;
    const f = this.screenBegin('DIAGNOSTICS', `Version ${APP_VERSION} · save v${SAVE_VERSION}`);
    let y = f.y0 + 4;
    const perf = (window as unknown as { __perf?: { work: number } }).__perf;
    const rows: [string, string][] = [
      ['Frame work', perf ? `${perf.work.toFixed(1)} ms per frame (under 12 is smooth)` : '–'],
      ['Quality', this.lite ? 'Lite (battery saver or a slow phone)' : 'Full'],
      ['Saved data', `${Math.round(storageBytes() / 1024)} KB on this device`],
      ['Backups', [readBackup(1), readBackup(2)].filter(Boolean).map((b) => b!.day).join(' · ') || 'none yet'],
      ['Errors logged', String(errorLog().length)],
      ['Video recording', clipsSupported() ? 'supported' : 'not supported'],
      ['Platform', Capacitor.isNativePlatform() ? `${Capacitor.getPlatform()} app` : 'web browser'],
    ];
    this.card(16, y, WORLD_W - 32, rows.length * 24 + 16);
    rows.forEach(([k, v], i) => {
      this.text(k, 30, y + 20 + i * 24, 11.5, 'rgba(255,255,255,0.7)', 700, 'left');
      this.fitText(v, WORLD_W - 30, y + 20 + i * 24, 210, 11, '#fff', 'right', 600);
    });
    y += rows.length * 24 + 24;
    const half = (WORLD_W - 42) / 2;
    this.pill(16, y, half, '📋 COPY REPORT', f, () => this.copy(supportReport({ level: this.progress.unlocked, lite: this.lite, perf: perf?.work }), 'Report copied. Send it to support!'), 'gold');
    this.pill(26 + half, y, half, 'CLEAR ERRORS', f, () => { clearErrors(); this.showToast('Error log cleared'); }, 'quiet');
    y += 44;
    for (const e of errorLog().slice(-4).reverse()) {
      this.card(16, y, WORLD_W - 32, 44, 'rgba(70,20,30,0.9)');
      this.fitText(`${new Date(e.t).toLocaleString()} · ${e.where}`, 28, y + 14, WORLD_W - 56, 9.5, 'rgba(255,255,255,0.6)', 'left', 600);
      this.fitText(e.msg, 28, y + 31, WORLD_W - 56, 10.5, '#ffb4a2', 'left', 700);
      y += 50;
    }
    // Restoring a backup.
    this.text('SAVE BACKUPS', 20, y + 12, 12, '#ffd34d', 700, 'left');
    y += 26;
    for (const n of [1, 2] as const) {
      const b = readBackup(n);
      if (!b) continue;
      this.pill(16, y, WORLD_W - 32, `↩ RESTORE ${n === 1 ? 'TODAY’S' : 'EARLIER'} BACKUP (${b.day})`, f, () => {
        this.confirmBox = { title: 'Restore this backup?', text: `Your progress goes back to ${b.day}. This can’t be undone.`, ok: 'RESTORE', go: () => { if (restoreBackup(n)) location.reload(); } };
      }, 'quiet');
      y += 42;
    }
    // Device check: try every phone feature the game uses.
    y += 6;
    this.text('DEVICE CHECK', 20, y + 12, 12, '#ffd34d', 700, 'left');
    y += 26;
    this.wrapLeft('Try each one on a real phone before publishing: you should feel, hear or see it.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.7)');
    y += 32;
    const haptics: Haptic[] = ['soft', 'firm', 'crisp', 'pop', 'slide', 'wobble', 'crunch', 'squish'];
    const hw = (WORLD_W - 32 - 18) / 4;
    haptics.forEach((h, i) => this.pill(16 + (i % 4) * (hw + 6), y + Math.floor(i / 4) * 40, hw, `📳 ${h}`, f, () => hapticFeel(h), 'quiet'));
    y += 84;
    this.pill(16, y, half, '🔊 SOUNDS', f, () => { unlockAudio(); (['rice', 'nori', 'ikura', 'unagi', 'patty'] as Ingredient[]).forEach((k, i) => setTimeout(() => sfx.land(k), i * 350)); }, 'quiet');
    this.pill(26 + half, y, half, '🎵 SONG', f, () => { unlockAudio(); playSong([0, 6, 9, 2, 14, 7, 23, 11, 3, 27]); }, 'quiet');
    y += 40;
    this.pill(16, y, half, this.diagTilt === null ? '📱 TILT TEST' : `📱 tilt ${this.tilt.toFixed(2)}`, f, () => {
      // iPhones ask for motion access first.
      const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (D.requestPermission) void D.requestPermission().then((r) => this.showToast(`Motion: ${r}`)).catch(() => this.showToast('Motion access was refused'));
      this.diagTilt = 0;
    }, 'quiet');
    this.pill(26 + half, y, half, this.diagCamOn ? '📷 CAMERA OFF' : '📷 CAMERA TEST', f, () => {
      if (this.diagCamOn) {
        this.diagCamOn = false;
        this.stopCamera();
      } else {
        this.diagCamOn = true;
        void this.startCamera();
      }
    }, 'quiet');
    y += 40;
    if (this.diagCamOn && this.video && this.video.readyState >= 2) {
      ctx.drawImage(this.video, 16, y, WORLD_W - 32, (WORLD_W - 32) * 0.75);
      y += (WORLD_W - 32) * 0.75 + 8;
    }
    this.pill(16, y, half, '🔔 REMINDER TEST', f, () => { void scheduleAt(9, 'Sushi Stack test', 'Reminders work on this phone 🍣', new Date(Date.now() + 10_000)); this.showToast(Capacitor.isNativePlatform() ? 'A test reminder comes in 10 seconds (if allowed)' : 'Reminders only work in the phone app'); }, 'quiet');
    this.pill(26 + half, y, half, '🏠 WIDGET TEST', f, () => { this.pushWidget(); this.showToast(Capacitor.isNativePlatform() ? 'Widget updated (if the widget is installed)' : 'The widget only exists in the phone app'); }, 'quiet');
    y += 48;
    this.screenEnd(f, y - f.y0);
  },
};
