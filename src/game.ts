import { FONT } from './font';
import { Capacitor } from '@capacitor/core';
import { sfx, unlockAudio, setMuted } from './audio';
import { askForReminders, haptic, save, scheduleAt, scheduleReminder, setHaptics } from './platform';
import { TRACKS, babble, setMusic, setMusicIntensity, setTrack, setVoices, type TrackId } from './audio';
import { COMPANIONS, STICKER_SETS, SET_REWARD, ALBUM_REWARD, companionLevel, nekoBlocks, shardsForNext, rollSticker, stickerRarity, AREAS, AREA_MAX, RESTAURANTS, TIP_HOURS, areaCost, popularity, tipRate } from './collect';
import { CITIES, CUP_SIZE, CREW_GOALS, CREW_MATES, HOLIDAY_GOAL, PASS_TIERS, PASS_XP, RACE_GOAL, RACE_POOL, TOUR_GOALS, crewMateOrders, crewWeek, cupReward, cupRivals, cupWeekend, currentHoliday, currentSeason, currentTour, passReward, raceEnd, raceFinishers, seeded, timeLeft, type Reward } from './live';
import { PRODUCTS, buyReal, monetize, nativeAds, showRewardedAd, type ProductId } from './monetize';
import { REACTIONS, codeEmoji, decodeChallenge, decodeGhost, encodeChallenge, encodeGhost, shareCard, shareClip, sharePhoto, type Challenge } from './share';
import { BOARDS, localBoards, online, submitScore } from './services';
import { STORY_LEVELS, PIECES_FOR, Progress, RECIPE_GOAL, STREAK_REWARDS, WEEKLY_GOALS, dayKey, daySeed, missionText, weekKey, type MissionKind, starsNeeded } from './progress';
import { THEMES, drawBackdrop, drawHolidayOverlay, makeSpecks, type Theme } from './themes';
import { settings, saveSettings } from './settings';
import { LANGS, t, t as tr } from './i18n';
import { analyticsSummary, track } from './analytics';
import { cfg, loadConfig } from './config';
import { exportSave, importSave } from './transfer';
import { ClipRecorder, clipsSupported } from './clips';
import { GUEST_SERVES_PER_DAY, STAFF, STYLES, THEMES as REST_THEMES, criticToday, decodeRestaurant, encodeRestaurant, styleText, stylesArray, themeById, themeInSeason, type RestCode, type RestTheme, type StaffId } from './restaurant';
import { drawRestaurantScene, seatPos, type SceneGuest } from './scene';
import type { AreaId } from './collect';
import { DEMOTE, LEAGUES, LEAGUE_SIZE, NEMESIS_AT, NEMESIS_TAUNTS, PROMOTE, QUEST_POT, QUEST_STAGES, currentQuest, leagueRivals, leagueWeek, questSurvivors, settleLeague } from './compete';
import { FLOOR_ICON, MODS, MOD_LIST, RESCUES, TOWER_FLOORS, rescueStars, towerFloors, towerReward, type Mod } from './modes';
import { MINIS, makeMini, type MiniGame, type MiniId } from './minigames';
import { BRANCH_EMOJI, BRANCH_MAX, LAB_KNOWN, LAB_TRIES, SECRETS, WORLDS, branchCost, branchRate, labHint, labMatch, worldFor, worldStarts, type WorldId } from './cuisine';
import { announce, mirrorButtons } from './a11y';
import { endLiveActivity, startLiveActivity, updateWidget } from './widget';
import { LOGO_SHORT, LOGO_TIME, PANEL_TIME, caption, drawLogo, logoSparkles, logoText, panelClosed, panelReopen, panelRival } from './intro';
import { ACHIEVEMENTS, ACH_REWARDS, ACH_TIER_NAMES, AVATAR_LABELS, AVATAR_LOCKS, AVATAR_OPTIONS, CHAPTERS, ENDLESS_CHAPTER, GALLERY_TILES, HEART_LEVELS, HEART_REWARDS, HEART_TITLES, NAMES, PERFECTS_PER_TILE, PICTURES, PICTURE_REWARD, REGULARS, achTier, avatarChef, chapterFor, heartLevel, type Avatar, type Chapter, type Picture, type StatId } from './meta';
import { BOOSTERS, CATALOG, EFFECTS, SETS, TABS, drawFlag, drawPlate, drawShape, type BoosterId, type Cat, type Cosmetic, type Ingredient, type Item, type Shape } from './shop';
import { CHEFS, chefFor, drawChef, drawKnife, type Attack, type Chef, type Help, type Holding, type Mood } from './chef';

// The world is always 400 units wide; height follows the screen's aspect ratio.
// World y grows downward; the plate sits at y = 0 and the stack grows toward negative y.
const WORLD_W = 400;
const LAYER_H = 24;
const BASE_W = 200;
const WIDE_W = 260; // starting width with the Wide Base booster
const PERFECT_TOL = 5; // drops this close to the layer below snap into place
const TIGHT_TOL = 3; // perfect window for chefs with the "precise" rule
const REGROW = 8; // width regained per perfect once a streak reaches 3
const GRAVITY = 1400;
const MAP_ROW = 118; // vertical spacing of chefs on the journey map


/** Colour-blind mode: a symbol for every ingredient, with an ink that reads on its colour. */
const SYMBOLS: Record<Ingredient, [string, string]> = {
  rice: ['○', '#7a6a4a'], nori: ['■', '#cfe3c4'], salmon: ['▲', '#5a1f0a'], tuna: ['◆', '#ffe0e4'],
  avocado: ['♣', '#2c3d0a'], cucumber: ['+', '#0e2a12'], egg: ['●', '#6a4a00'], ebi: ['~', '#5a1f0a'],
  unagi: ['≡', '#ffd9b0'], tofu: ['□', '#6a5a3a'], ikura: ['✱', '#4a0e00'],
  dough: ['○', '#6a4a10'], sauce: ['~', '#ffe0e0'], cheese: ['◦', '#6a4a00'], pepperoni: ['●', '#ffd0c0'], basil: ['♣', '#e0ffe0'],
  bun: ['○', '#4a2a10'], patty: ['■', '#ffd9b0'], lettuce: ['♣', '#1a3a0a'], tomato: ['●', '#ffe0e0'], cheddar: ['▲', '#5a3a00'],
  pancake: ['○', '#5a3a10'], butter: ['□', '#6a5a00'], syrup: ['~', '#ffd9b0'], berry: ['●', '#e0e0ff'], cream: ['◦', '#7a6a5a'],
};

const COLORS: Record<Ingredient, string> = {
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
};

/**
 * Ingredients unlocked further along the journey, each with its own twist:
 * Ebi arrives a little narrower but a PERFECT on it counts double for the combo;
 * Unagi is slippery and slides on a little after you tap; Tofu wobbles as it moves;
 * Ikura pops into bonus coins on a PERFECT.
 */
const NEW_INGREDIENTS: { kind: Ingredient; level: number; name: string; tip: string }[] = [
  { kind: 'ebi', level: 8, name: 'Ebi (shrimp)', tip: 'Arrives a bit narrower, but a PERFECT counts double for your combo!' },
  { kind: 'unagi', level: 15, name: 'Unagi (eel)', tip: 'Slippery! It slides on a little after you tap. Drop it early.' },
  { kind: 'tofu', level: 25, name: 'Tofu', tip: 'Wobbly! Its speed jiggles as it moves. Watch the rhythm.' },
  { kind: 'ikura', level: 35, name: 'Ikura (salmon roe)', tip: 'A PERFECT pops it into bonus coins!' },
];

interface Recipe { name: string; pattern: Ingredient[]; level?: number; world?: WorldId; secret?: boolean }

const RECIPES: Recipe[] = [
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
  // Secret recipes from the Recipe Lab (in the order pool once discovered).
  ...SECRETS.map((sc) => ({ name: sc.name, pattern: ['rice', ...sc.combo.filter((c) => c !== 'rice')] as Ingredient[], secret: true })),
];

/** Emoji for each recipe on the restaurant menu board. */
const DISH_EMOJI: Record<string, string> = {
  'Salmon Maki': '🍣', 'Tamago Tower': '🍳', 'Tuna Classic': '🐟', 'Green Roll': '🥒', 'Rainbow Roll': '🌈',
  'Ebi Tempura Roll': '🍤', 'Unagi Dragon Roll': '🐉', 'Inari Tofu Stack': '🍙', 'Ikura Gunkan': '🔴', 'Deluxe Omakase': '🍱',
  Margherita: '🍕', 'Pepperoni Tower': '🍕', 'Quattro Stack': '🧀', 'Classic Burger': '🍔', 'Double Cheese': '🍔', 'Garden Deluxe': '🥬',
  'Butter Stack': '🥞', 'Berry Cloud': '🫐', 'Grand Brunch': '🥞', ...Object.fromEntries(SECRETS.map((sc) => [sc.name, sc.emoji])),
};
const BASIC_RECIPES = RECIPES.filter((r) => !r.level); // always available (puzzles, missions)

type SpecialLayer = 'golden' | 'ice' | 'wasabi' | 'mystery';

