// Things players spend coins on. Backgrounds are free and rotate during play, so coins go to these.

export type BoosterId = 'chance' | 'double' | 'slow' | 'wide';

export interface Booster { id: BoosterId; name: string; desc: string; price: number; color: string }

// Consumables: each one bought is used up on the next run (Second Chance only when you actually miss).
export const BOOSTERS: Booster[] = [
  { id: 'chance', name: 'Second Chance', desc: 'Survive one miss', price: 40, color: '#e85d75' },
  { id: 'double', name: 'Coin Doubler', desc: '2x coins for a run', price: 50, color: '#f2b705' },
  { id: 'slow', name: 'Slow Start', desc: 'Slower first 15', price: 25, color: '#4aa3df' },
  { id: 'wide', name: 'Wide Base', desc: 'Start 30% wider', price: 30, color: '#6cc070' },
];

export type PlateId = 'classic' | 'geta' | 'slate' | 'bamboo' | 'wave' | 'gold';

export interface Plate { id: PlateId; name: string; price: number }

// Cosmetic: the plate your roll sits on.
export const PLATES: Plate[] = [
  { id: 'classic', name: 'Classic Plate', price: 0 },
  { id: 'geta', name: 'Wooden Geta', price: 60 },
  { id: 'slate', name: 'Black Slate', price: 100 },
  { id: 'bamboo', name: 'Bamboo Mat', price: 150 },
  { id: 'wave', name: 'Wave Porcelain', price: 220 },
  { id: 'gold', name: 'Gold Platter', price: 400 },
];

/** Draws a plate whose top edge is at y, centred on cx, 272 units wide at scale 1. */
export function drawPlate(ctx: CanvasRenderingContext2D, id: PlateId, cx: number, y: number, s = 1): void {
  const w = 272 * s;
  const h = 14 * s;
  const x = cx - w / 2;
  // Path helper; avoids ctx.roundRect, which older iOS WebViews lack.
  const rr = (rx: number, ry: number, rw: number, rh: number, r: number) => {
    r = Math.min(r, rw / 2, rh / 2);
    ctx.beginPath();
    ctx.moveTo(rx + r, ry);
    ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
    ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
    ctx.arcTo(rx, ry + rh, rx, ry, r);
    ctx.arcTo(rx, ry, rx + rw, ry, r);
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(x - 4 * s, y + 6 * s, w + 8 * s, h + 2 * s, 8 * s);
  ctx.fill();

  switch (id) {
    case 'classic':
      ctx.fillStyle = '#f4f7fb';
      rr(x, y, w, h, 7 * s);
      ctx.fill();
      ctx.fillStyle = '#3d6fb6';
      ctx.fillRect(x + 12 * s, y + 9 * s, w - 24 * s, 2 * s);
      break;
    case 'geta':
      ctx.fillStyle = '#7a4e2a';
      ctx.fillRect(cx - 100 * s, y + h, 22 * s, 9 * s);
      ctx.fillRect(cx + 78 * s, y + h, 22 * s, 9 * s);
      ctx.fillStyle = '#b07a45';
      rr(x, y - 2 * s, w, h + 2 * s, 3 * s);
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,50,20,0.35)';
      ctx.lineWidth = 1 * s;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 6 * s, y + (2 + i * 4) * s);
        ctx.bezierCurveTo(cx - 40 * s, y + i * 4 * s, cx + 40 * s, y + (4 + i * 4) * s, x + w - 6 * s, y + (2 + i * 4) * s);
        ctx.stroke();
      }
      break;
    case 'slate':
      ctx.fillStyle = '#2f3338';
      rr(x, y, w, h, 2 * s);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 26; i++) ctx.fillRect(x + ((i * 37) % 260 + 6) * s, y + ((i * 7) % 10 + 2) * s, 2 * s, 1 * s);
      break;
    case 'bamboo':
      for (let i = 0; i * 9 * s < w; i++) {
        ctx.fillStyle = i % 2 ? '#c9b47a' : '#b39d61';
        ctx.fillRect(x + i * 9 * s, y, Math.min(9 * s, w - i * 9 * s), h);
      }
      ctx.fillStyle = '#5a4a28';
      ctx.fillRect(x, y + 3 * s, w, 1.5 * s);
      ctx.fillRect(x, y + 10 * s, w, 1.5 * s);
      break;
    case 'wave':
      ctx.fillStyle = '#f7f9fc';
      rr(x, y, w, h, 7 * s);
      ctx.fill();
      ctx.save();
      rr(x, y, w, h, 7 * s);
      ctx.clip();
      ctx.strokeStyle = '#2f5fa8';
      ctx.lineWidth = 1.2 * s;
      for (let i = 0; i * 14 * s < w + 14 * s; i++) {
        ctx.beginPath();
        ctx.arc(x + i * 14 * s, y + h, 7 * s, Math.PI, 0);
        ctx.arc(x + i * 14 * s, y + h, 4 * s, 0, Math.PI, true);
        ctx.stroke();
      }
      ctx.restore();
      break;
    case 'gold': {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#b8860b');
      g.addColorStop(0.5, '#ffe58a');
      g.addColorStop(1, '#b8860b');
      ctx.fillStyle = g;
      rr(x, y, w, h, 7 * s);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x + 20 * s, y + 3 * s, w * 0.3, 1.5 * s);
      break;
    }
  }
}
