// Sushi Stack reference server: Daily Roll board, Tower of the World, country cup, friends'
// daily scores, cloud backup with an ID + PIN, remote config (experiments) and anonymous stats
// from players who agreed to share them. Plain Node (18+), no dependencies, data kept in one
// JSON file (stats in one file per day). It is meant as a small, readable starting point for a real deployment (see
// README.md for what to harden before a big launch).
//
//   PORT=8787 DATA=./data.json node server/server.mjs

import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';

const PORT = +(process.env.PORT ?? 8787);
const DATA = process.env.DATA ?? new URL('./data.json', import.meta.url).pathname;
const ORIGIN = process.env.ALLOW_ORIGIN ?? '*';
const KEEP_DAYS = 14;
const CONFIG = process.env.CONFIG ?? new URL('./config.json', import.meta.url).pathname;
const EVENTS_DIR = process.env.EVENTS_DIR ?? new URL('./events/', import.meta.url).pathname;
const KEEP_EVENT_DAYS = 90;

// ------------------------------------------------------------------ limits (light anti-cheat)

export const LIMITS = {
  dailyScore: 400, // a Daily Roll is 12 chefs; nobody stacks more than this in one run
  worldPerPost: 600, // layers one player can add in one post (one long run)
  worldPerDay: 6000, // layers one player can add to the world tower in a day
  countryBest: 1500, // best single-run height that counts for the country cup
  backupBytes: 300_000, // a save code is usually 3-30 KB
  pinTries: 5, // wrong PINs per backup per hour before it locks
  perMinute: 60, // requests per minute per IP
  eventsPerPost: 100, // stats events in one post
};

// ------------------------------------------------------------------ storage

const empty = () => ({ daily: {}, world: {}, country: {}, backups: {} });
let db = empty();
try { db = { ...empty(), ...JSON.parse(fs.readFileSync(DATA, 'utf8')) }; } catch { /* first run */ }
let dirty = false;
const flush = () => {
  if (!dirty) return;
  dirty = false;
  fs.writeFileSync(`${DATA}.tmp`, JSON.stringify(db));
  fs.renameSync(`${DATA}.tmp`, DATA); // never leaves a half-written file
};
const saveTimer = setInterval(flush, 2000);

/** Old days and weeks are dropped; backups are kept for a year after their last use. */
function prune() {
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
  for (const k of ['daily', 'world']) for (const day of Object.keys(db[k])) if (day < cutoff) delete db[k][day];
  const weeks = Object.keys(db.country).sort();
  for (const w of weeks.slice(0, Math.max(0, weeks.length - 4))) delete db.country[w];
  // Stats files: one per day, kept for KEEP_EVENT_DAYS.
  const oldest = new Date(Date.now() - KEEP_EVENT_DAYS * 86_400_000).toISOString().slice(0, 10);
  try {
    for (const f of fs.readdirSync(EVENTS_DIR)) if (/^events-\d{4}-\d{2}-\d{2}\.ndjson$/.test(f) && f.slice(7, 17) < oldest) fs.unlinkSync(EVENTS_DIR + f);
  } catch { /* no stats yet */ }
  const yearAgo = Date.now() - 365 * 86_400_000;
  for (const [id, b] of Object.entries(db.backups)) if (b.used < yearAgo) delete db.backups[id];
  dirty = true;
}
const pruneTimer = setInterval(prune, 3_600_000);

// ------------------------------------------------------------------ validation

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const WEEK = /^\d{4}-W\d{2}$/;
const PLAYER = /^[A-Z2-9]{6}$/; // the game's install id (the part after INV-)
const COUNTRY = /^[A-Z]{2}$/;

function cleanName(s) {
  return String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 16) || 'Chef';
}
const int = (v, max) => (Number.isInteger(v) && v >= 0 && v <= max ? v : null);
/** A day the client may write to: today or yesterday in some time zone (UTC−12 … UTC+14). */
function nearDay(day) {
  const t = Date.parse(`${day}T12:00:00Z`);
  return DAY.test(day) && Math.abs(t - Date.now()) < 40 * 3_600_000;
}

// ------------------------------------------------------------------ rate limiting

