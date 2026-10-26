// The game's side of the online server (server/server.mjs). Every call needs cfg.serverUrl
// (set it in remote config or config.ts) and fails quietly: with no server, or offline, each
// function returns null and the game keeps using its simulated, clearly labelled players.
// Results are cached so screens can draw them every frame without waiting.

import { cfg } from './config';
import { save } from './platform';

export const isOnline = (): boolean => !!cfg.serverUrl;

async function api<T>(path: string, body?: unknown): Promise<T | null> {
  if (!cfg.serverUrl) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 5000);
  try {
    const res = await fetch(cfg.serverUrl.replace(/\/$/, '') + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
    const json = (await res.json()) as T & { error?: string };
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
    return json;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export let lastError = '';

// ------------------------------------------------------------------ cache

const cache = new Map<string, { at: number; v: unknown }>();
const inflight = new Set<string>();

/** Returns the cached value right away, and refreshes it in the background when older than maxAge. */
function cached<T>(key: string, maxAge: number, load: () => Promise<T | null>): T | null {
  const c = cache.get(key);
  if ((!c || Date.now() - c.at > maxAge) && !inflight.has(key) && isOnline()) {
    inflight.add(key);
    void load().then((v) => { if (v !== null) cache.set(key, { at: Date.now(), v }); }).finally(() => inflight.delete(key));
  }
  return (c?.v as T) ?? null;
}

// ------------------------------------------------------------------ Daily Roll

export interface DailyBoard { day: string; players: number; top: { name: string; score: number }[]; rank: number | null; hist: Record<string, number> }

export async function postDaily(day: string, player: string, name: string, score: number, grid: string): Promise<DailyBoard | null> {
  const r = await api<DailyBoard>('/daily', { day, player, name, score, grid });
  if (r) cache.set(`daily|${day}`, { at: Date.now(), v: r });
  return r;
}

export function dailyBoard(day: string, player: string): DailyBoard | null {
  return cached(`daily|${day}`, 60_000, () => api<DailyBoard>(`/daily?day=${day}&player=${player}`));
}

/** Share of players you beat, from the board's score histogram. */
export function beatShare(b: DailyBoard, score: number): number {
  let below = 0, total = 0;
  for (const [s, n] of Object.entries(b.hist)) {
    total += n;
    if (+s < score) below += n;
  }
  return total ? Math.round((below / total) * 100) : 0;
}

// ------------------------------------------------------------------ friends

/** Friends are players whose invite code (INV-XXXXXX) you entered, saved on the device. */
export interface Friend { id: string; name: string; added: number }

let friends: Friend[] = save.json('friends', []);

export function friendList(): Friend[] {
  return friends;
}

export function addFriend(id: string, name = ''): boolean {
  id = id.toUpperCase().replace(/^INV-/, '');
  if (!/^[A-Z2-9]{6}$/.test(id) || friends.some((f) => f.id === id)) return false;
  friends = [...friends, { id, name: name || `Friend ${friends.length + 1}`, added: Date.now() }].slice(-50);
  save.setJson('friends', friends);
  return true;
}

export function removeFriend(id: string): void {
  friends = friends.filter((f) => f.id !== id);
  save.setJson('friends', friends);
}

export type FriendScores = Record<string, { score: number; name: string; grid: string }>;

export function friendScores(day: string): FriendScores | null {
  if (!friends.length) return {};
  const r = cached(`friends|${day}|${friends.length}`, 60_000, () => api<{ scores: FriendScores }>('/friends', { day, players: friends.map((f) => f.id) }));
  if (r) {
    // Friends' chosen names come with their scores.
    let changed = false;
    for (const f of friends) {
      const s = r.scores[f.id];
      if (s && s.name && s.name !== f.name && f.name.startsWith('Friend ')) { f.name = s.name; changed = true; }
    }
    if (changed) save.setJson('friends', friends);
  }
  return r?.scores ?? null;
}

// ------------------------------------------------------------------ Tower of the World

export interface WorldTotal { day: string; total: number; players: number }

/** Layers waiting to be sent (kept if offline, sent with the next run). */
let pendingLayers: { day: string; n: number } = save.json('worldPending', { day: '', n: 0 });

export function postWorld(day: string, player: string, layers: number): void {
  if (!isOnline()) return;
  if (pendingLayers.day !== day) pendingLayers = { day, n: 0 };
  pendingLayers.n += layers;
  save.setJson('worldPending', pendingLayers);
  const n = Math.min(600, pendingLayers.n);
  void api<WorldTotal & { counted: number }>('/world', { day, player, layers: n }).then((r) => {
    if (!r) return;
    pendingLayers.n = Math.max(0, pendingLayers.n - n);
    save.setJson('worldPending', pendingLayers);
    cache.set(`world|${day}`, { at: Date.now(), v: r });
  });
}

export function worldTotal(day: string): WorldTotal | null {
  return cached(`world|${day}`, 60_000, () => api<WorldTotal>(`/world?day=${day}`));
}

// ------------------------------------------------------------------ country cup

export interface CountryRow { id: string; players: number; score: number }

export function postCountry(week: string, player: string, country: string, best: number): void {
  void api<{ countries: CountryRow[] }>('/country', { week, player, country, best }).then((r) => {
    if (r) cache.set(`country|${week}`, { at: Date.now(), v: r.countries });
  });
}

export function countryRows(week: string): CountryRow[] | null {
  return cached(`country|${week}`, 120_000, async () => (await api<{ countries: CountryRow[] }>(`/country?week=${week}`))?.countries ?? null);
}

// ------------------------------------------------------------------ cloud backup

export interface CloudBackup { id: string; pin: string; at: number }

export function cloudBackupInfo(): CloudBackup | null {
  return save.json<CloudBackup | null>('cloudBackup', null);
}

/** Uploads the save code. The first time makes a new ID + PIN; later times update the same backup. */
export async function cloudBackup(code: string): Promise<CloudBackup | null> {
  const prev = cloudBackupInfo();
  const r = await api<{ id: string; pin?: string; updated?: boolean }>('/backup', prev ? { id: prev.id, pin: prev.pin, code } : { code });
  if (!r) {
    // The backup was removed on the server: start a new one.
    if (prev && /unknown id/.test(lastError)) {
      save.setJson('cloudBackup', null);
      return cloudBackup(code);
    }
    return null;
  }
  const info = { id: r.id, pin: r.pin ?? prev!.pin, at: Date.now() };
  save.setJson('cloudBackup', info);
  return info;
}

export async function cloudRestore(id: string, pin: string): Promise<string | null> {
  return (await api<{ code: string }>('/restore', { id: id.trim().toUpperCase(), pin: pin.trim() }))?.code ?? null;
}

/** Deletes this player's scores (and the cloud backup) from the server. */
export async function forgetMe(player: string): Promise<boolean> {
  const cb = cloudBackupInfo();
  const r = await api<{ removed: number }>('/forget', { player, backupId: cb?.id, pin: cb?.pin });
  if (r) save.setJson('cloudBackup', null);
  return !!r;
}
