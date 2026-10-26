# Soft launch plan

A soft launch releases the game in a few countries before the worldwide launch, to fix the
first-day experience, the difficulty and the economy with real players, while a bad week still
costs little. Plan for **6–8 weeks**.

## Where

Pick 2–3 countries that behave like your main markets but are smaller and cheaper to advertise
in:

| Country | Why |
|---|---|
| **Philippines** | Cheap installs, English-speaking, very casual-game heavy: good for retention and difficulty |
| **Canada** or **Australia** | Spends and plays like the US and UK: good for purchases and ads revenue |
| **Türkiye** (optional) | Your Turkish translation and Turkish chef world get real feedback; a home market |

Google Play: Production → Countries/regions, add only these. App Store: Pricing and
Availability, same. Both can be widened later without a new build.

## Before the first day

- [ ] Device test plan passed on the phones in docs/DEVICE_TEST_PLAN.md
- [ ] Real ad unit IDs, `ADS_TESTING = false`, AdMob GDPR message published (docs/AGE_RATING.md)
- [ ] Real products in both stores, RevenueCat key set, a test purchase made on each store
- [ ] Analytics service connected to the "Share anonymous stats" switch, or accept you'll only
      have store-console numbers (installs, retention, crashes)
- [ ] Crash reporting: Play Console vitals and Xcode Organizer work without extra code. For
      more detail, connect a service to `setErrorHook()` in `src/safety.ts` (with consent).
- [ ] Optional: the server (server/README.md) deployed and `serverUrl` set by remote config,
      so the Daily Roll board and friends are live
- [ ] Remote config file hosted and `REMOTE_CONFIG_URL` set in `src/config.ts`. This is what lets
      you tune without app updates, so don't skip it.

## What to measure, and the bar to clear

| Metric | Where | Healthy for a casual game | If it's low |
|---|---|---|---|
| Finished the first day (guide) | `first_day` / `install` | > 70% | Which `guide` step people stop at (funnel); simplify that step |
| Day-1 retention | Store consoles | > 35% | First 5 minutes: guide, first chefs too hard or too slow? |
| Day-7 retention | Store consoles | > 12% | Mid-game: levels 10–30 wall, restaurant pacing, daily reasons to return |
| Day-30 retention | Store consoles | > 4% | Late goals: flagship, legends, events |
| Session length | `session_end` | 5–12 min | Under 4: too hard or nothing to do. Over 20: fine, check fatigue |
| Sessions a day | Store consoles | 2–4 | Tip jar and reminders not pulling people back |
| Where sessions end | `session_end.screen` | Spread out | One screen dominating = a confusing screen |
| Level reached by day 7 | `level_beat` | Median 15–25 | See docs/DIFFICULTY.md |
| Crash-free users | Play vitals / Xcode | > 99.5% | Fix before anything else |
| Ad views per daily player | AdMob | 1–3 | Rewards not attractive, or offered at bad moments |
| Payers | RevenueCat | 1–3% | Starter pack price/timing |

## Week by week

| Week | Focus | Typical changes |
|---|---|---|
| 1 | Crashes, the first day | Fix crashes; simplify any guide step with big drop-off |
| 2 | Day-1 retention | Early difficulty (levels 1–12), first rewards, `tutorialSlowdown` |
| 3–4 | Day-7, difficulty | Spikes from `level_beat` vs `session_end` by level; chef tweaks in an update |
| 4–5 | Economy | Test `tipsMult 0.6 / costScale 1.5` (docs/ECONOMY.md) on one country via remote config; compare day-7 and spend |
| 5–6 | Revenue | Starter pack timing, rewarded-ad placements, Restaurant Pass price |
| 7–8 | Content and events | A live event via remote config `events`; check it lifts sessions |

Change **one thing at a time** per country and give it at least 5 days. Note every change and
its date in a table like the one below, or the numbers can't be read later.

| Date | Country | Change (build / remote config) | Expected effect | Result after 7 days |
|---|---|---|---|---|
| | | | | |

## Go / no-go for worldwide

Go when, for two weeks in a row: crash-free above 99.5%, day-1 above 35%, day-7 above 12%, no
level with a clear spike, and nothing in reviews that keeps repeating. If day-1 is fine but
day-7 is weak, the core is good and the mid-game needs work: keep soft-launching. If day-1 is
weak after three rounds of first-day fixes, rethink the start before spending on ads.

## Remote config cheat sheet

```json
{
  "tipsMult": 0.6,
  "costScale": 1.5,
  "coinBoost": 2,
  "message": "Double coins this weekend! 🍣",
  "events": [
    { "id": "launch-week", "name": "Launch Week", "icon": "🎉", "text": "Coins ×1.5 in every run",
      "start": "2027-03-01", "end": "2027-03-08", "coinMult": 1.5 }
  ],
  "serverUrl": "https://your-server.example"
}
```

All keys and their defaults are in docs/ECONOMY.md and `src/config.ts`. New values are used on
the **next** launch of the game, never mid-run.
