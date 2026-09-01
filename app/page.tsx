"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { useCaseOpening } from "./hooks/useCaseOpening";
import { useGameAudio } from "./hooks/useGameAudio";
import { CaseGrid } from "./components/CaseGrid";
import { GameOver } from "./components/GameOver";
import { LadderColumn } from "./components/LadderColumn";
import { OfferHistory } from "./components/OfferHistory";
import { OfferPanel } from "./components/OfferPanel";
import { PlayerCase } from "./components/PlayerCase";
import { RevealEffects } from "./components/RevealEffects";
import { RoundIntro } from "./components/RoundIntro";
import { SettingsPanel } from "./components/SettingsPanel";
import { useSettings } from "./hooks/useSettings";
import { SwapDecision } from "./components/SwapDecision";
import {
  AMBIENT_TONE_GAIN,
  beatDurationMs,
  CASES_PER_ROUND,
  REVEAL_SPEEDS,
  ROUND_COUNT,
  TIMING,
} from "@/lib/config";
import {
  bestRefusedOffer,
  boardTone,
  casesLeftToOpen,
  gameReducer,
  newGame,
  otherRemainingCase,
  tierFor,
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

  const { settings, update, reducedMotion } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const audioSettings = useMemo(
    () => ({ muted: settings.muted, volume: settings.volume }),
    [settings.muted, settings.volume],
  );
  const { unlock, play, stop } = useGameAudio(game, audioSettings);

  const armTension = useCallback(() => play("tension"), [play]);
  const disarmTension = useCallback(() => stop("tension"), [stop]);
  const openCase = useCallback(
    (caseId: number) => dispatch({ type: "OPEN_CASE", caseId }),
    [],
  );

  const { armingCaseId, arm, cancel, busy } = useCaseOpening({
    onOpen: openCase,
    onArm: armTension,
    onDisarm: disarmTension,
  });

  const revealSpeed = settings.revealSpeed;
  const speedScale = REVEAL_SPEEDS[revealSpeed];

  const lastBeatMs = game.lastReveal
    ? beatDurationMs({
        tier: game.lastReveal.tier,
        round: game.lastReveal.round,
        speed: revealSpeed,
        reducedMotion,
      })
    : TIMING.tensionBeatMs;

  // High-Tier openings shake the stage. Alternating the class by reveal parity
  // restarts the animation without a reflow hack.
  const shakeClass =
    !reducedMotion && game.lastReveal?.tier === "high"
      ? game.lastReveal.sequence % 2 === 0
        ? "shake-a"
        : "shake-b"
      : "";

  // The board is locked until the Round's announcement has played. Tracked by
  // which Round the player has already seen announced, so no timer is needed —
  // the card reports its own animation ending.
  const [roundAnnounced, setRoundAnnounced] = useState<number | null>(null);
  const announcingRound =
    game.phase === "opening" && roundAnnounced !== game.round;

  // Stable within a Round, which is the granularity the card is keyed at.
  const announceRoundDone = useCallback(
    () => setRoundAnnounced(game.round),
    [game.round],
  );

  const startFreshGame = (topPrize?: number) => {
    cancel();
    play("uiClick");
    setRoundAnnounced(null);
    dispatch({ type: "NEW_GAME", ...(topPrize ? { topPrize } : {}) });
  };

  const eliminated = useMemo(
    () =>
      new Set(game.cases.filter((c) => c.opened).map((c) => c.value)),
    [game.cases],
  );

  const half = Math.ceil(game.ladder.length / 2);
  const lowRungs = game.ladder.slice(0, half);
  const highRungs = game.ladder.slice(half);

  // Gain is a presentation choice, applied here so boardTone stays an honest
  // measure of the board rather than something tuned for how it looks.
  const tone = Math.max(
    -1,
    Math.min(1, boardTone(game) * AMBIENT_TONE_GAIN),
  );

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

  const onSelect = (caseId: number) => {
    if (game.phase === "pickingCase") {
      dispatch({ type: "PICK_PLAYER_CASE", caseId });
      return;
    }
    // Opening runs through the tension beat rather than dispatching directly.
    // The Tier is known before the lid moves, so the beat can be sized to it —
    // dread runs long, relief runs short.
    const tier = tierFor(game, caseId);
    arm(
      caseId,
      beatDurationMs({ tier, round: game.round, speed: revealSpeed, reducedMotion }),
    );
  };

  return (
    <>
    <main
      className={`stage-wash relative flex flex-1 flex-col items-center px-4 pt-6 pb-12 sm:px-6 ${shakeClass}`}
      style={
        {
          "--lid-ms": `${Math.round(TIMING.lidOpenMs * speedScale)}ms`,
          "--spot-ms": `${Math.round(TIMING.spotlightMs * speedScale)}ms`,
          // Ambient tone. Never labelled, never explained — the room just
          // changes with the board.
          "--warm": Math.max(0, tone).toFixed(3),
          "--cool": Math.max(0, -tone).toFixed(3),
        } as React.CSSProperties
      }
    >
      {/*
        Lifted above the ready card's overlay (z-10). Without this the header
        is buried under it, and Settings — where the Top Prize lives — cannot
        be reached until a game has started, which is exactly the wrong way
        round: the prize is the one thing you want to set before you begin.
      */}
      <header className="relative z-20 flex w-full max-w-5xl flex-col gap-3 border-b border-stage-edge pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-none tracking-wide text-bone sm:text-4xl">
            DEAL OR NO DEAL
          </h1>
          <p className="mt-1.5 text-sm text-bone-dim">{statusFor(game)}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="tabular text-xs text-bone-faint">
            Playing for {formatPeso(game.topPrize)}
          </span>
          <button
            type="button"
            onClick={() => {
              play("uiClick");
              setSettingsOpen(true);
            }}
            aria-label="Settings"
            className="flex items-center gap-1.5 rounded-sm border border-stage-edge px-2.5 py-1.5 text-xs text-bone-dim transition-colors hover:border-brass-dim hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>
      </header>

      {/*
        On a phone the ladder is pinned and the board scrolls under it. It is
        the one thing that must never leave the screen: a Case opening means
        nothing if the player cannot see what it cost them. The status line
        rides along, because "open 2 more cases" is the other thing worth
        keeping in view.
      */}
      <div className="sticky top-0 z-20 -mx-4 w-screen border-b border-stage-edge bg-stage/95 px-4 pt-2 pb-2 backdrop-blur-sm lg:hidden">
        <p className="mb-1.5 text-[11px] leading-none text-bone-dim">
          {statusFor(game)}
        </p>
        <div className="grid grid-cols-2 gap-x-3">
          <LadderColumn values={lowRungs} eliminated={eliminated} compact />
          <LadderColumn
            values={highRungs}
            eliminated={eliminated}
            align="right"
            compact
          />
        </div>
      </div>

      <div className="mt-4 grid w-full max-w-5xl gap-5 lg:mt-6 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
        <div className="hidden lg:block">
          <LadderColumn values={lowRungs} eliminated={eliminated} />
        </div>

        <div className="flex flex-col gap-5">
          <CaseGrid
            cases={game.cases}
            playerCaseId={game.playerCaseId}
            mode={busy || announcingRound ? "idle" : mode}
            armingCaseId={armingCaseId}
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
              reducedMotion={reducedMotion}
              onPlayAgain={() => startFreshGame()}
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

    {/* Sibling of <main>, not a child: the shake puts a transform on <main>,
        which would otherwise trap this fixed overlay inside the page. */}
    <RevealEffects
      reveal={game.lastReveal}
      reducedMotion={reducedMotion}
      durationMs={lastBeatMs}
    />

    {announcingRound && (
      <RoundIntro
        key={game.round}
        round={game.round}
        casesToOpen={CASES_PER_ROUND[game.round - 1]}
        durationMs={Math.round(TIMING.roundIntroMs * speedScale)}
        onFinished={announceRoundDone}
      />
    )}

    {settingsOpen && (
      <SettingsPanel
        settings={settings}
        topPrize={game.topPrize}
        // Only prompt when there is real progress to lose.
        gameInProgress={
          game.playerCaseId !== null && game.phase !== "gameOver"
        }
        onChange={update}
        onTopPrize={(prize: number) => {
          startFreshGame(prize);
          setSettingsOpen(false);
        }}
        onNewGame={() => startFreshGame()}
        onClose={() => setSettingsOpen(false)}
      />
    )}
    </>
  );
}
