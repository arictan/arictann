// Difficulty sim: a bot with human-like timing error plays the first chef of each level.
import { chromium } from 'playwright';
const MAXL = +(process.argv[2] ?? 50), TRIALS = +(process.argv[3] ?? 8);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://localhost:5174/?nointro'); await p.waitForFunction(() => window.__game);
const res = await p.evaluate(({ MAXL, TRIALS, FROM }) => {
  const g = window.__game, pr = g.progress;
  pr.guide = 99; pr.unlocked = 200; pr.stars = Array(200).fill(3); pr.stats.served = 500; pr.stats.drops = 9999;
  g.announceUnlocks = () => {}; g.render = () => {};
  let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const trial = (level, sigma) => {
    g.mode = 'title'; g.boosters = {}; g.startRun(level, 'journey'); g.picker = null;
    if (g.mode !== 'playing') return { won: false, h: 0, skip: true };
    let err = null, prevX = null;
    for (let k = 0; k < 40000; k++) {
      g.story = null; g.storyQueue = []; g.picker = null; g.toast = null; g.celebration = null;
      if (g.perkChoice) g.choosePerk(g.perkChoice[0]);
      g.update(1 / 60);
      if (g.ordersServed >= 1) return { won: true, h: g.height };
      if (g.mode !== 'playing') return { won: false, h: g.height };
      const m = g.moving;
      if (!m || g.introIn > 0) { prevX = null; continue; }
      if (err === null) err = gauss() * sigma;
      if (prevX !== null) {
        const v = (m.x - prevX) * 60;
        const target = g.top.x + (v * err) / 1000;
        if ((prevX - target) * (m.x - target) <= 0) { g.drop(); err = null; prevX = null; continue; }
      }
      prevX = m.x;
    }
    return { won: false, h: g.height, timeout: true };
  };
  const out = [];
  for (let L = FROM; L <= MAXL; L++) {
    const row = { L, chef: g.constructor && window.__game && null };
    for (const [name, s] of [['casual', 55], ['regular', 35], ['skilled', 20]]) {
      let w = 0, n = 0;
      for (let t = 0; t < TRIALS; t++) { const r = trial(L, s); if (r.skip) continue; n++; if (r.won) w++; }
      row[name] = n ? Math.round((w / n) * 100) : null;
    }
    out.push(row);
  }
  g.mode = 'title';
  return out;
}, { MAXL, TRIALS, FROM: +(process.argv[4] ?? 1) });
console.log(JSON.stringify(res));
console.log('ERR', errs.slice(0, 3));
await b.close();
