# ADR-0003 — Strapi access, security, caching and content changes in the e2e tests

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Deciders | Human (G3) |
| Motivated by | D4, D9 · G2-13 (Q-01.20) · G3-2, G3-3 · REQ-01.6, REQ-01.35, REQ-02.2, REQ-02.23, REQ-02.31, REQ-03.20, REQ-03.24 · AC-01.3, AC-01.10, AC-01.11, AC-01.13, AC-01.30, AC-01.31, AC-02.21, AC-02.25, AC-02.31, AC-03.15, AC-03.19, AC-03.24 |

## Context and problem

The PDF requires that "no Strapi token with write permissions may reach the browser" and "public role permissions minimal and justified". D4 (G0) set the following: public role with only `find`/`findOne`, nginx as a GET-only proxy with an allowlist, no token in the browser and no BFF. Four things remain to be specified:

1. The exact permissions and the allowlist.
2. That "reload" always shows what is published: no intermediate cache (Q-01.20, REQ-01.6, REQ-02.23).
3. That drafts are never served (REQ-01.6, REQ-02.2).
4. How to test the ACs that describe a content change in Strapi (AC-01.3, AC-01.10, AC-01.11, AC-01.13, AC-01.31, AC-02.21, AC-02.25, AC-03.15, AC-03.19) without breaking the single-command startup or introducing credentials.

### Finding: the public role can read drafts

In Strapi 5, the REST API `status` parameter accepts `draft` and `published`, and the default value is `published`. **There is no separate permission for reading drafts.** According to the open request on the Strapi feedback portal (February 3, 2026), "any user with find or findOne permission on a content-type can access draft entries by using the status parameter". The Draft & Publish documentation confirms that the Content API can request "draft or published content" with `status`, and also mentions the `publicationFilter` parameter. The `status` parameter page does not say which permission `status=draft` requires (orchestrator verification in `reviews/001-G3-architecture-check.md`). That is why the middleware is kept as defense in depth, and its confirmation `curl` is mandatory during implementation.

Consequence: with D4 as it stands, a public `GET /api/plans?status=draft` request could return drafts (unpublished plans or terms). The app never makes it (REQ-01.6), but a visitor could. D4 remains viable, but it needs an additional measure that does not contradict it: forcing `published` on the public routes.

## Decision drivers

- No token in the browser or in the bundle (`CLAUDE.md` §6).
- Minimal public surface: only what US-01, US-02 and US-03 read (api-contracts).
- Defense in depth: a failure in one layer (nginx, Strapi permissions or code) does not expose writes or drafts.
- Changes visible on reload, with no intermediate HTTP cache.
- E2E tests reproducible with `docker compose up` by anyone who clones the repository, without manual steps or credentials (PDF: "a single command to start the whole project").
- No new dependencies.

## Considered options

**Axis 1: how the browser reaches Strapi**

1. **1a. nginx same origin, GET-only with an exact allowlist and header sanitization (D4).**
2. **1b. Browser directly to Strapi (`:1337`) with CORS.**
3. **1c. Custom BFF** (Node) that calls Strapi with server credentials.

**Axis 2: how to avoid drafts in public reads**

1. **2a. Strapi route middleware `published-only`** on the public `find` routes, plus a best-effort rejection in nginx.
2. **2b. nginx only**: reject `status` and `publicationFilter` in the query.
3. **2c. Disable Draft & Publish** on the public content types.
4. **2d. Third-party plugin** (`strapi-plugin-draft-preview`, `guardNativeStatus` option).

**Axis 3: how the content-change ACs are tested** (G3-3)

1. **3a. Real writes to Strapi from the Playwright Node process** with a Custom API token created by hand in the admin.
2. **3b. Automated administrator login** from Playwright and use of the admin's internal endpoints (Content Manager).
3. **3c. Network interception only** (`page.route`): the e2e modifies Strapi's real response in the test browser.
4. **3d. Manual verification** of the real change in Strapi.

## Decision

Chosen option: **1a + 2a + 3c**, with **3d** for the real change in Strapi, which is checked by hand in G5 (G3-3).

### 1. Strapi public role (idempotent bootstrap)

**Only `find`**, without `findOne`, on four types (G3-2: a refinement of D4, which set `find`/`findOne` as the maximum):

| Permission | Reason | Reads that use it |
|---|---|---|
| `api::country.country.find` | Country list (`/`, "país no disponible"), country configuration, factors, terms | C1, C3, C6, C7 (api-contracts) |
| `api::form-field.form-field.find` | The country's step 1 fields | C4 |
| `api::plan.plan.find` | The country's plans | C5 |
| `api::country-selection.country-selection.find` | `/` texts | C2 |

