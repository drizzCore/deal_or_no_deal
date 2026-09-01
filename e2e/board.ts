import { expect, type Page } from "@playwright/test";

/**
 * Reading the game through the DOM.
 *
 * Nothing here reaches into React. The board is reconstructed from what is
 * actually rendered — the Prize Ladder strip, the screen-reader labels on each
 * Case, the Offer panel — so a passing assertion means a player could have
 * seen the same thing. Where the DOM offers two routes to the same fact (the
 * struck-through rungs and the opened Cases both say what is gone) both are
 * read, and a test cross-checks them.
 */

export type Phase =
  | "intro"
  | "pick"
  | "opening"
  | "offer"
  | "swap"
  | "gameOver"
  | "unknown";

export interface OpenedCase {
  readonly id: number;
  readonly value: number;
}

export interface HistoryRow {
  readonly round: number;
  readonly amount: number;
  readonly change: string;
}

export interface Board {
  readonly phase: Phase;
  readonly status: string;
  readonly topPrize: number;
  /** All twenty rungs, ascending. */
  readonly ladder: number[];
  /** Rungs struck through on the Prize Ladder. */
  readonly eliminated: number[];
  readonly playerCaseId: number | null;
  readonly sealedIds: number[];
  readonly opened: OpenedCase[];
  /** The Offer on the table, or null outside the offer phase. */
  readonly offer: number | null;
  readonly history: HistoryRow[];
  readonly bestRefused: string | null;
}

/** Peso text to a number. Digits only, so symbol and separators drop out. */
export const money = (text: string): number =>
  Number(String(text).replace(/[^0-9]/g, ""));

export const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

export const mean = (values: readonly number[]): number =>
  sum(values) / values.length;

export async function readBoard(page: Page): Promise<Board> {
  const raw = await page.evaluate(() => {
    const num = (s: string | null | undefined) =>
      Number(String(s ?? "").replace(/[^0-9]/g, ""));
    const txt = (el: Element | null | undefined) =>
      (el?.textContent ?? "").replace(/\s+/g, " ").trim();

    const grid = Array.from(document.querySelectorAll("ul")).find((ul) =>
      ul.className.includes("grid-cols-4"),
    );
    const labels = grid
      ? Array.from(grid.querySelectorAll(".sr-only")).map((el) => txt(el))
      : [];

    let playerCaseId: number | null = null;
    const opened: { id: number; value: number }[] = [];
    const sealedIds: number[] = [];

    for (const label of labels) {
      const mine = /^Case (\d+) is yours/.exec(label);
      if (mine) {
        playerCaseId = Number(mine[1]);
        continue;
      }
      const isOpen = /^Case (\d+), opened, (.+)$/.exec(label);
      if (isOpen) {
        opened.push({ id: Number(isOpen[1]), value: num(isOpen[2]) });
        continue;
      }
      const sealed = /^Case (\d+), sealed/.exec(label);
      if (sealed) sealedIds.push(Number(sealed[1]));
    }

    // The pinned phone strip carries both halves of the Prize Ladder in one
    // container, low column then high, so its rungs come out already ascending.
    const strip = document.querySelector("div.sticky");
    const rungs = strip ? Array.from(strip.querySelectorAll("li")) : [];
    const ladder = rungs.map((li) => num(txt(li)));
    const eliminated = rungs
      .filter((li) => li.querySelector(".line-through") !== null)
      .map((li) => num(txt(li)));

    const body = txt(document.body);
    const buttons = Array.from(document.querySelectorAll("button")).map((b) =>
      txt(b),
    );
    const status = txt(document.querySelector("header p"));

    const sections = Array.from(document.querySelectorAll("section"));
    const offerSection = sections.find((s) =>
      txt(s).startsWith("The bank offers"),
    );
    const offer = offerSection
      ? num(txt(offerSection.querySelectorAll("p")[1]))
      : null;

    const table = document.querySelector("table");
    const history = table
      ? Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
          const cells = Array.from(tr.children).map((c) => txt(c));
          return {
            round: Number(cells[0]),
            amount: num(cells[1]),
            change: cells[2] ?? "",
          };
        })
      : [];

    const refused = /Best offer you turned down: (.+?) in round (\d+)/.exec(body);
    const prize = /Playing for ([^A-Za-z]+)/.exec(body);

    // The status line is the authority on the phase, not the Offer panel —
    // during the Bank's call the game is already in the offer phase but the
    // panel is deliberately still off screen.
    const phase = buttons.includes("Start the game")
      ? "intro"
      : offerSection
        ? "offer"
        : body.includes("The final two")
          ? "swap"
          : buttons.includes("Play again")
            ? "gameOver"
            : status.startsWith("Pick the case")
              ? "pick"
              : status.includes("bank is calling")
                ? "offer"
                : status.startsWith("Round")
                  ? "opening"
                  : "unknown";

    return {
      phase,
      status,
      topPrize: prize ? num(prize[1]) : 0,
      ladder,
      eliminated,
      playerCaseId,
      sealedIds,
      opened,
      offer,
      history,
      bestRefused: refused ? refused[0] : null,
    };
  });

  return raw as Board;
}

