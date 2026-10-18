// Long-term progress that survives between runs: the chef journey, missions and Chef Rank,
// collections, chests, the daily streak, records and the weekly challenge. Saved on the device only.

import { save } from './platform';
import { DEFAULT_AVATAR, type Avatar, type StatId } from './meta';
import { DEFAULT_REST, type RestState } from './restaurant';

export const STORY_LEVELS = 50; // hand-made chefs; levels keep going forever after this

/** Stars needed to enter a level: a gate every 10 levels from 11 on, at 2 stars per level before it. */
export function starsNeeded(level: number): number {
  return level > 1 && (level - 1) % 10 === 0 ? (level - 1) * 2 : 0;
}

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
  unlocked = save.json('journey.unlocked', 1); // highest level reached (it may still sit behind a star gate)
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

  // ---- added with the live-ops update
  starPool: number = save.json('starPool', -1); // stars to spend on the restaurant (earning stars adds here too)
  restaurant = save.json('restaurant', { r: 0, levels: [0, 0, 0, 0, 0, 0, 0, 0], michelin: 0 });
  shards: Record<string, number> = save.json('shards', {});
  companions: string[] = save.json('companions.equipped', []);
  album = save.json('album', { season: 0, have: [] as number[][], setsDone: [] as number[], done: false });
  pass = save.json('pass', { season: 0, xp: 0, free: [] as number[], prem: [] as number[], premium: false });
  tour = save.json('tour', { key: '', tokens: 0, claimed: [] as number[] });
  holiday = save.json('holidayEvent', { key: '', tokens: 0, claimed: false });
  race = save.json('race', { day: '', joined: false, best: 0, finished: false, reward: 0, claimed: false });
  cup = save.json('cup', { key: '', best: 0, claimed: false });
  crew = save.json('crew', { key: '', mine: 0, claimed: [] as number[] });
  winStreak = save.json('winStreak', 0);
  freezes = save.json('freezes', 1);
  freezeWeek = save.json('freezeWeek', '');
  zenBest = save.json('zenBest', 0);
  timeBest = save.json('timeBest', 0);
  puzzleStars: number[] = save.json('puzzleStars', []);
  vipUntil = save.json('vipUntil', 0);
  starterBought = save.json('starterBought', false);
  piggy = save.json('piggy', 0);
  ads = save.json('ads', { day: '', chests: 0, vipChest: false });
  streakMilestone = save.json('streakMilestone', 0); // highest daily-streak milestone celebrated

  // ---- added with the depth update
  tutorial = save.json('tutorial', 0); // first-run coaching step (4 = done)
  seen: string[] = save.json('seen', []); // ingredients and features already introduced
  lastBoosters: string[] = save.json('lastBoosters', []); // booster picker remembers the last choice
  bestShape: [number, number][] = save.json('bestShape', []); // [x, width] of every layer in the best run (the ghost)

  // ---- personality update
  avatar: Avatar = { ...DEFAULT_AVATAR, ...save.json('avatar', {}) };
  hearts: Record<string, number> = save.json('hearts', {}); // regular customer id -> hearts
  stats: Partial<Record<StatId, number>> = save.json('stats', {}); // lifetime counters for achievements
  achSeen: Partial<Record<StatId, number>> = save.json('achSeen', {}); // tiers reached (announced)
  achClaimed: Partial<Record<StatId, number>> = save.json('achClaimed', {}); // tiers paid out
  gallery = save.json('gallery', { pic: 0, tiles: [] as number[], perfects: 0, done: [] as number[] });
  lastDay = save.json('lastDay', '');
  duels: { code: string; level: number; theirs: number; mine: number; at: number }[] = save.json('duels', []);
  installId: string = save.json('installId', '');
  rest: RestState = { ...DEFAULT_REST, ...save.json('rest', {}) };
  mastery: Record<string, number> = save.json('mastery', {}); // layers placed per ingredient
  gauntletBest = save.json('gauntletBest', 0);

  constructor(private recipes: string[]) {
    if (this.missions.length !== 3) this.missions = this.newMissions();
    if (this.weekly.week !== weekKey()) this.weekly = { week: weekKey(), best: 0, claimed: [] };
    if (this.starPool < 0) this.starPool = this.totalStars; // first load after the update: stars already earned can be spent
    // One free streak freeze every week, holding at most two.
    if (this.freezeWeek !== weekKey()) {
      this.freezeWeek = weekKey();
      this.freezes = Math.min(2, this.freezes + 1);
    }
    if (this.ads.day !== dayKey()) this.ads = { day: dayKey(), chests: 0, vipChest: false };
    this.persist();
  }

  get vip(): boolean {
    return Date.now() < this.vipUntil;
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
    save.setJson('starPool', this.starPool);
    save.setJson('restaurant', this.restaurant);
    save.setJson('shards', this.shards);
    save.setJson('companions.equipped', this.companions);
    save.setJson('album', this.album);
    save.setJson('pass', this.pass);
    save.setJson('tour', this.tour);
    save.setJson('holidayEvent', this.holiday);
    save.setJson('race', this.race);
    save.setJson('cup', this.cup);
    save.setJson('crew', this.crew);
    save.setJson('winStreak', this.winStreak);
    save.setJson('freezes', this.freezes);
    save.setJson('freezeWeek', this.freezeWeek);
    save.setJson('zenBest', this.zenBest);
    save.setJson('timeBest', this.timeBest);
    save.setJson('puzzleStars', this.puzzleStars);
    save.setJson('vipUntil', this.vipUntil);
    save.setJson('starterBought', this.starterBought);
    save.setJson('piggy', this.piggy);
    save.setJson('ads', this.ads);
    save.setJson('streakMilestone', this.streakMilestone);
    save.setJson('tutorial', this.tutorial);
    save.setJson('seen', this.seen);
    save.setJson('lastBoosters', this.lastBoosters);
    save.setJson('bestShape', this.bestShape);
    save.setJson('avatar', this.avatar);
    save.setJson('hearts', this.hearts);
    save.setJson('stats', this.stats);
    save.setJson('achSeen', this.achSeen);
    save.setJson('achClaimed', this.achClaimed);
    save.setJson('gallery', this.gallery);
    save.setJson('lastDay', this.lastDay);
    save.setJson('duels', this.duels);
    save.setJson('installId', this.installId);
    save.setJson('rest', this.rest);
    save.setJson('mastery', this.mastery);
    save.setJson('gauntletBest', this.gauntletBest);
  }

  /** Adds to a lifetime counter, or keeps the best value for per-run records. */
  stat(id: StatId, amount = 1, best = false): void {
    const v = this.stats[id] ?? 0;
    this.stats[id] = best ? Math.max(v, amount) : v + amount;
  }

  /** This player's invite code, made once per install. */
  get inviteCode(): string {
    if (!this.installId) {
      this.installId = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      this.persist();
    }
    return `INV-${this.installId}`;
  }

  /** Counts one more day played (for the Loyal Chef achievement). */
  visit(): void {
    if (this.lastDay === dayKey()) return;
    this.lastDay = dayKey();
    this.stat('days');
    this.persist();
  }

  /** Permanent coin bonus from Chef Rank: +5% per rank, up to double. */
  get coinBonus(): number {
    return Math.min(2, 1 + this.rank * 0.05);
  }

  get totalStars(): number {
    return this.stars.reduce((a, b) => a + (b || 0), 0);
  }

  get chefsBeaten(): number {
    return this.stars.filter((x) => x > 0).length;
  }

  /** A level can be played once reached and its star gate (if any) is met. */
  canEnter(level: number): boolean {
    return level <= this.unlocked && this.totalStars >= starsNeeded(level);
  }

  /** The level TAP TO PLAY starts: the furthest one reached, or the last one before a closed gate. */
  get playLevel(): number {
    let l = this.unlocked;
    while (l > 1 && !this.canEnter(l)) l--;
    return l;
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
    const before = this.stars[level - 1] || 0;
    if (stars > before) this.starPool += stars - before; // only improvements add spendable stars
    this.stars[level - 1] = Math.max(before, stars);
    this.unlocked = Math.max(this.unlocked, level + 1);
    this.persist();
    return first;
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
