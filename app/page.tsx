"use client";

import { useReducer } from "react";
import { CaseGrid } from "./components/CaseGrid";
import { LadderColumn } from "./components/LadderColumn";
import { TOP_PRIZE_PRESETS } from "@/lib/config";
import { gameReducer, newGame } from "@/lib/game";
import { formatPeso } from "@/lib/money";

/**
 * A fixed seed for the first paint so the server and client agree on the board.
 * Every reshuffle after that advances the seed already held in state.
 */
const FIRST_BOARD_SEED = 20260727;

/** Nothing is opened yet — Cases become openable in ticket 02. */
const NOTHING_ELIMINATED: ReadonlySet<number> = new Set();

export default function Home() {
  const [game, dispatch] = useReducer(
    gameReducer,
    { seed: FIRST_BOARD_SEED },
    newGame,
  );

  const half = Math.ceil(game.ladder.length / 2);
  const lowRungs = game.ladder.slice(0, half);
  const highRungs = game.ladder.slice(half);

  return (
    <main className="stage-wash flex flex-1 flex-col items-center px-4 pt-6 pb-12 sm:px-6">
      <header className="flex w-full max-w-5xl flex-col gap-3 border-b border-stage-edge pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-none tracking-wide text-bone sm:text-4xl">
            DEAL OR NO DEAL
          </h1>
          <p className="mt-1.5 text-sm text-bone-dim">
            Twenty cases. One is yours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs tracking-wide text-bone-faint uppercase">
            Top prize
          </span>
          {TOP_PRIZE_PRESETS.map((prize) => {
            const active = prize === game.topPrize;
            return (
              <button
                key={prize}
                type="button"
                onClick={() => dispatch({ type: "NEW_GAME", topPrize: prize })}
                className={[
                  "tabular rounded-sm px-2.5 py-1.5 text-xs transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot",
                  active
                    ? "bg-brass text-stage"
                    : "bg-stage-lift text-bone-dim hover:bg-stage-edge hover:text-bone",
                ].join(" ")}
              >
                {formatPeso(prize)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => dispatch({ type: "NEW_GAME" })}
            className="rounded-sm border border-stage-edge px-2.5 py-1.5 text-xs text-bone-dim transition-colors hover:border-brass-dim hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
          >
            Reshuffle
          </button>
        </div>
      </header>

      <div className="mt-6 grid w-full max-w-5xl gap-5 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
        {/* On phones the ladder sits above the board. Ticket 10 pins it to the
            viewport properly; this is the honest interim layout. */}
        <div className="grid grid-cols-2 gap-x-4 lg:hidden">
          <LadderColumn values={lowRungs} eliminated={NOTHING_ELIMINATED} />
          <LadderColumn
            values={highRungs}
            eliminated={NOTHING_ELIMINATED}
            align="right"
          />
        </div>

        <div className="hidden lg:block">
          <LadderColumn values={lowRungs} eliminated={NOTHING_ELIMINATED} />
        </div>

        <CaseGrid cases={game.cases} />

        <div className="hidden lg:block">
          <LadderColumn
            values={highRungs}
            eliminated={NOTHING_ELIMINATED}
            align="right"
          />
        </div>
      </div>
    </main>
  );
}
