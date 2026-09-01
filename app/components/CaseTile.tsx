import { formatPeso } from "@/lib/money";
import type { Case } from "@/lib/game";

interface CaseTileProps {
  readonly briefcase: Case;
  /** Null when the tile is not selectable in the current phase. */
  readonly onSelect: ((caseId: number) => void) | null;
  readonly label: string;
  /** True during the tension beat, before the lid moves. */
  readonly arming?: boolean;
}

/**
 * One Case: a metal lid over a dark interior. Opening rotates the lid away on
 * its top edge — the value is never swapped into place.
 *
 * The 3D subtree lives in an element that never changes type. The button is an
 * overlay rather than a wrapper, because swapping the wrapper from button to
 * div on open would remount the lid and destroy the transition mid-flight.
 */
export function CaseTile({
  briefcase,
  onSelect,
  label,
  arming = false,
}: CaseTileProps) {
  const selectable = onSelect !== null && !briefcase.opened;

  return (
    <div
      className={[
        "case-scene relative aspect-[5/4] w-full transition-transform duration-150",
        selectable ? "hover:-translate-y-0.5" : "",
      ].join(" ")}
    >
      <span className="sr-only">
        {briefcase.opened
          ? `Case ${briefcase.id}, opened, ${formatPeso(briefcase.value)}`
          : `Case ${briefcase.id}, sealed`}
      </span>

      <div
        aria-hidden
        className={[
          "case-3d",
          briefcase.opened ? "is-open" : "",
          arming ? "is-arming" : "",
        ].join(" ")}
      >
        {/* Ink on the cream tile, and the case number punched dark into the
            gold lid — both need to read against a light face now. */}
        <div className="case-face case-body">
          {/* Sized to the tile it sits on. The widest string is the 1,000,000
              board's top rung, which still clears a phone-width tile. */}
          <span className="tabular text-[13px] leading-none font-semibold text-tile-ink sm:text-base">
            {briefcase.opened ? formatPeso(briefcase.value) : ""}
          </span>
        </div>
        <div className="case-face case-lid">
          <span className="tabular font-display text-2xl leading-none text-stage sm:text-3xl">
            {briefcase.id}
          </span>
        </div>
      </div>

      {selectable && (
        <button
          type="button"
          onClick={() => onSelect(briefcase.id)}
          aria-label={label}
          className="absolute inset-0 z-10 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
        />
      )}
    </div>
  );
}
