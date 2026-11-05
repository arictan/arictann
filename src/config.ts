// Remote config: game-balance values that can be tuned without shipping an app update.
// The defaults below are what the game uses offline. Set REMOTE_CONFIG_URL to a JSON file
// (for example on Firebase Hosting or GitHub Pages) with any of these keys, or set `serverUrl`
// and the game reads `<serverUrl>/config`. The last fetched values are cached and applied on
// the next launch (or when the app comes back from the background, outside a run).
//
// Experiments (A/B tests) live in the same file: see `Experiment` below and experiments/README.md.

import { save } from './platform';
import { settings } from './settings';

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
  experiments: [] as Experiment[], // A/B tests and scheduled changes (experiments/README.md)
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

function localDay(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
}

/** The live event running now, if any (dates are local, end is exclusive). */
export function liveEventNow(at = new Date()): LiveEvent | null {
  const day = localDay(at);
  const all = [...BUNDLED_EVENTS.filter((b) => !cfg.events.some((e) => e.id === b.id)), ...cfg.events];
  return all.find((e) => e.start <= day && day < e.end) ?? null;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function validEvent(e: unknown): e is LiveEvent {
  const v = e as LiveEvent;
  return !!v && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.icon === 'string' && typeof v.text === 'string'
    && DATE.test(v.start) && DATE.test(v.end) && typeof v.coinMult === 'number' && v.coinMult > 0 && v.coinMult <= 3;
}

export type Config = typeof DEFAULTS;

// ================================================================ experiments

/** The values an experiment can change: every number or text knob above. */
export type Knob = Exclude<keyof Config, 'events' | 'experiments' | 'serverUrl'>;

/**
 * One experiment. While it's active for a player (dates, weekdays and country all match), players
 * in the test group get `set`; the others are the control group and play with the normal values.
 * Both groups are tagged in analytics, so the two can be compared (tools/experiments/analyze.mjs).
 */
export interface Experiment {
  id: string; // short and unique, e.g. "coins2x-weekend"
  start?: string; // first local day, "YYYY-MM-DD"
  end?: string; // local day it stops (not included)
  days?: number[]; // weekdays it runs on: 0 Sunday … 6 Saturday
  countries?: string[]; // only players in these countries (two-letter codes)
  share?: number; // part of players in the test group, 0–1; leave out = everyone (no control group)
  set: Partial<Record<Knob, number | string>>;
}

export type Variant = 'test' | 'control';

const KNOBS = (Object.keys(DEFAULTS) as (keyof Config)[]).filter((k): k is Knob => k !== 'events' && k !== 'experiments' && k !== 'serverUrl');

/** Checks an experiment from remote config; anything malformed is dropped rather than half-applied. */
export function validExperiment(e: unknown): e is Experiment {
  const v = e as Experiment;
  if (!v || typeof v.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(v.id) || typeof v.set !== 'object' || !v.set) return false;
  if ((v.start !== undefined && !DATE.test(v.start)) || (v.end !== undefined && !DATE.test(v.end))) return false;
  if (v.days !== undefined && (!Array.isArray(v.days) || !v.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6))) return false;
  if (v.countries !== undefined && (!Array.isArray(v.countries) || !v.countries.every((c) => typeof c === 'string' && /^[A-Z]{2}$/.test(c)))) return false;
  if (v.share !== undefined && (typeof v.share !== 'number' || v.share <= 0 || v.share > 1)) return false;
  const keys = Object.keys(v.set);
  return keys.length > 0 && keys.every((k) => KNOBS.includes(k as Knob) && typeof v.set[k as Knob] === typeof DEFAULTS[k as Knob]);
}

