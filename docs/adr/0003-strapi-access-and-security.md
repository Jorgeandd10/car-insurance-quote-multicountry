# ADR-0003 — Acceso a Strapi, seguridad, caché y cambios de contenido en los e2e

| Campo | Valor |
|---|---|
| Estado | Proposed |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisores | Humano (G3) |
| Motivado por | D4, D9 · G2-13 (Q-01.20) · REQ-01.6, REQ-01.35, REQ-02.2, REQ-02.23, REQ-02.31, REQ-03.20, REQ-03.24 · AC-01.3, AC-01.10, AC-01.11, AC-01.13, AC-01.30, AC-01.31, AC-02.21, AC-02.25, AC-02.31, AC-03.15, AC-03.19, AC-03.24 |

## Contexto y problema

El PDF exige que "no Strapi token with write permissions may reach the browser" y "public role permissions minimal and justified". D4 (G0) fijó lo siguiente: rol público solo `find`/`findOne`, nginx como proxy GET-only con allowlist, ningún token en el navegador y sin BFF. Quedan por concretar cuatro cosas:

1. Los permisos exactos y la allowlist.
2. Que "recargar" muestre siempre lo publicado: sin caché intermedia (Q-01.20, REQ-01.6, REQ-02.23).
3. Que nunca se sirvan borradores (REQ-01.6, REQ-02.2).
4. Cómo modifican contenido los e2e que lo necesitan (AC-01.3, AC-01.10, AC-01.11, AC-01.13, AC-01.31, AC-02.21, AC-02.25, AC-03.15, AC-03.19) sin que la credencial llegue al navegador.

### Hallazgo: el rol público puede leer borradores

En Strapi 5, el parámetro `status` de la REST API admite `draft` y `published`, y el valor por defecto es `published`. **No hay un permiso separado para leer borradores.** Según la petición abierta en el portal de feedback de Strapi (3 de febrero de 2026), "any user with find or findOne permission on a content-type can access draft entries by using the status parameter". La documentación de Draft & Publish confirma que la Content API puede pedir "draft or published content" con `status`, y menciona además el parámetro `publicationFilter`.

Consecuencia: con D4 tal como está, una petición pública `GET /api/plans?status=draft` devolvería borradores (planes o términos sin publicar). La app nunca la hace (REQ-01.6), pero cualquier visitante sí podría. **D4 sigue siendo viable**, pero necesita una medida adicional que no la contradice: forzar `published` en las rutas públicas. Se reporta al orquestador como riesgo nuevo.

## Factores de decisión

- Ningún token en el navegador ni en el bundle (`CLAUDE.md` §6).
- Superficie pública mínima: solo lo que leen US-01, US-02 y US-03 (api-contracts).
- Defensa en profundidad: un fallo en una capa (nginx, permisos de Strapi o código) no expone escritura ni borradores.
- Cambios visibles al recargar, sin caché HTTP intermedia.
- E2E reproducibles con `docker compose up`, y credenciales solo en `.env`.
- Sin dependencias nuevas.

## Opciones consideradas

**Eje 1: cómo llega el navegador a Strapi**

1. **1a. nginx mismo origen, GET-only con allowlist exacta y saneado de cabeceras (D4).**
2. **1b. Navegador directo a Strapi (`:1337`) con CORS.**
3. **1c. BFF propio** (Node) que llama a Strapi con token.

**Eje 2: cómo evitar borradores en lecturas públicas**

1. **2a. Middleware de ruta en Strapi `published-only`** en las rutas `find` públicas, más un rechazo best-effort en nginx.
2. **2b. Solo nginx**: rechazar `status` y `publicationFilter` en la query.
3. **2c. Desactivar Draft & Publish** en los content types públicos.
4. **2d. Plugin de terceros** (`strapi-plugin-draft-preview`, opción `guardNativeStatus`).

**Eje 3: cómo modifican contenido los e2e**

1. **3a. Token de API *Custom* de Strapi, solo en el proceso Node de Playwright**, que llama directamente a la Content API de Strapi (`127.0.0.1:1337`), nunca a través de nginx ni desde la página. Lo crea el humano una vez en el admin y lo guarda en `.env`.
2. **3b. Login de administrador automatizado** desde Playwright (credenciales de admin en `.env`) y uso de los endpoints internos del admin (`/admin/...`, Content Manager) para crear, publicar y despublicar.
3. **3c. Solo intercepción de red** (`page.route`) que modifica la respuesta de Strapi en el navegador de pruebas.
4. **3d. Verificación manual** en la demo.

