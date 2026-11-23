# Plan de pruebas — AC → tipo → ubicación → estado

| Campo | Valor |
|---|---|
| Fase | 5 (validación) · rama `phase-5/validation` · base `main` = `f69ae34` |
| Autor | QA Engineer (subagente) |
| Fecha | 2026-11-23 |
| Fuentes | `specs/US-0X/spec.md` §4 y §8 · ADR-0007 · ADR-0003 §5 (G3-3) · `docs/architecture/api-contracts.md` · `docs/qa/phase-4-implementation-notes.md` |
| Unit existentes | `docs/qa/US-01-test-report.md`, `US-02-test-report.md`, `US-03-test-report.md` (Vitest, jsdom; 457/457 en `0cb032c`) |
| E2E | `e2e/` (Playwright 1.65.1, Chrome del sistema, pila de `docker compose`); salida real en [`e2e-report.md`](e2e-report.md): 77 tests, 76 pasan, 1 falla (D-E2E-1) |
| Vigencia | La pila probada es anterior a `40dfcae` y `8f763cb`: hay que repetir el e2e tras reconstruirla (`e2e-report.md`, "Vigencia de esta evidencia") |
| Manual | [`manual-check.md`](manual-check.md) (plantilla G5, la rellena el humano) |

## Cómo se lee

- **Unit**: lo que ya cubren los tests unitarios de la Fase 4 (no se volvieron a ejecutar en esta fase; su evidencia está en los informes de la columna "Fuentes").
- **E2E**: archivo de `e2e/tests/` y nombre del test (empieza por el AC, `grep -rn "AC-0X.n" e2e/tests`).
- **Estado E2E**: `Cubierto ✅` solo si el test se ejecutó en verde en la corrida de `e2e-report.md`; `Falla ❌` si el test detecta un defecto; `No cubierto (e2e)` con motivo si no hay e2e (el AC puede estar cubierto por unit).
- `intercepción + G5`: automatizado con `page.route` sobre la respuesta real (`route.fetch()` + `route.fulfill()`), sin escribir en Strapi ni usar credenciales; el cambio real en el admin se comprueba a mano en G5 (G3-3).
- Todos los tests pasan además por el fixture `networkGuard` (`e2e/support/fixtures.ts`): toda petición es `GET`, ninguna lleva `Authorization` y ninguna pide borradores.

Abreviaturas de archivo: `full` = `flow/co-full-flow.spec.ts`, `pay` = `flow/co-payment.spec.ts`, `nav` = `flow/navigation-persistence.spec.ts`, `cl` = `flow/cl-flow.spec.ts`, `dates` = `flow/date-rules.spec.ts`, `pst` = `states/plans-states.spec.ts`, `cst` = `states/config-states.spec.ts`, `net` = `states/network.spec.ts`, `fch` = `content-changes/form-changes.spec.ts`, `pch` = `content-changes/plans-changes.spec.ts`, `a11y` = `a11y-responsive/keyboard-and-viewports.spec.ts`, `chg` = `flow/change-country-and-plan-card.spec.ts` (D14).
- `Pendiente de ejecución`: el test existe pero aún no se ha ejecutado contra una pila que contenga el cambio; no cuenta como cubierto.

## US-01 — Formulario

