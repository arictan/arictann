// Remote config helper for experiments. No dependencies.
//
//   node tools/experiments/config.mjs plan 2027-01-04 experiments/1*.json experiments/20-*.json > server/config.json
//       Dates every experiment from its plan (week 1 starts on the given Monday) and merges them
//       into one remote config. Add --base <file> to merge into an existing config.
//   node tools/experiments/config.mjs check server/config.json
//       Checks a remote config exactly the way the game reads it, prints the calendar, and warns
//       about anything the game would silently drop or experiments that change the same value.
//
// The knob names and types, and the bundled live events, are read from src/config.ts, so this
// tool follows the game when knobs are added.

import fs from 'node:fs';

const SRC = new URL('../../src/config.ts', import.meta.url);
const src = fs.readFileSync(SRC, 'utf8');

/** DEFAULTS from src/config.ts: name → 'number' | 'string' | 'array'. */
function readDefaults() {
  const block = src.slice(src.indexOf('export const DEFAULTS = {'), src.indexOf('};', src.indexOf('export const DEFAULTS = {')));
  const out = {};
  for (const m of block.matchAll(/^\s{2}(\w+): ([^,]+),/gm)) {
    const v = m[2].trim();
    out[m[1]] = v.startsWith('[') ? 'array' : v.startsWith("'") ? 'string' : 'number';
  }
  return out;
}
const DEFAULTS = readDefaults();
const KNOBS = Object.keys(DEFAULTS).filter((k) => DEFAULTS[k] !== 'array' && k !== 'serverUrl');
const BUNDLED = [...src.matchAll(/\{ id: '([\w-]+)', name: '([^']+)'[^}]*?start: '([\d-]+)', end: '([\d-]+)', coinMult: ([\d.]+)/g)]
  .map((m) => ({ id: m[1], name: m[2], start: m[3], end: m[4], coinMult: +m[5] }));

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The same rules as validExperiment() in src/config.ts; returns the reasons it would be dropped. */
export function experimentProblems(e) {
  const p = [];
  if (!e || typeof e !== 'object') return ['not an object'];
  if (typeof e.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(e.id)) p.push('id must be 1-40 of a-z, 0-9 and -');
  if (e.start !== undefined && !DATE.test(e.start)) p.push('start must be YYYY-MM-DD');
  if (e.end !== undefined && !DATE.test(e.end)) p.push('end must be YYYY-MM-DD');
  if (e.start && e.end && e.end <= e.start) p.push('end must be after start');
  if (e.days !== undefined && (!Array.isArray(e.days) || !e.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6))) p.push('days must be numbers 0 (Sunday) to 6');
  if (e.countries !== undefined && (!Array.isArray(e.countries) || !e.countries.every((c) => typeof c === 'string' && /^[A-Z]{2}$/.test(c)))) p.push('countries must be two capital letters, e.g. "PH"');
  if (e.share !== undefined && (typeof e.share !== 'number' || e.share <= 0 || e.share > 1)) p.push('share must be above 0 and at most 1');
  if (typeof e.set !== 'object' || !e.set || !Object.keys(e.set).length) p.push('set must change at least one value');
  else for (const [k, v] of Object.entries(e.set)) {
    if (!KNOBS.includes(k)) p.push(`"${k}" is not a value experiments can change (${KNOBS.join(', ')})`);
    else if (typeof v !== DEFAULTS[k]) p.push(`"${k}" must be a ${DEFAULTS[k]}`);
  }
  return p;
}

/** The same rules as validEvent() in src/config.ts. */
export function eventProblems(e) {
  const p = [];
  for (const k of ['id', 'name', 'icon', 'text']) if (typeof e?.[k] !== 'string') p.push(`${k} must be text`);
  if (!DATE.test(e?.start ?? '') || !DATE.test(e?.end ?? '')) p.push('start and end must be YYYY-MM-DD');
  if (typeof e?.coinMult !== 'number' || e.coinMult <= 0 || e.coinMult > 3) p.push('coinMult must be above 0 and at most 3');
  return p;
}

const addDays = (day, n) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const overlaps = (a, b) => (a.start ?? '0000') < (b.end ?? '9999') && (b.start ?? '0000') < (a.end ?? '9999')
  && (!a.days || !b.days || a.days.some((d) => b.days.includes(d)));

