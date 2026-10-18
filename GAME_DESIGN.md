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

## Long-term progress (retention systems)
Inspired by what keeps players in Royal Match, Block Blast and Subway Surfers. Everything is saved on the device.

| System | How it works |
|---|---|
| **Chef Journey (50 levels)** | Beating a chef unlocks the next one for good. TAP TO PLAY continues from the furthest chef. The **Map** shows all 50 chefs on a winding path, and you can replay any unlocked chef. |
| **Stars** | Each chef awards 1–3 stars based on the share of PERFECT drops in their order (60%+ = 3 stars, 30%+ = 2 stars). The best result is kept, which gives a reason to replay. |
| **Missions + Chef Rank** | Three missions are active at a time, such as "Land 15 PERFECTs", "Dodge 2 knife throws" or "Serve 2 Green Roll". Each pays 25 coins. Finishing all three raises **Chef Rank** (+5% coins forever, up to +100%) and deals a harder set. |
| **"Your best" lines** | A gold dashed BEST line and a faint LAST line on the stack show your record and your previous run while you climb. |
| **7-day gift streak** | The gift pays 20, 30, 40, 50, 60 and 80 coins, then 300 on day 7, which is more than days 1–6 combined. The first day 7 also unlocks the exclusive **Golden Week** flag; later ones add 2 bonus boosters. Missing a day resets the streak. |
| **Daily Special** | One 10-layer order per day, with the same chef and recipe for everyone (seeded by date). Clearing it pays 150 coins once per day; after that it's practice. |
| **Boss chests** | Every chef beaten opens a free chest: 10–35 + level coins, a 30% chance of a booster, and 1 piece toward exclusives (10 pieces = **Dragon Plate**, 25 = **Phoenix FX**). |
| **Album** | **Chef cards**: one for each chef beaten, with stars. **Recipe book**: serve each recipe 10 times for +50 coins. **Shop collections**: own every item in a tab for +200 coins. **Exclusives**: progress toward items that can only be earned. |
| **Weekly challenge** | Stack 20, 40 and 70 in a single run during the week for +50, +120 and +250 coins. It resets every Monday. **Records** shows Chef Rank, stars, best height and your top 10 runs. |
| **Gentle comeback** | After 3 quick losses in a row (under 8 layers), the next run's first 10 layers move 20% slower. The player isn't told, and it resets after a decent run. |
| **Reminders** | At most one local notification a day, scheduled for 6:30 pm the next evening when the app goes to the background: "Your daily gift is ready!" or "Chef X is waiting for you at level N". Permission is requested only after the player claims their first daily gift. |
| **Exclusive items** | Golden Week flag (7-day streak), Dragon Plate and Phoenix FX (chest pieces), and the Legend sushi set (beat level 50). |

Real online leaderboards (Game Center and Google Play Games) need the store accounts set up first. See the README.

## Levels and boss chefs
Each order is a level, and each level has a boss chef who watches you work. The chef:
- moves left and right to follow the sliding layer, watching it and pointing at it,
- gets more worked up as the order nears completion: **calm → focused → intense** (wide eyes, sweat) **→ panic** on the last layer (huge eyes, shaking),
- reacts to every drop: **impressed** (star eyes, "Sugoi!") on a PERFECT, **winces** when you slice off an overhang, is **happy** when the order is served, is **shocked** when Second Chance saves you, and is **angry** and gloats when you miss.

Beating a boss pays its level × 5 bonus coins, on top of the order's coins.

