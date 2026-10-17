import { sfx, unlockAudio, setMuted } from './audio';
import { haptic, save } from './platform';
import { THEMES, drawBackdrop, makeSpecks, type Theme } from './themes';
import { BOOSTERS, PLATES, drawPlate, type BoosterId, type PlateId } from './shop';
import { CHEFS, drawChef, type Chef, type Mood } from './chef';

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

type Ingredient = 'rice' | 'nori' | 'salmon' | 'tuna' | 'avocado' | 'cucumber' | 'egg';

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

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }

interface Popup { x: number; y: number; text: string; life: number; max: number; color: string; size: number }

interface Order { recipe: Recipe; length: number; start: number; reward: number }

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
  private plates: string[] = save.plates();
  private plate = save.plate() as PlateId;
  private baseW = BASE_W;
  private doubleCoins = false;
  private slowStart = false;
  private chanceUsed = false;
  private buttons: Button[] = [];
  private shopFrom: Mode = 'title';
  private shopSel: PlateId | null = null; // plate waiting for a confirming second tap
  private toast: { text: string; life: number } | null = null;

  // Boss chef for the current level. One level = one order.
  private chefX = WORLD_W / 2;
  private reaction: { mood: Mood; life: number } | null = null;
  private bubble: { text: string; life: number } | null = null;
  private introIn = 0; // seconds until the next chef is announced

  constructor(private canvas: HTMLCanvasElement, private safeProbe: HTMLElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');
    this.ctx = ctx;
    setMuted(this.muted);
    this.resize();
    this.reset();
    new ResizeObserver(() => this.resize()).observe(canvas);
    canvas.addEventListener('pointerdown', (e) => this.onTap(e.clientX, e.clientY));
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
    this.popup(WORLD_W / 2, this.top.y - 130, `LEVEL ${this.level}`, '#ffffff', 26, 2.2);
    this.popup(WORLD_W / 2, this.top.y - 104, `${c.name}: ${c.rule}`, '#ffd34d', 14, 2.2);
    this.bubble = { text: c.intro, life: 2.2 };
    this.reaction = null;
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
    this.announceChef();

    const active = [this.doubleCoins && '2x coins', this.slowStart && 'slow start', this.baseW > BASE_W && 'wide base', this.boosters.chance && 'second chance'].filter(Boolean);
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
    this.order = { recipe, length: Math.min(5 + n, 12) + this.chef.extra, start: this.height, reward: 0 };
  }

  private nextIngredient(): Ingredient {
    const { pattern } = this.order.recipe;
    return pattern[(this.height - this.order.start) % pattern.length];
  }

  private speed(): number {
    const c = this.chef;
    let v = Math.min(130 + this.height * 5, 400) * c.speed * (1 + this.lap * 0.1);
    if (c.wobble) v *= 1 + 0.35 * Math.sin(this.time * 2.2);
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

    if (Math.abs(dx) <= (this.chef.tight ? TIGHT_TOL : PERFECT_TOL)) {
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
    if (this.height - this.order.start >= this.order.length) this.serve();
    this.moveDir *= -1;
    this.spawnMoving();
  }

  private serve(): void {
    const top = this.top;
    const coins = Math.max(1, Math.round(this.order.reward * 2));
    this.ordersServed++;
    this.flags.push({ x: top.x + top.w / 2, y: top.y, hue: (this.ordersServed * 47) % 360 });
    this.popup(WORLD_W / 2, top.y - 60, `${this.order.recipe.name} served!`, '#ffffff', 22);
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
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? x : x + w;
      this.particles.push({
        x: side, y: y + (Math.random() - 0.5) * LAYER_H,
        vx: (side === x ? -1 : 1) * (40 + Math.random() * 120), vy: -40 - Math.random() * 120,
        life: 0.5 + Math.random() * 0.3, max: 0.8, color: '#fff3b0', size: 2 + Math.random() * 2,
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
    // The chef shuffles left and right to keep the sliding layer in view.
    if (this.moving && this.mode === 'playing') {
      const target = Math.max(70, Math.min(WORLD_W - 70, this.moving.x + this.moving.w / 2));
      this.chefX += (target - this.chefX) * Math.min(1, dt * 2.5);
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

    ctx.save();
    ctx.translate(0, -this.camY);
    this.drawCounter();
    // Only draw the layers that are on screen; tall stacks can have hundreds.
    const minY = this.camY - LAYER_H;
    const maxY = this.camY + this.viewH;
    for (const l of this.stack) if (l.y > minY && l.y < maxY) this.drawLayer(l);
    for (const f of this.flags) if (f.y > minY - 40 && f.y < maxY + 40) this.drawFlag(f.x, f.y, f.hue);
    if (this.moving && this.mode !== 'dead') this.drawLayer(this.moving);
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
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
    for (const pp of this.popups) {
      ctx.globalAlpha = Math.min(1, pp.life * 2);
      this.text(pp.text, pp.x, pp.y, pp.size, pp.color);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

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
    drawPlate(ctx, this.plate, WORLD_W / 2, 0);
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
    ctx.fillStyle = COLORS[l.kind];
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

  private drawFlag(x: number, y: number, hue: number): void {
    const { ctx } = this;
    ctx.strokeStyle = '#e8d3a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y - 30);
    ctx.stroke();
    ctx.fillStyle = `hsl(${hue} 80% 60%)`;
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x + 18, y - 25);
    ctx.lineTo(x, y - 20);
    ctx.closePath();
    ctx.fill();
  }

  private text(str: string, x: number, y: number, size: number, color = '#fff', weight = 800, align: CanvasTextAlign = 'center'): void {
    const { ctx } = this;
    ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  private drawBoss(x: number, y: number): void {
    const { ctx } = this;
    const s = 0.85;
    const c = this.chef;
    // Watch and point at the sliding layer; on the results screen, at the player.
    const m = this.moving;
    const lookX = m && this.mode === 'playing' ? m.x + m.w / 2 : x;
    const lookY = m && this.mode === 'playing' ? m.y + LAYER_H / 2 - this.camY : y + 200;
    drawChef(ctx, c, x, y, s, this.chefMood(), lookX, lookY, this.time);

    // Name tag.
    const tag = `${c.name.toUpperCase()}`;
    ctx.font = '800 10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const tw = ctx.measureText(tag).width + 14;
    ctx.fillStyle = c.accent;
    const ty = y + 70 * s - 6;
    this.roundRect(x - tw / 2, ty, tw, 15, 7.5);
    ctx.fill();
    this.text(tag, x, ty + 8, 10, '#ffffff', 800);

    if (!this.bubble) return;
    // Speech bubble on whichever side has more room.
    ctx.font = '800 12px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const bw = ctx.measureText(this.bubble.text).width + 18;
    const right = x < WORLD_W / 2;
    const bx = Math.max(6, Math.min(WORLD_W - 6 - bw, right ? x + 30 : x - 30 - bw));
    const by = y - 50;
    ctx.globalAlpha = Math.min(1, this.bubble.life * 4);
    ctx.fillStyle = '#ffffff';
    this.roundRect(bx, by, bw, 24, 12);
    ctx.fill();
    ctx.beginPath();
    const tx = right ? bx + 10 : bx + bw - 10;
    ctx.moveTo(tx - 5, by + 22);
    ctx.lineTo(right ? x + 16 : x - 16, y - 18);
    ctx.lineTo(tx + 5, by + 22);
    ctx.fill();
    this.text(this.bubble.text, bx + bw / 2, by + 12.5, 12, '#3a1d12', 800);
    ctx.globalAlpha = 1;
  }

  private drawOrderCard(y: number): void {
    const { ctx } = this;
    const o = this.order;
    const done = this.height - o.start;
    const w = 236;
    const x = (WORLD_W - w) / 2;
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
      ctx.fillStyle = COLORS[kind];
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

  /** The cheapest plate the player doesn't own yet: shown after each run as something to save toward. */
  private nextGoal() {
    return PLATES.filter((p) => !this.plates.includes(p.id)).sort((a, b) => a.price - b.price)[0];
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
      const owned = BOOSTERS.filter((b) => this.boosters[b.id]).map((b) => `${b.name} x${this.boosters[b.id]}`);
      if (owned.length) this.text(`Ready: ${owned.join(', ')}`, cx, top + 360, 12, 'rgba(255,255,255,0.75)', 600);
      return;
    }

    this.text(String(this.height), cx, top + 64, 50, '#fff', 900);
    if (this.mode === 'playing') {
      this.drawOrderCard(top + 100);
      this.drawBoss(this.chefX, top + 205);
    }

    if (this.paused) {
      this.panel(midY, 'PAUSED', 'Tap to resume');
    } else if (this.mode === 'dead') {
      const t = Math.min(1, (this.time - this.deadAt) / 0.35);
      ctx.globalAlpha = t;
      ctx.fillStyle = 'rgba(30,15,30,0.5)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      // The boss gloats over the result.
      this.drawBoss(WORLD_W / 2, Math.max(top + 150, midY - 175));
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

  private drawShop(): void {
    const { ctx } = this;
    const top = this.insets.top;
    const cx = WORLD_W / 2;
    ctx.fillStyle = 'rgba(20,10,25,0.55)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.text('SHOP', cx, top + 31, 24, '#fff', 900);

    const backY = this.viewH - this.insets.bottom - 60;
    const gap = 10;
    const cw = (WORLD_W - 32 - gap) / 2;
    const gridTop = top + 64;
    const ch = Math.max(70, Math.min(100, (backY - 12 - gridTop - 48 - 4 * gap) / 5));

    // Boosters: one tap buys one.
    this.text('BOOSTERS · used on your next run', 16, gridTop + 10, 12, 'rgba(255,255,255,0.75)', 800, 'left');
    BOOSTERS.forEach((b, i) => {
      const x = 16 + (i % 2) * (cw + gap);
      const y = gridTop + 24 + Math.floor(i / 2) * (ch + gap);
      ctx.fillStyle = 'rgba(255,248,235,0.95)';
      this.roundRect(x, y, cw, ch, 12);
      ctx.fill();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(x + 26, y + ch / 2, 17, 0, Math.PI * 2);
      ctx.fill();
      if (b.id === 'slow') {
        // Clock face drawn by hand; the glyph renders too small on some fonts.
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + 26, y + ch / 2, 9, 0, Math.PI * 2);
        ctx.moveTo(x + 26, y + ch / 2 - 6);
        ctx.lineTo(x + 26, y + ch / 2);
        ctx.lineTo(x + 30, y + ch / 2 + 3);
        ctx.stroke();
      } else {
        this.text({ chance: '♥', double: '2x', wide: '↔' }[b.id], x + 26, y + ch / 2 + 1, b.id === 'double' ? 14 : 18, '#fff', 900);
      }
      this.text(b.name, x + 50, y + ch / 2 - 18, 13, '#4a2618', 800, 'left');
      this.text(b.desc, x + 50, y + ch / 2, 11, 'rgba(74,38,24,0.75)', 600, 'left');
      const afford = this.bank >= b.price;
      ctx.fillStyle = '#e0a800';
      ctx.beginPath();
      ctx.arc(x + 56, y + ch / 2 + 19, 5, 0, Math.PI * 2);
      ctx.fill();
      this.text(String(b.price), x + 65, y + ch / 2 + 20, 13, afford ? '#4a2618' : '#b5442a', 800, 'left');
      const n = this.boosters[b.id] ?? 0;
      if (n) {
        ctx.fillStyle = '#4a2618';
        this.roundRect(x + cw - 34, y + 6, 28, 18, 9);
        ctx.fill();
        this.text(`x${n}`, x + cw - 20, y + 16, 11, '#fff', 800);
      }
      this.buttons.push({ x, y, w: cw, h: ch, onTap: () => this.buyBooster(b.id) });
    });

    // Plates: tap to equip if owned; otherwise tap once to select and again to buy.
    const platesTop = gridTop + 24 + 2 * (ch + gap) + 4;
    this.text('PLATES · your roll sits on it', 16, platesTop + 10, 12, 'rgba(255,255,255,0.75)', 800, 'left');
    PLATES.forEach((p, i) => {
      const x = 16 + (i % 2) * (cw + gap);
      const y = platesTop + 24 + Math.floor(i / 2) * (ch + gap);
      const owned = this.plates.includes(p.id);
      const equipped = this.plate === p.id;
      const selected = this.shopSel === p.id;
      ctx.fillStyle = 'rgba(48,30,52,0.92)';
      this.roundRect(x, y, cw, ch, 12);
      ctx.fill();
      if (equipped || selected) {
        ctx.strokeStyle = selected ? '#ffd34d' : '#6cc070';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      drawPlate(ctx, p.id, x + cw / 2, y + ch * 0.36, 0.5);
      this.text(p.name, x + 12, y + ch - 32, 13, '#fff', 800, 'left');
      if (selected) {
        this.text(`Tap again to buy for ${p.price}`, x + 12, y + ch - 14, 11, '#ffd34d', 700, 'left');
      } else if (equipped) {
        this.text('✓ IN USE', x + 12, y + ch - 14, 11, '#8fdc93', 800, 'left');
      } else if (owned) {
        this.text('Tap to use', x + 12, y + ch - 14, 11, 'rgba(255,255,255,0.7)', 700, 'left');
      } else {
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath();
        ctx.arc(x + 17, y + ch - 14, 5, 0, Math.PI * 2);
        ctx.fill();
        this.text(String(p.price), x + 26, y + ch - 13, 13, this.bank >= p.price ? '#ffd34d' : '#ff9a8a', 800, 'left');
      }
      this.buttons.push({ x, y, w: cw, h: ch, onTap: () => this.tapPlate(p.id) });
    });

    this.button(16, backY, WORLD_W - 32, 46, 'BACK', () => { this.mode = this.shopFrom; this.shopSel = null; }, 'quiet');
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

  private tapPlate(id: PlateId): void {
    const p = PLATES.find((x) => x.id === id)!;
    if (this.plates.includes(id)) {
      this.plate = id;
      save.setPlate(id);
      this.shopSel = null;
      sfx.drop();
      return;
    }
    if (this.shopSel !== id) {
      this.shopSel = id;
      if (this.bank < p.price) {
        this.shopSel = null;
        this.showToast(`You need ${p.price - this.bank} more coins`);
        haptic.error();
      }
      return;
    }
    if (!this.spend(p.price)) return;
    this.plates.push(id);
    save.setPlates(this.plates);
    this.plate = id;
    save.setPlate(id);
    this.shopSel = null;
    this.showToast(`${p.name} unlocked!`);
    sfx.serve();
    haptic.success();
  }

  private panel(y: number, title: string, sub: string): void {
    this.text(title, WORLD_W / 2, y - 30, 38, '#fff', 900);
    this.text(sub, WORLD_W / 2, y + 8, 17, 'rgba(255,255,255,0.85)', 600);
  }
}
