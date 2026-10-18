import { sfx, unlockAudio, setMuted } from './audio';
import { haptic, save } from './platform';
import { THEMES, drawBackdrop, makeSpecks, type Theme } from './themes';
import { BOOSTERS, CATALOG, EFFECTS, SETS, TABS, drawFlag, drawPlate, drawShape, type BoosterId, type Cat, type Cosmetic, type Ingredient, type Item, type Shape } from './shop';
import { CHEFS, drawChef, drawKnife, type Attack, type Chef, type Help, type Holding, type Mood } from './chef';

// The world is always 400 units wide; height follows the screen's aspect ratio.
// World y grows downward; the plate sits at y = 0 and the stack grows toward negative y.
const WORLD_W = 400;
const LAYER_H = 24;
const BASE_W = 200;
const WIDE_W = 260; // starting width with the Wide Base booster
const PERFECT_TOL = 5; // drops this close to the layer below snap into place
const TIGHT_TOL = 3; // perfect window for chefs with the "precise" rule
const REGROW = 8; // width regained per perfect once a streak reaches 3
const GRAVITY = 1400;


const COLORS: Record<Ingredient, string> = {
  rice: '#f6f1e4',
  nori: '#24321f',
  salmon: '#ff8a5b',
  tuna: '#d7263d',
  avocado: '#9bc53d',
  cucumber: '#3f8f4a',
  egg: '#ffcf3f',
};

interface Recipe { name: string; pattern: Ingredient[] }

const RECIPES: Recipe[] = [
  { name: 'Salmon Maki', pattern: ['rice', 'nori', 'salmon'] },
  { name: 'Tamago Tower', pattern: ['rice', 'egg', 'nori'] },
  { name: 'Tuna Classic', pattern: ['rice', 'tuna', 'avocado'] },
  { name: 'Green Roll', pattern: ['rice', 'cucumber', 'avocado', 'nori'] },
  { name: 'Rainbow Roll', pattern: ['rice', 'salmon', 'tuna', 'egg', 'avocado', 'cucumber'] },
];

interface Layer {
  x: number; // left edge
  y: number; // top edge
  w: number;
  kind: Ingredient;
  origin: number; // world x where this layer's texture is anchored, so trimming never shifts it
}

interface Piece extends Layer { vx: number; vy: number; rot: number; spin: number }

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; shape?: Shape; rot?: number }

interface Popup { x: number; y: number; text: string; life: number; max: number; color: string; size: number }

interface Order { recipe: Recipe; length: number; start: number; reward: number }

// Things the chef throws. Coordinates are world units.
interface Projectile { kind: 'knife' | 'patty'; x: number; y: number; vx: number; vy: number; rot: number; target: Layer | null; dodged: boolean }

interface Splat { x: number; y: number; r: number; life: number; seed: number } // screen units

const ATTACK_INFO: Record<Attack, { label: string; line: string; windup: number }> = {
  knife: { label: 'KNIFE THROW!', line: 'Catch this!', windup: 1.0 },
  slam: { label: 'TABLE SLAM!', line: 'Hmph!', windup: 0.9 },
  splat: { label: 'SOY SPLASH!', line: 'Oops, soy sauce!', windup: 0.7 },
};

const HELP_INFO: Record<Help, { label: string; line: string }> = {
  slow: { label: 'STEADY HANDS!', line: 'Take your time.' },
  patch: { label: 'PATCH UP!', line: 'Let me fix that!' },
  tip: { label: 'TIP!', line: 'For you!' },
};

type Mode = 'title' | 'playing' | 'dead' | 'shop';

interface Button { x: number; y: number; w: number; h: number; onTap: () => void }

interface Insets { top: number; right: number; bottom: number; left: number }

export class Game {
  private ctx: CanvasRenderingContext2D;
  private scale = 1; // CSS pixels per world unit
  private offX = 0; // world units of empty space left of the play area on wide screens
  private viewH = 700; // world units visible vertically
  private dpr = 1;
  private insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

  private mode: Mode = 'title';
  private paused = false;
  private time = 0;

  private stack: Layer[] = [];
  private moving: Layer | null = null;
  private moveDir = 1;
  private pieces: Piece[] = [];
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private flags: { x: number; y: number; hue: number }[] = []; // picks marking each served order
  private specks = makeSpecks(70);
  private themeOrder = THEMES.map((_, i) => i);
  private themeIdx = 0;
  private prevTheme: Theme | null = null; // fading out after a scene change
  private fade = 1;

  private order!: Order;
  private ordersServed = 0;
  private camY = 0;
  private shake = 0;
  private flash = 0;
  private combo = 0;
  private runCoins = 0;
  private best = save.best();
  private bank = save.coins();
  private muted = save.muted();
  private newBest = false;
  private deadAt = 0;

  // Shop and rewards.
  private boosters: Record<string, number> = save.boosters();
  private owned = Object.fromEntries((Object.keys(CATALOG) as Cosmetic[]).map((c) => [c, save.owned(c, CATALOG[c][0].id)])) as Record<Cosmetic, string[]>;
  private equip = Object.fromEntries((Object.keys(CATALOG) as Cosmetic[]).map((c) => [c, save.equipped(c, CATALOG[c][0].id)])) as Record<Cosmetic, string>;
  private baseW = BASE_W;
  // Boosters active this run.
  private doubleCoins = false;
  private slowStart = false;
  private magnet = false;
  private shield = false;
  private lucky = false;
  private shortOrders = false;
  private chanceUsed = false;
  private buttons: Button[] = [];
  private shopFrom: Mode = 'title';
  private shopTab: Cat = 'booster';
  private shopScroll = 0;
  private shopMaxScroll = 0;
  private drag: { x: number; y: number; startScroll: number; moved: boolean } | null = null;
  private shopSel: string | null = null; // cosmetic waiting for a confirming second tap
  private toast: { text: string; life: number } | null = null;

  // Boss chef for the current level. One level = one order.
  private chefX = 60;
  private chefSide = -1; // -1 = left edge, 1 = right edge; the chef walks across now and then
  private sinceSwitch = 0;
  private dish: { recipe: Recipe; t: number; from: { x: number; y: number }; side: number; look: number; ate: boolean } | null = null; // served-order animation
  private reaction: { mood: Mood; life: number } | null = null;
  private bubble: { text: string; life: number } | null = null;
  private introIn = 0; // seconds until the next chef is announced
  private event: { kind: Attack | Help; bad: boolean; t: number } | null = null; // chef winding up an attack or a favour
  private sinceEvent = 0; // drops since the chef last did something
  private steady = 0; // drops left at half speed (Steady Hands)
  private projectiles: Projectile[] = [];
  private splats: Splat[] = [];
  private banner: { title: string; sub: string; life: number } | null = null; // "LEVEL 3" when a new boss arrives