- **`findOne` is not granted** on any type: no read needs it (the chosen plan is checked against the list, REQ-03.14).
- The bootstrap **removes any other permission** from the public role (including those of `plugin::users-permissions.auth.*` and those of `upload`) and disables user registration ("Enable sign-ups" = false) in the Users & Permissions advanced settings. It is idempotent: on every startup it leaves exactly this table.
- No type uses i18n (ADR-0001). The `authenticated` role has no permissions.

### 2. nginx (the browser's only entry point)

- Serves the Angular build and proxies `/api` to Strapi on the internal Docker network. The Strapi port is published only on `127.0.0.1:1337`, for the business admin. The Strapi admin does not go through nginx.
- **Exact allowlist** with `location =`:
  - `/api/countries`
  - `/api/form-fields`
  - `/api/plans`
  - `/api/country-selection`
- `location /api/` → `404` for everything else: `findOne` (`/api/plans/<id>`), `/api/auth/*`, `/api/upload`, `/api/users`...
- In each allowed `location`, `limit_except GET { deny all; }`. According to the nginx documentation, allowing `GET` also allows `HEAD`; any other method receives `403`.
- **Request sanitization:** `proxy_set_header Authorization "";` and `proxy_set_header Cookie "";`. Even if a header arrived from the browser, it is never forwarded.
- **Best-effort draft rejection:** `if ($args ~* "(^|&)(status|publicationFilter)(=|%5B|\[)") { return 400; }`. It is *best-effort* because `$args` is the undecoded query and an encoded key (`%73tatus`) would bypass it. The real guarantee is the Strapi middleware.
- **Caching:**
  - On `/api/*`: `proxy_hide_header Cache-Control; proxy_hide_header Expires; add_header Cache-Control "no-store" always;` and no `proxy_cache`.
  - `index.html`: `Cache-Control: no-cache`.
  - Build bundles with a hash: `Cache-Control: public, max-age=31536000, immutable`.
  - Since `add_header` is only inherited if the current level defines none (nginx documentation), the security headers are repeated in every `location` that defines `add_header`.
- **SPA security headers:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`. `style-src 'unsafe-inline'` is the fallback Angular documents for static hosts without a per-request nonce (Angular inserts component `<style>` elements). If the build inserts inline scripts or handlers (e.g. the critical CSS `onload`), `autoCsp` is enabled or critical CSS inlining is disabled; the Angular Developer decides this when verifying the CSP in the browser.

### 3. Strapi: published-only reads in the Content API (2a)

- Route middleware `global::published-only` (`cms/src/middlewares/published-only.ts`), referenced in `config.find.middlewares` of the `createCoreRouter` of the four public types. Before calling `next()`, it replaces `ctx.query.status` with `'published'` and removes `ctx.query.publicationFilter`. It applies to all `find` requests of those types.
- Since no client writes through the Content API (neither the app nor the e2e tests, see §5), the four routers are declared with **`only: ['find']`**. The Content API `findOne`, `create`, `update` and `delete` routes are not loaded. The Strapi admin is not affected, because it uses its own API, not these routes.
- REST API configuration (`cms/config/api.ts`): explicit `defaultLimit: 25`, `maxLimit: 100`, so that the contract's pagination (pageSize 100) is predictable.

### 4. Angular

- `CmsClient` uses relative URLs (`/api/...`) and `HttpClient` without authentication interceptors. **There is no variable, constant or `environment` with credentials.**
- In development, `ng serve` uses `proxy.conf.json` pointing to nginx (`http://localhost:8080`), not to Strapi, so the same allowlist is tested.
- There is no persistent content cache: no `localStorage`, no `sessionStorage`, no service worker (`@angular/service-worker` is not installed). The country configuration is kept in memory for the lifetime of the app load (ADR-0004).
- The simulated payment makes no request (REQ-03.20).

### 5. Content-change ACs: interception (3c) and manual check in G5 (3d)

**Mechanism.** The e2e does not write to Strapi or use any credential. To simulate "the business publishes a change and I reload":

1. Loads the page against the real Strapi with the seed.
2. Registers `page.route` on the affected request. The handler gets the **real response** with `route.fetch()`, applies only the scenario's change to its JSON and returns it with `route.fulfill({ response, body })`.
3. Reloads and checks the UI.

This way only the change is simulated; the rest of the response (v5 format, `documentId`, components) is Strapi's.

| AC | Change applied by the interception |
|---|---|
| AC-01.3 | C4: adds a new published field |
| AC-01.10 | C4: removes field A and swaps the `order` of B and C |
| AC-01.11 | No interception: the **seed includes one draft field per country** (content-model §6), and the e2e checks against the real Strapi that it does not appear and that no app request carries `status` or `publicationFilter` |
| AC-01.13 (2nd part) | C4: adds the option "Marca C" to the brand `select` |
| AC-01.31 | C3: changes `formStepTexts.continueLabel` only in the CL response; CO unchanged |
| AC-02.21, AC-03.19 | C5: removes the persisted plan from the list (deactivated or unpublished) or changes its `currency` |
| AC-02.25 | C5 or C6: changes the order, the recommended plan, a plan's base price, or a `priceFactors` band |
| AC-03.15 | C7: changes CL's `termsAndConditions` |

