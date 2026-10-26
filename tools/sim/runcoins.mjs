// Measures real run income: a regular-skill bot plays full journey runs from several levels.
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://localhost:5174/?nointro'); await p.waitForFunction(() => window.__game);
const res = await p.evaluate(() => {
  const g = window.__game, pr = g.progress;
  pr.guide = 99; pr.unlocked = 200; pr.stars = Array(200).fill(3); pr.stats.served = 500; pr.rank = 0; pr.prestige = 0;
  g.announceUnlocks = () => {}; g.render = () => {};
  let seed = 777; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const run = (level, sigma) => {
    g.mode = 'title'; g.boosters = {}; g.startRun(level, 'journey'); g.picker = null;
    let err = null, prevX = null, t = 0;
    for (let k = 0; k < 200000; k++) {
      g.story = null; g.storyQueue = []; g.picker = null; g.toast = null; g.celebration = null;
      if (g.perkChoice) g.choosePerk(g.perkChoice[0]);
      g.update(1 / 60); t += 1 / 60;
      if (g.mode !== 'playing') break;
      const m = g.moving;
      if (!m || g.introIn > 0) { prevX = null; continue; }
      if (err === null) err = gauss() * sigma;
      if (prevX !== null) {
        const v = (m.x - prevX) * 60, target = g.top.x + (v * err) / 1000;
        if ((prevX - target) * (m.x - target) <= 0) { g.drop(); err = null; prevX = null; continue; }
      }
      prevX = m.x;
    }
    return { coins: g.runCoins, chefs: g.ordersServed, h: g.height, secs: Math.round(t) };
  };
  const out = [];
  for (const L of [1, 5, 10, 20, 30, 40]) for (const [name, s] of [['casual', 55], ['regular', 35]]) {
    const rs = []; for (let i = 0; i < 5; i++) rs.push(run(L, s));
    const avg = (k) => Math.round(rs.reduce((a, r) => a + r[k], 0) / rs.length * 10) / 10;
    out.push({ L, skill: name, coins: avg('coins'), chefs: avg('chefs'), h: avg('h'), secs: avg('secs') });
  }
  g.mode = 'title';
  return out;
});
console.log(JSON.stringify(res)); console.log('ERR', errs.slice(0, 3)); await b.close();