### Order up!
Finishing an order plays a short celebration. The finished roll (three maki pieces on a wooden board, filled with that recipe's ingredients) pops up from the stack with "ORDER UP!".
It then arcs down to a customer who slides up in the bottom corner, watches it arrive, eats it, and floats hearts with a "Yum!".

### Staying out of the way
The chef stays on the left or right edge, sized to fit between the top bar and the top of the stack, so they never cover the blocks. The order card sits on the opposite side.
The chef walks across to the other side every 5 drops and whenever a new boss arrives, and the order card slides over to match. Speech bubbles, attack warnings and the level banner all stay above the stack.

### Chefs fight back (or help)
After each drop the chef may act.
Every action is announced with a label on the chef's chest and a short wind-up, so the player can react.

| | Action | What happens |
|---|---|---|
| Attack | **Knife Throw** | The chef raises a knife, then throws it at the sliding layer and homes in on it. Drop the layer before the knife reaches it to **dodge**. If it hits, the layer is knocked off: you lose that layer and your combo, but not the run. |
| Attack | **Table Slam** | The chef raises a fist and slams the counter. The screen shakes and the top layer slides 10–20 units sideways. It always keeps some footing on the layer below. |
| Attack | **Soy Splash** | Three soy-sauce splats cover part of the screen for about 3.5 seconds. |
| Help | **Steady Hands** | The next 3 layers move at 55% speed, shown with a blue glow. |
| Help | **Patch Up** | The chef throws a rice ball that widens the top layer by up to 50, back toward full width. |
| Help | **Tip** | Bonus coins: 3 + level × 2. |

Each chef has a temperament. The chance of an attack after a drop is the chef's meanness (5–30%), plus 8% if the drop wasn't a PERFECT.
The chance of help is the chef's kindness × 6% normally, × 15% with a combo, or × 35% with a 3+ combo. Each chef attacks only in their own ways
(Kenji only slams; Kaito uses all three). There are no events before layer 3, and none for 3 drops after the last event or after a new boss arrives.

| Level | Boss | Rule |
|---|---|---|
| 1 | Chef Kenji | Warm-up round |
| 2 | Chef Hana | Layers move 10% faster |
| 3 | Chef Taro | Smaller PERFECT zone (3 instead of 5 units) |
| 4 | Chef Mei | 2 extra layers in the order |
| 5 | Chef Goro | Layers move 20% faster |
| 6 | Chef Yuki | Layer speed surges and eases |
| 7 | Chef Ryu | Layers move 30% faster |
| 8 | Chef Aiko | Smaller PERFECT zone and 2 extra layers |
| 9 | Master Sato | 30% faster, with surges |
| 10 | Grand Chef Kaito | 40% faster, surges, smaller PERFECT zone, 1 extra layer |
| 11 | Chef Daichi | 20% faster |
| 12 | Chef Sakura | Smaller PERFECT zone, 15% faster |
| 13 | Chef Kenta | 30% faster, with surges |
| 14 | Chef Rin | 2 extra layers, 20% faster |
| 15 | Chef Haruto | Smaller PERFECT zone, 25% faster |
| 16 | Chef Nao | 25% faster, with surges |
| 17 | Chef Bao | 35% faster |
| 18 | Chef Mina | Smaller PERFECT zone and 2 extra layers |
| 19 | Chef Jun | 40% faster |
| 20 | Chef Lin | Smaller PERFECT zone, 30% faster, with surges |
| 21 | Chef Takeshi | 40% faster, 1 extra layer |
| 22 | Chef Emi | 35% faster, with surges |
| 23 | Chef Hiro | 45% faster |
| 24 | Chef Yui | Smaller PERFECT zone, 3 extra layers |
| 25 | Chef Kazu | 50% faster |
| 26 | Chef Momo | Smaller PERFECT zone, 40% faster, with surges |
| 27 | Chef Shin | 50% faster, with surges |
| 28 | Chef Akane | Smaller PERFECT zone, 50% faster, 2 extra layers |
| 29 | Master Tanaka | Smaller PERFECT zone, 55% faster, surges, 1 extra layer |
| 30 | Emperor Chef Ren | Final boss: 60% faster, surges, smaller PERFECT zone, 2 extra layers |
| 31 | Chef Sora | 45% faster, surges, 1 extra layer |
| 32 | Chef Wei | 50% faster, 1 extra layer |
| 33 | Chef Ji-woo | Smaller PERFECT zone, 45% faster, surges |
| 34 | Chef Kaori | 45% faster, 3 extra layers |
| 35 | Chef Minh | 55% faster |
| 36 | Chef Suki | Smaller PERFECT zone, 2 extra layers |
| 37 | Chef Ryota | 55% faster, surges, 1 extra layer |
| 38 | Chef Hye-jin | Smaller PERFECT zone, 50% faster, surges |
| 39 | Chef Tomo | 60% faster |
| 40 | Chef Xiao | Smaller PERFECT zone, 3 extra layers |
| 41 | Chef Natsu | 60% faster, surges |
| 42 | Chef Dae | Smaller PERFECT zone, 60% faster |
| 43 | Chef Chiyo | 55% faster, surges, 3 extra layers |
| 44 | Chef Arata | 65% faster |
| 45 | Chef Yuna | Smaller PERFECT zone, 60% faster, surges |
| 46 | Chef Long | 70% faster |
| 47 | Chef Hikari | Smaller PERFECT zone, 3 extra layers |
| 48 | Master Fujimoto | Smaller PERFECT zone, 70% faster, surges, 2 extra |
| 49 | Grand Master Liang | Smaller PERFECT zone, 75% faster, surges, 2 extra |
| 50 | Dragon Chef Tatsu | LEGEND: 80% faster, surges, smaller PERFECT zone, 3 extra |

After level 50 the bosses repeat, 10% faster on each lap. Layer speed never exceeds 560 units/s. The chefs are friendly cartoon characters, each with different headwear, hair and outfit, and drawn in code like everything else.

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
The shop has five tabs: Boost, Plates, Flags, Sushi and FX (46 items). The list scrolls by dragging, or with the mouse wheel on desktop.
Cosmetics take two taps to buy (select, then confirm), so coins aren't spent by accident. Tap an owned item to put it on.

**Boosters** are used up on your next run, so coins stay useful forever:
| Booster | Price | Effect |
|---|---|---|
| Second Chance | 40 | Your first miss only loses that layer, not the run (used only if you miss) |
| Coin Doubler | 50 | 2× coins for one run |
| Slow Start | 25 | The first 15 layers move 30% slower |
| Wide Base | 30 | Start with a 260-wide roll instead of 200 |
| Perfect Magnet | 60 | The PERFECT zone is 4 units wider for the run |
| Chef Shield | 70 | Chefs can't attack for the run |
| Lucky Charm | 45 | Chefs help twice as often |
| Short Orders | 55 | Every order is 2 layers shorter (minimum 3) |
| Hot Streak | 35 | Start the run on a 3× combo |

**Plates (12)**, which your roll sits on: Classic (free), Wooden Geta 60, Black Slate 100, Bamboo Mat 150, Sakura 180, Wave Porcelain 220, Marble 280, Red Lacquer 340, Gold 400, Ice Crystal 500, Neon Tray 600, Diamond 900.

**Flags (8)**, the pick planted for every served order: Pennant (free), Heart 40, Star 70, Koi 110, Paper Fan 150, Lantern 200, Rainbow 300, Crown 500.

**Sushi sets (8)**, which recolour every layer: Classic (free), Pastel 120, Forest 180, Ocean 250, Candy 350, Ink & Paper 450, Neon 700, Golden 1200.

**FX (8)**, what bursts out of a PERFECT: Sparkles (free), Hearts 80, Petals 120, Bubbles 160, Stars 220, Coin Shower 300, Fire 500, Lightning 800.

After each run, the results screen shows progress toward the cheapest item you don't own yet.

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
