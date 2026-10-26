// Boss chefs: one per level (one level = one order), 50 in all. Each watches the sliding layer, points at it,
// and gets more worked up the closer the player is to finishing the order.

import { WORLDS, worldFor } from './cuisine';

export type Hair = 'short' | 'bun' | 'bob' | 'bald' | 'spiky' | 'ponytail' | 'twinbuns' | 'gray' | 'curly' | 'long' | 'mohawk';
export type Hat = 'hachimaki' | 'cap' | 'toque' | 'bandana' | 'none' | 'shades' | 'gold' | 'beanie' | 'visor' | 'flower' | 'crown';
export type Face = 'none' | 'mustache' | 'beard' | 'glasses' | 'elder' | 'goatee' | 'freckles';
export type Attack = 'knife' | 'slam' | 'splat' | 'flurry' | 'steal' | 'flip' | 'frost';
export type Help = 'slow' | 'patch' | 'tip';
export type Holding = 'knife' | 'fist' | 'patty' | null;

export interface Chef {
  name: string;
  rule: string; // shown when the level starts
  speed: number; // multiplier on layer speed
  wobble: boolean; // layer speed surges and eases
  tight: boolean; // smaller perfect window
  extra: number; // extra layers in the order
  kind: number; // how often they help (0-1)
  mean: number; // chance per drop that they attack
  attacks: Attack[];
  skin: string;
  hairColor: string;
  outfit: string;
  accent: string;
  hair: Hair;
  hat: Hat;
  face: Face;
  intro: string;
  beaten: string;
  gloat: string;
}

