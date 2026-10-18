// Everything players can spend coins on. Backgrounds are free and rotate during play, so coins go to these.

export type Cat = 'deals' | 'booster' | 'plate' | 'flag' | 'set' | 'fx';
export type Cosmetic = Exclude<Cat, 'booster' | 'deals'>;

export interface Item { id: string; name: string; price: number; earn?: string } // `earn` = exclusive: can't be bought, only earned

export type BoosterId = 'chance' | 'double' | 'slow' | 'wide' | 'magnet' | 'shield' | 'lucky' | 'short' | 'streak';

export interface Booster extends Item { id: BoosterId; desc: string; color: string; glyph: string }

// Consumables: each one bought is used up on the next run (Second Chance only when you actually miss).
export const BOOSTERS: Booster[] = [
  { id: 'chance', name: 'Second Chance', desc: 'Survive one miss', price: 40, color: '#e85d75', glyph: '♥' },
  { id: 'double', name: 'Coin Doubler', desc: '2x coins for a run', price: 50, color: '#f2b705', glyph: '2x' },
  { id: 'slow', name: 'Slow Start', desc: 'Slower first 15', price: 25, color: '#4aa3df', glyph: '◷' },
  { id: 'wide', name: 'Wide Base', desc: 'Start 30% wider', price: 30, color: '#6cc070', glyph: '↔' },
  { id: 'magnet', name: 'Perfect Magnet', desc: 'Bigger PERFECT zone', price: 60, color: '#ff8a5b', glyph: '◎' },
  { id: 'shield', name: 'Chef Shield', desc: 'No chef attacks', price: 70, color: '#7b6cf6', glyph: '⛨' },
  { id: 'lucky', name: 'Lucky Charm', desc: 'Chefs help 2x more', price: 45, color: '#2a9d5c', glyph: '✿' },
  { id: 'short', name: 'Short Orders', desc: 'Orders 2 layers less', price: 55, color: '#d4a537', glyph: '−2' },
  { id: 'streak', name: 'Hot Streak', desc: 'Start on a 3x combo', price: 35, color: '#e63946', glyph: '3x' },
];

// World Tour city plates: [id, name, colour 1, colour 2].
export const CITY_PLATES: [string, string, string, string][] = [
  ['tokyo', 'Tokyo', '#ff3b3b', '#ffffff'], ['osaka', 'Osaka', '#e9c46a', '#264653'], ['seoul', 'Seoul', '#4cc9f0', '#3a0ca3'],
  ['bangkok', 'Bangkok', '#ffd60a', '#9d0208'], ['hongkong', 'Hong Kong', '#90e0ef', '#03045e'], ['taipei', 'Taipei', '#16c79a', '#f6c90e'],
  ['singapore', 'Singapore', '#ffd166', '#ef476f'],
];


// Cosmetic: the plate your roll sits on.
export const PLATES: Item[] = [
  { id: 'classic', name: 'Classic Plate', price: 0 },
  { id: 'geta', name: 'Wooden Geta', price: 60 },
  { id: 'slate', name: 'Black Slate', price: 100 },
  { id: 'bamboo', name: 'Bamboo Mat', price: 150 },
  { id: 'sakura', name: 'Sakura Plate', price: 180 },
  { id: 'wave', name: 'Wave Porcelain', price: 220 },
  { id: 'marble', name: 'Marble Slab', price: 280 },
  { id: 'lacquer', name: 'Red Lacquer', price: 340 },
  { id: 'gold', name: 'Gold Platter', price: 400 },
  { id: 'ice', name: 'Ice Crystal', price: 500 },
  { id: 'neon', name: 'Neon Tray', price: 600 },
  { id: 'diamond', name: 'Diamond Plate', price: 900 },
  { id: 'dragon', name: 'Dragon Plate', price: 0, earn: '10 chest pieces' },
  { id: 'starter', name: 'Sakura Bento', price: 0, earn: 'Starter Pack' },
  { id: 'stall', name: 'Street Stall Plate', price: 0, earn: 'Finish the Street Stall' },
  { id: 'season', name: 'Season Plate', price: 0, earn: 'Sushi Pass premium, tier 30' },
  { id: 'hanami', name: 'Hanami Plate', price: 0, earn: 'Cherry Blossom Festival' },
  { id: 'snowflake', name: 'Snowflake Plate', price: 0, earn: 'Winter Holidays event' },
  ...CITY_PLATES.map(([id, name]) => ({ id: `city-${id}`, name: `${name} Plate`, price: 0, earn: `World Tour: ${name}` })),
];


