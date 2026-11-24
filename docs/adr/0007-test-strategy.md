# ADR-0007 — Test strategy: e2e environment, determinism and network doubles

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Deciders | Human (G3) |
| Motivated by | `CLAUDE.md` §8 and §10 · PDF ("unit tests of relevant logic", "at least one end-to-end test of the full flow") · G3-3 · REQ-01.21, REQ-02.8, REQ-03.21, REQ-03.24, REQ-03.26 · verification plans of US-01 §8, US-02 §8 and US-03 §8 |

## Context and problem

The three specs leave to G3 where and how the tests run: which environment the e2e runs against, how the date and the time zone are fixed (AC-01.17 to AC-01.19, AC-02.9), how failures and malformed data from Strapi are simulated, and how content changes are tested (ADR-0003 §5: interception plus a manual check in G5, G3-3). Without this decision, date-dependent tests would fail as time passes and some ACs would remain "manual".

## Decision drivers

- Determinism: no test depends on the real day or on the machine's time zone.
- The e2e must test the same surface as production: nginx with the allowlist, headers and production build (D4, ADR-0003).
- Tools already verified: Vitest with `jsdom` (Angular's default runner) and Playwright 1.65.1 with the system Chrome (`channel: 'chrome'`); no new dependencies.
- No back doors in the app: no `?today=` or hidden flags (same criterion as REQ-03.21).

## Considered options

**E2E environment**

1. **E1. Full `docker compose` stack** (nginx + production build + Strapi with seed) at `http://localhost:8080`.
2. **E2. `ng serve` + local Strapi**, with the development proxy.

**Date and time zone**

1. **T1. Injection in the app** (`CLOCK`) for the unit tests, and in the e2e `page.clock.setFixedTime` + the Playwright context's `timezoneId`.
2. **T2. Test parameter or flag in the app** (`?today=2026-11-22`).
3. **T3. Seed data chosen so that it does not cross any boundary** near the real date, without fixing the clock.

**Failures and malformed data from Strapi**

1. **N1. Interception with `page.route`** in the e2e, and `HttpTestingController` or a fake `CmsClient` in the unit tests.
2. **N2. Seed variants** (another database with broken data).

## Decision

Chosen option: **E1 + T1 + N1**. N1 also covers the content-change ACs (ADR-0003 §5, G3-3), and the real change in Strapi is checked by hand in G5.

**Unit (Vitest, `jsdom`, `frontend/**/*.spec.ts`, Angular Developer):**

- Pure functions without TestBed: validators, age and year rules, `reconcileStep1`, `evaluateStep1`, `computeFinalPrice`, `formatPrice`, plan ordering, `maskDocument`, `createQuoteNumber`, DTO → domain mappers, Blocks mapper.
- "Today" always as a parameter (`YYYY-MM-DD`). `todayLocal(now: Date)` is the only function that reads the time zone. Its AC-01.19 test sets `process.env.TZ = 'America/Bogota'` and then restores it. Node applies the change of `process.env.TZ` at runtime on Windows too since v16.2.0. If the Vitest *pool* does not respect it in some environment, that file is run with `TZ` in the process environment variable.
- Components with zoneless TestBed (the default), `await fixture.whenStable()`, fake `CmsClient`, in-memory `WIZARD_STORAGE`, fixed `CLOCK` and `PAYMENT_DELAY_MS = 0`.
- Test names: `it('AC-0X.n …')` or `it('REQ-0X.n …')` (Skill `sdd-traceability` §5).

**E2E (Playwright, `e2e/`, QA Engineer):**

- `baseURL: 'http://localhost:8080'` (nginx). It is started beforehand with `docker compose up -d` and the run waits until `/api/countries` responds. `use.channel: 'chrome'`.
- Projects:
  - `flow`: full flow for CO (required by the PDF) and for CL.
  - `states`: loading, error, empty and malformed by interception.
  - `content-changes`: content-change ACs by interception over the real response (`route.fetch()` + `route.fulfill()`, ADR-0003 §5). It does not write to Strapi or use credentials, and it can run in parallel.
  - `a11y-responsive`: keyboard and viewports 320, 375 and 1280.
- **Content-change ACs (G3-3):**

  | AC | Automated test | Check of the real change in Strapi |
  |---|---|---|
  | AC-01.3 | Interception of C4 (published field added) and reload | Manual in G5: new field published in the admin (`docs/qa/manual-check.md`) |
  | AC-01.10 | Interception of C4 (field removed and `order` swapped) and reload | Covered indirectly by the manual check of the new field in G5 |
  | AC-01.11 | Against the real Strapi: seed draft field not visible; no request carries `status` or `publicationFilter` | Not needed: the seed already contains the draft |
  | AC-01.31 | Interception of C3 (CL continue text) and reload; CO unchanged | Covered indirectly by the manual check in G5 |
  | AC-02.25 | Interception of C5 and C6 (order, recommended, base price, factor) and reload | Manual in G5: plan deactivated in the admin (`docs/qa/manual-check.md`) |

  For these ACs the e2e report states "automated by interception + G5 manual check", with a link to `docs/qa/manual-check.md`.
- **Clock:** `page.clock.setFixedTime(new Date('2026-11-22T12:00:00'))` before `page.goto`. It fixes `Date.now()` and `new Date()`, and does **not** affect timers, so the 1500 ms of the payment run normally.
- **AC-01.19:** context with `timezoneId: 'America/Bogota'` and `page.clock.setFixedTime(new Date('2026-11-23T01:00:00Z'))` (20:00 local time on the 22nd).
- **Network:** `page.route` with a predicate on `URL.pathname` (e.g. `url => url.pathname === '/api/plans'`), because a glob must match the full URL, query included. It is used for `route.fulfill` (malformed bodies, 500, 30 plans), to modify the real response with `route.fetch()` or to introduce a controlled delay (loading state). Simulated responses follow the v5 format of api-contracts.
- **Security:** a fixture registers `page.on('request')` and checks that every request to `/api` is `GET` and carries no `Authorization` (AC-01.30, AC-02.31, AC-03.24).
- **Evidence:** the report (`docs/qa/e2e-report.md`) pastes the command and the real output. All tests can be run after `docker compose up`, without credentials or prior steps.

## Consequences

- **Positive:**
  - The e2e tests the artifact that is delivered: production build, real nginx with the allowlist and `no-store`, and Strapi with the seed.
  - Deterministic tests with no test code inside the app.
  - All ACs for unusual states and content changes are automated by interception, without alternative databases or credentials. No AC is left "Not executed" for anyone who clones the repository.
  - The e2e tests do not modify the demo database.
- **Negative:**
  - The e2e needs Docker running and takes longer than with `ng serve`; a frontend change requires rebuilding the image before the e2e.
  - `page.clock.setFixedTime` fixes the date for the whole page; a test that needs time to advance for `Date` must use `install` and `runFor` (and then the timers are also controlled).
  - Interception tests the app's reaction to a simulated response, not that Strapi produces it when publishing. For the PDF's content-change scenarios (AC-01.3, AC-02.25), that real integration is only checked by hand in G5, and that evidence is not repeated on every run (G3-3).
  - The time zone test depends on the behavior of `process.env.TZ` in the Vitest *pool*; it has not been run yet.
- **Risks and mitigation:**
  - *Modified responses diverge from Strapi's real format:* it always starts from the real response (`route.fetch()`) and only the scenario's data is changed.

### Confirmation

- `npm test` in `frontend/` and `npx playwright test` in `e2e/` with the output pasted in `docs/qa/` (`CLAUDE.md` §6). No tests skipped for lack of configuration.
- AC-01.3, AC-01.10, AC-01.11, AC-01.31 and AC-02.25 appear in the e2e report as executed by interception, and `docs/qa/manual-check.md` (G5) records the real change in Strapi: a new published field and a deactivated plan.
- Review: `grep -rn "today=\|__TEST__\|isE2E" frontend/src` with no results.

## Pros and cons of the options

### E1. `docker compose` stack (chosen)

- For: same surface as production; validates nginx and the headers.
- Against: slower; depends on Docker.

### E2. `ng serve`

- For: fast for iterating.
- Against: does not test nginx or the production build; a broken allowlist or cache rule would go unnoticed. It is still useful for the developer to iterate, not for evidence.

### T1. Injected clock + Playwright clock (chosen)

- For: no changes in the app; official Playwright API; time zone per context.
- Against: two mechanisms (unit and e2e) to keep consistent.

### T2. Date flag in the app

- For: simple.
- Against: a back door in production; contradicts the criterion of REQ-03.21 (no URL parameters or hidden flags).

### T3. Seed without nearby boundaries

- For: nothing needs to be fixed.
- Against: the exact-boundary ACs (AC-01.17, AC-01.18, E3 of US-02) require a specific date; it would expire as the years pass.

### N1. Interception (chosen)

- For: deterministic, no credentials, covers cases Strapi does not allow publishing and the content changes (G3-3).
- Against: it can diverge from the real format if Strapi changes. This is mitigated by starting from the real response (`route.fetch()`) or from fixtures captured from the seed. It does not test that Strapi produces the response on publishing (manual check in G5).

### N2. Seed variants

- For: real Strapi data.
- Against: several databases and container restarts; slow and fragile; Strapi rejects much of that data on validation.

## References

Consulted on 2026-11-22:

- Playwright, Clock (`setFixedTime` only affects `Date`; `install`, `runFor`): https://playwright.dev/docs/clock
- Playwright, test options (`timezoneId`, `channel`, `baseURL`): https://playwright.dev/docs/api/class-testoptions
- Playwright, network (`page.route`, glob over the full URL, modifying responses with `route.fetch()` + `route.fulfill()`): https://playwright.dev/docs/network
- Angular, testing (Vitest with `jsdom` by default): https://angular.dev/guide/testing
- Angular, `ng test`: https://angular.dev/cli/test
- Angular, zoneless in `TestBed` and `whenStable`: https://angular.dev/guide/zoneless
- Node.js, `TZ` variable (the change of `process.env.TZ` applies on Windows since v16.2.0): https://nodejs.org/api/cli.html#tz
- Versions: Playwright 1.65.1 and Vitest 5.1.1, verified locally (`docs/phase-1/analysis.md`).

> Translated into English on 2026-11-23 (D16); no content change.
