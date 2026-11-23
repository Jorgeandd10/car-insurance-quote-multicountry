# E2E test report — Phase 5

| Field | Value |
|---|---|
| Date | 2026-11-23 |
| Author | QA Engineer (subagent) |
| Branch | `phase-5/validation` (HEAD `8f763cb` at the time of the run; `e2e/` tests uncommitted) |
| Tested stack | `docker compose` already running: `web` image created 2026-11-23 01:15 −05 and `cms` image 01:11 −05. **Older than `40dfcae` (02:01) and `8f763cb` (02:13)**: see "Validity of this evidence" |
| Environment | Windows 11 · 8 logical CPUs · 8 GB RAM · Node 24.22.3 · `@playwright/test` 1.65.1 · system Google Chrome 159.0.8154.13 (`channel: 'chrome'`, no downloaded browsers) · Docker Compose v5.5.0 |
| Configuration | `e2e/playwright.config.ts`: `baseURL` `http://localhost:8080` (nginx), `timezoneId` `America/Bogota`, `locale` `es-CO`, clock `page.clock.setFixedTime(2026-11-22T17:00:00Z)` (12:00 in Bogotá) in every test, 2 workers, no retries |
| Plan | [`test-plan.md`](test-plan.md) · G5 template: [`manual-check.md`](manual-check.md) |

## Command

With the stack running (`docker compose up -d`; `globalSetup` waits until `/api/countries` answers 200):

```bash
cd e2e
npm ci                      # @playwright/test 1.65.1; no descarga navegadores
npx playwright test
```

Projects (ADR-0007): `flow`, `states`, `content-changes`, `a11y-responsive`. `E2E_WORKERS` and `E2E_BASE_URL` change the workers and the URL without touching the code.

## Result

**77 tests: 76 pass, 1 fails.** The failure is an application defect (D-E2E-1), not a test defect. Exit code 1.

| Project | Tests | Pass | Fail |
|---|---|---|---|
| `flow` | 25 | 25 | 0 |
| `states` | 17 | 17 | 0 |
| `content-changes` | 21 | 21 | 0 |
| `a11y-responsive` | 14 | 13 | 1 |

The full Colombia flow required by the PDF (`flow/co-full-flow.spec.ts`), done **with the keyboard only** (Tab, arrows, Space and Enter; no `click`, `fill` or `selectOption`), **passes**: form → plans → summary → accept terms → approved payment → confirmation with number `^CO-20261122-[A-HJ-NP-Z2-9]{6}$`. It also checks the masked document `******7890` (the full value is neither in the DOM nor in the accessibility tree) and the price `"$ 1.320.000"` compared as an exact string, with U+00A0 and without normalizing spaces.

## Real output (final run)

`npx playwright test` in `e2e/` (output of the `list` reporter, unedited):

