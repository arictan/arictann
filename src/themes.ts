// Backgrounds, all free: the game moves to the next one each time an order is served. Each is a sky gradient, a counter colour and an animated decoration.

export type Decor = 'lanterns' | 'petals' | 'bubbles' | 'snow' | 'fireflies' | 'neon' | 'sunset' | 'rain' | 'fuji' | 'gold';

export interface Theme {
  id: string;
  name: string;
  sky: [string, string]; // top, bottom
  counter: string;
  counterEdge: string;
  decor: Decor;
}

export const THEMES: Theme[] = [
  { id: 'izakaya', name: 'Night Izakaya', sky: ['#2a1a33', '#4b2a3a'], counter: '#7a4a26', counterEdge: '#a0683a', decor: 'lanterns' },
  { id: 'sakura', name: 'Sakura Garden', sky: ['#5b3b6e', '#f2a7c3'], counter: '#8a5a3c', counterEdge: '#b98563', decor: 'petals' },
  { id: 'ocean', name: 'Ocean Deep', sky: ['#06264a', '#0d6e8c'], counter: '#4f5d6b', counterEdge: '#7d8c99', decor: 'bubbles' },
  { id: 'onsen', name: 'Snowy Onsen', sky: ['#1d2b45', '#5f7896'], counter: '#6b4e3d', counterEdge: '#94725e', decor: 'snow' },
  { id: 'bamboo', name: 'Bamboo Forest', sky: ['#0f2a1d', '#2f5a35'], counter: '#6a5a2c', counterEdge: '#9a8746', decor: 'fireflies' },
  { id: 'neon', name: 'Neon Tokyo', sky: ['#0b0820', '#26104a'], counter: '#2a2a35', counterEdge: '#ff3fa4', decor: 'neon' },
  { id: 'harbor', name: 'Sunset Harbor', sky: ['#3d1e5c', '#ff8a5b'], counter: '#5c3a2a', counterEdge: '#8c5a3f', decor: 'sunset' },
  { id: 'rain', name: 'Rainy Alley', sky: ['#10202a', '#2c4552'], counter: '#3e3a36', counterEdge: '#6b645c', decor: 'rain' },
  { id: 'fuji', name: 'Fuji Dawn', sky: ['#7fb2e5', '#ffd1c2'], counter: '#9a6b45', counterEdge: '#c99a6e', decor: 'fuji' },
  { id: 'palace', name: 'Golden Palace', sky: ['#120c05', '#3a2708'], counter: '#2b1d10', counterEdge: '#d4a537', decor: 'gold' },
];

export interface Speck { x: number; y: number; z: number; r: number } // all 0-1 except z (depth, 0.15-0.5)

export function makeSpecks(n: number): Speck[] {
  return Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: 0.15 + Math.random() * 0.35, r: Math.random() }));
}

function wrap(v: number, span: number): number {
  return ((v % span) + span) % span;
}

/**
 * Draws a theme's sky and decoration into the box (x0, 0, w, h). `k` scales decoration sizes,
 * so the same code draws the full-screen backdrop and the small shop previews.
 */
