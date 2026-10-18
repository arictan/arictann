// One rounded display face for the whole game, bundled with the app so it works offline.
// Scripts Fredoka doesn't cover (Japanese, Korean, Hindi) fall back to the system font.
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';

export const FONT = '"Fredoka", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Resolves once the font can be drawn on canvas (or after a short timeout, so the game never waits long). */
export function fontReady(): Promise<void> {
  const load = Promise.all(['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 20px Fredoka`))).then(() => undefined);
  return Promise.race([load, new Promise<void>((r) => setTimeout(r, 1500))]);
}
