// Boss chefs: one per level (one level = one order). Each watches the sliding layer, points at it,
// and gets more worked up the closer the player is to finishing the order.

export type Hair = 'short' | 'bun' | 'bob' | 'bald' | 'spiky' | 'ponytail' | 'twinbuns' | 'gray';
export type Hat = 'hachimaki' | 'cap' | 'toque' | 'bandana' | 'none' | 'shades' | 'gold';
export type Face = 'none' | 'mustache' | 'beard' | 'glasses' | 'elder';
export type Attack = 'knife' | 'slam' | 'splat';
export type Help = 'slow' | 'patch' | 'tip';
export type Holding = 'knife' | 'fist' | 'patty' | null;

export interface Chef {
  name: string;
  rule: string; // shown when the level starts
  speed: number; // multiplier on layer speed
  wobble: boolean; // layer speed surges and eases
  tight: boolean; // smaller perfect window
  extra: number; // extra layers in the order
  kind: number; // how often they help (0-1)
  mean: number; // chance per drop that they attack
  attacks: Attack[];
  skin: string;
  hairColor: string;
  outfit: string;
  accent: string;
  hair: Hair;
  hat: Hat;
  face: Face;
  intro: string;
  beaten: string;
  gloat: string;
}

export const CHEFS: Chef[] = [
  { name: 'Chef Kenji', rule: 'Warm-up round', speed: 1, wobble: false, tight: false, extra: 0, kind: 0.5, mean: 0.05, attacks: ['slam'], skin: '#f1c9a5', hairColor: '#1d1a1a', outfit: '#f4f1ea', accent: '#d7263d', hair: 'short', hat: 'hachimaki', face: 'none', intro: 'Show me your rolls!', beaten: 'Not bad, rookie!', gloat: 'Back to rice school!' },
  { name: 'Chef Hana', rule: 'Quick hands: faster layers', speed: 1.1, wobble: false, tight: false, extra: 0, kind: 0.6, mean: 0.12, attacks: ['knife'], skin: '#f5d0b0', hairColor: '#2b1b17', outfit: '#f7b2c8', accent: '#c2185b', hair: 'bun', hat: 'none', face: 'none', intro: 'Keep up with me!', beaten: 'So fast! Well done!', gloat: 'Too slow, too slow!' },
  { name: 'Chef Taro', rule: 'Precise: smaller PERFECT zone', speed: 1, wobble: false, tight: true, extra: 0, kind: 0.3, mean: 0.15, attacks: ['slam', 'splat'], skin: '#e8b98f', hairColor: '#222', outfit: '#ffffff', accent: '#3d6fb6', hair: 'short', hat: 'cap', face: 'glasses', intro: 'Every millimetre counts.', beaten: 'Precise. I approve.', gloat: 'Sloppy cutting!' },
  { name: 'Chef Mei', rule: 'Big order: 2 extra layers', speed: 1.05, wobble: false, tight: false, extra: 2, kind: 0.6, mean: 0.1, attacks: ['splat'], skin: '#efc29a', hairColor: '#3a2418', outfit: '#9ad1d4', accent: '#1d6fa3', hair: 'bob', hat: 'bandana', face: 'none', intro: 'Table of twelve tonight!', beaten: 'The table is happy!', gloat: 'The customers are waiting!' },
  { name: 'Chef Goro', rule: 'Heavy hitter: much faster', speed: 1.2, wobble: false, tight: false, extra: 0, kind: 0.2, mean: 0.25, attacks: ['slam', 'knife'], skin: '#d9a77c', hairColor: '#1a1a1a', outfit: '#2d2d2d', accent: '#f2b705', hair: 'bald', hat: 'hachimaki', face: 'beard', intro: 'HAAA! Stack it!', beaten: 'You have strong hands!', gloat: 'HA! Weak!' },
  { name: 'Chef Yuki', rule: 'Tricky: speed surges', speed: 1.1, wobble: true, tight: false, extra: 0, kind: 0.4, mean: 0.2, attacks: ['knife', 'splat'], skin: '#f5d6bd', hairColor: '#111', outfit: '#e9eef6', accent: '#6c8ebf', hair: 'ponytail', hat: 'toque', face: 'none', intro: 'Can you read my rhythm?', beaten: 'You found the rhythm!', gloat: 'Lost the beat, huh?' },
  { name: 'Chef Ryu', rule: 'Neon speed: very fast', speed: 1.3, wobble: false, tight: false, extra: 0, kind: 0.25, mean: 0.25, attacks: ['knife', 'splat'], skin: '#ecc19b', hairColor: '#231c3a', outfit: '#26104a', accent: '#ff3fa4', hair: 'spiky', hat: 'shades', face: 'none', intro: 'Let’s turn it up!', beaten: 'Respect. You’re fast.', gloat: 'Too slow for Tokyo!' },
  { name: 'Chef Aiko', rule: 'Perfectionist: tight + long', speed: 1.1, wobble: false, tight: true, extra: 2, kind: 0.5, mean: 0.2, attacks: ['slam', 'splat'], skin: '#f3cba8', hairColor: '#4a2a1a', outfit: '#ffe08a', accent: '#e76f51', hair: 'twinbuns', hat: 'none', face: 'none', intro: 'Only perfect will do!', beaten: 'Kawaii! Perfect roll!', gloat: 'Not cute enough!' },
  { name: 'Master Sato', rule: 'Old master: fast surges', speed: 1.3, wobble: true, tight: false, extra: 0, kind: 0.4, mean: 0.25, attacks: ['knife', 'slam'], skin: '#e6b48c', hairColor: '#d8d8d8', outfit: '#5b3b2e', accent: '#c9a227', hair: 'gray', hat: 'cap', face: 'elder', intro: 'Fifty years I have waited...', beaten: 'The student surpasses me.', gloat: 'Patience, young one.' },
  { name: 'Grand Chef Kaito', rule: 'Final boss: everything', speed: 1.4, wobble: true, tight: true, extra: 1, kind: 0.2, mean: 0.3, attacks: ['knife', 'slam', 'splat'], skin: '#eec39d', hairColor: '#111', outfit: '#1a1208', accent: '#d4a537', hair: 'short', hat: 'gold', face: 'mustache', intro: 'Face the Golden Knife!', beaten: 'A new Grand Chef is born!', gloat: 'Bow to the Golden Knife!' },
];

