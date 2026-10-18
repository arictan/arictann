// Long-term progress that survives between runs: the chef journey, missions and Chef Rank,
// collections, chests, the daily streak, records and the weekly challenge. Saved on the device only.

import { save } from './platform';

export const MAX_LEVEL = 50;

export type MissionKind = 'perfects' | 'streak' | 'serve' | 'height' | 'dodge' | 'beat' | 'coinsRun' | 'recipe' | 'help' | 'flawless';

export interface Mission { kind: MissionKind; target: number; progress: number; recipe?: string }

// Kinds measured within a single run keep the best value; the rest add up across runs.
const PER_RUN: MissionKind[] = ['streak', 'height', 'coinsRun'];

export function missionText(m: Mission): string {
  switch (m.kind) {
    case 'perfects': return `Land ${m.target} PERFECTs`;
    case 'streak': return `Get a ${m.target}x PERFECT streak`;
    case 'serve': return `Serve ${m.target} orders`;
    case 'height': return `Stack ${m.target} layers in one run`;
    case 'dodge': return `Dodge ${m.target} knife throw${m.target === 1 ? '' : 's'}`;
    case 'beat': return `Beat ${m.target} chef${m.target === 1 ? '' : 's'}`;
    case 'coinsRun': return `Earn ${m.target} coins in one run`;
    case 'recipe': return `Serve ${m.target} ${m.recipe}`;
    case 'help': return `Get help from chefs ${m.target} times`;
    case 'flawless': return `Serve ${m.target} order${m.target === 1 ? '' : 's'} with no slices`;
  }
}

export interface WeeklyState { week: string; best: number; claimed: number[] }

export const WEEKLY_GOALS = [{ height: 20, reward: 50 }, { height: 40, reward: 120 }, { height: 70, reward: 250 }];
export const STREAK_REWARDS = [20, 30, 40, 50, 60, 80, 300]; // day 7 also gives an item the first time
export const PIECES_FOR = { dragon: 10, phoenix: 25 }; // chest pieces needed for each exclusive
export const RECIPE_GOAL = 10;

