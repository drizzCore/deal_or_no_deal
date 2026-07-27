import { encodeWav, SAMPLE_RATE } from "./wav";

/**
 * Placeholder cues, synthesised from oscillator maths at boot.
 *
 * Nothing here is sourced from the television show. To replace a cue with a
 * real royalty-free file, change its `src` in the cue table — see ADR 0003.
 */

type Wave = "sine" | "triangle" | "square" | "saw" | "noise";
/** bell rises and falls; decay is percussive; flat holds for looping beds. */
type Envelope = "bell" | "decay" | "flat";

interface Voice {
  readonly from: number;
  /** Sweeps to this frequency across the voice. Defaults to `from`. */
  readonly to?: number;
  readonly gain?: number;
  readonly wave?: Wave;
  /** Seconds from the start of the cue. */
  readonly at?: number;
  readonly length: number;
  readonly env?: Envelope;
}

function shape(wave: Wave, phase: number): number {
  switch (wave) {
    case "sine":
      return Math.sin(phase);
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    case "square":
      return Math.sin(phase) >= 0 ? 1 : -1;
    case "saw":
      return 1 - (phase % (2 * Math.PI)) / Math.PI;
    case "noise":
      return Math.random() * 2 - 1;
  }
}

function amplitude(env: Envelope, progress: number): number {
  switch (env) {
    case "bell":
      return Math.sin(Math.PI * progress);
    case "decay":
      return Math.exp(-5 * progress);
    case "flat":
      // Eased at both ends so a looping bed does not click at the seam.
      return Math.min(1, Math.min(progress, 1 - progress) * 12);
  }
}

function mix(seconds: number, voices: readonly Voice[]): Float32Array {
  const out = new Float32Array(Math.round(seconds * SAMPLE_RATE));

  for (const voice of voices) {
    const start = Math.round((voice.at ?? 0) * SAMPLE_RATE);
    const length = Math.round(voice.length * SAMPLE_RATE);
    const gain = voice.gain ?? 0.3;
    const wave = voice.wave ?? "sine";
    const env = voice.env ?? "bell";
    const to = voice.to ?? voice.from;
    let phase = 0;

    for (let i = 0; i < length; i++) {
      const index = start + i;
      if (index >= out.length) break;
      const progress = i / length;
      const frequency = voice.from + (to - voice.from) * progress;
      phase += (2 * Math.PI * frequency) / SAMPLE_RATE;
      out[index] += shape(wave, phase) * gain * amplitude(env, progress);
    }
  }

  // Soft clip rather than letting stacked voices distort.
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i]);
  return out;
}

const cue = (seconds: number, voices: readonly Voice[]) =>
  encodeWav(mix(seconds, voices));

/** The wooden knock of a lid coming up. */
export const caseOpen = () =>
  cue(0.35, [
    { from: 180, to: 90, length: 0.12, gain: 0.5, wave: "triangle", env: "decay" },
    { from: 2400, length: 0.05, gain: 0.18, wave: "noise", env: "decay" },
    { from: 320, to: 260, length: 0.3, gain: 0.15, at: 0.05, env: "decay" },
  ]);

/** A bed that loops under the countdown beat, climbing without resolving. */
export const tension = () =>
  cue(2, [
    { from: 110, to: 138, length: 2, gain: 0.22, wave: "saw", env: "flat" },
    { from: 220, to: 277, length: 2, gain: 0.12, wave: "triangle", env: "flat" },
    { from: 55, length: 2, gain: 0.18, wave: "sine", env: "flat" },
  ]);

/** Relief. A bright major arpeggio. */
export const lowReveal = () =>
  cue(0.7, [
    { from: 523, length: 0.18, gain: 0.3 },
    { from: 659, length: 0.18, gain: 0.3, at: 0.1 },
    { from: 784, length: 0.3, gain: 0.32, at: 0.2 },
    { from: 1047, length: 0.35, gain: 0.22, at: 0.3 },
  ]);

/** Dread. Low, dissonant, falling. */
export const highReveal = () =>
  cue(1.4, [
    { from: 146, to: 110, length: 1.2, gain: 0.4, wave: "saw" },
    { from: 155, to: 116, length: 1.2, gain: 0.3, wave: "saw" },
    { from: 73, to: 55, length: 1.4, gain: 0.35, wave: "triangle" },
    { from: 900, to: 300, length: 0.25, gain: 0.12, wave: "noise", env: "decay" },
  ]);

/** The Bank calling. A double ring. */
export const offerArrives = () =>
  cue(1.1, [
    { from: 480, length: 0.22, gain: 0.28, wave: "square" },
    { from: 600, length: 0.22, gain: 0.22, wave: "square" },
    { from: 480, length: 0.22, gain: 0.28, wave: "square", at: 0.35 },
    { from: 600, length: 0.22, gain: 0.22, wave: "square", at: 0.35 },
    { from: 120, length: 0.7, gain: 0.16, wave: "sine", at: 0.2 },
  ]);

/** Deal. A resolved major chord, settled and final. */
export const dealAccepted = () =>
  cue(1.6, [
    { from: 262, length: 1.5, gain: 0.28 },
    { from: 330, length: 1.5, gain: 0.24 },
    { from: 392, length: 1.5, gain: 0.24 },
    { from: 523, length: 1.2, gain: 0.18, at: 0.15 },
  ]);

/** No deal. A flat, declarative hit. */
export const noDeal = () =>
  cue(0.6, [
    { from: 196, length: 0.4, gain: 0.4, wave: "saw", env: "decay" },
    { from: 98, length: 0.5, gain: 0.3, wave: "triangle", env: "decay" },
  ]);

/** Keep or swap. Suspended and unresolved on purpose. */
export const swapDecision = () =>
  cue(1.3, [
    { from: 294, length: 1.2, gain: 0.26, wave: "triangle" },
    { from: 415, length: 1.2, gain: 0.24, wave: "triangle" },
    { from: 147, length: 1.3, gain: 0.2 },
  ]);

/** The final reveal. An ascending run that lands. */
export const fanfare = () =>
  cue(1.8, [
    { from: 392, length: 0.2, gain: 0.3 },
    { from: 523, length: 0.2, gain: 0.3, at: 0.14 },
    { from: 659, length: 0.2, gain: 0.3, at: 0.28 },
    { from: 784, length: 1.1, gain: 0.34, at: 0.42 },
    { from: 1047, length: 1.0, gain: 0.24, at: 0.5 },
    { from: 262, length: 1.2, gain: 0.2, at: 0.42 },
  ]);

/** A tick for ordinary buttons. */
export const uiClick = () =>
  cue(0.08, [
    { from: 1200, length: 0.04, gain: 0.16, wave: "triangle", env: "decay" },
  ]);
