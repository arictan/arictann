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
| **Chef Journey (endless)** | Beating a chef unlocks the next one for good. TAP TO PLAY continues from the furthest chef. The **Map** shows the chefs on a winding path that keeps going, and you can replay any unlocked chef. Levels 1–50 are hand-made story chefs; every level after that gets a newly generated chef. |
| **Star gates** | From level 11, every 10 levels has a gate that needs 2 stars per earlier level in total (20★ for level 11, 40★ for 21, 100★ for 51, and so on). A closed gate ends the run with a STAR GATE screen, so players replay earlier chefs for 3 stars instead of just surviving. |
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

## Live-ops update: 20 features from top games
| # | Feature | Inspired by | In Sushi Stack |
|---|---|---|---|
| 1 | **Special layers** | Candy Crush specials | About 1 in 8 layers (from layer 3) is **Golden** (PERFECT = 3× coins), **Ice** (slides 60% faster), **Wasabi** (a missed drop burns 12 extra units) or **Mystery** (PERFECT = a free booster). During holidays the golden layer gets a seasonal name. |
| 2 | **Fever** | Fruit Ninja, Subway Surfers | Every 10 PERFECTs in a row triggers 5 s of Fever: layers move at half speed, the PERFECT zone is 8 units wider, coins ×3, the screen glows gold and the music adds an arpeggio. Every 5th PERFECT gives a short slow-motion moment. |
| 3 | **Game modes** | Block Blast | **Zen** (no game over, no chef attacks, 30% coins, END button). **Time Attack** (60 s, height = score). **40 Puzzles** (fixed layers, width and speed, with a slice budget; 1–3 stars by slices used). **Friend Challenge** (see #14). |
| 4 | **Companions** | Subway Surfers, Crossy Road | 6 sous-chefs leveled with shards (10/15/25/40/60): 🐱 Neko catches knives · 🦝 Tanuki blocks soy · 🦉 Owl shows guide lines · 🦊 Kitsune +5–25% coins · 🐼 Panda slows the first layers · 🦢 Swan rebuilds a thin stack. 1 slot, 2 at Chef Rank 10. They sit on the counter. |
| 5 | **Win streak** | Royal Match, Candy Crush | Journey runs that beat their first chef extend the streak: 3+ = hot start (3× combo), 5+ = steady hands, 8+ = a free Second Chance. A run that beats no chef resets it. |
| 6 | **Restaurant** | Royal Match, Homescapes | Spend stars on 8 areas × 3 levels: Street Stall → Cozy Izakaya → Grand Sushi Palace → Michelin stars (endless). Each upgrade pays coins; each finished restaurant gives +5% coins forever and an exclusive item. Stars spent here never lower your star-gate total. |
| 7 | **Sticker album** | Monopoly Go | 12 sets × 9 emoji stickers, with rarity 1–5★. 3 per pack, from chests, the daily gift, the Pass, the World Tour and the race. Duplicates become coins. Sets pay 150–700 coins; the full album pays 3,000 and the Album Master flag. A new album each Pass season. |
| 8 | **Sushi Pass** | Brawl Stars; Google Play guide | 45-day seasons, 30 tiers × 100 XP. XP from chefs (15), missions (40), specials (50), gifts (20), PERFECTs (1) and flawless orders (+10). Free track plus a premium track ($4.99, test mode) ending in the Season Plate. |
| 9 | **Streak freeze + mascot** | Duolingo | One free freeze each week (hold 2, or buy one for 150 coins) saves the gift streak after one missed day. Maki the cat sits on the gift button; streaks of 3/7/14/30/50/100 days are celebrated. |
| 10 | **World Tour** | Subway Surfers | A new city every 21 days (Tokyo, Osaka, Seoul, Bangkok, Hong Kong, Taipei, Singapore), with its skyline and landmark as the first background of every run. Tokens (chefs +1, specials +3, missions +2) unlock 2 packs at 15, 400 coins at 35 and the city's plate at 60. |
| 11 | **Holiday events** | Most top games | Lunar New Year, Cherry Blossom, Summer Fireworks, Spooky Sushi Night (Oct 15–Nov 2) and Winter: decorations over every background, seasonal golden layers, and a limited item at 40 tokens. |
| 12 | **Sushi Sprint (daily race)** | Royal Match Lava Quest | Join, then beat 5 chefs in one run. 1,000 coins are split between you and the AI racers already finished, so finishing early pays more. Plus 2 sticker packs. |
| 13 | **Sushi Cup (weekend)** | Royal Match King's Cup | Fri–Sun, best single-run height against 49 labelled AI rivals whose scores climb over the weekend. Prizes by rank (600 coins and the Cup Trophy flag for #1). |
| 14 | **Share card + challenge code** | Wordle | Share an image of your stack with a code (seed-level-score). A friend who enters it plays the same seeded chefs, recipes and events, with your score as a FRIEND line. |
| 15 | **Leaderboards** | Subway Surfers | A local screen with your records and the Cup standings. Online boards need Game Center / Play Games (see README). |
| 16 | **Kitchen Crew** | Royal Match teams | A weekly team goal with 4 labelled AI crewmates: 60 orders = 300 coins, 120 = 3 packs, 200 = 10 shards. Real teams need a server. |
| 17 | **Rewarded ads** | Most hit casual games | Optional only: **continue** a run once, **double** a run's coins, or open up to **3 free chests** a day. AdMob test ads on phones, a simulated test ad in the browser. VIP gets the rewards without ads. |
| 18 | **Piggy bank** | Common in casual games | 15% of every run's coins drop into the piggy (up to 2,500). Break it for $2.99 (test mode). |
| 19 | **Starter pack + VIP** | Most casual games | Starter Pack $1.99 once: 600 coins, 6 boosters and the Sakura Bento plate. VIP $4.99/month: rewards without ads, +60 coins and +1 free chest daily. No pay-only power. |
| 20 | **Music + celebrations** | Duolingo, rhythm games | A generated koto-style tune whose tempo rises with your combo, with an extra layer in Fever. Confetti celebrations for 50/100/250/500/1000-layer runs, rank-ups, streaks, sets, restaurants and companions. Music and sound switch on and off separately in More. |

**Home screen:** a big PLAY button, chips for win streak, daily streak (with freezes) and Chef Rank, the gift with Maki the cat, MODES, the Daily Special, missions, an event ticker, and a bottom bar (Map, Events, Shop, Restaurant, More) with red dots when something is ready to claim.

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

### Endless mode (level 51 and up)
After the 50 story chefs, every level gets a new chef, generated from that level's number so it's always the same chef for everyone. Each has a mix of looks (hair, headwear, face, outfit), a name such as "Sensei Lan" or "Iron Chef Arun", catchphrases, and rules. **Every 10th level (60, 70, 80…) is a Legend boss** with a crown or gold headband, every rule turned on, and double chest coins.

Difficulty keeps climbing, then levels off at a playable ceiling:
- **Chef speed:** grows from 1.5× toward 1.9× (layer speed never exceeds 560 units/s).
- **PERFECT zone:** it gets more likely that a chef has the small PERFECT zone (up to 85%).
- **Attacks:** chefs get meaner (attack chance up to 50% per drop).
- **Starting width:** shrinks from 200 after level 20, down to 140 by level 60. Wide Base still adds 60.
- **Order length:** grows by 1 every 10 endless levels, to a maximum of 20 layers.

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

## Depth update: 20 more features

**Gameplay**
1. **Gradual unlocks and a tutorial.** New players see only PLAY and a "How to play" card. The shop and daily gift open at level 2, modes and the map at 3, events at 4, the restaurant at 5, and the rest at 6. Each feature gets a celebration the first time it opens and a NEW tag until it is visited. The first run is slowed down, a finger shows where to tap, and coach cards explain PERFECTs, slicing and serving.
2. **New ingredients.** Ebi (level 8, a PERFECT counts double for your combo), unagi (15, slippery: it slides a little after the tap), tofu (25, wobbles) and ikura (35, a PERFECT pays bonus coins). Each comes with its own recipe.
3. **Boss rage.** Every 10th level, the boss rages halfway through the order: faster layers, more attacks, and knife flurries. Endless Legend bosses add a "final fury" near the end.
4. **Booster picker.** Before a run you pick which owned boosters to use. Unpicked ones stay in the bag, and the picker remembers your last choice.
5. **Perks.** After each chef in a journey run, you pick 1 of 3 perks for the rest of the run, for example Wide Roll, Bodyguard or Hot Kitchen. They stack.
6. **Ghost.** Faint outlines of your best run show the shape you're racing.

**Personality**
7. **My Chef.** Your own chef avatar with 8 parts (the golden toque and crown are earned on the journey). It appears on the home screen, in story panels and on share cards.
8. **Regulars.** Ten named customers place the orders, each with a favourite dish. Serving them earns hearts across 5 friendship levels, each with a reward and a new line of dialogue. At Friend level they make special requests: a longer order for double coins.
9. **Story.** One chapter every 10 levels, from reopening grandmother's sushi bar to the Golden Plate, then the endless Legends. Each chapter has an opening and an ending, and you can re-read them.
10. **Achievements.** 60 in total: 15 families with 4 tiers each, paying 50, 150, 400 and 1,000 coins.
11. **Gallery.** Every 6 PERFECTs reveal a tile of a 4×4 picture. There are 12 pictures, each worth 300 coins.
12. **Themed Pass seasons.** Each Sushi Pass season takes a theme from the calendar (Sakura Spring, Summer Matsuri, Spooky Kitchen, Winter Lights and others), with a matching prize plate.

**Platform**
13. **Settings:** music, sound, vibration, reduced motion, colour-blind symbols, assist mode, highlight clips and language. A gear on the home screen keeps them reachable before MORE opens.
14. **Languages.** The main UI is translated into Japanese, Korean, Spanish, Portuguese, Hindi and Turkish. Chef lines and item names stay in English.
15. **Analytics.** Events (tutorial steps, runs, level beats, perks, purchases, ad rewards) are logged on the device. A hook is ready for Firebase or any other SDK, and nothing is sent by default.
16. **Remote config.** Balance values (coin boost, perk frequency, rage point, tutorial speed, invite reward, an announcement message) have offline defaults and an optional JSON URL.
17. **Save transfer.** A compressed, checksummed code moves your progress to another device.
18. **Invites.** Every player has an invite code, and a friend who enters it gets a welcome gift.
19. **Duels.** Every friend challenge you play is recorded as a win or loss, with a rematch on the same seed.
20. **Highlight clips.** When turned on, the canvas is recorded in overlapping 6-second segments, so the last 6–12 s of a run can be shared as a video.

## Restaurant and 25 more features

**The restaurant** is now a place to return to every day:
- **Detailed scene:**
  - Window with the real-time sky.
  - Menu board, tiled floor and steaming dishes.
  - Your chef behind the counter, plus up to 6 regulars on stools.
  - Staff at work and a cat that naps once the room is cosy.
  - Theme particles: petals, snow, fireflies, leaves or gold.
- **Tips:** the tip jar earns coins per hour while you're away and holds 8 h. The dishwasher and the Pass make it hold more. A local reminder fires when it's full, if the player allowed reminders.
- **Guests (1):** tap a guest showing "!" to serve them, for coins and a heart for that regular. Up to 40 a day.
- **Decor styles (2):** each area has 3 looks. One is free, one costs coins, and one is earned with critic reviews or the Restaurant Pass.
- **Themes (3):** Classic, Sakura Terrace, Summer Matsuri, Maple Inn, Haunted Izakaya, Winter Onsen and Imperial Gold. Seasonal themes are free to claim in their season.
- **Food Critic (4):** visits about one day in three. Serve one long, tight order with 2★ for a review. Reviews add popularity, tips and decor unlocks.
- **Staff (5):** a waiter (more tips), a dishwasher (bigger jar), a greeter (more seats and hearts) and an apprentice (daily boosters). Each has 3 levels.
- **Visit friends (6):** share a restaurant code (R-…). Friends see your room and can leave a ❤️ for coins.
- **Menu board (7):** pick today's special. It turns up more in runs and pays 2× coins there, and any menu adds +20% tips.

**Gameplay**
- **New boss moves (8):** from level 20, the bite shaves the top layer. From 30, the speed flip reverses the layer and speeds it up. From 40, the freezer blast frosts the edges of the screen.
- **Sous-chef bonus round (9):** every 3rd chef offers 3 extra drops that don't count toward the order. Three PERFECTs win a chest.
- **Fancy cuts (10):** PERFECTs during a 5+ streak land with a gold garnish and pay +1 coin.
- **Weather (11):** from level 12. Wind makes layers faster one way and slower the other; rain makes them skid.
- **Gauntlet mode (12):** boss after boss with short orders, no breaks and no perks. It keeps a best score.
- **Ingredient mastery (13):** 100 layers of an ingredient gives it a gold rim and +1 coin per PERFECT.

**Social and collecting**
- **Leaderboards (14):** `services.ts` keeps weekly and all-time boards on the device, with a hook for Game Center / Play Games.
- **Duels (15):** a full live duel needs a server. Instead, ghost codes give a same-seed race against a friend's exact run.
- **Crews (16):** need a server (see below).
- **Ghost codes (17):** a G-… code carries your run's shape. Friends see it in pink as they play.
- **Chef cards (18):** card copies level up (3 / 6 / 10 copies). From Lv 2 the chef wears a gold uniform.
- **Museum (19):** every dish on wooden shelves, with gold frames at 10 serves and ingredient mastery bars.
- **Profile and season trophies (20):** finishing a Sushi Pass season adds a themed badge to the profile.
- **Prestige (21):** from level 101, restart the journey for +10% coins forever and the Prestige Plate.

**Retention and business**
- **Reminders (22):** the tip-jar reminder described above.
- **Login calendar (23):** 28 days that never reset on a missed day. Day 28 gives the Loyal Chef Plate.
- **Restaurant Pass (24):** $2.99/month, in test mode until the store is set up. It gives +50% tips, +4 h jar, the Imperial theme and 4 gold styles.
- **Store events (25):** in-app event images and copy are in `store/IN_APP_EVENTS.md`.

## Worlds, competition and 20 more features

**Competition**
- **Leagues (1):** 7 weekly tiers from Bronze to Master, 30 players each. You earn points for each chef you beat (+10, or +15 if flawless), each PERFECT (+1) and the Daily Special (+20). The top 7 move up, the bottom 5 move down, and coins depend on your rank. Rivals are AI and labelled "(AI)".
- **Streak Quest (2):** a 3-day race with 100 players. Beat 7 chefs in a row in the journey; a run that ends with no chef served knocks you out. Survivors split 10,000 coins. The other 99 are AI.
- **Nemesis (3):** a chef who beats you 3 times becomes your nemesis. They get faster, attack more and taunt you, and show as 😈 on the map. Beat them for a badge.

**Gameplay**
- **Rescue levels (4):** 10 hand-made levels. Floods and storms raise water you must out-stack; quakes give you a time limit and shake the stack. Each level earns 1–3 stars.
- **Twin layers (5):** two halves slide apart and back together, and you drop them when they meet. They show up at random from level 60.
- **Modifiers (6):** Mirror, Blind (the layer is only an outline), Tiny, Double speed and Twins. Each has a daily challenge.
- **Mini-games (7):** Knife Throw, Rice Rhythm and Fish Catch unlock at levels 11, 21 and 31. The first win each day pays 150 coins.
- **Omakase Tower (8):** 50 floors each week, with a seeded twist on each floor. Checkpoints every 10 floors pay rewards.

**Worlds**
- **New cuisines after level 100 (9):** from level 101 the journey cycles through Pizza, Burger and Pancake worlds and back to Sushi, 50 levels each. Each world has its own chefs, outfits, 5 ingredients and recipes, and opens with a story card.
- **Recipe Lab (10):** mix ingredients you've stacked 20+ times to find 8 secret recipes. You get 10 tries a day, and each try gives a warmer/colder hint. Secret recipes then appear in orders.
- **Food truck branches (11):** each World Tour city plate you own opens a food truck that earns tips around the clock. Trucks have 5 upgrade levels.

**Feel**
- **Chef voices (12):** Animal Crossing-style babble when a chef speaks, pitched per chef. It can be turned off in Settings.
- **Jukebox (13):** 5 generated music tracks: Koto Classic, Lo-fi Kitchen, Taiko Festival, City Pop Night and Winter Bells. They drop from chests or can be bought.
- **Photo mode (14):** the 📷 button on the results card renders the whole tower, with 5 filters and 4 frames, ready to save or share.
- **Left-handed layout (15):** corner buttons and the results row are mirrored.

**Social**
- **Pass & Play (16):** two players take turns on one phone with the same seed, so they face the same chefs and layers. The higher stack wins.
- **Emoji reactions (17):** pick an emoji when sharing a challenge code. Your friend sees it when they open the code and again when their run ends.

**Native and accessibility**
- **Home-screen widget (18):** shows your restaurant, its popularity, how full the tip jar is, your login-calendar day, and your level and next chef. The bridge is in `src/widget.ts`. The native iOS (WidgetKit) and Android (AppWidget) code is in `native/`, with install steps.
- **Live Activity (19):** on iOS, the tip jar's fill shows on the Lock Screen and in the Dynamic Island. Its code is in `native/ios`.
- **Accessibility (20):**
  - An optional haptic tick when the layer lines up.
  - Screen-reader announcements for screens, chefs, PERFECTs and results.
  - A hidden list of real buttons that mirrors every button on the canvas, so VoiceOver and TalkBack can navigate the menus. Buttons without a label are named from the text drawn on them or on their row ("Knife Throw: PLAY", "Hat · Chef toque: next"), and buttons hidden behind an overlay are left out.

## Not done yet (needs accounts or a server)
- **Cloud save:** Game Center / Google Play Games saved games, or a backend. Save-transfer codes cover this for now.
- **Inviter rewards, live duels and crews with real players:** these need player accounts and a server. Today, duels and ghost races replay a shared seed against the score and shape inside the code, and crew mates and cup rivals are labelled AI.
- **Rewards for the friend whose restaurant you visit:** these also need accounts.
- **Online leaderboards:** Game Center and Play Games. Event rivals are clearly labelled AI.
- **Live analytics and remote config:** set `ANALYTICS_ENDPOINT` / a sink and `REMOTE_CONFIG_URL`, then update the privacy policy and store forms.
- **Real league and quest opponents:** these need a server. Today they are seeded AI, labelled "(AI)".
- **Widget and Live Activity in the native projects:** the code in `native/` hasn't been compiled here. Add it in Xcode and Android Studio (see `native/README.md`) and test it on a device.
- **Full translation** of chef dialogue, item names, the newest feature screens and store listings.
