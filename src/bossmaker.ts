// Build your own boss chef: their look, name, catchphrase, attacks and rules, shared as a short
// code (B-…). Friends who enter the code fight your chef.

import { FACES, HAIRS, HAIR_COLORS, HATS, OUTFITS, SKINS, type Attack, type Chef } from './chef';
import { checkByte, fromB32, toB32 } from './daily';

export const ALL_ATTACKS: { id: Attack; name: string; icon: string }[] = [
  { id: 'slam', name: 'Counter slam', icon: '👊' },
  { id: 'knife', name: 'Flying knife', icon: '🔪' },
  { id: 'splat', name: 'Soy splash', icon: '💦' },
  { id: 'flurry', name: 'Knife flurry', icon: '🗡️' },
  { id: 'steal', name: 'Bite', icon: '😋' },
  { id: 'flip', name: 'Speed flip', icon: '🔄' },
  { id: 'frost', name: 'Freezer blast', icon: '🥶' },
];

export const PHRASES = [
  { intro: 'My kitchen, my rules!', beaten: 'Fine. You win this round.', gloat: 'Back to rice school!' },
  { intro: 'Stack it if you dare!', beaten: 'Impossible… delicious!', gloat: 'Wobbly, wobbly!' },
  { intro: 'I’ve never lost a roll!', beaten: 'My first loss… I’ll remember it.', gloat: 'Too easy!' },
  { intro: 'Feel the heat!', beaten: 'You handled the heat.', gloat: 'Burnt!' },
  { intro: 'Grandma sent you? Ha!', beaten: 'Tell Grandma I said hi.', gloat: 'Grandma would cry!' },
  { intro: 'Bow before the knife!', beaten: 'I bow to you.', gloat: 'Kneel!' },
  { intro: 'Let’s make it spicy!', beaten: 'Spicy indeed!', gloat: 'Too mild!' },
  { intro: 'Ready, set, stack!', beaten: 'GG, chef!', gloat: 'Rematch any time!' },
];

export const SPEEDS = [{ name: 'Gentle', v: 0.9 }, { name: 'Brisk', v: 1.1 }, { name: 'Fast', v: 1.35 }, { name: 'Blazing', v: 1.6 }];

export interface BossDesign {
  name: string;
  skin: number; hair: number; hairColor: number; hat: number; outfit: number; face: number;
  speed: number; wobble: boolean; tight: boolean; extra: number;
  attacks: Attack[];
  phrase: number;
  mean: number; // 0-2: how often they attack
}

export const DEFAULT_BOSS: BossDesign = { name: 'Chef Me', skin: 0, hair: 0, hairColor: 0, hat: 0, outfit: 0, face: 0, speed: 1, wobble: false, tight: false, extra: 1, attacks: ['slam', 'knife'], phrase: 0, mean: 1 };

export const LOOK_SIZES = { skin: SKINS.length, hair: HAIRS.length, hairColor: HAIR_COLORS.length, hat: HATS.length, outfit: OUTFITS.length, face: FACES.length };

/** The design as a playable chef. */
export function bossChef(b: BossDesign): Chef {
  const sp = SPEEDS[b.speed] ?? SPEEDS[1];
  const ph = PHRASES[b.phrase] ?? PHRASES[0];
  const [outfit, accent] = OUTFITS[b.outfit % OUTFITS.length];
  const rule = [sp.name, b.wobble && 'surges', b.tight && 'small PERFECT zone', b.extra && `+${b.extra} layer${b.extra === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
  return {
    name: b.name, rule: `CUSTOM BOSS: ${rule}`, speed: sp.v, wobble: b.wobble, tight: b.tight, extra: b.extra,
    kind: 0.15, mean: [0.12, 0.25, 0.4][b.mean] ?? 0.25, attacks: b.attacks.length ? b.attacks : ['slam'],
    skin: SKINS[b.skin % SKINS.length], hairColor: HAIR_COLORS[b.hairColor % HAIR_COLORS.length], outfit, accent,
    hair: HAIRS[b.hair % HAIRS.length], hat: HATS[b.hat % HATS.length], face: FACES[b.face % FACES.length],
    intro: ph.intro, beaten: ph.beaten, gloat: ph.gloat,
  };
}

export function encodeBoss(b: BossDesign): string {
  const name = new TextEncoder().encode(b.name.slice(0, 14));
  const mask = ALL_ATTACKS.reduce((m, a, i) => m | (b.attacks.includes(a.id) ? 1 << i : 0), 0);
  const body = Uint8Array.from([1, b.skin, b.hair, b.hairColor, b.hat, b.outfit, b.face, b.speed, (b.wobble ? 1 : 0) | (b.tight ? 2 : 0) | (b.mean << 2), b.extra, mask, b.phrase, name.length, ...name]);
  return `B-${toB32(Uint8Array.from([...body, checkByte(body)]))}`;
}

export function decodeBoss(code: string): BossDesign | null {
  const bytes = fromB32(code.trim().replace(/^B-/i, ''));
  if (!bytes || bytes.length < 14) return null;
  const body = bytes.slice(0, -1);
  if (checkByte(body) !== bytes[bytes.length - 1] || body[0] !== 1) return null;
  const n = body[12];
  if (body.length < 13 + n) return null;
  let name: string;
  try {
    name = new TextDecoder('utf-8', { fatal: true }).decode(body.slice(13, 13 + n)).trim();
  } catch {
    return null;
  }
  const clamp = (v: number, size: number) => Math.min(size - 1, v);
  return {
    name: name || 'Mystery Chef',
    skin: clamp(body[1], LOOK_SIZES.skin), hair: clamp(body[2], LOOK_SIZES.hair), hairColor: clamp(body[3], LOOK_SIZES.hairColor),
    hat: clamp(body[4], LOOK_SIZES.hat), outfit: clamp(body[5], LOOK_SIZES.outfit), face: clamp(body[6], LOOK_SIZES.face),
    speed: clamp(body[7], SPEEDS.length), wobble: (body[8] & 1) > 0, tight: (body[8] & 2) > 0, mean: Math.min(2, body[8] >> 2),
    extra: Math.min(4, body[9]), attacks: ALL_ATTACKS.filter((_, i) => body[10] & (1 << i)).map((a) => a.id), phrase: clamp(body[11], PHRASES.length),
  };
}
