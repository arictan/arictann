// The restaurant economy loop: runs stock the pantry, the kitchen cooks dishes from it, guests buy
// them, and the coins grow the restaurant, which in turn makes runs stronger.
// Everything here is plain data and rules (no drawing) so it can be tested on its own.
// Rivals and every other "player" are computer characters, always labelled "(AI)".

import { seeded } from './live';
import { dayKey, weekKey } from './progress';
import type { Ingredient } from './shop';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ================================================================ 1. pantry

export const PANTRY_BASE = 30; // per ingredient
export const PANTRY_PER_FRIDGE = 15;

/** Every landed layer stocks one of its ingredient, a PERFECT stocks two. */
export function stockLayer(pantry: Partial<Record<Ingredient, number>>, kind: Ingredient, perfect: boolean, cap: number): number {
  const have = pantry[kind] ?? 0;
  const add = Math.max(0, Math.min(perfect ? 2 : 1, cap - have));
  pantry[kind] = have + add;
  return add;
}

// ================================================================ 6. kitchen

export type UpgradeId = 'knives' | 'cooker' | 'cat' | 'stove' | 'fridge' | 'burner' | 'display';

export interface KitchenUpgrade { id: UpgradeId; name: string; icon: string; perks: string[]; costs: number[]; run?: boolean }

/** Kitchen upgrades bought with coins. The first three make your runs stronger (idea 3). */
export const UPGRADES: KitchenUpgrade[] = [
  { id: 'knives', name: 'Sharp Knives', icon: '🔪', perks: ['+1 PERFECT zone in runs', '+2 PERFECT zone in runs', '+3 PERFECT zone in runs'], costs: [400, 1200, 3000], run: true },
  { id: 'cooker', name: 'Big Rice Cooker', icon: '🍚', perks: ['First roll 5% wider', 'First roll 10% wider', 'First roll 15% wider'], costs: [350, 1000, 2600], run: true },
  { id: 'cat', name: 'Lucky Cat', icon: '🐈', perks: ['+4% coins in runs', '+8% coins in runs', '+12% coins in runs'], costs: [450, 1300, 3200], run: true },
  { id: 'stove', name: 'Fast Stove', icon: '🔥', perks: ['Cooking 15% faster', 'Cooking 30% faster', 'Cooking 45% faster'], costs: [300, 900, 2200] },
  { id: 'fridge', name: 'Big Fridge', icon: '🧊', perks: ['Pantry holds 45 of each', 'Pantry holds 60 of each', 'Pantry holds 75 of each'], costs: [250, 800, 2000] },
  { id: 'burner', name: 'Extra Burner', icon: '🍳', perks: ['2 dishes cook at once', '3 dishes cook at once', '4 dishes cook at once'], costs: [500, 1500, 3500] },
  { id: 'display', name: 'Display Case', icon: '🪟', perks: ['Holds 10 dishes', 'Holds 14 dishes', 'Holds 18 dishes'], costs: [300, 900, 2400] },
];

export const DISPLAY_BASE = 6;

export interface Burner { recipe: string; start: number; ready: number; last: string }

/** Ingredients a dish uses: two of every layer in its recipe pattern. */
export function dishCost(pattern: Ingredient[]): Partial<Record<Ingredient, number>> {
  const cost: Partial<Record<Ingredient, number>> = {};
  for (const k of pattern) cost[k] = (cost[k] ?? 0) + 2;
  return cost;
}

/** Longer recipes cook longer: 2 min, 5 min, 15 min, 30 min. */
export function cookMs(pattern: Ingredient[], stoveLv: number): number {
  const base = [2, 2, 2, 2, 5, 15, 30][Math.min(6, pattern.length)] * 60_000;
  return Math.round(base * (1 - 0.15 * stoveLv));
}

export function canAfford(pantry: Partial<Record<Ingredient, number>>, cost: Partial<Record<Ingredient, number>>): boolean {
  return Object.entries(cost).every(([k, n]) => (pantry[k as Ingredient] ?? 0) >= (n ?? 0));
}

// ================================================================ 4. dish levels

export const DISH_STEPS = [0, 5, 15, 40, 100]; // serves (runs + sales) for levels 1-5
export const DISH_MULT = [1, 1.25, 1.5, 1.8, 2.2];