// Cosmetic: the pick planted on the stack for every served order.
export const FLAGS: Item[] = [
  { id: 'pennant', name: 'Pennant', price: 0 },
  { id: 'heart', name: 'Heart Pick', price: 40 },
  { id: 'star', name: 'Star Pick', price: 70 },
  { id: 'fish', name: 'Koi Pick', price: 110 },
  { id: 'fan', name: 'Paper Fan', price: 150 },
  { id: 'lantern', name: 'Lantern Pick', price: 200 },
  { id: 'rainbow', name: 'Rainbow Flag', price: 300 },
  { id: 'crown', name: 'Crown Pick', price: 500 },
  { id: 'week', name: 'Golden Week', price: 0, earn: '7-day gift streak' },
  { id: 'noren', name: 'Noren Flag', price: 0, earn: 'Finish the Cozy Izakaya' },
  { id: 'lunar', name: 'Lucky Red Flag', price: 0, earn: 'Lunar New Year event' },
  { id: 'trophy', name: 'Cup Trophy', price: 0, earn: 'Win a weekend Sushi Cup' },
  { id: 'album', name: 'Album Master', price: 0, earn: 'Complete a sticker album' },
];

export type Ingredient = 'rice' | 'nori' | 'salmon' | 'tuna' | 'avocado' | 'cucumber' | 'egg';

// Cosmetic: recolours every layer.
export const SETS: (Item & { colors: Partial<Record<Ingredient, string>> })[] = [
  { id: 'classic', name: 'Classic', price: 0, colors: {} },
  { id: 'pastel', name: 'Pastel', price: 120, colors: { rice: '#fff8f0', nori: '#5f7a6b', salmon: '#ffc2a8', tuna: '#f7a1b0', avocado: '#cde8a6', cucumber: '#9fd4a8', egg: '#fff0a8' } },
  { id: 'forest', name: 'Forest', price: 180, colors: { rice: '#f4f1e1', nori: '#1e3a1e', salmon: '#c97b4a', tuna: '#8f3b2a', avocado: '#7fa83a', cucumber: '#3f7a3a', egg: '#e8c25a' } },
  { id: 'ocean', name: 'Ocean', price: 250, colors: { rice: '#eaf6ff', nori: '#0d2b45', salmon: '#5ec2ff', tuna: '#2f7dd6', avocado: '#7fe0d0', cucumber: '#2fb39a', egg: '#bfe6ff' } },
  { id: 'candy', name: 'Candy', price: 350, colors: { rice: '#ffffff', nori: '#7a3e9d', salmon: '#ff8fcf', tuna: '#ff4f7a', avocado: '#b6f26b', cucumber: '#5fe0b0', egg: '#ffd84f' } },
  { id: 'ink', name: 'Ink & Paper', price: 450, colors: { rice: '#f2f2f2', nori: '#111111', salmon: '#9a9a9a', tuna: '#555555', avocado: '#c4c4c4', cucumber: '#7a7a7a', egg: '#dadada' } },
  { id: 'neon', name: 'Neon', price: 700, colors: { rice: '#e8fbff', nori: '#1a1030', salmon: '#ff5ec4', tuna: '#ff2a6d', avocado: '#7dff6a', cucumber: '#00f0c8', egg: '#fff04a' } },
  { id: 'golden', name: 'Golden', price: 1200, colors: { rice: '#fff4d6', nori: '#3a2a08', salmon: '#f2b84b', tuna: '#d4952a', avocado: '#e8d27a', cucumber: '#b8a046', egg: '#ffd84f' } },
  { id: 'legend', name: 'Legend', price: 0, earn: 'Beat level 50', colors: { rice: '#fdf0d5', nori: '#14080e', salmon: '#c1121f', tuna: '#780000', avocado: '#ffd34d', cucumber: '#e09f3e', egg: '#fff3b0' } },
];

