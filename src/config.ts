// Remote config: game-balance values that can be tuned without shipping an app update.
// The defaults below are what the game uses offline. Set REMOTE_CONFIG_URL to a JSON file
// (for example on Firebase Hosting, or Firebase Remote Config behind a small endpoint) with any
// of these keys; the last fetched values are cached and applied on the next launch.

import { save } from './platform';

export const REMOTE_CONFIG_URL = '';

export const DEFAULTS = {
  coinBoost: 1, // multiplies coins earned in runs (e.g. 2 for a double-coins weekend)
  perksEvery: 1, // offer a perk after every Nth chef beaten (0 = never)
  tutorialSlowdown: 0.6, // layer speed for the first drops of a brand-new player
  rageAt: 0.5, // how far into a boss order the rage phase starts
  heartRequestChance: 0.2, // how often a friend makes a special request
  inviteReward: 200, // coins for entering a friend's invite code
  message: '', // optional announcement shown once on the home screen
  // Restaurant balance (see docs/ECONOMY.md before changing these).
  dishPrice: 10, // coins per layer of a dish's recipe, before its level bonus
  cookTime: 1, // multiplies every cooking time
  tipsMult: 0.75, // multiplies tips per hour (see docs/ECONOMY.md for why it isn't 1)
  rushMult: 2, // tips multiplier for guests served in Rush Hour
  guestSnacks: 40, // quick snacks served per day when nothing is plated
  pieceBoss: 0.25, // chance of tableware from a boss chef (every 10th level)
  pieceChef: 0.06, // chance of tableware from other chefs
  costScale: 1.25, // multiplies kitchen upgrade and Sakura Street prices
  festCost: 1, // multiplies festival stall prices
  dailyLevel: 12, // difficulty of the Daily Roll
  serverUrl: '', // the online backend (see server/README.md); empty = offline with simulated players
  events: [] as LiveEvent[], // live events, merged with the bundled calendar below
};

/** A live event: a name, a date range and a bonus. Add new ones from remote config, no app update needed. */
export interface LiveEvent { id: string; name: string; icon: string; text: string; start: string; end: string; coinMult: number; ingredient?: string }

/** Bundled events (remote config can add more or replace one with the same id). */
export const BUNDLED_EVENTS: LiveEvent[] = [
  { id: 'sake-bday', name: 'Sake-chan’s Birthday Week', icon: '🎂', text: 'Coins ×1.25 in every run', start: '2026-11-01', end: '2026-11-08', coinMult: 1.25 },
  { id: 'tuna-week', name: 'Winter Tuna Week', icon: '🐟', text: 'Tuna PERFECTs pay +2 coins', start: '2026-12-01', end: '2026-12-08', coinMult: 1, ingredient: 'tuna' },
  { id: 'new-year', name: 'New Year Feast', icon: '🎍', text: 'Coins ×1.5 in every run', start: '2027-01-01', end: '2027-01-04', coinMult: 1.5 },
  { id: 'nori-month', name: 'First Nori of the Year', icon: '🌊', text: 'Nori PERFECTs pay +2 coins', start: '2027-02-01', end: '2027-02-08', coinMult: 1, ingredient: 'nori' },
];

/** The live event running now, if any (dates are local, end is exclusive). */
export function liveEventNow(at = new Date()): LiveEvent | null {
  const day = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
  const all = [...BUNDLED_EVENTS.filter((b) => !cfg.events.some((e) => e.id === b.id)), ...cfg.events];
  return all.find((e) => e.start <= day && day < e.end) ?? null;
}

function validEvent(e: unknown): e is LiveEvent {
  const v = e as LiveEvent;
  return !!v && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.icon === 'string' && typeof v.text === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(v.start) && /^\d{4}-\d{2}-\d{2}$/.test(v.end) && typeof v.coinMult === 'number' && v.coinMult > 0 && v.coinMult <= 3;
}

export type Config = typeof DEFAULTS;

export const cfg: Config = { ...DEFAULTS, ...save.json('remoteConfig', {}) };

/** Fetches new values for next time (never changes the current session mid-run). */
export async function loadConfig(): Promise<void> {
  if (!REMOTE_CONFIG_URL) return;
  try {
    const res = await fetch(REMOTE_CONFIG_URL, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as Partial<Config>;
    const clean: Partial<Record<keyof Config, unknown>> = {};
    for (const k of Object.keys(DEFAULTS) as (keyof Config)[]) {
      if (k === 'events') {
        if (Array.isArray(data.events)) clean.events = data.events.filter(validEvent).slice(0, 20);
      } else if (typeof data[k] === typeof DEFAULTS[k]) clean[k] = data[k];
    }
    save.setJson('remoteConfig', clean);
  } catch { /* offline: keep the cached values */ }
}
