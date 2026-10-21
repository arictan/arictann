// The Tower of the World and the country leaderboard. Both need a server to be truly shared.
// For now they run on the device with simulated players, always labelled as simulated, and your
// own layers really do count. To go online, replace worldSimToday() and countryBoard() with
// calls to your backend (send the player's layers / best height, read back the totals).

import { seeded } from './live';
import { weekKey } from './progress';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ================================================================ the Tower of the World

export interface WorldMilestone { layers: number; name: string; emoji: string; reward: number }

/** Community milestones for one day's shared tower. */
export const WORLD_MILESTONES: WorldMilestone[] = [
  { layers: 100_000, name: 'Above the clouds', emoji: '☁️', reward: 50 },
  { layers: 400_000, name: 'Higher than the jets', emoji: '✈️', reward: 75 },
  { layers: 1_000_000, name: 'Edge of space', emoji: '🚀', reward: 100 },
  { layers: 2_500_000, name: 'Past the space station', emoji: '🛰️', reward: 150 },
  { layers: 5_000_000, name: 'Halfway to the Moon (in sushi metres)', emoji: '🌙', reward: 250 },
];

/** Simulated layers stacked worldwide today by `at` (the day's total grows with local time). */
export function worldSimToday(day: string, at = new Date()): number {
  const r = seeded(hash(`world|${day}`));
  const final = Math.round(3_200_000 + r() * 2_600_000);
  const t = (at.getHours() * 60 + at.getMinutes()) / 1440;
  // People play more in the evening.
  const curve = t < 0.3 ? t * 0.4 : 0.12 + (t - 0.3) * 1.25;
  return Math.round(final * Math.min(1, curve));
}

// ================================================================ countries

export interface Country { id: string; name: string; flag: string }

export const COUNTRIES: Country[] = [
  { id: 'TR', name: 'Türkiye', flag: '🇹🇷' }, { id: 'JP', name: 'Japan', flag: '🇯🇵' }, { id: 'US', name: 'United States', flag: '🇺🇸' },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧' }, { id: 'DE', name: 'Germany', flag: '🇩🇪' }, { id: 'FR', name: 'France', flag: '🇫🇷' },
  { id: 'IT', name: 'Italy', flag: '🇮🇹' }, { id: 'ES', name: 'Spain', flag: '🇪🇸' }, { id: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { id: 'MX', name: 'Mexico', flag: '🇲🇽' }, { id: 'KR', name: 'South Korea', flag: '🇰🇷' }, { id: 'IN', name: 'India', flag: '🇮🇳' },
  { id: 'ID', name: 'Indonesia', flag: '🇮🇩' }, { id: 'PH', name: 'Philippines', flag: '🇵🇭' }, { id: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { id: 'VN', name: 'Vietnam', flag: '🇻🇳' }, { id: 'CA', name: 'Canada', flag: '🇨🇦' }, { id: 'AU', name: 'Australia', flag: '🇦🇺' },
  { id: 'NL', name: 'Netherlands', flag: '🇳🇱' }, { id: 'PL', name: 'Poland', flag: '🇵🇱' }, { id: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { id: 'AE', name: 'UAE', flag: '🇦🇪' }, { id: 'EG', name: 'Egypt', flag: '🇪🇬' }, { id: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { id: 'SE', name: 'Sweden', flag: '🇸🇪' }, { id: 'NG', name: 'Nigeria', flag: '🇳🇬' }, { id: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { id: 'TW', name: 'Taiwan', flag: '🇹🇼' }, { id: 'SG', name: 'Singapore', flag: '🇸🇬' }, { id: 'UA', name: 'Ukraine', flag: '🇺🇦' },
];

/** A best guess from the device's language region, e.g. "tr-TR" → Türkiye. */
export function guessCountry(): string {
  const region = (navigator.language || '').split('-')[1]?.toUpperCase();
  return COUNTRIES.find((c) => c.id === region)?.id ?? (navigator.language?.startsWith('tr') ? 'TR' : 'US');
}

export function countryById(id: string): Country {
  return COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];
}

/**
 * This week's board: each country's average best height (simulated), with your best run
 * mixed into your own country's average. The week builds up as the days go by.
 */
export function countryBoard(mine: { id: string; best: number }, at = new Date()): { c: Country; score: number; you: boolean }[] {
  const wk = weekKey();
  const day = (at.getDay() + 6) % 7;
  const progress = 0.45 + (day / 6) * 0.55;
  return COUNTRIES.map((c) => {
    const r = seeded(hash(`country|${wk}|${c.id}`));
    let score = Math.round((38 + r() * 34) * progress * 10) / 10;
    if (c.id === mine.id && mine.best > 0) score = Math.round(((score * 49 + mine.best) / 50) * 10) / 10;
    return { c, score, you: c.id === mine.id };
  }).sort((a, b) => b.score - a.score);
}
