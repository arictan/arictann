# Device test plan

Automated tests (Playwright bots, fuzzing, layout checks) run in a desktop browser. They can't
feel a vibration, hear a speaker, see through a camera or tilt a phone. This list covers what
only a real device can check. Do it before every store release, on at least:

* one recent iPhone (notch or Dynamic Island) and one older/smaller iPhone (SE size);
* one recent Android and one cheap/old Android (2–3 GB RAM);
* one tablet (iPad or Android), in case it is allowed in the store listing.

Most checks start from **Settings → Diagnostics → Device check**, which has a button for each one.

## 1. Install and first launch

- [ ] Fresh install from TestFlight / Play internal testing. The logo intro plays, then the story.
- [ ] Guided first day: PLAY → beat 2 chefs → RESTAURANT → BUILD → COOK → PLATE → SERVE. The
      finger and caption are always visible and never cover the thing to tap.
- [ ] "FIRST DAY COMPLETE" gives +150 coins.
- [ ] Kill the app mid-run, reopen: progress is kept and nothing is broken.

## 2. Screen and layout

- [ ] Nothing hides under the notch, Dynamic Island, rounded corners or the home bar.
- [ ] Rotate the phone: the game stays portrait (or lays out correctly on a tablet).
- [ ] Largest system text size and Display Zoom: menus still fit (the game uses its own font sizes,
      but check the native dialogs).

## 3. Feel (Device check buttons)

- [ ] Each of the 8 haptic buttons (soft, firm, crisp, pop, slide, wobble, crunch, squish) feels
      different. On iPhone, haptics are off in Low Power Mode; that's expected.
- [ ] SOUNDS plays five different landing sounds; SONG plays a short tune.
- [ ] Sound respects the silent switch (iPhone) and the media volume (Android).
- [ ] Headphones in and out mid-run: no crash, sound follows.
- [ ] TILT TEST: tilting the phone changes the number. iPhone asks for motion access first.
- [ ] CAMERA TEST: asks for permission, shows the back camera. Saying "Don't allow" shows a polite
      message and Table mode stays off.

## 4. Notifications and widget

- [ ] REMINDER TEST: a notification arrives about 10 seconds later (after allowing them).
- [ ] Tapping the notification opens the game.
- [ ] Daily reminders: change the phone's date forward a day, the reminder comes at the set time.
- [ ] WIDGET TEST: add the widget to the home screen first; it shows the latest streak/coins.
- [ ] iPhone: Live Activity appears during a run and ends with it (iOS 16.1+).

## 5. Purchases and ads (once store accounts exist)

- [ ] Sandbox / license-tester purchase of each product. The shop shows TEST MODE until real
      products are configured.
- [ ] Restore purchases on a second device.
- [ ] A rewarded ad grants its reward only after it finishes; closing it early gives nothing.
- [ ] With ads consent declined (EU/UK test region), only non-personalized ads are shown.

## 6. Save safety

- [ ] Diagnostics shows today's backup. Play a bit, then RESTORE TODAY'S BACKUP: the app reloads
      and progress goes back.
- [ ] Copy save code → install on a second device → paste: progress moves over.
- [ ] Upgrade test: install the previous store version, play, then install the new build over it.
      The save is migrated (Diagnostics shows "save v2") and nothing is lost.

## 7. Performance and battery

- [ ] Diagnostics "Frame work" under 12 ms on the home screen and in a 100-layer run.
- [ ] On the old Android: if Quality switches to Lite, the game still looks right.
- [ ] 20 minutes of play: the phone gets warm but not hot; battery drop is noted below.
- [ ] Battery saver on: menus feel the same, effects are lighter.

## 8. Interruptions

- [ ] Incoming call / alarm mid-run: the run pauses, music stops, comes back after.
- [ ] Switch apps for 10 minutes and come back: restaurant tips have grown, no double rewards.
- [ ] Airplane mode: everything except online boards works; simulated players stay labelled.

## 9. Accessibility

- [ ] VoiceOver / TalkBack: menu buttons are read out; the run announces level and chef.
- [ ] Reduced motion (system setting) turns off shake and confetti.
- [ ] Play by ear mode works with eyes closed (headphones).

## Results log

| Date | Build | Device | OS | Tester | Passed | Notes |
|------|-------|--------|----|--------|--------|-------|
|      |       |        |    |        |        |       |

After a failure: Diagnostics → COPY REPORT and attach it to the bug.
