// Three short mini-games for variety between chapters: Knife Throw, Rice Rhythm and Fish Catch.
// Each is self-contained: update(dt), draw(ctx), tap(x, y), and it reports done / won / score.

import { FONT } from './font';

export type MiniId = 'knife' | 'rhythm' | 'fish';

export const MINIS: Record<MiniId, { name: string; icon: string; desc: string; unlock: number }> = {
  knife: { name: 'Knife Throw', icon: '🔪', desc: 'Stick 8 knives in the spinning tuna. Don’t hit another knife!', unlock: 11 },
  rhythm: { name: 'Rice Rhythm', icon: '🍙', desc: 'Tap as each rice ball reaches the ring. Hit 70% to win.', unlock: 21 },
  fish: { name: 'Fish Catch', icon: '🐟', desc: 'Tap left or right to move. Catch 15 fish, dodge the boots.', unlock: 31 },
};

export interface MiniGame {
  id: MiniId;
  done: boolean;
  won: boolean;
  score: number;
  status: string; // shown in the HUD
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void;
  tap(x: number, y: number): void;
  sound: string | null; // last event, read and cleared by the game to play a sound
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, weight = 700): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// ------------------------------------------------------------------ knife throw

class KnifeThrow implements MiniGame {
  id = 'knife' as const;
  done = false;
  won = false;
  score = 0;
  status = '';
  sound: string | null = null;
  private angle = 0;
  private spin = 1.6;
  private stuck: number[] = [0.9, 3.4]; // two knives start in the tuna
  private flying: number | null = null; // y offset of a knife in flight (0 = at the bottom)
  private left = 8;
  private t = 0;
  private shake = 0;
  private bounce: { y: number; vy: number; rot: number } | null = null;

  update(dt: number): void {
    this.t += dt;
    // The spin speeds up, slows and reverses so timing never gets easy.
    this.spin = 1.6 + Math.sin(this.t * 0.9) * 1.4 + (this.t % 7 < 1 ? -3 : 0);
    this.angle += this.spin * dt;
    this.shake = Math.max(0, this.shake - dt * 20);
    if (this.flying !== null) {
      this.flying += dt * 1600;
      if (this.flying >= 210) {
        this.flying = null;
        // The knife lands at the bottom of the tuna (angle PI/2 in tuna space).
        const hit = Math.PI / 2 - this.angle;
        const clash = this.stuck.some((a) => {
          const d = Math.abs((((hit - a) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          return d < 0.22;
        });
        if (clash) {
          this.bounce = { y: 0, vy: -300, rot: 0 };
          this.done = true;
          this.sound = 'fail';
        } else {
          this.stuck.push(hit);
          this.left--;
          this.score++;
          this.shake = 6;
          this.sound = 'hit';
          if (this.left <= 0) {
            this.done = true;
            this.won = true;
            this.sound = 'win';
          }
        }
      }
    }
    if (this.bounce) {
      this.bounce.vy += 900 * dt;
      this.bounce.y += this.bounce.vy * dt;
      this.bounce.rot += dt * 10;
    }
    this.status = `🔪 ${this.left} left`;
  }

  draw(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const cx = W / 2;
    const cy = H * 0.36;
    const R = 92;
    // The spinning tuna steak.
    ctx.save();
    ctx.translate(cx + (Math.random() - 0.5) * this.shake, cy);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#d7263d';
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,200,0.6)';
    ctx.lineWidth = 4;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, R * (i / 4), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#f6f1e4';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    for (const a of this.stuck) {
      ctx.save();
      ctx.rotate(a);
      ctx.translate(R + 18, 0);
      ctx.rotate(-Math.PI / 2); // blade into the tuna, handle out
      knife(ctx);
      ctx.restore();
    }
    ctx.restore();
    // Knife ready / in flight at the bottom.
    const by = H * 0.8;
    if (this.flying !== null) {
      ctx.save();
      ctx.translate(cx, by - this.flying);
      knife(ctx);
      ctx.restore();
    } else if (!this.done) {
      ctx.save();
      ctx.translate(cx, by);
      knife(ctx);
      ctx.restore();
    }
    if (this.bounce) {
      ctx.save();
      ctx.translate(cx + 40, cy + R + 40 + this.bounce.y);
      ctx.rotate(this.bounce.rot);
      knife(ctx);
      ctx.restore();
    }
    // Knives remaining.
    for (let i = 0; i < this.left; i++) text(ctx, '🔪', 30, H * 0.78 - i * 22, 16, '#fff', 400);
  }

  tap(): void {
    if (this.done || this.flying !== null) return;
    this.flying = 0;
    this.sound = 'throw';
  }
}

function knife(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#e9eef6';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(0, -46);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(-5, 0, 10, 26);
}

// ------------------------------------------------------------------ rice rhythm

class RiceRhythm implements MiniGame {
  id = 'rhythm' as const;
  done = false;
  won = false;
  score = 0;
  status = '';
  sound: string | null = null;
  private t = -1.2; // count-in
  private notes: { at: number; hit: '' | 'perfect' | 'good' | 'miss' }[] = [];
  private flash: { text: string; t: number } | null = null;
  private readonly beat = 60 / 112;
  private readonly fall = 1.6; // seconds a note takes to reach the ring

