// Collections with long-term goals: sous-chef companions, the restaurant you renovate with stars,
// and the seasonal sticker album.

// ---------------------------------------------------------------- companions

export type CompanionId = 'neko' | 'tanuki' | 'owl' | 'fox' | 'panda' | 'swan';

export interface Companion { id: CompanionId; name: string; emoji: string; power: (lv: number) => string }

export const COMPANIONS: Companion[] = [
  { id: 'neko', name: 'Neko', emoji: '🐱', power: (lv) => `Catches the first ${blocks(lv)} knife${blocks(lv) > 1 ? 's' : ''} each run` },
  { id: 'tanuki', name: 'Tanuki', emoji: '🦝', power: (lv) => `Blocks the first ${lv} soy splash${lv > 1 ? 'es' : ''} each run` },
  { id: 'owl', name: 'Owl', emoji: '🦉', power: (lv) => `Shows guide lines for ${lv * 10} layers` },
  { id: 'fox', name: 'Kitsune', emoji: '🦊', power: (lv) => `+${lv * 5}% coins` },
  { id: 'panda', name: 'Panda', emoji: '🐼', power: (lv) => `First ${2 + lv} layers move slowly` },
  { id: 'swan', name: 'Swan', emoji: '🦢', power: (lv) => `Rebuilds a thin stack ${Math.ceil(lv / 2)}x per run` },
];

function blocks(lv: number): number {
  return [1, 1, 2, 2, 3][lv - 1] ?? 1;
}
export const nekoBlocks = blocks;

/** Shards needed to unlock (level 1) and then to reach each next level, up to 5. */
export const SHARD_STEPS = [10, 15, 25, 40, 60];

export function companionLevel(shards: number): number {
  let lv = 0;
  let need = 0;
  for (const s of SHARD_STEPS) {
    need += s;
    if (shards >= need) lv++;
  }
  return lv;
}

export function shardsForNext(shards: number): { have: number; need: number } | null {
  let total = 0;
  for (const s of SHARD_STEPS) {
    if (shards < total + s) return { have: shards - total, need: s };
    total += s;
  }
  return null; // max level
}

// ---------------------------------------------------------------- restaurant

export type AreaId = 'counter' | 'lanterns' | 'aquarium' | 'noren' | 'garden' | 'art' | 'sign' | 'conveyor';

export const AREAS: { id: AreaId; name: string; icon: string; perks: string[] }[] = [
  { id: 'counter', name: 'Sushi Counter', icon: '🍣', perks: ['A wooden counter for your first guests', 'Polished counter with stools: more guests sit down', 'Marble and gold: the best seat in town'] },
  { id: 'lanterns', name: 'Lanterns', icon: '🏮', perks: ['Two paper lanterns', 'A row of lanterns', 'Glowing lanterns light up the room'] },
  { id: 'aquarium', name: 'Fish Tank', icon: '🐠', perks: ['A small tank with a fish', 'Bigger tank, more fish', 'Coral reef tank'] },
  { id: 'noren', name: 'Noren Curtain', icon: '🎏', perks: ['A blue doorway curtain', 'Red sushi curtain', 'Gold-trimmed curtain'] },
  { id: 'garden', name: 'Bonsai Garden', icon: '🌳', perks: ['A potted plant', 'A bonsai tree', 'Zen garden with stone lantern'] },
  { id: 'art', name: 'Wall Art', icon: '🖼️', perks: ['A wave painting', 'Mount Fuji painting', 'Framed masterpiece in gold'] },
  { id: 'sign', name: 'Shop Sign', icon: '🪧', perks: ['A wooden sign', 'A painted sign', 'Neon sign that glows'] },
  { id: 'conveyor', name: 'Conveyor Belt', icon: '🍱', perks: ['A conveyor belt', 'Plates ride the belt', 'Sushi rides the belt'] },
];

/** Tips the restaurant earns per hour while you're away (collected on the Restaurant screen). */
export function tipRate(tier: number, levels: number[]): number {
  return 10 + 3 * levels.reduce((a, b) => a + b, 0) + 15 * tier;
}
export const TIP_HOURS = 8; // the tip jar fills up after this long

