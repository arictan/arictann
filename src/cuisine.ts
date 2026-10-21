// New worlds after level 100: Pizza, Burger, Pancake and Turkish stacks, each with five ingredients,
// recipes and their own chefs, then Turkish, then back to sushi, the cycle repeating every 250 levels.
// Also the Recipe Lab's secret recipes and the food truck branches.

export type WorldId = 'sushi' | 'pizza' | 'burger' | 'pancake' | 'turkish';

export interface World { id: WorldId; name: string; icon: string; intro: string[]; names: string[]; outfits: [string, string][] }

export const WORLDS: Record<WorldId, World> = {
  sushi: { id: 'sushi', name: 'Sushi Stack', icon: '🍣', intro: [], names: [], outfits: [] },
  pizza: {
    id: 'pizza', name: 'Pizza Stack', icon: '🍕',
    intro: ['A letter arrives from Naples: “Your sushi is famous. Can you stack a pizza?”', 'Dough, sauce, cheese, pepperoni, basil. New chefs, new rules. Mamma mia!'],
    names: ['Luigi', 'Giulia', 'Marco', 'Sofia', 'Enzo', 'Bianca', 'Paolo', 'Chiara', 'Dario', 'Lucia', 'Nino', 'Alba'],
    outfits: [['#ffffff', '#c1121f'], ['#2a9d5c', '#ffffff'], ['#1f1f1f', '#e9c46a']],
  },
  burger: {
    id: 'burger', name: 'Burger Stack', icon: '🍔',
    intro: ['The neon diner across the street wants a stack-off.', 'Bun, patty, lettuce, tomato, cheddar. Stack it tall!'],
    names: ['Jake', 'Rosie', 'Hank', 'Dolly', 'Buck', 'Peggy', 'Duke', 'Lou', 'Mabel', 'Ray', 'Dot', 'Earl'],
    outfits: [['#e63946', '#ffffff'], ['#1d3557', '#ffb703'], ['#ffb703', '#5a3a22']],
  },
  pancake: {
    id: 'pancake', name: 'Pancake Stack', icon: '🥞',
    intro: ['The brunch café in Paris has heard of you…', 'Pancakes, butter, syrup, berries, cream. Fluffy, sticky, slippery!'],
    names: ['Amélie', 'Pierre', 'Camille', 'Hugo', 'Margot', 'Louis', 'Inès', 'Jules', 'Élise', 'Théo', 'Chloé', 'Gaston'],
    outfits: [['#fdf6ec', '#5e60ce'], ['#ffd6e5', '#8b4513'], ['#ffffff', '#3d6fb6']],
  },
  turkish: {
    id: 'turkish', name: 'Kebab & Baklava Stack', icon: '🥙',
    intro: ['A postcard from Istanbul: “The döner masters of the Bosphorus challenge you!”', 'Lavash, döner, onion, thin yufka and pistachio. Stack it like an usta. Afiyet olsun!'],
    names: ['Mehmet', 'Ayşe', 'Emre', 'Zeynep', 'Mustafa', 'Elif', 'Kerem', 'Defne', 'Hakan', 'Selin', 'Burak', 'Nur'],
    outfits: [['#ffffff', '#c1121f'], ['#c1121f', '#ffffff'], ['#1d3557', '#e9c46a']],
  },
};

export const WORLD_START = 101; // the first non-sushi level
export const WORLD_LEN = 50;

/** Levels 1-100 are sushi; then 50 levels each of pizza, burger, pancake, Turkish, sushi, repeating. */
export function worldFor(level: number): WorldId {
  if (level < WORLD_START) return 'sushi';
  return (['pizza', 'burger', 'pancake', 'turkish', 'sushi'] as WorldId[])[Math.floor((level - WORLD_START) / WORLD_LEN) % 5];
}

export function worldStarts(level: number): boolean {
  return level >= WORLD_START && (level - WORLD_START) % WORLD_LEN === 0;
}

// ------------------------------------------------------------------ recipe lab

export interface Secret { name: string; emoji: string; combo: string[] }

/** Secret recipes: the right three ingredients in the Lab discover them. */
export const SECRETS: Secret[] = [
  { name: 'Dragon Fire Roll', emoji: '🔥', combo: ['avocado', 'ikura', 'unagi'] },
  { name: 'Sunrise Maki', emoji: '🌅', combo: ['cucumber', 'egg', 'salmon'] },
  { name: 'Ocean Treasure', emoji: '💎', combo: ['ikura', 'nori', 'tuna'] },
  { name: 'Green Garden', emoji: '🌿', combo: ['avocado', 'cucumber', 'tofu'] },
  { name: 'Golden Tempura', emoji: '✨', combo: ['ebi', 'egg', 'rice'] },
  { name: 'Midnight Roll', emoji: '🌙', combo: ['nori', 'tuna', 'unagi'] },
  { name: 'Pink Cloud', emoji: '☁️', combo: ['rice', 'salmon', 'tofu'] },
  { name: 'Emperor’s Choice', emoji: '👑', combo: ['ebi', 'salmon', 'unagi'] },
];
export const LAB_KNOWN = 20; // layers of an ingredient placed before it can go in the Lab
export const LAB_TRIES = 10; // free mixes per day

/** Mastermind-style hint: the most ingredients any undiscovered secret shares with the mix. */
export function labHint(mix: string[], found: string[]): number {
  let best = 0;
  for (const s of SECRETS) if (!found.includes(s.name)) best = Math.max(best, s.combo.filter((c) => mix.includes(c)).length);
  return best;
}

export function labMatch(mix: string[]): Secret | undefined {
  const key = [...mix].sort().join(',');
  return SECRETS.find((s) => [...s.combo].sort().join(',') === key);
}

// ------------------------------------------------------------------ food truck branches

export const BRANCH_EMOJI: Record<string, string> = {
  tokyo: '🗼', osaka: '🏯', seoul: '🌃', bangkok: '🛕', hongkong: '🌆', singapore: '🦁', taipei: '🏙️', hanoi: '🛵',
  manila: '🌴', jakarta: '🌋', mumbai: '🕌', dubai: '🏜️', istanbul: '🕌', paris: '🗼', london: '🎡', nyc: '🗽',
  la: '🌴', mexico: '🌮', rio: '🏖️', sydney: '🦘', honolulu: '🌺',
};
export const BRANCH_MAX = 5;

export function branchRate(lv: number): number {
  return 6 + lv * 6; // coins per hour
}

export function branchCost(lv: number): number {
  return 300 * lv; // to go from lv to lv + 1
}
