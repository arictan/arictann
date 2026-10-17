import { sfx, unlockAudio, setMuted } from './audio';
import { haptic, save } from './platform';

// The world is always 400 units wide; height follows the screen's aspect ratio.
// World y grows downward; the plate sits at y = 0 and the stack grows toward negative y.
const WORLD_W = 400;
const LAYER_H = 24;
const BASE_W = 200;
const PERFECT_TOL = 5; // drops this close to the layer below snap into place
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

interface Popup { x: number; y: number; text: string; life: number; color: string; size: number }

interface Order { recipe: Recipe; length: number; start: number; reward: number }

type Mode = 'title' | 'playing' | 'dead';

interface Insets { top: number; right: number; bottom: number; left: number }

export class Game {
  private ctx: CanvasRenderingContext2D;
  private scale = 1; // CSS pixels per world unit
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
  private lanterns: { x: number; y: number; z: number; hue: number }[] = [];

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

  constructor(private canvas: HTMLCanvasElement, private safeProbe: HTMLElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');
    this.ctx = ctx;
    setMuted(this.muted);
    for (let i = 0; i < 14; i++) {
      this.lanterns.push({ x: Math.random() * WORLD_W, y: Math.random() * 1600, z: 0.15 + Math.random() * 0.35, hue: Math.random() < 0.7 ? 5 : 35 });
    }
    this.resize();
    this.reset();
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('pointerdown', (e) => this.onTap(e.clientX, e.clientY));
  }

  pause(): void {
    this.paused = this.mode === 'playing';
  }

  private resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.scale = w / WORLD_W;
    this.viewH = h / this.scale;
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

  private reset(): void {
    const x = (WORLD_W - BASE_W) / 2;
    this.stack = [{ x, y: -LAYER_H, w: BASE_W, kind: 'rice', origin: x }];
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
    this.newOrder();
    this.spawnMoving();
    this.camY = this.targetCam();
  }

  private newOrder(): void {
    const n = this.ordersServed;
    // Early orders use the simple recipes; the full menu opens up as you serve more.
    const recipe = RECIPES[Math.floor(Math.random() * Math.min(RECIPES.length, 2 + n))];
    this.order = { recipe, length: Math.min(5 + n, 12), start: this.height, reward: 0 };
  }

  private nextIngredient(): Ingredient {
    const { pattern } = this.order.recipe;
    return pattern[(this.height - this.order.start) % pattern.length];
  }

  private speed(): number {
    return Math.min(130 + this.height * 5, 400);
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
    const wx = clientX / this.scale;
    const wy = clientY / this.scale;

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

    switch (this.mode) {
      case 'title':
        this.mode = 'playing';
        this.drop();
        break;
      case 'playing':
        this.drop();
        break;
      case 'dead':
        if (this.time - this.deadAt > 0.7) {
          this.reset();
          this.mode = 'playing';
        }
        break;
    }
  }

  private drop(): void {
    const m = this.moving;
    if (!m) return;
    const top = this.top;
    const dx = m.x - top.x;

    if (Math.abs(dx) <= PERFECT_TOL) {
      m.origin -= dx;
      m.x = top.x;
      this.combo++;
      if (this.combo >= 3 && m.w < BASE_W) {
        const grow = Math.min(REGROW, BASE_W - m.w);
        m.x -= grow / 2;
        m.w += grow;
      }
      this.place(m);
      const cx = m.x + m.w / 2;
      this.popup(cx, m.y - 18, this.combo > 1 ? `PERFECT x${this.combo}` : 'PERFECT', '#fff3b0', 18);
      this.sparkle(m.x, m.y + LAYER_H / 2, m.w, 18 + this.combo * 2);
      sfx.perfect(this.combo);
      haptic.medium();
      this.flash = 0.25;
      this.shake = 3;
    } else {
      const overlap = top.w - Math.abs(dx);
      if (overlap <= 0) {
        this.moving = null;
        this.fall(m, dx > 0 ? 1 : -1);
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
      sfx.slice();
      haptic.light();
    }
  }

  private place(layer: Layer): void {
    this.stack.push(layer);
    this.order.reward += layer.w / BASE_W;
    sfx.drop();
    if (this.height - this.order.start >= this.order.length) this.serve();
    this.moveDir *= -1;
    this.spawnMoving();
  }

  private serve(): void {
    const top = this.top;
    const coins = Math.max(1, Math.round(this.order.reward * 2));
    this.runCoins += coins;
    this.ordersServed++;
    this.flags.push({ x: top.x + top.w / 2, y: top.y, hue: (this.ordersServed * 47) % 360 });
    this.popup(WORLD_W / 2, top.y - 60, `${this.order.recipe.name} served!`, '#ffffff', 22);
    this.popup(WORLD_W / 2, top.y - 34, `+${coins} coins`, '#ffd34d', 18);
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 120 + Math.random() * 200;
      this.particles.push({ x: top.x + top.w / 2, y: top.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, life: 0.9, max: 0.9, color: '#ffd34d', size: 4 });
    }
    sfx.serve();
    haptic.success();
    this.newOrder();
  }

  private fall(layer: Layer, side: number): void {
    this.pieces.push({ ...layer, vx: side * (60 + Math.random() * 60), vy: -60, rot: 0, spin: side * (2 + Math.random() * 3) });
  }

