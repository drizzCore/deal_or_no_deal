const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** ₱18,942 — never centavos, anywhere in the game. */
export function formatPeso(amount: number): string {
  return peso.format(amount);
}