export const CHEFS: Chef[] = [
  { name: 'Chef Kenji', rule: 'Warm-up round', speed: 1, wobble: false, tight: false, extra: 0, kind: 0.5, mean: 0.05, attacks: ['slam'], skin: '#f1c9a5', hairColor: '#1d1a1a', outfit: '#f4f1ea', accent: '#d7263d', hair: 'short', hat: 'hachimaki', face: 'none', intro: 'Show me your rolls!', beaten: 'Not bad, rookie!', gloat: 'Back to rice school!' },
  { name: 'Chef Hana', rule: 'Quick hands: faster layers', speed: 1.1, wobble: false, tight: false, extra: 0, kind: 0.6, mean: 0.12, attacks: ['knife'], skin: '#f5d0b0', hairColor: '#2b1b17', outfit: '#f7b2c8', accent: '#c2185b', hair: 'bun', hat: 'none', face: 'none', intro: 'Keep up with me!', beaten: 'So fast! Well done!', gloat: 'Too slow, too slow!' },
  { name: 'Chef Taro', rule: 'Precise: smaller PERFECT zone', speed: 1, wobble: false, tight: true, extra: 0, kind: 0.3, mean: 0.15, attacks: ['slam', 'splat'], skin: '#e8b98f', hairColor: '#222', outfit: '#ffffff', accent: '#3d6fb6', hair: 'short', hat: 'cap', face: 'glasses', intro: 'Every millimetre counts.', beaten: 'Precise. I approve.', gloat: 'Sloppy cutting!' },
  { name: 'Chef Mei', rule: 'Big order: 2 extra layers', speed: 1.05, wobble: false, tight: false, extra: 2, kind: 0.6, mean: 0.1, attacks: ['splat'], skin: '#efc29a', hairColor: '#3a2418', outfit: '#9ad1d4', accent: '#1d6fa3', hair: 'bob', hat: 'bandana', face: 'none', intro: 'Table of twelve tonight!', beaten: 'The table is happy!', gloat: 'The customers are waiting!' },
  { name: 'Chef Goro', rule: 'Heavy hitter: much faster', speed: 1.2, wobble: false, tight: false, extra: 0, kind: 0.2, mean: 0.25, attacks: ['slam', 'knife'], skin: '#d9a77c', hairColor: '#1a1a1a', outfit: '#2d2d2d', accent: '#f2b705', hair: 'bald', hat: 'hachimaki', face: 'beard', intro: 'HAAA! Stack it!', beaten: 'You have strong hands!', gloat: 'HA! Weak!' },
  { name: 'Chef Yuki', rule: 'Tricky: speed surges', speed: 1.1, wobble: true, tight: false, extra: 0, kind: 0.4, mean: 0.2, attacks: ['knife', 'splat'], skin: '#f5d6bd', hairColor: '#111', outfit: '#e9eef6', accent: '#6c8ebf', hair: 'ponytail', hat: 'toque', face: 'none', intro: 'Can you read my rhythm?', beaten: 'You found the rhythm!', gloat: 'Lost the beat, huh?' },
  { name: 'Chef Ryu', rule: 'Neon speed: very fast', speed: 1.3, wobble: false, tight: false, extra: 0, kind: 0.25, mean: 0.25, attacks: ['knife', 'splat'], skin: '#ecc19b', hairColor: '#231c3a', outfit: '#26104a', accent: '#ff3fa4', hair: 'spiky', hat: 'shades', face: 'none', intro: 'Let’s turn it up!', beaten: 'Respect. You’re fast.', gloat: 'Too slow for Tokyo!' },
  { name: 'Chef Aiko', rule: 'Perfectionist: tight + long', speed: 1.1, wobble: false, tight: true, extra: 2, kind: 0.5, mean: 0.2, attacks: ['slam', 'splat'], skin: '#f3cba8', hairColor: '#4a2a1a', outfit: '#ffe08a', accent: '#e76f51', hair: 'twinbuns', hat: 'none', face: 'none', intro: 'Only perfect will do!', beaten: 'Kawaii! Perfect roll!', gloat: 'Not cute enough!' },
  { name: 'Master Sato', rule: 'Old master: fast surges', speed: 1.3, wobble: true, tight: false, extra: 0, kind: 0.4, mean: 0.25, attacks: ['knife', 'slam'], skin: '#e6b48c', hairColor: '#d8d8d8', outfit: '#5b3b2e', accent: '#c9a227', hair: 'gray', hat: 'cap', face: 'elder', intro: 'Fifty years I have waited...', beaten: 'The student surpasses me.', gloat: 'Patience, young one.' },
  { name: 'Grand Chef Kaito', rule: 'Final boss: everything', speed: 1.4, wobble: true, tight: true, extra: 1, kind: 0.2, mean: 0.3, attacks: ['knife', 'slam', 'splat'], skin: '#eec39d', hairColor: '#111', outfit: '#1a1208', accent: '#d4a537', hair: 'short', hat: 'gold', face: 'mustache', intro: 'Face the Golden Knife!', beaten: 'A new Grand Chef is born!', gloat: 'Bow to the Golden Knife!' },
  // Levels 11-30.
  { name: 'Chef Daichi', rule: 'Steady pressure: faster', speed: 1.2, wobble: false, tight: false, extra: 0, kind: 0.4, mean: 0.2, attacks: ['slam', 'splat'], skin: '#e3ad84', hairColor: '#1b1b1b', outfit: '#3b5b7a', accent: '#f4a261', hair: 'curly', hat: 'beanie', face: 'none', intro: 'Let\u2019s keep it rolling!', beaten: 'Smooth moves!', gloat: 'Rolled over!' },
  { name: 'Chef Sakura', rule: 'Blossom: smaller PERFECT zone', speed: 1.15, wobble: false, tight: true, extra: 0, kind: 0.6, mean: 0.15, attacks: ['splat'], skin: '#f6d5bd', hairColor: '#2a1712', outfit: '#ffd6e5', accent: '#ff5d8f', hair: 'long', hat: 'flower', face: 'none', intro: 'Gentle and precise~', beaten: 'Lovely work!', gloat: 'Petals scattered...' },
  { name: 'Chef Kenta', rule: 'Rebel: fast surges', speed: 1.3, wobble: true, tight: false, extra: 0, kind: 0.15, mean: 0.3, attacks: ['knife', 'slam'], skin: '#e8b98f', hairColor: '#c0392b', outfit: '#1f1f1f', accent: '#e63946', hair: 'mohawk', hat: 'none', face: 'goatee', intro: 'Rules? What rules?', beaten: 'Okay, you rock.', gloat: 'Punk\u2019d!' },
  { name: 'Chef Rin', rule: 'Big order: 2 extra layers', speed: 1.2, wobble: false, tight: false, extra: 2, kind: 0.45, mean: 0.18, attacks: ['knife'], skin: '#f3cba8', hairColor: '#2b1b17', outfit: '#e9f5ee', accent: '#2a9d5c', hair: 'bob', hat: 'visor', face: 'none', intro: 'Big party tonight!', beaten: 'Party saved!', gloat: 'The party\u2019s ruined!' },
  { name: 'Chef Haruto', rule: 'Exacting: tight and fast', speed: 1.25, wobble: false, tight: true, extra: 0, kind: 0.35, mean: 0.2, attacks: ['slam'], skin: '#efc29a', hairColor: '#3a2418', outfit: '#ffffff', accent: '#264653', hair: 'short', hat: 'toque', face: 'freckles', intro: 'Measure twice, cut once.', beaten: 'Measured perfectly.', gloat: 'Off by a mile!' },
  { name: 'Chef Nao', rule: 'Wavy: speed surges', speed: 1.25, wobble: true, tight: false, extra: 0, kind: 0.4, mean: 0.22, attacks: ['splat', 'knife'], skin: '#f5d0b0', hairColor: '#4a2a1a', outfit: '#cdb4db', accent: '#7b2cbf', hair: 'ponytail', hat: 'beanie', face: 'none', intro: 'Ride the wave!', beaten: 'You surfed it!', gloat: 'Wiped out!' },
  { name: 'Chef Bao', rule: 'Dumpling master: very fast', speed: 1.35, wobble: false, tight: false, extra: 0, kind: 0.5, mean: 0.2, attacks: ['slam'], skin: '#e6b48c', hairColor: '#1a1a1a', outfit: '#fdf0d5', accent: '#c1121f', hair: 'bald', hat: 'cap', face: 'mustache', intro: 'Faster than steam!', beaten: 'Hot stuff!', gloat: 'Steamed you!' },
  { name: 'Chef Mina', rule: 'Picky: tight and long', speed: 1.2, wobble: false, tight: true, extra: 2, kind: 0.55, mean: 0.18, attacks: ['splat'], skin: '#f8d8c0', hairColor: '#3a2418', outfit: '#bde0fe', accent: '#ff70a6', hair: 'twinbuns', hat: 'flower', face: 'freckles', intro: 'Make it cute AND perfect!', beaten: 'So cute! Perfect!', gloat: 'Not cute at all!' },
  { name: 'Chef Jun', rule: 'Lightning hands: very fast', speed: 1.4, wobble: false, tight: false, extra: 0, kind: 0.2, mean: 0.28, attacks: ['knife'], skin: '#ecc19b', hairColor: '#111', outfit: '#023047', accent: '#ffb703', hair: 'spiky', hat: 'hachimaki', face: 'goatee', intro: 'Blink and you miss it!', beaten: 'Faster than lightning!', gloat: 'Too slow, rookie!' },
  { name: 'Chef Lin', rule: 'Silk: tight surges', speed: 1.3, wobble: true, tight: true, extra: 0, kind: 0.35, mean: 0.22, attacks: ['splat', 'slam'], skin: '#f5d6bd', hairColor: '#111', outfit: '#9d0208', accent: '#ffba08', hair: 'long', hat: 'bandana', face: 'none', intro: 'Flow like silk.', beaten: 'Graceful.', gloat: 'Tangled up!' },
  { name: 'Chef Takeshi', rule: 'Warrior: fast and long', speed: 1.4, wobble: false, tight: false, extra: 1, kind: 0.15, mean: 0.3, attacks: ['knife', 'slam'], skin: '#d9a77c', hairColor: '#222', outfit: '#3d405b', accent: '#e07a5f', hair: 'short', hat: 'hachimaki', face: 'beard', intro: 'Prepare for battle!', beaten: 'A worthy rival!', gloat: 'Defeated!' },
  { name: 'Chef Emi', rule: 'Bubbly: speed surges', speed: 1.35, wobble: true, tight: false, extra: 0, kind: 0.6, mean: 0.18, attacks: ['splat'], skin: '#f1c9a5', hairColor: '#6b3e26', outfit: '#ffe5ec', accent: '#fb6f92', hair: 'curly', hat: 'toque', face: 'freckles', intro: 'Ready, set, roll!', beaten: 'Yay! Amazing!', gloat: 'Aww, so close!' },
  { name: 'Chef Hiro', rule: 'Night shift: blazing fast', speed: 1.45, wobble: false, tight: false, extra: 0, kind: 0.2, mean: 0.3, attacks: ['knife', 'splat'], skin: '#e8b98f', hairColor: '#3c096c', outfit: '#10002b', accent: '#c77dff', hair: 'mohawk', hat: 'shades', face: 'none', intro: 'Welcome to the night shift.', beaten: 'You own the night.', gloat: 'Lights out!' },
  { name: 'Chef Yui', rule: 'Banquet: tight, 3 extra', speed: 1.3, wobble: false, tight: true, extra: 3, kind: 0.45, mean: 0.2, attacks: ['slam', 'splat'], skin: '#f6d5bd', hairColor: '#2b1b17', outfit: '#d8f3dc', accent: '#40916c', hair: 'bun', hat: 'visor', face: 'freckles', intro: 'A banquet for the emperor!', beaten: 'The banquet is served!', gloat: 'The banquet is ruined!' },
  { name: 'Chef Kazu', rule: 'Speedrun: very fast', speed: 1.5, wobble: false, tight: false, extra: 0, kind: 0.3, mean: 0.25, attacks: ['knife'], skin: '#efc29a', hairColor: '#1b1b1b', outfit: '#edf2f4', accent: '#ef233c', hair: 'short', hat: 'beanie', face: 'glasses', intro: 'I\u2019ve calculated your fate.', beaten: 'Miscalculated...', gloat: 'As calculated.' },
  { name: 'Chef Momo', rule: 'Peachy: tight surges', speed: 1.4, wobble: true, tight: true, extra: 0, kind: 0.5, mean: 0.22, attacks: ['splat', 'slam'], skin: '#f8d8c0', hairColor: '#e07a5f', outfit: '#ffd7ba', accent: '#f08080', hair: 'twinbuns', hat: 'bandana', face: 'none', intro: 'Sweet but tricky!', beaten: 'Peachy perfect!', gloat: 'Squished!' },
  { name: 'Chef Shin', rule: 'Shadow: fast surges', speed: 1.5, wobble: true, tight: false, extra: 0, kind: 0.15, mean: 0.32, attacks: ['knife', 'slam'], skin: '#d9a77c', hairColor: '#0b0b0b', outfit: '#212529', accent: '#adb5bd', hair: 'spiky', hat: 'cap', face: 'mustache', intro: 'You won\u2019t see me coming.', beaten: 'You saw through me.', gloat: 'Vanished!' },
  { name: 'Chef Akane', rule: 'Crimson: tight, fast, long', speed: 1.45, wobble: false, tight: true, extra: 1, kind: 0.3, mean: 0.28, attacks: ['knife', 'splat'], skin: '#f3cba8', hairColor: '#8b1e1e', outfit: '#fff1e6', accent: '#d00000', hair: 'long', hat: 'hachimaki', face: 'none', intro: 'Feel the crimson flame!', beaten: 'You burn brighter.', gloat: 'Burnt to a crisp!' },
  { name: 'Master Tanaka', rule: 'Ancient: tight surges', speed: 1.5, wobble: true, tight: true, extra: 1, kind: 0.35, mean: 0.3, attacks: ['knife', 'slam', 'splat'], skin: '#e6b48c', hairColor: '#e0e0e0', outfit: '#463f3a', accent: '#bc6c25', hair: 'gray', hat: 'toque', face: 'elder', intro: 'A hundred years of sushi...', beaten: 'At last, a true master.', gloat: 'Come back in fifty years.' },
  { name: 'Emperor Chef Ren', rule: 'Ultimate boss: everything', speed: 1.6, wobble: true, tight: true, extra: 2, kind: 0.15, mean: 0.35, attacks: ['knife', 'slam', 'splat'], skin: '#eec39d', hairColor: '#111', outfit: '#3c1518', accent: '#ffd34d', hair: 'short', hat: 'crown', face: 'mustache', intro: 'Kneel before the Emperor!', beaten: 'The crown is yours!', gloat: 'The Emperor is unbeaten!' },
  // Levels 31-50.
  { name: 'Chef Sora', rule: 'Sky high: fast surges', speed: 1.45, wobble: true, tight: false, extra: 1, kind: 0.4, mean: 0.25, attacks: ['splat', 'knife'], skin: '#f1c9a5', hairColor: '#1d3557', outfit: '#a8dadc', accent: '#457b9d', hair: 'short', hat: 'visor', face: 'none', intro: 'Reach for the sky!', beaten: 'You flew past me!', gloat: 'Grounded!' },
  { name: 'Chef Wei', rule: 'Wok master: very fast', speed: 1.5, wobble: false, tight: false, extra: 1, kind: 0.3, mean: 0.28, attacks: ['slam'], skin: '#e8b98f', hairColor: '#111', outfit: '#fefae0', accent: '#bc4749', hair: 'bald', hat: 'toque', face: 'goatee', intro: 'Feel the wok\u2019s fire!', beaten: 'Hot hands indeed!', gloat: 'Overcooked!' },
  { name: 'Chef Ji-woo', rule: 'K-pop tempo: tight surges', speed: 1.45, wobble: true, tight: true, extra: 0, kind: 0.45, mean: 0.25, attacks: ['splat'], skin: '#f6d5bd', hairColor: '#ff8fab', outfit: '#ffe5ec', accent: '#ff4d6d', hair: 'long', hat: 'none', face: 'freckles', intro: 'Stay on the beat!', beaten: 'Encore! Encore!', gloat: 'Off-beat!' },
  { name: 'Chef Kaori', rule: 'Fragrant: 3 extra layers', speed: 1.45, wobble: false, tight: false, extra: 3, kind: 0.5, mean: 0.22, attacks: ['splat', 'slam'], skin: '#f3cba8', hairColor: '#3a2418', outfit: '#e9d8a6', accent: '#ca6702', hair: 'bun', hat: 'flower', face: 'none', intro: 'A feast for the senses.', beaten: 'Divine aroma!', gloat: 'It smells burnt.' },
  { name: 'Chef Minh', rule: 'Street food: blazing fast', speed: 1.55, wobble: false, tight: false, extra: 0, kind: 0.35, mean: 0.28, attacks: ['knife'], skin: '#d9a77c', hairColor: '#1b1b1b', outfit: '#ffb703', accent: '#023047', hair: 'spiky', hat: 'bandana', face: 'none', intro: 'Street speed, let\u2019s go!', beaten: 'Street legend!', gloat: 'Back of the line!' },
  { name: 'Chef Suki', rule: 'Sweetheart: tight and long', speed: 1.4, wobble: false, tight: true, extra: 2, kind: 0.6, mean: 0.2, attacks: ['splat'], skin: '#f8d8c0', hairColor: '#6b3e26', outfit: '#fde2e4', accent: '#e5989b', hair: 'twinbuns', hat: 'visor', face: 'freckles', intro: 'Make it sweet!', beaten: 'Sugar-sweet!', gloat: 'Bitter ending!' },
  { name: 'Chef Ryota', rule: 'Storm: fast surges', speed: 1.55, wobble: true, tight: false, extra: 1, kind: 0.2, mean: 0.32, attacks: ['knife', 'slam'], skin: '#e3ad84', hairColor: '#2b2d42', outfit: '#2b2d42', accent: '#8d99ae', hair: 'curly', hat: 'hachimaki', face: 'beard', intro: 'A storm is coming!', beaten: 'You weathered it!', gloat: 'Blown away!' },
  { name: 'Chef Hye-jin', rule: 'Ice queen: tight surges', speed: 1.5, wobble: true, tight: true, extra: 1, kind: 0.3, mean: 0.28, attacks: ['splat', 'knife'], skin: '#f5d6bd', hairColor: '#e0e0e0', outfit: '#caf0f8', accent: '#0077b6', hair: 'bob', hat: 'none', face: 'none', intro: 'Stay cool under pressure.', beaten: 'Ice cold. Respect.', gloat: 'Frozen solid!' },
  { name: 'Chef Tomo', rule: 'Twin knives: very fast', speed: 1.6, wobble: false, tight: false, extra: 0, kind: 0.2, mean: 0.33, attacks: ['knife'], skin: '#efc29a', hairColor: '#111', outfit: '#540b0e', accent: '#e09f3e', hair: 'mohawk', hat: 'shades', face: 'goatee', intro: 'Two knives, no mercy.', beaten: 'Sharp skills!', gloat: 'Sliced and diced!' },
  { name: 'Chef Xiao', rule: 'Dim sum: tight, 2 extra', speed: 1.45, wobble: false, tight: true, extra: 2, kind: 0.45, mean: 0.25, attacks: ['slam', 'splat'], skin: '#f1c9a5', hairColor: '#1a1a1a', outfit: '#fff3b0', accent: '#e09f3e', hair: 'ponytail', hat: 'cap', face: 'none', intro: 'Many baskets to fill!', beaten: 'Every basket full!', gloat: 'Empty baskets!' },
  { name: 'Chef Natsu', rule: 'Summer heat: fast surges', speed: 1.6, wobble: true, tight: false, extra: 1, kind: 0.35, mean: 0.3, attacks: ['splat', 'slam'], skin: '#d9a77c', hairColor: '#7f4f24', outfit: '#ffbe0b', accent: '#fb5607', hair: 'spiky', hat: 'visor', face: 'freckles', intro: 'Feeling the heat yet?', beaten: 'Cool as summer rain.', gloat: 'Melted!' },
  { name: 'Chef Dae', rule: 'Iron chef: tight and fast', speed: 1.6, wobble: false, tight: true, extra: 1, kind: 0.2, mean: 0.33, attacks: ['knife', 'slam'], skin: '#e6b48c', hairColor: '#222', outfit: '#495057', accent: '#adb5bd', hair: 'short', hat: 'cap', face: 'mustache', intro: 'Iron will, iron hands.', beaten: 'Forged in fire!', gloat: 'Rusty!' },
  { name: 'Chef Chiyo', rule: 'Thousand years: long surges', speed: 1.55, wobble: true, tight: false, extra: 3, kind: 0.5, mean: 0.25, attacks: ['splat'], skin: '#f6d5bd', hairColor: '#cfcfcf', outfit: '#d8e2dc', accent: '#9d8189', hair: 'bun', hat: 'flower', face: 'elder', intro: 'Patience is a recipe.', beaten: 'Patience rewarded.', gloat: 'Too hasty, dear.' },
  { name: 'Chef Arata', rule: 'Fresh blade: very fast', speed: 1.65, wobble: false, tight: false, extra: 1, kind: 0.25, mean: 0.33, attacks: ['knife', 'splat'], skin: '#ecc19b', hairColor: '#003049', outfit: '#003049', accent: '#fcbf49', hair: 'long', hat: 'hachimaki', face: 'none', intro: 'A new blade cuts deepest.', beaten: 'You cut deeper.', gloat: 'Dull!' },
  { name: 'Chef Yuna', rule: 'Moonlight: tight surges', speed: 1.6, wobble: true, tight: true, extra: 1, kind: 0.4, mean: 0.3, attacks: ['splat', 'knife'], skin: '#f8d8c0', hairColor: '#240046', outfit: '#3c096c', accent: '#e0aaff', hair: 'long', hat: 'flower', face: 'none', intro: 'Dance under the moon.', beaten: 'You shine brighter.', gloat: 'Eclipsed!' },
  { name: 'Chef Long', rule: 'Dragon fist: blazing fast', speed: 1.7, wobble: false, tight: false, extra: 1, kind: 0.15, mean: 0.36, attacks: ['slam', 'knife'], skin: '#d9a77c', hairColor: '#111', outfit: '#9d0208', accent: '#ffba08', hair: 'bald', hat: 'hachimaki', face: 'beard', intro: 'Face the dragon fist!', beaten: 'The dragon bows.', gloat: 'Roasted by dragon fire!' },
  { name: 'Chef Hikari', rule: 'Radiant: tight, 3 extra', speed: 1.6, wobble: false, tight: true, extra: 3, kind: 0.35, mean: 0.3, attacks: ['splat', 'slam'], skin: '#f6d5bd', hairColor: '#ffd166', outfit: '#fffcf2', accent: '#ffd166', hair: 'curly', hat: 'toque', face: 'freckles', intro: 'Let your roll shine!', beaten: 'Dazzling!', gloat: 'Lights out!' },
  { name: 'Master Fujimoto', rule: 'Mountain master: surges', speed: 1.7, wobble: true, tight: true, extra: 2, kind: 0.3, mean: 0.33, attacks: ['knife', 'slam', 'splat'], skin: '#e6b48c', hairColor: '#e0e0e0', outfit: '#344e41', accent: '#a3b18a', hair: 'gray', hat: 'hachimaki', face: 'elder', intro: 'Climb my mountain.', beaten: 'You reached the peak.', gloat: 'Fell off the mountain!' },
  { name: 'Grand Master Liang', rule: 'Grand master: everything', speed: 1.75, wobble: true, tight: true, extra: 2, kind: 0.2, mean: 0.36, attacks: ['knife', 'slam', 'splat'], skin: '#eec39d', hairColor: '#d8d8d8', outfit: '#1b263b', accent: '#e0e1dd', hair: 'gray', hat: 'cap', face: 'elder', intro: 'Only one may pass.', beaten: 'You may pass.', gloat: 'None shall pass!' },
  { name: 'Dragon Chef Tatsu', rule: 'LEGEND: the final boss', speed: 1.8, wobble: true, tight: true, extra: 3, kind: 0.1, mean: 0.4, attacks: ['knife', 'slam', 'splat'], skin: '#eec39d', hairColor: '#7b0d1e', outfit: '#1a0f0f', accent: '#ffd34d', hair: 'mohawk', hat: 'crown', face: 'beard', intro: 'I am the last dragon!', beaten: 'A NEW LEGEND IS BORN!', gloat: 'Legends never fall!' },
];

