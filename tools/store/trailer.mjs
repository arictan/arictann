// Trailer: steps the real game at exactly 30 fps and saves every canvas frame.
import { chromium } from 'playwright';
import fs from 'fs';
const OUT = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.addInitScript(() => { if (!sessionStorage.getItem('s')) { localStorage.clear(); localStorage.setItem('sushi-stack.seen', JSON.stringify(['intro'])); sessionStorage.setItem('s', '1'); } });
await p.goto('http://localhost:5174/'); await p.waitForFunction(() => window.__game);
await p.evaluate(() => {
  const g = window.__game, P = Object.getPrototypeOf(g);
  window.__U = P.update.bind(g); window.__R = P.render.bind(g);
  g.update = () => {}; g.render = () => {}; // the page's own loop stops drawing; we step it ourselves
  const pr = g.progress;
  pr.guide = 99; pr.unlocked = 24; pr.stars = Array(23).fill(3); pr.rank = 6; pr.stats.served = 300; pr.stats.drops = 3000;
  pr.avatar = { name: 'Momo', skin: 2, hair: 5, hairColor: 3, hat: 9, outfit: 1, accent: 4, face: 1 };
  pr.restaurant.levels = [3, 3, 2, 3, 2, 2, 3, 2]; pr.rest.staff = { waiter: 2, greeter: 2, apprentice: 1, dishwasher: 1 };
  g.bank = 2480; g.announceUnlocks = () => {}; g.boosters = {};
  window.__clean = () => { g.toast = null; g.toastQueue = []; g.story = null; g.storyQueue = []; g.picker = null; g.tip = null; };
  // A good player: lands most layers perfectly, trims a few.
  let n = 0;
  let prev = null;
  window.__bot = () => {
    const m = g.moving;
    if (!m || g.introIn > 0 || g.perkChoice) { prev = null; return; }
    const target = g.top.x + ((n % 7 === 5) ? 9 : 0);
    // Drop when the layer reaches the target, snapping it there as a sharp player would.
    if (prev !== null && (prev - target) * (m.x - target) <= 0) { m.x = target; g.drop(); n++; prev = null; return; }
    prev = m.x;
  };
});
let frame = 0;
const shoot = async (secs, each) => {
  for (let i = 0; i < Math.round(secs * 30); i++) {
    const data = await p.evaluate((each) => { if (each) eval(each); window.__clean(); window.__U(1 / 30); window.__R(); return document.querySelector('canvas').toDataURL('image/jpeg', 0.92); }, each);
    fs.writeFileSync(`${OUT}/f${String(frame++).padStart(4, '0')}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
  }
};
const marks = {};
const mark = (k) => (marks[k] = frame);
mark('logo'); await shoot(2.4);
await p.evaluate(() => { const g = window.__game; g.intro = null; g.mode = 'title'; });
mark('run'); await p.evaluate(() => { window.__game.startRun(9, 'journey', { picked: new Set() }); });
await shoot(9, 'window.__bot()');
mark('boss'); await p.evaluate(() => { const g = window.__game; g.mode = 'title'; g.startRun(20, 'journey', { picked: new Set() }); });
await shoot(4.5, 'window.__bot()');
await p.evaluate(() => { const g = window.__game; if (!g.perkChoice) g.perkChoice = ['magnet', 'shield', 'fever']; });
await shoot(1.5);
mark('restaurant'); await p.evaluate(() => { const g = window.__game; g.perkChoice = null; g.mode = 'title'; g.guestReady = [0, Date.now() + 1e6, 0, Date.now() + 1e6, 0]; g.openScreen('restaurant'); g.scrollPos = 0; });
await shoot(3.5, 'window.__game.scrollPos = Math.min(260, window.__game.scrollPos + 2.2)');
mark('daily'); await p.evaluate(async () => { const g = window.__game; const { dayKey } = await import('/src/progress.ts');
  g.progress.daily = { day: dayKey(), done: true, height: 43, grid: 'PPPCPPPPPCPPPPPPPCPPPPPPPPCPPPPPPPPPPPCPPPX', streak: 12, last: dayKey(), best: 51, played: 34, hist: [12, 18, 22, 25, 31, 28, 35, 33, 40, 38, 29, 44, 41, 37, 43, 51, 27, 36, 39, 42] };
  g.openScreen('daily'); g.scrollPos = 0; });
await shoot(2.5);
mark('world'); await p.evaluate(() => { const g = window.__game; g.addWorldLayers(1240); g.openScreen('world'); g.scrollPos = 0; });
await shoot(2.5);
mark('end'); await p.evaluate(() => { const g = window.__game; g.mode = 'title'; g.reset(); });
await shoot(3);
fs.writeFileSync(`${OUT}/marks.json`, JSON.stringify({ ...marks, total: frame }));
console.log(marks, frame, 'ERR', errs.slice(0, 3));
await b.close();
