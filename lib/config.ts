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
