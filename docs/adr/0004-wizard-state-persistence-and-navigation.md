# ADR-0004 — Estado del wizard, carga de datos, persistencia y navegación

| Campo | Valor |
|---|---|
| Estado | Proposed |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisores | Humano (G3) |
| Motivado por | D6, D7, D9 · G2-9, G2-10, G2-11, G2-12, G2-13 · REQ-01.3, REQ-01.4, REQ-01.6, REQ-01.18, REQ-01.23 a REQ-01.27, REQ-01.31, REQ-02.16 a REQ-02.23, REQ-02.30, REQ-03.1, REQ-03.5, REQ-03.9 a REQ-03.14, REQ-03.19, REQ-03.21 a REQ-03.32, REQ-03.37 |

## Contexto y problema

El wizard tiene 3 pasos más una confirmación (D7) y persiste en `sessionStorage` separado por país (D6). Las specs fijan reglas que se cruzan entre las tres historias:

- Solo se guardan valores; `isComplete` se calcula cada vez con la configuración vigente y nunca se persiste (G2-10, F-00.5).
- Del plan solo se persiste su `documentId`, y el precio se recalcula (G2-9).
- La aceptación de términos, el resultado elegido y el estado de pago no se persisten (US-03 §6.2).
- Tras un pago exitoso se borra el estado del país y queda una confirmación mínima sin datos personales (REQ-03.28).
- La configuración del país se pide una vez por carga de la app (Q-01.20). Los planes y factores, en cada entrada al paso 2 (REQ-02.23) y al resumen (REQ-03.5, REQ-03.14).

Hay que decidir el formato y las claves de almacenamiento, dónde vive el estado, cómo se cargan los datos con estados explícitos, cómo funcionan las guardas y cómo se protege el pago.

## Factores de decisión

- Estado con `signal`/`computed`, zoneless, sin NgModules (D2, `CLAUDE.md` §8).
- Lógica en funciones puras (reconciliación, `isComplete`, precio, enmascarado, número de cotización).
- Separación estricta por país (REQ-01.25, REQ-03.37).
- Tolerancia a datos corruptos o manipulados (US-01 5.4).
- Estados de carga, error y vacío en cada llamada, con "cargando" anunciado (REQ-01.3, REQ-02.20, REQ-03.31).
- Sin dependencias nuevas.

## Opciones consideradas

**Formato de persistencia**

1. **P1. Una clave por país y por tipo de dato** (`ciq.v1.{cc}.step1`, `.plan`, `.confirmation`), JSON validado al leer.
2. **P2. Un único objeto por país** (`ciq.{cc}` con `step1`, `plan`, `confirmation`).
3. **P3. Librería de estado con persistencia** (p. ej. `@ngrx/signals` con un plugin de almacenamiento).

**Carga de datos**

1. **L1. `resource()` de Angular** (estable desde v22) con un *loader* que llama a `CmsClient` (`HttpClient`), que pagina y mapea.
2. **L2. `httpResource()`** (estable desde v22) directamente sobre cada URL.
3. **L3. `HttpClient` + señales de estado escritas a mano.**

**Guardas de navegación**

1. **G1. Guards funcionales `canActivate`** que esperan la configuración del país (en memoria) y devuelven `RedirectCommand`, más un indicador "cargando" mientras la navegación está pendiente.
2. **G2. Comprobación dentro de cada página**, que redirige con `router.navigate(..., { replaceUrl: true })` tras cargar.

## Decisión

Opción elegida: **P1 + L1 + G1** (con la comprobación de G2 como respaldo tras un reintento).

### Persistencia (P1)

Acceso a través de `WizardStorage` (`frontend/src/app/core/storage/`), que recibe el `Storage` por un token `WIZARD_STORAGE` (por defecto `sessionStorage`, sustituible en los tests).

| Clave | Contenido (JSON) | Dueño | Se borra |
|---|---|---|---|
| `ciq.v1.{cc}.step1` | `{ "values": { "<fieldKey>": string \| number \| boolean \| null } }` | US-01 | Tras un pago exitoso |
| `ciq.v1.{cc}.plan` | `{ "planDocumentId": "<documentId>" }` | US-02 | Tras un pago exitoso; al descartar un plan no disponible (REQ-02.17) |
| `ciq.v1.{cc}.confirmation` | `{ "quoteNumber": "CO-20261122-7K3F9Q", "planName": "...", "finalPrice": 1320000, "currency": "COP", "paidAt": "2026-11-22T15:04:05.000Z" }` | US-03 | Con "nueva cotización" |

