// Grandma's Book: her letters, real recipes you unlock by mastering dishes, the seasonal fish
// calendar, sushi trivia, the story's choices, and what rival chefs remember about you.

import type { Ingredient } from './shop';

// ================================================================ grandma's letters

export type LetterCond = { kind: 'level'; n: number } | { kind: 'served'; n: number } | { kind: 'perfects'; n: number } | { kind: 'restaurant' } | { kind: 'expansion'; n: number } | { kind: 'daily'; n: number } | { kind: 'combos'; n: number } | { kind: 'landmark'; m: number } | { kind: 'world'; id: string };

export interface Letter { id: number; title: string; cond: LetterCond; body: string[] }

export const LETTERS: Letter[] = [
  { id: 0, title: 'The key under the mat', cond: { kind: 'level', n: 2 }, body: ['My dear,', 'If you are reading this, you found the key. The bar has been quiet for too long. The rice cooker still works if you kick it gently on the left side.', 'Don’t be afraid of the rival chefs. Most of them are all bark and no wasabi.', 'Love, Grandma'] },
  { id: 1, title: 'On rice', cond: { kind: 'served', n: 10 }, body: ['My dear,', 'Everyone looks at the fish. Real chefs look at the rice. Wash it until the water runs clear, season it while it is warm, and fan it until it shines.', 'A wobbly roll starts with lazy rice.', 'Love, Grandma'] },
  { id: 2, title: 'The first regular', cond: { kind: 'restaurant' }, body: ['My dear,', 'Mrs. Tanaka sat on the third stool for thirty years. She always said my salmon was “too thick”, and she always ordered it twice.', 'Learn your regulars’ names. A full counter is a family.', 'Love, Grandma'] },
  { id: 3, title: 'Steady hands', cond: { kind: 'perfects', n: 100 }, body: ['My dear,', 'A hundred perfect cuts! When I was young, my hands shook so much the chef made me slice cucumbers for a whole year.', 'Breathe out before you cut. The knife listens to your breath.', 'Love, Grandma'] },
  { id: 4, title: 'Chef Kaito', cond: { kind: 'level', n: 10 }, body: ['My dear,', 'So you met Kaito. He was my best apprentice, and the most stubborn. He left to open his own place and we didn’t speak for twenty years.', 'If he is gruff with you, it is because he misses this counter.', 'Love, Grandma'] },
  { id: 5, title: 'On losing', cond: { kind: 'level', n: 15 }, body: ['My dear,', 'You will drop rolls. I dropped a whole tray of tuna in front of the Mayor once. He laughed so hard he became a regular.', 'Pick up the knife and make the next one better.', 'Love, Grandma'] },
  { id: 6, title: 'The night market', cond: { kind: 'level', n: 25 }, body: ['My dear,', 'The night market chefs once tried to buy my rice vinegar recipe. I told them the secret ingredient was patience. They did not find it funny.', 'Love, Grandma'] },
  { id: 7, title: 'A bigger room', cond: { kind: 'expansion', n: 1 }, body: ['My dear,', 'You knocked down the storeroom wall! Your grandfather always wanted a longer counter. He would have sat at the very end, pretending to read the paper while watching every cut.', 'Love, Grandma'] },
  { id: 8, title: 'Every morning', cond: { kind: 'daily', n: 7 }, body: ['My dear,', 'A week of morning rolls. Habits are like dashi: nothing special in one spoonful, everything in a pot.', 'Love, Grandma'] },
  { id: 9, title: 'Taste together', cond: { kind: 'combos', n: 5 }, body: ['My dear,', 'You are learning which flavours like each other. Tuna and avocado, egg and nori: some things are simply better side by side. People too.', 'Love, Grandma'] },
  { id: 10, title: 'Higher than the tower', cond: { kind: 'landmark', m: 93 }, body: ['My dear,', 'They tell me your roll stood taller than the Statue of Liberty. I once stacked twelve plates of maki for a wedding and I thought that was high!', 'Don’t forget to look down sometimes and wave.', 'Love, Grandma'] },
  { id: 11, title: 'Across the sea', cond: { kind: 'world', id: 'turkish' }, body: ['My dear,', 'Istanbul! I went there once on a ship, long ago. I ate döner on the Galata Bridge and a baklava so sweet my teeth sang.', 'Bring me back a story. And pistachios.', 'Love, Grandma'] },
  { id: 12, title: 'The Golden Plate', cond: { kind: 'level', n: 50 }, body: ['My dear,', 'The Golden Plate. I never won it. I came second, three times, to the same chef. You know who.', 'I am so proud of you that I made a whole pot of rice just to have something to do with my hands.', 'Love, always, Grandma'] },
];

