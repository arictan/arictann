import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

const native = Capacitor.isNativePlatform();

export const haptic = {
  light: () => { if (native) void Haptics.impact({ style: ImpactStyle.Light }); },
  medium: () => { if (native) void Haptics.impact({ style: ImpactStyle.Medium }); },
  error: () => {
    if (native) void Haptics.notification({ type: NotificationType.Error });
    else navigator.vibrate?.(80);
  },
};

export function initPlatform(onPause: () => void): void {
  document.addEventListener('visibilitychange', () => { if (document.hidden) onPause(); });
  if (!native) return;
  void StatusBar.hide().catch(() => {});
  void App.addListener('pause', onPause);
  // Android hardware back button: leave the app instead of doing nothing.
  void App.addListener('backButton', () => void App.exitApp());
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
  best: () => Number(store.get('orbit-hop.best') ?? 0),
  setBest: (v: number) => store.set('orbit-hop.best', String(v)),
  coins: () => Number(store.get('orbit-hop.coins') ?? 0),
  setCoins: (v: number) => store.set('orbit-hop.coins', String(v)),
  muted: () => store.get('orbit-hop.muted') === '1',
  setMuted: (v: boolean) => store.set('orbit-hop.muted', v ? '1' : '0'),
};
