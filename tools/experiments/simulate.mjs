// Makes up realistic stats for a planned config, with effects you choose, so you can see what the
// analysis report looks like before any real player data exists (and so analyze.mjs can be tested
// against known answers). The groups are assigned exactly the way the game does it.
//
//   node tools/experiments/simulate.mjs <config.json> <out-folder> [players-per-day] [--effects '{"cook-fast":{"restaurant_enter":-0.15}}']
//
// An effect is a change for the test group (or for everyone, for experiments without a control
// group): +0.2 = 20% more of that event per day; for first_day/d1/d7 it adds that much to the
// chance (0.08 = 8 points).

import fs from 'node:fs';

const DEFAULT_EFFECTS = {
  'coins2x-weekend': { sessions: 0.2 },
  'cook-fast': { restaurant_enter: -0.15 },
  'gentle-start': { first_day: 0.08 },
  'friday-rush': { restaurant_enter: 0.25 },
  'daily-easier': { daily_share: 0.4 },
  'salmon-day': { runs: 0.15 },
  'snacks-20': {}, 'tableware-rush': {}, 'tips-economy-ph': {}, 'welcome-1-1': {},
};

// The game's group assignment (src/config.ts groupFor), copied exactly.
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const groupFor = (e, tag) => (e.share === undefined || hash(`${tag}|${e.id}`) < e.share ? 'test' : 'control');

let seed = +(process.env.SEED ?? 42);
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const poisson = (l) => { let k = 0, p = Math.exp(-l), s = p; const u = rnd(); while (u > s && k < 50) { k++; p *= l / k; s += p; } return k; };
const ALPHA = 'abcdefghijkmnpqrstuvwxyz23456789';

export function simulate(config, perDay = 150, effects = DEFAULT_EFFECTS) {
  const exps = config.experiments ?? [];
  const events = config.events ?? [];
  const starts = [...exps, ...events].map((e) => e.start).filter(Boolean).sort();
  const ends = [...exps, ...events].map((e) => e.end).filter(Boolean).sort();
  const from = Date.parse(`${starts[0]}T00:00:00Z`) - 14 * 86_400_000, to = Date.parse(`${ends[ends.length - 1]}T00:00:00Z`) + 10 * 86_400_000;
  const out = [];
  const players = [];
  for (let day = from; day < to; day += 86_400_000) {
    for (let i = 0; i < perDay; i++) players.push({ pid: Array.from({ length: 12 }, () => ALPHA[Math.floor(rnd() * 32)]).join(''), born: day, country: rnd() < 0.3 ? 'PH' : 'CA', keen: 0.4 + rnd() * 1.2, churn: 0.04 + rnd() * 0.12, gone: false });
    const date = new Date(day).toISOString().slice(0, 10), wd = new Date(day).getUTCDay();
    for (const p of players) {
      if (p.gone || p.born > day) continue;
      const first = p.born === day;
      const live = exps.filter((e) => (!e.start || date >= e.start) && (!e.end || date < e.end) && (!e.days || e.days.includes(wd)) && (!e.countries || e.countries.includes(p.country)));
      const groups = live.map((e) => [e.id, groupFor(e, p.pid)]);
      const liveEvents = events.filter((e) => date >= e.start && date < e.end);
      const lift = (metric) => {
        let m = 1;
        for (const [id, g] of groups) if (g === 'test') m += effects[id]?.[metric] ?? 0;
        for (const e of liveEvents) m += effects[e.id]?.[metric] ?? 0;
        return m;
      };
      const add = (name, n, extra = {}) => { for (let k = 0; k < n; k++) out.push({ name, t: day + 8 * 3_600_000 + Math.floor(rnd() * 12 * 3_600_000), props: { pid: p.pid, exp: groups.map(([id, g]) => `${id}:${g}`).join(','), ...extra } }); };
      // Returning players skip some days.
      if (!first && rnd() > 0.55 * p.keen) { if (rnd() < p.churn) p.gone = true; continue; }
      if (first) {
        add('install', 1);
        const fd = 0.6 + groups.reduce((a, [id, g]) => a + (g === 'test' ? effects[id]?.first_day ?? 0 : 0), 0);
        if (rnd() < fd) add('first_day', 1);
      } else {
        const age = Math.round((day - p.born) / 86_400_000);
        if (age >= 1 && !p.d2) { p.d2 = true; add('day2', 1); }
        if (age >= 7 && !p.d7) { p.d7 = true; add('day7', 1); }
      }
      add('app_open', Math.max(1, poisson(2 * p.keen * lift('sessions'))));
      add('run_end', poisson(6 * p.keen * lift('runs')));
      add('restaurant_enter', poisson(2.5 * p.keen * lift('restaurant_enter')));
      add('diner_cook', poisson(3 * p.keen * lift('diner_cook')));
      add('guest_served', poisson(8 * p.keen * lift('guest_served')));
      const rolled = rnd() < 0.5;
      if (rolled) { add('daily_roll', 1); if (rnd() < 0.15 * lift('daily_share')) add('daily_share', 1); }
      if (rnd() < 0.01 * lift('purchases')) add('purchase', 1);
      if (rnd() < p.churn) p.gone = true;
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const ei = args.indexOf('--effects');
  const effects = ei >= 0 ? { ...DEFAULT_EFFECTS, ...JSON.parse(args.splice(ei, 2)[1]) } : DEFAULT_EFFECTS;
  const [cfgFile, outDir, perDay] = args;
  if (!cfgFile || !outDir) { console.log('Usage: node tools/experiments/simulate.mjs <config.json> <out-folder> [players-per-day] [--effects JSON]'); process.exit(1); }
  const evs = simulate(JSON.parse(fs.readFileSync(cfgFile, 'utf8')), +(perDay ?? 150), effects);
  fs.mkdirSync(outDir, { recursive: true });
  const byDay = {};
  for (const e of evs) (byDay[new Date(e.t).toISOString().slice(0, 10)] ??= []).push(JSON.stringify({ ...e, at: e.t }));
  for (const [d, lines] of Object.entries(byDay)) fs.writeFileSync(`${outDir}/events-${d}.ndjson`, lines.join('\n') + '\n');
  console.log(`${evs.length.toLocaleString('en-US')} made-up events in ${Object.keys(byDay).length} daily files in ${outDir}`);
  console.log('Planted effects:', JSON.stringify(effects));
}
