import type { Case } from "@/lib/game";
import { CaseTile } from "./CaseTile";

interface PlayerCaseProps {
  readonly briefcase: Case;
}

/** The Case the player is holding, set apart from the board and never openable. */
export function PlayerCase({ briefcase }: PlayerCaseProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-brass-dim/60 bg-stage-lift/60 p-3">
      <div className="w-20 shrink-0 sm:w-24">
        <CaseTile
          briefcase={briefcase}
          onSelect={null}
          label={`Your case, number ${briefcase.id}, sealed`}
        />
      </div>
      <div>
        <p className="text-xs tracking-wide text-brass uppercase">Your case</p>
        <p className="mt-0.5 text-sm text-bone-dim">
          Sealed until the end of the game.
        </p>
      </div>
    </div>
  );
}