/** Values still In Play, derived from the Prize Ladder and what has opened. */
export function inPlay(board: Board): number[] {
  const gone = new Set(board.opened.map((c) => c.value));
  return board.ladder.filter((value) => !gone.has(value));
}

/**
 * Clicks through the ready card.
 *
 * The first tap of a session is the one that can land before React has
 * hydrated — in dev the page is served while the bundle is still compiling, so
 * the button is on screen with nothing behind it. Retrying until the board
 * actually appears is the only honest way to wait for that; it costs nothing
 * once the app is warm.
 */
export async function startGame(page: Page): Promise<void> {
  const start = page.getByRole("button", { name: "Start the game" });
  const board = page.getByRole("button", { name: "Keep case 1", exact: true });

  await expect(start).toBeVisible();
  await expect(async () => {
    if (await start.isVisible()) await start.click({ timeout: 2_000 });
    await expect(board).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 45_000 });
}

export async function pickPlayerCase(page: Page, id: number): Promise<void> {
  await page
    .getByRole("button", { name: `Keep case ${id}`, exact: true })
    .click();
  await page.waitForFunction(
    (caseId) => {
      const grid = Array.from(document.querySelectorAll("ul")).find((ul) =>
        ul.className.includes("grid-cols-4"),
      );
      return (grid?.textContent ?? "").includes(`Case ${caseId} is yours`);
    },
    id,
    { timeout: 15_000 },
  );
}

/**
 * Taps a Case and waits for its lid to have actually moved.
 *
 * The click only starts the tension beat — the Case is not open until the beat
 * elapses, and during it every tile loses its button. Waiting on the label
 * rather than a timeout is what keeps this honest at any reveal speed.
 */
export async function openCase(page: Page, id: number): Promise<void> {
  await page
    .getByRole("button", { name: `Open case ${id}`, exact: true })
    .click();
  await page.waitForFunction(
    (caseId) => {
      const grid = Array.from(document.querySelectorAll("ul")).find((ul) =>
        ul.className.includes("grid-cols-4"),
      );
      return (grid?.textContent ?? "").includes(`Case ${caseId}, opened,`);
    },
    id,
    { timeout: 30_000 },
  );
}

/**
 * Opens Cases until the Bank has named its price. Returns the board with the
 * Offer on the table — never mid-call, so callers can read `offer` directly.
 */
export async function playRoundToOffer(page: Page): Promise<Board> {
  for (let guard = 0; guard < 25; guard++) {
    const board = await readBoard(page);

    if (board.phase === "offer") {
      if (board.offer !== null) return board;
      // The Bank is still calling. Nothing is openable and the amount is not
      // on screen yet, so wait it out rather than clicking into a locked board.
      await waitForOfferPanel(page);
      continue;
    }

    const next = board.sealedIds.find((id) => id !== board.playerCaseId);
    if (next === undefined) break;
    await openCase(page, next);
  }
  throw new Error("Round never reached an Offer");
}

/** Waits for the Bank's call to finish and the amount to appear. */
export async function waitForOfferPanel(page: Page): Promise<void> {
  await page
    .locator("section")
    .filter({ hasText: "The bank offers" })
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
}

export async function declineOffer(page: Page): Promise<void> {
  await page.getByRole("button", { name: "No deal", exact: true }).click();
}

export async function acceptOffer(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Deal", exact: true }).click();
}

