# ADR-0007 — Estrategia de pruebas: entorno e2e, determinismo y dobles de red

| Campo | Valor |
|---|---|
| Estado | Accepted (2026-11-22, G3) |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisores | Humano (G3) |
| Motivado por | `CLAUDE.md` §8 y §10 · PDF ("unit tests of relevant logic", "at least one end-to-end test of the full flow") · G3-3 · REQ-01.21, REQ-02.8, REQ-03.21, REQ-03.24, REQ-03.26 · planes de verificación de US-01 §8, US-02 §8 y US-03 §8 |

## Contexto y problema

Las tres specs dejan a G3 dónde y cómo se ejecutan las pruebas: contra qué entorno corre el e2e, cómo se fijan la fecha y la zona horaria (AC-01.17 a AC-01.19, AC-02.9), cómo se simulan los fallos y los datos mal formados de Strapi, y cómo se prueban los cambios de contenido (ADR-0003 §5: intercepción más comprobación manual en G5, G3-3). Sin esta decisión, los tests dependientes de fecha fallarían con el paso del tiempo y algunos AC quedarían en "manual".

## Factores de decisión

- Determinismo: ningún test depende del día real ni de la zona horaria de la máquina.
- El e2e debe probar la misma superficie que la producción: nginx con la allowlist, cabeceras y build de producción (D4, ADR-0003).
- Herramientas ya verificadas: Vitest con `jsdom` (runner por defecto de Angular) y Playwright 1.65.1 con el Chrome del sistema (`channel: 'chrome'`); sin dependencias nuevas.
- Sin puertas traseras en la app: nada de `?today=` ni flags ocultos (mismo criterio que REQ-03.21).

## Opciones consideradas

**Entorno del e2e**

1. **E1. Pila completa de `docker compose`** (nginx + build de producción + Strapi con seed) en `http://localhost:8080`.
2. **E2. `ng serve` + Strapi local**, con el proxy de desarrollo.

**Fecha y zona horaria**

1. **T1. Inyección en la app** (`CLOCK`) para los unit, y en el e2e `page.clock.setFixedTime` + `timezoneId` del contexto de Playwright.
2. **T2. Parámetro o flag de test en la app** (`?today=2026-11-22`).
3. **T3. Datos del seed elegidos para que no crucen ningún límite** cerca de la fecha real, sin fijar el reloj.

**Fallos y datos mal formados de Strapi**

1. **N1. Intercepción con `page.route`** en el e2e, y `HttpTestingController` o un `CmsClient` falso en los unit.
2. **N2. Variantes de seed** (otra base de datos con datos rotos).

## Decisión

Opción elegida: **E1 + T1 + N1**. N1 cubre también los AC de cambio de contenido (ADR-0003 §5, G3-3), y el cambio real en Strapi se comprueba a mano en G5.

**Unit (Vitest, `jsdom`, `frontend/**/*.spec.ts`, Angular Developer):**

- Funciones puras sin TestBed: validadores, reglas de edad y año, `reconcileStep1`, `evaluateStep1`, `computeFinalPrice`, `formatPrice`, orden de planes, `maskDocument`, `createQuoteNumber`, mappers DTO → dominio, mapper de Blocks.
- "Hoy" siempre como parámetro (`YYYY-MM-DD`). `todayLocal(now: Date)` es la única función que lee la zona horaria. Su test de AC-01.19 fija `process.env.TZ = 'America/Bogota'` y luego lo restaura. Node aplica el cambio de `process.env.TZ` en tiempo de ejecución también en Windows desde v16.2.0. Si el *pool* de Vitest no lo respeta en algún entorno, se ejecuta ese archivo con `TZ` en la variable de entorno del proceso.
- Componentes con TestBed zoneless (por defecto), `await fixture.whenStable()`, `CmsClient` falso, `WIZARD_STORAGE` en memoria, `CLOCK` fijo y `PAYMENT_DELAY_MS = 0`.
- Nombres de test: `it('AC-0X.n …')` o `it('REQ-0X.n …')` (Skill `sdd-traceability` §5).

