import { formatPeso } from "@/lib/money";
import type { Case } from "@/lib/game";

interface CaseTileProps {
  readonly briefcase: Case;
  /** Null when the tile is not selectable in the current phase. */
  readonly onSelect: ((caseId: number) => void) | null;
  readonly label: string;
}

/**
 * One Case. Sealed it catches the key light; opened it goes flat and dead,
 * showing what the player gave up. Ticket 07 rotates the lid off the sealed
 * state — until then it swaps directly.
 */
export function CaseTile({ briefcase, onSelect, label }: CaseTileProps) {
  const content = briefcase.opened ? (
    <span className="tabular text-[11px] leading-none text-bone-faint sm:text-xs">
      {formatPeso(briefcase.value)}
    </span>
  ) : (
    <span className="tabular font-display text-2xl leading-none text-bone/90 sm:text-3xl">
      {briefcase.id}
    </span>
  );

  const shape =
    "relative flex aspect-[5/4] w-full items-center justify-center rounded-md";

  if (briefcase.opened) {
    return (
      <div
        className={`${shape} border border-stage-edge/60 bg-stage/60`}
        aria-label={`Case ${briefcase.id}, opened, ${formatPeso(briefcase.value)}`}
      >
        {content}
      </div>
    );
  }

  if (!onSelect) {
    return (
      <div className={`case-tile ${shape}`} aria-label={label}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(briefcase.id)}
      aria-label={label}
      className={`case-tile ${shape} cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot`}
    >
      {content}
    </button>
  );
}
