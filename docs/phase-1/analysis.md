# Phase 1 — Analysis and contextualization

> Origin: session in claude.ai (agentic chat), 2026-11-22. This document is the Phase 1 deliverable.
> Status: **approved in G0 (2026-11-22)**. D1–D11 recorded in [`docs/decision-log.md`](../decision-log.md).
> Later note (same date): the human decided to continue the project in **local Claude Code**; this modifies D1 (see the end).
> Local review (same date): environment re-verified on the local machine and the **D5 recommendation changed** to Signal Forms before the gate (see sections "Verified environment (local)" and 7).

Main source of requirements: `docs/assessment/Technical assessment -Frontend.pdf`.
Operational context: `docs/assessment/master-prompt.md`.
No contradictions were found between the two. Nuances: the PDF requires the e2e for **at least one country** and asks to **justify the AI tool** chosen.

## Verified environment (claude.ai cloud sandbox — must be re-verified locally)

| Item | Status |
|---|---|
| Node 22.23 / npm 10.9 / Git 2.43 | OK |
| Angular CLI | Latest stable 22.3.0 (meets "21+"). `@angular/core@22` requires Node `^22.22.3 \|\| ^24.15.0 \|\| >=26` |
| Strapi | Latest 5.63.0. Requires Node `>=22 <=26` |
| Docker | CLI present, daemon not available and Docker Hub blocked in the sandbox |
| Playwright | Browser CDN blocked; system Google Chrome available |

## Verified environment (local, Windows 11) — 2026-11-22

| Item | Real output | Result |
|---|---|---|
| Node | `v24.22.3` | Meets Angular 22 (`^24.15.0`) and Strapi 5.63 (`>=22 <=26`) |
| npm | `11.19.1` | OK (not upgraded to npm 12) |
| Git | `2.47.0.windows.1`, `core.autocrlf=true`, remote `origin` on GitHub | OK |
| Docker | `29.7.2`; `docker info`: Docker Desktop, linux/x86_64, 8 CPU, ~3.7 GiB RAM | Daemon running |
| Docker Compose | `v5.5.0` | OK |
| Docker Hub | `registry-1.docker.io/v2/` → 401 (normal response without authentication) | Reachable |
| Browsers | Chrome `159.0.8154.13`, Edge `158.0.4370.33`; `ms-playwright` cache empty | Playwright will use `channel: 'chrome'` unless downloading Chromium is approved |
| Ports 80, 1337, 3000, 4200, 8080 | Free | OK |
| npm versions | `@angular/core 22.3.0`, `@strapi/strapi 5.63.0`, `@playwright/test 1.65.1`, `vitest 5.1.1` | Match the analysis |

