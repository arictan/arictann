import { FONT } from './font';
import { Capacitor } from '@capacitor/core';
import { sfx, unlockAudio, setMuted } from './audio';
import { askForReminders, haptic, save, scheduleReminder } from './platform';
import { setMusic, setMusicIntensity } from './audio';
import { COMPANIONS, STICKER_SETS, SET_REWARD, ALBUM_REWARD, companionLevel, nekoBlocks, shardsForNext, rollSticker, stickerRarity, AREAS, AREA_MAX, RESTAURANTS, areaCost } from './collect';
import { CUP_SIZE, CREW_GOALS, CREW_MATES, HOLIDAY_GOAL, PASS_TIERS, PASS_XP, RACE_GOAL, RACE_POOL, TOUR_GOALS, crewMateOrders, crewWeek, cupReward, cupRivals, cupWeekend, currentHoliday, currentSeason, currentTour, passReward, raceEnd, raceFinishers, seeded, timeLeft, type Reward } from './live';
import { PRODUCTS, buyReal, monetize, nativeAds, showRewardedAd, type ProductId } from './monetize';
import { decodeChallenge, encodeChallenge, shareCard, type Challenge } from './share';
import { STORY_LEVELS, PIECES_FOR, Progress, RECIPE_GOAL, STREAK_REWARDS, WEEKLY_GOALS, dayKey, daySeed, missionText, type MissionKind, starsNeeded } from './progress';
import { THEMES, drawBackdrop, drawHolidayOverlay, makeSpecks, type Theme } from './themes';
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

interface Recipe { name: string; pattern: Ingredient[]; level?: number }

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
];
const BASIC_RECIPES = RECIPES.filter((r) => !r.level); // always available (puzzles, missions)

type SpecialLayer = 'golden' | 'ice' | 'wasabi' | 'mystery';

interface Layer {
  x: number; // left edge
  y: number; // top edge
  w: number;
  kind: Ingredient;
  origin: number; // world x where this layer's texture is anchored, so trimming never shifts it
  special?: SpecialLayer; // rare layers that change the drop (see spawnMoving)
}

type RunMode = 'journey' | 'special' | 'zen' | 'time' | 'puzzle' | 'challenge';

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

interface Order { recipe: Recipe; length: number; start: number; reward: number }

// Things the chef throws. Coordinates are world units.
interface Projectile { kind: 'knife' | 'patty'; x: number; y: number; vx: number; vy: number; rot: number; target: Layer | null; dodged: boolean }

interface Splat { x: number; y: number; r: number; life: number; seed: number } // screen units

const ATTACK_INFO: Record<Attack, { label: string; line: string; windup: number }> = {
  flurry: { label: 'KNIFE FLURRY!', line: 'RAAAGH!', windup: 1.1 },
  knife: { label: 'KNIFE THROW!', line: 'Catch this!', windup: 1.0 },
  slam: { label: 'TABLE SLAM!', line: 'Hmph!', windup: 0.9 },
  splat: { label: 'SOY SPLASH!', line: 'Oops, soy sauce!', windup: 0.7 },
};

const HELP_INFO: Record<Help, { label: string; line: string }> = {
  slow: { label: 'STEADY HANDS!', line: 'Take your time.' },
  patch: { label: 'PATCH UP!', line: 'Let me fix that!' },
  tip: { label: 'TIP!', line: 'For you!' },
};

type Mode = 'title' | 'playing' | 'dead' | 'shop' | 'map' | 'album' | 'modes' | 'events' | 'more' | 'restaurant' | 'pass' | 'pets' | 'boards';
type AlbumTab = 'chefs' | 'stickers' | 'recipes' | 'records';

