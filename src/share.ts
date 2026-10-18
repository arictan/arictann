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

/**
 * Ghost codes add the shape of the run (each layer's left edge and width, 2 bytes per layer, up to
 * 80 layers), so a friend races your exact stack: "G-K3F9Q-12-47.<data>".
 */
export function encodeGhost(c: Challenge, shape: [number, number][]): string {
  const bytes = new Uint8Array(Math.min(80, shape.length) * 2);
  shape.slice(0, 80).forEach(([x, w], i) => {
    bytes[i * 2] = Math.max(0, Math.min(255, Math.round((x + 60) / 2)));
    bytes[i * 2 + 1] = Math.max(0, Math.min(255, Math.round(w / 2)));
  });
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `G-${encodeChallenge(c)}.${btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

export function decodeGhost(code: string): { challenge: Challenge; shape: [number, number][] } | null {
  const m = code.trim().match(/^G-([0-9A-Za-z]{1,8}-\d{1,5}-\d{1,5})\.([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  const challenge = decodeChallenge(m[1]);
  if (!challenge) return null;
  try {
    const bin = atob(m[2].replace(/-/g, '+').replace(/_/g, '/'));
    const shape: [number, number][] = [];
    for (let i = 0; i + 1 < bin.length; i += 2) shape.push([bin.charCodeAt(i) * 2 - 60, bin.charCodeAt(i + 1) * 2]);
    return { challenge, shape };
  } catch {
    return null;
  }
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

/** Shares a highlight clip; on the web without a share sheet it downloads the file instead. */
export async function shareClip(file: File, score: number): Promise<void> {
  const text = `My Sushi Stack run: ${score} layers!`;
  if (Capacitor.isNativePlatform()) {
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      const saved = await Filesystem.writeFile({ path: file.name, data: btoa(bin), directory: Directory.Cache });
      await Share.share({ title: 'Sushi Stack', text, files: [saved.uri], dialogTitle: 'Share your clip' });
    } catch { /* cancelled */ }
    return;
  }
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: 'Sushi Stack' });
      return;
    }
  } catch { return; /* cancelled */ }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
