# Review 002 — Phase 4: implementation of US-01, US-02 and US-03 (frontend, Strapi, nginx, compose)

| Field | Value |
|---|---|
| Reviewer | Code Reviewer (subagent), model: Claude Opus 5.5 (`claude-opus-5-5`) |
| Date | 2026-11-23 |
| Scope | `git diff 3708a48..f69ae34` (Phase 3 merge → Phase 4 merge; commits `40840ed`, `f5e47f1`, `f411a8b`, `0cb032c`, `078d59a`, `b22d2ad`, `b423202`) · files: `frontend/`, `cms/`, `infra/nginx/`, `docker-compose.yml`, `.env.example`. Excluded: `e2e/` (in progress by `qa-engineer`) |
| Reference specs / ADRs | `specs/US-01/spec.md`, `specs/US-02/spec.md`, `specs/US-03/spec.md` (Approved); ADR-0001 to ADR-0007 (Accepted); `docs/architecture/*`; `docs/decision-log.md` (D, G1, G2, G3); `docs/qa/phase-4-implementation-notes.md` (18 decisions accepted by the human, not reported unless contradicted) |
| Verdict | **Changes required** (1 Major security finding in the nginx allowlist and 1 Major on REQ-03.19) |

## Commands run

Build and tests (in `frontend/`, against the `f69ae34` tree; `git status` clean at the start):

```text
$ npx ng build
✔ Building...
Initial chunk files | Names                  |  Raw size | Estimated transfer size
main-Q3HR5Q2P.js    | main                   | 293.67 kB |                79.70 kB
styles-32OBUCRH.css | styles                 | 583 bytes |               583 bytes

                    | Initial total          | 294.25 kB |                80.29 kB

Lazy chunk files    | Names                  |  Raw size | Estimated transfer size
chunk-D2fEVYoC.js   | form-step-page         |  61.70 kB |                16.15 kB
chunk-_XEHCKgE.js   | summary-step-page      |  21.41 kB |                 5.78 kB
chunk-ChNlEmM7.js   | plans-step-page        |   8.16 kB |                 2.64 kB
chunk-DILP5ryJ.js   | country-shell          |   5.89 kB |                 2.07 kB
chunk-CYfOry9E.js   | -                      |   3.98 kB |                 1.64 kB
chunk-DZtQEVOn.js   | country-selection-page |   2.51 kB |                 1.17 kB
chunk-B_Zt-cga.js   | confirmation-page      |   2.39 kB |                 1.05 kB
chunk-BCNES1iT.js   | -                      |   1.35 kB |               656 bytes
chunk-C63M3kFm.js   | -                      |   1.28 kB |               630 bytes
chunk-B9WkiKwg.js   | -                      | 625 bytes |               625 bytes
chunk-CGwJUSht.js   | -                      | 153 bytes |               153 bytes

Application bundle generation complete. [10.363 seconds] - 2026-11-23T06:31:20.793Z

$ npx ng test --watch=false
 RUN  v5.1.1 C:/Users/Jorge Andres/Documents/_SURA/car-insurance-quote-multicountry/frontend

 Test Files  45 passed (45)
      Tests  457 passed (457)
   Start at  01:31:42
   Duration  15.73s (environment 76%, tests 13%, setup 7%, import 1%, transform 1%)

$ npx prettier --check "src/**/*.{ts,html,css}"
Checking formatting...
All matched files use Prettier code style!
```

The `main-Q3HR5Q2P.js` that nginx serves on `:8080` has the same hash as the local build: the running stack corresponds to `f69ae34`.

Secrets, tokens and Angular rules (`grep` from the root):