| AC | Tipo | Unit | E2E | Manual G5 | Estado E2E |
|---|---|---|---|---|---|
| AC-01.1 (PDF) | E2E seed | ✅ | `full` (orden exacto de los 8 campos CO); `cl` | 1.3 | Cubierto ✅ |
| AC-01.2 (PDF) | E2E seed | ✅ | `a11y › AC-01.26 AC-01.2 …`; `a11y › AC-01.27 AC-01.16 …` | 1.4 | Cubierto ✅ |
| AC-01.3 (PDF) | E2E intercepción + G5 | — | `fch › AC-01.3 a new published field appears after reload …` | 4.2–4.3 | Cubierto ✅ (intercepción + G5) |
| AC-01.4 (PDF) | E2E seed | ✅ | `nav › AC-01.4 AC-02.30 …` | 1.8 | Cubierto ✅ |
| AC-01.5 | E2E seed | ✅ | `nav › AC-01.5 …` | 1.1 | Cubierto ✅ |
| AC-01.6 | E2E seed | ✅ | `nav › AC-01.6 …` (`/pe`, `/CO`) | — | Cubierto ✅ |
| AC-01.7 | E2E intercepción (retraso) | ✅ | `cst › AC-01.7 …` | — | Cubierto ✅ |
| AC-01.8 | E2E intercepción (503 → reintentar) | ✅ | `cst › AC-01.8 …` | — | Cubierto ✅ |
| AC-01.9 | E2E intercepción | ✅ | `cst › AC-01.9 …` | — | Cubierto ✅ |
| AC-01.10 | E2E intercepción + G5 | ✅ (mapper) | `fch › AC-01.10 …` | indirecto (4.2) | Cubierto ✅ (intercepción) |
| AC-01.11 | E2E contra Strapi real | ✅ (consulta) | `fch › AC-01.11 …` (borrador del seed `co_referralCode` no visible) + `networkGuard` | — | Cubierto ✅ |
| AC-01.12 | Unit | ✅ | Parcial: `cl › AC-01.34 …` comprueba los 5 tipos nativos; la ayuda asociada solo en `a11y › AC-01.26` (texto) y `fch › AC-01.3` | 3.1 | No cubierto (e2e) por tipo: cubierto por unit (`form-step-page.spec.ts › AC-01.12`) |
| AC-01.13 | E2E seed + intercepción | ✅ (1.ª parte) | `fch › AC-01.13 …` ("Marca C" tras recargar) | — | Cubierto ✅ |
| AC-01.14 | E2E seed | ✅ | `a11y › AC-01.26 AC-01.2 AC-01.14 AC-01.33 …` (solo espacios) | — | Cubierto ✅ |
| AC-01.15 | Unit | ✅ | — | — | No cubierto (e2e): catálogo de validaciones cubierto por unit (`validator-registry.spec.ts`); el seed solo ejerce `pattern`, `maxLength` e `integer` (sí ejecutados en los flujos) |
| AC-01.16 | E2E seed | ✅ | `a11y › AC-01.27 AC-01.16 …` (foco en el 2.º campo); `a11y › AC-01.26 …` | 1.4 | Cubierto ✅ |
| AC-01.17 | Unit + E2E (reloj fijo) | ✅ | `dates › AC-01.17 …` (2005, 2028 inválidos; 2006, 2027 válidos) | — | Cubierto ✅ |
| AC-01.18 | Unit + E2E (reloj fijo) | ✅ | `dates › AC-01.18 …` (2008-11-23 inválido, 2008-11-22 válido). Filas del 29 de febrero: solo unit | — | Cubierto ✅ (filas 1–2); filas 3–5 por unit |
| AC-01.19 | Unit + E2E (`timezoneId` + reloj) | ✅ | `dates › AC-01.19 …` | — | Cubierto ✅ |
| AC-01.20 | E2E intercepción | ✅ | `cst › AC-01.20 …` | — | Cubierto ✅ |
| AC-01.21 | E2E | ✅ (recarga) | `nav › AC-01.21 …` (recarga + pestaña nueva vacía) | — | Cubierto ✅ |
| AC-01.22 | E2E | ✅ | `nav › AC-01.22 AC-02.20 …` | — | Cubierto ✅ |
| AC-01.23 | E2E intercepción | ✅ | `fch › AC-01.23 …` (opción eliminada). La parte "campo despublicado" en `cst › AC-03.21` | — | Cubierto ✅ |
| AC-01.24 | E2E intercepción | ✅ | `fch › AC-01.24 …` (patrón nuevo sobre un valor guardado) | — | Cubierto ✅ |
| AC-01.25 | E2E intercepción | ✅ | `cst › AC-01.25 …` | — | Cubierto ✅ |
| AC-01.26 | E2E | ✅ | `a11y › AC-01.26 …` (nombre accesible exacto, `aria-describedby`, `aria-invalid`, grupos) | 3.1 | Cubierto ✅ |
| AC-01.27 | E2E solo teclado | ✅ (foco) | `full` (Tab, flechas, Espacio, Enter); `a11y › AC-01.27 pressing Enter in a text field …` | 1.2–1.5 | Cubierto ✅ |
| AC-01.28 | E2E viewports | — | `a11y › AC-01.28 … at 320 / 375 / 1280 px` | 2.1 | Cubierto ✅ |
| AC-01.29 | Unit | ✅ | — | — | No cubierto (e2e): contrato interno (`Step1Result`), sin superficie observable propia; cubierto por unit (`evaluate-step1.spec.ts`) y de forma indirecta por las guardas (`pch › AC-02.22`, `pch › AC-03.20`) |
| AC-01.30 | E2E red | ✅ (cliente) | `net › AC-01.30 AC-02.31 …` + `networkGuard` en todos los tests | — | Cubierto ✅ |
| AC-01.31 | E2E intercepción + G5 | ✅ (texto) | `fch › AC-01.31 …` | indirecto | Cubierto ✅ (intercepción) |
| AC-01.32 | E2E seed | ✅ | `full` | 1.5 | Cubierto ✅ |
| AC-01.33 | E2E seed | ✅ | `a11y › AC-01.26 AC-01.2 AC-01.14 AC-01.33 …` | — | Cubierto ✅ |
| AC-01.34 | E2E seed | — | `full` (CO, "Placa"); `cl › AC-01.34 …` (CL, "Patente", 5 tipos) | 0.1, 2.5 | Cubierto ✅ |
| AC-01.35 | E2E intercepción | ✅ | `fch › AC-01.35 …` | — | Cubierto ✅ |
| AC-01.36 (D14) | E2E seed | existe (`country-shell.spec.ts › AC-01.36 …`; su ejecución la reporta el Angular Developer) | `chg › AC-01.36 the "change country" link goes back to the country selection and the step 1 data is kept` (paso 1 completo, enlace por rol y nombre "Cambiar de país", `href="/"`, ≥ 24×24 px, activado con Enter, lista de países, vuelta a Colombia con los 8 valores); `chg › AC-01.36 the "change country" link is on the plans, summary and confirmation screens` | — | Cubierto ✅ (`80 passed (4.4m)`, pila reconstruida tras D14; `docs/qa/e2e-report.md`) |