```text

Running 77 tests using 2 workers

  ok  2 [flow] › tests\flow\co-full-flow.spec.ts:19:3 › CO full flow (keyboard only) › AC-01.1 AC-01.27 AC-01.32 AC-02.1 AC-02.2 AC-02.3 AC-02.8 AC-02.9 AC-02.26 AC-02.28 AC-03.1 AC-03.2 AC-03.3 AC-03.5 AC-03.8 AC-03.25 AC-03.27 AC-03.33 AC-03.34 CO form → plans → summary → terms → approved payment → confirmation (12.0s)
  ok  1 [flow] › tests\flow\cl-flow.spec.ts:17:1 › AC-01.34 AC-02.5 AC-02.8 AC-03.6 AC-03.32 CL form → plans in CLP → summary with masked RUT and Chilean terms → confirmation (12.9s)
  ok  4 [flow] › tests\flow\co-payment.spec.ts:105:3 › CO summary and simulated payment › AC-03.12 unchecking the terms disables pay again (4.1s)
  ok  3 [flow] › tests\flow\co-payment.spec.ts:54:3 › CO summary and simulated payment › AC-03.4 AC-03.26 AC-03.25 AC-03.34 rejected payment shows a clear message and the retry is approved without losing data (8.2s)
  ok  6 [flow] › tests\flow\co-payment.spec.ts:137:3 › CO summary and simulated payment › AC-03.22 double click on pay starts exactly one payment attempt (4.4s)
  ok  5 [flow] › tests\flow\co-payment.spec.ts:114:3 › CO summary and simulated payment › AC-03.24 the summary has no card or bank fields and payments make no non-GET request (8.3s)
  ok  7 [flow] › tests\flow\co-payment.spec.ts:148:3 › CO summary and simulated payment › AC-03.22 holding Enter on pay starts exactly one payment attempt (5.9s)
  ok  8 [flow] › tests\flow\co-payment.spec.ts:165:3 › CO summary and simulated payment › AC-03.22 AC-03.23 Enter and then a click before the end start exactly one attempt and lock the controls (6.1s)
  ok  9 [flow] › tests\flow\co-payment.spec.ts:197:3 › CO summary and simulated payment › AC-03.28 AC-03.31 reloading the confirmation keeps the number without the document; new quote opens an empty step 1 (7.0s)
  ok 10 [flow] › tests\flow\co-payment.spec.ts:226:3 › CO summary and simulated payment › AC-03.29 browser back after a successful payment does not allow paying again (7.0s)
  ok 11 [flow] › tests\flow\date-rules.spec.ts:11:1 › AC-01.17 vehicle year limits on 2026-11-22: 2005 invalid, 2006 and 2027 valid, 2028 invalid (4.5s)
  ok 12 [flow] › tests\flow\date-rules.spec.ts:38:1 › AC-01.18 legal age on 2026-11-22: born 2008-11-23 invalid, 2008-11-22 valid (3.7s)
  ok 14 [flow] › tests\flow\navigation-persistence.spec.ts:17:3 › Country resolution › AC-01.5 the root lists the countries from Strapi and Chile opens /cl step 1 (2.5s)
  ok 13 [flow] › tests\flow\date-rules.spec.ts:50:1 › AC-01.19 at 20:00 of 2026-11-22 in Bogotá (01:00 UTC of the 23rd) 2008-11-23 is still under age and stored as typed (3.3s)
  ok 15 [flow] › tests\flow\navigation-persistence.spec.ts:26:3 › Country resolution › AC-01.6 an unknown code shows "país no disponible" with links; an uppercase code redirects (2.5s)
  ok 16 [flow] › tests\flow\navigation-persistence.spec.ts:41:3 › Persistence and back navigation › AC-01.4 AC-02.30 back from step 2 keeps step 1 data and the selection with the same price (4.7s)
  ok 17 [flow] › tests\flow\navigation-persistence.spec.ts:62:3 › Persistence and back navigation › AC-01.21 a reload keeps step 1 data in the same tab and a new tab starts empty (4.3s)
  ok 19 [flow] › tests\flow\navigation-persistence.spec.ts:101:3 › Persistence and back navigation › AC-02.19 the selected plan survives a reload (4.9s)
  ok 18 [flow] › tests\flow\navigation-persistence.spec.ts:81:3 › Persistence and back navigation › AC-01.22 AC-02.20 data and plan selection are separated by country (7.8s)
  ok 20 [flow] › tests\flow\navigation-persistence.spec.ts:108:3 › Persistence and back navigation › AC-02.16 AC-03.9 AC-03.10 edit data from the summary: full document, plan kept, new price, terms unchecked (5.6s)
  ok 21 [flow] › tests\flow\navigation-persistence.spec.ts:138:3 › Persistence and back navigation › AC-03.11 change plan from the summary keeps the data and shows the new plan and price (4.2s)
  ok 23 [flow] › tests\flow\navigation-persistence.spec.ts:166:3 › Guards › AC-02.22 direct plans URL of Chile without step 1 data goes to step 1 without asking for plans (1.8s)
  ok 22 [flow] › tests\flow\navigation-persistence.spec.ts:156:3 › Guards › AC-03.18 direct summary URL without step 1 goes to step 1; with step 1 but no plan goes to step 2 (3.0s)
  ok 24 [flow] › tests\flow\navigation-persistence.spec.ts:175:3 › Guards › AC-03.30 direct confirmation URL of Chile without payment goes to step 1 (1.9s)
  ok 25 [flow] › tests\flow\navigation-persistence.spec.ts:180:3 › Guards › AC-03.32 the summary URL of Chile after completing Colombia goes to an empty Chile step 1 (3.4s)
  ok 26 [states] › tests\states\config-states.spec.ts:32:3 › Step 1 states › AC-01.7 loading the form configuration shows "cargando" and no fields (5.7s)
  ok 27 [states] › tests\states\config-states.spec.ts:47:3 › Step 1 states › AC-01.8 error loading the configuration, then "reintentar" shows the form (7.5s)
  ok 28 [states] › tests\states\config-states.spec.ts:61:3 › Step 1 states › AC-01.9 a country without published fields shows its empty message and no continue (5.6s)
  ok 29 [states] › tests\states\config-states.spec.ts:75:3 › Step 1 states › AC-01.20 no field with role "birthDate" shows the generic error and logs a warning (3.0s)
  ok 30 [states] › tests\states\config-states.spec.ts:93:3 › Step 1 states › AC-01.25 a field with an unknown type and another without label are skipped with warnings (3.3s)
  ok 31 [states] › tests\states\config-states.spec.ts:125:3 › Step 2 and 3 missing texts and terms › AC-02.33 a missing continue text of the plans step shows the generic error and no plans (4.0s)
  ok 32 [states] › tests\states\config-states.spec.ts:142:3 › Step 2 and 3 missing texts and terms › AC-02.33 a missing plans text and a missing generic message show "error de carga" and "reintentar" (6.1s)
  ok 33 [states] › tests\states\config-states.spec.ts:159:3 › Step 2 and 3 missing texts and terms › AC-03.16 the summary shows "cargando" while the terms have not arrived and pay is disabled (3.9s)
  ok 35 [states] › tests\states\config-states.spec.ts:201:3 › Step 2 and 3 missing texts and terms › AC-03.36 a missing label of the terms checkbox shows the generic error and pay disabled (4.5s)
  ok 34 [states] › tests\states\config-states.spec.ts:178:3 › Step 2 and 3 missing texts and terms › AC-03.17 error loading the terms, retry shows them and they can be accepted; data kept (5.6s)
  ok 37 [states] › tests\states\config-states.spec.ts:260:1 › AC-02.14 a Chilean plan with currency USD is not shown and the rest are in CLP (3.6s)
  ok 36 [states] › tests\states\config-states.spec.ts:217:3 › Step 2 and 3 missing texts and terms › AC-03.21 an optional field unpublished after step 1 is not shown in the summary (4.6s)
  ok 39 [states] › tests\states\plans-states.spec.ts:17:3 › Plans step states (interception) › AC-02.4 no active plans for the country shows the configured "no plans" message (3.7s)
  ok 40 [states] › tests\states\plans-states.spec.ts:40:3 › Plans step states (interception) › AC-02.4 plans present but all inactive (active=false) are discarded and the message is shown (2.8s)
  ok 38 [states] › tests\states\network.spec.ts:8:1 › AC-01.30 AC-02.31 every content request of the three steps is a GET through the proxy without Authorization (7.9s)
  ok 41 [states] › tests\states\plans-states.spec.ts:56:3 › Plans step states (interception) › AC-02.23 loading state while the plan request has not answered (3.1s)
  ok 42 [states] › tests\states\plans-states.spec.ts:77:3 › Plans step states (interception) › AC-02.24 error loading plans, then retry lists the plans (3.6s)
  ok 43 [content-changes] › tests\content-changes\form-changes.spec.ts:98:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.10 a field removed and two fields reordered are reflected after reload (5.9s)
  ok 45 [content-changes] › tests\content-changes\form-changes.spec.ts:124:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.11 the draft field of the seed is not shown and no request asks for drafts (2.1s)
  ok 44 [content-changes] › tests\content-changes\form-changes.spec.ts:56:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.3 a new published field appears after reload without code changes (8.3s)
  ok 46 [content-changes] › tests\content-changes\form-changes.spec.ts:138:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.13 select options come from Strapi in order and a new option is offered after reload (3.1s)
  ok 47 [content-changes] › tests\content-changes\form-changes.spec.ts:157:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.31 the continue text of Chile changes after reload and Colombia is unchanged (3.6s)
  ok 48 [content-changes] › tests\content-changes\form-changes.spec.ts:176:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.35 an empty step text of Chile shows the generic error and no default text (2.0s)
  ok 49 [content-changes] › tests\content-changes\form-changes.spec.ts:190:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.24 a stored value that no longer meets a new pattern is kept and shows the error (3.8s)
  ok 50 [content-changes] › tests\content-changes\form-changes.spec.ts:211:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.23 a stored option removed in Strapi leaves the select empty (4.0s)
  ok 51 [content-changes] › tests\content-changes\plans-changes.spec.ts:51:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.25 deactivation, order, recommended flag, base price and a price factor are reflected after reload (5.3s)
  ok 52 [content-changes] › tests\content-changes\plans-changes.spec.ts:96:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.21 the persisted plan is deactivated: no selection, announced message, no advance (5.8s)
  ok 53 [content-changes] › tests\content-changes\plans-changes.spec.ts:117:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.19 the chosen plan is deactivated before reaching the summary: back to step 2 with the notice (6.0s)
  ok 54 [content-changes] › tests\content-changes\plans-changes.spec.ts:134:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.19 the chosen plan gets another currency: back to step 2 with the notice (5.4s)
  ok 55 [content-changes] › tests\content-changes\plans-changes.spec.ts:153:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.15 a plan without base price is not shown and the rest are normal (2.9s)
  ok 56 [content-changes] › tests\content-changes\plans-changes.spec.ts:166:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.6 AC-02.7 order ties, empty order and several recommended (3.6s)
  ok 57 [content-changes] › tests\content-changes\plans-changes.spec.ts:190:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.10 without price factors each plan shows its base price (3.2s)
  ok 58 [content-changes] › tests\content-changes\plans-changes.spec.ts:202:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.32 thirty active plans are all listed (3.7s)
  ok 59 [content-changes] › tests\content-changes\plans-changes.spec.ts:221:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.22 a new required field published after step 1 sends the user back to step 1 without asking for plans (4.2s)
  ok 60 [content-changes] › tests\content-changes\plans-changes.spec.ts:254:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.20 a new required field published after choosing a plan sends the summary back to step 1 (6.9s)
  ok 61 [content-changes] › tests\content-changes\plans-changes.spec.ts:284:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.15 terms edited and published are shown after reloading the summary (5.9s)
  ok 62 [content-changes] › tests\content-changes\plans-changes.spec.ts:300:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.14 terms with unsafe markup do not execute or insert elements (3.5s)
  ok 63 [content-changes] › tests\content-changes\plans-changes.spec.ts:321:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.13 empty terms show the "not available" notice, checkbox and pay disabled, data visible (3.9s)
  ok 65 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:33:3 › Keyboard › AC-01.27 AC-01.16 Enter in a text field with invalid fields stays on step 1 and focuses the first invalid field (5.0s)
  ok 64 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:20:3 › Keyboard › AC-01.27 pressing Enter in a text field submits step 1 and moves to step 2 (5.3s)
  ok 66 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:50:3 › Accessible names and errors › AC-01.26 AC-01.2 AC-01.14 AC-01.33 every control by its label, help text and errors referenced, sections as named groups (2.9s)
  ok 67 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:79:3 › Accessible names and errors › AC-02.18 AC-02.17 continue without a plan shows the configured message and focuses the group; a new choice replaces the old one (4.7s)
  ok 68 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:98:3 › Accessible names and errors › AC-02.27 each plan option is named with the plan, the recommended label and the price (3.4s)
  ok 69 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:126:5 › Viewport 320 px › AC-01.28 step 1 has no horizontal scroll and every field and continue are usable at 320 px (4.7s)
  ok 70 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:142:5 › Viewport 320 px › AC-02.29 plans have no horizontal scroll and every plan, price and continue are reachable at 320 px (3.3s)
  ok 72 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:126:5 › Viewport 375 px › AC-01.28 step 1 has no horizontal scroll and every field and continue are usable at 375 px (4.3s)
  ok 73 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:142:5 › Viewport 375 px › AC-02.29 plans have no horizontal scroll and every plan, price and continue are reachable at 375 px (2.8s)
  x  71 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 320 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 320 px (7.5s)
  ok 74 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 375 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 375 px (5.0s)
  ok 75 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:142:5 › Viewport 1280 px › AC-02.29 plans have no horizontal scroll and every plan, price and continue are reachable at 1280 px (4.7s)
  ok 76 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:126:5 › Viewport 1280 px › AC-01.28 step 1 has no horizontal scroll and every field and continue are usable at 1280 px (5.2s)
  ok 77 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 1280 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 1280 px (6.2s)


  1) [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 320 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 320 px 

    Error: expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 3

    - Array []
    + Array [
    +   "input#accept-terms 22.2x24.0",
    + ]

      169 |       }
      170 |       // Soft: a size defect is reported without hiding the rest of the scenario.
    > 171 |       expect.soft(await smallTargets(page, '.summary')).toEqual([]);
          |                                                         ^
      172 |
      173 |       await page.getByRole('checkbox', { name: CO.texts.acceptTerms }).check();
      174 |       await page.getByRole('button', { name: CO.texts.pay }).click();
        at C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\e2e\tests\a11y-responsive\keyboard-and-viewports.spec.ts:171:57

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results\a11y-responsive-keyboard-a-f1894-re-at-least-24x24-at-320-px-a11y-responsive\test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results\a11y-responsive-keyboard-a-f1894-re-at-least-24x24-at-320-px-a11y-responsive\error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results\a11y-responsive-keyboard-a-f1894-re-at-least-24x24-at-320-px-a11y-responsive\trace.zip
    Usage:

        npx playwright show-trace test-results\a11y-responsive-keyboard-a-f1894-re-at-least-24x24-at-320-px-a11y-responsive\trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 320 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 320 px 
  76 passed (3.5m)
```

