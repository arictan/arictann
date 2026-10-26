import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import type { Haptic } from './feel';
import { recoverEntry } from './safety';
import { LocalNotifications } from '@capacitor/local-notifications';

const native = Capacitor.isNativePlatform();

let hapticsOn = true;

/** Haptics can be switched off in Settings. */
export function setHaptics(on: boolean): void {
  hapticsOn = on;
}

export const haptic = {
  light: () => { if (native && hapticsOn) void Haptics.impact({ style: ImpactStyle.Light }); },
  medium: () => { if (native && hapticsOn) void Haptics.impact({ style: ImpactStyle.Medium }); },
  success: () => { if (native && hapticsOn) void Haptics.notification({ type: NotificationType.Success }); },
  error: () => {
    if (!hapticsOn) return;
    if (native) void Haptics.notification({ type: NotificationType.Error });
    else navigator.vibrate?.(80);
  },
};

/**
 * A touch pattern for each kind of ingredient: soft rice, a crisp nori tick, ikura popping three
 * times, slippery eel... Phones use Core Haptics / the vibrator; Android browsers get a short pattern.
 */
export function hapticFeel(kind: Haptic): void {
  if (!hapticsOn) return;
  const table: Record<Haptic, [ImpactStyle | 'tick', number][]> = {
    soft: [[ImpactStyle.Light, 0]],
    firm: [[ImpactStyle.Heavy, 0]],
    crisp: [['tick', 0], ['tick', 35]],
    pop: [[ImpactStyle.Light, 0], [ImpactStyle.Light, 45], [ImpactStyle.Light, 90]],
    slide: [[ImpactStyle.Medium, 0], [ImpactStyle.Light, 70]],
    wobble: [[ImpactStyle.Light, 0], [ImpactStyle.Light, 80], [ImpactStyle.Light, 160]],
    crunch: [[ImpactStyle.Medium, 0], ['tick', 30], ['tick', 60]],
    squish: [[ImpactStyle.Medium, 0]],
  };
  const seq = table[kind];
  if (!native) {
    // Android browsers: a vibration pattern of the same rhythm.
    const pat: number[] = [];
    let at = 0;
    for (const [style, t] of seq) {
      if (pat.length) pat.push(Math.max(10, t - at));
      pat.push(style === ImpactStyle.Heavy ? 28 : style === 'tick' ? 6 : 12);
      at = t;
    }
    navigator.vibrate?.(pat);
    return;
  }
  for (const [style, t] of seq) {
    window.setTimeout(() => {
      // A "tick" is the lightest, shortest tap.
      void Haptics.impact({ style: style === 'tick' ? ImpactStyle.Light : style });
    }, t);
  }
}

export function initPlatform(onPause: () => void): void {
  document.addEventListener('visibilitychange', () => { if (document.hidden) onPause(); });
  if (!native) return;
  void StatusBar.hide().catch(() => {});
  void App.addListener('pause', onPause);
  // Android hardware back button: leave the app instead of doing nothing.
  void App.addListener('backButton', () => void App.exitApp());
}

const REMINDER_ID = 1;

/**
 * Asks once for permission to send reminders. Called at a natural moment (after claiming the first
 * daily gift), never at launch.
 */
export async function askForReminders(): Promise<void> {
  if (!native) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'prompt' || display === 'prompt-with-rationale') await LocalNotifications.requestPermissions();
  } catch { /* plugin unavailable */ }
}

/**
 * Schedules a single reminder for tomorrow evening, replacing any earlier one, so a player gets
 * at most one notification a day.
 */
export async function scheduleReminder(title: string, body: string): Promise<void> {
  if (!native) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return;
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    const at = new Date();
    at.setDate(at.getDate() + 1);
    at.setHours(18, 30, 0, 0);
    await LocalNotifications.schedule({ notifications: [{ id: REMINDER_ID, title, body, schedule: { at } }] });
  } catch { /* plugin unavailable */ }
}

/** Schedules a one-off local notification (replacing any earlier one with the same id). */
export async function scheduleAt(id: number, title: string, body: string, at: Date): Promise<void> {
  if (!native || at.getTime() <= Date.now()) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return;
    await LocalNotifications.cancel({ notifications: [{ id }] });
    await LocalNotifications.schedule({ notifications: [{ id, title, body, schedule: { at } }] });
  } catch { /* plugin unavailable */ }
}

const store = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
};

export const save = {
  json: <T,>(key: string, fallback: T): T => {
    const v = store.get(`sushi-stack.${key}`);
    if (v === null) return fallback;
    try {
      return JSON.parse(v) as T;
    } catch {
      // A damaged entry comes back from the daily backup when it can.
      const r = recoverEntry(key);
      if (r === null) return fallback;
      store.set(`sushi-stack.${key}`, r);
      return JSON.parse(r) as T;
    }
  },
  setJson: (key: string, value: unknown) => store.set(`sushi-stack.${key}`, JSON.stringify(value)),
  best: () => Number(store.get('sushi-stack.best') ?? 0),
  setBest: (v: number) => store.set('sushi-stack.best', String(v)),
  coins: () => Number(store.get('sushi-stack.coins') ?? 0),
  setCoins: (v: number) => store.set('sushi-stack.coins', String(v)),
  muted: () => store.get('sushi-stack.muted') === '1',
  setMuted: (v: boolean) => store.set('sushi-stack.muted', v ? '1' : '0'),
  boosters: (): Record<string, number> => {
    try { return JSON.parse(store.get('sushi-stack.boosters') ?? '{}') as Record<string, number>; } catch { return {}; }
  },
  setBoosters: (v: Record<string, number>) => store.set('sushi-stack.boosters', JSON.stringify(v)),
  // Cosmetics: which items of each category are owned and which one is in use.
  // Plates keep their original keys so earlier purchases carry over.
  owned: (cat: string, free: string): string[] => {
    const key = cat === 'plate' ? 'sushi-stack.plates' : `sushi-stack.owned-${cat}`;
    try { return JSON.parse(store.get(key) ?? JSON.stringify([free])) as string[]; } catch { return [free]; }
  },
  setOwned: (cat: string, ids: string[]) => store.set(cat === 'plate' ? 'sushi-stack.plates' : `sushi-stack.owned-${cat}`, JSON.stringify(ids)),
  equipped: (cat: string, free: string) => store.get(cat === 'plate' ? 'sushi-stack.plate' : `sushi-stack.equip-${cat}`) ?? free,
  setEquipped: (cat: string, id: string) => store.set(cat === 'plate' ? 'sushi-stack.plate' : `sushi-stack.equip-${cat}`, id),
  giftDay: () => store.get('sushi-stack.giftDay') ?? '',
  giftStreak: () => Number(store.get('sushi-stack.giftStreak') ?? 0),
  setGift: (day: string, streak: number) => {
    store.set('sushi-stack.giftDay', day);
    store.set('sushi-stack.giftStreak', String(streak));
  },
};
