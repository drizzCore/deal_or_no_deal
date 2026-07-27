import { BAND_COLOR, bandFor } from "@/lib/banknote";
import { formatPeso } from "@/lib/money";

interface LadderColumnProps {
  readonly values: readonly number[];
  /** Values already opened. Their rungs drain of colour. */
  readonly eliminated: ReadonlySet<number>;
  readonly align?: "left" | "right";
}

export function LadderColumn({
  values,
  eliminated,
  align = "left",
}: LadderColumnProps) {
  return (
    <ul className="flex flex-col gap-[3px]">
      {values.map((value) => {
        const gone = eliminated.has(value);
        return (
          <li
            key={value}
            className={[
              "flex items-center gap-2 rounded-[3px] py-1 transition-colors duration-500",
              align === "right" ? "flex-row-reverse pl-2" : "pr-2",
              gone ? "bg-transparent" : "bg-stage-lift/70",
            ].join(" ")}
          >
            <span
              aria-hidden
              className="h-4 w-[3px] shrink-0 rounded-full transition-colors duration-500"
              style={{
                backgroundColor: gone
                  ? "var(--color-bone-faint)"
                  : BAND_COLOR[bandFor(value)],
                opacity: gone ? 0.3 : 1,
              }}
            />
            <span
              className={[
                "tabular text-[13px] leading-none tracking-tight transition-colors duration-500 sm:text-sm",
                gone ? "text-bone-faint line-through" : "text-bone",
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
