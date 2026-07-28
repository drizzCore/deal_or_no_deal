import { describe, expect, it } from "vitest";
import {
  MEDIUM_VARIANT_COUNT,
  OFFER_CAP_OF_BEST_IN_PLAY,
  ROUNDING,
  TOP_PRIZE_PRESETS,
} from "./config";
import {
  bestRefusedOffer,
  boardTone,
  gameReducer,
  newGame,
  type GameAction,
  type GameState,
  type Offer,
} from "./game";

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

/** What the player is actually holding in a game dealt from this seed. */
const playerValue = (seed: number) =>
  atRoundOne(seed).cases.find((c) => c.id === 7)!.value;

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

    expect(done.phase).toBe("offer");
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

      if (round < 8) game = gameReducer(game, { type: "DECLINE_OFFER" });
    }

    expect(openedPerRound).toEqual([5, 4, 3, 2, 1, 1, 1, 1]);
  });

  it("leaves exactly the Player's Case and one other sealed after Round 8", () => {
    let game = atRoundOne();
    for (let round = 1; round <= 8; round++) {
      game = finishRound(game);
      if (round < 8) game = gameReducer(game, { type: "DECLINE_OFFER" });
    }

    const sealed = game.cases.filter((c) => !c.opened);
    expect(sealed).toHaveLength(2);
    expect(sealed.map((c) => c.id)).toContain(7);
  });
});

/** Plays a whole game, declining every Offer, recording what was In Play. */
function playDecliningEverything(seed: number) {
  let game = atRoundOne(seed);
  const rounds: { offer: Offer; inPlay: number[] }[] = [];

  for (let round = 1; round <= 8; round++) {
    game = finishRound(game);
    rounds.push({
      offer: game.offers.at(-1)!,
      inPlay: game.cases.filter((c) => !c.opened).map((c) => c.value),
    });
    if (round < 8) game = gameReducer(game, { type: "DECLINE_OFFER" });
  }

  return { game, rounds };
}

/** The rounding step an amount of this size should have landed on. */
const stepFor = (amount: number) =>
  ROUNDING.find(({ above }) => amount >= above)!.step;

