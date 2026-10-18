// Gameplay analytics. Events are kept in a small log on the device so the funnel (tutorial steps,
// level reached, where runs end, which rewards get claimed) can be checked during testing.
// Nothing leaves the device unless ANALYTICS_ENDPOINT is set or a sink (e.g. Firebase Analytics)
// is registered with setAnalyticsSink(). If you turn either on, update PRIVACY.md and the store
// privacy forms first.

import { save } from './platform';

export const ANALYTICS_ENDPOINT = '';

export interface AnalyticsEvent { name: string; t: number; props?: Record<string, string | number | boolean> }

const MAX = 300;
let log: AnalyticsEvent[] = save.json('analytics', []);
let sink: ((e: AnalyticsEvent) => void) | null = null;
let pending: AnalyticsEvent[] = [];

/** Hook for a real analytics SDK, e.g. (e) => FirebaseAnalytics.logEvent({ name: e.name, params: e.props }). */
export function setAnalyticsSink(fn: (e: AnalyticsEvent) => void): void {
  sink = fn;
}

export function track(name: string, props?: AnalyticsEvent['props']): void {
  const e: AnalyticsEvent = { name, t: Date.now(), props };
  log.push(e);
  if (log.length > MAX) log = log.slice(-MAX);
  save.setJson('analytics', log);
  sink?.(e);
  if (ANALYTICS_ENDPOINT) {
    pending.push(e);
    if (pending.length >= 10) flush();
  }
}

/** Sends queued events to ANALYTICS_ENDPOINT (only when one is configured). */
export function flush(): void {
  if (!ANALYTICS_ENDPOINT || !pending.length) return;
  const batch = pending;
  pending = [];
  void fetch(ANALYTICS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch), keepalive: true }).catch(() => { pending = [...batch, ...pending].slice(-MAX); });
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
