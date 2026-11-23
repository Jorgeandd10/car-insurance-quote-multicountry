import { defineConfig } from 'vitest/config';

/**
 * Extra Vitest options for `ng test` (`runnerConfig` in angular.json). The Angular builder keeps
 * the rest of the configuration (jsdom, includes, TestBed setup).
 *
 * The first routed test of each file loads the lazy chunks of the app. With the whole suite in
 * parallel on Windows it took 5.2–6.1 s (phase 4b, over the 5 s default), and up to 19.6 s while
 * the e2e stack was running on the same machine (G4 corrections). That is load time, not a hang:
 * the other tests of the same files run in under 1 s. A real hang still fails, after 30 s.
 */
export default defineConfig({
  test: {
    testTimeout: 30_000,
  },
});