export interface LetterStats { level: number; served: number; perfects: number; restaurant: boolean; expansions: number; dailyPlayed: number; combos: number; landmark: number; worlds: string[] }

export function letterUnlocked(l: Letter, s: LetterStats): boolean {
  const c = l.cond;
  switch (c.kind) {
    case 'level': return s.level >= c.n;
    case 'served': return s.served >= c.n;
    case 'perfects': return s.perfects >= c.n;
    case 'restaurant': return s.restaurant;
    case 'expansion': return s.expansions >= c.n;
    case 'daily': return s.dailyPlayed >= c.n;
    case 'combos': return s.combos >= c.n;
    case 'landmark': return s.landmark >= c.m;
    case 'world': return s.worlds.includes(c.id);
  }
}

export function letterHint(l: Letter): string {
  const c = l.cond;
  switch (c.kind) {
    case 'level': return `Reach level ${c.n}`;
    case 'served': return `Serve ${c.n} orders`;
    case 'perfects': return `Make ${c.n} PERFECT cuts`;
    case 'restaurant': return 'Open your restaurant';
    case 'expansion': return 'Build your first expansion';
    case 'daily': return `Play ${c.n} Daily Rolls`;
    case 'combos': return `Discover ${c.n} combos`;
    case 'landmark': return `Stack ${c.m} m in one run`;
    case 'world': return 'Reach the Turkish world';
  }
}

// ================================================================ real recipe cards

export interface RecipeCard { dish: string; serves: string; time: string; ingredients: string[]; steps: string[]; tip: string }