export type Shape = 'square' | 'heart' | 'star' | 'petal' | 'coin' | 'bubble' | 'fire' | 'bolt' | 'bat';

// Cosmetic: what bursts out of a PERFECT drop.
export const EFFECTS: (Item & { shape: Shape; colors: string[] })[] = [
  { id: 'sparkle', name: 'Sparkles', price: 0, shape: 'square', colors: ['#fff3b0'] },
  { id: 'hearts', name: 'Hearts', price: 80, shape: 'heart', colors: ['#ff5d8f', '#ff9eb0'] },
  { id: 'petals', name: 'Petals', price: 120, shape: 'petal', colors: ['#ffd1e3', '#ff9ec4'] },
  { id: 'bubbles', name: 'Bubbles', price: 160, shape: 'bubble', colors: ['#bdf0ff', '#ffffff'] },
  { id: 'stars', name: 'Stars', price: 220, shape: 'star', colors: ['#ffd34d', '#fff3b0'] },
  { id: 'coins', name: 'Coin Shower', price: 300, shape: 'coin', colors: ['#ffd34d'] },
  { id: 'fire', name: 'Fire', price: 500, shape: 'fire', colors: ['#ff6b1a', '#ffb703', '#ff3d3d'] },
  { id: 'bolt', name: 'Lightning', price: 800, shape: 'bolt', colors: ['#fff04a', '#9fe3ff'] },
  { id: 'phoenix', name: 'Phoenix', price: 0, earn: '25 chest pieces', shape: 'fire', colors: ['#ff006e', '#ffbe0b', '#8338ec', '#fb5607'] },
  { id: 'goldleaf', name: 'Gold Leaf', price: 0, earn: 'Finish the Grand Sushi Palace', shape: 'petal', colors: ['#ffd34d', '#f2b705', '#fff3b0'] },
  { id: 'fireworks', name: 'Fireworks', price: 0, earn: 'Summer Fireworks event', shape: 'star', colors: ['#ff006e', '#4cc9f0', '#ffd60a', '#80ffdb'] },
  { id: 'bats', name: 'Bat Swarm', price: 0, earn: 'Spooky Sushi Night event', shape: 'bat', colors: ['#2b2d42', '#ff7b00'] },
];

export const CATALOG: Record<Cosmetic, Item[]> = { plate: PLATES, flag: FLAGS, set: SETS, fx: EFFECTS };

export const TABS: { cat: Cat; label: string; hint: string }[] = [
  { cat: 'deals', label: 'DEALS', hint: 'Packs, VIP, piggy bank and free chests' },
  { cat: 'booster', label: 'BOOST', hint: 'Used up on your next run' },
  { cat: 'plate', label: 'PLATES', hint: 'Your roll sits on it' },
  { cat: 'flag', label: 'FLAGS', hint: 'Planted for every served order' },
  { cat: 'set', label: 'SUSHI', hint: 'Recolours every layer' },
  { cat: 'fx', label: 'FX', hint: 'Bursts out on a PERFECT' },
];

