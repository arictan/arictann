// Offline competition: weekly Sushi Leagues, the Streak Quest and the Nemesis chef.
// Every other player here is a computer rival generated from the date, always labelled "(AI)",
// so the same week plays out the same way. Swap in real players once there's a backend.

import { seeded } from './live';
import { weekKey } from './progress';

const DAY = 86_400_000;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const NAMES = ['Kai', 'Mio', 'Ren', 'Hana', 'Bo', 'Lin', 'Jun', 'Sora', 'Yui', 'Minh', 'Ploy', 'Aki', 'Rei', 'Seo', 'Tao', 'Emi', 'Haru', 'Nao', 'Kiko', 'Tavi', 'Luca', 'Ines', 'Omar', 'Zoe', 'Ravi', 'Ana', 'Kofi', 'Mei', 'Yusuf', 'Lea', 'Diego', 'Noor'];

// ------------------------------------------------------------------ leagues

export const LEAGUES = [
  { name: 'Bronze', icon: '🥉', color: '#cd7f32' },
  { name: 'Silver', icon: '🥈', color: '#c0c0c0' },
  { name: 'Gold', icon: '🥇', color: '#ffd34d' },
  { name: 'Sapphire', icon: '💠', color: '#4cc9f0' },
  { name: 'Ruby', icon: '♦️', color: '#e63946' },
  { name: 'Diamond', icon: '💎', color: '#9fe3ff' },
  { name: 'Master', icon: '👑', color: '#e0aaff' },
];
export const LEAGUE_SIZE = 30;
export const PROMOTE = 7; // top 7 move up
export const DEMOTE = 5; // bottom 5 move down

export interface LeagueState { week: string; tier: number; pts: number; result: { rank: number; tier: number; moved: number; coins: number } | null }

/** Start (Monday 00:00) and end of the league week containing `at`. */
export function leagueWeek(at = new Date()): { start: Date; end: Date } {
  const d = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  const start = new Date(d.getTime() - ((d.getDay() + 6) % 7) * DAY);
  return { start, end: new Date(start.getTime() + 7 * DAY) };
}

/** The 29 rivals in your group this week, with scores that grow as the week goes on. */
export function leagueRivals(week: string, tier: number, seedKey: string, at = new Date()): { name: string; pts: number }[] {
  const r = seeded(hash(`${week}|${tier}|${seedKey}`));
  const { start, end } = leagueWeek(at);
  const t = Math.max(0, Math.min(1, (at.getTime() - start.getTime()) / (end.getTime() - start.getTime())));
  const scale = 1 + tier * 0.45; // higher leagues are busier
  const out: { name: string; pts: number }[] = [];
  for (let i = 0; i < LEAGUE_SIZE - 1; i++) {
    const final = Math.round((40 + Math.pow(r(), 1.7) * 900) * scale);
    const pace = 0.25 + r() * 0.75;
    out.push({ name: `${NAMES[(i * 7 + tier * 3) % NAMES.length]} (AI)`, pts: Math.round(final * Math.min(1, Math.pow(t / pace, 0.85))) });
  }
  return out;
}

export function leagueReward(rank: number): number {
  return rank === 1 ? 500 : rank === 2 ? 350 : rank === 3 ? 250 : rank <= 10 ? 100 : 0;
}

/** Settles last week if the week changed: promotion, demotion and the reward. */
export function settleLeague(s: LeagueState, seedKey: string): LeagueState {
  const now = weekKey();
  if (s.week === now) return s;
  if (!s.week) return { week: now, tier: s.tier, pts: 0, result: null };
  // Final standings of the finished week: rivals at their final scores.
  const { start } = leagueWeek();
  const lastWeekEnd = new Date(start.getTime() - 1000);
  const table = [...leagueRivals(s.week, s.tier, seedKey, lastWeekEnd).map((x) => x.pts), s.pts].sort((a, b) => b - a);
  const rank = table.indexOf(s.pts) + 1;
  const moved = rank <= PROMOTE && s.tier < LEAGUES.length - 1 ? 1 : rank > LEAGUE_SIZE - DEMOTE && s.tier > 0 ? -1 : 0;
  return { week: now, tier: s.tier + moved, pts: 0, result: { rank, tier: s.tier, moved, coins: s.pts > 0 ? leagueReward(rank) : 0 } };
}

// ------------------------------------------------------------------ streak quest

export const QUEST_STAGES = 7;
export const QUEST_POT = 10_000;
export const QUEST_DAYS = 3;

export interface QuestState { key: string; joined: boolean; stage: number; out: boolean; claimed: boolean }

export function currentQuest(at = new Date()): { key: string; end: Date } {
  const epoch = new Date(2026, 0, 1).getTime();
  const n = Math.floor((at.getTime() - epoch) / (QUEST_DAYS * DAY));
  return { key: `q${n}`, end: new Date(epoch + (n + 1) * QUEST_DAYS * DAY) };
}

/** How many of the 100 starters (including you) are still in after each stage. */
export function questSurvivors(key: string): number[] {
  const r = seeded(hash(key));
  const out = [100];
  for (let s = 1; s <= QUEST_STAGES; s++) out.push(Math.max(2, Math.round(out[s - 1] * (0.62 + r() * 0.22))));
  return out;
}

// ------------------------------------------------------------------ nemesis

export const NEMESIS_AT = 3; // losses to the same chef before they become your nemesis

export const NEMESIS_TAUNTS = ['Back for more, rookie?', 'I knew you’d come crawling back.', 'Your rolls still wobble.', 'I’ve been practising. Have you?', 'This time, I won’t go easy.', 'Still afraid of me?'];