interface Button { x: number; y: number; w: number; h: number; onTap: () => void }

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
  private dish: { recipe: Recipe; t: number; from: { x: number; y: number }; side: number; look: number; ate: boolean } | null = null; // served-order animation
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
  private resultKind: 'lost' | 'special' | 'gate' | 'zen' | 'time' | 'puzzle-won' | 'puzzle-lost' | 'challenge' = 'lost';

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
  private shareOverlay: { image: HTMLCanvasElement; code: string } | null = null;
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
  private picker: { level: number; mode: RunMode; opts: { puzzle?: number; challenge?: Challenge }; picked: Set<BoosterId> } | null = null;
  private picked: Set<BoosterId> | null = null; // boosters chosen for the current run

  constructor(private canvas: HTMLCanvasElement, private safeProbe: HTMLElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');
    this.ctx = ctx;
    setMuted(this.muted);
    this.resize();
    this.reset();
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
    return this.mode !== 'playing' && this.mode !== 'dead' && this.mode !== 'title';
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
    this.banner = { title: this.special ? 'DAILY SPECIAL' : `LEVEL ${this.level}`, sub: c.rule, life: 2.4 };
    this.bubble = { text: c.intro, life: 2.2 };
    this.reaction = null;
    this.sinceEvent = 0; // give the player a few drops before the new boss acts
    this.switchSides();
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
    this.stack = [{ x, y: -LAYER_H, w: this.baseW, kind: 'rice', origin: x }];
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
    else if (this.runMode === 'puzzle') this.startRun(1, 'puzzle', { puzzle: this.resultKind === 'puzzle-won' ? Math.min(PUZZLES - 1, this.puzzle + 1) : this.puzzle });
    else if (this.runMode === 'challenge' && this.challenge) this.startRun(this.challenge.level, 'challenge', { challenge: this.challenge });
    else if (this.special) this.startRun(this.specialLevel(), 'special');
    else this.startRun(this.level);
  }

  private get special(): boolean {
    return this.runMode === 'special';
  }

  /** Runs that use journey progress: they unlock chefs, earn stars and respect star gates. */
  private get journey(): boolean {
    return this.runMode === 'journey';
  }

  /** Zen, Time Attack and Puzzles have no chef attacks or help. */
  private get calmChefs(): boolean {
    return this.runMode === 'zen' || this.runMode === 'time' || this.runMode === 'puzzle';
  }

  /**
   * Starts a run. Journey runs start at a chef level (by default the furthest one open); other modes
   * pick their own setup. Every run is seeded so a challenge code can replay it.
   */
  private startRun(level = this.progress.playLevel, mode: RunMode = 'journey', opts: { puzzle?: number; challenge?: Challenge; picked?: Set<BoosterId> } = {}): void {
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
    this.baseW = levelW + (use('wide') ? WIDE_W - BASE_W : 0);
    this.magnet = use('magnet');
    this.shield = use('shield');
    this.lucky = use('lucky');
    this.shortOrders = use('short');
    const streak = use('streak');
    this.chanceUsed = false;
    save.setBoosters(this.boosters);
    this.perks = {};
    this.perkChoice = null;
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
    if (this.progress.tutorial === 0) this.coach('TAP TO DROP', 'Tap anywhere when the layer is over the stack', 8);
    else if (this.progress.tutorial === 1) this.coach('AIM FOR PERFECT', 'Line it up exactly for a PERFECT and keep the full width', 6);
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
    // Chef Rank, the Kitsune companion and finished restaurants all add percentage bonuses.
    const restaurants = this.progress.restaurant.r + this.progress.restaurant.michelin;
    n = Math.max(1, Math.round(n * (this.progress.coinBonus + this.foxBonus + restaurants * 0.05)));
    this.runCoins += n;
    this.popup(x, y, `${label} +${n} coins`, '#ffd34d', 16);
    this.mission('coinsRun', this.runCoins);
  }

  /** Coins that go straight to the bank (mission rewards, chests, gifts), saved immediately. */
  private bankCoins(n: number): void {
    this.bank += n;
    save.setCoins(this.bank);
  }

  private mission(kind: MissionKind, amount = 1, recipe?: string): void {
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
    if (this.runMode === 'puzzle') {
      const cfg = puzzleConfig(this.puzzle);
      this.order = { recipe: BASIC_RECIPES[this.puzzle % BASIC_RECIPES.length], length: cfg.layers, start: this.height, reward: 0 };
      return;
    }
    if (this.special) {
      // Everyone gets the same Daily Special: one long order of a set recipe.
      this.order = { recipe: RECIPES[daySeed() % RECIPES.length], length: 10 - (this.shortOrders ? 2 : 0), start: this.height, reward: 0 };
      return;
    }
    // Early levels use the simple recipes; the full menu opens up further along the journey.
    // Recipes with newer ingredients join the menu at their level; the newest one is a bit more likely.
    const pool = RECIPES.filter((r) => (r.level ?? 0) <= this.level);
    const fresh = pool.filter((r) => r.level && r.level > this.level - 5);
    const recipe = fresh.length && this.rand() < 0.4 ? fresh[0] : pool[Math.floor(this.rand() * Math.min(pool.length, 2 + n))];
    // Orders grow to 12 layers early on, then keep growing slowly in endless mode (up to 20).
    const endless = Math.min(8, Math.max(0, Math.floor((this.level - STORY_LEVELS) / 10)));
    const length = Math.min(5 + Math.floor(n / 2), 12) + endless + this.chef.extra - (this.shortOrders ? 2 : 0);
    this.order = { recipe, length: Math.max(3, length), start: this.height, reward: 0 };
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
    if (this.progress.tutorial < 2 && this.height < 4) v *= 0.6; // first run: gentle start
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
    if (m.kind === 'unagi') {
      // Slippery: the eel slides on a little after the tap.
      m.x += 10 * this.moveDir;
      m.origin += 10 * this.moveDir;
    }
    const top = this.top;
    const dx = m.x - top.x;
    if (this.progress.tutorial === 0) {
      this.progress.tutorial = 1;
      this.coach('Line them up!', 'Drop each layer exactly on the one below for a PERFECT. PERFECTs build your combo.', 3.5);
    }

    const tol = (this.chef.tight && this.runMode !== 'puzzle' ? TIGHT_TOL : PERFECT_TOL) + (this.magnet ? 4 : 0) + (this.fever > 0 ? 8 : 0) + (this.perks.magnet ?? 0) * 2;
    if (Math.abs(dx) <= tol) {
      m.origin -= dx;
      m.x = top.x;
      this.combo += m.kind === 'ebi' ? 2 : 1; // ebi counts double
      this.orderStats.perfects++;
      if (this.progress.tutorial === 1) this.progress.tutorial = 2;
      if (this.combo >= 3 && m.w < this.baseW) {
        const grow = Math.min(REGROW + (this.perks.regrow ?? 0) * 4, this.baseW - m.w);
        m.x -= grow / 2;
        m.w += grow;
      }
      this.place(m);
      const cx = m.x + m.w / 2;
      this.popup(cx, m.y - 18, this.combo > 1 ? `PERFECT x${this.combo}` : 'PERFECT', '#fff3b0', 18);
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
    const colors = ['#ff8a5b', '#ffd34d', '#8fdc93', '#9fe3ff', '#ff5d8f', '#e0aaff'];
    for (let i = 0; i < 70; i++) {
      this.confetti.push({ x: Math.random() * WORLD_W, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 160, rot: Math.random() * 6, color: colors[i % colors.length], life: 3 });
    }
    sfx.celebrate();
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
  private watchAd(label: string, onReward: () => void): void {
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
    const c = this.chef;
    const sloppy = this.combo === 0;
    const bad = this.shield ? 0 : (c.mean + (sloppy ? 0.08 : 0)) * (1 + this.rage * 0.6);
    const good = c.kind * (this.combo >= 3 ? 0.35 : this.combo >= 1 ? 0.15 : 0.06) * (this.lucky ? 2 : 1) * (1 + (this.perks.tips ?? 0) * 0.5);
    const r = this.rand();
    if (r < bad) {
      // Raging bosses add a flurry of knives to their moves.
      const kind: Attack = this.rage && this.rand() < 0.4 ? 'flurry' : c.attacks[Math.floor(this.rand() * c.attacks.length)];
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
    const coins = Math.max(1, Math.round(this.order.reward * 2));
    const beatLevel = this.level;
    const beaten = this.chef;
    const recipe = this.order.recipe.name;
    const stars = Progress.starsFor(this.orderStats.perfects, this.orderStats.drops);
    const flawless = this.orderStats.slices === 0;
    this.ordersServed++;
    this.banner = null;
    // The finished roll pops up, then drops down to a customer at the bottom corner.
    this.dish = { recipe: this.order.recipe, t: 0, from: { x: top.x + top.w / 2, y: top.y - this.camY - 30 }, side: -this.chefSide, look: Math.random(), ate: false };
    this.flags.push({ x: top.x + top.w / 2, y: top.y, hue: (this.ordersServed * 47) % 360 });
    this.addCoins(coins + 5 * beatLevel, WORLD_W / 2, top.y - 34, `${beaten.name} beaten!`);
    this.popup(WORLD_W / 2, top.y - 58, '★'.repeat(stars) + '☆'.repeat(3 - stars), '#ffd34d', 26, 1.6);
    this.react('happy', 1.2, beaten.beaten);
    if (this.runMode === 'puzzle') {
      this.puzzleWon();
      return;
    }

    // Long-term progress: stars and the next chef unlocked, chef card, missions, recipe book, chest.
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
    // The next boss steps in after the beaten one has had a moment to react.
    this.introIn = 1.2;
    // Pick a perk for the rest of the run (journey and challenges).
    if (this.runMode === 'journey' || this.runMode === 'challenge') {
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
    if (this.runMode === 'puzzle' || this.calmChefs || this.level % 10 !== 0) return;
    const done = (this.height - this.order.start) / this.order.length;
    const phase = done >= 0.85 && this.level > STORY_LEVELS ? 2 : done >= 0.5 ? 1 : 0;
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
    this.resultKind = this.runMode === 'puzzle' ? 'puzzle-lost' : this.runMode === 'time' ? 'time' : this.runMode === 'challenge' ? 'challenge' : 'lost';
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
  }

  /** Banks the run's coins and records it (top runs, weekly challenge, loss streak). */
  private endRun(): void {
    const p = this.progress;
    // Only bank what hasn't been banked yet (a continue can end the same run twice).
    const fresh = this.runCoins - this.bankedRunCoins;
    this.bankedRunCoins = this.runCoins;
    this.bank += fresh;
    save.setCoins(this.bank);
    // A slice of every run's coins also drops into the piggy bank, up to 2,500.
    p.piggy = Math.min(2500, p.piggy + Math.floor(fresh * 0.15));
    if (this.runMode === 'zen') p.zenBest = Math.max(p.zenBest, this.height);
    if (this.runMode === 'time') p.timeBest = Math.max(p.timeBest, this.height);
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
    this.resultKind = 'special';
    this.specialWon = true;
    this.mode = 'dead';
    this.deadAt = this.time;
    this.moving = null;
    this.event = null;
    this.projectiles = [];
    this.bubble = { text: this.chef.beaten, life: 99 };
    if (this.progress.specialDay !== dayKey()) {
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
      if (this.fever > 0 && !this.perkChoice) this.fever -= real;
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

    if (this.tip && (this.tip.t -= real) <= 0) this.tip = null;
    if (this.mode === 'playing' && !this.perkChoice) this.updateRage(real);
    if (m && this.mode !== 'dead' && !this.perkChoice && !this.picker) {
      const step = this.speed() * dt * this.moveDir;
      m.x += step;
      m.origin += step;
      // Bounce at the edges so a player who waits always gets another pass.
      const min = -m.w * 0.5;
      const max = WORLD_W - m.w * 0.5;
      if (m.x < min) { m.origin += min - m.x; m.x = min; this.moveDir = 1; }
      if (m.x > max) { m.origin += max - m.x; m.x = max; this.moveDir = -1; }
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
    return { x: this.insets.left + 26, y: this.insets.top + 30, r: 14 };
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
      this.drawLayer(this.moving);
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
    }
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

    this.drawHud();
    this.drawOverlays();
    this.drawToast();
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
    r = Math.min(r, w / 2, h / 2);
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
    return e.kind === 'knife' || e.kind === 'flurry' ? 'knife' : e.kind === 'slam' ? 'fist' : e.kind === 'patch' ? 'patty' : null;
  }

  private drawBossBody(x: number, y: number, s: number): void {
    // Watch and point at the sliding layer; on the results screen, at the player.
    const m = this.moving;
    const lookX = m && this.mode === 'playing' ? m.x + m.w / 2 : x;
    const lookY = m && this.mode === 'playing' ? m.y + LAYER_H / 2 - this.camY : y + 300;
    drawChef(this.ctx, this.chef, x, y, s, this.chefMood(), lookX, lookY, this.time, this.mode === 'playing' ? this.holding() : null);
  }

  private drawBossLabels(x: number, y: number, s: number): void {
    const { ctx } = this;
    const c = this.chef;
    const e = this.event;
    const chestY = y + 42 * s;
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
    const by = this.mode === 'playing' ? y + 8 * s : y - 34 * s;
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
      ctx.strokeText('ORDER UP!', peak.x, peak.y - 50);
      this.text('ORDER UP!', peak.x, peak.y - 50, 26, '#ffd34d', 900);
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
      const bx = d.side < 0 ? cx + 30 : cx - 30 - 66;
      ctx.fillStyle = '#ffffff';
      this.roundRect(bx, cy - 40, 66, 26, 13);
      ctx.fill();
      this.text('Yum!', bx + 33, cy - 26.5, 14, '#3a1d12', 900);
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
    }
    this.text('next', x + 12 + 6 * 22 + 4, y + 42, 10, 'rgba(90,46,31,0.6)', 700, 'left');
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
    ctx.arc(WORLD_W - this.insets.right - 24, top + 30, 8, 0, Math.PI * 2);
    ctx.fill();
    const coins = this.bank + (this.mode === 'playing' ? this.runCoins : 0);
    this.text(String(coins), WORLD_W - this.insets.right - 38, top + 31, 16, '#ffd34d', 700, 'right');
  }

  /** Draws a tappable button and registers its hit area for this frame. */
  private button(x: number, y: number, w: number, h: number, label: string, onTap: () => void, style: 'primary' | 'gold' | 'quiet' = 'primary'): void {
    this.drawButton(x, y, w, h, label, style, h >= 40 ? 15 : 12.5);
    this.buttons.push({ x, y, w, h, onTap });
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

    this.text(String(this.height), cx, top + 62, this.fever > 0 && this.mode === 'playing' ? 42 : 50, '#fff', 900);
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
    }
    if (this.mode === 'playing' && this.runMode === 'time') {
      this.text(`⏱ ${Math.ceil(this.timeLeft)}s`, WORLD_W - 70, top + 64, 22, this.timeLeft < 10 ? '#ff6b6b' : '#ffffff', 900);
    }
    if (this.mode === 'playing' && this.runMode === 'zen') {
      this.button(WORLD_W - 84, top + 50, 70, 32, 'END', () => this.endZen(), 'quiet');
    }
    if (this.mode === 'playing') {
      this.drawOrderCard(top + 100);
      this.drawBossLabels(this.chefX, this.bossY(), this.bossScale());
      this.drawServe();
    }

    if (this.paused) {
      this.panel(midY, 'PAUSED', 'Tap to resume');
    } else if (this.mode === 'dead') {
      this.drawResults();
    }
  }

  private resultTitle(): string {
    switch (this.resultKind) {
      case 'gate': return 'STAR GATE!';
      case 'special': return 'SPECIAL CLEARED!';
      case 'zen': return 'ZEN COMPLETE';
      case 'time': return this.timeLeft <= 0 ? 'TIME’S UP!' : 'DROPPED IT!';
      case 'puzzle-won': return `PUZZLE ${this.puzzle + 1} SOLVED!`;
      case 'puzzle-lost': return this.orderStats.slices > puzzleConfig(this.puzzle).maxSlices ? 'TOO MANY SLICES!' : 'PUZZLE FAILED';
      case 'challenge': return this.challenge && this.height > this.challenge.score ? 'YOU WIN!' : 'FRIEND WINS';
      default: return this.newBest ? 'NEW BEST!' : 'DROPPED IT!';
    }
  }

  private resultSub(): string {
    const layers = `${this.height} layer${this.height === 1 ? '' : 's'}`;
    switch (this.resultKind) {
      case 'zen': return `${layers} · Zen best ${this.progress.zenBest}`;
      case 'time': return `${layers} in 60s · best ${this.progress.timeBest}`;
      case 'puzzle-won': case 'puzzle-lost': {
        const cfg = puzzleConfig(this.puzzle);
        return `${layers}/${cfg.layers} · ${this.orderStats.slices}/${cfg.maxSlices} slices · ${'★'.repeat(this.progress.puzzleStars[this.puzzle] || 0)}`;
      }
      case 'challenge': return `You ${this.height} · friend ${this.challenge?.score ?? 0}`;
      case 'special': return `Daily Special · ${layers}`;
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
    this.text(`${beaten} chef${beaten === 1 ? '' : 's'} beaten   ·   +${this.runCoins} coins`, cx, cardTop + 108, 15, '#ffd34d', 700);
    if (this.gated) this.text(`Need ${this.gated}★ for level ${this.level} · you have ${this.progress.totalStars}★. Replay chefs for 3 stars!`, cx, cardTop + 130, 11, '#9fe3ff', 700);
    const gap = this.best - this.height;
    if (this.resultKind === 'lost' && !this.newBest && gap > 0 && gap <= 3) this.text(`So close! Only ${gap} more for a new best`, cx, cardTop + 130, 14, '#ffb4a2', 700);
    const ws = this.progress.winStreak;
    if (this.journey) this.text(ws ? `🔥 Win streak ${ws}${ws < 3 ? ' · 3 = hot start' : ws < 5 ? ' · 5 = steady hands' : ws < 8 ? ' · 8 = free Second Chance' : ''}` : 'Win streak lost · beat a chef to start a new one', cx, cardTop + 152, 12, '#ffb703', 700);
    const m = [...this.progress.missions].sort((a2, b2) => b2.progress / b2.target - a2.progress / a2.target)[0];
    if (m) this.text(`Mission: ${missionText(m)}  ${m.progress}/${m.target}`, cx, cardTop + 174, 12, 'rgba(255,255,255,0.8)', 600);
    const goal = this.nextGoal();
    if (goal) {
      const have = Math.min(this.bank, goal.price);
      const can = this.bank >= goal.price;
      this.text(can ? `You can buy the ${goal.name}!` : `Next: ${goal.name}  ${have}/${goal.price}`, cx, cardTop + 198, 13, can ? '#ffd34d' : 'rgba(255,255,255,0.85)', 700);
      this.bar(70, cardTop + 210, WORLD_W - 140, have / goal.price, '#ffd34d');
    }
    if (this.time - this.deadAt > 0.7) {
      // Optional ad rewards and sharing.
      const canContinue = !this.revived && (this.resultKind === 'lost' || this.resultKind === 'challenge');
      const row1: [string, () => void, 'primary' | 'gold' | 'quiet'][] = [];
      if (canContinue) row1.push([this.progress.vip ? 'CONTINUE' : '▶ CONTINUE', () => this.watchAd('Continue this run', () => this.revive()), 'gold']);
      if (!this.doubled && this.runCoins > 0) row1.push([`▶ +${this.runCoins}`, () => this.watchAd('Double your coins', () => { this.doubled = true; this.bankCoins(this.runCoins); this.showToast(`Coins doubled: +${this.runCoins}`); }), 'gold']);
      row1.push(['SHARE', () => this.shareRun(), 'quiet']);
      const w1 = (WORLD_W - 72 - (row1.length - 1) * 8) / row1.length;
      row1.forEach(([label, go, style], i) => this.button(36 + i * (w1 + 8), cardTop + 232, w1, 44, label, go, style));
      const second = this.journey || this.resultKind === 'gate' ? ['MAP', () => this.openMap()] as const : ['MODES', () => this.openScreen('modes')] as const;
      this.button(36, cardTop + 290, 96, 46, 'HOME', () => { this.mode = 'title'; this.reset(); }, 'quiet');
      this.button(140, cardTop + 290, 108, 46, second[0], second[1], 'quiet');
      this.button(256, cardTop + 290, 108, 46, this.resultKind === 'puzzle-won' ? 'NEXT' : this.resultKind === 'gate' ? 'GET STARS' : 'RETRY', () => this.retry());
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
    this.text('SUSHI', cx, top + 80, 44, '#ffffff', 900);
    this.text('STACK', cx, top + 120, 44, '#ff8a5b', 900);

    // Streak chips: win streak, daily streak (with freezes), Chef Rank.
    const chips = [`🔥 Win ${p.winStreak}`, `📅 Day ${save.giftDay() === Game.day() || save.giftDay() === Game.day(-1) ? save.giftStreak() : 0} ${'❄'.repeat(p.freezes)}`, `👑 Rank ${p.rank}`];
    chips.forEach((c, i) => {
      const x = 24 + i * 120;
      ctx.fillStyle = 'rgba(20,10,25,0.75)';
      this.roundRect(x, top + 146, 112, 26, 13);
      ctx.fill();
      this.text(c, x + 56, top + 159.5, 12, '#fff', 800);
    });

    // Big play button.
    const lvl = p.playLevel;
    const pulse = 1 + 0.03 * Math.sin(this.time * 4);
    ctx.save();
    ctx.translate(cx, top + 210);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff8a5b';
    this.roundRect(-170, -28, 340, 56, 28);
    ctx.fill();
    this.text(`PLAY · LEVEL ${lvl}`, 0, -4, 22, '#fff', 900);
    const gate = p.unlocked > lvl ? starsNeeded(p.unlocked) : 0;
    this.text(gate ? `Gate to ${p.unlocked}: ${p.totalStars}/${gate}★` : chefFor(lvl).name, 0, 16, 11, 'rgba(255,255,255,0.9)', 700);
    ctx.restore();
    this.buttons.push({ x: cx - 170, y: top + 182, w: 340, h: 56, onTap: () => this.startRun() });

    this.announceUnlocks();
    // Gift (with Maki the cat) and modes. Locked features show the level that opens them.
    const ready = this.giftReady();
    if (this.lockedAt('gift')) this.lockedButton(30, top + 250, 165, 42, 'gift', 'GIFT');
    else {
      this.button(30, top + 250, 165, 42, ready ? '   DAILY GIFT' : '   GIFT TOMORROW', () => this.claimGift(), ready ? 'gold' : 'quiet');
      this.text(ready ? '😺' : '😸', 52, top + 271 + (ready ? Math.sin(this.time * 6) * 3 : 0), 22, '#fff', 400);
    }
    if (this.lockedAt('modes')) {
      this.lockedButton(205, top + 250, 165, 42, 'modes', 'MODES');
      this.lockedButton(30, top + 300, 340, 40, 'modes', 'DAILY SPECIAL');
    } else {
      this.button(205, top + 250, 165, 42, 'MODES', () => this.openScreen('modes'));
      const specialDone = p.specialDay === dayKey();
      this.button(30, top + 300, 340, 40, specialDone ? 'DAILY SPECIAL ✓ (practice)' : 'DAILY SPECIAL · +150 COINS', () => this.startRun(this.specialLevel(), 'special'), specialDone ? 'quiet' : 'gold');
    }
    if (this.lockedAt('gift')) this.drawHowTo(top + 350);
    else this.drawMissions(top + 350);

    // Event ticker.
    const tour = currentTour();
    const hol = currentHoliday();
    const tick = `🌏 ${tour.city.name} tour · ${timeLeft(tour.end)}${hol ? `   🎉 ${hol.holiday.name}` : ''}`;
    this.text(tick, cx, top + 498, 11.5, '#9fe3ff', 800);

    // Bottom navigation with badges for things waiting to be claimed.
    const navY = this.viewH - this.insets.bottom - 62;
    ctx.fillStyle = 'rgba(20,10,25,0.95)';
    ctx.fillRect(-this.offX, navY, WORLD_W + this.offX * 2, 62 + this.insets.bottom);
    const eventsBadge = (p.race.finished && !p.race.claimed) || (p.ads.chests < 3);
    const moreBadge = this.passClaimable() > 0;
    const nav: [string, string, () => void, boolean, string][] = [
      ['🗺️', 'MAP', () => this.openMap(), false, 'map'],
      ['🎉', 'EVENTS', () => this.openScreen('events'), eventsBadge, 'events'],
      ['🛒', 'SHOP', () => this.openShop(), false, 'shop'],
      ['🏯', 'RESTAURANT', () => this.openScreen('restaurant'), p.starPool >= areaCost(p.restaurant.r + p.restaurant.michelin, 1), 'restaurant'],
      ['☰', 'MORE', () => this.openScreen('more'), moreBadge, 'more'],
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
        this.buttons.push({ x, y: navY, w: nw, h: 62, onTap: go });
        return;
      }
      this.text(icon, x + nw / 2, navY + 22, 22, '#fff', 400);
      this.text(label, x + nw / 2, navY + 46, 9.5, 'rgba(255,255,255,0.8)', 700);
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
      this.buttons.push({ x, y: navY, w: nw, h: 62, onTap: go });
    });
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
    this.text('HOW TO PLAY', WORLD_W / 2, y + 20, 13, '#ffd34d', 700);
    const lines: [string, string][] = [
      ['👆', 'Tap to drop the sliding layer on the stack'],
      ['✂️', 'Whatever hangs over the edge gets sliced off'],
      ['👨‍🍳', 'Finish the chef’s order to beat them'],
    ];
    lines.forEach(([icon, t], i) => {
      this.text(icon, 50, y + 50 + i * 28, 17, '#fff', 400);
      this.text(t, 70, y + 50 + i * 28, 12.5, '#fff', 600, 'left');
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
    const shape = this.progress.bestShape;
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
      ctx.strokeStyle = `rgba(200,230,255,${i > this.height ? 0.35 : 0.18})`;
      this.roundRect(x, y, w, LAYER_H, 6);
      ctx.stroke();
    }
    ctx.restore();
    if (to > this.height + 1) this.text('👻 your best run', shape[to][0] + shape[to][1] / 2, -LAYER_H * (to + 1) - 10, 10, 'rgba(200,230,255,0.6)', 600);
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
    this.button(16, backY, WORLD_W - 32, 46, 'BACK', () => { this.mode = this.shopFrom === 'map' ? 'title' : this.shopFrom; }, 'quiet');
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
      for (const r of RECIPES) {
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
    this.button(16, backY, WORLD_W - 32, 46, 'BACK', () => { this.mode = this.shopFrom; }, 'quiet');
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
      this.text('▾ more', cx, areaTop + areaH - 8, 11, 'rgba(255,255,255,0.8)', 800);
    }

    this.button(16, backY, WORLD_W - 32, 46, 'BACK', () => { this.mode = this.shopFrom; this.shopSel = null; }, 'quiet');
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
    this.text(title, WORLD_W / 2, top + 31, 22, '#fff', 900);
    if (sub) this.text(sub, WORLD_W / 2, top + 56, 12, '#ffd34d', 700);
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
    this.button(16, frame.backY, WORLD_W - 32, 46, 'BACK', () => { this.mode = this.screenBack; }, 'quiet');
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

  /** A small pill button inside a list. */
  private pill(x: number, y: number, w: number, label: string, frame: { areaTop: number; areaH: number }, onTap: () => void, style: 'primary' | 'gold' | 'quiet' = 'primary'): void {
    this.drawButton(x, y, w, 32, label, style, 12);
    this.listTap(x, y, w, 32, frame, onTap);
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
      ['🍱 Daily Special', p.specialDay === dayKey() ? 'Cleared today, practice anytime' : 'One special order, +150 coins today', 'PLAY', () => this.startRun(this.specialLevel(), 'special')],
      ['🤝 Friend Challenge', 'Enter a friend’s code and beat their score', 'ENTER CODE', () => this.openCodeInput()],
    ];
    for (const [name, desc, label, go] of modes) {
      this.card(16, y, WORLD_W - 32, 70);
      this.text(name, 32, y + 24, 16, '#fff', 900, 'left');
      this.text(desc, 32, y + 48, 11, 'rgba(255,255,255,0.75)', 600, 'left');
      this.pill(WORLD_W - 128, y + 19, 98, label, f, go, 'gold');
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
      ['🐾', 'Companions', `${COMPANIONS.filter((c) => companionLevel(p.shards[c.id] ?? 0) > 0).length}/${COMPANIONS.length} unlocked`, () => this.openScreen('pets', 'more')],
      ['📒', 'Album', 'Chef cards, stickers, records', () => { this.openAlbum(); this.shopFrom = 'more'; }],
      ['🏆', 'Leaderboards', 'Your best runs and the Cup', () => this.openScreen('boards', 'more')],
      ['🤝', 'Friend Code', 'Play a friend’s challenge', () => this.openCodeInput()],
      ['🎵', `Music: ${this.musicOn ? 'ON' : 'OFF'}`, 'Tap to switch', () => this.toggleMusic()],
      ['🔊', `Sound: ${this.muted ? 'OFF' : 'ON'}`, 'Tap to switch', () => { this.muted = !this.muted; setMuted(this.muted); save.setMuted(this.muted); }],
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

  private drawRestaurant(): void {
    const p = this.progress;
    const rs = p.restaurant;
    const R = RESTAURANTS[Math.min(rs.r, RESTAURANTS.length - 1)];
    const tier = rs.r + rs.michelin;
    const done = rs.levels.reduce((a, b) => a + b, 0);
    const f = this.screenBegin(rs.michelin ? `${R.name} ${'⭐'.repeat(Math.min(rs.michelin, 5))}` : R.name, `★ ${p.starPool} stars to spend · ${done}/${AREAS.length * AREA_MAX} upgrades`);
    let y = f.y0 + 4;
    this.drawRestaurantScene(16, y, WORLD_W - 32, 250, R.wall, R.floor, rs.levels);
    y += 262;
    this.wrapLeft('Earn stars by beating chefs (better stars add more). Each finished restaurant gives +5% coins forever.', 16, y + 2, WORLD_W - 32, 10, 'rgba(255,255,255,0.75)');
    y += 20;
    AREAS.forEach((a, i) => {
      const lv = rs.levels[i];
      this.card(16, y, WORLD_W - 32, 50);
      this.text(a.name, 32, y + 18, 13, '#fff', 800, 'left');
      for (let k = 0; k < AREA_MAX; k++) {
        this.ctx.fillStyle = k < lv ? '#ffd34d' : 'rgba(255,255,255,0.2)';
        this.roundRect(32 + k * 22, y + 30, 18, 8, 4);
        this.ctx.fill();
      }
      if (lv >= AREA_MAX) {
        this.text('✓ DONE', WORLD_W - 40, y + 25, 12, '#8fdc93', 900, 'right');
      } else {
        const cost = areaCost(tier, lv + 1);
        this.pill(WORLD_W - 132, y + 9, 100, `UPGRADE ★${cost}`, f, () => this.upgradeArea(i), p.starPool >= cost ? 'gold' : 'quiet');
      }
      y += 58;
    });
    this.screenEnd(f, y - f.y0);
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
    this.showToast(`${AREAS[i].name} upgraded! +${30 * rs.levels[i]} coins`);
    sfx.serve();
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

  /** The restaurant interior: every area is drawn at its current level (0 = an empty dashed spot). */
  private drawRestaurantScene(x: number, y: number, w: number, h: number, wall: string, floor: string, lv: number[]): void {
    const { ctx } = this;
    const L = (id: string) => lv[AREAS.findIndex((a) => a.id === id)];
    ctx.save();
    this.roundRect(x, y, w, h, 16);
    ctx.clip();
    ctx.fillStyle = wall;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = floor;
    ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
    const empty = (ex: number, ey: number, ew: number, eh: number) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      this.roundRect(ex, ey, ew, eh, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      this.text('+', ex + ew / 2, ey + eh / 2, 18, 'rgba(255,255,255,0.45)', 900);
    };
    // Sign
    const sl = L('sign');
    if (!sl) empty(x + w / 2 - 70, y + 10, 140, 34);
    else {
      if (sl >= 3) { ctx.shadowColor = '#ff3fa4'; ctx.shadowBlur = 16; }
      ctx.fillStyle = sl >= 2 ? '#2d1e2f' : '#8a5a3c';
      this.roundRect(x + w / 2 - 70, y + 10, 140, 34, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (sl >= 2) { ctx.strokeStyle = sl >= 3 ? '#ff3fa4' : '#c8553d'; ctx.lineWidth = 3; ctx.stroke(); }
      this.text('SUSHI', x + w / 2, y + 28, 16, sl >= 3 ? '#ffd6f0' : '#ffd34d', 900);
    }
    // Lanterns
    const ll = L('lanterns');
    if (!ll) empty(x + 16, y + 12, 60, 40);
    for (let i = 0; i < ll * 2; i++) {
      const lx = x + 30 + i * ((w - 60) / Math.max(1, ll * 2 - 1));
      if (Math.abs(lx - (x + w / 2)) < 80) continue;
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx, y + 22);
      ctx.stroke();
      if (ll >= 3) { ctx.shadowColor = '#ff6b6b'; ctx.shadowBlur = 14; }
      ctx.fillStyle = '#d7263d';
      ctx.beginPath();
      ctx.ellipse(lx, y + 34, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // Noren curtain (doorway, left)
    const nl = L('noren');
    if (!nl) empty(x + 14, y + 60, 70, 90);
    else {
      ctx.fillStyle = '#1a1010';
      ctx.fillRect(x + 14, y + 60, 70, 110);
      const cols = nl >= 2 ? ['#2d1e2f', '#c8553d', '#2d1e2f'] : ['#3d5a80', '#3d5a80', '#3d5a80'];
      cols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(x + 16 + i * 22.5, y + 60 + Math.sin(this.time * 2 + i) * 1.5, 21, 60);
      });
      if (nl >= 3) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 14, y + 58, 70, 4); }
      if (nl >= 2) this.text('寿司', x + 49, y + 88, 14, '#fff', 900);
    }
    // Wall art (right)
    const al = L('art');
    if (!al) empty(x + w - 104, y + 60, 86, 64);
    else {
      const fw = 50 + al * 12;
      const fh = 36 + al * 9;
      const fx = x + w - 20 - fw;
      ctx.fillStyle = al >= 3 ? '#d4a537' : '#5a3a22';
      ctx.fillRect(fx - 4, y + 60 - 4, fw + 8, fh + 8);
      ctx.fillStyle = '#f4ecd8';
      ctx.fillRect(fx, y + 60, fw, fh);
      ctx.fillStyle = '#3d6fb6';
      ctx.beginPath();
      if (al >= 2) {
        ctx.moveTo(fx + 6, y + 60 + fh - 4);
        ctx.lineTo(fx + fw / 2, y + 66);
        ctx.lineTo(fx + fw - 6, y + 60 + fh - 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(fx + fw / 2 - 8, y + 74);
        ctx.lineTo(fx + fw / 2, y + 66);
        ctx.lineTo(fx + fw / 2 + 8, y + 74);
        ctx.fill();
      } else {
        ctx.arc(fx + fw / 2, y + 60 + fh, fw / 3, Math.PI, 0);
        ctx.fill();
      }
      if (al >= 3) { ctx.fillStyle = '#d7263d'; ctx.beginPath(); ctx.arc(fx + fw - 12, y + 70, 6, 0, Math.PI * 2); ctx.fill(); }
    }
    // Fish tank (lower left)
    const ql = L('aquarium');
    if (!ql) empty(x + 100, y + 120, 80, 56);
    else {
      const tw2 = 50 + ql * 18;
      ctx.fillStyle = 'rgba(80,180,255,0.55)';
      this.roundRect(x + 96, y + 176 - (34 + ql * 8), tw2, 34 + ql * 8, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 0; i < ql * 2 - 1; i++) {
        const fx = x + 104 + ((this.time * (14 + i * 6) + i * 30) % (tw2 - 16));
        this.text(i % 2 ? '🐠' : '🐟', fx, y + 176 - 14 - i * 7, 12, '#fff', 400);
      }
      if (ql >= 3) this.text('🪸', x + 104, y + 168, 12, '#fff', 400);
    }
    // Bonsai garden (lower right)
    const gl = L('garden');
    if (!gl) empty(x + w - 100, y + 130, 80, 50);
    else {
      this.text(gl >= 2 ? '🌳' : '🪴', x + w - 60, y + 160 - gl * 4, 22 + gl * 6, '#fff', 400);
      if (gl >= 3) { this.text('🏮', x + w - 96, y + 166, 16, '#fff', 400); this.text('🪨', x + w - 24, y + 172, 12, '#fff', 400); }
    }
    // Counter
    const cl = L('counter');
    const cy = y + h * 0.72 - 6;
    if (!cl) empty(x + 30, cy - 10, w - 60, 36);
    else {
      const g = ctx.createLinearGradient(0, cy, 0, cy + 40);
      g.addColorStop(0, cl >= 3 ? '#f2f2f2' : cl >= 2 ? '#c08552' : '#8a5a3c');
      g.addColorStop(1, cl >= 3 ? '#bdbdbd' : '#5a3a22');
      ctx.fillStyle = g;
      ctx.fillRect(x + 20, cy, w - 40, 40);
      if (cl >= 3) { ctx.fillStyle = '#d4a537'; ctx.fillRect(x + 20, cy, w - 40, 4); }
      if (cl >= 2) for (let i = 0; i < 5; i++) { ctx.fillStyle = '#3a2418'; ctx.fillRect(x + 50 + i * ((w - 100) / 4) - 8, cy + 46, 16, 20); }
    }
    // Conveyor belt along the counter top
    const vl = L('conveyor');
    if (!vl) empty(x + 60, cy - 30, w - 120, 18);
    else {
      ctx.fillStyle = '#555';
      ctx.fillRect(x + 30, cy - 10, w - 60, 10);
      if (vl >= 2) {
        for (let i = 0; i < 6; i++) {
          const px = x + 30 + ((this.time * 30 + i * ((w - 60) / 6)) % (w - 60));
          ctx.fillStyle = ['#d7263d', '#3d6fb6', '#ffd34d'][i % 3];
          ctx.beginPath();
          ctx.ellipse(px, cy - 12, 12, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          if (vl >= 3) this.text(['🍣', '🍤', '🍙'][i % 3], px, cy - 20, 12, '#fff', 400);
        }
      }
    }
    ctx.restore();
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
    const f = this.screenBegin(`SUSHI PASS · SEASON ${season.n}`, `${timeLeft(season.end)} · XP: chefs, missions, specials, PERFECTs`);
    let y = f.y0 + 4;
    this.card(16, y, WORLD_W - 32, 74, 'rgba(60,20,80,0.95)');
    this.text(`Tier ${reached}/${PASS_TIERS}`, 32, y + 22, 16, '#fff', 900, 'left');
    this.text(reached >= PASS_TIERS ? 'Season complete!' : `${p.xp % PASS_XP}/${PASS_XP} XP to tier ${reached + 1}`, WORLD_W - 32, y + 22, 11, '#e0aaff', 700, 'right');
    this.bar(32, y + 38, WORLD_W - 64, reached >= PASS_TIERS ? 1 : (p.xp % PASS_XP) / PASS_XP, '#e0aaff', 9);
    this.text(p.premium ? '✓ Premium track unlocked' : `Premium track: more rewards and the Season Plate · ${PRODUCTS.pass.price}`, 32, y + 62, 11, p.premium ? '#8fdc93' : '#ffd34d', 800, 'left');
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
    this.text('YOUR RECORDS', 16, y + 8, 12, '#ffd34d', 900, 'left');
    y += 20;
    row('Best height', String(this.best), '#ffd34d');
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
    this.screenEnd(f, y - f.y0);
  }

  // ---------------------------------------------------- friend challenges

  /** Text box for a friend's challenge code (a real input, so phone keyboards work). */
  private openCodeInput(): void {
    if (this.codeInput) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,5,15,0.7);z-index:10;padding:16px;';
    wrap.innerHTML = `<form style="background:#2a1a33;border-radius:18px;padding:20px;width:100%;max-width:340px;font:600 15px Fredoka,system-ui,sans-serif;color:#fff;display:grid;gap:12px">
      <label for="challenge-code" style="font-weight:900;font-size:18px">Friend’s challenge code</label>
      <input id="challenge-code" autocomplete="off" autocapitalize="characters" placeholder="e.g. K3F9Q-7-42" style="font:700 20px Fredoka,system-ui;padding:12px;border-radius:12px;border:2px solid #ff8a5b;background:#fff;color:#2a1a33;text-transform:uppercase">
      <div style="display:flex;gap:10px"><button type="button" data-close style="flex:1;padding:12px;border-radius:22px;border:0;background:rgba(255,255,255,0.15);color:#fff;font-weight:900">Cancel</button>
      <button style="flex:1;padding:12px;border-radius:22px;border:0;background:#ffd34d;color:#4a2a00;font-weight:900">Play</button></div>
      <p data-error style="margin:0;color:#ff9a8a;min-height:1em;font-size:13px"></p></form>`;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('input')!;
    this.codeInput = input;
    const close = () => { wrap.remove(); this.codeInput = null; };
    wrap.querySelector('[data-close]')!.addEventListener('click', close);
    wrap.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const c = decodeChallenge(input.value);
      if (!c) {
        wrap.querySelector('[data-error]')!.textContent = 'That code doesn’t look right. It looks like K3F9Q-7-42.';
        return;
      }
      close();
      this.startRun(c.level, 'challenge', { challenge: c });
    });
    setTimeout(() => input.focus(), 50);
  }

  /** Builds the share card image and opens the share sheet (or shows the card if there isn't one). */
  private shareRun(): void {
    const code = encodeChallenge({ seed: this.seed, level: this.startLevel, score: this.height });
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
    c.font = `700 44px ${FONT}`;
    c.fillText(`Can you beat me? Code: ${code}`, 540, 1270);
    void shareCard(card, code, this.height).then((ok) => {
      if (!ok) this.shareOverlay = { image: card, code };
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
      this.button(40, midY + ih / 2 - 4, 150, 44, 'COPY CODE', () => {
        navigator.clipboard?.writeText(o.code).then(() => this.showToast('Code copied!'), () => this.showToast(`Your code: ${o.code}`));
      }, 'gold');
      this.button(WORLD_W - 190, midY + ih / 2 - 4, 150, 44, 'CLOSE', () => { this.shareOverlay = null; }, 'quiet');
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
    if (!tip) return;
    const a = Math.min(1, tip.t * 2.5);
    const h = 62;
    const y = this.viewH - this.insets.bottom - h - 18 + (1 - a) * 20;
    ctx.globalAlpha = a;
    this.card(24, y, WORLD_W - 48, h, 'rgba(255,248,235,0.97)');
    ctx.fillStyle = '#ff8a5b';
    this.roundRect(24, y, 8, h, 4);
    ctx.fill();
    this.text(tip.title, 46, y + 20, 14, '#c4501f', 700, 'left');
    this.fitText(tip.text, 46, y + 42, WORLD_W - 100, 12, '#4a2618', 'left');
    ctx.globalAlpha = 1;
  }

  /** Single-line text that shrinks to fit maxW. */
  private fitText(str: string, x: number, y: number, maxW: number, size: number, color: string, align: CanvasTextAlign = 'center', weight = 600): void {
    const { ctx } = this;
    let s2 = size;
    ctx.font = `${weight} ${s2}px ${FONT}`;
    while (s2 > 8 && ctx.measureText(str).width > maxW) {
      s2 -= 0.5;
      ctx.font = `${weight} ${s2}px ${FONT}`;
    }
    this.text(str, x, y, s2, color, weight, align);
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
    this.text('CHEF BEATEN!', cx, midY - 150, 30, '#ffd34d', 700);
    this.text('Pick a perk for the rest of this run', cx, midY - 118, 14, '#ffffff', 600);
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
    this.text('Tap a card', cx, midY + 132, 12, 'rgba(255,255,255,0.7)', 600);
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
    const title = pk.mode === 'journey' ? `LEVEL ${pk.level} · ${chefFor(pk.level).name}` : pk.mode === 'special' ? 'DAILY SPECIAL' : pk.mode === 'zen' ? 'ZEN' : pk.mode === 'time' ? 'TIME ATTACK' : 'FRIEND CHALLENGE';
    this.fitText(title, cx, y + 26, WORLD_W - 80, 18, '#ffffff', 'center', 700);
    this.text('Pick boosters for this run · the rest stay in your bag', cx, y + 50, 11.5, 'rgba(255,255,255,0.75)', 600);
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
    this.button(36, by, 96, 44, 'BACK', () => { this.picker = null; }, 'quiet');
    this.button(140, by, 96, 44, all ? 'NONE' : 'ALL', () => { pk.picked = new Set(all ? [] : owned.map((b) => b.id)); }, 'quiet');
    this.button(244, by, 120, 44, pk.picked.size ? `START (${pk.picked.size})` : 'START', () => {
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