export function dishLevel(serves: number): number {
  let lv = 1;
  for (let i = 1; i < DISH_STEPS.length; i++) if (serves >= DISH_STEPS[i]) lv = i + 1;
  return lv;
}

export function dishNext(serves: number): number | null {
  return DISH_STEPS.find((s) => s > serves) ?? null;
}

/** Menu price of a dish: 10 coins per layer in its pattern, raised by its level. */
export function dishPrice(pattern: Ingredient[], serves: number): number {
  return Math.round(pattern.length * 10 * DISH_MULT[dishLevel(serves) - 1]);
}

// ================================================================ 11. guide rating and guest types

export interface GuestType { star: number; name: string; emoji: string[]; mult: number; desc: string }

export const GUEST_TYPES: GuestType[] = [
  { star: 0, name: 'Locals', emoji: ['🧑', '👩', '👴', '👧'], mult: 1, desc: 'Neighbours who love a good roll' },
  { star: 1, name: 'Office workers', emoji: ['🧑‍💼', '👩‍💼'], mult: 1.15, desc: 'Lunch in a hurry, tips in a hurry' },
  { star: 2, name: 'Tourists', emoji: ['🧑‍🦰', '👱‍♀️', '🧔'], mult: 1.3, desc: 'They photograph everything' },
  { star: 3, name: 'Food bloggers', emoji: ['🤳', '🧑‍🎤'], mult: 1.5, desc: 'One post brings a crowd' },
  { star: 4, name: 'Celebrities', emoji: ['🕶️', '🦸'], mult: 1.8, desc: 'Sunglasses indoors, huge tips' },
  { star: 5, name: 'Royal family', emoji: ['🤴', '👸'], mult: 2.3, desc: 'The highest honour in the guide' },
];

export const RATING_STEPS = [15, 45, 90, 150, 230]; // guide points for 1-5 stars

export interface RatingInput { popularity: number; dishLevels: number; expansions: number; lots: number; reviews: number; styles: number; sets: number; requests: number }

/** Guide points: popularity, dish levels, expansions, street, critic reviews, decor, collections and requests. */
export function ratingPoints(r: RatingInput): number {
  return r.popularity * 6 + r.dishLevels * 3 + r.expansions * 15 + r.lots * 8 + r.reviews * 4 + r.styles * 2 + r.sets * 10 + Math.min(40, Math.floor(r.requests / 2));
}

export function ratingStars(points: number): number {
  return RATING_STEPS.filter((s) => points >= s).length;
}

/** Picks a guest type for a seat: newer (richer) types are rarer. */
export function guestTypeFor(stars: number, seed: number): GuestType {
  const open = GUEST_TYPES.filter((g) => g.star <= stars);
  const r = seeded(seed)();
  // Weights 5, 4, 3... favour the common guests, but the best type still shows up often.
  const weights = open.map((_, i) => open.length - i + (i === open.length - 1 ? 2 : 0));
  let x = r * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < open.length; i++) {
    x -= weights[i];
    if (x <= 0) return open[i];
  }
  return open[0];
}

// ================================================================ 5. rush hour

export const RUSHES = [{ name: 'Lunch Rush', from: 12 }, { name: 'Dinner Rush', from: 19 }];

/** Rush Hour windows today (1 hour each; the Ramen Bar on the street makes them 90 minutes). */
export function rushWindows(d: Date, long: boolean): { name: string; start: number; end: number }[] {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return RUSHES.map((r) => ({ name: r.name, start: day + r.from * HOUR, end: day + r.from * HOUR + (long ? 1.5 : 1) * HOUR }));
}

export function rushNow(at: number, long: boolean): { name: string; end: number } | null {
  const w = rushWindows(new Date(at), long).find((x) => at >= x.start && at < x.end);
  return w ? { name: w.name, end: w.end } : null;
}

export function nextRush(at: number, long: boolean): { name: string; start: number } {
  for (let k = 0; k < 2; k++) {
    const w = rushWindows(new Date(at + k * DAY), long).find((x) => x.start > at);
    if (w) return w;
  }
  return { name: RUSHES[0].name, start: at + DAY };
}

