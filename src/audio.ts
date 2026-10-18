// Tiny synthesized sound effects: no audio files to license or ship.
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
let musicOn = true;

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
  startMusic();
}

export function setMuted(value: boolean): void {
  muted = value;
  setMusic(musicOn);
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
  fever: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.12, 'square', 0.06, undefined, i * 0.05)),
  celebrate: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, undefined, i * 0.09)),
  coin: () => tone(1400, 0.06, 'square', 0.05, 2000),
  tap: () => tone(660, 0.04, 'sine', 0.06, 880),
  die: () => { tone(220, 0.45, 'sawtooth', 0.12, 55); hiss(0.3, 0.2, 300); },
};

// ------------------------------------------------------------------- music
// A small generative tune on a pentatonic scale: plucked melody, soft bass and a light shaker.
// Its tempo follows the player's combo, and Fever adds a sparkling arpeggio on top.

const MELODY = [392, 440, 523, 587, 659, 784, 880]; // G pentatonic-ish, koto-like
const BASS = [98, 110, 131, 147];
let musicTimer: number | null = null;
let nextBeat = 0;
let beat = 0;
let tempo = 92;
let fever = false;
let musicGain: GainNode | null = null;

export function setMusic(on: boolean): void {
  musicOn = on;
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(on && !muted ? 0.5 : 0, ctx.currentTime, 0.1);
}

/** Combo raises the tempo from 92 up to 132 bpm; Fever layers an arpeggio. */
export function setMusicIntensity(combo: number, inFever: boolean): void {
  tempo = 92 + Math.min(40, combo * 4);
  fever = inFever;
}

function pluck(freq: number, t: number, vol: number, dur = 0.35): void {
  if (!ctx || !musicGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(musicGain);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function shaker(t: number, vol: number): void {
  if (!ctx || !noise || !musicGain) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(f).connect(g).connect(musicGain);
  src.start(t);
  src.stop(t + 0.06);
}

function startMusic(): void {
  if (!ctx || musicTimer !== null) return;
  musicGain = ctx.createGain();
  musicGain.gain.value = musicOn && !muted ? 0.5 : 0;
  musicGain.connect(ctx.destination);
  nextBeat = ctx.currentTime + 0.1;
  // Schedule a little ahead of time so timing stays steady even if a frame is late.
  musicTimer = window.setInterval(() => {
    if (!ctx) return;
    while (nextBeat < ctx.currentTime + 0.25) {
      const step = 60 / tempo / 2; // eighth notes
      const bar = Math.floor(beat / 8);
      const pos = beat % 8;
      if (pos % 4 === 0) pluck(BASS[(bar + pos / 4) % BASS.length], nextBeat, 0.09, 0.5);
      // A simple repeating phrase that changes every two bars.
      const phrase = [0, 2, 4, 2, 5, 4, 2, 1];
      if (pos % 2 === 0 || Math.random() < 0.3) pluck(MELODY[(phrase[pos] + (bar % 2) * 2) % MELODY.length], nextBeat, 0.05);
      shaker(nextBeat, pos % 2 ? 0.015 : 0.03);
      if (fever) pluck(MELODY[(beat * 3) % MELODY.length] * 2, nextBeat + step / 2, 0.025, 0.15);
      nextBeat += step;
      beat++;
    }
  }, 60);
}