/** Local date key, e.g. "2026-10-18". */
export function dayKey(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Year and week number, e.g. "2026-W42"; weeks start on Monday. */
export function weekKey(): string {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return `${d.getFullYear()}-W${Math.floor((days + ((start.getDay() + 6) % 7)) / 7) + 1}`;
}

/** Small deterministic hash so everyone gets the same Daily Special on the same day. */
export function daySeed(): number {
  let h = 2166136261;
  for (const ch of dayKey()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Math.abs(h);
}

export class Progress {
  unlocked = save.json('journey.unlocked', 1); // highest level that can be played
  stars: number[] = save.json('journey.stars', []); // best stars per level (index = level - 1)
  rank = save.json('rank', 0);
  missions: Mission[] = save.json('missions', []);
  recipeCounts: Record<string, number> = save.json('recipes', {});
  stamps: string[] = save.json('stamps', []); // completed collections that already paid out
  pieces = save.json('pieces', 0);
  lossStreak = save.json('lossStreak', 0);
  topRuns: number[] = save.json('topRuns', []);
  weekly: WeeklyState = save.json('weekly', { week: '', best: 0, claimed: [] });
  specialDay = save.json('special.day', '');
  lastRun = save.json('lastRun', 0);

  constructor(private recipes: string[]) {
    if (this.missions.length !== 3) this.missions = this.newMissions();
    if (this.weekly.week !== weekKey()) this.weekly = { week: weekKey(), best: 0, claimed: [] };
  }

  persist(): void {
    save.setJson('journey.unlocked', this.unlocked);
    save.setJson('journey.stars', this.stars);
    save.setJson('rank', this.rank);
    save.setJson('missions', this.missions);
    save.setJson('recipes', this.recipeCounts);
    save.setJson('stamps', this.stamps);
    save.setJson('pieces', this.pieces);
    save.setJson('lossStreak', this.lossStreak);
    save.setJson('topRuns', this.topRuns);
    save.setJson('weekly', this.weekly);
    save.setJson('special.day', this.specialDay);
    save.setJson('lastRun', this.lastRun);
  }

  /** Permanent coin bonus from Chef Rank: +5% per rank, up to double. */
  get coinBonus(): number {
    return Math.min(2, 1 + this.rank * 0.05);
  }

  get totalStars(): number {
    return this.stars.reduce((a, b) => a + (b || 0), 0);
  }

  // ------------------------------------------------------------- missions

  private newMissions(): Mission[] {
    const r = this.rank;
    const pool: Mission[] = [
      { kind: 'perfects', target: Math.round(15 * (1 + r * 0.3)), progress: 0 },
      { kind: 'streak', target: Math.min(4 + Math.floor(r / 2), 15), progress: 0 },
      { kind: 'serve', target: 3 + r, progress: 0 },
      { kind: 'height', target: Math.min(15 + r * 5, 120), progress: 0 },
      { kind: 'dodge', target: 1 + Math.floor(r / 2), progress: 0 },
      { kind: 'beat', target: 2 + Math.floor(r / 2), progress: 0 },
      { kind: 'coinsRun', target: Math.min(30 + r * 15, 400), progress: 0 },
      { kind: 'recipe', target: 2 + Math.floor(r / 3), progress: 0, recipe: this.recipes[Math.floor(Math.random() * this.recipes.length)] },
      { kind: 'help', target: 2 + Math.floor(r / 3), progress: 0 },
      { kind: 'flawless', target: 1 + Math.floor(r / 4), progress: 0 },
    ];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }

  /**
   * Records something the player did. Returns the missions it just completed, and whether that
   * finished the whole set (which raises Chef Rank and deals a fresh set of three).
   */
  track(kind: MissionKind, amount = 1, recipe?: string): { done: Mission[]; rankUp: boolean } {
    const done: Mission[] = [];
    for (const m of this.missions) {
      if (m.kind !== kind || m.progress >= m.target) continue;
      if (kind === 'recipe' && m.recipe !== recipe) continue;
      m.progress = PER_RUN.includes(kind) ? Math.max(m.progress, amount) : m.progress + amount;
      if (m.progress >= m.target) {
        m.progress = m.target;
        done.push(m);
      }
    }
    let rankUp = false;
    if (done.length && this.missions.every((m) => m.progress >= m.target)) {
      this.rank++;
      this.missions = this.newMissions();
      rankUp = true;
    }
    if (done.length) this.persist();
    return { done, rankUp };
  }

  // -------------------------------------------------------------- journey

  /** Stars for beating a chef, from how many drops in that order were PERFECT. */
  static starsFor(perfects: number, drops: number): number {
    const r = drops ? perfects / drops : 0;
    return r >= 0.6 ? 3 : r >= 0.3 ? 2 : 1;
  }

  /** Returns true the first time this chef is beaten (a new chef card). */
  beat(level: number, stars: number): boolean {
    const first = !this.stars[level - 1];
    if (level <= MAX_LEVEL) {
      this.stars[level - 1] = Math.max(this.stars[level - 1] || 0, stars);
      this.unlocked = Math.min(MAX_LEVEL, Math.max(this.unlocked, level + 1));
    }
    this.persist();
    return first && level <= MAX_LEVEL;
  }

  // ---------------------------------------------------------------- runs

  /** Ends a run; returns the weekly rewards it newly earned. */
  endRun(height: number): number[] {
    this.lastRun = height;
    // Quick losses in a row make the next start a little gentler.
    this.lossStreak = height < 8 ? this.lossStreak + 1 : 0;
    this.topRuns = [...this.topRuns, height].sort((a, b) => b - a).slice(0, 10);
    if (this.weekly.week !== weekKey()) this.weekly = { week: weekKey(), best: 0, claimed: [] };
    this.weekly.best = Math.max(this.weekly.best, height);
    const earned: number[] = [];
    WEEKLY_GOALS.forEach((g, i) => {
      if (this.weekly.best >= g.height && !this.weekly.claimed.includes(i)) {
        this.weekly.claimed.push(i);
        earned.push(g.reward);
      }
    });
    this.persist();
    return earned;
  }

  /** Counts a served recipe; returns true when it just reached the recipe-book goal. */
  served(recipe: string): boolean {
    this.recipeCounts[recipe] = (this.recipeCounts[recipe] ?? 0) + 1;
    const hit = this.recipeCounts[recipe] === RECIPE_GOAL;
    this.persist();
    return hit;
  }

  /** Pays out a collection once. Returns false if it was already stamped. */
  stamp(id: string): boolean {
    if (this.stamps.includes(id)) return false;
    this.stamps.push(id);
    this.persist();
    return true;
  }
}
