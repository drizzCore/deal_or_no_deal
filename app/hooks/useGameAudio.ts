import { useCallback, useEffect, useRef } from "react";
import type { AudioEngine, CueName } from "@/lib/audio/engine";
import type { GameState } from "@/lib/game";

export interface AudioSettings {
  readonly muted: boolean;
  /** 0 to 1. */
  readonly volume: number;
}

const openedCount = (state: GameState) =>
  state.cases.filter((c) => c.opened).length;

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

    if (openedCount(game) > openedCount(before)) sound.play("caseOpen");

    if (before.phase !== "offer" && game.phase === "offer") {
      sound.play("offerArrives");
    }

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
