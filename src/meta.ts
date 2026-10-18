// Personality and long-term goals: the player's own chef, regular customers, story chapters,
// achievements, the picture gallery and themed Pass seasons. Pure data and small helpers; the
// screens that show them live in game.ts.

import { CHEFS, type Chef, type Face, type Hair, type Hat } from './chef';

// ------------------------------------------------------------------ avatar

export interface Avatar { name: string; skin: number; hair: number; hairColor: number; hat: number; outfit: number; accent: number; face: number }

export const AVATAR_OPTIONS = {
  skin: ['#f5d6bd', '#f1c9a5', '#e8b98f', '#d9a77c', '#c98e64', '#a8714a', '#8a5a3b', '#6b4329'],
  hair: ['short', 'bun', 'bob', 'spiky', 'ponytail', 'twinbuns', 'curly', 'long', 'mohawk', 'bald'] as Hair[],
  hairColor: ['#1d1a1a', '#3a2418', '#6b3e26', '#c0392b', '#e9c46a', '#d8d8d8', '#3c096c', '#ff70a6'],
  hat: ['toque', 'hachimaki', 'bandana', 'cap', 'beanie', 'visor', 'flower', 'shades', 'none', 'gold', 'crown'] as Hat[],
  outfit: ['#ffffff', '#f7b2c8', '#9ad1d4', '#2d2d2d', '#ffe08a', '#3b5b7a', '#d8f3dc', '#26104a', '#9d0208'],
  accent: ['#d7263d', '#3d6fb6', '#2a9d5c', '#f2b705', '#ff5d8f', '#7b2cbf', '#e76f51', '#111111'],
  face: ['none', 'freckles', 'glasses', 'mustache', 'goatee', 'beard'] as Face[],
};

export const AVATAR_LABELS: Record<string, string[]> = {
  hair: ['Short', 'Bun', 'Bob', 'Spiky', 'Ponytail', 'Twin buns', 'Curly', 'Long', 'Mohawk', 'Bald'],
  hat: ['Chef toque', 'Headband', 'Bandana', 'Cap', 'Beanie', 'Visor', 'Flower', 'Shades', 'No hat', 'Golden toque', 'Crown'],
  face: ['Plain', 'Freckles', 'Glasses', 'Mustache', 'Goatee', 'Beard'],
};

/** Hats earned on the journey: the golden toque for beating Grand Chef Kaito, the crown for the story. */
export const AVATAR_LOCKS: Record<number, { level: number; text: string }> = {
  9: { level: 11, text: 'Beat Grand Chef Kaito (level 10)' },
  10: { level: 51, text: 'Finish the story (level 50)' },
};

export const NAMES = ['Rookie', 'Momo', 'Sora', 'Kai', 'Nori', 'Yuzu', 'Tama', 'Riku', 'Mochi', 'Hiro', 'Suki', 'Ren', 'Kiki', 'Taki', 'Uni', 'Zen', 'Miso', 'Tofu', 'Ume', 'Koji', 'Aya', 'Bo', 'Lulu', 'Pip'];

export const DEFAULT_AVATAR: Avatar = { name: 'Rookie', skin: 1, hair: 0, hairColor: 0, hat: 0, outfit: 0, accent: 0, face: 0 };

/** Turns the avatar into a chef the shared drawing code understands. */
export function avatarChef(a: Avatar): Chef {
  const o = AVATAR_OPTIONS;
  return {
    ...CHEFS[0],
    name: `Chef ${a.name}`,
    skin: o.skin[a.skin % o.skin.length],
    hair: o.hair[a.hair % o.hair.length],
    hairColor: o.hairColor[a.hairColor % o.hairColor.length],
    hat: o.hat[a.hat % o.hat.length],
    outfit: o.outfit[a.outfit % o.outfit.length],
    accent: o.accent[a.accent % o.accent.length],
    face: o.face[a.face % o.face.length],
  };
}

// --------------------------------------------------------------- customers