  constructor() {
    // 24 notes on a simple syncopated pattern.
    const pattern = [0, 1, 2, 2.5, 3, 4, 5, 5.5, 6, 7, 8, 9, 9.5, 10, 11, 11.5, 12, 13, 14, 14.5, 15, 16, 17, 18];
    this.notes = pattern.map((b) => ({ at: 1 + b * this.beat, hit: '' }));
  }

  update(dt: number): void {
    this.t += dt;
    for (const n of this.notes) if (!n.hit && this.t - n.at > 0.18) { n.hit = 'miss'; this.flash = { text: 'MISS', t: 0.4 }; }
    if (this.flash && (this.flash.t -= dt) <= 0) this.flash = null;
    const hits = this.notes.filter((n) => n.hit === 'perfect' || n.hit === 'good').length;
    this.score = this.notes.reduce((a, n) => a + (n.hit === 'perfect' ? 2 : n.hit === 'good' ? 1 : 0), 0);
    this.status = `🍙 ${hits}/${this.notes.length}`;
    if (!this.done && this.notes.every((n) => n.hit)) {
      this.done = true;
      this.won = hits >= Math.ceil(this.notes.length * 0.7);
      this.sound = this.won ? 'win' : 'fail';
    }
  }

  draw(ctx: CanvasRenderingContext2D, W: number, H: number, time: number): void {
    const cx = W / 2;
    const ringY = H * 0.72;
    const topY = H * 0.12;
    // Lane.
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(cx - 50, topY, 100, ringY - topY + 60);
    // Beat pulse on the ring.
    const pulse = 1 + 0.08 * Math.max(0, Math.cos(((this.t - 1) / this.beat) * Math.PI * 2));
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, ringY, 34 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    for (const n of this.notes) {
      if (n.hit && n.hit !== 'miss') continue;
      const k = 1 - (n.at - this.t) / this.fall;
      if (k < 0 || k > 1.25) continue;
      const y = topY + (ringY - topY) * k;
      ctx.globalAlpha = n.hit === 'miss' ? 0.3 : 1;
      text(ctx, '🍙', cx, y, 36, '#fff', 400);
      ctx.globalAlpha = 1;
    }
    if (this.t < 1) text(ctx, this.t < 0 ? 'READY…' : 'GO!', cx, H * 0.45, 32, '#ffd34d');
    if (this.flash) text(ctx, this.flash.text, cx, ringY - 70, 26, this.flash.text === 'PERFECT' ? '#ffd34d' : this.flash.text === 'GOOD' ? '#8fdc93' : '#ff9a8a');
    // Little drummer chef.
    text(ctx, '🥁', cx + 110, ringY, 34 + 4 * Math.max(0, Math.cos(time * 10)), '#fff', 400);
  }