// Path helper; avoids ctx.roundRect, which older iOS WebViews lack.
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws a plate whose top edge is at y, centred on cx, 272 units wide at scale 1. */
export function drawPlate(ctx: CanvasRenderingContext2D, id: string, cx: number, y: number, s = 1): void {
  const w = 272 * s;
  const h = 14 * s;
  const x = cx - w / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, x - 4 * s, y + 6 * s, w + 8 * s, h + 2 * s, 8 * s);
  ctx.fill();

  switch (id) {
    case 'geta':
      ctx.fillStyle = '#7a4e2a';
      ctx.fillRect(cx - 100 * s, y + h, 22 * s, 9 * s);
      ctx.fillRect(cx + 78 * s, y + h, 22 * s, 9 * s);
      ctx.fillStyle = '#b07a45';
      rr(ctx, x, y - 2 * s, w, h + 2 * s, 3 * s);
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
      rr(ctx, x, y, w, h, 2 * s);
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
      rr(ctx, x, y, w, h, 7 * s);
      ctx.fill();
      ctx.save();
      rr(ctx, x, y, w, h, 7 * s);
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
      rr(ctx, x, y, w, h, 7 * s);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x + 20 * s, y + 3 * s, w * 0.3, 1.5 * s);
      break;
    }
    case 'marble':
      ctx.fillStyle = '#f1efec';
      rr(ctx, x, y, w, h, 3 * s);
      ctx.fill();
      ctx.save();
      rr(ctx, x, y, w, h, 3 * s);
      ctx.clip();
      ctx.strokeStyle = 'rgba(120,120,130,0.5)';
      ctx.lineWidth = 1 * s;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 48 * s, y);
        ctx.bezierCurveTo(x + (i * 48 + 20) * s, y + 8 * s, x + (i * 48 + 10) * s, y + 4 * s, x + (i * 48 + 40) * s, y + h);
        ctx.stroke();
      }
      ctx.restore();
      break;
    case 'sakura':
      ctx.fillStyle = '#ffd6e5';
      rr(ctx, x, y, w, h, 7 * s);
      ctx.fill();
      ctx.fillStyle = '#ff8fb8';
      for (let i = 0; i < 9; i++) {
        const fx = x + (14 + i * 30) * s;
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * 2.6 * s, y + 7 * s + Math.sin(a) * 2.6 * s, 1.8 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    case 'neon':
      ctx.fillStyle = '#16121f';
      rr(ctx, x, y, w, h, 7 * s);
      ctx.fill();
      ctx.shadowColor = '#3ff0ff';
      ctx.shadowBlur = 12 * s;
      ctx.strokeStyle = '#3ff0ff';
      ctx.lineWidth = 2 * s;
      ctx.stroke();
      ctx.shadowColor = '#ff3fa4';
      ctx.strokeStyle = '#ff3fa4';
      ctx.beginPath();
      ctx.moveTo(x + 14 * s, y + 9 * s);
      ctx.lineTo(x + w - 14 * s, y + 9 * s);
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    case 'lacquer':
      ctx.fillStyle = '#b3202a';
      rr(ctx, x, y, w, h, 4 * s);
      ctx.fill();
      ctx.strokeStyle = '#1a0a0a';
      ctx.lineWidth = 2.5 * s;
      ctx.stroke();
      ctx.fillStyle = '#e8c25a';
      ctx.fillRect(x + 10 * s, y + 6 * s, w - 20 * s, 1.5 * s);
      break;
    case 'ice': {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, 'rgba(230,250,255,0.95)');
      g.addColorStop(1, 'rgba(150,210,240,0.85)');
      ctx.fillStyle = g;
      rr(ctx, x, y, w, h, 5 * s);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1 * s;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x + (30 + i * 52) * s, y + 2 * s);
        ctx.lineTo(x + (40 + i * 52) * s, y + 10 * s);
        ctx.lineTo(x + (34 + i * 52) * s, y + 12 * s);
        ctx.stroke();
      }
      break;
    }
    case 'diamond': {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#e0f7ff');
      g.addColorStop(0.3, '#ffffff');
      g.addColorStop(0.6, '#c9e9ff');
      g.addColorStop(1, '#f5e0ff');
      ctx.fillStyle = g;
      rr(ctx, x, y, w, h, 7 * s);
      ctx.fill();
      ctx.strokeStyle = '#8fd0ff';
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();
      for (let i = 0; i < 4; i++) drawShape(ctx, 'star', x + (40 + i * 64) * s, y + 7 * s, 4 * s, '#ffffff', 0);
      break;
    }
    case 'dragon': {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#9d0208');
      g.addColorStop(1, '#370617');
      ctx.fillStyle = g;
      rr(ctx, x, y, w, h, 7 * s);
      ctx.fill();
      ctx.strokeStyle = '#ffba08';
      ctx.lineWidth = 1.2 * s;
      for (let i = 0; i * 12 * s < w - 12 * s; i++) {
        ctx.beginPath();
        ctx.arc(x + (10 + i * 12) * s, y + 9 * s, 5 * s, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 1.8 * s;
      rr(ctx, x, y, w, h, 7 * s);
      ctx.stroke();
      break;
    }
    case 'starter':
    case 'hanami':
    case 'snowflake':
    case 'stall':
    case 'season': {
      const look: Record<string, [string, string, string]> = {
        starter: ['#2b1b17', '#ff8fb8', '#ffd6e5'], hanami: ['#ffe5ec', '#ff5d8f', '#ffffff'], snowflake: ['#e0f7ff', '#4cc9f0', '#ffffff'],
        stall: ['#c8553d', '#2d1e2f', '#f4d35e'], season: ['#3c096c', '#ffd34d', '#e0aaff'],
      };
      const [base, trim, dot] = look[id];
      ctx.fillStyle = base;
      rr(ctx, x, y, w, h, 6 * s);
      ctx.fill();
      ctx.strokeStyle = trim;
      ctx.lineWidth = 2 * s;
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const dx = x + (20 + i * 33) * s;
        if (id === 'snowflake') drawShape(ctx, 'star', dx, y + 7 * s, 3.5 * s, dot, 0);
        else if (id === 'stall') ctx.fillRect(dx - 6 * s, y + 5 * s, 12 * s, 3 * s);
        else drawShape(ctx, id === 'season' ? 'star' : 'petal', dx, y + 7 * s, 3.5 * s, dot, i);
      }
      break;
    }
    default: {
      const city = CITY_PLATES.find(([c]) => id === `city-${c}`);
      if (city) {
        const g = ctx.createLinearGradient(x, y, x + w, y);
        g.addColorStop(0, city[2]);
        g.addColorStop(1, city[3]);
        ctx.fillStyle = g;
        rr(ctx, x, y, w, h, 7 * s);
        ctx.fill();
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 1.6 * s;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `900 ${9 * s}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(city[1].toUpperCase(), cx, y + 7.5 * s);
        break;
      }
      ctx.fillStyle = '#f4f7fb';
      rr(ctx, x, y, w, h, 7 * s);
      ctx.fill();
      ctx.fillStyle = '#3d6fb6';
      ctx.fillRect(x + 12 * s, y + 9 * s, w - 24 * s, 2 * s);
    }
  }
}

/** Draws a served-order pick standing on (x, y). */
export function drawFlag(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, hue: number): void {
  ctx.strokeStyle = '#e8d3a8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x, y - 30);
  ctx.stroke();
  const ty = y - 30;
  switch (id) {
    case 'heart':
      drawShape(ctx, 'heart', x, ty, 9, '#ff5d8f', 0);
      break;
    case 'star':
      drawShape(ctx, 'star', x, ty, 10, '#ffd34d', 0);
      break;
    case 'fish':
      ctx.fillStyle = '#ff8a3d';
      ctx.beginPath();
      ctx.ellipse(x + 8, ty, 10, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 1, ty);
      ctx.lineTo(x - 7, ty - 5);
      ctx.lineTo(x - 7, ty + 5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 8, ty - 4, 4, 2);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(x + 14, ty - 1, 1.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'crown':
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.moveTo(x - 9, ty + 5);
      ctx.lineTo(x - 9, ty - 5);
      ctx.lineTo(x - 4, ty);
      ctx.lineTo(x, ty - 8);
      ctx.lineTo(x + 4, ty);
      ctx.lineTo(x + 9, ty - 5);
      ctx.lineTo(x + 9, ty + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(x, ty + 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'lantern':
      ctx.fillStyle = '#d7263d';
      ctx.beginPath();
      ctx.ellipse(x, ty, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b1020';
      ctx.fillRect(x - 4, ty - 10, 8, 2.5);
      ctx.fillRect(x - 4, ty + 8, 8, 2.5);
      break;
    case 'fan':
      ctx.fillStyle = '#f4e1c1';
      ctx.beginPath();
      ctx.moveTo(x, ty + 6);
      ctx.arc(x, ty + 6, 14, Math.PI * 1.15, Math.PI * 1.85);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.15 + i * 0.175);
        ctx.beginPath();
        ctx.moveTo(x, ty + 6);
        ctx.lineTo(x + Math.cos(a) * 14, ty + 6 + Math.sin(a) * 14);
        ctx.stroke();
      }
      break;
    case 'rainbow': {
      const cols = ['#e63946', '#f4a261', '#ffd34d', '#6cc070', '#4aa3df', '#9b5de5'];
      cols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, ty + i * 2, 20, 2);
      });
      break;
    }
    case 'noren':
      ['#2d1e2f', '#c8553d', '#2d1e2f'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(x + i * 7, ty - 1, 6, 16);
      });
      break;
    case 'lunar':
      ctx.fillStyle = '#d00000';
      ctx.fillRect(x, ty - 1, 20, 14);
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(x + 10, ty + 6, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'trophy':
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.moveTo(x - 8, ty - 6);
      ctx.lineTo(x + 8, ty - 6);
      ctx.quadraticCurveTo(x + 8, ty + 6, x, ty + 7);
      ctx.quadraticCurveTo(x - 8, ty + 6, x - 8, ty - 6);
      ctx.fill();
      ctx.fillRect(x - 4, ty + 7, 8, 3);
      break;
    case 'album':
      ctx.fillStyle = '#7b2cbf';
      ctx.fillRect(x, ty - 2, 18, 14);
      drawShape(ctx, 'star', x + 9, ty + 5, 5, '#ffd34d', 0);
      break;
    case 'week':
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(x, ty - 1, 20, 13);
      ctx.fillStyle = '#7a4a00';
      ctx.font = '900 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('7', x + 10, ty + 6);
      break;
    default:
      ctx.fillStyle = `hsl(${hue} 80% 60%)`;
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x + 18, ty + 5);
      ctx.lineTo(x, ty + 10);
      ctx.closePath();
      ctx.fill();
  }
}

/** Draws one particle of the given shape centred on (x, y). */
export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, size: number, color: string, rot: number): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (shape) {
    case 'square':
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      break;
    case 'heart':
      ctx.beginPath();
      ctx.moveTo(x, y + size * 0.7);
      ctx.bezierCurveTo(x - size * 1.2, y - size * 0.1, x - size * 0.5, y - size * 0.9, x, y - size * 0.3);
      ctx.bezierCurveTo(x + size * 0.5, y - size * 0.9, x + size * 1.2, y - size * 0.1, x, y + size * 0.7);
      ctx.fill();
      break;
    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? size * 0.45 : size;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;
    case 'petal':
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 0.55, rot, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'coin':
      ctx.beginPath();
      ctx.ellipse(x, y, size * Math.max(0.2, Math.abs(Math.cos(rot))), size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = size * 0.25;
      ctx.stroke();
      break;
    case 'bubble':
      ctx.lineWidth = Math.max(1, size * 0.2);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(x - size * 0.4, y - size * 0.5, size * 0.3, size * 0.3);
      break;
    case 'fire':
      ctx.beginPath();
      ctx.moveTo(x, y - size * 1.3);
      ctx.quadraticCurveTo(x + size, y, x, y + size * 0.7);
      ctx.quadraticCurveTo(x - size, y, x, y - size * 1.3);
      ctx.fill();
      break;
    case 'bat':
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - size * 0.6, y - size * 0.9, x - size * 1.3, y - size * 0.3);
      ctx.quadraticCurveTo(x - size * 0.8, y - size * 0.1, x - size * 0.6, y + size * 0.3);
      ctx.quadraticCurveTo(x - size * 0.3, y, x, y + size * 0.3);
      ctx.quadraticCurveTo(x + size * 0.3, y, x + size * 0.6, y + size * 0.3);
      ctx.quadraticCurveTo(x + size * 0.8, y - size * 0.1, x + size * 1.3, y - size * 0.3);
      ctx.quadraticCurveTo(x + size * 0.6, y - size * 0.9, x, y);
      ctx.fill();
      break;
    case 'bolt':
      ctx.beginPath();
      ctx.moveTo(x + size * 0.2, y - size);
      ctx.lineTo(x - size * 0.5, y + size * 0.1);
      ctx.lineTo(x, y + size * 0.1);
      ctx.lineTo(x - size * 0.2, y + size);
      ctx.lineTo(x + size * 0.5, y - size * 0.1);
      ctx.lineTo(x, y - size * 0.1);
      ctx.closePath();
      ctx.fill();
      break;
  }
}