Interception also covers the cases Strapi does not allow publishing, and failures: missing required text (AC-01.35, AC-02.33, AC-03.36; G3-5), unknown type or field without a label (AC-01.25), different currency (AC-02.14), plan without a price (AC-02.15), 30 plans (AC-02.32), errors and latency (AC-01.7, AC-01.8, AC-02.23, AC-02.24, AC-03.16, AC-03.17) and terms with HTML (AC-03.14).

**Manual check in G5 (G3-3).** With the stack running, the human:

1. Adds and publishes a new field for a country in the Strapi admin, reloads the app and checks that it appears (AC-01.3).
2. Deactivates a plan, reloads the plans step and checks that it no longer appears (AC-02.25).
3. Reverts both changes.

The result is recorded in `docs/qa/manual-check.md`. The e2e report states that the real Strapi → app integration for those ACs is verified in that check.

## Consequences

- **Positive:**
  - Three independent layers:
    - nginx: GET-only, allowlist and no `Authorization`.
    - Permissions: only `find` on four types, and routers with `only: ['find']`.
    - Strapi middleware: published only.
  - An error in one of them does not expose writes or drafts.
  - There is no write credential anywhere in the project: not in `.env`, not in `e2e/`, not in the frontend. The surface of the PDF's security requirement is reduced to zero.
  - All e2e tests run with `docker compose up` and `npx playwright test`, with no prior steps. No AC is left "Not executed" for anyone who clones the repository.
  - The e2e tests do not modify the demo database and can run in parallel.
  - "Reload" always asks Strapi and nothing in between stores responses (Q-01.20).
- **Negative:**
  - The PDF scenarios "Configuration change without deployment" (AC-01.3) and the plans change (AC-02.25) **are not tested automatically against a real change in Strapi**. What is automated proves that the app reflects a different response on reload. That Strapi produces that response after publishing is checked once by hand in G5, and that evidence is not repeated on every run.
  - `route.fetch()` + modification depends on the e2e knowing the JSON shape (api-contracts). If the contract changes, the tests must be updated.
  - Unpublishing from the admin is only checked indirectly (seed drafts and manual check).
  - `no-store` prevents any browser caching for `/api`. At this volume it does not matter, but each reload costs all the requests.
  - `style-src 'unsafe-inline'` weakens the CSP against style injection (it is the documented alternative without a nonce).
  - The `published-only` middleware and `only: ['find']` are custom code in `cms/`: if a new public content type does not reference them, it is exposed. A review checklist item watches for it.
- **Risks and mitigation:**
  - *`ctx.query` is not yet processed when the route middleware runs* (the documentation does not specify it). It is checked with the confirmation below. If it fails, a global middleware registered in `config/middlewares.ts` after `strapi::query` is used.
  - *Exposure of the Strapi admin:* only on `127.0.0.1`. The admin uses its own session, which is Strapi's intended use and is not part of the public app.

### Confirmation

- With the stack running (`docker compose up`):
  - `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/plans` → `403`
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/plans/abc` → `404`
  - `curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/plans?status=draft"` → `400`
  - `curl -s "http://127.0.0.1:1337/api/plans?status=draft"` (directly to Strapi) → only published plans: the seed has one draft per country (REQ-02.33) that must **not** appear. The same with `/api/form-fields?status=draft` and the seed's draft field
  - `curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:1337/api/plans` → `404` or `405` (route not loaded because of `only: ['find']`)
  - `curl -sI http://localhost:8080/api/countries` → includes `Cache-Control: no-store`
- E2E AC-01.30, AC-02.31 and AC-03.24: no request from the page carries `Authorization`, and all `/api` requests are `GET`.
- G5: `docs/qa/manual-check.md` records the manual check of the new field and of the deactivated plan.
- Review (security checklist):
  - `grep -rniE "authorization|bearer|api[_-]?token" frontend/ e2e/` → only the AC-01.30 assertion in `e2e/` (it checks the *absence* of the header).
  - `.env.example` contains no Strapi token variable.
  - The bootstrap's public permissions match the table.
  - Each public router has `only: ['find']` and references `global::published-only`.

## Pros and cons of the options

### 1a. nginx same origin (chosen, D4)

- For: no CORS; a single controllable public surface; sanitizes headers; serves the SPA and the API from the same origin.
- Against: allowlist duplicated with respect to the permissions (two places to maintain).

