import {
  CASES_PER_ROUND,
  DEFAULT_TOP_PRIZE,
  ROUND_COUNT,
} from "./config";
import { buildLadder } from "./ladder";
import { makeOffer } from "./offer";
import { shuffle } from "./rng";

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

/** One Offer the Bank has made. The factor is kept for playtesting. */
export interface Offer {
  readonly round: number;
  readonly amount: number;
  readonly factor: number;
  readonly wildSwing: boolean;
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
  /** What the player walked away with. Null until the game ends. */
  readonly winnings: number | null;
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
    winnings: null,
    seed: shuffled.seed,
  };
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
  | { readonly type: "DECLINE_OFFER" };

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

      const cases = state.cases.map((c) =>
        c.id === action.caseId ? { ...c, opened: true } : c,
      );

      const openedThisRound =
        cases.filter((c) => c.opened).length -
        casesOpenedBeforeRound(state.round);
      const roundIsDone = openedThisRound >= CASES_PER_ROUND[state.round - 1];

      if (!roundIsDone) return { ...state, cases };

      const inPlay = cases.filter((c) => !c.opened).map((c) => c.value);
      const rolled = makeOffer(inPlay, state.round, state.seed);

      return {
        ...state,
        cases,
        phase: "offer",
        seed: rolled.seed,
        offers: [
          ...state.offers,
          {
            round: state.round,
            amount: rolled.amount,
            factor: rolled.factor,
            wildSwing: rolled.wildSwing,
          },
        ],
      };
    }

    case "ACCEPT_DEAL": {
      if (state.phase !== "offer") return state;
      return {
        ...state,
        phase: "gameOver",
        winnings: state.offers.at(-1)!.amount,
      };
    }

    case "DECLINE_OFFER":
      if (state.phase !== "offer") return state;
      return state.round >= ROUND_COUNT
        ? { ...state, phase: "swap" }
        : { ...state, phase: "opening", round: state.round + 1 };
  }
}
