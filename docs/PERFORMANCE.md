# Performance

How fast Sushi Stack draws, what slows it down, and what the game does about it.

## What was measured

Playwright on headless Chromium, phone viewport 390×844 at 3× pixel density (an iPhone 14
class screen), with Chrome's CPU throttling at 1×, 4× and 6× to stand in for slower phones.
The scripts are `perf.mjs` and `prof.mjs` (in the test scratchpad; easy to recreate from the
description below).

* **work** is the game's own time per frame (update + render, a rolling average, the same number
  the Diagnostics screen shows). The game turns on lite effects when it stays above 12 ms for 3 s.
* **fps** is how often the browser actually got a frame out. Headless Chromium has no GPU, so it
  rasterizes the canvas in software. That makes fps here a worst case for fill rate, and much
  lower than a real phone with a GPU canvas.

| CPU    | Screen              | work (ms) | fps (full 3×) | fps (lite 2×) |
|--------|---------------------|-----------|---------------|---------------|
| 1×     | Home                | 2.5       | 45            | 60            |
| 1×     | Restaurant          | 3.2       | 35            | 52            |
| 1×     | Run, tall tower     | 3.8       | 17            | 33            |
| 4×     | Home                | 15.2      | 11            | (lite on)     |
| 4×     | Restaurant          | 25.7      | 6             | (lite on)     |
| 4×     | Run, tall tower     | 19.7      | 3             | (lite on)     |
| 6×     | Restaurant          | 42.6      | 5             | (lite on)     |

At 4× and 6× the game switched itself to lite within a few seconds, as designed.

## Where the time goes

A CPU profile of the restaurant screen (the heaviest): about 82% is the browser's own canvas
drawing (shown as "program"), the game's JavaScript is under 3%, and of that most is
`measureText`/`fillText` (text fitting). In other words: **pixels, not logic**. The number of
pixels on the canvas is the lever that matters.

## What the game does

* **Lite effects** (automatic on slow phones, or Settings → Battery saver):
  * the canvas draws at most 2 pixels per point instead of 3, which is 44% of the pixels and
    roughly doubles fps when filling is the bottleneck;
  * 20 confetti pieces instead of 70;
  * the sky drops twinkling stars and clouds;
  * the restaurant drops drifting snow/petals and most kitchen steam.
* **30 fps menus**: screens where nothing is flying (no confetti, celebration, coin burst, list
  being dragged) draw every other frame. Runs, mini-games, the intro and results always get
  full frame rate.
* **Error-safe loop**: the next frame is scheduled before drawing, so a bug in one frame is
  logged (Settings → Diagnostics) instead of freezing the game.

## Checking on real phones

Open Settings → Diagnostics on the phone: "Frame work" should stay under 12 ms on the home
screen and during a run. Try it on the slowest phone you can find (a 2019 Android with 2–3 GB
RAM is a good floor). If lite switches on there, the game is behaving as intended; if work is
still above ~16 ms in lite, profile with Chrome remote debugging (`chrome://inspect`) and look at
text drawing first.

Ideas if more speed is ever needed: cache measured text widths in `fitText`, draw the static
parts of the restaurant scene into an offscreen canvas once per second.
