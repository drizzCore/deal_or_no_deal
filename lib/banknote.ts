/**
 * Philippine banknotes have distinct colours, and the Prize Ladder borrows them:
 * each rung is keyed to the note you would actually be handed for that amount.
 *
 * This is what makes the board scannable at a glance — the player learns the
 * shape of what is left by colour, not by reading twenty numbers. Amounts below
 * ₱20 are coins, and get steel.
 */
export type BanknoteBand =
  | "coin"
  | "twenty"
  | "fifty"
  | "hundred"
  | "twoHundred"
  | "fiveHundred"
  | "thousand";

const BANDS: readonly { readonly from: number; readonly band: BanknoteBand }[] =
  [
    { from: 1000, band: "thousand" },
    { from: 500, band: "fiveHundred" },
    { from: 200, band: "twoHundred" },
    { from: 100, band: "hundred" },
    { from: 50, band: "fifty" },
    { from: 20, band: "twenty" },
    { from: 0, band: "coin" },
  ];

export function bandFor(amount: number): BanknoteBand {
  return BANDS.find(({ from }) => amount >= from)!.band;
}

/** Keyline colour per band, matching the note. */
export const BAND_COLOR: Readonly<Record<BanknoteBand, string>> = {
  coin: "#8A93A3",
  twenty: "#C8781E",
  fifty: "#B3453A",
  hundred: "#8B6BA8",
  twoHundred: "#3E8A5F",
  fiveHundred: "#D4A017",
  thousand: "#2E6FA8",
};