interface Layer {
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

type RunMode = 'journey' | 'special' | 'zen' | 'time' | 'puzzle' | 'challenge' | 'critic' | 'gauntlet' | 'rescue' | 'tower' | 'modchal' | 'pnp';

const FEVER_TIME = 5; // seconds of Fever after every 10 PERFECTs in a row
const TIME_ATTACK = 60; // seconds
const HEIGHT_MILESTONES = [50, 100, 250, 500, 1000];
const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

/** Perks offered after each boss (pick 1 of 3); they last for the rest of the run and stack. */
type PerkId = 'wide' | 'magnet' | 'coins' | 'steady' | 'shield' | 'regrow' | 'fever' | 'chance' | 'tips' | 'stickers';
const PERKS: Record<PerkId, { icon: string; name: string; desc: string }> = {
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
const UNLOCKS: { id: string; level: number; name: string; desc: string }[] = [
  { id: 'shop', level: 2, name: 'Shop', desc: 'Spend coins on boosters, plates, flags, sushi sets and effects' },
  { id: 'gift', level: 2, name: 'Daily Gift & Missions', desc: 'Come back every day, and finish missions to raise your Chef Rank' },
  { id: 'modes', level: 3, name: 'Game Modes', desc: 'Zen, Time Attack, 40 puzzles, the Daily Special and friend challenges' },
  { id: 'map', level: 3, name: 'Chef Journey Map', desc: 'See every chef and replay them for 3 stars' },
  { id: 'events', level: 4, name: 'Events', desc: 'World Tour, holidays, the daily race, the weekend cup and your crew' },
  { id: 'restaurant', level: 5, name: 'Restaurant', desc: 'Spend stars to renovate your own sushi restaurant' },
  { id: 'more', level: 6, name: 'Pass, Companions & Album', desc: 'The Sushi Pass, sous-chef companions, stickers and more' },
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

interface Piece extends Layer { vx: number; vy: number; rot: number; spin: number }

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; shape?: Shape; rot?: number }

interface Popup { x: number; y: number; text: string; life: number; max: number; color: string; size: number }

interface Order { recipe: Recipe; length: number; start: number; reward: number; who?: number; request?: boolean }

// Things the chef throws. Coordinates are world units.
interface Projectile { kind: 'knife' | 'patty'; x: number; y: number; vx: number; vy: number; rot: number; target: Layer | null; dodged: boolean }

interface Splat { x: number; y: number; r: number; life: number; seed: number } // screen units

const ATTACK_INFO: Record<Attack, { label: string; line: string; windup: number }> = {
  flurry: { label: 'KNIFE FLURRY!', line: 'RAAAGH!', windup: 1.1 },
  steal: { label: 'SNEAKY BITE!', line: 'Just a little taste...', windup: 0.9 },
  flip: { label: 'SPEED FLIP!', line: 'Other way! Faster!', windup: 0.8 },
  frost: { label: 'FREEZER BLAST!', line: 'Chill out!', windup: 0.9 },
  knife: { label: 'KNIFE THROW!', line: 'Catch this!', windup: 1.0 },
  slam: { label: 'TABLE SLAM!', line: 'Hmph!', windup: 0.9 },
  splat: { label: 'SOY SPLASH!', line: 'Oops, soy sauce!', windup: 0.7 },
};

const HELP_INFO: Record<Help, { label: string; line: string }> = {
  slow: { label: 'STEADY HANDS!', line: 'Take your time.' },
  patch: { label: 'PATCH UP!', line: 'Let me fix that!' },
  tip: { label: 'TIP!', line: 'For you!' },
};

type Mode = 'title' | 'playing' | 'dead' | 'shop' | 'map' | 'album' | 'modes' | 'events' | 'more' | 'restaurant' | 'pass' | 'pets' | 'boards' | 'avatar' | 'regulars' | 'story' | 'trophies' | 'gallery' | 'settings' | 'visit' | 'museum' | 'profile' | 'calendar' | 'league' | 'quest' | 'rescues' | 'towerview' | 'minis' | 'mini' | 'modchals' | 'lab' | 'jukebox';
type AlbumTab = 'chefs' | 'stickers' | 'recipes' | 'records';

interface Button { x: number; y: number; w: number; h: number; onTap: () => void; label?: string }

interface Insets { top: number; right: number; bottom: number; left: number }

export class Game {
  private ctx: CanvasRenderingContext2D;
  private scale = 1; // CSS pixels per world unit
  private offX = 0; // world units of empty space left of the play area on wide screens
  private viewH = 700; // world units visible vertically
  private dpr = 1;
  private insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

  private mode: Mode = 'title';
  private paused = false;
  private time = 0;

  private stack: Layer[] = [];
  private moving: Layer | null = null;
  private moveDir = 1;
  private pieces: Piece[] = [];
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private flags: { x: number; y: number; hue: number }[] = []; // picks marking each served order
  private specks = makeSpecks(70);
  private themeOrder = THEMES.map((_, i) => i);
  private themeIdx = 0;
  private prevTheme: Theme | null = null; // fading out after a scene change
  private fade = 1;

  private order!: Order;
  private ordersServed = 0;
  private camY = 0;
  private shake = 0;
  private flash = 0;
  private combo = 0;
  private runCoins = 0;
  private best = save.best();
  private bank = save.coins();
  private muted = save.muted();
  private newBest = false;
  private deadAt = 0;

  // Shop and rewards.
  private boosters: Record<string, number> = save.boosters();
  private owned = Object.fromEntries((Object.keys(CATALOG) as Cosmetic[]).map((c) => [c, save.owned(c, CATALOG[c][0].id)])) as Record<Cosmetic, string[]>;
  private equip = Object.fromEntries((Object.keys(CATALOG) as Cosmetic[]).map((c) => [c, save.equipped(c, CATALOG[c][0].id)])) as Record<Cosmetic, string>;
  private baseW = BASE_W;
  // Boosters active this run.
  private doubleCoins = false;
  private slowStart = false;
  private magnet = false;
  private shield = false;
  private lucky = false;
  private shortOrders = false;
  private chanceUsed = false;
  private buttons: Button[] = [];
  private shopFrom: Mode = 'title';
  private shopTab: Cat = 'booster';
  private shopScroll = 0;
  private shopMaxScroll = 0;
  private drag: { x: number; y: number; startScroll: number; moved: boolean } | null = null;
  private shopSel: string | null = null; // cosmetic waiting for a confirming second tap
  private toast: { text: string; life: number } | null = null;

  // Boss chef for the current level. One level = one order.
  private chefX = 60;
  private chefSide = -1; // -1 = left edge, 1 = right edge; the chef walks across now and then
  private sinceSwitch = 0;
  private dish: { recipe: Recipe; t: number; from: { x: number; y: number }; side: number; look: number; ate: boolean; who?: number } | null = null; // served-order animation
  private reaction: { mood: Mood; life: number } | null = null;
  private bubble: { text: string; life: number } | null = null;
  private introIn = 0; // seconds until the next chef is announced
  private event: { kind: Attack | Help; bad: boolean; t: number } | null = null; // chef winding up an attack or a favour
  private sinceEvent = 0; // drops since the chef last did something
  private steady = 0; // drops left at half speed (Steady Hands)
  private projectiles: Projectile[] = [];
  private splats: Splat[] = [];
  private banner: { title: string; sub: string; life: number } | null = null; // "LEVEL 3" when a new boss arrives

  // Long-term progress: journey, missions, collections, records.
  private progress = new Progress(BASIC_RECIPES.map((r) => r.name));
  private startLevel = 1; // the chef this run started on
  private specialWon = false;
  private gated = 0; // stars needed at the gate that ended this run (0 = none)
  private easy = false; // gentler start after several quick losses in a row
  private orderStats = { drops: 0, perfects: 0, slices: 0 };
  private toastQueue: string[] = [];
  private mapScroll = 0;
  private albumScroll = 0;
  private listMax = 0; // max scroll for the map or album, set while drawing
  private albumTab: AlbumTab = 'chefs';

  // Run variety.
  private runMode: RunMode = 'journey';
  private seed = 1; // every run is seeded, so challenge codes can replay the same chefs and events
  private rand: () => number = Math.random;
  private challenge: Challenge | null = null;
  private puzzle = 0;
  private timeLeft = 0; // Time Attack countdown
  private fever = 0; // seconds of Fever left
  private slowmo = 0; // seconds of slow motion left (after PERFECT streaks)
  private freeChance = false; // Second Chance from an 8+ win streak
  private revived = false; // used the continue-after-ad this run
  private doubled = false; // used the double-coins ad this run
  private bankedRunCoins = 0; // coins from this run already added to the bank (a revive can end a run twice)
  private milestonesHit = new Set<number>();
  private resultKind: 'lost' | 'special' | 'gate' | 'zen' | 'time' | 'puzzle-won' | 'puzzle-lost' | 'challenge' | 'rescue-won' | 'rescue-lost' = 'lost';

  // Companions active this run.
  private nekoLeft = 0;
  private tanukiLeft = 0;
  private owlLayers = 0;
  private foxBonus = 0;
  private swanLeft = 0;

  // Overlays and celebrations.
  private celebration: { title: string; sub: string; t: number } | null = null;
  private confetti: { x: number; y: number; vx: number; vy: number; rot: number; color: string; life: number }[] = [];
  private adOverlay: { t: number; label: string; onReward: () => void } | null = null;
  private buyOverlay: ProductId | null = null;
  private shareOverlay: { image: HTMLCanvasElement; code: string; ghost: string } | null = null;
  private setDetail: number | null = null; // sticker set shown full-size in the album
  private pageScroll = 0; // scroll position for the other scrolling screens
  private codeInput: HTMLInputElement | null = null;
  private screenBack: Mode = 'title'; // where BACK goes from the newer screens

  // Depth update: perks, rage, coaching, booster picker.
  private perks: Partial<Record<PerkId, number>> = {};
  private perkChoice: PerkId[] | null = null; // three perks waiting for the player to pick one
  private shieldHits = 0;
  private rage = 0; // boss rage phase this order: 0 none, 1 rage, 2 final fury
  private flurryLeft = 0;
  private flurryT = 0;
  private tip: { title: string; text: string; t: number } | null = null; // coaching card
  private picker: { level: number; mode: RunMode; opts: { puzzle?: number; challenge?: Challenge; rescue?: number; mods?: Mod[] }; picked: Set<BoosterId> } | null = null;
  private picked: Set<BoosterId> | null = null; // boosters chosen for the current run

  // Personality update: story overlay, achievement check timer.
  private story: { ch: Chapter; lines: string[]; end: boolean } | null = null;
  private storyQueue: { ch: Chapter; lines: string[]; end: boolean }[] = [];
  private achT = 0;

  // Platform update: highlight clips, the last clip, save codes.
  private clips: ClipRecorder;
  private clip: File | null = null;
  private saveCode = '';
  private criticStars = 0;
  // Gameplay update: flip and frost attacks, sous-chef bonus rounds, weather, PERFECT tracking.
  private flipT = 0;
  private frost = 0;
  private bonus: { left: number; ok: boolean } | null = null;
  private weather: { kind: 'wind' | 'rain'; dir: number } | null = null;
  private lastPerfect = false;
  private nemesisLevelCached = 0;
  // Modes update: run modifiers, twin layers, rescue levels, the tower, mini-games.
  private mods = new Set<Mod>();
  private twinPhase = 0;
  private twinSep = 0;
  private rescueRun: { i: number; water: number; t: number; tremor: number; margin: number } | null = null;
  private towerStart = 1; // floor the current tower run started on
  private mini: MiniGame | null = null;
  private miniPaid = false;
  private modChal: Mod | null = null;
  private friendGhost: [number, number][] | null = null; // shape of a friend's run from a ghost code
  private confirmBox: { title: string; text: string; ok: string; go: () => void } | null = null;
  // Intro: logo on every launch; the story panels only the first time.
  private intro: { stage: 'logo' | 'story'; t: number; prev: number; panel: number; full: boolean } | null = null;
  private upgradeFx: { i: number; t: number } | null = null; // sparkle on a just-upgraded restaurant area

  constructor(private canvas: HTMLCanvasElement, private safeProbe: HTMLElement) {
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
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat && !this.scrolling) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        this.onTap(rect.left + rect.width / 2, rect.top + rect.height * 0.75);
      }
    });
  }

  /** Every screen except the game itself scrolls (and taps fire on release there). */
  private get scrolling(): boolean {
    return this.mode !== 'playing' && this.mode !== 'dead' && this.mode !== 'title' && this.mode !== 'mini';
  }

  private get scrollPos(): number {
    return this.mode === 'shop' ? this.shopScroll : this.mode === 'map' ? this.mapScroll : this.mode === 'album' ? this.albumScroll : this.pageScroll;
  }

  private set scrollPos(v: number) {
    const max = this.mode === 'shop' ? this.shopMaxScroll : this.listMax;
    v = Math.max(0, Math.min(max, v));
    if (this.mode === 'shop') this.shopScroll = v;
    else if (this.mode === 'map') this.mapScroll = v;
    else if (this.mode === 'album') this.albumScroll = v;
    else this.pageScroll = v;
  }

  pause(): void {
    this.pushWidget();
    // One reminder a day at most, pointing at the next chef to beat.
    const lvl = this.progress.playLevel;
    void scheduleReminder('Sushi Stack', this.giftReady() ? 'Your daily gift is ready! 🎁' : `${chefFor(lvl).name} is waiting for you at level ${lvl}.`);
  }

  private resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
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

  private get height(): number {
    return this.stack.length - 1; // layers placed by the player (the base rice doesn't count)
  }

  private get top(): Layer {
    return this.stack[this.stack.length - 1];
  }

  private get level(): number {
    return this.startLevel + this.ordersServed;
  }

  /** Story chefs for levels 1-50, then a newly generated chef for every level after that. */
  private get chef(): Chef {
    return chefFor(this.level);
  }

  private react(mood: Mood, life: number, line?: string): void {
    this.reaction = { mood, life };
    if (line) this.bubble = { text: line, life: 1.8 };
  }

  /** How worked up the chef is: rises as the order nears completion. */
  private chefMood(): Mood {
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

  private announceChef(): void {
    const c = this.chef;
    if (this.journey && worldStarts(this.level)) this.worldIntro(worldFor(this.level));
    const nem = this.isNemesis();
    if (this.mode === 'playing') announce(`Level ${this.level}. ${c.name}. ${c.rule}. Tap anywhere to drop the layer.`);
    this.banner = this.runMode === 'modchal' && this.modChal ? { title: `${MODS[this.modChal].icon} ${MODS[this.modChal].name.toUpperCase()}`, sub: MODS[this.modChal].desc, life: 2.4 }
      : this.runMode === 'rescue' ? { title: `🆘 ${RESCUES[this.rescueRun!.i].name.toUpperCase()}`, sub: RESCUES[this.rescueRun!.i].story, life: 3 }
      : this.runMode === 'tower' ? { title: `🗼 FLOOR ${this.towerStart + this.ordersServed}`, sub: this.mods.size ? [...this.mods].map((m) => `${MODS[m].icon} ${MODS[m].name}`).join(' · ') : this.weather ? (this.weather.kind === 'wind' ? '🌬️ Wind' : '🌧️ Rain') : 'No twist on this floor', life: 2.2 }
      : { title: this.runMode === 'critic' ? '🧐 FOOD CRITIC' : this.special ? 'DAILY SPECIAL' : nem ? `😈 NEMESIS · LV ${this.level}` : t('level', this.level), sub: this.runMode === 'critic' ? 'Small PERFECT zone · 2★ for a glowing review' : nem ? `Beat you ${this.progress.losses[this.level]} times · stronger now` : c.rule, life: 2.4 };
    this.bubble = { text: nem ? NEMESIS_TAUNTS[this.level % NEMESIS_TAUNTS.length] : c.intro, life: 2.2 };
    this.reaction = null;
    this.sinceEvent = 0; // give the player a few drops before the new boss acts
    this.switchSides();
  }

  /** Recipes this level can order: its world's menu, plus discovered secret recipes in sushi worlds. */
  private recipePool(level: number): Recipe[] {
    const world = worldFor(level);
    const found = this.progress.secrets;
    const pool = RECIPES.filter((r) => (r.world ?? 'sushi') === world && (r.secret ? found.includes(r.name) : (r.level ?? 0) <= level || world !== 'sushi'));
    return pool.length ? pool : BASIC_RECIPES;
  }

  /** Ingredient colour, recoloured by the equipped sushi set. */
  private color(kind: Ingredient): string {
    return SETS.find((x) => x.id === this.equip.set)?.colors[kind] ?? COLORS[kind];
  }

  private get theme(): Theme {
    const i = this.themeOrder[this.themeIdx];
    return i < 0 ? this.cityTheme() : THEMES[i];
  }

  private cityCache: Theme | null = null;

  /** The current World Tour city as a background (index -1 in the theme rotation). */
  private cityTheme(): Theme {
    const { city } = currentTour();
    if (this.cityCache?.id !== city.id) {
      this.cityCache = { id: city.id, name: `World Tour: ${city.name}`, sky: city.sky, counter: '#3a2a2a', counterEdge: city.accent, decor: 'skyline', city: { accent: city.accent, building: city.building, landmark: city.landmark } };
    }
    return this.cityCache;
  }

  private reset(): void {
    const x = (WORLD_W - this.baseW) / 2;
    // The base layer matches the world: rice for sushi, dough, bun or a pancake elsewhere.
    const base = ({ sushi: 'rice', pizza: 'dough', burger: 'bun', pancake: 'pancake' } as const)[worldFor(this.startLevel)];
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
  private specialLevel(): number {
    return 5 + (daySeed() % 15);
  }

  /** Retry from the chef that beat you (or today's special). */
  private retry(): void {
    if (this.gated) this.openMap();
    else if (this.runMode === 'zen' || this.runMode === 'time') this.startRun(this.progress.playLevel, this.runMode);
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
  private get special(): boolean {
    return this.runMode === 'special' || this.runMode === 'critic' || this.runMode === 'modchal';
  }

  /** Runs that use journey progress: they unlock chefs, earn stars and respect star gates. */
  private get journey(): boolean {
    return this.runMode === 'journey';
  }

  /** Zen, Time Attack and Puzzles have no chef attacks or help. */
  private get calmChefs(): boolean {
    return this.runMode === 'zen' || this.runMode === 'time' || this.runMode === 'puzzle' || this.runMode === 'rescue';
  }

  /**
   * Starts a run. Journey runs start at a chef level (by default the furthest one open); other modes
   * pick their own setup. Every run is seeded so a challenge code can replay it.
   */
  private startRun(level = this.progress.playLevel, mode: RunMode = 'journey', opts: { puzzle?: number; challenge?: Challenge; picked?: Set<BoosterId>; rescue?: number; mods?: Mod[] } = {}): void {
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
    this.seed = this.challenge ? this.challenge.seed : Math.floor(Math.random() * 2 ** 31);
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
    this.baseW = (levelW + (use('wide') ? WIDE_W - BASE_W : 0)) * (this.mods.has('tiny') ? 0.6 : 1);
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

  private changeTheme(apply: () => void): void {
    this.prevTheme = this.theme;
    apply();
    if (this.prevTheme === this.theme) this.prevTheme = null;
    this.fade = 0;
  }

  private addCoins(n: number, x: number, y: number, label: string): void {
    if (this.doubleCoins) n *= 2;
    if (this.fever > 0) n *= 3;
    if (this.runMode === 'zen') n *= 0.3;
    n *= cfg.coinBoost;
    // Chef Rank, the Kitsune companion and finished restaurants all add percentage bonuses.
    const restaurants = this.progress.restaurant.r + this.progress.restaurant.michelin;
    n = Math.max(1, Math.round(n * (this.progress.coinBonus + this.foxBonus + restaurants * 0.05)));
    this.runCoins += n;
    this.popup(x, y, `${label} +${n} coins`, '#ffd34d', 16);
    this.mission('coinsRun', this.runCoins);
  }

  /** Coins that go straight to the bank (mission rewards, chests, gifts), saved immediately. */
  private bankCoins(n: number): void {
    if (n > 0) this.progress.stat('coins', n);
    this.bank += n;
    save.setCoins(this.bank);
  }

  private mission(kind: MissionKind, amount = 1, recipe?: string): void {
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
  private openChest(level: number): void {
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

  private unlockExclusive(cat: Cosmetic, id: string, name: string): void {
    if (this.owned[cat].includes(id)) return;
    this.owned[cat].push(id);
    save.setOwned(cat, this.owned[cat]);
    this.showToast(`EXCLUSIVE UNLOCKED: ${name}!`);
    haptic.success();
  }

  private newOrder(): void {
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
    this.order = { recipe, length: Math.max(3, length), start: this.height, reward: 0, who, request };
  }

  private nextIngredient(): Ingredient {
    const { pattern } = this.order.recipe;
    return pattern[(this.height - this.order.start) % pattern.length];
  }

  private speed(): number {
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
    if (this.isNemesis()) v *= 1 + 0.05 * this.nemesisPower();
    if (this.flipT > 0) v *= 1.4;
    if (this.mods.has('double')) v *= 1.6;
    if (this.weather?.kind === 'wind') v *= 1 + 0.28 * this.moveDir * this.weather.dir; // faster with the wind, slower against it
    if (this.fever > 0) v *= 0.5;
    if (this.steady > 0) v *= 0.55;
    if (this.easy && this.height < 10) v *= 0.8;
    return this.slowStart && this.height < 15 ? v * 0.7 : v;
  }

  private spawnMoving(): void {
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
  private specialLabel(k: SpecialLayer): string {
    if (k === 'golden') {
      const h = currentHoliday()?.holiday.id;
      const name = h === 'halloween' ? 'PUMPKIN' : h === 'lunar' ? 'RED ENVELOPE' : h === 'winter' ? 'GIFT' : h === 'hanami' ? 'BLOSSOM' : h === 'summer' ? 'FIREWORK' : 'GOLDEN';
      return `${name} · PERFECT = x3 coins`;
    }
    return { ice: 'ICE · slides fast', wasabi: 'WASABI · miss = burn', mystery: 'MYSTERY · PERFECT = booster' }[k];
  }

  private targetCam(): number {
    // Keep the top of the stack a little above the middle of the screen, but never lift the plate off the bottom too early.
    return Math.min(this.top.y - this.viewH * 0.48, -this.viewH * 0.78);
  }

  // ------------------------------------------------------------------- input

  private onTap(clientX: number, clientY: number): void {
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

  private drop(): void {
    const m = this.moving;
    if (!m || this.perkChoice) return;
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

    const tol = ((this.chef.tight || this.runMode === 'critic') && this.runMode !== 'puzzle' ? TIGHT_TOL : PERFECT_TOL) + (this.magnet ? 4 : 0) + (this.fever > 0 ? 8 : 0) + (this.perks.magnet ?? 0) * 2 + (settings.assist ? 3 : 0);
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
      this.place(m);
      const cx = m.x + m.w / 2;
      this.popup(cx, m.y - 18, this.combo > 1 ? `PERFECT x${this.combo}` : 'PERFECT', '#fff3b0', 18);
      announce(this.combo > 1 ? `Perfect, ${this.combo} in a row` : 'Perfect');
      if (this.combo % 5 === 0) {
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
      haptic.medium();
      this.flash = 0.25;
      this.shake = 3;
    } else {
      this.lastPerfect = false;
      const overlap = top.w - Math.abs(dx);
      if (overlap <= 0) {
        this.fall(m, dx > 0 ? 1 : -1);
        if (this.runMode === 'zen') {
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
      this.place(m);
      if (this.mode === 'playing' && !this.reaction) this.react('wince', 0.5);
      sfx.slice();
      haptic.light();
    }
  }

  private place(layer: Layer): void {
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
    const mk = this.progress.mastery;
    mk[layer.kind] = (mk[layer.kind] ?? 0) + 1;
    if (mk[layer.kind] === MASTERY) {
      this.celebrate(`✨ ${layer.kind.toUpperCase()} MASTERED!`, 'Gold layers from now on, and +1 coin per PERFECT with it');
      this.progress.persist();
    }
    if (this.bonus) this.bonusDrop(layer);
    this.mission('height', this.height);
    this.order.reward += layer.w / BASE_W;
    sfx.drop();
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
  private bonusDrop(layer: Layer): void {
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

  private startFever(): void {
    this.fever = FEVER_TIME;
    this.celebrate('FEVER!', 'Slow layers · easy PERFECTs · 3x coins', 1.4);
    sfx.fever();
    haptic.success();
  }

  /** Full-screen celebration: a title, a line of detail and a burst of confetti. */
  private celebrate(title: string, sub: string, time = 2): void {
    this.celebration = { title, sub, t: time };
    sfx.celebrate();
    if (settings.reducedMotion) return;
    const colors = ['#ff8a5b', '#ffd34d', '#8fdc93', '#9fe3ff', '#ff5d8f', '#e0aaff'];
    for (let i = 0; i < 70; i++) {
      this.confetti.push({ x: Math.random() * WORLD_W, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 160, rot: Math.random() * 6, color: colors[i % colors.length], life: 3 });
    }
  }

  /** Sushi Pass XP. Resets each season. */
  private addXp(n: number): void {
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
  private earnTokens(n: number): void {
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
  private ensureAlbum(): void {
    const a = this.progress.album;
    const { n: season } = currentSeason();
    if (a.season !== season) Object.assign(a, { season, have: STICKER_SETS.map((s2) => s2.stickers.map(() => 0)), setsDone: [], done: false });
  }

  private openPacks(n: number): void {
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

  private crewOrder(): void {
    const p = this.progress;
    const w = crewWeek();
    if (p.crew.key !== w.key) p.crew = { key: w.key, mine: 0, claimed: [] };
    p.crew.mine++;
  }

  /** Daily Sushi Sprint: beat RACE_GOAL chefs in one run; the earlier you finish, the bigger your share. */
  private checkRace(): void {
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

  private finishRun(kind: typeof this.resultKind, line: string): void {
    this.resultKind = kind;
    this.mode = 'dead';
    this.deadAt = this.time;
    this.moving = null;
    this.event = null;
    this.projectiles = [];
    this.bubble = { text: line, life: 99 };
    this.endRun();
  }

  private puzzleWon(): void {
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
  private endZen(): void {
    this.specialWon = true;
    this.finishRun('zen', 'So relaxing...');
  }

  private timeUp(): void {
    this.specialWon = true;
    this.addCoins(this.height, WORLD_W / 2, this.top.y - 60, 'Time Attack');
    this.finishRun('time', 'Time is up!');
  }

  /** Continue after a game over (rewarded ad, or free for VIP): carry on from the same stack. */
  private revive(): void {
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
  private watchAd(label: string, reward: () => void): void {
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
  private buy(id: ProductId): void {
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

  private grant(id: ProductId): void {
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
  private giveReward(r: Reward): void {
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
  private addShards(n: number): void {
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
  private maybeChefEvent(): void {
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

  private startEvent(kind: Attack | Help, bad: boolean, windup: number, line: string): void {
    this.event = { kind, bad, t: windup };
    this.sinceEvent = 0;
    this.reaction = null;
    this.bubble = { text: line, life: windup + 0.8 };
    if (bad) haptic.light();
  }

  // The chef fills the space between the top bar and the top of the stack, which the camera keeps
  // at 48% of the screen height, so they never sit over the blocks.
  private bossScale(): number {
    return Math.max(1.1, Math.min(1.9, (this.viewH * 0.48 - 110 - this.insets.top) / 136));
  }

  private bossY(): number {
    return this.viewH * 0.48 - 70 - 70 * this.bossScale();
  }

  private chefHome(side: number): number {
    const edge = 34 * this.bossScale();
    return side < 0 ? edge : WORLD_W - edge;
  }

  /** The order card sits on the side away from the chef and slides over as they cross. */
  private cardX(): number {
    const left = this.chefHome(-1);
    const right = this.chefHome(1);
    const t = Math.max(0, Math.min(1, (this.chefX - left) / (right - left)));
    const w = 236;
    return (WORLD_W - 12 - w) * (1 - t) + 12 * t;
  }

  private switchSides(): void {
    this.chefSide = -this.chefSide;
    this.sinceSwitch = 0;
  }

  private runEvent(kind: Attack | Help): void {
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

  private updateProjectiles(dt: number): void {
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

  private serve(): void {
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
  private updateRage(real: number): void {
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

  private choosePerk(id: PerkId): void {
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
  private coach(title: string, text: string, t = 3.5): void {
    this.tip = { title, text, t };
  }

  private fall(layer: Layer, side: number): void {
    this.pieces.push({ ...layer, vx: side * (60 + Math.random() * 60), vy: -60, rot: 0, spin: side * (2 + Math.random() * 3) });
  }

  private die(): void {
    this.resultKind = this.runMode === 'puzzle' ? 'puzzle-lost' : this.runMode === 'time' ? 'time' : this.runMode === 'challenge' ? 'challenge' : this.runMode === 'rescue' ? 'rescue-lost' : 'lost';
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
  private endRun(): void {
    const p = this.progress;
    // Only bank what hasn't been banked yet (a continue can end the same run twice).
    const fresh = this.runCoins - this.bankedRunCoins;
    this.bankedRunCoins = this.runCoins;
    p.stat('coins', fresh);
    this.bank += fresh;
    save.setCoins(this.bank);
    // A slice of every run's coins also drops into the piggy bank, up to 2,500.
    p.piggy = Math.min(2500, p.piggy + Math.floor(fresh * 0.15));
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

  private gateStop(): void {
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
  private winSpecial(): void {
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

  private sparkle(x: number, y: number, w: number, n: number): void {
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

  private popup(x: number, y: number, text: string, color: string, size: number, life = 1.1): void {
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

  private muteButton() {
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

    this.buttons = [];
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
      this.drawTopBar();
      this.drawOverlays();
      this.drawToast();
      return;
    }

    // The boss looms behind the counter, so the stack is drawn over them.
    if (this.mode === 'playing') this.drawBossBody(this.chefX, this.bossY(), this.bossScale());

    ctx.save();
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
    for (const l of this.stack) if (l.y > minY && l.y < maxY) this.drawLayer(l);
    for (const f of this.flags) if (f.y > minY - 40 && f.y < maxY + 40) drawFlag(ctx, this.equip.flag, f.x, f.y, f.hue);
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
      if (mirror) ctx.restore();
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
    for (const pp of this.popups) {
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
  private drawWeather(): void {
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

  private drawCounter(): void {
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

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
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

  private drawLayer(l: Layer): void {
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



  private text(str: string, x: number, y: number, size: number, color = '#fff', weight = 800, align: CanvasTextAlign = 'center'): void {
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

  private qaTexts: { str: string; x0: number; y0: number; x1: number; y1: number }[] | null = null;
  private qaClip: [number, number] | null = null; // vertical clip of the scrolling list being drawn
  private qaSkip = false; // floating score popups move and fade, so they aren't checked

  /** A full-screen overlay hides everything drawn before it. */
  private qaCover(): void {
    if (this.qaTexts) this.qaTexts.length = 0;
  }

  private qaRecord(str: string, x: number, y: number, size: number, align: CanvasTextAlign): void {
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

  private holding(): Holding {
    const e = this.event;
    if (!e) return null;
    return e.kind === 'knife' || e.kind === 'flurry' || e.kind === 'steal' ? 'knife' : e.kind === 'slam' || e.kind === 'flip' ? 'fist' : e.kind === 'patch' ? 'patty' : null;
  }

  private drawBossBody(x: number, y: number, s: number): void {
    // Watch and point at the sliding layer; on the results screen, at the player.
    const m = this.moving;
    const lookX = m && this.mode === 'playing' ? m.x + m.w / 2 : x;
    const lookY = m && this.mode === 'playing' ? m.y + LAYER_H / 2 - this.camY : y + 300;
    drawChef(this.ctx, this.chefLook(this.chef, this.level), x, y, s, this.chefMood(), lookX, lookY, this.time, this.mode === 'playing' ? this.holding() : null);
  }

  private drawBossLabels(x: number, y: number, s: number): void {
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
  private drawDish(x: number, y: number, s: number, rot: number, recipe: Recipe): void {
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

  private drawCustomer(x: number, y: number, look: number, ate: boolean, lookX: number, lookY: number): void {
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
  private drawServe(): void {
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

  private drawSplat(sp: Splat): void {
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

  private drawOrderCard(y: number): void {
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

  private drawTopBar(): void {
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
  private button(x: number, y: number, w: number, h: number, label: string, onTap: () => void, style: 'primary' | 'gold' | 'quiet' = 'primary'): void {
    this.drawButton(x, y, w, h, label, style, h >= 40 ? 15 : 12.5);
    this.buttons.push({ x, y, w, h, onTap, label });
  }

  /** Rounded "candy" button: gradient face, darker base for depth, soft top shine, and a press dip. */
  private drawButton(x: number, y: number, w: number, h: number, label: string, style: 'primary' | 'gold' | 'quiet', size: number): void {
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

  private pressed: { x: number; y: number; t: number } | null = null;

  private openShop(): void {
    this.shopFrom = this.mode;
    this.shopSel = null;
    this.mode = 'shop';
    sfx.drop();
  }

  private showToast(text: string): void {
    if (this.toast) this.toastQueue.push(text);
    else this.toast = { text, life: 2.2 };
  }

  private drawToast(): void {
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

  private static day(offset = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  private giftReady(): boolean {
    return save.giftDay() !== Game.day();
  }

  private claimGift(): void {
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
  private nextGoal() {
    const all = (Object.keys(CATALOG) as Cosmetic[]).flatMap((c) => CATALOG[c].filter((i) => !i.earn && !this.owned[c].includes(i.id)));
    return all.sort((a, b) => a.price - b.price)[0];
  }

  // ------------------------------------------------------------------ screens

  private drawHud(): void {
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
    if (this.mode === 'playing' && this.runMode === 'zen') {
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

  private resultTitle(): string {
    switch (this.resultKind) {
      case 'gate': return 'STAR GATE!';
      case 'special': return this.runMode === 'tower' ? '🗼 TOWER CONQUERED!' : this.runMode === 'modchal' ? `${MODS[this.modChal ?? 'mirror'].icon} CHALLENGE CLEARED!` : this.runMode === 'critic' ? (this.criticStars >= 2 ? 'GLOWING REVIEW!' : 'REVIEW: MEH') : 'SPECIAL CLEARED!';
      case 'zen': return 'ZEN COMPLETE';
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

  private resultSub(): string {
    const layers = `${this.height} layer${this.height === 1 ? '' : 's'}`;
    switch (this.resultKind) {
      case 'rescue-won': case 'rescue-lost': {
        const rs = RESCUES[this.rescueRun?.i ?? 0];
        return `${rs.name} · ${this.height}/${rs.target} layers · ${'★'.repeat(this.progress.rescueStars[this.rescueRun?.i ?? 0] || 0)}`;
      }
      case 'zen': return `${layers} · Zen best ${this.progress.zenBest}`;
      case 'lost': if (this.runMode === 'gauntlet') return `Gauntlet best ${this.progress.gauntletBest} chefs · ${layers}`; return `Level ${this.level} · ${layers} · Best ${this.best}`;
      case 'time': return `${layers} in 60s · best ${this.progress.timeBest}`;
      case 'puzzle-won': case 'puzzle-lost': {
        const cfg = puzzleConfig(this.puzzle);
        return `${layers}/${cfg.layers} · ${this.orderStats.slices}/${cfg.maxSlices} slices · ${'★'.repeat(this.progress.puzzleStars[this.puzzle] || 0)}`;
      }
      case 'challenge': return `You ${this.height} · friend ${this.challenge?.score ?? 0}`;
      case 'special': return this.runMode === 'critic' ? `Food Critic · ${'★'.repeat(this.criticStars)}${'☆'.repeat(3 - this.criticStars)} · ${layers}` : `Daily Special · ${layers}`;
      default: return `Level ${this.level} · ${layers} · Best ${this.best}`;
    }
  }

  private drawResults(): void {
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
    if (this.resultKind === 'lost' && !this.newBest && gap > 0 && gap <= 3) this.text(`So close! Only ${gap} more for a new best`, cx, cardTop + 130, 14, '#ffb4a2', 700);
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
      row1.push([tr('share'), () => { this.reactPick = true; }, 'quiet']);
      // Photo mode: a small camera button in the card's corner.
      this.button(WORLD_W - 76, cardTop + 12, 44, 36, '📷', () => this.openPhoto(), 'quiet');
      this.buttons[this.buttons.length - 1].label = 'Photo mode';
      if (this.clip) row1.push(['🎬 CLIP', () => { track('clip_share'); void shareClip(this.clip!, this.height); }, 'quiet']);
      const w1 = (WORLD_W - 72 - (row1.length - 1) * 8) / row1.length;
      row1.forEach(([label, go, style], i) => this.button(36 + i * (w1 + 8), cardTop + 232, w1, 44, label, go, style));
      const second = this.journey || this.resultKind === 'gate' ? [tr('map'), () => this.openMap()] as const : [tr('modes'), () => this.openScreen('modes')] as const;
      // Left-handed: RETRY moves under the left thumb.
      const lh = settings.leftHanded;
      this.button(lh ? 268 : 36, cardTop + 290, 96, 46, tr('home'), () => { this.mode = 'title'; this.reset(); }, 'quiet');
      this.button(lh ? 152 : 140, cardTop + 290, 108, 46, second[0], second[1], 'quiet');
      this.button(lh ? 36 : 256, cardTop + 290, 108, 46, this.resultKind === 'puzzle-won' ? tr('next') : this.resultKind === 'gate' ? 'GET STARS' : tr('retry'), () => this.retry());
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------- home

  private drawHome(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const top = this.insets.top;
    const p = this.progress;
    if (this.best > 0) this.text(`BEST ${this.best}`, cx, top + 30, 15, 'rgba(255,255,255,0.75)', 700);
    logoText(ctx, 'SUSHI', cx, top + 80, 44, '#ffffff', '#ffe2c6');
    logoText(ctx, 'STACK', cx, top + 122, 44, '#ffb37a', '#ff5d3a');

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
    // Gift (with Maki the cat) and modes. Locked features show the level that opens them.
    const ready = this.giftReady();
    if (this.lockedAt('gift')) this.lockedButton(30, top + 250, 165, 42, 'gift', t('gift'));
    else {
      this.button(30, top + 250, 165, 42, '', () => this.claimGift(), ready ? 'gold' : 'quiet');
      this.buttons[this.buttons.length - 1].label = ready ? t('gift') : t('giftTomorrow');
      this.fitText(ready ? t('gift') : t('giftTomorrow'), 30 + 165 / 2 + 14, top + 272, 165 - 64, 15, ready ? '#4a2a00' : '#ffffff', 'center', 700);
      this.text(ready ? '😺' : '😸', 52, top + 271 + (ready ? Math.sin(this.time * 6) * 3 : 0), 22, '#fff', 400);
    }
    if (this.lockedAt('modes')) {
      this.lockedButton(205, top + 250, 165, 42, 'modes', t('modes'));
      this.lockedButton(30, top + 300, 340, 40, 'modes', t('dailySpecial'));
    } else {
      this.button(205, top + 250, 165, 42, t('modes'), () => this.openScreen('modes'));
      const specialDone = p.specialDay === dayKey();
      this.button(30, top + 300, 340, 40, specialDone ? t('specialDone') : t('special'), () => this.startRun(this.specialLevel(), 'special'), specialDone ? 'quiet' : 'gold');
    }
    if (this.lockedAt('gift')) this.drawHowTo(top + 350);
    else this.drawMissions(top + 350);

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
    const moreBadge = this.passClaimable() > 0 || this.achClaimable() > 0 || this.calendarReady();
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
    });
  }

  /** Home-screen card for the restaurant: name, popularity and a reason to visit right now. */
  private drawRestaurantCard(x: number, y: number, w: number, h: number): void {
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
  private lockedAt(id: string): number {
    const u = UNLOCKS.find((x) => x.id === id);
    return u && this.progress.unlocked < u.level ? u.level : 0;
  }

  private lockedToast(id: string): void {
    const u = UNLOCKS.find((x) => x.id === id)!;
    this.showToast(`🔒 ${u.name} opens at level ${u.level}`);
    haptic.light();
  }

  private lockedButton(x: number, y: number, w: number, h: number, id: string, label: string): void {
    const u = UNLOCKS.find((v) => v.id === id)!;
    this.drawButton(x, y, w, h, `🔒 ${label} · LV ${u.level}`, 'quiet', 13);
    this.buttons.push({ x, y, w, h, onTap: () => this.lockedToast(id) });
  }

  /** Celebrates each feature the first time it opens. Long-time players get them all quietly. */
  private announceUnlocks(): void {
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
  private drawHowTo(y: number): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(20,10,25,0.93)';
    this.roundRect(24, y, WORLD_W - 48, 134, 16);
    ctx.fill();
    this.text(t('howTo'), WORLD_W / 2, y + 20, 13, '#ffd34d', 700);
    const lines: [string, string][] = [
      ['👆', t('how1')],
      ['✂️', t('how2')],
      ['👨‍🍳', t('how3')],
    ];
    lines.forEach(([icon, line], i) => {
      this.text(icon, 50, y + 50 + i * 28, 17, '#fff', 400);
      this.fitText(line, 70, y + 50 + i * 28, WORLD_W - 112, 12.5, '#fff', 'left');
    });
  }

  /** Mission card: Chef Rank and the three current missions with progress bars. */
  private drawMissions(y: number): void {
    const { ctx } = this;
    const p = this.progress;
    ctx.fillStyle = 'rgba(20,10,25,0.93)';
    this.roundRect(24, y, WORLD_W - 48, 134, 16);
    ctx.fill();
    this.text(`CHEF RANK ${p.rank}`, 40, y + 18, 13, '#ffd34d', 900, 'left');
    this.text(`+${Math.round((p.coinBonus - 1) * 100)}% coins · finish all 3 to rank up`, WORLD_W - 40, y + 18, 11, 'rgba(255,255,255,0.7)', 600, 'right');
    p.missions.forEach((m, i) => {
      const my = y + 42 + i * 30;
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
    this.text(nextGoal ? `Weekly challenge: best ${w.best} · reach ${nextGoal.height} for +${nextGoal.reward}` : `Weekly challenge complete! Best ${w.best}`, WORLD_W / 2, y + 126, 11, '#9fe3ff', 700);
  }

  /** Ghost of the best run: faint outlines of its layers around the current height. */
  private drawGhost(minY: number, maxY: number): void {
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
  private drawMarker(height: number, label: string, color: string, minY: number, maxY: number): void {
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

  private openMap(): void {
    this.shopFrom = this.mode === 'map' ? this.shopFrom : this.mode;
    this.mode = 'map';
    // Start scrolled to the next chef to beat.
    this.listMax = 1e6;
    this.mapScroll = Math.max(0, (this.progress.unlocked - 1) * MAP_ROW - this.viewH * 0.3);
  }

  private drawMap(): void {
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
  private drawPortrait(c: Chef, x: number, y: number, r: number, open: boolean, mood: Mood): void {
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

  private openAlbum(): void {
    this.shopFrom = this.mode;
    this.mode = 'album';
    this.albumScroll = 0;
  }

  private drawAlbum(): void {
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

  private dealsHeight(): number {
    return 6 * 108 + 40;
  }

  /** Shop DEALS tab: starter pack, VIP, piggy bank, premium pass, streak freezes and free chests. */
  private drawDeals(y: number, frame: { areaTop: number; areaH: number }): void {
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
  private wrapLeft(str: string, x: number, y: number, maxW: number, size: number, color: string): void {
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

  private openTab(cat: Cat): void {
    this.shopTab = cat;
    this.shopScroll = 0;
    this.shopSel = null;
  }

  private drawShop(): void {
    const { ctx } = this;
    const top = this.insets.top;
    const cx = WORLD_W / 2;
    ctx.fillStyle = 'rgba(20,10,25,0.6)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.text('SHOP', cx, top + 31, 24, '#fff', 900);

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

  private drawBoosterCard(b: (typeof BOOSTERS)[number], x: number, y: number, w: number, h: number): void {
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

  private drawCosmeticCard(cat: Cosmetic, item: Item, x: number, y: number, w: number, h: number): void {
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

  private spend(price: number): boolean {
    if (this.bank < price) {
      this.showToast(`You need ${price - this.bank} more coins`);
      haptic.error();
      return false;
    }
    this.bank -= price;
    save.setCoins(this.bank);
    return true;
  }

  private buyBooster(id: BoosterId): void {
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
  private tapCosmetic(cat: Cosmetic, item: Item): void {
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

  private openScreen(mode: Mode, back: Mode = 'title'): void {
    this.screenBack = back;
    this.mode = mode;
    this.pageScroll = 0;
    this.listMax = 0;
  }

  /** Dims the scene, draws the screen title, and clips the scrolling area. Pair with screenEnd(). */
  private screenBegin(title: string, sub?: string): { areaTop: number; areaH: number; backY: number; y0: number } {
    const { ctx } = this;
    const top = this.insets.top;
    ctx.fillStyle = 'rgba(20,10,25,0.68)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    // Kept clear of the sound button on the left and the coin counter on the right.
    this.fitText(title, WORLD_W / 2, top + 31, WORLD_W - 170, 22, '#fff', 'center', 700);
    if (title !== this.lastScreenTitle) {
      this.lastScreenTitle = title;
      announce(`${title} screen${sub ? `. ${sub}` : ''}`);
    }
    if (sub) this.fitText(sub, WORLD_W / 2, top + 56, WORLD_W - 24, 12, '#ffd34d', 'center', 700);
    const backY = this.viewH - this.insets.bottom - 60;
    const areaTop = top + (sub ? 72 : 60);
    const areaH = backY - 10 - areaTop;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-this.offX, areaTop, WORLD_W + this.offX * 2, areaH);
    ctx.clip();
    this.qaClip = [areaTop, areaTop + areaH];
    return { areaTop, areaH, backY, y0: areaTop - this.pageScroll };
  }

  private screenEnd(frame: { areaTop: number; areaH: number; backY: number }, contentH: number): void {
    this.ctx.restore();
    this.qaClip = null;
    this.listMax = Math.max(0, contentH - frame.areaH + 10);
    this.pageScroll = Math.min(this.pageScroll, this.listMax);
    this.button(16, frame.backY, WORLD_W - 32, 46, t('back'), () => { this.mode = this.screenBack; }, 'quiet');
  }

  /** A tappable area inside a scrolling list: only the visible part responds. */
  private listTap(x: number, y: number, w: number, h: number, frame: { areaTop: number; areaH: number }, onTap: () => void): void {
    const hy = Math.max(y, frame.areaTop);
    const hh = Math.min(y + h, frame.areaTop + frame.areaH) - hy;
    if (hh > 0) this.buttons.push({ x, y: hy, w, h: hh, onTap });
  }

  /** Panel with a soft drop shadow and a faint inner edge. */
  private card(x: number, y: number, w: number, h: number, fill = 'rgba(48,30,52,0.95)'): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    this.roundRect(x, y + 3, w, h, 14);
    ctx.fill();
    ctx.fillStyle = fill;
    this.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /** Filled circle, for small UI dots and badges. */
  private dot(x: number, y: number, r: number, color: string): void {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /** A small pill button inside a list. */
  private pill(x: number, y: number, w: number, label: string, frame: { areaTop: number; areaH: number }, onTap: () => void, style: 'primary' | 'gold' | 'quiet' = 'primary'): void {
    this.drawButton(x, y, w, 32, label, style, 12);
    this.listTap(x, y, w, 32, frame, onTap);
    const last = this.buttons[this.buttons.length - 1];
    if (last && last.onTap === onTap) last.label = label;
  }

  private bar(x: number, y: number, w: number, frac: number, color = '#ff8a5b', h = 7): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = color;
    this.roundRect(x, y, w * Math.max(0, Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }

  // ------------------------------------------------------------------ modes

  private drawModes(): void {
    const f = this.screenBegin('GAME MODES');
    const p = this.progress;
    let y = f.y0 + 4;
    const modes: [string, string, string, () => void][] = [
      ['🍣 Chef Journey', `Continue at level ${p.playLevel} · ${chefFor(p.playLevel).name}`, 'PLAY', () => this.startRun()],
      ['🧘 Zen', `No game over, no attacks, calm music · best ${p.zenBest}`, 'RELAX', () => this.startRun(p.playLevel, 'zen')],
      ['⏱ Time Attack', `Stack as high as you can in 60 seconds · best ${p.timeBest}`, 'GO', () => this.startRun(p.playLevel, 'time')],
      ...(this.nemesisLevel() ? [['😈 Nemesis rematch', `${chefFor(this.nemesisLevel()).name} beat you ${p.losses[this.nemesisLevel()]} times · reward ${this.nemesisReward()} coins`, 'REMATCH', () => this.startRun(this.nemesisLevel())] as [string, string, string, () => void]] : []),
      ['🆘 Rescue', `Save grandma’s stall · ${this.progress.rescueStars.filter((x) => x > 0).length}/${RESCUES.length} saved`, 'OPEN', () => this.openScreen('rescues', 'modes')],
      ['🗼 Omakase Tower', `${TOWER_FLOORS} weekly floors · checkpoint ${this.towerState().cp}`, 'CLIMB', () => this.openScreen('towerview', 'modes')],
      ['🎭 Modifiers', 'Mirror, blind, tiny, double speed, twins', 'OPEN', () => this.openScreen('modchals', 'modes')],
      ['🎮 Mini-games', 'Knife Throw, Rice Rhythm, Fish Catch', 'OPEN', () => this.openScreen('minis', 'modes')],
      ['👥 Pass & Play', 'Two players, one phone, the same run', 'PLAY', () => this.startPnp(1)],
      ['⚔️ Gauntlet', `Boss after boss, no breaks, no perks · best ${p.gauntletBest} chefs`, 'FIGHT', () => this.startRun(Math.max(5, p.playLevel), 'gauntlet')],
      ['🍱 Daily Special', p.specialDay === dayKey() ? 'Cleared today, practice anytime' : 'One special order, +150 coins today', 'PLAY', () => this.startRun(this.specialLevel(), 'special')],
      ['🤝 Friend Challenge', 'Enter a friend’s code and beat their score', 'ENTER CODE', () => this.openCodeInput()],
    ];
    for (const [name, desc, label, go] of modes) {
      this.card(16, y, WORLD_W - 32, 70);
      this.text(name, 32, y + 24, 16, '#fff', 900, 'left');
      this.text(desc, 32, y + 48, 11, 'rgba(255,255,255,0.75)', 600, 'left');
      this.pill(WORLD_W - 128, y + 19, 98, label, f, go, 'gold');
      const lb = this.buttons[this.buttons.length - 1];
      if (lb && lb.onTap === go) lb.label = `${name}: ${label}`;
      y += 80;
    }
    // Puzzles: fixed layers, a slice budget, three stars each.
    const solved = p.puzzleStars.filter((x) => x > 0).length;
    const total = p.puzzleStars.reduce((a, b) => a + (b || 0), 0);
    this.text(`🧩 PUZZLES · ${total}/${PUZZLES * 3}★ · stack the layers without slicing too much`, 16, y + 12, 12, 'rgba(255,255,255,0.8)', 800, 'left');
    y += 26;
    const tw = (WORLD_W - 32 - 4 * 8) / 5;
    for (let i = 0; i < PUZZLES; i++) {
      const x = 16 + (i % 5) * (tw + 8);
      const ty = y + Math.floor(i / 5) * (tw + 8);
      const open = i <= solved;
      const st = p.puzzleStars[i] || 0;
      this.card(x, ty, tw, tw, open ? (st ? 'rgba(255,248,235,0.95)' : 'rgba(255,138,91,0.9)') : 'rgba(255,255,255,0.08)');
      this.text(open ? String(i + 1) : '🔒', x + tw / 2, ty + tw * 0.42, open ? 18 : 14, st ? '#4a2618' : '#fff', 900);
      if (open) this.text('★'.repeat(st) + '☆'.repeat(3 - st), x + tw / 2, ty + tw * 0.76, 11, st ? '#e0a800' : 'rgba(255,255,255,0.8)', 900);
      if (open) this.listTap(x, ty, tw, tw, f, () => this.startRun(1, 'puzzle', { puzzle: i }));
    }
    y += Math.ceil(PUZZLES / 5) * (tw + 8);
    this.screenEnd(f, y - f.y0 + 8);
  }

  // ----------------------------------------------------------------- events

  private drawEvents(): void {
    const p = this.progress;
    const f = this.screenBegin('EVENTS', 'Rivals and crewmates marked (AI) are computer players');
    const { ctx } = this;
    let y = f.y0 + 4;
    const W = WORLD_W - 32;

    // League and Streak Quest.
    const half = (W - 8) / 2;
    const L = LEAGUES[p.league.tier];
    const myRank = this.leagueTable().findIndex((r) => r.me) + 1;
    this.card(16, y, half, 84, 'rgba(40,40,80,0.95)');
    this.text(`${L.icon} ${L.name.toUpperCase()}`, 16 + half / 2, y + 22, 13, '#fff', 700);
    this.text(`#${myRank} of ${LEAGUE_SIZE}`, 16 + half / 2, y + 44, 16, myRank <= PROMOTE ? '#8fdc93' : '#ffd34d', 700);
    this.text(`${p.league.pts} pts · ${timeLeft(leagueWeek().end)}`, 16 + half / 2, y + 66, 10, 'rgba(255,255,255,0.7)', 600);
    this.listTap(16, y, half, 84, f, () => this.openScreen('league', 'events'));
    const q = this.quest;
    this.card(24 + half, y, half, 84, 'rgba(90,30,20,0.95)');
    this.text('🌋 STREAK QUEST', 24 + half + half / 2, y + 22, 13, '#fff', 700);
    this.text(!q.joined ? 'JOIN · 10,000 coins' : q.out ? 'Knocked out' : q.stage >= QUEST_STAGES ? (q.claimed ? '✓ Cleared' : 'Claim reward!') : `Stage ${q.stage}/${QUEST_STAGES}`, 24 + half + half / 2, y + 44, 13, q.out ? '#ff9a8a' : '#ffd34d', 700);
    this.text(timeLeft(currentQuest().end), 24 + half + half / 2, y + 66, 10, 'rgba(255,255,255,0.7)', 600);
    this.listTap(24 + half, y, half, 84, f, () => this.openScreen('quest', 'events'));
    y += 94;

    // World Tour
    const tour = currentTour();
    const tTokens = p.tour.key === tour.key ? p.tour.tokens : 0;
    const tClaimed = p.tour.key === tour.key ? p.tour.claimed : [];
    this.card(16, y, W, 132, 'rgba(40,30,70,0.95)');
    this.text(`🌏 WORLD TOUR · ${tour.city.name.toUpperCase()}`, 32, y + 22, 15, '#fff', 900, 'left');
    this.text(timeLeft(tour.end), WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
    this.wrapLeft(`${tour.city.name}'s skyline opens every run. Tokens: chefs +1, specials +3, missions +2.`, 32, y + 40, W - 32, 10, 'rgba(255,255,255,0.75)');
    const goalMax = TOUR_GOALS[TOUR_GOALS.length - 1].tokens;
    this.bar(32, y + 62, W - 32, tTokens / goalMax, '#ffd34d', 9);
    TOUR_GOALS.forEach((g, i) => {
      const gx = 32 + (W - 32) * (g.tokens / goalMax);
      ctx.fillStyle = tClaimed.includes(i) ? '#8fdc93' : '#ffffff';
      ctx.beginPath();
      ctx.arc(gx, y + 66.5, 6, 0, Math.PI * 2);
      ctx.fill();
      this.text(`${g.tokens}`, gx, y + 84, 10, 'rgba(255,255,255,0.8)', 800);
      this.text(tClaimed.includes(i) ? '✓' : g.label, Math.min(WORLD_W - 70, Math.max(70, gx)), y + 100 + i * 0, 9.5, tClaimed.includes(i) ? '#8fdc93' : 'rgba(255,255,255,0.7)', 700);
    });
    this.text(`${tTokens} tokens`, 32, y + 120, 12, '#ffd34d', 900, 'left');
    y += 142;

    // Holiday
    const hol = currentHoliday();
    if (hol) {
      const hTokens = p.holiday.key === hol.key ? p.holiday.tokens : 0;
      const done = p.holiday.key === hol.key && p.holiday.claimed;
      this.card(16, y, W, 92, 'rgba(70,30,20,0.95)');
      this.text(`🎉 ${hol.holiday.name.toUpperCase()}`, 32, y + 22, 15, hol.holiday.color, 900, 'left');
      this.text(timeLeft(hol.end), WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
      this.wrapLeft(`Limited: ${hol.holiday.item.name}. Themed decorations and seasonal golden layers.`, 32, y + 40, W - 32, 10, 'rgba(255,255,255,0.75)');
      this.bar(32, y + 60, W - 32, hTokens / HOLIDAY_GOAL, hol.holiday.color, 9);
      this.text(done ? '✓ Unlocked!' : `${Math.min(hTokens, HOLIDAY_GOAL)}/${HOLIDAY_GOAL} tokens`, 32, y + 80, 11, done ? '#8fdc93' : '#fff', 800, 'left');
      y += 102;
    }

    // Daily race
    const r = p.race;
    const today = r.day === dayKey();
    const fin = raceFinishers(dayKey());
    this.card(16, y, W, 112, 'rgba(20,50,60,0.95)');
    this.text('🏁 SUSHI SPRINT · daily', 32, y + 22, 15, '#fff', 900, 'left');
    this.text(timeLeft(raceEnd()), WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
    this.wrapLeft(`Beat ${RACE_GOAL} chefs in one run. ${RACE_POOL} coins are split between finishers, so finish early for a bigger share.`, 32, y + 40, W - 32, 10, 'rgba(255,255,255,0.75)');
    this.text(`AI racers finished: ${fin}/99 · your share now ≈ ${Math.max(20, Math.floor(RACE_POOL / (fin + 1)))}`, 32, y + 64, 11, '#9fe3ff', 700, 'left');
    if (!today || !r.joined) {
      this.pill(32, y + 74, 120, 'JOIN RACE', f, () => { p.race = { day: dayKey(), joined: true, best: 0, finished: false, reward: 0, claimed: false }; p.persist(); this.showToast('Joined! Beat 5 chefs in one run.'); }, 'gold');
    } else if (r.finished && !r.claimed) {
      this.pill(32, y + 74, 160, `CLAIM ${r.reward} + 2 PACKS`, f, () => { r.claimed = true; this.bankCoins(r.reward); this.openPacks(2); p.persist(); }, 'gold');
    } else {
      this.bar(32, y + 86, W - 160, r.best / RACE_GOAL, '#4cc9f0', 9);
      this.text(r.claimed ? '✓ Claimed' : `${Math.min(r.best, RACE_GOAL)}/${RACE_GOAL} chefs`, WORLD_W - 40, y + 90, 12, r.claimed ? '#8fdc93' : '#fff', 900, 'right');
    }
    y += 122;

    // Weekend cup
    const cup = cupWeekend();
    const myBest = p.cup.key === cup.key ? p.cup.best : 0;
    const rivals = cupRivals(cup.key, cup.start, cup.end);
    const table = [...rivals, { name: 'YOU', score: myBest }].sort((a, b) => b.score - a.score);
    const rank = table.findIndex((e) => e.name === 'YOU') + 1;
    this.card(16, y, W, 210, 'rgba(60,40,10,0.95)');
    this.text('🏆 SUSHI CUP · weekend', 32, y + 22, 15, '#ffd34d', 900, 'left');
    this.text(cup.live ? timeLeft(cup.end) : 'Next cup: Friday', WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
    this.wrapLeft(`Best single-run height, Fri–Sun, vs ${CUP_SIZE - 1} AI rivals. #1 wins 600 coins and the Cup Trophy flag.`, 32, y + 40, W - 32, 10, 'rgba(255,255,255,0.75)');
    table.slice(0, 5).forEach((e, i) => {
      const me = e.name === 'YOU';
      this.text(`${i + 1}. ${e.name}`, 40, y + 68 + i * 20, 12, me ? '#ffd34d' : '#fff', me ? 900 : 600, 'left');
      this.text(String(e.score), WORLD_W - 40, y + 68 + i * 20, 12, me ? '#ffd34d' : '#fff', 800, 'right');
    });
    this.text(`Your rank: ${rank}/${CUP_SIZE} · best ${myBest} · prize ${cupReward(rank)} coins`, 32, y + 172, 12, '#ffd34d', 900, 'left');
    if (!cup.live && p.cup.key === cup.key && !p.cup.claimed) {
      this.pill(WORLD_W - 150, y + 158, 118, 'CLAIM PRIZE', f, () => {
        p.cup.claimed = true;
        this.bankCoins(cupReward(rank));
        if (rank === 1) this.unlockExclusive('flag', 'trophy', 'Cup Trophy flag');
        this.celebrate(`SUSHI CUP: #${rank}`, `+${cupReward(rank)} coins`);
        p.persist();
      }, 'gold');
    }
    y += 220;

    // Kitchen crew
    const w = crewWeek();
    const mine = p.crew.key === w.key ? p.crew.mine : 0;
    const mates = crewMateOrders(w.key, w.start, w.end);
    const crewTotal = mine + mates.reduce((a, b) => a + b, 0);
    const claimed = p.crew.key === w.key ? p.crew.claimed : [];
    this.card(16, y, W, 196, 'rgba(30,60,30,0.95)');
    this.text('👩‍🍳 KITCHEN CREW · weekly', 32, y + 22, 15, '#fff', 900, 'left');
    this.text(timeLeft(w.end), WORLD_W - 32, y + 22, 11, '#9fe3ff', 700, 'right');
    this.wrapLeft('Your crew serves orders together. Real teams need online servers, so for now your crewmates are AI.', 32, y + 38, W - 32, 10, 'rgba(255,255,255,0.75)');
    [['You', mine] as [string, number], ...CREW_MATES.map((n, i) => [n, mates[i]] as [string, number])].forEach(([n, v], i) => {
      this.text(n, 40, y + 62 + i * 17, 11, i === 0 ? '#ffd34d' : '#fff', i === 0 ? 900 : 600, 'left');
      this.text(`${v} orders`, WORLD_W - 40, y + 62 + i * 17, 11, '#fff', 700, 'right');
    });
    this.bar(32, y + 150, W - 32, crewTotal / CREW_GOALS[CREW_GOALS.length - 1].orders, '#8fdc93', 9);
    CREW_GOALS.forEach((g, i) => {
      const gx = 32 + 112 * i;
      const ok = crewTotal >= g.orders;
      const got = claimed.includes(i);
      this.pill(gx, y + 160, 104, got ? '✓' : `${g.orders}: ${ok ? 'CLAIM' : g.label}`, f, () => {
        if (!ok || got) return;
        if (p.crew.key !== w.key) p.crew = { key: w.key, mine: 0, claimed: [] };
        p.crew.claimed.push(i);
        if (i === 0) this.bankCoins(300);
        else if (i === 1) this.openPacks(3);
        else this.addShards(10);
        p.persist();
      }, ok && !got ? 'gold' : 'quiet');
    });
    y += 206;

    // Free chests from ads
    const ads = p.ads;
    this.card(16, y, W, 70, 'rgba(48,30,52,0.95)');
    this.text('🎁 FREE CHESTS', 32, y + 22, 15, '#fff', 900, 'left');
    this.text(`Watch a short ad for a chest · ${3 - ads.chests} left today${p.vip ? ' · VIP: +1 free' : ''}`, 32, y + 46, 11, 'rgba(255,255,255,0.75)', 600, 'left');
    const vipFree = p.vip && !ads.vipChest;
    this.pill(WORLD_W - 130, y + 19, 100, vipFree ? 'FREE (VIP)' : ads.chests < 3 ? '▶ WATCH' : 'TOMORROW', f, () => {
      if (vipFree) { ads.vipChest = true; this.openChest(p.playLevel); p.persist(); return; }
      if (ads.chests >= 3) return;
      this.watchAd('Free chest', () => { ads.chests++; this.openChest(p.playLevel); p.persist(); });
    }, ads.chests < 3 || vipFree ? 'gold' : 'quiet');
    y += 80;
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------------- more

  private drawMore(): void {
    const p = this.progress;
    const f = this.screenBegin('MORE');
    const passClaimable = this.passClaimable();
    const tiles: [string, string, string, () => void][] = [
      ['🏯', 'Restaurant', `★ ${p.starPool} to spend`, () => this.openScreen('restaurant', 'more')],
      ['🎟️', 'Sushi Pass', passClaimable ? `${passClaimable} reward${passClaimable > 1 ? 's' : ''} ready!` : `Tier ${Math.min(PASS_TIERS, Math.floor(p.pass.xp / PASS_XP))}/${PASS_TIERS}`, () => this.openScreen('pass', 'more')],
      ['🪪', 'Profile', p.prestige ? `Prestige ${p.prestige} · badges` : 'Stats, badges, prestige', () => this.openScreen('profile', 'more')],
      ['📅', 'Calendar', this.calendarReady() ? 'Today’s reward ready!' : `Day ${p.calendar.n}/28`, () => this.openScreen('calendar', 'more')],
      ['🎵', 'Jukebox', TRACKS[settings.track as TrackId]?.name ?? 'Music', () => this.openScreen('jukebox', 'more')],
      ['🧪', 'Recipe Lab', `${this.progress.secrets.length}/${SECRETS.length} secrets`, () => this.openScreen('lab', 'more')],
      ['🏛️', 'Museum', `${RECIPES.filter((r) => (p.recipeCounts[r.name] ?? 0) > 0).length}/${RECIPES.length} dishes · mastery`, () => this.openScreen('museum', 'more')],
      ['🧑‍🍳', 'My Chef', `Chef ${p.avatar.name}`, () => this.openScreen('avatar', 'more')],
      ['🏆', 'Achievements', this.achClaimable() ? `${this.achClaimable()} reward${this.achClaimable() > 1 ? 's' : ''} ready!` : `${ACHIEVEMENTS.reduce((n, a) => n + (p.achSeen[a.id] ?? 0), 0)}/${ACHIEVEMENTS.length * 4} unlocked`, () => this.openScreen('trophies', 'more')],
      ['💞', 'Regulars', `${REGULARS.filter((r) => heartLevel(p.hearts[r.id] ?? 0) >= 2).length} friends`, () => this.openScreen('regulars', 'more')],
      ['🖼️', 'Gallery', `${p.gallery.done.length}/${PICTURES.length} pictures`, () => this.openScreen('gallery', 'more')],
      ['📖', 'Story', `Chapter ${Math.min(chapterFor(p.unlocked) + 1, CHAPTERS.length + 1)}`, () => this.openScreen('story', 'more')],
      ['🐾', 'Companions', `${COMPANIONS.filter((c) => companionLevel(p.shards[c.id] ?? 0) > 0).length}/${COMPANIONS.length} unlocked`, () => this.openScreen('pets', 'more')],
      ['📒', 'Album', 'Chef cards, stickers, records', () => { this.openAlbum(); this.shopFrom = 'more'; }],
      ['📊', 'Leaderboards', 'Your best runs and the Cup', () => this.openScreen('boards', 'more')],
      ['🤝', 'Friend Code', 'Play a friend’s challenge', () => this.openCodeInput()],
      ['⚙️', 'Settings', 'Sound, accessibility, language, save', () => this.openScreen('settings', 'more')],
    ];
    const tw = (WORLD_W - 32 - 10) / 2;
    tiles.forEach(([icon, name, sub, go], i) => {
      const x = 16 + (i % 2) * (tw + 10);
      const y = f.y0 + 4 + Math.floor(i / 2) * 104;
      this.card(x, y, tw, 94);
      this.text(icon, x + tw / 2, y + 30, 28, '#fff', 400);
      this.text(name, x + tw / 2, y + 62, 14, '#fff', 900);
      this.text(sub, x + tw / 2, y + 80, 10.5, sub.includes('ready') ? '#ffd34d' : 'rgba(255,255,255,0.7)', 700);
      this.listTap(x, y, tw, 94, f, go);
    });
    this.screenEnd(f, Math.ceil(tiles.length / 2) * 104 + 8);
  }

  private musicOn = save.json('music', true);

  private toggleMusic(): void {
    this.musicOn = !this.musicOn;
    save.setJson('music', this.musicOn);
    setMusic(this.musicOn);
  }

  // ------------------------------------------------------------- restaurant

  // ------------------------------------------------------------ restaurant economy

  private get rest() {
    return this.progress.rest;
  }

  private get restPass(): boolean {
    return this.rest.passUntil > Date.now();
  }

  private get restTier(): number {
    return this.progress.restaurant.r + this.progress.restaurant.michelin;
  }

  private staffLv(id: StaffId): number {
    return this.rest.staff[id] ?? 0;
  }

  /** Coins per hour: upgrades and finished restaurants, boosted by the waiter, the menu board, reviews and the Pass. */
  private tipsPerHour(): number {
    const rs = this.progress.restaurant;
    const waiter = [0, 0.15, 0.3, 0.5][this.staffLv('waiter')];
    const menu = this.rest.menu.day === dayKey() ? 0.2 : 0;
    return Math.round((tipRate(this.restTier, rs.levels) + this.rest.reviews * 5) * (1 + waiter + menu + (this.restPass ? 0.5 : 0)));
  }

  private jarHours(): number {
    return TIP_HOURS + this.staffLv('dishwasher') * 2 + (this.restPass ? 4 : 0);
  }

  /** Popularity 1-5: upgrades, finished restaurants and the critic's reviews. */
  private popularity(): number {
    return Math.min(5, popularity(this.restTier, this.progress.restaurant.levels) + Math.floor(this.rest.reviews / 2));
  }

  /** Tips waiting in the jar: they build up per hour while you play or are away. */
  private restaurantTips(): number {
    const rs = this.progress.restaurant as typeof this.progress.restaurant & { tipsAt?: number };
    if (this.lockedAt('restaurant')) return 0;
    if (!rs.tipsAt) {
      rs.tipsAt = Date.now();
      this.progress.persist();
    }
    const hours = Math.min(this.jarHours(), (Date.now() - rs.tipsAt) / 3_600_000);
    return Math.floor(hours * this.tipsPerHour());
  }

  /** Sends the restaurant, tip jar and calendar to the home-screen widget (native builds only). */
  private pushWidget(): void {
    if (this.lockedAt('restaurant')) return;
    const rs = this.progress.restaurant as typeof this.progress.restaurant & { tipsAt?: number };
    updateWidget({
      restaurant: RESTAURANTS[Math.min(rs.r, RESTAURANTS.length - 1)].name, stars: this.popularity(), tips: this.restaurantTips(),
      tipsMax: this.tipsPerHour() * this.jarHours(), jarFullAt: (rs.tipsAt ?? Date.now()) + this.jarHours() * 3_600_000,
      calendarDay: this.progress.calendar.n % 28 + 1, calendarReady: this.calendarReady(), level: this.progress.unlocked, chef: this.progress.avatar.name,
    });
  }

  private collectTips(): void {
    const tips = this.restaurantTips();
    if (tips <= 0) {
      this.showToast('The tip jar is empty. Come back soon!');
      return;
    }
    (this.progress.restaurant as { tipsAt?: number }).tipsAt = Date.now();
    this.progress.persist();
    this.bankCoins(tips);
    this.restFloat(`+${tips} 🪙`, WORLD_W - 52, 0);
    this.celebrate(`💰 +${tips} TIPS!`, 'Your guests loved it. Upgrades bring bigger tips.', 1.6);
    sfx.coin();
    haptic.success();
    track('tips', { coins: tips });
    this.scheduleTipReminder();
    this.pushWidget();
    // Lock screen / Dynamic Island countdown until the jar is full again (iPhone, when set up).
    endLiveActivity();
    startLiveActivity('Tip jar filling', Date.now() + this.jarHours() * 3_600_000, `${RESTAURANTS[Math.min(this.progress.restaurant.r, RESTAURANTS.length - 1)].name} · ${this.tipsPerHour()} tips/hour`);
  }

  /** A local notification for when the tip jar is full (only if the player allowed reminders). */
  private scheduleTipReminder(): void {
    if (this.lockedAt('restaurant')) return;
    const at = ((this.progress.restaurant as { tipsAt?: number }).tipsAt ?? Date.now()) + this.jarHours() * 3_600_000;
    void scheduleAt(2, 'Your tip jar is full! 💰', `${this.progress.avatar.name}, your guests left ${Math.floor(this.jarHours() * this.tipsPerHour())} coins in tips.`, new Date(at));
  }

  /** True when any area upgrade is affordable right now. */
  private restaurantUpgradeReady(): boolean {
    const p = this.progress;
    const rs = p.restaurant;
    return rs.levels.some((lv) => lv < AREA_MAX && p.starPool >= areaCost(this.restTier, lv + 1));
  }

  /** One line that sells a visit: the critic, tips waiting, an upgrade to buy, or the hourly rate. */
  private restaurantPitch(): { text: string; hot: boolean } {
    const tips = this.restaurantTips();
    const ready = this.restaurantUpgradeReady();
    if (criticToday() && this.rest.critic.day !== dayKey()) return { text: '🧐 The Food Critic is visiting today!', hot: true };
    if (ready && tips >= 20) return { text: `Upgrade ready + 💰 ${tips} tips!`, hot: true };
    if (ready) return { text: 'Upgrade ready! Make it shine ✨', hot: true };
    if (tips >= 20) return { text: `💰 ${tips} tips waiting`, hot: true };
    if (this.rest.menu.day !== dayKey()) return { text: 'Pick today’s menu for +20% tips', hot: true };
    return { text: `${this.tipsPerHour()} tips/hour · beat chefs for ★`, hot: false };
  }

  /** Daily help from the apprentice, given when the restaurant is visited. */
  private apprenticeGift(): void {
    const lv = this.staffLv('apprentice');
    if (!lv || this.rest.apprenticeDay === dayKey()) return;
    this.rest.apprenticeDay = dayKey();
    const n = lv >= 3 ? 2 : 1;
    const got: string[] = [];
    for (let i = 0; i < n; i++) {
      const b = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
      this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
      got.push(b.name);
    }
    save.setBoosters(this.boosters);
    const coins = [0, 0, 20, 50][lv];
    if (coins) this.bankCoins(coins);
    this.progress.persist();
    this.showToast(`👦 Kei prepared: ${got.join(' + ')}${coins ? ` and ${coins} coins` : ''}`);
  }

  // ------------------------------------------------------------ guests

  private guestReady: number[] = [];
  private restFx: { text: string; x: number; y: number; t: number }[] = [];
  private restTab: 'build' | 'decor' | 'staff' | 'menu' | 'themes' | 'trucks' = 'build';
  private visit: RestCode | null = null;
  private sceneBox = { x: 16, y: 0, w: WORLD_W - 32, h: 300 };

  private restFloat(text: string, x: number, y: number): void {
    this.restFx.push({ text, x, y, t: 0 });
  }

  /** Guests at the counter: regulars (more seats with upgrades and the greeter), plus the critic on critic days. */
  private sceneGuests(): SceneGuest[] {
    const rs = this.progress.restaurant;
    if (!rs.levels[0]) return [];
    const done = rs.levels.reduce((a, b) => a + b, 0);
    const regs = REGULARS.filter((r) => r.level <= this.progress.unlocked);
    const seats = Math.min(6, Math.min(3, 1 + Math.floor(done / 4)) + [0, 1, 1, 2][this.staffLv('greeter')]);
    const now = Date.now();
    const guests: SceneGuest[] = [];
    for (let i = 0; i < seats; i++) {
      if (this.guestReady[i] === undefined) this.guestReady[i] = now + 3000 + Math.random() * 15000;
      guests.push({ emoji: regs[i % regs.length].emoji, hungry: now >= this.guestReady[i] });
    }
    if (criticToday() && this.rest.critic.day !== dayKey() && guests.length) guests[guests.length - 1] = { emoji: '🧐', hungry: true, critic: true };
    return guests;
  }

  /** Tapping a hungry guest serves them a quick dish: coins, and a heart for that regular. */
  private serveGuest(i: number, critic: boolean): void {
    if (critic) {
      this.startCritic();
      return;
    }
    const r = this.rest;
    if (r.served.day !== dayKey()) r.served = { day: dayKey(), n: 0 };
    if (r.served.n >= GUEST_SERVES_PER_DAY) {
      this.showToast('The kitchen is closed for today. Guests will be back tomorrow!');
      return;
    }
    r.served.n++;
    const coins = 6 + this.restTier * 3 + this.popularity() * 2;
    this.bankCoins(coins);
    const regs = REGULARS.map((_, k) => k).filter((k) => REGULARS[k].level <= this.progress.unlocked);
    this.addHearts(regs[i % regs.length], this.staffLv('greeter') >= 2 ? 2 : 1);
    this.guestReady[i] = Date.now() + 40000 + Math.random() * 40000;
    const sp = seatPos(this.sceneBox, i, this.sceneGuests().length);
    this.restFloat(`+${coins} 🪙`, sp.x, sp.y - 40);
    sfx.coin();
    haptic.light();
    this.progress.persist();
    track('guest_served', { n: r.served.n });
  }

  // ------------------------------------------------------------ critic

  private startCritic(): void {
    if (this.rest.critic.day === dayKey()) {
      this.showToast('The critic already wrote today’s review. Come back on another critic day!');
      return;
    }
    this.coach('THE FOOD CRITIC', 'One long order with a small PERFECT zone. Serve it with 2★ or better for a glowing review.', 5);
    this.startRun(this.progress.playLevel, 'critic');
  }

  /** Critic result: 2+ stars is a glowing review (popularity, coins, decor unlocks). */
  private criticResult(stars: number): void {
    const r = this.rest;
    if (stars >= 2) {
      r.critic = { day: dayKey(), done: true };
      r.reviews++;
      this.bankCoins(300);
      this.celebrate('⭐ GLOWING REVIEW!', `Review ${r.reviews} · +300 coins · popularity and tips go up`);
      track('critic', { won: true, reviews: r.reviews });
    } else {
      this.showToast('🧐 “Hmm. Not yet.” Try again: 2★ or better impresses the critic.');
      track('critic', { won: false });
    }
    this.progress.persist();
  }

  // ------------------------------------------------------------ decor, staff, menu, themes

  private styleOwned(area: AreaId, i: number): boolean {
    const st = STYLES[area][i];
    if (!st.unlock) return true;
    if ('critic' in st.unlock) return this.rest.reviews >= st.unlock.critic;
    if ('pass' in st.unlock) return this.restPass;
    return this.rest.ownedStyles.includes(`${area}:${i}`);
  }

  private tapStyle(area: AreaId, i: number): void {
    const st = STYLES[area][i];
    if (!this.styleOwned(area, i)) {
      if (st.unlock && 'coins' in st.unlock) {
        if (this.bank < st.unlock.coins) return this.showToast(`You need ${st.unlock.coins - this.bank} more coins`);
        this.bank -= st.unlock.coins;
        save.setCoins(this.bank);
        this.rest.ownedStyles.push(`${area}:${i}`);
        sfx.coin();
      } else if (st.unlock && 'pass' in st.unlock) {
        return this.buy('restpass');
      } else return this.showToast(`Unlocks with ${styleText(st.unlock)} (you have ${this.rest.reviews})`);
    }
    this.rest.styles[area] = i;
    this.upgradeFx = { i: AREAS.findIndex((a) => a.id === area), t: 0 };
    this.progress.persist();
    track('decor', { area, style: i });
  }

  private hireStaff(id: StaffId): void {
    const s = STAFF.find((x) => x.id === id)!;
    const lv = this.staffLv(id);
    if (lv >= 3) return;
    const cost = s.costs[lv];
    if (this.bank < cost) return this.showToast(`You need ${cost - this.bank} more coins`);
    this.bank -= cost;
    save.setCoins(this.bank);
    this.rest.staff[id] = lv + 1;
    this.progress.persist();
    this.celebrate(`${s.emoji} ${s.name.toUpperCase()}${lv ? ` LV ${lv + 1}` : ' HIRED!'}`, s.perks[lv], 1.8);
    haptic.success();
    track('staff', { id, level: lv + 1 });
    if (id === 'apprentice') this.apprenticeGift();
  }

  private setMenu(recipe: string): void {
    const fresh = this.rest.menu.day !== dayKey();
    this.rest.menu = { day: dayKey(), recipe };
    this.progress.persist();
    this.showToast(fresh ? `Today’s special: ${recipe}! +20% tips today` : `Menu changed to ${recipe}`);
    track('menu', { recipe });
  }

  private tapTheme(th: RestTheme): void {
    const r = this.rest;
    if (!r.ownedThemes.includes(th.id)) {
      if (th.id === 'imperial') return this.restPass ? this.equipTheme(th) : this.buy('restpass');
      if (themeInSeason(th)) {
        r.ownedThemes.push(th.id);
        this.celebrate(`${th.icon} ${th.name.toUpperCase()}`, 'Seasonal theme claimed for free. It’s yours to keep!');
      } else {
        if (this.bank < th.price) return this.showToast(`You need ${th.price - this.bank} more coins (or claim it free in season)`);
        this.bank -= th.price;
        save.setCoins(this.bank);
        r.ownedThemes.push(th.id);
      }
    }
    this.equipTheme(th);
  }

  private equipTheme(th: RestTheme): void {
    this.rest.theme = th.id;
    this.progress.persist();
    track('theme', { id: th.id });
  }

  // ------------------------------------------------------------ friend visits

  private myRestCode(): string {
    const p = this.progress;
    const a = p.avatar;
    return encodeRestaurant({ n: a.name, r: p.restaurant.r, m: p.restaurant.michelin, l: p.restaurant.levels, s: stylesArray(this.rest), t: this.rest.theme, a: [a.skin, a.hair, a.hairColor, a.hat, a.outfit, a.accent, a.face] });
  }

  private shareRestaurant(): void {
    const code = this.myRestCode();
    const text = `Come visit my sushi restaurant in Sushi Stack! Enter this code under Friend code: ${code}`;
    track('restaurant_share');
    if (navigator.share) void navigator.share({ title: 'Sushi Stack', text }).catch(() => this.copy(code, 'Restaurant code copied!'));
    else this.copy(code, 'Restaurant code copied!');
  }

  private openVisit(c: RestCode): void {
    this.visit = c;
    this.openScreen('visit', this.mode === 'restaurant' ? 'restaurant' : 'title');
    track('restaurant_visit');
  }

  private heartVisit(): void {
    const v = this.visit!;
    const r = this.rest;
    if (r.visited.day !== dayKey()) r.visited = { day: dayKey(), codes: [] };
    const key = `${v.n}|${v.l.join('')}`;
    if (r.visited.codes.includes(key)) return this.showToast('You already left a ❤️ here today');
    if (r.visited.codes.length >= 5) return this.showToast('That’s 5 visits today. Come back tomorrow!');
    r.visited.codes.push(key);
    this.bankCoins(25);
    this.progress.persist();
    this.celebrate('❤️ LEFT A HEART!', '+25 coins for visiting. (Your friend’s reward needs online accounts, coming later.)', 1.8);
  }

  private drawVisit(): void {
    const v = this.visit;
    if (!v) {
      this.mode = 'title';
      return;
    }
    const R = RESTAURANTS[Math.min(v.r, RESTAURANTS.length - 1)];
    const f = this.screenBegin(`${v.n}’s ${R.name}`, `Visiting a friend · ${v.l.reduce((a, b) => a + b, 0)}/24 upgrades${v.m ? ` · ${'⭐'.repeat(Math.min(3, v.m))}` : ''}`);
    let y = f.y0 + 4;
    const o = AVATAR_OPTIONS;
    const chef = avatarChef({ name: v.n, skin: v.a[0] % o.skin.length, hair: v.a[1] % o.hair.length, hairColor: v.a[2] % o.hairColor.length, hat: v.a[3] % o.hat.length, outfit: v.a[4] % o.outfit.length, accent: v.a[5] % o.accent.length, face: v.a[6] % o.face.length });
    drawRestaurantScene(this.ctx, {
      x: 16, y, w: WORLD_W - 32, h: 300, time: this.time, levels: v.l, styles: v.s, theme: themeById(v.t),
      staff: { waiter: 1, dishwasher: 0, greeter: 1, apprentice: 0 },
      guests: v.l[0] ? ['🧑', '👩', '👴'].map((e) => ({ emoji: e, hungry: false })) : [], chef, tips: 0, menu: '', name: v.n, hour: new Date().getHours(),
    });
    y += 312;
    this.pill(16, y, WORLD_W - 32, '❤️ LEAVE A HEART (+25 COINS)', f, () => this.heartVisit(), 'gold');
    y += 44;
    this.pill(16, y, WORLD_W - 32, 'SHARE MY RESTAURANT', f, () => this.shareRestaurant(), 'quiet');
    y += 44;
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ the restaurant screen

  private drawRestaurant(): void {
    const { ctx } = this;
    const p = this.progress;
    const rs = p.restaurant;
    const r = this.rest;
    const R = RESTAURANTS[Math.min(rs.r, RESTAURANTS.length - 1)];
    const done = rs.levels.reduce((a, b) => a + b, 0);
    this.apprenticeGift();
    const f = this.screenBegin(rs.michelin ? `${R.name} ${'⭐'.repeat(Math.min(rs.michelin, 3))}` : R.name, `★ ${p.starPool} to spend · ${done}/${AREAS.length * AREA_MAX} upgrades · grandma’s bar reborn`);
    let y = f.y0 + 4;

    // The room. Hungry guests can be tapped.
    const guests = this.sceneGuests();
    this.sceneBox = { x: 16, y, w: WORLD_W - 32, h: 300 };
    const tips = this.restaurantTips();
    const menuRecipe = r.menu.day === dayKey() ? RECIPES.find((x) => x.name === r.menu.recipe) : undefined;
    drawRestaurantScene(ctx, {
      ...this.sceneBox, time: this.time, levels: rs.levels, styles: stylesArray(r), theme: themeById(r.theme),
      staff: { waiter: this.staffLv('waiter'), dishwasher: this.staffLv('dishwasher'), greeter: this.staffLv('greeter'), apprentice: this.staffLv('apprentice') },
      guests, chef: avatarChef(p.avatar), tips, menu: menuRecipe ? DISH_EMOJI[menuRecipe.name] ?? '🍣' : '', name: R.name, hour: new Date().getHours(),
    });
    this.drawUpgradeFx(this.sceneBox);
    guests.forEach((g, i) => {
      const sp = seatPos(this.sceneBox, i, guests.length);
      if (g.hungry) this.listTap(sp.x - 24, sp.y - 46, 48, 66, f, () => this.serveGuest(i, !!g.critic));
    });
    // Floating rewards over the room.
    this.qaSkip = true; // they float and fade
    for (const fx of this.restFx) {
      ctx.globalAlpha = Math.max(0, 1 - fx.t / 1.2);
      this.text(fx.text, fx.x, (fx.y || this.sceneBox.y + 200) - fx.t * 40, 15, '#ffd34d', 700);
    }
    this.qaSkip = false;
    ctx.globalAlpha = 1;
    if (guests.some((g) => g.hungry && !g.critic)) this.text('Tap a guest with ! to serve them', WORLD_W / 2, y + 290, 10.5, 'rgba(255,255,255,0.85)', 700);
    y += 310;

    // The critic.
    if (criticToday() && r.critic.day !== dayKey()) {
      this.card(16, y, WORLD_W - 32, 66, 'rgba(70,20,60,0.95)');
      this.text('🧐', 44, y + 33, 26, '#fff', 400);
      this.text('THE FOOD CRITIC IS HERE!', 70, y + 20, 13, '#ffd34d', 700, 'left');
      this.fitText(`One tough order · 2★ = review ${r.reviews + 1}, +300 coins`, 70, y + 42, 170, 10.5, 'rgba(255,255,255,0.8)', 'left');
      this.pill(WORLD_W - 112, y + 17, 82, 'COOK!', f, () => this.startCritic(), 'gold');
      y += 74;
    }

    // Popularity and the tip jar.
    const rate = this.tipsPerHour();
    const cap = rate * this.jarHours();
    this.card(16, y, WORLD_W - 32, 92, 'rgba(60,35,20,0.95)');
    this.text('POPULARITY', 32, y + 18, 11, 'rgba(255,255,255,0.7)', 700, 'left');
    for (let k = 0; k < 5; k++) this.text('★', 32 + k * 19, y + 40, 19, k < this.popularity() ? '#ffd34d' : 'rgba(255,255,255,0.2)', 700, 'left');
    this.text(`${rate} tips per hour`, 32, y + 64, 12, '#ffe2c6', 700, 'left');
    this.text(`jar holds ${this.jarHours()}h · ${r.reviews} review${r.reviews === 1 ? '' : 's'}`, 32, y + 80, 10, 'rgba(255,255,255,0.55)', 600, 'left');
    const jx = 172;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    this.roundRect(jx, y + 14, 34, 64, 10);
    ctx.fill();
    const fill = Math.min(1, tips / Math.max(1, cap));
    ctx.fillStyle = '#ffd34d';
    this.roundRect(jx + 3, y + 75 - 58 * fill, 28, 58 * fill, 7);
    ctx.fill();
    this.text('💰', jx + 17, y + 46, 16, '#fff', 400);
    this.pill(WORLD_W - 158, y + 30, 126, tips > 0 ? `COLLECT ${tips}` : 'JAR EMPTY', f, () => this.collectTips(), tips > 0 ? 'gold' : 'quiet');
    y += 100;

    // Restaurant Pass.
    this.card(16, y, WORLD_W - 32, 56, 'rgba(80,60,10,0.95)');
    this.text('👑', 40, y + 28, 22, '#fff', 400);
    if (this.restPass) {
      this.text('RESTAURANT PASS ACTIVE', 64, y + 20, 12.5, '#ffd34d', 700, 'left');
      this.text(`${Math.ceil((r.passUntil - Date.now()) / 86_400_000)} days left · +50% tips · +4h jar · gold decor`, 64, y + 38, 10, 'rgba(255,255,255,0.8)', 600, 'left');
    } else {
      this.text('RESTAURANT PASS', 64, y + 20, 12.5, '#ffd34d', 700, 'left');
      this.fitText('+50% tips · +4h jar · Imperial theme · 4 gold styles', 64, y + 38, 190, 10, 'rgba(255,255,255,0.8)', 'left');
      this.pill(WORLD_W - 104, y + 12, 76, PRODUCTS.restpass.price.split(' ')[0], f, () => this.buy('restpass'), 'gold');
    }
    y += 64;

    // Tabs.
    const tabs: [typeof this.restTab, string][] = [['build', 'BUILD'], ['decor', 'DECOR'], ['staff', 'STAFF'], ['menu', 'MENU'], ['themes', 'THEMES'], ['trucks', '🚚']];
    const tw = (WORLD_W - 32 - 5 * 5) / 6;
    tabs.forEach(([id, name], i) => {
      this.pill(16 + i * (tw + 5), y, tw, name, f, () => { this.restTab = id; }, this.restTab === id ? 'primary' : 'quiet');
      const last = this.buttons[this.buttons.length - 1];
      if (id === 'trucks' && last?.label === '🚚') last.label = 'FOOD TRUCKS';
    });
    y += 44;
    if (this.restTab === 'build') y = this.drawRestBuild(f, y);
    else if (this.restTab === 'decor') y = this.drawRestDecor(f, y);
    else if (this.restTab === 'staff') y = this.drawRestStaff(f, y);
    else if (this.restTab === 'menu') y = this.drawRestMenu(f, y);
    else if (this.restTab === 'trucks') y = this.drawRestBranches(f, y);
    else y = this.drawRestThemes(f, y);

    // Friends.
    y += 4;
    this.pill(16, y, (WORLD_W - 40) / 2, '📤 SHARE MINE', f, () => this.shareRestaurant(), 'quiet');
    this.pill(24 + (WORLD_W - 40) / 2, y, (WORLD_W - 40) / 2, '🏠 VISIT A FRIEND', f, () => this.openCodeInput('friend'), 'quiet');
    y += 44;
    this.screenEnd(f, y - f.y0);
  }

  private drawUpgradeFx(box: { x: number; y: number; w: number; h: number }): void {
    const fx = this.upgradeFx;
    if (!fx || fx.t >= 1.4) return;
    const { x, y, w, h } = box;
    const spots: Record<string, [number, number]> = {
      sign: [w / 2, 28], lanterns: [w * 0.2, 34], noren: [49, 115], art: [w - 61, 92],
      aquarium: [140, h * 0.6], garden: [w - 60, h * 0.62], counter: [w / 2, h * 0.72 + 14], conveyor: [w / 2, h * 0.72 - 16],
    };
    const [sx, sy] = spots[AREAS[fx.i].id];
    this.qaSkip = true;
    for (let k = 0; k < 10; k++) {
      const a = k * 0.63 + fx.t * 2;
      const r = 10 + fx.t * 50;
      this.ctx.globalAlpha = Math.max(0, 1 - fx.t / 1.4);
      this.text('✦', x + sx + Math.cos(a) * r, y + sy + Math.sin(a) * r, 12 + (k % 3) * 4, k % 2 ? '#ffd34d' : '#ffffff', 700);
    }
    this.ctx.globalAlpha = 1;
    this.qaSkip = false;
  }

  private drawRestBuild(f: { areaTop: number; areaH: number }, y: number): number {
    const { ctx } = this;
    const p = this.progress;
    const rs = p.restaurant;
    this.wrapLeft('Beat chefs to earn ★. Every upgrade brings more guests and bigger tips. Finish all 8 for the next restaurant (+5% coins forever).', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 44;
    AREAS.forEach((a, i) => {
      const lv = rs.levels[i];
      const max = lv >= AREA_MAX;
      const cost = max ? 0 : areaCost(this.restTier, lv + 1);
      const can = !max && p.starPool >= cost;
      this.card(16, y, WORLD_W - 32, 64, can ? 'rgba(70,50,20,0.95)' : 'rgba(48,30,52,0.95)');
      this.dot(46, y + 32, 20, 'rgba(255,255,255,0.08)');
      this.text(a.icon, 46, y + 33, 20, '#fff', 400);
      this.text(a.name, 76, y + 16, 13, '#fff', 700, 'left');
      for (let k = 0; k < AREA_MAX; k++) {
        ctx.fillStyle = k < lv ? '#ffd34d' : 'rgba(255,255,255,0.2)';
        this.roundRect(76 + k * 22, y + 27, 18, 7, 3.5);
        ctx.fill();
      }
      this.fitText(max ? 'Fully upgraded' : `Next: ${a.perks[lv]}`, 76, y + 49, WORLD_W - 216, 10.5, max ? '#8fdc93' : 'rgba(255,255,255,0.7)', 'left');
      if (max) this.text('✓ DONE', WORLD_W - 40, y + 32, 12, '#8fdc93', 700, 'right');
      else this.pill(WORLD_W - 128, y + 16, 96, `★${cost} BUILD`, f, () => this.upgradeArea(i), can ? 'gold' : 'quiet');
      y += 72;
    });
    return y;
  }

  private drawRestDecor(f: { areaTop: number; areaH: number }, y: number): number {
    this.wrapLeft('Pick a look for every area. Styles show once the area is built.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 24;
    const rs = this.progress.restaurant;
    AREAS.forEach((a, ai) => {
      const cur = this.rest.styles[a.id] ?? 0;
      this.card(16, y, WORLD_W - 32, 84);
      this.text(`${a.icon} ${a.name}`, 30, y + 16, 13, '#fff', 700, 'left');
      if (!rs.levels[ai]) this.text('not built yet', WORLD_W - 30, y + 16, 10, 'rgba(255,255,255,0.5)', 600, 'right');
      const cw = (WORLD_W - 32 - 28 - 12) / 3;
      STYLES[a.id].forEach((st, i) => {
        const cx2 = 30 + i * (cw + 6);
        const own = this.styleOwned(a.id, i);
        const on = cur === i;
        this.ctx.fillStyle = on ? 'rgba(255,211,77,0.25)' : 'rgba(255,255,255,0.07)';
        this.roundRect(cx2, y + 30, cw, 44, 10);
        this.ctx.fill();
        if (on) {
          this.ctx.strokeStyle = '#ffd34d';
          this.ctx.lineWidth = 2;
          this.roundRect(cx2, y + 30, cw, 44, 10);
          this.ctx.stroke();
        }
        this.fitText(st.name, cx2 + cw / 2, y + 44, cw - 8, 11, '#fff', 'center', 700);
        this.fitText(on ? '✓ in use' : own ? 'tap to use' : `🔒 ${styleText(st.unlock)}`, cx2 + cw / 2, y + 61, cw - 8, 9.5, on ? '#8fdc93' : own ? 'rgba(255,255,255,0.7)' : '#ffd34d', 'center', 600);
        this.listTap(cx2, y + 30, cw, 44, f, () => this.tapStyle(a.id, i));
      });
      y += 92;
    });
    return y;
  }

  private drawRestStaff(f: { areaTop: number; areaH: number }, y: number): number {
    this.wrapLeft('Hire staff with coins. They work while you play and while you’re away.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 24;
    for (const s of STAFF) {
      const lv = this.staffLv(s.id);
      this.card(16, y, WORLD_W - 32, 76, lv ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.dot(48, y + 38, 24, 'rgba(255,255,255,0.08)');
      this.text(s.emoji, 48, y + 39, 26, '#fff', 400);
      this.text(s.name, 82, y + 18, 13.5, '#fff', 700, 'left');
      for (let k = 0; k < 3; k++) this.dot(86 + k * 14, y + 34, 4.5, k < lv ? '#ffd34d' : 'rgba(255,255,255,0.2)');
      this.fitText(lv ? `Now: ${s.perks[lv - 1]}` : `Hire: ${s.perks[0]}`, 82, y + 50, WORLD_W - 220, 10.5, lv ? '#8fdc93' : 'rgba(255,255,255,0.75)', 'left');
      if (lv && lv < 3) this.fitText(`Next: ${s.perks[lv]}`, 82, y + 65, WORLD_W - 220, 10, 'rgba(255,255,255,0.6)', 'left');
      if (lv >= 3) this.text('★ MAX', WORLD_W - 40, y + 38, 12, '#ffd34d', 700, 'right');
      else this.pill(WORLD_W - 132, y + 22, 100, `${lv ? 'TRAIN' : 'HIRE'} ${s.costs[lv]}`, f, () => this.hireStaff(s.id), this.bank >= s.costs[lv] ? 'gold' : 'quiet');
      y += 84;
    }
    return y;
  }

  private drawRestMenu(f: { areaTop: number; areaH: number }, y: number): number {
    const r = this.rest;
    const today = r.menu.day === dayKey() ? r.menu.recipe : '';
    this.wrapLeft('Choose today’s special. It shows up more in your runs and pays 2x coins there, and any menu gives +20% tips today. It resets every day.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 44;
    for (const rec of RECIPES.filter((r) => !r.secret || this.progress.secrets.includes(r.name))) {
      const open = (rec.level ?? 0) <= this.progress.unlocked;
      const on = today === rec.name;
      this.card(16, y, WORLD_W - 32, 50, on ? 'rgba(70,50,20,0.95)' : open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.text(open ? DISH_EMOJI[rec.name] ?? '🍣' : '🔒', 40, y + 25, 20, '#fff', 400);
      this.text(rec.name, 64, y + 17, 13, open ? '#fff' : 'rgba(255,255,255,0.45)', 700, 'left');
      rec.pattern.slice(0, 6).forEach((k, i) => {
        this.ctx.fillStyle = this.color(k);
        this.roundRect(64 + i * 18, y + 30, 14, 8, 3);
        this.ctx.fill();
      });
      if (!open) this.text(`level ${rec.level}`, WORLD_W - 32, y + 25, 11, 'rgba(255,255,255,0.5)', 600, 'right');
      else if (on) this.text('✓ TODAY', WORLD_W - 32, y + 25, 12, '#8fdc93', 700, 'right');
      else this.pill(WORLD_W - 108, y + 9, 76, 'SERVE', f, () => this.setMenu(rec.name), 'quiet');
      y += 56;
    }
    return y;
  }

  private drawRestThemes(f: { areaTop: number; areaH: number }, y: number): number {
    const r = this.rest;
    this.wrapLeft('Seasonal makeovers. Each season’s theme is free to claim while it’s on.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 24;
    const cw = (WORLD_W - 32 - 10) / 2;
    REST_THEMES.forEach((th, i) => {
      const x = 16 + (i % 2) * (cw + 10);
      const yy = y + Math.floor(i / 2) * 118;
      const own = r.ownedThemes.includes(th.id) || (th.id === 'imperial' && this.restPass);
      const on = r.theme === th.id;
      const g = this.ctx.createLinearGradient(0, yy, 0, yy + 108);
      g.addColorStop(0, th.wall);
      g.addColorStop(0.7, th.wall2);
      g.addColorStop(0.71, th.floor);
      g.addColorStop(1, th.floor2);
      this.ctx.fillStyle = g;
      this.roundRect(x, yy, cw, 108, 14);
      this.ctx.fill();
      if (on) {
        this.ctx.strokeStyle = '#ffd34d';
        this.ctx.lineWidth = 3;
        this.roundRect(x, yy, cw, 108, 14);
        this.ctx.stroke();
      }
      this.text(th.icon, x + cw / 2, yy + 34, 30, '#fff', 400);
      this.ctx.fillStyle = 'rgba(20,10,25,0.75)';
      this.roundRect(x + 6, yy + 60, cw - 12, 42, 10);
      this.ctx.fill();
      this.fitText(th.name, x + cw / 2, yy + 73, cw - 20, 12, '#fff', 'center', 700);
      const status = on ? '✓ in use' : own ? 'tap to use' : th.id === 'imperial' ? '👑 Restaurant Pass' : themeInSeason(th) ? '🎁 FREE this season' : `${th.price} coins`;
      this.fitText(status, x + cw / 2, yy + 90, cw - 20, 10, on ? '#8fdc93' : themeInSeason(th) && !own ? '#ffd34d' : 'rgba(255,255,255,0.75)', 'center', 700);
      this.listTap(x, yy, cw, 108, f, () => this.tapTheme(th));
    });
    return y + Math.ceil(REST_THEMES.length / 2) * 118;
  }

  private upgradeArea(i: number): void {
    const p = this.progress;
    const rs = p.restaurant;
    const tier = rs.r + rs.michelin;
    const lv = rs.levels[i];
    if (lv >= AREA_MAX) return;
    const cost = areaCost(tier, lv + 1);
    if (p.starPool < cost) {
      this.showToast(`You need ${cost - p.starPool} more stars. Beat chefs with better stars!`);
      return;
    }
    p.starPool -= cost;
    rs.levels[i]++;
    this.bankCoins(30 * rs.levels[i]);
    this.upgradeFx = { i, t: 0 };
    this.celebrate(`${AREAS[i].icon} ${AREAS[i].name.toUpperCase()} LV ${rs.levels[i]}`, `${AREAS[i].perks[rs.levels[i] - 1]} · +${30 * rs.levels[i]} coins`, 1.8);
    sfx.serve();
    haptic.success();
    track('restaurant_upgrade', { area: AREAS[i].id, level: rs.levels[i], tier });
    if (rs.levels.every((l) => l >= AREA_MAX)) {
      const R = RESTAURANTS[Math.min(rs.r, RESTAURANTS.length - 1)];
      this.bankCoins(500);
      if (rs.r < RESTAURANTS.length - 1) {
        this.unlockExclusive(R.reward.cat, R.reward.id, R.reward.name);
        this.celebrate(`${R.name} COMPLETE!`, `+500 coins · ${R.reward.name} · next: ${RESTAURANTS[rs.r + 1].name}`);
        rs.r++;
      } else {
        if (!rs.michelin) this.unlockExclusive(R.reward.cat, R.reward.id, R.reward.name);
        rs.michelin++;
        this.celebrate(`MICHELIN STAR ${rs.michelin}!`, '+500 coins · renovate again for the next star');
      }
      rs.levels = AREAS.map(() => 0);
    }
    p.persist();
  }

  // ------------------------------------------------------------------ pass

  private passClaimable(): number {
    const p = this.progress.pass;
    if (p.season !== currentSeason().n) return 0;
    const reached = Math.min(PASS_TIERS, Math.floor(p.xp / PASS_XP));
    let n = 0;
    for (let i = 0; i < reached; i++) {
      if (!p.free.includes(i)) n++;
      if (p.premium && !p.prem.includes(i)) n++;
    }
    return n;
  }

  private drawPass(): void {
    this.addXp(0); // makes sure the pass is on the current season
    const p = this.progress.pass;
    const season = currentSeason();
    const reached = Math.min(PASS_TIERS, Math.floor(p.xp / PASS_XP));
    const th = season.theme;
    const f = this.screenBegin(`${th.icon} ${th.name.toUpperCase()}`, `Sushi Pass season ${season.n} · ${timeLeft(season.end)} · XP from chefs, missions, PERFECTs`);
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 74, 'rgba(60,20,80,0.95)');
    this.ctx.fillStyle = th.color;
    this.roundRect(16, y, 8, 74, 4);
    this.ctx.fill();
    this.text(th.icon, WORLD_W - 46, y + 62, 18, '#fff', 400);
    this.text(`Tier ${reached}/${PASS_TIERS}`, 32, y + 22, 16, '#fff', 900, 'left');
    this.text(reached >= PASS_TIERS ? 'Season complete!' : `${p.xp % PASS_XP}/${PASS_XP} XP to tier ${reached + 1}`, WORLD_W - 32, y + 22, 11, '#e0aaff', 700, 'right');
    this.bar(32, y + 38, WORLD_W - 64, reached >= PASS_TIERS ? 1 : (p.xp % PASS_XP) / PASS_XP, '#e0aaff', 9);
    this.text(p.premium ? '✓ Premium track unlocked' : `Premium: more rewards + ${th.prize} · ${PRODUCTS.pass.price}`, 32, y + 62, 11, p.premium ? '#8fdc93' : '#ffd34d', 800, 'left');
    if (!p.premium) this.listTap(16, y, WORLD_W - 32, 74, f, () => this.buy('pass'));
    y += 84;
    this.text('FREE', 120, y + 8, 11, 'rgba(255,255,255,0.7)', 900);
    this.text('PREMIUM', 290, y + 8, 11, '#e0aaff', 900);
    y += 18;
    for (let i = 0; i < PASS_TIERS; i++) {
      const got = i < reached;
      this.card(16, y, WORLD_W - 32, 54, got ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.85)');
      this.ctx.fillStyle = got ? '#ffd34d' : 'rgba(255,255,255,0.2)';
      this.ctx.beginPath();
      this.ctx.arc(38, y + 27, 15, 0, Math.PI * 2);
      this.ctx.fill();
      this.text(String(i + 1), 38, y + 28, 12, got ? '#4a2a00' : '#fff', 900);
      for (const prem of [false, true]) {
        const r = passReward(i, prem, season.n);
        const cx = prem ? 290 : 120;
        const claimed = (prem ? p.prem : p.free).includes(i);
        const can = got && !claimed && (!prem || p.premium);
        this.text(r.label, cx, y + 18, 11, prem && !p.premium ? 'rgba(224,170,255,0.6)' : '#fff', 700);
        if (claimed) this.text('✓ claimed', cx, y + 38, 10, '#8fdc93', 800);
        else if (can) this.pill(cx - 40, y + 26, 80, 'CLAIM', f, () => { (prem ? p.prem : p.free).push(i); this.giveReward(r); this.progress.persist(); }, 'gold');
        else this.text(prem && !p.premium ? '🔒 premium' : 'locked', cx, y + 38, 10, 'rgba(255,255,255,0.4)', 700);
      }
      y += 60;
    }
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ companions

  private drawPets(): void {
    const p = this.progress;
    const slots = p.rank >= 10 ? 2 : 1;
    const f = this.screenBegin('COMPANIONS', `${slots} slot${slots > 1 ? 's' : ''} · 2 slots at Chef Rank 10 · shards from chests, Pass and Crew`);
    let y = f.y0 + 4;
    for (const c of COMPANIONS) {
      const shards = p.shards[c.id] ?? 0;
      const lv = companionLevel(shards);
      const next = shardsForNext(shards);
      const on = p.companions.includes(c.id);
      this.card(16, y, WORLD_W - 32, 92, on ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(c.emoji, 52, y + 46, 40, '#fff', 400);
      this.text(`${c.name}  ${lv ? `Lv ${lv}` : '🔒'}`, 92, y + 20, 15, '#fff', 900, 'left');
      this.text(lv ? c.power(lv) : `Unlock: ${c.power(1)}`, 92, y + 40, 11, 'rgba(255,255,255,0.8)', 600, 'left');
      if (next) {
        this.bar(92, y + 56, 150, next.have / next.need, '#ffd34d');
        this.text(`${next.have}/${next.need} shards`, 92, y + 76, 10.5, 'rgba(255,255,255,0.7)', 700, 'left');
      } else this.text('MAX LEVEL', 92, y + 64, 11, '#ffd34d', 900, 'left');
      if (lv) {
        this.pill(WORLD_W - 116, y + 30, 86, on ? 'EQUIPPED' : 'EQUIP', f, () => {
          if (on) p.companions = p.companions.filter((x) => x !== c.id);
          else p.companions = [...p.companions, c.id].slice(-slots);
          p.persist();
        }, on ? 'quiet' : 'gold');
      }
      y += 100;
    }
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ story

  /** Queues a chapter's opening or ending, once ever (re-readable from the Story screen). */
  private queueStory(ch: number, end: boolean): void {
    const chapter = ch < CHAPTERS.length ? CHAPTERS[ch] : ch === CHAPTERS.length && !end ? ENDLESS_CHAPTER : null;
    const key = `story:${ch}:${end ? 'end' : 'start'}`;
    if (!chapter || this.progress.seen.includes(key)) return;
    this.progress.seen.push(key);
    this.progress.persist();
    this.storyQueue.push({ ch: chapter, lines: end ? chapter.end : chapter.start, end });
  }

  /** Story panel: a little comic frame with the scene, the player's chef and the chapter text. */
  private drawStoryCard(blocker: () => void): void {
    const { ctx } = this;
    const st = this.story!;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    ctx.fillStyle = 'rgba(12,6,18,0.9)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    const y = midY - 220;
    this.card(24, y, WORLD_W - 48, 420, '#fff8eb');
    // Scene panel.
    const g = ctx.createLinearGradient(0, y + 14, 0, y + 184);
    g.addColorStop(0, st.end ? '#ffd27a' : '#7fc8ff');
    g.addColorStop(1, st.end ? '#ff8a5b' : '#c9a7ff');
    ctx.fillStyle = g;
    this.roundRect(38, y + 14, WORLD_W - 76, 170, 12);
    ctx.fill();
    ctx.save();
    this.roundRect(38, y + 14, WORLD_W - 76, 170, 12);
    ctx.clip();
    const scene = st.ch.scene;
    scene.forEach((e, i) => this.text(e, 236 + (i - (scene.length - 1) / 2) * 64, y + 76 + Math.sin(this.time * 2 + i) * 4, 40, '#fff', 400));
    drawChef(ctx, avatarChef(this.progress.avatar), 92, y + 150, 0.8, st.end ? 'happy' : 'focused', 200, y + 70, this.time);
    ctx.restore();
    ctx.strokeStyle = '#4a2618';
    ctx.lineWidth = 3;
    this.roundRect(38, y + 14, WORLD_W - 76, 170, 12);
    ctx.stroke();
    this.fitText(st.ch.title.toUpperCase(), cx, y + 212, WORLD_W - 80, 17, '#c4501f', 'center', 700);
    if (st.end) this.text('CHAPTER COMPLETE', cx, y + 234, 11, '#2a9d5c', 700);
    let ty = y + 262;
    for (const line of st.lines) ty = this.wrapText(line, cx, ty, WORLD_W - 90, 14, '#4a2618') + 6;
    this.button(cx - 90, y + 356, 180, 46, st.end ? 'ONWARD!' : 'LET’S COOK!', () => { this.story = null; }, 'gold');
  }

  private drawStory(): void {
    const p = this.progress;
    const f = this.screenBegin('STORY', 'A new chapter every 10 levels');
    let y = f.y0 + 4;
    [...CHAPTERS, ENDLESS_CHAPTER].forEach((ch, i) => {
      const open = p.unlocked > i * 10;
      const done = i < CHAPTERS.length && p.unlocked > (i + 1) * 10;
      this.card(16, y, WORLD_W - 32, 76, open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.text(open ? ch.scene[0] : '🔒', 48, y + 38, 28, '#fff', 400);
      this.fitText(ch.title, 80, y + 22, WORLD_W - 190, 14, open ? '#fff' : 'rgba(255,255,255,0.5)', 'left', 700);
      this.fitText(open ? ch.start[0] : `Reach level ${i * 10 + 1}`, 80, y + 44, WORLD_W - 190, 11, 'rgba(255,255,255,0.7)', 'left');
      this.text(done ? '✓ Complete' : open ? 'In progress' : '', 80, y + 62, 10.5, done ? '#8fdc93' : '#ffd34d', 700, 'left');
      if (open) this.pill(WORLD_W - 100, y + 22, 70, 'READ', f, () => { this.story = { ch, lines: done ? [...ch.start, ...ch.end] : ch.start, end: done }; }, 'quiet');
      y += 84;
    });
    this.screenEnd(f, y - f.y0);
  }

  // --------------------------------------------------------- regulars

  private addHearts(who: number, n: number): void {
    const r = REGULARS[who];
    const p = this.progress;
    const before = heartLevel(p.hearts[r.id] ?? 0);
    p.hearts[r.id] = (p.hearts[r.id] ?? 0) + n;
    const after = heartLevel(p.hearts[r.id]);
    if (after > before) {
      this.bankCoins(HEART_REWARDS[after]);
      this.showToast(`${r.emoji} ${r.name} is now your ${HEART_TITLES[after]}! +${HEART_REWARDS[after]}`);
    }
    p.persist();
  }

  private drawRegulars(): void {
    const p = this.progress;
    const f = this.screenBegin('REGULARS', 'Serve them to earn hearts · friends make special requests');
    let y = f.y0 + 4;
    for (const r of REGULARS) {
      const open = r.level <= p.unlocked;
      const h = p.hearts[r.id] ?? 0;
      const lv = heartLevel(h);
      this.card(16, y, WORLD_W - 32, 96, open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.dot(52, y + 40, 26, open ? 'rgba(255,143,184,0.25)' : 'rgba(255,255,255,0.08)');
      this.text(open ? r.emoji : '❔', 52, y + 41, 30, '#fff', 400);
      if (!open) {
        this.text('Someone new', 92, y + 26, 14, 'rgba(255,255,255,0.6)', 700, 'left');
        this.text(`Starts visiting at level ${r.level}`, 92, y + 48, 11, 'rgba(255,255,255,0.5)', 600, 'left');
        y += 104;
        continue;
      }
      this.fitText(r.name, 92, y + 20, 150, 14, '#fff', 'left', 700);
      this.text(`${'♥'.repeat(lv)}${'♡'.repeat(HEART_LEVELS.length - 1 - lv)}`, WORLD_W - 32, y + 20, 13, '#ff5d8f', 700, 'right');
      this.fitText(`${HEART_TITLES[lv]} · loves ${r.favorite}`, 92, y + 40, WORLD_W - 140, 11, '#ffd34d', 'left', 700);
      this.fitText(`“${r.lines[lv]}”`, 92, y + 58, WORLD_W - 140, 11, 'rgba(255,255,255,0.8)', 'left');
      const next = HEART_LEVELS[lv + 1];
      if (next) {
        const prev = HEART_LEVELS[lv];
        this.bar(92, y + 74, WORLD_W - 190, (h - prev) / (next - prev), '#ff5d8f');
        this.text(`${h}/${next} · +${HEART_REWARDS[lv + 1]}`, WORLD_W - 32, y + 77.5, 10, 'rgba(255,255,255,0.7)', 700, 'right');
      } else this.text('Family forever ♥', 92, y + 78, 11, '#ff8fb8', 700, 'left');
      y += 104;
    }
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------- achievements

  private achValue(id: StatId): number {
    const p = this.progress;
    switch (id) {
      case 'level': return p.unlocked;
      case 'stars': return p.totalStars;
      case 'rank': return p.rank;
      case 'height': return Math.max(p.stats.height ?? 0, this.best);
      case 'puzzles': return p.puzzleStars.reduce((a, b) => a + (b || 0), 0);
      case 'hearts': return Object.values(p.hearts).reduce((a, b) => a + b, 0);
      case 'pictures': return p.gallery.done.length;
      default: return p.stats[id] ?? 0;
    }
  }

  /** Announces newly reached achievement tiers (rewards are claimed on the Achievements screen). */
  private checkAchievements(): void {
    const p = this.progress;
    let changed = false;
    for (const fam of ACHIEVEMENTS) {
      const t = achTier(fam, this.achValue(fam.id));
      const seen = p.achSeen[fam.id] ?? 0;
      if (t > seen) {
        // Achievements already earned before this update are granted quietly.
        if (p.seen.includes('ach:ready')) this.showToast(`🏆 ${fam.name} ${ACH_TIER_NAMES[t - 1]} unlocked!`);
        p.achSeen[fam.id] = t;
        changed = true;
      }
    }
    if (!p.seen.includes('ach:ready')) {
      p.seen.push('ach:ready');
      changed = true;
    }
    if (changed) p.persist();
  }

  private achClaimable(): number {
    const p = this.progress;
    return ACHIEVEMENTS.reduce((n, fam) => n + Math.max(0, (p.achSeen[fam.id] ?? 0) - (p.achClaimed[fam.id] ?? 0)), 0);
  }

  private drawTrophies(): void {
    const p = this.progress;
    const total = ACHIEVEMENTS.reduce((n, fam) => n + (p.achSeen[fam.id] ?? 0), 0);
    const f = this.screenBegin('ACHIEVEMENTS', `${total}/${ACHIEVEMENTS.length * 4} unlocked · claim coins for each tier`);
    let y = f.y0 + 4;
    for (const fam of ACHIEVEMENTS) {
      const v = this.achValue(fam.id);
      const tier = p.achSeen[fam.id] ?? 0;
      const claimed = p.achClaimed[fam.id] ?? 0;
      const next = fam.tiers[tier];
      this.card(16, y, WORLD_W - 32, 74, tier >= 4 ? 'rgba(90,70,20,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(fam.icon, 46, y + 30, 26, '#fff', 400);
      // Tier pips under the icon.
      for (let k = 0; k < 4; k++) this.dot(31 + k * 10, y + 58, 3.5, k < tier ? '#ffd34d' : 'rgba(255,255,255,0.2)');
      this.text(`${fam.name} ${tier ? ACH_TIER_NAMES[tier - 1] : ''}`, 80, y + 20, 14, '#fff', 700, 'left');
      this.fitText(next ? fam.desc(next) : 'All tiers complete!', 80, y + 40, 180, 11, 'rgba(255,255,255,0.75)', 'left');
      if (next) this.bar(80, y + 54, 170, v / next, '#ffd34d');
      if (claimed < tier) {
        const reward = ACH_REWARDS.slice(claimed, tier).reduce((a, b) => a + b, 0);
        this.pill(WORLD_W - 112, y + 21, 82, `+${reward}`, f, () => {
          p.achClaimed[fam.id] = tier;
          p.persist();
          this.bankCoins(reward);
          this.showToast(`${fam.icon} ${fam.name}: +${reward} coins`);
          sfx.coin();
        }, 'gold');
      } else this.text(next ? `${Math.min(v, next).toLocaleString('en')}/${next.toLocaleString('en')}` : '★★★★', WORLD_W - 32, y + 38, 11, 'rgba(255,255,255,0.7)', 700, 'right');
      y += 82;
    }
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ gallery

  /** Every few PERFECTs reveal a tile of the current picture; a full picture pays out. */
  private galleryPerfect(): void {
    const g = this.progress.gallery;
    if (g.pic >= PICTURES.length) return;
    if (++g.perfects < PERFECTS_PER_TILE) return;
    g.perfects = 0;
    const hidden = [...Array(GALLERY_TILES).keys()].filter((i) => !g.tiles.includes(i));
    g.tiles.push(hidden[Math.floor(Math.random() * hidden.length)]);
    if (this.mode === 'playing') this.popup(WORLD_W / 2, this.top.y - 92, `🖼️ Picture tile ${g.tiles.length}/${GALLERY_TILES}`, '#9fe3ff', 13, 1.4);
    if (g.tiles.length >= GALLERY_TILES) {
      g.done.push(g.pic);
      this.bankCoins(PICTURE_REWARD);
      this.celebrate(`🖼️ ${PICTURES[g.pic].name.toUpperCase()}`, `Picture complete! +${PICTURE_REWARD} coins`);
      g.pic++;
      g.tiles = [];
    }
    this.progress.persist();
  }

  /** Draws a gallery picture; tiles not in `shown` are covered (null shows everything). */
  private drawPicture(pic: Picture, x: number, y: number, size: number, shown: number[] | null): void {
    const { ctx } = this;
    ctx.save();
    this.roundRect(x, y, size, size, 12);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + size);
    g.addColorStop(0, pic.sky[0]);
    g.addColorStop(1, pic.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
    for (const [e, ex, ey, es] of pic.items) {
      ctx.font = `${size * es}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e, x + ex * size, y + ey * size);
    }
    if (shown) {
      const t = size / 4;
      for (let i = 0; i < GALLERY_TILES; i++) {
        if (shown.includes(i)) continue;
        const tx = x + (i % 4) * t;
        const ty = y + Math.floor(i / 4) * t;
        ctx.fillStyle = (i + Math.floor(i / 4)) % 2 ? '#3a2a45' : '#33243d';
        ctx.fillRect(tx, ty, t, t);
        this.text('?', tx + t / 2, ty + t / 2, t * 0.35, 'rgba(255,255,255,0.25)', 700);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * t, y);
        ctx.lineTo(x + k * t, y + size);
        ctx.moveTo(x, y + k * t);
        ctx.lineTo(x + size, y + k * t);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawGallery(): void {
    const g = this.progress.gallery;
    const f = this.screenBegin('GALLERY', `${g.done.length}/${PICTURES.length} pictures · every ${PERFECTS_PER_TILE} PERFECTs reveal a tile`);
    let y = f.y0 + 4;
    if (g.pic < PICTURES.length) {
      const pic = PICTURES[g.pic];
      this.card(16, y, WORLD_W - 32, 330);
      this.text(`NOW REVEALING · ${pic.name}`, WORLD_W / 2, y + 20, 13, '#ffd34d', 700);
      this.drawPicture(pic, WORLD_W / 2 - 130, y + 38, 260, g.tiles);
      this.text(`${g.tiles.length}/${GALLERY_TILES} tiles · next tile in ${PERFECTS_PER_TILE - g.perfects} PERFECT${PERFECTS_PER_TILE - g.perfects === 1 ? '' : 's'} · +${PICTURE_REWARD} when done`, WORLD_W / 2, y + 314, 11, 'rgba(255,255,255,0.8)', 700);
      y += 342;
    } else {
      this.card(16, y, WORLD_W - 32, 60);
      this.text('Gallery complete! You’re a true art lover.', WORLD_W / 2, y + 30, 13, '#ffd34d', 700);
      y += 72;
    }
    this.text('COLLECTION', 24, y + 8, 12, 'rgba(255,255,255,0.7)', 700, 'left');
    y += 20;
    const cw = (WORLD_W - 32 - 16) / 3;
    PICTURES.forEach((pic, i) => {
      const x = 16 + (i % 3) * (cw + 8);
      const yy = y + Math.floor(i / 3) * (cw + 30);
      const done = g.done.includes(i);
      if (done) this.drawPicture(pic, x, yy, cw, null);
      else {
        this.card(x, yy, cw, cw, 'rgba(255,255,255,0.06)');
        this.text(i === g.pic ? '🖌️' : '🔒', x + cw / 2, yy + cw / 2, 24, '#fff', 400);
      }
      this.fitText(done || i === g.pic ? pic.name : '???', x + cw / 2, yy + cw + 12, cw, 11, done ? '#fff' : 'rgba(255,255,255,0.5)', 'center', 700);
    });
    y += Math.ceil(PICTURES.length / 3) * (cw + 30);
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------- avatar

  private drawAvatar(): void {
    const p = this.progress;
    const a = p.avatar;
    const f = this.screenBegin('MY CHEF', 'Your chef appears on the home screen, story and share cards');
    const { ctx } = this;
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 200, 'rgba(255,248,235,0.95)');
    ctx.save();
    this.roundRect(16, y, WORLD_W - 32, 200, 14);
    ctx.clip();
    drawChef(ctx, avatarChef(a), WORLD_W / 2, y + 100, 1.15, 'happy', WORLD_W / 2, y + 240, this.time);
    ctx.restore();
    y += 210;
    this.text(`Chef ${a.name}`, WORLD_W / 2, y + 14, 20, '#fff', 700);
    y += 32;
    const o = AVATAR_OPTIONS;
    type Key = Exclude<keyof Avatar, 'name'>;
    const rows: [string, Key, number, (i: number) => string][] = [
      ['Skin', 'skin', o.skin.length, (i) => `Tone ${i + 1}`],
      ['Hair', 'hair', o.hair.length, (i) => AVATAR_LABELS.hair[i]],
      ['Hair colour', 'hairColor', o.hairColor.length, (i) => `Colour ${i + 1}`],
      ['Hat', 'hat', o.hat.length, (i) => AVATAR_LABELS.hat[i]],
      ['Outfit', 'outfit', o.outfit.length, (i) => `Style ${i + 1}`],
      ['Accent', 'accent', o.accent.length, (i) => `Colour ${i + 1}`],
      ['Face', 'face', o.face.length, (i) => AVATAR_LABELS.face[i]],
    ];
    const hatOpen = (i: number) => !AVATAR_LOCKS[i] || p.unlocked >= AVATAR_LOCKS[i].level;
    const row = (label: string, value: string, swatch: string | null, step: (d: number) => void) => {
      this.card(16, y, WORLD_W - 32, 46);
      this.text(label, 30, y + 23, 13, 'rgba(255,255,255,0.8)', 700, 'left');
      if (swatch) this.dot(196, y + 23, 9, swatch);
      this.fitText(value, 268, y + 23, 108, 13, '#fff', 'center', 700);
      this.pill(150, y + 7, 30, '◀', f, () => step(-1), 'quiet');
      this.pill(WORLD_W - 46, y + 7, 30, '▶', f, () => step(1), 'quiet');
      y += 52;
    };
    row('Name', a.name, null, (d) => { a.name = NAMES[(NAMES.indexOf(a.name) + d + NAMES.length) % NAMES.length]; p.persist(); });
    for (const [label, key, n, name] of rows) {
      const list = (o as unknown as Record<string, string[]>)[key];
      const isColor = list[0].startsWith('#');
      const locked = key === 'hat' && !hatOpen(a.hat);
      row(label, locked ? `🔒 ${name(a[key])}` : name(a[key]), isColor ? list[a[key]] : null, (d) => { a[key] = (a[key] + d + n) % n; p.persist(); });
      if (locked) {
        this.text(AVATAR_LOCKS[a.hat].text, WORLD_W / 2, y - 2, 10, '#ffd34d', 700);
        y += 12;
      }
    }
    this.pill(16, y + 4, (WORLD_W - 40) / 2, '🎲 RANDOM', f, () => {
      const r = (n: number) => Math.floor(Math.random() * n);
      let hat = r(o.hat.length);
      while (!hatOpen(hat)) hat = r(o.hat.length);
      Object.assign(a, { name: NAMES[r(NAMES.length)], skin: r(o.skin.length), hair: r(o.hair.length), hairColor: r(o.hairColor.length), hat, outfit: r(o.outfit.length), accent: r(o.accent.length), face: r(o.face.length) });
      p.persist();
    }, 'quiet');
    this.pill(24 + (WORLD_W - 40) / 2, y + 4, (WORLD_W - 40) / 2, 'DONE', f, () => { if (!hatOpen(a.hat)) a.hat = 0; p.persist(); this.mode = this.screenBack; }, 'gold');
    y += 44;
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ intro

  private updateIntro(real: number): void {
    const it = this.intro!;
    it.prev = it.t;
    it.t += real;
    const cross = (a: number) => it.prev < a && it.t >= a;
    if (it.stage === 'logo') {
      for (let i = 0; i < 5; i++) if (cross(0.34 + i * 0.13)) { sfx.drop(); haptic.light(); }
      if (cross(0.85)) sfx.whoosh();
      if (cross(1.35)) sfx.sting();
      const end = settings.reducedMotion ? 0.9 : it.full ? LOGO_TIME + 0.5 : LOGO_SHORT;
      if (it.t >= end) this.advanceIntro();
    } else {
      if (it.panel === 1) {
        if (cross(0.2)) sfx.shutter();
        for (let i = 0; i < 4; i++) if (cross(1.0 + i * 0.22)) sfx.light(i);
        if (cross(1.6)) sfx.serve();
      }
      if (it.panel === 2 && cross(0.45)) { sfx.slice(); haptic.medium(); }
      if (it.panel < 2 && it.t >= PANEL_TIME) this.advanceIntro();
    }
  }

  /** Tap or timer: logo → story panels → the first run (new players) or the home screen. */
  private advanceIntro(): void {
    const it = this.intro!;
    if (it.stage === 'logo') {
      if (!it.full) return this.finishIntro(false);
      it.stage = 'story';
      it.panel = 0;
      it.t = it.prev = 0;
      return;
    }
    // Tapping while the caption is still typing finishes the caption first.
    if (it.t < 1.2 && it.panel < 2) {
      it.t = it.prev = 1.2;
      return;
    }
    if (it.panel < 2) {
      it.panel++;
      it.t = it.prev = 0;
      sfx.whoosh();
      return;
    }
    if (it.t > 1.0) this.finishIntro(false);
  }

  private finishIntro(skipped: boolean): void {
    const it = this.intro!;
    this.intro = null;
    if (!it.full) return;
    const p = this.progress;
    if (!p.seen.includes('intro')) p.seen.push('intro', 'story:0:start'); // the intro tells chapter 1's opening
    p.persist();
    track('intro', { skipped, panel: it.panel });
    this.startRun(); // straight into the first drop, skipped or not
  }

  private drawIntro(): void {
    const { ctx } = this;
    const it = this.intro!;
    const L = -this.offX;
    const W = WORLD_W + this.offX * 2;
    const H = this.viewH;
    if (it.stage === 'logo') {
      const g = ctx.createRadialGradient(WORLD_W / 2, H * 0.42, 20, WORLD_W / 2, H * 0.42, H * 0.75);
      g.addColorStop(0, '#5a2a5e');
      g.addColorStop(1, '#1a0d20');
      ctx.fillStyle = g;
      ctx.fillRect(L, 0, W, H);
      const t = settings.reducedMotion ? 99 : it.t;
      // Soft spotlight that grows as the stack lands.
      const sp = ctx.createRadialGradient(WORLD_W / 2, H * 0.4, 0, WORLD_W / 2, H * 0.4, 60 + Math.min(1, t) * 140);
      sp.addColorStop(0, 'rgba(255,190,110,0.35)');
      sp.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = sp;
      ctx.fillRect(L, 0, W, H);
      drawLogo(ctx, t, WORLD_W / 2, H * 0.42, t > 1.45 ? tr('introTag') : '');
      logoSparkles(ctx, t, WORLD_W / 2, H * 0.42);
      // Fade out at the end.
      const end = it.full ? LOGO_TIME + 0.5 : LOGO_SHORT;
      if (!settings.reducedMotion && it.t > end - 0.3) {
        ctx.fillStyle = `rgba(10,5,15,${Math.min(1, (it.t - (end - 0.3)) / 0.3)})`;
        ctx.fillRect(L, 0, W, H);
      }
    } else {
      const o = { ctx, t: it.t, L, W, H, me: avatarChef(this.progress.avatar), rival: chefFor(1) };
      if (it.panel === 0) panelClosed(o);
      else if (it.panel === 1) panelReopen(o);
      else panelRival(o);
      // Fade in from black at the start of each panel.
      if (it.t < 0.3) {
        ctx.fillStyle = `rgba(10,5,15,${1 - it.t / 0.3})`;
        ctx.fillRect(L, 0, W, H);
      }
      caption(ctx, [t('intro1'), t('intro2'), t('intro3')][it.panel], Math.max(0, it.t - 0.3), H - this.insets.bottom - 120);
      // Progress dots, and TAP TO START on the last panel.
      for (let i = 0; i < 3; i++) this.dot(WORLD_W / 2 - 16 + i * 16, H - this.insets.bottom - 70, 4.5, i === it.panel ? '#ffd34d' : 'rgba(255,255,255,0.35)');
      if (it.panel === 2 && it.t > 1.0) {
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(it.t * 5);
        logoText(ctx, t('tapStart'), WORLD_W / 2, H - this.insets.bottom - 40, 20, '#ffffff', '#ffe2c6');
        ctx.globalAlpha = 1;
      }
    }
    // SKIP is always there.
    this.button(WORLD_W - 92 - this.insets.right, this.insets.top + 14, 80, 32, `${t('skip')} ›`, () => this.finishIntro(true), 'quiet');
  }

  // ------------------------------------------------------------ leagues

  private checkLeague(): void {
    const p = this.progress;
    const before = p.league;
    p.league = settleLeague(p.league, p.inviteCode);
    if (p.league !== before) {
      const r = p.league.result;
      if (r) {
        if (r.coins) this.bankCoins(r.coins);
        const L = LEAGUES[p.league.tier];
        this.celebrate(r.moved > 0 ? `${L.icon} PROMOTED TO ${L.name.toUpperCase()}!` : r.moved < 0 ? `${L.icon} Back to ${L.name}` : `${L.icon} STAYED IN ${L.name.toUpperCase()}`, `Last week you finished #${r.rank}${r.coins ? ` · +${r.coins} coins` : ''}`);
        track('league_end', { rank: r.rank, tier: r.tier, moved: r.moved });
      }
      p.persist();
    }
  }

  private leaguePts(n: number): void {
    const p = this.progress;
    if (this.lockedAt('events')) return;
    this.checkLeague();
    p.league.pts += n;
  }

  private leagueTable(): { name: string; pts: number; me: boolean }[] {
    const p = this.progress;
    return [...leagueRivals(p.league.week, p.league.tier, p.inviteCode).map((x) => ({ ...x, me: false })), { name: `YOU · ${p.avatar.name}`, pts: p.league.pts, me: true }]
      .sort((a, b) => b.pts - a.pts || (a.me ? -1 : 1));
  }

  private drawLeague(): void {
    this.checkLeague();
    const { ctx } = this;
    const p = this.progress;
    const L = LEAGUES[p.league.tier];
    const f = this.screenBegin(`${L.icon} ${L.name.toUpperCase()} LEAGUE`, `Top ${PROMOTE} move up · bottom ${DEMOTE} move down · ${timeLeft(leagueWeek().end)} · rivals are AI`);
    let y = f.y0 + 4;
    // Tier ladder.
    const cw = (WORLD_W - 32) / LEAGUES.length;
    LEAGUES.forEach((lg, i) => {
      const on = i === p.league.tier;
      this.text(lg.icon, 16 + cw * i + cw / 2, y + 18, on ? 26 : 18, '#fff', 400);
      if (on) this.dot(16 + cw * i + cw / 2, y + 40, 3.5, lg.color);
      ctx.globalAlpha = i <= p.league.tier ? 1 : 0.35;
      this.fitText(lg.name, 16 + cw * i + cw / 2, y + 50, cw - 2, 8.5, '#fff', 'center', 700);
      ctx.globalAlpha = 1;
    });
    y += 62;
    this.wrapLeft('Earn points: +10 per chef beaten, +5 if flawless, +1 per PERFECT, +20 for the Daily Special. Top 3 win 500 / 350 / 250 coins.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 36;
    const table = this.leagueTable();
    table.forEach((row, i) => {
      const rank = i + 1;
      const zone = rank <= PROMOTE && p.league.tier < LEAGUES.length - 1 ? 'up' : rank > LEAGUE_SIZE - DEMOTE && p.league.tier > 0 ? 'down' : '';
      this.card(16, y, WORLD_W - 32, 34, row.me ? 'rgba(110,80,10,0.95)' : zone === 'up' ? 'rgba(30,70,45,0.9)' : zone === 'down' ? 'rgba(80,25,30,0.9)' : 'rgba(48,30,52,0.9)');
      this.text(`${rank}`, 36, y + 17, 12, rank <= 3 ? '#ffd34d' : 'rgba(255,255,255,0.7)', 700);
      this.fitText(row.name, 56, y + 17, 210, 12, row.me ? '#ffd34d' : '#fff', 'left', 700);
      this.text(`${row.pts}`, WORLD_W - 32, y + 17, 12.5, '#fff', 700, 'right');
      if (rank === PROMOTE && zone) this.text('▲ promotion line', WORLD_W - 90, y + 30, 8, '#8fdc93', 700, 'right');
      y += 38;
    });
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ streak quest

  private get quest() {
    const q = currentQuest();
    const p = this.progress;
    if (p.quest.key !== q.key) p.quest = { key: q.key, joined: false, stage: 0, out: false, claimed: false };
    return p.quest;
  }

  private questWin(): void {
    const q = this.quest;
    if (!q.joined || q.out || q.stage >= QUEST_STAGES) return;
    q.stage++;
    if (q.stage >= QUEST_STAGES) this.celebrate('🌋 STREAK QUEST CLEARED!', 'Claim your share of the 10,000 coins in Events');
    else this.showToast(`🌋 Streak Quest: ${q.stage}/${QUEST_STAGES}`);
    this.progress.persist();
  }

  private questLose(): void {
    const q = this.quest;
    if (!q.joined || q.out || q.stage >= QUEST_STAGES) return;
    q.out = true;
    this.showToast('🌋 Out of the Streak Quest! A new one starts soon.');
  }

  private drawQuest(): void {
    const { ctx } = this;
    const q = this.quest;
    const surv = questSurvivors(q.key);
    const f = this.screenBegin('🌋 STREAK QUEST', `Beat ${QUEST_STAGES} chefs · don’t end a run empty-handed · ${timeLeft(currentQuest().end)} · AI rivals`);
    let y = f.y0 + 4;
    // The lava path: 7 platforms rising up the volcano.
    const h = 380;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#2a0d1a');
    g.addColorStop(1, '#ff5a1f');
    ctx.fillStyle = g;
    this.roundRect(16, y, WORLD_W - 32, h, 16);
    ctx.fill();
    // Lava bubbles.
    for (let i = 0; i < 10; i++) {
      const bx = 30 + ((i * 47 + this.time * 20) % (WORLD_W - 60));
      this.dot(bx, y + h - 14 - Math.abs(Math.sin(this.time * 2 + i)) * 8, 3 + (i % 3), '#ffd34d');
    }
    for (let s = 0; s <= QUEST_STAGES; s++) {
      const px = 70 + (s % 2) * 200 + (s === QUEST_STAGES ? 100 - (s % 2) * 200 : 0);
      const py = y + h - 40 - s * ((h - 70) / QUEST_STAGES);
      ctx.fillStyle = s <= q.stage ? '#8fdc93' : '#5a3a22';
      this.roundRect(px - 34, py - 6, 68, 14, 7);
      ctx.fill();
      this.text(s === QUEST_STAGES ? '🏆' : `${s}`, px, py - 16, s === QUEST_STAGES ? 22 : 11, '#fff', 700);
      this.text(`${surv[s]} left`, px + (s % 2 ? -56 : 56), py + 1, 9.5, 'rgba(255,255,255,0.8)', 700);
      if (s === q.stage && q.joined && !q.out) drawChef(ctx, avatarChef(this.progress.avatar), px, py - 30, 0.32, 'happy', px, py + 40, this.time);
    }
    y += h + 10;
    const share = Math.floor(QUEST_POT / surv[QUEST_STAGES]);
    this.card(16, y, WORLD_W - 32, 84, 'rgba(70,25,20,0.95)');
    if (!q.joined) {
      this.text('100 players · 7 stages · 10,000 coins', 32, y + 22, 13, '#ffd34d', 700, 'left');
      this.fitText('Beat chefs in journey runs. A run that beats no chef knocks you out.', 32, y + 44, WORLD_W - 64, 10.5, 'rgba(255,255,255,0.8)', 'left');
      this.pill(32, y + 54, WORLD_W - 64, 'JOIN THE QUEST', f, () => { q.joined = true; this.progress.persist(); track('quest_join'); }, 'gold');
    } else if (q.out) {
      this.text('Knocked out at stage ' + q.stage, 32, y + 24, 14, '#ff9a8a', 700, 'left');
      this.text(`A new quest starts in ${timeLeft(currentQuest().end)}`, 32, y + 48, 11, 'rgba(255,255,255,0.75)', 600, 'left');
    } else if (q.stage >= QUEST_STAGES) {
      this.text(`You made it! ${surv[QUEST_STAGES]} survivors share the pot`, 32, y + 24, 12.5, '#8fdc93', 700, 'left');
      if (!q.claimed) this.pill(32, y + 44, WORLD_W - 64, `CLAIM ${share} COINS`, f, () => { q.claimed = true; this.bankCoins(share); this.celebrate('🌋 +' + share + ' COINS', 'Your share of the Streak Quest pot'); this.progress.persist(); }, 'gold');
      else this.text('✓ Claimed', 32, y + 56, 12, '#8fdc93', 700, 'left');
    } else {
      this.text(`Stage ${q.stage}/${QUEST_STAGES} · ${surv[q.stage]} players left`, 32, y + 24, 13, '#ffd34d', 700, 'left');
      this.fitText(`Finish to share ${QUEST_POT.toLocaleString('en')} coins (about ${share} each)`, 32, y + 46, WORLD_W - 64, 11, 'rgba(255,255,255,0.8)', 'left');
      this.pill(32, y + 54, WORLD_W - 64, 'PLAY', f, () => this.startRun(), 'gold');
    }
    y += 92;
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ nemesis

  /** The chef who has beaten you most (at least NEMESIS_AT times), if any. */
  private nemesisLevel(): number {
    let best = 0;
    let most = NEMESIS_AT - 1;
    for (const [lv, n] of Object.entries(this.progress.losses)) {
      if (n > most && this.progress.canEnter(Number(lv))) {
        most = n;
        best = Number(lv);
      }
    }
    return best;
  }

  private nemesisPower(): number {
    const lv = this.nemesisLevel();
    return lv ? Math.min(5, (this.progress.losses[lv] ?? 0) - NEMESIS_AT + 1) : 0;
  }

  private isNemesis(): boolean {
    return this.journey && this.level === this.nemesisLevel();
  }

  private nemesisReward(): number {
    return 150 + 100 * this.nemesisPower();
  }

  private beatNemesis(level: number): void {
    const p = this.progress;
    const reward = this.nemesisReward();
    p.losses[level] = 0;
    if (!p.badges.includes('nemesis')) p.badges.push('nemesis');
    this.bankCoins(reward);
    this.celebrate('😈 NEMESIS DEFEATED!', `${chefFor(level).name} bows to you · +${reward} coins`);
    track('nemesis_beaten', { level });
    p.persist();
  }

  // ------------------------------------------------------------ twin layers

  /** Twins land where they are: a gap smaller than the PERFECT zone joins them cleanly. */
  private dropTwin(m: Layer): void {
    const top = this.top;
    const sep = this.twinSep;
    const tol = PERFECT_TOL + 2 + (settings.assist ? 3 : 0) + (this.fever > 0 ? 8 : 0);
    m.twin = false;
    if (sep <= tol) {
      m.x = top.x;
      m.w = top.w;
      this.combo++;
      this.orderStats.perfects++;
      this.lastPerfect = true;
      this.place(m);
      this.popup(m.x + m.w / 2, m.y - 18, this.combo > 1 ? `TWINS! PERFECT x${this.combo}` : 'TWINS! PERFECT', '#fff3b0', 18);
      this.mission('perfects');
      this.mission('streak', this.combo);
      this.sparkle(m.x, m.y + LAYER_H / 2, m.w, 24);
      sfx.perfect(this.combo);
      haptic.medium();
      return;
    }
    const w = top.w - sep * 2;
    this.lastPerfect = false;
    this.combo = 0;
    if (w < 6) {
      this.fall({ ...m, x: top.x - sep, w: m.w / 2 }, -1);
      this.fall({ ...m, x: top.x + m.w / 2 + sep, w: m.w / 2 }, 1);
      this.moving = null;
      this.die();
      return;
    }
    // The outer edge of each half hangs over and is sliced off.
    this.fall({ ...m, x: top.x - sep, w: sep }, -1);
    this.fall({ ...m, x: top.x + top.w - sep, w: sep }, 1);
    m.x = top.x + sep;
    m.w = w;
    this.orderStats.slices++;
    this.place(m);
    sfx.slice();
    haptic.light();
  }

  // ------------------------------------------------------------ rescue levels

  private startRescue(i: number): void {
    if (i > 0 && !(this.progress.rescueStars[i - 1] > 0)) return this.showToast('Finish the previous rescue first');
    this.startRun(RESCUES[i].level, 'rescue', { rescue: i });
  }

  /** Water rises (faster over time) or the quake clock ticks; tremors shove the top layer. */
  private updateRescue(real: number): void {
    const r = this.rescueRun;
    if (!r || this.mode !== 'playing' || this.perkChoice || this.story || this.picker) return;
    const rs = RESCUES[r.i];
    r.t += real;
    if (rs.kind === 'quake') {
      this.timeLeft = Math.max(0, rs.time - r.t);
      if ((r.tremor -= real) <= 0) {
        r.tremor = 3 + this.rand() * 2;
        this.runEvent('slam');
        this.popup(WORLD_W / 2, this.top.y - 60, '〰️ TREMOR!', '#ffb703', 18);
      }
      r.margin = this.timeLeft;
      if (this.timeLeft <= 0) {
        this.moving = null;
        this.die();
      }
      return;
    }
    if (r.t > 2) r.water -= rs.rise * LAYER_H * (1 + (r.t - 2) / 60) * real;
    r.margin = (r.water - this.top.y) / LAYER_H - 1;
    if (r.margin <= 0) {
      this.moving = null;
      sfx.slice();
      this.die();
    }
  }

  private rescueWon(): void {
    const r = this.rescueRun!;
    const rs = RESCUES[r.i];
    const stars = rescueStars(rs.kind, rs.kind === 'quake' ? this.timeLeft : r.margin);
    const p = this.progress;
    const first = !p.rescueStars[r.i];
    p.rescueStars[r.i] = Math.max(p.rescueStars[r.i] || 0, stars);
    this.addCoins(first ? 150 + r.i * 30 : 30, WORLD_W / 2, this.top.y - 80, 'Rescued!');
    this.resultKind = 'rescue-won';
    this.specialWon = true;
    this.mode = 'dead';
    this.deadAt = this.time;
    this.moving = null;
    this.bubble = { text: '👵 Thank you, dear!', life: 99 };
    this.celebrate('🆘 RESCUED!', `${rs.name} · ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`);
    track('rescue', { i: r.i, stars });
    this.endRun();
  }

  /** Rising water with waves, and grandma's stall bobbing on it. */
  private drawWater(): void {
    const r = this.rescueRun;
    if (!r || this.runMode !== 'rescue' || RESCUES[r.i].kind === 'quake') return;
    const { ctx } = this;
    const L = -this.offX;
    const W = WORLD_W + this.offX * 2;
    const y0 = r.water;
    ctx.fillStyle = 'rgba(40,120,200,0.55)';
    ctx.beginPath();
    ctx.moveTo(L, y0);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(L + x, y0 + Math.sin(this.time * 3 + x * 0.05) * 4);
    ctx.lineTo(L + W, this.camY + this.viewH + 50);
    ctx.lineTo(L, this.camY + this.viewH + 50);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) ctx.lineTo(L + x, y0 + Math.sin(this.time * 3 + x * 0.05) * 4);
    ctx.stroke();
    const bob = Math.sin(this.time * 2) * 3;
    this.qaSkip = true;
    this.text('🛖', 34, y0 - 16 + bob, 30, '#fff', 400);
    this.text('👵', 34, y0 - 40 + bob, 20, '#fff', 400);
    if (r.margin < 3) this.text('Hurry!', 70, y0 - 50 + bob, 12, '#ffffff', 700, 'left');
    this.qaSkip = false;
  }

  private drawRescues(): void {
    const p = this.progress;
    const f = this.screenBegin('🆘 RESCUE', 'Save grandma’s stall from floods, quakes and storms');
    let y = f.y0 + 4;
    RESCUES.forEach((rs, i) => {
      const open = i === 0 || p.rescueStars[i - 1] > 0;
      const st = p.rescueStars[i] || 0;
      this.card(16, y, WORLD_W - 32, 70, open ? (rs.kind === 'quake' ? 'rgba(80,60,20,0.95)' : rs.kind === 'storm' ? 'rgba(40,40,80,0.95)' : 'rgba(20,60,90,0.95)') : 'rgba(30,20,35,0.8)');
      this.text(open ? (rs.kind === 'quake' ? '〰️' : rs.kind === 'storm' ? '🌀' : '🌊') : '🔒', 44, y + 35, 24, '#fff', 400);
      this.text(`${i + 1}. ${rs.name}`, 72, y + 20, 14, open ? '#fff' : 'rgba(255,255,255,0.5)', 700, 'left');
      this.fitText(rs.kind === 'quake' ? `Stack ${rs.target} in ${rs.time}s · tremors` : `Stack ${rs.target} before the water reaches you`, 72, y + 40, 200, 10.5, 'rgba(255,255,255,0.75)', 'left');
      this.text('★'.repeat(st) + '☆'.repeat(3 - st), 72, y + 57, 11, st ? '#ffd34d' : 'rgba(255,255,255,0.3)', 700, 'left');
      if (open) this.pill(WORLD_W - 108, y + 19, 78, st ? 'REPLAY' : 'SAVE!', f, () => this.startRescue(i), st ? 'quiet' : 'gold');
      y += 78;
    });
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ omakase tower

  private towerState() {
    const p = this.progress;
    if (p.tower.week !== weekKey()) p.tower = { week: weekKey(), cp: 0, best: 0, claimed: [] };
    return p.tower;
  }

  private startTower(): void {
    const tw = this.towerState();
    if (tw.cp >= TOWER_FLOORS) return this.showToast('You conquered the tower this week! New floors on Monday.');
    this.startRun(4 + tw.cp + 1, 'tower');
  }

  /** Records a finished floor; returns true when the whole tower is done (the run ends). */
  private towerFloorDone(floor: number): boolean {
    const tw = this.towerState();
    tw.best = Math.max(tw.best, floor);
    if (floor % 10 === 0 && floor > tw.cp) {
      tw.cp = floor;
      const reward = towerReward(floor);
      if (!tw.claimed.includes(floor)) {
        tw.claimed.push(floor);
        this.bankCoins(reward);
        this.openChest(this.level);
        this.celebrate(floor === TOWER_FLOORS ? '🗼 TOWER CONQUERED!' : `🗼 CHECKPOINT ${floor}!`, `+${reward} coins and a chest · you’ll restart from here`);
        if (floor === TOWER_FLOORS && !this.progress.badges.includes('tower')) this.progress.badges.push('tower');
      }
    }
    this.progress.persist();
    if (floor >= TOWER_FLOORS) {
      this.winSpecial();
      return true;
    }
    return false;
  }

  private drawTower(): void {
    const { ctx } = this;
    const tw = this.towerState();
    const floors = towerFloors();
    const f = this.screenBegin('🗼 OMAKASE TOWER', `${TOWER_FLOORS} floors · new twists every week · checkpoints every 10 · ${timeLeft(leagueWeek().end)}`);
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 74, 'rgba(60,35,70,0.95)');
    this.text(`Checkpoint: floor ${tw.cp} · best ${tw.best}`, 32, y + 22, 13, '#ffd34d', 700, 'left');
    this.fitText('Each floor is one short order with a twist. Lose and you restart from your last checkpoint.', 32, y + 42, WORLD_W - 64, 10, 'rgba(255,255,255,0.75)', 'left');
    y += 84;
    this.pill(16, y, WORLD_W - 32, tw.cp >= TOWER_FLOORS ? '✓ CONQUERED THIS WEEK' : `CLIMB FROM FLOOR ${tw.cp + 1}`, f, () => this.startTower(), 'gold');
    y += 46;
    // The tower, top floor first.
    for (let fl = TOWER_FLOORS; fl >= 1; fl--) {
      const done = fl <= tw.best;
      const cp = fl % 10 === 0;
      const next = fl === tw.cp + 1;
      const w = 220 - (fl / TOWER_FLOORS) * 60;
      const x = WORLD_W / 2 - w / 2;
      ctx.fillStyle = next ? '#ff8a5b' : done ? '#5a8a5a' : cp ? '#7a4e2a' : '#3a2a45';
      this.roundRect(x, y, w, 24, 6);
      ctx.fill();
      if (cp) {
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 2;
        this.roundRect(x, y, w, 24, 6);
        ctx.stroke();
      }
      this.text(`${fl}`, x + 18, y + 12.5, 10.5, '#fff', 700);
      this.text(FLOOR_ICON[floors[fl - 1]] ?? '🍣', WORLD_W / 2, y + 12.5, 13, '#fff', 400);
      if (cp) this.text(tw.claimed.includes(fl) ? '✓' : `🎁 ${towerReward(fl)}`, x + w - 8, y + 12.5, 10, '#ffd34d', 700, 'right');
      y += 28;
    }
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ modifier challenges

  private startModChal(m: Mod): void {
    this.startRun(Math.max(3, this.progress.playLevel - 2), 'modchal', { mods: [m] });
  }

  private modChalWon(m: Mod): void {
    const p = this.progress;
    if (p.modchal.day !== dayKey()) p.modchal = { day: dayKey(), done: [], stars: p.modchal.stars };
    if (!p.modchal.done.includes(m)) {
      p.modchal.done.push(m);
      p.modchal.stars++;
      this.bankCoins(100);
      this.showToast(`${MODS[m].icon} ${MODS[m].name} cleared! +100 coins · ✦ ${p.modchal.stars}`);
    }
    p.persist();
  }

  private drawModChals(): void {
    const p = this.progress;
    const today = p.modchal.day === dayKey() ? p.modchal.done : [];
    const f = this.screenBegin('🎭 MODIFIER CHALLENGES', `One order with a twist · first clear each day: +100 coins · ✦ ${p.modchal.stars}`);
    let y = f.y0 + 4;
    for (const m of MOD_LIST) {
      const done = today.includes(m);
      this.card(16, y, WORLD_W - 32, 66, done ? 'rgba(42,90,60,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(MODS[m].icon, 44, y + 33, 26, '#fff', 400);
      this.text(MODS[m].name, 74, y + 22, 14, '#fff', 700, 'left');
      this.fitText(MODS[m].desc, 74, y + 44, 200, 10.5, 'rgba(255,255,255,0.75)', 'left');
      this.pill(WORLD_W - 104, y + 17, 74, done ? '✓ AGAIN' : 'PLAY', f, () => this.startModChal(m), done ? 'quiet' : 'gold');
      y += 74;
    }
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ mini-games

  private startMini(id: MiniId): void {
    if (this.progress.unlocked < MINIS[id].unlock) return this.showToast(`${MINIS[id].name} unlocks at level ${MINIS[id].unlock}`);
    this.mini = makeMini(id);
    this.miniPaid = false;
    this.screenBack = this.mode === 'minis' ? 'minis' : 'title';
    this.mode = 'mini';
    track('mini_start', { id });
  }

  private updateMini(real: number): void {
    const g = this.mini;
    if (!g) return;
    g.update(real);
    if (g.sound) {
      ({ hit: () => sfx.drop(), perfect: () => sfx.perfect(3), miss: () => sfx.slice(), fail: () => sfx.die(), win: () => sfx.celebrate(), throw: () => sfx.whoosh() } as Record<string, () => void>)[g.sound]?.();
      if (g.sound === 'fail' || g.sound === 'miss') haptic.error();
      g.sound = null;
    }
    if (g.done && !this.miniPaid) {
      this.miniPaid = true;
      const p = this.progress;
      const rec = p.minis[g.id] ?? { best: 0, wins: 0, day: '' };
      rec.best = Math.max(rec.best, g.score);
      if (g.won) {
        const firstToday = rec.day !== dayKey();
        rec.wins++;
        rec.day = dayKey();
        const coins = firstToday ? 150 : 40;
        this.bankCoins(coins);
        this.celebrate(`${MINIS[g.id].icon} YOU WIN!`, `+${coins} coins${firstToday ? ' (first win today)' : ''}`, 1.8);
      }
      p.minis[g.id] = rec;
      p.persist();
      track('mini_end', { id: g.id, won: g.won, score: g.score });
    }
  }

  private drawMiniGame(): void {
    const { ctx } = this;
    const g = this.mini!;
    const L = -this.offX;
    const W = WORLD_W + this.offX * 2;
    const bg = ctx.createLinearGradient(0, 0, 0, this.viewH);
    bg.addColorStop(0, g.id === 'fish' ? '#0b3a5a' : g.id === 'rhythm' ? '#3a1a4a' : '#4a2a1a');
    bg.addColorStop(1, '#1a0d20');
    ctx.fillStyle = bg;
    ctx.fillRect(L, 0, W, this.viewH);
    const top = this.insets.top;
    this.text(`${MINIS[g.id].icon} ${MINIS[g.id].name.toUpperCase()}`, WORLD_W / 2, top + 30, 20, '#fff', 700);
    this.text(g.status, WORLD_W / 2, top + 56, 14, '#ffd34d', 700);
    ctx.save();
    ctx.translate(0, top + 40);
    g.draw(ctx, WORLD_W, this.viewH - top - 110 - this.insets.bottom, this.time);
    ctx.restore();
    if (g.done) {
      ctx.fillStyle = 'rgba(20,10,25,0.8)';
      ctx.fillRect(L, 0, W, this.viewH);
      this.qaCover();
      this.card(40, this.viewH / 2 - 100, WORLD_W - 80, 200, '#2a1a33');
      this.text(g.won ? 'YOU WIN!' : 'SO CLOSE!', WORLD_W / 2, this.viewH / 2 - 60, 28, g.won ? '#ffd34d' : '#ff9a8a', 700);
      this.text(`Score ${g.score} · best ${this.progress.minis[g.id]?.best ?? g.score}`, WORLD_W / 2, this.viewH / 2 - 24, 14, '#fff', 600);
      this.button(60, this.viewH / 2 + 20, 130, 46, t('back'), () => { this.mini = null; this.mode = this.screenBack; }, 'quiet');
      this.button(WORLD_W - 190, this.viewH / 2 + 20, 130, 46, t('retry'), () => this.startMini(g.id));
    } else this.button(16, this.viewH - this.insets.bottom - 56, 90, 40, t('back'), () => { this.mini = null; this.mode = this.screenBack; }, 'quiet');
  }

  private drawMinis(): void {
    const p = this.progress;
    const f = this.screenBegin('🎮 MINI-GAMES', 'A new one opens after each story chapter · first win each day: +150');
    let y = f.y0 + 4;
    for (const id of Object.keys(MINIS) as MiniId[]) {
      const mg = MINIS[id];
      const open = p.unlocked >= mg.unlock;
      const rec = p.minis[id];
      this.card(16, y, WORLD_W - 32, 84, open ? 'rgba(48,30,52,0.95)' : 'rgba(30,20,35,0.8)');
      this.text(open ? mg.icon : '🔒', 46, y + 42, 30, '#fff', 400);
      this.text(mg.name, 78, y + 22, 15, open ? '#fff' : 'rgba(255,255,255,0.5)', 700, 'left');
      this.wrapLeft(open ? mg.desc : `Opens at level ${mg.unlock}`, 78, y + 42, 190, 10.5, 'rgba(255,255,255,0.75)');
      if (rec) this.text(`best ${rec.best} · ${rec.wins} wins`, 78, y + 72, 10, '#ffd34d', 700, 'left');
      if (open) this.pill(WORLD_W - 104, y + 26, 74, 'PLAY', f, () => this.startMini(id), 'gold');
      y += 92;
    }
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ cuisine worlds

  /** A story card the first time you reach the pizza, burger or pancake world. */
  private worldIntro(w: WorldId): void {
    const W = WORLDS[w];
    const key = `world:${w}`;
    if (w === 'sushi' || this.progress.seen.includes(key)) return;
    this.progress.seen.push(key);
    this.progress.persist();
    const scene = w === 'pizza' ? ['🍕', '🇮🇹', '🧀'] : w === 'burger' ? ['🍔', '🌭', '🥤'] : ['🥞', '🫐', '☕'];
    this.storyQueue.push({ ch: { title: `New world · ${W.name}`, scene, start: W.intro, end: [] }, lines: W.intro, end: false });
    track('world', { id: w });
  }

  // ------------------------------------------------------------ recipe lab

  private labMix: string[] = [];
  private labFx: { text: string; t: number; good: boolean } | null = null;

  private labState() {
    const p = this.progress;
    if (p.lab.day !== dayKey()) p.lab = { day: dayKey(), tries: 0, log: p.lab.log.slice(0, 12) };
    return p.lab;
  }

  /** Mixes the three chosen ingredients: a secret recipe, or a hint of how close you are. */
  private labTry(): void {
    const p = this.progress;
    const lab = this.labState();
    if (this.labMix.length < 3) return this.showToast('Pick 3 ingredients');
    if (lab.tries >= LAB_TRIES) return this.showToast('The Lab is closed for today. Come back tomorrow!');
    lab.tries++;
    const mix = [...this.labMix];
    const hit = labMatch(mix);
    if (hit && !p.secrets.includes(hit.name)) {
      p.secrets.push(hit.name);
      lab.log.unshift({ mix, hint: 3, found: hit.name });
      this.bankCoins(250);
      this.celebrate(`${hit.emoji} ${hit.name.toUpperCase()}!`, 'Secret recipe discovered! It joins your orders and menu · +250 coins');
      this.labFx = { text: `${hit.emoji} DISCOVERED!`, t: 1.6, good: true };
      track('lab_found', { name: hit.name });
    } else {
      const hint = hit ? 3 : labHint(mix, p.secrets);
      lab.log.unshift({ mix, hint });
      this.labFx = { text: hit ? 'Already discovered!' : hint === 2 ? 'So close! 2 are right' : hint === 1 ? 'Hmm… 1 is right' : 'Not even close!', t: 1.4, good: hint >= 2 };
      sfx.slice();
    }
    lab.log = lab.log.slice(0, 12);
    this.labMix = [];
    p.persist();
  }

  private drawLab(): void {
    const { ctx } = this;
    const p = this.progress;
    const lab = this.labState();
    const f = this.screenBegin('🧪 RECIPE LAB', `${p.secrets.length}/${SECRETS.length} secrets · ${LAB_TRIES - lab.tries} mixes left today · ingredients need ${LAB_KNOWN} layers`);
    let y = f.y0 + 4;
    // The pot with the three slots.
    this.card(16, y, WORLD_W - 32, 150, 'rgba(40,60,70,0.95)');
    this.text('🍲', WORLD_W / 2, y + 62 + Math.sin(this.time * 3) * 2, 56, '#fff', 400);
    for (let i = 0; i < 3; i++) {
      const sx = WORLD_W / 2 - 110 + i * 110;
      const k = this.labMix[i] as Ingredient | undefined;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      this.roundRect(sx - 30, y + 102, 60, 32, 10);
      ctx.fill();
      if (k) {
        ctx.fillStyle = this.color(k);
        this.roundRect(sx - 24, y + 108, 48, 20, 6);
        ctx.fill();
        this.listTap(sx - 30, y + 102, 60, 32, f, () => { this.labMix.splice(i, 1); });
      } else this.text('?', sx, y + 118, 14, 'rgba(255,255,255,0.4)', 700);
    }
    if (this.labFx) {
      ctx.globalAlpha = Math.min(1, this.labFx.t * 2);
      this.text(this.labFx.text, WORLD_W / 2, y + 18, 15, this.labFx.good ? '#8fdc93' : '#ffb4a2', 700);
      ctx.globalAlpha = 1;
    }
    y += 160;
    // Ingredient picker (sushi ingredients only: the Lab is a sushi kitchen).
    const kinds: Ingredient[] = ['rice', 'nori', 'salmon', 'tuna', 'avocado', 'cucumber', 'egg', 'ebi', 'unagi', 'tofu', 'ikura'];
    const cw = (WORLD_W - 32 - 4 * 6) / 5;
    kinds.forEach((k, i) => {
      const x = 16 + (i % 5) * (cw + 6);
      const yy = y + Math.floor(i / 5) * 58;
      const known = (p.mastery[k] ?? 0) >= LAB_KNOWN;
      const picked = this.labMix.includes(k);
      this.card(x, yy, cw, 52, picked ? 'rgba(110,80,10,0.95)' : 'rgba(48,30,52,0.95)');
      ctx.globalAlpha = known ? 1 : 0.3;
      ctx.fillStyle = this.color(k);
      this.roundRect(x + 10, yy + 8, cw - 20, 16, 5);
      ctx.fill();
      ctx.globalAlpha = 1;
      this.fitText(known ? k : `🔒 ${p.mastery[k] ?? 0}/${LAB_KNOWN}`, x + cw / 2, yy + 38, cw - 6, 10, known ? '#fff' : 'rgba(255,255,255,0.5)', 'center', 700);
      if (known) this.listTap(x, yy, cw, 52, f, () => {
        if (picked) this.labMix = this.labMix.filter((m) => m !== k);
        else if (this.labMix.length < 3) this.labMix.push(k);
      });
    });
    y += Math.ceil(kinds.length / 5) * 58 + 4;
    this.pill(16, y, WORLD_W - 32, this.labMix.length === 3 ? '🧪 MIX!' : `PICK ${3 - this.labMix.length} MORE`, f, () => this.labTry(), this.labMix.length === 3 ? 'gold' : 'quiet');
    y += 46;
    // Discovered secrets and the last mixes with their hints.
    this.text('SECRET RECIPES', 16, y + 8, 12, '#ffd34d', 700, 'left');
    y += 22;
    SECRETS.forEach((sc, i) => {
      const x = 16 + (i % 4) * ((WORLD_W - 32 - 18) / 4 + 6);
      const bw = (WORLD_W - 32 - 18) / 4;
      const yy = y + Math.floor(i / 4) * 64;
      const got = p.secrets.includes(sc.name);
      this.card(x, yy, bw, 58, got ? 'rgba(70,50,20,0.95)' : 'rgba(30,20,35,0.85)');
      this.text(got ? sc.emoji : '❔', x + bw / 2, yy + 22, 20, '#fff', 400);
      this.fitText(got ? sc.name : '???', x + bw / 2, yy + 46, bw - 6, 9.5, got ? '#ffe2c6' : 'rgba(255,255,255,0.4)', 'center', 700);
    });
    y += Math.ceil(SECRETS.length / 4) * 64 + 4;
    if (lab.log.length) {
      this.text('RECENT MIXES', 16, y + 8, 12, 'rgba(255,255,255,0.7)', 700, 'left');
      y += 22;
      for (const e of lab.log.slice(0, 6)) {
        this.card(16, y, WORLD_W - 32, 30);
        e.mix.forEach((k, i) => {
          ctx.fillStyle = this.color(k as Ingredient);
          this.roundRect(30 + i * 34, y + 9, 28, 12, 4);
          ctx.fill();
        });
        this.text(e.found ? `✓ ${e.found}` : `${'●'.repeat(e.hint)}${'○'.repeat(3 - e.hint)} ${e.hint} right`, WORLD_W - 32, y + 15, 11, e.found ? '#8fdc93' : '#ffd34d', 700, 'right');
        y += 34;
      }
    }
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ food truck branches

  /** Branches open for every World Tour city whose plate you've earned. */
  private branchCities(): typeof CITIES {
    return CITIES.filter((c) => this.owned.plate.includes(`city-${c.id}`));
  }

  private branch(id: string) {
    const b = this.progress.branches;
    if (!b[id]) b[id] = { lv: 1, tipsAt: Date.now() };
    return b[id];
  }

  private branchTips(id: string): number {
    const b = this.branch(id);
    return Math.floor(Math.min(8, (Date.now() - b.tipsAt) / 3_600_000) * branchRate(b.lv));
  }

  private collectBranches(): void {
    let total = 0;
    for (const c of this.branchCities()) {
      total += this.branchTips(c.id);
      this.branch(c.id).tipsAt = Date.now();
    }
    if (!total) return this.showToast('The trucks are still out selling. Come back soon!');
    this.bankCoins(total);
    this.progress.persist();
    this.celebrate(`🚚 +${total} COINS`, 'Your food trucks had a good day!', 1.6);
    sfx.coin();
  }

  private drawRestBranches(f: { areaTop: number; areaH: number }, y: number): number {
    const { ctx } = this;
    const cities = this.branchCities();
    this.wrapLeft('Earn a World Tour city’s plate to open a food truck there. Trucks sell all day, up to 8 hours of tips.', 16, y + 2, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 38;
    if (!cities.length) {
      this.card(16, y, WORLD_W - 32, 70, 'rgba(40,30,70,0.95)');
      this.text('🚚 No trucks yet', WORLD_W / 2, y + 26, 14, '#fff', 700);
      this.text(`Finish this week’s World Tour (${currentTour().city.name}) to open one`, WORLD_W / 2, y + 48, 11, '#9fe3ff', 600);
      return y + 78;
    }
    const total = cities.reduce((a, c) => a + this.branchTips(c.id), 0);
    this.pill(16, y, WORLD_W - 32, total ? `COLLECT ALL · ${total} COINS` : 'TRUCKS ARE SELLING…', f, () => this.collectBranches(), total ? 'gold' : 'quiet');
    y += 44;
    for (const c of cities) {
      const b = this.branch(c.id);
      this.card(16, y, WORLD_W - 32, 74, 'rgba(40,30,70,0.95)');
      const g = ctx.createLinearGradient(0, y, 0, y + 74);
      g.addColorStop(0, c.sky[0]);
      g.addColorStop(1, c.sky[1]);
      ctx.fillStyle = g;
      this.roundRect(24, y + 8, 76, 58, 10);
      ctx.fill();
      this.text(BRANCH_EMOJI[c.id] ?? '🏙️', 46, y + 30, 18, '#fff', 400);
      this.text('🚚', 70 + Math.sin(this.time * 2 + c.id.length) * 3, y + 50, 22, '#fff', 400);
      this.text(`${c.name} truck`, 112, y + 18, 13.5, '#fff', 700, 'left');
      for (let k = 0; k < BRANCH_MAX; k++) this.dot(116 + k * 13, y + 35, 4, k < b.lv ? '#ffd34d' : 'rgba(255,255,255,0.2)');
      this.text(`${branchRate(b.lv)}/h · 💰 ${this.branchTips(c.id)}`, 112, y + 55, 11, '#ffe2c6', 700, 'left');
      if (b.lv < BRANCH_MAX) this.pill(WORLD_W - 118, y + 21, 88, `⬆ ${branchCost(b.lv)}`, f, () => {
        const cost = branchCost(b.lv);
        if (this.bank < cost) return this.showToast(`You need ${cost - this.bank} more coins`);
        this.bank -= cost;
        save.setCoins(this.bank);
        b.lv++;
        this.progress.persist();
        this.showToast(`🚚 ${c.name} truck level ${b.lv}!`);
      }, this.bank >= branchCost(b.lv) ? 'gold' : 'quiet');
      else this.text('★ MAX', WORLD_W - 40, y + 37, 12, '#ffd34d', 700, 'right');
      y += 82;
    }
    return y;
  }

  // ------------------------------------------------------------ jukebox

  private drawJukebox(): void {
    const p = this.progress;
    const f = this.screenBegin('🎵 JUKEBOX', 'Tracks drop from chests, or buy them here · tap to play');
    let y = f.y0 + 4;
    for (const id of Object.keys(TRACKS) as TrackId[]) {
      const tr2 = TRACKS[id];
      const own = p.tracks.includes(id);
      const on = settings.track === id;
      this.card(16, y, WORLD_W - 32, 66, on ? 'rgba(70,50,20,0.95)' : 'rgba(48,30,52,0.95)');
      this.text(tr2.icon, 44, y + 33, 26, '#fff', 400);
      this.text(tr2.name, 74, y + 24, 14, '#fff', 700, 'left');
      this.text(`${tr2.tempo} bpm · ${tr2.drum ? 'drums · ' : ''}${tr2.wave}`, 74, y + 44, 10.5, 'rgba(255,255,255,0.65)', 600, 'left');
      if (on) {
        const bars = 5;
        for (let k = 0; k < bars; k++) {
          const h = 6 + Math.abs(Math.sin(this.time * (4 + k) + k)) * 16;
          this.ctx.fillStyle = '#ffd34d';
          this.ctx.fillRect(WORLD_W - 90 + k * 9, y + 44 - h, 6, h);
        }
      } else if (own) this.pill(WORLD_W - 104, y + 17, 74, 'PLAY', f, () => this.playTrack(id), 'quiet');
      else this.pill(WORLD_W - 104, y + 17, 74, '300 🪙', f, () => {
        if (this.bank < 300) return this.showToast(`You need ${300 - this.bank} more coins`);
        this.bank -= 300;
        save.setCoins(this.bank);
        p.tracks.push(id);
        p.persist();
        this.playTrack(id);
      }, this.bank >= 300 ? 'gold' : 'quiet');
      y += 74;
    }
    this.screenEnd(f, y - f.y0);
  }

  private playTrack(id: TrackId): void {
    settings.track = id;
    saveSettings();
    setTrack(id);
    if (!this.musicOn) this.toggleMusic();
    this.showToast(`${TRACKS[id].icon} Now playing: ${TRACKS[id].name}`);
  }

  /** Chests sometimes contain a jukebox track you don't own yet. */
  private maybeTrackDrop(): void {
    const missing = (Object.keys(TRACKS) as TrackId[]).filter((id) => !this.progress.tracks.includes(id));
    if (!missing.length || Math.random() > 0.08) return;
    const id = missing[Math.floor(Math.random() * missing.length)];
    this.progress.tracks.push(id);
    this.progress.persist();
    this.showToast(`🎵 New jukebox track: ${TRACKS[id].name}!`);
  }

  // ------------------------------------------------------------ photo mode

  private photo: { filter: number; frame: number; chef: boolean; img: HTMLCanvasElement | null } | null = null;

  private static FILTERS: [string, string][] = [['Natural', 'none'], ['Warm', 'sepia(0.35) saturate(1.3)'], ['Pop', 'saturate(1.7) contrast(1.1)'], ['Noir', 'grayscale(1) contrast(1.2)'], ['Dream', 'hue-rotate(300deg) saturate(1.2)']];
  private static FRAMES = ['Polaroid', 'Film', 'Gold', 'None'];

  private openPhoto(): void {
    this.photo = { filter: 1, frame: 0, chef: true, img: null };
    track('photo_open');
  }

  /** Builds the photo: the whole tower scaled to fit, your chef, a frame, a filter and a caption. */
  private renderPhoto(): HTMLCanvasElement {
    const ph = this.photo!;
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1350;
    const x = c.getContext('2d')!;
    const inner = document.createElement('canvas');
    inner.width = 1080;
    inner.height = 1350;
    const ic = inner.getContext('2d')!;
    const g = ic.createLinearGradient(0, 0, 0, 1350);
    g.addColorStop(0, this.theme.sky[0]);
    g.addColorStop(1, this.theme.sky[1]);
    ic.fillStyle = g;
    ic.fillRect(0, 0, 1080, 1350);
    // The whole stack, scaled to fit, drawn with the game's own layer renderer.
    const layers = this.stack;
    const towerH = layers.length * LAYER_H;
    const k = Math.min(2.4, 1000 / Math.max(towerH, 1));
    const saved = this.ctx;
    this.ctx = ic;
    ic.save();
    ic.translate(540 - (WORLD_W / 2) * k, 1230);
    ic.scale(k, k);
    for (const l of layers) this.drawLayer({ ...l, y: l.y });
    ic.restore();
    if (ph.chef) drawChef(ic, avatarChef(this.progress.avatar), 170, 1080, 2.4, 'happy', 540, 700, this.time);
    this.ctx = saved;
    // Plate line.
    ic.fillStyle = 'rgba(255,255,255,0.85)';
    ic.fillRect(240, 1236, 600, 10);
    // Apply the filter onto the final canvas.
    x.filter = Game.FILTERS[ph.filter][1];
    x.drawImage(inner, 0, 0);
    x.filter = 'none';
    // Frame and caption.
    const frame = Game.FRAMES[ph.frame];
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    if (frame === 'Polaroid') {
      x.strokeStyle = '#fbf7ef';
      x.lineWidth = 60;
      x.strokeRect(30, 30, 1020, 1290);
      x.fillStyle = '#fbf7ef';
      x.fillRect(0, 1180, 1080, 170);
      x.fillStyle = '#4a2618';
      x.font = `700 58px ${FONT}`;
      x.fillText(`${this.height} layers · Chef ${this.progress.avatar.name}`, 540, 1250);
      x.font = `500 34px ${FONT}`;
      x.fillText(`Sushi Stack · ${new Date().toLocaleDateString()}`, 540, 1305);
    } else if (frame === 'Film') {
      x.fillStyle = '#111';
      x.fillRect(0, 0, 90, 1350);
      x.fillRect(990, 0, 90, 1350);
      x.fillStyle = '#ddd';
      for (let i = 0; i < 14; i++) {
        x.fillRect(28, 20 + i * 96, 34, 50);
        x.fillRect(1018, 20 + i * 96, 34, 50);
      }
      x.fillStyle = '#ffd34d';
      x.font = `700 52px ${FONT}`;
      x.fillText(`SUSHI STACK · ${this.height}`, 540, 80);
    } else if (frame === 'Gold') {
      x.strokeStyle = '#d4a537';
      x.lineWidth = 36;
      x.strokeRect(18, 18, 1044, 1314);
      x.strokeStyle = '#fff3b0';
      x.lineWidth = 6;
      x.strokeRect(46, 46, 988, 1258);
      x.fillStyle = '#fff3b0';
      x.font = `700 64px ${FONT}`;
      x.fillText(`🏆 ${this.height} LAYERS`, 540, 110);
    }
    return c;
  }

  private drawPhoto(blocker: () => void): void {
    const ph = this.photo!;
    const { ctx } = this;
    blocker();
    ctx.fillStyle = '#0d0810';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    if (!ph.img) ph.img = this.renderPhoto();
    const top = this.insets.top + 20;
    const ph2 = this.viewH - this.insets.bottom - 150 - top;
    const pw = Math.min(WORLD_W - 40, ph2 * 0.8);
    ctx.drawImage(ph.img, WORLD_W / 2 - pw / 2, top, pw, pw * 1.25);
    const by = top + pw * 1.25 + 14;
    const bw = (WORLD_W - 40 - 16) / 3;
    this.button(20, by, bw, 38, `🎨 ${Game.FILTERS[ph.filter][0]}`, () => { ph.filter = (ph.filter + 1) % Game.FILTERS.length; ph.img = null; }, 'quiet');
    this.button(28 + bw, by, bw, 38, `🖼️ ${Game.FRAMES[ph.frame]}`, () => { ph.frame = (ph.frame + 1) % Game.FRAMES.length; ph.img = null; }, 'quiet');
    this.button(36 + bw * 2, by, bw, 38, ph.chef ? '🧑‍🍳 Chef ON' : '🧑‍🍳 Chef OFF', () => { ph.chef = !ph.chef; ph.img = null; }, 'quiet');
    this.button(20, by + 48, (WORLD_W - 48) / 2, 44, t('back'), () => { this.photo = null; }, 'quiet');
    this.button(28 + (WORLD_W - 48) / 2, by + 48, (WORLD_W - 48) / 2, 44, '📤 SAVE / SHARE', () => { void sharePhoto(ph.img ?? this.renderPhoto()); track('photo_share', { filter: ph.filter, frame: ph.frame }); }, 'gold');
  }

  // ------------------------------------------------------------ pass and play

  private pnp: { turn: number; scores: number[]; seed: number; level: number } | null = null;

  private startPnp(turn = 1): void {
    if (turn === 1) this.pnp = { turn: 1, scores: [], seed: Math.floor(Math.random() * 2 ** 31), level: Math.max(3, Math.min(this.progress.playLevel, 30)) };
    const pp = this.pnp!;
    pp.turn = turn;
    this.startRun(pp.level, 'pnp', { challenge: { seed: pp.seed, level: pp.level, score: turn === 2 ? pp.scores[0] : 0 }, picked: new Set() });
    this.coach(`👥 PLAYER ${turn}`, turn === 1 ? 'Same chefs, same layers for both players. Stack as high as you can!' : `Beat Player 1’s ${pp.scores[0]} layers!`, 4);
  }

  private drawPnp(blocker: () => void): void {
    const pp = this.pnp!;
    if (this.mode !== 'dead' || this.time - this.deadAt < 0.7 || pp.scores.length < pp.turn) return;
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    const bg = ctx.createLinearGradient(0, 0, 0, this.viewH);
    bg.addColorStop(0, '#2a1a40');
    bg.addColorStop(1, '#120a18');
    ctx.fillStyle = bg;
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    if (pp.turn === 1) {
      this.text('👥 PLAYER 1', cx, midY - 120, 26, '#ffd34d', 700);
      this.text(`${pp.scores[0]} layers`, cx, midY - 70, 40, '#fff', 700);
      this.text('📱➡️🙋', cx, midY - 10, 40, '#fff', 400);
      this.text('Pass the phone to Player 2', cx, midY + 40, 16, '#fff', 600);
      this.button(cx - 110, midY + 74, 220, 52, 'PLAYER 2: GO!', () => this.startPnp(2), 'gold');
      return;
    }
    const [a, b] = pp.scores;
    const win = a === b ? 0 : a > b ? 1 : 2;
    this.text(win ? `🏆 PLAYER ${win} WINS!` : '🤝 IT’S A DRAW!', cx, midY - 190, 26, '#ffd34d', 700);
    const maxH = Math.max(a, b, 1);
    [a, b].forEach((sc, i) => {
      const x = cx - 70 + i * 140;
      const h = 160 * (sc / maxH);
      ctx.fillStyle = i ? '#4cc9f0' : '#ff8a5b';
      this.roundRect(x - 34, midY + 60 - h, 68, h, 10);
      ctx.fill();
      this.text(`${sc}`, x, midY + 46 - h, 20, '#fff', 700);
      this.text(`PLAYER ${i + 1}`, x, midY + 84, 13, '#fff', 700);
      if (win === i + 1) this.text('👑', x, midY + 20 - h, 26, '#fff', 400);
    });
    this.button(40, midY + 120, 150, 48, t('home'), () => { this.pnp = null; this.mode = 'title'; this.reset(); }, 'quiet');
    this.button(WORLD_W - 190, midY + 120, 150, 48, 'REMATCH', () => this.startPnp(1), 'gold');
  }

  // ------------------------------------------------------------ emoji reactions

  private lastSaid = '';
  private lastScreenTitle = '';
  private wasAligned = false;
  private a11yT = 0;
  private a11yRec = false;

  /** Mirrors the screen's buttons as real buttons for VoiceOver / TalkBack (see a11y.ts). */
  private mirrorA11y(texts: NonNullable<typeof this.qaTexts>): void {
    const catcher = WORLD_W * this.viewH * 0.5; // tap-anywhere areas aren't buttons to a screen reader
    const words = (str?: string) => !!str && /\p{L}{2,}/u.test(str);
    const inside = (t: (typeof texts)[number], b: Button) => {
      const cx = (t.x0 + t.x1) / 2;
      const cy = (t.y0 + t.y1) / 2;
      return cx >= b.x - 2 && cx <= b.x + b.w + 2 && cy >= b.y - 2 && cy <= b.y + b.h + 2;
    };
    // Taps are checked newest first, so an overlay's full-screen blocker hides every button drawn before it.
    let from = 0;
    this.buttons.forEach((b, i) => { if (b.w * b.h > catcher) from = i + 1; });
    const real = this.buttons.slice(from);
    // The text on a button's row (outside any other button), e.g. "Knife Throw" for its PLAY pill.
    const rowOf = (b: Button, n = 2) => texts.filter((t) => words(t.str) && !inside(t, b) && Math.abs((t.y0 + t.y1) / 2 - (b.y + b.h / 2)) < b.h / 2 + 10 && !real.some((o) => o !== b && inside(t, o)))
      .slice(0, n).map((t) => t.str.trim()).join(' · ');
    const list = real.map((b) => {
      let name = b.label?.trim() ?? '';
      if (!words(name)) {
        const own = [...new Set(texts.filter((t) => inside(t, b)).map((t) => t.str.trim()).filter(Boolean))];
        if (own.some((x) => words(x))) name = own.join(', ');
        else {
          // An icon button (◀, ▶, a price): name it after the text on its row.
          const row = rowOf(b);
          const icon = name === '◀' ? 'previous' : name === '▶' ? 'next' : name;
          if (row) name = icon ? `${row}: ${icon}` : row;
        }
      }
      return { name, b };
    }).filter((x) => x.name);
    const count: Record<string, number> = {};
    for (const x of list) count[x.name] = (count[x.name] ?? 0) + 1;
    const seen: Record<string, number> = {};
    const named: { name: string; b: Button }[] = [];
    for (const { b, name: base } of list) {
      let name = base;
      // Several "PLAY"s: say which row each belongs to.
      if (count[base] > 1) {
        const row = rowOf(b, 1);
        if (row) name = `${row}: ${base}`;
      }
      if (name.length > 90) name = `${name.slice(0, 88)}…`;
      // Names still repeated get a number ("READ", "READ 2") so every button stays reachable.
      const n = (seen[name] = (seen[name] ?? 0) + 1);
      named.push({ name: n > 1 ? `${name} ${n}` : name, b });
    }
    mirrorButtons(named.map((x) => x.name), (l) => named.find((x) => x.name === l)?.b.onTap());
  }
  private reactPick = false;
  private friendEmoji = '';

  private drawReactPick(blocker: () => void): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    this.card(30, midY - 110, WORLD_W - 60, 220, '#2a1a33');
    this.text('Add a reaction to your code?', cx, midY - 80, 16, '#fff', 700);
    this.text('Your friend sees it when they play your run', cx, midY - 56, 11, 'rgba(255,255,255,0.7)', 600);
    REACTIONS.forEach((e, i) => {
      const x = 62 + i * 55;
      this.dot(x, midY - 6, 24, 'rgba(255,255,255,0.1)');
      this.text(e, x, midY - 5, 28, '#fff', 400);
      this.buttons.push({ x: x - 26, y: midY - 32, w: 52, h: 52, onTap: () => { this.reactPick = false; this.shareRun(i); }, label: `React ${e}` });
    });
    this.button(cx - 80, midY + 46, 160, 42, 'NO EMOJI', () => { this.reactPick = false; this.shareRun(); }, 'quiet');
  }

  // ------------------------------------------------------------ chef cards

  /** Chefs whose card is Lv 2+ wear a gold uniform. */
  private chefLook(c: Chef, level: number): Chef {
    if (Progress.cardLevel(this.progress.cards[level] ?? 0) < 2) return c;
    return { ...c, outfit: '#d4a537', accent: '#fff3b0' };
  }

  // ------------------------------------------------------------ calendar

  /** Day d (1-28): coins every day, boosters on day 7 and 21, packs on 14, a big prize on 28. */
  private calendarReward(d: number): string {
    if (d === 28) return '1000 coins + 5 packs + Loyal Chef Plate';
    if (d === 14) return '3 sticker packs + 150 coins';
    if (d % 7 === 0) return '3 boosters + 120 coins';
    return `${30 + d * 5} coins`;
  }

  private calendarReady(): boolean {
    return this.progress.calendar.last !== dayKey() && !this.lockedAt('gift');
  }

  /** Claims today's calendar day. Missing a day never resets it: the next claim is just the next day. */
  private claimCalendar(): void {
    const p = this.progress;
    if (!this.calendarReady()) return this.showToast('Come back tomorrow for the next day!');
    const d = p.calendar.n % 28 + 1;
    p.calendar = { n: d === 28 ? 0 : p.calendar.n + 1, last: dayKey() };
    if (d === 28) {
      this.bankCoins(1000);
      this.openPacks(5);
      this.unlockExclusive('plate', 'calendar', 'Loyal Chef Plate');
      if (!p.badges.includes('calendar')) p.badges.push('calendar');
      this.celebrate('📅 DAY 28!', 'Loyal Chef Plate, 1000 coins and 5 sticker packs. The calendar starts again!');
    } else if (d === 14) {
      this.openPacks(3);
      this.bankCoins(150);
      this.celebrate('📅 DAY 14!', '3 sticker packs + 150 coins');
    } else if (d % 7 === 0) {
      for (let i = 0; i < 3; i++) {
        const b = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
        this.boosters[b.id] = (this.boosters[b.id] ?? 0) + 1;
      }
      save.setBoosters(this.boosters);
      this.bankCoins(120);
      this.celebrate(`📅 DAY ${d}!`, '3 boosters + 120 coins');
    } else {
      this.bankCoins(30 + d * 5);
      this.showToast(`📅 Day ${d}: +${30 + d * 5} coins`);
    }
    sfx.coin();
    p.persist();
    track('calendar', { day: d });
    this.pushWidget();
  }

  private drawCalendar(): void {
    const p = this.progress;
    const f = this.screenBegin('LOGIN CALENDAR', 'One reward a day · missing a day never resets it');
    let y = f.y0 + 4;
    const cw = (WORLD_W - 32 - 6 * 6) / 7;
    const next = p.calendar.n % 28 + 1;
    const ready = this.calendarReady();
    for (let d = 1; d <= 28; d++) {
      const x = 16 + ((d - 1) % 7) * (cw + 6);
      const yy = y + Math.floor((d - 1) / 7) * (cw + 22);
      const got = d < next;
      const today = d === next;
      const big = d % 7 === 0;
      this.card(x, yy, cw, cw + 14, got ? 'rgba(42,90,60,0.95)' : today && ready ? 'rgba(110,80,10,0.95)' : big ? 'rgba(70,40,80,0.95)' : 'rgba(48,30,52,0.95)');
      if (today && ready) {
        this.ctx.strokeStyle = `rgba(255,211,77,${0.6 + 0.4 * Math.sin(this.time * 5)})`;
        this.ctx.lineWidth = 2.5;
        this.roundRect(x, yy, cw, cw + 14, 14);
        this.ctx.stroke();
      }
      this.text(String(d), x + cw / 2, yy + 11, 10, 'rgba(255,255,255,0.7)', 700);
      this.text(got ? '✓' : d === 28 ? '🏆' : d === 14 ? '🎴' : big ? '🎁' : '🪙', x + cw / 2, yy + cw / 2 + 8, d === 28 ? 22 : 18, got ? '#8fdc93' : '#fff', got ? 700 : 400);
      if (today && ready) this.listTap(x, yy, cw, cw + 14, f, () => this.claimCalendar());
    }
    y += 4 * (cw + 22) + 4;
    this.card(16, y, WORLD_W - 32, 70, 'rgba(60,35,20,0.95)');
    this.text(ready ? `TODAY: DAY ${next}` : `NEXT: DAY ${next} (tomorrow)`, 32, y + 20, 13, '#ffd34d', 700, 'left');
    this.fitText(this.calendarReward(next), 32, y + 44, 200, 12, '#fff', 'left', 600);
    this.pill(WORLD_W - 124, y + 19, 92, ready ? 'CLAIM' : 'TOMORROW', f, () => this.claimCalendar(), ready ? 'gold' : 'quiet');
    y += 78;
    this.wrapLeft('Day 7 and 21: 3 boosters · Day 14: 3 sticker packs · Day 28: the Loyal Chef Plate, 1000 coins and 5 packs.', 16, y + 4, WORLD_W - 32, 10.5, 'rgba(255,255,255,0.75)');
    y += 40;
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ museum

  private drawMuseum(): void {
    const { ctx } = this;
    const p = this.progress;
    const f = this.screenBegin('SUSHI MUSEUM', `${RECIPES.filter((r) => (p.recipeCounts[r.name] ?? 0) > 0).length}/${RECIPES.length} dishes · ${p.stats.fancy ?? 0} fancy cuts · ${RECIPE_GOAL} serves = gold frame`);
    let y = f.y0 + 4;
    // Wooden shelves, two dishes each.
    const cw = (WORLD_W - 32) / 2;
    for (let i = 0; i < RECIPES.length; i += 2) {
      ctx.fillStyle = '#4a2f1c';
      this.roundRect(16, y, WORLD_W - 32, 112, 12);
      ctx.fill();
      ctx.fillStyle = '#7a4e2a';
      ctx.fillRect(22, y + 84, WORLD_W - 44, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(22, y + 92, WORLD_W - 44, 4);
      for (let k = 0; k < 2 && i + k < RECIPES.length; k++) {
        const r = RECIPES[i + k];
        const n = p.recipeCounts[r.name] ?? 0;
        const cx = 16 + cw * k + cw / 2;
        if (n >= RECIPE_GOAL) {
          ctx.strokeStyle = '#d4a537';
          ctx.lineWidth = 3;
          this.roundRect(cx - 70, y + 8, 140, 82, 10);
          ctx.stroke();
        }
        if (n > 0) this.drawDish(cx, y + 60, 0.62, 0, r);
        else {
          ctx.globalAlpha = 0.25;
          this.drawDish(cx, y + 60, 0.62, 0, { ...r, pattern: r.pattern.map(() => 'nori' as Ingredient) });
          ctx.globalAlpha = 1;
          this.text('?', cx, y + 46, 20, 'rgba(255,255,255,0.6)', 700);
        }
        this.fitText(n > 0 ? r.name : '???', cx, y + 102, cw - 20, 11, n > 0 ? '#ffe2c6' : 'rgba(255,255,255,0.45)', 'center', 700);
        if (n > 0) this.text(`×${n}`, cx + 58, y + 16, 10, n >= RECIPE_GOAL ? '#ffd34d' : 'rgba(255,255,255,0.7)', 700);
      }
      y += 120;
    }
    // Ingredient mastery.
    y += 4;
    this.text(`INGREDIENT MASTERY · ${MASTERY} layers each = gold layers +1 coin per PERFECT`, 16, y + 8, 11, '#ffd34d', 700, 'left');
    y += 22;
    const kinds = Object.keys(COLORS) as Ingredient[];
    kinds.forEach((k, i) => {
      const x = 16 + (i % 2) * (cw + 0);
      const yy = y + Math.floor(i / 2) * 40;
      const n = p.mastery[k] ?? 0;
      const done = n >= MASTERY;
      this.card(x + (i % 2 ? 4 : 0), yy, cw - 4, 34, done ? 'rgba(90,70,20,0.95)' : 'rgba(48,30,52,0.95)');
      ctx.fillStyle = COLORS[k];
      this.roundRect(x + 12 + (i % 2 ? 4 : 0), yy + 9, 22, 16, 4);
      ctx.fill();
      this.text(k, x + 42 + (i % 2 ? 4 : 0), yy + 12, 11, '#fff', 700, 'left');
      this.bar(x + 42 + (i % 2 ? 4 : 0), yy + 21, cw - 100, n / MASTERY, done ? '#ffd34d' : '#ff8a5b', 5);
      this.text(done ? '✨' : `${n}`, x + cw - 14 + (i % 2 ? 0 : -4), yy + 17, 10, done ? '#ffd34d' : 'rgba(255,255,255,0.7)', 700, 'right');
    });
    y += Math.ceil(kinds.length / 2) * 40 + 4;
    this.screenEnd(f, y - f.y0);
  }

  // ------------------------------------------------------------ profile and prestige

  private drawProfile(): void {
    const { ctx } = this;
    const p = this.progress;
    const f = this.screenBegin('PROFILE', p.prestige ? `Prestige ${p.prestige} · +${p.prestige * 10}% coins forever` : 'Your chef, your records, your badges');
    let y = f.y0 + 4;
    // Header with the avatar and a prestige crown.
    this.card(16, y, WORLD_W - 32, 150, 'rgba(60,35,70,0.95)');
    ctx.save();
    this.roundRect(16, y, WORLD_W - 32, 150, 14);
    ctx.clip();
    drawChef(ctx, avatarChef(p.avatar), 86, y + 90, 0.85, 'happy', 200, y + 160, this.time);
    ctx.restore();
    if (p.prestige) this.text(['👑', '💎', '🌟', '🔥', '🐉'][Math.min(4, p.prestige - 1)] + (p.prestige > 5 ? ` ${p.prestige}` : ''), 120, y + 24, 20, '#fff', 400);
    this.text(`Chef ${p.avatar.name}`, 160, y + 30, 20, '#fff', 700, 'left');
    this.text(`Chef Rank ${p.rank} · Level ${p.unlocked}`, 160, y + 56, 12, '#ffd34d', 700, 'left');
    this.text(`${p.totalStars}★ · ${p.chefsBeaten} chefs beaten`, 160, y + 76, 12, 'rgba(255,255,255,0.8)', 600, 'left');
    this.text(`${this.progress.rest.reviews} critic reviews · ${Object.values(p.hearts).reduce((a, b) => a + b, 0)} hearts`, 160, y + 96, 12, 'rgba(255,255,255,0.8)', 600, 'left');
    this.pill(160, y + 110, 120, 'EDIT CHEF', f, () => this.openScreen('avatar', 'profile'), 'quiet');
    y += 160;
    // Records.
    const rows: [string, string][] = [
      ['Best stack', `${this.best} layers`], ['PERFECTs', `${p.stats.perfects ?? 0}`], ['Orders served', `${p.stats.served ?? 0}`],
      ['Fancy cuts', `${p.stats.fancy ?? 0}`], ['Sous-chef wins', `${p.stats.bonus ?? 0}`], ['Gauntlet best', `${p.gauntletBest} chefs`],
      ['Coins earned', `${(p.stats.coins ?? 0).toLocaleString('en')}`], ['Days played', `${p.stats.days ?? 0}`],
    ];
    const cw = (WORLD_W - 32 - 8) / 2;
    rows.forEach(([k, v], i) => {
      const x = 16 + (i % 2) * (cw + 8);
      const yy = y + Math.floor(i / 2) * 50;
      this.card(x, yy, cw, 44);
      this.text(k, x + 12, yy + 14, 10.5, 'rgba(255,255,255,0.65)', 600, 'left');
      this.fitText(v, x + 12, yy + 31, cw - 20, 14, '#fff', 'left', 700);
    });
    y += Math.ceil(rows.length / 2) * 50 + 6;
    // Badges.
    this.text('BADGES', 16, y + 8, 12, '#ffd34d', 700, 'left');
    y += 22;
    const badges: [string, string][] = [
      ...p.badges.filter((b) => b.startsWith('season:')).map((b) => { const [, n, icon, name] = b.split(':'); return [icon, `${name} (S${n})`] as [string, string]; }),
      ...(p.badges.includes('calendar') ? [['📅', 'Loyal 28'] as [string, string]] : []),
      ...(p.badges.includes('nemesis') ? [['😈', 'Nemesis slayer'] as [string, string]] : []),
      ...ACHIEVEMENTS.filter((a) => (p.achSeen[a.id] ?? 0) >= 4).map((a) => [a.icon, `${a.name} IV`] as [string, string]),
      ...(p.restaurant.michelin ? [['⭐', `${p.restaurant.michelin} Michelin`] as [string, string]] : []),
      ...(p.prestige ? [['👑', `Prestige ${p.prestige}`] as [string, string]] : []),
    ];
    if (!badges.length) {
      this.wrapLeft('Finish a Sushi Pass season, the 28-day calendar, an achievement family or a Michelin star to earn badges.', 16, y + 4, WORLD_W - 32, 11, 'rgba(255,255,255,0.65)');
      y += 40;
    } else {
      const bw = (WORLD_W - 32 - 16) / 3;
      badges.forEach(([icon, name], i) => {
        const x = 16 + (i % 3) * (bw + 8);
        const yy = y + Math.floor(i / 3) * 76;
        this.card(x, yy, bw, 68, 'rgba(70,50,20,0.95)');
        this.text(icon, x + bw / 2, yy + 26, 24, '#fff', 400);
        this.fitText(name, x + bw / 2, yy + 54, bw - 10, 10, '#ffe2c6', 'center', 700);
      });
      y += Math.ceil(badges.length / 3) * 76;
    }
    // Prestige.
    y += 6;
    const can = p.unlocked > 100;
    this.card(16, y, WORLD_W - 32, 96, can ? 'rgba(80,20,90,0.95)' : 'rgba(40,25,45,0.9)');
    this.text('👑 PRESTIGE', 32, y + 24, 14, can ? '#e0aaff' : 'rgba(255,255,255,0.6)', 700, 'left');
    if (can) this.pill(WORLD_W - 124, y + 8, 92, 'PRESTIGE', f, () => this.askPrestige(), 'gold');
    this.wrapLeft(can ? 'Restart from level 1 for +10% coins forever, a new crown and the Prestige Plate. You keep coins, items and the restaurant.' : `Reach level 101 to prestige (you’re on level ${p.unlocked}). Each prestige gives +10% coins forever.`, 32, y + 54, WORLD_W - 64, 10.5, 'rgba(255,255,255,0.8)');
    y += 104;
    this.screenEnd(f, y - f.y0);
  }

  private askPrestige(): void {
    this.confirmBox = {
      title: '👑 PRESTIGE?',
      text: `Your journey restarts at level 1 (stars and chef map reset). You keep coins, items, the restaurant, companions and collections, and get +10% coins forever.`,
      ok: 'PRESTIGE',
      go: () => this.prestige(),
    };
  }

  private prestige(): void {
    const p = this.progress;
    p.prestige++;
    p.unlocked = 1;
    p.stars = [];
    p.persist();
    this.unlockExclusive('plate', 'prestige', 'Prestige Plate');
    this.celebrate(`👑 PRESTIGE ${p.prestige}!`, `+${p.prestige * 10}% coins forever · the journey begins again`);
    track('prestige', { n: p.prestige });
  }

  private drawConfirm(blocker: () => void): void {
    const c = this.confirmBox!;
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    this.card(30, midY - 120, WORLD_W - 60, 240, '#2a1a33');
    this.fitText(c.title, cx, midY - 86, WORLD_W - 100, 20, '#fff', 'center', 700);
    this.wrapText(c.text, cx, midY - 50, WORLD_W - 100, 12.5, 'rgba(255,255,255,0.85)');
    this.button(50, midY + 60, 130, 44, t('back'), () => { this.confirmBox = null; }, 'quiet');
    this.button(WORLD_W - 180, midY + 60, 130, 44, c.ok, () => { const go = c.go; this.confirmBox = null; go(); }, 'gold');
  }

  // ---------------------------------------------------------- leaderboards

  private drawBoards(): void {
    const p = this.progress;
    const f = this.screenBegin('LEADERBOARDS', 'Online boards arrive with Game Center / Google Play Games');
    let y = f.y0 + 4;
    const row = (label: string, value: string, color = '#fff') => {
      this.card(16, y, WORLD_W - 32, 38, 'rgba(48,30,52,0.95)');
      this.text(label, 32, y + 19, 12.5, 'rgba(255,255,255,0.85)', 700, 'left');
      this.text(value, WORLD_W - 32, y + 19, 13, color, 900, 'right');
      y += 44;
    };
    // This week's bests (they reset every Monday), and the all-time bests beside them.
    const lb = localBoards();
    this.text(online ? 'THIS WEEK · ONLINE' : 'THIS WEEK · on this device until online boards are set up', 16, y + 8, 11, '#9fe3ff', 700, 'left');
    y += 20;
    (Object.keys(BOARDS) as (keyof typeof BOARDS)[]).forEach((k) => row(BOARDS[k].name, `${lb.best[k] ?? 0}  ·  best ever ${lb.allTime[k] ?? 0}`, '#9fe3ff'));
    y += 6;
    this.text('YOUR RECORDS', 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    row('Best height', String(this.best), '#ffd34d');
    row('Gauntlet best', `${p.gauntletBest} chefs`);
    row('Time Attack best', String(p.timeBest));
    row('Zen best', String(p.zenBest));
    row('Puzzle stars', `${p.puzzleStars.reduce((a, b) => a + (b || 0), 0)}★`);
    row('Furthest level', String(p.unlocked));
    y += 6;
    const cup = cupWeekend();
    const table = [...cupRivals(cup.key, cup.start, cup.end), { name: 'YOU', score: p.cup.key === cup.key ? p.cup.best : 0 }].sort((a, b) => b.score - a.score);
    this.text(`SUSHI CUP ${cup.live ? '(live)' : '(final)'} · AI rivals`, 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    table.slice(0, 10).forEach((e, i) => row(`${i + 1}. ${e.name}`, String(e.score), e.name === 'YOU' ? '#ffd34d' : '#fff'));
    const me = table.findIndex((e) => e.name === 'YOU');
    if (me >= 10) row(`${me + 1}. YOU`, String(table[me].score), '#ffd34d');
    y += 6;
    this.text('YOUR TOP RUNS', 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    if (!p.topRuns.length) row('No runs yet', '-');
    p.topRuns.forEach((h, i) => row(`#${i + 1}`, `${h} layers`));
    // Duels: every friend challenge played, with a rematch on the same seed.
    y += 6;
    const wins = p.duels.filter((d) => d.mine > d.theirs).length;
    this.text(`DUELS · ${wins} won, ${p.duels.length - wins} lost`, 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    if (!p.duels.length) row('Enter a friend’s code to duel', '-');
    for (const d of p.duels.slice(0, 8)) {
      const won = d.mine > d.theirs;
      this.card(16, y, WORLD_W - 32, 44, 'rgba(48,30,52,0.95)');
      this.text(`${won ? '🏆' : '💥'} ${d.mine} vs ${d.theirs}`, 32, y + 15, 13, won ? '#8fdc93' : '#ff9a8a', 700, 'left');
      this.text(`${d.code} · ${new Date(d.at).toLocaleDateString()}`, 32, y + 32, 10, 'rgba(255,255,255,0.6)', 600, 'left');
      this.pill(WORLD_W - 116, y + 6, 84, 'REMATCH', f, () => {
        const c = decodeChallenge(d.code);
        if (c) this.startRun(c.level, 'challenge', { challenge: c });
      }, 'quiet');
      y += 50;
    }
    this.screenEnd(f, y - f.y0);
  }

  private recordDuel(): void {
    const c = this.challenge!;
    const code = encodeChallenge(c);
    const p = this.progress;
    p.duels = [{ code, level: c.level, theirs: c.score, mine: this.height, at: Date.now() }, ...p.duels].slice(0, 30);
    p.persist();
    track('duel', { won: this.height > c.score });
  }

  // ---------------------------------------------------- friend challenges

  /**
   * Text box for codes (a real input, so phone keyboards work): a friend's challenge code or invite
   * code, or a save-transfer code from another device.
   */
  private openCodeInput(kind: 'friend' | 'save' = 'friend'): void {
    if (this.codeInput) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,5,15,0.7);z-index:10;padding:16px;';
    const title = kind === 'save' ? 'Paste a save code' : 'Friend’s code';
    const hint = kind === 'save' ? 'This replaces the progress on this device.' : 'A challenge (K3F9Q-7-42), ghost (G-…), invite (INV-…) or restaurant code (R-…)';
    wrap.innerHTML = `<form style="background:#2a1a33;border-radius:18px;padding:20px;width:100%;max-width:340px;font:600 15px Fredoka,system-ui,sans-serif;color:#fff;display:grid;gap:12px">
      <label for="code-box" style="font-weight:700;font-size:18px">${title}</label>
      <p style="margin:0;font-size:13px;opacity:.75">${hint}</p>
      <input id="code-box" autocomplete="off" ${kind === 'save' ? '' : 'autocapitalize="characters"'} placeholder="${kind === 'save' ? 'SS1.…' : 'e.g. K3F9Q-7-42'}" style="font:700 18px Fredoka,system-ui;padding:12px;border-radius:12px;border:2px solid #ff8a5b;background:#fff;color:#2a1a33;${kind === 'save' ? '' : 'text-transform:uppercase'}">
      <div style="display:flex;gap:10px"><button type="button" data-close style="flex:1;padding:12px;border-radius:22px;border:0;background:rgba(255,255,255,0.15);color:#fff;font-weight:700">Cancel</button>
      <button style="flex:1;padding:12px;border-radius:22px;border:0;background:#ffd34d;color:#4a2a00;font-weight:700">${kind === 'save' ? 'Restore' : 'Go'}</button></div>
      <p data-error style="margin:0;color:#ff9a8a;min-height:1em;font-size:13px"></p></form>`;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    const error = (msg: string) => { wrap.querySelector('[data-error]')!.textContent = msg; };
    this.codeInput = input;
    const close = () => { wrap.remove(); this.codeInput = null; };
    wrap.querySelector('[data-close]')!.addEventListener('click', close);
    wrap.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (kind === 'save') {
        void importSave(value).then((ok) => {
          if (!ok) return error('That save code is damaged or incomplete.');
          track('save_import');
          location.reload();
        });
        return;
      }
      if (/^G-/i.test(value)) {
        const gc = decodeGhost(value);
        if (!gc) return error('That ghost code is damaged. Ask your friend to share it again.');
        close();
        this.friendEmoji = codeEmoji(value);
        this.friendGhost = gc.shape;
        this.startRun(gc.challenge.level, 'challenge', { challenge: gc.challenge });
        track('ghost_race');
        return;
      }
      if (/^R-/i.test(value)) {
        const rc = decodeRestaurant(value);
        if (!rc) return error('That restaurant code is damaged. Ask your friend to share it again.');
        close();
        this.openVisit(rc);
        return;
      }
      if (/^INV-[A-Z0-9]{6}$/i.test(value)) {
        const p = this.progress;
        if (value.toUpperCase() === p.inviteCode) return error('That’s your own invite code. Send it to a friend!');
        if (p.seen.includes('invite:used')) return error('You’ve already used an invite code on this device.');
        p.seen.push('invite:used');
        p.persist();
        close();
        this.bankCoins(cfg.inviteReward);
        this.celebrate('WELCOME GIFT!', `A friend invited you: +${cfg.inviteReward} coins`);
        track('invite_redeemed');
        return;
      }
      const c = decodeChallenge(value);
      this.friendEmoji = c ? codeEmoji(value) : '';
      if (!c) return error('That code doesn’t look right. It looks like K3F9Q-7-42 or INV-ABC123.');
      close();
      this.startRun(c.level, 'challenge', { challenge: c });
    });
    setTimeout(() => input.focus(), 50);
  }

  // ------------------------------------------------------------- settings

  private setting(key: 'haptics' | 'reducedMotion' | 'colorblind' | 'assist' | 'clips' | 'voices' | 'leftHanded' | 'hapticAssist'): void {
    settings[key] = !settings[key];
    saveSettings();
    if (key === 'haptics') setHaptics(settings.haptics);
    track('setting', { key, on: settings[key] });
  }

  private drawSettings(): void {
    const p = this.progress;
    const f = this.screenBegin(t('settings'));
    let y = f.y0 + 4;
    const toggle = (icon: string, label: string, note: string, on: boolean, go: () => void) => {
      this.card(16, y, WORLD_W - 32, 56);
      this.text(icon, 40, y + 28, 20, '#fff', 400);
      this.fitText(label, 64, y + 20, 200, 14, '#fff', 'left', 700);
      this.fitText(note, 64, y + 39, 200, 10.5, 'rgba(255,255,255,0.65)', 'left');
      // Switch.
      const sx = WORLD_W - 84;
      this.ctx.fillStyle = on ? '#2a9d5c' : 'rgba(255,255,255,0.2)';
      this.roundRect(sx, y + 16, 52, 26, 13);
      this.ctx.fill();
      this.dot(on ? sx + 39 : sx + 13, y + 29, 10, '#fff');
      this.listTap(16, y, WORLD_W - 32, 56, f, go);
      y += 62;
    };
    const header = (label: string) => {
      this.text(label, 20, y + 10, 12, '#ffd34d', 700, 'left');
      y += 24;
    };
    header(t('secSound'));
    toggle('🎵', t('music'), 'Calm generated music', this.musicOn, () => this.toggleMusic());
    toggle('🔊', t('sound'), 'Chops, coins and cheers', !this.muted, () => { this.muted = !this.muted; setMuted(this.muted); save.setMuted(this.muted); });
    toggle('🗣️', 'Chef voices', 'Little babble voices when chefs talk', settings.voices, () => { this.setting('voices'); setVoices(settings.voices); });
    toggle('📳', t('haptics'), 'Taps you feel on PERFECTs and hits', settings.haptics, () => this.setting('haptics'));
    header(t('secAccess'));
    toggle('🌙', t('reducedMotion'), 'No screen shake, flashes or confetti', settings.reducedMotion, () => this.setting('reducedMotion'));
    toggle('🔣', t('colorblind'), 'A symbol on every ingredient', settings.colorblind, () => this.setting('colorblind'));
    toggle('🤝', t('assist'), 'Slower layers, bigger PERFECT zone', settings.assist, () => this.setting('assist'));
    toggle('🫲', 'Left-handed', 'Corner buttons and results flipped', settings.leftHanded, () => this.setting('leftHanded'));
    toggle('📳', 'Drop-timing tick', 'A vibration and tick when the layer lines up', settings.hapticAssist, () => this.setting('hapticAssist'));
    toggle('🎬', t('clips'), clipsSupported() ? 'Save the last seconds of a run as a video' : 'Not supported on this device', settings.clips && clipsSupported(), () => { if (clipsSupported()) this.setting('clips'); else this.showToast('Video recording isn’t supported here'); });
    // Language picker.
    this.card(16, y, WORLD_W - 32, 56);
    this.text('🌐', 40, y + 28, 20, '#fff', 400);
    this.text(t('language'), 64, y + 20, 14, '#fff', 700, 'left');
    this.text('Menus and tips', 64, y + 39, 10.5, 'rgba(255,255,255,0.65)', 600, 'left');
    const li = LANGS.findIndex((l) => l.id === settings.lang);
    this.pill(WORLD_W - 150, y + 12, 118, LANGS[li].name, f, () => {
      settings.lang = LANGS[(li + 1) % LANGS.length].id;
      saveSettings();
      track('setting', { key: 'lang', value: settings.lang });
    }, 'quiet');
    y += 62;

    header(t('secFriends'));
    this.card(16, y, WORLD_W - 32, 96);
    this.text('Your invite code', 32, y + 20, 13, '#fff', 700, 'left');
    this.text(p.inviteCode, 32, y + 44, 20, '#ffd34d', 700, 'left');
    this.fitText(`Friends who enter it get ${cfg.inviteReward} coins. Rewards for you need online accounts (coming later).`, 32, y + 74, WORLD_W - 64, 10.5, 'rgba(255,255,255,0.65)', 'left');
    this.pill(WORLD_W - 116, y + 26, 84, 'COPY', f, () => this.copy(p.inviteCode, 'Invite code copied!'), 'gold');
    y += 104;
    this.pill(16, y, WORLD_W - 32, 'ENTER A FRIEND’S CODE', f, () => this.openCodeInput('friend'), 'quiet');
    y += 44;

    header(t('secSave'));
    this.card(16, y, WORLD_W - 32, 112);
    this.wrapLeft('Move your progress to another device: copy your save code here, then paste it there. (Automatic cloud save needs Game Center / Google Play Games, set up when the game is published.)', 32, y + 18, WORLD_W - 64, 11, 'rgba(255,255,255,0.8)');
    this.pill(32, y + 70, (WORLD_W - 80) / 2, 'COPY SAVE CODE', f, () => {
      void exportSave().then((code) => {
        this.saveCode = code;
        this.copy(code, `Save code copied (${code.length} characters)`);
        track('save_export', { size: code.length });
      });
    }, 'gold');
    this.pill(48 + (WORLD_W - 80) / 2, y + 70, (WORLD_W - 80) / 2, 'PASTE A CODE', f, () => this.openCodeInput('save'), 'quiet');
    y += 120;
    if (this.saveCode) {
      this.fitText(this.saveCode, WORLD_W / 2, y + 6, WORLD_W - 40, 10, 'rgba(255,255,255,0.5)');
      y += 20;
    }

    header(t('secPrivacy'));
    const counts = analyticsSummary();
    this.card(16, y, WORLD_W - 32, 84);
    this.wrapLeft('Gameplay stats stay on this device. Nothing is sent anywhere unless the developer turns on analytics in a future update (it would be listed in the privacy policy).', 32, y + 18, WORLD_W - 64, 11, 'rgba(255,255,255,0.8)');
    this.fitText(`On-device log: ${counts.reduce((a, b) => a + b[1], 0)} events · ${counts.slice(0, 3).map(([n, c]) => `${n} ${c}`).join(' · ')}`, 32, y + 68, WORLD_W - 64, 10, 'rgba(255,255,255,0.55)', 'left');
    y += 92;
    this.text('Sushi Stack · made with Capacitor', WORLD_W / 2, y + 10, 10, 'rgba(255,255,255,0.4)', 600);
    y += 24;
    this.screenEnd(f, y - f.y0);
  }

  /** Copies text to the clipboard, falling back to showing it. */
  private copy(text: string, ok: string): void {
    navigator.clipboard?.writeText(text).then(() => this.showToast(ok), () => this.showToast(text.length > 40 ? 'Copy failed: long-press the code below' : text));
    if (!navigator.clipboard) this.showToast(text.length > 40 ? 'Copy failed: long-press the code below' : text);
  }

  /** Builds the share card image and opens the share sheet (or shows the card if there isn't one). */
  private shareRun(emoji?: number): void {
    const tag = emoji === undefined ? '' : `~${emoji}`;
    const code = encodeChallenge({ seed: this.seed, level: this.startLevel, score: this.height }) + tag;
    const card = document.createElement('canvas');
    card.width = 1080;
    card.height = 1350;
    const c = card.getContext('2d')!;
    const g = c.createLinearGradient(0, 0, 0, 1350);
    g.addColorStop(0, this.theme.sky[0]);
    g.addColorStop(1, this.theme.sky[1]);
    c.fillStyle = g;
    c.fillRect(0, 0, 1080, 1350);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.font = `900 110px ${FONT}`;
    c.fillText('SUSHI STACK', 540, 140);
    // The top of the player's actual stack.
    const layers = this.stack.slice(-14);
    layers.forEach((l, i) => {
      const yy = 1180 - (i + 1) * 46;
      c.fillStyle = this.color(l.kind);
      c.beginPath();
      c.roundRect?.(540 + (l.x - WORLD_W / 2) * 2.2, yy, l.w * 2.2, 40, 10);
      if (!c.roundRect) c.rect(540 + (l.x - WORLD_W / 2) * 2.2, yy, l.w * 2.2, 40);
      c.fill();
    });
    c.fillStyle = '#ffd34d';
    c.font = `900 220px ${FONT}`;
    c.fillText(String(this.height), 540, 360);
    c.fillStyle = '#fff';
    c.font = `800 54px ${FONT}`;
    c.fillText(`layers · level ${this.level}`, 540, 490);
    // The player's chef cheers beside the stack.
    drawChef(c, avatarChef(this.progress.avatar), 170, 1010, 2.2, 'happy', 540, 700, 0.3);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.font = `700 44px ${FONT}`;
    c.fillText(`Chef ${this.progress.avatar.name} · Can you beat me? Code: ${code}`, 540, 1270, 1000);
    const ghost = encodeGhost({ seed: this.seed, level: this.startLevel, score: this.height }, this.stack.slice(1).map((l) => [Math.round(l.x), Math.round(l.w)])) + tag;
    void shareCard(card, ghost, this.height).then((ok) => {
      if (!ok) this.shareOverlay = { image: card, code, ghost };
    });
  }

  // --------------------------------------------------------------- overlays

  private drawOverlays(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    // Confetti and celebration banners never block taps.
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-4, -2.5, 8, 5);
      ctx.restore();
    }
    if (this.celebration && !this.perkChoice && !this.picker) {
      const t = this.celebration.t;
      const k = Math.min(1, t * 3);
      const pop = 1 + 0.15 * Math.max(0, Math.sin(Math.min(1, (2 - t) * 3) * Math.PI));
      ctx.globalAlpha = k;
      ctx.save();
      ctx.translate(cx, midY - 120);
      ctx.scale(pop, pop);
      // Long subtitles wrap onto a second line inside a taller card.
      ctx.font = `600 12px ${FONT}`;
      const two = ctx.measureText(this.celebration.sub).width > 300;
      const hh = two ? 50 : 42;
      ctx.fillStyle = 'rgba(20,10,25,0.9)';
      this.roundRect(-170, -hh, 340, hh * 2, 20);
      ctx.fill();
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 3;
      ctx.stroke();
      this.fitText(this.celebration.title, 0, two ? -20 : -12, 310, 24, '#ffd34d', 'center', 700);
      this.wrapText(this.celebration.sub, 0, two ? 10 : 18, 300, 12, '#ffffff');
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    const blocker = () => this.buttons.push({ x: -this.offX, y: 0, w: WORLD_W + this.offX * 2, h: this.viewH, onTap: () => undefined });
    if (this.mode === 'playing' && !this.perkChoice && !this.paused) this.drawCoach();
    if (this.perkChoice && this.mode === 'playing') this.drawPerkChoice(blocker);
    if (this.picker) this.drawPicker(blocker);
    if (this.story && !this.picker) this.drawStoryCard(blocker);
    if (this.confirmBox) this.drawConfirm(blocker);
    if (this.pnp && this.runMode === 'pnp') this.drawPnp(blocker);
    if (this.reactPick) this.drawReactPick(blocker);
    if (this.photo) this.drawPhoto(blocker);
    if (this.adOverlay) {
      blocker();
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.qaCover();
      this.card(40, midY - 130, WORLD_W - 80, 260, '#1e1e2e');
      this.text('TEST AD', cx, midY - 92, 24, '#ffd34d', 900);
      this.text('(simulated — real AdMob ads play in the phone app)', cx, midY - 64, 11, 'rgba(255,255,255,0.7)', 600);
      this.text('🍣', cx, midY - 8, 54, '#fff', 400);
      this.text(`Reward: ${this.adOverlay.label}`, cx, midY + 44, 13, '#fff', 700);
      if (this.adOverlay.t > 0) this.text(`Reward in ${Math.ceil(this.adOverlay.t)}…`, cx, midY + 88, 15, 'rgba(255,255,255,0.8)', 800);
      else this.button(cx - 90, midY + 68, 180, 44, 'COLLECT REWARD', () => { const o = this.adOverlay!; this.adOverlay = null; o.onReward(); }, 'gold');
      return;
    }
    if (this.buyOverlay) {
      const pr = PRODUCTS[this.buyOverlay];
      blocker();
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.qaCover();
      this.card(30, midY - 140, WORLD_W - 60, 280, '#2a1a33');
      this.text(pr.name, cx, midY - 104, 22, '#fff', 900);
      this.text(pr.price, cx, midY - 76, 18, '#ffd34d', 900);
      this.wrapText(pr.desc, cx, midY - 40, WORLD_W - 100, 13, '#fff');
      this.text('TEST MODE · no real money is charged', cx, midY + 30, 12, '#9fe3ff', 800);
      this.text('Real purchases need the App Store / Play Store set up.', cx, midY + 50, 10.5, 'rgba(255,255,255,0.65)', 600);
      this.button(50, midY + 76, 130, 44, 'CANCEL', () => { this.buyOverlay = null; }, 'quiet');
      this.button(WORLD_W - 180, midY + 76, 130, 44, 'TEST BUY', () => { const id = this.buyOverlay!; this.buyOverlay = null; this.grant(id); }, 'gold');
      return;
    }
    if (this.shareOverlay) {
      const o = this.shareOverlay;
      blocker();
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.qaCover();
      const iw = 220;
      const ih = iw * 1.25;
      ctx.drawImage(o.image, cx - iw / 2, midY - ih / 2 - 70, iw, ih);
      this.text(`Challenge code: ${o.code}`, cx, midY + ih / 2 - 46, 15, '#ffd34d', 900);
      this.text('Send this code to a friend: they play the same chefs and see your score to beat.', cx, midY + ih / 2 - 24, 10.5, '#fff', 600);
      this.button(30, midY + ih / 2 - 4, 108, 44, 'COPY CODE', () => this.copy(o.code, 'Code copied!'), 'gold');
      this.button(146, midY + ih / 2 - 4, 108, 44, '👻 GHOST', () => this.copy(o.ghost, 'Ghost code copied: friends race your exact stack'), 'gold');
      this.button(262, midY + ih / 2 - 4, 108, 44, 'CLOSE', () => { this.shareOverlay = null; }, 'quiet');
      return;
    }
    if (this.setDetail !== null) {
      const set = STICKER_SETS[this.setDetail];
      const have = this.progress.album.have[this.setDetail] ?? [];
      blocker();
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
      this.qaCover();
      this.card(24, midY - 190, WORLD_W - 48, 380, '#2a1a33');
      this.text(`${set.name} · ${have.filter((x: number) => x > 0).length}/9`, cx, midY - 160, 20, '#fff', 900);
      this.text(`Complete the set: +${SET_REWARD(this.setDetail)} coins`, cx, midY - 136, 11, '#ffd34d', 700);
      set.stickers.forEach((st, i) => {
        const x = 64 + (i % 3) * 110;
        const yy = midY - 96 + Math.floor(i / 3) * 92;
        const n = have[i] ?? 0;
        this.card(x - 44, yy - 8, 88, 82, n ? 'rgba(255,248,235,0.95)' : 'rgba(255,255,255,0.08)');
        ctx.globalAlpha = n ? 1 : 0.25;
        this.text(n ? st : '?', x, yy + 26, n ? 34 : 26, '#fff', 400);
        ctx.globalAlpha = 1;
        this.text('★'.repeat(stickerRarity(this.setDetail!, i)), x, yy + 60, 9, n ? '#e0a800' : 'rgba(255,255,255,0.4)', 900);
        if (n > 1) this.text(`x${n}`, x + 32, yy + 2, 10, '#4a2618', 900);
      });
      this.button(cx - 75, midY + 140, 150, 40, 'CLOSE', () => { this.setDetail = null; }, 'quiet');
    }
  }

  /** Coaching card at the bottom, plus a tapping finger for the very first drops. */
  private drawCoach(): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    if (this.progress.tutorial === 0 && this.moving) {
      const bob = Math.abs(Math.sin(this.time * 5)) * 10;
      const fy = this.viewH * 0.68;
      ctx.strokeStyle = `rgba(255,255,255,${0.5 - (this.time % 0.8) / 1.6})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, fy - 22, 14 + ((this.time % 0.8) / 0.8) * 22, 0, Math.PI * 2);
      ctx.stroke();
      this.text('👆', cx, fy + bob, 40, '#fff', 400);
    }
    const tip = this.tip;
    if (!tip || this.dish) return;
    const a = Math.min(1, tip.t * 2.5);
    ctx.font = `600 12px ${FONT}`;
    const two = ctx.measureText(tip.text).width > WORLD_W - 100;
    const h = two ? 78 : 62;
    const y = this.viewH - this.insets.bottom - h - 18 + (1 - a) * 20;
    ctx.globalAlpha = a;
    this.card(24, y, WORLD_W - 48, h, 'rgba(255,248,235,0.97)');
    ctx.fillStyle = '#ff8a5b';
    this.roundRect(24, y, 8, h, 4);
    ctx.fill();
    this.text(tip.title, 46, y + 20, 14, '#c4501f', 700, 'left');
    if (two) this.wrapLeft(tip.text, 46, y + 40, WORLD_W - 100, 12, '#4a2618');
    else this.fitText(tip.text, 46, y + 42, WORLD_W - 100, 12, '#4a2618', 'left');
    ctx.globalAlpha = 1;
  }

  /** Single-line text that shrinks to fit maxW. */
  private fitText(str: string, x: number, y: number, maxW: number, size: number, color: string, align: CanvasTextAlign = 'center', weight = 600): void {
    const { ctx } = this;
    let s2 = size;
    ctx.font = `${weight} ${s2}px ${FONT}`;
    const min = Math.max(8, size * 0.75);
    while (s2 > min && ctx.measureText(str).width > maxW) {
      s2 -= 0.5;
      ctx.font = `${weight} ${s2}px ${FONT}`;
    }
    // Still too long at the smallest size: cut it with an ellipsis.
    let out = str;
    while (out.length > 1 && ctx.measureText(out).width > maxW) out = out.slice(0, -2) + '…';
    this.text(out, x, y, s2, color, weight, align);
  }

  /** After each chef in a journey: pick one of three perks for the rest of the run. */
  private drawPerkChoice(blocker: () => void): void {
    const { ctx } = this;
    const cx = WORLD_W / 2;
    const midY = this.viewH / 2;
    blocker();
    ctx.fillStyle = 'rgba(20,10,25,0.78)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    this.fitText(t('chefBeaten'), cx, midY - 150, WORLD_W - 40, 30, '#ffd34d', 'center', 700);
    this.fitText(t('pickPerk'), cx, midY - 118, WORLD_W - 40, 14, '#ffffff', 'center');
    const cw = 116;
    const ch = 196;
    const gap = 10;
    const x0 = cx - (cw * 3 + gap * 2) / 2;
    this.perkChoice!.forEach((id, i) => {
      const pk = PERKS[id];
      const x = x0 + i * (cw + gap);
      const y = midY - 92 + Math.sin(this.time * 3 + i) * 3;
      const have = this.perks[id] ?? 0;
      this.card(x, y, cw, ch, 'rgba(255,248,235,0.97)');
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 3;
      this.roundRect(x, y, cw, ch, 14);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,138,91,0.18)';
      ctx.beginPath();
      ctx.arc(x + cw / 2, y + 44, 30, 0, Math.PI * 2);
      ctx.fill();
      this.text(pk.icon, x + cw / 2, y + 46, 32, '#fff', 400);
      this.wrapText(pk.name, x + cw / 2, y + 96, cw - 14, 13.5, '#4a2618', 700);
      this.wrapText(pk.desc, x + cw / 2, y + 134, cw - 16, 11, '#7a5a48');
      if (have) this.text(`owned x${have}`, x + cw / 2, y + ch - 14, 10, '#2a9d5c', 700);
      this.buttons.push({ x, y, w: cw, h: ch, onTap: () => this.choosePerk(id) });
    });
    this.text(t('tapCard'), cx, midY + 132, 12, 'rgba(255,255,255,0.7)', 600);
  }

  /** Before a run: choose which owned boosters to use (unpicked ones stay in the bag). */
  private drawPicker(blocker: () => void): void {
    const { ctx } = this;
    const pk = this.picker!;
    const cx = WORLD_W / 2;
    const owned = BOOSTERS.filter((b) => (this.boosters[b.id] ?? 0) > 0);
    blocker();
    ctx.fillStyle = 'rgba(20,10,25,0.8)';
    ctx.fillRect(-this.offX, 0, WORLD_W + this.offX * 2, this.viewH);
    this.qaCover();
    const rows = Math.ceil(owned.length / 3);
    const h = 150 + rows * 96;
    const y = Math.max(this.insets.top + 50, this.viewH / 2 - h / 2);
    this.card(20, y, WORLD_W - 40, h, '#2a1a33');
    const title = pk.mode === 'journey' ? `LEVEL ${pk.level} · ${chefFor(pk.level).name}` : pk.mode === 'special' ? 'DAILY SPECIAL' : pk.mode === 'zen' ? 'ZEN' : pk.mode === 'time' ? 'TIME ATTACK' : pk.mode === 'gauntlet' ? '⚔️ GAUNTLET' : pk.mode === 'critic' ? '🧐 FOOD CRITIC' : 'FRIEND CHALLENGE';
    this.fitText(title, cx, y + 26, WORLD_W - 80, 18, '#ffffff', 'center', 700);
    this.fitText(t('pickBoosters'), cx, y + 50, WORLD_W - 60, 11.5, 'rgba(255,255,255,0.75)');
    owned.forEach((b, i) => {
      const bx = 36 + (i % 3) * 112;
      const by = y + 70 + Math.floor(i / 3) * 96;
      const on = pk.picked.has(b.id);
      this.card(bx, by, 104, 86, on ? 'rgba(255,211,77,0.22)' : 'rgba(255,255,255,0.07)');
      if (on) {
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 2.5;
        this.roundRect(bx, by, 104, 86, 14);
        ctx.stroke();
      }
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(bx + 52, by + 26, 17, 0, Math.PI * 2);
      ctx.fill();
      this.text(b.glyph, bx + 52, by + 27, 14, '#fff', 700);
      this.fitText(b.name, bx + 52, by + 56, 96, 11.5, '#fff', 'center', 700);
      this.text(`x${this.boosters[b.id]}`, bx + 52, by + 73, 10.5, 'rgba(255,255,255,0.65)', 600);
      // Tick box in the corner.
      ctx.fillStyle = on ? '#2a9d5c' : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(bx + 90, by + 14, 9, 0, Math.PI * 2);
      ctx.fill();
      if (on) this.text('✓', bx + 90, by + 15, 12, '#fff', 700);
      this.buttons.push({ x: bx, y: by, w: 104, h: 86, onTap: () => { if (on) pk.picked.delete(b.id); else pk.picked.add(b.id); } });
    });
    const by = y + h - 64;
    const all = pk.picked.size === owned.length;
    this.button(36, by, 96, 44, t('back'), () => { this.picker = null; }, 'quiet');
    this.button(140, by, 96, 44, all ? t('none') : t('all'), () => { pk.picked = new Set(all ? [] : owned.map((b) => b.id)); }, 'quiet');
    this.button(244, by, 120, 44, pk.picked.size ? `${t('start')} (${pk.picked.size})` : t('start'), () => {
      this.progress.lastBoosters = [...pk.picked];
      this.progress.persist();
      this.picker = null;
      this.startRun(pk.level, pk.mode, { ...pk.opts, picked: pk.picked });
    }, 'gold');
  }

  /** Draws text wrapped to a width, centred on x, starting at y. */
  private wrapText(str: string, x: number, y: number, maxW: number, size: number, color: string, weight = 600): number {
    const { ctx } = this;
    ctx.font = `${weight} ${size}px ${FONT}`;
    const words = str.split(' ');
    let line = '';
    let yy = y;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        this.text(line, x, yy, size, color, weight);
        ctx.font = `${weight} ${size}px ${FONT}`;
        line = w;
        yy += size * 1.35;
      } else line = test;
    }
    if (line) this.text(line, x, yy, size, color, weight);
    return yy + size * 1.35;
  }

  private panel(y: number, title: string, sub: string): void {
    this.text(title, WORLD_W / 2, y - 30, 38, '#fff', 900);
    this.text(sub, WORLD_W / 2, y + 8, 17, 'rgba(255,255,255,0.85)', 600);
  }
}

