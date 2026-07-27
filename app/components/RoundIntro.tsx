"use client";

import { useEffect } from "react";

interface RoundIntroProps {
  readonly round: number;
  readonly casesToOpen: number;
  /**
   * Fired when the card has finished playing. The board stays locked until
   * this lands, so the player cannot tap through the announcement.
   */
  readonly onFinished: () => void;
  readonly durationMs: number;
}

/**
 * The card that opens a Round.
 *
 * The animation ending is the primary signal, so the card and the unlock can
 * never drift apart. A timer backs it up: `animationend` does not fire if the
 * animation never runs — a hidden tab, an interrupted transition — and without
 * the backstop the board would stay locked forever.
 */
export function RoundIntro({
  round,
  casesToOpen,
  onFinished,
  durationMs,
}: RoundIntroProps) {
  useEffect(() => {
    const backstop = setTimeout(onFinished, durationMs + 200);
    return () => clearTimeout(backstop);
  }, [durationMs, onFinished]);

  return (
    <div
      className="round-intro-layer fixed inset-0 z-40 flex items-center justify-center px-6"
      style={{ "--intro-ms": `${durationMs}ms` } as React.CSSProperties}
      role="status"
      aria-live="polite"
    >
      <div className="round-intro text-center" onAnimationEnd={onFinished}>
        <p className="text-xs tracking-[0.35em] text-brass uppercase sm:text-sm">
          Round {round}
        </p>
        <p className="mt-2 font-display text-4xl leading-none tracking-wide text-bone sm:text-6xl">
          {casesToOpen === 1 ? "CHOOSE 1 CASE" : `CHOOSE ${casesToOpen} CASES`}
        </p>
      </div>
    </div>
  );
}