/** Hours in [from, to) that fall inside Rush Hour (tips fill twice as fast then). */
export function rushHoursBetween(from: number, to: number, long: boolean): number {
  let sum = 0;
  for (let d = from - DAY; d < to + DAY; d += DAY) {
    for (const w of rushWindows(new Date(d), long)) sum += Math.max(0, Math.min(to, w.end) - Math.max(from, w.start));
  }
  return sum / HOUR;
}

export const RUSH_CHESTS = [{ at: 8, coins: 120 }, { at: 16, coins: 250 }, { at: 24, coins: 450, piece: true }];

// ================================================================ 8. golden guest

/** The sparkling guest arrives once a day, after a time picked from the date (10:00-20:00). */
export function goldenHour(day = dayKey()): number {
  return 10 + (hash(`gold|${day}`) % 11);
}

export type GoldenPrize = { kind: 'coins'; n: number } | { kind: 'piece' } | { kind: 'track' } | { kind: 'boosters'; n: number } | { kind: 'style' };

export function goldenPrize(day = dayKey()): GoldenPrize {
  const r = seeded(hash(`prize|${day}`));
  const x = r();
  if (x < 0.4) return { kind: 'coins', n: 200 + Math.floor(r() * 7) * 50 };
  if (x < 0.65) return { kind: 'piece' };
  if (x < 0.8) return { kind: 'track' };
  if (x < 0.92) return { kind: 'boosters', n: 2 };
  return { kind: 'style' };
}

// ================================================================ 9. expansion chapters

export type TaskKind = 'sold' | 'requests' | 'rating' | 'chefs' | 'lots' | 'coins';

export interface Expansion { name: string; icon: string; story: string; tasks: { kind: TaskKind; n: number }[]; seats: number; tips: number; perk: string }

export const EXPANSIONS: Expansion[] = [
  { name: 'Counter Bar', icon: '🪑', story: 'Grandma always said a good counter makes friends. Knock down the old storeroom wall and give your regulars a real bar to lean on.', tasks: [{ kind: 'sold', n: 15 }, { kind: 'requests', n: 3 }, { kind: 'coins', n: 1500 }], seats: 1, tips: 0.1, perk: '+1 seat · +10% tips' },
  { name: 'Second Floor', icon: '🪜', story: 'The upstairs rooms have been dusty for twenty years. Open them up, hang new curtains and let the balcony fill with guests.', tasks: [{ kind: 'sold', n: 60 }, { kind: 'rating', n: 2 }, { kind: 'coins', n: 4000 }], seats: 1, tips: 0.15, perk: '+1 seat · +15% tips · balcony' },
  { name: 'Rooftop Garden', icon: '🌿', story: 'String lights, potted maples and a view over the whole street. Rival chefs will come just to sit up there.', tasks: [{ kind: 'sold', n: 150 }, { kind: 'chefs', n: 8 }, { kind: 'coins', n: 9000 }], seats: 0, tips: 0.2, perk: '+20% tips · string lights' },
  { name: 'Flagship', icon: '🏯', story: 'A red carpet, a golden sign and your name in the guide. This is the restaurant grandma dreamed of.', tasks: [{ kind: 'sold', n: 300 }, { kind: 'rating', n: 4 }, { kind: 'lots', n: 3 }, { kind: 'coins', n: 20000 }], seats: 1, tips: 0.3, perk: '+1 seat · +30% tips · golden flagship' },
];

export function taskText(t: { kind: TaskKind; n: number }): string {
  switch (t.kind) {
    case 'sold': return `Sell ${t.n} dishes from your kitchen`;
    case 'requests': return `Fill ${t.n} guest requests`;
    case 'rating': return `Reach ${t.n}✪ guide rating`;
    case 'chefs': return `Host ${t.n} rival chefs as guests`;
    case 'lots': return `Own ${t.n} shops on Sakura Street`;
    case 'coins': return `Pay ${t.n.toLocaleString('en-US')} coins`;
  }
}

// ================================================================ 10. Sakura Street

export type LotId = 'tea' | 'fish' | 'mochi' | 'ramen' | 'bath' | 'arcade';

export interface Lot { id: LotId; name: string; icon: string; cost: number; tips: number; perk: string; color: string; roof: string }

