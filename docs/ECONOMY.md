# Economy

Where coins come from, where they go, and how fast. The numbers come from
`tools/sim/econ.mjs`, a 60-day model of three kinds of player. It uses the game's own prices and
formulas (imported from `src/diner.ts` and `src/collect.ts`) and run income measured by a bot
playing real runs (`tools/sim/runcoins.mjs`).

## The three players

| | Casual | Regular | Engaged |
|---|---|---|---|
| Runs a day | 4 | 10 | 25 |
| Run skill (timing error) | 55 ms | 35 ms | 35 ms |
| Restaurant visits a day (tip jar filled) | 1 (8 h) | 2 (16 h) | 4 (24 h) |
| Dishes sold / snacks served a day | 4 / 6 | 12 / 15 | 30 / 30 |
| Missions (coins a day) | 25 | 75 | 150 |
| Daily Special | no | yes | yes |

## Run income (measured)

| Start level | Casual: coins / chefs / seconds | Regular: coins / chefs / seconds |
|---|---|---|
| 1 | 121 / 4.4 / 41 | 248 / 6.0 / 57 |
| 5 | 122 / 2.4 / 28 | 226 / 3.6 / 39 |
| 10 | 93 / 1.2 / 17 | 191 / 2.2 / 27 |
| 20 | 103 / 0.8 / 11 | 139 / 1.0 / 13 |
| 30 | 8 / 0 / 4 | 73 / 0.4 / 7 |

Runs are short and pay roughly 100–250 coins while a player is progressing. Past their skill
wall, runs pay little. That's when the restaurant takes over, which is the intended loop.

## Sinks (all coin prices before costScale)

| Sink | Total |
|---|---|
| Kitchen upgrades (7 × 3 levels) | 29,050 |
| Expansions (Counter Bar → Flagship) | 34,500 + dishes sold, rating, lots |
| Sakura Street (6 shops) | 39,500 |
| Cosmetics (shop catalog) | 10,530 |

## What the model found

With the original values (tipsMult 1, costScale 1), **restaurant tips were about 70% of all
coins**. Every Sakura Street shop adds tips per hour and every expansion multiplies them, so
income snowballs:

| | Casual | Regular | Engaged |
|---|---|---|---|
| Coins on day 30 | 1,604 | 6,969 | 11,315 |
| Everything bought by | day 49 | **day 25** | **day 14** |
| Flagship (the "dream") | after day 60 | day 25 | day 14 |

A regular player finishing the whole restaurant in under 4 weeks, and an engaged player in 2,
leaves nothing to save for in the second month.

## The change

`src/config.ts` defaults are now **tipsMult 0.75** and **costScale 1.25** (kitchen upgrades and
Sakura Street cost 25% more; tips are 25% lower).

| | Casual | Regular | Engaged |
|---|---|---|---|
| Coins on day 30 | 1,114 | 4,849 | 9,215 |
| All kitchen upgrades | day 37 | day 14 | day 8 |
| Arcade (last shop) | after day 60 | day 29 | day 16 |
| Flagship | after day 60 (needs 300 dishes sold) | **day 33** | **day 19** |
| Tips' share of income | 55% | 64% | 62% |

Other variants tried:

| tipsMult / costScale | Regular Flagship | Engaged Flagship |
|---|---|---|
| 1 / 1 (original) | day 25 | day 14 |
| 0.7 / 1 | day 28 | day 16 |
| **0.75 / 1.25 (now)** | **day 33** | **day 19** |
| 0.6 / 1.5 | day 37 | day 21 |
| 0.5 / 1.5 | day 40 | day 22 |

This is a moderate step on purpose: the model guesses how often people play and sell, and real
players differ. **0.6 / 1.5 is the candidate to test in soft launch** (see SOFT_LAUNCH.md) if
day-30 retention is fine but players say they've "finished" the restaurant.

## Knobs that change without an app update (remote config)

| Key | Default | Effect |
|---|---|---|
| `coinBoost` | 1 | All coins from runs (2 = double-coins weekend) |
| `dishPrice` | 10 | Coins per recipe layer of a sold dish |
| `cookTime` | 1 | Multiplies every cooking time |
| `tipsMult` | 0.75 | Tips per hour |
| `rushMult` | 2 | Tips for guests served in Rush Hour |
| `guestSnacks` | 40 | Snacks served per day without plated dishes |
| `costScale` | 1.25 | Kitchen upgrade and Sakura Street prices |
| `festCost` | 1 | Festival stall prices |
| `pieceBoss` / `pieceChef` | 0.25 / 0.06 | Tableware drop chance |
| `dailyLevel` | 12 | Daily Roll difficulty |
| `events` | [] | Live events (name, dates, coin multiplier, bonus ingredient) |

Rules for changing them live: change one knob at a time, never lower a reward players have
already seen without a note in the game, and watch spend (coins in vs. coins spent per day)
for a week before the next change.

## Rerunning

```
npx vite --port 5174 --strictPort &
node tools/sim/runcoins.mjs > tools/sim/runcoins.json   # only after gameplay changes
node tools/sim/econ.mjs tools/sim 0.75 1.25              # tipsMult, costScale
```
