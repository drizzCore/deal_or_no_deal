import {
  OFFER_CAP_OF_BEST_IN_PLAY,
  OFFER_FACTOR_BANDS,
  ROUNDING,
  WILD_SWING_CEILING,
  WILD_SWING_CHANCE,
  WILD_SWING_FLOOR,
} from "./config";
import { roll, rollBetween } from "./rng";

export interface OfferRoll {
  readonly amount: number;
  readonly factor: number;
  readonly wildSwing: boolean;
  readonly seed: number;
}

/**
 * A fresh multiplier every time — never a reused one, or the Offer becomes
 * predictable and the player stops paying attention to it.
 */
function rollFactor(round: number, seed: number) {
  const [low, high] = OFFER_FACTOR_BANDS[round - 1];
  const chance = roll(seed);

  if (chance.value < WILD_SWING_CHANCE) {
    const direction = roll(chance.seed);
    const swung =
      direction.value < 0.5
        ? rollBetween(direction.seed, WILD_SWING_FLOOR, low)
        : rollBetween(direction.seed, high, WILD_SWING_CEILING);
    return { factor: swung.value, wildSwing: true, seed: swung.seed };
  }

  const ordinary = rollBetween(chance.seed, low, high);
  return { factor: ordinary.value, wildSwing: false, seed: ordinary.seed };
}

const stepFor = (amount: number) =>
  ROUNDING.find(({ above }) => amount >= above)!.step;

/**
 * The coarsest step that still leaves a clean amount strictly inside the band
 * between the worst and best Cases. Without this, a narrow band can have no
 * representable value inside it — ₱2,000 and ₱2,100 admit nothing at all at a
 * ₱100 step.
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
  seed: number,
): OfferRoll {
  const expectedValue =
    inPlay.reduce((sum, value) => sum + value, 0) / inPlay.length;
  const { factor, wildSwing, seed: next } = rollFactor(round, seed);

  const worst = Math.min(...inPlay);
  const best = Math.max(...inPlay);

  // An Offer may never reach the best outcome still possible, or taking the
  // Deal becomes free money and the decision stops being a decision.
  const cap = best * OFFER_CAP_OF_BEST_IN_PLAY;

  // Nor may it sit at or below the worst, because refusing always yields one
  // of the remaining values — so the player would be strictly worse off for
  // accepting. See ADR 0005. Early on this never binds: the worst Case is ₱1.
  const target = Math.min(Math.max(expectedValue * factor, worst), cap);

  const step = Math.min(stepFor(target), stepThatFitsBetween(worst, best));
  let amount = Math.round(target / step) * step;

  if (amount <= worst) amount = Math.ceil((worst + 1) / step) * step;
  if (amount > cap) amount = Math.floor(cap / step) * step;

  // Only reachable if the band is narrower than any clean step — impossible on
  // the shipped Prize Ladders, but the Offer must stay sane regardless.
  if (amount <= worst || amount > cap) {
    amount = Math.min(cap, Math.max(worst + 1, Math.round((worst + best) / 2)));
  }

  return { amount: Math.max(1, Math.round(amount)), factor, wildSwing, seed: next };
}
