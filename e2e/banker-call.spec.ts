import { expect, test } from "@playwright/test";
import {
  openCase,
  pickPlayerCase,
  readBoard,
  startGame,
  waitForOfferPanel,
} from "./board";

/**
 * The Bank's call.
 *
 * These run at full motion — the point of the beat is that it takes time, and
 * the suite's default reduced-motion collapses it to nothing.
 */
test.describe("the bank's call", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("withholds the amount until both beats have played", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 7);

    // Round 1 opens five Cases; the fifth ends the Round and starts the call.
    for (const id of [1, 2, 3, 4, 5]) await openCase(page, id);
    const callStarted = Date.now();

    // The phone is ringing and there is no amount, and no decision, anywhere.
    const layer = page.locator(".banker-call-layer");
    await expect(layer).toHaveCount(1);
    await expect(
      page.locator("section").filter({ hasText: "The bank offers" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Deal", exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "No deal", exact: true }),
    ).toHaveCount(0);

    // Both beats are in the card, in order. They are always in the DOM and
    // cross-fade on opacity, so their presence is the content check; the wait
    // below is what proves the sequence actually takes time.
    await expect(layer).toContainText("THE BANKER IS CALLING");
    await expect(layer).toContainText(/THE BANKER.S OFFER IS/);

    // The game knows it is in the offer phase even while the panel is hidden.
    const during = await readBoard(page);
    expect(during.phase).toBe("offer");
    expect(during.offer).toBeNull();

    // Then the amount, and only then the decision.
    await waitForOfferPanel(page);
    const elapsed = Date.now() - callStarted;

    // TIMING.bankerCallMs is 2600 at normal speed. A floor well under that
    // still catches the panel being revealed immediately, without making the
    // test a stopwatch on a busy machine.
    expect(elapsed, "the call should hold the amount back").toBeGreaterThan(1500);

    const landed = await readBoard(page);
    expect(landed.offer).not.toBeNull();
    expect(landed.offer as number).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Deal", exact: true })).toBeVisible();
    await expect(layer).toHaveCount(0);
  });

  test("the board stays locked for the whole call", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 7);
    for (const id of [1, 2, 3, 4, 5]) await openCase(page, id);

    await expect(page.getByText("THE BANKER IS CALLING")).toBeVisible();

    // No Case is openable, and the overlay itself cannot be tapped through.
    await expect(page.getByRole("button", { name: /^Open case/ })).toHaveCount(0);
    const layer = page.locator(".banker-call-layer");
    await expect(layer).toHaveCSS("pointer-events", "none");

    await waitForOfferPanel(page);
  });

  test("the call is spent once per round, not on every render", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 7);
    for (const id of [1, 2, 3, 4, 5]) await openCase(page, id);
    await waitForOfferPanel(page);

    // Once the amount is up it stays up — the call does not replay behind it.
    await page.waitForTimeout(1500);
    await expect(page.locator(".banker-call-layer")).toHaveCount(0);
    await expect(
      page.locator("section").filter({ hasText: "The bank offers" }),
    ).toBeVisible();
  });
});
