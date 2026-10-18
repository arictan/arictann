// The restaurant interior, drawn in layers: wall and window, decor areas (each with a level and a
// style), staff, guests at the counter, the tip jar, theme decorations and falling particles.

import { drawChef, type Chef } from './chef';
import { FONT } from './font';
import { type RestTheme } from './restaurant';

export interface SceneGuest { emoji: string; hungry: boolean; critic?: boolean }

export interface SceneOpts {
  x: number; y: number; w: number; h: number;
  time: number;
  levels: number[]; // 8 areas, 0-3 (order: counter, lanterns, aquarium, noren, garden, art, sign, conveyor)
  styles: number[]; // 8 areas, 0-2
  theme: RestTheme;
  staff: { waiter: number; dishwasher: number; greeter: number; apprentice: number };
  guests: SceneGuest[];
  chef: Chef;
  tips: number;
  menu: string; // emoji of today's dish, or ''
  name: string; // shown on the sign
  hour: number; // 0-23, for the window sky
}

const C = { counter: 0, lanterns: 1, aquarium: 2, noren: 3, garden: 4, art: 5, sign: 6, conveyor: 7 };

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

function emoji(ctx: CanvasRenderingContext2D, e: string, x: number, y: number, size: number): void {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(e, x, y);
}

function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, maxW?: number): void {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y, maxW);
}

/** Dashed placeholder for an area that hasn't been built yet. */
function empty(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, icon: string): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.45;
  emoji(ctx, icon, x + w / 2, y + h / 2, Math.min(18, h * 0.5));
  ctx.globalAlpha = 1;
}

/** Positions of the counter seats, so taps can find a guest. */
export function seatPos(o: { x: number; y: number; w: number; h: number }, i: number, n: number): { x: number; y: number } {
  const cy = o.y + o.h * 0.72 - 6;
  const span = o.w - 110;
  return { x: o.x + 55 + (n > 1 ? i * (span / (n - 1)) : span / 2), y: cy + 30 };
}

