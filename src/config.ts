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
};

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
      if (typeof data[k] === typeof DEFAULTS[k]) clean[k] = data[k];
    }
    save.setJson('remoteConfig', clean);
  } catch { /* offline: keep the cached values */ }
}
