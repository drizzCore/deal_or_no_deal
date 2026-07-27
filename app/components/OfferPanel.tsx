import type { Offer } from "@/lib/game";
import { formatPeso } from "@/lib/money";

interface OfferPanelProps {
  readonly offer: Offer;
  readonly isFinalOffer: boolean;
  readonly onDeal: () => void;
  readonly onNoDeal: () => void;
}

/** The moment of each Round: what the Bank will pay to make this stop. */
export function OfferPanel({
  offer,
  isFinalOffer,
  onDeal,
  onNoDeal,
}: OfferPanelProps) {
  return (
    <section className="rounded-lg border border-brass-dim bg-stage-lift/80 p-5 text-center">
      <p className="text-xs tracking-[0.2em] text-brass uppercase">
        The bank offers
      </p>

      <p className="tabular mt-2 font-display text-4xl leading-none text-brass-hot sm:text-5xl">
        {formatPeso(offer.amount)}
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onDeal}
          className="rounded-sm bg-brass px-6 py-2.5 text-sm font-semibold tracking-wide text-stage uppercase transition-colors hover:bg-brass-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
        >
          Deal
        </button>
        <button
          type="button"
          onClick={onNoDeal}
          className="rounded-sm border border-bone-faint px-6 py-2.5 text-sm font-semibold tracking-wide text-bone uppercase transition-colors hover:border-bone hover:bg-stage-edge focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
        >
          No deal
        </button>
      </div>

      <p className="mt-3 text-xs text-bone-faint">
        {isFinalOffer
          ? "Say no and you go to the final two."
          : "Say no and the next round begins."}
      </p>
    </section>
  );
}
