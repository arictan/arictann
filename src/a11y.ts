// Screen-reader support for a canvas game: a hidden live region that announces what happens
// (level start, PERFECTs, orders served, results, screen changes), and a hidden list of real
// <button>s that mirrors the buttons on the current screen, so VoiceOver / TalkBack users can
// find and activate them. Gameplay itself is still a tap anywhere on the screen.

let live: HTMLElement | null = null;
let list: HTMLElement | null = null;
let lastKey = '';
let lastSaid = '';
let lastAt = 0;

const HIDDEN = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';

function ensure(): void {
  if (live) return;
  live = document.createElement('div');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('role', 'status');
  live.style.cssText = HIDDEN;
  list = document.createElement('div');
  list.setAttribute('role', 'toolbar');
  list.setAttribute('aria-label', 'Game buttons');
  list.style.cssText = HIDDEN;
  document.body.append(live, list);
}

/** Says something to screen readers (repeats within a second are dropped). */
export function announce(text: string): void {
  ensure();
  const now = performance.now();
  if (text === lastSaid && now - lastAt < 1000) return;
  lastSaid = text;
  lastAt = now;
  live!.textContent = '';
  // A fresh text node each time so the same phrase is read again.
  setTimeout(() => { if (live) live.textContent = text; }, 30);
}

/** Mirrors the labelled buttons on screen as real, focusable buttons. */
export function mirrorButtons(labels: string[], press: (label: string) => void): void {
  ensure();
  const key = labels.join('|');
  if (key === lastKey) return;
  lastKey = key;
  list!.replaceChildren(...labels.map((l) => {
    const b = document.createElement('button');
    b.textContent = l;
    b.tabIndex = 0;
    b.addEventListener('click', () => press(l));
    return b;
  }));
}