/** Simple home versions of the game's dishes. Unlocked when a dish reaches level 3. */
export const RECIPE_CARDS: RecipeCard[] = [
  {
    dish: 'Sushi Rice', serves: '4', time: '45 min',
    ingredients: ['2 cups Japanese short-grain rice', '2 cups water', '4 tbsp rice vinegar', '2 tbsp sugar', '1 tsp salt'],
    steps: ['Rinse the rice in cold water until it runs almost clear, then drain for 15 minutes.', 'Cook the rice with the water (rice cooker or a covered pot on low heat for about 15 minutes, then rest 10).', 'Warm the vinegar, sugar and salt until dissolved.', 'Spread the hot rice in a wide bowl and fold in the vinegar with a paddle, fanning it to cool and shine.', 'Cover with a damp cloth and use while it is still body-warm.'],
    tip: 'Cut and fold, don’t stir: stirring mashes the grains.',
  },
  {
    dish: 'Salmon Maki', serves: '2 (12 pieces)', time: '20 min',
    ingredients: ['Sushi rice (half the recipe)', '2 sheets nori, halved', '150 g sushi-grade salmon', 'Soy sauce, wasabi, pickled ginger'],
    steps: ['Cut the salmon into finger-thick strips.', 'Lay half a nori sheet, shiny side down, on a bamboo mat.', 'With wet hands, spread a thin layer of rice, leaving 1 cm bare at the top edge.', 'Lay salmon along the bottom and roll tightly with the mat.', 'Slice into 6 pieces with a wet knife.'],
    tip: 'Raw fish must be sushi-grade (frozen first, as food-safety rules advise). Smoked salmon works too.',
  },
  {
    dish: 'Tamago Tower', serves: '2', time: '20 min',
    ingredients: ['4 eggs', '1 tbsp sugar', '1 tsp soy sauce', '1 tbsp mirin (optional)', 'A little oil', 'Sushi rice and nori strips to serve'],
    steps: ['Beat the eggs with sugar, soy sauce and mirin.', 'Oil a pan (a square tamagoyaki pan if you have one) over medium-low heat.', 'Pour a thin layer; when nearly set, roll it to one side.', 'Pour another thin layer under and beside the roll, then roll the omelette back over it. Repeat.', 'Rest, slice, and lay on small blocks of rice with a nori belt.'],
    tip: 'Low heat keeps the layers yellow, not brown.',
  },
  {
    dish: 'Tuna Classic', serves: '2', time: '20 min',
    ingredients: ['Sushi rice (half the recipe)', '2 sheets nori', '150 g sushi-grade tuna', '1 ripe avocado'],
    steps: ['Slice the tuna and avocado into long strips.', 'Spread rice thinly on the nori.', 'Lay tuna and avocado side by side near the bottom edge.', 'Roll firmly and cut into 8 pieces.'],
    tip: 'A squeeze of lemon on the avocado stops it from browning.',
  },
  {
    dish: 'Green Roll', serves: '2', time: '15 min',
    ingredients: ['Sushi rice (half the recipe)', '2 sheets nori', '1 cucumber', '1 avocado', 'Sesame seeds'],
    steps: ['Cut the cucumber into thin batons, removing the seedy core.', 'Slice the avocado.', 'Spread rice, add cucumber and avocado, and roll.', 'Sprinkle with toasted sesame and slice.'],
    tip: 'A cucumber-only roll is called kappa maki, after a water spirit said to love cucumbers.',
  },
  {
    dish: 'Rainbow Roll', serves: '2', time: '30 min',
    ingredients: ['An inside-out roll of cucumber and avocado (rice outside)', 'Thin slices of salmon, tuna and avocado', 'Tamagoyaki strips (optional)', 'Cling film'],
    steps: ['Make an inside-out roll: rice on the nori, flip it onto cling film, fill, and roll.', 'Lay thin slices of fish and avocado diagonally over the top, alternating colours.', 'Cover with cling film and press gently with the mat.', 'Slice through the film into 8 pieces, then peel it off.'],
    tip: 'Chill the fish slices first: they cut thinner and lie flatter.',
  },
  {
    dish: 'Ebi Tempura Roll', serves: '2', time: '35 min',
    ingredients: ['6 large prawns, peeled', '60 g plain flour + 1 tbsp cornflour', '100 ml ice-cold sparkling water', 'Oil for frying', 'Sushi rice, nori, avocado'],
    steps: ['Make shallow cuts on the belly of each prawn so it stays straight.', 'Mix the flour and ice-cold water briefly: lumps are fine.', 'Dip and fry the prawns at about 175 °C until crisp and pale gold.', 'Roll with avocado and slice while the tempura is still crunchy.'],
    tip: 'Never fry unattended, and keep the batter cold for a light, lacy crust.',
  },
  {
    dish: 'Unagi Dragon Roll', serves: '2', time: '30 min',
    ingredients: ['1 pack grilled eel (kabayaki), warmed', 'Unagi (eel) sauce', 'Sushi rice, nori, cucumber, avocado'],
    steps: ['Make an inside-out roll with cucumber inside.', 'Lay thin avocado slices along the top like scales.', 'Slice the warm eel and lay it on top, or inside.', 'Brush with eel sauce and slice.'],
    tip: 'Ready-grilled eel is sold vacuum-packed in Asian supermarkets.',
  },
  {
    dish: 'Inari Tofu Stack', serves: '2', time: '15 min',
    ingredients: ['6 seasoned inari tofu pockets (from a can or pack)', 'Sushi rice (half the recipe)', 'Toasted sesame seeds'],
    steps: ['Squeeze the tofu pockets gently to remove extra syrup.', 'Mix sesame into the rice.', 'Open each pocket and fill it with a small ball of rice.', 'Fold the edges over, or leave them open and top them.'],
    tip: 'Inari is named after the Shinto god Inari, whose fox messengers are said to love fried tofu.',
  },
  {
    dish: 'Ikura Gunkan', serves: '2', time: '15 min',
    ingredients: ['100 g ikura (salmon roe)', 'Sushi rice', 'Nori cut into 3 cm strips'],
    steps: ['Shape small oval blocks of rice.', 'Wrap a nori strip around each to make a wall.', 'Spoon ikura into the top.', 'Serve straight away so the nori stays crisp.'],
    tip: 'Gunkan means “battleship”. The style is said to come from Kyubey in Ginza, around 1941.',
  },
  {
    dish: 'Margherita', serves: '2 pizzas', time: '2 h (with rising)',
    ingredients: ['300 g pizza or bread flour', '200 ml warm water', '3 g dried yeast', '1 tsp salt', '200 g crushed tomatoes', '1 ball mozzarella', 'Fresh basil, olive oil'],
    steps: ['Mix flour, water, yeast and salt; knead 10 minutes and let rise until doubled.', 'Heat the oven as hot as it goes, with a tray or stone inside.', 'Stretch a ball of dough thin, spread tomato, tear over mozzarella.', 'Bake until bubbling and charred at the edges, then add basil and oil.'],
    tip: 'Legend says it was named after Queen Margherita of Italy in 1889.',
  },
  {
    dish: 'Classic Burger', serves: '4', time: '25 min',
    ingredients: ['500 g minced beef (20% fat)', 'Salt and pepper', '4 buns', '4 slices cheddar', 'Lettuce, tomato, onion'],
    steps: ['Shape 4 patties a little wider than the buns, with a thumb dent in the middle.', 'Season generously just before cooking.', 'Cook in a hot pan 3–4 minutes a side; add cheese at the end and cover to melt.', 'Toast the buns and stack: bun, lettuce, patty, tomato, bun.'],
    tip: 'Cook minced beef through (no pink in the middle).',
  },
  {
    dish: 'Butter Stack', serves: '2', time: '20 min',
    ingredients: ['150 g flour', '1 tsp baking powder', '1 tbsp sugar', 'Pinch of salt', '1 egg', '200 ml milk', '20 g melted butter', 'Maple syrup'],
    steps: ['Whisk the dry ingredients; whisk the egg, milk and butter separately.', 'Combine briefly: a few lumps keep them fluffy.', 'Ladle onto a buttered pan over medium heat; flip when bubbles appear.', 'Stack, top with butter and pour on the syrup.'],
    tip: 'Let the batter rest 5 minutes for taller pancakes.',
  },
  {
    dish: 'Döner Dürüm', serves: '2', time: '30 min + marinating',
    ingredients: ['400 g chicken thigh', '3 tbsp yoghurt', '1 tsp each paprika, cumin, salt', '1 garlic clove', '2 lavash or thin flatbreads', 'Tomato, onion, lettuce'],
    steps: ['Marinate the chicken with yoghurt, spices and garlic for at least an hour.', 'Grill or pan-fry until cooked through and charred at the edges.', 'Slice thinly, like meat shaved from the spit.', 'Lay on warm lavash with tomato, onion and lettuce, then roll tightly.'],
    tip: 'Döner means “turning” in Turkish, after the rotating spit.',
  },
  {
    dish: 'Lahmacun', serves: '4', time: '1 h',
    ingredients: ['Pizza dough (or thin flatbread dough)', '250 g minced lamb or beef', '1 onion, 1 tomato, 1 red pepper, finely chopped', '1 tbsp pepper paste or tomato paste', 'Parsley and lemon to serve'],
    steps: ['Mix the mince with the chopped vegetables and paste.', 'Roll the dough very thin into ovals.', 'Spread a thin layer of the meat mixture right to the edges.', 'Bake in a very hot oven for 6–8 minutes.', 'Top with parsley, squeeze over lemon, roll up and eat.'],
    tip: 'Make sure the meat is cooked through: spread it thin so it bakes quickly.',
  },
  {
    dish: 'Baklava Tower', serves: '12 pieces', time: '1 h 30 min',
    ingredients: ['1 pack filo pastry', '150 g melted butter', '200 g pistachios, finely chopped', 'Syrup: 200 g sugar, 150 ml water, a squeeze of lemon'],
    steps: ['Simmer the syrup ingredients for 10 minutes and let it cool completely.', 'Brush a tin with butter and layer half the filo, buttering each sheet.', 'Scatter the pistachios, then layer and butter the rest of the filo.', 'Cut into diamonds and bake at 170 °C until deep golden (about 45 minutes).', 'Pour the cool syrup over the hot baklava and leave it to soak for hours.'],
    tip: 'Hot pastry, cool syrup: that is how it stays crisp. Antep baklava is protected by an EU geographical indication.',
  },
];

