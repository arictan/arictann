import { chromium } from 'playwright';
const b = await chromium.launch();
const out = [];
for (const rate of (process.argv[2] ? [1] : [1, 4, 6])) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  if (process.argv[2]) await p.addInitScript(() => { window.__forceLite = 1; }); await p.goto('http://localhost:5174/?nointro'); await p.waitForFunction(() => window.__game);
  await p.evaluate(() => { const g = window.__game; g.progress.guide = 99; g.progress.unlocked = 30; if (window.__forceLite) g.setLowPower(true); g.celebration = null; g.confetti = []; g.toast = null; g.toastQueue = []; g.storyQueue = []; g.story = null; });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const measure = async (name, setup) => {
    await p.evaluate(setup);
    await p.waitForTimeout(1500);
    // Count real frames and average work over 4 s.
    const r = await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const w = []; const f = () => { n++; w.push(window.__perf.work); if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res({ fps: Math.round(n / ((performance.now() - t0) / 1000)), work: +(w.reduce((a, b) => a + b, 0) / w.length).toFixed(1), lite: window.__game.lowPower, calm: window.__game.calm() }); }; requestAnimationFrame(f); }));
    out.push({ rate, name, ...r });
  };
  await measure('home', () => { const g = window.__game; g.mode = 'title'; g.celebration = null; g.confetti = []; });
  await measure('restaurant', () => { const g = window.__game; g.celebration = null; g.confetti = []; g.openScreen('restaurant'); });
  await measure('run (tall tower)', () => { const g = window.__game; g.mode = 'title'; g.startRun(); g.story = null; g.storyQueue = []; g.picker = null; window.__bot = setInterval(() => { const g = window.__game; g.story = null; g.storyQueue = []; if (g.perkChoice) g.choosePerk(g.perkChoice[0]); g.picker = null; if (g.moving && !g.event && g.introIn <= 0) { g.moving.x = g.top.x; g.drop(); } }, 120); });
  await p.evaluate(() => clearInterval(window.__bot));
  await p.close();
}
console.table(out);
console.log(JSON.stringify(out));
await b.close();
