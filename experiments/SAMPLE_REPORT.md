> **Made-up data.** This report comes from `tools/experiments/simulate.mjs` (150 new players a day, planted effects: double coins +20% sessions, faster cooking −15% restaurant visits, gentle start +8 points first day, Friday rush +25% visits, easier Daily Roll +40% shares, salmon day +15% runs; nothing else). It shows what the real report looks like and that the analysis finds the planted effects. Real results come from `analyze.mjs` on your server's stats.

# Experiment results

1,894,148 events from 13,050 players, 2026-11-02 to 2027-01-27.

## #11 Double-coins weekend (`coins2x-weekend`)

Does a double-coins weekend make people play more sessions, and does it last after the weekend?

Players: 663 in the test group, 652 in control.

| | control | test | difference (95% range) | |
|---|---|---|---|---|
| **sessions per day** (main) | 2.27 | 2.63 | +0.36 (+16%), 0.21 to 0.51 | HIGHER, and the difference is clear |
| runs per day | 6.36 | 6.44 | +0.08 (+1%), -0.24 to 0.40 | no clear difference |
| purchases per day | 0.01 | 0.02 | +0.00 (+38%), -0.01 to 0.02 | no clear difference |

**How to decide:** Keep running it on chosen weekends if sessions per day rise 10%+ with no drop in purchases. Watch the following Monday too: a drop there means it only moved play around.

## #12 Leaner restaurant economy in one country (`tips-economy-ph`)

With tips ×0.6 and prices ×1.5 (docs/ECONOMY.md), do players stay as long, and does the restaurant last longer as a goal?

Players: 478 in the test group, 511 in control.

| | control | test | difference (95% range) | |
|---|---|---|---|---|
| **day-7 retention** (main) | 37.8% | 46.9% | +9.1% (+24%), 1.1% to 17.1% | HIGHER, and the difference is clear |
| sessions per day | 2.18 | 2.23 | +0.05 (+2%), -0.08 to 0.18 | no clear difference |
| restaurant visits per day | 2.61 | 2.58 | −0.02 (−1%), -0.20 to 0.16 | no clear difference |
| purchases per day | 0.01 | 0.01 | +0.01 (+89%), -0.00 to 0.02 | no clear difference |

**How to decide:** Adopt it for everyone if day-7 retention is not lower (within 2 points) and restaurant visits per day hold up. If day-7 drops, keep today's values.

## #13 An easier Daily Roll for a week (`daily-easier`)

Does an easier Daily Roll get shared more? (Everyone gets the same roll, so this is a before/after comparison, not a split: a split would make the shared grids unfair.)

Everyone got this, so 2026-11-30–2026-12-07 is compared with 2026-11-23–2026-11-30: 2296 players during, 2161 before.

| | before | during | difference (95% range) | |
|---|---|---|---|---|
| **Daily Roll shares per day** (main) | 0.07 | 0.10 | +0.03 (+44%), 0.02 to 0.04 | HIGHER, and the difference is clear |
| Daily Rolls per day | 0.48 | 0.50 | +0.01 (+3%), -0.01 to 0.04 | no clear difference |

**How to decide:** Keep dailyLevel 8 if shares per player rise clearly against the week before. If players stop sharing because it's too easy (lots of identical grids), go back to 12 or try 10.

## #14 Faster cooking (`cook-fast`)

