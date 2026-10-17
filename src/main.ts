import { Game } from './game';
import { initPlatform } from './platform';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const safe = document.getElementById('safe') as HTMLElement;
const game = new Game(canvas, safe);
initPlatform(() => game.pause());

let last = performance.now();
function frame(now: number): void {
  game.update((now - last) / 1000);
  game.render();
  last = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Exposed in dev builds only, for automated playtesting.
if (import.meta.env.DEV) (window as unknown as { __game: Game }).__game = game;