export type Mood = 'calm' | 'focused' | 'intense' | 'panic' | 'happy' | 'impressed' | 'wince' | 'angry' | 'shock';

/**
 * Draws a chef bust with its head centred at (x, y). (lookX, lookY) is the point the chef watches and points at.
 */
export function drawChef(ctx: CanvasRenderingContext2D, c: Chef, x: number, y: number, s: number, mood: Mood, lookX: number, lookY: number, time: number, holding: Holding = null): void {
  ctx.save();
  const shaking = mood === 'panic' || mood === 'angry';
  ctx.translate(x + (shaking ? Math.sin(time * 45) * 1.5 * s : 0), y + Math.sin(time * 2) * 1.5 * s);
  ctx.scale(s, s);
  const lx = (lookX - x) / s;
  const ly = (lookY - y) / s;

  // Pointing arm, behind the body on the side facing the target.
  const side = lx >= 0 ? 1 : -1;
  const sx = side * 26;
  const sy = 40;
  // Winding up an attack or a throw raises the arm; otherwise it points at the target.
  const ang = holding ? -Math.PI / 2 + side * 0.45 + Math.sin(time * 18) * 0.06 : Math.atan2(ly - sy, lx - sx);
  const reach = 34;
  const hx = sx + Math.cos(ang) * reach;
  const hy = sy + Math.sin(ang) * reach;
  ctx.lineCap = 'round';
  ctx.strokeStyle = c.outfit;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(hx, hy, 6, 0, Math.PI * 2);
  ctx.fill();
  if (holding === 'knife') {
    drawKnife(ctx, hx, hy - 12, -Math.PI / 2 + side * 0.2, 1.2);
  } else if (holding === 'patty') {
    ctx.fillStyle = '#f6f1e4';
    ctx.beginPath();
    ctx.arc(hx, hy - 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#24321f';
    ctx.fillRect(hx - 10, hy - 6, 20, 6);
  } else if (holding === 'fist') {
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(hx, hy - 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.strokeStyle = c.skin;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(ang) * 9, hy + Math.sin(ang) * 9);
    ctx.stroke();
  }

  // Back hair (long styles sit behind the head).
  ctx.fillStyle = c.hairColor;
  if (c.hair === 'bob') {
    ctx.beginPath();
    ctx.ellipse(0, 2, 31, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (c.hair === 'ponytail') {
    ctx.beginPath();
    ctx.ellipse(-side * 30, 10, 8, 20, -side * 0.4 + Math.sin(time * 3) * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torso with a crossed white collar.
  ctx.fillStyle = c.outfit;
  roundRect(ctx, -32, 24, 64, 46, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-12, 24);
  ctx.lineTo(4, 50);
  ctx.lineTo(10, 44);
  ctx.lineTo(-2, 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.accent;
  ctx.fillRect(-32, 58, 64, 5);

  // Neck, ears, head.
  ctx.fillStyle = shade(c.skin, -0.08);
  ctx.fillRect(-7, 16, 14, 12);
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(-26, 2, 5, 0, Math.PI * 2);
  ctx.arc(26, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  if (mood === 'angry') {
    ctx.fillStyle = 'rgba(230,40,40,0.28)';
    ctx.fill();
  }

  // Front hair.
  ctx.fillStyle = c.hairColor;
  switch (c.hair) {
    case 'short':
    case 'gray':
    case 'bun':
    case 'ponytail':
    case 'twinbuns':
    case 'bob':
      ctx.beginPath();
      ctx.arc(0, -2, 26.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.quadraticCurveTo(10, -14, -2, -12);
      ctx.quadraticCurveTo(-14, -10, -25, -6);
      ctx.fill();
      break;
    case 'spiky':
      ctx.beginPath();
      ctx.moveTo(-26, -4);
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI * (1.05 + i * 0.15);
        ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26 - 2);
        ctx.lineTo(Math.cos(a + 0.075) * 38, Math.sin(a + 0.075) * 38 - 2);
      }
      ctx.lineTo(26, -4);
      ctx.quadraticCurveTo(0, -14, -26, -4);
      ctx.fill();
      break;
    case 'bald':
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(-8, -16, 6, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.fillStyle = c.hairColor;
  if (c.hair === 'bun') {
    ctx.beginPath();
    ctx.arc(0, -30, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-14, -40);
    ctx.lineTo(10, -24);
    ctx.moveTo(-10, -42);
    ctx.lineTo(14, -28);
    ctx.stroke();
  }
  if (c.hair === 'twinbuns') {
    ctx.beginPath();
    ctx.arc(-20, -22, 9, 0, Math.PI * 2);
    ctx.arc(20, -22, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Headwear.
  switch (c.hat) {
    case 'hachimaki':
    case 'gold': {
      const col = c.hat === 'gold' ? '#d4a537' : c.accent;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-26, -13);
      ctx.quadraticCurveTo(0, -19, 26, -13);
      ctx.lineTo(26, -6);
      ctx.quadraticCurveTo(0, -12, -26, -6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(24, -10);
      ctx.lineTo(36, -18 + Math.sin(time * 5) * 2);
      ctx.lineTo(34, -8);
      ctx.lineTo(38, 0 + Math.sin(time * 5 + 1) * 2);
      ctx.closePath();
      ctx.fill();
      if (c.hat === 'gold') {
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.arc(0, -12, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'cap':
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, -22, -38, 44, 24, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = c.accent;
      ctx.fillRect(-22, -20, 44, 4);
      break;
    case 'toque':
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, -20, -36, 40, 20, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-14, -44, 13, 0, Math.PI * 2);
      ctx.arc(0, -52, 15, 0, Math.PI * 2);
      ctx.arc(14, -44, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case 'bandana':
      ctx.fillStyle = c.accent;
      ctx.beginPath();
      ctx.moveTo(-27, -6);
      ctx.quadraticCurveTo(0, -46, 27, -6);
      ctx.quadraticCurveTo(0, -16, -27, -6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-12 + i * 8, -20 - (i % 2) * 5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'shades':
      ctx.fillStyle = '#111';
      roundRect(ctx, -20, -22, 17, 8, 3);
      ctx.fill();
      roundRect(ctx, 3, -22, 17, 8, 3);
      ctx.fill();
      ctx.fillStyle = c.accent;
      ctx.fillRect(-4, -19, 8, 2);
      break;
    case 'none':
      break;
  }

  drawFace(ctx, c, mood, lx, ly, time);
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, c: Chef, mood: Mood, lx: number, ly: number, time: number): void {
  const level = { calm: 0, focused: 1, intense: 2, panic: 3 }[mood as 'calm'] ?? 1;
  // Eyes grow as the chef gets more worked up.
  let er = { calm: 4.5, focused: 5, intense: 6.5, panic: 8.5, happy: 5, impressed: 6, wince: 4, angry: 4.5, shock: 9 }[mood];
  const eyeY = -1;
  const len = Math.hypot(lx, ly - eyeY) || 1;
  const px = (lx / len) * er * 0.45;
  const py = ((ly - eyeY) / len) * er * 0.45;
  const blink = mood === 'calm' && Math.sin(time * 1.3) > 0.985;

  for (const ex of [-10, 10]) {
    if (mood === 'happy' || blink) {
      ctx.strokeStyle = '#2a1a1a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (blink) {
        ctx.moveTo(ex - 4, eyeY);
        ctx.lineTo(ex + 4, eyeY);
      } else {
        ctx.arc(ex, eyeY + 2, 4.5, Math.PI * 1.15, Math.PI * 1.85);
      }
      ctx.stroke();
      continue;
    }
    if (mood === 'wince') {
      ctx.strokeStyle = '#2a1a1a';
      ctx.lineWidth = 2.2;
      const d = ex < 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(ex - 4 * d, eyeY - 3);
      ctx.lineTo(ex + 3 * d, eyeY);
      ctx.lineTo(ex - 4 * d, eyeY + 3);
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (mood === 'angry') ctx.ellipse(ex, eyeY + 1, er, er * 0.55, 0, 0, Math.PI * 2);
    else ctx.arc(ex, eyeY, er, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (mood === 'impressed') {
      star(ctx, ex, eyeY, er * 0.85, '#f2b705');
      continue;
    }
    const pr = mood === 'shock' ? 2 : mood === 'panic' ? 2.6 : er * 0.55;
    ctx.fillStyle = mood === 'angry' ? '#7a1010' : '#2a1a1a';
    ctx.beginPath();
    ctx.arc(ex + px, eyeY + py * (mood === 'angry' ? 0.4 : 1), pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex + px - pr * 0.35, eyeY + py - pr * 0.35, pr * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glasses sit over the eyes.
  if (c.face === 'glasses') {
    er = Math.max(er, 6);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-10, eyeY, er + 2.5, 0, Math.PI * 2);
    ctx.moveTo(10 + er + 2.5, eyeY);
    ctx.arc(10, eyeY, er + 2.5, 0, Math.PI * 2);
    ctx.moveTo(-10 + er + 2.5, eyeY);
    ctx.lineTo(10 - er - 2.5, eyeY);
    ctx.stroke();
  }

  // Eyebrows: angle and height carry most of the expression.
  const browTilt = { calm: 0, focused: 0.25, intense: 0.35, panic: -0.35, happy: -0.15, impressed: -0.3, wince: 0.3, angry: 0.6, shock: -0.4 }[mood];
  const browLift = { calm: 0, focused: 1, intense: 0, panic: -4, happy: -2, impressed: -3, wince: 1, angry: 2, shock: -6 }[mood];
  ctx.strokeStyle = c.face === 'elder' ? '#f0f0f0' : c.hairColor === '#d8d8d8' ? '#bbb' : c.hairColor;
  ctx.lineWidth = c.face === 'elder' ? 4 : 2.8;
  for (const d of [-1, 1]) {
    const bx = d * 10;
    const by = eyeY - er - 5 + browLift;
    // The inner end tilts down when browTilt > 0 (stern) and up when < 0 (worried or surprised).
    const inner = { x: bx - d * 6, y: by + browTilt * 8 };
    const outer = { x: bx + d * 6, y: by - browTilt * 4 };
    ctx.beginPath();
    ctx.moveTo(inner.x, inner.y);
    ctx.lineTo(outer.x, outer.y);
    ctx.stroke();
    if (c.face === 'elder') {
      ctx.beginPath();
      ctx.moveTo(outer.x, outer.y);
      ctx.lineTo(outer.x + d * 5, outer.y + 5);
      ctx.stroke();
    }
  }

  // Cheeks.
  if (mood === 'happy' || mood === 'impressed' || level === 0) {
    ctx.fillStyle = 'rgba(255,120,130,0.35)';
    ctx.beginPath();
    ctx.ellipse(-17, 9, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(17, 9, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth.
  const my = 14;
  ctx.strokeStyle = '#5a1f1f';
  ctx.fillStyle = '#7a2a2a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  switch (mood) {
    case 'calm':
      ctx.arc(0, my - 4, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      break;
    case 'focused':
      ctx.moveTo(-5, my);
      ctx.lineTo(5, my);
      ctx.stroke();
      break;
    case 'intense':
      roundRect(ctx, -7, my - 3, 14, 6, 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.stroke();
      break;
    case 'panic':
      ctx.moveTo(-8, my);
      for (let i = 0; i < 4; i++) ctx.lineTo(-8 + (i + 0.5) * 4, my + (i % 2 ? 3 : -3));
      ctx.lineTo(8, my);
      ctx.stroke();
      break;
    case 'happy':
      ctx.moveTo(-9, my - 2);
      ctx.quadraticCurveTo(0, my + 12, 9, my - 2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'impressed':
    case 'shock':
      ctx.ellipse(0, my + 1, mood === 'shock' ? 5 : 3.5, mood === 'shock' ? 7 : 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'wince':
      ctx.moveTo(-7, my);
      ctx.lineTo(-3, my - 2);
      ctx.lineTo(1, my + 1);
      ctx.lineTo(5, my - 2);
      ctx.lineTo(7, my);
      ctx.stroke();
      break;
    case 'angry':
      ctx.arc(0, my + 6, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      break;
  }

  // Facial hair.
  ctx.fillStyle = c.face === 'elder' ? '#f0f0f0' : c.hairColor;
  if (c.face === 'mustache' || c.face === 'elder') {
    ctx.beginPath();
    ctx.moveTo(0, my - 6);
    ctx.quadraticCurveTo(-9, my - 8, -14, my - 2 + (c.face === 'elder' ? 8 : 0));
    ctx.quadraticCurveTo(-7, my - 3, 0, my - 3);
    ctx.quadraticCurveTo(7, my - 3, 14, my - 2 + (c.face === 'elder' ? 8 : 0));
    ctx.quadraticCurveTo(9, my - 8, 0, my - 6);
    ctx.fill();
  }
  if (c.face === 'beard') {
    ctx.beginPath();
    ctx.moveTo(-22, 6);
    ctx.quadraticCurveTo(-20, 32, 0, 34);
    ctx.quadraticCurveTo(20, 32, 22, 6);
    ctx.quadraticCurveTo(14, 20, 8, my + 5);
    ctx.lineTo(-8, my + 5);
    ctx.quadraticCurveTo(-14, 20, -22, 6);
    ctx.fill();
  }

  // Sweat when the pressure is on.
  if (mood === 'intense' || mood === 'panic' || mood === 'wince') {
    const dy = (time * 30) % 12;
    ctx.fillStyle = '#7fd3ff';
    ctx.beginPath();
    ctx.moveTo(23, -16 + dy);
    ctx.quadraticCurveTo(28, -8 + dy, 23, -6 + dy);
    ctx.quadraticCurveTo(18, -8 + dy, 23, -16 + dy);
    ctx.fill();
  }
  // Steam when angry.
  if (mood === 'angry') {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 3; i++) {
      const t = (time * 1.5 + i / 3) % 1;
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.arc((i - 1) * 16, -34 - t * 24, 4 + t * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** A chef's knife centred at (x, y), pointing along angle `a`. */
export function drawKnife(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(s, s);
  ctx.fillStyle = '#5a3a22';
  ctx.beginPath();
  ctx.moveTo(-18, -3);
  ctx.lineTo(-4, -3);
  ctx.lineTo(-4, 3);
  ctx.lineTo(-18, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(18, -2);
  ctx.lineTo(22, 1);
  ctx.lineTo(-4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a96a3';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, -3, 14, 1.2);
  ctx.restore();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Lightens (amt > 0) or darkens (amt < 0) a #rrggbb colour. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}
