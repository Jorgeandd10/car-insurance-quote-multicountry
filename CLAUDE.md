# CLAUDE.md — Global project context

Read by the orchestrator and **all** subagents. If an instruction from an agent or a Skill contradicts this file, this file wins; if this file contradicts the assessment PDF, the PDF wins.

## 1. What we build

Car insurance quote wizard for **Colombia (CO)** and **Chile (CL)**: a single Angular build that consumes from Strapi the form, the plans and the terms of each country. Three stories: US-01 form, US-02 plans, US-03 summary and simulated payment.

## 2. Sources of truth (order of precedence)

1. `docs/assessment/Technical assessment -Frontend.pdf`: requirements. Requirements are not invented or contradicted.
2. Approved `specs/US-XX/spec.md` (gate G2): source of truth of each story. The code is derived from the spec.
3. Accepted `docs/adr/` (gate G3).
4. This file and `docs/decision-log.md` (human decisions D1–Dn).
5. `docs/assessment/master-prompt.md`: operational context.

If you find a gap or a contradiction: **do not assume**. Record it as an open question in the spec or in your output and stop.

## 3. Current decisions (G0, see `docs/decision-log.md`)

| # | Decision |
|---|---|
| D2 | Angular 22: standalone, signals, `@if`/`@for`, no NgModules, zoneless |
| D3 | Multi-country: `Country` collection + relations in Strapi (no i18n); country in the URL `/co/...`, `/cl/...` |
| D4 | Strapi public role only `find`/`findOne`; GET-only nginx proxy with allowlist; no token in the browser |
| D5 | Forms with **Signal Forms** (`@angular/forms/signals`) |
| D6 | Wizard persistence in `sessionStorage`, separated by country |
| D7 | 3 steps + confirmation screen |
| D8 | Price: per-country factors in Strapi + documented pure function |
| D9 | Payment: mock gateway with a chosen result (success/rejection), no card fields |
| D10 | Own lightweight SDD through the `sdd-traceability` Skill |
| D11 | 6 subagents in `.claude/agents/` + Skills `sdd-traceability` and `country-content` |
| D12 | Visual style inspired by SURA: CSS and presentational markup only; no changes to behavior, specs or Strapi content |
| D13 | Extension of D12: "Seguros SURA" logo provided by the human, self-hosted Figtree font, original SVG illustration and UX polish (transitions, skeletons, styled inputs) |
| D14 | "Change country" link back to country selection (REQ-01.36) and whole clickable plan card (REQ-02.34) |
| D15 | Brand favicon; of the closing extras, only review 003 |
| D16 | All documentation in English (changes §11); communication with the human stays in Spanish |

Changing an approved decision requires a new entry in `docs/decision-log.md` and human approval.

## 4. Stack and verified environment

Node 24.22.3 · npm 11 · Angular 22.3 · Strapi 5.63 (SQLite) · Vitest (unit, `jsdom`) · Playwright (e2e, system Chrome with `channel: 'chrome'`) · Docker Compose v5 · nginx. Windows 11 host; the containers are Linux.

## 5. Repository structure

```
CLAUDE.md · FLOW.md · README.md · docker-compose.yml · .env.example
.claude/agents/        subagents (one per role)
.claude/skills/        sdd-traceability, country-content
specs/US-0X/spec.md    one spec per story
docs/adr/              ADRs (MADR)
docs/architecture/     content model, API contracts
docs/qa/               test plan and reports
docs/traceability.md   matrix US → REQ → AC → ADR → code → tests → review
docs/decision-log.md   human decisions and rejections
reviews/               code review reports and their resolution
logs/sessions/         original transcripts (DO NOT EDIT)
frontend/  cms/  e2e/
infra/nginx/           GET-only proxy and Angular build (Strapi Developer, G1-d)
scripts/               flow utilities (export-session-logs.ps1)
```

## 6. Non-negotiable rules