### 1b. Browser directly to Strapi

- For: one component fewer.
- Against: exposes all Strapi routes (admin included) to the browser, requires CORS and does not allow restricting methods or headers; contradicts D4.

### 1c. BFF

- For: could hide Strapi completely and validate parameters.
- Against: more code and more infrastructure; D4 explicitly excludes it.

### 2a. `published-only` middleware in Strapi (chosen) + best-effort nginx

- For: acts on the query already parsed by Strapi, not on the raw string; does not depend on third parties.
- Against: custom code that has to be referenced in every public router.

### 2b. nginx only

- For: zero code in Strapi.
- Against: it is bypassed by encoding the parameter key, and it does not protect direct access to `127.0.0.1:1337`.

### 2c. No Draft & Publish

- For: removes the problem at the root.
- Against: **it violates** the PDF ("only published and active plans") and AC-01.11 and AC-02.5, which require drafts.

### 2d. Third-party plugin

- For: solves the case with one option.
- Against: a new third-party dependency for a security rule, maintained outside Strapi; the equivalent middleware is short.

### 3a. Real writes with a Custom token (discarded in G3-3)

- For: automatically tests the real Strapi → app integration with the documented Content API. The token would have minimal scope, would never touch the browser and could be revoked.
- Against (reason for discarding it):
  - Strapi does not document how to create tokens in code, so it would have to be created **by hand** in the admin. That is a manual step that clashes with the single-command startup the PDF requires.
  - For anyone who clones the repository without that token, **5 ACs would be left "Not executed"** (AC-01.3, AC-01.10, AC-01.11, AC-01.31 and AC-02.25).
  - In addition, it would add a write credential to the project, tests that mutate the demo database, serial execution with restoration, and unpublishing simulated with deletions.

### 3b. Automated admin login

- For: fully automatic; it would allow truly unpublishing with the Content Manager.
- Against: depends on **undocumented internal endpoints** of the admin, which may change between minor versions. It would require super administrator credentials in the test environment, with far more scope than any token. The official alternatives (admin tokens) are also created by hand.

### 3c. Interception only (chosen, G3-3)

- For: no credentials or manual steps; deterministic and fast; reproducible by anyone who clones the repository; with `route.fetch()` only the change is simulated and the rest of the response is the real one.
- Against: it does not automatically test that Strapi produces the response after publishing. It is compensated by 3d in G5.

### 3d. Manual verification (complement to 3c, G5)

- For: checks the real integration with the admin, including publishing and deactivating.
- Against: it is not repeatable on every run; the evidence is a manual record.

## References

Consulted on 2026-11-22:

- Strapi 5, REST API (endpoints, `POST`/`PUT`, `?status=draft`): https://docs.strapi.io/cms/api/rest
- Strapi 5, `status` parameter (default `published`, applies to populated relations): https://docs.strapi.io/cms/api/rest/status
- Strapi 5, Draft & Publish (`status` in the Content API, `publicationFilter`, unpublishing in the admin): https://docs.strapi.io/cms/features/draft-and-publish
- Strapi, open request "Prevent users from querying draft content via REST/GraphQL (via status filter)" (2026-02-03): https://feedback.strapi.io/feature-requests/p/prevent-users-from-querying-draft-content-via-rest-graphql-via-status-filter
- Strapi 5, routes (`createCoreRouter`, `only`, `except`, `config.find.middlewares`): https://docs.strapi.io/cms/backend-customization/routes
- Strapi 5, middlewares (location, signature, `global::`): https://docs.strapi.io/cms/backend-customization/middlewares
- Strapi 5, pagination (`pageSize` capped by `api.rest.maxLimit`): https://docs.strapi.io/cms/api/rest/sort-pagination
- Strapi 5, API tokens (created in the admin; no documented creation in code): https://docs.strapi.io/cms/features/api-tokens
- Strapi 5, admin tokens (also created in the admin): https://docs.strapi.io/cms/features/admin-tokens
- Strapi 5, Users & Permissions (public role, "Enable sign-ups"): https://docs.strapi.io/cms/features/users-permissions
- nginx, `limit_except` (GET implies HEAD): https://nginx.org/en/docs/http/ngx_http_core_module.html#limit_except
- nginx, `add_header` (`always`, inheritance rules): https://nginx.org/en/docs/http/ngx_http_headers_module.html
- Angular, security (sanitization, CSP, `autoCsp`, `'unsafe-inline'` in `style-src` without a nonce): https://angular.dev/best-practices/security
- Playwright, network (`page.route`, modifying responses with `route.fetch()` + `route.fulfill()`, covers fetch and XHR): https://playwright.dev/docs/network

> Translated into English on 2026-11-23 (D16); no content change.
