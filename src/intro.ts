// The intro: a quick animated logo on every launch, and for brand-new players a three-panel story
// (the closed sushi bar, reopening it, the first rival) that flows straight into the first drop.
// Every part can be tapped through or skipped, and nothing lasts long.

import { drawChef, type Chef } from './chef';
import { FONT } from './font';

export const LOGO_TIME = 2.2; // the full logo animation
export const LOGO_SHORT = 1.3; // returning players see a shorter version
export const PANEL_TIME = 3.6; // each story panel advances on its own after this

const LAYERS: [string, string][] = [
  ['#f6f1e4', '#ffffff'], // rice
  ['#ff8a5b', '#ffe6d7'], // salmon
  ['#24321f', '#4a6a3a'], // nori
  ['#9bc53d', '#d9ed92'], // avocado
  ['#d7263d', '#ff9aa8'], // tuna
];

const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
const back = (k: number) => {
  const c = 1.70158;
  const x = Math.min(1, Math.max(0, k)) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Outlined, gradient-filled game title text (also used on the home screen). */
export function logoText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, top: string, bottom: string): void {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(s, x, y + size * 0.1);
  ctx.strokeStyle = '#2a1424';
  ctx.lineWidth = size * 0.18;
  ctx.strokeText(s, x, y);
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillText(s, x, y);
}

/**
 * The animated logo at time t: five sushi layers drop and stack with a squash, then the letters
 * pop in one by one, a shine sweeps across, and the tagline fades in.
 */
