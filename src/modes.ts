// Extra ways to play: rescue levels, run modifiers, the weekly Omakase Tower.

import { weekKey } from './progress';
import { seeded } from './live';

// ------------------------------------------------------------------ modifiers

export type Mod = 'mirror' | 'blind' | 'tiny' | 'double' | 'twin';

export const MODS: Record<Mod, { icon: string; name: string; desc: string }> = {
  mirror: { icon: '🪞', name: 'Mirror', desc: 'The whole kitchen is flipped left to right' },
  blind: { icon: '🙈', name: 'Blind', desc: 'The sliding layer shows only its outline' },
  tiny: { icon: '🤏', name: 'Tiny', desc: 'Start on a roll 40% narrower' },
  double: { icon: '⏩', name: 'Double speed', desc: 'Everything slides much faster' },
  twin: { icon: '👯', name: 'Twins', desc: 'Two halves slide together: tap when they meet' },
};
export const MOD_LIST = Object.keys(MODS) as Mod[];

// ------------------------------------------------------------------ rescue levels

export type RescueKind = 'flood' | 'quake' | 'storm';

/** rise: how fast the water climbs, in layers per second (it speeds up a little over time). */
export interface Rescue { name: string; kind: RescueKind; target: number; rise: number; time: number; level: number; story: string }

/** Rescue scenes: stack high enough before the water (or the clock) gets you. */
export const RESCUES: Rescue[] = [
  { name: 'Rainy Night', kind: 'flood', target: 14, rise: 0.6, time: 0, level: 3, story: 'The river is rising! Stack grandma’s stall above the water!' },
  { name: 'Tremor', kind: 'quake', target: 16, rise: 0, time: 45, level: 5, story: 'The ground is shaking! 16 layers before the big one hits!' },
  { name: 'High Tide', kind: 'flood', target: 18, rise: 0.68, time: 0, level: 8, story: 'The tide is coming in fast. Up, up, up!' },
  { name: 'Typhoon', kind: 'storm', target: 18, rise: 0.66, time: 0, level: 10, story: 'Wind, rain and rising water. Hold on tight!' },
  { name: 'Aftershock', kind: 'quake', target: 22, rise: 0, time: 50, level: 14, story: 'More tremors! The stack keeps shifting under you!' },
  { name: 'Monsoon', kind: 'flood', target: 24, rise: 0.76, time: 0, level: 18, story: 'The monsoon is here. The street is a river!' },
  { name: 'Super Typhoon', kind: 'storm', target: 24, rise: 0.74, time: 0, level: 22, story: 'The strongest storm in a hundred years!' },
  { name: 'Great Quake', kind: 'quake', target: 28, rise: 0, time: 55, level: 26, story: 'The great quake! Every layer counts!' },
  { name: 'Tsunami Warning', kind: 'flood', target: 30, rise: 0.82, time: 0, level: 30, story: 'A wave is coming. Build the tallest tower of your life!' },
  { name: 'The Perfect Storm', kind: 'storm', target: 32, rise: 0.85, time: 0, level: 35, story: 'Everything at once. Only a master can save the stall!' },
];

export function rescueStars(kind: RescueKind, margin: number): number {
  // margin: layers of water left below the top (flood/storm), or seconds left (quake).
  return kind === 'quake' ? (margin >= 15 ? 3 : margin >= 6 ? 2 : 1) : (margin >= 6 ? 3 : margin >= 3 ? 2 : 1);
}

// ------------------------------------------------------------------ omakase tower

export const TOWER_FLOORS = 50;

export type FloorMod = Mod | 'wind' | 'rain' | '';

/** The modifier on each floor this week: the same for everyone, floors 1-2 always plain. */
export function towerFloors(week = weekKey()): FloorMod[] {
  let h = 7;
  for (const c of week) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = seeded(h);
  const pool: FloorMod[] = ['', '', 'mirror', 'blind', 'double', 'twin', 'wind', 'rain'];
  return Array.from({ length: TOWER_FLOORS }, (_, i) => (i < 2 ? '' : pool[Math.floor(r() * pool.length)]));
}

export const FLOOR_ICON: Record<string, string> = { '': '🍣', mirror: '🪞', blind: '🙈', double: '⏩', twin: '👯', tiny: '🤏', wind: '🌬️', rain: '🌧️' };

export function towerReward(checkpoint: number): number {
  return checkpoint === TOWER_FLOORS ? 2000 : 100 * (checkpoint / 10);
}