  private die(): void {
    this.mode = 'dead';
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

  private popup(x: number, y: number, text: string, color: string, size: number): void {
    this.popups.push({ x, y, text, color, size, life: 1.1 });
  }

  // ------------------------------------------------------------------ update

  update(dt: number): void {
    dt = Math.min(dt, 1 / 20);
    if (this.paused) return;
    this.time += dt;

    const m = this.moving;
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
    for (const pp of this.popups) { pp.y -= 30 * dt; pp.life -= dt; }
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

    const g = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    g.addColorStop(0, '#2a1a33');
    g.addColorStop(1, '#4b2a3a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;
    ctx.setTransform(s, 0, 0, s, sx * s, sy * s);

    this.drawLanterns();

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
      ctx.fillRect(0, 0, WORLD_W, this.viewH);
    }

    this.drawHud();
  }

  private drawLanterns(): void {
    const { ctx } = this;
    const span = 1600;
    for (const l of this.lanterns) {
      let y = (l.y - this.camY * l.z) % span;
      if (y < 0) y += span;
      if (y > this.viewH + 40) continue;
      const r = 10 + l.z * 30;
      const glow = ctx.createRadialGradient(l.x, y, 0, l.x, y, r * 2.4);
      glow.addColorStop(0, `hsla(${l.hue}, 90%, 60%, ${0.25 * l.z + 0.05})`);
      glow.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(l.x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
      ctx.globalAlpha = 0.25 + l.z;
      ctx.fillStyle = `hsl(${l.hue} 75% 48%)`;
      ctx.beginPath();
      ctx.ellipse(l.x, y, r * 0.8, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b1020';
      ctx.fillRect(l.x - r * 0.45, y - r - 2, r * 0.9, 4);
      ctx.fillRect(l.x - r * 0.45, y + r - 2, r * 0.9, 4);
      ctx.globalAlpha = 1;
    }
  }

  private drawCounter(): void {
    const { ctx } = this;
    // Wooden counter from the plate down past the bottom of the screen.
    const counterY = 14;
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(-20, counterY, WORLD_W + 40, 2000);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, counterY + 18 + i * 26);
      ctx.bezierCurveTo(120, counterY + 10 + i * 26, 260, counterY + 30 + i * 26, WORLD_W, counterY + 16 + i * 26);
      ctx.stroke();
    }
    ctx.fillStyle = '#a0683a';
    ctx.fillRect(-20, counterY, WORLD_W + 40, 6);
    // Plate.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.roundRect(WORLD_W / 2 - 140, 6, 280, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#f4f7fb';
    this.roundRect(WORLD_W / 2 - 136, 0, 272, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#3d6fb6';
    ctx.fillRect(WORLD_W / 2 - 124, 9, 248, 2);
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

  private drawOrderCard(y: number): void {
    const { ctx } = this;
    const o = this.order;
    const done = this.height - o.start;
    const w = 236;
    const x = (WORLD_W - w) / 2;
    ctx.fillStyle = 'rgba(255,248,235,0.94)';
    this.roundRect(x, y, w, 52, 12);
    ctx.fill();
    this.text(`ORDER: ${o.recipe.name}`, x + 12, y + 15, 13, '#5a2e1f', 800, 'left');
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

  private drawHud(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const top = this.insets.top;
    const midY = this.viewH / 2;

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
    this.text(String(this.bank + (this.mode === 'dead' ? 0 : this.runCoins)), WORLD_W - this.insets.right - 38, top + 31, 16, '#ffd34d', 700, 'right');

    if (this.mode === 'title') {
      const pulse = 0.6 + 0.4 * Math.sin(this.time * 4);
      this.text('SUSHI', cx, top + 120, 60, '#ffffff', 900);
      this.text('STACK', cx, top + 176, 60, '#ff8a5b', 900);
      if (this.best > 0) this.text(`BEST ${this.best}`, cx, top + 30, 16, 'rgba(255,255,255,0.75)', 700);
      ctx.globalAlpha = pulse;
      this.text('TAP TO DROP', cx, top + 236, 20);
      ctx.globalAlpha = 1;
      this.text('Line each layer up perfectly.', cx, top + 264, 14, 'rgba(255,255,255,0.65)', 500);
      return;
    }

    this.text(String(this.height), cx, top + 64, 50, '#fff', 900);
    if (this.mode === 'playing') this.drawOrderCard(top + 100);

    if (this.paused) {
      this.panel(midY, 'PAUSED', 'Tap to resume');
    } else if (this.mode === 'dead') {
      const t = Math.min(1, (this.time - this.deadAt) / 0.35);
      ctx.globalAlpha = t;
      ctx.fillStyle = 'rgba(30,15,30,0.5)';
      ctx.fillRect(0, 0, WORLD_W, this.viewH);
      ctx.fillStyle = 'rgba(42,26,51,0.92)';
      this.roundRect(30, midY - 95, WORLD_W - 60, 225, 18);
      ctx.fill();
      this.panel(midY - 20, this.newBest ? 'NEW BEST!' : 'DROPPED IT!', `${this.height} layers   ·   Best ${this.best}`);
      this.text(`${this.ordersServed} order${this.ordersServed === 1 ? '' : 's'} served   ·   +${this.runCoins} coins`, cx, midY + 20, 15, '#ffd34d', 700);
      // Near-miss nudge: the most effective "one more try" prompt.
      const gap = this.best - this.height;
      if (!this.newBest && gap > 0 && gap <= 3) this.text(`So close! Only ${gap} more for a new best`, cx, midY + 50, 15, '#ffb4a2', 700);
      if (this.time - this.deadAt > 0.7) this.text('TAP TO RETRY', cx, midY + 100, 20);
      ctx.globalAlpha = 1;
    }
  }

  private panel(y: number, title: string, sub: string): void {
    this.text(title, WORLD_W / 2, y - 30, 38, '#fff', 900);
    this.text(sub, WORLD_W / 2, y + 8, 17, 'rgba(255,255,255,0.85)', 600);
  }
}