## US-02 — Planes

| AC | Tipo | Unit | E2E | Manual G5 | Estado E2E |
|---|---|---|---|---|---|
| AC-02.1 (PDF) | E2E seed | ✅ | `full` (3 planes CO en orden, sin inactivo ni borrador) | 1.6 | Cubierto ✅ |
| AC-02.2 (PDF) | E2E seed | ✅ | `full` (clase y etiqueta "Recomendado", una sola) | 1.6 | Cubierto ✅ |
| AC-02.3 (PDF) | E2E seed | ✅ | `full` (marcado y paso al resumen) | 1.6–1.9 | Cubierto ✅ |
| AC-02.4 (PDF) | E2E intercepción + G5 | ✅ | `pst › AC-02.4 no active plans …`; `pst › AC-02.4 plans present but all inactive …` | 4.4–4.5 (desactivar un plan) | Cubierto ✅ (intercepción + G5) |
| AC-02.5 | E2E seed | ✅ | `full` (CO) y `cl › … AC-02.5 …` (CL; sin "Plan Clásico", "Plan Élite" ni planes del otro país) | — | Cubierto ✅ |
| AC-02.6 | E2E intercepción | ✅ | `pch › AC-02.6 AC-02.7 …` | — | Cubierto ✅ |
| AC-02.7 | E2E intercepción | ✅ | `pch › AC-02.6 AC-02.7 …` | — | Cubierto ✅ |
| AC-02.8 | E2E seed | ✅ | `full` (`"$ 1.320.000"` exacto, sin normalizar); `cl` (`"$38.985"`) | 1.7 | Cubierto ✅ |
| AC-02.9 | Unit + E2E seed | ✅ | E1 en `full` (1 320 000) y E4 en `cl` (38 985), con reloj fijo en 2026-11-22. E2, E3, E5, E6 solo unit | — | Cubierto ✅ (E1, E4); resto por unit |
| AC-02.10 | E2E intercepción | ✅ | `pch › AC-02.10 …` | — | Cubierto ✅ |
| AC-02.11 | Unit | ✅ | — | — | No cubierto (e2e): por G2-5 el flujo no llega al paso 2 sin el rol (spec §8) |
| AC-02.12 | Unit | ✅ | — | — | No cubierto (e2e): función pura (spec §8). Año 2027 aceptado en `dates › AC-01.17` |
| AC-02.13 | Unit | ✅ | — | — | No cubierto (e2e): función pura (spec §8) |
| AC-02.14 | E2E intercepción | ✅ | `cst › AC-02.14 …` (CL, USD); `pch › AC-03.19 … another currency` (CO) | — | Cubierto ✅ |
| AC-02.15 | E2E intercepción | ✅ | `pch › AC-02.15 …` | — | Cubierto ✅ |
| AC-02.16 | E2E | ✅ | `nav › AC-02.16 AC-03.9 AC-03.10 …` (2018 → 2022: 1 320 000 → 1 200 000, plan conservado) | — | Cubierto ✅ |
| AC-02.17 | E2E | ✅ | `a11y › AC-02.18 AC-02.17 …`; `full` | — | Cubierto ✅ |
| AC-02.18 | E2E | ✅ | `a11y › AC-02.18 AC-02.17 …` | — | Cubierto ✅ |
| AC-02.19 | E2E | ✅ | `nav › AC-02.19 …` | — | Cubierto ✅ |
| AC-02.20 | E2E | ✅ | `nav › AC-01.22 AC-02.20 …` | — | Cubierto ✅ |
| AC-02.21 | E2E intercepción + G5 | ✅ | `pch › AC-02.21 …` | 4.4–4.5 | Cubierto ✅ (intercepción + G5) |
| AC-02.22 | E2E + intercepción | ✅ | `nav › AC-02.22 …` (sin datos, sin petición de planes); `pch › AC-02.22 …` (campo obligatorio nuevo, sin petición de planes). Ambos sobre CO o CL según el caso | — | Cubierto ✅ |
| AC-02.23 | E2E intercepción (retraso) | ✅ | `pst › AC-02.23 …` | — | Cubierto ✅ |
| AC-02.24 | E2E intercepción (500 → reintentar) | ✅ | `pst › AC-02.24 …` | — | Cubierto ✅ |
| AC-02.25 | E2E intercepción + G5 | — | `pch › AC-02.25 …` (desactivar, orden, recomendado, precio base y factor) | 4.4–4.6 | Cubierto ✅ (intercepción + G5) |
| AC-02.26 | E2E solo teclado | ✅ (estructura) | `full` (Tab al grupo, flecha, Espacio, Tab, Enter) | 1.6 | Cubierto ✅ |
| AC-02.27 | Unit + E2E + G5 | ✅ | `a11y › AC-02.27 …` (nombre accesible exacto) | 3.2 (lector de pantalla) | Cubierto ✅ (nombres); lector real en G5 |
| AC-02.28 | E2E | ✅ | `full` (foco en el título al entrar), `a11y › AC-01.27 pressing Enter …` | 1.6 | Cubierto ✅ |
| AC-02.29 | E2E viewports | — | `a11y › AC-02.29 … at 320 / 375 / 1280 px` | 2.2 | Cubierto ✅ |
| AC-02.30 | E2E | ✅ | `nav › AC-01.4 AC-02.30 …` | 1.8 | Cubierto ✅ |
| AC-02.31 | E2E red | ✅ (cliente) | `net › AC-01.30 AC-02.31 …` + `networkGuard` | — | Cubierto ✅ |
| AC-02.32 | E2E intercepción | ✅ | `pch › AC-02.32 …` (30 planes) | — | Cubierto ✅ |
| AC-02.33 | E2E intercepción | ✅ | `cst › AC-02.33 …` (dos escenarios) | — | Cubierto ✅ |
| AC-02.34 (D14) | E2E seed | existe (`plans-step-page.spec.ts › AC-02.34 …`; su ejecución la reporta el Angular Developer) | `chg › AC-02.34 clicking anywhere on a plan card selects the plan` (clic real con `page.mouse.click()` en el centro de la cobertura "Pérdida total y parcial por daños" de "Plan Total" → su radio `checked`; después, clic en la descripción de "Plan Esencial" → cambia la selección y llega al resumen) | — | Cubierto ✅ (`80 passed (4.4m)`, pila reconstruida tras D14; `docs/qa/e2e-report.md`) |

