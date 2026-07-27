import { DEFAULT_TOP_PRIZE } from "./config";
import { buildLadder } from "./ladder";
import { shuffle } from "./rng";

/** Which screen the game is on. Each phase has its own legal actions. */
export type Phase = "intro";

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
    seed: shuffled.seed,
  };
}

export type GameAction = {
  readonly type: "NEW_GAME";
  /** Omit to keep the Top Prize the current game is being played for. */
  readonly topPrize?: number;
};

/**
 * The single seam the game is tested through. Pure: the seed it needs comes
 * from the state it was handed, so dispatching never injects randomness.
 */
export function gameReducer(
  state: GameState,
  action: GameAction,
): GameState {
  switch (action.type) {
    case "NEW_GAME":
      return newGame({
        topPrize: action.topPrize ?? state.topPrize,
        seed: state.seed,
      });
  }
}
