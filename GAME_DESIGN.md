# Orbit Hop — Game Design

## Pitch
A one-tap arcade game. You circle a planet; tap to let go and fly off in a straight line.
Time the release so you land on the next planet. Miss and you drift off into space.
Rounds last 30 seconds to a few minutes, which suits commutes and queues.

## Why this design works for mobile stores
- **One-thumb control.** Anyone understands it in a few seconds, and the title screen doubles as the tutorial.
- **Skill shows quickly.** Landing is easy. Hitting the planet's centre ("PERFECT") is hard, and perfects chain into combos.
- **"One more try" loop.** Death is instant, retry is one tap, and your best score is always shown.
- **No assets to license.** All graphics are drawn in code and all sounds are synthesized, so the download is tiny (about 25 KB of game code).
- **Works offline.** No accounts, no network, no personal data. Store privacy forms become trivial.

## Core rules
| Element | Behaviour |
|---|---|
| Orbit | The player circles the current planet. Bigger planets orbit slower, so linear speed stays about the same. |
| Launch | Tap: the player flies tangent to the orbit at a fixed speed. |
| Land | Reaching another planet's orbit ring captures you. The orbit direction follows your approach. |
| Perfect | The flight line passes within 40% of the planet's radius from its centre. Gives +1 + combo. |
| Coins ◆ | Placed off the direct path, so collecting one is a risk/reward choice. Coins are banked across runs. |
| Death | Leaving the screen, falling below the camera, or 1.4 s in open space. |

## Difficulty curve (planet index 0 → 40, then flat)
- The gap between planets grows from about 150 to 280 units.
- Planet radius shrinks from about 38 to 20.
- Orbit speed rises by about 2×.
- Moving planets (side-to-side) appear after planet 12, becoming more common up to 55%.

## Feel / juice
Glow, trails, particle bursts, a screen shake on perfects and death, haptics on iOS and Android, rising pitch on consecutive landings, and a parallax starfield.

## Roadmap (post-launch)
1. **Skins shop**: spend banked ◆ on player trails and planet themes. This gives coins a purpose.
2. **Leaderboards**: Game Center (iOS) and Play Games Services (Android) via a Capacitor plugin.
3. **Daily challenge**: a seeded level that is the same for everyone each day.
4. **Monetization** (choose one):
   - A paid "Remove ads" in-app purchase plus rewarded ads ("continue once") via AdMob. If you add these, update the privacy policy and store data-safety forms, and add App Tracking Transparency on iOS.
   - Or a premium price with no ads, which is the simplest to ship.
5. Analytics, to tune where players die (this also needs a privacy policy update).