const buckets = new Map();
function allowed(ip) {
  const now = Date.now();
  const b = buckets.get(ip) ?? { t: now, n: 0 };
  if (now - b.t > 60_000) { b.t = now; b.n = 0; }
  b.n++;
  buckets.set(ip, b);
  return b.n <= LIMITS.perMinute;
}
/** For tests: forget every IP's request count. */
export const resetRateLimits = () => buckets.clear();
const bucketTimer = setInterval(() => { const old = Date.now() - 120_000; for (const [k, b] of buckets) if (b.t < old) buckets.delete(k); }, 60_000);

// ------------------------------------------------------------------ routes

const routes = {
  'GET /health': () => ({ ok: true }),

  // Remote config for the game (balance values, live events, experiments). Edit CONFIG and it's
  // served on the next request; check it first with tools/experiments/check.mjs.
  'GET /config': () => readConfig(),

  // Anonymous gameplay stats, only sent by players who turned on "Share anonymous stats".
  'POST /events': ({ body }) => {
    if (!Array.isArray(body.events) || body.events.length > LIMITS.eventsPerPost) return [400, { error: 'events?' }];
    const lines = [];
    const at = Date.now();
    for (const e of body.events) {
      const clean = cleanEvent(e);
      if (clean) lines.push(JSON.stringify({ ...clean, at }));
    }
    if (lines.length) {
      fs.mkdirSync(EVENTS_DIR, { recursive: true });
      fs.appendFileSync(`${EVENTS_DIR}events-${new Date(at).toISOString().slice(0, 10)}.ndjson`, lines.join('\n') + '\n');
    }
    return { stored: lines.length };
  },

  // Daily Roll: everyone plays the same seeded run each day.
  'POST /daily': ({ body }) => {
    const { day, player } = body;
    const score = int(body.score, LIMITS.dailyScore);
    if (!nearDay(day) || !PLAYER.test(player ?? '') || score === null) return [400, { error: 'bad score' }];
    const board = (db.daily[day] ??= {});
    const prev = board[player];
    if (!prev || score > prev.s) board[player] = { s: score, n: cleanName(body.name), g: String(body.grid ?? '').slice(0, 80) };
    dirty = true;
    return dailyView(day, player);
  },
  'GET /daily': ({ query }) => (DAY.test(query.day ?? '') ? dailyView(query.day, query.player) : [400, { error: 'day?' }]),

  // Friends: their Daily Roll scores for one day.
  'POST /friends': ({ body }) => {
    if (!DAY.test(body.day ?? '') || !Array.isArray(body.players)) return [400, { error: 'bad request' }];
    const board = db.daily[body.day] ?? {};
    const out = {};
    for (const id of body.players.slice(0, 50)) if (PLAYER.test(id) && board[id]) out[id] = { score: board[id].s, name: board[id].n, grid: board[id].g };
    return { day: body.day, scores: out };
  },

  // Tower of the World: one shared tower a day, every layer counts.
  'POST /world': ({ body }) => {
    const { day, player } = body;
    const layers = int(body.layers, LIMITS.worldPerPost);
    if (!nearDay(day) || !PLAYER.test(player ?? '') || layers === null) return [400, { error: 'bad layers' }];
    const w = (db.world[day] ??= { total: 0, by: {} });
    const room = Math.max(0, LIMITS.worldPerDay - (w.by[player] ?? 0));
    const add = Math.min(layers, room);
    w.by[player] = (w.by[player] ?? 0) + add;
    w.total += add;
    dirty = true;
    return { day, total: w.total, players: Object.keys(w.by).length, counted: add };
  },
  'GET /world': ({ query }) => {
    const w = db.world[query.day ?? ''];
    return DAY.test(query.day ?? '') ? { day: query.day, total: w?.total ?? 0, players: w ? Object.keys(w.by).length : 0 } : [400, { error: 'day?' }];
  },

  // Country cup: the average of each player's best run this week, per country.
  'POST /country': ({ body }) => {
    const { week, player, country } = body;
    const best = int(body.best, LIMITS.countryBest);
    if (!WEEK.test(week ?? '') || !PLAYER.test(player ?? '') || !COUNTRY.test(country ?? '') || best === null) return [400, { error: 'bad entry' }];
    const wk = (db.country[week] ??= {});
    // A player counts for one country a week (the first one they posted).
    const mine = Object.entries(wk).find(([, c]) => c[player] !== undefined);
    const at = mine ? mine[0] : country;
    const c = (wk[at] ??= {});
    c[player] = Math.max(c[player] ?? 0, best);
    dirty = true;
    return countryView(week);
  },
  'GET /country': ({ query }) => (WEEK.test(query.week ?? '') ? countryView(query.week) : [400, { error: 'week?' }]),

  // Cloud backup: the save code is stored under a random ID, protected by a 4-digit PIN.
  'POST /backup': ({ body }) => {
    const code = String(body.code ?? '');
    // SS1 = compressed; SS0 = phones without CompressionStream (iOS before 16.4, old Android WebViews).
    if (!/^SS[01]\./.test(code) || code.length > LIMITS.backupBytes) return [400, { error: 'bad save code' }];
    // Updating an existing backup needs its PIN; otherwise a new ID and PIN are made.
    if (body.id) {
      const b = db.backups[String(body.id).toUpperCase()];
      if (!b) return [404, { error: 'unknown id' }];
      const bad = checkPin(b, body.pin);
      if (bad) return bad;
      b.code = code; b.used = Date.now();
      dirty = true;
      return { id: b.id, updated: true };
    }
    let id;
    do id = Array.from(crypto.randomBytes(8), (x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join(''); while (db.backups[id]);
    const pin = String(crypto.randomInt(0, 10000)).padStart(4, '0');
    db.backups[id] = { id, code, pin: hashPin(id, pin), used: Date.now(), tries: [] };
    dirty = true;
    return { id, pin };
  },
  // Deleting a player's data (privacy laws and store rules require a way to do this).
  'POST /forget': ({ body }) => {
    const { player } = body;
    if (!PLAYER.test(player ?? '')) return [400, { error: 'player?' }];
    let removed = 0;
    for (const day of Object.values(db.daily)) if (day[player]) { delete day[player]; removed++; }
    for (const w of Object.values(db.world)) if (w.by[player] !== undefined) { delete w.by[player]; removed++; } // the shared total keeps the layers
    for (const wk of Object.values(db.country)) for (const c of Object.values(wk)) if (c[player] !== undefined) { delete c[player]; removed++; }
    // Their anonymous stats, by the random tag those carry.
    if (/^[a-z2-9]{12}$/.test(body.pid ?? '')) removed += forgetEvents(body.pid);
    // A cloud backup is deleted with its ID + PIN.
    if (body.backupId) {
      const b = db.backups[String(body.backupId).toUpperCase()];
      if (b) {
        const bad = checkPin(b, body.pin);
        if (bad) return bad;
        delete db.backups[b.id];
        removed++;
      }
    }
    dirty = true;
    return { removed };
  },
  'POST /restore': ({ body }) => {
    const b = db.backups[String(body.id ?? '').toUpperCase()];
    if (!b) return [404, { error: 'unknown id' }];
    const bad = checkPin(b, body.pin);
    if (bad) return bad;
    b.used = Date.now();
    dirty = true;
    return { code: b.code };
  },
};

let configCache = { mtime: 0, data: {} };
function readConfig() {
  try {
    const { mtimeMs } = fs.statSync(CONFIG);
    if (mtimeMs !== configCache.mtime) configCache = { mtime: mtimeMs, data: JSON.parse(fs.readFileSync(CONFIG, 'utf8')) };
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('config.json:', e.message); // a broken file keeps serving the last good one
    else configCache = { mtime: 0, data: {} };
  }
  return configCache.data;
}

const EVENT_NAME = /^[a-z0-9_]{1,40}$/;
const PID = /^[a-z2-9]{12}$/;
/** Keeps only the expected shape: a name, a time and up to 20 short props, one of them the player tag. */
function cleanEvent(e) {
  if (!e || typeof e !== 'object' || !EVENT_NAME.test(e.name ?? '') || typeof e.t !== 'number') return null;
  const props = {};
  for (const [k, v] of Object.entries(e.props ?? {}).slice(0, 20)) {
    if (!/^[a-zA-Z0-9_]{1,24}$/.test(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v)) props[k] = v;
    else if (typeof v === 'boolean') props[k] = v;
    else if (typeof v === 'string') props[k] = v.slice(0, 200);
  }
  if (!PID.test(props.pid ?? '')) return null;
  return { name: e.name, t: e.t, props };
}

function forgetEvents(pid) {
  let removed = 0;
  let files = [];
  try { files = fs.readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.ndjson')); } catch { return 0; }
  for (const f of files) {
    const lines = fs.readFileSync(EVENTS_DIR + f, 'utf8').split('\n').filter(Boolean);
    const keep = lines.filter((l) => { try { return JSON.parse(l).props?.pid !== pid; } catch { return true; } });
    if (keep.length !== lines.length) {
      removed += lines.length - keep.length;
      fs.writeFileSync(EVENTS_DIR + f, keep.length ? keep.join('\n') + '\n' : '');
    }
  }
  return removed;
}

function hashPin(id, pin) {
  return crypto.createHash('sha256').update(`${id}:${pin}`).digest('hex');
}
function checkPin(b, pin) {
  const hour = Date.now() - 3_600_000;
  b.tries = (b.tries ?? []).filter((t) => t > hour);
  if (b.tries.length >= LIMITS.pinTries) return [429, { error: 'too many tries, wait an hour' }];
  if (hashPin(b.id, String(pin ?? '')) !== b.pin) { b.tries.push(Date.now()); dirty = true; return [403, { error: 'wrong pin' }]; }
  return null;
}

function dailyView(day, player) {
  const rows = Object.entries(db.daily[day] ?? {}).map(([id, r]) => ({ id, score: r.s, name: r.n })).sort((a, b) => b.score - a.score);
  const rank = player ? rows.findIndex((r) => r.id === player) + 1 : 0;
  // A histogram for "you beat 72% of players".
  const hist = {};
  for (const r of rows) hist[r.score] = (hist[r.score] ?? 0) + 1;
  return { day, players: rows.length, top: rows.slice(0, 20).map(({ name, score }) => ({ name, score })), rank: rank || null, hist };
}

function countryView(week) {
  const wk = db.country[week] ?? {};
  const rows = Object.entries(wk).map(([id, ps]) => {
    const v = Object.values(ps);
    return { id, players: v.length, score: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 };
  }).sort((a, b) => b.score - a.score);
  return { week, countries: rows };
}

// ------------------------------------------------------------------ http

export const server = http.createServer(async (req, res) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
  const send = (status, obj) => { res.writeHead(status, headers); res.end(JSON.stringify(obj)); };
  if (req.method === 'OPTIONS') return send(204, {});
  // X-Forwarded-For can be typed by anyone: only trust it behind your own proxy (TRUST_PROXY=1).
  const fwd = process.env.TRUST_PROXY === '1' ? req.headers['x-forwarded-for']?.split(',')[0] : undefined;
  const ip = (fwd ?? req.socket.remoteAddress ?? '').trim();
  if (!allowed(ip)) return send(429, { error: 'slow down' });
  const url = new URL(req.url ?? '/', 'http://x');
  const route = routes[`${req.method} ${url.pathname}`];
  if (!route) return send(404, { error: 'not found' });
  let body = {};
  if (req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > LIMITS.backupBytes + 1000) return send(413, { error: 'too big' });
    }
    try { body = JSON.parse(raw || '{}'); } catch { return send(400, { error: 'bad json' }); }
    if (typeof body !== 'object' || body === null) return send(400, { error: 'bad json' });
  }
  try {
    const out = route({ body, query: Object.fromEntries(url.searchParams) });
    if (Array.isArray(out)) send(out[0], out[1]);
    else send(200, out);
  } catch (e) {
    console.error(e);
    send(500, { error: 'server error' });
  }
});

export function stop() {
  clearInterval(saveTimer); clearInterval(pruneTimer); clearInterval(bucketTimer);
  flush();
  server.close();
}

if (process.argv[1] && new URL(import.meta.url).pathname === fs.realpathSync(process.argv[1])) {
  prune();
  server.listen(PORT, () => console.log(`Sushi Stack server on :${PORT}, data in ${DATA}`));
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stop(); process.exit(0); });
}