## Failure analysis

### Failure in the final run: application defect (D-E2E-1)

- **Test:** `a11y-responsive › Viewport 320 px › AC-03.35 summary, payment and confirmation … at 320 px`.
- **What fails:** the "Acepto los términos y condiciones" checkbox (`#accept-terms`) measures **22.2 × 24 px** at a width of 320 px; AC-03.35 and REQ-03.36 require at least 24 × 24 CSS px. At 375 and 1280 px it passes. The rest of the scenario at 320 px (no horizontal scroll, scrollable terms, payment and confirmation) is also met: the size check is `expect.soft` so that it does not hide it.
- **Cause (read, not fixed):** `frontend/src/app/features/summary-step/summary-step-page.css:68-81`. `.accept` is `display: flex` and the checkbox has `width: 24px; height: 24px` but no `flex-shrink: 0`. When the label text wraps onto two lines at 320 px, the flex item shrinks.
- **Proposal for the Angular Developer:** `flex: none` (or `flex-shrink: 0`) on `input[type='checkbox'], input[type='radio']` in that file. The same rule in `dynamic-form.css` (step 1) is worth reviewing, although AC-01.28 does not require a minimum size.

### Failures in earlier runs: test or environment (fixed in the tests, not in the app)

| Run | Failure | Cause | Type | Fix |
|---|---|---|---|---|
| Iterative | `toBeFocused` after the date | Chrome gives `<input type="date">` internal tab stops (day, month, year) | Test | `tabOutOfDate`: keeps pressing Tab only while focus stays on the same input and then requires the next control |
| Iterative | Ambiguous terms region | The `<section>` and the scrollable region have the same accessible name ("Términos y condiciones") | Test | Selector by role **and** `tabindex="0"`. Minor observation for G5: two nested regions with the same name |
| Iterative | Terms checkbox unchecked after Space | The test pressed Space before the terms arrived (the checkbox is disabled while they load) | Test | `goToCoSummary` waits until the checkbox is enabled |
| Iterative | Empty plan lists | `allTextContents()` does not wait; it was read before C5 answered | Test | `toHaveText([...])`, which retries |
| Iterative | `getByLabel(…, { exact: true })` with no results | The `<label>` text includes the visible `*` (`aria-hidden`) | Test | `getByLabel` without `exact` + exact `toHaveAccessibleName(label)`, which does exclude the `*` |
| Iterative | AC-03.21 showed the withdrawn field | `page.unroute` with a new predicate does not match the registered one | Test | `published` flag inside the same handler |
| Iterative | AC-01.19: storage shape | `ciq.v1.co.step1` is `{ values: {…} }` | Test | Expectation corrected |
| 4 workers (76 tests: 73 pass, 3 fail) | AC-02.4 showed "error de carga" | In the trace, C5 via `route.fetch()` took 10 394 ms and the non-intercepted C6 9 105 ms. The app **correctly** applied its 10 000 ms timeout (api-contracts §1) | Environment | 2 workers and `expect.timeout` 15 s. Without changing any assertion or adding retries |
| 4 workers | AC-03.21 stayed on "cargando" | In the trace, after `reload()` the `/api` requests started 12 s after the HTML loaded: host CPU saturated (8 GB, 2 GB free, 4 Chrome + Strapi + Docker) | Environment | Same |
| 4 workers | AC-03.35 at 320 px | D-E2E-1 | App | — |

