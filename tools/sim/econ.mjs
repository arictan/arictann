// Economy model: 60 days for three kinds of player, using the game's own constants and the
// measured run income (runcoins.json) and win rates (diff40.json).
import { chromium } from 'playwright';
import fs from 'fs';
const SP = process.argv[2] ?? 'tools/sim';
const TM = +(process.argv[3] ?? 1), CS = +(process.argv[4] ?? 1);
const runs = JSON.parse(fs.readFileSync(`${SP}/runcoins.json`, 'utf8').split('\n')[0]);
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:5174/?nointro'); await p.waitForFunction(() => window.__game);
const out = await p.evaluate(async ({ runs, TM, CS }) => {
  const D = await import('/src/diner.ts');
  const C = await import('/src/collect.ts');
  const S = await import('/src/shop.ts');
  const lerp = (skill, L, key) => {
    const rows = runs.filter((r) => r.skill === skill);
    if (L <= rows[0].L) return rows[0][key];
    for (let i = 1; i < rows.length; i++) if (L <= rows[i].L) { const a = rows[i - 1], b = rows[i]; return a[key] + (b[key] - a[key]) * (L - a.L) / (b.L - a.L); }
    return rows[rows.length - 1][key];
  };
  const PLAYERS = {
    casual: { skill: 'casual', runs: 4, visits: 1, sold: 4, snacks: 6, missions: 25, special: false, jarH: 8 },
    regular: { skill: 'regular', runs: 10, visits: 2, sold: 12, snacks: 15, missions: 75, special: true, jarH: 16 },
    engaged: { skill: 'regular', runs: 25, visits: 4, sold: 30, snacks: 30, missions: 150, special: true, jarH: 24 },
  };
  const gift = [20, 30, 40, 50, 60, 80, 300];
  const cosmetics = S.CATALOG ? Object.values(S.CATALOG).flat().reduce((a, i) => a + (i.price ?? 0), 0) : 0;
  const result = {};
  for (const [name, P] of Object.entries(PLAYERS)) {
    let L = 1, bank = 0, sum = 0, areaLv = 0, sold = 0, stars = 0;
    const up = {}; const lots = []; let exp = 0;
    const buys = []; const income = { runs: 0, chests: 0, gift: 0, missions: 0, special: 0, tips: 0, dishes: 0, snacks: 0 };
    const days = [];
    for (let d = 1; d <= 60; d++) {
      const before = { ...income };
      for (let r = 0; r < P.runs; r++) {
        const chefs = lerp(P.skill, L, 'chefs');
        income.runs += lerp(P.skill, L, 'coins');
        income.chests += chefs * (22.5 + L);
        stars += chefs * 2.5;
        L = Math.min(60, L + chefs * 0.35); // replays and star gates: most chefs beaten in a run are already beaten
      }
      income.gift += gift[(d - 1) % 7];
      income.missions += P.missions;
      if (P.special) income.special += 150;
      // Restaurant: areas bought with stars (cost areaCost), then tips, dishes and snacks.
      while (areaLv < 24 && stars >= C.areaCost(0, Math.floor(areaLv / 8) + 1)) { stars -= C.areaCost(0, Math.floor(areaLv / 8) + 1); areaLv++; }
      const levels = Array.from({ length: 8 }, (_, i) => Math.floor(areaLv / 8) + (i < areaLv % 8 ? 1 : 0));
      const lotTips = lots.reduce((a, id) => a + D.LOTS.find((x) => x.id === id).tips, 0);
      const tipsH = (C.tipRate(0, levels) + lotTips) * (1 + D.EXPANSIONS.slice(0, exp).reduce((a, e) => a + e.tips, 0));
      if (d > 1) income.tips += tipsH * TM * Math.min(24, P.jarH);
      const dishLv = sold > 100 ? 1.5 : sold > 40 ? 1.25 : 1;
      income.dishes += P.sold * 35 * dishLv; sold += P.sold;
      income.snacks += P.snacks * (6 + 2 * C.popularity(0, levels));
      const today = Object.keys(income).reduce((a, k) => a + income[k] - before[k], 0);
      bank += today; sum += today;
      // Spend greedily: cheapest useful thing first.
      for (;;) {
        const opts = [];
        for (const u of D.UPGRADES) { const lv = up[u.id] ?? 0; if (lv < 3) opts.push({ what: `${u.name} ${lv + 1}`, cost: Math.round(u.costs[lv] * CS), go: () => (up[u.id] = lv + 1) }); }
        const e = D.EXPANSIONS[exp];
        if (e) { const need = e.tasks.find((t) => t.kind === 'sold')?.n ?? 0; const c = e.tasks.find((t) => t.kind === 'coins')?.n ?? 0; if (sold >= need) opts.push({ what: `Expansion: ${e.name}`, cost: c, go: () => exp++ }); }
        const lot = D.LOTS.find((x) => !lots.includes(x.id)); if (lot) opts.push({ what: `Street: ${lot.name}`, cost: Math.round(lot.cost * CS), go: () => lots.push(lot.id) });
        opts.sort((a, b) => a.cost - b.cost);
        const o = opts[0];
        if (!o || o.cost > bank) break;
        bank -= o.cost; o.go(); buys.push({ d, what: o.what, cost: o.cost });
      }
      days.push({ d, level: Math.round(L), today: Math.round(today), bank: Math.round(bank) });
    }
    const total = Object.values(income).reduce((a, b) => a + b, 0);
    result[name] = { income: Object.fromEntries(Object.entries(income).map(([k, v]) => [k, Math.round(v)])), share: Object.fromEntries(Object.entries(income).map(([k, v]) => [k, Math.round(v / total * 100)])), perDay: { d1: days[0].today, d7: days[6].today, d30: days[29].today, d60: days[59].today }, level: { d7: days[6].level, d30: days[29].level, d60: days[59].level }, buys, lastBuy: buys[buys.length - 1]?.d, kitchenDone: buys.filter((x) => !x.what.startsWith('Exp') && !x.what.startsWith('Street')).length };
  }
  result.sinks = {
    kitchen: D.UPGRADES.reduce((a, u) => a + u.costs.reduce((x, y) => x + y, 0), 0),
    expansions: D.EXPANSIONS.reduce((a, e) => a + (e.tasks.find((t) => t.kind === 'coins')?.n ?? 0), 0),
    street: D.LOTS.reduce((a, l) => a + l.cost, 0),
    cosmetics,
  };
  return result;
}, { runs, TM, CS });
fs.writeFileSync(`${SP}/econ-${TM}-${CS}.json`, JSON.stringify(out, null, 1));
for (const k of ['casual', 'regular', 'engaged']) { const r = out[k]; console.log(k, JSON.stringify({ perDay: r.perDay, level: r.level, share: r.share, purchases: r.buys.length, kitchenDone: r.kitchenDone, lastBuy: r.lastBuy })); }
console.log('sinks', JSON.stringify(out.sinks));
for (const k of ['casual', 'regular', 'engaged']) console.log(k, out[k].buys.filter((x, i) => [0, 4, 9, 14, 20].includes(i) || x.what.startsWith('Exp') || x.what.startsWith('Street')).map((x) => `d${x.d} ${x.what} (${x.cost})`).join(' | '));
await b.close();
