"use client";

import { useEffect } from "react";

interface BankerCallProps {
  readonly round: number;
  /**
   * Fired when both beats have played. The Offer stays off screen until this
   * lands, so the amount cannot be read early.
   */
  readonly onFinished: () => void;
  /** The whole sequence, both beats together. */
  readonly durationMs: number;
}

/**
 * The pause before the Bank names its price.
 *
 * Two beats — the phone ringing, then the Bank about to speak — and only then
 * the amount. Deliberately not skippable: the wait is the drama, and a player
 * who can tap past it will, every time, and never feel the Round land.
 *
 * Like the Round announcement, the animation ending is the primary signal so
 * the card and the reveal can never drift apart, with a timer as the backstop
 * for when the animation never runs at all — a hidden tab, an interrupted
 * transition. The handler checks the event target because both beats animate
 * inside this card and `animationend` bubbles; without that guard the first
 * beat ending would reveal the Offer.
 */
export function BankerCall({ onFinished, durationMs }: BankerCallProps) {
  useEffect(() => {
    const backstop = setTimeout(onFinished, durationMs + 200);
    return () => clearTimeout(backstop);
  }, [durationMs, onFinished]);

  return (
    <div
      className="banker-call-layer fixed inset-0 z-40 flex items-center justify-center px-6"
      style={{ "--call-ms": `${durationMs}ms` } as React.CSSProperties}
      role="status"
      aria-live="polite"
    >
      <div
        className="banker-call text-center"
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) onFinished();
        }}
      >
        <p className="banker-call-beat banker-call-ring font-display text-3xl leading-tight tracking-wide text-bone sm:text-5xl">
          <span aria-hidden className="banker-call-dot" />
          THE BANKER IS CALLING
        </p>
        <p className="banker-call-beat banker-call-says font-display text-3xl leading-tight tracking-wide text-brass-hot sm:text-5xl">
          THE BANKER&rsquo;S OFFER IS&hellip;
        </p>
      </div>
    </div>
  );
}