```text
$ grep -rniE "authorization|bearer|api[_-]?token|innerHTML|outerHTML|bypassSecurityTrust|DomSanitizer|localStorage|insertAdjacentHTML|document\.write|eval\(|new Function" frontend/src infra docker-compose.yml
frontend/src/app/app.config.ts:7: * carry no `Authorization` and no credentials (REQ-01.35, D4).
frontend/src/app/core/cms/cms-client.spec.ts:40:  it('REQ-01.35 sends a GET to the relative /api URL, without Authorization nor credentials', async () => {
frontend/src/app/core/cms/cms-client.spec.ts:44:    expect(req.request.headers.has('Authorization')).toBe(false);
frontend/src/app/core/cms/cms-client.ts:50: * - Only `GET`, relative `/api/...` URLs, no `Authorization` and no cookies (REQ-01.35, D4).
frontend/src/app/features/summary-step/summary-step-page.spec.ts:118:      expect(w.root().innerHTML).not.toContain('1234567890');
frontend/src/app/features/summary-step/summary-step-page.spec.ts:132:      expect(w.root().innerHTML).not.toContain('12.345.678-5');
frontend/src/app/features/summary-step/terms/terms-blocks.ts:7: * lists only, built with `@if`/`@for` and interpolation. No `innerHTML`, no `DomSanitizer`, no
frontend/src/app/features/summary-step/terms/terms-blocks.ts:8: * `bypassSecurityTrust*` (REQ-03.16, AC-03.14). A Strapi heading of level n becomes `h(n+2)`,
infra/nginx/snippets/strapi-api.conf:24:proxy_set_header Authorization "";
docker-compose.yml:4:#        allowlist, Authorization/Cookie stripped, Cache-Control: no-store (ADR-0003).

$ grep -rnE ":\s*any\b|<any>|as any|\*ngIf|\*ngFor|NgModule|constructor\(" frontend/src --include=*.ts --include=*.html
frontend/src/app/core/cms/cms-error.ts:10:  constructor(
frontend/src/app/core/country/country-route-reuse-strategy.spec.ts:12:  constructor() {
frontend/src/app/features/country-selection/country-not-available.ts:62:  constructor() {
frontend/src/app/features/country-selection/country-selection-page.ts:94:  constructor() {
frontend/src/app/features/summary-step/summary-step-page.ts:205:  constructor() {
frontend/src/app/features/wizard-shell/country-shell.ts:87:  constructor() {
frontend/src/app/shared/step-heading.ts:24:  constructor() {
[reviewer's note: the constructors take no dependencies; they only register effect/afterNextRender, and cms-error.ts is an Error class]

$ grep -lE "Bearer|Authorization|api_token|APP_KEYS|JWT_SECRET" frontend/dist/car-insurance-quote/browser/*
[reviewer's note: no output]

$ git ls-files | grep -iE "(^|/)\.env" ; git ls-files | grep -iE "\.db$|\.tmp/"
.env.example

$ grep -rnE "aria-label=\"[^\"]+\"|title=\"|placeholder=|alt=\"" --include=*.html --include=*.ts frontend/src/app | grep -v spec
$ grep -rnE ">[^<{}@ \n][^<{}]*<" --include=*.html frontend/src/app
frontend/src/app/features/form-step/dynamic-form.html:20:  <span class="required-mark" aria-hidden="true">*</span>
frontend/src/app/features/form-step/dynamic-form.html:28:  <span class="required-mark" aria-hidden="true">*</span>
[reviewer's note: the only literal text in templates, the "*" of accepted decision 8]
```

nginx allowlist and methods (running stack, `B=http://localhost:8080`):

```text
$ for u in ...; do curl -s -g -o /dev/null -w "%{http_code}\n" "$B$u"; done
/api/countries                                               200
/api/plans/abc                                               404
/api/plans?status=draft                                      400
/api/plans?%73tatus=draft                                    200
/api/users                                                   404
/api/users/me                                                404
/api/upload/files                                            404
/api/auth/local                                              404
/api/plans/                                                  404
/api//plans                                                  404
/api/plans/..%2F..%2Fapi%2Fusers                             404
/api/users/..%2Fplans                                        403
/api/users/x/..%2F..%2Fplans                                 404
/api/plans;x                                                 404
/api/PLANS                                                   404
/api/plans%3F                                                404
/api/countries?populate=*                                    200
/api/plans?populate=*                                        200
/api/form-fields?populate=*                                  200
/api/plans?populate[country][populate]=*                     200
/api/plans?fields[0]=createdBy                               400
/api/plans?populate=createdBy                                400
/api/plans?populate[createdBy]=true                          400
/api/plans?filters[createdBy][email][$contains]=a            400
/admin                                                       200
/api/plans?hasPublishedVersion=false                         200
/api/plans?publicationFilter=never-published                 400
/api/plans?status%5B0%5D=draft                               400
/api/plans?a=1&STATUS=draft                                  400
/api/plans?pagination[pageSize]=1000                         200
POST     403
PUT      403
DELETE   403
PATCH    403
OPTIONS  403
HEAD     200
TRACE    405
```

