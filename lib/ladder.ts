import {
  CASE_COUNT,
  LADDER_OVERRIDES,
  LATTICE_BY_DENSITY,
  LOW_ANCHORS,
} from "./config";

/**
 * Every clean denomination strictly between `above` and `below`, drawn from a
 * lattice of `mantissas × powers of ten`.
 */
function cleanDenominations(
  mantissas: readonly number[],
  above: number,
  below: number,
): number[] {
  const found = new Set<number>();
  for (let power = 0; Math.pow(10, power) <= below; power++) {
    for (const mantissa of mantissas) {
      const value = Math.round(mantissa * Math.pow(10, power));
      if (value > above && value < below) found.add(value);
    }
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * Builds the Prize Ladder for a given Top Prize: twenty unique, strictly
 * ascending, clean peso denominations from ₱1 up to the Top Prize.
 *
 * See ADR 0001. The obvious `topPrize ^ (i / 19)` curve is deliberately not
 * used — it produces amounts like ₱233,572 and buries half the board below
 * ₱1,000, which is both ugly and weighted hard against the player.
 *
 * Instead the bottom rungs are pinned to LOW_ANCHORS and the rest are spread
 * geometrically, each snapped to the nearest unused clean denomination.
 */
export function buildLadder(topPrize: number): number[] {
  const override = LADDER_OVERRIDES[topPrize];
  if (override) return [...override];

  const anchors = LOW_ANCHORS.filter((anchor) => anchor < topPrize);
  const highestAnchor = anchors[anchors.length - 1] ?? 1;

  // Rungs to place strictly between the anchors and the Top Prize.
  const needed = CASE_COUNT - anchors.length - 1;
  if (needed < 1) {
    throw new Error(`Top Prize of ${topPrize} is too small for a Prize Ladder`);
  }

  // Lattice density is chosen so the available rungs roughly match what we need.
  const floor = highestAnchor * 2;
  const decades = Math.log10(topPrize / floor);
  const perDecade = Math.min(8, Math.max(3, Math.ceil(needed / decades)));
  const lattice = cleanDenominations(
    LATTICE_BY_DENSITY[perDecade],
    highestAnchor,
    topPrize,
  );

  if (lattice.length < needed) {
    throw new Error(
      `Only ${lattice.length} clean denominations available between ` +
        `₱${highestAnchor} and ₱${topPrize}, but ${needed} are needed`,
    );
  }

  // Walk the ideal geometric targets, snapping each to the nearest unused rung.
  const chosen = new Set<number>();
  for (let i = 1; i <= needed; i++) {
    const target = floor * Math.pow(topPrize / floor, i / (needed + 1));

    let best = -1;
    let bestDistance = Infinity;
    for (const candidate of lattice) {
      if (chosen.has(candidate)) continue;
      const distance = Math.abs(Math.log(candidate) - Math.log(target));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
    chosen.add(best);
  }

  return [
    ...anchors,
    ...[...chosen].sort((a, b) => a - b),
    topPrize,
  ];
}