export interface Regular { id: string; name: string; emoji: string; look: number; level: number; favorite: string; lines: string[]; request: string }

/** Named regulars who order from you. Their hearts grow every time you serve them. */
export const REGULARS: Regular[] = [
  { id: 'tanaka', name: 'Mrs. Tanaka', emoji: '👵', look: 0.62, level: 1, favorite: 'Salmon Maki', request: 'Just like my late husband made it!', lines: ['Lovely, dear!', 'Just like the old days.', 'You remind me of my grandson.', 'I told all my friends about you!', 'You’re family now, dear.'] },
  { id: 'ken', name: 'Ken the Salaryman', emoji: '👨‍💼', look: 0.13, level: 2, favorite: 'Tuna Classic', request: 'Big meeting, I need the best!', lines: ['Fuel for overtime!', 'Fastest lunch in Tokyo.', 'My boss wants your number.', 'Got promoted. Thanks to you!', 'Best part of my day.'] },
  { id: 'yumi', name: 'Yumi the Student', emoji: '👩‍🎓', look: 0.77, level: 4, favorite: 'Green Roll', request: 'Exam tomorrow, brain food please!', lines: ['Study snack!', 'This is so photogenic.', 'Posted you on my story!', 'Passed my exams!', 'Can I work here one day?'] },
  { id: 'mori', name: 'Officer Mori', emoji: '👮', look: 0.31, level: 6, favorite: 'Rainbow Roll', request: 'Double shift. Make it a big one.', lines: ['Keeping the peace.', 'Strictly by the book. Delicious.', 'Safest kitchen in the district.', 'Off duty: tell me your secret.', 'You’re a local hero.'] },
  { id: 'sora', name: 'Little Sora', emoji: '👦', look: 0.05, level: 9, favorite: 'Tamago Tower', request: 'It’s my birthday!!', lines: ['Yummy!!', 'Can I have another?', 'I want to be a sushi chef!', 'I drew you a picture!', 'You’re my hero!'] },
  { id: 'bella', name: 'Bella the Tourist', emoji: '👩‍🦰', look: 0.88, level: 12, favorite: 'Ebi Tempura Roll', request: 'Last night in Japan, make it special!', lines: ['Arigato!', 'Better than back home!', 'I extended my trip for this.', 'Moving to Tokyo!', 'You’re why I stayed.'] },
  { id: 'ito', name: 'Grandpa Ito', emoji: '👴', look: 0.45, level: 16, favorite: 'Unagi Dragon Roll', request: 'Fifty years married today!', lines: ['Hmm. Good.', 'Proper knife work.', 'Reminds me of my youth.', 'You have the old spirit.', 'Take my old knife. It’s yours.'] },
  { id: 'neko', name: 'Neko the Stray', emoji: '🐱', look: 0.22, level: 20, favorite: 'Ikura Gunkan', request: 'Mrrrow! (extra fish)', lines: ['Mrow!', 'Purrrr...', '*rubs against your leg*', '*brings you a sock*', '*moves in permanently*'] },
  { id: 'star', name: 'Rina the Idol', emoji: '👩‍🎤', look: 0.95, level: 26, favorite: 'Deluxe Omakase', request: 'Concert tonight, no pressure!', lines: ['Kawaii~!', 'My fans love you.', 'Wrote a song about sushi.', 'You’re in my music video!', 'Best fan ever... wait, I’m yours!'] },
  { id: 'critic', name: 'The Food Critic', emoji: '🧐', look: 0.55, level: 32, favorite: 'Inari Tofu Stack', request: 'This review decides everything.', lines: ['Adequate.', 'Hm. Better than adequate.', 'I may write about this.', 'Five stars. Don’t tell anyone.', 'My favourite restaurant.'] },
];

