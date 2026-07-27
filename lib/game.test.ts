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

/** A game sitting at the start of Round 1, with Case 7 held by the player. */
const atRoundOne = (seed = 1) =>
  gameReducer(gameReducer(newGame({ seed }), { type: "START" }), {
    type: "PICK_PLAYER_CASE",
    caseId: 7,
  });

/** Every Case the player is allowed to open right now. */
const openable = (state: GameState) =>
  state.cases.filter((c) => !c.opened && c.id !== state.playerCaseId);

/** Opens Cases one at a time until the Round is done. */
const finishRound = (state: GameState) => {
  let next = state;
  while (next.phase === "opening") {
    next = gameReducer(next, {
      type: "OPEN_CASE",
      caseId: openable(next)[0].id,
    });
  }
  return next;
};

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

describe("picking the Player's Case", () => {
  it("hands the player their Case and opens Round 1", () => {
    const game = atRoundOne();

    expect(game.playerCaseId).toBe(7);
    expect(game.round).toBe(1);
    expect(game.phase).toBe("opening");
  });

  it("leaves the Player's Case sealed", () => {
    const game = atRoundOne();

    expect(game.cases.find((c) => c.id === 7)?.opened).toBe(false);
  });

  it("cannot be picked a second time", () => {
    const game = atRoundOne();
    const again = gameReducer(game, {
      type: "PICK_PLAYER_CASE",
      caseId: 12,
    });

    expect(again.playerCaseId).toBe(7);
  });
});

describe("opening Cases", () => {
  it("reveals the Case and marks it opened", () => {
    const game = gameReducer(atRoundOne(), { type: "OPEN_CASE", caseId: 3 });

    expect(game.cases.find((c) => c.id === 3)?.opened).toBe(true);
  });

  it("refuses to open the Player's Case", () => {
    const game = gameReducer(atRoundOne(), { type: "OPEN_CASE", caseId: 7 });

    expect(game.cases.find((c) => c.id === 7)?.opened).toBe(false);
  });

  it("refuses to open a Case twice", () => {
    const once = gameReducer(atRoundOne(), { type: "OPEN_CASE", caseId: 3 });
    const twice = gameReducer(once, { type: "OPEN_CASE", caseId: 3 });

    expect(twice.cases.filter((c) => c.opened)).toHaveLength(1);
  });

  it("ends the Round once its allotment is open, refusing further openings", () => {
    const done = finishRound(atRoundOne());
    const extra = gameReducer(done, {
      type: "OPEN_CASE",
      caseId: openable(done)[0].id,
    });

    expect(done.phase).toBe("roundComplete");
    expect(done.cases.filter((c) => c.opened)).toHaveLength(5);
    expect(extra.cases.filter((c) => c.opened)).toHaveLength(5);
  });
});

describe("the Round structure", () => {
  it("opens 5, 4, 3, 2, 1, 1, 1, 1 Cases across eight Rounds", () => {
    const openedPerRound: number[] = [];
    let game = atRoundOne();
    let alreadyOpen = 0;

    for (let round = 1; round <= 8; round++) {
      expect(game.round).toBe(round);
      game = finishRound(game);

      const nowOpen = game.cases.filter((c) => c.opened).length;
      openedPerRound.push(nowOpen - alreadyOpen);
      alreadyOpen = nowOpen;

      if (round < 8) game = gameReducer(game, { type: "CONTINUE" });
    }

    expect(openedPerRound).toEqual([5, 4, 3, 2, 1, 1, 1, 1]);
  });

  it("leaves exactly the Player's Case and one other sealed after Round 8", () => {
    let game = atRoundOne();
    for (let round = 1; round <= 8; round++) {
      game = finishRound(game);
      if (round < 8) game = gameReducer(game, { type: "CONTINUE" });
    }

    const sealed = game.cases.filter((c) => !c.opened);
    expect(sealed).toHaveLength(2);
    expect(sealed.map((c) => c.id)).toContain(7);
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
