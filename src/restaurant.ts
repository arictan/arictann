// Restaurant depth: decor styles for every area, seasonal themes, staff, the Food Critic,
// the daily menu board, guest serving and restaurant codes for visiting friends.

import type { AreaId } from './collect';
import { dayKey } from './progress';

// ------------------------------------------------------------------ decor styles

export type StyleUnlock = { coins: number } | { critic: number } | { pass: true } | null;

export interface DecorStyle { name: string; unlock: StyleUnlock }

/** Three looks per area: the default, one bought with coins, one earned (critic reviews or the Restaurant Pass). */
export const STYLES: Record<AreaId, DecorStyle[]> = {
  counter: [{ name: 'Oak wood', unlock: null }, { name: 'Bamboo', unlock: { coins: 500 } }, { name: 'White marble', unlock: { critic: 3 } }],
  lanterns: [{ name: 'Red paper', unlock: null }, { name: 'Frosted glass', unlock: { coins: 400 } }, { name: 'Neon tubes', unlock: { pass: true } }],
  aquarium: [{ name: 'Tropical fish', unlock: null }, { name: 'Koi pond', unlock: { coins: 600 } }, { name: 'Jellyfish', unlock: { critic: 5 } }],
  noren: [{ name: 'Indigo', unlock: null }, { name: 'Crimson', unlock: { coins: 350 } }, { name: 'Gold silk', unlock: { pass: true } }],
  garden: [{ name: 'Bonsai', unlock: null }, { name: 'Sakura tree', unlock: { coins: 500 } }, { name: 'Bamboo grove', unlock: { critic: 2 } }],
  art: [{ name: 'Great wave', unlock: null }, { name: 'Mount Fuji', unlock: { coins: 450 } }, { name: 'Golden tiger', unlock: { pass: true } }],
  sign: [{ name: 'Painted wood', unlock: null }, { name: 'Carved stone', unlock: { coins: 400 } }, { name: 'Pink neon', unlock: { critic: 4 } }],
  conveyor: [{ name: 'Belt', unlock: null }, { name: 'Sushi boats', unlock: { coins: 700 } }, { name: 'Bullet train', unlock: { pass: true } }],
};

export function styleText(u: StyleUnlock): string {
  if (!u) return 'Free';
  if ('coins' in u) return `${u.coins} coins`;
  if ('critic' in u) return `${u.critic} critic reviews`;
  return 'Restaurant Pass';
}

// ------------------------------------------------------------------ themes

export interface RestTheme {
  id: string; name: string; icon: string;
  wall: string; wall2: string; floor: string; floor2: string; beam: string;
  particle: 'none' | 'petals' | 'snow' | 'fireflies' | 'leaves' | 'gold';
  deco: string[]; // emoji placed around the room
  months: number[]; // months (0-11) when it can be claimed for free
  price: number;
}

export const THEMES: RestTheme[] = [
  { id: 'classic', name: 'Classic', icon: '🏮', wall: '#7a4e2a', wall2: '#6a4224', floor: '#5a3a22', floor2: '#4c311c', beam: '#3a2414', particle: 'none', deco: [], months: [], price: 0 },
  { id: 'sakura', name: 'Sakura Terrace', icon: '🌸', wall: '#f2c4d0', wall2: '#e8b0c0', floor: '#9b6a5a', floor2: '#8a5c4e', beam: '#7a4a52', particle: 'petals', deco: ['🌸', '🍡', '🎎'], months: [2, 3, 4], price: 1500 },
  { id: 'matsuri', name: 'Summer Matsuri', icon: '🎆', wall: '#2b2f6b', wall2: '#242859', floor: '#5a3a22', floor2: '#4c311c', beam: '#1a1c40', particle: 'fireflies', deco: ['🎐', '🍧', '🎏'], months: [5, 6, 7], price: 1500 },
  { id: 'autumn', name: 'Maple Inn', icon: '🍁', wall: '#a0522d', wall2: '#8f4826', floor: '#5a3a22', floor2: '#4c311c', beam: '#4a2410', particle: 'leaves', deco: ['🍁', '🍠', '🌰'], months: [8], price: 1500 },
  { id: 'haunted', name: 'Haunted Izakaya', icon: '🎃', wall: '#3b2350', wall2: '#321d45', floor: '#2a1a22', floor2: '#22141c', beam: '#1a0f22', particle: 'leaves', deco: ['🎃', '🦇', '👻', '🕯️'], months: [9], price: 1500 },
  { id: 'onsen', name: 'Winter Onsen', icon: '♨️', wall: '#c9d8e6', wall2: '#b8c9da', floor: '#6a5a4a', floor2: '#5c4e40', beam: '#3a4a5a', particle: 'snow', deco: ['♨️', '⛄', '🍵'], months: [10, 11, 0, 1], price: 1500 },
  { id: 'imperial', name: 'Imperial Gold', icon: '👑', wall: '#3a0d12', wall2: '#300a0e', floor: '#1a1008', floor2: '#140c06', beam: '#d4a537', particle: 'gold', deco: ['👑', '🐉', '🏯'], months: [], price: 0 }, // Restaurant Pass
];