- **Spec before code.** No story is implemented without its spec approved in G2.
- **`logs/` is original evidence.** Nothing inside `logs/` is ever edited, rewritten or deleted (a hook blocks it, G1-a). Transcripts are added only with `scripts/export-session-logs.ps1`, whose only transformation is redacting personal data listed outside the repo (G1-f); hashes in `docs/logs-manifest.md`.
- **Security.** No Strapi token reaches the browser. The public role only reads. Credentials only in `.env` (only `.env.example` with fictitious values is versioned).
- **Fictitious data.** No real personal data, real cards or real gateways.
- **Real evidence.** No tests, builds or reviews that were not executed are declared. Reports include the command and its real output.
- **Dependencies.** No new dependency without justifying it in the commit or in an ADR.
- **Git.** Small commits, Conventional Commits. No `push` unless the human asks. Never `--no-verify`. Subagents **do not commit**: they hand over to the orchestrator, who reviews the diff against the agent's definition of done and makes the commit citing the IDs.
- **Path ownership.** Each subagent writes only to the paths declared in its definition in `.claude/agents/`.
- **Errors.** On a failure, first the cause; then the fix.

## 7. Traceability

IDs (defined in the `sdd-traceability` Skill):

- `US-01` story · `REQ-01.3` spec requirement · `AC-01.2` acceptance criterion · `Q-01.1` open question
- `ADR-0001` architecture decision · `F-01.4` review finding · `D7` human decision

Commits that implement something cite the IDs at the end of the subject:

```
feat(frontend): render dynamic fields by order [US-01][REQ-01.2]
```

Scopes: `frontend`, `cms`, `e2e`, `infra`, `docs`, `specs`, `adr`, `agents`, `skills`, `review`.

Tests name the criterion they verify: `it('AC-01.2 shows the configured error message', ...)`.

## 8. Code conventions

**Angular (`frontend/`)**

- Standalone components with `ChangeDetectionStrategy.OnPush`; state with `signal`/`computed`; `inject()` instead of constructors with parameters.
- Templates with `@if`, `@for` (with `track`), `@switch`. `*ngIf`, `*ngFor` and NgModules are forbidden.
- TypeScript `strict`; `any` is forbidden (use `unknown` + validation). Strapi DTOs separated from the domain through mappers.
- Business logic (price, masking, validators, age, year) in **pure functions** with unit tests.
- File names as generated by `ng generate` in Angular 22.
- Accessibility: each control with an associated `<label>`, errors with `aria-describedby`, focus managed when changing step, everything operable with the keyboard.
- Explicit loading, empty and error states in every call to Strapi.

**Strapi (`cms/`)**

- Content types and components as code (`src/api`, `src/components`).
- Seed and public role permissions in `bootstrap`, idempotent.
- No presentation logic in Strapi.

**Tests**

- Unit (Vitest): next to the code, `*.spec.ts`. Maintained by the Angular Developer.
- E2E (Playwright): `e2e/`. Maintained by the QA Engineer. At least the full flow of one country.

## 9. Flow and human gates

Detail in `FLOW.md`. Summary:

| Gate | What the human approves |
|---|---|
| G0 | Strategy (Phase 1) |
| G1 | Agentic flow: this file, agents, Skills, FLOW.md |
| G2 | Specs of each story |
| G3 | ADRs and content model |
| Demo | Each implemented story, before the next one |
| G4 | Triage of review findings |
| G5 | Manual test with keyboard and mobile, without AI |
| G6 | Delivery |

A rejection returns the work to the producing agent with the reason recorded in `docs/decision-log.md`.

## 10. Definition of Done (per story)

- [ ] Spec approved and without blocking open questions.
- [ ] Code that meets each `REQ` of the spec, with commits that cite the IDs.
- [ ] Unit tests of the relevant logic, executed green (real output in `docs/qa/`).
- [ ] E2E of the affected flow executed green.
- [ ] Review in `reviews/` with findings resolved or accepted by the human (G4).
- [ ] `docs/traceability.md` updated.

## 11. Language

Rule in force since **D16** (replaces the G1 rule):

- **Documentation** (every versioned document), code, identifiers, file names and commit messages in **English**.
- **Communication with the human** in **Spanish**.
- **End-user texts** come from Strapi: Spanish product copy for CO and CL, in the seed.
- **Human's literal quotes** in `docs/decision-log.md` stay in Spanish exactly as written (they are evidence), with an English translation next to each one.

**Only exception (G2-2), unchanged:** a minimal set of fixed texts in code, in Spanish, for when there is no configuration yet or Strapi does not respond: "cargando", "error de carga", "reintentar" and "país no disponible" (*loading*, *load error*, *retry*, *country not available*). If a text is missing in Strapi, it is treated as a configuration error and the generic message is shown; no default texts are added in code.
