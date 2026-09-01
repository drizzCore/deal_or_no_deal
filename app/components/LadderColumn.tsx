import { BAND_COLOR, bandFor } from "@/lib/banknote";
import { formatPeso } from "@/lib/money";

interface LadderColumnProps {
  readonly values: readonly number[];
  /** Values already opened. Their rungs drain of colour. */
  readonly eliminated: ReadonlySet<number>;
  readonly align?: "left" | "right";
  /** Tightened for the pinned strip on a phone, where height is the scarce thing. */
  readonly compact?: boolean;
}

export function LadderColumn({
  values,
  eliminated,
  align = "left",
  compact = false,
}: LadderColumnProps) {
  return (
    <ul className={`flex flex-col ${compact ? "gap-px" : "gap-[3px]"}`}>
      {values.map((value) => {
        const gone = eliminated.has(value);
        return (
          <li
            key={value}
            className={[
              "flex items-center rounded-[3px] transition-colors duration-500",
              compact ? "gap-1.5 py-px" : "gap-2 py-1",
              align === "right"
                ? `flex-row-reverse ${compact ? "pl-1.5" : "pl-2"}`
                : compact
                  ? "pr-1.5"
                  : "pr-2",
              // A live rung is a cream card from the money board; a struck one
              // drains away to nothing on the stage.
              gone ? "bg-transparent" : "bg-tile",
            ].join(" ")}
          >
            <span
              aria-hidden
              className={`w-[3px] shrink-0 rounded-full transition-colors duration-500 ${compact ? "h-2.5" : "h-4"}`}
              style={{
                backgroundColor: gone
                  ? "var(--color-bone-faint)"
                  : BAND_COLOR[bandFor(value)],
                opacity: gone ? 0.3 : 1,
              }}
            />
            <span
              className={[
                "tabular leading-none tracking-tight transition-colors duration-500",
                compact ? "text-[11px]" : "text-[13px] sm:text-sm",
                gone
                  ? "text-bone-faint line-through"
                  : "font-semibold text-tile-ink",
              ].join(" ")}
            >
              {formatPeso(value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
