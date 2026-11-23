import { defineConfig } from '@playwright/test';

/**
 * E2E against the docker compose stack (ADR-0007, option E1): nginx + production build + Strapi
 * with the seed, at http://localhost:8080. Start it first with `docker compose up -d`.
 *
 * - System Chrome (`channel: 'chrome'`): no browser is downloaded (CLAUDE.md §4).
 * - Time zone America/Bogota and es-CO locale for every context; each test fixes the clock with
 *   `page.clock.setFixedTime` (support/fixtures.ts).
 * - No retries: a flaky test is a defect to explain, not to hide.
 * - Sized for the verified host (8 GB RAM, Strapi with SQLite in Docker on Windows): with 4 workers
 *   real responses took up to 10.4 s and the app correctly hit its 10 s timeout ("error de carga"),
 *   so 2 workers and 15 s waits (docs/qa/e2e-report.md). Assertions are unchanged.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './support/global-setup.ts',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: Number(process.env.E2E_WORKERS ?? 2),
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    channel: 'chrome',
    headless: true,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'flow', testMatch: 'flow/**/*.spec.ts' },
    { name: 'states', testMatch: 'states/**/*.spec.ts' },
    { name: 'content-changes', testMatch: 'content-changes/**/*.spec.ts' },
    { name: 'a11y-responsive', testMatch: 'a11y-responsive/**/*.spec.ts' },
  ],
});
