import type { Offer } from "@/lib/game";
import { formatPeso } from "@/lib/money";

interface OfferHistoryProps {
  readonly offers: readonly Offer[];
  readonly bestRefused: Offer | null;
}

/**
 * What the Bank has said so far, and nothing else.
 *
 * Deliberately carries no Expected Value, odds, or any derived figure — those
 * would hand the player a solver and turn a nerve test into arithmetic. Every
 * number here is one they have already been shown.
 */
export function OfferHistory({ offers, bestRefused }: OfferHistoryProps) {
  if (offers.length === 0) return null;

  return (
    <section className="rounded-lg border border-stage-edge bg-stage/50 p-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Every offer the bank has made this game
          </caption>
          <thead>
            <tr className="text-bone-faint">
              <th scope="col" className="py-1 pr-3 font-normal tracking-wide uppercase">
                Round
              </th>
              <th scope="col" className="py-1 pr-3 text-right font-normal tracking-wide uppercase">
                Offer
              </th>
              <th scope="col" className="py-1 text-right font-normal tracking-wide uppercase">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer, index) => {
              const previous = offers[index - 1];
              const change = previous ? offer.amount - previous.amount : null;
              const isCurrent = index === offers.length - 1;

              return (
                <tr
                  key={offer.round}
                  className={
                    isCurrent
                      ? "bg-stage-lift text-bone"
                      : "text-bone-dim"
                  }
                >
                  <th
                    scope="row"
                    className="tabular py-1 pr-3 font-normal"
                  >
                    {offer.round}
                  </th>
                  <td className="tabular py-1 pr-3 text-right font-semibold">
                    {formatPeso(offer.amount)}
                  </td>
                  <td className="tabular py-1 text-right">
                    {change === null ? (
                      <span className="text-bone-faint">—</span>
                    ) : change === 0 ? (
                      <span className="text-bone-faint">no change</span>
                    ) : (
                      <span
                        className={change > 0 ? "text-rise" : "text-fall"}
                      >
                        {change > 0 ? "▲ +" : "▼ −"}
                        {formatPeso(Math.abs(change))}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {bestRefused && (
        <p className="mt-2 border-t border-stage-edge pt-2 text-xs text-bone-faint">
          Best offer you turned down:{" "}
          <span className="tabular font-semibold text-bone-dim">
            {formatPeso(bestRefused.amount)}
          </span>{" "}
          in round {bestRefused.round}
        </p>
      )}
    </section>
  );
}