With 2 workers, two consecutive full runs gave the same result (76 pass, 1 fails: D-E2E-1).

## Techniques used (ADR-0007)

- **Clock:** `page.clock.setFixedTime` before `goto` (automatic fixture). AC-01.19 uses `2026-11-23T01:00:00Z` with `timezoneId: 'America/Bogota'` (20:00 on the 22nd in Bogotá). The 1500 ms of the payment run with real timers.
- **Network:** `page.route` with a predicate on `URL.pathname` and on the parameters that distinguish C3, C6 and C7 (all three use `/api/countries`). Content changes always start from the real response (`route.fetch()` + `route.fulfill({ response, json })`). Delays are made with a promise that the test releases, and failures with `route.fulfill({ status: 500/503 })`. Nothing writes to Strapi or uses credentials (G3-3).
- **Network guard (`networkGuard`, automatic in the 77 tests):** records `page.on('request')` and at the end requires every request to be `GET`, without `Authorization` and without `status` or `publicationFilter` parameters. It backs AC-01.30, AC-02.31 and AC-03.24 across the whole journey, not only in their dedicated test.
- **Double submission (AC-03.22):** an `addInitScript` only observes: it counts the `setTimeout(…, 1500)` calls, which are the only trace of an attempt in `MockPaymentGateway`, and the `click` events that reach the button. For each variant (double click, Enter held with repeated `keydown`, Enter + real click with `page.mouse`) it requires **≥ 2 clicks received and exactly 1 attempt**, so the test cannot pass unless the repeated input actually happened.
- **Responsive:** `scrollWidth ≤ clientWidth` of `documentElement`, `toBeInViewport` after `scrollIntoViewIfNeeded` and `getBoundingClientRect` measurement of buttons, checkboxes and radios at 320, 375 and 1280 px.

