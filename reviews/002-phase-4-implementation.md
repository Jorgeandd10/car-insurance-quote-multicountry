# Review 002 — Fase 4: implementación de US-01, US-02 y US-03 (frontend, Strapi, nginx, compose)

| Campo | Valor |
|---|---|
| Revisor | Code Reviewer (subagente), modelo: Claude Opus 5.5 (`claude-opus-5-5`) |
| Fecha | 2026-11-23 |
| Alcance | `git diff 3708a48..f69ae34` (merge de la Fase 3 → merge de la Fase 4; commits `40840ed`, `f5e47f1`, `f411a8b`, `0cb032c`, `078d59a`, `b22d2ad`, `b423202`) · archivos: `frontend/`, `cms/`, `infra/nginx/`, `docker-compose.yml`, `.env.example`. Excluido: `e2e/` (en curso por `qa-engineer`) |
| Specs / ADRs de referencia | `specs/US-01/spec.md`, `specs/US-02/spec.md`, `specs/US-03/spec.md` (Approved); ADR-0001 a ADR-0007 (Accepted); `docs/architecture/*`; `docs/decision-log.md` (D, G1, G2, G3); `docs/qa/phase-4-implementation-notes.md` (18 decisiones aceptadas por el humano, no reportadas salvo contradicción) |
| Veredicto | **Cambios requeridos** (1 hallazgo de seguridad Major en la allowlist de nginx y 1 Major de REQ-03.19) |

## Comandos ejecutados

Build y tests (en `frontend/`, contra el árbol de `f69ae34`; `git status` limpio al empezar):

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

El `main-Q3HR5Q2P.js` que sirve nginx en `:8080` tiene el mismo hash que el build local: la pila levantada corresponde a `f69ae34`.

Secretos, tokens y reglas de Angular (`grep` desde la raíz):

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
[nota del revisor: los constructores no reciben dependencias; solo registran effect/afterNextRender, y cms-error.ts es una clase Error]