- `{cc}` es el código del país en minúsculas de la URL ya validado. `v1` es la versión del esquema: si cambia, se usa `v2` y las claves `v1` se ignoran y se eliminan.
- **No se guarda nada más:** ni configuración, ni planes, ni precios, ni factores, ni términos, ni `isComplete`, ni la aceptación de términos, ni el resultado del pago (REQ-01.6, REQ-02.23, G2-9, G2-10, REQ-03.12).
- **Lectura defensiva:** si el JSON no se puede interpretar o no tiene la forma esperada, se descarta esa clave y se avisa en consola sin datos personales (5.4). Un valor de tipo inesperado se descarta individualmente.
- **Escritura del paso 1:** un `effect()` en `DynamicForm` escribe en cada cambio del modelo los valores **normalizados**: `text` recortado, `NaN` → `null`, `date` como `YYYY-MM-DD` (REQ-01.23, Q-01.16). `action` vuelve a escribir al continuar. Mientras se escribe, el modelo conserva el texto sin recortar, y al salir del campo se sustituye por el recortado.
- El documento y la fecha de nacimiento quedan en claro en `sessionStorage` (Q-01.15, Q-03.23); se documenta en el README.

### Estado en memoria

- `CountryConfigStore` (`providedIn: 'root'`) mantiene un `Map<cc, ResourceRef<CountryConfig>>`. `CountryConfig` = país + textos + `FormConfig`. Se crea al entrar en el país y **no se vuelve a pedir** al navegar entre pasos, solo al recargar o al pulsar "reintentar" (Q-01.20).
- `Step1State` deriva del almacenamiento y de la configuración:
  - `reconcileStep1(config, stored) → Step1Model`: función pura con la tabla 5.4.
  - `evaluateStep1(config, values, { today, minimumAge }) → Step1Result`: función pura. Para cada campo vigente devuelve `key`, `type`, `section`, `role`, `value`, `displayValue` (etiqueta de la opción en `select`) y `valid`, más `isComplete` (REQ-01.27). `isComplete` es `false` si la configuración no está `ready` (vacía, no disponible o con error).
  - `isComplete` es un `computed` sobre esas funciones: se recalcula al leerlo y nunca se escribe.
- Los planes y factores se piden con `resource()` creado por la página (paso 2 y resumen), así que se cancelan al salir y se vuelven a pedir en cada entrada (REQ-02.23).
- Los términos, con su propio `resource()` en el resumen, para mostrar la carga y el error en esa sección (REQ-03.31, REQ-03.32, AC-03.17).

### Carga de datos (L1) y estados

- `CmsClient` (`core/cms/`) hace la petición `GET`, aplica un **timeout de 10 000 ms** (REQ-02.21 deja el valor al ADR), recorre las páginas si `pageCount > 1` (REQ-02.24), valida la forma global y entrega DTOs. Los mappers convierten los DTOs en dominio (api-contracts).
- `resource()` expone el estado de carga, el error y el valor, y permite recargar. Las páginas derivan un único `viewState`: `loading` | `error` | `configError` (falta un texto, G2-2) | `empty` | `unavailable` (G2-5) | `ready`.
  - `loading` → "cargando" con `role="status"`.
  - `error` → "error de carga" + "reintentar" con `role="alert"`.
  - `configError` → mensaje genérico del país o, si también falta, "error de carga" (F-00.7).
- Sin reintentos automáticos: solo el botón "reintentar" (REQ-01.4).
- Los 4 textos fijos (G2-2) están en un único archivo, `core/ui-state/fixed-texts.ts`.

### Navegación y guardas (G1)

| Ruta | Guard | Regla | Redirección |
|---|---|---|---|
| `/:country` (shell) | `countryCaseGuard` | Segmento en mayúsculas | Misma URL en minúsculas (ADR-0001) |
| `/:country/plans` | `step1CompleteGuard` | Espera `CountryConfig`. Si está `ready` y `isComplete` es falso | `/:country/form`, sin pedir planes (REQ-02.19, AC-02.22) |
| `/:country/summary` | `step1CompleteGuard`, `planSelectedGuard` | `isComplete` falso → paso 1; sin `ciq.v1.{cc}.plan` → paso 2 | REQ-03.13, AC-03.18 |
| `/:country/confirmation` | `confirmationGuard` | Sin `ciq.v1.{cc}.confirmation` válido | `/:country/form` (REQ-03.29) |