## Content-change AC (G3-3)

Automated by interception and pending the manual check of the real change in Strapi in G5 ([`manual-check.md`](manual-check.md) §4):

| AC | Test (green) | G5 |
|---|---|---|
| AC-01.3 | `content-changes › AC-01.3 a new published field appears after reload without code changes` | §4.2–4.3 (new published field) |
| AC-01.10 | `content-changes › AC-01.10 …` | indirect (§4.2) |
| AC-01.11 | `content-changes › AC-01.11 …`: against the real seed, no interception | Not needed |
| AC-01.31 | `content-changes › AC-01.31 …` | indirect |
| AC-02.4 | `states › AC-02.4 …` (two variants) | §4.4–4.5 |
| AC-02.21 | `content-changes › AC-02.21 …` | §4.4–4.5 (deactivated plan) |
| AC-02.25 | `content-changes › AC-02.25 deactivation, order, recommended flag, base price and a price factor …` | §4.4–4.6 (deactivated plan, factor) |
| AC-03.15 | `content-changes › AC-03.15 …` | optional |

## Validity of this evidence

1. **The tested stack does not include `40dfcae` or `8f763cb`.** The containers were created at 01:11 and 01:15 (−05) and those commits are from 02:01 and 02:13. The running API still returns the pattern `[0-9]{7,8}-[0-9Kk]` for `cl_rut`, while `cms/src/seed/data/cl.ts:120` already accepts `12.345.678-5`. The message of `40dfcae` says that verifying the stack needs a clean volume after the e2e. **The stack must be rebuilt (`docker compose up -d --build`, with a clean volume for the seed) and `npx playwright test` repeated** for the evidence to cover `8f763cb`. I did not rebuild the stack: my role does not ask for it and it deletes the demo volume.
2. **AC-03.6 with dots (`12.345.678-5`):** following the orchestrator's notice, the CL test uses `12345678-5`, which both the old and the new pattern accept, and checks `*****678-5`. The format with dots stays **Pending G4 (F-03.2)** in the plan. After rebuilding, a test with `12.345.678-5` → `**.***.678-5` can be added. I did not add it now because it would fail due to the outdated stack, not due to the app.

