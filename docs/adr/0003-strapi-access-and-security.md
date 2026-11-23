# ADR-0003 — Acceso a Strapi, seguridad, caché y cambios de contenido en los e2e

| Campo | Valor |
|---|---|
| Estado | Accepted (2026-11-22, G3) |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisores | Humano (G3) |
| Motivado por | D4, D9 · G2-13 (Q-01.20) · G3-2, G3-3 · REQ-01.6, REQ-01.35, REQ-02.2, REQ-02.23, REQ-02.31, REQ-03.20, REQ-03.24 · AC-01.3, AC-01.10, AC-01.11, AC-01.13, AC-01.30, AC-01.31, AC-02.21, AC-02.25, AC-02.31, AC-03.15, AC-03.19, AC-03.24 |

## Contexto y problema

El PDF exige que "no Strapi token with write permissions may reach the browser" y "public role permissions minimal and justified". D4 (G0) fijó lo siguiente: rol público solo `find`/`findOne`, nginx como proxy GET-only con allowlist, ningún token en el navegador y sin BFF. Quedan por concretar cuatro cosas:

1. Los permisos exactos y la allowlist.
2. Que "recargar" muestre siempre lo publicado: sin caché intermedia (Q-01.20, REQ-01.6, REQ-02.23).
3. Que nunca se sirvan borradores (REQ-01.6, REQ-02.2).
4. Cómo se prueban los AC que describen un cambio de contenido en Strapi (AC-01.3, AC-01.10, AC-01.11, AC-01.13, AC-01.31, AC-02.21, AC-02.25, AC-03.15, AC-03.19) sin romper el arranque con un solo comando ni introducir credenciales.

### Hallazgo: el rol público puede leer borradores

En Strapi 5, el parámetro `status` de la REST API admite `draft` y `published`, y el valor por defecto es `published`. **No hay un permiso separado para leer borradores.** Según la petición abierta en el portal de feedback de Strapi (3 de febrero de 2026), "any user with find or findOne permission on a content-type can access draft entries by using the status parameter". La documentación de Draft & Publish confirma que la Content API puede pedir "draft or published content" con `status`, y menciona además el parámetro `publicationFilter`. La página del parámetro `status` no dice qué permiso exige `status=draft` (verificación del orquestador en `reviews/001-G3-architecture-check.md`). Por eso el middleware se mantiene como defensa en profundidad, y su `curl` de confirmación es obligatorio al implementar.

Consecuencia: con D4 tal como está, una petición pública `GET /api/plans?status=draft` podría devolver borradores (planes o términos sin publicar). La app nunca la hace (REQ-01.6), pero un visitante sí podría. D4 sigue siendo viable, pero necesita una medida adicional que no la contradice: forzar `published` en las rutas públicas.

## Factores de decisión

- Ningún token en el navegador ni en el bundle (`CLAUDE.md` §6).
- Superficie pública mínima: solo lo que leen US-01, US-02 y US-03 (api-contracts).
- Defensa en profundidad: un fallo en una capa (nginx, permisos de Strapi o código) no expone escritura ni borradores.
- Cambios visibles al recargar, sin caché HTTP intermedia.
- E2E reproducibles con `docker compose up` por cualquiera que clone el repositorio, sin pasos manuales ni credenciales (PDF: "a single command to start the whole project").
- Sin dependencias nuevas.

## Opciones consideradas

**Eje 1: cómo llega el navegador a Strapi**

1. **1a. nginx mismo origen, GET-only con allowlist exacta y saneado de cabeceras (D4).**
2. **1b. Navegador directo a Strapi (`:1337`) con CORS.**
3. **1c. BFF propio** (Node) que llama a Strapi con credenciales de servidor.

**Eje 2: cómo evitar borradores en lecturas públicas**

1. **2a. Middleware de ruta en Strapi `published-only`** en las rutas `find` públicas, más un rechazo best-effort en nginx.
2. **2b. Solo nginx**: rechazar `status` y `publicationFilter` en la query.
3. **2c. Desactivar Draft & Publish** en los content types públicos.
4. **2d. Plugin de terceros** (`strapi-plugin-draft-preview`, opción `guardNativeStatus`).

**Eje 3: cómo se prueban los AC de cambio de contenido** (G3-3)

1. **3a. Escrituras reales en Strapi desde el proceso Node de Playwright** con un token de API Custom creado a mano en el admin.
2. **3b. Login de administrador automatizado** desde Playwright y uso de los endpoints internos del admin (Content Manager).
3. **3c. Solo intercepción de red** (`page.route`): el e2e modifica en el navegador de pruebas la respuesta real de Strapi.
4. **3d. Verificación manual** del cambio real en Strapi.

