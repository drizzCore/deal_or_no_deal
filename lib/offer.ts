import {
  OFFER_CAP_OF_BEST_IN_PLAY,
  OFFER_COEFFICIENTS,
  ROUNDING,
} from "./config";

export interface OfferResult {
  readonly amount: number;
  /**
   * The mean of everything In Play when this Offer was made.
   *
   * Kept so the next Offer can tell whether the board got better or worse.
   * **Never render this.** Showing the player Expected Value hands them a
   * solver and the game collapses into arithmetic.
   */
  readonly expectedValue: number;
  /** The multiple of Expected Value actually paid, after clamping. */
  readonly factor: number;
}

/** What the previous Offer was, and what the board was worth at the time. */
export interface PreviousOffer {
  readonly amount: number;
  readonly expectedValue: number;
}

const stepFor = (amount: number) =>
  ROUNDING.find(({ above }) => amount >= above)!.step;

/**
 * The coarsest step that still leaves a clean amount strictly inside the band
 * between the worst and best Cases. Without this, a narrow band can have no
 * representable value inside it — ₱2,000 and ₱2,100 admit nothing at a ₱100
 * step.
 */
function stepThatFitsBetween(worst: number, best: number): number {
  for (const { step } of ROUNDING) {
    if (Math.ceil((worst + 1) / step) * step < best) return step;
  }
  return 1;
}

/**
 * What the Bank will pay to end the game now.
 *
 * Anchored to the mean of everything still In Play — including the Player's
 * Case, whose value the player does not know but which still counts.
 */
export function makeOffer(
  inPlay: readonly number[],
  round: number,
  previous: PreviousOffer | null,
): OfferResult {
  const expectedValue =
    inPlay.reduce((sum, value) => sum + value, 0) / inPlay.length;

  const worst = Math.min(...inPlay);
  const best = Math.max(...inPlay);

  let raw = expectedValue * OFFER_COEFFICIENTS[round - 1];

  // The Offer may never move against the board. Losing a big Case and being
  // offered more for it is the single most incoherent thing the Bank can do.
  // See ADR 0006.
  if (previous) {
    // A worse board drags the Offer down in proportion to what was lost, so a
    // bad Round reads as a bad Round rather than the Bank simply holding firm.
    const drift = (previous.amount * expectedValue) / previous.expectedValue;

    if (expectedValue < previous.expectedValue) {
      raw = Math.min(raw, drift);
    } else if (expectedValue > previous.expectedValue) {
      raw = Math.max(raw, previous.amount);
    }
  }

  // An Offer may never reach the best outcome still possible, or taking the
  // Deal becomes free money. Nor may it sit at or below the worst, because
  // refusing always yields one of the remaining values. See ADR 0005.
  const cap = best * OFFER_CAP_OF_BEST_IN_PLAY;
  const target = Math.min(Math.max(raw, worst), cap);

  const step = Math.min(stepFor(target), stepThatFitsBetween(worst, best));
  let amount = Math.round(target / step) * step;

  if (amount <= worst) amount = Math.ceil((worst + 1) / step) * step;
  if (amount > cap) amount = Math.floor(cap / step) * step;

  // Only reachable if the band is narrower than any clean step — impossible on
  // the shipped Prize Ladders, but the Offer must stay sane regardless.
  if (amount <= worst || amount > cap) {
    amount = Math.min(cap, Math.max(worst + 1, Math.round((worst + best) / 2)));
  }

  amount = Math.max(1, Math.round(amount));

  return { amount, expectedValue, factor: amount / expectedValue };
}
