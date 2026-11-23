# Review 001 — ADRs and architecture (pre-G3)

| Field | Value |
|---|---|
| Reviewer | Orchestrator (main Claude Code session, Claude Opus 5.5) |
| Date | 2026-11-22 |
| Scope | `docs/adr/0001`–`0007`, `docs/architecture/{overview,content-model,api-contracts,pricing-rule}.md`, written by `software-architect` |
| Reference specs / decisions | `specs/US-0X/spec.md` (Approved), `docs/decision-log.md` (D1–D11, G1, G2) |
| Verdict | Approved with changes (decisions for G3) |

## Checks run

- Structure of the 7 ADRs (headings extracted with `Select-String`): all `Proposed`, with 3–4 alternatives with pros and cons per decision, negative consequences and between 3 and 23 official URLs.
- Search for tokens or passwords in `docs/adr/` and `docs/architecture/`: 0 matches.
- Independent verification of two critical claims (`web-fetch` subagent, 2026-11-22):
  - https://docs.strapi.io/cms/api/rest/status — `status=draft` returns the draft version and the default value is `published`. The page does **not** say which permission `status=draft` requires; the ADR-0003 claim that `find` is enough relies on the Strapi feedback portal. The `published-only` middleware stays as defence in depth, and its confirmation `curl` remains a mandatory test at implementation time.
  - https://angular.dev/guide/forms/signals/dynamic-forms-with-json — the guide exists (angular.dev v22.3.0), builds forms from `FieldConfig[]` at runtime with `form()`, `required()`, `min()`, `max()`, `applyWhen()`, `applyEach()` and `[formField]`, without experimental or developer preview marks.

## Findings

| ID | Severity | Location | Description | Proposal |
|---|---|---|---|---|
| F-00.8 | Minor | `docs/architecture/content-model.md:207` · ADR-0003 | The public role keeps only `find`, without `findOne`. This is more restrictive than the wording of D4 ("`find`/`findOne`"). Consistent with the API contracts, but it changes the wording of an approved decision. | Present it in G3 as a precision of D4. |
| F-00.9 | Major | ADR-0003 §5, ADR-0007 | The e2e tests that change real content need a write token created **by hand** in the admin. This goes against the PDF's "a single command" for that part of the tests and leaves AC-01.3, AC-01.10, AC-01.11, AC-01.31 and AC-02.25 unexecuted if the token is missing. The token never reaches the browser, so it meets the security requirement. | G3 decision (options 3a/3b/3c of ADR-0003). |
| F-00.10 | Minor | ADR-0003 · `CLAUDE.md` §5 | nginx in `infra/nginx/`, a folder that is not in the structure of `CLAUDE.md` §5. | Update `CLAUDE.md` §5 after G3. |
| F-00.11 | Minor | `.claude/skills/country-content/SKILL.md` | The Skill is still a skeleton; the architect leaves the concrete names in `overview.md` §4. | Complete the Skill after G3 (orchestrator). |

## Resolution

Human G3 decisions in [`docs/decision-log.md`](../docs/decision-log.md) (literal reason: "Apruebo G3 con G3-3 en intercepción", "I approve G3 with G3-3 as interception").

| ID | Human decision | Status | Commit / reason |
|---|---|---|---|
| F-00.8 | G3-2: only `find` | Fixed | `content-model.md` §4 and ADR-0003 §1 say "only `find`" as a precision of D4; the architect added routers with `only: ['find']` (consistent with G3-2) |
| F-00.9 | G3-3: option 3c (interception) + manual check in G5 | Fixed | ADR-0003 §5 and ADR-0007 rewritten without a write token; specs US-01 and US-02 v0.3 (`5a28ea2`, `e5ad6b6`) |
| F-00.10 | — (consequence of G1-d) | Fixed | `CLAUDE.md` §5 includes `infra/nginx/` and `scripts/` (`2dc7d25`) |
| F-00.11 | — | Fixed | `country-content` Skill completed with the G3 names (`61e8466`) |

## Re-review (2026-11-22)

- Search for `E2E_STRAPI|cms-admin|Bearer` in `docs/adr/` and `docs/architecture/`: 1 match, `0003:174`. It is the confirmation's own `grep` command, which checks that there are no authorization headers: correct.
- Changes added by the architect without being asked, accepted by the orchestrator because they fit approved decisions: routers `only: ['find']` (G3-2) and AC-01.11 verified against a draft field of the seed, without interception, which also tests the `published-only` middleware.
- ADR-0001 to ADR-0007 move to `Accepted (2026-11-22, G3)`. The spec headers link the accepted ADRs.

Final verdict: **Approved**.
