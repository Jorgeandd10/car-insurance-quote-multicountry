# Test plan — AC → type → location → status

| Field | Value |
|---|---|
| Phase | 5 (validation) · branch `phase-5/validation` · base `main` = `f69ae34` |
| Author | QA Engineer (subagent) |
| Date | 2026-11-23 |
| Sources | `specs/US-0X/spec.md` §4 and §8 · ADR-0007 · ADR-0003 §5 (G3-3) · `docs/architecture/api-contracts.md` · `docs/qa/phase-4-implementation-notes.md` |
| Existing unit tests | `docs/qa/US-01-test-report.md`, `US-02-test-report.md`, `US-03-test-report.md` (Vitest, jsdom; 457/457 at `0cb032c`) |
| E2E | `e2e/` (Playwright 1.65.1, system Chrome, `docker compose` stack); real output in [`e2e-report.md`](e2e-report.md): 77 tests, 76 pass, 1 fails (D-E2E-1) |
| Validity | The tested stack predates `40dfcae` and `8f763cb`: the e2e must be repeated after rebuilding it (`e2e-report.md`, "Validity of this evidence") |
| Manual | [`manual-check.md`](manual-check.md) (G5 template, filled in by the human) |

## How to read it

- **Unit**: what the Phase 4 unit tests already cover (they were not re-run in this phase; their evidence is in the reports listed in the "Sources" row).
- **E2E**: file in `e2e/tests/` and test name (it starts with the AC, `grep -rn "AC-0X.n" e2e/tests`).
- **E2E status**: `Covered ✅` only if the test ran green in the run recorded in `e2e-report.md`; `Fails ❌` if the test detects a defect; `Not covered (e2e)` with a reason if there is no e2e (the AC may be covered by unit tests).
- `interception + G5`: automated with `page.route` over the real response (`route.fetch()` + `route.fulfill()`), without writing to Strapi or using credentials; the real change in the admin is checked by hand in G5 (G3-3).
- Every test also goes through the `networkGuard` fixture (`e2e/support/fixtures.ts`): every request is `GET`, none carries `Authorization` and none asks for drafts.

File abbreviations: `full` = `flow/co-full-flow.spec.ts`, `pay` = `flow/co-payment.spec.ts`, `nav` = `flow/navigation-persistence.spec.ts`, `cl` = `flow/cl-flow.spec.ts`, `dates` = `flow/date-rules.spec.ts`, `pst` = `states/plans-states.spec.ts`, `cst` = `states/config-states.spec.ts`, `net` = `states/network.spec.ts`, `fch` = `content-changes/form-changes.spec.ts`, `pch` = `content-changes/plans-changes.spec.ts`, `a11y` = `a11y-responsive/keyboard-and-viewports.spec.ts`, `chg` = `flow/change-country-and-plan-card.spec.ts` (D14).
- `Pending execution`: the test exists but has not yet run against a stack that contains the change; it does not count as covered.

## US-01 — Form

