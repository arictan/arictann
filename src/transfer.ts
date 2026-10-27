// Save transfer: the whole save packed into one code that can be copied to another device.
// It stands in for cloud save until Game Center / Google Play Games saved games (or a backend
// with accounts) are set up.

import { freezeSaves } from './safety';

const PREFIX = 'sushi-stack.';
const SKIP = new Set(['sushi-stack.analytics']);
// This device's own backups and error log (keys starting with "~") never travel in a save code.
const local = (k: string): boolean => SKIP.has(k) || k.startsWith(`${PREFIX}~`);

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(str: string): Uint8Array {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

function checksum(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36).slice(0, 4).toUpperCase();
}

/** Packs every saved value into a code like "SS1.<data>.<check>". */
export async function exportSave(): Promise<string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(PREFIX) && !local(k)) data[k.slice(PREFIX.length)] = localStorage.getItem(k)!;
  }
  let bytes: Uint8Array = new TextEncoder().encode(JSON.stringify(data));
  let tag = 'SS0';
  if (typeof CompressionStream === 'function') {
    bytes = await pipe(bytes, new CompressionStream('deflate-raw'));
    tag = 'SS1';
  }
  const body = toB64(bytes);
  return `${tag}.${body}.${checksum(body)}`;
}

/** Restores a save from a code. Returns false if the code is damaged; the current save is kept then. */
export async function importSave(code: string): Promise<boolean> {
  try {
    const [tag, body, check] = code.trim().split('.');
    if (!body || checksum(body) !== check || (tag !== 'SS0' && tag !== 'SS1')) return false;
    let bytes: Uint8Array = fromB64(body);
    if (tag === 'SS1') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, string>;
    if (typeof data !== 'object' || !data) return false;
    freezeSaves();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)!;
      if (k.startsWith(PREFIX) && !local(k)) localStorage.removeItem(k);
    }
    // Codes made before 1.1.0 may still carry another device's backups: skip them.
    for (const [k, v] of Object.entries(data)) if (!local(PREFIX + k)) localStorage.setItem(PREFIX + k, v);
    return true;
  } catch {
    return false;
  }
}
