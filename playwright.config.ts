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
/**
 * `localhost`, never `127.0.0.1`. Next's dev server rejects the HMR WebSocket
 * handshake for an origin it does not recognise, and in Next 16 the page then
 * never hydrates at all — the markup renders and no button does anything.
 * A production build is unaffected, but the two agree on `localhost`, so the
 * suite uses the hostname that works against either.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

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
   * Tests run against a production build — what a player actually loads,
   * without dev-only overlays or warnings in the way.
   *
   * `reuseExistingServer` means a `next dev` already listening on this port is
   * used as-is, so you can leave the dev server up and skip the rebuild while
   * iterating. Both work; only the build is guaranteed here.
   */
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