- Los guards devuelven `true` si la configuración **falla** al cargar. La página muestra entonces "error de carga" y, tras un "reintentar" con éxito, vuelve a evaluar `isComplete` y redirige si hace falta (respaldo G2).
- Mientras un guard espera, el componente raíz muestra "cargando" (señal derivada de los eventos del `Router`: `NavigationStart` → `true`; `NavigationEnd`, `NavigationCancel` o `NavigationError` → `false`). Así se cumple REQ-02.20 cuando se entra por URL.
- **Plan no disponible en el resumen** (REQ-03.14, G2-11): el resumen carga los planes y, si el plan persistido no está en la lista vigente, navega a `/:country/plans` sin borrar nada. El paso 2 detecta el mismo caso, descarta la selección y muestra el aviso (REQ-02.17). Así hay una única implementación del descarte.
- **Desde el resumen** (REQ-03.9 a REQ-03.11): "editar datos" → `/form`; desde ahí continuar → `/plans` con el plan preseleccionado → `/summary`.
- **Foco al cambiar de paso** (REQ-01.31, REQ-02.28, REQ-03.33): cada página enfoca su `<h1 tabindex="-1">` con `afterNextRender`, y el shell actualiza `document.title` con el título del paso (texto de Strapi).

### Pago simulado y confirmación (D9, G2-12)

- Estado local de `SummaryStepPage`, sin persistir:
  - `termsAccepted = signal(false)`
  - `outcome = signal<'approved' | 'rejected'>('approved')`
  - `payment = signal<'idle' | 'processing' | 'rejected'>('idle')`
- `canPay = computed(...)` con los datos cargados y válidos, el plan válido, los términos cargados y aceptados, y `payment() !== 'processing'` (REQ-03.19).
- `pay()` sale de inmediato si `payment() === 'processing'`. Es la **guarda en el estado**, independiente del atributo `disabled` (REQ-03.23). Después cambia el estado a `processing` y llama a `MockPaymentGateway.pay(outcome, abortSignal)`, que resuelve tras `PAYMENT_DELAY_MS` (token, 1500 ms por defecto; REQ-03.24). No hace ninguna petición (REQ-03.20).
- Al destruir la página se aborta el pago pendiente (`DestroyRef`) y su resultado se ignora (REQ-03.22).
- **Éxito**, en este orden:
  1. Genera el número con `createQuoteNumber(cc, now, randomSource)`, una función pura con `crypto.getRandomValues` inyectado (REQ-03.26).
  2. Escribe `confirmation`.
  3. Borra `step1` y `plan`.
  4. Navega a `/:country/confirmation` con `replaceUrl: true`.

  Si se vuelve atrás después, el resumen redirige al paso 1 vacío porque `isComplete` es falso (REQ-03.28, AC-03.29).
- **Rechazo:** `payment.set('rejected')`, mensaje con `role="alert"`; se conservan los datos y la aceptación de términos (REQ-03.30).
- **Nueva cotización:** borra `confirmation` y navega a `/:country/form`.

## Consecuencias

- **Positivas:**
  - Cada clave tiene un único dueño y un ciclo de vida claro. Si una clave está corrupta, solo se pierde esa (p. ej., el paso 1), como pide 5.4.
  - `isComplete` no puede quedar obsoleto porque no existe en el almacenamiento (F-00.5).
  - `resource()` aporta la cancelación por `AbortSignal` al salir de la página o al recargar, y un estado uniforme para carga, error y reintento.
  - Las redirecciones ocurren antes de pintar el paso y antes de pedir planes (AC-02.22).
- **Negativas:**
  - Tres claves por país: el borrado tras el pago son dos operaciones, sin atomicidad. Si la pestaña muere entre las dos, puede quedar un `plan` huérfano, que es inofensivo porque sin `step1` el resumen redirige al paso 1.
  - El documento queda en claro en `sessionStorage` mientras dura la cotización (riesgo aceptado en G2).
  - Los guards esperan una petición HTTP: la primera navegación por URL directa a `/plans` o `/summary` muestra el "cargando" global antes que el del paso.
  - Hay dos lugares que evalúan `isComplete` (guard y página tras un reintento); se mitiga usando la misma función pura.
  - No se impide pagar en una pestaña duplicada (limitación aceptada, REQ-03.23).