export function themeById(id: string): RestTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Seasonal themes can be claimed for free while their season is on. */
export function themeInSeason(t: RestTheme, d = new Date()): boolean {
  return t.months.includes(d.getMonth());
}

// ------------------------------------------------------------------ staff

export type StaffId = 'waiter' | 'dishwasher' | 'greeter' | 'apprentice';

export interface Staff { id: StaffId; name: string; emoji: string; perks: string[]; costs: number[] }

export const STAFF: Staff[] = [
  { id: 'waiter', name: 'Waiter Hiro', emoji: '🤵', perks: ['+15% tips', '+30% tips', '+50% tips'], costs: [300, 900, 2200] },
  { id: 'dishwasher', name: 'Dishwasher Bo', emoji: '🧽', perks: ['Tip jar holds 2h more', 'Tip jar holds 4h more', 'Tip jar holds 6h more'], costs: [250, 800, 2000] },
  { id: 'greeter', name: 'Greeter Ami', emoji: '💁', perks: ['+1 guest seat', '+1 seat, guests give +1 heart', '+2 seats, guests give +1 heart'], costs: [400, 1000, 2400] },
  { id: 'apprentice', name: 'Apprentice Kei', emoji: '👦', perks: ['1 free booster every day', '1 booster + 20 coins every day', '2 boosters + 50 coins every day'], costs: [500, 1200, 2800] },
];

// ------------------------------------------------------------------ saved state

export interface RestState {
  styles: Partial<Record<AreaId, number>>;
  ownedStyles: string[]; // "area:index"
  theme: string;
  ownedThemes: string[];
  staff: Partial<Record<StaffId, number>>;
  menu: { day: string; recipe: string };
  served: { day: string; n: number }; // guests served by tapping today
  critic: { day: string; done: boolean };
  reviews: number; // critic visits won
  passUntil: number; // Restaurant Pass expiry
  apprenticeDay: string;
  visited: { day: string; codes: string[] }; // friends' restaurants hearted today
  tipsBoostDay: string;
}

export const DEFAULT_REST: RestState = {
  styles: {}, ownedStyles: [], theme: 'classic', ownedThemes: ['classic'], staff: {},
  menu: { day: '', recipe: '' }, served: { day: '', n: 0 }, critic: { day: '', done: false }, reviews: 0,
  passUntil: 0, apprenticeDay: '', visited: { day: '', codes: [] }, tipsBoostDay: '',
};

export const GUEST_SERVES_PER_DAY = 40;

/** The Food Critic books a table on roughly one day in three (the same days for everyone). */
export function criticToday(): boolean {
  let h = 7;
  for (const ch of dayKey()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 3 === 0;
}

// ------------------------------------------------------------------ friend visits

export interface RestCode { n: string; r: number; m: number; l: number[]; s: number[]; t: string; a: number[] }

const AREA_ORDER: AreaId[] = ['counter', 'lanterns', 'aquarium', 'noren', 'garden', 'art', 'sign', 'conveyor'];

export function encodeRestaurant(c: RestCode): string {
  // Compact: name|r|m|levels|styles|theme|avatar
  const raw = [c.n.slice(0, 12), c.r, c.m, c.l.join(''), c.s.join(''), c.t, c.a.join('.')].join('|');
  return `R-${btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

export function decodeRestaurant(code: string): RestCode | null {
  try {
    const body = code.trim().replace(/^R-/i, '');
    const raw = decodeURIComponent(escape(atob(body.replace(/-/g, '+').replace(/_/g, '/'))));
    const [n, r, m, l, s, t, a] = raw.split('|');
    const levels = [...l].map(Number);
    const styles = [...s].map(Number);
    if (levels.length !== 8 || styles.length !== 8 || levels.some((x) => !(x >= 0 && x <= 3))) return null;
    return { n, r: Number(r) || 0, m: Number(m) || 0, l: levels, s: styles.map((x) => Math.min(2, x)), t, a: a.split('.').map(Number) };
  } catch {
    return null;
  }
}

export function stylesArray(st: RestState): number[] {
  return AREA_ORDER.map((id) => st.styles[id] ?? 0);
}
