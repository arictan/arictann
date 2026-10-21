// Tiny synthesized sound effects: no audio files to license or ship.
import { FEEL } from './feel';
import type { Ingredient } from './shop';

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let master: GainNode | null = null; // everything plays through here, so it can also be recorded
let recorder: MediaStreamAudioDestinationNode | null = null;
let asmrOn = false;

/** The shared output: sound effects, music and voices all go through it. */
function out(): AudioNode {
  if (!master && ctx) {
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  return master ?? ctx!.destination;
}

/** An audio stream of the game's sound, for recording highlight videos. */
export function audioStream(): MediaStream | null {
  if (!ctx) return null;
  if (!recorder) {
    recorder = ctx.createMediaStreamDestination();
    out().connect(recorder);
  }
  return recorder.stream;
}
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
  osc.connect(gain).connect(out());
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
  src.connect(filter).connect(gain).connect(out());
  src.start(t);
  src.stop(t + dur);
}

/** Noise through any filter, with an optional delay (for little sequences of foley). */
function noiseHit(dur: number, vol: number, freq: number, q: number, type: BiquadFilterType, delay = 0): void {
  if (!ctx || !noise || muted) return;
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(out());
  src.start(t);
  src.stop(t + dur + 0.02);
}

// C major pentatonic, so rising combos always sound pleasant.
const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];

export const sfx = {
  drop: () => { if (asmrOn) return; hiss(0.08, 0.25, 400); tone(160, 0.08, 'sine', 0.2, 90); },
  slice: () => { if (asmrOn) return asmr.slice(); hiss(0.12, 0.35, 3200, 0.8); tone(1800, 0.05, 'triangle', 0.05, 900); },
  perfect: (combo: number) => {
    if (asmrOn) return asmr.perfect();
    tone(SCALE[Math.min(combo, SCALE.length - 1)], 0.18, 'sine', 0.2);
    hiss(0.05, 0.15, 5000, 2);
  },
  serve: () => [659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, undefined, i * 0.07)),
  fever: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.12, 'square', 0.06, undefined, i * 0.05)),
  celebrate: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, undefined, i * 0.09)),
  coin: () => tone(1400, 0.06, 'square', 0.05, 2000),
  tap: () => tone(660, 0.04, 'sine', 0.06, 880),
  die: () => { tone(220, 0.45, 'sawtooth', 0.12, 55); hiss(0.3, 0.2, 300); },
  // Intro sounds.
  whoosh: () => hiss(0.3, 0.22, 900, 0.6),
  shutter: () => { for (let i = 0; i < 7; i++) setTimeout(() => hiss(0.05, 0.16, 500 + i * 60, 2), i * 70); },
  light: (i: number) => tone(880 + i * 110, 0.12, 'sine', 0.08, undefined, 0),
  sting: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.5 - i * 0.05, 'triangle', 0.12, undefined, i * 0.06)),
  /** Each ingredient lands with its own sound: soft rice, crisp nori, a popping ikura… */
  land: (kind: Ingredient) => {
    if (asmrOn) return asmr.land(kind);
    const f = FEEL[kind];
    hiss(0.08, 0.22, f.hiss, f.q);
    tone(f.thud, 0.08, 'sine', 0.2, f.thud * 0.6);
    switch (f.extra) {
      case 'pop': [1400, 1700, 1250].forEach((p, i) => tone(p, 0.04, 'sine', 0.06, p * 1.4, 0.03 + i * 0.045)); break;
      case 'crisp': noiseHit(0.05, 0.12, 4200, 1.5, 'highpass', 0.02); break;
      case 'slide': tone(420, 0.18, 'triangle', 0.05, 200); break;
      case 'wobble': [0, 1, 2].forEach((i) => tone(180 + (i % 2) * 40, 0.06, 'sine', 0.07, undefined, i * 0.06)); break;
      case 'sizzle': noiseHit(0.35, 0.06, 5000, 0.6, 'highpass', 0.03); break;
      case 'squish': tone(260, 0.07, 'sine', 0.06, 140, 0.02); break;
    }
  },
  /** A PERFECT that also lands on the music's beat. */
  beat: () => { tone(1568, 0.12, 'triangle', 0.09); tone(2093, 0.18, 'sine', 0.06, undefined, 0.05); },
  /** The tall tower creaks when it sways too much. */
  creak: () => { if (asmrOn) return; tone(95, 0.5, 'sawtooth', 0.025, 70); noiseHit(0.4, 0.04, 300, 4, 'bandpass'); },
  combo: () => [659, 880, 1175].forEach((f, i) => tone(f, 0.14, 'sine', 0.1, undefined, i * 0.05)),
  landmark: () => [784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, undefined, i * 0.08)),
};