export const LOTS: Lot[] = [
  { id: 'tea', name: 'Tea House', icon: '🍵', cost: 1500, tips: 8, perk: 'Guests tip 10% more', color: '#6a994e', roof: '#386641' },
  { id: 'fish', name: 'Fish Market', icon: '🐟', cost: 2500, tips: 10, perk: 'Daily delivery: 8 salmon + 8 tuna', color: '#3d6fb6', roof: '#1d3557' },
  { id: 'mochi', name: 'Mochi Shop', icon: '🍡', cost: 4000, tips: 15, perk: '+15 tips per hour', color: '#ffafcc', roof: '#c9184a' },
  { id: 'ramen', name: 'Ramen Bar', icon: '🍜', cost: 6500, tips: 20, perk: 'Rush Hour lasts 90 minutes', color: '#e76f51', roof: '#9d0208' },
  { id: 'bath', name: 'Bath House', icon: '♨️', cost: 10000, tips: 25, perk: 'Staff earn double XP', color: '#90e0ef', roof: '#0077b6' },
  { id: 'arcade', name: 'Arcade', icon: '🕹️', cost: 15000, tips: 40, perk: 'Rush chests pay double', color: '#7b2cbf', roof: '#3c096c' },
];

// ================================================================ 12. tableware collections

export interface PieceSet { name: string; color: string; weight: number }

export const PIECE_KINDS = [{ name: 'Tea Bowl', emoji: '🍵' }, { name: 'Sake Flask', emoji: '🍶' }, { name: 'Plate', emoji: '🍽️' }, { name: 'Teapot', emoji: '🫖' }, { name: 'Chopsticks', emoji: '🥢' }];

export const PIECE_SETS: PieceSet[] = [
  { name: 'Kyoto Clay', color: '#c8553d', weight: 30 },
  { name: 'Edo Lacquer', color: '#9d0208', weight: 24 },
  { name: 'Sakura Porcelain', color: '#ffafcc', weight: 18 },
  { name: 'Ocean Blue', color: '#3d6fb6', weight: 13 },
  { name: 'Moonlight Glass', color: '#9fe3ff', weight: 9 },
  { name: 'Golden Dynasty', color: '#ffd34d', weight: 6 },
];

export const SET_TIP_BONUS = 0.05; // per finished set, forever
export const DUPLICATE_COINS = 40;

/** A random piece id "set:kind", weighted so the golden set is rare. */
export function rollPiece(rand: () => number = Math.random): string {
  const total = PIECE_SETS.reduce((a, s) => a + s.weight, 0);
  let x = rand() * total;
  let set = 0;
  for (let i = 0; i < PIECE_SETS.length; i++) {
    x -= PIECE_SETS[i].weight;
    if (x <= 0) { set = i; break; }
  }
  return `${set}:${Math.floor(rand() * PIECE_KINDS.length)}`;
}

export function setsDone(pieces: string[]): number {
  return PIECE_SETS.filter((_, s) => PIECE_KINDS.every((_, k) => pieces.includes(`${s}:${k}`))).length;
}

export function pieceName(id: string): string {
  const [s, k] = id.split(':').map(Number);
  return `${PIECE_SETS[s].name} ${PIECE_KINDS[k].name}`;
}

// ================================================================ 13. rival chefs as guests

export const CHEF_LINES = [
  'Fine… your {dish} is better than mine.',
  'I came here to spy. I’m staying for dessert.',
  'Don’t tell my students I ate here.',
  'Rematch? After this {dish}.',
  '{me}, this place has really grown!',
  'Your rice is warmer than my heart.',
  'I lost to you, but this {dish} I can respect.',
  'One more {dish}. For research.',
  'My restaurant is empty. Everyone is here!',
  'You stack AND cook? Unfair.',
];

export const GUESTBOOK_GOALS = [{ n: 5, coins: 200 }, { n: 15, coins: 500 }, { n: 30, coins: 1000 }, { n: 50, coins: 2000 }, { n: 100, coins: 4000 }];
export const CHEF_VISITS_PER_DAY = 3;

