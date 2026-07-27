import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import type { Case, GameState } from "@/lib/game";
import { formatPeso } from "@/lib/money";

/** Beats of the final reveal, in milliseconds. */
const OTHER_CASE_AT = 600;
const HELD_CASE_AT = 1900;

interface GameOverProps {
  readonly game: GameState;
  readonly heldCase: Case;
  /** The Case they turned down. Only exists after a Swap Decision. */
  readonly forgoneCase: Case | null;
  readonly onPlayAgain: () => void;
}

export function GameOver({
  game,
  heldCase,
  forgoneCase,
  onPlayAgain,
}: GameOverProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [tick, setTick] = useState(0);

  // The held Case is revealed last — it is the only beat of suspense left.
  useEffect(() => {
    if (reducedMotion) return;
    const timers = [
      setTimeout(() => setTick(1), OTHER_CASE_AT),
      setTimeout(() => setTick(2), HELD_CASE_AT),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  // Reduced motion skips straight to the end rather than setting state.
  const step = reducedMotion ? 2 : tick;
  const heldRevealed = step >= 2;
  const otherRevealed = step >= 1;

  const headline =
    game.outcome === "deal"
      ? "You took the deal"
      : game.outcome === "swapped"
        ? `You swapped into case ${heldCase.id}`
        : `You kept case ${heldCase.id}`;

  return (
    <section className="rounded-lg border border-brass-dim bg-stage-lift/80 p-5 text-center">
      <p className="text-xs tracking-[0.2em] text-brass uppercase">
        {headline}
      </p>

      {/* After a Deal the amount is the Offer they already saw, so there is
          nothing to hide. After a swap the winnings ARE the held Case, so
          showing them early would spoil the reveal below. */}
      <p className="tabular mt-2 font-display text-4xl leading-none text-brass-hot sm:text-5xl">
        {game.outcome === "deal" || heldRevealed
          ? formatPeso(game.winnings ?? 0)
          : "₱ ?"}
      </p>

      {forgoneCase && (
        <p className="mt-4 text-sm text-bone-dim">
          Case {forgoneCase.id} held{" "}
          <span className="tabular font-semibold text-bone">
            {otherRevealed ? formatPeso(forgoneCase.value) : "…"}
          </span>
        </p>
      )}

      <p className="mt-1 text-sm text-bone-dim">
        {game.outcome === "deal" ? "Your case" : `Case ${heldCase.id}`} held{" "}
        <span className="tabular font-semibold text-bone">
          {heldRevealed ? formatPeso(heldCase.value) : "…"}
        </span>
      </p>

      {heldRevealed && <Verdict game={game} heldCase={heldCase} />}

      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-5 rounded-sm bg-brass px-6 py-2.5 text-sm font-semibold tracking-wide text-stage uppercase transition-colors hover:bg-brass-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
      >
        Play again
      </button>
    </section>
  );
}

/** Whether the player called it right, stated plainly. */
function Verdict({ game, heldCase }: { game: GameState; heldCase: Case }) {
  const won = game.winnings ?? 0;

  if (game.outcome === "deal") {
    const difference = heldCase.value - won;
    return (
      <p className="mt-3 text-sm">
        {difference > 0 ? (
          <span className="text-bone-dim">
            Holding out was worth{" "}
            <span className="tabular text-bone">{formatPeso(difference)}</span>{" "}
            more. You dealt too early.
          </span>
        ) : difference < 0 ? (
          <span className="text-brass">
            Good call — the deal beat your case by{" "}
            <span className="tabular">{formatPeso(-difference)}</span>.
          </span>
        ) : (
          <span className="text-bone-dim">
            Dead even. The deal matched your case exactly.
          </span>
        )}
      </p>
    );
  }

  return null;
}