## Decisión

Opción elegida: **1a + 2a + 3a, complementada con 3c** para los casos de datos mal formados o imposibles en Strapi.

### 1. Rol público de Strapi (bootstrap idempotente)

| Permiso | Motivo | Lecturas que lo usan |
|---|---|---|
| `api::country.country.find` | Lista de países (`/`, "país no disponible"), configuración del país, factores, términos | C1, C3, C6, C7 (api-contracts) |
| `api::form-field.form-field.find` | Campos del paso 1 del país | C4 |
| `api::plan.plan.find` | Planes del país | C5 |
| `api::country-selection.country-selection.find` | Textos de `/` | C2 |

- **No se concede `findOne`** en ningún tipo: ninguna lectura lo necesita (el plan elegido se comprueba contra la lista, REQ-03.14). D4 dice "solo `find`/`findOne`" como máximo, así que conceder menos lo cumple.
- El bootstrap **elimina cualquier otro permiso** del rol público (incluidos los de `plugin::users-permissions.auth.*` y los de `upload`) y desactiva el registro de usuarios ("Enable sign-ups" = false) en los ajustes avanzados de Users & Permissions. Es idempotente: en cada arranque deja exactamente esta tabla.
- Ningún tipo usa i18n (ADR-0001). El rol `authenticated` no se usa.

### 2. nginx (único punto de entrada del navegador)

- Sirve el build de Angular y hace de proxy de `/api` hacia Strapi en la red interna de Docker. El puerto de Strapi se publica solo en `127.0.0.1:1337`, para el admin del negocio y para los e2e (eje 3). El admin de Strapi no pasa por nginx.
- **Allowlist exacta** con `location =`:
  - `/api/countries`
  - `/api/form-fields`
  - `/api/plans`
  - `/api/country-selection`
- `location /api/` → `404` para todo lo demás: `findOne` (`/api/plans/<id>`), `/api/auth/*`, `/api/upload`, `/api/users`...
- En cada `location` permitida, `limit_except GET { deny all; }`. Según la documentación de nginx, permitir `GET` también permite `HEAD`; cualquier otro método recibe `403`.
- **Saneado de la petición:** `proxy_set_header Authorization "";` y `proxy_set_header Cookie "";`. Aunque una cabecera llegara desde el navegador, nunca se reenvía.
- **Rechazo best-effort de borradores:** `if ($args ~* "(^|&)(status|publicationFilter)(=|%5B|\[)") { return 400; }`. Es *best-effort* porque `$args` es la query sin decodificar y una clave codificada (`%73tatus`) la sortearía. La garantía real es el middleware de Strapi.
- **Caché:**
  - En `/api/*`: `proxy_hide_header Cache-Control; proxy_hide_header Expires; add_header Cache-Control "no-store" always;` y ningún `proxy_cache`.
  - `index.html`: `Cache-Control: no-cache`.
  - Bundles con hash del build: `Cache-Control: public, max-age=31536000, immutable`.
  - Como `add_header` solo se hereda si el nivel actual no define ninguno (documentación de nginx), las cabeceras de seguridad se repiten en cada `location` que defina `add_header`.
- **Cabeceras de seguridad del SPA:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`. `style-src 'unsafe-inline'` es el fallback que documenta Angular para hosts estáticos sin nonce por petición (Angular inserta `<style>` de componentes). Si el build inserta scripts o manejadores inline (p. ej. `onload` del CSS crítico), se activa `autoCsp` o se desactiva la inlinización de CSS crítico; lo decide el Angular Developer al verificar la CSP en el navegador.

### 3. Strapi: forzar `published` en las rutas públicas (2a)

- Middleware de ruta `global::published-only` (`cms/src/middlewares/published-only.ts`), referenciado en `config.find.middlewares` del `createCoreRouter` de los cuatro tipos públicos. Antes de llamar a `next()`, sustituye `ctx.query.status` por `'published'` y elimina `ctx.query.publicationFilter`.
- Se aplica a **todas** las peticiones `find` de esos tipos, autenticadas o no: ni la app ni los e2e leen borradores por REST (los e2e verifican los borradores a través de la UI, que debe no mostrarlos).
- Las rutas de escritura (`create`, `update`, `delete`) siguen existiendo en Strapi para el token de e2e. Al público las protegen los permisos (no concedidos) y nginx (no permitidas).
- Configuración de la REST API (`cms/config/api.ts`): `defaultLimit: 25`, `maxLimit: 100` explícitos, para que la paginación del contrato (pageSize 100) sea predecible.

### 4. Angular

- `CmsClient` usa URLs relativas (`/api/...`) y `HttpClient` sin interceptores de autenticación. **No existe ninguna variable, constante ni `environment` con token.**
- En desarrollo, `ng serve` usa `proxy.conf.json` hacia nginx (`http://localhost:8080`), no hacia Strapi, para probar la misma allowlist.
- No hay caché persistente de contenido: ni `localStorage`, ni `sessionStorage`, ni service worker (`@angular/service-worker` no se instala). La configuración del país se guarda en memoria durante la carga de la app (ADR-0004).
- El pago simulado no hace ninguna petición (REQ-03.20).