## Decisión

Opción elegida: **1a + 2a + 3c**, con **3d** para el cambio real en Strapi, que se comprueba a mano en G5 (G3-3).

### 1. Rol público de Strapi (bootstrap idempotente)

**Solo `find`**, sin `findOne`, en cuatro tipos (G3-2: precisión de D4, que fijaba `find`/`findOne` como máximo):

| Permiso | Motivo | Lecturas que lo usan |
|---|---|---|
| `api::country.country.find` | Lista de países (`/`, "país no disponible"), configuración del país, factores, términos | C1, C3, C6, C7 (api-contracts) |
| `api::form-field.form-field.find` | Campos del paso 1 del país | C4 |
| `api::plan.plan.find` | Planes del país | C5 |
| `api::country-selection.country-selection.find` | Textos de `/` | C2 |

- **No se concede `findOne`** en ningún tipo: ninguna lectura lo necesita (el plan elegido se comprueba contra la lista, REQ-03.14).
- El bootstrap **elimina cualquier otro permiso** del rol público (incluidos los de `plugin::users-permissions.auth.*` y los de `upload`) y desactiva el registro de usuarios ("Enable sign-ups" = false) en los ajustes avanzados de Users & Permissions. Es idempotente: en cada arranque deja exactamente esta tabla.
- Ningún tipo usa i18n (ADR-0001). El rol `authenticated` no tiene permisos.

### 2. nginx (único punto de entrada del navegador)

- Sirve el build de Angular y hace de proxy de `/api` hacia Strapi en la red interna de Docker. El puerto de Strapi se publica solo en `127.0.0.1:1337`, para el admin del negocio. El admin de Strapi no pasa por nginx.
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

### 3. Strapi: solo lectura publicada en la Content API (2a)

- Middleware de ruta `global::published-only` (`cms/src/middlewares/published-only.ts`), referenciado en `config.find.middlewares` del `createCoreRouter` de los cuatro tipos públicos. Antes de llamar a `next()`, sustituye `ctx.query.status` por `'published'` y elimina `ctx.query.publicationFilter`. Se aplica a todas las peticiones `find` de esos tipos.
- Como ningún cliente escribe por la Content API (ni la app, ni los e2e, ver §5), los cuatro routers se declaran con **`only: ['find']`**. Las rutas `findOne`, `create`, `update` y `delete` de la Content API no se cargan. El admin de Strapi no se ve afectado, porque usa su propia API, no estas rutas.
- Configuración de la REST API (`cms/config/api.ts`): `defaultLimit: 25`, `maxLimit: 100` explícitos, para que la paginación del contrato (pageSize 100) sea predecible.

### 4. Angular

- `CmsClient` usa URLs relativas (`/api/...`) y `HttpClient` sin interceptores de autenticación. **No existe ninguna variable, constante ni `environment` con credenciales.**
- En desarrollo, `ng serve` usa `proxy.conf.json` hacia nginx (`http://localhost:8080`), no hacia Strapi, para probar la misma allowlist.
- No hay caché persistente de contenido: ni `localStorage`, ni `sessionStorage`, ni service worker (`@angular/service-worker` no se instala). La configuración del país se guarda en memoria durante la carga de la app (ADR-0004).
- El pago simulado no hace ninguna petición (REQ-03.20).

### 5. AC de cambio de contenido: intercepción (3c) y comprobación manual en G5 (3d)

**Mecanismo.** El e2e no escribe en Strapi ni usa ninguna credencial. Para simular "el negocio publica un cambio y recargo":

1. Carga la página contra el Strapi real con el seed.
2. Registra `page.route` sobre la petición afectada. El manejador obtiene la **respuesta real** con `route.fetch()`, aplica solo el cambio del escenario sobre su JSON y la devuelve con `route.fulfill({ response, body })`.
3. Recarga y comprueba la UI.

Así solo se simula el cambio; el resto de la respuesta (formato v5, `documentId`, componentes) es el de Strapi.

| AC | Cambio que aplica la intercepción |
|---|---|
| AC-01.3 | C4: añade un campo publicado nuevo |
| AC-01.10 | C4: quita el campo A e intercambia el `order` de B y C |
| AC-01.11 | Sin intercepción: el **seed incluye un campo en borrador por país** (content-model §6), y el e2e comprueba contra Strapi real que no aparece y que ninguna petición de la app lleva `status` o `publicationFilter` |
| AC-01.13 (2.ª parte) | C4: añade la opción "Marca C" al `select` de marca |
| AC-01.31 | C3: cambia `formStepTexts.continueLabel` solo en la respuesta de CL; CO sin cambios |
| AC-02.21, AC-03.19 | C5: quita de la lista el plan persistido (desactivado o despublicado) o cambia su `currency` |
| AC-02.25 | C5 o C6: cambia el orden, el recomendado, el precio base de un plan, o una banda de `priceFactors` |
| AC-03.15 | C7: cambia `termsAndConditions` de CL |