// ------------------------------------------------------------------- ASMR mode
// Close, soft kitchen foley instead of game sounds: rice patted into place, a knife's whisper.

export const asmr = {
  land: (kind: Ingredient) => {
    const f = FEEL[kind];
    noiseHit(0.09, 0.16, Math.min(900, f.hiss), 0.6, 'lowpass');
    noiseHit(0.07, 0.1, Math.min(900, f.hiss), 0.6, 'lowpass', 0.11);
    if (f.extra === 'crisp') noiseHit(0.06, 0.05, 6000, 0.8, 'highpass', 0.04);
  },
  slice: () => {
    if (!ctx || !noise || muted) return;
    // A knife drawn through: a rising whisper of filtered noise.
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.Q.value = 3;
    flt.frequency.setValueAtTime(2500, t);
    flt.frequency.exponentialRampToValueAtTime(7000, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    src.connect(flt).connect(g).connect(out());
    src.start(t);
    src.stop(t + 0.3);
  },
  perfect: () => tone(880, 0.09, 'sine', 0.05, 860),
};

export function setAsmr(on: boolean): void {
  asmrOn = on;
}

export function isAsmr(): boolean {
  return asmrOn;
}

// ------------------------------------------------------------------- music
// A small generative tune on a pentatonic scale: plucked melody, soft bass and a light shaker.
// Its tempo follows the player's combo, and Fever adds a sparkling arpeggio on top.

const MELODY = [392, 440, 523, 587, 659, 784, 880]; // G pentatonic-ish, koto-like
const BASS = [98, 110, 131, 147];

// Jukebox tracks: each changes the scale, instrument, tempo and percussion of the generated tune.
export type TrackId = 'classic' | 'lofi' | 'festival' | 'citypop' | 'winter';

interface Track { name: string; icon: string; melody: number[]; bass: number[]; tempo: number; wave: OscillatorType; shaker: number; drum: boolean; decay: number }

export const TRACKS: Record<TrackId, Track> = {
  classic: { name: 'Koto Classic', icon: '🎋', melody: MELODY, bass: BASS, tempo: 92, wave: 'triangle', shaker: 1, drum: false, decay: 0.35 },
  lofi: { name: 'Lo-fi Kitchen', icon: '🎧', melody: [262, 311, 349, 392, 466, 523, 622], bass: [65, 78, 87, 98], tempo: 72, wave: 'sine', shaker: 0.4, drum: false, decay: 0.6 },
  festival: { name: 'Taiko Festival', icon: '🥁', melody: [440, 494, 587, 659, 740, 880, 988], bass: [110, 123, 147, 165], tempo: 112, wave: 'square', shaker: 1.4, drum: true, decay: 0.2 },
  citypop: { name: 'City Pop Night', icon: '🌃', melody: [523, 659, 784, 988, 1047, 1319, 1568], bass: [131, 165, 175, 196], tempo: 100, wave: 'sine', shaker: 0.8, drum: true, decay: 0.45 },
  winter: { name: 'Winter Bells', icon: '🔔', melody: [784, 880, 1047, 1175, 1319, 1568, 1760], bass: [98, 131, 147, 196], tempo: 80, wave: 'sine', shaker: 0.3, drum: false, decay: 0.9 },
};

let track: Track = TRACKS.classic;

export function setTrack(id: TrackId): void {
  track = TRACKS[id] ?? TRACKS.classic;
}

// ------------------------------------------------------------------- voices
// Animal Crossing-style babble: a quick blip per syllable, pitched per character.

let voicesOn = true;

export function setVoices(on: boolean): void {
  voicesOn = on;
}

export function babble(text: string, pitch: number): void {
  if (!ctx || muted || !voicesOn) return;
  const syllables = Math.min(14, Math.max(2, Math.round(text.replace(/[^\p{L}]/gu, '').length / 2.5)));
  for (let i = 0; i < syllables; i++) {
    const f = pitch * (0.85 + Math.random() * 0.4) * (i === syllables - 1 && text.endsWith('?') ? 1.3 : 1);
    tone(f, 0.06, i % 2 ? 'square' : 'triangle', 0.035, f * (0.9 + Math.random() * 0.2), i * 0.065);
  }
}
let musicTimer: number | null = null;
const quarters: number[] = []; // times of recent and upcoming quarter-note beats
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
  tempo = track.tempo + Math.min(40, combo * 4);
  fever = inFever;
}

