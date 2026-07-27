/**
 * Deterministic pseudo-random numbers, threaded through game state.
 *
 * Nothing here mutates and nothing calls `Math.random`. Every roll returns the
 * next seed alongside its value so the reducer stays a pure
 * `(state, action) => state` — which is what makes the whole test strategy
 * work, and makes any game reproducible from its seed.
 */

export interface Roll {
  /** A number in [0, 1). */
  readonly value: number;
  /** The seed to use for the next roll. */
  readonly seed: number;
}

/** One mulberry32 step. */
export function roll(seed: number): Roll {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(next ^ (next >>> 15), 1 | next);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: next };
}

/** A roll scaled into [min, max). */
export function rollBetween(seed: number, min: number, max: number): Roll {
  const r = roll(seed);
  return { value: min + r.value * (max - min), seed: r.seed };
}

/** A roll narrowed to an integer index in [0, length). */
export function rollIndex(seed: number, length: number): Roll {
  const r = roll(seed);
  return { value: Math.floor(r.value * length), seed: r.seed };
}

export interface Shuffled<T> {
  readonly items: readonly T[];
  readonly seed: number;
}

/** Fisher-Yates, seeded. */
export function shuffle<T>(items: readonly T[], seed: number): Shuffled<T> {
  const out = [...items];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    const picked = rollIndex(s, i + 1);
    s = picked.seed;
    const j = picked.value;
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { items: out, seed: s };
}