/** Which beaten chef drops by next: mostly ones you haven't hosted yet. */
export function pickChefGuest(beaten: number[], hosted: number[], seed: number): number | null {
  if (!beaten.length) return null;
  const r = seeded(seed);
  const fresh = beaten.filter((l) => !hosted.includes(l));
  const pool = fresh.length && r() < 0.75 ? fresh : beaten;
  return pool[Math.floor(r() * pool.length)];
}

export function chefLine(i: number, dish: string, me: string): string {
  return CHEF_LINES[i % CHEF_LINES.length].replace('{dish}', dish).replace('{me}', me);
}

// ================================================================ 14. the rival across the street (AI)

export const RIVALS = [
  { name: 'Kuro’s Noodle Hut', chef: 'Chef Kuro', icon: '🍜', color: '#2b2d42' },
  { name: 'Golden Dragon Grill', chef: 'Chef Long', icon: '🐉', color: '#9d0208' },
  { name: 'Bella’s Pizzeria', chef: 'Chef Bella', icon: '🍕', color: '#386641' },
  { name: 'Burger Barons', chef: 'Baron Hugo', icon: '🍔', color: '#bc6c25' },
  { name: 'Le Petit Crêpe', chef: 'Chef Amélie', icon: '🥞', color: '#5e60ce' },
  { name: 'Taco Tornado', chef: 'Chef Rosa', icon: '🌮', color: '#e85d04' },
];

export function weekStart(at = new Date()): Date {
  const d = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  return new Date(d.getTime() - ((d.getDay() + 6) % 7) * DAY);
}

export const RIVAL_WIN_COINS = 600;

// ================================================================ 15. staff experience

export const STAFF_RANKS = [{ name: 'Rookie', xp: 0 }, { name: 'Regular', xp: 300 }, { name: 'Pro', xp: 1200 }, { name: 'Star', xp: 3000 }, { name: 'Legend', xp: 7000 }];

export function staffRank(xp: number): number {
  return STAFF_RANKS.filter((r) => xp >= r.xp).length - 1;
}

export const STAFF_CHEERS = ['Keep going!', 'Beautiful cut!', 'The guests are watching!', 'That’s our chef!', 'PERFECT again?!', 'Grandma would be proud!', 'I’m taking notes!', 'Unstoppable!'];

// ================================================================ 16. reviews

export interface Review { e: string; s: number; text: string; at: number }

export const REVIEW_TEMPLATES: Record<'dish' | 'request' | 'rush' | 'golden' | 'chef' | 'run' | 'tall' | 'star', string[]> = {
  dish: ['The {dish} was perfect. ★★★★★ would eat again.', 'Came for one {dish}, stayed for three.', 'I cried a little. The {dish} was that good.', 'My cat would approve of this {dish}.', 'The rice was warm, the vibe was warmer.', 'Best {dish} on the street. Fight me.', 'Ordered the {dish}. Found inner peace.'],
  request: ['They made exactly what I asked for! {dish}, just for me.', 'I asked for the {dish} and they remembered!', 'Custom {dish}, zero wait. Wow.'],
  rush: ['Packed at lunch and still perfect.', 'Rush hour chaos, flawless {dish}.', 'Waited 2 minutes. Worth 2 hours.'],
  golden: ['A sparkly guest left a golden tip. Is this place magic?', 'Saw someone glowing at the counter. Very fancy crowd.'],
  chef: ['{name} was spotted eating here! Big if true.', 'Even {name} eats here now. Says a lot.'],
  run: ['Watched the chef stack {h} layers live. Unreal.', 'The chef stacked {h} layers before my tea cooled.'],
  tall: ['The {dish} was taller than my son.', 'Needed a ladder for this {dish}. 5 stars.'],
  star: ['The guide was right. Worth every star.', 'Finally got a table here. Booking again tonight.', 'New star in the guide and you can taste why.'],
};

export function makeReview(kind: keyof typeof REVIEW_TEMPLATES, vars: { dish?: string; name?: string; h?: number }, emoji: string, seed: number): Review {
  const r = seeded(seed);
  const list = REVIEW_TEMPLATES[kind];
  const text = list[Math.floor(r() * list.length)].replace('{dish}', vars.dish ?? 'roll').replace('{name}', vars.name ?? 'a famous chef').replace('{h}', String(vars.h ?? 0));
  return { e: emoji, s: r() < 0.7 ? 5 : 4, text, at: Date.now() };
}

