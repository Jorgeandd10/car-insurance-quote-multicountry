# ADR-0001 — Multi-country strategy in Strapi and Angular

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Deciders | Human (G3) |
| Motivated by | D3, D2, D7 · G2-1, G2-2, G2-3, G2-4, G2-6 · REQ-01.1, REQ-01.2, REQ-01.12, REQ-01.13, REQ-01.18, REQ-01.25, REQ-01.28, REQ-02.1, REQ-02.6, REQ-02.32, REQ-03.15, REQ-03.18, REQ-03.37, REQ-03.38 |

## Context and problem

The PDF requires that "the same application and the same build serve Colombia and Chile", that the multi-country strategy be documented in an ADR, and that the business change the form, plans, prices and texts from Strapi without changing code. D3 (G0) already set the approach: a `Country` collection with relations, no Strapi i18n, and the country in the URL. This ADR documents the alternatives and specifies what D3 leaves open:

1. How each country's content (form, plans, factors, terms and interface texts) is modeled in Strapi.
2. Where the content that belongs to no country lives: the `/` country selection page (G2-3, REQ-01.2).
3. How field roles (G2-1) and sections (G2-6) are represented.
4. How Angular resolves the country and how the wizard routes are built (D7).

## Decision drivers

- A single build (PDF). Nothing that depends on the country can be resolved at build time.
- Configurable without code: fields, options, validations, plans, factors, terms and texts (PDF; `CLAUDE.md` §11; G2-2).
- CO and CL use the same language (Spanish). The differences are market differences (currency, document, minimum age, plans), not language differences.
- A new country should not require code (case C of `country-content`).
- The PDF rules are linked by role, not by label or order (G2-1). The role catalog and the section catalog are closed and live in code (REQ-01.28, REQ-01.12).
- The model must be able to prevent more than one terms text per country (Q-03.12).
- D4 security: minimal public reads and no token.

## Considered options

**Axis A: modeling the country in Strapi**

1. **A1. `Country` collection + relations (D3).** `Country` holds the market data, the interface texts, the price factors and the terms. `form-field` and `plan` are collections with a `manyToOne` relation to `Country`.
2. **A2. Strapi i18n, with one locale per country** (`es-CO`, `es-CL`). Each document has one version per locale and the country is inferred from the `locale` parameter.
3. **A3. One build, environment or Strapi instance per country.** `environment.co.ts` and `environment.cl.ts`, two deployments, or two content databases.

**Axis B: global content (`/` page)**

1. **B1. Single type `country-selection`** with the page texts.
2. **B2. A "global" pseudo-country** in the `Country` collection.
3. **B3. `/` texts in code.**

**Axis C: interface texts per country**

1. **C1. Typed components inside `Country`**, one per screen (`ui.wizard-texts`, `ui.form-step-texts`, `ui.plans-step-texts`, `ui.summary-step-texts`, `ui.confirmation-texts`).
2. **C2. Key-value collection `ui-text`** (`key`, `value`, relation to `Country`).

**Axis D: country resolution in Angular**

1. **D1. First route segment** (`/co/...`), as D3 sets.
2. **D2. Subdomain** (`co.example.test`).
3. **D3. Query parameter or country stored in the browser.**

## Decision

Chosen option: **A1 + B1 + C1 + D1**.

**Strapi** (details in [`docs/architecture/content-model.md`](../architecture/content-model.md)):