### 5. Cambios de contenido en los e2e (3a + 3c)

**Credencial.** Un **token de API de tipo *Custom*** creado por el humano una sola vez en el admin de Strapi (Settings → API Tokens), con duración de 7 o 30 días y solo estos permisos:

| Content type | Acciones |
|---|---|
| `form-field` | `find`, `create`, `update`, `delete` |
| `plan` | `find`, `create`, `update`, `delete` |
| `country` | `find`, `update` |

- Se guarda en `.env` como `E2E_STRAPI_WRITE_TOKEN`, junto a `E2E_STRAPI_URL=http://127.0.0.1:1337`. En `.env.example` solo hay un valor ficticio (`changeme`).
- **Solo lo lee el proceso Node de Playwright**, con un fixture propio (`e2e/fixtures/cms-admin.ts`) que crea su contexto con `playwright.request.newContext({ baseURL: E2E_STRAPI_URL, extraHTTPHeaders: { Authorization: 'Bearer …' } })`. **Prohibido** ponerlo en `use.extraHTTPHeaders` de `playwright.config.ts`: según la documentación esa opción se envía "with every request", así que llegaría a las peticiones de la página.
- Ningún servicio de `docker-compose.yml` lo recibe; el build de Angular no lee `.env`.
- Sin token, las pruebas que lo necesitan se marcan con `test.skip(!token, 'E2E_STRAPI_WRITE_TOKEN no definido')`, y el informe de QA las lista como **No ejecutadas** con ese motivo. Nunca pasan en silencio.

**Cómo se hace cada cambio.** Con la Content API documentada (`POST`, `PUT` y `DELETE` en `/api/:pluralApiId`):

- `PUT` sin `status` publica el cambio al momento; `POST ?status=draft` crea un borrador.
- La Content API **no documenta una operación de despublicar**. Los AC que dicen "unpublish" (AC-01.10, AC-02.21, AC-03.19) se reproducen creando un documento temporal del test y borrándolo con `DELETE`. El efecto observable por la app es el mismo: el documento desaparece de lo publicado. El despublicado real desde el admin se comprueba a mano en la demo.

| AC | Preparación en el e2e | Restauración |
|---|---|---|
| AC-01.3 | `POST /api/form-fields` (publicado) con `key` `e2e_*` | `DELETE` |
| AC-01.10 | Campo temporal A (crear y luego `DELETE`); `PUT` del `order` de dos campos | `PUT` del `order` original |
| AC-01.11 | `POST /api/form-fields?status=draft` | `DELETE` |
| AC-01.13 (2.ª parte) | `PUT` de `options` del `select` de marca | `PUT` original |
| AC-01.31 | `PUT /api/countries/:documentId` (`formStepTexts.continueLabel` de CL) | `PUT` original |
| AC-02.21, AC-03.19 | Plan temporal; `PUT active=false` o `DELETE` | `DELETE` |
| AC-02.25 | `PUT` de un plan del seed (orden, recomendado o precio base) o de `priceFactors` del país | `PUT` original |
| AC-03.15 | `PUT` de `termsAndConditions` de CL | `PUT` original |

- Estas pruebas van en un proyecto de Playwright aparte (`content-changes`), en serie (`workers: 1`) y con la restauración en `finally`. Al empezar, borran cualquier documento `e2e_*` que haya quedado de una ejecución interrumpida.
- **Intercepción (3c)** para lo que Strapi no permite publicar o para los fallos: texto obligatorio ausente (AC-01.35, AC-02.33, AC-03.36), tipo desconocido o campo sin label (AC-01.25), moneda distinta (AC-02.14), plan sin precio (AC-02.15), 30 planes (AC-02.32), errores y latencia (AC-01.7, AC-01.8, AC-02.23, AC-02.24, AC-03.16, AC-03.17), términos con HTML (AC-03.14). Se hace con `page.route` sobre `/api/...`. No necesita credenciales.

