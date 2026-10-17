# Sushi Stack — Game Design

## Pitch
A one-tap stacking game set in a cozy sushi bar. A layer of rice, fish, nori or tamago slides back and forth;
tap to drop it on the stack. Anything hanging over the edge gets sliced off, so your stack gets narrower. Land it dead-on for a crunchy
**PERFECT**, and string perfects together to grow the stack back. Fill customer orders as you climb.

## Why this design (from the Oct 2026 App Store top 20)
| Chart pattern | How Sushi Stack uses it |
|---|---|
| One-tap puzzles where each tap is a decision (Block Out, Bus Fever, Arrow Puzzle) | One tap per layer; every drop matters |
| Satisfying feel and sounds (Mystery Dumpling, Smash Fest) | Knife crunch, slicing pieces tumbling, perfect chimes on a rising scale, flashes and haptics |
| Endless score-chasing (Block Blast, Subway Surfers) | Endless stack, best height always visible |
| A long-term goal on top of the simple game (Township, Gossip Harbor) | Customer orders → coins → (roadmap) restaurant upgrades |
| A cute theme on a familiar format (Meowdoku) | Proven "Stack" mechanic in a food theme nobody owns |

## Core rules
| Element | Behaviour |
|---|---|
| Drop | Tap to drop the sliding layer. The part that overlaps the layer below stays; the overhang falls off. |
| Perfect | Within 5 units of the layer below, the layer snaps into place with no trim. A combo of 3 or more also widens the layer by 8 units, up to the starting width. |
| Miss | No overlap: the layer falls and the run ends. |
| Speed | Starts at 130 units/s and rises by 5 per layer, up to 400. Layers alternate the side they slide in from. |
| Orders | Each order is a recipe (a repeating ingredient pattern) of 5 to 12 layers. The card shows the next 6 ingredients. |
| Serving | When an order is complete, a flag pick is planted on the stack and you earn coins: 2 × the average layer width. Wider stacks pay more. |
| Score | Layers stacked. Best score and banked coins are saved on the device. |

## Hooks
- **Instant start, instant retry.** The first tap plays, and the game-over screen accepts a tap after 0.7 s.
- **Near-miss nudge:** "So close! Only 2 more for a new best".
- **Combos with escalating feedback:** each perfect in a streak plays a higher note.
- **Orders give short-term goals** inside an endless run, so there's always "just finish this roll".
- **Coins carry over between runs**, ready for the shop below.

## Roadmap
1. **Restaurant meta.** Spend coins on decor (lanterns, counter, plates), new ingredients (ebi, unagi, ikura) and knife skins.
   This is the long-term reason to come back.
2. **Daily special.** One fixed recipe per day, with a streak counter and a bonus coin reward.
3. **Customers.** Animated customers with patience timers and tips for perfect rolls.
4. **Leaderboards.** Game Center and Play Games, plus a weekly event.
5. **Monetization:**
   - A rewarded ad to "save the roll" once per run (undo the miss).
   - A rewarded ad to double the coins from a run.
   - A one-time "Remove ads" purchase.
   - Optionally, interstitial ads every 3rd game over, never during play.

   Ads require updating `PRIVACY.md`, the store privacy forms, and adding App Tracking Transparency on iOS.