## Re-run after G4 (2026-11-23 02:27, orchestrator)

Stack rebuilt with a clean volume (`docker compose down -v && docker compose up -d --build`) with the fixes `40dfcae` (F-00.12, F-03.2, F-00.13), `8f763cb` (F-03.1, F-02.1) and `0086e5a` (F-03.3 / D-E2E-1).

```text
$ cd e2e && npx playwright test --reporter=line
...
[71/77] [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 320 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 320 px
...
[77/77] [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 1280 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 1280 px
  77 passed (3.7m)
```

D-E2E-1 is fixed (AC-03.35 at 320 px green). AC-03.6 with a RUT with dots is still covered only by the `maskDocument` unit tests; the seed already accepts that format (F-03.2).

## Re-run after D12 (visual style inspired by SURA, 2026-11-23)

- **Change:** presentation only in `frontend/` (D12 in `docs/decision-log.md`), implemented by `angular-developer` on the `style/sura-visual-refresh` branch.
- **Stack:** `docker compose up -d --build web` with the new frontend; `curl http://localhost:8080/` → 200.
- **Unit:** `npx ng test --watch=false` → `Test Files 46 passed (46)` · `Tests 463 passed (463)`.
- **E2E:** `npx playwright test --reporter=line` → `77 passed (4.0m)`. It includes the checks for no horizontal scroll and 24×24 targets at 320, 375 and 1280 px (AC-01.28, AC-02.29, AC-03.35).
- **Screenshots** (Chrome, CO flow): `docs/assets/screenshots/`.

