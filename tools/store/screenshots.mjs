// Store screenshots: renders real game screens, then frames them with a caption.
import { chromium } from 'playwright';
import fs from 'fs';
const SP = process.argv[2]; const OUT = process.argv[3]; const RAW = `${SP}/store`;
fs.mkdirSync(`${OUT}/ios`, { recursive: true }); fs.mkdirSync(`${OUT}/android`, { recursive: true });
const b = await chromium.launch();
const errs = [];
const FD = './node_modules/@fontsource/fredoka/files';
const font = (w) => `@font-face { font-family: F; font-weight: ${w}; src: url(data:font/woff2;base64,${fs.readFileSync(`${FD}/fredoka-latin-${w}-normal.woff2`).toString('base64')}) format('woff2'); }`;
const FONTS = font(700) + font(500);
const setup = async (p) => {
  await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { localStorage.clear(); sessionStorage.setItem('s', '1'); } });
  await p.goto('http://localhost:5174/?nointro'); await p.waitForFunction(() => window.__game); await p.waitForTimeout(500);
  await p.evaluate(() => {
    const g = window.__game, pr = g.progress;
    pr.stars = Array.from({ length: 23 }, (_, i) => (i % 4 === 1 ? 2 : 3)); pr.unlocked = 24; pr.rank = 6; pr.winStreak = 7; pr.starPool = 34;
    pr.hearts = { tanaka: 18, ken: 9, yumi: 26, mori: 4, sora: 3, bella: 1 };
    pr.avatar = { name: 'Momo', skin: 2, hair: 5, hairColor: 3, hat: 9, outfit: 1, accent: 4, face: 1 };
    pr.gallery = { pic: 3, tiles: [0, 1, 2, 4, 5, 6, 8, 9, 13], perfects: 2, done: [0, 1, 2] };
    pr.restaurant.levels = [5, 5, 4, 3, 3, 2, 1, 0];
    pr.seen.push('ach:ready', ...['shop','gift','modes','map','events','restaurant','more'].flatMap((k) => [`feature:${k}`, `feature:${k}:visited`]), 'story:2:start', 'story:1:end', 'story:2:end');
    pr.tutorial = 4; pr.guide = 99; g.announceUnlocks = () => {}; pr.persist(); g.bank = 2480; g.best = 86;
    g.toast = null; g.toastQueue = []; g.celebration = null; g.confetti = [];
  });
};
const clean = (p) => p.evaluate(() => { const g = window.__game; g.story = null; g.storyQueue = []; g.toast = null; g.toastQueue = []; g.celebration = null; g.confetti = []; });
const scenes = [
  ['play', 'Stack the sushi.', 'Beat the boss chef!', async (p) => {
    await p.evaluate(() => { const g = window.__game; g.startRun(24, 'journey', { picked: new Set() }); g.story = null; g.storyQueue = []; g.tip = null;
      for (let i = 0; i < 9; i++) { g.moving.x = g.top.x + (i % 3 === 2 ? 6 : 0); g.drop(); } g.banner = null; g.popups = []; });
    await p.waitForTimeout(1600);
    await p.evaluate(() => { const g = window.__game; g.bubble = { text: 'Too slow, rookie!', life: 9 }; g.tip = null; g.popups = []; g.splats = []; g.projectiles = []; g.event = null; });
  }],
  ['rage', 'Bosses fight back.', 'Pick perks to win!', async (p) => {
    await p.evaluate(() => { const g = window.__game; g.startRun(30, 'journey', { picked: new Set() }); g.story = null; g.storyQueue = []; g.tip = null;
      for (let i = 0; i < 5; i++) { g.moving.x = g.top.x; g.drop(); } g.banner = null; g.perkChoice = ['magnet', 'shield', 'fever']; });
    await p.waitForTimeout(500);
  }],
  ['restaurant', 'Build your restaurant.', 'Guests, staff, decor & tips', async (p) => {
    await p.evaluate(() => { const g = window.__game, pr = g.progress; pr.restaurant.levels = [3, 3, 2, 3, 2, 2, 3, 2]; pr.restaurant.tipsAt = Date.now() - 3 * 3600e3; pr.rest.staff = { waiter: 2, greeter: 2, apprentice: 1, dishwasher: 1 }; pr.rest.styles = { lanterns: 1, garden: 1 }; pr.rest.ownedStyles.push('lanterns:1', 'garden:1'); pr.rest.menu = { day: new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate(), recipe: 'Rainbow Roll' }; pr.persist(); g.guestReady = [0, Date.now() + 1e6, 0, Date.now() + 1e6, Date.now() + 1e6]; g.openScreen('restaurant'); });
    await p.waitForTimeout(1200);
    await p.evaluate(() => { const g = window.__game; g.toast = null; g.toastQueue = []; g.celebration = null; });
  }],
  ['daily', 'A new roll every day.', 'Same layers for everyone. Share your grid!', async (p) => {
    await p.evaluate(async () => { const g = window.__game; const { dayKey } = await import('/src/progress.ts');
      g.progress.daily = { day: dayKey(), done: true, height: 43, grid: 'PPPCPPPPPCPPPPPPPCPPPPPPPPCPPPPPPPPPPPCPPPX', streak: 12, last: dayKey(), best: 51, played: 34, hist: [12, 18, 22, 25, 31, 28, 35, 33, 40, 38, 29, 44, 41, 37, 43, 51, 27, 36, 39, 42, 30, 45, 33, 41, 38, 46, 34, 40, 48, 43] };
      g.mode = 'title'; g.openScreen('daily'); g.scrollPos = 0; });
    await p.waitForTimeout(700);
  }],
  ['home', 'Your chef. Your story.', 'Daily gifts, missions & events', async (p) => {
    await p.evaluate(() => { const g = window.__game; g.mode = 'title'; g.reset(); });
    await p.waitForTimeout(900);
  }],
  ['world', 'One tower, one world.', 'Every layer you stack counts', async (p) => {
    await p.evaluate(() => { const g = window.__game; g.addWorldLayers(1240); g.openScreen('world'); g.scrollPos = 0; });
    await p.waitForTimeout(700);
  }],
  ['book', 'Grandma’s recipe book.', 'Letters, real recipes & seasons', async (p) => {
    await p.evaluate(() => { const g = window.__game; g.openScreen('book'); g.scrollPos = 0; });
    await p.waitForTimeout(700);
  }],
  ['map', 'An endless journey.', '50 story chefs, then legends', async (p) => {
    await p.evaluate(() => { const g = window.__game; g.mode = 'title'; g.reset(); g.openMap(); });
    await p.waitForTimeout(600);
  }],
];
for (const [store, vw, vh, dsf, W, H, capH] of [['ios', 412, 850, 1100 / 412, 1320, 2868, 470], ['android', 330, 600, 860 / 330, 1080, 1920, 330]]) {
  const p = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: dsf });
  p.on('pageerror', (e) => errs.push(e.stack));
  await setup(p);
  for (const [name, , , fn] of scenes) {
    await fn(p); await clean(p); await p.waitForTimeout(100);
    await p.screenshot({ path: `${RAW}/${store}-${name}.png` });
  }
  await p.close();
  const fontDir = './node_modules/@fontsource/fredoka/files';
  const c = await b.newPage({ viewport: { width: W, height: H } });
  for (const [i, [name, title, sub]] of scenes.entries()) {
    const img = fs.readFileSync(`${RAW}/${store}-${name}.png`).toString('base64');
    const k = W / 1320;
    await c.setContent(`<html><head><style>
      ${FONTS}
      body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; font-family: F; background: linear-gradient(160deg, ${['#ff8a5b', '#7b2cbf', '#ff5d8f', '#2a9d5c', '#3d6fb6', '#4361ee', '#e0a800', '#c2185b'][i]}, #2a1a33 70%); display: flex; flex-direction: column; align-items: center; }
      h1 { margin: ${70 * k}px 0 0; font-size: ${118 * k}px; font-weight: 700; color: #fff; text-shadow: 0 ${6 * k}px 0 rgba(0,0,0,.25); }
      h2 { margin: ${14 * k}px 0 0; font-size: ${60 * k}px; font-weight: 500; color: #ffe27a; }
      .cap { height: ${capH}px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      img { width: ${vw * dsf}px; border-radius: ${60 * k}px; box-shadow: 0 ${30 * k}px ${80 * k}px rgba(0,0,0,.5); border: ${14 * k}px solid #120a16; }
    </style></head><body><div class="cap"><h1>${title}</h1><h2>${sub}</h2></div><img src="data:image/png;base64,${img}"></body></html>`);
    await c.evaluate(() => document.fonts.ready); await c.waitForTimeout(300);
    await c.screenshot({ path: `${OUT}/${store}/${i + 1}-${name}.jpg`, type: 'jpeg', quality: 88 });
  }
  await c.close();
}
// Feature graphic for Google Play.
{
  const fontDir = './node_modules/@fontsource/fredoka/files';
  const img = fs.readFileSync(`${RAW}/android-play.png`).toString('base64');
  const icon = fs.readFileSync('./assets/icon-only.png').toString('base64');
  const c = await b.newPage({ viewport: { width: 1024, height: 500 } });
  await c.setContent(`<html><head><style>
    ${FONTS}
    body { margin: 0; width: 1024px; height: 500px; overflow: hidden; font-family: F; background: radial-gradient(circle at 25% 40%, #ff8a5b, #7b2cbf 60%, #2a1a33); position: relative; }
    .t { position: absolute; left: 60px; top: 110px; color: #fff; }
    .t h1 { margin: 0; font-size: 104px; line-height: .95; font-weight: 700; text-shadow: 0 6px 0 rgba(0,0,0,.25); }
    .t h1 span { color: #ffe27a; }
    .t p { margin: 18px 0 0; font-size: 30px; font-weight: 500; }
    .icon { position: absolute; left: 60px; top: 24px; width: 70px; border-radius: 16px; }
    .shot { position: absolute; right: 70px; top: 40px; width: 300px; border-radius: 26px; border: 8px solid #120a16; transform: rotate(6deg); box-shadow: 0 20px 50px rgba(0,0,0,.5); }
  </style></head><body><img class="icon" src="data:image/png;base64,${icon}"><div class="t"><h1>SUSHI<br><span>STACK</span></h1><p>One tap. Endless chefs. Perfect rolls.</p></div><img class="shot" src="data:image/png;base64,${img}"></body></html>`);
  await c.evaluate(() => document.fonts.ready); await c.waitForTimeout(300);
  await c.screenshot({ path: `${OUT}/feature-graphic.png` });
}
console.log('ERR', errs);
await b.close();
