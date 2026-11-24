# Phase 4 — Implementation notes for the demo and G4

Decisions that the subagents made while implementing and that no spec, ADR or decision fixes. They are presented to the human for validation; those the human rejects go to review 002 as findings.

## Orchestrator's verification (2026-11-23)

| Part | Commit | Checked |
|---|---|---|
| Angular base (4a) | `40840ed` | `ng build` OK · `ng test` 229/229 |
| US-01 (4b) | `f5e47f1` | `ng build` OK · `ng test` 336/336 (33 files) |
| US-02 (4c) | `f411a8b` | `ng build` OK · `ng test` 388/388 (39 files) |
| US-03 (4d) | `0cb032c` | `ng build` OK · `ng test` 457/457 (45 files) |
| Strapi, nginx, compose (4a) | `078d59a` | `curl` through nginx: reads 200, `status=draft` 400, `%73tatus=draft` only returns published entries, `POST` 403, `/api/users` 404, `no-store` and CSP present; no `.env` in the repo |
| CSP fix | `b22d2ad` | The inline `<script>` of the critical CSS was blocked by `script-src 'self'`; now there is a normal `<link>` (styles 200) |
| Integration | — | In Chrome: `/` lists Chile and Colombia from Strapi; `/co/form` shows the form with styles; `/co/summary` without data redirects to `/co/form` |

`grep` of the rules with no matches in every part (no `any`, `*ngIf`, `*ngFor`, NgModules or `bypassSecurityTrust`; the only occurrence is a comment explaining that it is not used).

## Real failures found during implementation

| Where | Failure | Fix |
|---|---|---|
| US-01 | When changing country inside the SPA, the previous country's form was shown (route reuse) | `CountryRouteReuseStrategy` |
| US-02 | The accessible name of each plan concatenated name, label and price without a separator | `&ngsp;` between the nodes; AC-02.27 compares the exact name |
| US-02 | A test helper normalized U+00A0 with `\s` and hid AC-02.8 regressions | It only collapses ASCII spaces |
| Integration | The CSP blocked the global styles | `inlineCritical: false` (`b22d2ad`) |
| Strapi | Admin build in a GC loop with a 2 GB heap | `--max-old-space-size=3072` |

## Decisions to validate

### Backend and infrastructure

1. `POST` to an allowlisted route answers **403** (what ADR-0003 sets with `limit_except GET { deny all; }`), not 405.
2. Port 8080 is published on all interfaces so that a real mobile device can be used in G5 (ADR-0003 only restricts 1337 to `127.0.0.1`).
3. `published-only` also removes `hasPublishedVersion`, a legacy alias that Strapi 5.63 still turns into a publication filter.
4. The Strapi Cloud plugin and telemetry (`uuid`/`installId`) were removed from the Strapi template.
5. No administrator is created: the first access to `http://127.0.0.1:1337/admin` registers the super admin (needed for G5).

### Frontend

6. `birthDate` and `vehicleYear` are required even if Strapi says `required: false`, so that the age or year rule cannot be disabled from Strapi.
7. A change in a field's type is only detected if the saved value does not fit the new type (ADR-0004 saves values only).
8. The visual required marker is a fixed `*` with `aria-hidden` (the programmatic part is the native `required`).
9. With a text missing in Strapi, only the generic message is shown, without an `h1`.
10. Empty states are announced with `role="alert"`; `role="status"` might fit better.
11. Unparseable input in `number`/`date` (e.g. "e"): the form blocks moving forward, but `sessionStorage` keeps the last valid value.
12. With no plan selected, the focus goes to the first radio of the group.
13. "Coberturas" and "Beneficios" are `<p>` with `aria-labelledby`, not headings.
14. The plan selection is saved when choosing, not when continuing.
15. The pay button uses native `disabled` while the terms are missing, and `aria-disabled` + `aria-busy` during processing, so as not to lose focus.
16. The vehicle year is shown without a thousands separator ("2018") and the dates in long format ("10 de mayo de 2000").
17. C6 with more than one country, or C3 without `name`, are treated as a content error.
18. The step indicator is not shown on the confirmation.

## Pending for Phase 5 (e2e and G5)

AC that jsdom cannot cover: submission with Enter (AC-01.27), responsive (AC-01.28, AC-03.35), new tab (AC-01.21), browser back after paying (AC-03.29), held Enter (AC-03.22), full keyboard (AC-03.33), real network inspection (AC-03.24) and the real change in Strapi (G3-3).
