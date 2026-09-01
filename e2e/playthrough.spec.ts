import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  declineOffer,
  inPlay,
  mean,
  playRoundToOffer,
  pickPlayerCase,
  readBoard,
  startGame,
  type Board,
} from "./board";
import {
  CASES_PER_ROUND,
  OFFER_CAP_OF_BEST_IN_PLAY,
  OFFER_COEFFICIENTS,
  ROUND_COUNT,
} from "../lib/config";

interface RoundRecord {
  readonly round: number;
  readonly opened: number;
  readonly inPlayCount: number;
  readonly worst: number;
  readonly best: number;
  readonly expectedValue: number;
  readonly offer: number;
  /** What the Bank actually paid as a multiple of Expected Value. */
  readonly factor: number;
  readonly coefficient: number;
  readonly capBinding: boolean;
  readonly floorBinding: boolean;
}

/**
 * One complete game, played by refusing every Offer.
 *
 * The Offer contract is checked at every Round against a board reconstructed
 * from the DOM, so the assertions here are about what the Bank told the player
 * versus what the player could see — not about the reducer's internals, which
 * the unit tests already cover.
 */
test("eight rounds of no deal, then the final two", async ({ page }, info) => {
  test.setTimeout(180_000);

  await page.goto("/");
  await startGame(page);
  await pickPlayerCase(page, 7);

  const opening = await readBoard(page);
  expect(opening.playerCaseId).toBe(7);
  expect(opening.sealedIds).toHaveLength(19);
  expect(opening.status).toMatch(/^Round 1 . open 5 more cases$/);

  const ladder = opening.ladder;
  const records: RoundRecord[] = [];
  let previous: { ev: number; offer: number } | null = null;
  let openedBefore = 0;

  for (let round = 1; round <= ROUND_COUNT; round++) {
    const board: Board = await playRoundToOffer(page);

    expect(board.status).toBe(
      `Round ${round} complete. The bank is calling.`,
    );

    // The Round opened exactly the number of Cases it advertised.
    const openedThisRound = board.opened.length - openedBefore;
    expect(openedThisRound).toBe(CASES_PER_ROUND[round - 1]);
    openedBefore = board.opened.length;

    // The Prize Ladder's struck-through rungs and the opened Cases are two
    // renderings of the same fact. They must never disagree.
    expect([...board.eliminated].sort((a, b) => a - b)).toEqual(
      [...board.opened.map((c) => c.value)].sort((a, b) => a - b),
    );
    expect(board.ladder).toEqual(ladder);

    const live = inPlay(board);
    expect(live).toHaveLength(20 - board.opened.length);
    // The Player's Case is In Play and counts toward the anchor.
    expect(live.length).toBe(board.sealedIds.length + 1);

    const offer = board.offer;
    expect(offer).not.toBeNull();
    const amount = offer as number;

    const worst = Math.min(...live);
    const best = Math.max(...live);
    const ev = mean(live);
    const cap = best * OFFER_CAP_OF_BEST_IN_PLAY;

    // ADR 0005: an Offer must beat the worst outcome still possible, and may
    // never reach the best, or the decision stops being a decision.
    expect(amount, `round ${round} offer must beat the worst in play`).toBeGreaterThan(worst);
    expect(amount, `round ${round} offer must not reach the cap`).toBeLessThanOrEqual(cap);
    expect(amount).toBeGreaterThanOrEqual(1);

    // ADR 0006: the Offer may never move against the board.
    if (previous) {
      if (ev < previous.ev) {
        expect(
          amount,
          `round ${round}: expected value fell, the offer must not rise`,
        ).toBeLessThanOrEqual(previous.offer);
      } else if (ev > previous.ev) {
        expect(
          amount,
          `round ${round}: expected value rose, the offer must not fall`,
        ).toBeGreaterThanOrEqual(previous.offer);
      }
    }

    // The history table restates every Offer so far, in order.
    expect(board.history.map((row) => row.round)).toEqual(
      Array.from({ length: round }, (_, i) => i + 1),
    );
    expect(board.history[round - 1].amount).toBe(amount);

    records.push({
      round,
      opened: board.opened.length,
      inPlayCount: live.length,
      worst,
      best,
      expectedValue: ev,
      offer: amount,
      factor: amount / ev,
      coefficient: OFFER_COEFFICIENTS[round - 1],
      capBinding: amount >= Math.floor(cap),
      floorBinding: amount <= worst + Math.max(1, worst * 0.02),
    });

    previous = { ev, offer: amount };
    await declineOffer(page);
  }

  // Eighteen Cases opened; the player's and one other survive.
  const atSwap = await readBoard(page);
  expect(atSwap.phase).toBe("swap");
  expect(atSwap.opened).toHaveLength(18);
  expect(atSwap.sealedIds).toHaveLength(1);
  expect(atSwap.status).toBe("Two cases left. Yours, and one other.");

  const finalTwo = inPlay(atSwap);
  expect(finalTwo).toHaveLength(2);

  await page.getByRole("button", { name: /^Keep case \d+$/ }).click();

  const over = await readBoard(page);
  expect(over.phase).toBe("gameOver");
  await expect(page.getByText(`You kept case ${atSwap.playerCaseId}`)).toBeVisible();

  // Whatever they walked away with has to be one of the two Cases left.
  const winnings = await page.evaluate(() => {
    const section = Array.from(document.querySelectorAll("section")).find((s) =>
      (s.textContent ?? "").includes("You kept case"),
    );
    const amount = section?.querySelectorAll("p")[1]?.textContent ?? "";
    return Number(amount.replace(/[^0-9]/g, ""));
  });
  expect(finalTwo).toContain(winnings);

  mkdirSync("test-results", { recursive: true });
  const analysis = { ladder, playerCaseId: opening.playerCaseId, records, finalTwo, winnings };
  writeFileSync("test-results/offer-analysis.json", JSON.stringify(analysis, null, 2));
  await info.attach("offer-analysis", {
    body: JSON.stringify(analysis, null, 2),
    contentType: "application/json",
  });
});
