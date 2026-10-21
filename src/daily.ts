// The Daily Roll: the same layers for everyone each day, one counted try, and a Wordle-style
// emoji grid to share. 🟩 PERFECT, 🟨 trimmed, 🟥 the drop that ended it.

const EPOCH = new Date(2026, 0, 1).getTime();

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Daily Roll #1 was 1 January 2026. */
export function dailyNumber(at = new Date()): number {
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
  return Math.round((day - EPOCH) / 86_400_000) + 1;
}

export function dailySeed(day: string): number {
  return hash(`daily-roll|${day}`) % 2 ** 31;
}

export const DAILY_LEVEL = 12; // weather and attacks are on, but it's fair for everyone

const MARK: Record<string, string> = { P: '🟩', C: '🟨', M: '🟥' };

/** The emoji grid: rows of ten, at most five rows, then "+N". */
export function dailyGrid(marks: string): string {
  const rows: string[] = [];
  for (let i = 0; i < Math.min(marks.length, 50); i += 10) rows.push([...marks.slice(i, i + 10)].map((c) => MARK[c] ?? '⬜').join(''));
  if (marks.length > 50) rows.push(`…+${marks.length - 50} more`);
  return rows.join('\n');
}

export function dailyShare(n: number, height: number, marks: string, streak: number, landmark: string): string {
  const perfects = [...marks].filter((c) => c === 'P').length;
  return `Sushi Stack Daily Roll #${n} 🍣 ${height} layers\n${dailyGrid(marks)}\n${perfects} PERFECT${landmark ? ` · ${landmark}` : ''}${streak > 1 ? ` · 🔥${streak}` : ''}`;
}

/** Spread of past Daily Roll heights, in buckets of 10, for the stats card. */
export function dailyBuckets(hist: number[]): number[] {
  const b = [0, 0, 0, 0, 0, 0];
  for (const h of hist) b[Math.min(5, Math.floor(h / 10))]++;
  return b;
}

// ------------------------------------------------------------------ short codes
// Case-insensitive base32 so codes survive phone keyboards that capitalise everything.

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function toB32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function fromB32(str: string): Uint8Array | null {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const v = B32.indexOf(ch);
    if (v < 0) return null;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

export function checkByte(bytes: Uint8Array): number {
  let h = 7;
  for (const b of bytes) h = (h * 31 + b) & 255;
  return h;
}

/** A run's song as a code: SONG-…, one byte per note (up to 120 notes). */
export function encodeSong(notes: number[]): string {
  const body = Uint8Array.from(notes.slice(0, 120).map((n) => n & 255));
  return `SONG-${toB32(Uint8Array.from([...body, checkByte(body)]))}`;
}

export function decodeSong(code: string): number[] | null {
  const bytes = fromB32(code.replace(/^SONG-/i, ''));
  if (!bytes || bytes.length < 2) return null;
  const body = bytes.slice(0, -1);
  return checkByte(body) === bytes[bytes.length - 1] ? [...body] : null;
}
