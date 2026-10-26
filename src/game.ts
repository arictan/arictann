import { FONT } from './font';
import { Capacitor } from '@capacitor/core';
import { beatOffset, cue, isAsmr, setAsmr, sfx, songNote, unlockAudio, setMuted } from './audio';
import { askForReminders, haptic, hapticFeel, save, scheduleReminder, setHaptics } from './platform';
import { babble, setMusic, setMusicIntensity, setTrack, setVoices, type TrackId } from './audio';
import { COMPANIONS, STICKER_SETS, SET_REWARD, ALBUM_REWARD, companionLevel, nekoBlocks, rollSticker, stickerRarity, RESTAURANTS } from './collect';
import { HOLIDAY_GOAL, PASS_TIERS, PASS_XP, RACE_GOAL, RACE_POOL, TOUR_GOALS, crewWeek, cupWeekend, currentHoliday, currentSeason, currentTour, raceFinishers, seeded, timeLeft, type Reward } from './live';
import { PRODUCTS, buyReal, monetize, nativeAds, showRewardedAd, type ProductId } from './monetize';
import { shareClip, type Challenge } from './share';
import { submitScore } from './services';
import { STORY_LEVELS, PIECES_FOR, Progress, RECIPE_GOAL, STREAK_REWARDS, WEEKLY_GOALS, dayKey, daySeed, missionText, weekKey, type MissionKind, starsNeeded } from './progress';
import { THEMES, drawBackdrop, drawHolidayOverlay, makeSpecks, type Theme } from './themes';
import { settings } from './settings';
import { t, t as tr } from './i18n';
import { track, trackRetention } from './analytics';
import { cfg, loadConfig } from './config';
import { ClipRecorder } from './clips';
import { type RestCode } from './restaurant';
import { NEMESIS_AT, NEMESIS_TAUNTS, QUEST_STAGES, currentQuest } from './compete';
import { MODS, RESCUES, TOWER_FLOORS, towerFloors, type Mod } from './modes';
import { type MiniGame } from './minigames';
import { SECRETS, worldFor, worldStarts, type WorldId } from './cuisine';
import { announce } from './a11y';
import { COMBOS, FEEL, LANDMARKS, METERS_PER_LAYER, comboFor, drawSky, landmarkFor, skyZone } from './feel';
import { TRIVIA, memoryLine } from './book';
import { SAKE_LINES, drawSake } from './mascot';
import { dailyNumber } from './daily';
import { DEFAULT_BOSS, type BossDesign } from './bossmaker';
import { type DinerState, type GuestType } from './diner';
import { logoText } from './intro';
import { REGULARS, avatarChef, chapterFor, heartLevel, type Chapter } from './meta';
import { BOOSTERS, CATALOG, EFFECTS, SETS, TABS, drawFlag, drawPlate, drawShape, type BoosterId, type Cat, type Cosmetic, type Ingredient, type Item, type Shape } from './shop';
import { CHEFS, chefFor, drawChef, drawKnife, type Attack, type Chef, type Help, type Holding, type Mood } from './chef';
import { screensMethods } from './game/screens';
import { dinerMethods } from './game/diner';
import { clarityMethods } from './game/clarity';
import { standoutMethods } from './game/standout';

// The world is always 400 units wide; height follows the screen's aspect ratio.
// World y grows downward; the plate sits at y = 0 and the stack grows toward negative y.
export const WORLD_W = 400;
export const LAYER_H = 24;
export const BASE_W = 200;
export const WIDE_W = 260; // starting width with the Wide Base booster
export const PERFECT_TOL = 5; // drops this close to the layer below snap into place
export const TIGHT_TOL = 3; // perfect window for chefs with the "precise" rule
export const REGROW = 8; // width regained per perfect once a streak reaches 3
export const GRAVITY = 1400;
export const MAP_ROW = 118; // vertical spacing of chefs on the journey map


/** Colour-blind mode: a symbol for every ingredient, with an ink that reads on its colour. */
export const SYMBOLS: Record<Ingredient, [string, string]> = {
  rice: ['○', '#7a6a4a'], nori: ['■', '#cfe3c4'], salmon: ['▲', '#5a1f0a'], tuna: ['◆', '#ffe0e4'],
  avocado: ['♣', '#2c3d0a'], cucumber: ['+', '#0e2a12'], egg: ['●', '#6a4a00'], ebi: ['~', '#5a1f0a'],
  unagi: ['≡', '#ffd9b0'], tofu: ['□', '#6a5a3a'], ikura: ['✱', '#4a0e00'],
  dough: ['○', '#6a4a10'], sauce: ['~', '#ffe0e0'], cheese: ['◦', '#6a4a00'], pepperoni: ['●', '#ffd0c0'], basil: ['♣', '#e0ffe0'],
  bun: ['○', '#4a2a10'], patty: ['■', '#ffd9b0'], lettuce: ['♣', '#1a3a0a'], tomato: ['●', '#ffe0e0'], cheddar: ['▲', '#5a3a00'],
  pancake: ['○', '#5a3a10'], butter: ['□', '#6a5a00'], syrup: ['~', '#ffd9b0'], berry: ['●', '#e0e0ff'], cream: ['◦', '#7a6a5a'],
  lavash: ['○', '#6a4a20'], doner: ['≡', '#ffd9b0'], onion: ['◦', '#6a3a7a'], yufka: ['≈', '#6a4a10'], pistachio: ['♦', '#1a3a0a'], mince: ['■', '#ffd0c0'],
};

export const COLORS: Record<Ingredient, string> = {
  rice: '#f6f1e4',
  nori: '#24321f',
  salmon: '#ff8a5b',
  tuna: '#d7263d',
  avocado: '#9bc53d',
  cucumber: '#3f8f4a',
  egg: '#ffcf3f',
  ebi: '#ff9e7a',
  unagi: '#7a3f1d',
  tofu: '#f3e7cc',
  ikura: '#ff5a1f',
  dough: '#e9c46a', sauce: '#c1121f', cheese: '#ffd166', pepperoni: '#9d0208', basil: '#2a9d5c',
  bun: '#d4a056', patty: '#5a3a22', lettuce: '#80b918', tomato: '#e63946', cheddar: '#f4a300',
  pancake: '#e2b26c', butter: '#fff3b0', syrup: '#8b4513', berry: '#5e60ce', cream: '#fdf6ec',
  lavash: '#ead7a8', doner: '#8b4a2b', onion: '#f1e4f3', yufka: '#f0d58c', pistachio: '#8fbf5a', mince: '#7a3b2e',
};

/**
 * Ingredients unlocked further along the journey, each with its own twist:
 * Ebi arrives a little narrower but a PERFECT on it counts double for the combo;
 * Unagi is slippery and slides on a little after you tap; Tofu wobbles as it moves;
 * Ikura pops into bonus coins on a PERFECT.
 */
export const NEW_INGREDIENTS: { kind: Ingredient; level: number; name: string; tip: string }[] = [
  { kind: 'ebi', level: 8, name: 'Ebi (shrimp)', tip: 'Arrives a bit narrower, but a PERFECT counts double for your combo!' },
  { kind: 'unagi', level: 15, name: 'Unagi (eel)', tip: 'Slippery! It slides on a little after you tap. Drop it early.' },
  { kind: 'tofu', level: 25, name: 'Tofu', tip: 'Wobbly! Its speed jiggles as it moves. Watch the rhythm.' },
  { kind: 'ikura', level: 35, name: 'Ikura (salmon roe)', tip: 'A PERFECT pops it into bonus coins!' },
];

export interface Recipe { name: string; pattern: Ingredient[]; level?: number; world?: WorldId; secret?: boolean }

export const RECIPES: Recipe[] = [
  { name: 'Salmon Maki', pattern: ['rice', 'nori', 'salmon'] },
  { name: 'Tamago Tower', pattern: ['rice', 'egg', 'nori'] },
  { name: 'Tuna Classic', pattern: ['rice', 'tuna', 'avocado'] },
  { name: 'Green Roll', pattern: ['rice', 'cucumber', 'avocado', 'nori'] },
  { name: 'Rainbow Roll', pattern: ['rice', 'salmon', 'tuna', 'egg', 'avocado', 'cucumber'] },
  { name: 'Ebi Tempura Roll', pattern: ['rice', 'ebi', 'avocado', 'nori'], level: 8 },
  { name: 'Unagi Dragon Roll', pattern: ['rice', 'unagi', 'avocado', 'cucumber'], level: 15 },
  { name: 'Inari Tofu Stack', pattern: ['rice', 'tofu', 'egg'], level: 25 },
  { name: 'Ikura Gunkan', pattern: ['rice', 'nori', 'ikura'], level: 35 },
  { name: 'Deluxe Omakase', pattern: ['rice', 'ebi', 'unagi', 'tofu', 'ikura', 'salmon'], level: 45 },
  // Pizza world (from level 101).
  { name: 'Margherita', pattern: ['dough', 'sauce', 'cheese', 'basil'], level: 101, world: 'pizza' },
  { name: 'Pepperoni Tower', pattern: ['dough', 'sauce', 'pepperoni', 'cheese'], level: 101, world: 'pizza' },
  { name: 'Quattro Stack', pattern: ['dough', 'cheese', 'sauce', 'cheese', 'basil', 'pepperoni'], level: 115, world: 'pizza' },
  // Burger world (from level 151).
  { name: 'Classic Burger', pattern: ['bun', 'patty', 'cheddar', 'lettuce', 'tomato'], level: 151, world: 'burger' },
  { name: 'Double Cheese', pattern: ['bun', 'patty', 'cheddar', 'patty', 'cheddar'], level: 151, world: 'burger' },
  { name: 'Garden Deluxe', pattern: ['bun', 'lettuce', 'tomato', 'patty', 'lettuce'], level: 165, world: 'burger' },
  // Pancake world (from level 201).
  { name: 'Butter Stack', pattern: ['pancake', 'butter', 'pancake', 'syrup'], level: 201, world: 'pancake' },
  { name: 'Berry Cloud', pattern: ['pancake', 'cream', 'berry', 'pancake'], level: 201, world: 'pancake' },
  { name: 'Grand Brunch', pattern: ['pancake', 'butter', 'syrup', 'berry', 'cream', 'pancake'], level: 215, world: 'pancake' },
  // Turkish world (from level 251).
  { name: 'Döner Dürüm', pattern: ['lavash', 'doner', 'tomato', 'onion', 'lettuce'], level: 251, world: 'turkish' },
  { name: 'Lahmacun', pattern: ['dough', 'mince', 'tomato', 'onion'], level: 251, world: 'turkish' },
  { name: 'Baklava Tower', pattern: ['yufka', 'pistachio', 'yufka', 'syrup', 'yufka', 'pistachio'], level: 265, world: 'turkish' },
  { name: 'İskender', pattern: ['lavash', 'doner', 'sauce', 'butter'], level: 275, world: 'turkish' },
  // Secret recipes from the Recipe Lab (in the order pool once discovered).
  ...SECRETS.map((sc) => ({ name: sc.name, pattern: ['rice', ...sc.combo.filter((c) => c !== 'rice')] as Ingredient[], secret: true })),
];

/** Emoji for each recipe on the restaurant menu board. */
export const DISH_EMOJI: Record<string, string> = {
  'Salmon Maki': '🍣', 'Tamago Tower': '🍳', 'Tuna Classic': '🐟', 'Green Roll': '🥒', 'Rainbow Roll': '🌈',
  'Ebi Tempura Roll': '🍤', 'Unagi Dragon Roll': '🐉', 'Inari Tofu Stack': '🍙', 'Ikura Gunkan': '🔴', 'Deluxe Omakase': '🍱',
  Margherita: '🍕', 'Pepperoni Tower': '🍕', 'Quattro Stack': '🧀', 'Classic Burger': '🍔', 'Double Cheese': '🍔', 'Garden Deluxe': '🥬',
  'Butter Stack': '🥞', 'Berry Cloud': '🫐', 'Grand Brunch': '🥞', 'Döner Dürüm': '🌯', Lahmacun: '🫓', 'Baklava Tower': '🍯', 'İskender': '🥙', ...Object.fromEntries(SECRETS.map((sc) => [sc.name, sc.emoji])),
};
export const BASIC_RECIPES = RECIPES.filter((r) => !r.level); // always available (puzzles, missions)
export const FEEL_KINDS = Object.keys(FEEL) as Ingredient[]; // note order for the run's song

export type SpecialLayer = 'golden' | 'ice' | 'wasabi' | 'mystery';

export interface Layer {
  x: number; // left edge
  y: number; // top edge
  w: number;
  kind: Ingredient;
  origin: number; // world x where this layer's texture is anchored, so trimming never shifts it
  special?: SpecialLayer; // rare layers that change the drop (see spawnMoving)
  fancy?: boolean; // a "fancy cut": landed during a 5+ PERFECT streak
  twin?: boolean; // two halves that slide together (tap when they meet)
}

/** Layers placed of one ingredient to master it (mastered ingredients turn gold and pay a little extra). */
export const MASTERY = 100;

export type RunMode = 'journey' | 'special' | 'zen' | 'time' | 'puzzle' | 'challenge' | 'critic' | 'gauntlet' | 'rescue' | 'tower' | 'modchal' | 'pnp' | 'daily' | 'relay' | 'asmr' | 'custom';

export const FEVER_TIME = 5; // seconds of Fever after every 10 PERFECTs in a row
export const TIME_ATTACK = 60; // seconds
export const HEIGHT_MILESTONES = [50, 100, 250, 500, 1000];
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

/** Perks offered after each boss (pick 1 of 3); they last for the rest of the run and stack. */
export type PerkId = 'wide' | 'magnet' | 'coins' | 'steady' | 'shield' | 'regrow' | 'fever' | 'chance' | 'tips' | 'stickers';
export const PERKS: Record<PerkId, { icon: string; name: string; desc: string }> = {
  wide: { icon: '🍙', name: 'Bigger Rolls', desc: 'Your roll grows 20 wider, and so does its maximum' },
  magnet: { icon: '🧲', name: 'Sharp Eye', desc: 'PERFECT zone +2' },
  coins: { icon: '💰', name: 'Big Tipper', desc: '+15% coins for the rest of the run' },
  steady: { icon: '🐢', name: 'Calm Hands', desc: 'The next 5 layers move slowly' },
  shield: { icon: '🛡️', name: 'Bodyguard', desc: 'Blocks the next 2 chef attacks' },
  regrow: { icon: '🌱', name: 'Quick Regrowth', desc: 'PERFECT streaks regrow the roll faster' },
  fever: { icon: '🔥', name: 'Hot Kitchen', desc: 'Fever starts 2 PERFECTs sooner' },
  chance: { icon: '❤️', name: 'Lucky Charm', desc: 'One free Second Chance' },
  tips: { icon: '🤝', name: 'Charming', desc: 'Chefs help you 50% more often' },
  stickers: { icon: '🎴', name: 'Collector', desc: '+1 sticker pack per chef beaten' },
};

/** Features open up as the journey goes on, so new players aren't shown everything at once. */
export const UNLOCKS: { id: string; level: number; name: string; desc: string }[] = [
  { id: 'shop', level: 2, name: 'Shop', desc: 'Spend coins on boosters, plates, flags, sushi sets and effects' },
  { id: 'gift', level: 2, name: 'Daily Gift & Missions', desc: 'Come back every day, and finish missions to raise your Chef Rank' },
  { id: 'modes', level: 3, name: 'Game Modes', desc: 'Zen, Time Attack, 40 puzzles, the Daily Special and friend challenges' },
  { id: 'map', level: 3, name: 'Chef Journey Map', desc: 'See every chef and replay them for 3 stars' },
  { id: 'events', level: 4, name: 'Events', desc: 'World Tour, holidays, the daily race, the weekend cup and your crew' },
  { id: 'restaurant', level: 3, name: 'Grandma’s Restaurant', desc: 'Build it up with ★, cook dishes from your runs and serve guests' },
  { id: 'daily', level: 4, name: 'Daily Roll', desc: 'The same layers for everyone today. One try, then share your grid!' },
  { id: 'more', level: 6, name: 'Pass, Companions & Album', desc: 'The Sushi Pass, sous-chef companions, stickers and more' },
  { id: 'book', level: 6, name: 'Grandma’s Book', desc: 'Her letters, real recipes, the seasons and sushi facts' },
  { id: 'relay', level: 7, name: 'Relay & ASMR Kitchen', desc: 'Two players on one tower, or a calm kitchen with no game over' },
  { id: 'rescue', level: 8, name: 'Rescue Levels', desc: 'Save grandma’s stall from floods, quakes and storms' },
  { id: 'world', level: 8, name: 'Tower of the World', desc: 'Everyone’s layers in one daily tower, and the Country Cup' },
  { id: 'modchals', level: 9, name: 'Modifiers', desc: 'Mirror, blind, tiny, double speed and twins' },
  { id: 'tower', level: 10, name: 'Omakase Tower', desc: '50 floors a week, a twist on every floor' },
  { id: 'minis', level: 11, name: 'Mini-games', desc: 'Knife Throw, Rice Rhythm and Fish Catch' },
  { id: 'bossmaker', level: 12, name: 'Boss Chef Maker', desc: 'Design a boss chef and dare your friends to beat it' },
  { id: 'gauntlet', level: 14, name: 'Gauntlet', desc: 'Boss after boss, no breaks' },
  { id: 'table', level: 14, name: 'Table Mode', desc: 'Play over your camera, on your real table' },
];

/** Puzzle p (0-based): fixed layer count, width and speed, with a slice budget. */
export function puzzleConfig(p: number) {
  return {
    layers: 8 + Math.floor(p / 4),
    width: Math.max(110, 200 - p * 2.5),
    speed: 150 + p * 7,
    maxSlices: Math.max(1, 6 - Math.floor(p / 7)),
    wobble: p >= 20 && p % 3 === 0,
  };
}
export const PUZZLES = 40;

export interface Piece extends Layer { vx: number; vy: number; rot: number; spin: number }

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; shape?: Shape; rot?: number }

export interface Popup { x: number; y: number; text: string; life: number; max: number; color: string; size: number }

export interface Order { recipe: Recipe; length: number; start: number; reward: number; who?: number; request?: boolean }

// Things the chef throws. Coordinates are world units.
export interface Projectile { kind: 'knife' | 'patty'; x: number; y: number; vx: number; vy: number; rot: number; target: Layer | null; dodged: boolean }

export interface Splat { x: number; y: number; r: number; life: number; seed: number } // screen units

export const ATTACK_INFO: Record<Attack, { label: string; line: string; windup: number }> = {
  flurry: { label: 'KNIFE FLURRY!', line: 'RAAAGH!', windup: 1.1 },
  steal: { label: 'SNEAKY BITE!', line: 'Just a little taste...', windup: 0.9 },
  flip: { label: 'SPEED FLIP!', line: 'Other way! Faster!', windup: 0.8 },
  frost: { label: 'FREEZER BLAST!', line: 'Chill out!', windup: 0.9 },
  knife: { label: 'KNIFE THROW!', line: 'Catch this!', windup: 1.0 },
  slam: { label: 'TABLE SLAM!', line: 'Hmph!', windup: 0.9 },
  splat: { label: 'SOY SPLASH!', line: 'Oops, soy sauce!', windup: 0.7 },
};

export const HELP_INFO: Record<Help, { label: string; line: string }> = {
  slow: { label: 'STEADY HANDS!', line: 'Take your time.' },
  patch: { label: 'PATCH UP!', line: 'Let me fix that!' },
  tip: { label: 'TIP!', line: 'For you!' },
};

export type Mode = 'title' | 'playing' | 'dead' | 'shop' | 'map' | 'album' | 'modes' | 'events' | 'more' | 'restaurant' | 'pass' | 'pets' | 'boards' | 'avatar' | 'regulars' | 'story' | 'trophies' | 'gallery' | 'settings' | 'visit' | 'museum' | 'profile' | 'calendar' | 'league' | 'quest' | 'rescues' | 'towerview' | 'minis' | 'mini' | 'modchals' | 'lab' | 'jukebox' | 'daily' | 'bossmaker' | 'book' | 'promise' | 'world' | 'countries' | 'collection' | 'diagnostics' | 'funnel';
export type AlbumTab = 'chefs' | 'stickers' | 'recipes' | 'records';

export interface Button { x: number; y: number; w: number; h: number; onTap: () => void; label?: string }

/** Who sits at a counter seat in the restaurant. */
export interface SeatGuest { kind: 'local' | 'chef' | 'golden' | 'request'; emoji: string; type: GuestType; lv?: number; req?: string }

export interface Insets { top: number; right: number; bottom: number; left: number }

export class Game {
  ctx: CanvasRenderingContext2D;
  scale = 1; // CSS pixels per world unit
  offX = 0; // world units of empty space left of the play area on wide screens
  viewH = 700; // world units visible vertically
  dpr = 1;
  insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

  mode: Mode = 'title';
  paused = false;
  time = 0;

  stack: Layer[] = [];
  moving: Layer | null = null;
  moveDir = 1;
  pieces: Piece[] = [];
  particles: Particle[] = [];
  popups: Popup[] = [];
  flags: { x: number; y: number; hue: number }[] = []; // picks marking each served order
  specks = makeSpecks(70);
  themeOrder = THEMES.map((_, i) => i);
  themeIdx = 0;
  prevTheme: Theme | null = null; // fading out after a scene change
  fade = 1;

  order!: Order;
  ordersServed = 0;
  camY = 0;
  shake = 0;
  flash = 0;
  combo = 0;
  runCoins = 0;
  best = save.best();
  bank = save.coins();
  muted = save.muted();
  newBest = false;
  deadAt = 0;

  // Shop and rewards.
  boosters: Record<string, number> = save.boosters();
  owned = Object.fromEntries((Object.keys(CATALOG) as Cosmetic[]).map((c) => [c, save.owned(c, CATALOG[c][0].id)])) as Record<Cosmetic, string[]>;
  equip = Object.fromEntries((Object.keys(CATALOG) as Cosmetic[]).map((c) => [c, save.equipped(c, CATALOG[c][0].id)])) as Record<Cosmetic, string>;
  baseW = BASE_W;
  // Boosters active this run.
  doubleCoins = false;
  slowStart = false;
  magnet = false;
  shield = false;
  lucky = false;
  shortOrders = false;
  chanceUsed = false;
  buttons: Button[] = [];
  shopFrom: Mode = 'title';
  shopTab: Cat = 'booster';
  shopScroll = 0;
  shopMaxScroll = 0;
  drag: { x: number; y: number; startScroll: number; moved: boolean } | null = null;
  shopSel: string | null = null; // cosmetic waiting for a confirming second tap
  toast: { text: string; life: number } | null = null;

  // Boss chef for the current level. One level = one order.
  chefX = 60;
  chefSide = -1; // -1 = left edge, 1 = right edge; the chef walks across now and then
  sinceSwitch = 0;
  dish: { recipe: Recipe; t: number; from: { x: number; y: number }; side: number; look: number; ate: boolean; who?: number } | null = null; // served-order animation
  reaction: { mood: Mood; life: number } | null = null;
  bubble: { text: string; life: number } | null = null;
  introIn = 0; // seconds until the next chef is announced
  event: { kind: Attack | Help; bad: boolean; t: number } | null = null; // chef winding up an attack or a favour
  sinceEvent = 0; // drops since the chef last did something
  steady = 0; // drops left at half speed (Steady Hands)
  projectiles: Projectile[] = [];
  splats: Splat[] = [];
  banner: { title: string; sub: string; life: number } | null = null; // "LEVEL 3" when a new boss arrives

  // Long-term progress: journey, missions, collections, records.
  progress = new Progress(BASIC_RECIPES.map((r) => r.name));
  startLevel = 1; // the chef this run started on
  specialWon = false;
  gated = 0; // stars needed at the gate that ended this run (0 = none)
  easy = false; // gentler start after several quick losses in a row
  orderStats = { drops: 0, perfects: 0, slices: 0 };
  toastQueue: string[] = [];
  mapScroll = 0;
  albumScroll = 0;
  listMax = 0; // max scroll for the map or album, set while drawing
  albumTab: AlbumTab = 'chefs';

  // Run variety.
  runMode: RunMode = 'journey';
  seed = 1; // every run is seeded, so challenge codes can replay the same chefs and events
  rand: () => number = Math.random;
  challenge: Challenge | null = null;
  puzzle = 0;
  timeLeft = 0; // Time Attack countdown
  fever = 0; // seconds of Fever left
  slowmo = 0; // seconds of slow motion left (after PERFECT streaks)
  freeChance = false; // Second Chance from an 8+ win streak
  revived = false; // used the continue-after-ad this run
  doubled = false; // used the double-coins ad this run
  bankedRunCoins = 0; // coins from this run already added to the bank (a revive can end a run twice)
  milestonesHit = new Set<number>();
  resultKind: 'lost' | 'special' | 'gate' | 'zen' | 'time' | 'puzzle-won' | 'puzzle-lost' | 'challenge' | 'rescue-won' | 'rescue-lost' | 'daily' | 'relay' = 'lost';

  // Companions active this run.
  nekoLeft = 0;
  tanukiLeft = 0;
  owlLayers = 0;
  foxBonus = 0;
  swanLeft = 0;

  // Overlays and celebrations.
  celebration: { title: string; sub: string; t: number } | null = null;
  confetti: { x: number; y: number; vx: number; vy: number; rot: number; color: string; life: number }[] = [];
  adOverlay: { t: number; label: string; onReward: () => void } | null = null;
  buyOverlay: ProductId | null = null;
  shareOverlay: { image: HTMLCanvasElement; code: string; ghost: string } | null = null;
  setDetail: number | null = null; // sticker set shown full-size in the album
  pageScroll = 0; // scroll position for the other scrolling screens
  codeInput: HTMLInputElement | null = null;
  screenBack: Mode = 'title'; // where BACK goes from the newer screens

  // Depth update: perks, rage, coaching, booster picker.
  perks: Partial<Record<PerkId, number>> = {};
  perkChoice: PerkId[] | null = null; // three perks waiting for the player to pick one
  shieldHits = 0;
  rage = 0; // boss rage phase this order: 0 none, 1 rage, 2 final fury
  flurryLeft = 0;
  flurryT = 0;
  tip: { title: string; text: string; t: number } | null = null; // coaching card
  picker: { level: number; mode: RunMode; opts: { puzzle?: number; challenge?: Challenge; rescue?: number; mods?: Mod[] }; picked: Set<BoosterId> } | null = null;
  picked: Set<BoosterId> | null = null; // boosters chosen for the current run

  // Personality update: story overlay, achievement check timer.
  story: { ch: Chapter; lines: string[]; end: boolean; choice?: string } | null = null;
  storyQueue: { ch: Chapter; lines: string[]; end: boolean; choice?: string }[] = [];
  achT = 0;

  // Platform update: highlight clips, the last clip, save codes.
  clips: ClipRecorder;
  clip: File | null = null;
  saveCode = '';
  criticStars = 0;
  // Gameplay update: flip and frost attacks, sous-chef bonus rounds, weather, PERFECT tracking.
  flipT = 0;
  frost = 0;
  bonus: { left: number; ok: boolean } | null = null;
  weather: { kind: 'wind' | 'rain'; dir: number } | null = null;
  lastPerfect = false;
  nemesisLevelCached = 0;
  // Modes update: run modifiers, twin layers, rescue levels, the tower, mini-games.
  mods = new Set<Mod>();
  twinPhase = 0;
  twinSep = 0;
  rescueRun: { i: number; water: number; t: number; tremor: number; margin: number } | null = null;
  towerStart = 1; // floor the current tower run started on
  mini: MiniGame | null = null;
  miniPaid = false;
  modChal: Mod | null = null;
  friendGhost: [number, number][] | null = null; // shape of a friend's run from a ghost code
  confirmBox: { title: string; text: string; ok: string; go: () => void } | null = null;
  // Intro: logo on every launch; the story panels only the first time.
  intro: { stage: 'logo' | 'story'; t: number; prev: number; panel: number; full: boolean } | null = null;
  upgradeFx: { i: number; t: number } | null = null; // sparkle on a just-upgraded restaurant area

