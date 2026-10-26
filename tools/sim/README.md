# Simulations

Bots that play the real game in a headless browser, used for tuning. Start the dev server first
(`npx vite --port 5174 --strictPort`), and have Playwright installed (`npm i -D playwright`,
then `npx playwright install chromium`).

| Script | What it does | Example |
|--------|--------------|---------|
| `diff.mjs` | Win rate against the first chef of each level, for three skill levels | `node tools/sim/diff.mjs 40 8` (levels 1-40, 8 tries each); add a 3rd number to start later |
| `runcoins.mjs` | Coins, chefs beaten and height per full run, from several starting levels | `node tools/sim/runcoins.mjs > tools/sim/runcoins.json` |
| `econ.mjs` | 60 days of three kinds of player, using `runcoins.json` and the game's own prices | `node tools/sim/econ.mjs tools/sim 0.75 1.25` (tipsMult, costScale) |
| `perf.mjs` | Frame work and fps under 1×/4×/6× CPU throttling | `node tools/sim/perf.mjs` |

The bot's "skill" is a timing error: each drop happens at the right moment plus a random error
with a standard deviation of 55 ms (casual), 35 ms (regular) or 20 ms (skilled). It doesn't dodge
attacks, use boosters or buy upgrades, so real players do a little better than these numbers.
With 8-10 tries per level the win rates move by ±15% from run to run: look at the shape and the
spikes, not single numbers.

Saved results: `diff-before.json` / `diff-after.json` (the chef smoothing in docs/DIFFICULTY.md)
and `runcoins.json`.
