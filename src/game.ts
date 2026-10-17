import { sfx, unlockAudio, setMuted } from './audio';
import { haptic, save } from './platform';

// The world is always 400 units wide; height follows the screen's aspect ratio.
const WORLD_W = 400;
const ORBIT_GAP = 16; // distance between a planet's surface and the player's orbit
const LAUNCH_SPEED = 620;
const MAX_FLIGHT = 1.4; // seconds in open space before the player is lost
const PLAYER_R = 7;
const COIN_R = 9;

const PLANET_HUES = [190, 280, 330, 30, 150, 220, 50];

interface Planet {
  baseX: number;
  x: number;
  y: number;
  r: number;
  hue: number;
  spin: number; // angular speed multiplier
  moveAmp: number;
  moveFreq: number;
  phase: number;
  visited: boolean;
}

interface Coin { x: number; y: number; taken: boolean }

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; hue: number; size: number }

interface Popup { x: number; y: number; text: string; life: number; hue: number }

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

  private planets: Planet[] = [];
  private coins: Coin[] = [];
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private stars: { x: number; y: number; z: number }[] = [];
  private trail: { x: number; y: number }[] = [];

  private current: Planet | null = null;
  private lastPlanet: Planet | null = null; // planet the player most recently launched from
  private angle = 0;
  private dir = 1;
  private px = 0;
  private py = 0;
  private vx = 0;
  private vy = 0;
  private flight = 0;

  private camY = 0;
  private shake = 0;
  private score = 0;
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
    for (let i = 0; i < 140; i++) {
      this.stars.push({ x: Math.random() * WORLD_W, y: Math.random() * 2000, z: 0.15 + Math.random() * 0.6 });
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

  // ---------------------------------------------------------------- world gen

  private reset(): void {
    this.planets = [];
    this.coins = [];
    this.particles = [];
    this.popups = [];
    this.trail = [];
    this.score = 0;
    this.combo = 0;
    this.runCoins = 0;
    this.newBest = false;
    this.paused = false;

    const first = this.makePlanet(WORLD_W / 2, 0, 0);
    first.r = 38;
    first.spin = 0.8;
    first.visited = true;
    this.planets.push(first);
    while (this.planets.length < 8) this.spawnNext();

    this.current = first;
    this.lastPlanet = null;
    this.angle = -Math.PI / 2;
    this.dir = 1;
    this.placeOnOrbit();
    this.camY = first.y - this.viewH * 0.68;
  }

  private difficulty(index: number): number {
    return Math.min(index / 40, 1);
  }

  private makePlanet(x: number, y: number, index: number): Planet {
    const d = this.difficulty(index);
    const moving = index > 12 && Math.random() < 0.15 + d * 0.4;
    return {
      baseX: x,
      x,
      y,
      r: 34 - d * 14 + Math.random() * 8,
      hue: PLANET_HUES[index % PLANET_HUES.length],
      spin: 0.85 + d * 0.9 + Math.random() * 0.35,
      moveAmp: moving ? 30 + Math.random() * 40 * (0.5 + d) : 0,
      moveFreq: 0.6 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      visited: false,
    };
  }

  private spawnNext(): void {
    const index = this.planets.length;
    const prev = this.planets[index - 1];
    const d = this.difficulty(index);
    const gap = 150 + d * 90 + Math.random() * 40;
    const margin = 70;
    let x = margin + Math.random() * (WORLD_W - margin * 2);
    if (Math.abs(x - prev.baseX) < 60) x = x < WORLD_W / 2 ? x + 120 : x - 120;
    const p = this.makePlanet(x, prev.y - gap, index);
    p.baseX = Math.max(margin + p.moveAmp, Math.min(WORLD_W - margin - p.moveAmp, p.baseX));
    p.x = p.baseX;
    this.planets.push(p);

    // Optional coin roughly between the two planets, nudged sideways for risk/reward.
    if (Math.random() < 0.55) {
      const t = 0.4 + Math.random() * 0.2;
      this.coins.push({
        x: prev.baseX + (p.baseX - prev.baseX) * t + (Math.random() - 0.5) * 70,
        y: prev.y + (p.y - prev.y) * t,
        taken: false,
      });
    }
  }

  private placeOnOrbit(): void {
    const c = this.current!;
    const R = c.r + ORBIT_GAP;
    this.px = c.x + Math.cos(this.angle) * R;
    this.py = c.y + Math.sin(this.angle) * R;
  }

  // ------------------------------------------------------------------- input

  private onTap(clientX: number, clientY: number): void {
    unlockAudio();
    const wx = clientX / this.scale;
    const wy = clientY / this.scale;

    // Mute toggle in the top-left corner.
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
        this.launch();
        break;
      case 'playing':
        this.launch();
        break;
      case 'dead':
        if (this.time - this.deadAt > 0.6) {
          this.reset();
          this.mode = 'playing';
        }
        break;
    }
  }

  private launch(): void {
    const c = this.current;
    if (!c) return;
    // Velocity of the orbiting player: tangent to the orbit plus the planet's own motion.
    const tx = -Math.sin(this.angle) * this.dir;
    const ty = Math.cos(this.angle) * this.dir;
    const planetVx = c.moveAmp * c.moveFreq * Math.cos(this.time * c.moveFreq + c.phase);
    this.vx = tx * LAUNCH_SPEED + planetVx * 0.5;
    this.vy = ty * LAUNCH_SPEED;
    const s = LAUNCH_SPEED / Math.hypot(this.vx, this.vy);
    this.vx *= s;
    this.vy *= s;
    this.current = null;
    this.flight = 0;
    this.lastPlanet = c;
    sfx.launch();
    haptic.light();
  }

  // ------------------------------------------------------------------ update

  update(dt: number): void {
    dt = Math.min(dt, 1 / 20);
    if (this.paused) return;
    this.time += dt;

    for (const p of this.planets) {
      p.x = p.baseX + p.moveAmp * Math.sin(this.time * p.moveFreq + p.phase);
    }

    if (this.mode !== 'dead') {
      if (this.current) {
        const c = this.current;
        const R = c.r + ORBIT_GAP;
        const speed = (150 * c.spin) / R; // roughly constant linear speed across sizes
        this.angle += speed * this.dir * dt;
        this.placeOnOrbit();
      } else {
        this.fly(dt);
      }
      this.trail.push({ x: this.px, y: this.py });
      if (this.trail.length > 14) this.trail.shift();
    }

    // Camera follows the planet the player is on (or flying from), only moving up.
    const anchor = this.current ?? this.lastPlanet;
    if (anchor) {
      const target = anchor.y - this.viewH * 0.68;
      this.camY += (target - this.camY) * Math.min(1, dt * 3);
    }

    // Keep the world populated above and trim what has scrolled away.
    while (this.planets[this.planets.length - 1].y > this.camY - this.viewH) this.spawnNext();
    const cutoff = this.camY + this.viewH + 400;
    this.planets = this.planets.filter((p) => p.y < cutoff || p === this.current || p === this.lastPlanet);
    this.coins = this.coins.filter((c) => c.y < cutoff && !c.taken);

    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const pp of this.popups) { pp.y -= 40 * dt; pp.life -= dt; }
    this.popups = this.popups.filter((pp) => pp.life > 0);
    this.shake = Math.max(0, this.shake - dt * 30);
  }

  private fly(dt: number): void {
    this.flight += dt;
    // Sub-step so fast flights never tunnel through a small planet.
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      this.px += (this.vx * dt) / steps;
      this.py += (this.vy * dt) / steps;

      for (const coin of this.coins) {
        if (!coin.taken && Math.hypot(coin.x - this.px, coin.y - this.py) < COIN_R + PLAYER_R + 4) {
          coin.taken = true;
          this.runCoins++;
          this.burst(coin.x, coin.y, 50, 10, 120);
          this.popup(coin.x, coin.y, '+1', 50);
          sfx.coin();
        }
      }

      for (const p of this.planets) {
        if (p === this.lastPlanet) continue;
        const R = p.r + ORBIT_GAP;
        if (Math.hypot(this.px - p.x, this.py - p.y) <= R) {
          this.land(p);
          return;
        }
      }
    }

    const offscreen = this.px < -PLAYER_R || this.px > WORLD_W + PLAYER_R || this.py > this.camY + this.viewH + 20 || this.py < this.camY - 40;
    if (offscreen || this.flight > MAX_FLIGHT) this.die();
  }

  private land(p: Planet): void {
    const rx = this.px - p.x;
    const ry = this.py - p.y;
    const cross = rx * this.vy - ry * this.vx;
    // Closest the flight line would have passed to the planet's centre: aiming dead centre is a "perfect".
    const miss = Math.abs(cross) / LAUNCH_SPEED;
    const perfect = miss < p.r * 0.4;

    this.current = p;
    this.angle = Math.atan2(ry, rx);
    if (Math.abs(cross) > 1e-3) this.dir = cross > 0 ? 1 : -1;
    this.placeOnOrbit();

    if (!p.visited) {
      p.visited = true;
      this.combo = perfect ? this.combo + 1 : 0;
      const gained = 1 + (perfect ? this.combo : 0);
      this.score += gained;
      this.burst(this.px, this.py, p.hue, perfect ? 22 : 12, perfect ? 220 : 140);
      if (perfect) {
        this.popup(p.x, p.y - p.r - 30, this.combo > 1 ? `PERFECT x${this.combo}` : 'PERFECT', p.hue);
        sfx.perfect();
        haptic.medium();
        this.shake = 4;
      } else {
        sfx.land(this.score);
        haptic.light();
      }
    } else {
      sfx.land(0);
    }
  }

  private die(): void {
    this.mode = 'dead';
    this.deadAt = this.time;
    this.burst(this.px, this.py, 0, 40, 300);
    this.shake = 12;
    sfx.die();
    haptic.error();
    this.bank += this.runCoins;
    save.setCoins(this.bank);
    if (this.score > this.best) {
      this.best = this.score;
      this.newBest = true;
      save.setBest(this.best);
    }
  }

  private burst(x: number, y: number, hue: number, n: number, speed: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      const life = 0.4 + Math.random() * 0.5;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, hue, size: 1.5 + Math.random() * 2.5 });
    }
  }

  private popup(x: number, y: number, text: string, hue: number): void {
    this.popups.push({ x, y, text, hue, life: 0.9 });
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
    g.addColorStop(0, '#0b1030');
    g.addColorStop(1, '#070b1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;
    ctx.setTransform(s, 0, 0, s, sx * s, sy * s);

    this.drawStars();

    ctx.save();
    ctx.translate(0, -this.camY);
    for (const c of this.coins) this.drawCoin(c);
    for (const p of this.planets) this.drawPlanet(p);
    this.drawParticles();
    if (this.mode !== 'dead') this.drawPlayer();
    for (const pp of this.popups) {
      ctx.globalAlpha = Math.min(1, pp.life * 2);
      this.text(pp.text, pp.x, pp.y, 18, `hsl(${pp.hue} 100% 75%)`);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    this.drawHud();
  }

  private drawStars(): void {
    const { ctx } = this;
    const span = 2000;
    for (const st of this.stars) {
      let y = (st.y - this.camY * st.z) % span;
      if (y < 0) y += span;
      if (y > this.viewH) continue;
      ctx.globalAlpha = 0.3 + st.z;
      ctx.fillStyle = '#cfe3ff';
      ctx.fillRect(st.x, y, st.z * 2.4, st.z * 2.4);
    }
    ctx.globalAlpha = 1;
  }

  private drawPlanet(p: Planet): void {
    const { ctx } = this;
    const R = p.r + ORBIT_GAP;
    const isCurrent = p === this.current;

    ctx.strokeStyle = `hsla(${p.hue}, 90%, 70%, ${isCurrent ? 0.45 : 0.15})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.shadowColor = `hsl(${p.hue} 100% 60%)`;
    ctx.shadowBlur = 24;
    const grad = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.1, p.x, p.y, p.r);
    grad.addColorStop(0, `hsl(${p.hue} 90% ${p.visited ? 70 : 78}%)`);
    grad.addColorStop(1, `hsl(${p.hue} 70% ${p.visited ? 28 : 40}%)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawCoin(c: Coin): void {
    const { ctx } = this;
    const w = Math.abs(Math.cos(this.time * 3 + c.x)) * COIN_R;
    ctx.fillStyle = '#ffd34d';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - COIN_R);
    ctx.lineTo(c.x + w, c.y);
    ctx.lineTo(c.x, c.y + COIN_R);
    ctx.lineTo(c.x - w, c.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawPlayer(): void {
    const { ctx } = this;
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const k = i / this.trail.length;
      ctx.globalAlpha = k * 0.5;
      ctx.fillStyle = '#9ff3ff';
      ctx.beginPath();
      ctx.arc(t.x, t.y, PLAYER_R * k, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = '#7ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.px, this.py, PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawParticles(): void {
    const { ctx } = this;
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.life / pt.max;
      ctx.fillStyle = pt.hue === 0 ? '#ffffff' : `hsl(${pt.hue} 100% 70%)`;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
  }

  private text(str: string, x: number, y: number, size: number, color = '#fff', weight = 800): void {
    const { ctx } = this;
    ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  private drawHud(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const top = this.insets.top;
    const midY = this.viewH / 2;

    // Mute button.
    const mb = this.muteButton();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mb.x, mb.y, mb.r, 0, Math.PI * 2);
    ctx.stroke();
    this.text(this.muted ? '×' : '♪', mb.x, mb.y + 1, 16, 'rgba(255,255,255,0.8)');

    // Coins.
    ctx.textAlign = 'right';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(`◆ ${this.bank + (this.mode === 'dead' ? 0 : this.runCoins)}`, WORLD_W - this.insets.right - 16, top + 30);

    if (this.mode === 'title') {
      const pulse = 0.6 + 0.4 * Math.sin(this.time * 4);
      ctx.fillStyle = 'rgba(5,8,20,0.45)';
      ctx.fillRect(0, 0, WORLD_W, this.viewH);
      this.text('ORBIT', cx, midY - 190, 56, '#ffffff', 900);
      this.text('HOP', cx, midY - 138, 56, '#7ff3ff', 900);
      ctx.globalAlpha = pulse;
      this.text('TAP TO LAUNCH', cx, this.viewH - this.insets.bottom - 90, 20);
      ctx.globalAlpha = 1;
      this.text('Release at the right moment to hop', cx, this.viewH - this.insets.bottom - 56, 14, 'rgba(255,255,255,0.6)', 500);
      this.text('to the next planet. Aim for the centre!', cx, this.viewH - this.insets.bottom - 36, 14, 'rgba(255,255,255,0.6)', 500);
      if (this.best > 0) this.text(`BEST ${this.best}`, cx, top + 30, 16, 'rgba(255,255,255,0.7)', 700);
      return;
    }

    this.text(String(this.score), cx, top + 70, 54, '#fff', 900);

    if (this.paused) {
      this.panel(midY, 'PAUSED', 'Tap to resume');
    } else if (this.mode === 'dead') {
      const t = Math.min(1, (this.time - this.deadAt) / 0.35);
      ctx.globalAlpha = t;
      ctx.fillStyle = 'rgba(5,8,20,0.6)';
      ctx.fillRect(0, 0, WORLD_W, this.viewH);
      this.panel(midY, this.newBest ? 'NEW BEST!' : 'LOST IN SPACE', `Score ${this.score}   ·   Best ${this.best}`);
      if (this.runCoins > 0) this.text(`+${this.runCoins} ◆`, cx, midY + 44, 18, '#ffd34d', 700);
      if (this.time - this.deadAt > 0.6) this.text('TAP TO RETRY', cx, midY + 100, 20);
      ctx.globalAlpha = 1;
    }
  }

  private panel(y: number, title: string, sub: string): void {
    this.text(title, WORLD_W / 2, y - 30, 38, '#fff', 900);
    this.text(sub, WORLD_W / 2, y + 12, 17, 'rgba(255,255,255,0.8)', 600);
  }
}
