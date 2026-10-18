// Date-driven live events. Everything here runs offline: schedules come from the device clock,
// and competitive events use clearly labelled AI rivals whose progress is generated from the date,
// so the same day or weekend always plays out the same way. Swap the AI for real players once a
// backend (or Game Center / Play Games leaderboards) exists.

const DAY = 86_400_000;

function midnight(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Seeded random generator: the same seed always gives the same sequence. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function daysLeft(end: Date): number {
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / DAY));
}

export function timeLeft(end: Date): string {
  const ms = Math.max(0, end.getTime() - Date.now());
  const h = Math.floor(ms / 3_600_000);
  if (h >= 48) return `${Math.floor(h / 24)}d left`;
  if (h >= 1) return `${h}h ${Math.floor((ms % 3_600_000) / 60_000)}m left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}

// --------------------------------------------------------------- world tour

export interface City { id: string; name: string; sky: [string, string]; accent: string; building: string; landmark: string }

export const CITIES: City[] = [
  { id: 'tokyo', name: 'Tokyo', sky: ['#1b1035', '#ff6f91'], accent: '#ff3b3b', building: '#2a1f45', landmark: 'tower' },
  { id: 'osaka', name: 'Osaka', sky: ['#0f2027', '#f4a261'], accent: '#e9c46a', building: '#203a43', landmark: 'castle' },
  { id: 'seoul', name: 'Seoul', sky: ['#14213d', '#9d4edd'], accent: '#4cc9f0', building: '#1d2d50', landmark: 'needle' },
  { id: 'bangkok', name: 'Bangkok', sky: ['#3d0c02', '#ffb703'], accent: '#ffd60a', building: '#5a1e0e', landmark: 'temple' },
  { id: 'hongkong', name: 'Hong Kong', sky: ['#03045e', '#00b4d8'], accent: '#90e0ef', building: '#023e8a', landmark: 'towers' },
  { id: 'taipei', name: 'Taipei', sky: ['#1a1a2e', '#16c79a'], accent: '#f6c90e', building: '#162447', landmark: 'stack' },
  { id: 'singapore', name: 'Singapore', sky: ['#22223b', '#f2a65a'], accent: '#ffd166', building: '#2b2d42', landmark: 'bay' },
];

const TOUR_EPOCH = new Date(2026, 0, 5); // a Monday
const TOUR_DAYS = 21;

export function currentTour(): { city: City; key: string; end: Date } {
  const days = Math.floor((midnight().getTime() - TOUR_EPOCH.getTime()) / DAY);
  const n = Math.floor(days / TOUR_DAYS);
  const city = CITIES[((n % CITIES.length) + CITIES.length) % CITIES.length];
  const end = new Date(TOUR_EPOCH.getTime() + (n + 1) * TOUR_DAYS * DAY);
  return { city, key: `tour-${n}`, end };
}

export const TOUR_GOALS = [
  { tokens: 15, reward: 'packs', amount: 2, label: '2 sticker packs' },
  { tokens: 35, reward: 'coins', amount: 400, label: '400 coins' },
  { tokens: 60, reward: 'plate', amount: 1, label: 'City plate (exclusive)' },
] as const;

// ------------------------------------------------------------------ holidays

export interface Holiday { id: string; name: string; from: [number, number]; to: [number, number]; decor: string; item: { cat: 'plate' | 'flag' | 'fx'; id: string; name: string }; color: string }

// Month is 1-12. Ranges may wrap over New Year.
export const HOLIDAYS: Holiday[] = [
  { id: 'lunar', name: 'Lunar New Year', from: [1, 20], to: [2, 20], decor: 'lunar', item: { cat: 'flag', id: 'lunar', name: 'Lucky Red Flag' }, color: '#e63946' },
  { id: 'hanami', name: 'Cherry Blossom Festival', from: [3, 20], to: [4, 20], decor: 'hanami', item: { cat: 'plate', id: 'hanami', name: 'Hanami Plate' }, color: '#ff8fb8' },
  { id: 'summer', name: 'Summer Fireworks', from: [7, 15], to: [8, 15], decor: 'fireworks', item: { cat: 'fx', id: 'fireworks', name: 'Fireworks FX' }, color: '#4cc9f0' },
  { id: 'halloween', name: 'Spooky Sushi Night', from: [10, 15], to: [11, 2], decor: 'halloween', item: { cat: 'fx', id: 'bats', name: 'Bat Swarm FX' }, color: '#ff7b00' },
  { id: 'winter', name: 'Winter Holidays', from: [12, 15], to: [1, 6], decor: 'winter', item: { cat: 'plate', id: 'snowflake', name: 'Snowflake Plate' }, color: '#9fe3ff' },
];

export const HOLIDAY_GOAL = 40; // tokens for the holiday's limited item

export function currentHoliday(now = new Date()): { holiday: Holiday; key: string; end: Date } | null {
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const v = m * 100 + d;
  for (const h of HOLIDAYS) {
    const a = h.from[0] * 100 + h.from[1];
    const b = h.to[0] * 100 + h.to[1];
    const inside = a <= b ? v >= a && v <= b : v >= a || v <= b;
    if (!inside) continue;
    const year = a > b && v <= b ? now.getFullYear() - 1 : now.getFullYear();
    const endYear = a > b ? year + 1 : year;
    return { holiday: h, key: `${h.id}-${year}`, end: new Date(endYear, h.to[0] - 1, h.to[1] + 1) };
  }
  return null;
}

// ---------------------------------------------------------------- daily race

export const RACE_GOAL = 5; // chefs to beat in a single run
export const RACE_RIVALS = 99;
export const RACE_POOL = 1000;

/** How many AI racers have finished today's race so far. */
export function raceFinishers(day: string, at = new Date()): number {
  const r = seeded(hashString(`race-${day}`));
  const hours = (at.getTime() - midnight(at).getTime()) / 3_600_000;
  let n = 0;
  for (let i = 0; i < RACE_RIVALS; i++) {
    // Most racers finish across the day; about a fifth never do.
    const finish = r() < 0.2 ? Infinity : 0.5 + Math.pow(r(), 1.6) * 23;
    if (finish <= hours) n++;
  }
  return n;
}

export function raceEnd(): Date {
  return new Date(midnight().getTime() + DAY);
}

// ------------------------------------------------------- weekend sushi cup

export const CUP_SIZE = 50;

/** The current or most recent cup weekend (Friday 00:00 to Monday 00:00). */
export function cupWeekend(now = new Date()): { key: string; start: Date; end: Date; live: boolean } {
  const day = now.getDay(); // 0 Sun ... 5 Fri 6 Sat
  const back = (day + 2) % 7; // days since the latest Friday
  const start = new Date(midnight(now).getTime() - back * DAY);
  const end = new Date(start.getTime() + 3 * DAY);
  return { key: `cup-${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`, start, end, live: now < end };
}

const RIVAL_NAMES = ['Kai', 'Mio', 'Ren', 'Hana', 'Bo', 'Lin', 'Jun', 'Sora', 'Yui', 'Minh', 'Ploy', 'Aki', 'Rei', 'Seo', 'Tao', 'Emi', 'Haru', 'Nao', 'Kiko', 'Tavi'];

/** AI rival standings for a cup: scores climb over the weekend toward each rival's final score. */
export function cupRivals(key: string, start: Date, end: Date, at = new Date()): { name: string; score: number }[] {
  const r = seeded(hashString(key));
  const t = Math.max(0, Math.min(1, (at.getTime() - start.getTime()) / (end.getTime() - start.getTime())));
  const out: { name: string; score: number }[] = [];
  for (let i = 0; i < CUP_SIZE - 1; i++) {
    const final = Math.round(8 + Math.pow(r(), 2.2) * 110);
    const pace = 0.4 + r() * 0.6; // some rivals play early, some late
    const score = Math.round(final * Math.min(1, Math.pow(t / pace, 0.8)));
    out.push({ name: `${RIVAL_NAMES[i % RIVAL_NAMES.length]} (AI)`, score });
  }
  return out;
}

export function cupReward(rank: number): number {
  return rank === 1 ? 600 : rank <= 3 ? 300 : rank <= 10 ? 150 : rank <= 25 ? 60 : 20;
}

// ------------------------------------------------------------- kitchen crew

export const CREW_GOALS = [{ orders: 60, label: '300 coins' }, { orders: 120, label: '3 sticker packs' }, { orders: 200, label: '10 companion shards' }];
export const CREW_MATES = ['Chef Bot Aya (AI)', 'Chef Bot Ken (AI)', 'Chef Bot Lulu (AI)', 'Chef Bot Moto (AI)'];

/** Monday-to-Monday week key and bounds. */
export function crewWeek(now = new Date()): { key: string; start: Date; end: Date } {
  const back = (now.getDay() + 6) % 7;
  const start = new Date(midnight(now).getTime() - back * DAY);
  return { key: `crew-${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`, start, end: new Date(start.getTime() + 7 * DAY) };
}

/** Orders served so far this week by each AI crewmate. */
export function crewMateOrders(key: string, start: Date, end: Date, at = new Date()): number[] {
  const r = seeded(hashString(key));
  const t = Math.max(0, Math.min(1, (at.getTime() - start.getTime()) / (end.getTime() - start.getTime())));
  return CREW_MATES.map(() => Math.round((15 + r() * 25) * t));
}

// --------------------------------------------------------------- sushi pass

export const PASS_EPOCH = new Date(2026, 0, 1);
export const PASS_DAYS = 45;
export const PASS_TIERS = 30;
export const PASS_XP = 100; // per tier

export function currentSeason(): { n: number; end: Date } {
  const days = Math.floor((midnight().getTime() - PASS_EPOCH.getTime()) / DAY);
  const n = Math.floor(days / PASS_DAYS) + 1;
  return { n, end: new Date(PASS_EPOCH.getTime() + n * PASS_DAYS * DAY) };
}

export type RewardKind = 'coins' | 'booster' | 'packs' | 'shards' | 'item';
export interface Reward { kind: RewardKind; amount: number; label: string }

export function passReward(tier: number, premium: boolean, season: number): Reward {
  const t = tier + 1;
  if (premium && t === PASS_TIERS) return { kind: 'item', amount: 1, label: `Season ${season} plate` };
  if (t % 5 === 0) return premium ? { kind: 'packs', amount: 3, label: '3 sticker packs' } : { kind: 'shards', amount: 5, label: '5 companion shards' };
  switch (t % 4) {
    case 0: return { kind: 'booster', amount: premium ? 3 : 1, label: premium ? '3 boosters' : '1 booster' };
    case 1: return { kind: 'coins', amount: premium ? 120 + t * 10 : 50 + t * 5, label: `${premium ? 120 + t * 10 : 50 + t * 5} coins` };
    case 2: return { kind: 'packs', amount: premium ? 2 : 1, label: premium ? '2 sticker packs' : '1 sticker pack' };
    default: return { kind: 'shards', amount: premium ? 4 : 2, label: `${premium ? 4 : 2} companion shards` };
  }
}

export { hashString };
