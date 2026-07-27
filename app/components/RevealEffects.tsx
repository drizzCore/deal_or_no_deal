"use client";

import { useEffect } from "react";
import type { Reveal } from "@/lib/game";

interface RevealEffectsProps {
  readonly reveal: Reveal | null;
  readonly reducedMotion: boolean;
  /** How long the wash should run, matched to the beat that preceded it. */
  readonly durationMs: number;
}

/**
 * The screen-level part of a reveal: the flash, and the darkening on a
 * high-Tier opening.
 *
 * Driven entirely by a React key rather than timers — remounting replays the
 * CSS animation, so there is no state to reset and nothing left running if the
 * game ends mid-reveal.
 */
export function RevealEffects({
  reveal,
  reducedMotion,
  durationMs,
}: RevealEffectsProps) {
  // Confetti is an external system, so an effect is the right place for it.
  useEffect(() => {
    if (!reveal || reveal.tier !== "low" || reducedMotion) return;

    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 45,
        spread: 60,
        startVelocity: 28,
        gravity: 1.1,
        ticks: 120,
        origin: { y: 0.62 },
        colors: ["#4FA97A", "#F2D06B", "#EDE8DC"],
        disableForReducedMotion: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [reveal, reducedMotion]);

  if (!reveal || reducedMotion) return null;

  return (
    <div
      key={reveal.sequence}
      aria-hidden
      className={`reveal-fx tier-${reveal.tier} variant-${reveal.variant}`}
      style={{ "--fx-ms": `${durationMs}ms` } as React.CSSProperties}
    />
  );
}