**E2E (Playwright, `e2e/`, QA Engineer):**

- `baseURL: 'http://localhost:8080'` (nginx). Se arranca antes con `docker compose up -d` y se espera a que responda `/api/countries`. `use.channel: 'chrome'`.
- Proyectos:
  - `flow`: flujo completo de CO (obligatorio por el PDF) y de CL.
  - `states`: carga, error, vacío y mal formado por intercepción.
  - `content-changes`: AC de cambio de contenido por intercepción sobre la respuesta real (`route.fetch()` + `route.fulfill()`, ADR-0003 §5). No escribe en Strapi ni usa credenciales, y puede correr en paralelo.
  - `a11y-responsive`: teclado y viewports 320, 375 y 1280.
- **AC de cambio de contenido (G3-3):**

  | AC | Prueba automatizada | Comprobación del cambio real en Strapi |
  |---|---|---|
  | AC-01.3 | Intercepción de C4 (campo publicado añadido) y recarga | Manual en G5: campo nuevo publicado en el admin (`docs/qa/manual-check.md`) |
  | AC-01.10 | Intercepción de C4 (campo quitado y `order` intercambiado) y recarga | Cubierta de forma indirecta por la comprobación manual del campo nuevo en G5 |
  | AC-01.11 | Contra Strapi real: campo en borrador del seed no visible; ninguna petición lleva `status` o `publicationFilter` | No hace falta: el seed ya contiene el borrador |
  | AC-01.31 | Intercepción de C3 (texto de continuar de CL) y recarga; CO sin cambios | Cubierta de forma indirecta por la comprobación manual en G5 |
  | AC-02.25 | Intercepción de C5 y C6 (orden, recomendado, precio base, factor) y recarga | Manual en G5: plan desactivado en el admin (`docs/qa/manual-check.md`) |

  El informe de e2e indica para estos AC "automatizado por intercepción + comprobación manual G5", con un enlace a `docs/qa/manual-check.md`.
- **Reloj:** `page.clock.setFixedTime(new Date('2026-11-22T12:00:00'))` antes de `page.goto`. Fija `Date.now()` y `new Date()`, y **no** afecta a los temporizadores, así que los 1500 ms del pago corren normales.
- **AC-01.19:** contexto con `timezoneId: 'America/Bogota'` y `page.clock.setFixedTime(new Date('2026-11-23T01:00:00Z'))` (20:00 local del 22).
- **Red:** `page.route` con un predicado sobre `URL.pathname` (p. ej. `url => url.pathname === '/api/plans'`), porque un glob debe coincidir con la URL completa, query incluida. Sirve para `route.fulfill` (cuerpos mal formados, 500, 30 planes), para modificar la respuesta real con `route.fetch()` o para introducir un retraso controlado (estado de carga). Las respuestas simuladas siguen el formato v5 de api-contracts.
- **Seguridad:** un fixture registra `page.on('request')` y comprueba que toda petición a `/api` es `GET` y no lleva `Authorization` (AC-01.30, AC-02.31, AC-03.24).
- **Evidencia:** el informe (`docs/qa/e2e-report.md`) pega el comando y la salida real. Todas las pruebas se pueden ejecutar tras `docker compose up`, sin credenciales ni pasos previos.

## Consecuencias

- **Positivas:**
  - El e2e prueba el artefacto que se entrega: build de producción, nginx real con la allowlist y `no-store`, y Strapi con el seed.
  - Pruebas deterministas sin código de test dentro de la app.
  - Todos los AC de estados raros y de cambio de contenido quedan automatizados por intercepción, sin bases de datos alternativas ni credenciales. Ningún AC queda "No ejecutado" para quien clone el repositorio.
  - Los e2e no modifican la base de datos de la demo.