export type Mood = 'calm' | 'focused' | 'intense' | 'panic' | 'happy' | 'impressed' | 'wince' | 'angry' | 'shock';

/**
 * Draws a chef bust with its head centred at (x, y). (lookX, lookY) is the point the chef watches and points at.
 */
export function drawChef(ctx: CanvasRenderingContext2D, c: Chef, x: number, y: number, s: number, mood: Mood, lookX: number, lookY: number, time: number, holding: Holding = null): void {
  ctx.save();
  const shaking = mood === 'panic' || mood === 'angry';
  ctx.translate(x + (shaking ? Math.sin(time * 45) * 1.5 * s : 0), y + Math.sin(time * 2) * 1.5 * s);
  ctx.scale(s, s);
  const lx = (lookX - x) / s;
  const ly = (lookY - y) / s;

  // Pointing arm, behind the body on the side facing the target.
  const side = lx >= 0 ? 1 : -1;
  const sx = side * 26;
  const sy = 40;
  // Winding up an attack or a throw raises the arm; otherwise it points at the target.
  const ang = holding ? -Math.PI / 2 + side * 0.45 + Math.sin(time * 18) * 0.06 : Math.atan2(ly - sy, lx - sx);
  const reach = 34;
  const hx = sx + Math.cos(ang) * reach;
  const hy = sy + Math.sin(ang) * reach;
  ctx.lineCap = 'round';
  ctx.strokeStyle = c.outfit;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(hx, hy, 6, 0, Math.PI * 2);
  ctx.fill();
  if (holding === 'knife') {
    drawKnife(ctx, hx, hy - 12, -Math.PI / 2 + side * 0.2, 1.2);
  } else if (holding === 'patty') {
    ctx.fillStyle = '#f6f1e4';
    ctx.beginPath();
    ctx.arc(hx, hy - 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#24321f';
    ctx.fillRect(hx - 10, hy - 6, 20, 6);
  } else if (holding === 'fist') {
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(hx, hy - 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.strokeStyle = c.skin;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(ang) * 9, hy + Math.sin(ang) * 9);
    ctx.stroke();
  }

  // Back hair (long styles sit behind the head).
  ctx.fillStyle = c.hairColor;
  if (c.hair === 'bob') {
    ctx.beginPath();
    ctx.ellipse(0, 2, 31, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (c.hair === 'long') {
    ctx.beginPath();
    ctx.moveTo(-28, -4);
    ctx.quadraticCurveTo(-34, 30, -26, 46);
    ctx.lineTo(26, 46);
    ctx.quadraticCurveTo(34, 30, 28, -4);
    ctx.closePath();
    ctx.fill();
  }
  if (c.hair === 'ponytail') {
    ctx.beginPath();
    ctx.ellipse(-side * 30, 10, 8, 20, -side * 0.4 + Math.sin(time * 3) * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torso with a crossed white collar.
  ctx.fillStyle = c.outfit;
  roundRect(ctx, -32, 24, 64, 46, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-12, 24);
  ctx.lineTo(4, 50);
  ctx.lineTo(10, 44);
  ctx.lineTo(-2, 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.accent;
  ctx.fillRect(-32, 58, 64, 5);

  // Neck, ears, head.
  ctx.fillStyle = shade(c.skin, -0.08);
  ctx.fillRect(-7, 16, 14, 12);
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(-26, 2, 5, 0, Math.PI * 2);
  ctx.arc(26, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  if (mood === 'angry') {
    ctx.fillStyle = 'rgba(230,40,40,0.28)';
    ctx.fill();
  }

  // Front hair.
  ctx.fillStyle = c.hairColor;
  switch (c.hair) {
    case 'short':
    case 'gray':
    case 'bun':
    case 'ponytail':
    case 'twinbuns':
    case 'bob':
    case 'long':
      ctx.beginPath();
      ctx.arc(0, -2, 26.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.quadraticCurveTo(10, -14, -2, -12);
      ctx.quadraticCurveTo(-14, -10, -25, -6);
      ctx.fill();
      break;
    case 'spiky':
      ctx.beginPath();
      ctx.moveTo(-26, -4);
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI * (1.05 + i * 0.15);
        ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26 - 2);
        ctx.lineTo(Math.cos(a + 0.075) * 38, Math.sin(a + 0.075) * 38 - 2);
      }
      ctx.lineTo(26, -4);
      ctx.quadraticCurveTo(0, -14, -26, -4);
      ctx.fill();
      break;
    case 'curly':
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.0 + i * 0.125);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 24, Math.sin(a) * 24 - 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'mohawk':
      ctx.beginPath();
      ctx.moveTo(-6, -22);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(-6 + i * 3, -36 - (i % 2) * 6);
        ctx.lineTo(-3 + i * 3, -24);
      }
      ctx.lineTo(8, -22);
      ctx.quadraticCurveTo(0, -28, -6, -22);
      ctx.fill();
      ctx.fillRect(-6, -27, 14, 8);
      break;
    case 'bald':
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(-8, -16, 6, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.fillStyle = c.hairColor;
  if (c.hair === 'bun') {
    ctx.beginPath();
    ctx.arc(0, -30, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-14, -40);
    ctx.lineTo(10, -24);
    ctx.moveTo(-10, -42);
    ctx.lineTo(14, -28);
    ctx.stroke();
  }
  if (c.hair === 'twinbuns') {
    ctx.beginPath();
    ctx.arc(-20, -22, 9, 0, Math.PI * 2);
    ctx.arc(20, -22, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Headwear.
  switch (c.hat) {
    case 'hachimaki':
    case 'gold': {
      const col = c.hat === 'gold' ? '#d4a537' : c.accent;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-26, -13);
      ctx.quadraticCurveTo(0, -19, 26, -13);
      ctx.lineTo(26, -6);
      ctx.quadraticCurveTo(0, -12, -26, -6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(24, -10);
      ctx.lineTo(36, -18 + Math.sin(time * 5) * 2);
      ctx.lineTo(34, -8);
      ctx.lineTo(38, 0 + Math.sin(time * 5 + 1) * 2);
      ctx.closePath();
      ctx.fill();
      if (c.hat === 'gold') {
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.arc(0, -12, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'cap':
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, -22, -38, 44, 24, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = c.accent;
      ctx.fillRect(-22, -20, 44, 4);
      break;
    case 'toque':
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, -20, -36, 40, 20, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-14, -44, 13, 0, Math.PI * 2);
      ctx.arc(0, -52, 15, 0, Math.PI * 2);
      ctx.arc(14, -44, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case 'bandana':
      ctx.fillStyle = c.accent;
      ctx.beginPath();
      ctx.moveTo(-27, -6);
      ctx.quadraticCurveTo(0, -46, 27, -6);
      ctx.quadraticCurveTo(0, -16, -27, -6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-12 + i * 8, -20 - (i % 2) * 5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'shades':
      ctx.fillStyle = '#111';
      roundRect(ctx, -20, -22, 17, 8, 3);
      ctx.fill();
      roundRect(ctx, 3, -22, 17, 8, 3);
      ctx.fill();
      ctx.fillStyle = c.accent;
      ctx.fillRect(-4, -19, 8, 2);
      break;
    case 'beanie':
      ctx.fillStyle = c.accent;
      ctx.beginPath();
      ctx.arc(0, -10, 27, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = shade(c.accent, -0.2);
      roundRect(ctx, -28, -16, 56, 9, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, -38, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'visor':
      ctx.fillStyle = c.accent;
      ctx.fillRect(-26, -16, 52, 7);
      ctx.beginPath();
      ctx.ellipse(0, -10, 24, 6, 0, 0, Math.PI);
      ctx.fill();
      break;
    case 'flower':
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 + 0.3;
        ctx.fillStyle = c.accent;
        ctx.beginPath();
        ctx.arc(-18 + Math.cos(a) * 6, -20 + Math.sin(a) * 6, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(-18, -20, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'crown':
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.lineTo(-22, -42);
      ctx.lineTo(-10, -30);
      ctx.lineTo(0, -48);
      ctx.lineTo(10, -30);
      ctx.lineTo(22, -42);
      ctx.lineTo(20, -18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      for (const [gx, col] of [[-12, '#e63946'], [0, '#4aa3df'], [12, '#2a9d5c']] as [number, string][]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(gx, -24, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'none':
      break;
  }

  drawFace(ctx, c, mood, lx, ly, time);
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, c: Chef, mood: Mood, lx: number, ly: number, time: number): void {
  const level = { calm: 0, focused: 1, intense: 2, panic: 3 }[mood as 'calm'] ?? 1;
  // Eyes grow as the chef gets more worked up.
  let er = { calm: 4.5, focused: 5, intense: 6.5, panic: 8.5, happy: 5, impressed: 6, wince: 4, angry: 4.5, shock: 9 }[mood];
  const eyeY = -1;
  const len = Math.hypot(lx, ly - eyeY) || 1;
  const px = (lx / len) * er * 0.45;
  const py = ((ly - eyeY) / len) * er * 0.45;
  const blink = mood === 'calm' && Math.sin(time * 1.3) > 0.985;

  for (const ex of [-10, 10]) {
    if (mood === 'happy' || blink) {
      ctx.strokeStyle = '#2a1a1a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (blink) {
        ctx.moveTo(ex - 4, eyeY);
        ctx.lineTo(ex + 4, eyeY);
      } else {
        ctx.arc(ex, eyeY + 2, 4.5, Math.PI * 1.15, Math.PI * 1.85);
      }
      ctx.stroke();
      continue;
    }
    if (mood === 'wince') {
      ctx.strokeStyle = '#2a1a1a';
      ctx.lineWidth = 2.2;
      const d = ex < 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(ex - 4 * d, eyeY - 3);
      ctx.lineTo(ex + 3 * d, eyeY);
      ctx.lineTo(ex - 4 * d, eyeY + 3);
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (mood === 'angry') ctx.ellipse(ex, eyeY + 1, er, er * 0.55, 0, 0, Math.PI * 2);
    else ctx.arc(ex, eyeY, er, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (mood === 'impressed') {
      star(ctx, ex, eyeY, er * 0.85, '#f2b705');
      continue;
    }
    const pr = mood === 'shock' ? 2 : mood === 'panic' ? 2.6 : er * 0.55;
    ctx.fillStyle = mood === 'angry' ? '#7a1010' : '#2a1a1a';
    ctx.beginPath();
    ctx.arc(ex + px, eyeY + py * (mood === 'angry' ? 0.4 : 1), pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex + px - pr * 0.35, eyeY + py - pr * 0.35, pr * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glasses sit over the eyes.
  if (c.face === 'glasses') {
    er = Math.max(er, 6);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-10, eyeY, er + 2.5, 0, Math.PI * 2);
    ctx.moveTo(10 + er + 2.5, eyeY);
    ctx.arc(10, eyeY, er + 2.5, 0, Math.PI * 2);
    ctx.moveTo(-10 + er + 2.5, eyeY);
    ctx.lineTo(10 - er - 2.5, eyeY);
    ctx.stroke();
  }

  // Eyebrows: angle and height carry most of the expression.
  const browTilt = { calm: 0, focused: 0.25, intense: 0.35, panic: -0.35, happy: -0.15, impressed: -0.3, wince: 0.3, angry: 0.6, shock: -0.4 }[mood];
  const browLift = { calm: 0, focused: 1, intense: 0, panic: -4, happy: -2, impressed: -3, wince: 1, angry: 2, shock: -6 }[mood];
  ctx.strokeStyle = c.face === 'elder' ? '#f0f0f0' : c.hairColor === '#d8d8d8' ? '#bbb' : c.hairColor;
  ctx.lineWidth = c.face === 'elder' ? 4 : 2.8;
  for (const d of [-1, 1]) {
    const bx = d * 10;
    const by = eyeY - er - 5 + browLift;
    // The inner end tilts down when browTilt > 0 (stern) and up when < 0 (worried or surprised).
    const inner = { x: bx - d * 6, y: by + browTilt * 8 };
    const outer = { x: bx + d * 6, y: by - browTilt * 4 };
    ctx.beginPath();
    ctx.moveTo(inner.x, inner.y);
    ctx.lineTo(outer.x, outer.y);
    ctx.stroke();
    if (c.face === 'elder') {
      ctx.beginPath();
      ctx.moveTo(outer.x, outer.y);
      ctx.lineTo(outer.x + d * 5, outer.y + 5);
      ctx.stroke();
    }
  }

  // Cheeks.
  if (mood === 'happy' || mood === 'impressed' || level === 0) {
    ctx.fillStyle = 'rgba(255,120,130,0.35)';
    ctx.beginPath();
    ctx.ellipse(-17, 9, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(17, 9, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth.
  const my = 14;
  ctx.strokeStyle = '#5a1f1f';
  ctx.fillStyle = '#7a2a2a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  switch (mood) {
    case 'calm':
      ctx.arc(0, my - 4, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      break;
    case 'focused':
      ctx.moveTo(-5, my);
      ctx.lineTo(5, my);
      ctx.stroke();
      break;
    case 'intense':
      roundRect(ctx, -7, my - 3, 14, 6, 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.stroke();
      break;
    case 'panic':
      ctx.moveTo(-8, my);
      for (let i = 0; i < 4; i++) ctx.lineTo(-8 + (i + 0.5) * 4, my + (i % 2 ? 3 : -3));
      ctx.lineTo(8, my);
      ctx.stroke();
      break;
    case 'happy':
      ctx.moveTo(-9, my - 2);
      ctx.quadraticCurveTo(0, my + 12, 9, my - 2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'impressed':
    case 'shock':
      ctx.ellipse(0, my + 1, mood === 'shock' ? 5 : 3.5, mood === 'shock' ? 7 : 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'wince':
      ctx.moveTo(-7, my);
      ctx.lineTo(-3, my - 2);
      ctx.lineTo(1, my + 1);
      ctx.lineTo(5, my - 2);
      ctx.lineTo(7, my);
      ctx.stroke();
      break;
    case 'angry':
      ctx.arc(0, my + 6, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      break;
  }

  // Facial hair.
  ctx.fillStyle = c.face === 'elder' ? '#f0f0f0' : c.hairColor;
  if (c.face === 'mustache' || c.face === 'elder') {
    ctx.beginPath();
    ctx.moveTo(0, my - 6);
    ctx.quadraticCurveTo(-9, my - 8, -14, my - 2 + (c.face === 'elder' ? 8 : 0));
    ctx.quadraticCurveTo(-7, my - 3, 0, my - 3);
    ctx.quadraticCurveTo(7, my - 3, 14, my - 2 + (c.face === 'elder' ? 8 : 0));
    ctx.quadraticCurveTo(9, my - 8, 0, my - 6);
    ctx.fill();
  }
  if (c.face === 'goatee') {
    ctx.beginPath();
    ctx.moveTo(-6, my + 6);
    ctx.quadraticCurveTo(0, my + 20, 6, my + 6);
    ctx.closePath();
    ctx.fill();
  }
  if (c.face === 'freckles') {
    ctx.fillStyle = 'rgba(150,80,40,0.55)';
    for (const [fx, fy] of [[-18, 6], [-14, 9], [-20, 10], [18, 6], [14, 9], [20, 10]]) {
      ctx.beginPath();
      ctx.arc(fx, fy, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (c.face === 'beard') {
    ctx.beginPath();
    ctx.moveTo(-22, 6);
    ctx.quadraticCurveTo(-20, 32, 0, 34);
    ctx.quadraticCurveTo(20, 32, 22, 6);
    ctx.quadraticCurveTo(14, 20, 8, my + 5);
    ctx.lineTo(-8, my + 5);
    ctx.quadraticCurveTo(-14, 20, -22, 6);
    ctx.fill();
  }

  // Sweat when the pressure is on.
  if (mood === 'intense' || mood === 'panic' || mood === 'wince') {
    const dy = (time * 30) % 12;
    ctx.fillStyle = '#7fd3ff';
    ctx.beginPath();
    ctx.moveTo(23, -16 + dy);
    ctx.quadraticCurveTo(28, -8 + dy, 23, -6 + dy);
    ctx.quadraticCurveTo(18, -8 + dy, 23, -16 + dy);
    ctx.fill();
  }
  // Steam when angry.
  if (mood === 'angry') {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 3; i++) {
      const t = (time * 1.5 + i / 3) % 1;
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.arc((i - 1) * 16, -34 - t * 24, 4 + t * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** A chef's knife centred at (x, y), pointing along angle `a`. */
export function drawKnife(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(s, s);
  ctx.fillStyle = '#5a3a22';
  ctx.beginPath();
  ctx.moveTo(-18, -3);
  ctx.lineTo(-4, -3);
  ctx.lineTo(-4, 3);
  ctx.lineTo(-18, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(18, -2);
  ctx.lineTo(22, 1);
  ctx.lineTo(-4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a96a3';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, -3, 14, 1.2);
  ctx.restore();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Lightens (amt > 0) or darkens (amt < 0) a #rrggbb colour. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

// ------------------------------------------------------------------ endless chefs

const FIRST_NAMES = ['Aki', 'Ren', 'Kou', 'Mio', 'Haru', 'Rei', 'Sho', 'Nana', 'Kai', 'Riku', 'Hina', 'Yuto', 'Sena', 'Toma', 'Ayumi', 'Daiki', 'Noa', 'Kaede', 'Itsuki', 'Mana',
  'Bo', 'Lan', 'Mei-lin', 'Jian', 'Hui', 'Ping', 'Seo-yeon', 'Min-jun', 'Ha-eun', 'Do-yun', 'Hoa', 'Tuan', 'Linh', 'Ploy', 'Arun', 'Niran', 'Malee', 'Tavi', 'Kiko', 'Sumi'];
const TITLES = ['Chef', 'Chef', 'Chef', 'Sensei', 'Master', 'Captain', 'Iron Chef'];
const INTROS = ['Show me what you’ve got!', 'This kitchen is mine!', 'Ready for a real challenge?', 'Don’t blink!', 'Let’s see your knife work.', 'Only the best survive here.', 'I’ve been waiting for you.', 'Roll with me, if you can!'];
const BEATENS = ['Impressive!', 'You earned this one.', 'My kitchen salutes you!', 'Incredible hands!', 'I bow to your skill.', 'That was delicious!', 'Well played, chef!'];
const GLOATS = ['Back to the start!', 'Not today!', 'Too sloppy!', 'My kitchen, my rules!', 'Try again, rookie!', 'You call that sushi?', 'Ha! Keep practising!'];
export const SKINS = ['#f1c9a5', '#e8b98f', '#f5d0b0', '#d9a77c', '#efc29a', '#f6d5bd', '#e6b48c', '#c98e64', '#a8714a'];
export const HAIR_COLORS = ['#111', '#1d1a1a', '#2b1b17', '#3a2418', '#6b3e26', '#8b1e1e', '#d8d8d8', '#231c3a', '#1d3557', '#7f4f24'];
export const OUTFITS: [string, string][] = [['#ffffff', '#d7263d'], ['#1f1f1f', '#f2b705'], ['#a8dadc', '#1d3557'], ['#ffd6e5', '#ff5d8f'], ['#2b2d42', '#ef233c'], ['#fefae0', '#bc4749'],
  ['#caf0f8', '#0077b6'], ['#3c096c', '#e0aaff'], ['#ffbe0b', '#fb5607'], ['#344e41', '#a3b18a'], ['#540b0e', '#e09f3e'], ['#e9f5ee', '#2a9d5c']];
export const HAIRS: Hair[] = ['short', 'bun', 'bob', 'bald', 'spiky', 'ponytail', 'twinbuns', 'gray', 'curly', 'long', 'mohawk'];
export const HATS: Hat[] = ['hachimaki', 'cap', 'toque', 'bandana', 'none', 'shades', 'beanie', 'visor', 'flower'];
export const FACES: Face[] = ['none', 'none', 'mustache', 'beard', 'glasses', 'goatee', 'freckles'];
const ATTACKS: Attack[] = ['knife', 'slam', 'splat'];

/** Small seeded random generator, so a given level always produces the same chef. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const generated = new Map<number, Chef>();

/**
 * The chef for any level. Levels 1-50 are the hand-made story chefs; beyond that a new chef is
 * generated for every level, getting tougher as the levels climb. Every 10th level is a Legend boss.
 */
export function chefFor(level: number): Chef {
  if (level <= CHEFS.length) return CHEFS[level - 1];
  const cached = generated.get(level);
  if (cached) return cached;
  const r = rng(level * 9973 + 17);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const depth = level - CHEFS.length; // levels into endless mode
  const legend = level % 10 === 0;
  const [outfit, accent] = pick(OUTFITS);
  const speed = Math.min(1.9, 1.5 + depth * 0.004 + r() * 0.1 + (legend ? 0.1 : 0));
  const wobble = legend || r() < 0.6;
  const tight = legend || r() < Math.min(0.85, 0.45 + depth * 0.004);
  const extra = legend ? 3 : Math.floor(r() * 4);
  const attacks = legend ? ATTACKS : ATTACKS.filter(() => r() < 0.6);
  if (!attacks.length) attacks.push(pick(ATTACKS));
  const rule = [`${Math.round((speed - 1) * 100)}% faster`, wobble && 'surges', tight && 'small PERFECT zone', extra && `+${extra} layer${extra === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
  // Stepping through the names by 13 (coprime with 40) means no repeats within 40 levels.
  // Chefs in the pizza, burger and pancake worlds have names and uniforms to match.
  const world = worldFor(level);
  const W = WORLDS[world];
  const first = world === 'sushi' ? FIRST_NAMES[(level * 13) % FIRST_NAMES.length] : W.names[(level * 7) % W.names.length];
  // Turkish masters are called usta, after the name.
  const name = legend ? `Legend ${first}` : world === 'turkish' ? `${first} Usta` : `${world === 'sushi' ? pick(TITLES) : pick(['Chef', 'Chef', 'Master', 'Captain'])} ${first}`;
  const themed = world !== 'sushi' ? W.outfits[level % W.outfits.length] : null;
  const chef: Chef = {
    name,
    rule: legend ? `LEGEND BOSS: ${rule}` : rule,
    speed,
    wobble,
    tight,
    extra,
    kind: legend ? 0.1 : 0.1 + r() * 0.3,
    mean: Math.min(0.5, 0.25 + depth * 0.003 + r() * 0.1 + (legend ? 0.05 : 0)),
    attacks,
    skin: pick(SKINS),
    hairColor: pick(HAIR_COLORS),
    outfit: legend ? '#1a0f0f' : themed ? themed[0] : outfit,
    accent: legend ? '#ffd34d' : themed ? themed[1] : accent,
    hair: pick(HAIRS),
    hat: legend ? (r() < 0.5 ? 'crown' : 'gold') : pick(HATS),
    face: pick(FACES),
    intro: pick(INTROS),
    beaten: pick(BEATENS),
    gloat: pick(GLOATS),
  };
  generated.set(level, chef);
  return chef;
}
