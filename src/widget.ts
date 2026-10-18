// Home-screen widget and Live Activity bridge. The game sends a small snapshot (restaurant, tip
// jar, calendar, level) to a native plugin called "SushiWidget". The plugin and the widget
// extensions live in native/ (see native/README.md): until they're added to the Xcode and
// Android Studio projects, every call here quietly does nothing.

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface WidgetSnapshot {
  restaurant: string;
  stars: number; // popularity 1-5
  tips: number; // coins in the jar now
  tipsMax: number; // when the jar is full
  jarFullAt: number; // ms timestamp
  calendarDay: number; // next calendar day 1-28
  calendarReady: boolean;
  level: number;
  chef: string;
}

interface SushiWidgetPlugin {
  update(data: WidgetSnapshot): Promise<void>;
  startActivity(data: { title: string; endsAt: number; detail: string }): Promise<void>;
  endActivity(): Promise<void>;
}

const plugin = registerPlugin<SushiWidgetPlugin>('SushiWidget');
const native = Capacitor.isNativePlatform();
let lastJson = '';

/** Sends the snapshot to the widget (only when something changed). */
export function updateWidget(s: WidgetSnapshot): void {
  if (!native) return;
  const json = JSON.stringify({ ...s, tips: Math.floor(s.tips / 10) * 10 });
  if (json === lastJson) return;
  lastJson = json;
  void plugin.update(s).catch(() => undefined);
}

/** iPhone Live Activity (lock screen / Dynamic Island): a countdown, e.g. until the tip jar is full. */
export function startLiveActivity(title: string, endsAt: number, detail: string): void {
  if (!native || Capacitor.getPlatform() !== 'ios') return;
  void plugin.startActivity({ title, endsAt, detail }).catch(() => undefined);
}

export function endLiveActivity(): void {
  if (!native || Capacitor.getPlatform() !== 'ios') return;
  void plugin.endActivity().catch(() => undefined);
}
