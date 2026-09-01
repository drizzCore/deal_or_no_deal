import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  declineOffer,
  inPlay,
  mean,
  pickPlayerCase,
  playRoundToOffer,
  readBoard,
  startGame,
} from "./board";
import {
  OFFER_CAP_OF_BEST_IN_PLAY,
  OFFER_COEFFICIENTS,
  ROUND_COUNT,
} from "../lib/config";

interface RoundSample {
  readonly round: number;
  readonly worst: number;
  readonly best: number;
  readonly expectedValue: number;
  readonly offer: number;
  readonly factor: number;
  readonly capBinding: boolean;
  readonly evFell: boolean;
}

interface GameSample {
  readonly topPrize: number;
  readonly playerCaseId: number;
  readonly rounds: RoundSample[];
  readonly finalTwo: number[];
}

/**
 * Plays one game to the final two, refusing every Offer, checking the Offer
 * contract at each Round and returning what the Bank did.
 */
async function playAndMeasure(page: Page, playerCase: number): Promise<GameSample> {
  await startGame(page);
  await pickPlayerCase(page, playerCase);

  const rounds: RoundSample[] = [];
  let previous: { ev: number; offer: number } | null = null;
  let topPrize = 0;

  for (let round = 1; round <= ROUND_COUNT; round++) {
    const board = await playRoundToOffer(page);
    topPrize = board.topPrize;

    const live = inPlay(board);
    const amount = board.offer as number;
    const worst = Math.min(...live);
    const best = Math.max(...live);
    const ev = mean(live);

    // The two rules the Bank can never break, on every board.
    expect(
      amount,
      `top prize ${board.topPrize}, round ${round}: offer must beat the worst in play`,
    ).toBeGreaterThan(worst);
    expect(
      amount,
      `top prize ${board.topPrize}, round ${round}: offer must stay under the cap`,
    ).toBeLessThanOrEqual(best * OFFER_CAP_OF_BEST_IN_PLAY);

    if (previous) {
      if (ev < previous.ev) {
        expect(
          amount,
          `top prize ${board.topPrize}, round ${round}: the board got worse, the offer must not rise`,
        ).toBeLessThanOrEqual(previous.offer);
      } else if (ev > previous.ev) {
        expect(
          amount,
          `top prize ${board.topPrize}, round ${round}: the board got better, the offer must not fall`,
        ).toBeGreaterThanOrEqual(previous.offer);
      }
    }

    rounds.push({
      round,
      worst,
      best,
      expectedValue: ev,
      offer: amount,
      factor: amount / ev,
      capBinding: amount >= Math.floor(best * OFFER_CAP_OF_BEST_IN_PLAY),
      evFell: previous ? ev < previous.ev : false,
    });

    previous = { ev, offer: amount };
    await declineOffer(page);
  }

  const atSwap = await readBoard(page);
  expect(atSwap.phase).toBe("swap");
  const finalTwo = inPlay(atSwap);

  await page.getByRole("button", { name: /^Keep case \d+$/ }).click();
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();

  return { topPrize, playerCaseId: playerCase, rounds, finalTwo };
}

test("the offer curve holds its shape across many boards", async ({ page }, info) => {
  test.setTimeout(600_000);

  await page.goto("/");

  const games: GameSample[] = [];
  const BOARDS = 6;

  for (let i = 0; i < BOARDS; i++) {
    if (i > 0) await page.getByRole("button", { name: "Play again" }).click();
    games.push(await playAndMeasure(page, 1 + i));
  }

  // Every Round of every board produced an Offer inside its contract; the
  // per-round assertions above did the work. What is left is the shape.
  const byRound = OFFER_COEFFICIENTS.map((coefficient, index) => {
    const samples = games.map((g) => g.rounds[index]);
    const factors = samples.map((s) => s.factor);
    return {
      round: index + 1,
      coefficient,
      meanFactor: mean(factors),
      minFactor: Math.min(...factors),
      maxFactor: Math.max(...factors),
      capBound: samples.filter((s) => s.capBinding).length,
      draggedDown: samples.filter((s) => s.evFell).length,
    };
  });

  // The Bank is never wildly generous: even after the Round 8 coefficient of
  // 1.05, no Offer should approach twice the board.
  for (const row of byRound) {
    expect(row.maxFactor, `round ${row.round} paid too far over the odds`).toBeLessThan(1.6);
    expect(row.minFactor, `round ${row.round} paid suspiciously little`).toBeGreaterThan(0.1);
  }

  // The curve must climb: what the Bank pays in the last round beats the first.
  expect(byRound[7].meanFactor).toBeGreaterThan(byRound[0].meanFactor);

  mkdirSync("test-results", { recursive: true });
  const report = { boards: BOARDS, byRound, games };
  writeFileSync("test-results/balance.json", JSON.stringify(report, null, 2));
  await info.attach("balance", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
});