(`/admin` → 200 is the SPA's `index.html` served by `try_files`, not the Strapi admin.)

nginx response versus Strapi response, to tell which one answers:

```text
$ curl -s -i "$B/api/users" | head -12
HTTP/1.1 404 Not Found
Server: nginx
Content-Type: text/html
Content-Length: 146
Cache-Control: no-store
[reviewer's note: lines omitted]
<html>

$ for u in "/api/users/..%2Fplans" "/api/upload/files/..%2F..%2Fplans" "/api/connect/..%2Fplans" "/api/users-permissions/roles/..%2F..%2Fplans" "/api/i18n/locales/..%2F..%2Fplans"; do curl -s -i "$B$u" | head -20 | grep -iE "^HTTP|^content-type|cache-control|\{" ; done
== /api/users/..%2Fplans
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
{"data":null,"error":{"status":403,"name":"ForbiddenError","message":"Forbidden","details":{}}}
== /api/upload/files/..%2F..%2Fplans
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
{"data":null,"error":{"status":403,"name":"ForbiddenError","message":"Forbidden","details":{}}}
== /api/connect/..%2Fplans
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
{"data":null,"error":{"status":403,"name":"ForbiddenError","message":"Forbidden","details":{}}}
== /api/users-permissions/roles/..%2F..%2Fplans
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
{"data":null,"error":{"status":403,"name":"ForbiddenError","message":"Forbidden","details":{}}}
== /api/i18n/locales/..%2F..%2Fplans
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
{"data":null,"error":{"status":404,"name":"NotFoundError","message":"Not Found","details":{}}}

$ for u in "/admin/init%2F..%2F..%2Fapi%2Fplans" "/admin/users/1%2F..%2F..%2F..%2Fapi%2Fplans" "/admin/init" "/content-manager/collection-types/api::plan.plan/x%2F..%2F..%2F..%2F..%2Fapi%2Fplans"; do curl -s -o b.txt -w "%{http_code} %{content_type} " "$B$u"; head -c 110 b.txt; done
/admin/init%2F..%2F..%2Fapi%2Fplans                       403 application/json; charset=utf-8 {"data":null,"error":{"status":403,"name":"ForbiddenError","message":"Forbidden"}}
/admin/users/1%2F..%2F..%2F..%2Fapi%2Fplans               403 application/json; charset=utf-8 {"data":null,"error":{"status":403,"name":"ForbiddenError","message":"Forbidden"}}
/admin/init                                               200 text/html <!doctype html> <html lang="es">   <head>     <meta charset="utf-8"/>     <!-- G2-2: the only copy allowed in
/content-manager/collection-types/api::plan.plan/x%2F..%2F..%2F..%2F..%2Fapi%2Fplans 401 application/json; charset=utf-8 {"data":null,"error":{"status":401,"name":"UnauthorizedError","message":"Missing or invalid credentials","deta
```

`published-only` (through nginx and directly to Strapi; the seed has one draft plan and one draft field per country):

```text
plans?%73tatus=draft                    8 items, total=8 names=Plan Esencial|Plan Plus|Plan Total|Plan Clásico|Plan Básico|Plan Full|Plan Máximo|Plan Clásico
plans?hasPublishedVersion=false         8 items, total=8 names=Plan Esencial|Plan Plus|Plan Total|Plan Clásico|Plan Básico|Plan Full|Plan Máximo|Plan Clásico
plans?%70ublicationFilter=never-published8 items, total=8 names=Plan Esencial|Plan Plus|Plan Total|Plan Clásico|Plan Básico|Plan Full|Plan Máximo|Plan Clásico
== direct strapi
direct plans?status=draft               8 items Plan Esencial|Plan Plus|Plan Total|Plan Clásico|Plan Básico|Plan Full|Plan Máximo|Plan Clásico
direct form-fields?status=draft 15 items, keys=co_documentType,co_documentNumber,co_birthDate,co_city,co_dataConsent,co_plate,co_make,co_vehicleYear,cl_rut,cl_birthDate,cl_city,cl_dataConsent,cl_licensePlate,cl_make,cl_vehicleYear
form-fields published 15 items
direct POST 405

== /api/countries?fields[0]=code&%73tatus=draft&populate[formFields][fields][0]=key&populate[plans][fields][0]=name
co fields: co_documentType,co_documentNumber,co_birthDate,co_city,co_dataConsent,co_plate,co_make,co_vehicleYear | plans: Plan Esencial,Plan Plus,Plan Total,Plan Clásico
cl fields: cl_rut,cl_birthDate,cl_city,cl_dataConsent,cl_licensePlate,cl_make,cl_vehicleYear | plans: Plan Básico,Plan Full,Plan Máximo,Plan Clásico
== direct strapi draft populate (status=draft, relaciones pobladas)
co co_documentType,co_documentNumber,co_birthDate,co_city,co_dataConsent,co_plate,co_make,co_vehicleYear | Plan Esencial,Plan Plus,Plan Total,Plan Clásico
cl cl_rut,cl_birthDate,cl_city,cl_dataConsent,cl_licensePlate,cl_make,cl_vehicleYear | Plan Básico,Plan Full,Plan Máximo,Plan Clásico
```

Neither `co_referralCode`/`cl_referralCode` nor "Plan Élite" (seed drafts) appear in any case.

Headers:

```text
== /
HTTP/1.1 200 OK
Cache-Control: no-cache
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
== /co/summary
[reviewer's note: headers identical to those of /, omitted]
== /api/countries
HTTP/1.1 200 OK
Cache-Control: no-store
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'; ...
== /main-Q3HR5Q2P.js
HTTP/1.1 200 OK
Cache-Control: public, max-age=31536000, immutable
$ curl -s $B/ | grep -iE "<script|<link|style"
    <link rel="icon" type="image/x-icon" href="favicon.ico"/>
  <link rel="stylesheet" href="styles-32OBUCRH.css"></head>
  <script src="main-Q3HR5Q2P.js" type="module"></script></body>

$ for f in chunk-*; do curl -s -D - -o /dev/null "$B/$f" | grep -i cache-control; done
chunk-B9WkiKwg.js      Cache-Control: public, max-age=31536000, immutable
chunk-BCNES1iT.js      Cache-Control: public, max-age=31536000, immutable
chunk-B_Zt-cga.js      
chunk-C63M3kFm.js      Cache-Control: public, max-age=31536000, immutable
[reviewer's note: lines omitted]
chunk-DZtQEVOn.js      Cache-Control: public, max-age=31536000, immutable
chunk-_XEHCKgE.js      
missing chunk: 404 text/html
```

Re-evaluation of `isComplete` after a retry (ADR-0004 §Navigation, "G2 backstop"):

```text
$ grep -rn "isComplete" --include=*.ts frontend/src/app | grep -v "\.spec\.ts"
./features/form-step/step1-schema.ts:15: *   `evaluateStep1` uses for `isComplete`. ...
./features/form-step/validation/evaluate-step1.ts:27:  readonly isComplete: boolean;
./features/form-step/validation/evaluate-step1.ts:53:    isComplete: form.status === 'ready' && fields.length > 0 && fields.every((f) => f.valid),
./features/form-step/validation/step1-complete-guard.ts:12: * it. If `isComplete` is false the navigation goes to `/:country/form`, before the step is
./features/form-step/validation/step1-complete-guard.ts:31:  if (reader.read(result.config).isComplete) {
./features/form-step/validation/step1-result-reader.ts:12: * nothing is cached and `isComplete` is never stored.
./features/form-step/validation/validator-registry.ts:50: * live errors of the form and `isComplete` (REQ-01.27), so both always agree.

$ grep -n "result === null\|whenSettled" frontend/src/app/features/form-step/validation/step1-complete-guard.ts
27:  const result = await store.whenSettled(code);
28:  if (result === null || result.status !== 'ready') {
$ grep -n "dataReady\|reader.read" frontend/src/app/features/summary-step/summary-step-page.ts frontend/src/app/features/plans-step/plans-step-page.ts
frontend/src/app/features/summary-step/summary-step-page.ts:125:      this.reader.read(config),
frontend/src/app/features/summary-step/summary-step-page.ts:180:      dataReady: this.sections() !== null,
frontend/src/app/features/summary-step/summary-step-page.ts:283:      priceInputsFrom(this.reader.read(config)),
frontend/src/app/features/plans-step/plans-step-page.ts:95:    const step1 = this.reader.read(config);
$ grep -n "Los guards devuelven" docs/adr/0004-wizard-state-persistence-and-navigation.md
100:- Los guards devuelven `true` si la configuración **falla** al cargar. La página muestra entonces "error de carga" y, tras un "reintentar" con éxito, vuelve a evaluar `isComplete` y redirige si hace falta (respaldo G2).
```

Test traceability (every `it` starts with an ID except the Signal Forms spike, which names the gaps of ADR-0002):

```text
$ grep -rnE "^\s*it(\.each\(.*\))?\(['\`]" --include=*.spec.ts frontend/src/app | grep -vE "it(\.each\(.*\))?\(['\`](AC|REQ|Q|G[0-9]|F-|D[0-9])"
./app.spec.ts:10:  it('ADR-0004 G3-9 shows the global "cargando" while a guard keeps the navigation pending', ...
./core/cms/cms-queries.spec.ts:49:  it('api-contracts C3 asks for the five text components and pageSize 2 to detect duplicates', ...
./features/form-step/signal-forms-spike.spec.ts:48:  it('gap 1: an empty <input type="number"> writes null (not NaN) to a number | null model', ...
./features/form-step/signal-forms-spike.spec.ts:85:  it('touched becomes true on blur (error shown after the first blur)', ...
./features/form-step/signal-forms-spike.spec.ts:93:  it('a checkbox writes a boolean', ...
./features/form-step/validation/reconcile-step1.spec.ts:89:  it('US-01 §7 warnings never contain the stored values', ...
[reviewer's note: remaining lines omitted; they start with ADR-0001, ADR-0004, ADR-0005 or ADR-0006]
```

## Checklist

| Area | Result | Notes |
|---|---|---|
| Security: tokens and secrets | Pass | No `Authorization`/token in `frontend/src`, `infra/`, compose or bundle. Only `.env.example` is versioned; its values are fictitious (base64 of "fictitious-…") and there is no Strapi API token. `HttpClient` without interceptors, relative URLs. |
| Security: public role, `published-only`, allowlist | **Fail** | Public role: exactly `find` on 4 types, `authenticated` without permissions, registration disabled (`cms/src/seed/permissions.ts`). Routers `only: ['find']` + `global::published-only` on the 4 types. `published-only` withstands `%73tatus`, `hasPublishedVersion`, encoded `publicationFilter` and populated relations. `strictParams` blocks `createdBy`. Non-GET methods → 403. **But the exact nginx allowlist is bypassed with an encoded path (F-00.12)**: routes of `users-permissions`, `upload` and the admin API (`content-manager`) reach Strapi, which ADR-0003 says do not go through nginx. |
| Security: CSP, `innerHTML`, terms | Pass | ADR-0003 CSP on `/`, SPA routes, `/api` and bundles; `inlineCritical: false` leaves only `<link>` and `<script src>`. Terms: closed tree (ADR-0006) rendered by interpolation; no `innerHTML`, `DomSanitizer` or `bypassSecurityTrust`; links reduced to text. |
| Security: persisted data and document in the DOM | Pass | `sessionStorage` per country (`ciq.v1.{cc}.*`): step 1 values, the plan's `documentId` and a minimal confirmation without personal data. The summary only renders `maskDocument(...)` (`summary-values.ts`); the test checks `innerHTML` without the full value in CO and CL. Console warnings without values. |
| REQ: configurability from Strapi | Pass | Fields, types, validations, options, order, section, role, texts, minimum age, plans, factors and terms come from Strapi; only the 4 fixed texts of G2-2 are in code (grep finds no literals in templates except the accepted `*`). Read on every load, no persistent cache; `no-store` on `/api`. |
| REQ: age and year | Pass | Pure functions with an injected "today" (`legal-age.ts`, `vehicle-year.ts`, `age-in-years.ts`), inclusive limits, 29 February, future date, `todayLocal` as the only point that reads the time zone. Rules always active by role (accepted decision 6). |
| REQ: only active and published plans | Pass | `filters[active][$eq]=true` + `published-only` + double check in `plan-mapper.ts` (`active !== true`, currency, name, price). |
| REQ: price with its currency | Pass | `formatPrice` with the `intlLocale`/`currency` of the `Country`, 0 decimals; a plan with a different currency is discarded; same function in step 2 and the summary; confirmation with the currency copied at payment time. |
| REQ: masking | Pass | `maskDocument` according to REQ-03.7 (alphanumerics, `min(4, floor(n/2))`, separators); every field with role `documentNumber`; full value kept in the state (REQ-03.8). See F-03.2 for the consistency of the CL seed with AC-03.6. |
| REQ: payment blocked without terms and against double submission | **Pass with observations** | `canPay` + guard in the state before any `await`; `aria-disabled` during the process; controls disabled; abort on leaving. **But `dataReady` does not check that the data is valid** (F-03.1). |
| REQ: rejection and retry | Pass | Strapi message with `role="alert"`, terms and data intact, message removed on retry, no limit. |
| Modern and typed Angular | Pass | Standalone + `OnPush` on every component, signals/`computed`/`resource`, `@if`/`@for` with `track`/`@switch`, Signal Forms (`form`, `FormField`, `FormRoot` with `novalidate`), `inject()`, zoneless, no `any`, no NgModules, DTOs separated from the domain by mappers. The `as unknown as FieldTree<…>` in `dynamic-form.ts:100-110` are the escape hatch documented in ADR-0002. |
| Loading, error and empty states | Pass with observations | Explicit on `/`, "país no disponible", shell, step 2 and each summary section; global "cargando" while a guard waits. See F-02.1/F-03.1 (state after retry) and F-00.14. |
| Accessibility | Pass with observations | Associated labels, `aria-describedby` for help and error, `aria-invalid`, `fieldset`/`legend`, focus to the `h1` on entering each screen and to the first invalid field, `aria-current="step"`, native radios, focusable terms region, persistent `aria-live` for "procesando". Real keyboard, responsive and screen reader are left for e2e and G5. See F-00.14. |
| Tests that validate behaviour | Pass | 457/457. DOM tests with a real router harness and `FakeCmsClient`; assertions on visible text, ARIA, URL, `sessionStorage` and number of payment attempts (AC-03.22 clicks repeatedly and counts `gateway.attempts`). Gap: no test covers the retry after a configuration failure on `/plans` or `/summary` with an incomplete step 1 (F-02.1, F-03.1). |
| Traceability | Pass | Commits with `[US-0X]`/`[REQ-…]`/`[ADR-…]`; almost every `it` starts with AC/REQ/ADR/Q/G. The Signal Forms spike names the ADR-0002 gaps instead of an ID (acceptable: it is a characterisation test of the framework). |

## Findings

| ID | Severity | File:line | Description | Evidence | REQ / rule | Proposal |
|---|---|---|---|---|---|---|
| F-00.12 | Major | `infra/nginx/snippets/strapi-api.conf:15` (`proxy_pass http://strapi;`), included from `infra/nginx/default.conf:29-43` | The "exact" allowlist is bypassed with `%2F` and `..`. nginx picks the `location = /api/plans` using the **normalised** URI (`/api/users/../plans` → `/api/plans`), but `proxy_pass` without a URI forwards the **original**, non-normalised URI to Strapi. This way routes that are not in the allowlist reach Strapi: `users-permissions` (`/api/users/:id`, `/api/connect/*`, `/api/users-permissions/roles/*`), `upload` and the admin API (`/admin/users/:id`, `/content-manager/collection-types/:model/:id`). Today only Strapi's permissions (403) and the admin authentication (401) stop them. Port 8080 listens on all interfaces (accepted decision 2), so that admin surface, GET only, is also reachable from the LAN. With `.env.example` loaded by default, `ADMIN_JWT_SECRET` is public. I have not verified whether Strapi 5.63 accepts a forged admin JWT without a session: it is a compound risk that I have not checked. | See "Commands run". `/api/users` is answered by **nginx** (`Server: nginx`, `text/html`, 404); `/api/users/..%2Fplans` is answered by **Strapi** (`application/json`, 403 `ForbiddenError`). `/content-manager/collection-types/api::plan.plan/x%2F..%2F..%2F..%2F..%2Fapi%2Fplans` → 401 `"Missing or invalid credentials"`, which is the Strapi admin authentication. | D4 ("nginx GET-only proxy with allowlist"); ADR-0003 §2 ("Exact allowlist"; "`location /api/` → 404 for everything else"; "The Strapi admin does not go through nginx"); defence in depth (ADR-0003, Consequences) | In `strapi-api.conf`, always send the normalised path: `proxy_pass http://strapi$uri$is_args$args;`. In a `location =`, `$uri` is exactly the allowlist path, and `strapi` is an `upstream`, so no `resolver` is needed. As an alternative or in addition: `if ($request_uri !~ "^/api/(countries\|form-fields\|plans\|country-selection)(\?\|$)") { return 404; }`. Add to the ADR-0003 "Confirmation" (via a new entry or an infrastructure test) the `curl` checks `/api/users/..%2Fplans` → 404 from nginx and `/content-manager/...%2F..%2Fapi%2Fplans` → 404 from nginx. |
| F-03.1 | Major | `frontend/src/app/features/summary-step/summary-step-page.ts:180` (`dataReady: this.sections() !== null`); `frontend/src/app/features/form-step/validation/step1-complete-guard.ts:28` | After a failure of the country configuration on a direct entry to `/:cc/summary`, the guard lets the navigation through (`result === null` → `true`, as per ADR-0004). After a successful "reintentar", the shell renders the `router-outlet` and the summary is activated **without re-evaluating `isComplete`**. ADR-0004 requires it ("after a successful retry, it re-evaluates `isComplete` and redirects if needed (G2 backstop)"), but no page does it (the `isComplete` grep only finds it in the guard). Besides, `canPay` takes `dataReady` as "there are texts" and not as "the data is valid". If the stored step 1 is incomplete or invalid (for example, because the configuration changed), the summary shows it and allows payment. | `grep` of `isComplete` and `dataReady` in "Commands run". `payment-state.ts:7-9` documents `dataReady` as "Step 1 data shown (texts present)". `step1-complete-guard.spec.ts:68` only checks that the guard lets the navigation through, not the later redirect. | REQ-03.13 (guard "computed with the current configuration"); REQ-03.19 ("the data and the plan are loaded **and are valid**"); ADR-0004 §Navigation and guards, point 2 | In `SummaryStepPage`, derive a `step1 = computed(() => this.reader.read(config))` and: (a) if `!step1.isComplete`, navigate to `/:cc/form` with `replaceUrl` (the same backstop ADR-0004 asks for); (b) pass `dataReady: sections !== null && step1.isComplete` to `canPay`. Add a test `REQ-03.13 after a failed configuration and a successful retry an incomplete step 1 goes to the form` and another one for `canPay` with invalid data. |
| F-02.1 | Minor | `frontend/src/app/features/plans-step/plans-step-page.ts:66-76` (the `resource` requests plans as soon as there is a `config`) and `:95` | The same gap in step 2: after a configuration failure and a successful retry on `/:cc/plans`, the page requests the plans from Strapi and shows them with prices computed on an incomplete step 1. It does get corrected on continuing, because `/summary` goes through the guard again; that is why it is Minor. | Same as F-03.1. `plans-step-page.spec.ts` has no case of retrying the country configuration with an incomplete step 1. | REQ-02.19 ("if `isComplete` is false ... redirects to step 1 of the same country **without requesting plans from Strapi**"); ADR-0004 (G2 backstop) | Make the `resource` `params` depend on `reader.read(config).isComplete` and, if it is false, navigate to `/:cc/form` (`replaceUrl`). Test `REQ-02.19 after a failed configuration and a successful retry an incomplete step 1 goes to the form without requesting plans`. |
| F-03.2 | Minor | `cms/src/seed/data/cl.ts:119` (`pattern: '[0-9]{7,8}-[0-9Kk]'`, with `helpText` "Sin puntos y con guion") | The CL seed rejects the RUT with dots, and AC-03.6 is written with that format ("Given ... the field with role `documentNumber` is `12.345.678-5`"). The spec's verification plan assigns it to the "CL E2E (terms and RUT)" (US-03 §8). Against the seed, the e2e cannot reach the summary with that value: it would have to intercept C4 or change the example. The masking rule is correct (unit `AC-03.7 "12.345.678-5"` passes). What fails is the consistency between the seed and the AC. | `[0-9]{7,8}-[0-9Kk]` does not allow `.`, so the anchored `pattern` `^(?:…)$` (`form-field-mapper.ts`, `compileFullMatch`) marks `12.345.678-5` as invalid. `specs/US-03/spec.md:195-199` and `:636`. | AC-03.6; REQ-01.34 (seed); Q-01.17 → G2-13 (seed patterns reviewable in the demo) | Let the human decide in G4: (a) allow dots in the seed, for example `[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9Kk]` with `maxLength` 12 and the `helpText` adjusted; or (b) keep the seed and have the AC-03.6 e2e use C4 interception (ADR-0003 3c), noting it in the e2e report. Tell the `qa-engineer`, who is writing that e2e. |
| F-00.13 | Nit | `infra/nginx/default.conf:60` | The `location` for hashed bundles requires `[A-Z0-9]{8}` (case-insensitive), but esbuild generates hashes with `_` and `-`. `chunk-_XEHCKgE.js` (summary-step-page) and `chunk-B_Zt-cga.js` (confirmation-page) fall into `location /` and are served without `Cache-Control: immutable`. It does not affect security: the CSP is applied anyway. | Per-chunk `curl` output in "Commands run". | ADR-0003 §2 ("Hashed build bundles: `Cache-Control: public, max-age=31536000, immutable`") | Change it to `[A-Za-z0-9_-]{8}`. |
| F-00.14 | Nit | `frontend/src/app/shared/status-message.ts:17` (and the `role="alert"` at `:23` and `:28`) | The "cargando" states of each section are announced with a `<p role="status">` that is **inserted** already containing the text. Several screen readers (NVDA and JAWS with some browsers) do not announce a live region that appears with its content; they only announce later changes. The global "cargando" (`app.html:1-5`) does use a persistent region whose content changes, which is the robust pattern. Inserted `role="alert"` elements are usually announced well. The implementation meets the letter of REQ-01.32 and REQ-02.20; the finding is about real effectiveness and cannot be verified in jsdom. | Quoted code. `docs/qa/phase-4-implementation-notes.md`, decision 10, already raises doubts about the role of these messages. | REQ-01.32; REQ-02.20; REQ-03.31 | Check it in G5 with a screen reader. If it is not announced, use a persistent `role="status"` region per section and change only its text. |

No findings in: dynamic rendering and validation of step 1 (order, tie-breaks, typed catalogue, anchored `pattern`, mandatory roles, reconciliation with table 5.4), pricing rule and its documentation, plan order and single recommended plan, per-country persistence, confirmation and its guard, quote number (32-symbol alphabet, `crypto.getRandomValues`, UTC date), terms (ADR-0006), bootstrap permissions, `published-only` middleware, `.env.example`, `.gitignore` (`.env`, `cms/.tmp/`) and dependencies (only those of the Angular 22 and Strapi 5.63 scaffolds).

Reviewed and not reported because they were accepted by the human (Phase 4 notes): POST → 403, port 8080 on all interfaces, `hasPublishedVersion`, superadmin on first access, `birthDate`/`vehicleYear` always required, `*` with `aria-hidden`, empty states with `role="alert"`, focus to the first radio, selection saved on choosing, `disabled` versus `aria-disabled` in the payment, year and date format, C6/C3 as a content error and indicator hidden on the confirmation. Decision 2 only appears in F-00.12 because it widens its reach; it is not reported on its own.

## Resolution

Human G4 decisions in [`docs/decision-log.md`](../docs/decision-log.md) (literal reason: "Apruebo el triage de G4", "I approve the G4 triage").

| ID | Human decision | Status | Commit / reason |
|---|---|---|---|
| F-00.12 | Fix | Fixed | `40dfcae` (strapi-developer): `proxy_pass` with the normalised `$uri` + 404 for a non-canonical `request_uri` |
| F-03.1 | Fix | Fixed | `8f763cb` (angular-developer): `step1-backstop` re-evaluates `isComplete` after the retry; `canPay` requires `step1Complete` |
| F-02.1 | Fix | Fixed | `8f763cb` (same change) |
| F-03.2 | Fix | Fixed | `40dfcae`: CL RUT pattern with and without dots, `maxLength` 12 |
| F-00.13 | Fix | Fixed | `40dfcae`: cache regex with `_` and `-` |
| F-00.14 | Accept; check in G5 | Accepted | G5 approved without defects (2026-11-23); the human did not specify whether they ran the optional screen reader part, so it stays as a known limitation in the README |

### Finding added by QA during Phase 5

| ID | Severity | Location | Description | Resolution |
|---|---|---|---|---|
| F-03.3 (D-E2E-1) | Minor | `frontend/src/app/features/summary-step/summary-step-page.css:76` | At 320 px the terms checkbox measures 22.2×24 px: the 24 px input shrinks inside the flex row when the label takes two lines (REQ-03.36). Found by the `qa-engineer` e2e. | Fixed in `0086e5a` (orchestrator, one line of CSS: `flex: none`, also applied to the step 2 radios). It breaks an approved REQ, so it was fixed without going through triage; the human is informed. |

## Re-review (2026-11-23, orchestrator)

On the stack rebuilt with a clean volume (`docker compose down -v && docker compose up -d --build`), which already includes all the fixes:

```text
--- F-00.12 bypass variants (esperado 404 text/html):
/api/users/..%2Fplans -> 404 text/html
/api/upload/..%2Fplans -> 404 text/html
/api//plans -> 404 text/html
/api/./plans -> 404 text/html
/api/%70lans -> 404 text/html
/content-manager/collection-types/api::plan.plan/x%2F..%2F..%2F..%2F..%2Fapi%2Fplans -> 404 text/html
allowlist countries: 200
POST: 403
--- F-00.13 cache:
main-VPRKP64I.js Cache-Control: public, max-age=31536000, immutable
styles-32OBUCRH.css Cache-Control: public, max-age=31536000, immutable
--- F-03.2: cl_rut servido con helpText "Con o sin puntos y con guion, por ejemplo 12.345.678-5 o 12345678-5."
```

- F-03.1 and F-02.1: `ng test` 463/463 in 46 files, with `F-03.1 …` and `F-02.1 …` tests that fail without the fix (checked by the angular-developer and repeated by the orchestrator).
- Full e2e on the new stack: see `docs/qa/e2e-report.md`, section "Re-run after G4".
