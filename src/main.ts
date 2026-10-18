import { Game } from './game';
import { initPlatform } from './platform';
import { initMonetization } from './monetize';
import { fontReady } from './font';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const safe = document.getElementById('safe') as HTMLElement;

// Wait for the bundled font so the first frame never flashes in a fallback face.
void fontReady().then(() => {
  const game = new Game(canvas, safe);
  initPlatform(() => game.pause());
  void initMonetization();

  let last = performance.now();
  function frame(now: number): void {
    game.update((now - last) / 1000);
    game.render();
    last = now;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Exposed in dev builds only, for automated playtesting.
  if (import.meta.env.DEV) {
    (window as unknown as { __game: Game }).__game = game;
    (window as unknown as { __qa: () => unknown }).__qa = () => game.qa();
  }
});
