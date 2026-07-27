import { useCallback, useEffect, useRef, useState } from "react";
import { REVEAL_SPEEDS, TIMING, type RevealSpeed } from "@/lib/config";

interface CaseOpeningOptions {
  /** Called once the beat has run and the lid should actually move. */
  readonly onOpen: (caseId: number) => void;
  /** Start of the beat — where the rising tension bed comes in. */
  readonly onArm: () => void;
  /** End of the beat, however it ended. */
  readonly onDisarm: () => void;
  readonly reducedMotion: boolean;
  readonly speed: RevealSpeed;
}

/**
 * The beat between tapping a Case and its lid moving.
 *
 * Deliberately outside the reducer: this is pacing, not game state. The
 * reducer stays a model of the game and its tests never have to know a
 * countdown exists.
 */
export function useCaseOpening({
  onOpen,
  onArm,
  onDisarm,
  reducedMotion,
  speed,
}: CaseOpeningOptions) {
  const [armingCaseId, setArmingCaseId] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  /** Abandons a beat in flight — a new game, or any other interruption. */
  const cancel = useCallback(() => {
    clearTimer();
    setArmingCaseId(null);
    onDisarm();
  }, [clearTimer, onDisarm]);

  const arm = useCallback(
    (caseId: number) => {
      // One Case at a time; taps during a beat are ignored.
      if (timer.current) return;

      setArmingCaseId(caseId);
      onArm();

      const beat = reducedMotion
        ? TIMING.reducedMotionBeatMs
        : TIMING.tensionBeatMs * REVEAL_SPEEDS[speed];

      timer.current = setTimeout(() => {
        timer.current = null;
        setArmingCaseId(null);
        onDisarm();
        onOpen(caseId);
      }, beat);
    },
    [onArm, onDisarm, onOpen, reducedMotion, speed],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { armingCaseId, arm, cancel, busy: armingCaseId !== null };
}
