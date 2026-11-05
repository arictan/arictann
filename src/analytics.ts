// Gameplay analytics. Events are kept in a small log on the device so the funnel (tutorial steps,
// level reached, where runs end, which rewards get claimed) can be checked during testing.
// Nothing leaves the device unless the player turns on "Share anonymous stats" AND there is
// somewhere to send it: ANALYTICS_ENDPOINT, the game's own server (`<serverUrl>/events`), or a
// sink registered with setAnalyticsSink() (e.g. Firebase Analytics).
// Sent events carry a random player tag and the player's experiment groups, so A/B tests can
// be measured (tools/experiments/analyze.mjs).

import { save } from './platform';
import { activeExperiments, cfg, experimentTag, playerTag } from './config';
import { APP_VERSION } from './safety';

export const ANALYTICS_ENDPOINT = '';

/** Where batches go: ANALYTICS_ENDPOINT, else the game's own server, else nowhere. */
function endpoint(): string {
  return ANALYTICS_ENDPOINT || (cfg.serverUrl ? `${cfg.serverUrl.replace(/\/$/, '')}/events` : '');
}

export interface AnalyticsEvent { name: string; t: number; props?: Record<string, string | number | boolean> }

const MAX = 300;
let log: AnalyticsEvent[] = save.json('analytics', []);
let sink: ((e: AnalyticsEvent) => void) | null = null;
let pending: AnalyticsEvent[] = [];
// Sending anything needs the player's yes (Settings → Share anonymous stats). Off by default.
let consent = (save.json('settings', {}) as { analytics?: boolean }).analytics === true;

export function setAnalyticsConsent(on: boolean): void {
  consent = on;
  if (!on) pending = [];
}

/** Hook for a real analytics SDK, e.g. (e) => FirebaseAnalytics.logEvent({ name: e.name, params: e.props }). */
export function setAnalyticsSink(fn: (e: AnalyticsEvent) => void): void {
  sink = fn;
}

export function track(name: string, props?: AnalyticsEvent['props']): void {
  const e: AnalyticsEvent = { name, t: Date.now(), props };
  if (FUNNEL.some(([id]) => id === name)) markFirst(name);
  log.push(e);
  if (log.length > MAX) log = log.slice(-MAX);
  save.setJson('analytics', log);
  if (!consent) return;
  // What leaves the device: the event plus a random player tag, app version and experiment groups.
  const sent: AnalyticsEvent = { ...e, props: { ...e.props, pid: playerTag(), v: APP_VERSION, exp: experimentTag() } };
  sink?.(sent);
  if (endpoint()) {
    pending.push(sent);
    if (pending.length >= 20) flush();
  }
}

/** Sends queued events (called every 20 events, and when the app goes to the background). */
export function flush(): void {
  const url = endpoint();
  if (!url || !pending.length) return;
  const batch = pending.slice(0, 100);
  pending = pending.slice(100);
  void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: batch }), keepalive: true })
    .then((r) => { if (!r.ok && r.status !== 400) throw new Error(String(r.status)); })
    .catch(() => { pending = [...batch, ...pending].slice(-MAX); });
}

export function analyticsLog(): AnalyticsEvent[] {
  return log;
}

/** Counts per event name, for the on-device summary in Settings. */
export function analyticsSummary(): [string, number][] {
  const counts: Record<string, number> = {};
  for (const e of log) counts[e.name] = (counts[e.name] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

/** The steps that matter for keeping players, in order, with when each first happened on this device. */
export const FUNNEL: [string, string][] = [
  ['install', 'Opened the game'],
  ['guide', 'Did a first-day step'],
  ['first_day', 'Finished the first day'],
  ['level_beat', 'Beat a chef'],
  ['restaurant_open', 'Opened the restaurant'],
  ['day2', 'Came back the next day'],
  ['day7', 'Came back a week later'],
];

export function funnel(): { id: string; label: string; at: number | null; count: number }[] {
  return FUNNEL.map(([id, label]) => {
    const hits = log.filter((e) => e.name === id);
    return { id, label, at: firstSeen(id) ?? hits[0]?.t ?? null, count: hits.length };
  });
}

// The log keeps the last 300 events, so the first time of each step is kept separately too.
const first: Record<string, number> = save.json('analyticsFirst', {});
function firstSeen(id: string): number | null {
  return first[id] ?? null;
}
export function markFirst(id: string): void {
  if (first[id]) return;
  first[id] = Date.now();
  save.setJson('analyticsFirst', first);
}

/** Install, day-2 and day-7 returns, once each. Call at startup. */
export function trackRetention(): void {
  const firstOpen = save.json('firstOpen', 0);
  if (!firstOpen) {
    save.setJson('firstOpen', Date.now());
    // Players updating from 1.0 already have progress: they aren't new installs.
    if (save.json('journey.unlocked', 1) <= 1) track('install');
    return;
  }
  const days = Math.floor((Date.now() - firstOpen) / 86_400_000);
  if (days >= 1 && !first.day2) track('day2', { days });
  if (days >= 7 && !first.day7) track('day7', { days });
}

/** Records once a day which experiments this player is in, and in which group (for the A/B analysis). */
export function trackExposures(): void {
  const day = new Date().toDateString();
  const seen = save.json<Record<string, string>>('expSeen', {});
  let changed = false;
  for (const a of activeExperiments) {
    if (a.forced) continue; // set by hand for testing: not a real exposure
    const key = `${a.id}:${a.group}`;
    if (seen[key] === day) continue;
    seen[key] = day;
    changed = true;
    track('experiment', { id: a.id, group: a.group });
  }
  if (changed) save.setJson('expSeen', seen);
}
