# Review 000 — Consistency across specs US-01, US-02, US-03 (pre-G2)

| Field | Value |
|---|---|
| Reviewer | Orchestrator (main Claude Code session, Claude Opus 5.5) |
| Date | 2026-11-22 |
| Scope | `specs/US-01/spec.md`, `specs/US-02/spec.md`, `specs/US-03/spec.md` (Draft), written in parallel by 3 `requirements-analyst` instances |
| Verdict | Changes required after G2 (alignment across specs) |

## Checks run

- The 12 scenarios of the PDF appear verbatim (4 per spec): OK.
- Every REQ has a verification column: OK.
- Currency format of AC-02.8 run on Node 24.22.3:

```text
$ node -e "...Intl.NumberFormat(l,{style:'currency',currency:c,minimumFractionDigits:0,maximumFractionDigits:0})..."
es-CO "$ 1.320.000" 24 a0 31 2e 33 32 30 2e 30 30 30
es-CL "$38.985" 24 33 38 2e 39 38 35
```

## Findings

| ID | Severity | Location | Description | Proposal |
|---|---|---|---|---|
| F-00.1 | Major | `specs/US-01/spec.md` Q-01.3 · `specs/US-03/spec.md` Q-03.1 | Two different mechanisms to identify the document: US-01 proposes field **roles** (`documentNumber`, `birthDate`, `vehicleYear`); US-03 proposes a `masked` **boolean**. | Use the US-01 roles in the three specs; US-03 masks the fields with role `documentNumber`. |
| F-00.2 | Major | `specs/US-02/spec.md` Q-02.4 · `specs/US-01/spec.md` Q-01.3 | US-02 links the pricing rule to the field `key`; US-01 proposes linking rules by **role** because the business can change the `key`. | US-02 uses the roles (`birthDate`, `vehicleYear`). |
| F-00.3 | Major | Q-01.6 · Q-02.13 · Q-03.14 | Three variants of the same exception to `CLAUDE.md` §11 (fixed texts in code): a minimal set in Spanish / per locale / a single message. | A single cross-cutting decision and an explicit change in `CLAUDE.md` §11. |
| F-00.4 | Minor | Q-02.13 · Q-03.14 | Text missing in Strapi: US-02 uses a default text from the code; US-03 treats it as a configuration error. | A single rule, decided together with F-00.3. |
| F-00.5 | Minor | Q-01.18 · Q-02.10 · Q-03.8 | Navigation guards: US-02 relies on a persisted "step 1 completed" flag; US-01 exposes a computed `isComplete` and US-03 revalidates with the validators. A persisted flag can become stale if the configuration changes. | `isComplete` is always computed with the current configuration; no flag is persisted. |
| F-00.6 | Minor | `specs/US-02/spec.md:167` (AC-02.8) | The example `"$ 1.320.000"` uses a normal space; `Intl` on Node 24 produces U+00A0 (no-break space). A test with the literal would fail. | State U+00A0 in the example or compare after normalising spaces. |

## Resolution

Human G2 decisions in [`docs/decision-log.md`](../docs/decision-log.md) (literal reason: "Apruebo todo", "I approve everything"). Each `requirements-analyst` applied the fixes to its spec (v0.2); the orchestrator verified the result.

| ID | Human decision | Status | Commit / reason |
|---|---|---|---|
| F-00.1 | G2-1 (roles) | Fixed | US-03 uses the `documentNumber` role (REQ-03.6, AC-03.5, AC-03.6); the `masked` boolean no longer appears in any REQ or AC. Specs v0.2 commit |
| F-00.2 | G2-1 (roles) | Fixed | US-02 links the pricing rule by role (REQ-02.9, REQ-02.10, §6.3); 0 occurrences of `fieldKey`. Specs v0.2 commit |
| F-00.3 | G2-2 | Fixed | The same 4 fixed texts in REQ-01.13, REQ-02.32 and REQ-03.38; exception added to `CLAUDE.md` §11 (`a351682`) |
| F-00.4 | G2-2 | Fixed | Text missing in Strapi = configuration error in the three specs (see also F-00.7) |
| F-00.5 | G2-10 | Fixed | `isComplete` computed with the current configuration (REQ-01.27, REQ-02.19, REQ-03.13); no flag is persisted |
| F-00.6 | — (verified fact) | Fixed | AC-02.8 uses `"$ 1.320.000"` and compares the exact string |

## Re-review (2026-11-22)

Verification by the orchestrator after v0.2, with searches in the three specs:

```text
specs\US-01\spec.md: version=0.2 · Q=20 · Q abiertas=0 · '(propuesta)'=0 · 'masked' en REQ/AC=1 · 'fieldKey'=0
specs\US-02\spec.md: version=0.2 · Q=16 · Q abiertas=0 · '(propuesta)'=0 · 'masked' en REQ/AC=0 · 'fieldKey'=0
specs\US-03\spec.md: version=0.2 · Q=24 · Q abiertas=0 · '(propuesta)'=0 · 'masked' en REQ/AC=0 · 'fieldKey'=0
```

The only `masked` match in US-01 is REQ-01.28, which says that US-03 *masks* the fields with role `documentNumber`: it is correct.

The re-review found a new finding:

| ID | Severity | Location | Description | Resolution |
|---|---|---|---|---|
| F-00.7 | Minor | REQ-01.13 · REQ-02.21/REQ-02.32 · REQ-03.38 | The three specs interpreted the G2-2 "generic message" differently (US-01: the country's message in Strapi; US-02: the fixed texts "error de carga"; US-03: not specified). Cause: ambiguous wording of G2-2 by the orchestrator. | Fixed. Common definition taken from US-01: the generic message is a country text in Strapi; if it is missing, the fixed texts "error de carga" + "reintentar"; a network failure always shows the fixed texts. Applied in US-02 (REQ-02.21, REQ-02.32, AC-02.33) and US-03 (REQ-03.38, AC-03.36). It is a clarification within G2-2, not a new decision. |

Final verdict: **Approved**. Specs marked `Approved (2026-11-22, G2)`.
