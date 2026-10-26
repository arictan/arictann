// Keeping players' progress safe: a save version with step-by-step migrations, a daily backup
// of the whole save (the last two days are kept), recovery of a damaged entry from the backup,
// and a small on-device log of errors for support. Nothing here is sent anywhere.

export const APP_VERSION = '1.1.0';
export const SAVE_VERSION = 2;

const PREFIX = 'sushi-stack.';
const SKIP = new Set([`${PREFIX}analytics`, `${PREFIX}~backup1`, `${PREFIX}~backup2`, `${PREFIX}~errors`]);

function get(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function set(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* full or unavailable */ }
}

function saveKeys(): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(PREFIX) && !SKIP.has(k)) out.push(k);
    }
  } catch { /* storage unavailable */ }
  return out;
}

// ------------------------------------------------------------------ versions and migrations

/** Each step upgrades a save from version n to n + 1. Never edit an old step; add a new one. */
const MIGRATIONS: Record<number, () => void> = {
  // 1 → 2: players from before the guided first day skip it.
  1: () => {
    if (get(`${PREFIX}guide`) === null) set(`${PREFIX}guide`, '99');
  },
};

/** Runs before the game starts. A fresh install starts at the current version. */
export function migrateSave(): { from: number; to: number } {
  const keys = saveKeys();
  const stored = Number(get(`${PREFIX}saveVersion`) ?? (keys.length ? 1 : SAVE_VERSION));
  let v = Number.isFinite(stored) ? stored : 1;
  const from = v;
  while (v < SAVE_VERSION) {
    try { MIGRATIONS[v]?.(); } catch (e) { logError(e, 'migration'); }
    v++;
  }
  set(`${PREFIX}saveVersion`, String(SAVE_VERSION));
  return { from, to: SAVE_VERSION };
}

// ------------------------------------------------------------------ daily backups

export interface Backup { day: string; at: number; data: Record<string, string> }

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function readBackup(n: 1 | 2): Backup | null {
  try {
    const raw = get(`${PREFIX}~backup${n}`);
    return raw ? (JSON.parse(raw) as Backup) : null;
  } catch {
    return null;
  }
}

/** Once a day, keeps a copy of the whole save (and moves yesterday's copy to the second slot). */
export function backupSave(force = false): void {
  const b1 = readBackup(1);
  if (!force && b1?.day === today()) return;
  const data: Record<string, string> = {};
  for (const k of saveKeys()) data[k.slice(PREFIX.length)] = get(k) ?? '';
  if (b1 && b1.day !== today()) set(`${PREFIX}~backup2`, JSON.stringify(b1));
  set(`${PREFIX}~backup1`, JSON.stringify({ day: today(), at: Date.now(), data }));
}

/** Puts a backup back in place of the current save. The game must reload afterwards. */
export function restoreBackup(n: 1 | 2): boolean {
  const b = readBackup(n);
  if (!b) return false;
  for (const k of saveKeys()) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
  for (const [k, v] of Object.entries(b.data)) set(PREFIX + k, v);
  return true;
}

/** A damaged entry (it no longer reads as JSON) comes back from the newest backup that has it. */
export function recoverEntry(key: string): string | null {
  for (const n of [1, 2] as const) {
    const v = readBackup(n)?.data[key];
    if (v === undefined) continue;
    try {
      JSON.parse(v);
      logError(new Error(`Recovered damaged save entry "${key}" from backup ${n}`), 'save');
      return v;
    } catch { /* this copy is damaged too */ }
  }
  return null;
}

export function storageBytes(): number {
  let n = 0;
  for (const k of saveKeys()) n += k.length + (get(k)?.length ?? 0);
  return n * 2; // UTF-16
}

// ------------------------------------------------------------------ error log

export interface ErrorEntry { t: number; where: string; msg: string; stack: string; v: string }

let errorHook: ((e: ErrorEntry) => void) | null = null;

/** Optional: send errors to a crash service (only set this up with the player's consent). */
export function setErrorHook(fn: ((e: ErrorEntry) => void) | null): void {
  errorHook = fn;
}

export function errorLog(): ErrorEntry[] {
  try { return JSON.parse(get(`${PREFIX}~errors`) ?? '[]') as ErrorEntry[]; } catch { return []; }
}

export function clearErrors(): void {
  set(`${PREFIX}~errors`, '[]');
}

export function logError(e: unknown, where: string): void {
  const err = e instanceof Error ? e : new Error(String(e));
  const entry: ErrorEntry = { t: Date.now(), where, msg: err.message.slice(0, 300), stack: (err.stack ?? '').split('\n').slice(0, 6).join('\n').slice(0, 800), v: APP_VERSION };
  const log = errorLog();
  // The same error every frame is logged once.
  if (log.length && log[log.length - 1].msg === entry.msg && entry.t - log[log.length - 1].t < 5000) return;
  log.push(entry);
  set(`${PREFIX}~errors`, JSON.stringify(log.slice(-30)));
  errorHook?.(entry);
}

export function installErrorLog(): void {
  window.addEventListener('error', (ev) => logError(ev.error ?? ev.message, 'window'));
  window.addEventListener('unhandledrejection', (ev) => logError(ev.reason, 'promise'));
}

/** Everything support needs, as text the player can copy and send. */
export function supportReport(extra: Record<string, unknown>): string {
  return JSON.stringify({ app: APP_VERSION, save: SAVE_VERSION, ua: navigator.userAgent, at: new Date().toISOString(), storage: storageBytes(), ...extra, errors: errorLog().slice(-10) }, null, 1);
}
