import { expect, test } from "@playwright/test";
import {
  openCase,
  pickPlayerCase,
  playRoundToOffer,
  startGame,
} from "./board";

/**
 * The Prize Ladder is the one thing that must never leave the screen: a Case
 * opening means nothing if the player cannot see what it cost them.
 */
test.describe("layout", () => {
  test("the ladder stays on screen while the board scrolls", async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) >= 1024, "phone layout only");

    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 8);

    // Played to an Offer first: the Offer panel and history are what make the
    // page long enough to scroll. Straight after picking, a phone page is only
    // ~130px taller than the viewport and the strip never leaves its slot.
    await playRoundToOffer(page);

    const strip = page.locator("div.sticky");
    await expect(strip).toBeVisible();

    // It starts below the title block, where it belongs.
    const before = await strip.boundingBox();
    expect(before?.y).toBeGreaterThan(50);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);

    // Pinned to the top, and still showing the whole ladder.
    await expect(strip).toBeVisible();
    const after = await strip.boundingBox();
    expect(after?.y).toBeLessThanOrEqual(2);
    expect(await strip.locator("li").count()).toBe(20);

    // The status line rides along with it.
    await expect(strip.getByText(/^Round 1/)).toBeVisible();

    // The desktop side columns are not rendered at this width.
    const columns = page.locator("div.hidden.lg\\:block");
    await expect(columns.first()).toBeHidden();
  });

  test("the desktop layout puts the ladder in two side columns", async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) < 1024, "desktop layout only");

    await page.goto("/");
    await startGame(page);

    const columns = page.locator("div.hidden.lg\\:block");
    await expect(columns).toHaveCount(2);
    await expect(columns.first()).toBeVisible();
    await expect(columns.last()).toBeVisible();

    // The phone strip is present in the DOM but not shown.
    await expect(page.locator("div.sticky")).toBeHidden();
  });

  test("the board fits its viewport without sideways scrolling", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 8);
    await openCase(page, 1);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