| AC | Type | Unit | E2E | Manual G5 | E2E status |
|---|---|---|---|---|---|
| AC-01.1 (PDF) | E2E seed | ✅ | `full` (exact order of the 8 CO fields); `cl` | 1.3 | Covered ✅ |
| AC-01.2 (PDF) | E2E seed | ✅ | `a11y › AC-01.26 AC-01.2 …`; `a11y › AC-01.27 AC-01.16 …` | 1.4 | Covered ✅ |
| AC-01.3 (PDF) | E2E interception + G5 | — | `fch › AC-01.3 a new published field appears after reload …` | 4.2–4.3 | Covered ✅ (interception + G5) |
| AC-01.4 (PDF) | E2E seed | ✅ | `nav › AC-01.4 AC-02.30 …` | 1.8 | Covered ✅ |
| AC-01.5 | E2E seed | ✅ | `nav › AC-01.5 …` | 1.1 | Covered ✅ |
| AC-01.6 | E2E seed | ✅ | `nav › AC-01.6 …` (`/pe`, `/CO`) | — | Covered ✅ |
| AC-01.7 | E2E interception (delay) | ✅ | `cst › AC-01.7 …` | — | Covered ✅ |
| AC-01.8 | E2E interception (503 → retry) | ✅ | `cst › AC-01.8 …` | — | Covered ✅ |
| AC-01.9 | E2E interception | ✅ | `cst › AC-01.9 …` | — | Covered ✅ |
| AC-01.10 | E2E interception + G5 | ✅ (mapper) | `fch › AC-01.10 …` | indirect (4.2) | Covered ✅ (interception) |
| AC-01.11 | E2E against real Strapi | ✅ (query) | `fch › AC-01.11 …` (seed draft `co_referralCode` not visible) + `networkGuard` | — | Covered ✅ |
| AC-01.12 | Unit | ✅ | Partial: `cl › AC-01.34 …` checks the 5 native types; the associated help text only in `a11y › AC-01.26` (text) and `fch › AC-01.3` | 3.1 | Not covered (e2e) per type: covered by unit (`form-step-page.spec.ts › AC-01.12`) |
| AC-01.13 | E2E seed + interception | ✅ (1st part) | `fch › AC-01.13 …` ("Marca C" after reload) | — | Covered ✅ |
| AC-01.14 | E2E seed | ✅ | `a11y › AC-01.26 AC-01.2 AC-01.14 AC-01.33 …` (whitespace only) | — | Covered ✅ |
| AC-01.15 | Unit | ✅ | — | — | Not covered (e2e): validation catalog covered by unit (`validator-registry.spec.ts`); the seed only exercises `pattern`, `maxLength` and `integer` (which do run in the flows) |
| AC-01.16 | E2E seed | ✅ | `a11y › AC-01.27 AC-01.16 …` (focus on the 2nd field); `a11y › AC-01.26 …` | 1.4 | Covered ✅ |
| AC-01.17 | Unit + E2E (fixed clock) | ✅ | `dates › AC-01.17 …` (2005, 2028 invalid; 2006, 2027 valid) | — | Covered ✅ |
| AC-01.18 | Unit + E2E (fixed clock) | ✅ | `dates › AC-01.18 …` (2008-11-23 invalid, 2008-11-22 valid). February 29 rows: unit only | — | Covered ✅ (rows 1–2); rows 3–5 by unit |
| AC-01.19 | Unit + E2E (`timezoneId` + clock) | ✅ | `dates › AC-01.19 …` | — | Covered ✅ |
| AC-01.20 | E2E interception | ✅ | `cst › AC-01.20 …` | — | Covered ✅ |
| AC-01.21 | E2E | ✅ (reload) | `nav › AC-01.21 …` (reload + empty new tab) | — | Covered ✅ |
| AC-01.22 | E2E | ✅ | `nav › AC-01.22 AC-02.20 …` | — | Covered ✅ |
| AC-01.23 | E2E interception | ✅ | `fch › AC-01.23 …` (removed option). The "unpublished field" part in `cst › AC-03.21` | — | Covered ✅ |
| AC-01.24 | E2E interception | ✅ | `fch › AC-01.24 …` (new pattern over a saved value) | — | Covered ✅ |
| AC-01.25 | E2E interception | ✅ | `cst › AC-01.25 …` | — | Covered ✅ |
| AC-01.26 | E2E | ✅ | `a11y › AC-01.26 …` (exact accessible name, `aria-describedby`, `aria-invalid`, groups) | 3.1 | Covered ✅ |
| AC-01.27 | E2E keyboard only | ✅ (focus) | `full` (Tab, arrows, Space, Enter); `a11y › AC-01.27 pressing Enter in a text field …` | 1.2–1.5 | Covered ✅ |
| AC-01.28 | E2E viewports | — | `a11y › AC-01.28 … at 320 / 375 / 1280 px` | 2.1 | Covered ✅ |
| AC-01.29 | Unit | ✅ | — | — | Not covered (e2e): internal contract (`Step1Result`), with no observable surface of its own; covered by unit (`evaluate-step1.spec.ts`) and indirectly by the guards (`pch › AC-02.22`, `pch › AC-03.20`) |
| AC-01.30 | E2E network | ✅ (client) | `net › AC-01.30 AC-02.31 …` + `networkGuard` in every test | — | Covered ✅ |
| AC-01.31 | E2E interception + G5 | ✅ (text) | `fch › AC-01.31 …` | indirect | Covered ✅ (interception) |
| AC-01.32 | E2E seed | ✅ | `full` | 1.5 | Covered ✅ |
| AC-01.33 | E2E seed | ✅ | `a11y › AC-01.26 AC-01.2 AC-01.14 AC-01.33 …` | — | Covered ✅ |
| AC-01.34 | E2E seed | — | `full` (CO, "Placa"); `cl › AC-01.34 …` (CL, "Patente", 5 types) | 0.1, 2.5 | Covered ✅ |
| AC-01.35 | E2E interception | ✅ | `fch › AC-01.35 …` | — | Covered ✅ |
| AC-01.36 (D14) | E2E seed | exists (`country-shell.spec.ts › AC-01.36 …`; its execution is reported by the Angular Developer) | `chg › AC-01.36 the "change country" link goes back to the country selection and the step 1 data is kept` (step 1 complete, link by role and name "Cambiar de país", `href="/"`, ≥ 24×24 px, activated with Enter, country list, back to Colombia with the 8 values); `chg › AC-01.36 the "change country" link is on the plans, summary and confirmation screens` | — | Covered ✅ (`80 passed (4.4m)`, stack rebuilt after D14; `docs/qa/e2e-report.md`) |

