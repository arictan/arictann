// Reads the anonymous stats the server stored (server/events/*.ndjson) and reports each
// experiment: the test group against the control group, or, for changes given to everyone,
// the experiment's days against the same number of days just before. No dependencies.
//
//   node tools/experiments/analyze.mjs --events server/events --config server/config.json experiments/*.json
//
// --events   a folder of .ndjson files (or one .ndjson / .json file)
// --config   the remote config that was live (for each experiment's dates)
// the rest   the experiment files (for the question, the main metric and the guard metrics)

import fs from 'node:fs';
import path from 'node:path';

// ------------------------------------------------------------------ metrics

/** Per-player counts per active day, from these events. */
const COUNTS = {
  sessions: 'app_open',
  runs: 'run_end',
  restaurant_enter: 'restaurant_enter',
  diner_cook: 'diner_cook',
  guest_served: 'guest_served',
  daily_roll: 'daily_roll',
  daily_share: 'daily_share',
  purchases: 'purchase',
  ads: 'ad_reward',
  tips: 'tips',
};
/** Share of new players (installed while in the experiment) who later did this. */
const RATES = { first_day: 'first_day', d1: 'day2', d7: 'day7' };
export const LABELS = {
  sessions: 'sessions per day', runs: 'runs per day', restaurant_enter: 'restaurant visits per day', diner_cook: 'dishes cooked per day',
  guest_served: 'guests served per day', daily_roll: 'Daily Rolls per day', daily_share: 'Daily Roll shares per day', purchases: 'purchases per day',
  ads: 'rewarded ads per day', tips: 'tip collections per day', first_day: 'new players who finished the first day', d1: 'day-1 retention', d7: 'day-7 retention',
};

// ------------------------------------------------------------------ statistics

const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const variance = (a) => { const m = mean(a); return a.length > 1 ? a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) : 0; };

/** Difference of means (b − a) with a 95% range (Welch). */
export function compareMeans(a, b) {
  const d = mean(b) - mean(a);
  const se = Math.sqrt(variance(a) / (a.length || 1) + variance(b) / (b.length || 1));
  return { a: mean(a), b: mean(b), diff: d, lo: d - 1.96 * se, hi: d + 1.96 * se, na: a.length, nb: b.length };
}

/** Difference of two proportions (b − a) with a 95% range. */
export function compareRates(hitsA, nA, hitsB, nB) {
  const pa = nA ? hitsA / nA : 0, pb = nB ? hitsB / nB : 0;
  const se = Math.sqrt((pa * (1 - pa)) / (nA || 1) + (pb * (1 - pb)) / (nB || 1));
  return { a: pa, b: pb, diff: pb - pa, lo: pb - pa - 1.96 * se, hi: pb - pa + 1.96 * se, na: nA, nb: nB };
}

export function verdict(r, minN = 100) {
  if (Math.min(r.na, r.nb) < minN) return `not enough players yet (${r.na} vs ${r.nb}; aim for ${minN}+ each)`;
  if (r.lo > 0) return 'HIGHER, and the difference is clear';
  if (r.hi < 0) return 'LOWER, and the difference is clear';
  return 'no clear difference';
}

// ------------------------------------------------------------------ reading

export function readEvents(p) {
  const files = fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter((f) => /\.(nd)?json$/.test(f)).map((f) => path.join(p, f)) : [p];
  const out = [];
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8').trim();
    if (!text) continue;
    if (text.startsWith('[')) out.push(...JSON.parse(text));
    else for (const line of text.split('\n')) { try { out.push(JSON.parse(line)); } catch { /* a damaged line */ } }
  }
  return out.filter((e) => e?.props?.pid).sort((a, b) => a.t - b.t);
}

const dayOf = (t) => new Date(t).toISOString().slice(0, 10);
const groupsIn = (e) => Object.fromEntries(String(e.props.exp ?? '').split(',').filter(Boolean).map((x) => x.split(':')));

// ------------------------------------------------------------------ analysis

/** Per-player numbers from a list of events: counts per active day, and the player's events. */
function perPlayer(events) {
  const players = new Map();
  for (const e of events) {
    let p = players.get(e.props.pid);
    if (!p) players.set(e.props.pid, (p = { days: new Set(), n: {} }));
    p.days.add(dayOf(e.t));
    p.n[e.name] = (p.n[e.name] ?? 0) + 1;
  }
  return players;
}

function countMetric(players, metric) {
  return [...players.values()].map((p) => (p.n[COUNTS[metric]] ?? 0) / p.days.size);
}

