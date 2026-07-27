import type { Case } from "@/lib/game";
import { formatPeso } from "@/lib/money";

interface SwapDecisionProps {
  readonly playerCase: Case;
  readonly otherCase: Case;
  readonly onKeep: () => void;
  readonly onSwap: () => void;
}

/**
 * The endgame. Its own screen with its own decision — never a ninth Round.
 * Both amounts are shown, but not which Case holds which.
 */
export function SwapDecision({
  playerCase,
  otherCase,
  onKeep,
  onSwap,
}: SwapDecisionProps) {
  const [low, high] = [playerCase.value, otherCase.value].sort((a, b) => a - b);

  return (
    <section className="rounded-lg border border-brass-dim bg-stage-lift/80 p-5 text-center">
      <p className="text-xs tracking-[0.2em] text-brass uppercase">
        The final two
      </p>

      <p className="mt-2 text-sm text-bone-dim">
        One of these holds{" "}
        <span className="tabular font-semibold text-bone">
          {formatPeso(high)}
        </span>
        . The other holds{" "}
        <span className="tabular font-semibold text-bone">
          {formatPeso(low)}
        </span>
        .
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onKeep}
          className="rounded-sm bg-brass px-6 py-2.5 text-sm font-semibold tracking-wide text-stage uppercase transition-colors hover:bg-brass-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
        >
          Keep case {playerCase.id}
        </button>
        <button
          type="button"
          onClick={onSwap}
          className="rounded-sm border border-bone-faint px-6 py-2.5 text-sm font-semibold tracking-wide text-bone uppercase transition-colors hover:border-bone hover:bg-stage-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
        >
          Swap for case {otherCase.id}
        </button>
      </div>

      <p className="mt-3 text-xs text-bone-faint">
        Whatever you are holding is what you win.
      </p>
    </section>
  );
}