## US-02 — Plans

| AC | Type | Unit | E2E | Manual G5 | E2E status |
|---|---|---|---|---|---|
| AC-02.1 (PDF) | E2E seed | ✅ | `full` (3 CO plans in order, no inactive or draft plan) | 1.6 | Covered ✅ |
| AC-02.2 (PDF) | E2E seed | ✅ | `full` (class and "Recomendado" label, only one) | 1.6 | Covered ✅ |
| AC-02.3 (PDF) | E2E seed | ✅ | `full` (selected and move to the summary) | 1.6–1.9 | Covered ✅ |
| AC-02.4 (PDF) | E2E interception + G5 | ✅ | `pst › AC-02.4 no active plans …`; `pst › AC-02.4 plans present but all inactive …` | 4.4–4.5 (deactivate a plan) | Covered ✅ (interception + G5) |
| AC-02.5 | E2E seed | ✅ | `full` (CO) and `cl › … AC-02.5 …` (CL; no "Plan Clásico", "Plan Élite" or plans from the other country) | — | Covered ✅ |
| AC-02.6 | E2E interception | ✅ | `pch › AC-02.6 AC-02.7 …` | — | Covered ✅ |
| AC-02.7 | E2E interception | ✅ | `pch › AC-02.6 AC-02.7 …` | — | Covered ✅ |
| AC-02.8 | E2E seed | ✅ | `full` (exact `"$ 1.320.000"`, not normalized); `cl` (`"$38.985"`) | 1.7 | Covered ✅ |
| AC-02.9 | Unit + E2E seed | ✅ | E1 in `full` (1 320 000) and E4 in `cl` (38 985), with the clock fixed at 2026-11-22. E2, E3, E5, E6 unit only | — | Covered ✅ (E1, E4); the rest by unit |
| AC-02.10 | E2E interception | ✅ | `pch › AC-02.10 …` | — | Covered ✅ |
| AC-02.11 | Unit | ✅ | — | — | Not covered (e2e): per G2-5 the flow does not reach step 2 without the role (spec §8) |
| AC-02.12 | Unit | ✅ | — | — | Not covered (e2e): pure function (spec §8). Year 2027 accepted in `dates › AC-01.17` |
| AC-02.13 | Unit | ✅ | — | — | Not covered (e2e): pure function (spec §8) |
| AC-02.14 | E2E interception | ✅ | `cst › AC-02.14 …` (CL, USD); `pch › AC-03.19 … another currency` (CO) | — | Covered ✅ |
| AC-02.15 | E2E interception | ✅ | `pch › AC-02.15 …` | — | Covered ✅ |
| AC-02.16 | E2E | ✅ | `nav › AC-02.16 AC-03.9 AC-03.10 …` (2018 → 2022: 1 320 000 → 1 200 000, plan kept) | — | Covered ✅ |
| AC-02.17 | E2E | ✅ | `a11y › AC-02.18 AC-02.17 …`; `full` | — | Covered ✅ |
| AC-02.18 | E2E | ✅ | `a11y › AC-02.18 AC-02.17 …` | — | Covered ✅ |
| AC-02.19 | E2E | ✅ | `nav › AC-02.19 …` | — | Covered ✅ |
| AC-02.20 | E2E | ✅ | `nav › AC-01.22 AC-02.20 …` | — | Covered ✅ |
| AC-02.21 | E2E interception + G5 | ✅ | `pch › AC-02.21 …` | 4.4–4.5 | Covered ✅ (interception + G5) |
| AC-02.22 | E2E + interception | ✅ | `nav › AC-02.22 …` (no data, no plans request); `pch › AC-02.22 …` (new required field, no plans request). Both on CO or CL depending on the case | — | Covered ✅ |
| AC-02.23 | E2E interception (delay) | ✅ | `pst › AC-02.23 …` | — | Covered ✅ |
| AC-02.24 | E2E interception (500 → retry) | ✅ | `pst › AC-02.24 …` | — | Covered ✅ |
| AC-02.25 | E2E interception + G5 | — | `pch › AC-02.25 …` (deactivate, order, recommended, base price and factor) | 4.4–4.6 | Covered ✅ (interception + G5) |
| AC-02.26 | E2E keyboard only | ✅ (structure) | `full` (Tab to the group, arrow, Space, Tab, Enter) | 1.6 | Covered ✅ |
| AC-02.27 | Unit + E2E + G5 | ✅ | `a11y › AC-02.27 …` (exact accessible name) | 3.2 (screen reader) | Covered ✅ (names); real screen reader in G5 |
| AC-02.28 | E2E | ✅ | `full` (focus on the heading on entry), `a11y › AC-01.27 pressing Enter …` | 1.6 | Covered ✅ |
| AC-02.29 | E2E viewports | — | `a11y › AC-02.29 … at 320 / 375 / 1280 px` | 2.2 | Covered ✅ |
| AC-02.30 | E2E | ✅ | `nav › AC-01.4 AC-02.30 …` | 1.8 | Covered ✅ |
| AC-02.31 | E2E network | ✅ (client) | `net › AC-01.30 AC-02.31 …` + `networkGuard` | — | Covered ✅ |
| AC-02.32 | E2E interception | ✅ | `pch › AC-02.32 …` (30 plans) | — | Covered ✅ |
| AC-02.33 | E2E interception | ✅ | `cst › AC-02.33 …` (two scenarios) | — | Covered ✅ |
| AC-02.34 (D14) | E2E seed | exists (`plans-step-page.spec.ts › AC-02.34 …`; its execution is reported by the Angular Developer) | `chg › AC-02.34 clicking anywhere on a plan card selects the plan` (real click with `page.mouse.click()` at the center of the "Pérdida total y parcial por daños" coverage of "Plan Total" → its radio `checked`; then, click on the description of "Plan Esencial" → the selection changes and it reaches the summary) | — | Covered ✅ (`80 passed (4.4m)`, stack rebuilt after D14; `docs/qa/e2e-report.md`) |

