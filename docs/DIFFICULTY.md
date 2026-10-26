# Difficulty curve

Measured with `tools/sim/diff.mjs`: a bot with human-like timing error plays the first chef of
every level, 8 tries per level per skill. Timing error per drop: casual 55 ms, regular 35 ms,
skilled 20 ms. The bot doesn't dodge attacks, use boosters, perks or kitchen upgrades, so real
players do somewhat better. The numbers are noisy (about ±15%), so the shape and the spikes are
what count.

## Win rate against each level's chef (%)

| Level | Chef rule | Casual | Regular | Skilled |
|-------|-----------|--------|---------|---------|
| 1–9 | warm-up to fast surges | 100 | 100 | 88–100 |
| 10 | Final boss: everything | 75 | 100 | 100 |
| 13–17 | tight / long / surges | 63–88 | 100 | 100 |
| 18 | Picky: tight and long | 50 | 100 | 100 |
| 20 | Silk: tight surges (boss) | 25 | 100 | 100 |
| 21–26 | | 25–38 | 63–100 | 100 |
| 27 | Shadow: fast surges | 0 | 63 → 70 | 100 |
| **28** | **Crimson: tight, fast, long** | 0 → 10 | **25 → 70** | 100 |
| 29 | Ancient: tight surges | 0 | 0 → 10 | 88 → 100 |
| 30 | Ultimate boss: everything | 0 | 0 | 88 → 60 |
| 31–35 | | 0 | 0–25 → 10–60 | 75–100 |
| 36 | Sweetheart: tight and long | 0 | 13 → 20 | **50 → 90** |
| 37–39 | | 0 | 0–20 | 60–90 |
| **40** | **Dim sum: tight, extra layers** | 0 | 0 | **0 → 100** |

"→" shows before → after the smoothing below (levels 26–41 re-measured with 10 tries).

## What it shows

* **1–12: everyone wins.** That's right for the first sessions and the guided first day.
* **13–26: casual players start losing** while regular players still win nearly always. Star
  gates, boosters, perks and Sharp Knives carry casual players through, and losing a few times
  here is when the restaurant (unlocked at level 3) becomes the main way to progress.
* **27–30: the wall for regular players**, in front of the level-30 Ultimate boss. Bosses are
  meant to be walls, so this stays.
* **Spikes** (a level much harder than both neighbours) feel unfair and are where players quit.
  There were two.

## Smoothing applied (src/chef.ts)

| Level | Chef | Before | After |
|-------|------|--------|-------|
| 28 | Chef Akane | speed 1.5, 2 extra layers | speed 1.45, 1 extra layer |
| 29 | Master Tanaka | speed 1.55 | speed 1.5 |
| 36 | Chef Suki | speed 1.45 | speed 1.4 |
| 40 | Chef Xiao | speed 1.5, 3 extra layers | speed 1.45, 2 extra layers (rule text updated) |

The overall difficulty is unchanged: only levels that were out of line with their neighbours
were touched.

## During soft launch

Real numbers replace the bot: the `level_beat` event and the `session_end` event with its level
(Settings → My funnel shows them on a device, analytics shows them across players once it's set
up). A level where many sessions end and few `level_beat`s follow is a spike. Fix it in
`src/chef.ts` (speed first, then extra layers, then tight) and re-run `diff.mjs` for that range.
`cfg.dailyLevel` sets the Daily Roll's difficulty without an app update.