  constructor(private canvas: HTMLCanvasElement, private safeProbe: HTMLElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');
    this.ctx = ctx;
    setMuted(this.muted);
    this.resize();
    this.reset();
    new ResizeObserver(() => this.resize()).observe(canvas);
    // In the shop a tap fires on release, so the list can be dragged to scroll; everywhere else it fires on press.
    canvas.addEventListener('pointerdown', (e) => {
      if (this.mode === 'shop') this.drag = { x: e.clientX, y: e.clientY, startScroll: this.shopScroll, moved: false };
      else this.onTap(e.clientX, e.clientY);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const dy = (e.clientY - this.drag.y) / this.scale;
      if (Math.abs(dy) > 8) this.drag.moved = true;
      if (this.drag.moved) this.shopScroll = Math.max(0, Math.min(this.shopMaxScroll, this.drag.startScroll - dy));
    });
    canvas.addEventListener('pointerup', () => {
      if (this.drag && !this.drag.moved) this.onTap(this.drag.x, this.drag.y);
      this.drag = null;
    });
    canvas.addEventListener('wheel', (e) => {
      if (this.mode === 'shop') this.shopScroll = Math.max(0, Math.min(this.shopMaxScroll, this.shopScroll + e.deltaY / this.scale));
    }, { passive: true });
    // Space or Enter also drops, for keyboard players on desktop.
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat && this.mode !== 'shop') {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        this.onTap(rect.left + rect.width / 2, rect.top + rect.height * 0.75);
      }
    });
  }

  pause(): void {
    this.paused = this.mode === 'playing';
  }

  private resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    // Phones fill the width; wide screens (tablets in a window, desktops) keep at least 640 units of height visible.
    this.scale = Math.min(w / WORLD_W, h / 640);
    this.viewH = h / this.scale;
    this.offX = (w / this.scale - WORLD_W) / 2;
    const cs = getComputedStyle(this.safeProbe);
    this.insets = {
      top: parseFloat(cs.paddingTop) / this.scale,
      right: parseFloat(cs.paddingRight) / this.scale,
      bottom: parseFloat(cs.paddingBottom) / this.scale,
      left: parseFloat(cs.paddingLeft) / this.scale,
    };
  }

  // ------------------------------------------------------------------- state

  private get height(): number {
    return this.stack.length - 1; // layers placed by the player (the base rice doesn't count)
  }

  private get top(): Layer {
    return this.stack[this.stack.length - 1];
  }

  private get level(): number {
    return this.ordersServed + 1;
  }

  /** Bosses go in order; after the tenth they repeat, a little faster each lap. */
  private get chef(): Chef {
    return CHEFS[this.ordersServed % CHEFS.length];
  }

  private get lap(): number {
    return Math.floor(this.ordersServed / CHEFS.length);
  }

  private react(mood: Mood, life: number, line?: string): void {
    this.reaction = { mood, life };
    if (line) this.bubble = { text: line, life: 1.8 };
  }

  /** How worked up the chef is: rises as the order nears completion. */
  private chefMood(): Mood {
    if (this.mode === 'dead') return 'angry';
    if (this.event) return this.event.bad ? 'angry' : 'happy';
    if (this.reaction) return this.reaction.mood;
    const left = this.order.length - (this.height - this.order.start);
    const progress = 1 - left / this.order.length;
    if (left <= 1) return 'panic';
    if (progress >= 0.7) return 'intense';
    if (progress >= 0.4) return 'focused';
    return 'calm';
  }

  private announceChef(): void {
    const c = this.chef;
    this.banner = { title: `LEVEL ${this.level}`, sub: c.rule, life: 2.4 };
    this.bubble = { text: c.intro, life: 2.2 };
    this.reaction = null;
    this.sinceEvent = 0; // give the player a few drops before the new boss acts
    this.switchSides();
  }

  /** Ingredient colour, recoloured by the equipped sushi set. */
  private color(kind: Ingredient): string {
    return SETS.find((x) => x.id === this.equip.set)?.colors[kind] ?? COLORS[kind];
  }

  private get theme(): Theme {
    return THEMES[this.themeOrder[this.themeIdx]];
  }

  private reset(): void {
    const x = (WORLD_W - this.baseW) / 2;
    this.stack = [{ x, y: -LAYER_H, w: this.baseW, kind: 'rice', origin: x }];
    this.pieces = [];
    this.particles = [];
    this.popups = [];
    this.flags = [];
    this.combo = 0;
    this.runCoins = 0;
    this.ordersServed = 0;
    this.newBest = false;
    this.paused = false;
    this.moveDir = 1;
    this.reaction = null;
    this.bubble = null;
    this.introIn = 0;
    this.event = null;
    this.sinceEvent = 0;
    this.steady = 0;
    this.projectiles = [];
    this.splats = [];
    this.banner = null;
    this.dish = null;
    this.chefSide = -1;
    this.chefX = this.chefHome(-1);
    this.newOrder();
    this.spawnMoving();
    this.camY = this.targetCam();
  }

  private startRun(): void {
    // Boosters bought in the shop are used up here (Second Chance only when it saves you).
    const use = (id: BoosterId) => {
      if (!this.boosters[id]) return false;
      this.boosters[id]--;
      return true;
    };
    this.doubleCoins = use('double');
    this.slowStart = use('slow');
    this.baseW = use('wide') ? WIDE_W : BASE_W;
    this.magnet = use('magnet');
    this.shield = use('shield');
    this.lucky = use('lucky');
    this.shortOrders = use('short');
    const streak = use('streak');
    this.chanceUsed = false;
    save.setBoosters(this.boosters);

    // Each run tours the backgrounds in a fresh random order.
    const order = THEMES.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    this.changeTheme(() => { this.themeOrder = order; this.themeIdx = 0; });

    this.reset();
    this.mode = 'playing';
    if (streak) this.combo = 3;
    this.announceChef();

    const active = [this.doubleCoins && '2x coins', this.slowStart && 'slow start', this.baseW > BASE_W && 'wide base', this.boosters.chance && 'second chance',
      this.magnet && 'magnet', this.shield && 'shield', this.lucky && 'lucky', this.shortOrders && 'short orders', streak && 'hot streak'].filter(Boolean);
    if (active.length) this.popup(WORLD_W / 2, this.top.y - 76, `Boosters: ${active.join(' · ')}`, '#9fe3ff', 13, 2.2);
  }

  private changeTheme(apply: () => void): void {
    this.prevTheme = this.theme;
    apply();
    if (this.prevTheme === this.theme) this.prevTheme = null;
    this.fade = 0;
  }

  private addCoins(n: number, x: number, y: number, label: string): void {
    if (this.doubleCoins) n *= 2;
    this.runCoins += n;
    this.popup(x, y, `${label} +${n} coins`, '#ffd34d', 16);
  }

  private newOrder(): void {
    const n = this.ordersServed;
    // Early orders use the simple recipes; the full menu opens up as you serve more.
    const recipe = RECIPES[Math.floor(Math.random() * Math.min(RECIPES.length, 2 + n))];
    const length = Math.min(5 + n, 12) + this.chef.extra - (this.shortOrders ? 2 : 0);
    this.order = { recipe, length: Math.max(3, length), start: this.height, reward: 0 };
  }

  private nextIngredient(): Ingredient {
    const { pattern } = this.order.recipe;
    return pattern[(this.height - this.order.start) % pattern.length];
  }

  private speed(): number {
    const c = this.chef;
    let v = Math.min(130 + this.height * 5, 400) * c.speed * (1 + this.lap * 0.1);
    if (c.wobble) v *= 1 + 0.35 * Math.sin(this.time * 2.2);
    if (this.steady > 0) v *= 0.55;
    return this.slowStart && this.height < 15 ? v * 0.7 : v;
  }

  private spawnMoving(): void {
    const top = this.top;
    // Alternate the side each layer slides in from.
    const x = this.moveDir > 0 ? -top.w * 0.5 : WORLD_W - top.w * 0.5;
    this.moving = { x, y: top.y - LAYER_H, w: top.w, kind: this.nextIngredient(), origin: x };
  }

  private targetCam(): number {
    // Keep the top of the stack a little above the middle of the screen, but never lift the plate off the bottom too early.
    return Math.min(this.top.y - this.viewH * 0.48, -this.viewH * 0.78);
  }

  // ------------------------------------------------------------------- input

  private onTap(clientX: number, clientY: number): void {
    unlockAudio();
    const rect = this.canvas.getBoundingClientRect();
    const wx = (clientX - rect.left) / this.scale - this.offX;
    const wy = (clientY - rect.top) / this.scale;

    const mb = this.muteButton();
    if (Math.hypot(wx - mb.x, wy - mb.y) < mb.r + 10) {
      this.muted = !this.muted;
      setMuted(this.muted);
      save.setMuted(this.muted);
      return;
    }

    if (this.paused) {
      this.paused = false;
      return;
    }

    for (const b of this.buttons) {
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
        b.onTap();
        return;
      }
    }

    switch (this.mode) {
      case 'title':
        // The first tap only starts the game, so it can never drop a layer that's still sliding in.
        this.startRun();
        break;
      case 'playing':
        this.drop();
        break;
      case 'dead':
        if (this.time - this.deadAt > 0.7) this.startRun();
        break;
      case 'shop':
        this.shopSel = null;
        break;
    }
  }

  private drop(): void {
    const m = this.moving;
    if (!m) return;
    const top = this.top;
    const dx = m.x - top.x;

    if (Math.abs(dx) <= (this.chef.tight ? TIGHT_TOL : PERFECT_TOL) + (this.magnet ? 4 : 0)) {
      m.origin -= dx;
      m.x = top.x;
      this.combo++;
      if (this.combo >= 3 && m.w < this.baseW) {
        const grow = Math.min(REGROW, this.baseW - m.w);
        m.x -= grow / 2;
        m.w += grow;
      }
      this.place(m);
      const cx = m.x + m.w / 2;
      this.popup(cx, m.y - 18, this.combo > 1 ? `PERFECT x${this.combo}` : 'PERFECT', '#fff3b0', 18);
      if (this.combo % 5 === 0) this.addCoins(this.combo / 5 * 3, cx, m.y - 44, 'Streak bonus!');
      if (this.mode === 'playing' && !this.bubble) this.react('impressed', 0.7, this.combo >= 3 ? ['Sugoi!', 'Beautiful!', 'Perfect cut!'][this.combo % 3] : undefined);
      this.sparkle(m.x, m.y + LAYER_H / 2, m.w, 18 + this.combo * 2);
      sfx.perfect(this.combo);
      haptic.medium();
      this.flash = 0.25;
      this.shake = 3;
    } else {
      const overlap = top.w - Math.abs(dx);
      if (overlap <= 0) {
        this.fall(m, dx > 0 ? 1 : -1);
        if (this.boosters.chance && !this.chanceUsed) {
          // Second Chance: lose the layer, keep the roll.
          this.boosters.chance--;
          save.setBoosters(this.boosters);
          this.chanceUsed = true;
          this.combo = 0;
          this.popup(WORLD_W / 2, top.y - 60, 'SECOND CHANCE!', '#ff9eb0', 22);
          this.react('shock', 1, 'Lucky!');
          sfx.slice();
          haptic.medium();
          this.spawnMoving();
          return;
        }
        this.moving = null;
        this.die();
        return;
      }
      this.combo = 0;
      // Split the dropped layer into the part that lands and the overhang that falls.
      const keepX = Math.max(m.x, top.x);
      const cutX = dx > 0 ? keepX + overlap : m.x;
      this.fall({ ...m, x: cutX, w: m.w - overlap }, dx > 0 ? 1 : -1);
      m.x = keepX;
      m.w = overlap;
      this.place(m);
      if (this.mode === 'playing' && !this.reaction) this.react('wince', 0.5);
      sfx.slice();
      haptic.light();
    }
  }

  private place(layer: Layer): void {
    this.stack.push(layer);
    this.order.reward += layer.w / BASE_W;
    sfx.drop();
    if (this.height % 25 === 0) this.addCoins(10, WORLD_W / 2, layer.y - 80, `${this.height} layers!`);
    if (this.steady > 0) this.steady--;
    this.sinceEvent++;
    const served = this.height - this.order.start >= this.order.length;
    // The new boss switches sides on arrival, so only walk across mid-order.
    if (++this.sinceSwitch >= 5 && !this.event && !served) this.switchSides();
    if (served) this.serve();
    this.moveDir *= -1;
    this.spawnMoving();
    if (!served) this.maybeChefEvent();
  }

  // ------------------------------------------------------------ chef events

  /**
   * After each drop the chef may attack or help. Mean chefs attack more, kind ones help more,
   * and the player's own play tips the odds: perfect streaks earn help, sloppy drops invite attacks.
   */
  private maybeChefEvent(): void {
    if (this.mode !== 'playing' || this.event || this.introIn > 0 || this.height < 3 || this.sinceEvent < 3) return;
    const c = this.chef;
    const sloppy = this.combo === 0;
    const bad = this.shield ? 0 : c.mean + (sloppy ? 0.08 : 0);
    const good = c.kind * (this.combo >= 3 ? 0.35 : this.combo >= 1 ? 0.15 : 0.06) * (this.lucky ? 2 : 1);
    const r = Math.random();
    if (r < bad) {
      const kind = c.attacks[Math.floor(Math.random() * c.attacks.length)];
      this.startEvent(kind, true, ATTACK_INFO[kind].windup, ATTACK_INFO[kind].line);
    } else if (r < bad + good) {
      const helps: Help[] = ['slow', 'tip'];
      if (this.top.w < this.baseW * 0.8) helps.push('patch', 'patch');
      const kind = helps[Math.floor(Math.random() * helps.length)];
      this.startEvent(kind, false, 0.6, HELP_INFO[kind].line);
    }
  }

  private startEvent(kind: Attack | Help, bad: boolean, windup: number, line: string): void {
    this.event = { kind, bad, t: windup };
    this.sinceEvent = 0;
    this.reaction = null;
    this.bubble = { text: line, life: windup + 0.8 };
    if (bad) haptic.light();
  }

  // The chef fills the space between the top bar and the top of the stack, which the camera keeps
  // at 48% of the screen height, so they never sit over the blocks.
  private bossScale(): number {
    return Math.max(1.1, Math.min(1.9, (this.viewH * 0.48 - 110 - this.insets.top) / 136));
  }

  private bossY(): number {
    return this.viewH * 0.48 - 70 - 70 * this.bossScale();
  }

  private chefHome(side: number): number {
    const edge = 34 * this.bossScale();
    return side < 0 ? edge : WORLD_W - edge;
  }

  /** The order card sits on the side away from the chef and slides over as they cross. */
  private cardX(): number {
    const left = this.chefHome(-1);
    const right = this.chefHome(1);
    const t = Math.max(0, Math.min(1, (this.chefX - left) / (right - left)));
    const w = 236;
    return (WORLD_W - 12 - w) * (1 - t) + 12 * t;
  }

  private switchSides(): void {
    this.chefSide = -this.chefSide;
    this.sinceSwitch = 0;
  }

  private runEvent(kind: Attack | Help): void {
    const s = this.bossScale();
    const handY = this.bossY() - 20 * s + this.camY; // world units
    const top = this.top;
    switch (kind) {
      case 'knife': {
        const m = this.moving;
        if (!m) return;
        const side = m.x + m.w / 2 >= this.chefX ? 1 : -1;
        const x = this.chefX + side * 30 * s;
        const dx = m.x + m.w / 2 - x;
        const dy = m.y + LAYER_H / 2 - handY;
        const d = Math.hypot(dx, dy) || 1;
        this.projectiles.push({ kind: 'knife', x, y: handY, vx: (dx / d) * 460, vy: (dy / d) * 460, rot: 0, target: m, dodged: false });
        sfx.slice();
        break;
      }
      case 'slam': {
        this.shake = 16;
        sfx.die();
        haptic.medium();
        // The top layer slides sideways, but always keeps some footing on the layer below.
        const below = this.stack[this.stack.length - 2];
        if (below && this.stack.length > 1) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          let nx = top.x + dir * (10 + Math.random() * 10);
          nx = Math.max(below.x - top.w + 24, Math.min(below.x + below.w - 24, nx));
          top.origin += nx - top.x;
          top.x = nx;
        }
        this.popup(top.x + top.w / 2, top.y - 20, 'SLAM!', '#ff6b6b', 22);
        break;
      }
      case 'splat': {
        const cy = top.y - this.camY;
        for (let i = 0; i < 3; i++) {
          this.splats.push({ x: 70 + Math.random() * (WORLD_W - 140), y: cy - 120 + Math.random() * 200, r: 30 + Math.random() * 25, life: 3.5, seed: Math.random() * 100 });
        }
        sfx.drop();
        haptic.medium();
        break;
      }
      case 'slow':
        this.steady = 3;
        this.popup(WORLD_W / 2, top.y - 50, 'Next 3 layers slowed!', '#9fe3ff', 16, 1.6);
        sfx.serve();
        break;
      case 'patch': {
        const x = this.chefX;
        const dx = top.x + top.w / 2 - x;
        const dy = top.y - handY;
        const d = Math.hypot(dx, dy) || 1;
        this.projectiles.push({ kind: 'patty', x, y: handY, vx: (dx / d) * 380, vy: (dy / d) * 380, rot: 0, target: null, dodged: false });
        break;
      }
      case 'tip':
        this.addCoins(3 + this.level * 2, WORLD_W / 2, top.y - 50, 'Tip!');
        for (let i = 0; i < 16; i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
          const v = 150 + Math.random() * 150;
          this.particles.push({ x: this.chefX, y: handY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9, max: 0.9, color: '#ffd34d', size: 5 });
        }
        sfx.serve();
        haptic.success();
        break;
    }
  }

  private updateProjectiles(dt: number): void {
    for (const p of this.projectiles) {
      if (p.kind === 'knife') {
        p.rot += dt * 16;
        const m = this.moving;
        if (p.target && p.target === m) {
          // Home in on the sliding layer until the player drops it.
          const dx = m.x + m.w / 2 - p.x;
          const dy = m.y + LAYER_H / 2 - p.y;
          const d = Math.hypot(dx, dy) || 1;
          p.vx += ((dx / d) * 460 - p.vx) * Math.min(1, dt * 3);
          p.vy += ((dy / d) * 460 - p.vy) * Math.min(1, dt * 3);
          if (p.x > m.x - 6 && p.x < m.x + m.w + 6 && p.y > m.y - 6 && p.y < m.y + LAYER_H + 6) {
            this.fall(m, p.vx >= 0 ? 1 : -1);
            this.combo = 0;
            this.popup(m.x + m.w / 2, m.y - 16, 'KNOCKED OFF!', '#ff6b6b', 20);
            this.react('happy', 0.9, 'Ha! Too slow!');
            this.shake = 8;
            sfx.slice();
            haptic.error();
            this.spawnMoving();
            p.y = Infinity; // remove
            continue;
          }
        } else if (p.target && !p.dodged) {
          p.dodged = true;
          this.popup(WORLD_W / 2, this.top.y - 40, 'DODGED!', '#8fdc93', 20);
          this.react('shock', 0.8, 'What?!');
        }
        if (p.target !== m) p.vy += 900 * dt;
      } else {
        // Rice patty: lands on the top layer and widens it.
        const t = this.top;
        const dx = t.x + t.w / 2 - p.x;
        const dy = t.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 14) {
          const grow = Math.min(this.baseW - t.w, 50);
          t.x -= grow / 2;
          t.w += grow;
          if (this.moving) {
            const mc = this.moving.x + this.moving.w / 2;
            this.moving.w = t.w;
            this.moving.x = mc - t.w / 2;
          }
          this.sparkle(t.x, t.y + LAYER_H / 2, t.w, 24);
          this.popup(t.x + t.w / 2, t.y - 20, 'WIDER!', '#8fdc93', 20);
          sfx.perfect(4);
          haptic.success();
          p.y = Infinity;
          continue;
        }
        p.rot += dt * 6;
        p.vx += ((dx / (d || 1)) * 380 - p.vx) * Math.min(1, dt * 4);
        p.vy += ((dy / (d || 1)) * 380 - p.vy) * Math.min(1, dt * 4);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.projectiles = this.projectiles.filter((p) => p.y < this.camY + this.viewH + 60 && p.x > -60 && p.x < WORLD_W + 60);
  }

  private serve(): void {
    const top = this.top;
    const coins = Math.max(1, Math.round(this.order.reward * 2));
    this.ordersServed++;
    this.banner = null;
    // The finished roll pops up, then drops down to a customer at the bottom corner.
    this.dish = { recipe: this.order.recipe, t: 0, from: { x: top.x + top.w / 2, y: top.y - this.camY - 30 }, side: -this.chefSide, look: Math.random(), ate: false };
    this.flags.push({ x: top.x + top.w / 2, y: top.y, hue: (this.ordersServed * 47) % 360 });
    this.addCoins(coins + 5 * this.ordersServed, WORLD_W / 2, top.y - 34, `${CHEFS[(this.ordersServed - 1) % CHEFS.length].name} beaten!`);
    this.react('happy', 1.2, CHEFS[(this.ordersServed - 1) % CHEFS.length].beaten);
    // A new scene for every order served.
    this.changeTheme(() => { this.themeIdx = (this.themeIdx + 1) % this.themeOrder.length; });
    this.popup(WORLD_W / 2, this.camY + this.viewH * 0.3, this.theme.name, 'rgba(255,255,255,0.8)', 15);
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 120 + Math.random() * 200;
      this.particles.push({ x: top.x + top.w / 2, y: top.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, life: 0.9, max: 0.9, color: '#ffd34d', size: 4 });
    }
    sfx.serve();
    haptic.success();
    this.newOrder();
    // The next boss steps in after the beaten one has had a moment to react.
    this.introIn = 1.2;
  }

  private fall(layer: Layer, side: number): void {
    this.pieces.push({ ...layer, vx: side * (60 + Math.random() * 60), vy: -60, rot: 0, spin: side * (2 + Math.random() * 3) });
  }

  private die(): void {
    this.mode = 'dead';
    this.reaction = null;
    this.event = null;
    this.projectiles = [];
    this.bubble = { text: this.chef.gloat, life: 99 };
    this.popups = [];
    this.deadAt = this.time;
    this.shake = 10;
    sfx.die();
    haptic.error();
    this.bank += this.runCoins;
    save.setCoins(this.bank);
    if (this.height > this.best) {
      this.best = this.height;
      this.newBest = true;
      save.setBest(this.best);
    }
  }

  private sparkle(x: number, y: number, w: number, n: number): void {
    const fx = EFFECTS.find((e) => e.id === this.equip.fx) ?? EFFECTS[0];
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? x : x + w;
      this.particles.push({
        x: side, y: y + (Math.random() - 0.5) * LAYER_H,
        vx: (side === x ? -1 : 1) * (40 + Math.random() * 120), vy: -40 - Math.random() * 120,
        life: 0.5 + Math.random() * 0.3, max: 0.8, color: fx.colors[i % fx.colors.length], size: fx.shape === 'square' ? 2 + Math.random() * 2 : 4 + Math.random() * 3,
        shape: fx.shape, rot: Math.random() * 6,
      });
    }
  }

  private popup(x: number, y: number, text: string, color: string, size: number, life = 1.1): void {
    this.popups.push({ x, y, text, color, size, life, max: life });
  }

  // ------------------------------------------------------------------ update

  update(dt: number): void {
    dt = Math.min(dt, 1 / 20);
    if (this.paused) return;
    this.time += dt;

    const m = this.moving;
    this.fade = Math.min(1, this.fade + dt / 1.5);
    if (this.toast && (this.toast.life -= dt) <= 0) this.toast = null;

    if (m && this.mode !== 'dead') {
      const step = this.speed() * dt * this.moveDir;
      m.x += step;
      m.origin += step;
      // Bounce at the edges so a player who waits always gets another pass.
      const min = -m.w * 0.5;
      const max = WORLD_W - m.w * 0.5;
      if (m.x < min) { m.origin += min - m.x; m.x = min; this.moveDir = 1; }
      if (m.x > max) { m.origin += max - m.x; m.x = max; this.moveDir = -1; }
    }

    this.camY += (this.targetCam() - this.camY) * Math.min(1, dt * 4);

    for (const p of this.pieces) {
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    this.pieces = this.pieces.filter((p) => p.y < this.camY + this.viewH + 200);
    for (const pt of this.particles) {
      pt.vy += 500 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const pp of this.popups) { pp.y -= (30 * 1.1 / pp.max) * dt; pp.life -= dt; }
    if (this.reaction && (this.reaction.life -= dt) <= 0) this.reaction = null;
    if (this.bubble && (this.bubble.life -= dt) <= 0) this.bubble = null;
    if (this.introIn > 0 && (this.introIn -= dt) <= 0 && this.mode === 'playing') this.announceChef();
    if (this.event && this.mode === 'playing' && (this.event.t -= dt) <= 0) {
      const kind = this.event.kind;
      this.event = null;
      this.runEvent(kind);
    }
    this.updateProjectiles(dt);
    if (this.banner && (this.banner.life -= dt) <= 0) this.banner = null;
    for (const sp of this.splats) sp.life -= dt;
    this.splats = this.splats.filter((sp) => sp.life > 0);
    // The chef keeps to one side, walking across when they switch.
    this.chefX += (this.chefHome(this.chefSide) - this.chefX) * Math.min(1, dt * 3);
    if (this.dish) {
      this.dish.t += dt;
      if (!this.dish.ate && this.dish.t >= 1.65) {
        this.dish.ate = true;
        sfx.perfect(6);
        haptic.success();
      }
      if (this.dish.t > 3.2) this.dish = null;
    }
    this.popups = this.popups.filter((pp) => pp.life > 0);
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt);
  }

  // ------------------------------------------------------------------ render

  private muteButton() {
    return { x: this.insets.left + 26, y: this.insets.top + 30, r: 14 };
  }

  render(): void {
    const { ctx } = this;
    const s = this.scale * this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;
    ctx.setTransform(s, 0, 0, s, (sx + this.offX) * s, sy * s);

    // Crossfade from the previous scene to the current one.
    const bw = WORLD_W + this.offX * 2;
    if (this.prevTheme && this.fade < 1) drawBackdrop(ctx, this.prevTheme, this.specks, this.time, this.camY, -this.offX, bw, this.viewH);
    drawBackdrop(ctx, this.theme, this.specks, this.time, this.camY, -this.offX, bw, this.viewH, 1, this.prevTheme ? this.fade : 1);

    this.buttons = [];
    if (this.mode === 'shop') {
      this.drawShop();
      this.drawTopBar();
      this.drawToast();
      return;
    }

    // The boss looms behind the counter, so the stack is drawn over them.
    if (this.mode === 'playing') this.drawBossBody(this.chefX, this.bossY(), this.bossScale());

    ctx.save();
    ctx.translate(0, -this.camY);
    this.drawCounter();
    // Only draw the layers that are on screen; tall stacks can have hundreds.
    const minY = this.camY - LAYER_H;
    const maxY = this.camY + this.viewH;
    for (const l of this.stack) if (l.y > minY && l.y < maxY) this.drawLayer(l);
    for (const f of this.flags) if (f.y > minY - 40 && f.y < maxY + 40) drawFlag(ctx, this.equip.flag, f.x, f.y, f.hue);
    if (this.moving && this.mode !== 'dead') {
      this.drawLayer(this.moving);
      if (this.steady > 0) {
        ctx.strokeStyle = `rgba(159,227,255,${0.6 + 0.4 * Math.sin(this.time * 8)})`;
        ctx.lineWidth = 3;
        this.roundRect(this.moving.x - 2, this.moving.y - 2, this.moving.w + 4, LAYER_H + 4, 8);
        ctx.stroke();
      }
    }
    for (const p of this.projectiles) {
      if (p.kind === 'knife') {
        drawKnife(ctx, p.x, p.y, p.rot, 1.3);
      } else {
        ctx.fillStyle = '#f6f1e4';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#24321f';
        ctx.fillRect(p.x - 12, p.y + 2, 24, 7);
      }
    }
    for (const p of this.pieces) {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + LAYER_H / 2);
      ctx.rotate(p.rot);
      ctx.translate(-(p.x + p.w / 2), -(p.y + LAYER_H / 2));
      this.drawLayer(p);
      ctx.restore();
    }
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.life / pt.max;
      if (pt.shape && pt.shape !== 'square') {
        drawShape(ctx, pt.shape, pt.x, pt.y, pt.size, pt.color, (pt.rot ?? 0) + this.time * 4);
      } else {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
    }
    ctx.globalAlpha = 1;
    for (const pp of this.popups) {
      ctx.globalAlpha = Math.min(1, pp.life * 2);
      this.text(pp.text, pp.x, pp.y, pp.size, pp.color);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    for (const sp of this.splats) this.drawSplat(sp);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,243,176,${this.flash * 0.35})`;
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    }

    this.drawHud();
    this.drawToast();
  }

  private drawCounter(): void {
    const { ctx } = this;
    // Wooden counter from the plate down past the bottom of the screen.
    const counterY = 14;
    const t = this.theme;
    ctx.fillStyle = t.counter;
    ctx.fillRect(-this.offX - 20, counterY, WORLD_W + this.offX * 2 + 40, 2000);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(-this.offX, counterY + 18 + i * 26);
      ctx.bezierCurveTo(120, counterY + 10 + i * 26, 260, counterY + 30 + i * 26, WORLD_W + this.offX, counterY + 16 + i * 26);
      ctx.stroke();
    }
    ctx.fillStyle = t.counterEdge;
    ctx.fillRect(-this.offX - 20, counterY, WORLD_W + this.offX * 2 + 40, 6);
    drawPlate(ctx, this.equip.plate, WORLD_W / 2, 0);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const { ctx } = this;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private drawLayer(l: Layer): void {
    const { ctx } = this;
    const { x, y, w } = l;
    const h = LAYER_H;
    ctx.save();
    this.roundRect(x, y, w, h, 6);
    ctx.fillStyle = this.color(l.kind);
    ctx.fill();
    ctx.clip();

    // Texture is drawn at fixed positions relative to `origin`, so it doesn't jump when a layer is trimmed.
    const start = Math.floor((x - l.origin) / 12) - 1;
    const end = Math.ceil((x + w - l.origin) / 12) + 1;
    switch (l.kind) {
      case 'rice':
        ctx.fillStyle = '#ffffff';
        for (let i = start; i < end; i++) {
          for (let row = 0; row < 3; row++) {
            const gx = l.origin + i * 12 + ((i * 7 + row * 5) % 9);
            ctx.beginPath();
            ctx.ellipse(gx, y + 5 + row * 7, 3.2, 2, ((i + row) % 3) * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(x, y + h - 4, w, 4);
        break;
      case 'salmon':
      case 'tuna':
        ctx.strokeStyle = l.kind === 'salmon' ? 'rgba(255,230,215,0.85)' : 'rgba(255,170,180,0.45)';
        ctx.lineWidth = l.kind === 'salmon' ? 3 : 2;
        for (let i = start; i < end; i++) {
          const gx = l.origin + i * 12;
          ctx.beginPath();
          ctx.moveTo(gx, y + h);
          ctx.quadraticCurveTo(gx + 6, y + h / 2, gx + 14, y);
          ctx.stroke();
        }
        break;
      case 'nori':
        ctx.fillStyle = 'rgba(120,160,110,0.18)';
        for (let i = start; i < end; i++) ctx.fillRect(l.origin + i * 12 + ((i * 5) % 7), y + 3 + ((i * 3) % 14), 5, 2);
        break;
      case 'avocado':
        ctx.fillStyle = '#d9ed92';
        ctx.fillRect(x, y, w, 7);
        break;
      case 'cucumber':
        ctx.fillStyle = '#cfe9b8';
        ctx.fillRect(x, y + 5, w, h - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = start; i < end; i++) ctx.fillRect(l.origin + i * 12 + 4, y + h / 2 - 1, 3, 3);
        break;
      case 'egg':
        ctx.fillStyle = 'rgba(200,120,0,0.25)';
        ctx.fillRect(x, y + 7, w, 2);
        ctx.fillRect(x, y + 15, w, 2);
        ctx.fillStyle = 'rgba(150,80,0,0.35)';
        ctx.fillRect(x, y, w, 3);
        break;
    }
    // Soft highlight on the top edge.
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, w, 3);
    ctx.restore();
  }



  private text(str: string, x: number, y: number, size: number, color = '#fff', weight = 800, align: CanvasTextAlign = 'center'): void {
    const { ctx } = this;
    ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  private holding(): Holding {
    const e = this.event;
    if (!e) return null;
    return e.kind === 'knife' ? 'knife' : e.kind === 'slam' ? 'fist' : e.kind === 'patch' ? 'patty' : null;
  }

  private drawBossBody(x: number, y: number, s: number): void {
    // Watch and point at the sliding layer; on the results screen, at the player.
    const m = this.moving;
    const lookX = m && this.mode === 'playing' ? m.x + m.w / 2 : x;
    const lookY = m && this.mode === 'playing' ? m.y + LAYER_H / 2 - this.camY : y + 300;
    drawChef(this.ctx, this.chef, x, y, s, this.chefMood(), lookX, lookY, this.time, this.mode === 'playing' ? this.holding() : null);
  }

  private drawBossLabels(x: number, y: number, s: number): void {
    const { ctx } = this;
    const c = this.chef;
    const e = this.event;
    const chestY = y + 42 * s;
    if (this.banner && this.mode === 'playing') {
      // New boss: level banner under the order card, on the side away from the chef.
      const bx = this.cardX() + 118;
      const byc = this.insets.top + 182;
      ctx.globalAlpha = Math.min(1, this.banner.life * 3);
      ctx.fillStyle = 'rgba(20,10,25,0.85)';
      this.roundRect(bx - 105, byc - 26, 210, 52, 14);
      ctx.fill();
      this.text(this.banner.title, bx, byc - 9, 22, '#ffffff', 900);
      this.text(this.banner.sub, bx, byc + 13, 12, '#ffd34d', 700);
      ctx.globalAlpha = 1;
    }
    if (!e || this.mode !== 'playing') {
      // Name badge pinned on the uniform.
      const tag = c.name.toUpperCase();
      ctx.font = '800 11px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      const tw = ctx.measureText(tag).width + 16;
      const tx = Math.max(tw / 2 + 4, Math.min(WORLD_W - tw / 2 - 4, x));
      ctx.fillStyle = c.accent;
      this.roundRect(tx - tw / 2, chestY - 9, tw, 18, 9);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      this.text(tag, tx, chestY + 1, 11, '#ffffff', 800);
    }

    // Warning (attack) or good-news (help) label while the chef winds up.
    if (e && this.mode === 'playing') {
      const label = e.bad ? ATTACK_INFO[e.kind as Attack].label : HELP_INFO[e.kind as Help].label;
      const ly = chestY;
      const pulse = 1 + 0.08 * Math.sin(this.time * 20);
      ctx.font = '900 16px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      const lw = ctx.measureText(label).width + 26;
      ctx.save();
      ctx.translate(Math.max(lw / 2 + 8, Math.min(WORLD_W - lw / 2 - 8, x)), ly);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = e.bad ? '#e63946' : '#2a9d5c';
      this.roundRect(-lw / 2, -15, lw, 30, 15);
      ctx.fill();
      this.text(label, 0, 1, 16, '#ffffff', 900);
      ctx.restore();
    }

    if (!this.bubble) return;
    // Speech bubble beside the chef's mouth, toward the middle of the screen; it stays above the stack.
    ctx.font = '800 13px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const bw = ctx.measureText(this.bubble.text).width + 20;
    const right = x < WORLD_W / 2;
    const bx = Math.max(6, Math.min(WORLD_W - 6 - bw, right ? x + 28 * s : x - 28 * s - bw));
    const by = this.mode === 'playing' ? y + 8 * s : y - 34 * s;
    ctx.globalAlpha = Math.min(1, this.bubble.life * 4);
    ctx.fillStyle = '#ffffff';
    this.roundRect(bx, by, bw, 26, 13);
    ctx.fill();
    ctx.beginPath();
    const tx = right ? bx + 12 : bx + bw - 12;
    ctx.moveTo(tx - 6, by + 24);
    ctx.lineTo(right ? x + 16 * s : x - 16 * s, y + 10 * s);
    ctx.lineTo(tx + 6, by + 24);
    ctx.fill();
    this.text(this.bubble.text, bx + bw / 2, by + 13.5, 13, '#3a1d12', 800);
    ctx.globalAlpha = 1;
  }

  /** Three maki pieces of the order's recipe on a little wooden board, centred on (x, y). */
  private drawDish(x: number, y: number, s: number, rot: number, recipe: Recipe): void {
    const { ctx } = this;
    const fill = [...new Set(recipe.pattern.filter((k) => k !== 'rice' && k !== 'nori'))];
    if (!fill.length) fill.push('egg');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.roundRect(-50, 14, 100, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#a0683a';
    this.roundRect(-52, 10, 104, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#7a4e2a';
    ctx.fillRect(-40, 20, 12, 5);
    ctx.fillRect(28, 20, 12, 5);
    for (const px of [-31, 0, 31]) {
      ctx.fillStyle = '#24321f';
      ctx.beginPath();
      ctx.arc(px, -4, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6f1e4';
      ctx.beginPath();
      ctx.arc(px, -4, 12.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 8; i++) {
        const a = i * 0.8 + px;
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(a) * 9.5, -4 + Math.sin(a) * 9.5, 2, 1.2, a, 0, Math.PI * 2);
        ctx.fill();
      }
      // Filling: one wedge per ingredient.
      fill.forEach((k, i) => {
        ctx.fillStyle = this.color(k);
        ctx.beginPath();
        ctx.moveTo(px, -4);
        ctx.arc(px, -4, 6.5, (i / fill.length) * Math.PI * 2, ((i + 1) / fill.length) * Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(px - 5, -11, 4, 2, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawCustomer(x: number, y: number, look: number, ate: boolean, lookX: number, lookY: number): void {
    const { ctx } = this;
    const shirts = ['#4aa3df', '#e76f51', '#6cc070', '#9b5de5', '#f2b705', '#ef476f'];
    const hairs = ['#1d1a1a', '#3a2418', '#6b3e26', '#2b1b17', '#111'];
    const skins = ['#f1c9a5', '#e8b98f', '#c98e64', '#f5d0b0', '#a8714a', '#efc29a'];
    const pick = <T,>(a: T[], k: number) => a[Math.floor(((look * 97 + k * 13.7) % 1) * a.length)];
    const skin = pick(skins, 1);
    const hair = pick(hairs, 2);
    const longHair = look > 0.5;
    if (longHair) {
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 28, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = pick(shirts, 0);
    this.roundRect(x - 36, y + 20, 72, 70, 20);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, y - 2, 24.5, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(x, y - 12, x - 23, y - 6);
    ctx.fill();
    // Eyes: watching the dish arrive, then blissful once it's eaten.
    for (const ex of [-8, 8]) {
      if (ate) {
        ctx.strokeStyle = '#2a1a1a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(x + ex, y + 1, 4, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        const d = Math.hypot(lookX - x, lookY - y) || 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + ex, y - 1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1a1a';
        ctx.beginPath();
        ctx.arc(x + ex + ((lookX - x) / d) * 2.2, y - 1 + ((lookY - y) / d) * 2.2, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,120,130,0.4)';
    ctx.beginPath();
    ctx.ellipse(x - 15, y + 8, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 15, y + 8, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a2a2a';
    ctx.beginPath();
    if (ate) {
      ctx.moveTo(x - 8, y + 9);
      ctx.quadraticCurveTo(x, y + 20, x + 8, y + 9);
      ctx.closePath();
    } else {
      ctx.ellipse(x, y + 12, 3.5, 4.5, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  /** Served-order celebration: the roll pops up, then arcs down to a customer who eats it. */
  private drawServe(): void {
    const d = this.dish;
    if (!d) return;
    const { ctx } = this;
    const t = d.t;
    const bottom = this.viewH - this.insets.bottom;
    const cx = d.side < 0 ? 62 : WORLD_W - 62;
    // Customer slides up from the bottom edge, then back down.
    const rise = t < 0.4 ? 1 - Math.pow(1 - t / 0.4, 3) : t > 2.8 ? 1 - (t - 2.8) / 0.4 : 1;
    const cy = bottom + 40 - 110 * rise;
    const plateY = cy + 30;
    const peak = { x: WORLD_W / 2, y: Math.max(this.insets.top + 230, d.from.y - 80) };

    let x = peak.x;
    let y = peak.y;
    let sc = 1.25;
    let rot = 0;
    if (t < 0.45) {
      const k = t / 0.45;
      const e = 1 - Math.pow(1 - k, 3);
      x = d.from.x + (peak.x - d.from.x) * e;
      y = d.from.y + (peak.y - d.from.y) * e;
      sc = 1.25 * (1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2));
    } else if (t < 0.95) {
      y += Math.sin(t * 10) * 3;
      rot = Math.sin(t * 12) * 0.08;
    } else if (t < 1.65) {
      const k = (t - 0.95) / 0.7;
      const ctrl = { x: (peak.x + cx) / 2, y: peak.y - 70 };
      x = (1 - k) * (1 - k) * peak.x + 2 * (1 - k) * k * ctrl.x + k * k * cx;
      y = (1 - k) * (1 - k) * peak.y + 2 * (1 - k) * k * ctrl.y + k * k * plateY;
      sc = 1.25 - 0.55 * k;
      rot = k * Math.PI * 2 * (d.side < 0 ? -1 : 1);
    } else {
      x = cx;
      y = plateY;
      sc = 0.7 * Math.max(0, 1 - (t - 1.9) / 0.6); // eaten
    }

    this.drawCustomer(cx, cy, d.look, d.ate, x, y);
    if (sc > 0.02) this.drawDish(x, y, sc, rot, d.recipe);

    if (t > 0.15 && t < 1.3) {
      ctx.globalAlpha = Math.min(1, (t - 0.15) * 5, (1.3 - t) * 5);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(40,15,20,0.8)';
      ctx.font = '900 26px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText('ORDER UP!', peak.x, peak.y - 50);
      this.text('ORDER UP!', peak.x, peak.y - 50, 26, '#ffd34d', 900);
      ctx.globalAlpha = 1;
    }
    if (d.ate) {
      // Hearts float up and a "Yum!" bubble from the happy customer.
      const k = t - 1.65;
      ctx.globalAlpha = Math.max(0, 1 - k / 1.4);
      for (let i = 0; i < 3; i++) {
        const hx = cx + (i - 1) * 22 + Math.sin(k * 4 + i) * 4;
        const hy = cy - 40 - k * 50 - i * 8;
        this.text('♥', hx, hy, 18 + i * 3, '#ff5d8f', 900);
      }
      const bx = d.side < 0 ? cx + 30 : cx - 30 - 66;
      ctx.fillStyle = '#ffffff';
      this.roundRect(bx, cy - 40, 66, 26, 13);
      ctx.fill();
      this.text('Yum!', bx + 33, cy - 26.5, 14, '#3a1d12', 900);
      ctx.globalAlpha = 1;
    }
  }

  private drawSplat(sp: Splat): void {
    const { ctx } = this;
    ctx.globalAlpha = Math.min(0.92, sp.life);
    ctx.fillStyle = '#2b1608';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      const a = sp.seed + i * 0.9;
      const d = sp.r * (0.9 + ((i * 37) % 10) / 12);
      ctx.beginPath();
      ctx.arc(sp.x + Math.cos(a) * d, sp.y + Math.sin(a) * d, sp.r * (0.18 + (i % 3) * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(sp.x - sp.r * 0.35, sp.y - sp.r * 0.35, sp.r * 0.25, sp.r * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawOrderCard(y: number): void {
    const { ctx } = this;
    const o = this.order;
    const done = this.height - o.start;
    const w = 236;
    const x = this.cardX();
    ctx.fillStyle = 'rgba(255,248,235,0.94)';
    this.roundRect(x, y, w, 52, 12);
    ctx.fill();
    this.text(`LV ${this.level} · ${o.recipe.name}`, x + 12, y + 15, 13, '#5a2e1f', 800, 'left');
    this.text(`${done}/${o.length}`, x + w - 12, y + 15, 13, '#b5442a', 800, 'right');
    // Progress bar.
    ctx.fillStyle = 'rgba(90,46,31,0.15)';
    this.roundRect(x + 12, y + 26, w - 24, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = '#e76f51';
    this.roundRect(x + 12, y + 26, (w - 24) * (done / o.length), 5, 2.5);
    ctx.fill();
    // Upcoming ingredients, so players can see the roll come together.
    const { pattern } = o.recipe;
    for (let i = 0; i < 6; i++) {
      const kind = pattern[(done + i) % pattern.length];
      ctx.fillStyle = this.color(kind);
      this.roundRect(x + 12 + i * 22, y + 37, 18, 9, 3);
      ctx.fill();
      ctx.strokeStyle = i === 0 ? '#5a2e1f' : 'rgba(90,46,31,0.3)';
      ctx.lineWidth = i === 0 ? 1.5 : 1;
      ctx.stroke();
    }
    this.text('next', x + 12 + 6 * 22 + 4, y + 42, 10, 'rgba(90,46,31,0.6)', 700, 'left');
  }

  private drawTopBar(): void {
    const { ctx } = this;
    const top = this.insets.top;
    const mb = this.muteButton();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mb.x, mb.y, mb.r, 0, Math.PI * 2);
    ctx.stroke();
    this.text(this.muted ? '×' : '♪', mb.x, mb.y + 1, 16, 'rgba(255,255,255,0.8)');

    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(WORLD_W - this.insets.right - 24, top + 30, 8, 0, Math.PI * 2);
    ctx.fill();
    const coins = this.bank + (this.mode === 'playing' ? this.runCoins : 0);
    this.text(String(coins), WORLD_W - this.insets.right - 38, top + 31, 16, '#ffd34d', 700, 'right');
  }

  /** Draws a tappable button and registers its hit area for this frame. */
  private button(x: number, y: number, w: number, h: number, label: string, onTap: () => void, style: 'primary' | 'gold' | 'quiet' = 'primary'): void {
    const { ctx } = this;
    ctx.fillStyle = style === 'gold' ? '#ffd34d' : style === 'quiet' ? 'rgba(255,255,255,0.15)' : '#ff8a5b';
    this.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    this.text(label, x + w / 2, y + h / 2 + 1, 15, style === 'gold' ? '#4a2a00' : '#ffffff', 800);
    this.buttons.push({ x, y, w, h, onTap });
  }

  private openShop(): void {
    this.shopFrom = this.mode;
    this.shopSel = null;
    this.mode = 'shop';
    sfx.drop();
  }

  private showToast(text: string): void {
    this.toast = { text, life: 1.8 };
  }

  private drawToast(): void {
    if (!this.toast) return;
    const { ctx } = this;
    const y = this.viewH - this.insets.bottom - 110;
    ctx.globalAlpha = Math.min(1, this.toast.life * 3);
    ctx.fillStyle = 'rgba(20,10,20,0.88)';
    this.roundRect(40, y, WORLD_W - 80, 40, 20);
    ctx.fill();
    this.text(this.toast.text, WORLD_W / 2, y + 21, 14, '#fff', 700);
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ daily gift

  private static day(offset = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  private giftReady(): boolean {
    return save.giftDay() !== Game.day();
  }

  private claimGift(): void {
    if (!this.giftReady()) {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const hours = Math.ceil((midnight.getTime() - now.getTime()) / 3_600_000);
      this.showToast(`Next gift in ${hours} hour${hours === 1 ? '' : 's'}`);
      return;
    }
    // Coming back on consecutive days grows the gift, up to day 7.
    const streak = save.giftDay() === Game.day(-1) ? save.giftStreak() + 1 : 1;
    const reward = 20 + 10 * (Math.min(streak, 7) - 1);
    save.setGift(Game.day(), streak);
    this.bank += reward;
    save.setCoins(this.bank);
    this.showToast(`+${reward} coins · Day ${streak} streak`);
    sfx.serve();
    haptic.success();
  }

  /** The cheapest cosmetic the player doesn't own yet: shown after each run as something to save toward. */
  private nextGoal() {
    const all = (Object.keys(CATALOG) as Cosmetic[]).flatMap((c) => CATALOG[c].filter((i) => !this.owned[c].includes(i.id)));
    return all.sort((a, b) => a.price - b.price)[0];
  }

  // ------------------------------------------------------------------ screens

  private drawHud(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const top = this.insets.top;
    const midY = this.viewH / 2;

    this.drawTopBar();

    if (this.mode === 'title') {
      const pulse = 0.6 + 0.4 * Math.sin(this.time * 4);
      this.text('SUSHI', cx, top + 120, 60, '#ffffff', 900);
      this.text('STACK', cx, top + 176, 60, '#ff8a5b', 900);
      if (this.best > 0) this.text(`BEST ${this.best}`, cx, top + 30, 16, 'rgba(255,255,255,0.75)', 700);
      ctx.globalAlpha = pulse;
      this.text('TAP TO PLAY', cx, top + 236, 20);
      ctx.globalAlpha = 1;
      this.text('Then tap to drop each layer on the stack.', cx, top + 264, 14, 'rgba(255,255,255,0.65)', 500);
      const ready = this.giftReady();
      this.button(40, top + 296, 152, 44, ready ? 'DAILY GIFT' : 'GIFT TOMORROW', () => this.claimGift(), ready ? 'gold' : 'quiet');
      this.button(208, top + 296, 152, 44, 'SHOP', () => this.openShop());
      const stocked = BOOSTERS.reduce((n, b) => n + (this.boosters[b.id] ?? 0), 0);
      if (stocked) this.text(`${stocked} booster${stocked === 1 ? '' : 's'} ready for your next run`, cx, top + 360, 12, 'rgba(255,255,255,0.75)', 600);
      return;
    }

    this.text(String(this.height), cx, top + 64, 50, '#fff', 900);
    if (this.mode === 'playing') {
      this.drawOrderCard(top + 100);
      this.drawBossLabels(this.chefX, this.bossY(), this.bossScale());
      this.drawServe();
    }

    if (this.paused) {
      this.panel(midY, 'PAUSED', 'Tap to resume');
    } else if (this.mode === 'dead') {
      const t = Math.min(1, (this.time - this.deadAt) / 0.35);
      ctx.globalAlpha = t;
      ctx.fillStyle = 'rgba(30,15,30,0.5)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      // The boss gloats over the result.
      const ds = 1.5;
      const dy = Math.max(top + 120, midY - 100 - 72 * ds);
      this.drawBossBody(WORLD_W / 2, dy, ds);
      this.drawBossLabels(WORLD_W / 2, dy, ds);
      ctx.fillStyle = 'rgba(42,26,51,0.94)';
      this.roundRect(30, midY - 100, WORLD_W - 60, 270, 18);
      ctx.fill();
      this.panel(midY - 25, this.newBest ? 'NEW BEST!' : 'DROPPED IT!', `${this.height} layers   ·   Best ${this.best}`);
      this.text(`${this.ordersServed} order${this.ordersServed === 1 ? '' : 's'} served   ·   +${this.runCoins} coins`, cx, midY + 15, 15, '#ffd34d', 700);
      // Near-miss nudge: the most effective "one more try" prompt.
      const gap = this.best - this.height;
      if (!this.newBest && gap > 0 && gap <= 3) this.text(`So close! Only ${gap} more for a new best`, cx, midY + 40, 14, '#ffb4a2', 700);

      // Progress toward the next plate keeps coins meaningful between runs.
      const goal = this.nextGoal();
      if (goal) {
        const have = Math.min(this.bank, goal.price);
        const can = this.bank >= goal.price;
        this.text(can ? `You can buy the ${goal.name}!` : `Next: ${goal.name}  ${have}/${goal.price}`, cx, midY + 68, 14, can ? '#ffd34d' : 'rgba(255,255,255,0.85)', 700);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        this.roundRect(70, midY + 82, WORLD_W - 140, 7, 3.5);
        ctx.fill();
        ctx.fillStyle = '#ffd34d';
        this.roundRect(70, midY + 82, (WORLD_W - 140) * (have / goal.price), 7, 3.5);
        ctx.fill();
      }
      if (this.time - this.deadAt > 0.7) {
        this.button(50, midY + 108, 140, 44, 'SHOP', () => this.openShop(), goal && this.bank >= goal.price ? 'gold' : 'quiet');
        this.button(210, midY + 108, 140, 44, 'RETRY', () => this.startRun());
      }
      ctx.globalAlpha = 1;
    }
  }

  private openTab(cat: Cat): void {
    this.shopTab = cat;
    this.shopScroll = 0;
    this.shopSel = null;
  }

  private drawShop(): void {
    const { ctx } = this;
    const top = this.insets.top;
    const cx = WORLD_W / 2;
    ctx.fillStyle = 'rgba(20,10,25,0.6)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.text('SHOP', cx, top + 31, 24, '#fff', 900);

    // Category tabs.
    const tabW = (WORLD_W - 32 - 4 * 6) / 5;
    TABS.forEach((t, i) => {
      const x = 16 + i * (tabW + 6);
      const on = t.cat === this.shopTab;
      ctx.fillStyle = on ? '#ff8a5b' : 'rgba(255,255,255,0.12)';
      this.roundRect(x, top + 56, tabW, 30, 15);
      ctx.fill();
      this.text(t.label, x + tabW / 2, top + 72, 12, on ? '#fff' : 'rgba(255,255,255,0.8)', 800);
      this.buttons.push({ x, y: top + 56, w: tabW, h: 30, onTap: () => this.openTab(t.cat) });
    });
    const tab = TABS.find((t) => t.cat === this.shopTab)!;
    this.text(tab.hint, 16, top + 102, 12, 'rgba(255,255,255,0.7)', 700, 'left');

    // Scrollable grid of cards.
    const backY = this.viewH - this.insets.bottom - 60;
    const areaTop = top + 114;
    const areaH = backY - 10 - areaTop;
    const gap = 10;
    const cw = (WORLD_W - 32 - gap) / 2;
    const ch = 96;
    const items: Item[] = this.shopTab === 'booster' ? BOOSTERS : CATALOG[this.shopTab as Cosmetic];
    const rows = Math.ceil(items.length / 2);
    this.shopMaxScroll = Math.max(0, rows * (ch + gap) - gap - areaH);
    this.shopScroll = Math.min(this.shopScroll, this.shopMaxScroll);

    ctx.save();
    ctx.beginPath();
    ctx.rect(-this.offX, areaTop, WORLD_W + this.offX * 2, areaH);
    ctx.clip();
    items.forEach((item, i) => {
      const x = 16 + (i % 2) * (cw + gap);
      const y = areaTop + Math.floor(i / 2) * (ch + gap) - this.shopScroll;
      if (y + ch < areaTop || y > areaTop + areaH) return;
      if (this.shopTab === 'booster') this.drawBoosterCard(item as (typeof BOOSTERS)[number], x, y, cw, ch);
      else this.drawCosmeticCard(this.shopTab as Cosmetic, item, x, y, cw, ch);
      // Only the visible part of a card is tappable.
      const hy = Math.max(y, areaTop);
      const hh = Math.min(y + ch, areaTop + areaH) - hy;
      const onTap = this.shopTab === 'booster' ? () => this.buyBooster(item.id as BoosterId) : () => this.tapCosmetic(this.shopTab as Cosmetic, item);
      this.buttons.push({ x, y: hy, w: cw, h: hh, onTap });
    });
    ctx.restore();

    // Scroll hint: fade at the bottom edge when more cards are below.
    if (this.shopScroll < this.shopMaxScroll - 2) {
      const g = ctx.createLinearGradient(0, areaTop + areaH - 30, 0, areaTop + areaH);
      g.addColorStop(0, 'rgba(20,10,25,0)');
      g.addColorStop(1, 'rgba(20,10,25,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(-this.offX, areaTop + areaH - 30, WORLD_W + this.offX * 2, 30);
      this.text('▾ more', cx, areaTop + areaH - 8, 11, 'rgba(255,255,255,0.8)', 800);
    }

    this.button(16, backY, WORLD_W - 32, 46, 'BACK', () => { this.mode = this.shopFrom; this.shopSel = null; }, 'quiet');
  }

  private drawBoosterCard(b: (typeof BOOSTERS)[number], x: number, y: number, w: number, h: number): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(255,248,235,0.95)';
    this.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(x + 28, y + 30, 19, 0, Math.PI * 2);
    ctx.fill();
    this.text(b.glyph, x + 28, y + 31, b.glyph.length > 1 ? 15 : 19, '#fff', 900);
    ctx.fillStyle = '#e0a800';
    ctx.beginPath();
    ctx.arc(x + 60, y + 30, 6, 0, Math.PI * 2);
    ctx.fill();
    this.text(String(b.price), x + 70, y + 31, 15, this.bank >= b.price ? '#4a2618' : '#b5442a', 900, 'left');
    const n = this.boosters[b.id] ?? 0;
    if (n) {
      ctx.fillStyle = '#4a2618';
      this.roundRect(x + w - 36, y + 8, 28, 18, 9);
      ctx.fill();
      this.text(`x${n}`, x + w - 22, y + 18, 11, '#fff', 800);
    }
    this.text(b.name, x + 12, y + 64, 13, '#4a2618', 800, 'left');
    this.text(b.desc, x + 12, y + 82, 11, 'rgba(74,38,24,0.75)', 600, 'left');
  }

  private drawCosmeticCard(cat: Cosmetic, item: Item, x: number, y: number, w: number, h: number): void {
    const { ctx } = this;
    const owned = this.owned[cat].includes(item.id);
    const equipped = this.equip[cat] === item.id;
    const selected = this.shopSel === `${cat}:${item.id}`;
    ctx.fillStyle = 'rgba(48,30,52,0.94)';
    this.roundRect(x, y, w, h, 12);
    ctx.fill();
    if (equipped || selected) {
      ctx.strokeStyle = selected ? '#ffd34d' : '#6cc070';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Preview of the item itself.
    const px = x + w / 2;
    const py = y + 30;
    switch (cat) {
      case 'plate':
        drawPlate(ctx, item.id, px, py - 6, 0.55);
        break;
      case 'flag':
        ctx.save();
        ctx.translate(px - 6, py + 16);
        ctx.scale(1.3, 1.3);
        drawFlag(ctx, item.id, 0, 0, 30);
        ctx.restore();
        break;
      case 'set': {
        const set = SETS.find((s2) => s2.id === item.id)!;
        const kinds: Ingredient[] = ['egg', 'salmon', 'nori', 'avocado', 'rice'];
        kinds.forEach((k, i) => {
          ctx.fillStyle = set.colors[k] ?? COLORS[k];
          this.roundRect(px - 40, py - 22 + i * 9, 80, 8, 2.5);
          ctx.fill();
        });
        break;
      }
      case 'fx': {
        const fx = EFFECTS.find((e) => e.id === item.id)!;
        for (let i = 0; i < 6; i++) {
          const a = this.time * 1.5 + (i / 6) * Math.PI * 2;
          drawShape(ctx, fx.shape, px + Math.cos(a) * 26, py + Math.sin(a) * 13, fx.shape === 'square' ? 5 : 6.5, fx.colors[i % fx.colors.length], a);
        }
        break;
      }
    }

    this.text(item.name, x + 12, y + 64, 13, '#fff', 800, 'left');
    if (selected) {
      this.text(`Tap again to buy for ${item.price}`, x + 12, y + 82, 11, '#ffd34d', 700, 'left');
    } else if (equipped) {
      this.text('✓ IN USE', x + 12, y + 82, 11, '#8fdc93', 800, 'left');
    } else if (owned) {
      this.text('Tap to use', x + 12, y + 82, 11, 'rgba(255,255,255,0.7)', 700, 'left');
    } else {
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(x + 17, y + 82, 5, 0, Math.PI * 2);
      ctx.fill();
      this.text(String(item.price), x + 26, y + 83, 13, this.bank >= item.price ? '#ffd34d' : '#ff9a8a', 800, 'left');
    }
  }

  private spend(price: number): boolean {
    if (this.bank < price) {
      this.showToast(`You need ${price - this.bank} more coins`);
      haptic.error();
      return false;
    }
    this.bank -= price;
    save.setCoins(this.bank);
    return true;
  }

  private buyBooster(id: BoosterId): void {
    this.shopSel = null;
    const b = BOOSTERS.find((x) => x.id === id)!;
    if (!this.spend(b.price)) return;
    this.boosters[id] = (this.boosters[id] ?? 0) + 1;
    save.setBoosters(this.boosters);
    this.showToast(`${b.name} ready for your next run`);
    sfx.serve();
    haptic.success();
  }

  /** Owned: put it on. Not owned: the first tap selects it, the second buys it. */
  private tapCosmetic(cat: Cosmetic, item: Item): void {
    const key = `${cat}:${item.id}`;
    if (this.owned[cat].includes(item.id)) {
      this.equip[cat] = item.id;
      save.setEquipped(cat, item.id);
      this.shopSel = null;
      sfx.drop();
      return;
    }
    if (this.shopSel !== key) {
      this.shopSel = key;
      if (this.bank < item.price) {
        this.shopSel = null;
        this.showToast(`You need ${item.price - this.bank} more coins`);
        haptic.error();
      }
      return;
    }
    if (!this.spend(item.price)) return;
    this.owned[cat].push(item.id);
    save.setOwned(cat, this.owned[cat]);
    this.equip[cat] = item.id;
    save.setEquipped(cat, item.id);
    this.shopSel = null;
    this.showToast(`${item.name} unlocked!`);
    sfx.serve();
    haptic.success();
  }

  private panel(y: number, title: string, sub: string): void {
    this.text(title, WORLD_W / 2, y - 30, 38, '#fff', 900);
    this.text(sub, WORLD_W / 2, y + 8, 17, 'rgba(255,255,255,0.85)', 600);
  }
}