/** Hearts needed for each friendship level; each level pays a reward and unlocks a new line. */
export const HEART_LEVELS = [0, 3, 8, 15, 25];
export const HEART_TITLES = ['New face', 'Regular', 'Friend', 'Best friend', 'Family'];
export const HEART_REWARDS = [0, 40, 100, 200, 400];

export function heartLevel(hearts: number): number {
  let l = 0;
  while (l + 1 < HEART_LEVELS.length && hearts >= HEART_LEVELS[l + 1]) l++;
  return l;
}

// -------------------------------------------------------------------- story

export interface Chapter { title: string; scene: string[]; start: string[]; end: string[] }

/** One chapter for every ten levels of the story. */
export const CHAPTERS: Chapter[] = [
  { title: 'Chapter 1 · The Rookie', scene: ['🏮', '🍣', '🔪'], start: ['Your grandmother’s little sushi bar has been closed for years.', 'Today you lift the shutters. Ten rival chefs come to see if you’re for real.'], end: ['Grand Chef Kaito lowers the Golden Knife.', '“The old bar lives again,” he says. Word spreads across the city.'] },
  { title: 'Chapter 2 · The Street Food Wars', scene: ['🏙️', '🥢', '🔥'], start: ['Food stalls line the street outside, and their chefs want your customers.', 'Win the street, one order at a time.'], end: ['The stall chefs shake your hand.', 'Now they send their own customers to you.'] },
  { title: 'Chapter 3 · The Night Market', scene: ['🌙', '🎐', '🏮'], start: ['A secret night market opens only after midnight.', 'Its chefs are fast, strange and very proud.'], end: ['By sunrise, the market crowns you “Moon Chef”.', 'An invitation arrives, sealed in gold.'] },
  { title: 'Chapter 4 · The Grand Tournament', scene: ['🏟️', '🏆', '🎌'], start: ['The Grand Sushi Tournament: chefs from every corner of the world.', 'Nobody has heard of you. Yet.'], end: ['The crowd chants your name.', 'Only one chef stands between you and the title.'] },
  { title: 'Chapter 5 · The Golden Plate', scene: ['👑', '🍱', '✨'], start: ['The final ten: the legends of sushi.', 'Each one has held the Golden Plate. Now it’s your turn.'], end: ['You hold the Golden Plate high.', 'Grandmother’s bar is the most famous kitchen in the land. But legends never stop...'] },
];
export const ENDLESS_CHAPTER: Chapter = { title: 'Legends · The Endless Kitchen', scene: ['♾️', '🍣', '🌌'], start: ['Beyond the story, new challengers line up forever.', 'Every ten levels, a Legend boss. How far can you go?'], end: [] };

export function chapterFor(level: number): number {
  return Math.floor((level - 1) / 10);
}

// ------------------------------------------------------------- achievements

export type StatId = 'perfects' | 'served' | 'height' | 'level' | 'stars' | 'streak' | 'dodges' | 'flawless' | 'coins' | 'rank' | 'rage' | 'puzzles' | 'hearts' | 'pictures' | 'days' | 'fancy' | 'bonus';

export interface AchFamily { id: StatId; icon: string; name: string; desc: (n: number) => string; tiers: number[] }