function pluck(freq: number, t: number, vol: number, dur = track.decay): void {
  if (!ctx || !musicGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = track.wave;
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

/** A soft taiko/kick drum hit. */
function kick(t: number): void {
  if (!ctx || !musicGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(g).connect(musicGain);
  osc.start(t);
  osc.stop(t + 0.22);
}

function startMusic(): void {
  if (!ctx || musicTimer !== null) return;
  musicGain = ctx.createGain();
  musicGain.gain.value = musicOn && !muted ? 0.5 : 0;
  musicGain.connect(out());
  nextBeat = ctx.currentTime + 0.1;
  // Schedule a little ahead of time so timing stays steady even if a frame is late.
  musicTimer = window.setInterval(() => {
    if (!ctx) return;
    while (nextBeat < ctx.currentTime + 0.25) {
      const step = 60 / tempo / 2; // eighth notes
      const bar = Math.floor(beat / 8);
      const pos = beat % 8;
      const { melody, bass } = track;
      if (pos % 2 === 0) {
        quarters.push(nextBeat);
        if (quarters.length > 8) quarters.shift();
      }
      if (pos % 4 === 0) pluck(bass[(bar + pos / 4) % bass.length], nextBeat, 0.09, 0.5);
      if (track.drum && pos % 4 === 0) kick(nextBeat);
      // A simple repeating phrase that changes every two bars.
      const phrase = [0, 2, 4, 2, 5, 4, 2, 1];
      if (pos % 2 === 0 || Math.random() < 0.3) pluck(melody[(phrase[pos] + (bar % 2) * 2) % melody.length], nextBeat, track.wave === 'square' ? 0.025 : 0.05);
      shaker(nextBeat, (pos % 2 ? 0.015 : 0.03) * track.shaker);
      if (fever) pluck(melody[(beat * 3) % melody.length] * 2, nextBeat + step / 2, 0.025, 0.15);
      nextBeat += step;
      beat++;
    }
  }, 60);
}

/** Seconds from the nearest quarter-note beat of the music (null when the music is off). */
export function beatOffset(): number | null {
  if (!ctx || !musicOn || muted || !quarters.length) return null;
  const now = ctx.currentTime;
  return Math.min(...quarters.map((q) => Math.abs(q - now)));
}

// ------------------------------------------------------------------- your run's song
// Every layer adds a note: the ingredient picks the note, a PERFECT adds a fifth, a beat adds sparkle.

export function songNote(n: number, perfect: boolean, beat: boolean, delay = 0): void {
  if (!ctx || muted) return;
  const scale = track.melody;
  const f = scale[n % scale.length] * (n % 14 >= 7 ? 2 : 1);
  tone(f, 0.22, 'triangle', 0.05, undefined, delay);
  if (perfect) tone(f * 1.5, 0.18, 'sine', 0.03, undefined, delay + 0.01);
  if (beat) tone(f * 2, 0.12, 'sine', 0.025, undefined, delay + 0.03);
}

let songTimer = 0;

/** Plays a recorded run back as a little tune. Returns its length in seconds. */
export function playSong(notes: number[], onDone?: () => void): number {
  stopSong();
  const step = 0.16;
  notes.slice(0, 400).forEach((v, i) => songNote(v >> 2, (v & 2) > 0, (v & 1) > 0, i * step));
  const len = Math.min(400, notes.length) * step;
  songTimer = window.setTimeout(() => onDone?.(), len * 1000 + 300);
  return len;
}

export function stopSong(): void {
  window.clearTimeout(songTimer);
}

// ------------------------------------------------------------------- audio-only guidance
// For blind players: a steady tone panned to where the sliding layer is, rising in pitch as it
// lines up with the stack, with a click on entering the PERFECT zone.

let cueOsc: OscillatorNode | null = null;
let cueGain: GainNode | null = null;
let cuePan: StereoPannerNode | null = null;

export const cue = {
  start(): void {
    if (!ctx || cueOsc) return;
    cueOsc = ctx.createOscillator();
    cueOsc.type = 'triangle';
    cueGain = ctx.createGain();
    cueGain.gain.value = 0;
    cuePan = ctx.createStereoPanner();
    cueOsc.connect(cueGain).connect(cuePan).connect(out());
    cueOsc.start();
  },
  /** pan -1..1 (left..right of the stack), near 0..1 (1 = lined up). */
  update(pan: number, near: number, active: boolean): void {
    if (!ctx || !cueOsc || !cueGain || !cuePan) return;
    const t = ctx.currentTime;
    cuePan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.03);
    cueOsc.frequency.setTargetAtTime(220 + near * near * 660, t, 0.03);
    cueGain.gain.setTargetAtTime(active && !muted ? 0.05 + near * 0.05 : 0, t, 0.05);
  },
  zone(): void {
    tone(1760, 0.03, 'square', 0.05);
  },
  warn(): void {
    [0, 0.12, 0.24].forEach((d) => tone(330, 0.08, 'square', 0.06, undefined, d));
  },
  stop(): void {
    if (!cueOsc) return;
    try { cueOsc.stop(); } catch { /* already stopped */ }
    cueOsc.disconnect();
    cueOsc = null;
    cueGain = null;
    cuePan = null;
  },
};