- **Negativas:**
  - El e2e necesita Docker en marcha y tarda más que con `ng serve`; un cambio en el frontend exige reconstruir la imagen antes del e2e.
  - `page.clock.setFixedTime` fija la fecha para toda la página; un test que necesite que el tiempo avance para `Date` debe usar `install` y `runFor` (y entonces los temporizadores también quedan controlados).
  - La intercepción prueba la reacción de la app a una respuesta simulada, no que Strapi la produzca al publicar. Para los escenarios del PDF de cambio de contenido (AC-01.3, AC-02.25), esa integración real solo se comprueba a mano en G5, y esa evidencia no se repite en cada ejecución (G3-3).
  - El test de zona horaria depende del comportamiento de `process.env.TZ` en el *pool* de Vitest; no se ha ejecutado todavía.
- **Riesgos y mitigación:**
  - *Las respuestas modificadas divergen del formato real de Strapi:* se parte siempre de la respuesta real (`route.fetch()`) y solo se cambia el dato del escenario.

### Confirmación

- `npm test` en `frontend/` y `npx playwright test` en `e2e/` con la salida pegada en `docs/qa/` (`CLAUDE.md` §6). Sin pruebas omitidas por falta de configuración.
- AC-01.3, AC-01.10, AC-01.11, AC-01.31 y AC-02.25 aparecen en el informe de e2e como ejecutados por intercepción, y `docs/qa/manual-check.md` (G5) registra el cambio real en Strapi: un campo nuevo publicado y un plan desactivado.
- Review: `grep -rn "today=\|__TEST__\|isE2E" frontend/src` sin resultados.

## Pros y contras de las opciones

### E1. Pila de `docker compose` (elegida)

- A favor: misma superficie que producción; valida nginx y las cabeceras.
- En contra: más lento; depende de Docker.

### E2. `ng serve`

- A favor: rápido para iterar.
- En contra: no prueba nginx ni el build de producción; una regla de la allowlist o de caché rota pasaría desapercibida. Sigue siendo útil para que el desarrollador itere, no para la evidencia.

### T1. Reloj inyectado + reloj de Playwright (elegida)

- A favor: sin cambios en la app; API oficial de Playwright; zona horaria por contexto.
- En contra: dos mecanismos (unit y e2e) que mantener coherentes.

### T2. Flag de fecha en la app

- A favor: simple.
- En contra: puerta trasera en producción; contradice el criterio de REQ-03.21 (sin parámetros de URL ni flags ocultos).

### T3. Seed sin límites cercanos

- A favor: no hay que fijar nada.
- En contra: los AC de límites exactos (AC-01.17, AC-01.18, E3 de US-02) exigen una fecha concreta; caducaría con el paso de los años.

### N1. Intercepción (elegida)

- A favor: determinista, sin credenciales, cubre casos que Strapi impide publicar y los cambios de contenido (G3-3).
- En contra: puede divergir del formato real si cambia Strapi. Se mitiga partiendo de la respuesta real (`route.fetch()`) o de fixtures capturadas del seed. No prueba que Strapi produzca la respuesta al publicar (comprobación manual en G5).

### N2. Variantes de seed

- A favor: datos reales de Strapi.
- En contra: varias bases y reinicios del contenedor; lento y frágil; Strapi rechaza muchos de esos datos al validar.

## Referencias

Consultadas el 2026-11-22:

- Playwright, Clock (`setFixedTime` solo afecta a `Date`; `install`, `runFor`): https://playwright.dev/docs/clock
- Playwright, opciones de test (`timezoneId`, `channel`, `baseURL`): https://playwright.dev/docs/api/class-testoptions
- Playwright, red (`page.route`, glob sobre la URL completa, modificar respuestas con `route.fetch()` + `route.fulfill()`): https://playwright.dev/docs/network
- Angular, testing (Vitest con `jsdom` por defecto): https://angular.dev/guide/testing
- Angular, `ng test`: https://angular.dev/cli/test
- Angular, zoneless en `TestBed` y `whenStable`: https://angular.dev/guide/zoneless
- Node.js, variable `TZ` (el cambio de `process.env.TZ` se aplica en Windows desde v16.2.0): https://nodejs.org/api/cli.html#tz
- Versiones: Playwright 1.65.1 y Vitest 5.1.1, verificadas en local (`docs/phase-1/analysis.md`).