- **Riesgos y mitigación:**
  - *Nombres exactos de las señales de `ResourceRef`:* la guía de `httpResource` documenta `value()`, `hasValue()`, `error()` e `isLoading()`. El Angular Developer confirma en la referencia de `ResourceRef` el método de recarga antes de implementarlo.
  - *El `effect()` de escritura se ejecuta con el modelo inicial y sobrescribe lo guardado antes de reconciliar:* el modelo se inicializa con los valores ya reconciliados, así que la primera escritura es idempotente. Hay un unit test que lo verifica (AC-01.21).

### Confirmación

- Unit: `reconcileStep1` (AC-01.23, AC-01.24), `evaluateStep1` (AC-01.29), `WizardStorage` (JSON corrupto, tipos inesperados, separación por país: AC-01.22), guards (AC-02.22, AC-03.18, AC-03.30), `SummaryStepPage` con `PAYMENT_DELAY_MS = 0` y contador de intentos (AC-03.22, AC-03.23), `createQuoteNumber` (AC-03.27).
- E2E: AC-01.4, AC-01.21, AC-02.19, AC-02.20, AC-02.30, AC-03.10, AC-03.11, AC-03.28, AC-03.29.
- Review: `grep -rn "localStorage\|serviceWorker\|isComplete.*setItem" frontend/src` sin resultados; las únicas llamadas a `sessionStorage` están en `core/storage/`.

## Pros y contras de las opciones

### P1. Una clave por país y por dato (elegida)

- A favor: corrupción aislada; dueño claro por historia; fácil de inspeccionar en los e2e (AC-01.29: "no completed flag stored").
- En contra: varias escrituras al limpiar; más claves.

### P2. Un objeto por país

- A favor: una sola escritura y un borrado atómico.
- En contra: si el JSON se corrompe se pierde todo el país, no solo el paso 1 (la tabla 5.4 dice "todo lo del paso 1"). Cada historia reescribe el objeto completo, lo que acopla a las tres.

### P3. Librería de estado con persistencia

- A favor: patrones ya hechos (hidratación, selectores).
- En contra: dependencia nueva sin necesidad real (`CLAUDE.md` §6); el estado es pequeño.

### L1. `resource()` + `CmsClient` (elegida)

- A favor: estable en v22; el *loader* asíncrono permite paginar y mapear en un solo paso; cancela al destruirse.
- En contra: añade un nivel de indirección respecto a `httpResource`.

### L2. `httpResource()`

- A favor: muy conciso; usa `HttpClient` (con interceptores); opción `parse` para validar.
- En contra: una URL por recurso. Recorrer las páginas (REQ-02.24) y combinar las peticiones de configuración (país + campos) exige componer varios recursos a mano.

### L3. `HttpClient` + señales manuales

- A favor: control total y API muy conocida.
- En contra: reimplementa cancelación, estado y recarga en cada página, con más superficie para errores en los estados de carga.

### G1. Guards funcionales (elegida)

- A favor: la redirección ocurre antes de activar el componente, así que no se piden planes (AC-02.22). Es el mecanismo idiomático de Angular.
- En contra: hace falta un indicador global de navegación pendiente; un guard que falla al cargar debe dejar pasar la navegación.

### G2. Comprobación en la página

- A favor: el estado de carga es local y natural.
- En contra: el componente llega a activarse y podría pedir planes antes de decidir; la lógica de acceso queda repartida entre páginas.

## Referencias

Consultadas el 2026-11-22:

- Angular, `resource()` (estable desde v22.0, cancelación con `AbortSignal`): https://angular.dev/api/core/resource
- Angular, `httpResource` (estable desde v22.0): https://angular.dev/api/common/http/httpResource
- Angular, guía de `httpResource` (`value`, `hasValue`, `error`, `isLoading`, `parse`, interceptores): https://angular.dev/guide/http/http-resource
- Angular, guards (`CanActivateFn`, `RedirectCommand`): https://angular.dev/guide/routing/route-guards
- Angular, zoneless por defecto (v21+), `TestBed` zoneless: https://angular.dev/guide/zoneless
- MDN, `crypto.getRandomValues` (criptográficamente fuerte, disponible también fuera de contextos seguros): https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
- Strapi 5, paginación (`pagination[page]`, `pagination[pageSize]`, `meta.pagination.pageCount`): https://docs.strapi.io/cms/api/rest/sort-pagination