With cooking twice as fast, do players visit the restaurant more often, or less (because there's less to come back for)?

Players: 1535 in the test group, 1545 in control.

| | control | test | difference (95% range) | |
|---|---|---|---|---|
| **restaurant visits per day** (main) | 2.48 | 2.13 | −0.36 (−14%), -0.45 to -0.27 | LOWER, and the difference is clear |
| sessions per day | 2.23 | 2.25 | +0.01 (+1%), -0.06 to 0.09 | no clear difference |
| dishes cooked per day | 2.99 | 3.01 | +0.01 (+0%), -0.10 to 0.12 | no clear difference |

**How to decide:** Adopt cookTime 0.5 if restaurant visits and sessions both go up. If visits drop, the waiting is what brings people back: keep 1.

## #15 Surprise one-day salmon event (`salmon-day`)

Does a surprise one-day event (salmon PERFECTs pay +2) lift play that day? Compared with the same weekday a week earlier.

Everyone got this, so 2026-12-16–2026-12-17 is compared with 2026-12-09–2026-12-10: 1014 players during, 954 before.

| | before | during | difference (95% range) | |
|---|---|---|---|---|
| **runs per day** (main) | 6.61 | 7.60 | +0.98 (+15%), 0.68 to 1.28 | HIGHER, and the difference is clear |
| sessions per day | 2.43 | 2.28 | −0.15 (−6%), -0.28 to -0.01 | LOWER, and the difference is clear |

**How to decide:** Worth repeating monthly if runs per player that day rise 10%+. Rotate the ingredient.

## #16 Fewer free snacks (`snacks-20`)

With the snack bar closing after 20 snacks a day (not 40), do players cook more dishes, or just leave the restaurant sooner?

Players: 1693 in the test group, 1675 in control.

| | control | test | difference (95% range) | |
|---|---|---|---|---|
| **dishes cooked per day** (main) | 3.02 | 3.01 | −0.01 (−0%), -0.11 to 0.09 | no clear difference |
| restaurant visits per day | 2.51 | 2.53 | +0.03 (+1%), -0.06 to 0.12 | no clear difference |
| sessions per day | 2.16 | 2.22 | +0.06 (+3%), -0.01 to 0.12 | no clear difference |

**How to decide:** Adopt guestSnacks 20 if cooking per player rises and restaurant visits don't fall. If visits fall, keep 40.

## #17 Tableware rush weekend (`tableware-rush`)

Does doubling tableware drops for a weekend (and saying so) make people play more runs?

Players: 690 in the test group, 692 in control.

| | control | test | difference (95% range) | |
|---|---|---|---|---|
| **runs per day** (main) | 6.35 | 6.42 | +0.07 (+1%), -0.23 to 0.37 | no clear difference |
| sessions per day | 2.30 | 2.27 | −0.03 (−1%), -0.16 to 0.11 | no clear difference |

**How to decide:** Repeat as an occasional event if runs per day rise 10%+. Don't make it permanent: rare drops are what make sets worth finishing.

## #18 Update announcement (`welcome-1-1`)

A one-time home-screen message about version 1.1. Not a test, just a message for a week; it's shown once per player.

Everyone got this, so 2026-11-16–2026-11-23 is compared with 2026-11-09–2026-11-16: 2021 players during, 1700 before.

| | before | during | difference (95% range) | |
|---|---|---|---|---|
| **sessions per day** (main) | 2.18 | 2.23 | +0.05 (+2%), -0.02 to 0.12 | no clear difference |

**How to decide:** Nothing to decide: change the text for each update.

## #19 Gentler first drops (`gentle-start`)

Do new players with slower first drops (0.45 instead of 0.6) finish the first day and come back more? Only brand-new players are affected, so it runs 4 weeks to collect enough installs.

Players: 2620 in the test group, 2561 in control.

| | control | test | difference (95% range) | |
|---|---|---|---|---|
| **new players who finished the first day** (main) | 60.2% | 67.9% | +7.7% (+13%), 4.8% to 10.6% | HIGHER, and the difference is clear |
| day-1 retention | 80.9% | 82.1% | +1.2% (+2%), -1.1% to 3.6% | no clear difference |
| day-7 retention | 45.1% | 44.8% | −0.3% (−1%), -3.3% to 2.7% | no clear difference |

**How to decide:** Adopt 0.45 if more players finish the first day and day-1 retention isn't lower. If it's the same, keep 0.6 (faster feels better).

## #20 Triple-tip Friday rush (`friday-rush`)

Do triple Rush Hour tips on Fridays bring players to the restaurant at rush time?

Players: 1052 in the test group, 1168 in control.

| | control | test | difference (95% range) | |
|---|---|---|---|---|
| **restaurant visits per day** (main) | 2.64 | 3.36 | +0.72 (+27%), 0.57 to 0.88 | HIGHER, and the difference is clear |
| guests served per day | 8.64 | 8.73 | +0.10 (+1%), -0.22 to 0.41 | no clear difference |
| sessions per day | 2.30 | 2.28 | −0.02 (−1%), -0.13 to 0.09 | no clear difference |

**How to decide:** Make it a weekly feature if Friday restaurant visits rise 15%+. It runs 3 Fridays to see if the effect lasts.

---
A difference is "clear" when its 95% range doesn't cross zero. With many metrics, expect about 1 in 20 to look clear by chance: trust the main metric, and repeat a surprising result before acting on it.