## Re-run after D13 (logo, Figtree, illustration and animations, 2026-11-23)

- **Unit:** `npx ng test --watch=false` → `Test Files 46 passed (46)` · `Tests 465 passed (465)` (2 new tests: decorative band and loading skeleton).
- **Stack:** `docker compose up -d --build web`; logo (`/brand/sura-logo-white.png`) and illustration (`/illustrations/car-protection.svg`) → 200.
- **E2E, first run:** `75 passed`, `2 failed` (7.6m): AC-01.19 (`date-rules`) and AC-01.8 (`config-states`). With `--last-failed` → `2 passed`; with `--repeat-each=4` of those two files → `60 passed (6.2m)`.
- **E2E, second run:** `76 passed`, `1 failed` (7.6m): AC-03.20 (`plans-changes`). The failure screenshot shows "error de carga".
- **Observed facts:** after D13 the suite went from 4.0 to 7.6 min, on the same 8 GB machine where it had already been documented that, under load, Strapi exceeds the app's 10 s timeout. The failures moved to a different test on each run, and all of them were "error de carga" or exhausted waits, not presentation assertions.
- **Hypothesis, not isolated:** the earlier version of this report attributed these failures to the D13 animations (view entrance and looping skeleton), on the assumption that they slowed the suite down and pushed Strapi's responses beyond 10 s. That cause was **not isolated**: no comparable run with and without animations was measured, and the same "error de carga" symptom had already been documented on this host before D13. Review 003 ([`reviews/003-visual-refresh-and-d14.md`](../../reviews/003-visual-refresh-and-d14.md), F-00.15) ran the suite with animations (`reducedMotion: 'no-preference'`) and got 80/80.
- **Change applied:** `reducedMotion: 'reduce'` in `e2e/playwright.config.ts`, on the grounds that the app already disables its animations with `prefers-reduced-motion` and that the suite verifies behavior, not motion.
- **E2E after the change:** `npx playwright test --reporter=line` → `77 passed (4.4m)`. This green run is an observed result; on its own it does not show that the animations were the cause.

