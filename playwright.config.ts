import { defineConfig, devices } from "@playwright/test";

/**
 * E2E harness for the game.
 *
 * The suite drives the real UI — there is no test hook into the reducer — so
 * every assertion is something a player could see. `reducedMotion: "reduce"`
 * is the default because the stylesheet collapses every animation to 0.01ms
 * under it and `beatDurationMs` returns TIMING.reducedMotionBeatMs, which
 * turns an eighteen-opening playthrough from ~40s of waiting into ~3s. Tests
 * that are *about* the animations opt back into full motion themselves.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL,
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /(responsive|smoke)\.spec\.ts/,
    },
  ],
  /**
   * A production build, not `next dev`.
   *
   * Under `next dev` the Turbopack HMR client cannot open its WebSocket in
   * this environment (`ERR_INVALID_HTTP_RESPONSE` on the handshake) and the
   * page never hydrates — the markup renders, but no button does anything. A
   * built server has no HMR socket, hydrates reliably, and is closer to what a
   * player actually loads.
   */
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
