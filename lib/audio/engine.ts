import { Howl, Howler } from "howler";
import * as synth from "./synth";

export type CueName =
  | "caseOpen"
  | "tension"
  | "lowReveal"
  | "highReveal"
  | "offerArrives"
  | "dealAccepted"
  | "noDeal"
  | "swapDecision"
  | "fanfare"
  | "uiClick";

interface CueSpec {
  /**
   * A synthesised placeholder today. To use a real audio file instead, replace
   * this one line with a path — e.g. `src: "/sounds/case-open.mp3"` — and drop
   * the `format` hint. Nothing else changes. See ADR 0003.
   */
  readonly src: string;
  readonly volume: number;
  readonly loop?: boolean;
}

/** Built once, on the first user gesture. */
function cueSpecs(): Record<CueName, CueSpec> {
  return {
    caseOpen: { src: synth.caseOpen(), volume: 0.6 },
    tension: { src: synth.tension(), volume: 0.35, loop: true },
    lowReveal: { src: synth.lowReveal(), volume: 0.6 },
    highReveal: { src: synth.highReveal(), volume: 0.7 },
    offerArrives: { src: synth.offerArrives(), volume: 0.55 },
    dealAccepted: { src: synth.dealAccepted(), volume: 0.65 },
    noDeal: { src: synth.noDeal(), volume: 0.6 },
    swapDecision: { src: synth.swapDecision(), volume: 0.6 },
    fanfare: { src: synth.fanfare(), volume: 0.7 },
    uiClick: { src: synth.uiClick(), volume: 0.4 },
  };
}

export interface AudioEngine {
  play(cue: CueName): void;
  stop(cue: CueName): void;
  /** Cuts everything still sounding. Used the moment a Deal is taken. */
  stopAll(): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  dispose(): void;
}

/**
 * Every cue is a real Howl, placeholder or not, so overlapping playback,
 * looping, volume and fades behave identically now and after real audio lands.
 *
 * Must be created from a user gesture — browsers will not start audio otherwise.
 */
export function createAudioEngine(): AudioEngine {
  const specs = cueSpecs();
  const howls = {} as Record<CueName, Howl>;

  for (const [name, spec] of Object.entries(specs) as [CueName, CueSpec][]) {
    howls[name] = new Howl({
      src: [spec.src],
      // Howler cannot infer a type from a data URI, so it must be told.
      format: ["wav"],
      volume: spec.volume,
      loop: spec.loop ?? false,
    });
  }

  return {
    play(cue) {
      howls[cue].play();
    },
    stop(cue) {
      howls[cue].stop();
    },
    stopAll() {
      for (const howl of Object.values(howls)) howl.stop();
    },
    setMuted(muted) {
      Howler.mute(muted);
    },
    setVolume(volume) {
      Howler.volume(Math.max(0, Math.min(1, volume)));
    },
    dispose() {
      for (const howl of Object.values(howls)) howl.unload();
    },
  };
}