// ================================================================ seasonal fish (shun)

export interface Season { months: number[]; items: Ingredient[]; note: string }

/** Shun: when an ingredient is at its best. In-season layers and dishes pay a little more. */
export const SEASONS: Season[] = [
  { months: [11, 0, 1], items: ['tuna', 'nori'], note: 'Winter bluefin (kan-maguro) is at its richest, and the year’s first nori harvest is the most fragrant.' },
  { months: [2, 3, 4], items: ['ebi', 'egg'], note: 'Spring: sakura shrimp are fished in Suruga Bay, and tamago fills the bento boxes of cherry-blossom picnics.' },
  { months: [5, 6, 7], items: ['unagi', 'cucumber'], note: 'Summer: eel is eaten on the Day of the Ox for stamina, and cucumbers are crisp and cool.' },
  { months: [7, 8], items: ['pistachio'], note: 'Late summer: pistachios are harvested around Gaziantep in Türkiye.' },
  { months: [8, 9, 10], items: ['salmon', 'ikura'], note: 'Autumn: salmon run up the rivers (aki-zake) and fresh ikura is cured from their roe.' },
];

export function inSeason(month: number): Ingredient[] {
  return SEASONS.filter((s) => s.months.includes(month)).flatMap((s) => s.items);
}

export function seasonNote(month: number): string {
  return SEASONS.filter((s) => s.months.includes(month)).map((s) => s.note).join(' ');
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ================================================================ trivia

export const TRIVIA: string[] = [
  'Nigiri began as fast food: street stalls in Edo (old Tokyo) sold it in the 1820s.',
  'The earliest sushi, narezushi, was fish fermented in rice for months. The rice was thrown away.',
  '“Sushi” means the vinegared rice, not the fish.',
  'Most “wasabi” outside Japan is horseradish coloured green. Real wasabi is a rare root.',
  'Freshly grated wasabi loses much of its flavour within about 15 minutes.',
  'Salmon sushi only became popular in Japan in the 1980s and 90s, helped by Norwegian exporters.',
  'Pickled ginger (gari) is meant to refresh your palate between pieces.',
  'The California roll, rice on the outside, was invented in North America.',
  'Nori is made from red algae, pressed and dried into sheets like paper.',
  'British scientist Kathleen Drew-Baker’s research on nori’s life cycle saved Japan’s nori farms. Fishermen in Uto, Kumamoto honour her as the “Mother of the Sea”.',
  'Tamagoyaki is rolled from many thin layers of egg in a rectangular pan.',
  'In 2019 a 278 kg bluefin tuna sold for ¥333.6 million at Tokyo’s New Year auction.',
  'Tokyo’s famous fish market moved from Tsukiji to Toyosu in 2018.',
  'Eel is traditionally eaten on the midsummer “Day of the Ox” (Doyo no Ushi no Hi) for stamina.',
  'Ikura (salmon roe) takes its name from the Russian word “ikra”, meaning fish roe.',
  'Gunkan-maki means “battleship roll”. It’s said to have been invented at Kyubey in Ginza around 1941.',
  'Inari sushi is named after the god Inari, whose fox messengers are said to love fried tofu.',
  'It’s perfectly polite to eat nigiri with your fingers.',
  'Dip nigiri fish-side down into soy sauce so the rice doesn’t fall apart.',
  'Conveyor-belt sushi was invented in Osaka in 1958 by Yoshiaki Shiraishi, inspired by a beer-bottling line.',
  'Edomae sushi used fish from Tokyo Bay, often cured, marinated or simmered, because there was no refrigeration.',
  '“Omakase” means “I’ll leave it to you”: the chef chooses what you eat.',
  'Kappa maki (cucumber roll) is named after the kappa, a water spirit said to love cucumbers.',
  'Sushi rice is seasoned with rice vinegar, sugar and salt, then fanned until it shines.',
  'Sushi apprentices traditionally spent years on rice and cleaning before touching the fish.',
  'Fish for raw sushi is often frozen first: food-safety rules in many countries require it to kill parasites.',
  'Sakura shrimp are fished commercially in Japan only in Suruga Bay, below Mount Fuji.',
  'Tofu came to Japan from China over a thousand years ago.',
  'Legend says the Margherita pizza was named after Queen Margherita of Italy in 1889.',
  'A Neapolitan pizza bakes in about 60 to 90 seconds in a very hot wood-fired oven.',
  'The hamburger is named after the German city of Hamburg.',
  'In the UK, Shrove Tuesday is also called Pancake Day.',
  '“Döner” means “turning” in Turkish, after the rotating spit the meat cooks on.',
  'In 2013 Antep baklava became the first Turkish product registered as an EU protected geographical indication.',
  'Lahmacun is often eaten rolled up with parsley and a squeeze of lemon.',
  'Turkish tea is served in small tulip-shaped glasses.',
  'Avocado in sushi spread around the world with the California roll.',
  'Japanese short-grain rice is sticky enough to hold its shape when pressed.',
  'Sushi chefs keep a damp cloth nearby to wipe the knife between cuts for clean slices.',
  'Soy sauce came to Japan from China, and Japanese makers have been brewing it for centuries.',
];

// ================================================================ story choices

export interface Choice { id: string; afterChapter: number; title: string; question: string; options: { id: string; label: string; effect: string; line: string }[] }

/** Choices at the end of chapters 2 and 3: they change later scenes, bosses and rewards. */
export const CHOICES: Choice[] = [
  {
    id: 'ch2', afterChapter: 1, title: 'The street remembers', question: 'Two groups want you on their side before the night market opens.',
    options: [
      { id: 'street', label: '🏮 The street stall chefs', effect: '+10% restaurant tips forever', line: 'The street stall chefs keep their promise: every night they send hungry customers your way.' },
      { id: 'market', label: '🌙 The night market', effect: 'Chapter 3 & 4 chefs help you more often', line: 'The night market whispers your name. Its chefs slip you secret ingredients mid-order.' },
    ],
  },
  {
    id: 'ch3', afterChapter: 2, title: 'Kaito’s offer', question: 'Grand Chef Kaito offers to coach you for the Grand Tournament.',
    options: [
      { id: 'mentor', label: '🧑‍🏫 Train with Kaito', effect: 'Chapter 4 bosses attack 25% less', line: 'Kaito watches from the front row, nodding at every clean cut. The tournament chefs eye you warily.' },
      { id: 'solo', label: '🔥 Go it alone', effect: '+25% coins in chapter 4 (but they’re faster)', line: 'You walk in alone. The crowd loves an underdog, and the chefs smell blood.' },
    ],
  },
];

// ================================================================ what rival chefs remember

export const MEMORY_LINES = {
  beatMe: ['Last time you beat me with a {combo}-combo. Not today.', 'You again? I’ve been practising since you beat me.', 'I still dream about your last order. Nightmares.', 'Beat me {w} times already? This one’s mine.'],
  beatYou: ['I’ve beaten you {l} times. Make it {l1}?', 'Back for more? Last time you only reached {h} layers.', 'Your last roll fell at {h}. I remember.'],
  away: ['It’s been {days} days! Did you forget about me?', 'Long time no see, chef. Rusty?'],
};

export function memoryLine(log: { w: number; l: number; combo: number; h: number; at: number }, pick: number): string {
  const days = Math.floor((Date.now() - log.at) / 86_400_000);
  const times = (n: number) => `${n} time${n === 1 ? '' : 's'}`;
  const fill = (s: string) => s.replace('{w} times', times(log.w)).replace('{l} times', times(log.l)).replace('{combo}', String(log.combo)).replace('{w}', String(log.w)).replace('{l1}', String(log.l + 1)).replace('{l}', String(log.l)).replace('{h}', String(log.h)).replace('{days}', String(days));
  if (days >= 5) return fill(MEMORY_LINES.away[pick % MEMORY_LINES.away.length]);
  // The combo line only makes sense after a real combo.
  if (log.w > log.l) return fill(MEMORY_LINES.beatMe[log.combo >= 3 ? pick % MEMORY_LINES.beatMe.length : 1 + (pick % (MEMORY_LINES.beatMe.length - 1))]);
  return fill(MEMORY_LINES.beatYou[pick % MEMORY_LINES.beatYou.length]);
}