## US-03 — Resumen y pago

| AC | Tipo | Unit | E2E | Manual G5 | Estado E2E |
|---|---|---|---|---|---|
| AC-03.1 (PDF) | E2E seed | ✅ | `full` (8 pares etiqueta/valor, plan y precio) | 1.10 | Cubierto ✅ |
| AC-03.2 (PDF) | E2E seed | ✅ | `full` (términos de CO, pagar deshabilitado hasta aceptar); `cl` (términos de CL) | 1.12 | Cubierto ✅ |
| AC-03.3 (PDF) | E2E seed | ✅ | `full` (`aria-disabled`/`aria-busy`, "Procesando el pago…", confirmación con número) | 1.14 | Cubierto ✅ |
| AC-03.4 (PDF) | E2E seed | ✅ | `pay › AC-03.4 AC-03.26 …` (rechazo → mensaje → reintento aprobado) | 1.13 | Cubierto ✅ |
| AC-03.5 | E2E seed | ✅ | `full` (`******7890`, tipo en claro, valor completo ausente del DOM y del árbol accesible) | 1.10 | Cubierto ✅ |
| AC-03.6 | E2E seed | ✅ | `cl` con RUT del seed `12345678-5` → `*****678-5`, ausente del DOM | 2.5 | Cubierto ✅ (formato sin puntos). **Formato con puntos `12.345.678-5`: Pendiente de G4 (F-03.2)**: la pila probada tiene el patrón `[0-9]{7,8}-[0-9Kk]`, que lo rechaza en el paso 1. `40dfcae` ya amplía el patrón en el seed, pero la pila no se ha reconstruido (ver `e2e-report.md`, "Vigencia") |
| AC-03.7 | Unit | ✅ | — | — | No cubierto (e2e): función pura (spec §8) |
| AC-03.8 | Unit + E2E seed | ✅ | `full` (secciones con leyendas de Strapi, etiqueta de opción "Bogotá"/"Marca A", "Sí", fecha "10 de mayo de 2000"). El campo opcional vacío ("—") solo unit: el seed no tiene campos opcionales publicados | — | Cubierto ✅ (salvo "—", por unit) |
| AC-03.9 | E2E | ✅ | `full` (precio del resumen = paso 2); `nav › AC-02.16 AC-03.9 AC-03.10 …` (recalculado tras editar) | — | Cubierto ✅ |
| AC-03.10 | E2E | ✅ | `nav › AC-02.16 AC-03.9 AC-03.10 …` | — | Cubierto ✅ |
| AC-03.11 | E2E | ✅ | `nav › AC-03.11 …` | — | Cubierto ✅ |
| AC-03.12 | E2E | ✅ | `pay › AC-03.12 …` | 1.12 | Cubierto ✅ |
| AC-03.13 | E2E intercepción | ✅ (3 filas) | `pch › AC-03.13 …` (fila "texto vacío") | — | Cubierto ✅ (fila 2); filas 1 y 3 por unit |
| AC-03.14 | E2E intercepción | ✅ | `pch › AC-03.14 …` (sin `img`/`script`, sin diálogos) | — | Cubierto ✅ |
| AC-03.15 | E2E intercepción + G5 | ✅ (parte) | `pch › AC-03.15 …` | — (opcional en 4) | Cubierto ✅ (intercepción) |
| AC-03.16 | E2E intercepción (retraso) | ✅ | `cst › AC-03.16 …` (sección de términos) | — | Cubierto ✅ |
| AC-03.17 | E2E intercepción | ✅ | `cst › AC-03.17 …` | — | Cubierto ✅ |
| AC-03.18 | E2E | ✅ | `nav › AC-03.18 …` (dos filas) | — | Cubierto ✅ |
| AC-03.19 | E2E intercepción | ✅ | `pch › AC-03.19 … deactivated`; `pch › AC-03.19 … another currency`. Fila "despublicado" = misma respuesta sin el plan (cubierta por `pch › AC-02.21`) | — | Cubierto ✅ |
| AC-03.20 | E2E intercepción | ✅ | `pch › AC-03.20 …` (fila "campo obligatorio nuevo"). Fila "opción retirada": `fch › AC-01.23` en el paso 1 | — | Cubierto ✅ (fila 1); fila 2 por unit + `fch › AC-01.23` |
| AC-03.21 | E2E intercepción | ✅ | `cst › AC-03.21 …` | — | Cubierto ✅ |
| AC-03.22 | E2E | ✅ (clics simulados) | `pay › AC-03.22 double click …`, `… holding Enter …`, `AC-03.22 AC-03.23 Enter and then a click …` (cuenta clics reales ≥ 2 e intentos de pasarela = 1) | 1.14 | Cubierto ✅ |
| AC-03.23 | E2E | ✅ | `pay › AC-03.22 AC-03.23 …`; `full` | 1.13 | Cubierto ✅ |
| AC-03.24 | E2E red | ✅ | `pay › AC-03.24 …` + `networkGuard` | — | Cubierto ✅ |
| AC-03.25 | E2E seed | ✅ | `full` (aprobado por defecto); `pay › AC-03.4 …` (rechazado) | 1.13–1.14 | Cubierto ✅ |
| AC-03.26 | E2E seed | ✅ | `pay › AC-03.4 AC-03.26 …` | 1.13 | Cubierto ✅ |
| AC-03.27 | Unit | ✅ | Formato comprobado en e2e (`^CO-20261122-[A-HJ-NP-Z2-9]{6}$` con reloj fijo); la fuente aleatoria fija solo en unit | — | Cubierto ✅ (formato); determinismo por unit |
| AC-03.28 | E2E | ✅ | `pay › AC-03.28 AC-03.31 …` | — | Cubierto ✅ |
| AC-03.29 | E2E | ✅ (parte) | `pay › AC-03.29 …` (`page.goBack()` real) | 1.15 | Cubierto ✅ |
| AC-03.30 | E2E | ✅ | `nav › AC-03.30 …` | — | Cubierto ✅ |
| AC-03.31 | E2E | ✅ | `pay › AC-03.28 AC-03.31 …`; `full` | 1.14 | Cubierto ✅ |
| AC-03.32 | E2E | ✅ | `nav › AC-03.32 …`; `cl` (términos de Chile, no de Colombia) | — | Cubierto ✅ |
| AC-03.33 | E2E solo teclado | ✅ (estructura) | `full` (orden de Tab exacto, Espacio, flechas en `pay`, Enter) | 1.11 | Cubierto ✅ |
| AC-03.34 | E2E + G5 | ✅ | `full` (foco en títulos, `aria-describedby` del botón, foco no va a `body`); `pay › AC-03.4 …` (`aria-live`, alerta) | 3.3–3.4 | Cubierto ✅ (lector real en G5) |
| AC-03.35 | E2E viewports | — | `a11y › AC-03.35 … at 320 / 375 / 1280 px` | 2.3–2.4 | **Falla ❌ a 320 px** (casilla de términos 22,2×24 px; defecto D-E2E-1). 375 y 1280: Cubierto ✅ |
| AC-03.36 | E2E intercepción | ✅ (3 filas) | `cst › AC-03.36 …` (fila 1) | — | Cubierto ✅ (fila 1); filas 2 y 3 por unit |

