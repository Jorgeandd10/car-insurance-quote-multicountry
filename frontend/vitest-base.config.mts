import { defineConfig } from 'vitest/config';

/**
 * Extra Vitest options for `ng test` (`runnerConfig` in angular.json). The Angular builder keeps
 * the rest of the configuration (jsdom, includes, TestBed setup).
 *
 * The first routed test of each file loads the lazy chunks of the app; with the whole suite in
 * parallel on Windows it took 5.2–6.1 s, over the 5 s default. That is load time, not a hang.
 */
export default defineConfig({
  test: {
    testTimeout: 15_000,
  },
});
