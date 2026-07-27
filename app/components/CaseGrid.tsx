import type { Case } from "@/lib/game";
import { CaseTile } from "./CaseTile";

interface CaseGridProps {
  readonly cases: readonly Case[];
  readonly playerCaseId: number | null;
  /** "pick" while choosing the Player's Case, "open" during a Round. */
  readonly mode: "pick" | "open" | "idle";
  readonly onSelect: (caseId: number) => void;
}

export function CaseGrid({
  cases,
  playerCaseId,
  mode,
  onSelect,
}: CaseGridProps) {
  // Once picked, the Player's Case leaves the grid for its own pedestal.
  const onBoard = cases.filter((c) => c.id !== playerCaseId);

  return (
    <ul className="grid w-full grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3">
      {onBoard.map((briefcase) => (
        <li key={briefcase.id} className="contents">
          <CaseTile
            briefcase={briefcase}
            onSelect={mode === "idle" || briefcase.opened ? null : onSelect}
            label={
              mode === "pick"
                ? `Keep case ${briefcase.id}`
                : `Open case ${briefcase.id}`
            }
          />
        </li>
      ))}
    </ul>
  );
}