// ================================================================ 17. festival stall

export interface Festival { name: string; icon: string; color: string; items: { name: string; emoji: string }[] }

export const FESTIVALS: Festival[] = [
  { name: 'New Year Market', icon: '🎍', color: '#c1121f', items: [{ name: 'Kadomatsu', emoji: '🎍' }, { name: 'Lucky envelope', emoji: '🧧' }, { name: 'Mochi pounding', emoji: '🍡' }, { name: 'Daruma', emoji: '🪆' }, { name: 'Spinning top', emoji: '🪀' }, { name: 'First sunrise', emoji: '🌅' }] },
  { name: 'Setsubun Night', icon: '👹', color: '#7b2cbf', items: [{ name: 'Bean bag', emoji: '🫘' }, { name: 'Oni mask', emoji: '👹' }, { name: 'Ehomaki roll', emoji: '🌯' }, { name: 'Lucky charm', emoji: '🧿' }, { name: 'Paper fan', emoji: '🪭' }, { name: 'Drum', emoji: '🥁' }] },
  { name: 'Hina Festival', icon: '🎎', color: '#ffafcc', items: [{ name: 'Hina dolls', emoji: '🎎' }, { name: 'Peach blossom', emoji: '🌸' }, { name: 'Rice crackers', emoji: '🍘' }, { name: 'Sweet sake', emoji: '🍶' }, { name: 'Lantern', emoji: '🏮' }, { name: 'Paper crane', emoji: '🕊️' }] },
  { name: 'Hanami Picnic', icon: '🌸', color: '#ff8fab', items: [{ name: 'Picnic mat', emoji: '🧺' }, { name: 'Dango', emoji: '🍡' }, { name: 'Cherry tree', emoji: '🌸' }, { name: 'Bento', emoji: '🍱' }, { name: 'Paper lantern', emoji: '🏮' }, { name: 'Swallow', emoji: '🐦' }] },
  { name: 'Children’s Day', icon: '🎏', color: '#3d6fb6', items: [{ name: 'Carp streamer', emoji: '🎏' }, { name: 'Samurai helmet', emoji: '⛑️' }, { name: 'Kashiwa mochi', emoji: '🍙' }, { name: 'Kite', emoji: '🪁' }, { name: 'Iris', emoji: '🪻' }, { name: 'Spinning top', emoji: '🪀' }] },
  { name: 'Rainy Season Fair', icon: '☔', color: '#5e60ce', items: [{ name: 'Umbrella', emoji: '☂️' }, { name: 'Hydrangea', emoji: '💠' }, { name: 'Teru bozu', emoji: '👻' }, { name: 'Frog', emoji: '🐸' }, { name: 'Snail', emoji: '🐌' }, { name: 'Rainbow', emoji: '🌈' }] },
  { name: 'Tanabata', icon: '🎋', color: '#2a9d5c', items: [{ name: 'Wish tree', emoji: '🎋' }, { name: 'Wish paper', emoji: '📜' }, { name: 'Star lantern', emoji: '🌟' }, { name: 'Milky Way', emoji: '🌌' }, { name: 'Wind chime', emoji: '🎐' }, { name: 'Shooting star', emoji: '🌠' }] },
  { name: 'Obon Lights', icon: '🏮', color: '#e85d04', items: [{ name: 'Lantern row', emoji: '🏮' }, { name: 'Bon dance drum', emoji: '🥁' }, { name: 'Yukata', emoji: '👘' }, { name: 'Goldfish scoop', emoji: '🐠' }, { name: 'Shaved ice', emoji: '🍧' }, { name: 'Fireworks', emoji: '🎆' }] },
  { name: 'Moon Viewing', icon: '🎑', color: '#ffd34d', items: [{ name: 'Moon dumplings', emoji: '🍡' }, { name: 'Pampas grass', emoji: '🌾' }, { name: 'Moon rabbit', emoji: '🐇' }, { name: 'Full moon', emoji: '🌕' }, { name: 'Tea set', emoji: '🍵' }, { name: 'Chestnuts', emoji: '🌰' }] },
  { name: 'Yokai Parade', icon: '🎃', color: '#e85d04', items: [{ name: 'Pumpkin lantern', emoji: '🎃' }, { name: 'Kitsune mask', emoji: '🦊' }, { name: 'Ghost lamp', emoji: '👻' }, { name: 'Bat garland', emoji: '🦇' }, { name: 'Candy bowl', emoji: '🍬' }, { name: 'Witch hat', emoji: '🧙' }] },
  { name: 'Maple Festival', icon: '🍁', color: '#c1121f', items: [{ name: 'Maple arch', emoji: '🍁' }, { name: 'Sweet potato', emoji: '🍠' }, { name: 'Mushroom pot', emoji: '🍄' }, { name: 'Persimmons', emoji: '🟠' }, { name: 'Wooden bridge', emoji: '🌉' }, { name: 'Deer', emoji: '🦌' }] },
  { name: 'Winter Lights', icon: '🎄', color: '#2a9d5c', items: [{ name: 'Light tree', emoji: '🎄' }, { name: 'Snowman', emoji: '⛄' }, { name: 'Hot cocoa', emoji: '☕' }, { name: 'Gift pile', emoji: '🎁' }, { name: 'Bell', emoji: '🔔' }, { name: 'Snow globe', emoji: '🔮' }] },
];