La intercepción cubre también los casos que Strapi no permite publicar o los fallos: texto obligatorio ausente (AC-01.35, AC-02.33, AC-03.36; G3-5), tipo desconocido o campo sin label (AC-01.25), moneda distinta (AC-02.14), plan sin precio (AC-02.15), 30 planes (AC-02.32), errores y latencia (AC-01.7, AC-01.8, AC-02.23, AC-02.24, AC-03.16, AC-03.17) y términos con HTML (AC-03.14).

**Comprobación manual en G5 (G3-3).** Con la pila levantada, el humano:

1. Añade y publica en el admin de Strapi un campo nuevo para un país, recarga la app y comprueba que aparece (AC-01.3).
2. Desactiva un plan, recarga el paso de planes y comprueba que ya no aparece (AC-02.25).
3. Restaura ambos cambios.

El resultado se registra en `docs/qa/manual-check.md`. El informe de e2e indica que la integración real Strapi → app para esos AC se verifica en esa comprobación.

## Consecuencias

- **Positivas:**
  - Tres capas independientes:
    - nginx: GET-only, allowlist y sin `Authorization`.
    - Permisos: solo `find` en cuatro tipos, y routers con `only: ['find']`.
    - Middleware de Strapi: solo publicado.
  - Un error en una de ellas no expone escritura ni borradores.
  - No existe ninguna credencial de escritura en el proyecto: ni en `.env`, ni en `e2e/`, ni en el frontend. La superficie del requisito de seguridad del PDF se reduce a cero.
  - Todos los e2e se ejecutan con `docker compose up` y `npx playwright test`, sin pasos previos. Ningún AC queda "No ejecutado" para quien clone el repositorio.
  - Los e2e no modifican la base de datos de la demo y pueden correr en paralelo.
  - "Recargar" siempre pide a Strapi y nada intermedio guarda respuestas (Q-01.20).
- **Negativas:**
  - Los escenarios del PDF "Configuration change without deployment" (AC-01.3) y el cambio de planes (AC-02.25) **no se prueban de forma automática contra un cambio real en Strapi**. Lo automatizado prueba que la app refleja una respuesta distinta al recargar. Que Strapi produzca esa respuesta tras publicar se comprueba una vez a mano en G5, y esa evidencia no se repite en cada ejecución.
  - `route.fetch()` + modificación depende de que el e2e conozca la forma del JSON (api-contracts). Si el contrato cambia, hay que actualizar las pruebas.
  - Despublicar desde el admin solo se comprueba de forma indirecta (borradores del seed y comprobación manual).
  - `no-store` impide cualquier caché del navegador para `/api`. Con este volumen no importa, pero cada recarga cuesta todas las peticiones.
  - `style-src 'unsafe-inline'` debilita la CSP frente a la inyección de estilos (es la alternativa documentada sin nonce).
  - El middleware `published-only` y `only: ['find']` son código propio en `cms/`: si un content type público nuevo no los referencia, queda expuesto. Lo vigila un punto de la checklist de review.
- **Riesgos y mitigación:**
  - *`ctx.query` aún no está procesado cuando corre el middleware de ruta* (la documentación no lo precisa). Se comprueba con la confirmación de abajo. Si falla, se usa un middleware global registrado en `config/middlewares.ts` después de `strapi::query`.
  - *Exposición del admin de Strapi:* solo en `127.0.0.1`. El admin usa su propia sesión, que es el uso previsto de Strapi y no forma parte de la app pública.

### Confirmación

- Con la pila levantada (`docker compose up`):
  - `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/plans` → `403`
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/plans/abc` → `404`
  - `curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/plans?status=draft"` → `400`
  - `curl -s "http://127.0.0.1:1337/api/plans?status=draft"` (directo a Strapi) → solo planes publicados: el seed tiene un borrador por país (REQ-02.33) que **no** debe aparecer. Igual con `/api/form-fields?status=draft` y el campo en borrador del seed
  - `curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:1337/api/plans` → `404` o `405` (ruta no cargada por `only: ['find']`)
  - `curl -sI http://localhost:8080/api/countries` → incluye `Cache-Control: no-store`
