---
name: country-content
description: End-to-end procedure to add or change country-specific content in this project (a form field, a select option, a validation rule, a field role, a plan, a price factor, UI texts, terms, or a whole new country) across Strapi content types, seed data, Angular mappers/validators and tests. Use when touching cms/ content types or seed, the Angular dynamic form, validator registry or pricing, or when the business asks for a new field, plan or country.
---

# country-content

> **Status: complete after G3 (2026-11-22).** The names come from `docs/architecture/overview.md` §4, `content-model.md` and `api-contracts.md`. If anything in this Skill clashes with those documents or with an accepted ADR, they prevail: notify the orchestrator.

Base decisions: D3 and ADR-0001 (`Country` collection + relations, no i18n; country in the URL), G2-1 (field roles), G2-2 (only 4 fixed texts in code), G2-7 (validation catalog), G2-8 and ADR-0005 (price), G3-2 (public role only `find`).

## Principle

The business changes content from Strapi **without a deployment**. Development only steps in when a **new type** appears (field type, validation type, role, price operand) or a new country with something the model does not cover.

## Case A — Content-only change (no code)

Examples: add a field of an existing type, reorder, change texts or messages, assign an existing role, add an option to a `select`, create or deactivate a plan, change a price band or multiplier, edit terms.

1. Do it in the Strapi admin and **publish** (Draft & Publish). The draft does not reach the app: the `published-only` middleware prevents it (ADR-0003).
2. Reload the app at `/co` or `/cl` and check the change. There is no cache: nginx responds with `Cache-Control: no-store` (ADR-0003).
3. If the change must be part of the reproducible environment, reflect it in the seed `cms/src/seed/data/{co,cl}.ts` (or `country-selection.ts` for the `/` page). The seed is idempotent and does not overwrite changes made in the admin.

Check: no file in `frontend/` changes. If an e2e covers the case, it is tested by interception with `page.route` (G3-3); the real change in Strapi is checked by hand in G5 (`docs/qa/manual-check.md`).

## Case B — New validation type, field type, role or operand (requires code)

Mandatory order (spec first):

1. **Spec and ADR:** new `REQ` in the affected spec. If the contract changes, a new ADR that `Supersedes` the affected one; an accepted ADR is not edited.
2. **Strapi** (`cms/src/`):
   - Field type: enum `form-field.type`.
   - Validation type: enum `form.validation-rule.kind` (component `components/form/validation-rule.json`).
   - Role: enum `form-field.role` (and `pricing.price-factor.role` if the price uses it).
   - Price operand: enum `pricing.price-factor.operand`.
   - New interface text: mandatory attribute in the screen's `ui.*` component (G3-5).
3. **Angular** (`frontend/src/app/`): `core/cms/strapi-dto.ts` → `core/cms/form-field-mapper.ts` (tables of `api-contracts.md` C4) → domain types (`api-contracts.md` §3) → `features/form-step/validation/validator-registry.ts`. The validator is a **pure function** with a unit test named by `REQ`/`AC`. A new operand goes in `domain/pricing/compute-final-price.ts`.
4. **Seed:** one example per country in `cms/src/seed/data/{co,cl}.ts`.
5. **Tests:** unit tests of the validator or the operand and of the mapper; e2e by interception if it affects the flow.
6. **Traceability:** row in `docs/traceability.md` and commit with the IDs.

## Case C — New country

1. Human decision (`Dn`) and ADR if anything in the model changes.
2. **Strapi:** published `country` document with `code`, `name`, `intlLocale` (not `locale`: it is a reserved name in Strapi 5), `currency`, `minimumAge`, the 5 `ui.*` components, `priceFactors` and `termsAndConditions`, plus its related `form-field` (with the roles `documentNumber`, `birthDate` and `vehicleYear` assigned, G2-5) and `plan` entries, all published. Add it to the seed.
3. **Angular:** check that the `/:country/...` route, `Intl` with `country.intlLocale` and `country.currency`, and the `ciq.v1.{cc}.*` keys work without new code. If code is needed, it is a design defect: record it as a finding.
4. **Seed and smoke e2e** for the new country.

## Common checks

- No token reaches the browser. The public role only has `find` on the types Angular reads (G3-2); the new permission is added in `cms/src/seed/permissions.ts` with its reason.
- Price formatted with `Intl.NumberFormat(country.intlLocale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })`. COP uses U+00A0 after `$` (AC-02.8).
- Visible texts come from Strapi. The only exceptions are "cargando", "error de carga", "reintentar" and "país no disponible" (`core/ui-state/fixed-texts.ts`, G2-2).
- The data saved in `sessionStorage` (`ciq.v1.{cc}.*`) stays valid after the change, or is discarded in a controlled way in `reconcile-step1.ts`.
