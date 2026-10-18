// Share cards and challenge codes. A code like "K3F9Q-12-47" holds a run seed, the starting level
// and a score: a friend who enters it gets the same chefs, recipes and chef events, and sees the
// score to beat as a line on their stack.

import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';

export interface Challenge { seed: number; level: number; score: number }

export function encodeChallenge(c: Challenge): string {
  return `${c.seed.toString(36).toUpperCase()}-${c.level}-${c.score}`;
}

export function decodeChallenge(code: string): Challenge | null {
  const m = code.trim().toUpperCase().match(/^([0-9A-Z]{1,8})-(\d{1,5})-(\d{1,5})$/);
  if (!m) return null;
  const seed = parseInt(m[1], 36);
  const level = Number(m[2]);
  const score = Number(m[3]);
  if (!Number.isFinite(seed) || level < 1) return null;
  return { seed, level, score };
}

/** Shares the card image and code. Returns false when the device has no share sheet. */
export async function shareCard(card: HTMLCanvasElement, code: string, score: number): Promise<boolean> {
  const text = `I stacked ${score} layers in Sushi Stack! Beat me with challenge code ${code}`;
  const dataUrl = card.toDataURL('image/png');
  if (Capacitor.isNativePlatform()) {
    try {
      const file = await Filesystem.writeFile({ path: `sushi-stack-${Date.now()}.png`, data: dataUrl.split(',')[1], directory: Directory.Cache });
      await Share.share({ title: 'Sushi Stack', text, files: [file.uri], dialogTitle: 'Share your score' });
      return true;
    } catch {
      return false;
    }
  }
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const f = new File([blob], 'sushi-stack.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [f] })) {
      await navigator.share({ files: [f], text, title: 'Sushi Stack' });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ text, title: 'Sushi Stack' });
      return true;
    }
  } catch { /* cancelled or blocked */ }
  return false;
}
