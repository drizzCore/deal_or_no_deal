import {
  CASES_PER_ROUND,
  DEFAULT_TOP_PRIZE,
  MEDIUM_VARIANT_COUNT,
  ROUND_COUNT,
  TIER_EDGE_SIZE,
} from "./config";
import { buildLadder } from "./ladder";
import { makeOffer } from "./offer";
import { rollIndex, shuffle } from "./rng";

/**
 * Which screen the game is on. Each phase accepts only its own actions —
 * anything else is ignored, so an action can never arrive out of order.
 */
export type Phase =
  | "intro"
  | "pickingCase"
  | "opening"
  /** A Round has ended and the Bank is waiting on Deal or No Deal. */
  | "offer"
  /** Two Cases left, keep or swap. Its own phase, never a ninth Round. */
  | "swap"
  | "gameOver";

/** How a finished game ended. */
export type Outcome = "deal" | "kept" | "swapped";

/** The dramatic weight of a Case opening. */
export type Tier = "high" | "medium" | "low";

/** What just happened, for the presentation layer to react to. */
export interface Reveal {
  readonly caseId: number;
  readonly value: number;
  readonly tier: Tier;
  /** Which medium-suspense variant to play. Always 0 outside medium Tier. */
  readonly variant: number;
  readonly round: number;
  /** Increments every opening, so repeated Tiers still read as new events. */
  readonly sequence: number;
}

/** One Offer the Bank has made. */
export interface Offer {
  readonly round: number;
  readonly amount: number;
  /** Multiple of Expected Value actually paid, after clamping. Playtesting aid. */
  readonly factor: number;
  /**
   * What the board was worth when this Offer was made, so the next Offer can
   * tell whether it improved or got worse. **Never render this** — see
   * `OfferResult.expectedValue`.
   */
  readonly expectedValue: number;
}

export interface Case {
  /** Display number, 1-20. Stable for the life of a game. */
  readonly id: number;
  readonly value: number;
  readonly opened: boolean;
}

export interface GameState {
  readonly phase: Phase;
  readonly topPrize: number;
  /** The twenty values in play this game, ascending. */
  readonly ladder: readonly number[];
  readonly cases: readonly Case[];
  /** The Case the player is holding. Null until they choose. */
  readonly playerCaseId: number | null;
  /** 1-8. Meaningless before a Player's Case is picked. */
  readonly round: number;
  /** Every Offer made this game, oldest first. */
  readonly offers: readonly Offer[];
  /** The most recent Case opening. Null before the first one. */
  readonly lastReveal: Reveal | null;
  /** What the player walked away with. Null until the game ends. */
  readonly winnings: number | null;
  /** How the game ended. Null while it is still running. */
  readonly outcome: Outcome | null;
  /**
   * The Case the player was holding when the game ended. After a Deal this is
   * still their own Case — it is revealed for closure, not opened.
   */
  readonly finalCaseId: number | null;
  /** Advanced by every roll. The whole game is reproducible from its start value. */
  readonly seed: number;
}

export interface NewGameOptions {
  readonly topPrize?: number;
  readonly seed: number;
}

/** Deals a fresh board: builds the Prize Ladder and shuffles it into Cases. */
export function newGame({
  topPrize = DEFAULT_TOP_PRIZE,
  seed,
}: NewGameOptions): GameState {
  const ladder = buildLadder(topPrize);
  const shuffled = shuffle(ladder, seed);

  return {
    phase: "intro",
    topPrize,
    ladder,
    cases: shuffled.items.map((value, index) => ({
      id: index + 1,
      value,
      opened: false,
    })),
    playerCaseId: null,
    round: 1,
    offers: [],
    lastReveal: null,
    winnings: null,
    outcome: null,
    finalCaseId: null,
    seed: shuffled.seed,
  };
}

/**
 * The highest Offer the player has already turned down, or null in Round 1.
 *
 * Deliberately excludes the most recent Offer: during the `offer` phase that
 * one is still on the table and has not been refused. This is what makes the
 * "best so far" line a reminder of what they gave up rather than a restatement
 * of what they are looking at.
 */
export function bestRefusedOffer(state: GameState): Offer | null {
  const refused = state.offers.slice(0, -1);
  if (refused.length === 0) return null;
  return refused.reduce((best, offer) =>
    offer.amount > best.amount ? offer : best,
  );
}

/**
 * The dramatic weight of opening this Case, ranked against everything else
 * still openable — recalculated fresh every time, because the same value moves
 * between Tiers as the pool shrinks.
 *
 * The Player's Case is excluded: it can never be opened, so it has no business
 * influencing how the openable ones rank.
 */
export function tierFor(state: GameState, caseId: number): Tier {
  const openable = state.cases
    .filter((c) => !c.opened && c.id !== state.playerCaseId)
    .map((c) => c.value)
    .sort((a, b) => a - b);

  const target = state.cases.find((c) => c.id === caseId);
  if (!target) return "medium";

  const rank = openable.indexOf(target.value);
  if (rank >= openable.length - TIER_EDGE_SIZE) return "high";
  if (rank < TIER_EDGE_SIZE) return "low";
  return "medium";
}