## Re-run after D14 ("cambiar de país" link and clickable plan card, 2026-11-23)

- **Changes:**
  - `cms`: `wizardTexts.changeCountryLabel`, with an idempotent backfill of the existing volume; done by the `strapi-developer`.
  - `frontend`: the link and the clickable card; done by the `angular-developer`.
  - `e2e`: `flow/change-country-and-plan-card.spec.ts`, with 3 tests of AC-01.36 and AC-02.34; done by the `qa-engineer`.
- **Unit:** `npx ng test --watch=false` → `Test Files 46 passed (46)` · `Tests 469 passed (469)`.
- **Stack:** `docker compose up -d --build cms` (the Strapi agent) and `docker compose up -d --build web` (the orchestrator). C3 returns `"changeCountryLabel":"Cambiar de país"` for CO and CL.
- **E2E:** `npx playwright test --reporter=line` → `80 passed (4.4m)`.

## Re-run without `reducedMotion` (F-00.15, review 003, 2026-11-23)

- **Change:** `reducedMotion: 'reduce'` removed from `e2e/playwright.config.ts`, so the suite runs with the animations that most users see.
- **Full run:** `npx playwright test --reporter=line` → `78 passed`, `2 failed` (10.3m). Both failures were in `flow/change-country-and-plan-card.spec.ts` (AC-01.36), and both page snapshots show "error de carga".
- **Cause, with evidence:** during the run the machine was loaded by 5 translation agents (D16). The Strapi log of the same window shows a request that took `10525 ms`, above the app's 10 s timeout, so the app correctly showed "error de carga". This is the load symptom already documented for this host, not an app defect.
- **Re-run of the failed tests:** `npx playwright test --last-failed --reporter=line` → `2 passed (44.7s)`.
- **Conclusion:** the suite stays without `reducedMotion`. Review 003 also got 80/80 with animations. The final full run on an idle machine is recorded in the next section.

## Final run before delivery (2026-11-23)

- **Stack:** `docker compose` built from `c4f5095` (frontend) with the D14 CMS. The later commits only change docs and the e2e config.
- **Command:** `npx playwright test --reporter=line`, without `reducedMotion`, with no other agents running.
- **Result:** `80 passed (8.3m)`.