## Consecuencias

- **Positivas:**
  - Tres capas independientes:
    - nginx: GET-only, allowlist y sin `Authorization`.
    - Permisos: solo `find` en cuatro tipos.
    - Middleware de Strapi: solo publicado.
  - Un error en una de ellas no expone escritura ni borradores.
  - "Recargar" siempre pide a Strapi y nada intermedio guarda respuestas (Q-01.20).
  - Los e2e de los escenarios del PDF ("configuration change without deployment") se ejecutan contra el Strapi real, no contra una simulación.
  - El token de e2e tiene alcance y duración limitados, no pasa por nginx y no existe en ningún artefacto del frontend.
- **Negativas:**
  - El token de e2e se crea **a mano** una vez: `docker compose up` no basta para ejecutar las pruebas `content-changes`. Strapi no documenta una forma de crear tokens por código o variable de entorno, y su valor solo se ve una vez (salvo con clave de cifrado configurada).
  - Los e2e escriben en la misma base SQLite que la demo. Si una ejecución se interrumpe antes del `finally`, el contenido queda modificado hasta la siguiente ejecución, que lo limpia. Los cambios sobre documentos del seed (orden, textos, términos) dependen de que la restauración funcione.
  - "Despublicar" se simula con un borrado en los e2e; el despublicado real solo se verifica a mano.
  - `no-store` impide cualquier caché del navegador para `/api`. Con este volumen no importa, pero cada recarga cuesta todas las peticiones.
  - `style-src 'unsafe-inline'` debilita la CSP frente a la inyección de estilos (es la alternativa documentada sin nonce).
  - El middleware `published-only` es código propio en `cms/`: si un content type público nuevo no lo referencia, queda expuesto. Lo vigila un punto de la checklist de review.
- **Riesgos y mitigación:**
  - *`ctx.query` aún no está procesado cuando corre el middleware de ruta* (la documentación no lo precisa). Se comprueba con la confirmación de abajo. Si falla, se usa un middleware global registrado en `config/middlewares.ts` después de `strapi::query`.
  - *Token caducado:* las pruebas fallan con 401 y el informe lo indica; se regenera en el admin.
  - *Exposición del admin de Strapi:* solo en `127.0.0.1`. El admin usa su propia sesión, que es el uso previsto de Strapi y no forma parte de la app pública.

### Confirmación

- Con la pila levantada (`docker compose up`):
  - `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/plans` → `403`
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/plans/abc` → `404`
  - `curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/plans?status=draft"` → `400`
  - `curl -s "http://127.0.0.1:1337/api/plans?status=draft"` (sin token, directo a Strapi) → solo planes publicados: el seed tiene un borrador por país (REQ-02.33) que **no** debe aparecer
  - `curl -sI http://localhost:8080/api/countries` → incluye `Cache-Control: no-store`
- E2E AC-01.30, AC-02.31 y AC-03.24: ninguna petición de la página lleva `Authorization`, y todas las de `/api` son `GET`.
- Review (checklist de seguridad):
  - `grep -rniE "authorization|bearer|api[_-]?token|E2E_STRAPI" frontend/` sin resultados.
  - `E2E_STRAPI_WRITE_TOKEN` solo aparece en `e2e/fixtures/` y en `.env.example`.
  - Los permisos públicos del bootstrap coinciden con la tabla.
  - Cada router público referencia `global::published-only`.

## Pros y contras de las opciones

### 1a. nginx mismo origen (elegida, D4)

- A favor: sin CORS; una única superficie pública controlable; sanea cabeceras; sirve el SPA y la API desde el mismo origen.
- En contra: allowlist duplicada respecto a los permisos (dos sitios que mantener).

### 1b. Navegador directo a Strapi

- A favor: un componente menos.
- En contra: expone todas las rutas de Strapi (admin incluido) al navegador, exige CORS y no permite limitar métodos ni cabeceras; contradice D4.

### 1c. BFF

- A favor: podría ocultar Strapi por completo y validar parámetros.
- En contra: más código y más infraestructura; D4 lo excluye de forma explícita.

