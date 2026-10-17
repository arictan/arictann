// Tiny synthesized sound effects: no audio files to license or ship.
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let muted = false;

export function unlockAudio(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
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

// Filtered noise burst: the "crunch" of a knife or a soft landing.
function hiss(dur: number, vol: number, freq: number, q = 1): void {
  if (!ctx || !noise || muted) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + dur);
}

// C major pentatonic, so rising combos always sound pleasant.
const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];

export const sfx = {
  drop: () => { hiss(0.08, 0.25, 400); tone(160, 0.08, 'sine', 0.2, 90); },
  slice: () => { hiss(0.12, 0.35, 3200, 0.8); tone(1800, 0.05, 'triangle', 0.05, 900); },
  perfect: (combo: number) => {
    tone(SCALE[Math.min(combo, SCALE.length - 1)], 0.18, 'sine', 0.2);
    hiss(0.05, 0.15, 5000, 2);
  },
  serve: () => [659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, undefined, i * 0.07)),
  die: () => { tone(220, 0.45, 'sawtooth', 0.12, 55); hiss(0.3, 0.2, 300); },
};
