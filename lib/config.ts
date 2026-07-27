/**
 * Every tunable number in the game. If you are retuning after playtesting,
 * this is the only file you should need to open.
 */

/** Number of Cases on the board. The Round structure below depends on this. */
export const CASE_COUNT = 20;

/**
 * How many Cases each Round opens.
 *
 * These sum to 18 — the nineteen Cases the player did not pick, minus the one
 * that must survive to face them in the Swap Decision. The arithmetic is
 * load-bearing and silent if broken; it is covered by tests.
 */
export const CASES_PER_ROUND = [5, 4, 3, 2, 1, 1, 1, 1] as const;

export const ROUND_COUNT = CASES_PER_ROUND.length;

/**
 * What the Bank pays, as a multiple of Expected Value, per Round.
 *
 * A smooth ramp of +0.10 a Round: early Offers are lowballs, later ones close
 * on what the board is actually worth. This is the main lever on how greedy
 * the game feels — retune here after playtesting.
 *
 * There is deliberately no randomness. See ADR 0006.
 */
export const OFFER_COEFFICIENTS: readonly number[] = [
  0.18, // Round 1
  0.28, // Round 2
  0.38, // Round 3
  0.48, // Round 4
  0.58, // Round 5
  0.68, // Round 6
  0.78, // Round 7
  0.88, // Round 8
];

/**
 * An Offer may never reach the best outcome still possible — otherwise taking
 * the Deal is free money and the decision stops being a decision. Binds about
 * once in ten thousand Offers, when the last two Cases are close in value.
 */
export const OFFER_CAP_OF_BEST_IN_PLAY = 0.95;

/**
 * How hard to round an Offer, by its size. See ADR 0002.
 *
 * DO NOT collapse this into a single constant. A fixed step of 100 produces
 * Offers of exactly ₱0 in one game in twenty-five, and leaves Round 1 with only
 * six distinct possible Offers — which defeats the point of rolling the factor
 * fresh every time.
 */
export const ROUNDING: readonly { readonly above: number; readonly step: number }[] =
  [
    { above: 10_000, step: 1_000 },
    { above: 1_000, step: 100 },
    { above: 100, step: 10 },
    { above: 0, step: 1 },
  ];

/**
 * How long each beat of a Case opening takes, in milliseconds.
 *
 * Retune here after playtesting. These were set analytically, not by feel —
 * eighteen openings a game means small changes here add up fast.
 */
export const TIMING = {
  /** The pause before the lid moves: glow, spotlight, rising tension. */
  tensionBeatMs: 900,
  /** The lid rotating away. */
  lidOpenMs: 650,
  /** How long the spotlight takes to travel to the next Case. */
  spotlightMs: 380,
  /** Cut-down beat when the player has asked for reduced motion. */
  reducedMotionBeatMs: 150,
} as const;

/** How many Cases at each end of the remaining pool get the pinned treatment. */
export const TIER_EDGE_SIZE = 3;

/** Medium-suspense reveal variants, so the middle never feels repetitive. */
export const MEDIUM_VARIANT_COUNT = 4;

/**
 * How much longer each Tier's beat runs. High Tier is the slow-motion one.
 * Multiplies TIMING.tensionBeatMs.
 */
export const TIER_BEAT_SCALE = {
  high: 1.7,
  medium: 1,
  low: 0.65,
} as const;

/**
 * Everything gets heavier as Rounds progress — Round 1 sits at 1.0, Round 8 at
 * about 1.6.
 *
 * This is what replaced the original brief's "everything is top Tier from Round
 * 4". That rule produced six identical maximum-drama reveals in a row and gave
 * the ₱1 Case the full dread treatment. Raising the floor keeps the escalation
 * without spending the contrast that makes a gut-punch land.
 */
export const ROUND_INTENSITY_STEP = 0.085;

export function roundIntensity(round: number): number {
  return 1 + (round - 1) * ROUND_INTENSITY_STEP;
}

/** Multipliers on TIMING, chosen in settings. */
export const REVEAL_SPEEDS = {
  normal: 1,
  fast: 0.5,
} as const;

export type RevealSpeed = keyof typeof REVEAL_SPEEDS;

/**
 * How long the beat before a Case opens should run, given everything that
 * affects it. All the pacing arithmetic lives here so it can be retuned in one
 * place after playtesting.
 */
export function beatDurationMs({
  tier,
  round,
  speed,
  reducedMotion,
}: {
  tier: keyof typeof TIER_BEAT_SCALE;
  round: number;
  speed: RevealSpeed;
  reducedMotion: boolean;
}): number {
  if (reducedMotion) return TIMING.reducedMotionBeatMs;
  return Math.round(
    TIMING.tensionBeatMs *
      TIER_BEAT_SCALE[tier] *
      roundIntensity(round) *
      REVEAL_SPEEDS[speed],
  );
}

/** Top Prize presets offered in settings. */
export const TOP_PRIZE_PRESETS = [10_000, 50_000, 100_000, 1_000_000] as const;

export const DEFAULT_TOP_PRIZE: number = TOP_PRIZE_PRESETS[0];

/**
 * The bottom rungs of every Prize Ladder, pinned regardless of Top Prize.
 * See ADR 0001 — the generator fills upward from here.
 */
export const LOW_ANCHORS = [1, 5, 10, 50] as const;

/**
 * Hand-authored Prize Ladders, used verbatim when present.
 *
 * The ₱10,000 board is hand-authored because the generator prefers ₱150/₱250
 * over the more satisfying ₱100/₱700 at that Top Prize. Every other Top Prize
 * falls through to the generator.
 */
export const LADDER_OVERRIDES: Readonly<Record<number, readonly number[]>> = {
  10_000: [
    1, 5, 10, 50, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500,
    3000, 4000, 5000, 7000, 10000,
  ],
};

/**
 * Clean-denomination lattices, keyed by how many rungs per decade are needed.
 * Values are mantissas: each is multiplied by successive powers of ten.
 */
export const LATTICE_BY_DENSITY: Readonly<Record<number, readonly number[]>> = {
  3: [1, 2, 5],
  4: [1, 2, 3, 5],
  5: [1, 2, 3, 5, 7],
  6: [1, 1.5, 2, 3, 5, 7],
  7: [1, 1.5, 2, 3, 4, 5, 7],
  8: [1, 1.5, 2, 2.5, 3, 4, 5, 7],
};
