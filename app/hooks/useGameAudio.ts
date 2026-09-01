import { useCallback, useEffect, useRef } from "react";
import type { AudioEngine, CueName } from "@/lib/audio/engine";
import type { GameState } from "@/lib/game";

export interface AudioSettings {
  readonly muted: boolean;
  /** 0 to 1. */
  readonly volume: number;
}

/**
 * Fires cues off changes in game state rather than from click handlers, so a
 * cue cannot get out of step with what the game actually did.
 *
 * The engine is built on the first user gesture — browsers refuse to start
 * audio before one.
 */
export function useGameAudio(game: GameState, settings: AudioSettings) {
  const engine = useRef<AudioEngine | null>(null);
  const previous = useRef<GameState | null>(null);
  const latestSettings = useRef(settings);

  useEffect(() => {
    latestSettings.current = settings;
    engine.current?.setMuted(settings.muted);
    engine.current?.setVolume(settings.volume);
  }, [settings]);

  const unlock = useCallback(async () => {
    if (engine.current) return;
    const { createAudioEngine } = await import("@/lib/audio/engine");
    const created = createAudioEngine();
    created.setMuted(latestSettings.current.muted);
    created.setVolume(latestSettings.current.volume);
    engine.current = created;
  }, []);

  const play = useCallback((cue: CueName) => {
    engine.current?.play(cue);
  }, []);

  const stop = useCallback((cue: CueName) => {
    engine.current?.stop(cue);
  }, []);

  useEffect(() => {
    const before = previous.current;
    previous.current = game;

    const sound = engine.current;
    if (!sound || !before) return;

    const reveal = game.lastReveal;
    if (reveal && reveal.sequence !== (before.lastReveal?.sequence ?? 0)) {
      // The lid itself, then the sting that says how bad it was.
      sound.play("caseOpen");
      if (reveal.tier === "high") sound.play("highReveal");
      if (reveal.tier === "low") sound.play("lowReveal");
    }

    // No cue on entering the offer phase. The Bank's call runs for a couple of
    // seconds before the amount is on screen, and `offerArrives` is the sting
    // for the amount landing — firing it here would spend it on an empty
    // screen. The call's own beats own that audio, the same way the
    // case-opening beat owns the tension bed.

    if (before.phase === "offer" && game.phase === "opening") {
      sound.play("noDeal");
    }

    if (before.phase !== "swap" && game.phase === "swap") {
      sound.play("swapDecision");
    }

    if (before.phase !== "gameOver" && game.phase === "gameOver") {
      // A Deal stops everything the moment it is taken.
      sound.stopAll();
      sound.play(game.outcome === "deal" ? "dealAccepted" : "fanfare");
    }
  }, [game]);

  useEffect(() => {
    const current = engine;
    return () => current.current?.dispose();
  }, []);

  return { unlock, play, stop };
}