describe("the Bank's Offer", () => {
  it("arrives after every Round, including Round 8", () => {
    const { game, rounds } = playDecliningEverything(11);

    expect(game.offers).toHaveLength(8);
    expect(rounds.map((r) => r.offer.round)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("counts the Player's Case in Expected Value", () => {
    const { rounds } = playDecliningEverything(11);
    const { offer, inPlay } = rounds[0];

    const withPlayer = inPlay.reduce((a, b) => a + b, 0) / inPlay.length;
    const withoutPlayer =
      (inPlay.reduce((a, b) => a + b, 0) - playerValue(11)) /
      (inPlay.length - 1);

    const distanceTo = (ev: number) => Math.abs(offer.amount - ev * offer.factor);
    expect(distanceTo(withPlayer)).toBeLessThan(distanceTo(withoutPlayer));
  });

  it("is a deterministic function of the board, not a roll", () => {
    const first = playDecliningEverything(11).game.offers.map((o) => o.amount);
    const again = playDecliningEverything(11).game.offers.map((o) => o.amount);

    expect(again).toEqual(first);
  });
});

describe("Offer invariants across many games", () => {
  const SEEDS = 2000;
  const everyOffer: { offer: Offer; inPlay: number[] }[] = [];

  for (let seed = 1; seed <= SEEDS; seed++) {
    everyOffer.push(...playDecliningEverything(seed).rounds);
  }

  it("never offers ₱0", () => {
    const zeroes = everyOffer.filter(({ offer }) => offer.amount === 0);

    expect(zeroes).toHaveLength(0);
  });

  it("always lands strictly between the worst and best Cases In Play", () => {
    // Refusing always yields one of the remaining values, so an Offer at or
    // below the cheapest is strictly dominated — the player can only lose by
    // taking it. Found in playtesting: ₱660 offered against ₱700 and ₱1,500.
    const dominated = everyOffer.filter(
      ({ offer, inPlay }) => offer.amount <= Math.min(...inPlay),
    );

    expect(dominated).toHaveLength(0);
  });

  it("never exceeds 95% of the best Case still In Play", () => {
    const overCap = everyOffer.filter(
      ({ offer, inPlay }) =>
        offer.amount > Math.max(...inPlay) * OFFER_CAP_OF_BEST_IN_PLAY,
    );

    expect(overCap).toHaveLength(0);
  });

  it("always lands on a clean amount for its size", () => {
    const untidy = everyOffer.filter(
      ({ offer }) =>
        !Number.isInteger(offer.amount) ||
        offer.amount % stepFor(offer.amount) !== 0,
    );

    expect(untidy).toHaveLength(0);
  });

  it("never moves against the board", () => {
    // Losing a big Case and being offered more for it is the single most
    // incoherent thing the Bank can do. Found in playtesting: an Offer went
    // from ₱1,300 to ₱2,300 in the round the ₱10,000 Case was opened.
    const contradictions: unknown[] = [];

    for (let seed = 1; seed <= SEEDS; seed++) {
      const { rounds } = playDecliningEverything(seed);
      for (let i = 1; i < rounds.length; i++) {
        const [before, now] = [rounds[i - 1], rounds[i]];
        const worse = now.offer.expectedValue < before.offer.expectedValue;
        const better = now.offer.expectedValue > before.offer.expectedValue;

        // The one legitimate exception: if the cheapest Case still In Play has
        // risen past the old Offer, that Offer is now dominated and the floor
        // from ADR 0005 must win. A dominated Offer is the worse defect.
        const floorForcedIt = before.offer.amount <= Math.min(...now.inPlay);

        if (worse && now.offer.amount > before.offer.amount && !floorForcedIt) {
          contradictions.push({ seed, round: now.offer.round });
        }
        if (better && now.offer.amount < before.offer.amount) {
          contradictions.push({ seed, round: now.offer.round });
        }
      }
    }

    expect(contradictions).toEqual([]);
  });

  it("pays a larger share of the board as Rounds progress", () => {
    const byRound = new Map<number, number[]>();
    for (const { offer } of everyOffer) {
      byRound.set(offer.round, [
        ...(byRound.get(offer.round) ?? []),
        offer.amount / offer.expectedValue,
      ]);
    }

    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const shares = [...byRound.keys()]
      .sort((a, b) => a - b)
      .map((round) => mean(byRound.get(round)!));

    expect(shares[0]).toBeLessThan(shares.at(-1)!);
    // Generous from Round 1 — an Offer nobody would ever accept is not a
    // decision. By Round 8 the Bank pays around the board's full value.
    expect(shares[0]).toBeGreaterThan(0.6);
    expect(shares.at(-1)!).toBeGreaterThan(0.95);
  });
});

describe("Deal and No Deal", () => {
  it("ends the game at the Offer amount when the Deal is taken", () => {
    const game = finishRound(atRoundOne());
    const dealt = gameReducer(game, { type: "ACCEPT_DEAL" });

    expect(dealt.phase).toBe("gameOver");
    expect(dealt.winnings).toBe(game.offers.at(-1)!.amount);
  });

  it("stops everything once the Deal is taken", () => {
    const dealt = gameReducer(finishRound(atRoundOne()), {
      type: "ACCEPT_DEAL",
    });
    const meddled = (
      [
        { type: "OPEN_CASE", caseId: openable(dealt)[0].id },
        { type: "DECLINE_OFFER" },
        { type: "ACCEPT_DEAL" },
      ] satisfies GameAction[]
    ).reduce(gameReducer, dealt);

    expect(meddled).toEqual(dealt);
  });

  it("advances to the next Round on No Deal", () => {
    const declined = gameReducer(finishRound(atRoundOne()), {
      type: "DECLINE_OFFER",
    });

    expect(declined.phase).toBe("opening");
    expect(declined.round).toBe(2);
  });

  it("goes to the Swap Decision when the Round 8 Offer is declined", () => {
    const { game } = playDecliningEverything(11);
    const swapping = gameReducer(game, { type: "DECLINE_OFFER" });

    expect(game.round).toBe(8);
    expect(swapping.phase).toBe("swap");
    expect(swapping.cases.filter((c) => !c.opened)).toHaveLength(2);
  });
});

/**
 * The Tier rule restated from the spec, independently of the implementation:
 * rank among values still openable, Player's Case excluded.
 */
function expectedTier(state: GameState, caseId: number) {
  const openable = state.cases
    .filter((c) => !c.opened && c.id !== state.playerCaseId)
    .map((c) => c.value)
    .sort((a, b) => a - b);
  const value = state.cases.find((c) => c.id === caseId)!.value;
  const rank = openable.indexOf(value);

  if (rank >= openable.length - 3) return "high";
  if (rank < 3) return "low";
  return "medium";
}

/** A game where the player happens to be holding the Top Prize. */
function holdingTopPrize(seed: number) {
  const started = gameReducer(newGame({ seed }), { type: "START" });
  const top = Math.max(...started.cases.map((c) => c.value));
  const caseId = started.cases.find((c) => c.value === top)!.id;
  return gameReducer(started, { type: "PICK_PLAYER_CASE", caseId });
}

describe("Tier classification", () => {
  it("matches the ranking of values still openable, every opening", () => {
    for (let seed = 1; seed <= 150; seed++) {
      let game = atRoundOne(seed);

      while (game.phase === "opening" || game.phase === "offer") {
        if (game.phase === "offer") {
          if (game.round >= 8) break;
          game = gameReducer(game, { type: "DECLINE_OFFER" });
          continue;
        }
        const next = openable(game)[0];
        const predicted = expectedTier(game, next.id);
        game = gameReducer(game, { type: "OPEN_CASE", caseId: next.id });

        expect(game.lastReveal).not.toBeNull();
        expect(game.lastReveal!.caseId).toBe(next.id);
        expect(game.lastReveal!.tier).toBe(predicted);
      }
    }
  });

  it("re-ranks as the pool shrinks, so one value can change Tier", () => {
    const tiers = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      let game = atRoundOne(seed);
      while (game.phase === "opening") {
        game = gameReducer(game, {
          type: "OPEN_CASE",
          caseId: openable(game)[0].id,
        });
        tiers.add(game.lastReveal!.tier);
      }
    }

    expect([...tiers].sort()).toEqual(["high", "low", "medium"]);
  });

  it("never lets the Player's Case affect the ranking", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const game = holdingTopPrize(seed);
      const openableCases = openable(game);

      // The player holds the biggest value, yet three others must still be
      // high Tier — the ranking is over what can actually be opened.
      const highs = openableCases.filter(
        (c) => expectedTier(game, c.id) === "high",
      );
      expect(highs).toHaveLength(3);
      expect(highs.map((c) => c.id)).not.toContain(game.playerCaseId);

      for (const c of openableCases) {
        const opened = gameReducer(game, { type: "OPEN_CASE", caseId: c.id });
        expect(opened.lastReveal!.tier).toBe(expectedTier(game, c.id));
      }
    }
  });

  it("assigns a medium variant only to medium Tier reveals", () => {
    const variants = new Set<number>();
    for (let seed = 1; seed <= 80; seed++) {
      let game = atRoundOne(seed);
      while (game.phase === "opening") {
        game = gameReducer(game, {
          type: "OPEN_CASE",
          caseId: openable(game)[0].id,
        });
        const reveal = game.lastReveal!;
        if (reveal.tier === "medium") variants.add(reveal.variant);
        else expect(reveal.variant).toBe(0);
      }
    }

    expect(variants.size).toBeGreaterThan(1);
    expect(Math.max(...variants)).toBeLessThan(MEDIUM_VARIANT_COUNT);
  });

  it("clears the last reveal on a new game", () => {
    const played = gameReducer(atRoundOne(), {
      type: "OPEN_CASE",
      caseId: openable(atRoundOne())[0].id,
    });

    expect(gameReducer(played, { type: "NEW_GAME" }).lastReveal).toBeNull();
  });
});