export function drawBackdrop(ctx: CanvasRenderingContext2D, t: Theme, specks: Speck[], time: number, camY: number, x0: number, w: number, h: number, k = 1, a = 1): void {
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, t.sky[0]);
  g.addColorStop(1, t.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(x0, 0, w, h);

  const span = h + 80 * k;
  const yOf = (s: Speck, drift: number) => wrap(s.y * span - camY * s.z + drift, span) - 40 * k;

  switch (t.decor) {
    case 'lanterns':
      for (const s of specks.slice(0, 14)) {
        const x = x0 + s.x * w;
        const y = yOf(s, 0);
        const r = (10 + s.z * 30) * k;
        const hue = s.r < 0.7 ? 5 : 35;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
        glow.addColorStop(0, `hsla(${hue}, 90%, 60%, ${0.25 * s.z + 0.05})`);
        glow.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
        ctx.globalAlpha = a * (0.25 + s.z);
        ctx.fillStyle = `hsl(${hue} 75% 48%)`;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1b1020';
        ctx.fillRect(x - r * 0.45, y - r - 2 * k, r * 0.9, 4 * k);
        ctx.fillRect(x - r * 0.45, y + r - 2 * k, r * 0.9, 4 * k);
        ctx.globalAlpha = a;
      }
      break;

    case 'petals':
      for (const s of specks) {
        const y = yOf(s, time * 40 * (0.5 + s.z) * k);
        const x = x0 + wrap(s.x * w + Math.sin(time * 0.8 + s.r * 9) * 24 * k + y * 0.15, w);
        ctx.globalAlpha = a * (0.5 + s.z);
        ctx.fillStyle = s.r < 0.5 ? '#ffd1e3' : '#ff9ec4';
        ctx.beginPath();
        ctx.ellipse(x, y, 5 * k, 3 * k, time * 1.5 + s.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = a;
      break;

    case 'bubbles':
      ctx.lineWidth = 1.5 * k;
      for (const s of specks) {
        const y = yOf(s, -time * 50 * (0.4 + s.z) * k);
        const x = x0 + s.x * w + Math.sin(time * 2 + s.r * 9) * 6 * k;
        const r = (2 + s.r * 7) * k;
        ctx.strokeStyle = `rgba(190,240,255,${0.25 + s.z})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(x - r * 0.4, y - r * 0.5, 1.5 * k, 1.5 * k);
      }
      // Light shafts from the surface.
      ctx.fillStyle = 'rgba(160,230,255,0.05)';
      for (let i = 0; i < 4; i++) {
        const sx = x0 + w * (0.15 + i * 0.25) + Math.sin(time * 0.3 + i) * 20 * k;
        ctx.beginPath();
        ctx.moveTo(sx - 20 * k, 0);
        ctx.lineTo(sx + 20 * k, 0);
        ctx.lineTo(sx + 70 * k, h);
        ctx.lineTo(sx - 10 * k, h);
        ctx.fill();
      }
      break;

    case 'snow':
      ctx.fillStyle = '#ffffff';
      for (const s of specks) {
        const y = yOf(s, time * 30 * (0.5 + s.z) * k);
        const x = x0 + wrap(s.x * w + Math.sin(time + s.r * 9) * 12 * k, w);
        ctx.globalAlpha = a * (0.4 + s.z);
        ctx.beginPath();
        ctx.arc(x, y, (1 + s.z * 5) * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = a;
      // Onsen steam near the counter.
      for (let i = 0; i < 3; i++) {
        const sx = x0 + w * (0.2 + i * 0.3);
        const sy = h - 70 * k - wrap(time * 15 + i * 30, 60) * k;
        const steam = ctx.createRadialGradient(sx, sy, 0, sx, sy, 50 * k);
        steam.addColorStop(0, 'rgba(255,255,255,0.12)');
        steam.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = steam;
        ctx.fillRect(sx - 50 * k, sy - 50 * k, 100 * k, 100 * k);
      }
      break;

    case 'fireflies':
      // Bamboo stalks in the distance.
      for (let i = 0; i < 7; i++) {
        const bx = x0 + w * ((i * 0.37 + 0.05) % 1);
        ctx.fillStyle = i % 2 ? 'rgba(80,140,70,0.35)' : 'rgba(50,100,50,0.5)';
        ctx.fillRect(bx, 0, (8 + (i % 3) * 3) * k, h);
        ctx.fillStyle = 'rgba(20,50,20,0.5)';
        for (let j = 0; j < 6; j++) ctx.fillRect(bx, wrap(j * 140 * k - camY * 0.2, h + 40 * k), (8 + (i % 3) * 3) * k, 3 * k);
      }
      for (const s of specks) {
        const x = x0 + wrap(s.x * w + Math.sin(time * 0.7 + s.r * 20) * 30 * k, w);
        const y = yOf(s, Math.cos(time * 0.5 + s.r * 12) * 30 * k);
        const blink = 0.5 + 0.5 * Math.sin(time * 3 + s.r * 30);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10 * k);
        glow.addColorStop(0, `rgba(230,255,120,${0.8 * blink})`);
        glow.addColorStop(1, 'rgba(230,255,120,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 10 * k, y - 10 * k, 20 * k, 20 * k);
      }
      break;

    case 'neon':
      for (const s of specks.slice(0, 16)) {
        const x = x0 + s.x * w;
        const y = yOf(s, 0);
        const sw = (14 + s.r * 26) * k;
        const sh = (36 + s.z * 60) * k;
        const flicker = Math.sin(time * 20 + s.r * 50) > 0.97 ? 0.3 : 1;
        const color = s.r < 0.33 ? '#ff3fa4' : s.r < 0.66 ? '#3ff0ff' : '#ffe14d';
        ctx.globalAlpha = a * ((0.35 + s.z) * flicker);
        ctx.shadowColor = color;
        ctx.shadowBlur = 14 * k;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5 * k;
        ctx.strokeRect(x, y, sw, sh);
        ctx.fillStyle = color;
        for (let i = 0; i < 3; i++) ctx.fillRect(x + sw * 0.3, y + sh * (0.2 + i * 0.25), sw * 0.4, 3 * k);
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = a;
      break;

    case 'sunset': {
      const sunY = h * 0.55 - camY * 0.05;
      const sun = ctx.createRadialGradient(x0 + w / 2, sunY, 0, x0 + w / 2, sunY, 140 * k);
      sun.addColorStop(0, 'rgba(255,230,150,0.95)');
      sun.addColorStop(0.35, 'rgba(255,170,90,0.6)');
      sun.addColorStop(1, 'rgba(255,120,90,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(x0, sunY - 140 * k, w, 280 * k);
      // Slow drifting cloud bands.
      ctx.fillStyle = 'rgba(255,200,220,0.18)';
      for (const s of specks.slice(0, 8)) {
        const x = x0 + wrap(s.x * w + time * 8 * s.z * k, w + 120 * k) - 60 * k;
        const y = yOf(s, 0);
        ctx.beginPath();
        ctx.ellipse(x, y, 60 * k, 8 * k, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Gulls.
      ctx.strokeStyle = 'rgba(60,30,60,0.6)';
      ctx.lineWidth = 1.5 * k;
      for (const s of specks.slice(8, 12)) {
        const x = x0 + wrap(s.x * w + time * 20 * k, w);
        const y = yOf(s, Math.sin(time + s.r * 5) * 10 * k);
        const flap = Math.sin(time * 6 + s.r * 10) * 3 * k;
        ctx.beginPath();
        ctx.moveTo(x - 7 * k, y - flap);
        ctx.quadraticCurveTo(x - 3 * k, y - 4 * k, x, y);
        ctx.quadraticCurveTo(x + 3 * k, y - 4 * k, x + 7 * k, y - flap);
        ctx.stroke();
      }
      break;
    }

    case 'rain':
      ctx.strokeStyle = 'rgba(180,220,240,0.35)';
      ctx.lineWidth = 1.2 * k;
      ctx.beginPath();
      for (const s of specks) {
        const y = yOf(s, time * 600 * (0.6 + s.z) * k);
        const x = x0 + wrap(s.x * w - y * 0.15, w);
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4 * k, y + 18 * k);
      }
      ctx.stroke();
      // Warm shop windows glowing through the rain.
      for (const s of specks.slice(0, 6)) {
        const x = x0 + s.x * w;
        const y = yOf(s, 0);
        ctx.fillStyle = `rgba(255,190,110,${0.08 + s.z * 0.25})`;
        ctx.fillRect(x, y, 30 * k, 40 * k);
      }
      break;

    case 'fuji': {
      // Distant mountain with a snow cap; barely moves as the stack climbs.
      const base = h * 0.75 - camY * 0.04;
      const cx = x0 + w / 2;
      ctx.fillStyle = 'rgba(90,110,160,0.55)';
      ctx.beginPath();
      ctx.moveTo(cx - 260 * k, base);
      ctx.lineTo(cx - 40 * k, base - 170 * k);
      ctx.lineTo(cx + 40 * k, base - 170 * k);
      ctx.lineTo(cx + 260 * k, base);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(cx - 40 * k, base - 170 * k);
      ctx.lineTo(cx + 40 * k, base - 170 * k);
      ctx.lineTo(cx + 70 * k, base - 120 * k);
      ctx.lineTo(cx + 30 * k, base - 132 * k);
      ctx.lineTo(cx, base - 118 * k);
      ctx.lineTo(cx - 30 * k, base - 132 * k);
      ctx.lineTo(cx - 70 * k, base - 120 * k);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      for (const s of specks.slice(0, 7)) {
        const x = x0 + wrap(s.x * w + time * 6 * (0.5 + s.z) * k, w + 140 * k) - 70 * k;
        const y = yOf(s, 0);
        ctx.beginPath();
        ctx.ellipse(x, y, 45 * k, 12 * k, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 25 * k, y - 6 * k, 25 * k, 10 * k, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'gold':
      for (const s of specks) {
        const x = x0 + s.x * w;
        const y = yOf(s, time * 8 * s.z * k);
        const tw = Math.max(0, Math.sin(time * 2.5 + s.r * 40));
        const r = (2 + s.z * 8) * tw * k;
        if (r < 0.3) continue;
        ctx.fillStyle = `rgba(255,215,90,${0.4 + s.z})`;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 2);
        ctx.quadraticCurveTo(x, y, x + r * 2, y);
        ctx.quadraticCurveTo(x, y, x, y + r * 2);
        ctx.quadraticCurveTo(x, y, x - r * 2, y);
        ctx.quadraticCurveTo(x, y, x, y - r * 2);
        ctx.fill();
      }
      break;
  }
  ctx.globalAlpha = 1;
}