export function drawLogo(ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number, tagline: string, still = false): void {
  if (still) t = 99;
  // The stack icon.
  const lw = 132;
  const lh = 15;
  LAYERS.forEach(([fill, shine], i) => {
    const start = 0.12 + i * 0.13;
    const k = (t - start) / 0.22;
    if (k <= 0) return;
    const restY = cy - 60 - i * (lh + 1);
    const y = k < 1 ? restY - (1 - ease(k)) * 260 : restY;
    // Squash on landing.
    const land = t - start - 0.22;
    const sq = land > 0 && land < 0.18 ? Math.sin((land / 0.18) * Math.PI) * 0.18 : 0;
    const w = lw * (1 + sq) - i * 4;
    const h = lh * (1 - sq);
    const x = cx - w / 2 + (i % 2 ? 3 : -3) * (t > 1.2 ? 0 : 1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, x, y + 3, w, h, 5);
    ctx.fill();
    ctx.fillStyle = fill;
    rr(ctx, x, y + (lh - h), w, h, 5);
    ctx.fill();
    ctx.fillStyle = shine;
    ctx.globalAlpha = 0.6;
    rr(ctx, x + 6, y + (lh - h) + 2, w - 12, 3, 1.5);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  // A little flag on top once the stack is done.
  if (t > 0.95) {
    const k = back((t - 0.95) / 0.3);
    const fy = cy - 60 - 4 * (lh + 1) - 4;
    ctx.save();
    ctx.translate(cx, fy);
    ctx.scale(k, k);
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(-1.5, -26, 3, 26);
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.moveTo(1.5, -26);
    ctx.lineTo(22, -20 + Math.sin(t * 6) * 2);
    ctx.lineTo(1.5, -13);
    ctx.fill();
    ctx.restore();
  }
  // Letters pop in.
  const word = (w: string, y: number, size: number, top: string, bottom: string, t0: number) => {
    ctx.font = `700 ${size}px ${FONT}`;
    const total = ctx.measureText(w).width;
    let x = cx - total / 2;
    [...w].forEach((ch, i) => {
      const cw = ctx.measureText(ch).width;
      const k = (t - t0 - i * 0.05) / 0.28;
      if (k > 0) {
        const sc = back(k);
        ctx.save();
        ctx.translate(x + cw / 2, y + Math.sin(t * 2.4 + i * 0.6) * (t > 2 ? 2 : 0));
        ctx.scale(sc, sc);
        ctx.rotate((1 - Math.min(1, k)) * (i % 2 ? 0.4 : -0.4));
        logoText(ctx, ch, 0, 0, size, top, bottom);
        ctx.restore();
      }
      x += cw;
    });
    return total;
  };
  const w1 = word('SUSHI', cy + 4, 58, '#ffffff', '#ffe2c6', 0.85);
  const w2 = word('STACK', cy + 62, 58, '#ffb37a', '#ff5d3a', 1.1);
  // Shine sweep across the title.
  if (t > 1.5 && t < 2.3) {
    const k = (t - 1.5) / 0.8;
    const sx = cx - Math.max(w1, w2) / 2 - 40 + k * (Math.max(w1, w2) + 80);
    const g = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - 160, cy - 30, 320, 130);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.translate(sx, cy + 33);
    ctx.rotate(0.35);
    ctx.fillRect(-30, -90, 60, 180);
    ctx.restore();
  }
  // Tagline.
  if (t > 1.45 && tagline) {
    ctx.globalAlpha = Math.min(1, (t - 1.45) / 0.4);
    ctx.font = `600 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe2c6';
    ctx.fillText(tagline, cx, cy + 112);
    ctx.globalAlpha = 1;
  }
}

/** Sparkles that burst out as the logo finishes. */
export function logoSparkles(ctx: CanvasRenderingContext2D, t: number, cx: number, cy: number): void {
  if (t < 1.25 || t > 2.6) return;
  const k = (t - 1.25) / 1.35;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + i;
    const r = 60 + k * (110 + (i % 4) * 20);
    ctx.globalAlpha = Math.max(0, 1 - k);
    ctx.fillStyle = ['#ffd34d', '#ff8fb8', '#9fe3ff', '#ffffff'][i % 4];
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r, cy + 10 + Math.sin(a) * r * 0.7);
    ctx.rotate(t * 3 + i);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- story panels

export interface PanelOpts {
  ctx: CanvasRenderingContext2D;
  t: number; // seconds into this panel
  L: number; // left edge of the screen (world units)
  W: number; // screen width (world units)
  H: number; // screen height
  me: Chef;
  rival: Chef;
}

function emoji(ctx: CanvasRenderingContext2D, e: string, x: number, y: number, size: number): void {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(e, x, y);
}

/** Night street with the bar's front: shutter height 0-1, lights 0-1 (how many lanterns are lit). */
function facade(o: PanelOpts, shutter: number, lights: number, dawn: number): { doorX: number; doorY: number; doorW: number; doorH: number } {
  const { ctx, L, W, H, t } = o;
  const cx = 200;
  // Sky.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, dawn ? `rgb(${40 + 120 * dawn},${30 + 60 * dawn},${80 + 20 * dawn})` : '#0b1030');
  g.addColorStop(1, dawn ? `rgb(${120 + 135 * dawn},${80 + 100 * dawn},${110})` : '#2a2f6e');
  ctx.fillStyle = g;
  ctx.fillRect(L, 0, W, H);
  // Stars and moon.
  ctx.fillStyle = `rgba(255,255,255,${0.8 - dawn * 0.6})`;
  for (let i = 0; i < 40; i++) {
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
    ctx.globalAlpha = tw * (1 - dawn * 0.7);
    ctx.fillRect(L + ((i * 97) % W), (i * 53) % (H * 0.45), 2, 2);
  }
  ctx.globalAlpha = 1;
  emoji(ctx, '🌙', 330, H * 0.1, 30);
  // Neighbouring buildings.
  ctx.fillStyle = '#151034';
  for (let i = -2; i < 8; i++) {
    const bh = 140 + ((i * 53 + 80) % 120);
    ctx.fillRect(i * 70 - 10, H * 0.62 - bh, 64, bh + 10);
    ctx.fillStyle = 'rgba(255,211,77,0.55)';
    for (let k = 0; k < 6; k++) if ((i * 7 + k * 3) % 4 === 0) ctx.fillRect(i * 70 + 4 + (k % 2) * 28, H * 0.62 - bh + 14 + Math.floor(k / 2) * 30, 10, 14);
    ctx.fillStyle = '#151034';
  }
  // Street.
  ctx.fillStyle = '#231a2e';
  ctx.fillRect(L, H * 0.78, W, H * 0.22);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 8; i++) ctx.fillRect(L + i * 70, H * 0.86, 40, 4);
  // The bar.
  const bw = 300;
  const bx = cx - bw / 2;
  const by = H * 0.36;
  const bh = H * 0.42;
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#3a2414';
  ctx.beginPath();
  ctx.moveTo(bx - 20, by + 4);
  ctx.lineTo(cx, by - 46);
  ctx.lineTo(bx + bw + 20, by + 4);
  ctx.fill();
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(bx - 20, by, bw + 40, 10);
  // Sign.
  const lit = lights > 0.5;
  if (lit) { ctx.shadowColor = '#ffd34d'; ctx.shadowBlur = 18; }
  ctx.fillStyle = lit ? '#2d1e2f' : '#3a2a2a';
  rr(ctx, cx - 80, by - 34, 160, 34, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = `700 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = lit ? '#ffd34d' : 'rgba(255,211,77,0.25)';
  ctx.fillText('SUSHI · 寿司', cx, by - 16);
  // Lanterns light up one by one.
  for (let i = 0; i < 4; i++) {
    const lx = bx + 20 + i * ((bw - 40) / 3);
    const on = lights * 4 > i + 0.5;
    if (on) { ctx.shadowColor = '#ff6b6b'; ctx.shadowBlur = 20; }
    ctx.fillStyle = on ? '#e63946' : '#4a2a2a';
    ctx.beginPath();
    ctx.ellipse(lx, by + 28 + Math.sin(t * 2 + i) * 1.5, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  // Doorway with the shutter.
  const doorW = 170;
  const doorH = bh - 60;
  const doorX = cx - doorW / 2;
  const doorY = by + 54;
  const inside = ctx.createLinearGradient(0, doorY, 0, doorY + doorH);
  inside.addColorStop(0, lights ? '#ffcf8a' : '#1a1010');
  inside.addColorStop(1, lights ? '#c8743a' : '#120a0a');
  ctx.fillStyle = inside;
  ctx.fillRect(doorX, doorY, doorW, doorH);
  if (lights) {
    // Warm light spilling onto the street.
    const lg = ctx.createRadialGradient(cx, doorY + doorH, 10, cx, doorY + doorH, 220);
    lg.addColorStop(0, `rgba(255,190,110,${0.45 * lights})`);
    lg.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(L, by, W, H - by);
  }
  const sh = doorH * shutter;
  ctx.fillStyle = '#8d8d96';
  ctx.fillRect(doorX - 4, doorY, doorW + 8, sh);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = doorY + 6; y < doorY + sh; y += 9) ctx.fillRect(doorX - 4, y, doorW + 8, 2);
  if (shutter > 0.9) {
    // Dust and a little "CLOSED" note.
    ctx.fillStyle = '#f4ecd8';
    ctx.save();
    ctx.translate(cx, doorY + doorH * 0.45);
    ctx.rotate(-0.08);
    ctx.fillRect(-36, -14, 72, 28);
    ctx.font = `700 13px ${FONT}`;
    ctx.fillStyle = '#7a3f1d';
    ctx.fillText('CLOSED', 0, 1);
    ctx.restore();
  }
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(doorX - 8, doorY - 6, doorW + 16, 6);
  return { doorX, doorY, doorW, doorH };
}

/** Caption box with typewriter text. */
export function caption(ctx: CanvasRenderingContext2D, text: string, t: number, y: number): void {
  const n = Math.min(text.length, Math.floor(t * 38));
  const shown = text.slice(0, n);
  ctx.fillStyle = 'rgba(20,10,25,0.86)';
  rr(ctx, 24, y - 34, 352, 68, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,211,77,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = `600 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  // Wrap to two lines.
  const words = shown.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > 320 && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 200, y + (lines.length > 1 ? (i - 0.5) * 22 : 0)));
}

/** Panel 1: the closed bar at night. */
export function panelClosed(o: PanelOpts): void {
  facade(o, 1, 0, 0);
  // Drifting dust.
  const { ctx, H, t } = o;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 12; i++) ctx.fillRect(80 + ((i * 41 + t * 8) % 240), H * 0.5 + ((i * 29 + t * 5) % 120), 2, 2);
  emoji(ctx, '🕸️', 70, H * 0.42, 26);
}

/** Panel 2: the shutter rolls up, the lights come on and your chef steps out. */
export function panelReopen(o: PanelOpts): void {
  const { ctx, t, H } = o;
  const shutter = 1 - ease((t - 0.2) / 1.0);
  const lights = Math.min(1, Math.max(0, (t - 1.0) / 0.9));
  const d = facade(o, shutter, lights, Math.min(1, t / 3) * 0.5);
  if (t > 1.6) {
    const k = ease((t - 1.6) / 0.6);
    drawChef(ctx, o.me, 200, d.doorY + d.doorH - 74 + (1 - k) * 40, 0.9 * k + 0.01, 'happy', 200, H, t);
  }
  if (lights >= 1) for (let i = 0; i < 8; i++) {
    const a = t * 2 + i;
    ctx.globalAlpha = 0.6;
    emoji(ctx, '✨', 200 + Math.cos(a) * 140, d.doorY + 40 + Math.sin(a * 1.3) * 60, 12);
    ctx.globalAlpha = 1;
  }
}

/** Panel 3: the first rival bursts in. */
export function panelRival(o: PanelOpts): void {
  const { ctx, t, L, W, H } = o;
  // Speed-line burst background.
  const g = ctx.createRadialGradient(200, H * 0.42, 20, 200, H * 0.42, H * 0.8);
  g.addColorStop(0, '#ffcf8a');
  g.addColorStop(1, '#c8553d');
  ctx.fillStyle = g;
  ctx.fillRect(L, 0, W, H);
  ctx.save();
  ctx.translate(200, H * 0.42);
  ctx.rotate(t * 0.15);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 18; i++) {
    ctx.rotate((Math.PI * 2) / 18);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, -H);
    ctx.lineTo(20, -H);
    ctx.fill();
  }
  ctx.restore();
  // Your chef on the left, looking worried; the rival slides in big from the right.
  drawChef(ctx, o.me, 100, H * 0.56, 1.05, t > 0.6 ? 'shock' : 'calm', 300, H * 0.4, t);
  const k = back((t - 0.25) / 0.45);
  const shake = t > 0.45 && t < 0.75 ? Math.sin(t * 90) * 4 : 0;
  drawChef(ctx, o.rival, 292 + (1 - Math.min(1, k)) * 260 + shake, H * 0.38, 1.55, 'angry', 100, H * 0.56, t, 'knife');
  if (t > 0.7) {
    const b = back((t - 0.7) / 0.3);
    ctx.save();
    ctx.translate(240, H * 0.15);
    ctx.scale(b, b);
    ctx.fillStyle = '#ffffff';
    rr(ctx, -130, -26, 260, 52, 22);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(40, 22);
    ctx.lineTo(60, 48);
    ctx.lineTo(70, 22);
    ctx.fill();
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3a1d12';
    ctx.fillText(o.rival.intro, 0, 1, 240);
    ctx.restore();
  }
  // "VS" stamp.
  if (t > 1.0) {
    const s = back((t - 1.0) / 0.3) * 1.0;
    ctx.save();
    ctx.translate(205, H * 0.69);
    ctx.scale(s, s);
    ctx.rotate(-0.12);
    ctx.font = `700 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#2a1424';
    ctx.strokeText('VS', 0, 0);
    ctx.fillStyle = '#ffd34d';
    ctx.fillText('VS', 0, 0);
    ctx.restore();
  }
}