- E2E AC-01.30, AC-02.31 y AC-03.24: ninguna petición de la página lleva `Authorization`, y todas las de `/api` son `GET`.
- G5: `docs/qa/manual-check.md` registra la comprobación manual del campo nuevo y del plan desactivado.
- Review (checklist de seguridad):
  - `grep -rniE "authorization|bearer|api[_-]?token" frontend/ e2e/` → solo la aserción de AC-01.30 en `e2e/` (comprueba la *ausencia* de la cabecera).
  - `.env.example` no contiene ninguna variable de token de Strapi.
  - Los permisos públicos del bootstrap coinciden con la tabla.
  - Cada router público tiene `only: ['find']` y referencia `global::published-only`.

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

### 3a. Escrituras reales con token Custom (descartada en G3-3)

- A favor: prueba de forma automática la integración real Strapi → app con la Content API documentada. El token tendría alcance mínimo, nunca tocaría el navegador y se podría revocar.
- En contra (motivo del descarte):
  - Strapi no documenta cómo crear tokens por código, así que habría que crearlo **a mano** en el admin. Es un paso manual que choca con el arranque con un solo comando que pide el PDF.
  - Para quien clone el repositorio sin ese token, **5 AC quedarían "No ejecutados"** (AC-01.3, AC-01.10, AC-01.11, AC-01.31 y AC-02.25).
  - Además, añadiría una credencial de escritura al proyecto, tests que mutan la base de la demo, ejecución en serie con restauración, y despublicado simulado con borrados.

### 3b. Login de admin automatizado

- A favor: totalmente automático; permitiría despublicar de verdad con el Content Manager.
- En contra: depende de **endpoints internos no documentados** del admin, que pueden cambiar entre versiones menores. Exigiría credenciales de superadministrador en el entorno de pruebas, con mucho más alcance que cualquier token. Las alternativas oficiales (tokens de admin) también se crean a mano.

### 3c. Solo intercepción (elegida, G3-3)

- A favor: sin credenciales ni pasos manuales; determinista y rápida; reproducible por cualquiera que clone el repositorio; con `route.fetch()` solo se simula el cambio y el resto de la respuesta es la real.
- En contra: no prueba de forma automática que Strapi produzca la respuesta tras publicar. Se compensa con 3d en G5.

### 3d. Verificación manual (complemento de 3c, G5)

- A favor: comprueba la integración real con el admin, incluido publicar y desactivar.
- En contra: no es repetible en cada ejecución; la evidencia es un registro manual.

## Referencias

Consultadas el 2026-11-22:

- Strapi 5, REST API (endpoints, `POST`/`PUT`, `?status=draft`): https://docs.strapi.io/cms/api/rest
- Strapi 5, parámetro `status` (por defecto `published`, se aplica a las relaciones pobladas): https://docs.strapi.io/cms/api/rest/status
- Strapi 5, Draft & Publish (`status` en la Content API, `publicationFilter`, despublicar en el admin): https://docs.strapi.io/cms/features/draft-and-publish
- Strapi, petición abierta "Prevent users from querying draft content via REST/GraphQL (via status filter)" (2026-02-03): https://feedback.strapi.io/feature-requests/p/prevent-users-from-querying-draft-content-via-rest-graphql-via-status-filter
- Strapi 5, rutas (`createCoreRouter`, `only`, `except`, `config.find.middlewares`): https://docs.strapi.io/cms/backend-customization/routes
- Strapi 5, middlewares (ubicación, firma, `global::`): https://docs.strapi.io/cms/backend-customization/middlewares
- Strapi 5, paginación (`pageSize` limitado por `api.rest.maxLimit`): https://docs.strapi.io/cms/api/rest/sort-pagination
- Strapi 5, API tokens (se crean en el admin; sin creación por código documentada): https://docs.strapi.io/cms/features/api-tokens
- Strapi 5, admin tokens (también se crean en el admin): https://docs.strapi.io/cms/features/admin-tokens
- Strapi 5, Users & Permissions (rol público, "Enable sign-ups"): https://docs.strapi.io/cms/features/users-permissions
- nginx, `limit_except` (GET implica HEAD): https://nginx.org/en/docs/http/ngx_http_core_module.html#limit_except
- nginx, `add_header` (`always`, reglas de herencia): https://nginx.org/en/docs/http/ngx_http_headers_module.html
- Angular, seguridad (sanitizado, CSP, `autoCsp`, `'unsafe-inline'` en `style-src` sin nonce): https://angular.dev/best-practices/security
- Playwright, red (`page.route`, modificar respuestas con `route.fetch()` + `route.fulfill()`, cubre fetch y XHR): https://playwright.dev/docs/network