- `country` (collection type, Draft & Publish): `code` (unique, `^[a-z]{2}$`), `name`, `intlLocale` (BCP 47, e.g. `es-CO`; `locale` is a reserved name in Strapi 5), `currency` (ISO 4217), `minimumAge` (G2-4), the five text components (C1), `priceFactors` (ADR-0005) and `termsAndConditions` (ADR-0006).
- `form-field` and `plan` (collection types, Draft & Publish) with a `manyToOne` `country` relation (inverse `oneToMany` on `Country`). Each field and each plan is published separately, as AC-01.3, AC-01.10, AC-01.11 and AC-02.5 require.
- The terms are an attribute of `Country`, not a separate collection. Since `code` is unique, **there cannot be more than one terms text per country** (Q-03.12). The app still defends itself if two countries with the same code arrived (REQ-03.18).
- **Roles (G2-1):** `role` attribute of `form-field`, of type `enumeration` with exactly the three values of the code catalog (`documentNumber`, `birthDate`, `vehicleYear`), optional and with at most one value per field. A new role requires code (case B of `country-content`), so the Strapi enum and the TypeScript enum change together.
- **Sections (G2-6):** `section` attribute of type `enumeration` (`policyholder`, `vehicle`), required. The section order is fixed in code; their legends are country texts (`ui.wizard-texts`), shared by step 1 and the summary.
- **i18n disabled** on all content types (`pluginOptions.i18n.localized` absent or `false`).
- **Global content (B1):** single type `country-selection` (Draft & Publish) with `heading`, `intro` (optional) and `countryListLabel`. The country list comes from the published `Country` entries.

**Angular:**

- Routes (paths in English, `CLAUDE.md` §11):

  | Route | Screen | Step (D7) |
  |---|---|---|
  | `/` | Country selection | Not a step |
  | `/:country` | Redirects to `/:country/form` | — |
  | `/:country/form` | Policyholder and vehicle data | 1 |
  | `/:country/plans` | Plans | 2 |
  | `/:country/summary` | Summary and simulated payment | 3 |
  | `/:country/confirmation` | Confirmation | Not a step |
  | `/:country/**` | Redirects to `/:country/form` | — |

- A **`CountryShell`** (component of the `/:country` route) resolves the country and shows "cargando", "error de carga" with "reintentar", "país no disponible" with the published countries as links, or the step. The shell contains the step indicator (REQ-01.31).
- **Uppercase:** a functional guard on the `/:country` route returns a `RedirectCommand` to the same URL with the segment in lowercase (`/CO/plans` → `/co/plans`). Only the case is normalized. A code that is not published does not redirect: it shows "país no disponible" (REQ-01.2).
- **`CountryContext`**: a read-only signal with the active country (code, `intlLocale`, currency, minimum age and texts), which feeds the steps. No component reads the country from another source.
- **Per-country formatting:** `Intl.NumberFormat` and `Intl.DateTimeFormat` with the country's `intlLocale` and `currency`. `LOCALE_ID` and the Angular pipes that depend on locale data registered at build time are **not** used, because the locale is known at runtime.
- No detection by IP or by browser language (G2-3).

## Consequences

- **Positive:**
  - A single build and a single Strapi instance. Adding a country is content (`Country` entry, fields, plans) and not code (case C of `country-content`).
  - The country is part of the navigable state: it can be linked, reloaded and used to separate storage per country (REQ-01.25, REQ-03.37).
  - Queries filter by relation (`filters[country][code][$eq]=co`), a documented REST API operation.
  - Texts are typed attributes. A missing text is detected without searching free-form keys, and the Strapi admin shows one form per screen.
  - Unique terms per country by construction.
- **Negative:**
  - `Country` is a large document (market data, about 45 text strings, factors and terms). Changing a text, a factor or the terms requires republishing the whole country, and a half-finished draft of `Country` blocks publishing other changes to the same country until it is completed or discarded.
  - Adding a new interface text requires changing a component schema and the code (it is a case B, not A).
  - Without i18n, if a country needed two languages this ADR would have to be superseded (e.g. enabling i18n only for the texts).
  - Strapi does not enforce that a `form-field` or a `plan` has a country: one without the relation simply does not appear in any country.
  - Roles are duplicated: enum in Strapi and type in TypeScript. If they diverge, the mapper ignores the unknown role with a warning (table 5.3 of US-01) and may apply G2-5.
- **Risks and mitigation:**
  - *Relations with Draft & Publish:* a published field that points to an unpublished country does not appear; this is the intended behavior. It is verified with the seed (country, fields and plans published).
  - *Performance of relation filters:* the Strapi documentation warns that deep filters can be slow. With two countries and dozens of documents it does not apply; it is reviewed if the volume grows.

### Confirmation

- E2E AC-01.1, AC-01.5, AC-01.6 (including `/CO` → `/co`), AC-01.22, AC-02.5 and AC-03.32 against the seed.
- Unit tests of the lowercase guard and of the `CountryShell` (loading, error and country-not-available states).
- Review: `grep -rE "LOCALE_ID|registerLocaleData|environment\.(co|cl)" frontend/src` with no results; no content type with `i18n.localized: true` in `cms/src/api/**/schema.json`.