/** Popularity shown as 1-5 stars: it grows with every upgrade and every finished restaurant. */
export function popularity(tier: number, levels: number[]): number {
  return Math.min(5, 1 + tier + Math.floor(levels.reduce((a, b) => a + b, 0) / 6));
}

export const RESTAURANTS = [
  { name: 'Street Stall', wall: '#7a4e2a', floor: '#5a3a22', reward: { cat: 'plate' as const, id: 'stall', name: 'Street Stall Plate' } },
  { name: 'Cozy Izakaya', wall: '#4b2a3a', floor: '#2a1a22', reward: { cat: 'flag' as const, id: 'noren', name: 'Noren Flag' } },
  { name: 'Grand Sushi Palace', wall: '#1a2a3a', floor: '#0f1a24', reward: { cat: 'fx' as const, id: 'goldleaf', name: 'Gold Leaf FX' } },
];

export const AREA_MAX = 3;

/** Stars needed for the next level of an area in restaurant r (0-based). */
export function areaCost(r: number, nextLevel: number): number {
  return nextLevel * (r + 1) + (r > 2 ? (r - 2) * 3 : 0);
}

// ------------------------------------------------------------- sticker album

export interface StickerSet { name: string; stickers: string[] }

export const STICKER_SETS: StickerSet[] = [
  { name: 'Nigiri', stickers: ['🍣', '🍤', '🐟', '🦐', '🦑', '🐙', '🦀', '🦞', '🦪'] },
  { name: 'Rolls', stickers: ['🍙', '🍘', '🍥', '🥢', '🥒', '🥑', '🥚', '🍚', '🌯'] },
  { name: 'Sea Friends', stickers: ['🐠', '🐡', '🐬', '🐳', '🦈', '🐢', '🪼', '🐚', '🐋'] },
  { name: 'Kitchen', stickers: ['🔪', '🍳', '🥄', '🫖', '🍶', '🧂', '🥡', '🍱', '🏮'] },
  { name: 'Sweets', stickers: ['🍡', '🍮', '🍧', '🍨', '🍰', '🍬', '🍭', '🧁', '🍵'] },
  { name: 'Lucky Charms', stickers: ['🎋', '🎍', '🧧', '🪭', '🎐', '🀄', '🪷', '🍀', '🎴'] },
  { name: 'Festivals', stickers: ['🎆', '🎇', '🎏', '🎑', '🎎', '🏯', '⛩️', '🎊', '🥁'] },
  { name: 'Cities', stickers: ['🗼', '🏙️', '🌉', '🗾', '🌃', '🚅', '🏰', '🛕', '🌆'] },
  { name: 'Nature', stickers: ['🌸', '🍁', '🌊', '🗻', '🌙', '☀️', '🌈', '🎋', '🌺'] },
  { name: 'Animals', stickers: ['🐱', '🦊', '🐼', '🦉', '🦝', '🐸', '🐧', '🐶', '🐰'] },
  { name: 'Treasures', stickers: ['💎', '👑', '🏆', '🪙', '💰', '🎁', '⭐', '🔮', '🗝️'] },
  { name: 'Legends', stickers: ['🐉', '🦄', '🔥', '⚡', '🌟', '🌌', '🪐', '☄️', '🌠'] },
];

/** Rarity 1-5 stars by position in the set (the last stickers are the rarest). */
export function stickerRarity(set: number, pos: number): number {
  const base = pos < 4 ? 1 : pos < 6 ? 2 : pos < 8 ? 3 : 4;
  return set === STICKER_SETS.length - 1 ? Math.min(5, base + 1) : base;
}

const RARITY_WEIGHT = [0, 50, 28, 15, 6, 1];

/** Picks a random sticker (set, position), weighted so rare ones are rare. */
export function rollSticker(rand: () => number = Math.random): [number, number] {
  const all: [number, number, number][] = [];
  STICKER_SETS.forEach((s, i) => s.stickers.forEach((_, p) => all.push([i, p, RARITY_WEIGHT[stickerRarity(i, p)]])));
  const total = all.reduce((a, b) => a + b[2], 0);
  let x = rand() * total;
  for (const [i, p, w] of all) {
    x -= w;
    if (x <= 0) return [i, p];
  }
  return [0, 0];
}

export const SET_REWARD = (i: number) => 150 + i * 50;
export const ALBUM_REWARD = 3000;