/** 15 families with 4 tiers each: 60 achievements. */
export const ACHIEVEMENTS: AchFamily[] = [
  { id: 'perfects', icon: '🎯', name: 'Perfectionist', desc: (n) => `Land ${n} PERFECTs`, tiers: [25, 150, 600, 2500] },
  { id: 'served', icon: '🍣', name: 'Order Up', desc: (n) => `Serve ${n} orders`, tiers: [5, 30, 120, 500] },
  { id: 'height', icon: '🗼', name: 'Sky High', desc: (n) => `Stack ${n} layers in one run`, tiers: [25, 50, 100, 200] },
  { id: 'level', icon: '🗺️', name: 'Journey', desc: (n) => `Reach level ${n}`, tiers: [10, 25, 50, 100] },
  { id: 'stars', icon: '⭐', name: 'Star Collector', desc: (n) => `Earn ${n} stars`, tiers: [20, 60, 120, 250] },
  { id: 'streak', icon: '🔥', name: 'On Fire', desc: (n) => `Get a ${n}x PERFECT streak`, tiers: [5, 10, 20, 35] },
  { id: 'dodges', icon: '🔪', name: 'Dodger', desc: (n) => `Dodge ${n} chef attacks`, tiers: [3, 20, 80, 250] },
  { id: 'flawless', icon: '💎', name: 'Clean Cuts', desc: (n) => `Serve ${n} orders with no slices`, tiers: [1, 10, 40, 150] },
  { id: 'coins', icon: '🪙', name: 'Big Earner', desc: (n) => `Earn ${n.toLocaleString('en')} coins`, tiers: [500, 3000, 15000, 60000] },
  { id: 'rank', icon: '👑', name: 'Chef Rank', desc: (n) => `Reach Chef Rank ${n}`, tiers: [2, 6, 12, 25] },
  { id: 'rage', icon: '😡', name: 'Rage Tamer', desc: (n) => `Beat ${n} raging bosses`, tiers: [1, 4, 10, 25] },
  { id: 'puzzles', icon: '🧩', name: 'Puzzler', desc: (n) => `Earn ${n} puzzle stars`, tiers: [5, 30, 75, 120] },
  { id: 'hearts', icon: '💞', name: 'Local Favourite', desc: (n) => `Earn ${n} hearts from regulars`, tiers: [5, 30, 100, 250] },
  { id: 'pictures', icon: '🖼️', name: 'Art Lover', desc: (n) => `Complete ${n} gallery picture${n === 1 ? '' : 's'}`, tiers: [1, 3, 6, 12] },
  { id: 'days', icon: '📅', name: 'Loyal Chef', desc: (n) => `Play on ${n} different days`, tiers: [2, 7, 30, 100] },
];
export const ACH_REWARDS = [50, 150, 400, 1000];
export const ACH_TIER_NAMES = ['I', 'II', 'III', 'IV'];

export function achTier(fam: AchFamily, value: number): number {
  return fam.tiers.filter((t) => value >= t).length;
}

// ------------------------------------------------------------------ gallery

export interface Picture { name: string; sky: [string, string]; items: [string, number, number, number][] } // emoji, x, y, size (0-1 of the frame)