/** The Case still In Play that the player is not holding. */
export function otherRemainingCase(state: GameState): Case | undefined {
  return state.cases.find((c) => !c.opened && c.id !== state.playerCaseId);
}

/** How many Cases every Round before this one accounted for. */
function casesOpenedBeforeRound(round: number): number {
  return CASES_PER_ROUND.slice(0, round - 1).reduce((sum, n) => sum + n, 0);
}

const openedCount = (state: GameState) =>
  state.cases.filter((c) => c.opened).length;

/** How many Cases the player still has to open this Round. */
export function casesLeftToOpen(state: GameState): number {
  if (state.phase !== "opening") return 0;
  const openedThisRound =
    openedCount(state) - casesOpenedBeforeRound(state.round);
  return CASES_PER_ROUND[state.round - 1] - openedThisRound;
}

/** The Cases the player may open right now. Never includes their own. */
export function openableCases(state: GameState): readonly Case[] {
  return state.cases.filter(
    (c) => !c.opened && c.id !== state.playerCaseId,
  );
}

export type GameAction =
  | {
      readonly type: "NEW_GAME";
      /** Omit to keep the Top Prize the current game is being played for. */
      readonly topPrize?: number;
    }
  | { readonly type: "START" }
  | { readonly type: "PICK_PLAYER_CASE"; readonly caseId: number }
  | { readonly type: "OPEN_CASE"; readonly caseId: number }
  /** Deal. Ends the game at the current Offer. */
  | { readonly type: "ACCEPT_DEAL" }
  /** No Deal. Next Round, or the Swap Decision after Round 8. */
  | { readonly type: "DECLINE_OFFER" }
  /** Hold the Case picked at the start. */
  | { readonly type: "KEEP_CASE" }
  /** Trade it for the last Case on the board. */
  | { readonly type: "SWAP_CASE" };

/**
 * The single seam the game is tested through. Pure: the seed it needs comes
 * from the state it was handed, so dispatching never injects randomness.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME":
      return newGame({
        topPrize: action.topPrize ?? state.topPrize,
        seed: state.seed,
      });

    case "START":
      if (state.phase !== "intro") return state;
      return { ...state, phase: "pickingCase" };

    case "PICK_PLAYER_CASE": {
      if (state.phase !== "pickingCase") return state;
      if (!state.cases.some((c) => c.id === action.caseId)) return state;
      return {
        ...state,
        phase: "opening",
        playerCaseId: action.caseId,
        round: 1,
      };
    }

    case "OPEN_CASE": {
      if (state.phase !== "opening") return state;
      if (action.caseId === state.playerCaseId) return state;

      const target = state.cases.find((c) => c.id === action.caseId);
      if (!target || target.opened) return state;

      // Ranked before the Case is marked open, so it counts itself.
      const tier = tierFor(state, action.caseId);
      const picked =
        tier === "medium"
          ? rollIndex(state.seed, MEDIUM_VARIANT_COUNT)
          : { value: 0, seed: state.seed };

      const cases = state.cases.map((c) =>
        c.id === action.caseId ? { ...c, opened: true } : c,
      );

      const reveal: Reveal = {
        caseId: action.caseId,
        value: target.value,
        tier,
        variant: picked.value,
        round: state.round,
        sequence: (state.lastReveal?.sequence ?? 0) + 1,
      };

      const openedThisRound =
        cases.filter((c) => c.opened).length -
        casesOpenedBeforeRound(state.round);
      const roundIsDone = openedThisRound >= CASES_PER_ROUND[state.round - 1];

      if (!roundIsDone) {
        return { ...state, cases, lastReveal: reveal, seed: picked.seed };
      }

      const inPlay = cases.filter((c) => !c.opened).map((c) => c.value);
      const rolled = makeOffer(inPlay, state.round, state.offers.at(-1) ?? null);

      return {
        ...state,
        cases,
        lastReveal: reveal,
        phase: "offer",
        seed: picked.seed,
        offers: [
          ...state.offers,
          {
            round: state.round,
            amount: rolled.amount,
            factor: rolled.factor,
            expectedValue: rolled.expectedValue,
          },
        ],
      };
    }

    case "ACCEPT_DEAL": {
      if (state.phase !== "offer") return state;
      return {
        ...state,
        phase: "gameOver",
        outcome: "deal",
        // Their Case is never opened — it is revealed at the ending for closure.
        finalCaseId: state.playerCaseId,
        winnings: state.offers.at(-1)!.amount,
      };
    }

    case "DECLINE_OFFER":
      if (state.phase !== "offer") return state;
      return state.round >= ROUND_COUNT
        ? { ...state, phase: "swap" }
        : { ...state, phase: "opening", round: state.round + 1 };

    case "KEEP_CASE":
    case "SWAP_CASE": {
      if (state.phase !== "swap") return state;

      const held =
        action.type === "KEEP_CASE"
          ? state.cases.find((c) => c.id === state.playerCaseId)
          : otherRemainingCase(state);
      if (!held) return state;

      return {
        ...state,
        phase: "gameOver",
        outcome: action.type === "KEEP_CASE" ? "kept" : "swapped",
        finalCaseId: held.id,
        winnings: held.value,
      };
    }
  }
}