  constructor(public canvas: HTMLCanvasElement, public safeProbe: HTMLElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');
    this.ctx = ctx;
    setMuted(this.muted);
    this.resize();
    this.reset();
    this.progress.visit();
    setHaptics(settings.haptics);
    setTrack(settings.track as TrackId);
    setVoices(settings.voices);
    this.clips = new ClipRecorder(canvas);
    void loadConfig();
    // ?nointro skips it (used by automated tests).
    if (!location.search.includes('nointro')) this.intro = { stage: 'logo', t: 0, prev: 0, panel: 0, full: !this.progress.seen.includes('intro') };
    track('app_open', { level: this.progress.unlocked, lang: settings.lang });
    this.scheduleTipReminder();
    this.checkLeague();
    trackRetention();
    // Only brand-new players get the guided first day.
    if (this.progress.guide < 0) {
      this.progress.guide = this.progress.unlocked > 2 || (this.progress.stats.served ?? 0) > 2 ? 99 : 0;
      this.progress.persist();
    }
    this.pushWidget();
    new ResizeObserver(() => this.resize()).observe(canvas);
    // On scrolling screens (shop, map, album) a tap fires on release, so lists can be dragged;
    // everywhere else it fires on press.
    canvas.addEventListener('pointerdown', (e) => {
      if (this.scrolling) this.drag = { x: e.clientX, y: e.clientY, startScroll: this.scrollPos, moved: false };
      else this.onTap(e.clientX, e.clientY);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const dy = (e.clientY - this.drag.y) / this.scale;
      if (Math.abs(dy) > 8) this.drag.moved = true;
      if (this.drag.moved) this.scrollPos = this.drag.startScroll - dy;
    });
    canvas.addEventListener('pointerup', () => {
      if (this.drag && !this.drag.moved) this.onTap(this.drag.x, this.drag.y);
      this.drag = null;
    });
    canvas.addEventListener('wheel', (e) => {
      if (this.scrolling) this.scrollPos += e.deltaY / this.scale;
    }, { passive: true });
    // Space or Enter also drops, for keyboard players on desktop.
    // Tilting the phone nudges a tall tower's sway (where the browser allows it without asking).
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma === null) return;
      this.tilt += (Math.max(-1, Math.min(1, e.gamma / 35)) - this.tilt) * 0.2;
    });
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat && !this.scrolling) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        this.onTap(rect.left + rect.width / 2, rect.top + rect.height * 0.75);
      }
    });
  }

  /** Every screen except the game itself scrolls (and taps fire on release there). */
  get scrolling(): boolean {
    return this.mode !== 'playing' && this.mode !== 'dead' && this.mode !== 'title' && this.mode !== 'mini';
  }

  get scrollPos(): number {
    return this.mode === 'shop' ? this.shopScroll : this.mode === 'map' ? this.mapScroll : this.mode === 'album' ? this.albumScroll : this.pageScroll;
  }

  set scrollPos(v: number) {
    const max = this.mode === 'shop' ? this.shopMaxScroll : this.listMax;
    v = Math.max(0, Math.min(max, v));
    if (this.mode === 'shop') this.shopScroll = v;
    else if (this.mode === 'map') this.mapScroll = v;
    else if (this.mode === 'album') this.albumScroll = v;
    else this.pageScroll = v;
  }

  pause(): void {
    this.pushWidget();
    track('session_end', { screen: this.mode, level: this.progress.unlocked, secs: Math.round(performance.now() / 1000) });
    // One reminder a day at most, pointing at the next chef to beat.
    const lvl = this.progress.playLevel;
    void scheduleReminder('Sushi Stack', this.giftReady() ? 'Your daily gift is ready! 🎁' : `${chefFor(lvl).name} is waiting for you at level ${lvl}.`);
  }

  resize(): void {
    // Lite mode draws at most 2 pixels per point: less than half the pixels of a 3× screen.
    this.dpr = Math.min(window.devicePixelRatio || 1, this.lite ? 2 : 3);
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    // Phones fill the width; wide screens (tablets in a window, desktops) keep at least 640 units of height visible.
    this.scale = Math.min(w / WORLD_W, h / 640);
    this.viewH = h / this.scale;
    this.offX = (w / this.scale - WORLD_W) / 2;
    const cs = getComputedStyle(this.safeProbe);
    this.insets = {
      top: (parseFloat(cs.paddingTop) || 0) / this.scale,
      right: (parseFloat(cs.paddingRight) || 0) / this.scale,
      bottom: (parseFloat(cs.paddingBottom) || 0) / this.scale,
      left: (parseFloat(cs.paddingLeft) || 0) / this.scale,
    };
  }

  // ------------------------------------------------------------------- state

  get height(): number {
    return this.stack.length - 1; // layers placed by the player (the base rice doesn't count)
  }

  get top(): Layer {
    return this.stack[this.stack.length - 1];
  }

  get level(): number {
    return this.startLevel + this.ordersServed;
  }

  /** Story chefs for levels 1-50, then a newly generated chef for every level after that. */
  get chef(): Chef {
    if (this.runMode === 'custom' && this.customChef) return this.customChef;
    return this.journey ? this.chefWithChoices(this.level) : chefFor(this.level);
  }

  react(mood: Mood, life: number, line?: string): void {
    this.reaction = { mood, life };
    if (line) this.bubble = { text: line, life: 1.8 };
  }

  /** How worked up the chef is: rises as the order nears completion. */
  chefMood(): Mood {
    if (this.mode === 'dead') return this.specialWon ? 'happy' : 'angry';
    if (this.event) return this.event.bad ? 'angry' : 'happy';
    if (this.reaction) return this.reaction.mood;
    const left = this.order.length - (this.height - this.order.start);
    const progress = 1 - left / this.order.length;
    if (left <= 1) return 'panic';
    if (progress >= 0.7) return 'intense';
    if (progress >= 0.4) return 'focused';
    return 'calm';
  }

  announceChef(): void {
    const c = this.chef;
    if (this.journey && worldStarts(this.level)) this.worldIntro(worldFor(this.level));
    const nem = this.isNemesis();
    if (this.mode === 'playing') announce(`Level ${this.level}. ${c.name}. ${c.rule}. Tap anywhere to drop the layer.`);
    this.banner = this.runMode === 'modchal' && this.modChal ? { title: `${MODS[this.modChal].icon} ${MODS[this.modChal].name.toUpperCase()}`, sub: MODS[this.modChal].desc, life: 2.4 }
      : this.runMode === 'rescue' ? { title: `🆘 ${RESCUES[this.rescueRun!.i].name.toUpperCase()}`, sub: RESCUES[this.rescueRun!.i].story, life: 3 }
      : this.runMode === 'tower' ? { title: `🗼 FLOOR ${this.towerStart + this.ordersServed}`, sub: this.mods.size ? [...this.mods].map((m) => `${MODS[m].icon} ${MODS[m].name}`).join(' · ') : this.weather ? (this.weather.kind === 'wind' ? '🌬️ Wind' : '🌧️ Rain') : 'No twist on this floor', life: 2.2 }
      : this.runMode === 'custom' ? { title: `🧑‍🍳 ${c.name.toUpperCase()}`, sub: c.rule, life: 2.6 }
      : this.runMode === 'daily' && this.ordersServed === 0 ? { title: `🟩 DAILY ROLL #${dailyNumber()}`, sub: this.dailyPractice ? 'Practice run · same layers as everyone' : 'Same layers for everyone today', life: 2.6 }
      : this.runMode === 'relay' && this.ordersServed === 0 ? { title: '👥 RELAY', sub: 'Take turns: Player 1 first', life: 2.4 }
      : this.runMode === 'asmr' ? { title: '🎧 ASMR', sub: 'Breathe in… and tap', life: 2 }
      : { title: this.runMode === 'critic' ? '🧐 FOOD CRITIC' : this.special ? 'DAILY SPECIAL' : nem ? `😈 NEMESIS · LV ${this.level}` : t('level', this.level), sub: this.runMode === 'critic' ? 'Small PERFECT zone · 2★ for a glowing review' : nem ? `Beat you ${this.progress.losses[this.level]} times · stronger now` : c.rule, life: 2.4 };
    // Rival chefs remember you: your last fight, your best combo, how long you've been away.
    const memo = this.journey && !nem ? this.progress.chefLog[this.level] : undefined;
    this.bubble = { text: nem ? NEMESIS_TAUNTS[this.level % NEMESIS_TAUNTS.length] : memo && memo.f > 0 && Math.random() < 0.75 ? memoryLine(memo, this.level + memo.f) : c.intro, life: 2.6 };
    this.reaction = null;
    this.sinceEvent = 0; // give the player a few drops before the new boss acts
    this.switchSides();
  }

  /** Recipes this level can order: its world's menu, plus discovered secret recipes in sushi worlds. */
  recipePool(level: number): Recipe[] {
    const world = worldFor(level);
    const found = this.progress.secrets;
    const pool = RECIPES.filter((r) => (r.world ?? 'sushi') === world && (r.secret ? found.includes(r.name) : (r.level ?? 0) <= level || world !== 'sushi'));
    return pool.length ? pool : BASIC_RECIPES;
  }

  /** Ingredient colour, recoloured by the equipped sushi set. */
  color(kind: Ingredient): string {
    return SETS.find((x) => x.id === this.equip.set)?.colors[kind] ?? COLORS[kind];
  }

  get theme(): Theme {
    const i = this.themeOrder[this.themeIdx];
    return i < 0 ? this.cityTheme() : THEMES[i];
  }

  cityCache: Theme | null = null;

  /** The current World Tour city as a background (index -1 in the theme rotation). */
  cityTheme(): Theme {
    const { city } = currentTour();
    if (this.cityCache?.id !== city.id) {
      this.cityCache = { id: city.id, name: `World Tour: ${city.name}`, sky: city.sky, counter: '#3a2a2a', counterEdge: city.accent, decor: 'skyline', city: { accent: city.accent, building: city.building, landmark: city.landmark } };
    }
    return this.cityCache;
  }

  reset(): void {
    const x = (WORLD_W - this.baseW) / 2;
    // The base layer matches the world: rice for sushi, dough, bun or a pancake elsewhere.
    const base = ({ sushi: 'rice', pizza: 'dough', burger: 'bun', pancake: 'pancake', turkish: 'lavash' } as const)[worldFor(this.startLevel)];
    this.stack = [{ x, y: -LAYER_H, w: this.baseW, kind: base, origin: x }];
    this.pieces = [];
    this.particles = [];
    this.popups = [];
    this.flags = [];
    this.combo = 0;
    this.runCoins = 0;
    this.ordersServed = 0;
    this.newBest = false;
    this.paused = false;
    this.moveDir = 1;
    this.reaction = null;
    this.bubble = null;
    this.introIn = 0;
    this.event = null;
    this.sinceEvent = 0;
    this.steady = 0;
    this.projectiles = [];
    this.splats = [];
    this.banner = null;
    this.dish = null;
    this.chefSide = -1;
    this.chefX = this.chefHome(-1);
    this.newOrder();
    this.spawnMoving();
    this.camY = this.targetCam();
  }

  /** Level of today's Daily Special chef: the same for everyone on a given day. */
  specialLevel(): number {
    return 5 + (daySeed() % 15);
  }

  /** Retry from the chef that beat you (or today's special). */
  retry(): void {
    if (this.gated) this.openMap();
    else if (this.runMode === 'zen' || this.runMode === 'time') this.startRun(this.progress.playLevel, this.runMode);
    else if (this.runMode === 'asmr') this.startAsmr();
    else if (this.runMode === 'daily') this.startDaily();
    else if (this.runMode === 'relay') this.startRelay();
    else if (this.runMode === 'custom' && this.customBoss) this.startCustom(this.customBoss, this.customFromFriend);
    else if (this.runMode === 'gauntlet') this.startRun(this.startLevel, 'gauntlet');
    else if (this.runMode === 'pnp') this.startPnp(1);
    else if (this.runMode === 'rescue') this.startRescue(this.resultKind === 'rescue-won' ? Math.min(RESCUES.length - 1, this.rescueRun!.i + 1) : this.rescueRun!.i);
    else if (this.runMode === 'tower') this.startTower();
    else if (this.runMode === 'modchal' && this.modChal) this.startModChal(this.modChal);
    else if (this.runMode === 'puzzle') this.startRun(1, 'puzzle', { puzzle: this.resultKind === 'puzzle-won' ? Math.min(PUZZLES - 1, this.puzzle + 1) : this.puzzle });
    else if (this.runMode === 'challenge' && this.challenge) this.startRun(this.challenge.level, 'challenge', { challenge: this.challenge });
    else if (this.runMode === 'critic') this.startCritic();
    else if (this.special) this.startRun(this.specialLevel(), 'special');
    else this.startRun(this.level);
  }

  /** Daily Special and Food Critic runs: one long set order that ends the run when served. */
  get special(): boolean {
    return this.runMode === 'special' || this.runMode === 'critic' || this.runMode === 'modchal' || this.runMode === 'custom';
  }

  /** Runs that use journey progress: they unlock chefs, earn stars and respect star gates. */
  get journey(): boolean {
    return this.runMode === 'journey';
  }

  /** Zen, Time Attack and Puzzles have no chef attacks or help. */
  get calmChefs(): boolean {
    return this.runMode === 'zen' || this.runMode === 'time' || this.runMode === 'puzzle' || this.runMode === 'rescue' || this.runMode === 'relay' || this.runMode === 'asmr';
  }

  /**
   * Starts a run. Journey runs start at a chef level (by default the furthest one open); other modes
   * pick their own setup. Every run is seeded so a challenge code can replay it.
   */
  startRun(level = this.progress.playLevel, mode: RunMode = 'journey', opts: { puzzle?: number; challenge?: Challenge; picked?: Set<BoosterId>; rescue?: number; mods?: Mod[]; seed?: number } = {}): void {
    if (mode === 'journey' && !this.progress.canEnter(level)) {
      this.showToast(`Star gate: ${starsNeeded(level)}★ needed to enter level ${level} (you have ${this.progress.totalStars}★)`);
      return;
    }
    // Choose boosters before the run (they're only used up if picked). Puzzles never use boosters.
    const owned = BOOSTERS.filter((b) => (this.boosters[b.id] ?? 0) > 0);
    if (!opts.picked && mode !== 'puzzle' && owned.length) {
      const last = new Set(this.progress.lastBoosters.filter((id) => owned.some((b) => b.id === id)) as BoosterId[]);
      this.picker = { level, mode, opts, picked: last };
      return;
    }
    this.picked = opts.picked ?? new Set();
    this.mods = new Set(opts.mods ?? []);
    this.modChal = mode === 'modchal' ? (opts.mods?.[0] ?? null) : null;
    this.rescueRun = mode === 'rescue' ? { i: opts.rescue ?? 0, water: LAYER_H * 1.5, t: 0, tremor: 4, margin: 0 } : null;
    if (mode === 'tower') this.towerStart = this.towerState().cp + 1;
    if (!opts.challenge) this.friendGhost = null;
    this.runMode = mode;
    this.challenge = opts.challenge ?? null;
    this.puzzle = opts.puzzle ?? 0;
    this.seed = this.challenge ? this.challenge.seed : opts.seed ?? Math.floor(Math.random() * 2 ** 31);
    this.rand = seeded(this.seed);
    this.startLevel = mode === 'puzzle' ? this.puzzle + 1 : level;
    this.specialWon = false;
    this.gated = 0;
    this.revived = false;
    this.doubled = false;
    this.bankedRunCoins = 0;
    this.milestonesHit.clear();
    this.fever = 0;
    this.slowmo = 0;
    this.timeLeft = mode === 'time' ? TIME_ATTACK : 0;
    this.easy = this.progress.lossStreak >= 3;

    // Boosters bought in the shop are used up here (Second Chance only when it saves you).
    // Puzzles are fixed challenges, so boosters stay in the bag.
    const use = (id: BoosterId) => {
      if (mode === 'puzzle' || !this.boosters[id] || !this.picked!.has(id)) return false;
      this.boosters[id]--;
      return true;
    };
    this.doubleCoins = use('double');
    this.slowStart = use('slow');
    // Later levels start on a narrower roll, down to 140 by level 60.
    const levelW = mode === 'puzzle' ? puzzleConfig(this.puzzle).width : level <= 20 ? BASE_W : Math.max(140, BASE_W - (level - 20) * 1.5);
    // The Big Rice Cooker in your restaurant kitchen starts every run on a wider roll.
    this.baseW = (levelW + (use('wide') ? WIDE_W - BASE_W : 0)) * (this.mods.has('tiny') ? 0.6 : 1) * (mode === 'puzzle' ? 1 : 1 + 0.05 * this.upLv('cooker'));
    this.runStock = 0;
    this.runReqs = 0;
    this.runXpAt = 0;
    this.cheer = null;
    this.song = [];
    this.marks = '';
    this.runMaxCombo = 0;
    if (mode !== 'custom') this.customChef = null;
    if (mode !== 'relay') this.relay = null;
    // ASMR: soft foley instead of game sounds, and no music.
    setAsmr(mode === 'asmr');
    setMusic(mode === 'asmr' ? false : this.musicOn);
    if (this.tableMode) void this.startCamera();
    this.lastBeat = false;
    this.wobbleE = 0;
    this.leanPx = 0;
    this.comboShield = 0;
    this.runCombos = 0;
    this.magnet = use('magnet');
    this.shield = use('shield');
    this.lucky = use('lucky');
    this.shortOrders = use('short');
    const streak = use('streak');
    this.chanceUsed = false;
    save.setBoosters(this.boosters);
    this.perks = {};
    this.perkChoice = null;
    this.bonus = null;
    this.flipT = 0;
    this.frost = 0;
    this.shieldHits = 0;
    this.flurryLeft = 0;

    // Companions.
    const lv = (id: string) => (this.progress.companions.includes(id) ? companionLevel(this.progress.shards[id] ?? 0) : 0);
    this.nekoLeft = lv('neko') ? nekoBlocks(lv('neko')) : 0;
    this.tanukiLeft = lv('tanuki');
    this.owlLayers = lv('owl') * 10;
    this.foxBonus = lv('fox') * 0.05;
    this.swanLeft = Math.ceil(lv('swan') / 2);

    // Each run tours the backgrounds in a fresh order, with the World Tour city first.
    const order = THEMES.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    this.changeTheme(() => { this.themeOrder = [-1, ...order]; this.themeIdx = 0; });

    this.reset();
    this.mode = 'playing';
    if (streak) this.combo = 3;
    if (lv('panda')) this.steady = 2 + lv('panda');

    // Win streak bonuses for journey runs: 3+ hot start, 5+ steady hands, 8+ a free Second Chance.
    const ws = this.journey ? this.progress.winStreak : 0;
    this.freeChance = ws >= 8;
    if (ws >= 3) this.combo = Math.max(this.combo, 3);
    if (ws >= 5) this.steady = Math.max(this.steady, 3);
    this.announceChef();

    const active = [this.doubleCoins && '2x coins', this.slowStart && 'slow start', this.baseW > levelW && 'wide base', this.picked.has('chance') && mode !== 'zen' && 'second chance',
      this.magnet && 'magnet', this.shield && 'shield', this.lucky && 'lucky', this.shortOrders && 'short orders', streak && 'hot streak'].filter(Boolean);
    if (active.length) this.popup(WORLD_W / 2, this.top.y - 76, `Boosters: ${active.join(' · ')}`, '#9fe3ff', 13, 2.2);
    if (ws >= 3) this.popup(WORLD_W / 2, this.top.y - 96, `🔥 Win streak ${ws}: ${ws >= 8 ? 'hot start, steady hands, free Second Chance' : ws >= 5 ? 'hot start + steady hands' : 'hot start'}`, '#ffb703', 13, 2.4);
    if (mode === 'journey' && (level - 1) % 10 === 0) this.queueStory(chapterFor(level), false);
    if (mode === 'challenge' && this.friendEmoji) this.coach(`Your friend says ${this.friendEmoji}`, `Beat ${this.challenge?.score ?? 0} layers to answer back!`, 4);
    track('run_start', { mode, level, boosters: this.picked.size });
    this.clip = null;
    if (settings.clips) this.clips.start();
    if (this.progress.tutorial === 0) this.coach(t('tapDrop'), t('tapDropText'), 8);
    else if (this.progress.tutorial === 1) this.coach(t('aim'), t('aimText'), 6);
  }

  changeTheme(apply: () => void): void {
    this.prevTheme = this.theme;
    apply();
    if (this.prevTheme === this.theme) this.prevTheme = null;
    this.fade = 0;
  }

  addCoins(n: number, x: number, y: number, label: string): void {
    if (this.doubleCoins) n *= 2;
    if (this.fever > 0) n *= 3;
    if (this.zenLike) n *= 0.3;
    if (this.journey && this.level > 30 && this.level <= 40 && this.progress.choices.ch3 === 'solo') n *= 1.25;
    n *= cfg.coinBoost * (this.liveEvent()?.coinMult ?? 1);
    // Chef Rank, the Kitsune companion and finished restaurants all add percentage bonuses.
    const restaurants = this.progress.restaurant.r + this.progress.restaurant.michelin;
    n = Math.max(1, Math.round(n * (this.progress.coinBonus + this.foxBonus + restaurants * 0.05)));
    this.runCoins += n;
    this.popup(x, y, `${label} +${n} coins`, '#ffd34d', 16);
    this.mission('coinsRun', this.runCoins);
  }

  /** Coins that go straight to the bank (mission rewards, chests, gifts), saved immediately. */
  bankCoins(n: number): void {
    if (n > 0) this.progress.stat('coins', n);
    this.bank += n;
    save.setCoins(this.bank);
  }

  mission(kind: MissionKind, amount = 1, recipe?: string): void {
    const st = this.progress;
    switch (kind) {
      case 'perfects': st.stat('perfects'); this.galleryPerfect(); this.leaguePts(1); break;
      case 'serve': st.stat('served'); break;
      case 'dodge': st.stat('dodges'); break;
      case 'flawless': st.stat('flawless'); break;
      case 'streak': st.stat('streak', amount, true); break;
      case 'height': st.stat('height', amount, true); break;
    }
    const { done, rankUp } = this.progress.track(kind, amount, recipe);
    for (const m of done) {
      this.bankCoins(25);
      this.showToast(`✓ ${missionText(m)}  +25`);
      sfx.perfect(5);
      this.earnTokens(2);
      this.addXp(40);
    }
    if (rankUp) {
      const reward = 50 + this.progress.rank * 10;
      this.bankCoins(reward);
      this.celebrate(`CHEF RANK ${this.progress.rank}!`, `+${reward} coins · +5% coins forever`);
      haptic.success();
    }
  }

  /** A free chest for every boss beaten: coins, sometimes a booster, and a piece toward an exclusive. */
  openChest(level: number): void {
    this.maybeTrackDrop();
    const legend = level > STORY_LEVELS && level % 10 === 0;
    const coins = (10 + Math.floor(Math.random() * 25) + level) * (legend ? 2 : 1);
    this.bankCoins(coins);
    const parts = [`+${coins} coins`];
    if (Math.random() < 0.3) {
      const b = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
      this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
      save.setBoosters(this.boosters);
      parts.push(b.name);
    }
    const p = ++this.progress.pieces;
    this.progress.persist();
    if (p === PIECES_FOR.dragon) this.unlockExclusive('plate', 'dragon', 'Dragon Plate');
    else if (p === PIECES_FOR.phoenix) this.unlockExclusive('fx', 'phoenix', 'Phoenix FX');
    else if (p < PIECES_FOR.phoenix) parts.push(`piece ${p}/${p < PIECES_FOR.dragon ? PIECES_FOR.dragon : PIECES_FOR.phoenix}`);
    this.showToast(`Chest: ${parts.join(' · ')}`);
    this.openPacks(legend ? 2 : 1);
  }

  unlockExclusive(cat: Cosmetic, id: string, name: string): void {
    if (this.owned[cat].includes(id)) return;
    this.owned[cat].push(id);
    save.setOwned(cat, this.owned[cat]);
    this.showToast(`EXCLUSIVE UNLOCKED: ${name}!`);
    haptic.success();
  }

  newOrder(): void {
    const n = this.level - 1;
    this.orderStats = { drops: 0, perfects: 0, slices: 0 };
    this.rage = 0;
    // Weather from level 12: wind speeds layers one way and slows them the other; rain makes them skid.
    this.weather = null;
    if ((this.runMode === 'journey' || this.runMode === 'challenge' || this.runMode === 'gauntlet') && this.level >= 12) {
      const w = this.rand();
      if (w < 0.18) this.weather = { kind: 'wind', dir: this.rand() < 0.5 ? -1 : 1 };
      else if (w < 0.36) this.weather = { kind: 'rain', dir: 0 };
    }
    if (this.runMode === 'puzzle') {
      const cfg = puzzleConfig(this.puzzle);
      this.order = { recipe: BASIC_RECIPES[this.puzzle % BASIC_RECIPES.length], length: cfg.layers, start: this.height, reward: 0 };
      return;
    }
    if (this.runMode === 'rescue') {
      const rs = RESCUES[this.rescueRun!.i];
      this.order = { recipe: BASIC_RECIPES[this.rescueRun!.i % BASIC_RECIPES.length], length: rs.target, start: this.height, reward: 0 };
      if (rs.kind === 'storm') this.weather = { kind: 'wind', dir: this.rand() < 0.5 ? -1 : 1 };
      return;
    }
    if (this.runMode === 'tower') {
      // Each floor is one short order with that floor's modifier.
      const floor = this.towerStart + this.ordersServed;
      const fm = towerFloors()[Math.min(TOWER_FLOORS, floor) - 1] ?? '';
      this.mods = new Set(fm && fm !== 'wind' && fm !== 'rain' ? [fm as Mod] : []);
      this.weather = fm === 'wind' ? { kind: 'wind', dir: this.rand() < 0.5 ? -1 : 1 } : fm === 'rain' ? { kind: 'rain', dir: 0 } : null;
      const pool = this.recipePool(this.level);
      this.order = { recipe: pool[Math.floor(this.rand() * pool.length)], length: 4 + Math.floor(floor / 6), start: this.height, reward: 0 };
      return;
    }
    if (this.special) {
      // Everyone gets the same Daily Special: one long order of a set recipe.
      // The critic orders the fanciest dish you can make; the Daily Special is the same for everyone.
      const critic = this.runMode === 'critic' ? this.recipePool(this.level).filter((r) => !r.secret).pop() : undefined;
      if (this.runMode === 'custom' && this.customChef) {
        // A friend's boss: one long order of a random classic.
        this.order = { recipe: BASIC_RECIPES[Math.floor(this.rand() * BASIC_RECIPES.length)], length: 12 + this.customChef.extra, start: this.height, reward: 0 };
        return;
      }
      this.order = { recipe: critic ?? BASIC_RECIPES[daySeed() % BASIC_RECIPES.length], length: (critic ? 9 : 10) - (this.shortOrders ? 2 : 0), start: this.height, reward: 0 };
      return;
    }
    // Early levels use the simple recipes; the full menu opens up further along the journey.
    // Recipes with newer ingredients join the menu at their level; the newest one is a bit more likely.
    const pool = this.recipePool(this.level);
    const fresh = pool.filter((r) => r.level && r.level > this.level - 5);
    let recipe = fresh.length && this.rand() < 0.4 ? fresh[0] : pool[Math.floor(this.rand() * Math.min(pool.length, 2 + n))];
    // A regular customer places the order; half the time they ask for their favourite.
    const regs = REGULARS.map((_, i) => i).filter((i) => REGULARS[i].level <= Math.max(this.level, this.progress.unlocked));
    const who = regs[Math.floor(this.rand() * regs.length)];
    const fav = pool.find((r) => r.name === REGULARS[who].favorite);
    if (fav && this.rand() < 0.5) recipe = fav;
    // Friends sometimes make a special request: a longer order that pays double and earns extra hearts.
    const request = heartLevel(this.progress.hearts[REGULARS[who].id] ?? 0) >= 2 && this.rand() < cfg.heartRequestChance;
    // Orders grow to 12 layers early on, then keep growing slowly in endless mode (up to 20).
    const endless = Math.min(8, Math.max(0, Math.floor((this.level - STORY_LEVELS) / 10)));
    const base = this.runMode === 'gauntlet' ? 6 + Math.floor(this.ordersServed / 3) : Math.min(5 + Math.floor(n / 2), 12) + endless + this.chef.extra;
    const length = base - (this.shortOrders ? 2 : 0) + (request ? 2 : 0);
    // Today's menu board special turns up more often.
    const menu = this.progress.rest.menu;
    if (menu.day === dayKey()) {
      const m = pool.find((r) => r.name === menu.recipe);
      if (m && this.rand() < 0.3) recipe = m;
    }
    // Dishes guests asked for on the restaurant's order board turn up more in the journey.
    const asked = this.journey ? pool.filter((r) => this.diner.requests.some((q) => q.recipe === r.name)) : [];
    if (asked.length && this.rand() < 0.25) recipe = asked[Math.floor(this.rand() * asked.length)];
    this.order = { recipe, length: Math.max(3, length), start: this.height, reward: 0, who, request };
  }

  nextIngredient(): Ingredient {
    const { pattern } = this.order.recipe;
    return pattern[(this.height - this.order.start) % pattern.length];
  }

  speed(): number {
    const c = this.chef;
    let v: number;
    if (this.runMode === 'puzzle') {
      const p = puzzleConfig(this.puzzle);
      v = p.speed * (p.wobble ? 1 + 0.35 * Math.sin(this.time * 2.2) : 1);
    } else {
      // Speed builds with the stack and with how far along the journey this chef is.
      v = Math.min(Math.min(130 + this.height * 4 + (this.level - 1) * 5, 400) * c.speed, 560);
      if (c.wobble) v *= 1 + 0.35 * Math.sin(this.time * 2.2);
    }
    if (this.moving?.special === 'ice') v *= 1.6;
    if (this.moving?.kind === 'tofu') v *= 1 + 0.3 * Math.sin(this.time * 14);
    if (this.rage) v *= 1 + 0.12 * this.rage;
    if (this.progress.tutorial < 2 && this.height < 4) v *= cfg.tutorialSlowdown; // first run: gentle start
    if (settings.assist) v *= 0.82;
    if (this.runMode === 'asmr') v *= 0.7;
    if (this.isNemesis()) v *= 1 + 0.05 * this.nemesisPower();
    if (this.flipT > 0) v *= 1.4;
    if (this.mods.has('double')) v *= 1.6;
    if (this.weather?.kind === 'wind') v *= 1 + 0.28 * this.moveDir * this.weather.dir; // faster with the wind, slower against it
    if (this.fever > 0) v *= 0.5;
    if (this.steady > 0) v *= 0.55;
    if (this.easy && this.height < 10) v *= 0.8;
    return this.slowStart && this.height < 15 ? v * 0.7 : v;
  }

  spawnMoving(): void {
    const top = this.top;
    // Alternate the side each layer slides in from.
    const x = this.moveDir > 0 ? -top.w * 0.5 : WORLD_W - top.w * 0.5;
    const kind = this.nextIngredient();
    // Ebi arrives a little narrower than the stack.
    const w = kind === 'ebi' ? Math.max(20, top.w * 0.85) : top.w;
    this.moving = { x, y: top.y - LAYER_H, w, kind, origin: x };
    const intro = NEW_INGREDIENTS.find((n) => n.kind === kind);
    if (intro && !this.progress.seen.includes(kind)) {
      this.progress.seen.push(kind);
      this.progress.persist();
      this.coach(`NEW: ${intro.name}`, intro.tip, 4);
    }
    // Twin layers: always with the Twins modifier, sometimes from level 60.
    if (this.mods.has('twin') || (this.journey && this.level >= 60 && this.height >= 3 && this.rand() < 0.12)) {
      this.moving.twin = true;
      this.moving.x = top.x;
      this.moving.origin = top.x;
      this.moving.w = top.w;
      this.twinPhase = 0;
      this.twinSep = 70;
      return;
    }
    // About one layer in eight is special (never in puzzles, never in the first few layers).
    if (this.runMode !== 'puzzle' && this.height >= 3 && this.rand() < 0.12) {
      const r = this.rand();
      this.moving.special = r < 0.35 ? 'golden' : r < 0.6 ? 'ice' : r < 0.85 ? 'wasabi' : 'mystery';
    }
  }

  /** Name shown above a special layer; during holidays the golden layer gets a seasonal name. */
  specialLabel(k: SpecialLayer): string {
    if (k === 'golden') {
      const h = currentHoliday()?.holiday.id;
      const name = h === 'halloween' ? 'PUMPKIN' : h === 'lunar' ? 'RED ENVELOPE' : h === 'winter' ? 'GIFT' : h === 'hanami' ? 'BLOSSOM' : h === 'summer' ? 'FIREWORK' : 'GOLDEN';
      return `${name} · PERFECT = x3 coins`;
    }
    return { ice: 'ICE · slides fast', wasabi: 'WASABI · miss = burn', mystery: 'MYSTERY · PERFECT = booster' }[k];
  }

  targetCam(): number {
    // Keep the top of the stack a little above the middle of the screen, but never lift the plate off the bottom too early.
    return Math.min(this.top.y - this.viewH * 0.48, -this.viewH * 0.78);
  }

  // ------------------------------------------------------------------- input

  onTap(clientX: number, clientY: number): void {
    unlockAudio();
    const rect = this.canvas.getBoundingClientRect();
    const wx = (clientX - rect.left) / this.scale - this.offX;
    const wy = (clientY - rect.top) / this.scale;

    const mb = this.muteButton();
    if (Math.hypot(wx - mb.x, wy - mb.y) < mb.r + 10) {
      this.muted = !this.muted;
      setMuted(this.muted);
      save.setMuted(this.muted);
      return;
    }

    if (this.paused) {
      this.paused = false;
      return;
    }

    // Last drawn is on top, so overlays and BACK buttons win over whatever is behind them.
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      const b = this.buttons[i];
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
        this.pressed = { x: b.x, y: b.y, t: this.time };
        sfx.tap();
        b.onTap();
        return;
      }
    }

    if (this.intro) {
      this.advanceIntro();
      return;
    }
    if (this.mode === 'mini' && this.mini) {
      this.mini.tap(wx, wy - this.insets.top - 40);
      return;
    }

    switch (this.mode) {
      case 'title':
        // The first tap only starts the game, so it can never drop a layer that's still sliding in.
        this.startRun();
        break;
      case 'playing':
        this.drop();
        break;
      case 'dead':
        if (this.time - this.deadAt > 0.7) this.retry();
        break;
      case 'shop':
        this.shopSel = null;
        break;
      default:
        break;
    }
  }

  drop(): void {
    const m = this.moving;
    if (!m || this.perkChoice) return;
    const wasPerfect = this.lastPerfect;
    const prevKind = this.top.kind;
    if (this.weather?.kind === 'rain' && this.rand() < 0.5) {
      // Rain: wet layers sometimes skid a little.
      m.x += 6 * this.moveDir;
      m.origin += 6 * this.moveDir;
    }
    if (m.kind === 'unagi') {
      // Slippery: the eel slides on a little after the tap.
      m.x += 10 * this.moveDir;
      m.origin += 10 * this.moveDir;
    }
    if (m.twin) {
      this.dropTwin(m);
      return;
    }
    const top = this.top;
    const dx = m.x - top.x;
    if (this.progress.tutorial === 0) {
      this.progress.tutorial = 1;
      track('tutorial', { step: 1 });
      this.coach('Line them up!', 'Drop each layer exactly on the one below for a PERFECT. PERFECTs build your combo.', 3.5);
    }

    const tol = ((this.chef.tight || this.runMode === 'critic') && this.runMode !== 'puzzle' ? TIGHT_TOL : PERFECT_TOL) + (this.magnet ? 4 : 0) + (this.fever > 0 ? 8 : 0) + (this.perks.magnet ?? 0) * 2 + (settings.assist ? 3 : 0) + (this.runMode === 'puzzle' ? 0 : this.upLv('knives'));
    if (Math.abs(dx) <= tol) {
      m.origin -= dx;
      m.x = top.x;
      this.combo += m.kind === 'ebi' ? 2 : 1; // ebi counts double
      this.orderStats.perfects++;
      this.lastPerfect = true;
      if (this.combo >= 5) {
        // Fancy cut: a decorated layer worth a little extra.
        m.fancy = true;
        this.runCoins += 1;
        this.progress.stat('fancy');
      }
      if ((this.progress.mastery[m.kind] ?? 0) >= MASTERY) this.runCoins += 1;
      if (this.progress.tutorial === 1) {
        this.progress.tutorial = 2;
        track('tutorial', { step: 2 });
      }
      if (this.combo >= 3 && m.w < this.baseW) {
        const grow = Math.min(REGROW + (this.perks.regrow ?? 0) * 4, this.baseW - m.w);
        m.x -= grow / 2;
        m.w += grow;
      }
      this.marks += 'P';
      this.runMaxCombo = Math.max(this.runMaxCombo, this.combo);
      this.place(m);
      this.relayLanded(true);
      const cx = m.x + m.w / 2;
      this.popup(cx, m.y - 18, this.combo > 1 ? `PERFECT x${this.combo}` : 'PERFECT', '#fff3b0', 18);
      // In-season ingredients are worth a little more.
      if (this.seasonal().includes(m.kind)) this.runCoins += 1;
      if (this.liveEvent()?.ingredient === m.kind) this.runCoins += 2;
      // On the music's beat too? A Beat PERFECT sparkles and pays a little more.
      if (this.lastBeat) {
        this.addCoins(2, cx, m.y - 76, '♪ Beat PERFECT');
        sfx.beat();
      }
      // Two PERFECTs in a row on a matching pair of ingredients set off a combo.
      const cb = wasPerfect ? comboFor(prevKind, m.kind) : undefined;
      if (cb) this.triggerCombo(cb, m);
      announce(this.combo > 1 ? `Perfect, ${this.combo} in a row` : 'Perfect');
      if (this.combo % 5 === 0) {
        this.staffCheer();
        this.addCoins(this.combo / 5 * 3, cx, m.y - 44, 'Streak bonus!');
        this.slowmo = 0.45; // a beat of slow motion to savour the streak
      }
      const feverEvery = Math.max(5, 10 - (this.perks.fever ?? 0) * 2);
      if (this.combo % feverEvery === 0 && this.fever <= 0 && this.runMode !== 'puzzle') this.startFever();
      if (m.kind === 'ikura') this.addCoins(3 + Math.floor(this.level / 5), cx, m.y - 88, 'Ikura pop!');
      if (m.special === 'golden') this.addCoins(5 + Math.min(this.level, 50), cx, m.y - 66, 'Golden x3!');
      if (m.special === 'mystery') {
        const b = BOOSTERS[Math.floor(this.rand() * BOOSTERS.length)];
        this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
        save.setBoosters(this.boosters);
        this.popup(cx, m.y - 66, `Mystery: ${b.name}!`, '#e0aaff', 16, 1.6);
      }
      if (m.special === 'wasabi') this.popup(cx, m.y - 66, 'Wasabi tamed!', '#9bc53d', 15);
      m.special = undefined;
      this.addXp(1);
      if (this.mode === 'playing' && !this.bubble) this.react('impressed', 0.7, this.combo >= 3 ? ['Sugoi!', 'Beautiful!', 'Perfect cut!'][this.combo % 3] : undefined);
      this.mission('perfects');
      this.mission('streak', this.combo);
      this.sparkle(m.x, m.y + LAYER_H / 2, m.w, 18 + this.combo * 2);
      sfx.perfect(this.combo);
      this.flash = 0.25;
      this.shake = 3;
    } else {
      this.lastPerfect = false;
      const overlap = top.w - Math.abs(dx);
      if (overlap <= 0) {
        this.fall(m, dx > 0 ? 1 : -1);
        if (this.zenLike) {
          // Zen never ends on a miss: the layer is simply lost.
          this.combo = 0;
          this.popup(WORLD_W / 2, top.y - 50, 'Breathe... try again', '#bde0fe', 16);
          sfx.slice();
          this.spawnMoving();
          return;
        }
        if (((this.boosters.chance && this.picked?.has('chance')) || this.freeChance) && !this.chanceUsed && this.runMode !== 'puzzle') {
          // Second Chance: lose the layer, keep the roll. A win-streak chance is free.
          if (this.freeChance) this.freeChance = false;
          else this.boosters.chance--;
          save.setBoosters(this.boosters);
          this.chanceUsed = true;
          this.combo = 0;
          this.popup(WORLD_W / 2, top.y - 60, 'SECOND CHANCE!', '#ff9eb0', 22);
          this.react('shock', 1, 'Lucky!');
          sfx.slice();
          haptic.medium();
          this.spawnMoving();
          return;
        }
        this.moving = null;
        this.die();
        return;
      }
      this.combo = 0;
      // Split the dropped layer into the part that lands and the overhang that falls.
      const keepX = Math.max(m.x, top.x);
      const cutX = dx > 0 ? keepX + overlap : m.x;
      this.fall({ ...m, x: cutX, w: m.w - overlap }, dx > 0 ? 1 : -1);
      m.x = keepX;
      m.w = overlap;
      if (m.special === 'wasabi' && m.w > 20) {
        // Wasabi burns a little extra off a missed drop.
        const burn = Math.min(12, m.w - 8);
        m.x += burn / 2;
        m.w -= burn;
        this.popup(m.x + m.w / 2, m.y - 40, 'WASABI BURN!', '#9bc53d', 16);
      }
      m.special = undefined;
      this.orderStats.slices++;
      if (this.progress.tutorial === 2 || (this.progress.tutorial === 1 && this.height >= 3)) {
        this.progress.tutorial = 3;
        track('tutorial', { step: 3 });
        this.coach('Sliced!', 'The part hanging over the edge gets cut off. Stay centred to keep your roll wide.', 3.5);
      }
      if (this.runMode === 'puzzle' && this.orderStats.slices > puzzleConfig(this.puzzle).maxSlices) {
        this.fall({ ...m }, dx > 0 ? 1 : -1);
        this.moving = null;
        this.die();
        return;
      }
      this.marks += 'C';
      this.place(m);
      this.relayLanded(false);
      if (this.mode === 'playing' && !this.reaction) this.react('wince', 0.5);
      sfx.slice();
      this.wobbleE = Math.min(1.5, this.wobbleE + 0.35); // a sloppy drop makes the tower sway
    }
  }

  // ---------------------------------------------------------------- signature feel

  song: number[] = []; // one note per layer: ingredient << 2 | perfect << 1 | beat
  lastBeat = false;
  wobbleE = 0; // sway energy from sloppy drops
  leanPx = 0; // how far the upper tower leans
  tilt = 0; // phone tilt, -1..1
  creakAt = 0;
  comboShield = 0;
  runCombos = 0;

  /** How far a layer at height y is drawn sideways: the tower sways and leans, more near the top. */
  swayAt(y: number): number {
    if (settings.reducedMotion || (this.mode !== 'playing' && this.mode !== 'dead') || this.height < 6) return 0;
    const frac = Math.max(0, Math.min(1, -y / LAYER_H / (this.height + 1)));
    const amp = this.swayAmp();
    return (amp * Math.sin(this.time * 1.7) + this.leanPx + (settings.tilt ? this.tilt * 6 : 0)) * Math.pow(frac, 1.5);
  }

  swayAmp(): number {
    return Math.min(14, Math.max(0, this.height - 6) * 0.05 + this.wobbleE * 7);
  }

  /** Two PERFECTs in a row on a matching pair set off a combo effect. */
  triggerCombo(cb: (typeof COMBOS)[number], m: Layer): void {
    const cx = m.x + m.w / 2;
    this.runCombos++;
    switch (cb.effect) {
      case 'coins': this.addCoins(6, cx, m.y - 100, `${cb.emoji} ${cb.name}`); break;
      case 'slow': this.steady = Math.max(this.steady, 2); break;
      case 'shield': this.comboShield++; break;
      case 'combo': this.combo += 2; break;
      case 'regrow': {
        const grow = Math.min(16, this.baseW - m.w);
        if (grow > 0) {
          m.x -= grow / 2;
          m.w += grow;
        }
        break;
      }
    }
    if (cb.effect !== 'coins') this.popup(cx, m.y - 100, `${cb.emoji} ${cb.name.toUpperCase()}!`, '#9fe3ff', 17, 1.6);
    this.popup(cx, m.y - 120, cb.desc, '#ffffff', 11, 1.6);
    sfx.combo();
    const p = this.progress;
    if (!p.combos.includes(cb.name)) {
      p.combos.push(cb.name);
      this.showToast(`🍱 New combo discovered: ${cb.emoji} ${cb.name} (${p.combos.length}/${COMBOS.length})`);
    }
    track('combo', { name: cb.name });
  }

  /** Passing a landmark (or a new part of the sky) gets a moment of its own. */
  checkLandmark(): void {
    const m = this.height * METERS_PER_LAYER;
    const prev = (this.height - 1) * METERS_PER_LAYER;
    const passed = LANDMARKS.filter((l) => l.m >= prev && l.m < m).pop();
    if (passed) {
      this.popup(WORLD_W / 2, this.top.y - 150, `${passed.emoji} Taller than ${passed.name}!`, '#fff3b0', 15, 2);
      sfx.landmark();
      announce(`Taller than ${passed.name}`);
    }
    const zone = skyZone(this.height);
    if (zone !== skyZone(this.height - 1) && this.height > 1) this.popup(WORLD_W / 2, this.top.y - 176, `☁️ ${zone.name.toUpperCase()}`, '#ffffff', 13, 2);
    if (m > this.progress.landmark && this.runMode !== 'pnp' && this.runMode !== 'relay') this.progress.landmark = m;
  }

  /** A faint line at each landmark's height, labelled on the left. */
  drawLandmarks(minY: number, maxY: number): void {
    for (const l of LANDMARKS) {
      const layers = l.m / METERS_PER_LAYER;
      const y = -LAYER_H * (layers + 1);
      if (y < minY - 20 || y > maxY + 20) continue;
      const { ctx } = this;
      ctx.strokeStyle = 'rgba(159,227,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.moveTo(-this.offX, y);
      ctx.lineTo(WORLD_W + this.offX, y);
      ctx.stroke();
      ctx.setLineDash([]);
      this.fitText(`${l.emoji} ${l.name.replace(/^(the|a) /, '')} · ${l.m} m`, 8, y - 9, 220, 10.5, 'rgba(159,227,255,0.85)', 'left', 700);
    }
  }

  place(layer: Layer): void {
    if (this.swanLeft > 0 && layer.w < this.baseW * 0.45) {
      // Swan companion rebuilds a thin stack.
      this.swanLeft--;
      const grow = Math.min(this.baseW - layer.w, 60);
      layer.x -= grow / 2;
      layer.w += grow;
      this.popup(layer.x + layer.w / 2, layer.y - 30, '🦢 Swan rebuilt your stack!', '#ffffff', 15, 1.6);
    }
    this.stack.push(layer);
    this.orderStats.drops++;
    if (this.runMode !== 'pnp') this.stockPantry(layer.kind, this.lastPerfect);
    // The upper tower leans the way its last layers drifted from the base.
    const base = this.stack[0];
    const recent = this.stack.slice(-10);
    const drift = recent.reduce((a, l) => a + (l.x + l.w / 2), 0) / recent.length - (base.x + base.w / 2);
    this.leanPx = Math.max(-10, Math.min(10, drift * 0.3));
    if (this.lastPerfect) this.wobbleE *= 0.85;
    const mk = this.progress.mastery;
    mk[layer.kind] = (mk[layer.kind] ?? 0) + 1;
    if (mk[layer.kind] === MASTERY) {
      this.celebrate(`✨ ${layer.kind.toUpperCase()} MASTERED!`, 'Gold layers from now on, and +1 coin per PERFECT with it');
      this.progress.persist();
    }
    if (this.bonus) this.bonusDrop(layer);
    this.mission('height', this.height);
    this.order.reward += layer.w / BASE_W;
    // Every ingredient sounds and feels different as it lands, and adds a note to the run's song.
    sfx.land(layer.kind);
    hapticFeel(FEEL[layer.kind].haptic);
    const off = beatOffset();
    this.lastBeat = this.lastPerfect && off !== null && off < 0.07;
    const note = Math.max(0, FEEL_KINDS.indexOf(layer.kind));
    this.song.push((note << 2) | (this.lastPerfect ? 2 : 0) | (this.lastBeat ? 1 : 0));
    if (settings.songNotes && !isAsmr()) songNote(note, this.lastPerfect, this.lastBeat, 0.02);
    this.checkLandmark();
    if (this.height % 25 === 0) this.addCoins(10, WORLD_W / 2, layer.y - 80, `${this.height} layers!`);
    if (this.steady > 0) this.steady--;
    this.sinceEvent++;
    const served = this.height - this.order.start >= this.order.length;
    // The new boss switches sides on arrival, so only walk across mid-order.
    if (++this.sinceSwitch >= 5 && !this.event && !served) this.switchSides();
    if (served) this.serve();
    this.moveDir *= -1;
    this.spawnMoving();
    if (!served) this.maybeChefEvent();
  }

  /** A sous-chef bonus drop: it doesn't count toward the order; 3 PERFECTs in a row win a chest. */
  bonusDrop(layer: Layer): void {
    const b = this.bonus!;
    this.order.start++;
    this.order.reward -= layer.w / BASE_W;
    this.orderStats.drops--;
    if (this.lastPerfect) this.orderStats.perfects--;
    b.left--;
    const cx = layer.x + layer.w / 2;
    if (!this.lastPerfect) {
      this.bonus = null;
      this.popup(cx, layer.y - 60, 'Sous chef wins this one!', '#ff9a8a', 15, 1.4);
    } else if (b.left <= 0) {
      this.bonus = null;
      this.bankCoins(40);
      this.openChest(this.level);
      this.popup(cx, layer.y - 60, '👨‍🍳 SOUS CHEF BEATEN! Chest + 40', '#ffd34d', 16, 1.8);
      sfx.celebrate();
      this.progress.stat('bonus');
    } else this.popup(cx, layer.y - 60, `Bonus ${3 - b.left}/3`, '#9fe3ff', 14);
  }

  // ------------------------------------------------------- feel and rewards

  startFever(): void {
    this.fever = FEVER_TIME;
    this.celebrate('FEVER!', 'Slow layers · easy PERFECTs · 3x coins', 1.4);
    sfx.fever();
    haptic.success();
  }

  /** Full-screen celebration: a title, a line of detail and a burst of confetti. */
  celebrate(title: string, sub: string, time = 2): void {
    this.celebration = { title, sub, t: time };
    sfx.celebrate();
    if (settings.reducedMotion) return;
    const colors = ['#ff8a5b', '#ffd34d', '#8fdc93', '#9fe3ff', '#ff5d8f', '#e0aaff'];
    for (let i = 0; i < (this.lite ? 20 : 70); i++) {
      this.confetti.push({ x: Math.random() * WORLD_W, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 160, rot: Math.random() * 6, color: colors[i % colors.length], life: 3 });
    }
  }

  /** Sushi Pass XP. Resets each season. */
  addXp(n: number): void {
    const p = this.progress.pass;
    const { n: season } = currentSeason();
    if (p.season !== season) Object.assign(p, { season, xp: 0, free: [], prem: [], premium: false });
    const before = Math.floor(p.xp / PASS_XP);
    p.xp = Math.min(PASS_TIERS * PASS_XP, p.xp + n);
    const after = Math.floor(p.xp / PASS_XP);
    if (after > before && after <= PASS_TIERS) this.showToast(`Sushi Pass tier ${after} reached! Claim it in More → Pass`);
    if (after >= PASS_TIERS && before < PASS_TIERS) {
      const th = currentSeason().theme;
      const badge = `season:${season}:${th.icon}:${th.name}`;
      if (!this.progress.badges.includes(badge)) {
        this.progress.badges.push(badge);
        this.celebrate(`${th.icon} SEASON TROPHY!`, `You finished the ${th.name} Pass. See it on your profile.`);
      }
    }
  }

  /** Event tokens count toward the World Tour city and any running holiday event. */
  earnTokens(n: number): void {
    const p = this.progress;
    const tour = currentTour();
    if (p.tour.key !== tour.key) p.tour = { key: tour.key, tokens: 0, claimed: [] };
    p.tour.tokens += n;
    TOUR_GOALS.forEach((g, i) => {
      if (p.tour.tokens < g.tokens || p.tour.claimed.includes(i)) return;
      p.tour.claimed.push(i);
      if (g.reward === 'packs') this.openPacks(g.amount);
      else if (g.reward === 'coins') this.bankCoins(g.amount);
      else this.unlockExclusive('plate', `city-${tour.city.id}`, `${tour.city.name} Plate`);
      this.showToast(`World Tour ${tour.city.name}: ${g.label}!`);
    });
    const hol = currentHoliday();
    if (hol) {
      if (p.holiday.key !== hol.key) p.holiday = { key: hol.key, tokens: 0, claimed: false };
      p.holiday.tokens += n;
      if (!p.holiday.claimed && p.holiday.tokens >= HOLIDAY_GOAL) {
        p.holiday.claimed = true;
        this.unlockExclusive(hol.holiday.item.cat, hol.holiday.item.id, hol.holiday.item.name);
        this.celebrate(hol.holiday.name, `${hol.holiday.item.name} unlocked!`);
      }
    }
    p.persist();
  }

  /** Opens sticker packs (3 stickers each). New stickers fill the album; duplicates turn into coins. */
  /** A new Sushi Pass season starts a fresh sticker album. */
  ensureAlbum(): void {
    const a = this.progress.album;
    const { n: season } = currentSeason();
    if (a.season !== season) Object.assign(a, { season, have: STICKER_SETS.map((s2) => s2.stickers.map(() => 0)), setsDone: [], done: false });
  }

  openPacks(n: number): void {
    const a = this.progress.album;
    this.ensureAlbum();
    const fresh: string[] = [];
    let dupeCoins = 0;
    for (let i = 0; i < n * 3; i++) {
      const [set, pos] = rollSticker();
      if (a.have[set][pos]++ === 0) fresh.push(STICKER_SETS[set].stickers[pos]);
      else dupeCoins += 5 * stickerRarity(set, pos);
      if (!a.setsDone.includes(set) && a.have[set].every((c: number) => c > 0)) {
        a.setsDone.push(set);
        this.bankCoins(SET_REWARD(set));
        this.celebrate(`${STICKER_SETS[set].name} set complete!`, `+${SET_REWARD(set)} coins`);
      }
    }
    if (dupeCoins) this.bankCoins(dupeCoins);
    if (!a.done && a.setsDone.length === STICKER_SETS.length) {
      a.done = true;
      this.bankCoins(ALBUM_REWARD);
      this.unlockExclusive('flag', 'album', 'Album Master flag');
      this.celebrate('ALBUM COMPLETE!', `+${ALBUM_REWARD} coins`);
    }
    this.showToast(`Stickers: ${fresh.length ? `${fresh.join(' ')} NEW!` : 'all duplicates'}${dupeCoins ? ` · +${dupeCoins} coins` : ''}`);
    this.progress.persist();
  }

  crewOrder(): void {
    const p = this.progress;
    const w = crewWeek();
    if (p.crew.key !== w.key) p.crew = { key: w.key, mine: 0, claimed: [] };
    p.crew.mine++;
  }

  /** Daily Sushi Sprint: beat RACE_GOAL chefs in one run; the earlier you finish, the bigger your share. */
  checkRace(): void {
    const r = this.progress.race;
    if (!r.joined || r.day !== dayKey() || r.finished) return;
    if (this.runMode !== 'journey' && this.runMode !== 'challenge') return;
    r.best = Math.max(r.best, this.ordersServed);
    if (r.best >= RACE_GOAL) {
      r.finished = true;
      r.reward = Math.max(20, Math.floor(RACE_POOL / (raceFinishers(r.day) + 1)));
      this.celebrate('SUSHI SPRINT FINISHED!', `Your share: ${r.reward} coins · claim it in Events`);
    }
    this.progress.persist();
  }

  // --------------------------------------------------------- run endings

  finishRun(kind: typeof this.resultKind, line: string): void {
    this.resultKind = kind;
    this.mode = 'dead';
    this.deadAt = this.time;
    this.moving = null;
    this.event = null;
    this.projectiles = [];
    this.bubble = { text: line, life: 99 };
    this.endRun();
  }

  puzzleWon(): void {
    const ps = this.progress.puzzleStars;
    const max = puzzleConfig(this.puzzle).maxSlices;
    const sl = this.orderStats.slices;
    const stars = sl === 0 ? 3 : sl <= Math.ceil(max / 2) ? 2 : 1;
    const first = !ps[this.puzzle];
    ps[this.puzzle] = Math.max(ps[this.puzzle] || 0, stars);
    if (first) this.addCoins(20 + this.puzzle * 5, WORLD_W / 2, this.top.y - 80, `Puzzle ${this.puzzle + 1} solved!`);
    this.specialWon = true;
    this.finishRun('puzzle-won', this.chef.beaten);
  }

  /** Zen has no game over; the player ends it from the END button. */
  endZen(): void {
    this.specialWon = true;
    this.finishRun('zen', 'So relaxing...');
  }

  timeUp(): void {
    this.specialWon = true;
    this.addCoins(this.height, WORLD_W / 2, this.top.y - 60, 'Time Attack');
    this.finishRun('time', 'Time is up!');
  }

  /** Continue after a game over (rewarded ad, or free for VIP): carry on from the same stack. */
  revive(): void {
    this.revived = true;
    this.progress.topRuns.splice(this.progress.topRuns.indexOf(this.height), 1); // the run isn't over yet
    this.mode = 'playing';
    this.combo = 0;
    this.newBest = false;
    this.bubble = { text: 'Back for more?', life: 1.6 };
    this.spawnMoving();
    this.showToast('Continue! Your stack is safe.');
  }

  /**
   * Gives a reward for watching an ad. VIP players get it without the ad. On phones this plays a
   * real (test) AdMob rewarded ad; in the browser it shows a simulated test ad.
   */
  watchAd(label: string, reward: () => void): void {
    const onReward = () => { track('ad_reward', { label }); reward(); };
    if (this.progress.vip) {
      onReward();
      this.showToast('VIP: reward without the ad');
      return;
    }
    if (nativeAds()) {
      void showRewardedAd().then((ok) => (ok ? onReward() : this.showToast('Ad not finished, no reward this time')));
      return;
    }
    this.adOverlay = { t: 3, label, onReward };
  }

  /** Starts a purchase: real through the store when set up, otherwise a clearly labelled test. */
  buy(id: ProductId): void {
    if (monetize.purchasesLive) {
      void buyReal(id).then((ok) => (ok ? this.grant(id) : this.showToast('Purchase cancelled')));
      return;
    }
    if (!Capacitor.isNativePlatform() || import.meta.env.DEV) {
      this.buyOverlay = id;
      return;
    }
    this.showToast('Purchases aren’t set up yet');
  }

  grant(id: ProductId): void {
    track('purchase', { id, test: !monetize.purchasesLive });
    const p = this.progress;
    switch (id) {
      case 'starter':
        p.starterBought = true;
        this.bankCoins(600);
        for (const b of ['chance', 'chance', 'double', 'magnet', 'shield', 'lucky'] as BoosterId[]) this.boosters[b] = (this.boosters[b] ?? 0) + 1;
        save.setBoosters(this.boosters);
        this.unlockExclusive('plate', 'starter', 'Sakura Bento plate');
        break;
      case 'vip':
        p.vipUntil = Math.max(Date.now(), p.vipUntil) + 30 * 86_400_000;
        break;
      case 'piggy':
        this.bankCoins(p.piggy);
        this.celebrate('PIGGY BANK BROKEN!', `+${p.piggy} coins`);
        p.piggy = 0;
        break;
      case 'pass':
        p.pass.premium = true;
        break;
      case 'restpass':
        p.rest.passUntil = Math.max(Date.now(), p.rest.passUntil) + 30 * 86_400_000;
        if (!p.rest.ownedThemes.includes('imperial')) p.rest.ownedThemes.push('imperial');
        this.celebrate('👑 RESTAURANT PASS!', '+50% tips · +4h jar · Imperial Gold theme · gold decor styles');
        break;
    }
    p.persist();
    this.showToast(`${PRODUCTS[id].name}: thank you!`);
    haptic.success();
  }

  /** Grants one Sushi Pass, crew or event reward. */
  giveReward(r: Reward): void {
    switch (r.kind) {
      case 'coins':
        this.bankCoins(r.amount);
        break;
      case 'booster':
        for (let i = 0; i < r.amount; i++) {
          const b = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
          this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
        }
        save.setBoosters(this.boosters);
        break;
      case 'packs':
        this.openPacks(r.amount);
        return;
      case 'shards':
        this.addShards(r.amount);
        break;
      case 'item':
        this.unlockExclusive('plate', 'season', 'Season Plate');
        break;
    }
    this.showToast(`Claimed: ${r.label}`);
  }

  /** Companion shards go to a random companion, favouring ones already being collected. */
  addShards(n: number): void {
    const s2 = this.progress.shards;
    for (let i = 0; i < n; i++) {
      const owned = COMPANIONS.filter((c) => (s2[c.id] ?? 0) > 0);
      const pool = owned.length && Math.random() < 0.6 ? owned : COMPANIONS;
      const c = pool[Math.floor(Math.random() * pool.length)];
      const before = companionLevel(s2[c.id] ?? 0);
      s2[c.id] = (s2[c.id] ?? 0) + 1;
      const after = companionLevel(s2[c.id]);
      if (after > before) this.celebrate(after === 1 ? `${c.emoji} ${c.name} joined you!` : `${c.emoji} ${c.name} is level ${after}!`, c.power(after));
    }
    this.progress.persist();
  }

  // ------------------------------------------------------------ chef events

  /**
   * After each drop the chef may attack or help. Mean chefs attack more, kind ones help more,
   * and the player's own play tips the odds: perfect streaks earn help, sloppy drops invite attacks.
   */
  maybeChefEvent(): void {
    if (this.mode !== 'playing' || this.calmChefs || this.event || this.introIn > 0 || this.height < 3 || this.sinceEvent < (this.rage ? 2 : 3)) return;
    if (this.progress.tutorial < 4) return; // no attacks until the first order is served
    if (this.bonus) return; // the sous chef plays fair
    const c = this.chef;
    const sloppy = this.combo === 0;
    const bad = this.shield ? 0 : (c.mean + (sloppy ? 0.08 : 0) + (this.isNemesis() ? 0.04 * this.nemesisPower() : 0)) * (1 + this.rage * 0.6);
    const good = c.kind * (this.combo >= 3 ? 0.35 : this.combo >= 1 ? 0.15 : 0.06) * (this.lucky ? 2 : 1) * (1 + (this.perks.tips ?? 0) * 0.5);
    const r = this.rand();
    if (r < bad) {
      // Raging bosses add a flurry of knives to their moves.
      // Later chefs learn new tricks: a sneaky bite from level 20, a speed flip from 30, a freezer blast from 40.
      const pool: Attack[] = [...c.attacks, ...(this.level >= 20 ? ['steal' as const] : []), ...(this.level >= 30 ? ['flip' as const] : []), ...(this.level >= 40 ? ['frost' as const] : [])];
      const kind: Attack = this.rage && this.rand() < 0.4 ? 'flurry' : pool[Math.floor(this.rand() * pool.length)];
      if (this.shieldHits > 0) {
        this.shieldHits--;
        this.popup(WORLD_W / 2, this.top.y - 60, '🛡️ Bodyguard blocked an attack!', '#9fe3ff', 15, 1.6);
        this.sinceEvent = 0;
        return;
      }
      this.startEvent(kind, true, ATTACK_INFO[kind].windup, ATTACK_INFO[kind].line);
    } else if (r < bad + good) {
      const helps: Help[] = ['slow', 'tip'];
      if (this.top.w < this.baseW * 0.8) helps.push('patch', 'patch');
      const kind = helps[Math.floor(this.rand() * helps.length)];
      this.startEvent(kind, false, 0.6, HELP_INFO[kind].line);
    }
  }

  startEvent(kind: Attack | Help, bad: boolean, windup: number, line: string): void {
    if (bad && this.comboShield > 0) {
      // A combo shield blocks the attack before it starts.
      this.comboShield--;
      this.sinceEvent = 0;
      this.popup(WORLD_W / 2, this.top.y - 90, '🛡️ Combo shield blocked an attack!', '#9fe3ff', 15, 1.6);
      return;
    }
    this.event = { kind, bad, t: windup };
    this.sinceEvent = 0;
    this.reaction = null;
    this.bubble = { text: line, life: windup + 0.8 };
    if (bad) haptic.light();
    if (bad && settings.audioOnly) cue.warn();
  }

  // The chef fills the space between the top bar and the top of the stack, which the camera keeps
  // at 48% of the screen height, so they never sit over the blocks.
  bossScale(): number {
    return Math.max(1.1, Math.min(1.9, (this.viewH * 0.48 - 110 - this.insets.top) / 136));
  }

  bossY(): number {
    return this.viewH * 0.48 - 70 - 70 * this.bossScale();
  }

  chefHome(side: number): number {
    const edge = 34 * this.bossScale();
    return side < 0 ? edge : WORLD_W - edge;
  }

  /** The order card sits on the side away from the chef and slides over as they cross. */
  cardX(): number {
    const left = this.chefHome(-1);
    const right = this.chefHome(1);
    const t = Math.max(0, Math.min(1, (this.chefX - left) / (right - left)));
    const w = 236;
    return (WORLD_W - 12 - w) * (1 - t) + 12 * t;
  }

  switchSides(): void {
    this.chefSide = -this.chefSide;
    this.sinceSwitch = 0;
  }

  runEvent(kind: Attack | Help): void {
    const s = this.bossScale();
    const handY = this.bossY() - 20 * s + this.camY; // world units
    const top = this.top;
    switch (kind) {
      case 'flurry':
        this.flurryLeft = 3;
        this.flurryT = 0;
        break;
      case 'steal': {
        // Bites a quarter off one side of the top layer (never below a sliver).
        const bite = Math.min(top.w * 0.25, top.w - 30);
        if (bite <= 4 || this.stack.length < 2) break;
        const left = this.rand() < 0.5;
        this.fall({ ...top, x: left ? top.x : top.x + top.w - bite, w: bite }, left ? -1 : 1);
        if (left) top.x += bite;
        top.w -= bite;
        this.popup(top.x + top.w / 2, top.y - 24, 'CHOMP!', '#ff6b6b', 20);
        sfx.slice();
        haptic.medium();
        break;
      }
      case 'flip':
        this.moveDir *= -1;
        this.flipT = 3;
        this.popup(WORLD_W / 2, top.y - 50, '⇄ FLIPPED! Faster for 3s', '#ff9a8a', 16, 1.6);
        haptic.medium();
        break;
      case 'frost':
        this.frost = 3.5;
        this.popup(WORLD_W / 2, top.y - 50, '❄ Frozen view!', '#bde0fe', 16, 1.6);
        sfx.drop();
        break;
      case 'knife': {
        const m = this.moving;
        if (!m) return;
        const side = m.x + m.w / 2 >= this.chefX ? 1 : -1;
        const x = this.chefX + side * 30 * s;
        const dx = m.x + m.w / 2 - x;
        const dy = m.y + LAYER_H / 2 - handY;
        const d = Math.hypot(dx, dy) || 1;
        this.projectiles.push({ kind: 'knife', x, y: handY, vx: (dx / d) * 460, vy: (dy / d) * 460, rot: 0, target: m, dodged: false });
        sfx.slice();
        break;
      }
      case 'slam': {
        this.shake = 16;
        sfx.die();
        haptic.medium();
        // The top layer slides sideways, but always keeps some footing on the layer below.
        const below = this.stack[this.stack.length - 2];
        if (below && this.stack.length > 1) {
          const dir = this.rand() < 0.5 ? -1 : 1;
          let nx = top.x + dir * (10 + this.rand() * 10);
          nx = Math.max(below.x - top.w + 24, Math.min(below.x + below.w - 24, nx));
          top.origin += nx - top.x;
          top.x = nx;
        }
        this.popup(top.x + top.w / 2, top.y - 20, 'SLAM!', '#ff6b6b', 22);
        break;
      }
      case 'splat': {
        if (this.tanukiLeft > 0) {
          this.tanukiLeft--;
          this.popup(WORLD_W / 2, top.y - 50, '🦝 Tanuki wiped up the soy!', '#ffffff', 15, 1.6);
          break;
        }
        const cy = top.y - this.camY;
        for (let i = 0; i < 3; i++) {
          this.splats.push({ x: 70 + Math.random() * (WORLD_W - 140), y: cy - 120 + Math.random() * 200, r: 30 + Math.random() * 25, life: 3.5, seed: Math.random() * 100 });
        }
        sfx.drop();
        haptic.medium();
        break;
      }
      case 'slow':
        this.mission('help');
        this.steady = 3;
        this.popup(WORLD_W / 2, top.y - 50, 'Next 3 layers slowed!', '#9fe3ff', 16, 1.6);
        sfx.serve();
        break;
      case 'patch': {
        this.mission('help');
        const x = this.chefX;
        const dx = top.x + top.w / 2 - x;
        const dy = top.y - handY;
        const d = Math.hypot(dx, dy) || 1;
        this.projectiles.push({ kind: 'patty', x, y: handY, vx: (dx / d) * 380, vy: (dy / d) * 380, rot: 0, target: null, dodged: false });
        break;
      }
      case 'tip':
        this.mission('help');
        this.addCoins(3 + this.level * 2, WORLD_W / 2, top.y - 50, 'Tip!');
        for (let i = 0; i < 16; i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
          const v = 150 + Math.random() * 150;
          this.particles.push({ x: this.chefX, y: handY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9, max: 0.9, color: '#ffd34d', size: 5 });
        }
        sfx.serve();
        haptic.success();
        break;
    }
  }

  updateProjectiles(dt: number): void {
    for (const p of this.projectiles) {
      if (p.kind === 'knife') {
        p.rot += dt * 16;
        const m = this.moving;
        if (p.target && p.target === m) {
          // Home in on the sliding layer until the player drops it.
          const dx = m.x + m.w / 2 - p.x;
          const dy = m.y + LAYER_H / 2 - p.y;
          const d = Math.hypot(dx, dy) || 1;
          p.vx += ((dx / d) * 460 - p.vx) * Math.min(1, dt * 3);
          p.vy += ((dy / d) * 460 - p.vy) * Math.min(1, dt * 3);
          if (p.x > m.x - 6 && p.x < m.x + m.w + 6 && p.y > m.y - 6 && p.y < m.y + LAYER_H + 6 && this.nekoLeft > 0) {
            this.nekoLeft--;
            this.popup(m.x + m.w / 2, m.y - 16, '🐱 Neko caught the knife!', '#ffffff', 16, 1.6);
            this.react('shock', 0.8, 'My knife!');
            p.y = Infinity;
            continue;
          }
          if (p.x > m.x - 6 && p.x < m.x + m.w + 6 && p.y > m.y - 6 && p.y < m.y + LAYER_H + 6) {
            this.fall(m, p.vx >= 0 ? 1 : -1);
            this.combo = 0;
            this.popup(m.x + m.w / 2, m.y - 16, 'KNOCKED OFF!', '#ff6b6b', 20);
            this.react('happy', 0.9, 'Ha! Too slow!');
            this.shake = 8;
            sfx.slice();
            haptic.error();
            this.spawnMoving();
            p.y = Infinity; // remove
            continue;
          }
        } else if (p.target && !p.dodged) {
          p.dodged = true;
          this.popup(WORLD_W / 2, this.top.y - 40, 'DODGED!', '#8fdc93', 20);
          this.mission('dodge');
          this.react('shock', 0.8, 'What?!');
        }
        if (p.target !== m) p.vy += 900 * dt;
      } else {
        // Rice patty: lands on the top layer and widens it.
        const t = this.top;
        const dx = t.x + t.w / 2 - p.x;
        const dy = t.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 14) {
          const grow = Math.min(this.baseW - t.w, 50);
          t.x -= grow / 2;
          t.w += grow;
          if (this.moving) {
            const mc = this.moving.x + this.moving.w / 2;
            this.moving.w = t.w;
            this.moving.x = mc - t.w / 2;
          }
          this.sparkle(t.x, t.y + LAYER_H / 2, t.w, 24);
          this.popup(t.x + t.w / 2, t.y - 20, 'WIDER!', '#8fdc93', 20);
          sfx.perfect(4);
          haptic.success();
          p.y = Infinity;
          continue;
        }
        p.rot += dt * 6;
        p.vx += ((dx / (d || 1)) * 380 - p.vx) * Math.min(1, dt * 4);
        p.vy += ((dy / (d || 1)) * 380 - p.vy) * Math.min(1, dt * 4);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.projectiles = this.projectiles.filter((p) => p.y < this.camY + this.viewH + 60 && p.x > -60 && p.x < WORLD_W + 60);
  }

  serve(): void {
    const top = this.top;
    const onMenu = this.progress.rest.menu.day === dayKey() && this.progress.rest.menu.recipe === this.order.recipe.name;
    const coins = Math.max(1, Math.round(this.order.reward * 2)) * (this.order.request ? 2 : 1) * (onMenu ? 2 : 1);
    if (onMenu) this.popup(WORLD_W / 2, top.y - 100, '📋 Today’s special! 2x coins', '#9fe3ff', 14, 1.6);
    const beatLevel = this.level;
    const beaten = this.chef;
    const recipe = this.order.recipe.name;
    const stars = Progress.starsFor(this.orderStats.perfects, this.orderStats.drops);
    const flawless = this.orderStats.slices === 0;
    this.ordersServed++;
    this.banner = null;
    // The finished roll pops up, then drops down to a customer at the bottom corner.
    const who = this.order.who;
    this.dish = { recipe: this.order.recipe, t: 0, from: { x: top.x + top.w / 2, y: top.y - this.camY - 30 }, side: -this.chefSide, look: who !== undefined ? REGULARS[who].look : Math.random(), ate: false, who };
    if (who !== undefined) this.addHearts(who, 1 + (flawless ? 1 : 0) + (this.order.request ? 2 : 0));
    if (this.rage) this.progress.stat('rage');
    this.flags.push({ x: top.x + top.w / 2, y: top.y, hue: (this.ordersServed * 47) % 360 });
    this.addCoins(coins + 5 * beatLevel, WORLD_W / 2, top.y - 34, `${beaten.name} beaten!`);
    this.popup(WORLD_W / 2, top.y - 58, '★'.repeat(stars) + '☆'.repeat(3 - stars), '#ffd34d', 26, 1.6);
    this.react('happy', 1.2, beaten.beaten);
    if (this.runMode !== 'puzzle' && this.runMode !== 'pnp') this.dinerServe(recipe, beatLevel);
    if (this.journey) this.recordChef(beatLevel, true);
    if (this.runMode === 'puzzle') {
      this.puzzleWon();
      return;
    }
    if (this.runMode === 'rescue') {
      this.rescueWon();
      return;
    }
    if (this.runMode === 'tower' && this.towerFloorDone(this.towerStart + this.ordersServed - 1)) return;

    // Long-term progress: stars and the next chef unlocked, chef card, missions, recipe book, chest.
    if (this.journey && beatLevel % 10 === 0 && beatLevel <= STORY_LEVELS) this.queueStory(chapterFor(beatLevel), true);
    announce(`Order served! ${beaten.name} beaten.`);
    if (this.journey || this.runMode === 'gauntlet') this.leaguePts(10 + (flawless ? 5 : 0));
    if (this.journey) this.questWin();
    if (this.journey && this.nemesisLevel() === beatLevel) this.beatNemesis(beatLevel);
    if (this.journey) {
      track('level_beat', { level: beatLevel, stars, flawless });
      // Card copies: beating a chef again levels up their card (Lv 2 = gold uniform).
      const before = Progress.cardLevel(this.progress.cards[beatLevel] ?? 0);
      this.progress.cards[beatLevel] = (this.progress.cards[beatLevel] ?? 0) + 1;
      const after = Progress.cardLevel(this.progress.cards[beatLevel]);
      if (after > before && after >= 2) this.showToast(`🃏 ${beaten.name} card Lv ${after}${after === 2 ? ': gold uniform unlocked!' : ''}`);
    }
    if (this.journey && this.progress.beat(beatLevel, stars)) {
      this.showToast(beatLevel === STORY_LEVELS ? 'STORY COMPLETE! Endless chefs await...' : `New chef card: ${beaten.name}!`);
      if (beatLevel === STORY_LEVELS) this.unlockExclusive('set', 'legend', 'Legend sushi set');
    }
    this.mission('serve');
    this.mission('beat');
    this.mission('recipe', 1, recipe);
    if (flawless) this.mission('flawless');
    if (this.progress.served(recipe)) {
      this.bankCoins(50);
      this.showToast(`Recipe mastered: ${recipe}! +50 coins`);
    }
    this.openChest(beatLevel);
    if (this.perks.stickers) this.openPacks(this.perks.stickers);
    if (this.progress.tutorial < 4) {
      this.progress.tutorial = 4;
      track('tutorial', { step: 4 });
      this.coach('Order served!', 'Every order beats a chef and opens the next level. Watch out: from now on chefs fight back!', 4);
    }
    this.earnTokens(this.special ? 3 : 1);
    this.addXp(15 + (flawless ? 10 : 0) + (this.special ? 50 : 0));
    this.crewOrder();
    this.checkRace();
    if (this.special) {
      this.winSpecial();
      return;
    }
    // A closed star gate ends the run here: earn more stars on earlier chefs to open it.
    if (this.journey && !this.progress.canEnter(beatLevel + 1)) {
      this.gateStop();
      return;
    }
    // A new scene for every order served.
    this.changeTheme(() => { this.themeIdx = (this.themeIdx + 1) % this.themeOrder.length; });
    this.popup(WORLD_W / 2, this.camY + this.viewH * 0.3, this.theme.name, 'rgba(255,255,255,0.8)', 15);
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 120 + Math.random() * 200;
      this.particles.push({ x: top.x + top.w / 2, y: top.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, life: 0.9, max: 0.9, color: '#ffd34d', size: 4 });
    }
    sfx.serve();
    haptic.success();
    this.newOrder();
    if (this.journey && (this.level - 1) % 10 === 0) this.queueStory(chapterFor(this.level), false);
    // The next boss steps in after the beaten one has had a moment to react.
    this.introIn = this.runMode === 'gauntlet' ? 0.4 : 1.2;
    // Every third chef in a journey, the sous chef offers a 3-drop bonus round.
    if (this.journey && this.ordersServed % 3 === 0) {
      this.bonus = { left: 3, ok: true };
      this.popup(WORLD_W / 2, this.top.y - 120, '👨‍🍳 SOUS CHEF CHALLENGE!', '#9fe3ff', 18, 2);
    }
    // Pick a perk for the rest of the run (journey and challenges).
    if ((this.runMode === 'journey' || this.runMode === 'challenge') && cfg.perksEvery > 0 && this.ordersServed % cfg.perksEvery === 0) {
      const ids = Object.keys(PERKS) as PerkId[];
      const choice: PerkId[] = [];
      while (choice.length < 3) {
        const id = ids[Math.floor(this.rand() * ids.length)];
        if (!choice.includes(id)) choice.push(id);
      }
      this.perkChoice = choice;
    }
  }

  /** Boss levels (every 10th) rage at half the order; endless Legends hit a final fury near the end. */
  updateRage(real: number): void {
    if (this.flurryLeft > 0 && (this.flurryT -= real) <= 0) {
      this.flurryLeft--;
      this.flurryT = 0.4;
      this.runEvent('knife');
    }
    if (this.runMode === 'puzzle' || this.calmChefs || this.special || this.level % 10 !== 0) return; // the critic and the Daily Special never rage
    const done = (this.height - this.order.start) / this.order.length;
    const phase = done >= 0.85 && this.level > STORY_LEVELS ? 2 : done >= cfg.rageAt ? 1 : 0;
    if (phase > this.rage) {
      this.rage = phase;
      this.banner = { title: phase === 2 ? 'FINAL FURY!' : 'RAGE MODE!', sub: phase === 2 ? 'Everything faster. Hold on!' : 'Faster layers, more attacks, knife flurries', life: 2.2 };
      this.bubble = { text: phase === 2 ? 'ENOUGH!!!' : 'Now I’m angry!', life: 1.8 };
      this.shake = 14;
      sfx.die();
      haptic.error();
    }
  }

  choosePerk(id: PerkId): void {
    track('perk', { id, level: this.level });
    this.perks[id] = (this.perks[id] ?? 0) + 1;
    this.perkChoice = null;
    const t = this.top;
    switch (id) {
      case 'wide': {
        this.baseW += 20;
        const grow = Math.min(20, this.baseW - t.w);
        t.x -= grow / 2;
        t.w += grow;
        if (this.moving) {
          const mc = this.moving.x + this.moving.w / 2;
          this.moving.w = t.w;
          this.moving.x = mc - t.w / 2;
        }
        break;
      }
      case 'steady': this.steady += 5; break;
      case 'shield': this.shieldHits += 2; break;
      case 'chance': this.freeChance = true; break;
      case 'coins': this.foxBonus += 0.15; break;
    }
    this.popup(WORLD_W / 2, t.y - 70, `${PERKS[id].icon} ${PERKS[id].name}!`, '#ffd34d', 18, 1.5);
    sfx.serve();
  }

  /** Coaching card at the bottom of the screen (first run, new ingredients, new features). */
  coach(title: string, text: string, t = 3.5): void {
    this.tip = { title, text, t };
  }

  fall(layer: Layer, side: number): void {
    this.pieces.push({ ...layer, vx: side * (60 + Math.random() * 60), vy: -60, rot: 0, spin: side * (2 + Math.random() * 3) });
  }

  die(): void {
    this.marks += 'M';
    this.resultKind = this.runMode === 'puzzle' ? 'puzzle-lost' : this.runMode === 'time' ? 'time' : this.runMode === 'challenge' ? 'challenge' : this.runMode === 'rescue' ? 'rescue-lost' : this.runMode === 'daily' ? 'daily' : this.runMode === 'relay' ? 'relay' : 'lost';
    this.mode = 'dead';
    this.reaction = null;
    this.event = null;
    this.projectiles = [];
    this.bubble = { text: this.chef.gloat, life: 99 };
    this.popups = [];
    this.deadAt = this.time;
    this.shake = 10;
    sfx.die();
    haptic.error();
    this.endRun();
    announce(`${this.resultTitle()} ${this.height} layers. Retry and Home buttons are below.`);
  }

  /** Banks the run's coins and records it (top runs, weekly challenge, loss streak). */
  endRun(): void {
    const p = this.progress;
    // Only bank what hasn't been banked yet (a continue can end the same run twice).
    const fresh = this.runCoins - this.bankedRunCoins;
    this.bankedRunCoins = this.runCoins;
    p.stat('coins', fresh);
    this.bank += fresh;
    save.setCoins(this.bank);
    // A slice of every run's coins also drops into the piggy bank, up to 2,500.
    p.piggy = Math.min(2500, p.piggy + Math.floor(fresh * 0.15));
    this.dinerRunEnd(fresh);
    this.recordDaily();
    if (this.runMode === 'relay') p.relayBest = Math.max(p.relayBest, this.height);
    if (this.journey && this.resultKind === 'lost' && !this.revived) this.recordChef(this.level, false);
    // The Tower of the World and the Country Cup.
    if (this.runMode !== 'pnp' && this.runMode !== 'relay' && this.runMode !== 'puzzle') {
      this.addWorldLayers(Math.max(0, this.height - (this.revived ? this.runXpAt : 0)));
      if (p.countryWeek.week !== weekKey()) p.countryWeek = { week: weekKey(), best: 0, runs: 0 };
      p.countryWeek.best = Math.max(p.countryWeek.best, this.height);
      p.countryWeek.runs++;
    }
    this.pickTrivia();
    this.checkLetters();
    if (this.runMode === 'zen') p.zenBest = Math.max(p.zenBest, this.height);
    if (this.runMode === 'time') p.timeBest = Math.max(p.timeBest, this.height);
    if (this.runMode === 'gauntlet') {
      p.gauntletBest = Math.max(p.gauntletBest, this.ordersServed);
      submitScore('gauntlet', this.ordersServed);
    }
    if (this.runMode === 'time') submitScore('time', this.height);
    if (this.journey) submitScore('level', p.unlocked);
    if (this.runMode === 'journey' || this.runMode === 'special' || this.runMode === 'challenge') submitScore('height', this.height);
    const counts = this.runMode === 'journey' || this.runMode === 'special' || this.runMode === 'challenge' || this.runMode === 'time';
    if (counts && this.height > this.best) {
      this.best = this.height;
      this.newBest = true;
      save.setBest(this.best);
      // Remember the shape of the record stack for the ghost.
      p.bestShape = this.stack.slice(0, 400).map((l) => [Math.round(l.x), Math.round(l.w)]);
    }
    if (counts && !this.revived) {
      for (const reward of p.endRun(this.height)) {
        this.bankCoins(reward);
        this.showToast(`Weekly challenge reward! +${reward} coins`);
      }
    }
    // Win streak: a journey run "wins" if it beats at least the chef it started on.
    if (this.journey && !this.revived) p.winStreak = this.ordersServed >= 1 ? p.winStreak + 1 : 0;
    // Weekend Sushi Cup: best single-run height this weekend.
    const cup = cupWeekend();
    if (cup.live && counts) {
      if (p.cup.key !== cup.key) p.cup = { key: cup.key, best: 0, claimed: false };
      p.cup.best = Math.max(p.cup.best, this.height);
    }
    this.checkRace();
    p.persist();
    track('run_end', { mode: this.runMode, level: this.level, height: this.height, coins: this.runCoins, served: this.ordersServed, result: this.resultKind });
    if (this.runMode === 'challenge' && this.challenge && !this.revived) {
      this.recordDuel();
      if (this.friendEmoji) this.showToast(this.height > this.challenge.score ? `You beat them! Answer their ${this.friendEmoji} with a share` : `They win this time ${this.friendEmoji}`);
    }
    if (this.runMode === 'pnp' && this.pnp) this.pnp.scores[this.pnp.turn - 1] = this.height;
    if (this.journey && this.resultKind === 'lost' && !this.revived) {
      // A loss counts toward this chef becoming your nemesis; a run with no chef beaten ends the Streak Quest.
      p.losses[this.level] = (p.losses[this.level] ?? 0) + 1;
      if (p.losses[this.level] === NEMESIS_AT) this.showToast(`😈 ${this.chef.name} is now your NEMESIS! Beat them for a big reward.`);
      if (this.ordersServed === 0) this.questLose();
      p.persist();
    }
    if (settings.clips) void this.clips.finish().then((f) => { this.clip = f; });
  }

  gateStop(): void {
    this.resultKind = 'gate';
    this.gated = starsNeeded(this.level);
    this.specialWon = true; // results screen shows it as a win
    this.mode = 'dead';
    this.deadAt = this.time;
    this.moving = null;
    this.event = null;
    this.projectiles = [];
    this.bubble = { text: `Come back with ${this.gated}★!`, life: 99 };
    this.endRun();
  }

  /** Daily Special cleared: pays once per day, then shows the results screen as a win. */
  winSpecial(): void {
    if (this.runMode === 'custom') this.customWon();
    if (this.runMode === 'modchal' && this.modChal) this.modChalWon(this.modChal);
    if (this.runMode === 'critic') {
      this.criticStars = Progress.starsFor(this.orderStats.perfects, this.orderStats.drops);
      this.criticResult(this.criticStars);
    }
    this.resultKind = 'special';
    this.specialWon = true;
    this.mode = 'dead';
    this.deadAt = this.time;
    this.moving = null;
    this.event = null;
    this.projectiles = [];
    this.bubble = { text: this.chef.beaten, life: 99 };
    if (this.runMode === 'special' && this.progress.specialDay !== dayKey()) {
      this.leaguePts(20);
      this.progress.specialDay = dayKey();
      this.progress.persist();
      this.addCoins(150, WORLD_W / 2, this.top.y - 80, 'Daily Special!');
    }
    this.endRun();
  }

  sparkle(x: number, y: number, w: number, n: number): void {
    const fx = EFFECTS.find((e) => e.id === this.equip.fx) ?? EFFECTS[0];
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? x : x + w;
      this.particles.push({
        x: side, y: y + (Math.random() - 0.5) * LAYER_H,
        vx: (side === x ? -1 : 1) * (40 + Math.random() * 120), vy: -40 - Math.random() * 120,
        life: 0.5 + Math.random() * 0.3, max: 0.8, color: fx.colors[i % fx.colors.length], size: fx.shape === 'square' ? 2 + Math.random() * 2 : 4 + Math.random() * 3,
        shape: fx.shape, rot: Math.random() * 6,
      });
    }
  }

  popup(x: number, y: number, text: string, color: string, size: number, life = 1.1): void {
    this.popups.push({ x, y, text, color, size, life, max: life });
  }

  // ------------------------------------------------------------------ update

  update(dt: number): void {
    dt = Math.min(dt, 1 / 20);
    if (this.paused) return;
    const real = dt;
    if (this.intro) {
      this.updateIntro(real);
      return;
    }
    if (this.mode === 'mini') {
      this.updateMini(real);
      if (this.celebration && (this.celebration.t -= real) <= 0) this.celebration = null;
      return;
    }
    this.updateRescue(real);
    // Chef voices: babble whenever a new speech bubble appears.
    const said = this.bubble?.text ?? '';
    if (said && said !== this.lastSaid && this.mode !== 'title') {
      let h = 0;
      for (const ch of this.chef.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      babble(said, 150 + (h % 12) * 22);
    }
    this.lastSaid = said;

    // Overlays and celebrations run in real time.
    if (this.adOverlay) this.adOverlay.t = Math.max(0, this.adOverlay.t - real);
    if (this.celebration && (this.celebration.t -= real) <= 0) this.celebration = null;
    for (const c of this.confetti) {
      c.x += c.vx * real;
      c.y += c.vy * real;
      c.rot += real * 6;
      c.life -= real;
    }
    this.confetti = this.confetti.filter((c) => c.life > 0 && c.y < this.viewH + 20);

    // Slow motion after PERFECT streaks; Fever and Time Attack count real seconds.
    if (this.slowmo > 0) {
      this.slowmo -= real;
      dt *= 0.35;
    }
    if (this.mode === 'playing') {
      if (this.fever > 0 && !this.perkChoice && !this.story) this.fever -= real;
      if (this.runMode === 'time' && (this.timeLeft -= real) <= 0) {
        this.timeLeft = 0;
        this.timeUp();
      }
      // Height milestones get a celebration once per run.
      for (const h of HEIGHT_MILESTONES) {
        if (this.height >= h && !this.milestonesHit.has(h)) {
          this.milestonesHit.add(h);
          this.celebrate(`${h} LAYERS!`, h >= 250 ? 'Legendary stacking!' : 'What a tower!');
        }
      }
    }
    setMusicIntensity(this.mode === 'playing' ? this.combo : 0, this.fever > 0);
    this.time += dt;

    const m = this.moving;
    this.fade = Math.min(1, this.fade + dt / 1.5);
    if (this.toast && (this.toast.life -= dt) <= 0) {
      const next = this.toastQueue.shift();
      // Move through a backlog faster so news doesn't pile up.
      this.toast = next ? { text: next, life: this.toastQueue.length ? 1.4 : 2 } : null;
    }

    if (this.tip && !this.dish && (this.tip.t -= real) <= 0) this.tip = null;
    if (this.upgradeFx && (this.upgradeFx.t += real) > 1.5) this.upgradeFx = null;
    if (this.mode === 'playing' && !this.perkChoice && !this.story) {
      if (this.flipT > 0) this.flipT -= real;
      if (this.frost > 0) this.frost -= real;
    }
    for (const fx of this.restFx) fx.t += real;
    this.restFx = this.restFx.filter((fx) => fx.t < 1.2);
    if (this.cheer && (this.cheer.t -= real) <= 0) this.cheer = null;
    if (this.sakeSay && (this.sakeSay.t -= real) <= 0) this.sakeSay = null;
    if ((this.guideT -= real) <= 0) {
      this.guideT = 0.5;
      this.checkGuide();
    }
    if (this.mode !== 'playing' && this.mode !== 'dead') {
      // Leaving a run: ASMR sounds and the camera switch off again.
      if (isAsmr()) {
        setAsmr(false);
        setMusic(this.musicOn);
      }
      if (this.camStream) this.stopCamera();
    }
    if (this.restSay && (this.restSay.t -= real) <= 0) this.restSay = null;
    if (this.burst) {
      const b = this.burst;
      b.t += real;
      for (const sp of b.sparks) {
        sp.t += real;
        sp.x += sp.vx * real;
        sp.y += sp.vy * real;
        sp.vy += 700 * real;
      }
      b.sparks = b.sparks.filter((sp) => sp.t < 1.2);
      // Coins keep pouring out on their own, a little faster with every tap.
      if (Math.random() < real * (8 + b.taps * 2)) b.sparks.push({ x: WORLD_W / 2 + (Math.random() - 0.5) * 30, y: this.viewH / 2 - 10, vx: (Math.random() - 0.5) * 200, vy: -160 - Math.random() * 200, t: 0 });
      if (b.t >= 2.4) this.finishBurst();
    }
    if (settings.reducedMotion) {
      this.shake = 0;
      this.flash = 0;
    }
    if ((this.achT -= real) <= 0) {
      this.achT = 1;
      this.checkAchievements();
    }
    if (!this.story && this.storyQueue.length) this.story = this.storyQueue.shift()!;
    if (this.mode === 'playing' && !this.perkChoice && !this.story) this.updateRage(real);
    if (m?.twin && this.mode !== 'dead' && !this.perkChoice && !this.picker && !this.story) {
      // Twins: the two halves swing apart and back together over the stack.
      this.twinPhase += (this.speed() / 140) * dt;
      this.twinSep = Math.abs(Math.cos(this.twinPhase)) * 70;
    } else if (m && this.mode !== 'dead' && !this.perkChoice && !this.picker && !this.story) {
      const step = this.speed() * dt * this.moveDir;
      m.x += step;
      m.origin += step;
      // Bounce at the edges so a player who waits always gets another pass.
      const min = -m.w * 0.5;
      const max = WORLD_W - m.w * 0.5;
      if (m.x < min) { m.origin += min - m.x; m.x = min; this.moveDir = 1; }
      if (m.x > max) { m.origin += max - m.x; m.x = max; this.moveDir = -1; }
    }

    // The tower's sway: energy from sloppy drops fades, and a tall swaying tower creaks.
    this.wobbleE *= Math.exp(-real * 0.35);
    if (this.mode === 'playing' && this.swayAmp() > 8 && this.time - this.creakAt > 3.2 && !settings.reducedMotion) {
      this.creakAt = this.time;
      sfx.creak();
    }
    // Audio-only play: a tone panned to where the layer is, higher as it lines up.
    if (settings.audioOnly && m && this.mode === 'playing' && !this.paused) {
      cue.start();
      const dx = m.x - this.top.x;
      cue.update(dx / 120, Math.max(0, 1 - Math.abs(dx) / 140), !this.event || !this.event.bad);
      const inZone = Math.abs(dx) <= PERFECT_TOL;
      if (inZone && !this.cueZone) cue.zone();
      this.cueZone = inZone;
    } else cue.update(0, 0, false);
    // Drop-timing vibration: a tick each time the sliding layer lines up with the stack.
    if (settings.hapticAssist && m && this.mode === 'playing' && !m.twin) {
      const aligned = Math.abs(m.x - this.top.x) <= PERFECT_TOL;
      if (aligned && !this.wasAligned) {
        haptic.light();
        sfx.tap();
      }
      this.wasAligned = aligned;
    }
    // Screen reader: every 0.4 s, the next frame records the text it draws, so buttons
    // without a label can be named after the words drawn on them.
    if (this.a11yRec) {
      this.a11yRec = false;
      const texts = this.qaTexts ?? [];
      this.qaTexts = null;
      this.mirrorA11y(texts);
    } else if ((this.a11yT -= real) <= 0) {
      this.a11yT = 0.4;
      if (!this.qaTexts) {
        this.qaTexts = [];
        this.a11yRec = true;
      }
    }
    this.camY += (this.targetCam() - this.camY) * Math.min(1, dt * 4);

    for (const p of this.pieces) {
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    this.pieces = this.pieces.filter((p) => p.y < this.camY + this.viewH + 200);
    for (const pt of this.particles) {
      pt.vy += 500 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const pp of this.popups) { pp.y -= (30 * 1.1 / pp.max) * dt; pp.life -= dt; }
    if (this.reaction && (this.reaction.life -= dt) <= 0) this.reaction = null;
    if (this.bubble && (this.bubble.life -= dt) <= 0) this.bubble = null;
    if (this.introIn > 0 && (this.introIn -= dt) <= 0 && this.mode === 'playing') this.announceChef();
    if (this.event && this.mode === 'playing' && (this.event.t -= dt) <= 0) {
      const kind = this.event.kind;
      this.event = null;
      this.runEvent(kind);
    }
    this.updateProjectiles(dt);
    if (this.banner && (this.banner.life -= dt) <= 0) this.banner = null;
    for (const sp of this.splats) sp.life -= dt;
    this.splats = this.splats.filter((sp) => sp.life > 0);
    // The chef keeps to one side, walking across when they switch.
    this.chefX += (this.chefHome(this.chefSide) - this.chefX) * Math.min(1, dt * 3);
    if (this.dish) {
      this.dish.t += dt;
      if (!this.dish.ate && this.dish.t >= 1.65) {
        this.dish.ate = true;
        sfx.perfect(6);
        haptic.success();
      }
      if (this.dish.t > 3.2) this.dish = null;
    }
    this.popups = this.popups.filter((pp) => pp.life > 0);
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt);
  }

  // ------------------------------------------------------------------ render

  muteButton() {
    return { x: settings.leftHanded ? WORLD_W - this.insets.right - 26 : this.insets.left + 26, y: this.insets.top + 30, r: 14 };
  }

  render(): void {
    const { ctx } = this;
    const s = this.scale * this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;
    ctx.setTransform(s, 0, 0, s, (sx + this.offX) * s, sy * s);

    // Crossfade from the previous scene to the current one.
    const bw = WORLD_W + this.offX * 2;
    if (this.prevTheme && this.fade < 1) drawBackdrop(ctx, this.prevTheme, this.specks, this.time, this.camY, -this.offX, bw, this.viewH);
    drawBackdrop(ctx, this.theme, this.specks, this.time, this.camY, -this.offX, bw, this.viewH, 1, this.prevTheme ? this.fade : 1);
    const hol = currentHoliday();
    if (hol) drawHolidayOverlay(ctx, hol.holiday.decor, this.specks, this.time, this.camY, -this.offX, bw, this.viewH);
    // Table mode: your camera instead of the scene. Otherwise, the climb: rooftops, clouds, planes, then space.
    const table = this.drawTable();
    if (!table && !this.intro && (this.mode === 'playing' || this.mode === 'dead')) drawSky(ctx, this.height, this.time, -this.offX, bw, this.viewH, this.camY, settings.reducedMotion || this.lite);

    this.buttons = [];
    this.guideRect = null;
    if (this.intro) {
      this.drawIntro();
      return;
    }
    if (this.mode === 'mini' && this.mini) {
      this.drawMiniGame();
      this.drawOverlays();
      this.drawToast();
      return;
    }
    if (this.scrolling) {
      if (this.mode === 'shop') this.drawShop();
      else if (this.mode === 'map') this.drawMap();
      else if (this.mode === 'album') this.drawAlbum();
      else if (this.mode === 'modes') this.drawModes();
      else if (this.mode === 'events') this.drawEvents();
      else if (this.mode === 'more') this.drawMore();
      else if (this.mode === 'restaurant') this.drawRestaurant();
      else if (this.mode === 'pass') this.drawPass();
      else if (this.mode === 'pets') this.drawPets();
      else if (this.mode === 'boards') this.drawBoards();
      else if (this.mode === 'avatar') this.drawAvatar();
      else if (this.mode === 'regulars') this.drawRegulars();
      else if (this.mode === 'story') this.drawStory();
      else if (this.mode === 'trophies') this.drawTrophies();
      else if (this.mode === 'gallery') this.drawGallery();
      else if (this.mode === 'settings') this.drawSettings();
      else if (this.mode === 'diagnostics') this.drawDiagnostics();
      else if (this.mode === 'funnel') this.drawFunnel();
      else if (this.mode === 'visit') this.drawVisit();
      else if (this.mode === 'museum') this.drawMuseum();
      else if (this.mode === 'profile') this.drawProfile();
      else if (this.mode === 'calendar') this.drawCalendar();
      else if (this.mode === 'league') this.drawLeague();
      else if (this.mode === 'quest') this.drawQuest();
      else if (this.mode === 'rescues') this.drawRescues();
      else if (this.mode === 'towerview') this.drawTower();
      else if (this.mode === 'minis') this.drawMinis();
      else if (this.mode === 'modchals') this.drawModChals();
      else if (this.mode === 'lab') this.drawLab();
      else if (this.mode === 'jukebox') this.drawJukebox();
      else if (this.mode === 'daily') this.drawDaily();
      else if (this.mode === 'bossmaker') this.drawBossMaker();
      else if (this.mode === 'book') this.drawBook();
      else if (this.mode === 'promise') this.drawPromise();
      else if (this.mode === 'world') this.drawWorld();
      else if (this.mode === 'countries') this.drawCountries();
      else if (this.mode === 'collection') this.drawCollection();
      this.drawTopBar();
      this.drawOverlays();
      this.drawToast();
      return;
    }

    // The boss looms behind the counter, so the stack is drawn over them.
    if (this.mode === 'playing') this.drawBossBody(this.chefX, this.bossY(), this.bossScale());

    ctx.save();
    if (this.runMode === 'asmr' && this.mode === 'playing') {
      // ASMR: a close-up of the counter.
      const fx = WORLD_W / 2;
      const fy = this.viewH * 0.55;
      ctx.translate(fx, fy);
      ctx.scale(1.18, 1.18);
      ctx.translate(-fx, -fy);
    }
    ctx.translate(0, -this.camY);
    this.drawCounter();
    // Only draw the layers that are on screen; tall stacks can have hundreds.
    const minY = this.camY - LAYER_H;
    const maxY = this.camY + this.viewH;
    this.drawGhost(minY, maxY);
    const mirror = this.mods.has('mirror') && (this.mode === 'playing' || this.mode === 'dead');
    if (mirror) {
      ctx.save();
      ctx.translate(WORLD_W, 0);
      ctx.scale(-1, 1);
    }
    for (const l of this.stack) {
      if (l.y <= minY || l.y >= maxY) continue;
      const sw = this.swayAt(l.y);
      if (sw) ctx.translate(sw, 0);
      this.drawLayer(l);
      if (sw) ctx.translate(-sw, 0);
    }
    for (const f of this.flags) {
      if (f.y <= minY - 40 || f.y >= maxY + 40) continue;
      const sw = this.swayAt(f.y);
      drawFlag(ctx, this.equip.flag, f.x + sw, f.y, f.hue);
    }
    if (this.mode === 'playing' && this.runMode !== 'asmr') this.drawLandmarks(minY, maxY);
    if (this.mode !== 'title') {
      // LAST only when it differs from BEST, so the two lines never sit on top of each other.
      if (this.progress.lastRun !== this.best) this.drawMarker(this.progress.lastRun, 'LAST', 'rgba(255,255,255,0.35)', minY, maxY);
      this.drawMarker(this.best, 'BEST', '#ffd34d', minY, maxY);
      if (this.challenge) this.drawMarker(this.challenge.score, 'FRIEND', '#ff8fb8', minY, maxY);
    }
    // Owl companion: guide lines above the stack edges for the first layers of a run.
    if (this.mode === 'playing' && this.height < this.owlLayers) {
      const t = this.top;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x, t.y - LAYER_H * 2.5);
      ctx.moveTo(t.x + t.w, t.y);
      ctx.lineTo(t.x + t.w, t.y - LAYER_H * 2.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (this.moving && this.mode !== 'dead') {
      const mv = this.moving;
      // The sliding layer sways with the top of the tower, so what lines up on screen lines up for real.
      const msw = this.swayAt(this.top.y);
      ctx.translate(msw, 0);
      if (mv.twin) {
        // Two halves, apart by twinSep on each side.
        const half = mv.w / 2;
        this.drawLayer({ ...mv, w: half, x: mv.x - this.twinSep });
        this.drawLayer({ ...mv, w: half, x: mv.x + half + this.twinSep, origin: mv.origin });
      } else if (this.mods.has('blind')) {
        // Blind: just a flickering outline.
        ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.25 * Math.sin(this.time * 9)})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        this.roundRect(mv.x, mv.y, mv.w, LAYER_H, 6);
        ctx.stroke();
        ctx.setLineDash([]);
      } else this.drawLayer(mv);
      if (this.relay && this.runMode === 'relay' && this.mode === 'playing') {
        // Relay: the sliding layer is outlined in the colour of the player whose turn it is.
        ctx.strokeStyle = this.relayColor(this.relay.turn);
        ctx.lineWidth = 3;
        this.roundRect(mv.x - 2, mv.y - 2, mv.w + 4, LAYER_H + 4, 8);
        ctx.stroke();
      }
      ctx.translate(-msw, 0);
      if (mirror) ctx.restore();
      // A combo is one PERFECT away.
      const cb = this.mode === 'playing' && this.lastPerfect ? comboFor(this.top.kind, mv.kind) : undefined;
      if (cb && !mv.special) this.text(`${cb.emoji} ${cb.name} if PERFECT`, Math.max(80, Math.min(WORLD_W - 80, mv.x + mv.w / 2)), mv.y - 12, 11, '#9fe3ff', 900);
      if (this.moving.special && this.mode === 'playing') {
        const m = this.moving;
        this.text(this.specialLabel(m.special!), Math.max(80, Math.min(WORLD_W - 80, m.x + m.w / 2)), m.y - 12, 11, '#ffffff', 900);
      }
      if (this.steady > 0) {
        ctx.strokeStyle = `rgba(159,227,255,${0.6 + 0.4 * Math.sin(this.time * 8)})`;
        ctx.lineWidth = 3;
        this.roundRect(this.moving.x - 2, this.moving.y - 2, this.moving.w + 4, LAYER_H + 4, 8);
        ctx.stroke();
      }
    } else if (mirror) ctx.restore();
    this.drawWater();
    for (const p of this.projectiles) {
      if (p.kind === 'knife') {
        drawKnife(ctx, p.x, p.y, p.rot, 1.3);
      } else {
        ctx.fillStyle = '#f6f1e4';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#24321f';
        ctx.fillRect(p.x - 12, p.y + 2, 24, 7);
      }
    }
    for (const p of this.pieces) {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + LAYER_H / 2);
      ctx.rotate(p.rot);
      ctx.translate(-(p.x + p.w / 2), -(p.y + LAYER_H / 2));
      this.drawLayer(p);
      ctx.restore();
    }
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.life / pt.max;
      if (pt.shape && pt.shape !== 'square') {
        drawShape(ctx, pt.shape, pt.x, pt.y, pt.size, pt.color, (pt.rot ?? 0) + this.time * 4);
      } else {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
    }
    ctx.globalAlpha = 1;
    this.qaSkip = true;
    for (const pp of this.runMode === 'asmr' ? [] : this.popups) {
      ctx.globalAlpha = Math.min(1, pp.life * 2);
      this.text(pp.text, pp.x, pp.y, pp.size, pp.color);
    }
    this.qaSkip = false;
    ctx.globalAlpha = 1;
    ctx.restore();

    for (const sp of this.splats) this.drawSplat(sp);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,243,176,${this.flash * 0.35})`;
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    }
    if (this.mode === 'playing') this.drawWeather();

    this.drawHud();
    this.drawOverlays();
    this.drawToast();
  }

  /** Wind streaks, rain, and the frost attack's icy edges. */
  drawWeather(): void {
    const { ctx } = this;
    const L = -this.offX;
    const W = WORLD_W + this.offX * 2;
    const wt = this.weather;
    if (wt?.kind === 'wind') {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const y = (i * 83 + this.time * 20) % this.viewH;
        const x = L + (((i * 137 + this.time * 340 * wt.dir) % W) + W) % W;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 40 * wt.dir, y);
        ctx.stroke();
      }
    } else if (wt?.kind === 'rain') {
      ctx.strokeStyle = 'rgba(170,200,255,0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) {
        const x = L + ((i * 53) % W) + ((this.time * 60) % 20);
        const y = (i * 71 + this.time * 520) % this.viewH;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y + 14);
        ctx.stroke();
      }
    }
    if (this.frost > 0) {
      const a = Math.min(1, this.frost, 3.5 - this.frost + 0.3);
      const g = ctx.createRadialGradient(WORLD_W / 2, this.viewH / 2, this.viewH * 0.18, WORLD_W / 2, this.viewH / 2, this.viewH * 0.6);
      g.addColorStop(0, 'rgba(220,240,255,0)');
      g.addColorStop(1, `rgba(220,240,255,${0.92 * a})`);
      ctx.fillStyle = g;
      ctx.fillRect(L, 0, W, this.viewH);
      ctx.globalAlpha = a * 0.8;
      this.qaSkip = true;
      for (let i = 0; i < 12; i++) this.text('❄', L + ((i * 97) % W), (i * 131) % this.viewH, 14 + (i % 3) * 6, '#ffffff', 400);
      this.qaSkip = false;
      ctx.globalAlpha = 1;
    }
  }

  drawCounter(): void {
    const { ctx } = this;
    // Wooden counter from the plate down past the bottom of the screen.
    const counterY = 14;
    const t = this.theme;
    ctx.fillStyle = t.counter;
    ctx.fillRect(-this.offX - 20, counterY, WORLD_W + this.offX * 2 + 40, 2000);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(-this.offX, counterY + 18 + i * 26);
      ctx.bezierCurveTo(120, counterY + 10 + i * 26, 260, counterY + 30 + i * 26, WORLD_W + this.offX, counterY + 16 + i * 26);
      ctx.stroke();
    }
    ctx.fillStyle = t.counterEdge;
    ctx.fillRect(-this.offX - 20, counterY, WORLD_W + this.offX * 2 + 40, 6);
    drawPlate(ctx, this.equip.plate, WORLD_W / 2, 0);
    // Equipped companions sit on the counter beside the plate.
    this.progress.companions.forEach((id, i) => {
      const c = COMPANIONS.find((x) => x.id === id);
      if (!c || !companionLevel(this.progress.shards[id] ?? 0)) return;
      const cx = i === 0 ? 24 : WORLD_W - 24;
      this.text(c.emoji, cx, -4 + Math.sin(this.time * 3 + i) * 2, 30, '#fff', 400);
    });
  }

  roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const { ctx } = this;
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawLayer(l: Layer): void {
    const { ctx } = this;
    const { x, y, w } = l;
    const h = LAYER_H;
    ctx.save();
    this.roundRect(x, y, w, h, 6);
    ctx.fillStyle = this.color(l.kind);
    ctx.fill();
    ctx.clip();

    // Texture is drawn at fixed positions relative to `origin`, so it doesn't jump when a layer is trimmed.
    const start = Math.floor((x - l.origin) / 12) - 1;
    const end = Math.ceil((x + w - l.origin) / 12) + 1;
    switch (l.kind) {
      case 'rice':
        ctx.fillStyle = '#ffffff';
        for (let i = start; i < end; i++) {
          for (let row = 0; row < 3; row++) {
            const gx = l.origin + i * 12 + ((i * 7 + row * 5) % 9);
            ctx.beginPath();
            ctx.ellipse(gx, y + 5 + row * 7, 3.2, 2, ((i + row) % 3) * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(x, y + h - 4, w, 4);
        break;
      case 'salmon':
      case 'tuna':
        ctx.strokeStyle = l.kind === 'salmon' ? 'rgba(255,230,215,0.85)' : 'rgba(255,170,180,0.45)';
        ctx.lineWidth = l.kind === 'salmon' ? 3 : 2;
        for (let i = start; i < end; i++) {
          const gx = l.origin + i * 12;
          ctx.beginPath();
          ctx.moveTo(gx, y + h);
          ctx.quadraticCurveTo(gx + 6, y + h / 2, gx + 14, y);
          ctx.stroke();
        }
        break;
      case 'nori':
        ctx.fillStyle = 'rgba(120,160,110,0.18)';
        for (let i = start; i < end; i++) ctx.fillRect(l.origin + i * 12 + ((i * 5) % 7), y + 3 + ((i * 3) % 14), 5, 2);
        break;
      case 'avocado':
        ctx.fillStyle = '#d9ed92';
        ctx.fillRect(x, y, w, 7);
        break;
      case 'cucumber':
        ctx.fillStyle = '#cfe9b8';
        ctx.fillRect(x, y + 5, w, h - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = start; i < end; i++) ctx.fillRect(l.origin + i * 12 + 4, y + h / 2 - 1, 3, 3);
        break;
      case 'egg':
        ctx.fillStyle = 'rgba(200,120,0,0.25)';
        ctx.fillRect(x, y + 7, w, 2);
        ctx.fillRect(x, y + 15, w, 2);
        ctx.fillStyle = 'rgba(150,80,0,0.35)';
        ctx.fillRect(x, y, w, 3);
        break;
      case 'ebi':
        // Curved white bands of a shrimp.
        ctx.strokeStyle = 'rgba(255,240,230,0.85)';
        ctx.lineWidth = 3;
        for (let i = start; i < end; i++) {
          const gx = l.origin + i * 12;
          ctx.beginPath();
          ctx.arc(gx + 6, y + h + 4, 12, Math.PI * 1.2, Math.PI * 1.8);
          ctx.stroke();
        }
        break;
      case 'unagi':
        // Glossy grilled eel with sauce marks.
        ctx.fillStyle = 'rgba(40,15,5,0.45)';
        for (let i = start; i < end; i++) ctx.fillRect(l.origin + i * 12 + 2, y + 4, 7, h - 8);
        ctx.fillStyle = 'rgba(255,200,120,0.35)';
        ctx.fillRect(x, y + 3, w, 3);
        break;
      case 'tofu':
        ctx.strokeStyle = 'rgba(180,150,100,0.35)';
        ctx.lineWidth = 1;
        for (let i = start; i < end; i++) ctx.strokeRect(l.origin + i * 12 + 1, y + 4, 10, h - 8);
        break;
      case 'dough':
      case 'pancake':
      case 'bun': {
        // Golden crust with darker toasted spots; buns get sesame seeds.
        ctx.fillStyle = l.kind === 'pancake' ? 'rgba(150,90,30,0.35)' : 'rgba(160,100,30,0.3)';
        ctx.fillRect(x, y + h - 5, w, 5);
        for (let i = start; i < end; i++) {
          if (l.kind === 'bun') {
            ctx.fillStyle = '#fff3d6';
            ctx.beginPath();
            ctx.ellipse(l.origin + i * 12 + 6, y + 5 + ((i * 3) % 6), 2.2, 1.2, 0.4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(140,80,20,0.3)';
            ctx.beginPath();
            ctx.arc(l.origin + i * 12 + 4, y + 8 + ((i * 7) % 8), 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case 'sauce':
      case 'syrup':
        // A glossy wave along the top, with drips.
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x, y + 3, w, 3);
        ctx.fillStyle = l.kind === 'sauce' ? '#8d0b16' : '#5a2a0a';
        for (let i = start; i < end; i += 2) {
          ctx.beginPath();
          ctx.ellipse(l.origin + i * 12 + 6, y + h - 2, 3, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'cheese':
      case 'cheddar':
        // Melty drips and holes.
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x, y + 2, w, 3);
        for (let i = start; i < end; i++) {
          ctx.fillStyle = l.kind === 'cheese' ? 'rgba(200,140,20,0.35)' : 'rgba(170,90,0,0.35)';
          ctx.beginPath();
          ctx.arc(l.origin + i * 12 + 6, y + 10 + ((i * 5) % 6), 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'pepperoni':
      case 'tomato':
      case 'berry':
        // Round slices in a row.
        for (let i = start; i < end; i++) {
          const gx = l.origin + i * 12 + 6;
          ctx.fillStyle = l.kind === 'pepperoni' ? '#c1121f' : l.kind === 'tomato' ? '#ff6b6b' : '#7b7fe6';
          ctx.beginPath();
          ctx.arc(gx, y + h / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(gx - 2, y + h / 2 - 3, 2, 2);
        }
        break;
      case 'basil':
      case 'lettuce':
        // Leafy ripples.
        ctx.strokeStyle = l.kind === 'basil' ? '#bfe8c0' : '#d8f3a0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = start; i < end; i++) {
          const gx = l.origin + i * 12;
          ctx.moveTo(gx, y + h / 2);
          ctx.quadraticCurveTo(gx + 6, y + 2, gx + 12, y + h / 2);
        }
        ctx.stroke();
        break;
      case 'patty':
        // Grill marks.
        ctx.fillStyle = 'rgba(20,10,5,0.45)';
        for (let i = start; i < end; i += 2) ctx.fillRect(l.origin + i * 12 + 3, y + 3, 4, h - 6);
        break;
      case 'butter':
      case 'cream':
        // Soft swirls.
        ctx.strokeStyle = l.kind === 'butter' ? 'rgba(220,180,40,0.6)' : 'rgba(200,180,160,0.6)';
        ctx.lineWidth = 1.5;
        for (let i = start; i < end; i += 2) {
          ctx.beginPath();
          ctx.arc(l.origin + i * 12 + 6, y + h / 2, 4, 0, Math.PI * 1.6);
          ctx.stroke();
        }
        break;
      case 'lavash':
      case 'yufka':
        // Thin flatbread: toasted spots, and yufka shows its paper-thin sheets.
        ctx.fillStyle = 'rgba(150,100,40,0.3)';
        for (let i = start; i < end; i++) {
          ctx.beginPath();
          ctx.ellipse(l.origin + i * 12 + 5, y + 6 + ((i * 7) % 11), 2.6, 1.6, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        if (l.kind === 'yufka') {
          ctx.fillStyle = 'rgba(255,250,220,0.55)';
          for (let k = 0; k < 4; k++) ctx.fillRect(x, y + 3 + k * 5, w, 1.2);
        }
        break;
      case 'doner':
      case 'mince':
        // Shaved meat strips, browned edges.
        ctx.fillStyle = l.kind === 'doner' ? 'rgba(60,25,10,0.45)' : 'rgba(40,15,10,0.4)';
        for (let i = start; i < end; i++) {
          const gx = l.origin + i * 12;
          ctx.beginPath();
          ctx.moveTo(gx, y + h);
          ctx.lineTo(gx + 5, y + 2);
          ctx.lineTo(gx + 8, y + 2);
          ctx.lineTo(gx + 3, y + h);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,200,140,0.3)';
        ctx.fillRect(x, y + 2, w, 2);
        break;
      case 'onion':
        // Purple-rimmed rings.
        ctx.strokeStyle = 'rgba(140,70,160,0.65)';
        ctx.lineWidth = 1.6;
        for (let i = start; i < end; i++) {
          ctx.beginPath();
          ctx.ellipse(l.origin + i * 12 + 6, y + h / 2, 5, 7, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      case 'pistachio':
        // Crushed green nuts.
        for (let i = start; i < end; i++) {
          for (let row = 0; row < 3; row++) {
            ctx.fillStyle = row % 2 ? '#4f772d' : '#b5d99c';
            ctx.beginPath();
            ctx.arc(l.origin + i * 12 + ((i * 5 + row * 7) % 11), y + 5 + row * 7, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case 'ikura':
        for (let i = start; i < end; i++) {
          for (let row = 0; row < 2; row++) {
            const gx = l.origin + i * 12 + (row ? 6 : 0) + 3;
            ctx.fillStyle = '#ff7b3a';
            ctx.beginPath();
            ctx.arc(gx, y + 7 + row * 10, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillRect(gx - 2, y + 4 + row * 10, 2, 2);
          }
        }
        break;
    }
    // Special layers get a distinct finish.
    switch (l.special) {
      case 'golden': {
        ctx.fillStyle = 'rgba(255,211,77,0.55)';
        ctx.fillRect(x, y, w, h);
        const sx = x + ((this.time * 180) % (w + 60)) - 30;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + 14, y);
        ctx.lineTo(sx + 4, y + h);
        ctx.lineTo(sx - 10, y + h);
        ctx.fill();
        break;
      }
      case 'ice':
        ctx.fillStyle = 'rgba(180,230,255,0.55)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        for (let i = start; i < end; i += 2) {
          const gx = l.origin + i * 12;
          ctx.beginPath();
          ctx.moveTo(gx, y + 4);
          ctx.lineTo(gx + 6, y + h - 4);
          ctx.stroke();
        }
        break;
      case 'wasabi':
        ctx.fillStyle = 'rgba(130,190,40,0.6)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#d9f99d';
        for (let i = start; i < end; i++) ctx.fillRect(l.origin + i * 12 + 3, y + 6 + ((i * 7) % 10), 3, 3);
        break;
      case 'mystery':
        ctx.fillStyle = 'rgba(123,44,191,0.65)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#e0aaff';
        ctx.font = `900 14px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = start; i < end; i += 3) ctx.fillText('?', l.origin + i * 12 + 6, y + h / 2 + 1);
        break;
    }
    if (l.fancy) {
      // Fancy cut: gold diagonal garnish lines.
      ctx.strokeStyle = 'rgba(255,215,90,0.85)';
      ctx.lineWidth = 2;
      for (let i = start; i < end; i += 2) {
        const gx = l.origin + i * 12;
        ctx.beginPath();
        ctx.moveTo(gx, y + h);
        ctx.lineTo(gx + 10, y);
        ctx.stroke();
      }
    }
    if ((this.progress.mastery[l.kind] ?? 0) >= MASTERY) {
      // Mastered ingredient: a shimmering gold rim.
      const sh = ctx.createLinearGradient(x, 0, x + w, 0);
      const k = (this.time * 0.4 + l.origin * 0.002) % 1;
      sh.addColorStop(0, '#d4a537');
      sh.addColorStop(Math.max(0, k - 0.1), '#d4a537');
      sh.addColorStop(k, '#fff3b0');
      sh.addColorStop(Math.min(1, k + 0.1), '#d4a537');
      sh.addColorStop(1, '#d4a537');
      ctx.fillStyle = sh;
      ctx.fillRect(x, y + h - 3, w, 3);
    }
    if (settings.colorblind) {
      const [sym, ink] = SYMBOLS[l.kind];
      ctx.fillStyle = ink;
      ctx.font = `700 14px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = Math.floor((x - l.origin) / 48) - 1; i <= Math.ceil((x + w - l.origin) / 48); i++) ctx.fillText(sym, l.origin + i * 48 + 24, y + h / 2 + 1);
    }
    // Soft highlight on the top edge.
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, w, 3);
    ctx.restore();
  }



  text(str: string, x: number, y: number, size: number, color = '#fff', weight = 800, align: CanvasTextAlign = 'center'): void {
    const { ctx } = this;
    ctx.font = `${Math.min(weight, 700)} ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    if (this.qaTexts && !this.qaSkip) this.qaRecord(str, x, y, size, align);
  }

  // ------------------------------------------------------- layout checker
  // In dev builds, window.__qa() lists text that runs off screen or overlaps other text, so every
  // screen can be checked automatically at any phone size.

  qaTexts: { str: string; x0: number; y0: number; x1: number; y1: number }[] | null = null;
  qaClip: [number, number] | null = null; // vertical clip of the scrolling list being drawn
  qaSkip = false; // floating score popups move and fade, so they aren't checked

  /** A full-screen overlay hides everything drawn before it. */
  qaCover(): void {
    if (this.qaTexts) this.qaTexts.length = 0;
  }

  qaRecord(str: string, x: number, y: number, size: number, align: CanvasTextAlign): void {
    const { ctx } = this;
    const w = ctx.measureText(str).width;
    const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    // Convert to screen pixels through the current transform, then back to world units.
    const m = ctx.getTransform();
    const k = this.scale * this.dpr;
    const p0 = new DOMPoint(left, y - size * 0.5).matrixTransform(m);
    const p1 = new DOMPoint(left + w, y + size * 0.5).matrixTransform(m);
    const r = { str, x0: p0.x / k - this.offX, y0: p0.y / k, x1: p1.x / k - this.offX, y1: p1.y / k };
    const cy = (r.y0 + r.y1) / 2;
    if (this.qaClip && (cy < this.qaClip[0] || cy > this.qaClip[1])) return; // hidden by the list's clip
    this.qaTexts!.push(r);
  }

  /** Renders one frame while recording text, then reports problems. */
  qa(): { offscreen: string[]; overlaps: string[] } {
    this.qaTexts = [];
    this.render();
    const t = this.qaTexts;
    this.qaTexts = null;
    const visible = t.filter((r) => r.y1 > 0 && r.y0 < this.viewH && r.str.trim());
    const offscreen = visible.filter((r) => r.x0 < -this.offX - 1 || r.x1 > WORLD_W + this.offX + 1).map((r) => `${r.str} [${Math.round(r.x0)}..${Math.round(r.x1)}]`);
    const overlaps: string[] = [];
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i];
        const b = visible[j];
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ox > 2 && oy > Math.min(a.y1 - a.y0, b.y1 - b.y0) * 0.35) overlaps.push(`"${a.str}" × "${b.str}"`);
      }
    }
    return { offscreen, overlaps };
  }

  holding(): Holding {
    const e = this.event;
    if (!e) return null;
    return e.kind === 'knife' || e.kind === 'flurry' || e.kind === 'steal' ? 'knife' : e.kind === 'slam' || e.kind === 'flip' ? 'fist' : e.kind === 'patch' ? 'patty' : null;
  }

  drawBossBody(x: number, y: number, s: number): void {
    // Watch and point at the sliding layer; on the results screen, at the player.
    const m = this.moving;
    const lookX = m && this.mode === 'playing' ? m.x + m.w / 2 : x;
    const lookY = m && this.mode === 'playing' ? m.y + LAYER_H / 2 - this.camY : y + 300;
    drawChef(this.ctx, this.chefLook(this.chef, this.level), x, y, s, this.chefMood(), lookX, lookY, this.time, this.mode === 'playing' ? this.holding() : null);
  }

  drawBossLabels(x: number, y: number, s: number): void {
    const { ctx } = this;
    const c = this.chef;
    const e = this.event;
    const chestY = y + 42 * s;
    let badge: [number, number] | null = null; // x range of the chest badge or attack label
    if (this.banner && this.mode === 'playing') {
      // New boss: level banner under the order card, on the side away from the chef.
      // Sized to fit long endless-mode rules, and kept on screen.
      ctx.font = `700 12px ${FONT}`;
      const bw = Math.min(WORLD_W - 16, Math.max(210, ctx.measureText(this.banner.sub).width + 24));
      const bx = Math.max(8 + bw / 2, Math.min(WORLD_W - 8 - bw / 2, this.cardX() + 118));
      const byc = this.insets.top + 182;
      ctx.globalAlpha = Math.min(1, this.banner.life * 3);
      ctx.fillStyle = 'rgba(20,10,25,0.85)';
      this.roundRect(bx - bw / 2, byc - 26, bw, 52, 14);
      ctx.fill();
      this.text(this.banner.title, bx, byc - 9, 22, '#ffffff', 900);
      this.text(this.banner.sub, bx, byc + 13, 12, '#ffd34d', 700);
      ctx.globalAlpha = 1;
    }
    if (!e || this.mode !== 'playing') {
      // Name badge pinned on the uniform.
      const tag = c.name.toUpperCase();
      ctx.font = `800 11px ${FONT}`;
      const tw = ctx.measureText(tag).width + 16;
      const tx = Math.max(tw / 2 + 4, Math.min(WORLD_W - tw / 2 - 4, x));
      badge = [tx - tw / 2, tx + tw / 2];
      ctx.fillStyle = c.accent;
      this.roundRect(tx - tw / 2, chestY - 9, tw, 18, 9);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      this.text(tag, tx, chestY + 1, 11, '#ffffff', 800);
    }

    // Warning (attack) or good-news (help) label while the chef winds up.
    if (e && this.mode === 'playing') {
      const label = e.bad ? ATTACK_INFO[e.kind as Attack].label : HELP_INFO[e.kind as Help].label;
      const ly = chestY;
      const pulse = 1 + 0.08 * Math.sin(this.time * 20);
      ctx.font = `900 16px ${FONT}`;
      const lw = ctx.measureText(label).width + 26;
      const lx = Math.max(lw / 2 + 8, Math.min(WORLD_W - lw / 2 - 8, x));
      badge = [lx - lw / 2, lx + lw / 2];
      ctx.save();
      ctx.translate(Math.max(lw / 2 + 8, Math.min(WORLD_W - lw / 2 - 8, x)), ly);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = e.bad ? '#e63946' : '#2a9d5c';
      this.roundRect(-lw / 2, -15, lw, 30, 15);
      ctx.fill();
      this.text(label, 0, 1, 16, '#ffffff', 900);
      ctx.restore();
    }

    if (!this.bubble) return;
    // Speech bubble beside the chef's mouth, toward the middle of the screen; it stays above the stack.
    ctx.font = `800 13px ${FONT}`;
    const bw = ctx.measureText(this.bubble.text).width + 20;
    const right = x < WORLD_W / 2;
    const bx = Math.max(6, Math.min(WORLD_W - 6 - bw, right ? x + 28 * s : x - 28 * s - bw));
    let by = this.mode === 'playing' ? y + 8 * s : y - 34 * s;
    // Keep clear of the level banner while it shows.
    const bannerY = this.insets.top + 182;
    if (this.banner && this.mode === 'playing' && by < bannerY + 30 && by + 26 > bannerY - 26) by = bannerY + 32;
    // ...and of the name badge (or attack label) on the chef's chest.
    if (badge && bx < badge[1] && bx + bw > badge[0] && by < chestY + 15 && by + 26 > chestY - 15) by = chestY + 17;
    ctx.globalAlpha = Math.min(1, this.bubble.life * 4);
    ctx.fillStyle = '#ffffff';
    this.roundRect(bx, by, bw, 26, 13);
    ctx.fill();
    ctx.beginPath();
    const tx = right ? bx + 12 : bx + bw - 12;
    ctx.moveTo(tx - 6, by + 24);
    ctx.lineTo(right ? x + 16 * s : x - 16 * s, y + 10 * s);
    ctx.lineTo(tx + 6, by + 24);
    ctx.fill();
    this.text(this.bubble.text, bx + bw / 2, by + 13.5, 13, '#3a1d12', 800);
    ctx.globalAlpha = 1;
  }

  /** Three maki pieces of the order's recipe on a little wooden board, centred on (x, y). */
  drawDish(x: number, y: number, s: number, rot: number, recipe: Recipe): void {
    const { ctx } = this;
    const fill = [...new Set(recipe.pattern.filter((k) => k !== 'rice' && k !== 'nori'))];
    if (!fill.length) fill.push('egg');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.roundRect(-50, 14, 100, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#a0683a';
    this.roundRect(-52, 10, 104, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#7a4e2a';
    ctx.fillRect(-40, 20, 12, 5);
    ctx.fillRect(28, 20, 12, 5);
    for (const px of [-31, 0, 31]) {
      ctx.fillStyle = '#24321f';
      ctx.beginPath();
      ctx.arc(px, -4, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6f1e4';
      ctx.beginPath();
      ctx.arc(px, -4, 12.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 8; i++) {
        const a = i * 0.8 + px;
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(a) * 9.5, -4 + Math.sin(a) * 9.5, 2, 1.2, a, 0, Math.PI * 2);
        ctx.fill();
      }
      // Filling: one wedge per ingredient.
      fill.forEach((k, i) => {
        ctx.fillStyle = this.color(k);
        ctx.beginPath();
        ctx.moveTo(px, -4);
        ctx.arc(px, -4, 6.5, (i / fill.length) * Math.PI * 2, ((i + 1) / fill.length) * Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(px - 5, -11, 4, 2, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawCustomer(x: number, y: number, look: number, ate: boolean, lookX: number, lookY: number): void {
    const { ctx } = this;
    const shirts = ['#4aa3df', '#e76f51', '#6cc070', '#9b5de5', '#f2b705', '#ef476f'];
    const hairs = ['#1d1a1a', '#3a2418', '#6b3e26', '#2b1b17', '#111'];
    const skins = ['#f1c9a5', '#e8b98f', '#c98e64', '#f5d0b0', '#a8714a', '#efc29a'];
    const pick = <T,>(a: T[], k: number) => a[Math.floor(((look * 97 + k * 13.7) % 1) * a.length)];
    const skin = pick(skins, 1);
    const hair = pick(hairs, 2);
    const longHair = look > 0.5;
    if (longHair) {
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 28, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = pick(shirts, 0);
    this.roundRect(x - 36, y + 20, 72, 70, 20);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, y - 2, 24.5, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(x, y - 12, x - 23, y - 6);
    ctx.fill();
    // Eyes: watching the dish arrive, then blissful once it's eaten.
    for (const ex of [-8, 8]) {
      if (ate) {
        ctx.strokeStyle = '#2a1a1a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(x + ex, y + 1, 4, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        const d = Math.hypot(lookX - x, lookY - y) || 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + ex, y - 1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1a1a';
        ctx.beginPath();
        ctx.arc(x + ex + ((lookX - x) / d) * 2.2, y - 1 + ((lookY - y) / d) * 2.2, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,120,130,0.4)';
    ctx.beginPath();
    ctx.ellipse(x - 15, y + 8, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 15, y + 8, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a2a2a';
    ctx.beginPath();
    if (ate) {
      ctx.moveTo(x - 8, y + 9);
      ctx.quadraticCurveTo(x, y + 20, x + 8, y + 9);
      ctx.closePath();
    } else {
      ctx.ellipse(x, y + 12, 3.5, 4.5, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  /** Served-order celebration: the roll pops up, then arcs down to a customer who eats it. */
  drawServe(): void {
    const d = this.dish;
    if (!d) return;
    const { ctx } = this;
    const t = d.t;
    const bottom = this.viewH - this.insets.bottom;
    const cx = d.side < 0 ? 62 : WORLD_W - 62;
    // Customer slides up from the bottom edge, then back down.
    const rise = t < 0.4 ? 1 - Math.pow(1 - t / 0.4, 3) : t > 2.8 ? 1 - (t - 2.8) / 0.4 : 1;
    const cy = bottom + 40 - 110 * rise;
    const plateY = cy + 30;
    const peak = { x: WORLD_W / 2, y: Math.max(this.insets.top + 230, d.from.y - 80) };

    let x = peak.x;
    let y = peak.y;
    let sc = 1.25;
    let rot = 0;
    if (t < 0.45) {
      const k = t / 0.45;
      const e = 1 - Math.pow(1 - k, 3);
      x = d.from.x + (peak.x - d.from.x) * e;
      y = d.from.y + (peak.y - d.from.y) * e;
      sc = 1.25 * (1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2));
    } else if (t < 0.95) {
      y += Math.sin(t * 10) * 3;
      rot = Math.sin(t * 12) * 0.08;
    } else if (t < 1.65) {
      const k = (t - 0.95) / 0.7;
      const ctrl = { x: (peak.x + cx) / 2, y: peak.y - 70 };
      x = (1 - k) * (1 - k) * peak.x + 2 * (1 - k) * k * ctrl.x + k * k * cx;
      y = (1 - k) * (1 - k) * peak.y + 2 * (1 - k) * k * ctrl.y + k * k * plateY;
      sc = 1.25 - 0.55 * k;
      rot = k * Math.PI * 2 * (d.side < 0 ? -1 : 1);
    } else {
      x = cx;
      y = plateY;
      sc = 0.7 * Math.max(0, 1 - (t - 1.9) / 0.6); // eaten
    }

    this.drawCustomer(cx, cy, d.look, d.ate, x, y);
    if (sc > 0.02) this.drawDish(x, y, sc, rot, d.recipe);

    if (t > 0.15 && t < 1.3) {
      ctx.globalAlpha = Math.min(1, (t - 0.15) * 5, (1.3 - t) * 5);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(40,15,20,0.8)';
      ctx.font = `900 26px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.strokeText(tr('orderUp'), peak.x, peak.y - 50);
      this.text(tr('orderUp'), peak.x, peak.y - 50, 26, '#ffd34d', 900);
      ctx.globalAlpha = 1;
    }
    if (d.ate) {
      // Hearts float up and a "Yum!" bubble from the happy customer.
      const k = t - 1.65;
      ctx.globalAlpha = Math.max(0, 1 - k / 1.4);
      for (let i = 0; i < 3; i++) {
        const hx = cx + (i - 1) * 22 + Math.sin(k * 4 + i) * 4;
        const hy = cy - 40 - k * 50 - i * 8;
        this.text('♥', hx, hy, 18 + i * 3, '#ff5d8f', 900);
      }
      // Regulars say their line for the friendship level; walk-ins just say Yum!
      const reg = d.who !== undefined ? REGULARS[d.who] : null;
      const line = reg ? reg.lines[heartLevel(this.progress.hearts[reg.id] ?? 0)] : 'Yum!';
      ctx.font = `700 13px ${FONT}`;
      const bw = Math.min(WORLD_W - 110, ctx.measureText(line).width + 24);
      const bx = d.side < 0 ? cx + 30 : cx - 30 - bw;
      ctx.fillStyle = '#ffffff';
      this.roundRect(bx, cy - 40, bw, 26, 13);
      ctx.fill();
      this.fitText(line, bx + bw / 2, cy - 26.5, bw - 16, 13, '#3a1d12', 'center', 700);
      if (reg) this.text(`${reg.emoji} ${reg.name}`, bx + bw / 2, cy - 4, 10.5, '#ffffff', 700);
      ctx.globalAlpha = 1;
    }
  }

  drawSplat(sp: Splat): void {
    const { ctx } = this;
    ctx.globalAlpha = Math.min(0.92, sp.life);
    ctx.fillStyle = '#2b1608';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      const a = sp.seed + i * 0.9;
      const d = sp.r * (0.9 + ((i * 37) % 10) / 12);
      ctx.beginPath();
      ctx.arc(sp.x + Math.cos(a) * d, sp.y + Math.sin(a) * d, sp.r * (0.18 + (i % 3) * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(sp.x - sp.r * 0.35, sp.y - sp.r * 0.35, sp.r * 0.25, sp.r * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawOrderCard(y: number): void {
    const { ctx } = this;
    const o = this.order;
    const done = this.height - o.start;
    const w = 236;
    const x = this.cardX();
    ctx.fillStyle = 'rgba(255,248,235,0.94)';
    this.roundRect(x, y, w, 52, 12);
    ctx.fill();
    this.text(`LV ${this.level} · ${o.recipe.name}`, x + 12, y + 15, 13, '#5a2e1f', 800, 'left');
    this.text(`${done}/${o.length}`, x + w - 12, y + 15, 13, '#b5442a', 800, 'right');
    // Progress bar.
    ctx.fillStyle = 'rgba(90,46,31,0.15)';
    this.roundRect(x + 12, y + 26, w - 24, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = '#e76f51';
    this.roundRect(x + 12, y + 26, (w - 24) * (done / o.length), 5, 2.5);
    ctx.fill();
    // Upcoming ingredients, so players can see the roll come together.
    const { pattern } = o.recipe;
    for (let i = 0; i < 6; i++) {
      const kind = pattern[(done + i) % pattern.length];
      ctx.fillStyle = this.color(kind);
      this.roundRect(x + 12 + i * 22, y + 37, 18, 9, 3);
      ctx.fill();
      ctx.strokeStyle = i === 0 ? '#5a2e1f' : 'rgba(90,46,31,0.3)';
      ctx.lineWidth = i === 0 ? 1.5 : 1;
      ctx.stroke();
      if (settings.colorblind) this.text(SYMBOLS[kind][0], x + 21 + i * 22, y + 42, 8, SYMBOLS[kind][1], 700);
    }
    this.text('next', x + 12 + 6 * 22 + 4, y + 42, 10, 'rgba(90,46,31,0.6)', 700, 'left');
    // Who it's for: the regular's face, with a gold tag on special requests (double coins).
    if (o.who !== undefined) {
      if (o.request) {
        ctx.fillStyle = '#ffd34d';
        this.roundRect(x + w - 62, y + 34, 30, 14, 7);
        ctx.fill();
        this.text('2x', x + w - 47, y + 41.5, 9.5, '#4a2a00', 700);
      }
      this.text(REGULARS[o.who].emoji, x + w - 18, y + 41, 15, '#fff', 400);
    }
  }

  drawTopBar(): void {
    this.qaClip = null;
    const { ctx } = this;
    const top = this.insets.top;
    const mb = this.muteButton();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mb.x, mb.y, mb.r, 0, Math.PI * 2);
    ctx.stroke();
    this.text(this.muted ? '×' : '♪', mb.x, mb.y + 1, 16, 'rgba(255,255,255,0.8)');

    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    const lh = settings.leftHanded;
    ctx.arc(lh ? this.insets.left + 24 : WORLD_W - this.insets.right - 24, top + 30, 8, 0, Math.PI * 2);
    ctx.fill();
    const coins = this.bank + (this.mode === 'playing' ? this.runCoins : 0);
    this.text(String(coins), lh ? this.insets.left + 38 : WORLD_W - this.insets.right - 38, top + 31, 16, '#ffd34d', 700, lh ? 'left' : 'right');
  }

  /** Draws a tappable button and registers its hit area for this frame. */
  button(x: number, y: number, w: number, h: number, label: string, onTap: () => void, style: 'primary' | 'gold' | 'quiet' = 'primary'): void {
    this.drawButton(x, y, w, h, label, style, h >= 40 ? 15 : 12.5);
    this.buttons.push({ x, y, w, h, onTap, label });
  }

  /** Rounded "candy" button: gradient face, darker base for depth, soft top shine, and a press dip. */
  drawButton(x: number, y: number, w: number, h: number, label: string, style: 'primary' | 'gold' | 'quiet', size: number): void {
    const { ctx } = this;
    const pressed = this.pressed && this.pressed.x === x && this.pressed.y === y && this.time - this.pressed.t < 0.15;
    const dy = pressed ? 2 : 0;
    const [top, bottom, base, ink] = style === 'gold' ? ['#ffe27a', '#ffc23d', '#c98a12', '#4a2a00'] : style === 'quiet' ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.25)', '#ffffff'] : ['#ffa07a', '#ff7a45', '#c4501f', '#ffffff'];
    const r = Math.min(h / 2, 22);
    if (!pressed) {
      ctx.fillStyle = base;
      this.roundRect(x, y + 3, w, h, r);
      ctx.fill();
    }
    const g = ctx.createLinearGradient(0, y + dy, 0, y + dy + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    this.roundRect(x, y + dy, w, h, r);
    ctx.fill();
    if (style !== 'quiet') {
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      this.roundRect(x + 6, y + dy + 3, w - 12, h * 0.32, r * 0.6);
      ctx.fill();
    }
    // Shrink the label to fit if it's long.
    let s2 = size;
    ctx.font = `700 ${s2}px ${FONT}`;
    while (s2 > 9 && ctx.measureText(label).width > w - 14) {
      s2 -= 0.5;
      ctx.font = `700 ${s2}px ${FONT}`;
    }
    this.text(label, x + w / 2, y + dy + h / 2 + 1, s2, ink, 700);
  }

  pressed: { x: number; y: number; t: number } | null = null;

  openShop(): void {
    this.shopFrom = this.mode;
    this.shopSel = null;
    this.mode = 'shop';
    sfx.drop();
  }

  showToast(text: string): void {
    if (this.toast) this.toastQueue.push(text);
    else this.toast = { text, life: 2.2 };
  }

  drawToast(): void {
    if (!this.toast) return;
    const { ctx } = this;
    // Sits above the coaching card when one is showing.
    const y = this.viewH - this.insets.bottom - (this.tip && this.mode === 'playing' ? 180 : 110);
    ctx.globalAlpha = Math.min(1, this.toast.life * 3);
    ctx.fillStyle = 'rgba(20,10,20,0.88)';
    this.roundRect(40, y, WORLD_W - 80, 40, 20);
    ctx.fill();
    this.fitText(this.toast.text, WORLD_W / 2, y + 21, WORLD_W - 104, 14, '#fff', 'center', 700);
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ daily gift

  static day(offset = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  giftReady(): boolean {
    return save.giftDay() !== Game.day();
  }

  claimGift(): void {
    if (!this.giftReady()) {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const hours = Math.ceil((midnight.getTime() - now.getTime()) / 3_600_000);
      this.showToast(`Next gift in ${hours} hour${hours === 1 ? '' : 's'}`);
      return;
    }
    // Coming back on consecutive days grows the gift; day 7 is worth more than days 1-6 together.
    // Missing exactly one day can be covered by a streak freeze (one free every week).
    const p = this.progress;
    let streak = 1;
    if (save.giftDay() === Game.day(-1)) streak = save.giftStreak() + 1;
    else if (save.giftDay() === Game.day(-2) && p.freezes > 0 && save.giftStreak() > 0) {
      p.freezes--;
      streak = save.giftStreak() + 1;
      this.showToast('❄ Streak saved by a streak freeze!');
    }
    const day = ((streak - 1) % 7) + 1;
    const reward = STREAK_REWARDS[day - 1];
    save.setGift(Game.day(), streak);
    this.bankCoins(reward);
    this.showToast(`Day ${day} gift: +${reward} coins (${streak}-day streak)`);
    if (day === 7) {
      if (!this.owned.flag.includes('week')) {
        this.unlockExclusive('flag', 'week', 'Golden Week flag');
      } else {
        for (let i = 0; i < 2; i++) {
          const b = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
          this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
          this.showToast(`Bonus booster: ${b.name}`);
        }
        save.setBoosters(this.boosters);
      }
    }
    // Extras: a sticker pack, Pass XP, and the VIP daily bonus.
    this.openPacks(1);
    this.addXp(20);
    if (p.vip) {
      this.bankCoins(60);
      this.showToast('VIP daily bonus: +60 coins');
    }
    if (streak === 1) p.streakMilestone = 0; // a new streak can celebrate its milestones again
    const milestone = STREAK_MILESTONES.filter((m) => streak >= m).pop() ?? 0;
    if (milestone > p.streakMilestone) {
      p.streakMilestone = milestone;
      this.celebrate(`${milestone}-DAY STREAK!`, 'Maki the cat is so proud of you');
    }
    p.persist();
    sfx.serve();
    haptic.success();
    void askForReminders();
  }

  /** The cheapest cosmetic the player doesn't own yet: shown after each run as something to save toward. */
  nextGoal() {
    const all = (Object.keys(CATALOG) as Cosmetic[]).flatMap((c) => CATALOG[c].filter((i) => !i.earn && !this.owned[c].includes(i.id)));
    return all.sort((a, b) => a.price - b.price)[0];
  }

  // ------------------------------------------------------------------ screens

  drawHud(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const top = this.insets.top;
    const midY = this.viewH / 2;

    this.drawTopBar();

    if (this.mode === 'title') {
      this.drawHome();
      return;
    }

    // The live height (the results card shows it once the run ends).
    if (this.mode === 'playing') this.text(String(this.height), cx, top + 62, this.fever > 0 ? 42 : 50, '#fff', 900);
    if (this.mode === 'playing' && this.fever > 0) {
      // Fever: golden glow around the screen edges.
      const g = ctx.createRadialGradient(cx, midY, this.viewH * 0.3, cx, midY, this.viewH * 0.75);
      g.addColorStop(0, 'rgba(255,211,77,0)');
      g.addColorStop(1, `rgba(255,170,0,${0.25 + 0.1 * Math.sin(this.time * 10)})`);
      ctx.fillStyle = g;
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.text(`FEVER ${this.fever.toFixed(1)}s`, cx, top + 91, 13, '#ffd34d', 900);
    }
    if (this.mode === 'playing' && this.rage > 0) {
      // Boss rage: pulsing red edges.
      const g = ctx.createRadialGradient(cx, midY, this.viewH * 0.32, cx, midY, this.viewH * 0.78);
      g.addColorStop(0, 'rgba(255,40,40,0)');
      g.addColorStop(1, `rgba(220,20,20,${(this.rage === 2 ? 0.34 : 0.22) + 0.08 * Math.sin(this.time * 7)})`);
      ctx.fillStyle = g;
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    }
    if (this.mode === 'playing') {
      // Perks picked this run, as a small icon row under the top bar.
      const icons = (Object.keys(this.perks) as PerkId[]).map((id) => {
        const n = id === 'shield' ? this.shieldHits : this.perks[id]!;
        return id === 'shield' && !n ? '' : `${PERKS[id].icon}${n > 1 ? n : ''}`;
      }).filter(Boolean);
      if (icons.length) this.fitText(icons.join(' '), 16 + this.insets.left, top + 64, 110, 14, '#fff', 'left', 600);
      if (this.weather) this.text(this.weather.kind === 'wind' ? `🌬️ wind ${this.weather.dir > 0 ? '→' : '←'}` : '🌧️ rain', 16 + this.insets.left, top + 86, 12, '#bde0fe', 700, 'left');
      if (this.runMode === 'gauntlet') this.text(`⚔️ ${this.ordersServed}`, WORLD_W - 16 - this.insets.right, top + 64, 16, '#ffd34d', 700, 'right');
      if (this.runMode === 'pnp' && this.pnp) this.text(`👥 P${this.pnp.turn}`, WORLD_W - 16 - this.insets.right, top + 64, 16, this.pnp.turn === 1 ? '#ff8a5b' : '#4cc9f0', 700, 'right');
      if (this.runMode === 'relay' && this.relay) {
        // Whose drop it is, big and in their colour.
        const col = this.relayColor(this.relay.turn);
        ctx.fillStyle = col;
        this.roundRect(WORLD_W - 116 - this.insets.right, top + 50, 100, 30, 15);
        ctx.fill();
        this.text(`P${this.relay.turn + 1}’S DROP`, WORLD_W - 66 - this.insets.right, top + 65, 12, '#fff', 900);
      }
      if (this.runMode === 'daily') this.text(`🟩 #${dailyNumber()}`, WORLD_W - 16 - this.insets.right, top + 64, 14, '#8fdc93', 700, 'right');
      // The next landmark to beat, under the height.
      const nx = landmarkFor(this.height).next;
      if (nx && this.fever <= 0 && this.height >= 3 && this.runMode !== 'asmr') {
        const label = `${nx.emoji} ${Math.round(nx.m - this.height * METERS_PER_LAYER)} m to ${nx.name.replace(/^(the|a) /, '')}`;
        ctx.font = `700 10.5px ${FONT}`;
        const lw = Math.min(230, ctx.measureText(label).width + 18);
        ctx.fillStyle = 'rgba(20,10,25,0.6)';
        this.roundRect(cx - lw / 2, top + 82, lw, 17, 8.5);
        ctx.fill();
        this.fitText(label, cx, top + 90.5, lw - 10, 10.5, '#bde8ff', 'center', 700);
      }
      if (this.runMode === 'tower') this.text(`🗼 ${this.towerStart + this.ordersServed}`, WORLD_W - 16 - this.insets.right, top + 64, 16, '#ffd34d', 700, 'right');
      if (this.rescueRun) {
        const rr = this.rescueRun;
        const quake = RESCUES[rr.i].kind === 'quake';
        this.text(quake ? `⏱ ${Math.ceil(this.timeLeft)}s` : `🌊 ${Math.max(0, rr.margin).toFixed(1)}`, WORLD_W - 16 - this.insets.right, top + 64, 16, (quake ? this.timeLeft < 10 : rr.margin < 3) ? '#ff6b6b' : '#9fe3ff', 700, 'right');
      }
    }
    if (this.mode === 'playing' && this.runMode === 'time') {
      this.text(`⏱ ${Math.ceil(this.timeLeft)}s`, WORLD_W - 70, top + 64, 22, this.timeLeft < 10 ? '#ff6b6b' : '#ffffff', 900);
    }
    if (this.mode === 'playing' && this.zenLike) {
      this.button(WORLD_W - 84, top + 50, 70, 32, 'END', () => this.endZen(), 'quiet');
    }
    if (this.mode === 'playing') {
      this.drawOrderCard(top + 100);
      if (this.bonus && !this.banner) {
        // Sous-chef bonus round tracker under the order card.
        const bx = this.cardX();
        this.ctx.fillStyle = 'rgba(20,60,90,0.9)';
        this.roundRect(bx, top + 158, 236, 24, 12);
        this.ctx.fill();
        this.text(`👨‍🍳 BONUS: ${'●'.repeat(3 - this.bonus.left)}${'○'.repeat(this.bonus.left)} 3 PERFECTs = chest`, bx + 118, top + 170.5, 11, '#ffffff', 700);
      }
      this.drawBossLabels(this.chefX, this.bossY(), this.bossScale());
      this.drawServe();
    }

    if (this.paused) {
      this.panel(midY, t('paused'), t('tapResume'));
    } else if (this.mode === 'dead') {
      this.drawResults();
    }
  }

  resultTitle(): string {
    switch (this.resultKind) {
      case 'gate': return 'STAR GATE!';
      case 'special': return this.runMode === 'custom' ? '🏆 BOSS DEFEATED!' : this.runMode === 'tower' ? '🗼 TOWER CONQUERED!' : this.runMode === 'modchal' ? `${MODS[this.modChal ?? 'mirror'].icon} CHALLENGE CLEARED!` : this.runMode === 'critic' ? (this.criticStars >= 2 ? 'GLOWING REVIEW!' : 'REVIEW: MEH') : 'SPECIAL CLEARED!';
      case 'zen': return this.runMode === 'asmr' ? 'SO RELAXING' : 'ZEN COMPLETE';
      case 'daily': return this.dailyPractice ? 'PRACTICE ROLL' : `DAILY ROLL #${dailyNumber()}`;
      case 'relay': return `TEAM: ${this.height} LAYERS`;
      case 'rescue-won': return '🆘 RESCUED!';
      case 'rescue-lost': return this.rescueRun && RESCUES[this.rescueRun.i].kind === 'quake' && this.timeLeft <= 0 ? 'THE QUAKE HIT!' : this.rescueRun && this.rescueRun.margin <= 0 ? 'WASHED AWAY!' : 'DROPPED IT!';
      case 'time': return this.timeLeft <= 0 ? 'TIME’S UP!' : 'DROPPED IT!';
      case 'lost': if (this.runMode === 'gauntlet') return `GAUNTLET: ${this.ordersServed} CHEF${this.ordersServed === 1 ? '' : 'S'}`; return this.newBest ? t('newBest') : t('dropped');
      case 'puzzle-won': return `PUZZLE ${this.puzzle + 1} SOLVED!`;
      case 'puzzle-lost': return this.orderStats.slices > puzzleConfig(this.puzzle).maxSlices ? 'TOO MANY SLICES!' : 'PUZZLE FAILED';
      case 'challenge': return this.challenge && this.height > this.challenge.score ? 'YOU WIN!' : 'FRIEND WINS';
      default: return this.newBest ? t('newBest') : t('dropped');
    }
  }

  resultSub(): string {
    const layers = `${this.height} layer${this.height === 1 ? '' : 's'}`;
    switch (this.resultKind) {
      case 'rescue-won': case 'rescue-lost': {
        const rs = RESCUES[this.rescueRun?.i ?? 0];
        return `${rs.name} · ${this.height}/${rs.target} layers · ${'★'.repeat(this.progress.rescueStars[this.rescueRun?.i ?? 0] || 0)}`;
      }
      case 'zen': return this.runMode === 'asmr' ? `${layers} · ${this.runMaxCombo}-combo · breathe out` : `${layers} · Zen best ${this.progress.zenBest}`;
      case 'daily': return this.dailyPractice ? `${layers} · not counted` : `${layers} · 🔥 ${this.progress.daily.streak} day streak`;
      case 'relay': {
        const st = this.relay?.stats ?? [{ p: 0, c: 0 }, { p: 0, c: 0 }];
        const mvp = st[0].p === st[1].p ? 'a tie!' : `MVP Player ${st[0].p > st[1].p ? 1 : 2}`;
        return `P1 ${st[0].p} PERFECT · P2 ${st[1].p} PERFECT · ${mvp}`;
      }
      case 'lost': if (this.runMode === 'gauntlet') return `Gauntlet best ${this.progress.gauntletBest} chefs · ${layers}`; if (this.runMode === 'custom') return `vs ${this.chef.name} · ${layers}`; return `Level ${this.level} · ${layers} · Best ${this.best}`;
      case 'time': return `${layers} in 60s · best ${this.progress.timeBest}`;
      case 'puzzle-won': case 'puzzle-lost': {
        const cfg = puzzleConfig(this.puzzle);
        return `${layers}/${cfg.layers} · ${this.orderStats.slices}/${cfg.maxSlices} slices · ${'★'.repeat(this.progress.puzzleStars[this.puzzle] || 0)}`;
      }
      case 'challenge': return `You ${this.height} · friend ${this.challenge?.score ?? 0}`;
      case 'special': return this.runMode === 'custom' ? `${this.chef.name} · ${layers}` : this.runMode === 'critic' ? `Food Critic · ${'★'.repeat(this.criticStars)}${'☆'.repeat(3 - this.criticStars)} · ${layers}` : `Daily Special · ${layers}`;
      default: return `Level ${this.level} · ${layers} · Best ${this.best}`;
    }
  }

  drawResults(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const top = this.insets.top;
    const midY = this.viewH / 2;
    const t = Math.min(1, (this.time - this.deadAt) / 0.35);
    ctx.globalAlpha = t;
    ctx.fillStyle = 'rgba(30,15,30,0.5)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    // The boss gloats over the result (or cheers after a win).
    const ds = 1.3;
    const cardTop = midY - 150;
    const dy = Math.max(top + 100, cardTop - 72 * ds);
    this.drawBossBody(WORLD_W / 2, dy, ds);
    this.drawBossLabels(WORLD_W / 2, dy, ds);
    ctx.fillStyle = 'rgba(42,26,51,0.96)';
    this.roundRect(20, cardTop, WORLD_W - 40, 360, 18);
    ctx.fill();
    this.panel(cardTop + 70, this.resultTitle(), this.resultSub());
    const beaten = this.ordersServed;
    this.text(this.runMode === 'rescue' ? `${this.height} layers stacked   ·   +${this.runCoins} coins` : this.runMode === 'tower' ? `${beaten} floor${beaten === 1 ? '' : 's'} climbed   ·   +${this.runCoins} coins` : `${beaten} chef${beaten === 1 ? '' : 's'} beaten   ·   +${this.runCoins} coins`, cx, cardTop + 108, 15, '#ffd34d', 700);
    if (this.gated) this.text(`Need ${this.gated}★ for level ${this.level} · you have ${this.progress.totalStars}★. Replay chefs for 3 stars!`, cx, cardTop + 130, 11, '#9fe3ff', 700);
    const gap = this.best - this.height;
    const close = this.resultKind === 'lost' && !this.newBest && gap > 0 && gap <= 3;
    if (close) this.text(`So close! Only ${gap} more for a new best`, cx, cardTop + 130, 14, '#ffb4a2', 700);
    else if (!this.gated) {
      // How tall the roll stood, and what this run did for the restaurant.
      const lm = landmarkFor(this.height).beat;
      const bits = [lm ? `${lm.emoji} Taller than ${lm.name}` : '', this.runStock > 0 && !this.lockedAt('restaurant') ? `🧺 +${this.runStock}` : '', this.runReqs ? `📋 ${this.runReqs}` : '', this.runCombos ? `🍱 ${this.runCombos} combo${this.runCombos > 1 ? 's' : ''}` : ''].filter(Boolean);
      if (bits.length) this.fitText(bits.join(' · '), cx, cardTop + 130, WORLD_W - 70, 12, '#9fe3ff', 'center', 700);
    }
    const ws = this.progress.winStreak;
    if (this.journey) this.text(ws ? `🔥 Win streak ${ws}${ws < 3 ? ' · 3 = hot start' : ws < 5 ? ' · 5 = steady hands' : ws < 8 ? ' · 8 = free Second Chance' : ''}` : 'Win streak lost · beat a chef to start a new one', cx, cardTop + 152, 12, '#ffb703', 700);
    const m = [...this.progress.missions].sort((a2, b2) => b2.progress / b2.target - a2.progress / a2.target)[0];
    if (m) this.text(`Mission: ${missionText(m)}  ${m.progress}/${m.target}`, cx, cardTop + 174, 12, 'rgba(255,255,255,0.8)', 600);
    const goal = this.nextGoal();
    const pitch = this.lockedAt('restaurant') ? null : this.restaurantPitch();
    if (pitch?.hot && this.time - this.deadAt > 0.7) {
      // The restaurant has something to do: say so, and make the line a shortcut.
      ctx.fillStyle = 'rgba(110,55,25,0.9)';
      this.roundRect(36, cardTop + 186, WORLD_W - 72, 32, 16);
      ctx.fill();
      this.fitText(`🏯 Restaurant: ${pitch.text} ›`, cx, cardTop + 202, WORLD_W - 96, 13, '#ffd34d', 'center', 700);
      this.buttons.push({ x: 36, y: cardTop + 186, w: WORLD_W - 72, h: 32, onTap: () => { track('restaurant_ad', { from: 'results' }); this.openScreen('restaurant'); } });
    } else if (goal) {
      const have = Math.min(this.bank, goal.price);
      const can = this.bank >= goal.price;
      this.text(can ? `You can buy the ${goal.name}!` : `Next: ${goal.name}  ${have}/${goal.price}`, cx, cardTop + 198, 13, can ? '#ffd34d' : 'rgba(255,255,255,0.85)', 700);
      this.bar(70, cardTop + 210, WORLD_W - 140, have / goal.price, '#ffd34d');
    }
    if (this.time - this.deadAt > 0.7) {
      // Optional ad rewards and sharing.
      const canContinue = !this.revived && (this.resultKind === 'lost' || this.resultKind === 'challenge');
      const row1: [string, () => void, 'primary' | 'gold' | 'quiet'][] = [];
      if (canContinue) row1.push([this.progress.vip ? tr('cont') : `▶ ${tr('cont')}`, () => this.watchAd('Continue this run', () => this.revive()), 'gold']);
      if (!this.doubled && this.runCoins > 0) row1.push([`▶ +${this.runCoins}`, () => this.watchAd('Double your coins', () => { this.doubled = true; this.bankCoins(this.runCoins); this.showToast(`Coins doubled: +${this.runCoins}`); }), 'gold']);
      if (this.runMode === 'daily' && !this.dailyPractice) row1.push(['🟩 GRID', () => this.shareDaily(), 'gold']);
      else row1.push([tr('share'), () => { this.reactPick = true; }, 'quiet']);
      // The share studio (photo, poster, highlight video, the run's song): a button in the card's corner.
      this.button(WORLD_W - 78, cardTop - 22, 50, 40, '📤', () => { this.studio = true; }, 'gold');
      this.buttons[this.buttons.length - 1].label = 'Share studio: photo, poster, video, song';
      if (this.clip) row1.push(['🎬 CLIP', () => { track('clip_share'); void shareClip(this.clip!, this.height); }, 'quiet']);
      const w1 = (WORLD_W - 72 - (row1.length - 1) * 8) / row1.length;
      row1.forEach(([label, go, style], i) => this.button(36 + i * (w1 + 8), cardTop + 232, w1, 44, label, go, style));
      const second = this.journey || this.resultKind === 'gate' ? [tr('map'), () => this.openMap()] as const : [tr('modes'), () => this.openScreen('modes')] as const;
      // Left-handed: RETRY moves under the left thumb.
      const lh = settings.leftHanded;
      this.button(lh ? 268 : 36, cardTop + 290, 96, 46, tr('home'), () => { this.mode = 'title'; this.reset(); }, 'quiet');
      this.button(lh ? 152 : 140, cardTop + 290, 108, 46, second[0], second[1], 'quiet');
      this.button(lh ? 36 : 256, cardTop + 290, 108, 46, this.resultKind === 'puzzle-won' ? tr('next') : this.resultKind === 'gate' ? 'GET STARS' : tr('retry'), () => this.retry());
      // A sushi fact under the card, collected in Grandma's Book.
      if (this.triviaNow >= 0 && cardTop + 372 + 50 < this.viewH - this.insets.bottom) {
        ctx.fillStyle = 'rgba(20,10,25,0.8)';
        this.roundRect(20, cardTop + 370, WORLD_W - 40, 52, 14);
        ctx.fill();
        this.text('💡', 40, cardTop + 396, 16, '#fff', 400);
        this.wrapLeft(TRIVIA[this.triviaNow], 60, cardTop + 386, WORLD_W - 96, 10.5, 'rgba(255,255,255,0.85)');
      }
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------- home

  drawHome(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const top = this.insets.top;
    const p = this.progress;
    if (this.best > 0) this.text(`BEST ${this.best}`, cx, top + 30, 15, 'rgba(255,255,255,0.75)', 700);
    logoText(ctx, 'SUSHI', cx, top + 80, 44, '#ffffff', '#ffe2c6');
    logoText(ctx, 'STACK', cx, top + 122, 44, '#ffb37a', '#ff5d3a');
    // Sake-chan, the mascot, sits beside the logo. Tap for a (grumpy) word.
    drawSake(ctx, cx + 128, top + 104, 0.5, this.sakeSay ? 'wink' : 'grumpy', this.time);
    this.buttons.push({ x: cx + 100, y: top + 74, w: 56, h: 56, onTap: () => this.sakeTap(), label: 'Sake-chan' });
    if (this.sakeSay) {
      ctx.font = `700 11px ${FONT}`;
      const bw = Math.min(250, ctx.measureText(this.sakeSay.text).width + 20);
      const bx = Math.min(WORLD_W - 8 - bw, cx + 128 - bw + 30);
      ctx.globalAlpha = Math.min(1, this.sakeSay.t * 3);
      ctx.fillStyle = '#ffffff';
      this.roundRect(bx, top + 42, bw, 24, 12);
      ctx.fill();
      this.fitText(this.sakeSay.text, bx + bw / 2, top + 54, bw - 12, 11, '#3a1d12', 'center', 700);
      ctx.globalAlpha = 1;
    }

    // Streak chips: win streak, daily streak (with freezes), Chef Rank.
    const chips = [`🔥 Win ${p.winStreak}`, `📅 Day ${save.giftDay() === Game.day() || save.giftDay() === Game.day(-1) ? save.giftStreak() : 0} ${'❄'.repeat(p.freezes)}`, `👑 Rank ${p.rank}`];
    chips.forEach((c, i) => {
      const x = 24 + i * 120;
      ctx.fillStyle = 'rgba(20,10,25,0.75)';
      this.roundRect(x, top + 146, 112, 26, 13);
      ctx.fill();
      this.text(c, x + 56, top + 159.5, 12, '#fff', 800);
      this.buttons.push({ x, y: top + 140, w: 112, h: 38, onTap: () => this.openScreen(i === 1 ? 'calendar' : 'profile') });
    });
    // A dot on the day chip when today's calendar reward is waiting.
    if (this.calendarReady()) this.dot(24 + 120 + 106, top + 148, 5, '#ff3b3b');

    // Big play button.
    const lvl = p.playLevel;
    const pulse = settings.reducedMotion ? 1 : 1 + 0.03 * Math.sin(this.time * 4);
    ctx.save();
    ctx.translate(cx, top + 210);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff8a5b';
    this.roundRect(-170, -28, 340, 56, 28);
    ctx.fill();
    this.fitText(t('play', lvl), 0, -4, 300, 22, '#fff', 'center', 700);
    const gate = p.unlocked > lvl ? starsNeeded(p.unlocked) : 0;
    this.text(gate ? `Gate to ${p.unlocked}: ${p.totalStars}/${gate}★` : chefFor(lvl).name, 0, 16, 11, 'rgba(255,255,255,0.9)', 700);
    ctx.restore();
    this.buttons.push({ x: cx - 170, y: top + 182, w: 340, h: 56, onTap: () => this.startRun(), label: t('play', lvl) });
    this.guideAt('play', cx - 170, top + 182, 340, 56);
    this.guideAt('open', cx - 170, top + 182, 340, 56);

    this.announceUnlocks();
    // Settings gear beside the sound button (settings are always reachable, even before MORE opens).
    const mb = this.muteButton();
    const gx = settings.leftHanded ? mb.x - 38 : mb.x + 38;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gx, mb.y, mb.r, 0, Math.PI * 2);
    ctx.stroke();
    this.text('⚙', gx, mb.y + 1, 15, 'rgba(255,255,255,0.85)', 400);
    this.buttons.push({ x: gx - 20, y: mb.y - 20, w: 40, h: 40, onTap: () => this.openScreen('settings') });
    // Your nemesis taunts you once a day.
    const nem = this.nemesisLevel();
    if (nem && !p.seen.includes(`taunt:${dayKey()}`) && !this.celebration) {
      p.seen = p.seen.filter((k) => !k.startsWith('taunt:'));
      p.seen.push(`taunt:${dayKey()}`);
      p.persist();
      this.showToast(`😈 ${chefFor(nem).name}: “${NEMESIS_TAUNTS[Math.floor(Math.random() * NEMESIS_TAUNTS.length)]}”`);
    }
    // A one-time announcement from remote config.
    if (cfg.message && !p.seen.includes(`msg:${cfg.message}`)) {
      p.seen.push(`msg:${cfg.message}`);
      p.persist();
      this.showToast(cfg.message);
    }
    // Four small tiles (gift, modes, Daily Special, Daily Roll), the one thing to do next, and missions.
    this.drawHomeTiles(top + 248);
    this.drawNextUp(top + 314);
    if (this.lockedAt('gift')) this.drawHowTo(top + 378);
    else this.drawMissions(top + 378);

    // Event ticker.
    const tour = currentTour();
    const hol = currentHoliday();
    const tick = `🌏 ${tour.city.name} tour · ${timeLeft(tour.end)}${hol ? `   🎉 ${hol.holiday.name}` : ''}`;
    this.text(tick, cx, top + 498, 11.5, '#9fe3ff', 800);
    if (!this.lockedAt('restaurant')) this.drawRestaurantCard(30, top + 514, 340, 40);

    // Bottom navigation with badges for things waiting to be claimed.
    const navY = this.viewH - this.insets.bottom - 62;
    // The player's own chef waves from behind the counter when there's room (tap to customise).
    if (navY - (top + 560) >= 150) {
      const ax = 58;
      const ay = navY - 62;
      drawChef(ctx, avatarChef(p.avatar), ax, ay, 0.62, 'happy', cx, ay - 120, this.time);
      ctx.font = `700 11px ${FONT}`;
      const label = `Chef ${p.avatar.name} ✎`;
      const lw = ctx.measureText(label).width + 18;
      ctx.fillStyle = 'rgba(20,10,25,0.85)';
      this.roundRect(ax - lw / 2, ay - 82, lw, 20, 10);
      ctx.fill();
      this.text(label, ax, ay - 71.5, 11, '#fff', 700);
      this.buttons.push({ x: ax - 45, y: ay - 84, w: 90, h: 120, onTap: () => this.openScreen('avatar') });
    }
    ctx.fillStyle = 'rgba(20,10,25,0.95)';
    ctx.fillRect(-this.offX, navY, WORLD_W + this.offX * 2, 62 + this.insets.bottom);
    const eventsBadge = (p.race.finished && !p.race.claimed) || (p.ads.chests < 3) || (this.quest.stage >= QUEST_STAGES && !this.quest.claimed);
    const moreBadge = this.passClaimable() > 0 || this.achClaimable() > 0 || this.calendarReady() || this.lettersUnread() > 0;
    const nav: [string, string, () => void, boolean, string][] = [
      ['🗺️', t('map'), () => this.openMap(), false, 'map'],
      ['🎉', t('events'), () => this.openScreen('events'), eventsBadge, 'events'],
      ['🛒', t('shop'), () => this.openShop(), false, 'shop'],
      ['🏯', t('restaurant'), () => this.openScreen('restaurant'), this.restaurantPitch().hot, 'restaurant'],
      ['☰', t('more'), () => this.openScreen('more'), moreBadge, 'more'],
    ];
    const nw = WORLD_W / nav.length;
    nav.forEach(([icon, label, open, badge, id], i) => {
      const x = i * nw;
      const lock = this.lockedAt(id);
      let go = open;
      if (lock) {
        // Locked: dimmed icon with a padlock and the level that opens it.
        ctx.globalAlpha = 0.35;
        this.text(icon, x + nw / 2, navY + 22, 22, '#fff', 400);
        ctx.globalAlpha = 1;
        this.text('🔒', x + nw / 2 + 13, navY + 30, 12, '#fff', 400);
        this.text(`LV ${lock}`, x + nw / 2, navY + 46, 9.5, 'rgba(255,255,255,0.55)', 700);
        go = () => this.lockedToast(id);
        this.buttons.push({ x, y: navY, w: nw, h: 62, onTap: go, label: `${label} (locked)` });
        return;
      }
      this.text(icon, x + nw / 2, navY + 22, 22, '#fff', 400);
      this.fitText(label, x + nw / 2, navY + 46, nw - 6, 9.5, 'rgba(255,255,255,0.8)', 'center', 700);
      if (!p.seen.includes(`feature:${id}:visited`) && UNLOCKS.some((u) => u.id === id && p.unlocked <= u.level + 1)) {
        // "NEW" tag until the player first visits a freshly opened feature.
        go = () => { p.seen.push(`feature:${id}:visited`); p.persist(); open(); };
        ctx.fillStyle = '#2a9d5c';
        this.roundRect(x + nw / 2 + 2, navY + 2, 30, 14, 7);
        ctx.fill();
        this.text('NEW', x + nw / 2 + 17, navY + 9.5, 8.5, '#fff', 700);
      } else if (badge) {
        ctx.fillStyle = '#ff3b3b';
        ctx.beginPath();
        ctx.arc(x + nw / 2 + 16, navY + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      this.buttons.push({ x, y: navY, w: nw, h: 62, onTap: go, label });
      if (id === 'restaurant') this.guideAt('visit', x, navY, nw, 62);
    });
  }

  /** Home-screen card for the restaurant: name, popularity and a reason to visit right now. */
  drawRestaurantCard(x: number, y: number, w: number, h: number): void {
    const { ctx } = this;
    const rs = this.progress.restaurant;
    const R = RESTAURANTS[Math.min(rs.r, RESTAURANTS.length - 1)];
    const pitch = this.restaurantPitch();
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(110,55,25,0.95)');
    g.addColorStop(1, 'rgba(60,30,45,0.95)');
    ctx.fillStyle = g;
    this.roundRect(x, y, w, h, 14);
    ctx.fill();
    if (pitch.hot) {
      ctx.strokeStyle = `rgba(255,211,77,${0.55 + 0.45 * Math.sin(this.time * 5)})`;
      ctx.lineWidth = 2;
      this.roundRect(x, y, w, h, 14);
      ctx.stroke();
    }
    this.text('🏯', x + 22, y + h / 2 + 1, 20, '#fff', 400);
    const pop = this.popularity();
    this.fitText(`${R.name} ${'★'.repeat(pop)}`, x + 42, y + 13, 170, 12, '#ffd34d', 'left', 700);
    this.fitText(pitch.text, x + 42, y + 28, w - 130, 11, '#fff', 'left');
    this.drawButton(x + w - 78, y + 7, 70, h - 14, pitch.hot ? 'GO!' : 'VISIT', pitch.hot ? 'gold' : 'quiet', 12);
    this.buttons.push({ x, y, w, h, onTap: () => { track('restaurant_ad', { from: 'home', hot: pitch.hot }); this.openScreen('restaurant'); } });
  }

  /** The level a home feature opens at, or 0 when it's already open. */
  lockedAt(id: string): number {
    const u = UNLOCKS.find((x) => x.id === id);
    return u && this.progress.unlocked < u.level ? u.level : 0;
  }

  lockedToast(id: string): void {
    const u = UNLOCKS.find((x) => x.id === id)!;
    this.showToast(`🔒 ${u.name} opens at level ${u.level}`);
    haptic.light();
  }



  /** Celebrates each feature the first time it opens. Long-time players get them all quietly. */
  announceUnlocks(): void {
    if (this.celebration) return;
    const p = this.progress;
    for (const u of UNLOCKS) {
      const key = `feature:${u.id}`;
      if (p.unlocked < u.level || p.seen.includes(key)) continue;
      p.seen.push(key);
      p.persist();
      track('feature_unlock', { id: u.id });
      if (p.unlocked <= u.level + 1) {
        this.celebrate(`🔓 ${u.name.toUpperCase()}`, u.desc, 3.2);
        return;
      }
    }
  }

  /** First-session card in place of missions: the three things to know. */
  drawHowTo(y: number): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(20,10,25,0.93)';
    this.roundRect(24, y, WORLD_W - 48, 108, 16);
    ctx.fill();
    this.text(t('howTo'), WORLD_W / 2, y + 18, 13, '#ffd34d', 700);
    const lines: [string, string][] = [
      ['👆', t('how1')],
      ['✂️', t('how2')],
      ['👨‍🍳', t('how3')],
    ];
    lines.forEach(([icon, line], i) => {
      this.text(icon, 50, y + 44 + i * 23, 16, '#fff', 400);
      this.fitText(line, 70, y + 44 + i * 23, WORLD_W - 112, 12, '#fff', 'left');
    });
  }

  /** Mission card: Chef Rank and the three current missions with progress bars. */
  drawMissions(y: number): void {
    const { ctx } = this;
    const p = this.progress;
    ctx.fillStyle = 'rgba(20,10,25,0.93)';
    this.roundRect(24, y, WORLD_W - 48, 108, 16);
    ctx.fill();
    this.text(`CHEF RANK ${p.rank}`, 40, y + 18, 13, '#ffd34d', 900, 'left');
    this.text(`+${Math.round((p.coinBonus - 1) * 100)}% coins · finish all 3 to rank up`, WORLD_W - 40, y + 18, 11, 'rgba(255,255,255,0.7)', 600, 'right');
    p.missions.forEach((m, i) => {
      const my = y + 34 + i * 22;
      const done = m.progress >= m.target;
      this.text(`${done ? '✓ ' : ''}${missionText(m)}`, 40, my, 12, done ? '#8fdc93' : '#ffffff', 700, 'left');
      this.text(`${m.progress}/${m.target}`, WORLD_W - 40, my, 12, 'rgba(255,255,255,0.8)', 700, 'right');
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      this.roundRect(40, my + 9, WORLD_W - 80, 4, 2);
      ctx.fill();
      ctx.fillStyle = done ? '#8fdc93' : '#ff8a5b';
      this.roundRect(40, my + 9, (WORLD_W - 80) * Math.min(1, m.progress / m.target), 4, 2);
      ctx.fill();
    });
    const w = p.weekly;
    const nextGoal = WEEKLY_GOALS.find((g) => w.best < g.height);
    this.fitText(nextGoal ? `Weekly challenge: best ${w.best} · reach ${nextGoal.height} for +${nextGoal.reward}` : `Weekly challenge complete! Best ${w.best}`, WORLD_W / 2, y + 100, WORLD_W - 70, 10.5, '#9fe3ff', 'center', 700);
  }

  /** Ghost of the best run: faint outlines of its layers around the current height. */
  drawGhost(minY: number, maxY: number): void {
    const friend = this.runMode === 'challenge' && this.friendGhost;
    const shape = friend ? this.friendGhost! : this.progress.bestShape;
    if (this.mode !== 'playing' || !shape.length || (this.runMode !== 'journey' && this.runMode !== 'time' && this.runMode !== 'challenge')) return;
    const { ctx } = this;
    const from = Math.max(1, this.height - 6);
    const to = Math.min(shape.length - 1, this.height + 8);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    for (let i = from; i <= to; i++) {
      const y = -LAYER_H * (i + 1);
      if (y < minY || y > maxY) continue;
      const [x, w] = shape[i];
      ctx.strokeStyle = friend ? `rgba(255,143,184,${i > this.height ? 0.6 : 0.3})` : `rgba(200,230,255,${i > this.height ? 0.35 : 0.18})`;
      this.roundRect(x, y, w, LAYER_H, 6);
      ctx.stroke();
    }
    ctx.restore();
    if (to > this.height + 1) this.text(friend ? '👻 friend’s run' : '👻 your best run', shape[to][0] + shape[to][1] / 2, -LAYER_H * (to + 1) - 10, 10, friend ? 'rgba(255,143,184,0.85)' : 'rgba(200,230,255,0.6)', 600);
  }

  /** Dashed line across the stack at a past height, so players can see their record coming. */
  drawMarker(height: number, label: string, color: string, minY: number, maxY: number): void {
    if (height <= 0) return;
    const y = -LAYER_H * (height + 1);
    if (y < minY - 20 || y > maxY + 20) return;
    const { ctx } = this;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(-this.offX, y);
    ctx.lineTo(WORLD_W + this.offX, y);
    ctx.stroke();
    ctx.setLineDash([]);
    this.text(`${label} ${height}`, WORLD_W - 8, y - 9, 11, color, 900, 'right');
  }

  // --------------------------------------------------------------- map

  openMap(): void {
    this.shopFrom = this.mode === 'map' ? this.shopFrom : this.mode;
    this.mode = 'map';
    // Start scrolled to the next chef to beat.
    this.listMax = 1e6;
    this.mapScroll = Math.max(0, (this.progress.unlocked - 1) * MAP_ROW - this.viewH * 0.3);
  }

  drawMap(): void {
    this.nemesisLevelCached = this.nemesisLevel();
    const { ctx } = this;
    const top = this.insets.top;
    const p = this.progress;
    ctx.fillStyle = 'rgba(20,10,25,0.6)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.text('CHEF JOURNEY', WORLD_W / 2, top + 31, 22, '#fff', 900);
    this.text(`★ ${p.totalStars}   ·   ${p.chefsBeaten} chefs beaten   ·   endless after ${STORY_LEVELS}`, WORLD_W / 2, top + 58, 12, '#ffd34d', 700);
    // The map is endless: it always shows a few levels past the furthest one reached.
    const count = p.unlocked + 4;

    const backY = this.viewH - this.insets.bottom - 60;
    const areaTop = top + 76;
    const areaH = backY - 10 - areaTop;
    this.listMax = Math.max(0, count * MAP_ROW + 40 - areaH);
    this.mapScroll = Math.min(this.mapScroll, this.listMax);
    const nodeX = (i: number) => (i % 2 ? 282 : 118);
    const nodeY = (i: number) => areaTop + 62 + i * MAP_ROW - this.mapScroll;

    ctx.save();
    ctx.beginPath();
    ctx.rect(-this.offX, areaTop, WORLD_W + this.offX * 2, areaH);
    ctx.clip();
    this.qaClip = [areaTop, areaTop + areaH];
    const first = Math.max(0, Math.floor((this.mapScroll - 100) / MAP_ROW));
    const last = Math.min(count - 1, Math.ceil((this.mapScroll + areaH) / MAP_ROW));
    // The path between chefs: gold where it's been walked, dashed ahead.
    for (let i = first; i < last; i++) {
      ctx.strokeStyle = i + 2 <= p.unlocked ? '#ffd34d' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 5;
      ctx.setLineDash(i + 2 <= p.unlocked ? [] : [6, 8]);
      ctx.beginPath();
      ctx.moveTo(nodeX(i), nodeY(i));
      ctx.bezierCurveTo(nodeX(i), nodeY(i) + MAP_ROW * 0.6, nodeX(i + 1), nodeY(i + 1) - MAP_ROW * 0.6, nodeX(i + 1), nodeY(i + 1));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let i = first; i <= last; i++) {
      const level = i + 1;
      const c = chefFor(level);
      const x = nodeX(i);
      const y = nodeY(i);
      const open = p.canEnter(level);
      const need = starsNeeded(level);
      if (need) {
        // Star gate banner just above the gated chef.
        const met = p.totalStars >= need;
        const gy = y - MAP_ROW / 2;
        ctx.fillStyle = met ? 'rgba(42,157,92,0.92)' : 'rgba(20,10,25,0.92)';
        this.roundRect(WORLD_W / 2 - 110, gy - 14, 220, 28, 14);
        ctx.fill();
        ctx.strokeStyle = met ? '#8fdc93' : '#ffd34d';
        ctx.lineWidth = 2;
        ctx.stroke();
        this.text(met ? `★ GATE OPEN · ${need}★` : `★ STAR GATE · ${p.totalStars}/${need}★`, WORLD_W / 2, gy + 1, 12, met ? '#ffffff' : '#ffd34d', 900);
      }
      const stars = p.stars[i] || 0;
      const current = level === p.playLevel && !stars;
      this.drawPortrait(c, x, y, 40, open, stars === 3 ? 'happy' : 'calm');
      if (level === this.nemesisLevelCached) this.text('😈', x + 30, y - 30, 20, '#fff', 400);
      ctx.lineWidth = current ? 4 + Math.sin(this.time * 6) * 1.5 : 2.5;
      ctx.strokeStyle = current ? '#ffd34d' : open ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.stroke();
      // Label beside the node, toward the middle.
      const lx = i % 2 ? x - 52 : x + 52;
      const align: CanvasTextAlign = i % 2 ? 'right' : 'left';
      const legendLvl = level > STORY_LEVELS && level % 10 === 0;
      this.text(legendLvl ? `LEVEL ${level} · LEGEND` : `LEVEL ${level}`, lx, y - 20, 11, legendLvl ? '#ffd34d' : 'rgba(255,255,255,0.65)', 800, align);
      this.text(open ? c.name : level <= p.unlocked ? `Needs ${need}★` : '???', lx, y - 2, 14, open ? '#fff' : 'rgba(255,255,255,0.5)', 800, align);
      this.text('★'.repeat(stars) + '☆'.repeat(3 - stars), lx, y + 18, 15, stars ? '#ffd34d' : 'rgba(255,255,255,0.3)', 900, align);
      if (current) {
        const pw = 64;
        const px = align === 'left' ? lx : lx - pw;
        ctx.fillStyle = '#ff8a5b';
        this.roundRect(px, y + 30, pw, 20, 10);
        ctx.fill();
        this.text('PLAY ▶', px + pw / 2, y + 40.5, 11, '#fff', 900);
      }
      // Reached-but-gated chefs are tappable too; starting one explains the gate.
      if (level <= p.unlocked && y + 44 > areaTop && y - 44 < areaTop + areaH) {
        const hy = Math.max(y - 44, areaTop);
        this.buttons.push({ x: Math.min(x - 44, lx - (align === 'right' ? 130 : 0)), y: hy, w: 88 + 130, h: Math.min(y + 50, areaTop + areaH) - hy, onTap: () => this.startRun(level) });
      }
    }
    ctx.restore();
    this.button(16, backY, WORLD_W - 32, 46, t('back'), () => { this.mode = this.shopFrom === 'map' ? 'title' : this.shopFrom; }, 'quiet');
  }

  /** A chef's face in a circle; greyed out with a lock when not yet reached. */
  drawPortrait(c: Chef, x: number, y: number, r: number, open: boolean, mood: Mood): void {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = open ? c.accent : '#3a3340';
    ctx.fill();
    ctx.clip();
    drawChef(ctx, c, x, y + r * 0.2, r / 47, mood, x, y + 200, this.time);
    if (!open) {
      ctx.fillStyle = 'rgba(20,12,24,0.78)';
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      this.roundRect(x - r * 0.3, y - r * 0.05, r * 0.6, r * 0.45, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = r * 0.09;
      ctx.beginPath();
      ctx.arc(x, y - r * 0.05, r * 0.2, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------- album

  openAlbum(): void {
    this.shopFrom = this.mode;
    this.mode = 'album';
    this.albumScroll = 0;
  }

  drawAlbum(): void {
    const { ctx } = this;
    const top = this.insets.top;
    const p = this.progress;
    ctx.fillStyle = 'rgba(20,10,25,0.6)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.text('ALBUM', WORLD_W / 2, top + 31, 24, '#fff', 900);
    const tabs: { id: AlbumTab; label: string }[] = [{ id: 'chefs', label: 'CHEFS' }, { id: 'stickers', label: 'STICKERS' }, { id: 'recipes', label: 'COLLECTIONS' }, { id: 'records', label: 'RECORDS' }];
    const tabW = (WORLD_W - 32 - 18) / 4;
    tabs.forEach((t, i) => {
      const x = 16 + i * (tabW + 6);
      const on = t.id === this.albumTab;
      ctx.fillStyle = on ? '#ff8a5b' : 'rgba(255,255,255,0.12)';
      this.roundRect(x, top + 56, tabW, 30, 15);
      ctx.fill();
      this.text(t.label, x + tabW / 2, top + 72, 12, on ? '#fff' : 'rgba(255,255,255,0.8)', 800);
      this.buttons.push({ x, y: top + 56, w: tabW, h: 30, onTap: () => { this.albumTab = t.id; this.albumScroll = 0; } });
    });

    const backY = this.viewH - this.insets.bottom - 60;
    const areaTop = top + 98;
    const areaH = backY - 10 - areaTop;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-this.offX, areaTop, WORLD_W + this.offX * 2, areaH);
    ctx.clip();
    this.qaClip = [areaTop, areaTop + areaH];
    let contentH = 0;
    const y0 = areaTop - this.albumScroll;

    if (this.albumTab === 'chefs') {
      const cw = (WORLD_W - 32 - 16) / 3;
      const chh = 128;
      // Story chefs, plus every endless chef reached so far.
      const cards = Array.from({ length: Math.max(CHEFS.length, p.unlocked) }, (_, i) => chefFor(i + 1));
      cards.forEach((c, i) => {
        const x = 16 + (i % 3) * (cw + 8);
        const y = y0 + Math.floor(i / 3) * (chh + 8);
        if (y + chh < areaTop || y > areaTop + areaH) return;
        const got = (p.stars[i] || 0) > 0;
        ctx.fillStyle = got ? 'rgba(255,248,235,0.95)' : 'rgba(255,255,255,0.08)';
        this.roundRect(x, y, cw, chh, 12);
        ctx.fill();
        this.drawPortrait(c, x + cw / 2, y + 46, 34, got, got ? 'happy' : 'calm');
        this.text(`LV ${i + 1}`, x + cw / 2, y + 92, 10, got ? 'rgba(74,38,24,0.6)' : 'rgba(255,255,255,0.5)', 800);
        this.text(got ? c.name.replace(/^(Chef|Master|Grand Master|Grand Chef|Emperor Chef|Dragon Chef|Sensei|Captain|Iron Chef|Legend) /, '') : '???', x + cw / 2, y + 106, 12, got ? '#4a2618' : 'rgba(255,255,255,0.5)', 800);
        const st = p.stars[i] || 0;
        this.text('★'.repeat(st) + '☆'.repeat(3 - st), x + cw / 2, y + 120, 11, got ? '#e0a800' : 'rgba(255,255,255,0.25)', 900);
        const cl = Progress.cardLevel(p.cards[i + 1] ?? (got ? 1 : 0));
        if (cl >= 2) {
          ctx.fillStyle = cl >= 4 ? '#d4a537' : '#4a2618';
          this.roundRect(x + cw - 34, y + 6, 28, 16, 8);
          ctx.fill();
          this.text(`Lv${cl}`, x + cw - 20, y + 14.5, 9.5, '#fff', 700);
        }
      });
      contentH = Math.ceil(cards.length / 3) * (chh + 8);
    } else if (this.albumTab === 'stickers') {
      // Seasonal sticker album: 12 sets of 9, from chests, gifts, the Pass and events.
      const a = this.progress.album;
      const fresh = a.season === currentSeason().n;
      const total = fresh ? a.have.reduce((n: number, set: number[]) => n + set.filter((x) => x > 0).length, 0) : 0;
      let y = y0;
      this.text(`SEASON ${currentSeason().n} ALBUM · ${total}/108 · complete it for ${ALBUM_REWARD} coins + Album Master flag`, 16, y + 10, 11, 'rgba(255,255,255,0.8)', 800, 'left');
      y += 24;
      const cw = (WORLD_W - 32 - 16) / 3;
      STICKER_SETS.forEach((set, i) => {
        const x = 16 + (i % 3) * (cw + 8);
        const yy = y + Math.floor(i / 3) * 108;
        const have = fresh ? (a.have[i] ?? []).filter((n: number) => n > 0).length : 0;
        const done = fresh && a.setsDone.includes(i);
        ctx.fillStyle = done ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)';
        this.roundRect(x, yy, cw, 100, 12);
        ctx.fill();
        this.text(set.stickers[0], x + cw / 2, yy + 32, 30, '#fff', 400);
        this.text(set.name, x + cw / 2, yy + 64, 12, '#fff', 800);
        this.text(done ? '✓ COMPLETE' : `${have}/9`, x + cw / 2, yy + 84, 11, done ? '#8fdc93' : '#ffd34d', 900);
        if (yy + 100 > areaTop && yy < areaTop + areaH) {
          const hy = Math.max(yy, areaTop);
          this.buttons.push({ x, y: hy, w: cw, h: Math.min(yy + 100, areaTop + areaH) - hy, onTap: () => { this.ensureAlbum(); this.setDetail = i; } });
        }
      });
      contentH = y - y0 + Math.ceil(STICKER_SETS.length / 3) * 108;
    } else if (this.albumTab === 'recipes') {
      let y = y0;
      this.text(`RECIPE BOOK · serve each ${RECIPE_GOAL} times (+50 coins)`, 16, y + 10, 12, 'rgba(255,255,255,0.75)', 800, 'left');
      y += 24;
      for (const r of RECIPES.filter((x) => (!x.secret || p.secrets.includes(x.name)) && (x.level ?? 0) <= Math.max(p.unlocked, 50))) {
        const n = Math.min(p.recipeCounts[r.name] ?? 0, RECIPE_GOAL);
        const done = n >= RECIPE_GOAL;
        ctx.fillStyle = 'rgba(48,30,52,0.94)';
        this.roundRect(16, y, WORLD_W - 32, 70, 12);
        ctx.fill();
        this.drawDish(70, y + 32, 0.62, 0, r);
        this.text(r.name, 130, y + 20, 14, '#fff', 800, 'left');
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        this.roundRect(130, y + 36, 180, 6, 3);
        ctx.fill();
        ctx.fillStyle = done ? '#8fdc93' : '#ff8a5b';
        this.roundRect(130, y + 36, 180 * (n / RECIPE_GOAL), 6, 3);
        ctx.fill();
        this.text(done ? '✓ MASTERED' : `${n}/${RECIPE_GOAL} served`, 130, y + 56, 11, done ? '#8fdc93' : 'rgba(255,255,255,0.7)', 800, 'left');
        y += 78;
      }
      y += 8;
      this.text('SHOP COLLECTIONS · own every item in a tab (+200 coins)', 16, y + 10, 12, 'rgba(255,255,255,0.75)', 800, 'left');
      y += 24;
      for (const t of TABS) {
        if (t.cat === 'booster' || t.cat === 'deals') continue;
        const items = CATALOG[t.cat as Cosmetic].filter((i) => !i.earn);
        const have = items.filter((i) => this.owned[t.cat as Cosmetic].includes(i.id)).length;
        const done = have === items.length;
        ctx.fillStyle = 'rgba(48,30,52,0.94)';
        this.roundRect(16, y, WORLD_W - 32, 44, 12);
        ctx.fill();
        this.text(t.label, 32, y + 22, 13, '#fff', 800, 'left');
        this.text(done ? '✓ COMPLETE' : `${have}/${items.length} owned`, WORLD_W - 32, y + 22, 12, done ? '#8fdc93' : 'rgba(255,255,255,0.75)', 800, 'right');
        y += 52;
      }
      y += 8;
      this.text(`EXCLUSIVES · chest pieces: ${p.pieces}`, 16, y + 10, 12, 'rgba(255,255,255,0.75)', 800, 'left');
      y += 24;
      for (const cat of Object.keys(CATALOG) as Cosmetic[]) {
        for (const item of CATALOG[cat].filter((i) => i.earn)) {
          const got = this.owned[cat].includes(item.id);
          ctx.fillStyle = 'rgba(48,30,52,0.94)';
          this.roundRect(16, y, WORLD_W - 32, 44, 12);
          ctx.fill();
          this.text(item.name, 32, y + 22, 13, got ? '#ffd34d' : '#fff', 800, 'left');
          this.text(got ? '✓ UNLOCKED' : item.earn!, WORLD_W - 32, y + 22, 11, got ? '#8fdc93' : 'rgba(255,255,255,0.65)', 700, 'right');
          y += 52;
        }
      }
      contentH = y - y0;
    } else {
      let y = y0;
      const row = (label: string, value: string, color = '#fff') => {
        ctx.fillStyle = 'rgba(48,30,52,0.94)';
        this.roundRect(16, y, WORLD_W - 32, 40, 10);
        ctx.fill();
        this.text(label, 32, y + 20, 13, 'rgba(255,255,255,0.8)', 700, 'left');
        this.text(value, WORLD_W - 32, y + 20, 14, color, 900, 'right');
        y += 46;
      };
      row('Chef Rank', `${p.rank}  (+${Math.round((p.coinBonus - 1) * 100)}% coins)`, '#ffd34d');
      row('Journey stars', `★ ${p.totalStars}`, '#ffd34d');
      row('Chefs beaten', `${p.chefsBeaten}`);
      row('Furthest level', `${p.unlocked}`);
      row('Best height', `${this.best}`);
      row('Coins', `${this.bank}`, '#ffd34d');
      y += 6;
      this.text('WEEKLY CHALLENGE · resets every Monday', 16, y + 10, 12, 'rgba(255,255,255,0.75)', 800, 'left');
      y += 24;
      WEEKLY_GOALS.forEach((g, i) => row(`Stack ${g.height} in one run`, p.weekly.claimed.includes(i) ? '✓ +' + g.reward : `${p.weekly.best}/${g.height}  ·  +${g.reward}`, p.weekly.claimed.includes(i) ? '#8fdc93' : '#fff'));
      y += 6;
      this.text('YOUR TOP RUNS', 16, y + 10, 12, 'rgba(255,255,255,0.75)', 800, 'left');
      y += 24;
      if (!p.topRuns.length) row('No runs yet', '-');
      p.topRuns.forEach((h, i) => row(`#${i + 1}`, `${h} layers`, i === 0 ? '#ffd34d' : '#fff'));
      contentH = y - y0;
    }
    ctx.restore();
    this.listMax = Math.max(0, contentH - areaH + 10);
    this.albumScroll = Math.min(this.albumScroll, this.listMax);
    this.button(16, backY, WORLD_W - 32, 46, t('back'), () => { this.mode = this.shopFrom; }, 'quiet');
  }

  dealsHeight(): number {
    return 6 * 108 + 40;
  }

  /** Shop DEALS tab: starter pack, VIP, piggy bank, premium pass, streak freezes and free chests. */
  drawDeals(y: number, frame: { areaTop: number; areaH: number }): void {
    const p = this.progress;
    const W = WORLD_W - 32;
    if (!monetize.purchasesLive) this.text('TEST MODE · purchases are simulated, no real money is charged', WORLD_W / 2, y + 12, 10.5, '#9fe3ff', 800);
    y += 28;
    const deal = (icon: string, title: string, desc: string, label: string, onTap: () => void, style: 'gold' | 'quiet' | 'primary', extra?: () => void) => {
      this.card(16, y, W, 98, 'rgba(48,30,52,0.95)');
      this.text(icon, 46, y + 36, 30, '#fff', 400);
      this.text(title, 80, y + 22, 15, '#fff', 900, 'left');
      this.wrapLeft(desc, 80, y + 42, W - 190, 10.5, 'rgba(255,255,255,0.75)');
      extra?.();
      this.pill(WORLD_W - 132, y + 33, 104, label, frame, onTap, style);
      y += 108;
    };
    if (!p.starterBought) deal('🎁', 'Starter Pack', PRODUCTS.starter.desc, PRODUCTS.starter.price, () => this.buy('starter'), 'gold');
    deal('👑', 'VIP Chef', p.vip ? `Active until ${new Date(p.vipUntil).toLocaleDateString()}. ${PRODUCTS.vip.desc}` : PRODUCTS.vip.desc, p.vip ? 'EXTEND' : PRODUCTS.vip.price, () => this.buy('vip'), 'gold');
    const full = p.piggy >= 2500;
    deal('🐷', `Piggy Bank · ${p.piggy} coins`, 'Every run drops 15% of its coins in here (up to 2,500). Break it to keep them all.', p.piggy ? PRODUCTS.piggy.price : 'EMPTY', () => { if (p.piggy) this.buy('piggy'); }, p.piggy ? 'gold' : 'quiet', () => this.bar(80, y + 80, W - 190, p.piggy / 2500, full ? '#ff5d8f' : '#ffd34d'));
    deal('🎟️', 'Premium Sushi Pass', p.pass.premium ? 'Unlocked for this season. Claim rewards in More → Sushi Pass.' : PRODUCTS.pass.desc, p.pass.premium ? 'OPEN' : PRODUCTS.pass.price, () => (p.pass.premium ? this.openScreen('pass', 'shop') : this.buy('pass')), 'gold');
    deal('❄️', `Streak Freeze · you have ${p.freezes}/2`, 'Protects your daily gift streak if you miss one day. One is free every week.', p.freezes >= 2 ? 'FULL' : '150 coins', () => {
      if (p.freezes >= 2) return;
      if (this.spend(150)) { p.freezes++; p.persist(); this.showToast('Streak freeze ready ❄'); }
    }, p.freezes >= 2 ? 'quiet' : 'primary');
    const left = 3 - p.ads.chests;
    deal('📦', 'Free Chest', `Watch a short ad for a free chest (${left} left today).`, left > 0 ? '▶ WATCH' : 'TOMORROW', () => {
      if (left <= 0) return;
      this.watchAd('Free chest', () => { p.ads.chests++; this.openChest(p.playLevel); p.persist(); });
    }, left > 0 ? 'gold' : 'quiet');
  }

  /** Left-aligned wrapped text (max two lines). */
  wrapLeft(str: string, x: number, y: number, maxW: number, size: number, color: string): void {
    const { ctx } = this;
    ctx.font = `600 ${size}px ${FONT}`;
    const words = str.split(' ');
    let line = '';
    let lines = 0;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        this.text(lines === 1 ? `${line}…` : line, x, y + lines * size * 1.3, size, color, 600, 'left');
        if (++lines === 2) return;
        line = w;
      } else line = test;
    }
    if (line) this.text(line, x, y + lines * size * 1.3, size, color, 600, 'left');
  }

  openTab(cat: Cat): void {
    this.shopTab = cat;
    this.shopScroll = 0;
    this.shopSel = null;
  }

  drawShop(): void {
    const { ctx } = this;
    const top = this.insets.top;
    const cx = WORLD_W / 2;
    ctx.fillStyle = 'rgba(20,10,25,0.6)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.text('SHOP', cx, top + 31, 24, '#fff', 900);
    // Sake-chan runs the shop, and points you to the fair-play promise.
    drawSake(ctx, cx + 64, top + 30, 0.3, 'grumpy', this.time);
    this.buttons.push({ x: cx + 44, y: top + 10, w: 40, h: 40, onTap: () => { this.showToast(`Sake-chan: “${SAKE_LINES.shop[Math.floor(Math.random() * SAKE_LINES.shop.length)]}” · see the No-Nonsense Promise in MORE`); }, label: 'Sake-chan the shopkeeper' });

    // Category tabs.
    const tabW = (WORLD_W - 32 - (TABS.length - 1) * 6) / TABS.length;
    TABS.forEach((t, i) => {
      const x = 16 + i * (tabW + 6);
      const on = t.cat === this.shopTab;
      ctx.fillStyle = on ? '#ff8a5b' : 'rgba(255,255,255,0.12)';
      this.roundRect(x, top + 56, tabW, 30, 15);
      ctx.fill();
      this.text(t.label, x + tabW / 2, top + 72, 12, on ? '#fff' : 'rgba(255,255,255,0.8)', 800);
      this.buttons.push({ x, y: top + 56, w: tabW, h: 30, onTap: () => this.openTab(t.cat) });
    });
    const tab = TABS.find((t) => t.cat === this.shopTab)!;
    this.text(tab.hint, 16, top + 102, 12, 'rgba(255,255,255,0.7)', 700, 'left');

    // Scrollable grid of cards.
    const backY = this.viewH - this.insets.bottom - 60;
    const areaTop = top + 114;
    const areaH = backY - 10 - areaTop;
    const gap = 10;
    const cw = (WORLD_W - 32 - gap) / 2;
    const ch = 96;
    const deals = this.shopTab === 'deals';
    const items: Item[] = deals ? [] : this.shopTab === 'booster' ? BOOSTERS : CATALOG[this.shopTab as Cosmetic];
    const rows = Math.ceil(items.length / 2);
    this.shopMaxScroll = Math.max(0, (deals ? this.dealsHeight() : rows * (ch + gap) - gap) - areaH);
    this.shopScroll = Math.min(this.shopScroll, this.shopMaxScroll);

    ctx.save();
    ctx.beginPath();
    ctx.rect(-this.offX, areaTop, WORLD_W + this.offX * 2, areaH);
    ctx.clip();
    this.qaClip = [areaTop, areaTop + areaH];
    if (deals) this.drawDeals(areaTop - this.shopScroll, { areaTop, areaH });
    items.forEach((item, i) => {
      const x = 16 + (i % 2) * (cw + gap);
      const y = areaTop + Math.floor(i / 2) * (ch + gap) - this.shopScroll;
      if (y + ch < areaTop || y > areaTop + areaH) return;
      if (this.shopTab === 'booster') this.drawBoosterCard(item as (typeof BOOSTERS)[number], x, y, cw, ch);
      else this.drawCosmeticCard(this.shopTab as Cosmetic, item, x, y, cw, ch);
      // Only the visible part of a card is tappable.
      const hy = Math.max(y, areaTop);
      const hh = Math.min(y + ch, areaTop + areaH) - hy;
      const onTap = this.shopTab === 'booster' ? () => this.buyBooster(item.id as BoosterId) : () => this.tapCosmetic(this.shopTab as Cosmetic, item);
      this.buttons.push({ x, y: hy, w: cw, h: hh, onTap });
    });
    ctx.restore();

    // Scroll hint: fade at the bottom edge when more cards are below.
    if (this.shopScroll < this.shopMaxScroll - 2) {
      const g = ctx.createLinearGradient(0, areaTop + areaH - 30, 0, areaTop + areaH);
      g.addColorStop(0, 'rgba(20,10,25,0)');
      g.addColorStop(1, 'rgba(20,10,25,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(-this.offX, areaTop + areaH - 30, WORLD_W + this.offX * 2, 30);
      // A solid chip, so it never reads as part of the card underneath.
      ctx.fillStyle = 'rgba(20,10,25,0.95)';
      this.roundRect(cx - 34, areaTop + areaH - 20, 68, 20, 10);
      ctx.fill();
      this.qaSkip = true; // floats over the scrolling list on purpose
      this.text('▾ more', cx, areaTop + areaH - 9.5, 11, 'rgba(255,255,255,0.85)', 700);
      this.qaSkip = false;
    }

    this.button(16, backY, WORLD_W - 32, 46, t('back'), () => { this.mode = this.shopFrom; this.shopSel = null; }, 'quiet');
  }

  drawBoosterCard(b: (typeof BOOSTERS)[number], x: number, y: number, w: number, h: number): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(255,248,235,0.95)';
    this.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(x + 28, y + 30, 19, 0, Math.PI * 2);
    ctx.fill();
    this.text(b.glyph, x + 28, y + 31, b.glyph.length > 1 ? 15 : 19, '#fff', 900);
    ctx.fillStyle = '#e0a800';
    ctx.beginPath();
    ctx.arc(x + 60, y + 30, 6, 0, Math.PI * 2);
    ctx.fill();
    this.text(String(b.price), x + 70, y + 31, 15, this.bank >= b.price ? '#4a2618' : '#b5442a', 900, 'left');
    const n = this.boosters[b.id] ?? 0;
    if (n) {
      ctx.fillStyle = '#4a2618';
      this.roundRect(x + w - 36, y + 8, 28, 18, 9);
      ctx.fill();
      this.text(`x${n}`, x + w - 22, y + 18, 11, '#fff', 800);
    }
    this.text(b.name, x + 12, y + 64, 13, '#4a2618', 800, 'left');
    this.text(b.desc, x + 12, y + 82, 11, 'rgba(74,38,24,0.75)', 600, 'left');
  }

  drawCosmeticCard(cat: Cosmetic, item: Item, x: number, y: number, w: number, h: number): void {
    const { ctx } = this;
    const owned = this.owned[cat].includes(item.id);
    const equipped = this.equip[cat] === item.id;
    const selected = this.shopSel === `${cat}:${item.id}`;
    ctx.fillStyle = 'rgba(48,30,52,0.94)';
    this.roundRect(x, y, w, h, 12);
    ctx.fill();
    if (equipped || selected) {
      ctx.strokeStyle = selected ? '#ffd34d' : '#6cc070';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Preview of the item itself.
    const px = x + w / 2;
    const py = y + 30;
    switch (cat) {
      case 'plate':
        drawPlate(ctx, item.id, px, py - 6, 0.55);
        break;
      case 'flag':
        ctx.save();
        ctx.translate(px - 6, py + 16);
        ctx.scale(1.3, 1.3);
        drawFlag(ctx, item.id, 0, 0, 30);
        ctx.restore();
        break;
      case 'set': {
        const set = SETS.find((s2) => s2.id === item.id)!;
        const kinds: Ingredient[] = ['egg', 'salmon', 'nori', 'avocado', 'rice'];
        kinds.forEach((k, i) => {
          ctx.fillStyle = set.colors[k] ?? COLORS[k];
          this.roundRect(px - 40, py - 22 + i * 9, 80, 8, 2.5);
          ctx.fill();
        });
        break;
      }
      case 'fx': {
        const fx = EFFECTS.find((e) => e.id === item.id)!;
        for (let i = 0; i < 6; i++) {
          const a = this.time * 1.5 + (i / 6) * Math.PI * 2;
          drawShape(ctx, fx.shape, px + Math.cos(a) * 26, py + Math.sin(a) * 13, fx.shape === 'square' ? 5 : 6.5, fx.colors[i % fx.colors.length], a);
        }
        break;
      }
    }

    this.text(item.name, x + 12, y + 64, 13, '#fff', 800, 'left');
    if (selected) {
      this.text(`Tap again to buy for ${item.price}`, x + 12, y + 82, 11, '#ffd34d', 700, 'left');
    } else if (equipped) {
      this.text('✓ IN USE', x + 12, y + 82, 11, '#8fdc93', 800, 'left');
    } else if (owned) {
      this.text('Tap to use', x + 12, y + 82, 11, 'rgba(255,255,255,0.7)', 700, 'left');
    } else if (item.earn) {
      this.text(`★ Earn: ${item.earn}`, x + 12, y + 82, 11, '#9fe3ff', 700, 'left');
    } else {
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(x + 17, y + 82, 5, 0, Math.PI * 2);
      ctx.fill();
      this.text(String(item.price), x + 26, y + 83, 13, this.bank >= item.price ? '#ffd34d' : '#ff9a8a', 800, 'left');
    }
  }

  spend(price: number): boolean {
    if (this.bank < price) {
      this.showToast(`You need ${price - this.bank} more coins`);
      haptic.error();
      return false;
    }
    this.bank -= price;
    save.setCoins(this.bank);
    return true;
  }

  buyBooster(id: BoosterId): void {
    this.shopSel = null;
    const b = BOOSTERS.find((x) => x.id === id)!;
    if (!this.spend(b.price)) return;
    this.boosters[id] = (this.boosters[id] ?? 0) + 1;
    save.setBoosters(this.boosters);
    this.showToast(`${b.name} ready for your next run`);
    sfx.serve();
    haptic.success();
  }

  /** Owned: put it on. Not owned: the first tap selects it, the second buys it. */
  tapCosmetic(cat: Cosmetic, item: Item): void {
    const key = `${cat}:${item.id}`;
    if (this.owned[cat].includes(item.id)) {
      this.equip[cat] = item.id;
      save.setEquipped(cat, item.id);
      this.shopSel = null;
      sfx.drop();
      return;
    }
    if (item.earn) {
      this.showToast(`Exclusive: unlock it with ${item.earn}`);
      return;
    }
    if (this.shopSel !== key) {
      this.shopSel = key;
      if (this.bank < item.price) {
        this.shopSel = null;
        this.showToast(`You need ${item.price - this.bank} more coins`);
        haptic.error();
      }
      return;
    }
    if (!this.spend(item.price)) return;
    this.owned[cat].push(item.id);
    save.setOwned(cat, this.owned[cat]);
    this.equip[cat] = item.id;
    save.setEquipped(cat, item.id);
    this.shopSel = null;
    this.showToast(`${item.name} unlocked!`);
    sfx.serve();
    haptic.success();
    // Owning every buyable item in a tab completes that collection.
    const tab = TABS.find((t) => t.cat === cat)!;
    if (CATALOG[cat].filter((i) => !i.earn).every((i) => this.owned[cat].includes(i.id)) && this.progress.stamp(`set-${cat}`)) {
      this.bankCoins(200);
      this.showToast(`Collection complete: ${tab.label}! +200 coins`);
    }
  }

  // ================================================================ screens

  // ------------------------------------------------------------------ modes

  // ----------------------------------------------------------------- events

  // ------------------------------------------------------------------- more

  musicOn = save.json('music', true);

  // ------------------------------------------------------------- restaurant

  // ------------------------------------------------------------ restaurant economy

  get rest() {
    return this.progress.rest;
  }

  get restPass(): boolean {
    return this.rest.passUntil > Date.now();
  }

  get restTier(): number {
    return this.progress.restaurant.r + this.progress.restaurant.michelin;
  }

  // ------------------------------------------------------------ guests

  guestReady: number[] = [];
  restFx: { text: string; x: number; y: number; t: number }[] = [];
  restTab: 'build' | 'kitchen' | 'decor' | 'staff' | 'menu' | 'themes' | 'expand' | 'street' | 'shelf' | 'guests' | 'reviews' | 'rival' | 'fest' | 'trucks' = 'build';
  visit: RestCode | null = null;
  sceneBox = { x: 16, y: 0, w: WORLD_W - 32, h: 300 };

  // ------------------------------------------------------------ critic

  // ------------------------------------------------------------ decor, staff, menu, themes

  // ------------------------------------------------------------ friend visits

  // ------------------------------------------------------------ the restaurant screen

  restTabsY = 0; // where the tabs start, so cards can jump down to them

  // ---------------------------------------------------------------- hub cards

  // ---------------------------------------------------------------- tabs

  // ---------------------------------------------------------------- overlays

  // ================================================================ the diner loop
  // Runs stock the pantry, the burners cook dishes from it, guests buy them, and the coins grow the
  // restaurant (kitchen upgrades, expansions, Sakura Street). Kitchen upgrades make runs stronger.
  // The rules and data live in diner.ts; this part applies them and draws them.

  get diner(): DinerState {
    return this.progress.diner;
  }

  runStock = 0; // ingredients stocked this run
  runReqs = 0; // guest requests filled this run
  runXpAt = 0; // height already counted for staff XP and festival tokens
  catBonus = 0;
  cheer: { emoji: string; name: string; text: string; t: number } | null = null;
  burst: { base: number; taps: number; t: number; sparks: { x: number; y: number; vx: number; vy: number; t: number }[] } | null = null;
  kitchenPick: number | null = null;
  restSay: { text: string; x: number; y: number; t: number } | null = null;
  seatGuests: (SeatGuest | null)[] = [];
  reportOpen = false;
  snackHint = false;

  // ---------------------------------------------------------------- pantry and goals

  // ---------------------------------------------------------------- income, reviews, week

  // ---------------------------------------------------------------- rating, dream

  // ---------------------------------------------------------------- tips

  // ---------------------------------------------------------------- kitchen

  // ---------------------------------------------------------------- guests

  // ---------------------------------------------------------------- collections, street, festival

  // ---------------------------------------------------------------- runs

  // ------------------------------------------------------------------ pass

  // ------------------------------------------------------------ companions

  // ------------------------------------------------------------ story

  // --------------------------------------------------------- regulars

  // ------------------------------------------------------- achievements

  // ------------------------------------------------------------ gallery

  // ------------------------------------------------------------- avatar

  // ------------------------------------------------------------ intro

  // ------------------------------------------------------------ leagues

  // ------------------------------------------------------------ streak quest

  get quest() {
    const q = currentQuest();
    const p = this.progress;
    if (p.quest.key !== q.key) p.quest = { key: q.key, joined: false, stage: 0, out: false, claimed: false };
    return p.quest;
  }

  // ------------------------------------------------------------ nemesis

  // ------------------------------------------------------------ twin layers

  // ------------------------------------------------------------ rescue levels

  // ------------------------------------------------------------ omakase tower

  // ------------------------------------------------------------ modifier challenges

  // ------------------------------------------------------------ mini-games

  // ================================================================ clarity: the first day, Next up, What's new

  /** The guided first day: a pointer walks a new player from their first chef to their first dish. */
  static GUIDE = [
    { id: 'play', text: 'Tap PLAY and beat your first chef' },
    { id: 'open', text: 'Beat one more chef to open grandma’s restaurant' },
    { id: 'visit', text: 'Grandma’s restaurant is open! Tap RESTAURANT' },
    { id: 'build', text: 'Build the Sushi Counter with the ★ you earned' },
    { id: 'cook', text: 'Cook your first dish: tap the burner' },
    { id: 'plate', text: 'It’s ready! Tap it to plate it' },
    { id: 'serve', text: 'Tap a hungry guest to serve your dish' },
  ];

  guideRect: { x: number; y: number; w: number; h: number } | null = null;
  guideScrolled = '';
  guideT = 0;
  curFrame: { areaTop: number; areaH: number } | null = null;

  // ---------------------------------------------------------------- what's new

  static NEWS: { id: string; unlock: string; icon: string; title: string; text: string; go: (g: Game) => void }[] = [
    { id: 'kitchen', unlock: 'restaurant', icon: '🍳', title: 'Grandma’s kitchen', text: 'Runs stock the pantry: cook dishes and serve guests', go: (g) => g.openScreen('restaurant') },
    { id: 'daily', unlock: 'daily', icon: '🟩', title: 'Daily Roll', text: 'The same layers for everyone today. Share your grid!', go: (g) => g.openScreen('daily') },
    { id: 'book', unlock: 'book', icon: '📖', title: 'Grandma’s Book', text: 'Her letters, real recipes, seasons and facts', go: (g) => g.openScreen('book') },
    { id: 'relay', unlock: 'relay', icon: '🤝', title: 'Relay & ASMR Kitchen', text: 'Play with a friend on one tower, or just relax', go: (g) => g.openScreen('modes') },
    { id: 'world', unlock: 'world', icon: '🌍', title: 'Tower of the World', text: 'Everyone’s layers in one tower, plus the Country Cup', go: (g) => g.openScreen('world') },
    { id: 'boss', unlock: 'bossmaker', icon: '🧑‍🍳', title: 'Boss Chef Maker', text: 'Design a boss chef and dare your friends', go: (g) => g.openScreen('bossmaker', 'title') },
  ];

  // ---------------------------------------------------------------- next up

  // ================================================================ solid: quality, battery, diagnostics

  lowPower = false;

  get lite(): boolean {
    return this.lowPower || settings.batterySaver;
  }

  diagTilt: number | null = null;
  diagCamOn = false;

  // ================================================================ standout features

  marks = ''; // one letter per drop this run: P = PERFECT, C = trimmed, M = the miss
  runMaxCombo = 0;
  dailyPractice = false;
  relay: { turn: 0 | 1; stats: { p: number; c: number }[] } | null = null;
  tableMode = false;
  video: HTMLVideoElement | null = null;
  camStream: MediaStream | null = null;
  studio = false;
  poster: { style: number; img: HTMLCanvasElement | null } | null = null;
  hl: { pct: number } | null = null;
  customChef: Chef | null = null;
  customBoss: BossDesign | null = null;
  customFromFriend = false;
  bossDraft: BossDesign = { ...DEFAULT_BOSS };
  bookTab: 'letters' | 'recipes' | 'seasons' | 'combos' | 'trivia' | 'story' = 'letters';
  letterOpen: number | null = null;
  recipeOpen: number | null = null;
  sakeSay: { text: string; t: number } | null = null;
  triviaNow = -1;
  chefMemo = new Map<string, Chef>();

  // ---------------------------------------------------------------- daily roll

  // ---------------------------------------------------------------- relay co-op

  // ---------------------------------------------------------------- ASMR and table mode

  get zenLike(): boolean {
    return this.runMode === 'zen' || this.runMode === 'asmr';
  }

  // ---------------------------------------------------------------- custom boss chefs

  // ---------------------------------------------------------------- share studio

  static POSTERS = [
    { name: 'Night', bg: ['#1b1035', '#3a1d5c'], ink: '#ffffff', accent: '#ffd34d' },
    { name: 'Sakura', bg: ['#ffe5ec', '#ff8fab'], ink: '#4a2618', accent: '#c1121f' },
    { name: 'Gold', bg: ['#2a1a0a', '#6a4a14'], ink: '#fff3b0', accent: '#ffd34d' },
  ];

  // ---------------------------------------------------------------- characters

  // ---------------------------------------------------------------- culture

  // ---------------------------------------------------------------- fair play

  // ------------------------------------------------------------ cuisine worlds

  // ------------------------------------------------------------ recipe lab

  labMix: string[] = [];
  labFx: { text: string; t: number; good: boolean } | null = null;

  // ------------------------------------------------------------ food truck branches

  // ------------------------------------------------------------ jukebox

  // ------------------------------------------------------------ photo mode

  photo: { filter: number; frame: number; chef: boolean; img: HTMLCanvasElement | null } | null = null;

  static FILTERS: [string, string][] = [['Natural', 'none'], ['Warm', 'sepia(0.35) saturate(1.3)'], ['Pop', 'saturate(1.7) contrast(1.1)'], ['Noir', 'grayscale(1) contrast(1.2)'], ['Dream', 'hue-rotate(300deg) saturate(1.2)']];
  static FRAMES = ['Polaroid', 'Film', 'Gold', 'None'];

  // ------------------------------------------------------------ pass and play

  pnp: { turn: number; scores: number[]; seed: number; level: number } | null = null;

  // ------------------------------------------------------------ emoji reactions

  lastSaid = '';
  lastScreenTitle = '';
  wasAligned = false;
  cueZone = false;
  a11yT = 0;
  a11yRec = false;

  reactPick = false;
  friendEmoji = '';

  // ------------------------------------------------------------ chef cards

  // ------------------------------------------------------------ calendar

  // ------------------------------------------------------------ museum

  // ------------------------------------------------------------ profile and prestige

  // ---------------------------------------------------------- leaderboards

  // ---------------------------------------------------- friend challenges

  // ------------------------------------------------------------- settings

  // --------------------------------------------------------------- overlays

}
// The rest of Game's methods live in src/game/ and are mixed in here.
Object.assign(Game.prototype, screensMethods, dinerMethods, clarityMethods, standoutMethods);

