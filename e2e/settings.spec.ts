import { expect, test, type Page } from "@playwright/test";
import { pickPlayerCase, playRoundToOffer, readBoard, startGame } from "./board";

const openSettings = async (page: Page) => {
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
};

test.describe("settings", () => {
  test("opens, closes on escape and on the backdrop", async ({ page }) => {
    await page.goto("/");
    await startGame(page);

    await openSettings(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Settings" })).toHaveCount(0);

    await openSettings(page);
    await page.getByRole("button", { name: "Close settings" }).click();
    await expect(page.getByRole("dialog", { name: "Settings" })).toHaveCount(0);
  });

  test("changing the top prize before play rebuilds the ladder at once", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);

    const before = await readBoard(page);
    expect(before.ladder[19]).toBe(10000);

    await openSettings(page);
    const dialog = page.getByRole("dialog", { name: "Settings" });
    await dialog.getByRole("button", { name: "100,000" }).click();

    // Nothing is at stake before a Case is picked, so it applies without a
    // prompt and dismisses the panel itself.
    await expect(page.getByText("starts a new game")).toHaveCount(0);
    await expect(dialog).toHaveCount(0);

    const after = await readBoard(page);
    expect(after.topPrize).toBe(100000);
    expect(after.ladder[19]).toBe(100000);
    expect(after.ladder[0]).toBe(1);
    expect(new Set(after.ladder).size).toBe(20);
    expect([...after.ladder].sort((a, b) => a - b)).toEqual(after.ladder);
  });

  test("changing the top prize mid-game asks before discarding the game", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 2);
    await playRoundToOffer(page);

    await openSettings(page);
    const dialog = page.getByRole("dialog", { name: "Settings" });
    await dialog.getByRole("button", { name: "1,000,000" }).click();

    await expect(page.getByText("starts a new game")).toBeVisible();

    // Backing out leaves the game exactly where it was.
    await dialog.getByRole("button", { name: "Keep playing" }).click();
    await page.getByRole("button", { name: "Close settings" }).click();

    const kept = await readBoard(page);
    expect(kept.phase).toBe("offer");
    expect(kept.topPrize).toBe(10000);
    expect(kept.opened).toHaveLength(5);

    // Confirming starts over on the new ladder.
    await openSettings(page);
    await dialog.getByRole("button", { name: "1,000,000" }).click();
    await dialog.getByRole("button", { name: "Start new game" }).click();

    // A new game rewinds all the way to the ready card, not to case-picking.
    const fresh = await readBoard(page);
    expect(fresh.phase).toBe("intro");
    expect(fresh.topPrize).toBe(1000000);
    expect(fresh.ladder[19]).toBe(1000000);
    expect(fresh.opened).toHaveLength(0);
    expect(fresh.playerCaseId).toBeNull();
  });

  test("muting disables the volume slider", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await openSettings(page);

    const dialog = page.getByRole("dialog", { name: "Settings" });
    const volume = dialog.getByRole("slider");
    await expect(volume).toBeEnabled();

    await dialog.getByRole("button", { name: "Off", exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: "Off", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(volume).toBeDisabled();

    await dialog.getByRole("button", { name: "On", exact: true }).click();
    await expect(volume).toBeEnabled();
  });

  test("reveal speed and motion are recorded as pressed choices", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);
    await openSettings(page);
    const dialog = page.getByRole("dialog", { name: "Settings" });

    await dialog.getByRole("button", { name: "Fast" }).click();
    await expect(dialog.getByRole("button", { name: "Fast" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(dialog.getByRole("button", { name: "Normal" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await dialog.getByRole("button", { name: "Reduced" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");

    await dialog.getByRole("button", { name: "Full motion" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "full");

    await dialog.getByRole("button", { name: "Match my device" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/);
  });

  test("settings survive a new game started from the panel", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 6);
    await openSettings(page);

    const dialog = page.getByRole("dialog", { name: "Settings" });
    await dialog.getByRole("button", { name: "Fast" }).click();
    await dialog.getByRole("button", { name: "Start a new game" }).click();

    const fresh = await readBoard(page);
    expect(fresh.phase).toBe("intro");

    // The ready card has to be cleared before the header is reachable again -
    // see the known issue below.
    await startGame(page);

    await openSettings(page);
    await expect(dialog.getByRole("button", { name: "Fast" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  /**
   * KNOWN ISSUE - this test is expected to fail.
   *
   * The ready card is `fixed inset-0 z-10` and the header is in normal flow
   * beneath it, so the Settings button cannot be clicked while the card is up.
   * That is every cold load, and again after every new game or Play again.
   * Top Prize is precisely the setting a player wants *before* starting, and
   * the only way to reach it is to start a game, change it, and be thrown back
   * to the card. Delete the `test.fail` when the header is lifted above the
   * overlay.
   */
  test("settings can be opened from the ready card", async ({ page }) => {
    test.fail(true, "the ready card overlay covers the header");

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "READY?" })).toBeVisible();

    await page
      .getByRole("button", { name: "Settings" })
      .click({ timeout: 3_000 });
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  });
});
