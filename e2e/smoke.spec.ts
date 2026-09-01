import { expect, test } from "@playwright/test";
import { openCase, pickPlayerCase, readBoard, startGame } from "./board";
import { DEFAULT_TOP_PRIZE } from "../lib/config";

test.describe("first contact", () => {
  test("the page loads onto the ready card", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Deal or No Deal");
    await expect(
      page.getByRole("heading", { name: "DEAL OR NO DEAL" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "READY?" })).toBeVisible();

    const board = await readBoard(page);
    expect(board.phase).toBe("intro");
    expect(board.status).toBe("Twenty cases. One is yours.");
  });

  test("the board is twenty sealed cases over a twenty rung ladder", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);

    const board = await readBoard(page);

    expect(board.sealedIds).toHaveLength(20);
    expect([...board.sealedIds].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
    expect(board.opened).toHaveLength(0);
    expect(board.playerCaseId).toBeNull();

    // The Prize Ladder: twenty distinct values, strictly ascending, anchored
    // at 1 and topped by the prize named in the header.
    expect(board.ladder).toHaveLength(20);
    expect(new Set(board.ladder).size).toBe(20);
    expect([...board.ladder].sort((a, b) => a - b)).toEqual(board.ladder);
    expect(board.ladder[0]).toBe(1);
    expect(board.ladder[19]).toBe(DEFAULT_TOP_PRIZE);
    expect(board.topPrize).toBe(DEFAULT_TOP_PRIZE);
    expect(board.eliminated).toHaveLength(0);
  });

  test("a full opening sequence logs no console or page errors", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        problems.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));

    await page.goto("/", { waitUntil: "networkidle" });
    await startGame(page);
    await pickPlayerCase(page, 7);
    await openCase(page, 1);
    await openCase(page, 2);

    // Hydration mismatches are the specific risk here: the board is seeded so
    // the server and client agree, but useMediaQuery reports false on the
    // server and corrects on hydration.
    const ignorable = /favicon|Download the React DevTools|webkit|Autoplay|AudioContext|preload/i;
    expect(problems.filter((p) => !ignorable.test(p))).toEqual([]);
  });
});