  tap(): void {
    if (this.done) return;
    const next = this.notes.find((n) => !n.hit);
    if (!next) return;
    const d = Math.abs(this.t - next.at);
    if (d <= 0.07) { next.hit = 'perfect'; this.flash = { text: 'PERFECT', t: 0.4 }; this.sound = 'perfect'; }
    else if (d <= 0.16) { next.hit = 'good'; this.flash = { text: 'GOOD', t: 0.4 }; this.sound = 'hit'; }
    else if (next.at - this.t < 0.35) { next.hit = 'miss'; this.flash = { text: 'MISS', t: 0.4 }; this.sound = 'miss'; }
  }
}

// ------------------------------------------------------------------ fish catch

class FishCatch implements MiniGame {
  id = 'fish' as const;
  done = false;
  won = false;
  score = 0;
  status = '';
  sound: string | null = null;
  private lane = 1;
  private x = 1; // smoothed lane position
  private items: { lane: number; y: number; kind: 'fish' | 'gold' | 'boot' }[] = [];
  private spawn = 0;
  private lives = 3;
  private time = 30;
  private seed = 1;

  private rnd(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  update(dt: number): void {
    if (this.done) return;
    this.time -= dt;
    this.x += (this.lane - this.x) * Math.min(1, dt * 14);
    const speed = 220 + (30 - this.time) * 9;
    if ((this.spawn -= dt) <= 0) {
      this.spawn = Math.max(0.35, 0.8 - (30 - this.time) * 0.015);
      const r = this.rnd();
      this.items.push({ lane: Math.floor(this.rnd() * 3), y: -30, kind: r < 0.22 ? 'boot' : r < 0.3 ? 'gold' : 'fish' });
    }
    for (const it of this.items) it.y += speed * dt;
    // Catch at the basket line (normalised y 0-1000 world; basket at 760).
    for (const it of this.items) {
      if (it.y > 720 && it.y < 790 && it.lane === this.lane) {
        it.y = 2000;
        if (it.kind === 'boot') { this.lives--; this.sound = 'miss'; }
        else { this.score += it.kind === 'gold' ? 3 : 1; this.sound = 'hit'; }
      }
    }
    this.items = this.items.filter((it) => it.y < 900);
    this.status = `🐟 ${this.score}/15 · ${'❤️'.repeat(Math.max(0, this.lives))} · ${Math.ceil(Math.max(0, this.time))}s`;
    if (this.lives <= 0 || this.time <= 0) {
      this.done = true;
      this.won = this.score >= 15 && this.lives > 0;
      this.sound = this.won ? 'win' : 'fail';
    }
  }

  draw(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const laneX = (l: number) => W / 2 + (l - 1) * 110;
    const sy = (y: number) => H * 0.1 + (y / 1000) * H * 0.85;
    // Sea backdrop lanes.
    for (let l = 0; l < 3; l++) {
      ctx.fillStyle = l % 2 ? 'rgba(80,180,255,0.10)' : 'rgba(80,180,255,0.05)';
      ctx.fillRect(laneX(l) - 55, H * 0.1, 110, H * 0.85);
    }
    for (const it of this.items) text(ctx, it.kind === 'boot' ? '🥾' : it.kind === 'gold' ? '🐠' : '🐟', laneX(it.lane), sy(it.y), 34, '#fff', 400);
    // Basket.
    const bx = W / 2 + (this.x - 1) * 110;
    text(ctx, '🧺', bx, sy(760), 52, '#fff', 400);
    text(ctx, '◀  tap  ▶', W / 2, H * 0.96, 13, 'rgba(255,255,255,0.6)', 600);
  }

  tap(x: number, _y: number, W = 400): void {
    if (this.done) return;
    this.lane = Math.max(0, Math.min(2, this.lane + (x < W / 2 ? -1 : 1)));
  }
}

export function makeMini(id: MiniId, seed = Date.now()): MiniGame {
  if (id === 'knife') return new KnifeThrow();
  if (id === 'rhythm') return new RiceRhythm();
  const g = new FishCatch();
  (g as unknown as { seed: number }).seed = (seed % 2147483646) + 1;
  return g;
}