export function drawRestaurantScene(ctx: CanvasRenderingContext2D, o: SceneOpts): void {
  const { x, y, w, h, time: t, theme: th } = o;
  const L = o.levels;
  const S = o.styles;
  const cy = y + h * 0.72 - 6; // counter top
  const floorY = y + h * 0.74;
  ctx.save();
  rr(ctx, x, y, w, h, 16);
  ctx.clip();

  // ---- wall: panels, a top beam and a skirting board
  ctx.fillStyle = th.wall;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = th.wall2;
  for (let i = 0; i < 9; i++) ctx.fillRect(x + i * (w / 8) - 2, y, 4, floorY - y);
  ctx.fillStyle = th.beam;
  ctx.fillRect(x, y, w, 8);
  ctx.fillRect(x, floorY - 6, w, 6);

  // ---- window with the real sky outside (dawn, day, dusk, night)
  const wx = x + w / 2 - 46;
  const wy = y + 52;
  const ww = 92;
  const wh = 62;
  const hr = o.hour;
  const sky = hr >= 6 && hr < 8 ? ['#ffb38a', '#ffe6c7'] : hr >= 8 && hr < 17 ? ['#7fc8ff', '#d6f0ff'] : hr >= 17 && hr < 20 ? ['#ff8a5b', '#7b2cbf'] : ['#0b1030', '#2a2f6e'];
  const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(wx, wy, ww, wh);
  const night = hr < 6 || hr >= 20;
  if (night) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 9; i++) ctx.fillRect(wx + ((i * 37) % ww), wy + ((i * 23) % (wh - 20)), 1.5, 1.5);
    emoji(ctx, '🌙', wx + ww - 16, wy + 14, 13);
  } else emoji(ctx, hr >= 17 || hr < 8 ? '🌅' : '☀️', wx + ww - 16, wy + 14, 12);
  // Skyline silhouette.
  ctx.fillStyle = night ? 'rgba(10,10,30,0.8)' : 'rgba(60,60,90,0.35)';
  for (let i = 0; i < 6; i++) ctx.fillRect(wx + i * 16, wy + wh - 12 - ((i * 13) % 14), 13, 30);
  if (night) {
    ctx.fillStyle = '#ffd34d';
    for (let i = 0; i < 6; i++) ctx.fillRect(wx + i * 16 + 4, wy + wh - 6 - ((i * 13) % 10), 2, 2);
  }
  // Snow or petals drift past outside too.
  if (th.particle === 'snow' || th.particle === 'petals') {
    for (let i = 0; i < 6; i++) {
      const px = wx + ((i * 29 + t * 14) % ww);
      const py = wy + ((i * 17 + t * 22) % wh);
      ctx.fillStyle = th.particle === 'snow' ? '#fff' : '#ffb7c5';
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Frame and cross bars.
  ctx.strokeStyle = th.beam;
  ctx.lineWidth = 4;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();

  // ---- menu board (today's special)
  const bx = x + 92;
  const by = y + 54;
  ctx.fillStyle = '#5a3a22';
  rr(ctx, bx - 3, by - 3, 50, 54, 4);
  ctx.fill();
  ctx.fillStyle = '#26332a';
  ctx.fillRect(bx, by, 44, 48);
  label(ctx, 'TODAY', bx + 22, by + 9, 7.5, '#f4ecd8');
  if (o.menu) emoji(ctx, o.menu, bx + 22, by + 30, 18);
  else label(ctx, '?', bx + 22, by + 30, 16, 'rgba(244,236,216,0.5)');

  // ---- floor: tatami / tiles
  ctx.fillStyle = th.floor;
  ctx.fillRect(x, floorY, w, y + h - floorY);
  ctx.fillStyle = th.floor2;
  for (let i = 0; i < 12; i++) {
    for (let r = 0; r < 3; r++) if ((i + r) % 2) ctx.fillRect(x + i * (w / 11), floorY + r * 26, w / 11, 26);
  }

  // ---- sign
  const sl = L[C.sign];
  const ss = S[C.sign];
  if (!sl) empty(ctx, x + w / 2 - 70, y + 12, 140, 32, '🪧');
  else {
    const neon = ss === 2;
    if (neon || sl >= 3) { ctx.shadowColor = neon ? '#ff3fa4' : '#ffd34d'; ctx.shadowBlur = 10 + 6 * Math.sin(t * 4); }
    ctx.fillStyle = ss === 1 ? '#8d8d8d' : neon ? '#1a0f22' : sl >= 2 ? '#2d1e2f' : '#8a5a3c';
    rr(ctx, x + w / 2 - 74, y + 12, 148, 32, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = neon ? '#ff3fa4' : ss === 1 ? '#5f5f5f' : sl >= 2 ? '#c8553d' : '#5a3a22';
    ctx.lineWidth = 3;
    ctx.stroke();
    label(ctx, o.name.toUpperCase(), x + w / 2, y + 29, 14, neon ? '#ffd6f0' : ss === 1 ? '#f4ecd8' : '#ffd34d', 136);
  }

  // ---- lanterns
  const ll = L[C.lanterns];
  const ls = S[C.lanterns];
  if (!ll) empty(ctx, x + 16, y + 12, 56, 36, '🏮');
  const lanterns = ll * 2;
  for (let i = 0; i < lanterns; i++) {
    const lx = x + 26 + i * ((w - 52) / Math.max(1, lanterns - 1));
    if (Math.abs(lx - (x + w / 2)) < 84) continue;
    const sway = Math.sin(t * 1.5 + i) * 2;
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, y + 8);
    ctx.lineTo(lx + sway, y + 22);
    ctx.stroke();
    const color = ls === 1 ? 'rgba(220,240,255,0.9)' : ls === 2 ? ['#ff3fa4', '#3fd0ff', '#b6ff3f'][i % 3] : '#d7263d';
    if (ll >= 3 || ls === 2) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ls === 2) rr(ctx, lx + sway - 4, y + 22, 8, 24, 4);
    else ctx.ellipse(lx + sway, y + 34, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (ls !== 2) {
      ctx.fillStyle = '#222';
      ctx.fillRect(lx + sway - 5, y + 22, 10, 2);
      ctx.fillRect(lx + sway - 5, y + 45, 10, 2);
    }
  }

  // ---- noren curtain over the doorway (left), with the greeter
  const nl = L[C.noren];
  const ns = S[C.noren];
  if (!nl) empty(ctx, x + 14, y + 60, 70, 96, '🎏');
  else {
    ctx.fillStyle = '#140c0c';
    ctx.fillRect(x + 14, y + 60, 70, floorY - y - 60);
    const base = ns === 1 ? '#b3202e' : ns === 2 ? '#d4a537' : '#2c4a7a';
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 1 && nl >= 2 ? (ns === 2 ? '#8a1a1a' : '#f4ecd8') : base;
      ctx.fillRect(x + 16 + i * 22.5, y + 60 + Math.sin(t * 2 + i) * 1.5, 21, 60 + nl * 4);
    }
    if (nl >= 3) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 14, y + 58, 70, 4); }
    label(ctx, nl >= 2 ? '寿司' : 'の', x + 49, y + 90, 14, nl >= 2 && ns !== 2 ? '#2d1e2f' : '#fff');
  }
  if (o.staff.greeter) emoji(ctx, '💁', x + 49, floorY - 18 + Math.sin(t * 2) * 1.5, 22);

  // ---- wall art (right)
  const al = L[C.art];
  const as = S[C.art];
  if (!al) empty(ctx, x + w - 104, y + 58, 86, 62, '🖼️');
  else {
    const fw = 50 + al * 12;
    const fh = 36 + al * 9;
    const fx = x + w - 20 - fw;
    ctx.fillStyle = al >= 3 || as === 2 ? '#d4a537' : '#5a3a22';
    ctx.fillRect(fx - 4, y + 56, fw + 8, fh + 8);
    ctx.fillStyle = '#f4ecd8';
    ctx.fillRect(fx, y + 60, fw, fh);
    if (as === 2) emoji(ctx, '🐅', fx + fw / 2, y + 60 + fh / 2, fh * 0.7);
    else if (as === 1 || al >= 2) {
      ctx.fillStyle = '#3d6fb6';
      ctx.beginPath();
      ctx.moveTo(fx + 6, y + 60 + fh - 4);
      ctx.lineTo(fx + fw / 2, y + 66);
      ctx.lineTo(fx + fw - 6, y + 60 + fh - 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(fx + fw / 2 - 8, y + 74);
      ctx.lineTo(fx + fw / 2, y + 66);
      ctx.lineTo(fx + fw / 2 + 8, y + 74);
      ctx.fill();
      ctx.fillStyle = '#d7263d';
      ctx.beginPath();
      ctx.arc(fx + fw - 12, y + 70, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // The great wave.
      ctx.strokeStyle = '#2c4a7a';
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(fx + 12 + k * (fw / 3), y + 60 + fh - 6, fw / 7, Math.PI, Math.PI * 1.9);
        ctx.stroke();
      }
    }
  }

  // ---- fish tank (lower left)
  const ql = L[C.aquarium];
  const qs = S[C.aquarium];
  const tankBottom = floorY - 34;
  if (!ql) empty(ctx, x + 96, tankBottom - 52, 76, 50, '🐠');
  else {
    const tw = 40 + ql * 10;
    const th2 = 30 + ql * 9;
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(x + 92, tankBottom, tw + 8, 34);
    ctx.fillStyle = qs === 2 ? 'rgba(60,40,120,0.75)' : qs === 1 ? 'rgba(60,140,110,0.65)' : 'rgba(80,180,255,0.55)';
    rr(ctx, x + 96, tankBottom - th2, tw, th2, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const fish = qs === 2 ? ['🪼', '🪼'] : qs === 1 ? ['🐟', '🐠'] : ['🐠', '🐟'];
    for (let i = 0; i < ql * 2; i++) {
      const fx = x + 104 + ((t * (10 + i * 5) + i * 30) % (tw - 16));
      const fy = tankBottom - 10 - ((i * 9) % (th2 - 16)) + Math.sin(t * 2 + i) * 2;
      emoji(ctx, fish[i % 2], fx, fy, 11);
    }
    // Bubbles.
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 3; i++) {
      const bb = (t * 18 + i * 20) % th2;
      ctx.beginPath();
      ctx.arc(x + 96 + tw - 10, tankBottom - bb, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (ql >= 3) emoji(ctx, '🪸', x + 106, tankBottom - 8, 11);
  }

  // ---- garden (lower right)
  const gl = L[C.garden];
  const gs = S[C.garden];
  if (!gl) empty(ctx, x + w - 100, floorY - 60, 80, 52, '🌳');
  else {
    const tree = gs === 1 ? '🌸' : gs === 2 ? '🎋' : gl >= 2 ? '🌳' : '🪴';
    emoji(ctx, tree, x + w - 58, floorY - 26 - gl * 4, 24 + gl * 6);
    if (gs === 1) for (let i = 0; i < 3; i++) emoji(ctx, '🌸', x + w - 80 + i * 18, floorY - 6 - ((t * 10 + i * 7) % 8), 8);
    if (gl >= 3) { emoji(ctx, '🏮', x + w - 94, floorY - 12, 15); emoji(ctx, '🪨', x + w - 22, floorY - 8, 12); }
  }

  // ---- theme decorations in the corners
  th.deco.forEach((d, i) => emoji(ctx, d, x + 18 + i * 22, floorY + 18, 14));

  // ---- your chef (and the apprentice) behind the counter
  const chefX = x + w * 0.56;
  drawChef(ctx, o.chef, chefX, cy - 44, 0.5, 'happy', chefX + Math.sin(t) * 40, cy + 60, t);
  if (o.staff.apprentice) emoji(ctx, '👦', chefX + 48, cy - 18 + Math.abs(Math.sin(t * 3)) * -2, 22);
  if (o.staff.dishwasher) {
    const dx = x + w - 74;
    emoji(ctx, '🧽', dx, cy - 14, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 4; i++) {
      const bb = (t * 16 + i * 9) % 26;
      ctx.beginPath();
      ctx.arc(dx - 6 + i * 4, cy - 22 - bb, 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- counter
  const cl = L[C.counter];
  const cs = S[C.counter];
  if (!cl) empty(ctx, x + 30, cy - 4, w - 60, 34, '🍣');
  else {
    const top = cs === 2 ? ['#f4f4f4', '#c9c9c9'] : cs === 1 ? ['#d8c27a', '#a8904a'] : cl >= 2 ? ['#c08552', '#7a4e2a'] : ['#8a5a3c', '#5a3a22'];
    const cg = ctx.createLinearGradient(0, cy, 0, cy + 40);
    cg.addColorStop(0, top[0]);
    cg.addColorStop(1, top[1]);
    ctx.fillStyle = cg;
    ctx.fillRect(x + 20, cy, w - 40, 40);
    if (cs === 1) {
      ctx.strokeStyle = 'rgba(90,70,20,0.45)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(x + 20 + i * ((w - 40) / 13), cy + 8); ctx.lineTo(x + 20 + i * ((w - 40) / 13), cy + 40); ctx.stroke(); }
    }
    if (cs === 2) {
      ctx.strokeStyle = 'rgba(150,150,170,0.5)';
      ctx.beginPath();
      ctx.moveTo(x + 40, cy + 12);
      ctx.bezierCurveTo(x + 120, cy + 30, x + 200, cy + 4, x + w - 40, cy + 26);
      ctx.stroke();
    }
    ctx.fillStyle = cl >= 3 || cs === 2 ? '#d4a537' : 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 20, cy, w - 40, 4);
    // Dishes with steam at the guests' places.
    for (let i = 0; i < o.guests.length; i++) {
      const sp = seatPos(o, i, o.guests.length);
      ctx.fillStyle = '#f6f1e4';
      ctx.beginPath();
      ctx.ellipse(sp.x, cy + 1, 11, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        const sx = sp.x - 3 + k * 6;
        ctx.moveTo(sx, cy - 3);
        ctx.quadraticCurveTo(sx + 4 * Math.sin(t * 3 + k + i), cy - 9, sx, cy - 15);
        ctx.stroke();
      }
    }
  }

  // ---- conveyor belt along the counter top
  const vl = L[C.conveyor];
  const vs = S[C.conveyor];
  if (!vl) empty(ctx, x + 70, cy - 26, w - 140, 18, '🍱');
  else {
    ctx.fillStyle = vs === 2 ? '#e9eef6' : '#555';
    ctx.fillRect(x + 26, cy - 9, w - 52, 9);
    if (vs === 2) { ctx.fillStyle = '#3d6fb6'; ctx.fillRect(x + 26, cy - 5, w - 52, 2); }
    const items = vs === 1 ? ['⛵', '🍣', '⛵'] : vs === 2 ? ['🚅'] : ['🍣', '🍤', '🍙'];
    const n = vs === 2 ? 1 : vl * 2;
    for (let i = 0; i < n; i++) {
      const px = x + 26 + ((t * (vs === 2 ? 70 : 28) + i * ((w - 52) / n)) % (w - 52));
      if (vl >= 2 && vs === 0) {
        ctx.fillStyle = ['#d7263d', '#3d6fb6', '#ffd34d'][i % 3];
        ctx.beginPath();
        ctx.ellipse(px, cy - 10, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (vl >= 3 || vs > 0) emoji(ctx, items[i % items.length], px, cy - 17, vs === 2 ? 18 : 12);
    }
  }

  // ---- guests on stools in front of the counter
  if (cl) {
    o.guests.forEach((gst, i) => {
      const sp = seatPos(o, i, o.guests.length);
      ctx.fillStyle = '#3a2418';
      ctx.fillRect(sp.x - 9, cy + 44, 18, 6);
      ctx.fillRect(sp.x - 2, cy + 50, 4, 16);
      const bob = Math.sin(t * 3 + i * 1.7) * 2;
      emoji(ctx, gst.emoji, sp.x, sp.y + bob, 26);
      if (gst.critic) {
        emoji(ctx, '📝', sp.x + 14, sp.y + 12, 12);
      }
      if (gst.hungry) {
        // A bouncing "!" bubble: tap to serve this guest.
        const by2 = sp.y - 30 - Math.abs(Math.sin(t * 5)) * 4;
        ctx.fillStyle = '#ffd34d';
        rr(ctx, sp.x - 11, by2 - 11, 22, 20, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sp.x - 4, by2 + 8);
        ctx.lineTo(sp.x, by2 + 13);
        ctx.lineTo(sp.x + 4, by2 + 8);
        ctx.fill();
        label(ctx, gst.critic ? '?' : '!', sp.x, by2, 13, '#4a2a00');
      } else {
        const beat = (t * 0.5 + i * 0.37) % 3;
        if (beat < 0.9) {
          ctx.globalAlpha = Math.min(1, beat * 4, (0.9 - beat) * 4);
          emoji(ctx, ['😋', '💕', '✨', '👍', '🍣'][(i + Math.floor(t / 6)) % 5], sp.x + 14, sp.y - 22 - beat * 12, 12);
          ctx.globalAlpha = 1;
        }
      }
    });
    // Tip jar on the counter.
    emoji(ctx, o.tips > 0 ? '💰' : '🫙', x + w - 36, cy - 12, 18);
    if (o.tips > 0) label(ctx, String(o.tips), x + w - 36, cy + 10, 10, '#ffd34d');
  }

  // ---- waiter walking the floor with a tray
  if (o.staff.waiter) {
    const span = w - 60;
    const p = (t * 30) % (span * 2);
    const wxp = x + 30 + (p < span ? p : span * 2 - p);
    emoji(ctx, '🤵', wxp, y + h - 16 + Math.abs(Math.sin(t * 6)) * -2, 22);
    emoji(ctx, '🍱', wxp + (p < span ? 12 : -12), y + h - 30, 11);
  }
  // A cat naps in the corner once the room is cosy.
  if (L.reduce((a, b) => a + b, 0) >= 8) emoji(ctx, '🐈', x + w - 22, y + h - 12, 16);

  // ---- warm light from the lanterns, then the theme's particles
  if (ll) {
    const lg = ctx.createRadialGradient(x + w / 2, y + 30, 10, x + w / 2, y + 30, w * 0.8);
    lg.addColorStop(0, ls === 2 ? `rgba(255,80,200,${0.06 * ll})` : `rgba(255,190,110,${0.08 * ll})`);
    lg.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(x, y, w, h);
  }
  const P = th.particle;
  if (P !== 'none') {
    for (let i = 0; i < 14; i++) {
      const px = x + ((i * 53 + t * (P === 'snow' ? 12 : 18) + Math.sin(t + i) * 10) % w);
      const py = y + ((i * 41 + t * (P === 'fireflies' ? 6 : 26)) % h);
      if (P === 'fireflies' || P === 'gold') {
        ctx.fillStyle = P === 'gold' ? `rgba(255,211,77,${0.5 + 0.5 * Math.sin(t * 3 + i)})` : `rgba(220,255,120,${0.4 + 0.6 * Math.sin(t * 4 + i)})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (P === 'snow') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t + i);
        ctx.fillStyle = P === 'petals' ? '#ffb7c5' : ['#e76f51', '#f4a261', '#c1121f'][i % 3];
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
  // Soft vignette.
  const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.4, x + w / 2, y + h / 2, h * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}
