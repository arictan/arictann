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

## Scenes (free)
Each run plays through 10 backgrounds in a random order, and the scene crossfades to the next one every time an order is served:
Night Izakaya, Sakura Garden, Ocean Deep, Snowy Onsen, Bamboo Forest, Neon Tokyo, Sunset Harbor, Rainy Alley, Fuji Dawn and Golden Palace.
The changing scenery gives players a visible sign of progress and a reason to push for one more order.

## Earning coins
| Source | Coins |
|---|---|
| Serving an order | 2 × the average layer width (wider is better), about 6–20 coins |
| Perfect streak | +3 at a 5-perfect streak, +6 at 10, and so on |
| Height milestone | +10 every 25 layers |
| Daily gift | 20 coins on day 1, +10 for each day in a row, up to 80 on day 7. Missing a day resets it. |

The Coin Doubler booster doubles everything earned during a run except the daily gift.

## Shop
**Boosters** are used up on your next run, so coins stay useful forever:
| Booster | Price | Effect |
|---|---|---|
| Second Chance | 40 | Your first miss only loses that layer, not the run. It's used only if you actually miss. |
| Coin Doubler | 50 | 2× coins for one run |
| Slow Start | 25 | The first 15 layers move 30% slower |
| Wide Base | 30 | Start with a 260-wide roll instead of 200 |

**Plates** are cosmetic and owned forever. Tap a plate once to select it and again to buy:
Classic Plate (free), Wooden Geta (60), Black Slate (100), Bamboo Mat (150), Wave Porcelain (220), Gold Platter (400).

## Hooks
- **Instant start, instant retry.** The game-over screen has RETRY and SHOP buttons.
- **Near-miss nudge:** "So close! Only 2 more for a new best".
- **A visible goal after every run:** "Next: Black Slate 80/100" with a progress bar. It turns gold with "You can buy…" when you can afford it.
- **Daily gift streak**, to bring players back each day.
- **Combos with escalating feedback**, plus streak coin bonuses.
- **Orders give short-term goals**, and each one also changes the scene.

## Roadmap
1. **More shop items:** new ingredient sets (ebi, unagi, ikura), flag-pick designs and knife trails.
2. **Daily special.** One fixed recipe per day, with a streak counter and a bonus coin reward.
3. **Customers.** Animated customers with patience timers and tips for perfect rolls.
4. **Leaderboards.** Game Center and Play Games, plus a weekly event.
5. **Monetization:**
   - A rewarded ad to "save the roll" once per run (undo the miss).
   - A rewarded ad to double the coins from a run.
   - A one-time "Remove ads" purchase.
   - Optionally, interstitial ads every 3rd game over, never during play.

   Ads require updating `PRIVACY.md`, the store privacy forms, and adding App Tracking Transparency on iOS.
