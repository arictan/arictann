import { Game } from './game';
import { initPlatform } from './platform';
import { initMonetization } from './monetize';
import { fontReady } from './font';
import { backupSave, installErrorLog, logError, migrateSave } from './safety';

// Before anything reads the save: upgrade it, back it up once a day, and log errors on the device.
installErrorLog();
migrateSave();
backupSave();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const safe = document.getElementById('safe') as HTMLElement;

// Wait for the bundled font so the first frame never flashes in a fallback face.
void fontReady().then(() => {
  const game = new Game(canvas, safe);
  initPlatform(() => game.pause());
  void initMonetization();

  let last = performance.now();
  let skip = false;
  let work = 8; // rolling average of update + render time, in ms
  let slowFor = 0;
  function frame(now: number): void {
    // Schedule the next frame first, so one bad frame can never freeze the game.
    requestAnimationFrame(frame);
    // Menus that aren't animating much draw at 30 fps to save battery.
    if (game.calm()) {
      skip = !skip;
      if (skip) return;
    }
    const dt = (now - last) / 1000;
    last = now;
    const t0 = performance.now();
    try {
      game.update(dt);
      game.render();
    } catch (e) {
      console.error(e);
      logError(e, 'frame');
    }
    // Adaptive quality: if frames stay slow for a few seconds, drop the extra effects.
    work = work * 0.95 + (performance.now() - t0) * 0.05;
    const step = Math.min(dt, 0.1); // after the app was in the background, dt can be minutes
    slowFor = work > 12 ? slowFor + step : Math.max(0, slowFor - step);
    if (slowFor > 3 && !game.lowPower) game.setLowPower(true);
    perf.work = work;
  }
  requestAnimationFrame(frame);
  const perf = { work: 0 };
  (window as unknown as { __perf: typeof perf }).__perf = perf;

  // Exposed in dev builds only, for automated playtesting.
  if (import.meta.env.DEV) {
    (window as unknown as { __game: Game }).__game = game;
    (window as unknown as { __qa: () => unknown }).__qa = () => game.qa();
  }
});