Official sources verified: Signal Forms "Stable (v22+)" ([angular.dev](https://angular.dev/guide/forms/signals/comparison)); default test runner Vitest with `jsdom` ([testing guide](https://angular.dev/guide/testing), [`ng test`](https://angular.dev/cli/test)).

## 1. Executive interpretation

65 % of the grade evaluates the agentic process; 35 % the application. The app is a quote wizard (CO/CL) with a single Angular build, where Strapi governs the form, plans and terms per country.

We must show: agents with separate responsibilities, real human checkpoints, verifiable traceability (US → spec → ADR → code → tests → review) and authentic evidence.

Gaps detected in the stories (to be formalized in specs):

- How the country is selected.
- Legal age: 18 in both? Configurable?
- Inclusive limit of the vehicle year (is exactly 20 years accepted?).
- Several plans marked as recommended.
- Plan currency different from the country's.
- Price rule that depends on a field the business may remove.
- Which field is the document and how many digits are shown when masking.
- How to force a rejected payment deterministically for the e2e.
- Persisted data vs. configuration changes or plans that stop being active.

## 2. Proposed architecture

```
Browser ──► nginx (static Angular + GET-only /api proxy with allowlist) ──► Strapi 5 (SQLite + seed)
```

**Frontend (Angular 22):** standalone, zoneless, Signals, `@if`/`@for`. Country in the route (`/co/...`, `/cl/...`) validated by a guard. `CountryContext` (signal). Typed `CmsApiClient` with DTO→domain mappers. `DynamicFormComponent` with a registry of typed validators (`required`, `pattern`, `min`/`max`, `minAge`, relative `yearRange`). `QuoteStore` with signals + sessionStorage per country. Pure functions for price, masking and validation. Simulated payment gateway.

**Backend (Strapi 5):** `Country` (code, currency, locale, minimum age), `FormField` (key, label, type, required, helpText, errorMessage, order, section, masked, options and validations as components, relation to Country), `Plan` (coverages/benefits as components, order, recommended, active, Country), `Terms` (per country). Seed and public permissions as code in `bootstrap` (idempotent). Public role only `find`/`findOne`.

**Security:** no token in the browser; nginx only lets `GET` through to the allowlist; admin credentials in `.env` (only `.env.example` in the repo).

**Quality:** Vitest (unit), Playwright (e2e), `docker compose up` as the single command.

## 3. Proposed agent team

| Agent | Tools | Output | Adjustment |
|---|---|---|---|
| Requirements Analyst | Read, Grep, Write (`specs/`) | Spec with IDs, Gherkin and list of gaps/questions | — |
| Software Architect | Read, Write (`docs/adr/`, `docs/architecture/`), WebSearch | MADR ADRs, content model, API contracts | Verifies real versions |
| Strapi Developer | Read, Edit, Write, Bash (`cms/`) | Content types, seed, permissions as code | — |
| Angular Developer | Read, Edit, Write, Bash (`frontend/`) | Components, store, validators + unit tests | Owner of the unit tests |
| QA Engineer | Read, Write (`e2e/`, `docs/qa/`), Bash | Test plan traced to AC, e2e, report with real output | Does not touch production code |
| Code Reviewer | Read, Grep, Bash (lint/test only), Write (`reviews/`) | Report with findings, severity, file:line | Absorbs the security review (checklist in Skill). Does not fix code |

Proposed Skills: `sdd-traceability` (spec/ADR/review templates + ID convention `US-01 → REQ-01.3 → AC-01.2 → F-01`, commits `[US-01][REQ-01.3]`) and `country-content` (procedure to add a field/plan/validator/country end to end).

## 4. Repository structure

```
├── README.md · FLOW.md · CLAUDE.md · docker-compose.yml · .env.example
├── .claude/agents/*.md
├── .claude/skills/{sdd-traceability,country-content}/SKILL.md
├── specs/US-01 … US-03/spec.md
├── docs/adr/ · docs/architecture/ · docs/qa/
├── docs/traceability.md · docs/decision-log.md
├── reviews/
├── logs/sessions/
├── frontend/ · cms/ · e2e/
```

## 5. Plan by phases

| Phase | Deliverables | Human gate |
|---|---|---|
| 1 Analysis | This document | G0 approve strategy |
| 2 Agentic flow | CLAUDE.md, agents, skills, FLOW.md draft | G1 |
| 3 Specs and ADRs | 3 specs, multi-country ADR and others, content model | G2 specs, G3 ADRs |
| 4 Implementation | Strapi+seed → Angular base → US-01 → US-02 → US-03 | Demo per story |
| 5 Validation | Tests executed, independent review, fixes, re-review | G4 findings triage, G5 manual keyboard/mobile test without AI |
| 6 Delivery | README, FLOW, matrix, `docker compose up` verified | G6 |

Rejection at any gate: it goes back to the producing agent with the feedback recorded in `docs/decision-log.md`.

## 6. Risks

**Technical:** Docker verification; Strapi 5 response format (`documentId`, Draft & Publish) → mappers + contract tests; "reflect on reload" → no aggressive caching; date/age-relative validations → date-only computation; COP/CLP format without decimals with `Intl`; maturity of Signal Forms in v22.

**Methodological:** authenticity of the logs; trivial or invented findings → require file:line and a closing commit; scope drift or loss of context → specs as source of truth + CLAUDE.md; over-engineering vs. time.

**Update after the local verification (2026-11-22):**

- Resolved: Docker verification (daemon running, Docker Hub reachable); maturity of Signal Forms (stable in v22); authenticity of the logs (the original Claude Code JSONL transcripts stay local).
- Remaining: Strapi 5 format, no aggressive caching, date-only dates, COP/CLP format and the methodological risks.
- New:
  - `core.autocrlf=true`: `.sh` files and entrypoints would reach Linux containers with CRLF → `.gitattributes` with `eol=lf`.
  - Native modules (`better-sqlite3`): do not mount `node_modules` from Windows; install inside the image with a Debian base (`node:24-*-slim`).
  - ~3.7 GiB of RAM in Docker: the Strapi admin build may be tight; it is checked when running it.
  - Playwright without downloaded browsers: use the system Chrome or ask for permission to download Chromium.
  - Log export: copy (without editing) the JSONL files from `~/.claude/projects/` to `logs/sessions/` at the close of each phase.

## 7. G0 decisions (approved on 2026-11-22)

Detail, verdict and literal reason in [`docs/decision-log.md`](../decision-log.md).

| # | Decision | Recommendation | Status |
|---|---|---|---|
| D1 | Work environment and repo | *(updated, see note)* | Approved |
| D2 | Angular version | 22 | Approved |
| D3 | Multi-country strategy | `Country` collection + relations (no i18n); country in the URL `/co`, `/cl` | Approved |
| D4 | Access to Strapi | Read-only public role + GET-only nginx; no tokens or BFF | Approved |
| D5 | Forms | ~~Typed Reactive Forms, unless Signal Forms is stable in v22~~ → **Signal Forms** (verified stable in v22; ADR in Phase 3) | Approved (recommendation changed) |
| D6 | Persistence | sessionStorage per country | Approved |
| D7 | Wizard steps | 3 + confirmation screen | Approved |
| D8 | Price rule | Per-country factors configurable in Strapi + documented pure function | Approved |
| D9 | Simulated payment | Mock gateway with a chosen result (success/rejection), no card fields | Approved |
| D10 | SDD | Own lightweight variant via a Skill (not Spec Kit) | Approved |
| D11 | Agent team and Skills | Those of section 3 | Approved |

### Later note on D1

Human's decision (2026-11-22): the project continues in **local Claude Code** on the human's own GitHub repository (initially described as private; **it is public** because the recruiter requires it, see "D1 change" in `docs/decision-log.md`). Reasons: the subagents in `.claude/agents/` load natively, the original JSONL transcripts stay in `~/.claude/projects/` (requirement of "unedited logs"), Docker can be verified on the machine and `git push` uses the human's credentials. This phase (claude.ai) is kept as an export in `logs/sessions/`.