describe("how the board is trending", () => {
  it("is neutral on a full board", () => {
    expect(boardTone(newGame({ seed: 1 }))).toBeCloseTo(0, 5);
  });

  it("runs cold when only the big values are left", () => {
    const game = atRoundOne(1);
    const doomed = [...game.cases]
      .sort((a, b) => a.value - b.value)
      .filter((c) => c.id !== game.playerCaseId)
      .slice(0, 15);
    const stripped = doomed.reduce(
      (state, c) => ({
        ...state,
        cases: state.cases.map((x) =>
          x.id === c.id ? { ...x, opened: true } : x,
        ),
      }),
      game,
    );

    expect(boardTone(stripped)).toBeLessThan(-0.5);
  });

  it("runs hot when only the small values are left", () => {
    const game = atRoundOne(1);
    const doomed = [...game.cases]
      .sort((a, b) => b.value - a.value)
      .filter((c) => c.id !== game.playerCaseId)
      .slice(0, 15);
    const stripped = doomed.reduce(
      (state, c) => ({
        ...state,
        cases: state.cases.map((x) =>
          x.id === c.id ? { ...x, opened: true } : x,
        ),
      }),
      game,
    );

    expect(boardTone(stripped)).toBeGreaterThan(0.5);
  });

  it("stays inside -1 and 1 through whole games", () => {
    for (let seed = 1; seed <= 200; seed++) {
      let game = atRoundOne(seed);
      while (game.phase === "opening" || game.phase === "offer") {
        expect(Math.abs(boardTone(game))).toBeLessThanOrEqual(1);
        if (game.phase === "offer") {
          if (game.round >= 8) break;
          game = gameReducer(game, { type: "DECLINE_OFFER" });
          continue;
        }
        game = gameReducer(game, {
          type: "OPEN_CASE",
          caseId: openable(game)[0].id,
        });
      }
    }
  });

  it("returns to neutral on a new game", () => {
    const played = finishRound(atRoundOne(3));

    expect(boardTone(gameReducer(played, { type: "NEW_GAME" }))).toBeCloseTo(
      0,
      5,
    );
  });
});

