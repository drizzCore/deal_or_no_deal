import { describe, expect, it } from "vitest";
import { TOP_PRIZE_PRESETS } from "./config";
import { gameReducer, newGame, type GameState } from "./game";

/**
 * How many digits a number carries once trailing zeros are stripped.
 * A clean denomination reads as one: ₱150 and ₱2,500 have two, ₱233,572 has six.
 */
const significantFigures = (n: number) => String(n).replace(/0+$/, "").length;

/** The hand-authored ₱10,000 Prize Ladder. Source of truth: ADR 0001. */
const LADDER_10K = [
  1, 5, 10, 50, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500,
  3000, 4000, 5000, 7000, 10000,
];

const valuesOf = (state: GameState) =>
  state.cases.map((c) => c.value).sort((a, b) => a - b);

/** Values in the order they were dealt onto the board. */
const valuesOrder = (state: GameState) => state.cases.map((c) => c.value);

describe("starting a new game", () => {
  it("deals twenty Cases holding the ₱10,000 Prize Ladder", () => {
    const state = newGame({ topPrize: 10_000, seed: 1 });

    expect(state.cases).toHaveLength(20);
    expect(valuesOf(state)).toEqual(LADDER_10K);
  });
});

describe("dealing the board", () => {
  it("shuffles the Prize Ladder rather than dealing it in order", () => {
    const { ladder, cases } = newGame({ seed: 3 });

    expect(cases.map((c) => c.value)).not.toEqual([...ladder]);
  });

  it("numbers the Cases 1 to 20", () => {
    const { cases } = newGame({ seed: 3 });

    expect(cases.map((c) => c.id)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  it("leaves every Case sealed", () => {
    const { cases } = newGame({ seed: 3 });

    expect(cases.every((c) => !c.opened)).toBe(true);
  });
});

describe("reproducibility", () => {
  it("deals an identical board from the same seed", () => {
    expect(newGame({ seed: 42 })).toEqual(newGame({ seed: 42 }));
  });

  it("deals a different board from a different seed", () => {
    const first = newGame({ seed: 1 }).cases.map((c) => c.value);
    const second = newGame({ seed: 2 }).cases.map((c) => c.value);

    expect(first).not.toEqual(second);
  });
});

describe("the NEW_GAME action", () => {
  it("deals a different board every time it is dispatched", () => {
    const first = newGame({ seed: 1 });
    const second = gameReducer(first, { type: "NEW_GAME" });
    const third = gameReducer(second, { type: "NEW_GAME" });

    expect(valuesOrder(second)).not.toEqual(valuesOrder(first));
    expect(valuesOrder(third)).not.toEqual(valuesOrder(second));
  });

  it("keeps the current Top Prize when none is asked for", () => {
    const game = gameReducer(newGame({ topPrize: 50_000, seed: 1 }), {
      type: "NEW_GAME",
    });

    expect(game.topPrize).toBe(50_000);
  });

  it("rebuilds the Prize Ladder at a new Top Prize", () => {
    const game = gameReducer(newGame({ seed: 1 }), {
      type: "NEW_GAME",
      topPrize: 100_000,
    });

    expect(game.topPrize).toBe(100_000);
    expect(game.ladder.at(-1)).toBe(100_000);
    expect(game.cases).toHaveLength(20);
  });

  it("returns to the intro phase", () => {
    const game = gameReducer(newGame({ seed: 1 }), { type: "NEW_GAME" });

    expect(game.phase).toBe("intro");
  });
});

describe("the Prize Ladder at every Top Prize", () => {
  it.each(TOP_PRIZE_PRESETS)(
    "is twenty unique, ascending, clean denominations at ₱%i",
    (topPrize) => {
      const { ladder } = newGame({ topPrize, seed: 7 });

      expect(ladder).toHaveLength(20);
      expect(new Set(ladder).size).toBe(20);
      expect([...ladder].sort((a, b) => a - b)).toEqual([...ladder]);
      expect(ladder[0]).toBe(1);
      expect(ladder.at(-1)).toBe(topPrize);

      for (const value of ladder) {
        expect(Number.isInteger(value)).toBe(true);
        expect(significantFigures(value)).toBeLessThanOrEqual(2);
      }
    },
  );
});
