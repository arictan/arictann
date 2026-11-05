# Experiments (ideas 11–20)

Ten ready-made experiments that change the game **without an app update**, through remote
config. Most are A/B tests: half the players (picked at random, the same half every time)
get the change, the other half are the control group, and the stats show whether it helped.

| # | File | What changes | Who | How long | Judged on |
|---|---|---|---|---|---|
| 11 | `11-coins2x-weekend.json` | Coins ×2, with a message | 50/50, Sat + Sun | 1 weekend (week 2) | sessions per day |
| 12 | `12-tips-economy-ph.json` | Tips ×0.6, prices ×1.5 | 50/50, Philippines only | 2 weeks (weeks 5–6) | day-7 retention |
| 13 | `13-daily-easier.json` | Daily Roll at level 8 instead of 12 | everyone (see below) | 1 week (week 3) | Daily Roll shares |
| 14 | `14-cook-fast.json` | Cooking twice as fast | 50/50 | 2 weeks (weeks 1–2) | restaurant visits |
| 15 | `15-salmon-day.json` | Surprise event: salmon PERFECTs +2 coins | everyone | 1 day (Wednesday, week 5) | runs that day |
| 16 | `16-snacks-20.json` | Snack bar closes after 20, not 40 | 50/50 | 2 weeks (weeks 3–4) | dishes cooked |
| 17 | `17-tableware-rush.json` | Tableware drops ×2, with a message | 50/50, Sat + Sun | 1 weekend (week 4) | runs per day |
| 18 | `18-welcome-message.json` | A one-time "what's new in 1.1" message | everyone | 1 week (week 1) | nothing to decide |
| 19 | `19-gentle-start.json` | Slower first drops for new players | 50/50 | 4 weeks (weeks 1–4) | finishing the first day |
| 20 | `20-friday-rush.json` | Rush Hour tips ×3 on Fridays, with a message | 50/50, Fridays | 3 Fridays (weeks 7–9) | restaurant visits |

Each file has a `plan` with the question, the main metric, guard metrics (things that must not
get worse) and the decision rule.

The schedule keeps experiments that are judged on the same thing apart: the four restaurant
tests (14, 16, 12, 20) run one after another, so their effects don't mix. Experiments on
different things can safely run at the same time, because every experiment splits players
independently.

**#13 has no split on purpose.** Everyone plays the same Daily Roll, and two difficulties would
make the shared grids and the board unfair. So its week is compared with the week before. #15
(compared with the same weekday a week earlier) and #18 work the same way.

## Running them

You need two things: somewhere to put the config, and somewhere for the stats to go. The
game's own server (`server/`) does both.

1. **Deploy the server** (`server/README.md`) and set `serverUrl` in `src/config.ts` to its
   address. The game then reads its config from `<server>/config` and sends stats to
   `<server>/events`. Without `serverUrl` you can still host the config elsewhere
   (`REMOTE_CONFIG_URL`), but then you need your own analytics to measure anything.
2. **Pick the Monday that week 1 starts** and build the config:
   ```
   node tools/experiments/config.mjs plan 2027-03-01 experiments/*.json > server/config.json
   node tools/experiments/config.mjs check server/config.json
   ```
   `check` prints the calendar and fails on anything the game would silently ignore. Run it
   after every hand edit. To keep other settings (e.g. `serverUrl`, a `message`), add
   `--base your-current-config.json` to `plan`.
3. **Try it on your phone first.** Settings → Diagnostics → Experiments lists every experiment
   in the config with your group. Tap AUTO → TEST → CONTROL to force yourself into either group
   (this phone only, dates ignored) and check that the change looks right.
4. **After each experiment ends**, read the results:
   ```
   node tools/experiments/analyze.mjs --events server/events --config server/config.json experiments/*.json > results.md
   ```
   Wait a week after #12 and #19 end before reading them: day-7 retention needs 7 more days.
5. **Act on the decision rule** in each file. To make a winner permanent for everyone, change
   the default in `src/config.ts` (next app update), or right away by putting the value at the
   top level of the remote config.

To preview the report before real data exists, make up a season of players with known
effects:
```
node tools/experiments/simulate.mjs server/config.json /tmp/fake-events 150
node tools/experiments/analyze.mjs --events /tmp/fake-events --config server/config.json experiments/*.json
```

## What to know

* **Only players who turn on "Share anonymous stats"** (Settings, off by default) send stats.
  The results describe those players, which is usually a few percent of everyone. Plan for
  smaller numbers than your installs. The report says "not enough players yet" below 100 per
  group (200 for retention).
* **Changes apply on the next launch**, or when the app comes back from the background outside
  a run, never mid-run. Weekend and Friday tests switch on and off by the phone's own date.
* **A player's group never changes** for one experiment. Each experiment splits players
  independently of the others.
* **Countries** come from the country the player picked for the Country Cup, otherwise from the
  phone's language setting (e.g. en-PH). It isn't location.
* **One in twenty** comparisons looks "clear" by chance. Decide on the main metric, and repeat a
  surprising result before acting on it.
* **Ending early:** delete the experiment from the config (or set its `end` to today). Players
  go back to normal values on their next launch.

## Writing a new one

```json
{
  "id": "my-test",          // a-z, 0-9 and -
  "start": "2027-03-01",    // first day (the phone's local date)
  "end": "2027-03-15",      // stops at the start of this day
  "days": [5],              // optional: weekdays, 0 = Sunday … 6 = Saturday
  "countries": ["PH"],      // optional: two-letter codes
  "share": 0.5,             // optional: part in the test group; leave out = everyone
  "set": { "cookTime": 0.5 }
}
```

Any number or text value in `DEFAULTS` (src/config.ts) can go in `set`. A `message` in `set`
is shown once, only to the test group.