describe("the Offer History", () => {
  it("records every Offer in the order the Bank made them", () => {
    const { game, rounds } = playDecliningEverything(11);

    expect(game.offers).toHaveLength(8);
    expect(game.offers.map((o) => o.round)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(game.offers.map((o) => o.amount)).toEqual(
      rounds.map((r) => r.offer.amount),
    );
  });

  it("grows by exactly one Offer per Round", () => {
    let game = atRoundOne(11);
    for (let round = 1; round <= 8; round++) {
      game = finishRound(game);
      expect(game.offers).toHaveLength(round);
      if (round < 8) game = gameReducer(game, { type: "DECLINE_OFFER" });
    }
  });

  it("has nothing refused yet in Round 1", () => {
    const first = finishRound(atRoundOne(11));

    expect(bestRefusedOffer(first)).toBeNull();
  });

  it("excludes the Offer currently on the table", () => {
    let game = finishRound(atRoundOne(11));
    const roundOne = game.offers[0];
    game = finishRound(gameReducer(game, { type: "DECLINE_OFFER" }));

    // Round 2's Offer is live and undecided, so it cannot be "refused".
    expect(bestRefusedOffer(game)).toEqual(roundOne);
  });

  it("reports the highest Offer already turned down, whenever it came", () => {
    for (let seed = 1; seed <= 100; seed++) {
      let game = atRoundOne(seed);
      for (let round = 1; round <= 8; round++) {
        game = finishRound(game);
        const refused = game.offers.slice(0, -1);
        const best = bestRefusedOffer(game);

        if (refused.length === 0) {
          expect(best).toBeNull();
        } else {
          expect(best!.amount).toBe(Math.max(...refused.map((o) => o.amount)));
          expect(refused).toContainEqual(best);
        }
        if (round < 8) game = gameReducer(game, { type: "DECLINE_OFFER" });
      }
    }
  });
});

/** A game with two Cases left, facing the keep-or-swap choice. */
const atSwapDecision = (seed = 11) =>
  gameReducer(playDecliningEverything(seed).game, { type: "DECLINE_OFFER" });

const valueOfCase = (state: GameState, caseId: number | null) =>
  state.cases.find((c) => c.id === caseId)!.value;

describe("reaching the Swap Decision", () => {
  it("opens exactly eighteen Cases across a full eight-Round game", () => {
    const swapping = atSwapDecision();

    expect(swapping.cases.filter((c) => c.opened)).toHaveLength(18);
  });

  it("leaves the Player's Case and exactly one other In Play", () => {
    const swapping = atSwapDecision();
    const inPlay = swapping.cases.filter((c) => !c.opened);

    expect(inPlay).toHaveLength(2);
    expect(inPlay.map((c) => c.id)).toContain(swapping.playerCaseId);
  });

  it("cannot be reached by declining an earlier Offer", () => {
    let game = atRoundOne();
    for (let round = 1; round < 8; round++) {
      game = gameReducer(finishRound(game), { type: "DECLINE_OFFER" });
      expect(game.phase).toBe("opening");
    }
  });

  it("ignores keep and swap before the final two", () => {
    const midGame = finishRound(atRoundOne());

    expect(gameReducer(midGame, { type: "KEEP_CASE" })).toEqual(midGame);
    expect(gameReducer(midGame, { type: "SWAP_CASE" })).toEqual(midGame);
  });
});

describe("the Swap Decision", () => {
  it("pays out the Player's Case when they keep it", () => {
    const swapping = atSwapDecision();
    const ended = gameReducer(swapping, { type: "KEEP_CASE" });

    expect(ended.phase).toBe("gameOver");
    expect(ended.outcome).toBe("kept");
    expect(ended.finalCaseId).toBe(swapping.playerCaseId);
    expect(ended.winnings).toBe(valueOfCase(swapping, swapping.playerCaseId));
  });

  it("pays out the other Case when they swap", () => {
    const swapping = atSwapDecision();
    const other = swapping.cases.find(
      (c) => !c.opened && c.id !== swapping.playerCaseId,
    )!;
    const ended = gameReducer(swapping, { type: "SWAP_CASE" });

    expect(ended.outcome).toBe("swapped");
    expect(ended.finalCaseId).toBe(other.id);
    expect(ended.winnings).toBe(other.value);
  });

  it("always pays whatever is in the Case they end up holding", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const swapping = atSwapDecision(seed);
      for (const choice of ["KEEP_CASE", "SWAP_CASE"] as const) {
        const ended = gameReducer(swapping, { type: choice });
        expect(ended.winnings).toBe(valueOfCase(ended, ended.finalCaseId));
      }
    }
  });

  it("stops everything once the choice is made", () => {
    const ended = gameReducer(atSwapDecision(), { type: "KEEP_CASE" });
    const meddled = (
      [
        { type: "KEEP_CASE" },
        { type: "SWAP_CASE" },
        { type: "DECLINE_OFFER" },
        { type: "ACCEPT_DEAL" },
      ] satisfies GameAction[]
    ).reduce(gameReducer, ended);

    expect(meddled).toEqual(ended);
  });
});