export function check(config) {
  const errors = [], warnings = [], calendar = [];
  for (const k of Object.keys(config)) if (!(k in DEFAULTS) && k !== 'plan') warnings.push(`"${k}" isn't a config value the game knows: it's ignored`);
  for (const [k, t] of Object.entries(DEFAULTS)) if (k in config && t !== 'array' && typeof config[k] !== t) errors.push(`"${k}" must be a ${t}: the game ignores it`);
  const exps = Array.isArray(config.experiments) ? config.experiments : [];
  if (config.experiments !== undefined && !Array.isArray(config.experiments)) errors.push('"experiments" must be a list');
  if (exps.length > 20) errors.push(`${exps.length} experiments: the game reads only the first 20`);
  const ids = new Set();
  for (const e of exps) {
    const p = experimentProblems(e);
    if (p.length) errors.push(`experiment ${e?.id ?? '?'} will be IGNORED by the game: ${p.join('; ')}`);
    if (ids.has(e?.id)) errors.push(`experiment id ${e.id} is used twice`);
    ids.add(e?.id);
    if (!e?.start || !e?.end) warnings.push(`experiment ${e?.id}: no ${!e?.start ? 'start' : 'end'} date, so it runs ${!e?.end ? 'until removed' : 'from now'}`);
    if (e?.share === undefined && e?.set) warnings.push(`experiment ${e.id}: no "share", so everyone gets it and there is no control group (compare before/after instead)`);
    calendar.push({ kind: 'experiment', id: e?.id, start: e?.start, end: e?.end, days: e?.days, countries: e?.countries, share: e?.share, set: e?.set });
  }
  const events = Array.isArray(config.events) ? config.events : [];
  for (const e of events) {
    const p = eventProblems(e);
    if (p.length) errors.push(`event ${e?.id ?? '?'} will be IGNORED by the game: ${p.join('; ')}`);
    calendar.push({ kind: 'event', id: e?.id, start: e?.start, end: e?.end, set: { coinMult: e?.coinMult, ingredient: e?.ingredient } });
  }
  // Two experiments changing the same value at the same time can't be told apart.
  const valid = exps.filter((e) => !experimentProblems(e).length);
  for (let i = 0; i < valid.length; i++) for (let j = i + 1; j < valid.length; j++) {
    const a = valid[i], b = valid[j];
    const same = Object.keys(a.set).filter((k) => k in b.set && k !== 'message');
    if (same.length && overlaps(a, b)) errors.push(`${a.id} and ${b.id} both change ${same.join(', ')} at the same time: their results would be mixed up`);
    if ('message' in a.set && 'message' in b.set && overlaps(a, b)) warnings.push(`${a.id} and ${b.id} both show a message at the same time: players see only one`);
  }
  // Coin experiments during a live event that also changes coins.
  for (const e of valid.filter((x) => 'coinBoost' in x.set)) {
    for (const ev of [...BUNDLED, ...events].filter((x) => x.coinMult && x.coinMult !== 1)) {
      if (overlaps(e, ev)) warnings.push(`${e.id} runs during the live event "${ev.name}" (coins ×${ev.coinMult}): the two multiply`);
    }
  }
  calendar.sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
  return { errors, warnings, calendar };
}

/** Gives every experiment file its dates (week 1 = the Monday given) and merges them. */
export function plan(monday, files, base = {}) {
  const out = { ...base, experiments: [...(base.experiments ?? [])], events: [...(base.events ?? [])] };
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    const p = d.plan ?? {};
    const start = p.day !== undefined ? addDays(monday, (p.week - 1) * 7 + (p.day + 6) % 7) : addDays(monday, (p.week - 1) * 7);
    const end = p.day !== undefined ? addDays(start, p.length_days ?? 1) : addDays(start, 7 * (p.weeks ?? 1));
    for (const e of d.experiments ?? []) out.experiments.push({ ...e, start, end });
    for (const e of d.events ?? []) out.events.push({ ...e, start, end });
  }
  // Two experiments at the same time that are judged on the same main metric would blur each other.
  const dated = files.map((f) => JSON.parse(fs.readFileSync(f, 'utf8'))).map((d) => ({ id: (d.experiments ?? d.events ?? [])[0]?.id, metric: d.plan?.metric }))
    .map((x) => ({ ...x, ...[...out.experiments, ...out.events].find((e) => e.id === x.id) }));
  for (let i = 0; i < dated.length; i++) for (let j = i + 1; j < dated.length; j++) {
    const a = dated[i], b = dated[j];
    if (a.metric && a.metric === b.metric && a.share !== undefined && b.share !== undefined && overlaps(a, b) && (!a.countries || !b.countries || a.countries.some((c) => b.countries.includes(c)))) {
      console.error(`warning: ${a.id} and ${b.id} run at the same time and are both judged on "${a.metric}": move one so their effects don't mix`);
    }
  }
  if (!out.experiments.length) delete out.experiments;
  if (!out.events.length) delete out.events;
  return out;
}

function printCheck(config) {
  const { errors, warnings, calendar } = check(config);
  console.log('Calendar');
  for (const c of calendar) {
    const when = `${c.start ?? 'now'} → ${c.end ? addDays(c.end, -1) : 'until removed'}`;
    const extra = [c.days && c.days.map((d) => DAYS[d]).join('+'), c.countries && c.countries.join(','), c.share !== undefined && `${Math.round(c.share * 100)}% test`].filter(Boolean).join(', ');
    console.log(`  ${when.padEnd(26)} ${c.kind === 'event' ? 'event' : 'exp  '} ${String(c.id).padEnd(18)} ${extra ? `(${extra}) ` : ''}${JSON.stringify(c.set)}`);
  }
  for (const w of warnings) console.log(`  warning: ${w}`);
  for (const e of errors) console.log(`  ERROR: ${e}`);
  console.log(errors.length ? `\n${errors.length} error(s): fix them before publishing.` : '\nOK: the game will read every experiment and event in this file.');
  return errors.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'check' && args[0]) {
    process.exitCode = printCheck(JSON.parse(fs.readFileSync(args[0], 'utf8'))) ? 1 : 0;
  } else if (cmd === 'plan' && DATE.test(args[0] ?? '')) {
    if (new Date(`${args[0]}T12:00:00Z`).getUTCDay() !== 1) { console.error(`${args[0]} is not a Monday`); process.exit(1); }
    const bi = args.indexOf('--base');
    const base = bi >= 0 ? JSON.parse(fs.readFileSync(args[bi + 1], 'utf8')) : {};
    const files = args.slice(1).filter((_, i) => bi < 0 || (i + 1 !== bi && i + 1 !== bi + 1));
    const out = plan(args[0], files, base);
    console.log(JSON.stringify(out, null, 2));
    const { errors } = check(out);
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  } else {
    console.log('Usage:\n  node tools/experiments/config.mjs plan <Monday YYYY-MM-DD> <experiment files…> [--base config.json]\n  node tools/experiments/config.mjs check <config.json>');
  }
}