export const FEST_COSTS = [5, 8, 12, 16, 22, 30];
export const FEST_FIRST = 15; // festival runs on days 15-21 of every month
export const FEST_COMPLETE_COINS = 1000;

export function festivalNow(d = new Date()): { f: Festival; key: string; ends: number } | null {
  const day = d.getDate();
  if (day < FEST_FIRST || day > FEST_FIRST + 6) return null;
  const ends = new Date(d.getFullYear(), d.getMonth(), FEST_FIRST + 7).getTime();
  return { f: FESTIVALS[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}`, ends };
}

export function nextFestival(d = new Date()): { f: Festival; start: number } {
  const thisMonth = new Date(d.getFullYear(), d.getMonth(), FEST_FIRST);
  const start = d.getDate() < FEST_FIRST ? thisMonth : new Date(d.getFullYear(), d.getMonth() + 1, FEST_FIRST);
  return { f: FESTIVALS[start.getMonth()], start: start.getTime() };
}

// ================================================================ 18. daily restaurant goals

export type GoalId = 'guests' | 'collect' | 'run' | 'cook' | 'request' | 'sell' | 'layers' | 'beat' | 'chef' | 'rush';

export const GOALS: Record<GoalId, { text: (n: number) => string; n: number }> = {
  guests: { text: (n) => `Serve ${n} guests`, n: 6 },
  collect: { text: (n) => `Collect tips ${n} times`, n: 2 },
  run: { text: (n) => `Play ${n} runs`, n: 2 },
  cook: { text: (n) => `Cook ${n} dishes`, n: 3 },
  request: { text: () => 'Fill a guest request', n: 1 },
  sell: { text: (n) => `Sell ${n} dishes`, n: 4 },
  layers: { text: (n) => `Stock ${n} ingredients`, n: 40 },
  beat: { text: (n) => `Beat ${n} chefs`, n: 2 },
  chef: { text: () => 'Host a rival chef', n: 1 },
  rush: { text: (n) => `Serve ${n} guests in Rush Hour`, n: 3 },
};

export const GOAL_CHEST_COINS = 150;

/** Three goals for the day, the same all day. Some only show up when they can be done. */
export function dailyGoals(day: string, opts: { chefs: boolean; rushLeft: boolean }): GoalId[] {
  const r = seeded(hash(`goals|${day}`));
  const pool: GoalId[] = ['guests', 'collect', 'run', 'cook', 'request', 'sell', 'layers', 'beat'];
  if (opts.chefs) pool.push('chef');
  if (opts.rushLeft) pool.push('rush');
  const out: GoalId[] = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}

// ================================================================ 19. weekly report

export interface WeekLog { key: string; income: number[]; sold: Record<string, number>; guests: number; chefs: number; requests: number; ratingStart: number; rivalI: number; rivalTarget: number }

/** A fresh week. The rival is picked now, aiming a little around what you earned last week. */
export function emptyWeek(key = weekKey(), rating = 0, lastIncome = 0): WeekLog {
  const r = seeded(hash(`rival|${key}`));
  const rivalI = Math.floor(r() * RIVALS.length);
  const rivalTarget = Math.round(Math.max(700, lastIncome * (0.9 + r() * 0.35)) / 10) * 10;
  return { key, income: [0, 0, 0, 0, 0, 0, 0], sold: {}, guests: 0, chefs: 0, requests: 0, ratingStart: rating, rivalI, rivalTarget };
}

/** How much the week's rival has earned by `at` (they finish the week at their target). */
export function rivalNow(log: WeekLog, at = new Date()): number {
  const start = weekStart(at).getTime();
  const t = Math.max(0, Math.min(1, (at.getTime() - start) / (7 * DAY)));
  // Rivals earn in bursts: a little more each evening.
  const pace = t + 0.035 * Math.sin(t * Math.PI * 14);
  return Math.max(0, Math.min(log.rivalTarget, Math.round(log.rivalTarget * pace)));
}

export function weekReward(log: WeekLog): number {
  const total = log.income.reduce((a, b) => a + b, 0);
  return Math.min(1500, 150 + Math.round(total * 0.05));
}

/** Monday = 0 … Sunday = 6. */
export function weekday(at = new Date()): number {
  return (at.getDay() + 6) % 7;
}

// ================================================================ 20. the dream restaurant

export interface DreamInput { expansions: number; stars: number; lots: number; sets: number; areas: number; dishLv: number; dishes: number }

/** Progress to the finished flagship, 0-100. */
export function dreamPercent(d: DreamInput): number {
  const dishPart = d.dishes ? Math.min(1, d.dishLv / (d.dishes * 4)) : 0;
  const p = (d.expansions / EXPANSIONS.length) * 35 + (d.stars / 5) * 20 + (d.lots / LOTS.length) * 15 + (d.sets / PIECE_SETS.length) * 10 + (d.areas / 24) * 10 + dishPart * 10;
  return Math.max(0, Math.min(100, Math.floor(p)));
}

// ================================================================ saved state

export interface DinerState {
  pantry: Partial<Record<Ingredient, number>>;
  up: Partial<Record<UpgradeId, number>>;
  burners: (Burner | null)[];
  lastDish: string[]; // remembered dish per burner
  display: Record<string, number>;
  sold: Record<string, number>; // dishes sold per recipe, all time
  soldTotal: number;
  requests: { recipe: string; who: number; at: number }[];
  reqAt: number; // when the order board last refilled
  reqFilled: number;
  rush: { day: string; n: number; claimed: number[] };
  golden: string; // day the golden guest was served
  expansions: number;
  lots: LotId[];
  fishDay: string;
  pieces: string[];
  chefsHosted: number[];
  chefVisits: { day: string; n: number };
  guestbookClaimed: number;
  rival: { week: string; wins: string[]; settled: string };
  staffXp: Record<string, number>;
  reviews: Review[];
  fest: { key: string; tokens: number; items: number[]; done: boolean };
  keepsakes: string[];
  goals: { day: string; ids: GoalId[]; prog: Partial<Record<GoalId, number>>; claimed: boolean };
  week: WeekLog;
  lastWeek: WeekLog | null;
  reportSeen: string;
  ratingSeen: number;
  introSeen: boolean;
}

export function defaultDiner(): DinerState {
  return {
    pantry: { rice: 12, nori: 6, salmon: 6 }, up: {}, burners: [null], lastDish: [], display: {}, sold: {}, soldTotal: 0,
    requests: [], reqAt: 0, reqFilled: 0, rush: { day: '', n: 0, claimed: [] }, golden: '', expansions: 0, lots: [], fishDay: '',
    pieces: [], chefsHosted: [], chefVisits: { day: '', n: 0 }, guestbookClaimed: 0, rival: { week: '', wins: [], settled: '' },
    staffXp: {}, reviews: [], fest: { key: '', tokens: 0, items: [], done: false }, keepsakes: [], goals: { day: '', ids: [], prog: {}, claimed: false },
    week: emptyWeek(), lastWeek: null, reportSeen: '', ratingSeen: 0, introSeen: false,
  };
}

export const REQUESTS_MAX = 3;
export const REQUEST_EVERY = 20 * 60_000; // a new request every 20 minutes, up to 3 waiting