## Resumen

Ver recuento y salida real en [`e2e-report.md`](e2e-report.md). Cuenta como cubierto por e2e el AC con al menos un test en verde que verifica su escenario principal; las filas que solo cubre el unit se indican en su fila.

| Historia | AC | Cubiertos por e2e en verde (total o parcial indicado) | Falla | Sin e2e (cubiertos por unit) |
|---|---|---|---|---|
| US-01 | 36 | 33 | 0 | 3 (AC-01.12, AC-01.15, AC-01.29) |
| US-02 | 34 | 31 | 0 | 3 (AC-02.11, AC-02.12, AC-02.13) |
| US-03 | 36 | 35 | 0 (AC-03.35 a 320 px corregido en F-03.3) | 1 (AC-03.7) |
| **Total** | **106** | **99** | **0** | **7** (todos con unit en verde según los informes de la Fase 4) |

Pendientes que no dependen del e2e:

- **AC-03.6 con puntos** (`12.345.678-5`): Pendiente de G4 (F-03.2).
- Integración real con el admin de Strapi (AC-01.3, AC-02.4, AC-02.21, AC-02.25): G5, `manual-check.md` §4.
- Lector de pantalla real (AC-02.27, AC-03.34) y móvil real (AC-01.28, AC-02.29, AC-03.35): G5.
