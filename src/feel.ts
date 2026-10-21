// The game's signature feel: landmarks to beat as the tower grows, the climb from the street up
// into space, ingredient combos, and how every ingredient sounds and feels when it lands.

import type { Ingredient } from './shop';

// ================================================================ landmarks

/** One layer counts as one metre of "Sushi Stack height" (it's a very big roll). */
export const METERS_PER_LAYER = 1;

export interface Landmark { name: string; emoji: string; m: number }

/** Real heights in metres, rounded. */
export const LANDMARKS: Landmark[] = [
  { name: 'a giraffe', emoji: '🦒', m: 6 },
  { name: 'the Great Buddha of Kamakura', emoji: '🧘', m: 13 },
  { name: 'the Great Torii of Miyajima', emoji: '⛩️', m: 16 },
  { name: 'a blue whale standing on its tail', emoji: '🐋', m: 30 },
  { name: 'the Leaning Tower of Pisa', emoji: '🇮🇹', m: 56 },
  { name: 'the Galata Tower', emoji: '🇹🇷', m: 63 },
  { name: 'the Statue of Liberty', emoji: '🗽', m: 93 },
  { name: 'Big Ben', emoji: '🇬🇧', m: 96 },
  { name: 'the Great Pyramid of Giza', emoji: '🔺', m: 139 },
  { name: 'the Eiffel Tower', emoji: '🗼', m: 330 },
  { name: 'Tokyo Tower', emoji: '🗼', m: 333 },
  { name: 'Tokyo Skytree', emoji: '📡', m: 634 },
  { name: 'the Burj Khalifa', emoji: '🏙️', m: 828 },
  { name: 'Mount Fuji', emoji: '🗻', m: 3776 },
];

/** The tallest landmark this many layers beats, and the next one to aim for. */
export function landmarkFor(layers: number): { beat: Landmark | null; next: Landmark | null } {
  const m = layers * METERS_PER_LAYER;
  let beat: Landmark | null = null;
  for (const l of LANDMARKS) if (m > l.m) beat = l;
  return { beat, next: LANDMARKS.find((l) => l.m >= m) ?? null };
}

// ================================================================ the climb into the sky

export interface SkyZone { from: number; name: string }

/** Altitude bands (in layers): the backdrop changes as the tower rises. */
export const SKY_ZONES: SkyZone[] = [
  { from: 0, name: 'Street' },
  { from: 25, name: 'Rooftops' },
  { from: 60, name: 'Clouds' },
  { from: 100, name: 'Jet stream' },
  { from: 160, name: 'Edge of space' },
  { from: 230, name: 'The Moon' },
];

export function skyZone(alt: number): SkyZone {
  let z = SKY_ZONES[0];
  for (const s of SKY_ZONES) if (alt >= s.from) z = s;
  return z;
}

function band(alt: number, from: number, to: number, fade = 12): number {
  return Math.max(0, Math.min(1, (alt - from) / fade, (to - alt) / fade));
}

/**
 * Draws the climb over the scene's backdrop: rooftops below you, then clouds, planes and birds,
 * then the sky darkens into space with stars, the Moon and finally the Earth's curve.
 * `alt` is the height in layers; `scroll` moves things past as the camera climbs.
 */