/** A random id for this install, used only to put the player in a test group and to tag analytics. */
export function playerTag(): string {
  let id = save.json('expId', '');
  if (!id) {
    id = Array.from({ length: 12 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');
    save.setJson('expId', id);
  }
  return id;
}

/** A number in [0, 1) from text. FNV-1a, then a final mix so similar texts land far apart. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** The player's country: the one picked for the country cup, else the phone's language region. */
export function playerCountry(): string {
  return settings.country || ((navigator.language || '').split('-')[1] ?? '').toUpperCase();
}

/** Same player, same experiment → same group, every launch. Each experiment splits players independently. */
export function groupFor(e: Experiment, tag = playerTag()): Variant {
  return e.share === undefined || hash(`${tag}|${e.id}`) < e.share ? 'test' : 'control';
}

/** Whether an experiment is running for this player right now (its group aside). */
export function experimentLive(e: Experiment, at = new Date(), country = playerCountry()): boolean {
  const day = localDay(at);
  if (e.start && day < e.start) return false;
  if (e.end && day >= e.end) return false;
  if (e.days && !e.days.includes(at.getDay())) return false;
  if (e.countries && !e.countries.includes(country)) return false;
  return true;
}

/** For trying an experiment on your own phone (Settings → Diagnostics): forces a group and ignores dates. */
let forced: Record<string, Variant> = save.json('expForce', {});

export function forceExperiment(id: string, v: Variant | null): void {
  if (v) forced[id] = v;
  else delete forced[id];
  save.setJson('expForce', forced);
  applyConfig();
}

export function forcedGroup(id: string): Variant | null {
  return forced[id] ?? null;
}

/** The experiments running for this player now, with their group (forced = set by hand in Diagnostics). */
export let activeExperiments: { id: string; group: Variant; forced?: boolean }[] = [];

/**
 * Compact tag for analytics, e.g. "coins2x-weekend:test,snacks20:control". A group forced by hand
 * gets a "*" ("test*"), so testers' own play never counts in the results.
 */
export function experimentTag(): string {
  return activeExperiments.map((a) => `${a.id}:${a.group}${a.forced ? '*' : ''}`).join(',');
}

// ================================================================ the config itself

export const cfg: Config = { ...DEFAULTS };

/** Rebuilds cfg: defaults, then the cached remote values, then any running experiments. */
export function applyConfig(at = new Date()): void {
  const remote = save.json<Partial<Config>>('remoteConfig', {});
  const next: Config = { ...DEFAULTS, ...remote };
  const list = Array.isArray(next.experiments) ? next.experiments.filter(validExperiment) : [];
  activeExperiments = [];
  for (const e of list) {
    const f = forced[e.id];
    if (!f && !experimentLive(e, at)) continue;
    const group = f ?? groupFor(e);
    activeExperiments.push(f ? { id: e.id, group, forced: true } : { id: e.id, group });
    if (group === 'test') Object.assign(next, e.set);
  }
  next.experiments = list;
  Object.assign(cfg, next);
}

applyConfig();

/** Where remote config comes from: REMOTE_CONFIG_URL, or the game's own server. */
export function configUrl(): string {
  return REMOTE_CONFIG_URL || (cfg.serverUrl ? `${cfg.serverUrl.replace(/\/$/, '')}/config` : '');
}

/** Fetches new values for next time (never changes the current session mid-run). */
export async function loadConfig(): Promise<void> {
  const url = configUrl();
  if (!url) return;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as Partial<Config>;
    const clean: Partial<Record<keyof Config, unknown>> = {};
    for (const k of Object.keys(DEFAULTS) as (keyof Config)[]) {
      if (k === 'events') {
        if (Array.isArray(data.events)) clean.events = data.events.filter(validEvent).slice(0, 20);
      } else if (k === 'experiments') {
        if (Array.isArray(data.experiments)) clean.experiments = data.experiments.filter(validExperiment).slice(0, 20);
      } else if (typeof data[k] === typeof DEFAULTS[k]) clean[k] = data[k];
    }
    // A config that doesn't mention serverUrl must not cut the game off from its server.
    if (!('serverUrl' in data)) {
      const prev = save.json<Partial<Config>>('remoteConfig', {}).serverUrl;
      if (prev) clean.serverUrl = prev;
    }
    save.setJson('remoteConfig', clean);
  } catch { /* offline: keep the cached values */ }
}