### 2a. Middleware `published-only` en Strapi (elegida) + nginx best-effort

- A favor: actúa sobre la query ya interpretada por Strapi, no sobre la cadena cruda; no depende de terceros.
- En contra: código propio que hay que referenciar en cada router público.

### 2b. Solo nginx

- A favor: cero código en Strapi.
- En contra: se sortea codificando la clave del parámetro, y no protege el acceso directo a `127.0.0.1:1337`.

### 2c. Sin Draft & Publish

- A favor: elimina el problema de raíz.
- En contra: **incumple** el PDF ("only published and active plans") y AC-01.11 y AC-02.5, que exigen borradores.

### 2d. Plugin de terceros

- A favor: resuelve el caso con una opción.
- En contra: dependencia nueva de un tercero para una regla de seguridad, mantenida fuera de Strapi; el middleware equivalente es breve.

### 3a. Token Custom solo en Node (elegida)

- A favor: usa la Content API documentada; alcance mínimo y caducidad; nunca toca el navegador; se puede revocar desde el admin.
- En contra: hay que crearlo a mano; no hay despublicado documentado por REST.

### 3b. Login de admin automatizado

- A favor: totalmente automático (credenciales en `.env`); permitiría despublicar de verdad con el Content Manager.
- En contra: depende de **endpoints internos no documentados** del admin, que pueden cambiar entre versiones menores. La credencial es de superadministrador, con mucho más alcance que un token Custom. Las alternativas oficiales (tokens de admin) también se crean a mano.

### 3c. Solo intercepción

- A favor: sin credenciales, determinista y rápida.
- En contra: no prueba que Strapi y la app se integren al cambiar contenido. El escenario del PDF ("configuration change without deployment") quedaría probado contra una respuesta simulada.

### 3d. Manual

- A favor: cero infraestructura de pruebas.
- En contra: no es repetible ni deja salida de ejecución real como evidencia.

## Referencias

Consultadas el 2026-11-22:

- Strapi 5, REST API: endpoints, `POST`/`PUT` publican por defecto, `?status=draft`: https://docs.strapi.io/cms/api/rest
- Strapi 5, parámetro `status` (por defecto `published`, se aplica a las relaciones pobladas): https://docs.strapi.io/cms/api/rest/status
- Strapi 5, Draft & Publish (`status` en la Content API, `publicationFilter`, despublicar en el admin): https://docs.strapi.io/cms/features/draft-and-publish
- Strapi, petición abierta "Prevent users from querying draft content via REST/GraphQL (via status filter)" (2026-02-03): https://feedback.strapi.io/feature-requests/p/prevent-users-from-querying-draft-content-via-rest-graphql-via-status-filter
- Strapi 5, rutas (`createCoreRouter`, `only`, `except`, `config.find.middlewares`): https://docs.strapi.io/cms/backend-customization/routes
- Strapi 5, middlewares (ubicación, firma, `global::`): https://docs.strapi.io/cms/backend-customization/middlewares
- Strapi 5, paginación (`pageSize` limitado por `api.rest.maxLimit`): https://docs.strapi.io/cms/api/rest/sort-pagination
- Strapi 5, API tokens (tipos Read-only, Full access y Custom; duración; visible una vez sin clave de cifrado; sin creación por código documentada): https://docs.strapi.io/cms/features/api-tokens
- Strapi 5, admin tokens (también se crean en el admin): https://docs.strapi.io/cms/features/admin-tokens
- Strapi 5, Users & Permissions (rol público, "Enable sign-ups"): https://docs.strapi.io/cms/features/users-permissions
- nginx, `limit_except` (GET implica HEAD): https://nginx.org/en/docs/http/ngx_http_core_module.html#limit_except
- nginx, `add_header` (`always`, reglas de herencia): https://nginx.org/en/docs/http/ngx_http_headers_module.html
- Angular, seguridad (sanitizado, CSP, `autoCsp`, `'unsafe-inline'` en `style-src` sin nonce): https://angular.dev/best-practices/security
- Playwright, API testing desde Node: https://playwright.dev/docs/api-testing
- Playwright, `apiRequest.newContext` (`baseURL`, `extraHTTPHeaders`): https://playwright.dev/docs/api/class-apirequest
- Playwright, `testOptions.extraHTTPHeaders` ("sent with every request"): https://playwright.dev/docs/api/class-testoptions
