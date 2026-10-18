// Player settings: accessibility, feel and language. Saved on the device.

import { save } from './platform';

export type Lang = 'en' | 'ja' | 'ko' | 'es' | 'pt' | 'hi' | 'tr';

export interface Settings {
  haptics: boolean;
  reducedMotion: boolean; // no screen shake, flashes or confetti
  colorblind: boolean; // a symbol on every ingredient, not just colour
  assist: boolean; // slower layers and a bigger PERFECT zone
  clips: boolean; // keep the last seconds of a run as a shareable video
  voices: boolean; // chef babble voices
  leftHanded: boolean; // mirror the corner buttons and result buttons
  hapticAssist: boolean; // a tick on the phone when the layer is lined up
  track: string; // jukebox track
  lang: Lang;
}

function defaultLang(): Lang {
  const l = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return (['ja', 'ko', 'es', 'pt', 'hi', 'tr'] as const).find((x) => x === l) ?? 'en';
}

export const settings: Settings = {
  haptics: true,
  reducedMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  colorblind: false,
  assist: false,
  clips: false,
  voices: true,
  leftHanded: false,
  hapticAssist: false,
  track: 'classic',
  lang: defaultLang(),
  ...save.json('settings', {}),
};

export function saveSettings(): void {
  save.setJson('settings', settings);
}
