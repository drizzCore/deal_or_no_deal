"use client";

import { useMemo, useReducer, useState } from "react";
import { useGameAudio } from "./hooks/useGameAudio";
import { CaseGrid } from "./components/CaseGrid";
import { GameOver } from "./components/GameOver";
import { LadderColumn } from "./components/LadderColumn";
import { OfferHistory } from "./components/OfferHistory";
import { OfferPanel } from "./components/OfferPanel";
import { PlayerCase } from "./components/PlayerCase";
import { SoundControl } from "./components/SoundControl";
import { SwapDecision } from "./components/SwapDecision";
import { ROUND_COUNT, TOP_PRIZE_PRESETS } from "@/lib/config";
import {
  bestRefusedOffer,
  casesLeftToOpen,
  gameReducer,
  newGame,
  otherRemainingCase,
  type GameState,
} from "@/lib/game";
import { formatPeso } from "@/lib/money";

/**
 * A fixed seed for the first paint so the server and client agree on the board.
 * Every reshuffle after that advances the seed already held in state.
 */
const FIRST_BOARD_SEED = 20260727;

function statusFor(game: GameState): string {
  switch (game.phase) {
    case "intro":
      return "Twenty cases. One is yours.";
    case "pickingCase":
      return "Pick the case you'll keep.";
    case "opening": {
      const left = casesLeftToOpen(game);
      return `Round ${game.round} — open ${left} more ${left === 1 ? "case" : "cases"}`;
    }
    case "offer":
      return `Round ${game.round} complete. The bank is calling.`;
    case "swap":
      return "Two cases left. Yours, and one other.";
    case "gameOver":
      return "Game over.";
  }
}

export default function Home() {
  const [game, dispatch] = useReducer(
    gameReducer,
    { seed: FIRST_BOARD_SEED },
    newGame,
  );

  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioSettings = useMemo(() => ({ muted, volume }), [muted, volume]);
  const { unlock, play } = useGameAudio(game, audioSettings);

  const eliminated = useMemo(
    () =>
      new Set(game.cases.filter((c) => c.opened).map((c) => c.value)),
    [game.cases],
  );

  const half = Math.ceil(game.ladder.length / 2);
  const lowRungs = game.ladder.slice(0, half);
  const highRungs = game.ladder.slice(half);

  const playerCase = game.cases.find((c) => c.id === game.playerCaseId);
  const currentOffer = game.offers.at(-1);
  const otherCase = otherRemainingCase(game);

  const heldCase = game.cases.find((c) => c.id === game.finalCaseId);
  // After a Deal there is nothing they turned down — only their own Case.
  const forgoneCase =
    game.outcome === "deal"
      ? null
      : (game.cases.find((c) => !c.opened && c.id !== game.finalCaseId) ??
        null);
  const mode =
    game.phase === "pickingCase"
      ? "pick"
      : game.phase === "opening"
        ? "open"
        : "idle";

  const onSelect = (caseId: number) =>
    dispatch(
      game.phase === "pickingCase"
        ? { type: "PICK_PLAYER_CASE", caseId }
        : { type: "OPEN_CASE", caseId },
    );

  const ladders = (
    <>
      <LadderColumn values={lowRungs} eliminated={eliminated} />
      <LadderColumn values={highRungs} eliminated={eliminated} align="right" />
    </>
  );

  return (
    <main className="stage-wash relative flex flex-1 flex-col items-center px-4 pt-6 pb-12 sm:px-6">
      <header className="flex w-full max-w-5xl flex-col gap-3 border-b border-stage-edge pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-none tracking-wide text-bone sm:text-4xl">
            DEAL OR NO DEAL
          </h1>
          <p className="mt-1.5 text-sm text-bone-dim">{statusFor(game)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SoundControl
            muted={muted}
            volume={volume}
            onMutedChange={setMuted}
            onVolumeChange={setVolume}
          />
          <span className="mr-1 text-xs tracking-wide text-bone-faint uppercase">
            Top prize
          </span>
          {TOP_PRIZE_PRESETS.map((prize) => {
            const active = prize === game.topPrize;
            return (
              <button
                key={prize}
                type="button"
                onClick={() => {
                  play("uiClick");
                  dispatch({ type: "NEW_GAME", topPrize: prize });
                }}
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
            onClick={() => {
              play("uiClick");
              dispatch({ type: "NEW_GAME" });
            }}
            className="rounded-sm border border-stage-edge px-2.5 py-1.5 text-xs text-bone-dim transition-colors hover:border-brass-dim hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
          >
            New game
          </button>
        </div>
      </header>

      <div className="mt-6 grid w-full max-w-5xl gap-5 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
        {/* On phones the ladder sits above the board. Ticket 10 pins it to the
            viewport properly; this is the honest interim layout. */}
        <div className="grid grid-cols-2 gap-x-4 lg:hidden">{ladders}</div>

        <div className="hidden lg:block">
          <LadderColumn values={lowRungs} eliminated={eliminated} />
        </div>

        <div className="flex flex-col gap-5">
          <CaseGrid
            cases={game.cases}
            playerCaseId={game.playerCaseId}
            mode={mode}
            onSelect={onSelect}
          />

          {playerCase && <PlayerCase briefcase={playerCase} />}

          {game.phase === "offer" && currentOffer && (
            <>
              <OfferPanel
                offer={currentOffer}
                isFinalOffer={game.round >= ROUND_COUNT}
                onDeal={() => dispatch({ type: "ACCEPT_DEAL" })}
                onNoDeal={() => dispatch({ type: "DECLINE_OFFER" })}
              />
              <OfferHistory
                offers={game.offers}
                bestRefused={bestRefusedOffer(game)}
              />
            </>
          )}

          {game.phase === "swap" && playerCase && otherCase && (
            <SwapDecision
              playerCase={playerCase}
              otherCase={otherCase}
              onKeep={() => dispatch({ type: "KEEP_CASE" })}
              onSwap={() => dispatch({ type: "SWAP_CASE" })}
            />
          )}

          {game.phase === "gameOver" && heldCase && (
            <GameOver
              game={game}
              heldCase={heldCase}
              forgoneCase={forgoneCase}
              onPlayAgain={() => dispatch({ type: "NEW_GAME" })}
            />
          )}
        </div>

        <div className="hidden lg:block">
          <LadderColumn
            values={highRungs}
            eliminated={eliminated}
            align="right"
          />
        </div>
      </div>

      {game.phase === "intro" && (
        // Fixed, not absolute: <main> is taller than the viewport, so an
        // absolute overlay centres against the page and puts the start button
        // below the fold on short screens.
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-stage/85 px-6 py-8 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-lg border border-stage-edge bg-stage-lift p-6 text-center">
            <h2 className="font-display text-2xl tracking-wide text-bone">
              READY?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-bone-dim">
              Keep one case. Open the rest across eight rounds. The bank will
              try to buy you out — take the money, or hold your nerve.
            </p>
            <button
              type="button"
              onClick={() => {
                // The gesture that satisfies the browser's autoplay policy.
                void unlock();
                dispatch({ type: "START" });
              }}
              className="mt-5 w-full rounded-sm bg-brass px-4 py-2.5 text-sm font-medium text-stage transition-colors hover:bg-brass-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
            >
              Start the game
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