## Pros and cons of the options

### A1. `Country` collection + relations (chosen, D3)

- For: models the market as its own entity (currency, minimum age, formatting locale); each field and each plan has its own publication cycle; a new country is content.
- Against: every query has to filter by relation; `Country` grows with the texts.

### A2. Strapi i18n (one locale per country)

- For: native support in Strapi 5 (`?locale=es-CO`); the admin includes a locale selector; translatable texts become "per country" without relations.
- Against: it conflates language with market. CO and CL speak the same language, and a future `en-CO` would break the locale = country equivalence. Non-localized attributes are shared across locales, so a field's type, order or options would be shared, or all of them would have to be localized. Market data (currency, minimum age) still needs its own entity. In addition, `locale` and `localizations` are reserved names and the plugin adds complexity to queries and relations. D3 already discarded it in G0.

### A3. Build, environment or Strapi per country

- For: full isolation; each country is deployed separately; no need to filter by country.
- Against: **it violates the PDF** ("the same application and the same build"). It duplicates the infrastructure and the seed, and a new country requires a deployment. It is documented because it is a real industry practice, but it is discarded because of a PDF constraint.

### B1. Single type `country-selection` (chosen)

- For: separates global content from per-country content; a single entry, with no ambiguity; it has its own Draft & Publish.
- Against: one more content type and one more public permission (`find` on the single type).

### B2. "Global" pseudo-country

- For: adds no content types.
- Against: it pollutes the country list (it would have to be excluded from `/` and from "país no disponible"); it forces filling in meaningless market fields (currency, age).

### B3. `/` texts in code

- For: it is the simplest.
- Against: **it contradicts G2-2**, because only four texts may live in code.

### C1. Typed components per screen (chosen)

- For: typed, required fields per screen, readable form in the admin, no free-form keys with typos, a single request.
- Against: a new text requires changing the schema; `Country` grows.

### C2. Key-value collection `ui-text`

- For: adding a text does not require changing the Strapi schema.
- Against: the code still has to know the key, so a new text still requires code. Keys are free text (a typo equals a missing text). Strapi cannot prevent duplicate keys per country. The admin shows dozens of loose documents and another paginated request is needed.

### D1. Country in the first route segment (chosen, D3)

- For: a single origin; works on `localhost` without configuration; the e2e navigates by URL; linkable.
- Against: the user can type any code, which forces handling unknown codes and uppercase (already specified in G2-3).

### D2. Subdomain

- For: clean URLs; allows cookies and CSP per country.
- Against: requires DNS or `hosts` locally and in the e2e, and nginx with a `server_name` per country; contradicts D3.

### D3. Query param or stored country

- For: simple to implement.
- Against: the stored country cannot be linked or reloaded reliably; with two tabs the state gets mixed; contradicts D3.

## References

Consulted on 2026-11-22:

- Strapi 5, REST API (collection and single type endpoints, format with `documentId`): https://docs.strapi.io/cms/api/rest
- Strapi 5, relation filters (`filters[relation][field][$operator]`) and performance warning: https://docs.strapi.io/cms/api/rest/filters
- Strapi 5, models (`kind`, `manyToOne`/`oneToMany` relations, `options.draftAndPublish`): https://docs.strapi.io/cms/backend-customization/models
- Strapi 5, reserved names (`locale`, `localizations`, `status`, `meta`, `document`...): https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/attributes-and-content-types-names-reserved
- Strapi 5, Draft & Publish: https://docs.strapi.io/cms/features/draft-and-publish
- Angular, guards (`CanActivateFn`, returning `UrlTree` or `RedirectCommand`): https://angular.dev/guide/routing/route-guards
- Angular, zoneless by default since v21: https://angular.dev/guide/zoneless
- Project versions: Angular 22.3.0, Strapi 5.63.0 and Node 24.22.3, verified locally (`docs/phase-1/analysis.md`, "Entorno verificado (local)").

> Translated into English on 2026-11-23 (D16); no content change.