$ grep -lE "Bearer|Authorization|api_token|APP_KEYS|JWT_SECRET" frontend/dist/car-insurance-quote/browser/*
[nota del revisor: sin salida]

$ git ls-files | grep -iE "(^|/)\.env" ; git ls-files | grep -iE "\.db$|\.tmp/"
.env.example

$ grep -rnE "aria-label=\"[^\"]+\"|title=\"|placeholder=|alt=\"" --include=*.html --include=*.ts frontend/src/app | grep -v spec
$ grep -rnE ">[^<{}@ \n][^<{}]*<" --include=*.html frontend/src/app
frontend/src/app/features/form-step/dynamic-form.html:20:  <span class="required-mark" aria-hidden="true">*</span>
frontend/src/app/features/form-step/dynamic-form.html:28:  <span class="required-mark" aria-hidden="true">*</span>
[nota del revisor: único texto literal en plantillas, el "*" de la decisión aceptada 8]
```

Allowlist de nginx y métodos (pila levantada, `B=http://localhost:8080`):

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

(`/admin` → 200 es el `index.html` del SPA por el `try_files`, no el admin de Strapi.)

Respuesta de nginx frente a la de Strapi para distinguir quién contesta:

```text
$ curl -s -i "$B/api/users" | head -12
HTTP/1.1 404 Not Found
Server: nginx
Content-Type: text/html
Content-Length: 146
Cache-Control: no-store
[nota del revisor: líneas omitidas]
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

`published-only` (vía nginx y directo a Strapi; el seed tiene un plan y un campo en borrador por país):

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

Ni `co_referralCode`/`cl_referralCode` ni "Plan Élite" (borradores del seed) aparecen en ningún caso.

Cabeceras:

```text
== /
HTTP/1.1 200 OK
Cache-Control: no-cache
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
== /co/summary
[nota del revisor: cabeceras idénticas a las de /, omitidas]
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
[nota del revisor: líneas omitidas]
chunk-DZtQEVOn.js      Cache-Control: public, max-age=31536000, immutable
chunk-_XEHCKgE.js      
missing chunk: 404 text/html
```

Reevaluación de `isComplete` tras un reintento (ADR-0004 §Navegación, "respaldo G2"):

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

Trazabilidad de tests (todos los `it` empiezan por un ID salvo el spike de Signal Forms, que nombra los huecos del ADR-0002):

```text
$ grep -rnE "^\s*it(\.each\(.*\))?\(['\`]" --include=*.spec.ts frontend/src/app | grep -vE "it(\.each\(.*\))?\(['\`](AC|REQ|Q|G[0-9]|F-|D[0-9])"
./app.spec.ts:10:  it('ADR-0004 G3-9 shows the global "cargando" while a guard keeps the navigation pending', ...
./core/cms/cms-queries.spec.ts:49:  it('api-contracts C3 asks for the five text components and pageSize 2 to detect duplicates', ...
./features/form-step/signal-forms-spike.spec.ts:48:  it('gap 1: an empty <input type="number"> writes null (not NaN) to a number | null model', ...
./features/form-step/signal-forms-spike.spec.ts:85:  it('touched becomes true on blur (error shown after the first blur)', ...
./features/form-step/signal-forms-spike.spec.ts:93:  it('a checkbox writes a boolean', ...
./features/form-step/validation/reconcile-step1.spec.ts:89:  it('US-01 §7 warnings never contain the stored values', ...
[nota del revisor: resto de líneas omitidas; empiezan por ADR-0001, ADR-0004, ADR-0005 o ADR-0006]
```

## Checklist

| Área | Resultado | Notas |
|---|---|---|
| Seguridad: tokens y secretos | Cumple | Sin `Authorization`/token en `frontend/src`, `infra/`, compose ni bundle. Solo `.env.example` versionado; sus valores son ficticios (base64 de "fictitious-…") y no hay ningún token de API de Strapi. `HttpClient` sin interceptores, URLs relativas. |
| Seguridad: rol público, `published-only`, allowlist | **No cumple** | Rol público: exactamente `find` en 4 tipos, `authenticated` sin permisos, registro desactivado (`cms/src/seed/permissions.ts`). Routers `only: ['find']` + `global::published-only` en los 4 tipos. `published-only` resiste `%73tatus`, `hasPublishedVersion`, `publicationFilter` codificado y relaciones pobladas. `strictParams` bloquea `createdBy`. Métodos no GET → 403. **Pero la allowlist exacta de nginx se salta con un path codificado (F-00.12)**: llegan a Strapi rutas de `users-permissions`, `upload` y la API del admin (`content-manager`), que ADR-0003 dice que no pasan por nginx. |
| Seguridad: CSP, `innerHTML`, términos | Cumple | CSP de ADR-0003 en `/`, rutas del SPA, `/api` y bundles; `inlineCritical: false` deja solo `<link>` y `<script src>`. Términos: árbol cerrado (ADR-0006) pintado por interpolación; sin `innerHTML`, `DomSanitizer` ni `bypassSecurityTrust`; enlaces reducidos a texto. |
| Seguridad: datos persistidos y documento en el DOM | Cumple | `sessionStorage` por país (`ciq.v1.{cc}.*`): valores del paso 1, `documentId` del plan y confirmación mínima sin datos personales. El resumen solo pinta `maskDocument(...)` (`summary-values.ts`); el test comprueba `innerHTML` sin el valor completo en CO y CL. Avisos de consola sin valores. |
| REQ: configurabilidad desde Strapi | Cumple | Campos, tipos, validaciones, opciones, orden, sección, rol, textos, edad mínima, planes, factores y términos vienen de Strapi; solo los 4 textos fijos de G2-2 están en código (grep sin literales en plantillas salvo el `*` aceptado). Lectura en cada carga, sin caché persistente; `no-store` en `/api`. |
| REQ: edad y año | Cumple | Funciones puras con "hoy" inyectado (`legal-age.ts`, `vehicle-year.ts`, `age-in-years.ts`), límites inclusivos, 29 de febrero, fecha futura, `todayLocal` como único punto que lee la zona horaria. Reglas siempre activas por rol (decisión aceptada 6). |
| REQ: solo planes activos y publicados | Cumple | `filters[active][$eq]=true` + `published-only` + doble comprobación en `plan-mapper.ts` (`active !== true`, moneda, nombre, precio). |
| REQ: precio con su moneda | Cumple | `formatPrice` con `intlLocale`/`currency` del `Country`, 0 decimales; plan con moneda distinta descartado; misma función en paso 2 y resumen; confirmación con la moneda copiada al pagar. |
| REQ: enmascarado | Cumple | `maskDocument` según REQ-03.7 (alfanuméricos, `min(4, floor(n/2))`, separadores); todos los campos con rol `documentNumber`; valor completo conservado en el estado (REQ-03.8). Ver F-03.2 para la coherencia del seed de CL con AC-03.6. |
| REQ: pago bloqueado sin términos y contra el doble envío | **Cumple con observaciones** | `canPay` + guarda en el estado antes de cualquier `await`; `aria-disabled` durante el proceso; controles inhabilitados; abort al salir. **Pero `dataReady` no comprueba que los datos sean válidos** (F-03.1). |
| REQ: rechazo y reintento | Cumple | Mensaje de Strapi con `role="alert"`, términos y datos intactos, mensaje retirado al reintentar, sin límite. |
| Angular moderno y tipado | Cumple | Standalone + `OnPush` en todos los componentes, signals/`computed`/`resource`, `@if`/`@for` con `track`/`@switch`, Signal Forms (`form`, `FormField`, `FormRoot` con `novalidate`), `inject()`, zoneless, sin `any`, sin NgModules, DTOs separados del dominio por mappers. Los `as unknown as FieldTree<…>` de `dynamic-form.ts:100-110` son el escape documentado en ADR-0002. |
| Estados de carga, error y vacío | Cumple con observaciones | Explícitos en `/`, "país no disponible", shell, paso 2 y cada sección del resumen; "cargando" global mientras un guard espera. Ver F-02.1/F-03.1 (estado tras reintento) y F-00.14. |
| Accesibilidad | Cumple con observaciones | Labels asociados, `aria-describedby` de ayuda y error, `aria-invalid`, `fieldset`/`legend`, foco al `h1` al entrar en cada pantalla y al primer inválido, `aria-current="step"`, radios nativos, región de términos enfocable, `aria-live` persistente para "procesando". Teclado real, responsive y lector de pantalla quedan para e2e y G5. Ver F-00.14. |
| Tests que validan comportamiento | Cumple | 457/457. Tests de DOM con harness de router real y `FakeCmsClient`; aserciones sobre texto visible, ARIA, URL, `sessionStorage` y número de intentos de pago (AC-03.22 hace clics repetidos y cuenta `gateway.attempts`). Hueco: ningún test cubre el reintento tras fallo de configuración en `/plans` o `/summary` con un paso 1 incompleto (F-02.1, F-03.1). |
| Trazabilidad | Cumple | Commits con `[US-0X]`/`[REQ-…]`/`[ADR-…]`; casi todos los `it` empiezan por AC/REQ/ADR/Q/G. El spike de Signal Forms nombra los huecos de ADR-0002 en lugar de un ID (aceptable: es un test de caracterización del framework). |

## Hallazgos

| ID | Severidad | Archivo:línea | Descripción | Evidencia | REQ / regla | Propuesta |
|---|---|---|---|---|---|---|
| F-00.12 | Major | `infra/nginx/snippets/strapi-api.conf:15` (`proxy_pass http://strapi;`), incluido desde `infra/nginx/default.conf:29-43` | La allowlist "exacta" se salta con `%2F` y `..`. nginx elige la `location = /api/plans` con la URI **normalizada** (`/api/users/../plans` → `/api/plans`), pero `proxy_pass` sin URI reenvía a Strapi la URI **original** sin normalizar. Así llegan a Strapi rutas que no están en la allowlist: `users-permissions` (`/api/users/:id`, `/api/connect/*`, `/api/users-permissions/roles/*`), `upload` y la API del admin (`/admin/users/:id`, `/content-manager/collection-types/:model/:id`). Hoy solo las frenan los permisos de Strapi (403) y la autenticación del admin (401). El puerto 8080 escucha en todas las interfaces (decisión aceptada 2), así que esa superficie del admin, solo por GET, también es accesible desde la LAN. Con `.env.example` cargado por defecto, `ADMIN_JWT_SECRET` es público. No he verificado si Strapi 5.63 acepta un JWT de admin forjado sin sesión: es un riesgo compuesto que no he comprobado. | Ver "Comandos ejecutados". `/api/users` lo responde **nginx** (`Server: nginx`, `text/html`, 404); `/api/users/..%2Fplans` lo responde **Strapi** (`application/json`, 403 `ForbiddenError`). `/content-manager/collection-types/api::plan.plan/x%2F..%2F..%2F..%2F..%2Fapi%2Fplans` → 401 `"Missing or invalid credentials"`, que es la autenticación del admin de Strapi. | D4 ("nginx proxy GET-only con allowlist"); ADR-0003 §2 ("Allowlist exacta"; "`location /api/` → 404 para todo lo demás"; "El admin de Strapi no pasa por nginx"); defensa en profundidad (ADR-0003, Consecuencias) | En `strapi-api.conf`, enviar siempre la ruta normalizada: `proxy_pass http://strapi$uri$is_args$args;`. En una `location =`, `$uri` es exactamente la ruta de la allowlist, y `strapi` es un `upstream`, así que no hace falta `resolver`. Como alternativa o además: `if ($request_uri !~ "^/api/(countries\|form-fields\|plans\|country-selection)(\?\|$)") { return 404; }`. Añadir a la "Confirmación" de ADR-0003 (vía nueva entrada o test de infraestructura) los `curl` `/api/users/..%2Fplans` → 404 de nginx y `/content-manager/...%2F..%2Fapi%2Fplans` → 404 de nginx. |
| F-03.1 | Major | `frontend/src/app/features/summary-step/summary-step-page.ts:180` (`dataReady: this.sections() !== null`); `frontend/src/app/features/form-step/validation/step1-complete-guard.ts:28` | Tras un fallo de la configuración del país en una entrada directa a `/:cc/summary`, el guard deja pasar (`result === null` → `true`, conforme a ADR-0004). Después de un "reintentar" con éxito, el shell pinta el `router-outlet` y el resumen se activa **sin volver a evaluar `isComplete`**. ADR-0004 lo exige ("tras un reintentar con éxito, vuelve a evaluar `isComplete` y redirige si hace falta (respaldo G2)"), pero ninguna página lo hace (el grep de `isComplete` solo lo encuentra en el guard). Además, `canPay` toma `dataReady` como "hay textos" y no como "los datos son válidos". Si el paso 1 guardado está incompleto o es inválido (por ejemplo, porque cambió la configuración), el resumen lo muestra y deja pagar. | `grep` de `isComplete` y de `dataReady` en "Comandos ejecutados". `payment-state.ts:7-9` documenta `dataReady` como "Step 1 data shown (texts present)". `step1-complete-guard.spec.ts:68` solo comprueba que el guard deja pasar, no la redirección posterior. | REQ-03.13 (guarda "calculada con la configuración vigente"); REQ-03.19 ("los datos y el plan están cargados **y son válidos**"); ADR-0004 §Navegación y guardas, punto 2 | En `SummaryStepPage`, derivar un `step1 = computed(() => this.reader.read(config))` y: (a) si `!step1.isComplete`, navegar a `/:cc/form` con `replaceUrl` (el mismo respaldo que pide ADR-0004); (b) pasar `dataReady: sections !== null && step1.isComplete` a `canPay`. Añadir un test `REQ-03.13 after a failed configuration and a successful retry an incomplete step 1 goes to the form` y otro de `canPay` con datos inválidos. |
| F-02.1 | Minor | `frontend/src/app/features/plans-step/plans-step-page.ts:66-76` (el `resource` pide planes en cuanto hay `config`) y `:95` | El mismo hueco en el paso 2: tras fallo de configuración y reintento con éxito en `/:cc/plans`, la página pide los planes a Strapi y los muestra con precios calculados sobre un paso 1 incompleto. Sí se corrige al continuar, porque `/summary` vuelve a pasar por el guard; por eso es Minor. | Igual que F-03.1. `plans-step-page.spec.ts` no tiene ningún caso de reintento de la configuración del país con un paso 1 incompleto. | REQ-02.19 ("si `isComplete` es falso ... redirige al paso 1 del mismo país **sin pedir planes a Strapi**"); ADR-0004 (respaldo G2) | Condicionar `params` del `resource` a `reader.read(config).isComplete` y, si es falso, navegar a `/:cc/form` (`replaceUrl`). Test `REQ-02.19 after a failed configuration and a successful retry an incomplete step 1 goes to the form without requesting plans`. |
| F-03.2 | Minor | `cms/src/seed/data/cl.ts:119` (`pattern: '[0-9]{7,8}-[0-9Kk]'`, con `helpText` "Sin puntos y con guion") | El seed de CL rechaza el RUT con puntos, y AC-03.6 está escrito con ese formato ("Given ... el campo con rol `documentNumber` vale `12.345.678-5`"). El plan de verificación de la spec lo asigna a "E2E de CL (términos y RUT)" (US-03 §8). Contra el seed, el e2e no puede llegar al resumen con ese valor: tendría que interceptar C4 o cambiar el ejemplo. La regla de enmascarado es correcta (unit `AC-03.7 "12.345.678-5"` pasa). Lo que falla es la coherencia entre el seed y el AC. | `[0-9]{7,8}-[0-9Kk]` no admite `.`, así que el `pattern` anclado `^(?:…)$` (`form-field-mapper.ts`, `compileFullMatch`) marca `12.345.678-5` como inválido. `specs/US-03/spec.md:195-199` y `:636`. | AC-03.6; REQ-01.34 (seed); Q-01.17 → G2-13 (patrones del seed revisables en la demo) | Que el humano decida en G4: (a) admitir puntos en el seed, por ejemplo `[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9Kk]` con `maxLength` 12 y el `helpText` ajustado; o (b) mantener el seed y que el e2e de AC-03.6 use intercepción de C4 (ADR-0003 3c), dejándolo anotado en el informe de e2e. Avisar al `qa-engineer`, que está escribiendo ese e2e. |
| F-00.13 | Nit | `infra/nginx/default.conf:60` | El `location` de bundles con hash exige `[A-Z0-9]{8}` (insensible a mayúsculas), pero esbuild genera hashes con `_` y `-`. `chunk-_XEHCKgE.js` (summary-step-page) y `chunk-B_Zt-cga.js` (confirmation-page) caen en `location /` y se sirven sin `Cache-Control: immutable`. No afecta a la seguridad: la CSP se aplica igual. | Salida de `curl` por chunk en "Comandos ejecutados". | ADR-0003 §2 ("Bundles con hash del build: `Cache-Control: public, max-age=31536000, immutable`") | Cambiar a `[A-Za-z0-9_-]{8}`. |
| F-00.14 | Nit | `frontend/src/app/shared/status-message.ts:17` (y el `role="alert"` de `:23` y `:28`) | Los estados "cargando" de cada sección se anuncian con un `<p role="status">` que se **inserta** ya con el texto. Varios lectores de pantalla (NVDA y JAWS con algunos navegadores) no anuncian una región viva que aparece con su contenido; solo anuncian los cambios posteriores. El "cargando" global (`app.html:1-5`) sí usa una región persistente cuyo contenido cambia, que es el patrón robusto. Los `role="alert"` insertados suelen anunciarse bien. La implementación cumple la letra de REQ-01.32 y REQ-02.20; el hallazgo es de eficacia real y no se puede verificar en jsdom. | Código citado. `docs/qa/phase-4-implementation-notes.md`, decisión 10, ya plantea dudas sobre el rol de estos mensajes. | REQ-01.32; REQ-02.20; REQ-03.31 | Comprobarlo en G5 con lector de pantalla. Si no se anuncia, usar una región `role="status"` persistente por sección y cambiar solo su texto. |

Sin hallazgos en: render y validación dinámica del paso 1 (orden, desempates, catálogo tipado, `pattern` anclado, roles obligatorios, reconciliación con la tabla 5.4), regla de precio y su documentación, orden de planes y recomendado único, persistencia por país, confirmación y su guard, número de cotización (alfabeto de 32 símbolos, `crypto.getRandomValues`, fecha UTC), términos (ADR-0006), permisos del bootstrap, middleware `published-only`, `.env.example`, `.gitignore` (`.env`, `cms/.tmp/`) y dependencias (solo las del scaffold de Angular 22 y de Strapi 5.63).

Revisadas y no reportadas por estar aceptadas por el humano (notas de Fase 4): POST → 403, puerto 8080 en todas las interfaces, `hasPublishedVersion`, superadmin en el primer acceso, `birthDate`/`vehicleYear` siempre obligatorios, `*` con `aria-hidden`, estados vacíos con `role="alert"`, foco al primer radio, selección guardada al elegir, `disabled` frente a `aria-disabled` en el pago, formato de año y fecha, C6/C3 como error de contenido e indicador oculto en la confirmación. La decisión 2 solo aparece en F-00.12 porque agrava su alcance; no se reporta por sí misma.

## Resolución

Decisiones humanas de G4 en [`docs/decision-log.md`](../docs/decision-log.md) (motivo literal: "Apruebo el triage de G4").

| ID | Decisión humana | Estado | Commit / motivo |
|---|---|---|---|
| F-00.12 | Corregir | Fixed | `40dfcae` (strapi-developer): `proxy_pass` con `$uri` normalizada + 404 para `request_uri` no canónica |
| F-03.1 | Corregir | Fixed | `8f763cb` (angular-developer): `step1-backstop` reevalúa `isComplete` tras el reintento; `canPay` exige `step1Complete` |
| F-02.1 | Corregir | Fixed | `8f763cb` (mismo cambio) |
| F-03.2 | Corregir | Fixed | `40dfcae`: patrón del RUT de CL con y sin puntos, `maxLength` 12 |
| F-00.13 | Corregir | Fixed | `40dfcae`: regex de caché con `_` y `-` |
| F-00.14 | Aceptar; comprobar en G5 | Accepted | Pendiente de la prueba manual con lector de pantalla (G5) |

### Hallazgo añadido por QA durante la Fase 5

| ID | Severidad | Ubicación | Descripción | Resolución |
|---|---|---|---|---|
| F-03.3 (D-E2E-1) | Minor | `frontend/src/app/features/summary-step/summary-step-page.css:76` | A 320 px la casilla de términos mide 22,2×24 px: el input de 24 px se encoge dentro de la fila flex cuando la etiqueta ocupa dos líneas (REQ-03.36). Encontrado por el e2e de `qa-engineer`. | Fixed en `0086e5a` (orquestador, una línea de CSS: `flex: none`, aplicada también a los radios del paso 2). Incumple un REQ aprobado, por eso se corrigió sin pasar por triage; se informa al humano. |

## Re-review (2026-11-23, orquestador)

Sobre la pila reconstruida con volumen limpio (`docker compose down -v && docker compose up -d --build`) que ya incluye todas las correcciones:

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

- F-03.1 y F-02.1: `ng test` 463/463 en 46 archivos, con tests `F-03.1 …` y `F-02.1 …` que fallan sin la corrección (comprobado por el angular-developer y repetido por el orquestador).
- e2e completo sobre la pila nueva: ver `docs/qa/e2e-report.md`, sección "Re-ejecución tras G4".
