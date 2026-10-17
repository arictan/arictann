// Tiny synthesized sound effects: no audio files to license or ship.
let ctx: AudioContext | null = null;
let muted = false;

export function unlockAudio(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

export function setMuted(value: boolean): void {
  muted = value;
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0): void {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  launch: () => tone(320, 0.12, 'triangle', 0.18, 640),
  land: (combo: number) => tone(440 * Math.pow(1.06, Math.min(combo, 12)), 0.1, 'sine', 0.22),
  perfect: () => { tone(880, 0.08, 'sine', 0.15); tone(1320, 0.12, 'sine', 0.15, undefined, 0.06); },
  coin: () => tone(1200, 0.08, 'square', 0.07, 1800),
  die: () => tone(260, 0.5, 'sawtooth', 0.15, 40),
};
