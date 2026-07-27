"use client";

import type { Case } from "@/lib/game";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { CaseTile } from "./CaseTile";

interface CaseGridProps {
  readonly cases: readonly Case[];
  readonly playerCaseId: number | null;
  /** "pick" while choosing the Player's Case, "open" during a Round. */
  readonly mode: "pick" | "open" | "idle";
  /** The Case in its tension beat, if any. */
  readonly armingCaseId: number | null;
  readonly onSelect: (caseId: number) => void;
}

/** Matches the `sm:grid-cols-5` breakpoint below. */
const WIDE = "(min-width: 40rem)";

export function CaseGrid({
  cases,
  playerCaseId,
  mode,
  armingCaseId,
  onSelect,
}: CaseGridProps) {
  // Every Case keeps its slot for the whole game. Taking the Player's Case out
  // of the grid would reflow all nineteen others and destroy the board the
  // player has been reading — its slot becomes an empty socket instead.
  const columns = useMediaQuery(WIDE) ? 5 : 4;
  const rows = Math.max(1, Math.ceil(cases.length / columns));
  const armedIndex = cases.findIndex((c) => c.id === armingCaseId);
  const lit = armedIndex >= 0;

  return (
    <div className="relative">
      <div
        aria-hidden
        className={`spotlight ${lit ? "is-lit" : ""}`}
        style={
          lit
            ? {
                left: `${(((armedIndex % columns) + 0.5) / columns) * 100}%`,
                top: `${((Math.floor(armedIndex / columns) + 0.5) / rows) * 100}%`,
              }
            : undefined
        }
      />

      <ul className="grid w-full grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3">
        {cases.map((briefcase) =>
          briefcase.id === playerCaseId ? (
            <li key={briefcase.id}>
              <div className="case-socket flex aspect-[5/4] w-full items-center justify-center rounded-md">
                <span className="sr-only">
                  Case {briefcase.id} is yours, set aside
                </span>
                <span
                  aria-hidden
                  className="tabular font-display text-2xl leading-none text-brass-dim sm:text-3xl"
                >
                  {briefcase.id}
                </span>
              </div>
            </li>
          ) : (
            <li key={briefcase.id}>
              <CaseTile
                briefcase={briefcase}
                arming={briefcase.id === armingCaseId}
                onSelect={mode === "idle" || briefcase.opened ? null : onSelect}
                label={
                  mode === "pick"
                    ? `Keep case ${briefcase.id}`
                    : `Open case ${briefcase.id}`
                }
              />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