## US-03 — Summary and payment

| AC | Type | Unit | E2E | Manual G5 | E2E status |
|---|---|---|---|---|---|
| AC-03.1 (PDF) | E2E seed | ✅ | `full` (8 label/value pairs, plan and price) | 1.10 | Covered ✅ |
| AC-03.2 (PDF) | E2E seed | ✅ | `full` (CO terms, pay disabled until accepted); `cl` (CL terms) | 1.12 | Covered ✅ |
| AC-03.3 (PDF) | E2E seed | ✅ | `full` (`aria-disabled`/`aria-busy`, "Procesando el pago…", confirmation with number) | 1.14 | Covered ✅ |
| AC-03.4 (PDF) | E2E seed | ✅ | `pay › AC-03.4 AC-03.26 …` (rejection → message → approved retry) | 1.13 | Covered ✅ |
| AC-03.5 | E2E seed | ✅ | `full` (`******7890`, type in clear, full value absent from the DOM and from the accessibility tree) | 1.10 | Covered ✅ |
| AC-03.6 | E2E seed | ✅ | `cl` with the seed RUT `12345678-5` → `*****678-5`, absent from the DOM | 2.5 | Covered ✅ (format without dots). **Format with dots `12.345.678-5`: Pending G4 (F-03.2)**: the tested stack has the pattern `[0-9]{7,8}-[0-9Kk]`, which rejects it in step 1. `40dfcae` already widens the pattern in the seed, but the stack has not been rebuilt (see `e2e-report.md`, "Validity") |
| AC-03.7 | Unit | ✅ | — | — | Not covered (e2e): pure function (spec §8) |
| AC-03.8 | Unit + E2E seed | ✅ | `full` (sections with Strapi legends, option label "Bogotá"/"Marca A", "Sí", date "10 de mayo de 2000"). The empty optional field ("—") unit only: the seed has no published optional fields | — | Covered ✅ (except "—", by unit) |
| AC-03.9 | E2E | ✅ | `full` (summary price = step 2); `nav › AC-02.16 AC-03.9 AC-03.10 …` (recalculated after editing) | — | Covered ✅ |
| AC-03.10 | E2E | ✅ | `nav › AC-02.16 AC-03.9 AC-03.10 …` | — | Covered ✅ |
| AC-03.11 | E2E | ✅ | `nav › AC-03.11 …` | — | Covered ✅ |
| AC-03.12 | E2E | ✅ | `pay › AC-03.12 …` | 1.12 | Covered ✅ |
| AC-03.13 | E2E interception | ✅ (3 rows) | `pch › AC-03.13 …` ("empty text" row) | — | Covered ✅ (row 2); rows 1 and 3 by unit |
| AC-03.14 | E2E interception | ✅ | `pch › AC-03.14 …` (no `img`/`script`, no dialogs) | — | Covered ✅ |
| AC-03.15 | E2E interception + G5 | ✅ (part) | `pch › AC-03.15 …` | — (optional in 4) | Covered ✅ (interception) |
| AC-03.16 | E2E interception (delay) | ✅ | `cst › AC-03.16 …` (terms section) | — | Covered ✅ |
| AC-03.17 | E2E interception | ✅ | `cst › AC-03.17 …` | — | Covered ✅ |
| AC-03.18 | E2E | ✅ | `nav › AC-03.18 …` (two rows) | — | Covered ✅ |
| AC-03.19 | E2E interception | ✅ | `pch › AC-03.19 … deactivated`; `pch › AC-03.19 … another currency`. "Unpublished" row = same response without the plan (covered by `pch › AC-02.21`) | — | Covered ✅ |
| AC-03.20 | E2E interception | ✅ | `pch › AC-03.20 …` ("new required field" row). "Withdrawn option" row: `fch › AC-01.23` in step 1 | — | Covered ✅ (row 1); row 2 by unit + `fch › AC-01.23` |
| AC-03.21 | E2E interception | ✅ | `cst › AC-03.21 …` | — | Covered ✅ |
| AC-03.22 | E2E | ✅ (simulated clicks) | `pay › AC-03.22 double click …`, `… holding Enter …`, `AC-03.22 AC-03.23 Enter and then a click …` (counts real clicks ≥ 2 and gateway attempts = 1) | 1.14 | Covered ✅ |
| AC-03.23 | E2E | ✅ | `pay › AC-03.22 AC-03.23 …`; `full` | 1.13 | Covered ✅ |
| AC-03.24 | E2E network | ✅ | `pay › AC-03.24 …` + `networkGuard` | — | Covered ✅ |
| AC-03.25 | E2E seed | ✅ | `full` (approved by default); `pay › AC-03.4 …` (rejected) | 1.13–1.14 | Covered ✅ |
| AC-03.26 | E2E seed | ✅ | `pay › AC-03.4 AC-03.26 …` | 1.13 | Covered ✅ |
| AC-03.27 | Unit | ✅ | Format checked in e2e (`^CO-20261122-[A-HJ-NP-Z2-9]{6}$` with a fixed clock); the fixed random source only in unit | — | Covered ✅ (format); determinism by unit |
| AC-03.28 | E2E | ✅ | `pay › AC-03.28 AC-03.31 …` | — | Covered ✅ |
| AC-03.29 | E2E | ✅ (part) | `pay › AC-03.29 …` (real `page.goBack()`) | 1.15 | Covered ✅ |
| AC-03.30 | E2E | ✅ | `nav › AC-03.30 …` | — | Covered ✅ |
| AC-03.31 | E2E | ✅ | `pay › AC-03.28 AC-03.31 …`; `full` | 1.14 | Covered ✅ |
| AC-03.32 | E2E | ✅ | `nav › AC-03.32 …`; `cl` (Chile's terms, not Colombia's) | — | Covered ✅ |
| AC-03.33 | E2E keyboard only | ✅ (structure) | `full` (exact Tab order, Space, arrows in `pay`, Enter) | 1.11 | Covered ✅ |
| AC-03.34 | E2E + G5 | ✅ | `full` (focus on headings, `aria-describedby` of the button, focus does not go to `body`); `pay › AC-03.4 …` (`aria-live`, alert) | 3.3–3.4 | Covered ✅ (real screen reader in G5) |
| AC-03.35 | E2E viewports | — | `a11y › AC-03.35 … at 320 / 375 / 1280 px` | 2.3–2.4 | Covered ✅ at 320, 375 and 1280 px. At 320 px it failed first (terms checkbox 22.2×24 px, defect D-E2E-1) and was fixed in F-03.3 (`0086e5a`). |
| AC-03.36 | E2E interception | ✅ (3 rows) | `cst › AC-03.36 …` (row 1) | — | Covered ✅ (row 1); rows 2 and 3 by unit |

## Summary

See the count and the real output in [`e2e-report.md`](e2e-report.md). An AC counts as covered by e2e when at least one green test verifies its main scenario; rows covered only by unit tests are noted in their row.

| Story | AC | Covered by green e2e (total, or partial where noted) | Fail | No e2e (covered by unit) |
|---|---|---|---|---|
| US-01 | 36 | 33 | 0 | 3 (AC-01.12, AC-01.15, AC-01.29) |
| US-02 | 34 | 31 | 0 | 3 (AC-02.11, AC-02.12, AC-02.13) |
| US-03 | 36 | 35 | 0 (AC-03.35 at 320 px fixed in F-03.3) | 1 (AC-03.7) |
| **Total** | **106** | **99** | **0** | **7** (all with green unit tests according to the Phase 4 reports) |

Pending items that do not depend on the e2e:

- **AC-03.6 with dots** (`12.345.678-5`): Pending G4 (F-03.2).
- Real integration with the Strapi admin (AC-01.3, AC-02.4, AC-02.21, AC-02.25): G5, `manual-check.md` §4.
- Real screen reader (AC-02.27, AC-03.34) and real mobile device (AC-01.28, AC-02.29, AC-03.35): G5.
