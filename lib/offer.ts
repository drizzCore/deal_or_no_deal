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

/** Rounds to the nearest clean amount for its size. See ADR 0002. */
function tidy(amount: number): number {
  const step = stepFor(amount);
  return Math.max(1, Math.round(amount / step) * step);
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

  // An Offer may never reach the best outcome still possible, or taking the
  // Deal becomes free money and the decision stops being a decision.
  const cap = Math.max(...inPlay) * OFFER_CAP_OF_BEST_IN_PLAY;

  let amount = tidy(Math.min(expectedValue * factor, cap));
  if (amount > cap) {
    // Rounding to the nearest step can push a capped Offer back over the cap.
    const step = stepFor(cap);
    amount = Math.max(1, Math.floor(cap / step) * step);
  }

  return { amount, factor, wildSwing, seed: next };
}