describe("the ending after a Deal", () => {
  it("keeps the Player's Case identified so it can be revealed", () => {
    const offered = finishRound(atRoundOne());
    const dealt = gameReducer(offered, { type: "ACCEPT_DEAL" });

    expect(dealt.outcome).toBe("deal");
    expect(dealt.finalCaseId).toBe(dealt.playerCaseId);
    expect(dealt.winnings).toBe(offered.offers.at(-1)!.amount);
  });

  it("never marks the Player's Case as opened", () => {
    const dealt = gameReducer(finishRound(atRoundOne()), {
      type: "ACCEPT_DEAL",
    });

    expect(dealt.cases.find((c) => c.id === dealt.playerCaseId)?.opened).toBe(
      false,
    );
  });
});

describe("playing again", () => {
  it("clears the ending and reshuffles the board", () => {
    const ended = gameReducer(atSwapDecision(), { type: "KEEP_CASE" });
    const fresh = gameReducer(ended, { type: "NEW_GAME" });

    expect(fresh.phase).toBe("intro");
    expect(fresh.winnings).toBeNull();
    expect(fresh.outcome).toBeNull();
    expect(fresh.playerCaseId).toBeNull();
    expect(fresh.offers).toHaveLength(0);
    expect(fresh.cases.every((c) => !c.opened)).toBe(true);
    expect(valuesOrder(fresh)).not.toEqual(valuesOrder(ended));
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