/** Picture puzzles: PERFECTs reveal tiles one by one. */
export const PICTURES: Picture[] = [
  { name: 'Mount Fuji', sky: ['#9fd3ff', '#ffe3f1'], items: [['🗻', 0.5, 0.58, 0.75], ['🌸', 0.14, 0.18, 0.22], ['☀️', 0.84, 0.16, 0.18], ['🌸', 0.88, 0.86, 0.16]] },
  { name: 'Koi Pond', sky: ['#3fa7c9', '#1d5f7a'], items: [['🐟', 0.32, 0.38, 0.32], ['🐠', 0.7, 0.66, 0.32], ['🪷', 0.2, 0.8, 0.2], ['🪷', 0.82, 0.2, 0.18], ['💧', 0.5, 0.15, 0.1]] },
  { name: 'Castle at Dusk', sky: ['#ff9a62', '#5b2a6e'], items: [['🏯', 0.5, 0.56, 0.62], ['🌙', 0.82, 0.16, 0.2], ['🌲', 0.12, 0.8, 0.26], ['🌲', 0.88, 0.8, 0.26]] },
  { name: 'Festival Night', sky: ['#1b1440', '#3d2a6e'], items: [['🎆', 0.28, 0.24, 0.34], ['🎇', 0.74, 0.3, 0.3], ['🏮', 0.18, 0.74, 0.2], ['🏮', 0.5, 0.76, 0.2], ['🏮', 0.82, 0.74, 0.2]] },
  { name: 'Sushi Party', sky: ['#ffe6c7', '#ffb38a'], items: [['🍣', 0.3, 0.32, 0.3], ['🍙', 0.72, 0.3, 0.28], ['🍤', 0.3, 0.72, 0.28], ['🍱', 0.72, 0.72, 0.3]] },
  { name: 'Bamboo Panda', sky: ['#c9f2c7', '#7cc47f'], items: [['🐼', 0.5, 0.56, 0.52], ['🎋', 0.14, 0.4, 0.4], ['🎋', 0.86, 0.4, 0.4]] },
  { name: 'Ocean Wave', sky: ['#bfe9ff', '#2d7fb8'], items: [['🌊', 0.5, 0.6, 0.8], ['⛵', 0.78, 0.3, 0.2], ['🐦', 0.22, 0.2, 0.12]] },
  { name: 'Lucky Cat', sky: ['#ffdf6b', '#ff8a5b'], items: [['🐱', 0.5, 0.52, 0.56], ['🪙', 0.18, 0.82, 0.16], ['🪙', 0.82, 0.82, 0.16], ['✨', 0.82, 0.18, 0.16]] },
  { name: 'Torii Gate', sky: ['#ffd1dc', '#8ec5ff'], items: [['⛩️', 0.5, 0.56, 0.66], ['🍁', 0.15, 0.2, 0.16], ['🍁', 0.85, 0.24, 0.14], ['🦊', 0.84, 0.84, 0.18]] },
  { name: 'Rocket Ramen', sky: ['#0b1030', '#2a2f6e'], items: [['🚀', 0.36, 0.42, 0.42], ['🍜', 0.72, 0.74, 0.32], ['⭐', 0.82, 0.16, 0.12], ['🪐', 0.16, 0.82, 0.2]] },
  { name: 'Snow Monkey', sky: ['#e9f4ff', '#a9c9e8'], items: [['🐒', 0.5, 0.5, 0.48], ['♨️', 0.5, 0.86, 0.22], ['❄️', 0.16, 0.18, 0.14], ['❄️', 0.84, 0.22, 0.12]] },
  { name: 'Dragon Gate', sky: ['#3a0a12', '#b8192f'], items: [['🐉', 0.5, 0.5, 0.7], ['🔥', 0.16, 0.84, 0.18], ['🔥', 0.84, 0.84, 0.18], ['🌕', 0.82, 0.16, 0.18]] },
];
export const GALLERY_TILES = 16; // 4 x 4
export const PERFECTS_PER_TILE = 6;
export const PICTURE_REWARD = 300;

// ------------------------------------------------------------------ seasons

export interface SeasonTheme { name: string; icon: string; color: string; top: string; prize: string }

/** The Sushi Pass changes theme each season, cycling through the year. */
export const SEASON_THEMES: SeasonTheme[] = [
  { name: 'Lucky New Year', icon: '🧧', color: '#ff4d4d', top: '#ffd6d6', prize: 'Lucky Coin plate' },
  { name: 'Sakura Spring', icon: '🌸', color: '#ff8fb8', top: '#ffd6e5', prize: 'Blossom plate' },
  { name: 'Summer Matsuri', icon: '🎆', color: '#ffb703', top: '#fff1c1', prize: 'Firework plate' },
  { name: 'Harvest Moon', icon: '🌕', color: '#f4a261', top: '#ffe2c6', prize: 'Moon Rabbit plate' },
  { name: 'Spooky Kitchen', icon: '🎃', color: '#ff7b25', top: '#ffd6b0', prize: 'Pumpkin plate' },
  { name: 'Winter Lights', icon: '❄️', color: '#9fe3ff', top: '#e2f6ff', prize: 'Snowflake plate' },
];

/** The theme follows the month in the middle of the season. */
export function seasonTheme(mid: Date): SeasonTheme {
  const m = mid.getMonth();
  return SEASON_THEMES[m <= 1 ? 0 : m <= 4 ? 1 : m <= 7 ? 2 : m === 8 ? 3 : m === 9 ? 4 : 5];
}
