import { expect, test } from "@playwright/test";
import {
  acceptOffer,
  openCase,
  pickPlayerCase,
  playRoundToOffer,
  readBoard,
  startGame,
} from "./board";
import { CASES_PER_ROUND } from "../lib/config";

test.describe("the rules the board must never break", () => {
  test("the player's case is set aside and can never be opened", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 12);

    // No control exists for it anywhere on the board.
    await expect(
      page.getByRole("button", { name: "Open case 12", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Case 12 is yours, set aside"),
    ).toBeAttached();

    // It is shown separately, still sealed, and stays that way through a Round.
    await expect(page.getByText("Your case", { exact: true })).toBeVisible();
    await playRoundToOffer(page);

    const board = await readBoard(page);
    expect(board.opened.map((c) => c.id)).not.toContain(12);
    expect(board.sealedIds).not.toContain(12);
    await expect(
      page.getByRole("button", { name: "Open case 12", exact: true }),
    ).toHaveCount(0);
  });

  test("an opened case loses its control and keeps its value on show", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 1);
    await openCase(page, 2);

    await expect(
      page.getByRole("button", { name: "Open case 2", exact: true }),
    ).toHaveCount(0);

    const board = await readBoard(page);
    const opened = board.opened.find((c) => c.id === 2);
    expect(opened).toBeDefined();
    expect(board.ladder).toContain(opened?.value);
    expect(board.eliminated).toContain(opened?.value);
  });

  test("each round opens exactly the number of cases it announces", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 3);

    let running = 0;
    for (let round = 1; round <= CASES_PER_ROUND.length; round++) {
      const before = await readBoard(page);
      expect(before.status).toMatch(
        new RegExp(`^Round ${round} . open ${CASES_PER_ROUND[round - 1]} more`),
      );

      const atOffer = await playRoundToOffer(page);
      running += CASES_PER_ROUND[round - 1];
      expect(atOffer.opened).toHaveLength(running);

      if (round < CASES_PER_ROUND.length) {
        await page.getByRole("button", { name: "No deal", exact: true }).click();
      }
    }

    // 5+4+3+2+1+1+1+1 = 18, leaving the player's case and exactly one rival.
    expect(running).toBe(18);
  });

  test("taking the deal ends the game at the amount on the table", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 9);

    const atOffer = await playRoundToOffer(page);
    const offered = atOffer.offer as number;
    expect(offered).toBeGreaterThan(0);

    await acceptOffer(page);

    const over = await readBoard(page);
    expect(over.phase).toBe("gameOver");
    await expect(page.getByText("You took the deal")).toBeVisible();

    const shown = await page.evaluate(() => {
      const section = Array.from(document.querySelectorAll("section")).find((s) =>
        (s.textContent ?? "").includes("You took the deal"),
      );
      return Number(
        (section?.querySelectorAll("p")[1]?.textContent ?? "").replace(/[^0-9]/g, ""),
      );
    });
    expect(shown).toBe(offered);

    // The board stops accepting input the moment the game is over.
    await expect(page.getByRole("button", { name: /^Open case/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
  });

  test("only opened cases carry a value in the grid", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 5);
    await playRoundToOffer(page);

    const board = await readBoard(page);

    // Every tile has a body panel; only an opened one has anything written on
    // it. A sealed Case that rendered its value - even hidden behind the lid -
    // would hand the board away to anyone who opened devtools.
    const printed = await page.evaluate(() => {
      const grid = Array.from(document.querySelectorAll("ul")).find((ul) =>
        ul.className.includes("grid-cols-4"),
      );
      return Array.from(grid?.querySelectorAll(".case-body") ?? [])
        .map((el) => (el.textContent ?? "").trim())
        .filter((text) => text.length > 0)
        .map((text) => Number(text.replace(/[^0-9]/g, "")));
    });

    expect(printed.sort((a, b) => a - b)).toEqual(
      board.opened.map((c) => c.value).sort((a, b) => a - b),
    );
    expect(printed).toHaveLength(5);
  });

  test("play again deals a different board", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await pickPlayerCase(page, 4);
    const first = await playRoundToOffer(page);
    await acceptOffer(page);

    await page.getByRole("button", { name: "Play again" }).click();
    await startGame(page);
    await pickPlayerCase(page, 4);
    const second = await playRoundToOffer(page);

    expect(second.opened).toHaveLength(first.opened.length);
    // Same Cases opened in the same order, so a different set of values out of
    // them means the shuffle really did move.
    expect(first.opened.map((c) => c.id)).toEqual(second.opened.map((c) => c.id));
    expect(second.opened.map((c) => c.value)).not.toEqual(
      first.opened.map((c) => c.value),
    );
  });

  test("every fresh session is dealt the identical opening board", async ({
    browser,
  }) => {
    const read = async () => {
      const context = await browser.newContext({ reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto("/");
      await startGame(page);
      await pickPlayerCase(page, 1);
      await openCase(page, 2);
      await openCase(page, 3);
      const board = await readBoard(page);
      await context.close();
      return board.opened.map((c) => `${c.id}:${c.value}`).sort();
    };

    // FIRST_BOARD_SEED is a constant, so this is expected - it is asserted so
    // that it is a decision on the record rather than a surprise.
    expect(await read()).toEqual(await read());
  });
});
