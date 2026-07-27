import { useCallback, useEffect, useRef, useState } from "react";

interface CaseOpeningOptions {
  /** Called once the beat has run and the lid should actually move. */
  readonly onOpen: (caseId: number) => void;
  /** Start of the beat — where the rising tension bed comes in. */
  readonly onArm: () => void;
  /** End of the beat, however it ended. */
  readonly onDisarm: () => void;
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

  /** `beatMs` is computed by the caller from Tier, Round and settings. */
  const arm = useCallback(
    (caseId: number, beatMs: number) => {
      // One Case at a time; taps during a beat are ignored.
      if (timer.current) return;

      setArmingCaseId(caseId);
      onArm();

      timer.current = setTimeout(() => {
        timer.current = null;
        setArmingCaseId(null);
        onDisarm();
        onOpen(caseId);
      }, beatMs);
    },
    [onArm, onDisarm, onOpen],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { armingCaseId, arm, cancel, busy: armingCaseId !== null };
}
