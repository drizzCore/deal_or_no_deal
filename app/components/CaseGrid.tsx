import type { Case } from "@/lib/game";

interface CaseGridProps {
  readonly cases: readonly Case[];
}

export function CaseGrid({ cases }: CaseGridProps) {
  return (
    <ul className="grid w-full grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3">
      {cases.map((briefcase) => (
        <li
          key={briefcase.id}
          className="case-tile relative flex aspect-[5/4] items-center justify-center rounded-md"
        >
          <span className="tabular font-display text-2xl leading-none text-bone/90 sm:text-3xl">
            {briefcase.id}
          </span>
        </li>
      ))}
    </ul>
  );
}
