# Age rating and ads consent

How to answer the rating questionnaires for Sushi Stack, and why. These are recommendations
from what's in the game; you answer the forms yourself and are responsible for the answers.

## Expected ratings

| System | Expected | Why |
|---|---|---|
| IARC (Google Play; also gives PEGI, ESRB, USK, ClassInd…) | PEGI 3 / ESRB Everyone | Cartoon chefs, no violence beyond cartoon kitchen slapstick |
| App Store | 4+ | Same |

## Questionnaire answers (IARC and App Store)

| Question | Answer | Notes |
|---|---|---|
| Violence | **None**, or at most "cartoon/fantasy, mild" | Boss chefs throw knives at the *tower*, not at people, and slam the counter; nothing is hurt. If a reviewer counts knives, "mild cartoon violence" still gives PEGI 7 / ESRB E. |
| Fear, horror | No | The Halloween theme has smiling pumpkins and bats only |
| Sexual content, nudity, crude humor | No | |
| Language | No | Chef taunts are mild ("Too slow, rookie!") |
| Controlled substances | **Check "alcohol: references"** only if asked about references | A "Sake Flask" tableware item and the mascot's name Sake-chan refer to sake. No drinking is shown. Most forms only ask about *use*, so the answer is No. |
| Gambling / simulated gambling | **No** | No betting, no casino games, nothing can be cashed out. |
| Purchases that include random items | **Yes** | Chests and sticker packs have random contents. Most come from play, but two paid products include them: the **Premium Pass** track has sticker packs, and **VIP** adds a free daily chest. The odds are shown in the game (Fair Play screen). This adds the "In-game purchases (includes random items)" label; the age rating stays the same. |
| In-app purchases | **Yes** | Starter Pack, VIP, Piggy Bank, Premium Pass, Restaurant Pass |
| Ads | **Yes** | Rewarded only, never forced |
| Users can interact / share content | **Yes, limited** | Sharing codes, screenshots and grids through the phone's share sheet. With the server on, a chef name the player types appears on the Daily Roll board. No chat. |
| Shares location | No | Country is picked by the player (guessed from the phone's language), not location |
| Unrestricted internet access | No | |
| Digital purchases | Yes | |

## Random items and paid products: country rules

Belgium treats paid random items as gambling, and the Netherlands has been strict about them too.
Options, from simplest:

1. Don't release in Belgium (Play Console / App Store availability) until you've decided.
2. Change the two paid sources to fixed rewards: in `src/live.ts` `passReward()`, make the
   premium track's `packs` rewards coins or shards, and make VIP's daily chest a fixed coin
   amount. Then the answer above becomes "No" and the label goes away.

Option 2 is the cleaner long-term choice. It's a small code change and a design decision, so
it's left to you.

## Target audience: not "for children"

The game is playable by anyone, but **don't select an audience under 13** (Google Play "Target
audience and content": choose 13–15, 16–17, 18+; App Store: don't use the Kids category). If
you target children, both stores require:

* no ads except certified child-safe ones (no AdMob rewarded ads as set up now);
* no "Share anonymous stats", no third-party analytics;
* no free-text names visible to others (the Daily Roll board).

That's a different build. The code is ready to switch: `tagForChildDirectedTreatment` in
`src/monetize.ts`, and `serverUrl` empty.

## Ads consent (what the code does)

* **Non-personalized ads by default** (`PERSONALIZED_ADS = false` in `src/monetize.ts`, sent as
  `npa: true`). Ads aren't based on the player's interests or other apps, so:
  * the iOS App Tracking Transparency prompt is **not** needed: don't add
    `NSUserTrackingUsageDescription`, and answer "No" to tracking in App Store privacy;
  * Google Play Data safety: "Device or other IDs" is still collected by the AdMob SDK for
    fraud prevention and frequency capping. Declare it as collected, not shared for
    advertising, not used for personalization.
* **Google UMP consent form** is requested at start-up and shown where the law requires it (EEA,
  UK, Switzerland). If the player declines, `canRequestAds` may be false and the game simply
  doesn't offer ad rewards.
* **Settings → Ad privacy choices** appears in those regions so the choice can be changed later
  (Google requires this).
* `maxAdContentRating: General`: only ads suitable for everyone.

Before release, in the AdMob console:

1. Privacy & messaging → **GDPR** → create a message (it is what the UMP form shows) and
   publish it. Without it, `requestConsentInfo` reports no form, and the EEA will get no ads.
2. Privacy & messaging → **US state regulations**: turn on, with "restricted data processing".
3. Blocking controls → set the max ad content rating to **G**.
4. Replace the test ad unit IDs in `src/monetize.ts` and set `ADS_TESTING = false`.

To turn on personalized ads later: set `PERSONALIZED_ADS = true`, add the ATT prompt on iOS
(`AdMob.requestTrackingAuthorization()` before `initialize`, plus the Info.plist text), and
update PRIVACY.md and both stores' privacy forms first.