/** A/B: events tagged with the experiment, split by group. */
export function analyzeSplit(all, id, metrics) {
  const tagged = { test: [], control: [] };
  for (const e of all) {
    const g = groupsIn(e)[id];
    if (g === 'test' || g === 'control') tagged[g].push(e);
  }
  const P = { test: perPlayer(tagged.test), control: perPlayer(tagged.control) };
  const lastT = all.length ? all[all.length - 1].t : 0;
  const rows = [];
  for (const m of metrics) {
    if (COUNTS[m]) rows.push({ metric: m, ...compareMeans(countMetric(P.control, m), countMetric(P.test, m)) });
    else if (RATES[m]) {
      // New players: their install event carries the tag. Later events count whether tagged or not.
      const need = m === 'd7' ? 8 : m === 'd1' ? 2 : 1;
      const res = {};
      for (const g of ['test', 'control']) {
        const installs = tagged[g].filter((e) => e.name === 'install' && lastT - e.t >= need * 86_400_000).map((e) => e.props.pid);
        const did = new Set(all.filter((e) => e.name === RATES[m]).map((e) => e.props.pid));
        res[g] = { n: installs.length, hits: installs.filter((p) => did.has(p)).length };
      }
      rows.push({ metric: m, rate: true, ...compareRates(res.control.hits, res.control.n, res.test.hits, res.test.n) });
    }
  }
  return { players: { test: P.test.size, control: P.control.size }, rows };
}

/** Everyone got it: its days against the same number of days just before (or the same weekday a week before). */
export function analyzeBeforeAfter(all, start, end, metrics, sameWeekday = false) {
  const ms = (d) => Date.parse(`${d}T00:00:00Z`);
  const len = ms(end) - ms(start);
  const before = sameWeekday ? [ms(start) - 7 * 86_400_000, ms(start) - 7 * 86_400_000 + len] : [ms(start) - len, ms(start)];
  const during = all.filter((e) => e.t >= ms(start) && e.t < ms(end));
  const prior = all.filter((e) => e.t >= before[0] && e.t < before[1]);
  const P = { during: perPlayer(during), before: perPlayer(prior) };
  const rows = metrics.filter((m) => COUNTS[m]).map((m) => ({ metric: m, ...compareMeans(countMetric(P.before, m), countMetric(P.during, m)) }));
  return { players: { during: P.during.size, before: P.before.size }, rows, window: { before: before.map((t) => dayOf(t)), during: [start, end] } };
}

// ------------------------------------------------------------------ report

const fmt = (r) => (r.rate ? (x) => `${(x * 100).toFixed(1)}%` : (x) => x.toFixed(2));
const plural = (n, w) => `${n.toLocaleString('en-US')} ${w}${n === 1 ? '' : 's'}`;
const sign = (x) => (x >= 0 ? '+' : '−');

export function report(all, config, files) {
  const out = ['# Experiment results', '', `${plural(all.length, 'event')} from ${plural(new Set(all.map((e) => e.props.pid)).size, 'player')}` + (all.length ? `, ${dayOf(all[0].t)} to ${dayOf(all[all.length - 1].t)}.` : '.'), ''];
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    const p = d.plan ?? {};
    const metrics = [p.metric, ...(p.guard ?? [])].filter(Boolean);
    const exp = d.experiments?.[0], ev = d.events?.[0];
    const id = exp?.id ?? ev?.id;
    const live = [...(config.experiments ?? []), ...(config.events ?? [])].find((x) => x.id === id);
    out.push(`## #${p.idea} ${p.title} (\`${id}\`)`, '', p.question ?? '', '');
    let res;
    if (exp?.share !== undefined) {
      res = analyzeSplit(all, id, metrics);
      out.push(`Players: ${res.players.test} in the test group, ${res.players.control} in control.`, '', '| | control | test | difference (95% range) | |', '|---|---|---|---|---|');
    } else if (live?.start && live?.end) {
      res = analyzeBeforeAfter(all, live.start, live.end, metrics, !!ev);
      out.push(`Everyone got this, so ${res.window.during[0]}–${res.window.during[1]} is compared with ${res.window.before[0]}–${res.window.before[1]}: ${res.players.during} players during, ${res.players.before} before.`, '', '| | before | during | difference (95% range) | |', '|---|---|---|---|---|');
    } else {
      out.push('_Not in the live config (no dates), so nothing to compare yet._', '');
      continue;
    }
    for (const r of res.rows) {
      const f2 = fmt(r);
      const rel = r.a ? ` (${sign(r.diff)}${Math.abs((r.diff / r.a) * 100).toFixed(0)}%)` : '';
      out.push(`| ${r.metric === p.metric ? '**' : ''}${LABELS[r.metric]}${r.metric === p.metric ? '** (main)' : ''} | ${f2(r.a)} | ${f2(r.b)} | ${sign(r.diff)}${f2(Math.abs(r.diff))}${rel}, ${f2(r.lo)} to ${f2(r.hi)} | ${verdict(r, r.rate ? 200 : 100)} |`);
    }
    out.push('', `**How to decide:** ${p.decide ?? ''}`, '');
  }
  out.push('---', 'A difference is "clear" when its 95% range doesn\'t cross zero. With many metrics, expect about 1 in 20 to look clear by chance: trust the main metric, and repeat a surprising result before acting on it.');
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const ev = opt('--events'), cf = opt('--config');
  if (!ev || !args.length) {
    console.log('Usage: node tools/experiments/analyze.mjs --events <folder or file> [--config <live config.json>] <experiment files…>');
    process.exit(1);
  }
  const config = cf ? JSON.parse(fs.readFileSync(cf, 'utf8')) : {};
  console.log(report(readEvents(ev), config, args));
}