export function drawSky(ctx: CanvasRenderingContext2D, alt: number, t: number, x: number, w: number, h: number, scroll: number, reduced: boolean): void {
  if (alt < 18) return;
  ctx.save();
  // Darkening towards space.
  const space = Math.max(0, Math.min(1, (alt - 140) / 90));
  if (space > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(5,6,26,${space})`);
    g.addColorStop(1, `rgba(20,24,70,${space * 0.85})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, h);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      const sx = x + ((i * 97.3) % w);
      const sy = ((i * 57.1 + scroll * 0.05) % h + h) % h;
      ctx.globalAlpha = space * (0.4 + 0.6 * Math.abs(Math.sin(t * (reduced ? 0 : 1.3) + i)));
      ctx.fillRect(sx, sy, i % 9 === 0 ? 2 : 1.2, i % 9 === 0 ? 2 : 1.2);
    }
    ctx.globalAlpha = 1;
  }
  // Rooftops slide away below as you rise.
  const roofs = band(alt, 18, 75);
  if (roofs > 0) {
    ctx.globalAlpha = roofs * 0.55;
    const base = h - ((alt - 18) * 6) % (h * 1.6) + h * 0.35;
    for (let i = 0; i < 9; i++) {
      const bw = w / 7;
      const bh = 40 + ((i * 37) % 60);
      const bx = x + i * bw - bw / 2;
      ctx.fillStyle = i % 2 ? '#2b2440' : '#3a2f55';
      ctx.fillRect(bx, base - bh, bw - 4, bh + 400);
      ctx.fillStyle = 'rgba(255,211,77,0.7)';
      for (let k = 0; k < 4; k++) if ((i + k) % 3) ctx.fillRect(bx + 6 + (k % 2) * 16, base - bh + 10 + Math.floor(k / 2) * 18, 6, 8);
      if (i === 4) {
        // A water tank on one roof.
        ctx.fillStyle = '#4a3d6a';
        ctx.fillRect(bx + 14, base - bh - 18, 22, 18);
      }
    }
    ctx.globalAlpha = 1;
  }
  // Clouds drifting past.
  const clouds = band(alt, 50, 175, 18);
  if (clouds > 0) {
    for (let i = 0; i < 7; i++) {
      const cx = x + (((i * 131 + t * (reduced ? 0 : 6 + i * 2)) % (w + 160)) - 80);
      const cy = ((i * 173 + scroll * 0.35) % (h + 120) + h + 120) % (h + 120) - 60;
      ctx.globalAlpha = clouds * (0.55 + (i % 3) * 0.12);
      ctx.fillStyle = '#ffffff';
      for (const [dx, dy, r] of [[0, 0, 22], [20, -8, 18], [40, 0, 20], [18, 6, 20]]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, r * (0.8 + (i % 2) * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  // A plane and a flock of birds in the jet stream.
  const jets = band(alt, 90, 190, 14);
  if (jets > 0) {
    ctx.globalAlpha = jets;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const px = x + ((t * (reduced ? 0 : 40)) % (w + 120)) - 60;
    ctx.fillText('✈️', px, h * 0.22);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 16, h * 0.22 + 4);
    ctx.lineTo(px - 120, h * 0.22 + 6);
    ctx.stroke();
    ctx.font = '13px sans-serif';
    for (let i = 0; i < 5; i++) ctx.fillText('🐦', x + w - ((t * (reduced ? 0 : 25) + i * 22) % (w + 100)), h * 0.4 + Math.sin(t * 3 + i) * 4 + (i % 2) * 10);
    ctx.globalAlpha = 1;
  }
  // The Moon, then the Earth's curve far below.
  if (alt > 200) {
    const mo = Math.min(1, (alt - 200) / 30);
    ctx.globalAlpha = mo;
    const mx = x + w * 0.78;
    const my = h * 0.2;
    const mg = ctx.createRadialGradient(mx, my, 4, mx, my, 70);
    mg.addColorStop(0, 'rgba(255,250,220,0.5)');
    mg.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(mx - 70, my - 70, 140, 140);
    ctx.fillStyle = '#f4f1de';
    ctx.beginPath();
    ctx.arc(mx, my, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(180,170,150,0.6)';
    for (const [dx, dy, r] of [[-8, -6, 5], [7, 4, 4], [-2, 10, 3]]) {
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (alt > 260) {
    const e = Math.min(1, (alt - 260) / 40);
    ctx.globalAlpha = e;
    const eg = ctx.createRadialGradient(x + w / 2, h + 900, 900, x + w / 2, h + 900, 960);
    eg.addColorStop(0, '#2a6fdb');
    eg.addColorStop(0.92, '#4cc9f0');
    eg.addColorStop(1, 'rgba(76,201,240,0)');
    ctx.fillStyle = eg;
    ctx.fillRect(x, h - 80, w, 80);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ================================================================ ingredient combos

export type ComboEffect = 'coins' | 'slow' | 'shield' | 'regrow' | 'combo';

export interface Combo { a: Ingredient; b: Ingredient; name: string; emoji: string; effect: ComboEffect; desc: string }

/** Two PERFECTs in a row on these ingredients set off a combo. */
export const COMBOS: Combo[] = [
  { a: 'nori', b: 'salmon', name: 'Ocean Fold', emoji: '🌊', effect: 'slow', desc: 'the next 2 layers slide slowly' },
  { a: 'tuna', b: 'avocado', name: 'Sunrise', emoji: '🌅', effect: 'coins', desc: '+6 coins' },
  { a: 'egg', b: 'nori', name: 'Tamago Wrap', emoji: '🍳', effect: 'shield', desc: 'blocks the next chef attack' },
  { a: 'cucumber', b: 'avocado', name: 'Green Breeze', emoji: '🍃', effect: 'regrow', desc: 'the roll grows wider' },
  { a: 'avocado', b: 'cucumber', name: 'Garden Twist', emoji: '🥗', effect: 'regrow', desc: 'the roll grows wider' },
  { a: 'ebi', b: 'avocado', name: 'Tempura Crunch', emoji: '🍤', effect: 'combo', desc: '+2 to your combo' },
  { a: 'unagi', b: 'avocado', name: 'Dragon Breath', emoji: '🐉', effect: 'coins', desc: '+6 coins' },
  { a: 'nori', b: 'ikura', name: 'Pearl Boat', emoji: '🔴', effect: 'shield', desc: 'blocks the next chef attack' },
  { a: 'tofu', b: 'egg', name: 'Golden Pillow', emoji: '🟨', effect: 'slow', desc: 'the next 2 layers slide slowly' },
  { a: 'sauce', b: 'cheese', name: 'Melt', emoji: '🧀', effect: 'regrow', desc: 'the pizza grows wider' },
  { a: 'patty', b: 'cheddar', name: 'Juicy Stack', emoji: '🍔', effect: 'coins', desc: '+6 coins' },
  { a: 'butter', b: 'pancake', name: 'Drizzle', emoji: '🍯', effect: 'slow', desc: 'the next 2 layers slide slowly' },
  { a: 'lavash', b: 'doner', name: 'Döner Spin', emoji: '🥙', effect: 'combo', desc: '+2 to your combo' },
  { a: 'yufka', b: 'pistachio', name: 'Baklava Crunch', emoji: '💚', effect: 'coins', desc: '+6 coins' },
];

export function comboFor(a: Ingredient, b: Ingredient): Combo | undefined {
  return COMBOS.find((c) => c.a === a && c.b === b);
}

// ================================================================ how each ingredient lands

export type Haptic = 'soft' | 'firm' | 'crisp' | 'pop' | 'slide' | 'wobble' | 'crunch' | 'squish';

export interface Feel { haptic: Haptic; thud: number; hiss: number; q: number; extra?: 'pop' | 'crisp' | 'slide' | 'wobble' | 'sizzle' | 'squish' }

/** Sound (thud pitch, hiss band) and touch for every ingredient. */
export const FEEL: Record<Ingredient, Feel> = {
  rice: { haptic: 'soft', thud: 130, hiss: 380, q: 0.7 },
  nori: { haptic: 'crisp', thud: 190, hiss: 2600, q: 1.4, extra: 'crisp' },
  salmon: { haptic: 'squish', thud: 150, hiss: 700, q: 0.9, extra: 'squish' },
  tuna: { haptic: 'firm', thud: 110, hiss: 600, q: 1 },
  avocado: { haptic: 'squish', thud: 160, hiss: 500, q: 0.8, extra: 'squish' },
  cucumber: { haptic: 'crisp', thud: 210, hiss: 3200, q: 1.6, extra: 'crisp' },
  egg: { haptic: 'soft', thud: 170, hiss: 450, q: 0.8 },
  ebi: { haptic: 'crunch', thud: 180, hiss: 2200, q: 1.2, extra: 'crisp' },
  unagi: { haptic: 'slide', thud: 120, hiss: 800, q: 0.9, extra: 'slide' },
  tofu: { haptic: 'wobble', thud: 140, hiss: 420, q: 0.7, extra: 'wobble' },
  ikura: { haptic: 'pop', thud: 220, hiss: 1500, q: 2, extra: 'pop' },
  dough: { haptic: 'soft', thud: 120, hiss: 350, q: 0.7 },
  sauce: { haptic: 'squish', thud: 140, hiss: 600, q: 0.8, extra: 'squish' },
  cheese: { haptic: 'squish', thud: 150, hiss: 550, q: 0.8, extra: 'squish' },
  pepperoni: { haptic: 'firm', thud: 160, hiss: 900, q: 1, extra: 'sizzle' },
  basil: { haptic: 'crisp', thud: 220, hiss: 2800, q: 1.5, extra: 'crisp' },
  bun: { haptic: 'soft', thud: 125, hiss: 400, q: 0.7 },
  patty: { haptic: 'firm', thud: 100, hiss: 900, q: 1, extra: 'sizzle' },
  lettuce: { haptic: 'crisp', thud: 210, hiss: 3000, q: 1.5, extra: 'crisp' },
  tomato: { haptic: 'squish', thud: 160, hiss: 650, q: 0.9, extra: 'squish' },
  cheddar: { haptic: 'squish', thud: 150, hiss: 550, q: 0.8 },
  pancake: { haptic: 'soft', thud: 125, hiss: 380, q: 0.7 },
  butter: { haptic: 'slide', thud: 170, hiss: 500, q: 0.8, extra: 'slide' },
  syrup: { haptic: 'slide', thud: 140, hiss: 450, q: 0.7, extra: 'slide' },
  berry: { haptic: 'pop', thud: 230, hiss: 1400, q: 1.8, extra: 'pop' },
  cream: { haptic: 'soft', thud: 160, hiss: 400, q: 0.6, extra: 'squish' },
  lavash: { haptic: 'soft', thud: 135, hiss: 420, q: 0.7 },
  doner: { haptic: 'firm', thud: 105, hiss: 950, q: 1, extra: 'sizzle' },
  onion: { haptic: 'crisp', thud: 200, hiss: 2400, q: 1.4, extra: 'crisp' },
  yufka: { haptic: 'crisp', thud: 190, hiss: 2000, q: 1.2, extra: 'crisp' },
  pistachio: { haptic: 'crunch', thud: 210, hiss: 1800, q: 1.3, extra: 'crisp' },
  mince: { haptic: 'squish', thud: 115, hiss: 800, q: 0.9, extra: 'sizzle' },
};
