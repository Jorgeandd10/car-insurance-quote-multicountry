# Informe de pruebas E2E — Fase 5

| Campo | Valor |
|---|---|
| Fecha | 2026-11-23 |
| Autor | QA Engineer (subagente) |
| Rama | `phase-5/validation` (HEAD `8f763cb` en el momento de la ejecución; tests de `e2e/` sin commit) |
| Pila probada | `docker compose` ya levantada: imagen `web` creada 2026-11-23 01:15 −05 e imagen `cms` 01:11 −05. **Anteriores a `40dfcae` (02:01) y `8f763cb` (02:13)**: ver "Vigencia de esta evidencia" |
| Entorno | Windows 11 · 8 CPU lógicas · 8 GB RAM · Node 24.22.3 · `@playwright/test` 1.65.1 · Google Chrome 159.0.8154.13 del sistema (`channel: 'chrome'`, sin navegadores descargados) · Docker Compose v5.5.0 |
| Configuración | `e2e/playwright.config.ts`: `baseURL` `http://localhost:8080` (nginx), `timezoneId` `America/Bogota`, `locale` `es-CO`, reloj `page.clock.setFixedTime(2026-11-22T17:00:00Z)` (12:00 en Bogotá) en cada test, 2 workers, sin reintentos |
| Plan | [`test-plan.md`](test-plan.md) · Plantilla G5: [`manual-check.md`](manual-check.md) |

## Comando

Con la pila levantada (`docker compose up -d`; `globalSetup` espera a que `/api/countries` responda 200):

```bash
cd e2e
npm ci                      # @playwright/test 1.65.1; no descarga navegadores
npx playwright test
```

Proyectos (ADR-0007): `flow`, `states`, `content-changes`, `a11y-responsive`. `E2E_WORKERS` y `E2E_BASE_URL` permiten cambiar workers y URL sin tocar el código.

## Resultado

**77 tests: 76 pasan, 1 falla.** El fallo es un defecto de la aplicación (D-E2E-1), no del test. Exit code 1.

| Proyecto | Tests | Pasan | Fallan |
|---|---|---|---|
| `flow` | 25 | 25 | 0 |
| `states` | 17 | 17 | 0 |
| `content-changes` | 21 | 21 | 0 |
| `a11y-responsive` | 14 | 13 | 1 |

El flujo completo de Colombia exigido por el PDF (`flow/co-full-flow.spec.ts`), hecho **solo con teclado** (Tab, flechas, Espacio y Enter; ningún `click`, `fill` ni `selectOption`), **pasa**: formulario → planes → resumen → aceptar términos → pago aprobado → confirmación con número `^CO-20261122-[A-HJ-NP-Z2-9]{6}$`. Comprueba además el documento enmascarado `******7890` (el valor completo no está ni en el DOM ni en el árbol accesible) y el precio `"$ 1.320.000"` comparado como cadena exacta, con U+00A0 y sin normalizar espacios.

## Salida real (ejecución final)

`npx playwright test` en `e2e/` (salida del reporter `list`, sin editar):

```text

Running 77 tests using 2 workers

  ok  2 [flow] › tests\flow\co-full-flow.spec.ts:19:3 › CO full flow (keyboard only) › AC-01.1 AC-01.27 AC-01.32 AC-02.1 AC-02.2 AC-02.3 AC-02.8 AC-02.9 AC-02.26 AC-02.28 AC-03.1 AC-03.2 AC-03.3 AC-03.5 AC-03.8 AC-03.25 AC-03.27 AC-03.33 AC-03.34 CO form → plans → summary → terms → approved payment → confirmation (12.0s)
  ok  1 [flow] › tests\flow\cl-flow.spec.ts:17:1 › AC-01.34 AC-02.5 AC-02.8 AC-03.6 AC-03.32 CL form → plans in CLP → summary with masked RUT and Chilean terms → confirmation (12.9s)
  ok  4 [flow] › tests\flow\co-payment.spec.ts:105:3 › CO summary and simulated payment › AC-03.12 unchecking the terms disables pay again (4.1s)
  ok  3 [flow] › tests\flow\co-payment.spec.ts:54:3 › CO summary and simulated payment › AC-03.4 AC-03.26 AC-03.25 AC-03.34 rejected payment shows a clear message and the retry is approved without losing data (8.2s)
  ok  6 [flow] › tests\flow\co-payment.spec.ts:137:3 › CO summary and simulated payment › AC-03.22 double click on pay starts exactly one payment attempt (4.4s)
  ok  5 [flow] › tests\flow\co-payment.spec.ts:114:3 › CO summary and simulated payment › AC-03.24 the summary has no card or bank fields and payments make no non-GET request (8.3s)
  ok  7 [flow] › tests\flow\co-payment.spec.ts:148:3 › CO summary and simulated payment › AC-03.22 holding Enter on pay starts exactly one payment attempt (5.9s)
  ok  8 [flow] › tests\flow\co-payment.spec.ts:165:3 › CO summary and simulated payment › AC-03.22 AC-03.23 Enter and then a click before the end start exactly one attempt and lock the controls (6.1s)
  ok  9 [flow] › tests\flow\co-payment.spec.ts:197:3 › CO summary and simulated payment › AC-03.28 AC-03.31 reloading the confirmation keeps the number without the document; new quote opens an empty step 1 (7.0s)
  ok 10 [flow] › tests\flow\co-payment.spec.ts:226:3 › CO summary and simulated payment › AC-03.29 browser back after a successful payment does not allow paying again (7.0s)
  ok 11 [flow] › tests\flow\date-rules.spec.ts:11:1 › AC-01.17 vehicle year limits on 2026-11-22: 2005 invalid, 2006 and 2027 valid, 2028 invalid (4.5s)
  ok 12 [flow] › tests\flow\date-rules.spec.ts:38:1 › AC-01.18 legal age on 2026-11-22: born 2008-11-23 invalid, 2008-11-22 valid (3.7s)
  ok 14 [flow] › tests\flow\navigation-persistence.spec.ts:17:3 › Country resolution › AC-01.5 the root lists the countries from Strapi and Chile opens /cl step 1 (2.5s)
  ok 13 [flow] › tests\flow\date-rules.spec.ts:50:1 › AC-01.19 at 20:00 of 2026-11-22 in Bogotá (01:00 UTC of the 23rd) 2008-11-23 is still under age and stored as typed (3.3s)
  ok 15 [flow] › tests\flow\navigation-persistence.spec.ts:26:3 › Country resolution › AC-01.6 an unknown code shows "país no disponible" with links; an uppercase code redirects (2.5s)
  ok 16 [flow] › tests\flow\navigation-persistence.spec.ts:41:3 › Persistence and back navigation › AC-01.4 AC-02.30 back from step 2 keeps step 1 data and the selection with the same price (4.7s)
  ok 17 [flow] › tests\flow\navigation-persistence.spec.ts:62:3 › Persistence and back navigation › AC-01.21 a reload keeps step 1 data in the same tab and a new tab starts empty (4.3s)
  ok 19 [flow] › tests\flow\navigation-persistence.spec.ts:101:3 › Persistence and back navigation › AC-02.19 the selected plan survives a reload (4.9s)
  ok 18 [flow] › tests\flow\navigation-persistence.spec.ts:81:3 › Persistence and back navigation › AC-01.22 AC-02.20 data and plan selection are separated by country (7.8s)
  ok 20 [flow] › tests\flow\navigation-persistence.spec.ts:108:3 › Persistence and back navigation › AC-02.16 AC-03.9 AC-03.10 edit data from the summary: full document, plan kept, new price, terms unchecked (5.6s)
  ok 21 [flow] › tests\flow\navigation-persistence.spec.ts:138:3 › Persistence and back navigation › AC-03.11 change plan from the summary keeps the data and shows the new plan and price (4.2s)
  ok 23 [flow] › tests\flow\navigation-persistence.spec.ts:166:3 › Guards › AC-02.22 direct plans URL of Chile without step 1 data goes to step 1 without asking for plans (1.8s)
  ok 22 [flow] › tests\flow\navigation-persistence.spec.ts:156:3 › Guards › AC-03.18 direct summary URL without step 1 goes to step 1; with step 1 but no plan goes to step 2 (3.0s)
  ok 24 [flow] › tests\flow\navigation-persistence.spec.ts:175:3 › Guards › AC-03.30 direct confirmation URL of Chile without payment goes to step 1 (1.9s)
  ok 25 [flow] › tests\flow\navigation-persistence.spec.ts:180:3 › Guards › AC-03.32 the summary URL of Chile after completing Colombia goes to an empty Chile step 1 (3.4s)
  ok 26 [states] › tests\states\config-states.spec.ts:32:3 › Step 1 states › AC-01.7 loading the form configuration shows "cargando" and no fields (5.7s)
  ok 27 [states] › tests\states\config-states.spec.ts:47:3 › Step 1 states › AC-01.8 error loading the configuration, then "reintentar" shows the form (7.5s)
  ok 28 [states] › tests\states\config-states.spec.ts:61:3 › Step 1 states › AC-01.9 a country without published fields shows its empty message and no continue (5.6s)
  ok 29 [states] › tests\states\config-states.spec.ts:75:3 › Step 1 states › AC-01.20 no field with role "birthDate" shows the generic error and logs a warning (3.0s)
  ok 30 [states] › tests\states\config-states.spec.ts:93:3 › Step 1 states › AC-01.25 a field with an unknown type and another without label are skipped with warnings (3.3s)
  ok 31 [states] › tests\states\config-states.spec.ts:125:3 › Step 2 and 3 missing texts and terms › AC-02.33 a missing continue text of the plans step shows the generic error and no plans (4.0s)
  ok 32 [states] › tests\states\config-states.spec.ts:142:3 › Step 2 and 3 missing texts and terms › AC-02.33 a missing plans text and a missing generic message show "error de carga" and "reintentar" (6.1s)
  ok 33 [states] › tests\states\config-states.spec.ts:159:3 › Step 2 and 3 missing texts and terms › AC-03.16 the summary shows "cargando" while the terms have not arrived and pay is disabled (3.9s)
  ok 35 [states] › tests\states\config-states.spec.ts:201:3 › Step 2 and 3 missing texts and terms › AC-03.36 a missing label of the terms checkbox shows the generic error and pay disabled (4.5s)
  ok 34 [states] › tests\states\config-states.spec.ts:178:3 › Step 2 and 3 missing texts and terms › AC-03.17 error loading the terms, retry shows them and they can be accepted; data kept (5.6s)
  ok 37 [states] › tests\states\config-states.spec.ts:260:1 › AC-02.14 a Chilean plan with currency USD is not shown and the rest are in CLP (3.6s)
  ok 36 [states] › tests\states\config-states.spec.ts:217:3 › Step 2 and 3 missing texts and terms › AC-03.21 an optional field unpublished after step 1 is not shown in the summary (4.6s)
  ok 39 [states] › tests\states\plans-states.spec.ts:17:3 › Plans step states (interception) › AC-02.4 no active plans for the country shows the configured "no plans" message (3.7s)
  ok 40 [states] › tests\states\plans-states.spec.ts:40:3 › Plans step states (interception) › AC-02.4 plans present but all inactive (active=false) are discarded and the message is shown (2.8s)
  ok 38 [states] › tests\states\network.spec.ts:8:1 › AC-01.30 AC-02.31 every content request of the three steps is a GET through the proxy without Authorization (7.9s)
  ok 41 [states] › tests\states\plans-states.spec.ts:56:3 › Plans step states (interception) › AC-02.23 loading state while the plan request has not answered (3.1s)
  ok 42 [states] › tests\states\plans-states.spec.ts:77:3 › Plans step states (interception) › AC-02.24 error loading plans, then retry lists the plans (3.6s)
  ok 43 [content-changes] › tests\content-changes\form-changes.spec.ts:98:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.10 a field removed and two fields reordered are reflected after reload (5.9s)
  ok 45 [content-changes] › tests\content-changes\form-changes.spec.ts:124:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.11 the draft field of the seed is not shown and no request asks for drafts (2.1s)
  ok 44 [content-changes] › tests\content-changes\form-changes.spec.ts:56:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.3 a new published field appears after reload without code changes (8.3s)
  ok 46 [content-changes] › tests\content-changes\form-changes.spec.ts:138:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.13 select options come from Strapi in order and a new option is offered after reload (3.1s)
  ok 47 [content-changes] › tests\content-changes\form-changes.spec.ts:157:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.31 the continue text of Chile changes after reload and Colombia is unchanged (3.6s)
  ok 48 [content-changes] › tests\content-changes\form-changes.spec.ts:176:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.35 an empty step text of Chile shows the generic error and no default text (2.0s)
  ok 49 [content-changes] › tests\content-changes\form-changes.spec.ts:190:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.24 a stored value that no longer meets a new pattern is kept and shows the error (3.8s)
  ok 50 [content-changes] › tests\content-changes\form-changes.spec.ts:211:3 › Step 1 configuration changes (interception of C3/C4) › AC-01.23 a stored option removed in Strapi leaves the select empty (4.0s)
  ok 51 [content-changes] › tests\content-changes\plans-changes.spec.ts:51:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.25 deactivation, order, recommended flag, base price and a price factor are reflected after reload (5.3s)
  ok 52 [content-changes] › tests\content-changes\plans-changes.spec.ts:96:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.21 the persisted plan is deactivated: no selection, announced message, no advance (5.8s)
  ok 53 [content-changes] › tests\content-changes\plans-changes.spec.ts:117:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.19 the chosen plan is deactivated before reaching the summary: back to step 2 with the notice (6.0s)
  ok 54 [content-changes] › tests\content-changes\plans-changes.spec.ts:134:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.19 the chosen plan gets another currency: back to step 2 with the notice (5.4s)
  ok 55 [content-changes] › tests\content-changes\plans-changes.spec.ts:153:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.15 a plan without base price is not shown and the rest are normal (2.9s)
  ok 56 [content-changes] › tests\content-changes\plans-changes.spec.ts:166:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.6 AC-02.7 order ties, empty order and several recommended (3.6s)
  ok 57 [content-changes] › tests\content-changes\plans-changes.spec.ts:190:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.10 without price factors each plan shows its base price (3.2s)
  ok 58 [content-changes] › tests\content-changes\plans-changes.spec.ts:202:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.32 thirty active plans are all listed (3.7s)
  ok 59 [content-changes] › tests\content-changes\plans-changes.spec.ts:221:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-02.22 a new required field published after step 1 sends the user back to step 1 without asking for plans (4.2s)
  ok 60 [content-changes] › tests\content-changes\plans-changes.spec.ts:254:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.20 a new required field published after choosing a plan sends the summary back to step 1 (6.9s)
  ok 61 [content-changes] › tests\content-changes\plans-changes.spec.ts:284:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.15 terms edited and published are shown after reloading the summary (5.9s)
  ok 62 [content-changes] › tests\content-changes\plans-changes.spec.ts:300:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.14 terms with unsafe markup do not execute or insert elements (3.5s)
  ok 63 [content-changes] › tests\content-changes\plans-changes.spec.ts:321:3 › Plans changes in Strapi (interception of C5/C6/C7) › AC-03.13 empty terms show the "not available" notice, checkbox and pay disabled, data visible (3.9s)
  ok 65 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:33:3 › Keyboard › AC-01.27 AC-01.16 Enter in a text field with invalid fields stays on step 1 and focuses the first invalid field (5.0s)
  ok 64 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:20:3 › Keyboard › AC-01.27 pressing Enter in a text field submits step 1 and moves to step 2 (5.3s)
  ok 66 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:50:3 › Accessible names and errors › AC-01.26 AC-01.2 AC-01.14 AC-01.33 every control by its label, help text and errors referenced, sections as named groups (2.9s)
  ok 67 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:79:3 › Accessible names and errors › AC-02.18 AC-02.17 continue without a plan shows the configured message and focuses the group; a new choice replaces the old one (4.7s)
  ok 68 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:98:3 › Accessible names and errors › AC-02.27 each plan option is named with the plan, the recommended label and the price (3.4s)
  ok 69 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:126:5 › Viewport 320 px › AC-01.28 step 1 has no horizontal scroll and every field and continue are usable at 320 px (4.7s)
  ok 70 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:142:5 › Viewport 320 px › AC-02.29 plans have no horizontal scroll and every plan, price and continue are reachable at 320 px (3.3s)
  ok 72 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:126:5 › Viewport 375 px › AC-01.28 step 1 has no horizontal scroll and every field and continue are usable at 375 px (4.3s)
  ok 73 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:142:5 › Viewport 375 px › AC-02.29 plans have no horizontal scroll and every plan, price and continue are reachable at 375 px (2.8s)
  x  71 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 320 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 320 px (7.5s)
  ok 74 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 375 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 375 px (5.0s)
  ok 75 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:142:5 › Viewport 1280 px › AC-02.29 plans have no horizontal scroll and every plan, price and continue are reachable at 1280 px (4.7s)
  ok 76 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:126:5 › Viewport 1280 px › AC-01.28 step 1 has no horizontal scroll and every field and continue are usable at 1280 px (5.2s)
  ok 77 [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 1280 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 1280 px (6.2s)


  1) [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 320 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 320 px 

    Error: expect(received).toEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 3

    - Array []
    + Array [
    +   "input#accept-terms 22.2x24.0",
    + ]

      169 |       }
      170 |       // Soft: a size defect is reported without hiding the rest of the scenario.
    > 171 |       expect.soft(await smallTargets(page, '.summary')).toEqual([]);
          |                                                         ^
      172 |
      173 |       await page.getByRole('checkbox', { name: CO.texts.acceptTerms }).check();
      174 |       await page.getByRole('button', { name: CO.texts.pay }).click();
        at C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\e2e\tests\a11y-responsive\keyboard-and-viewports.spec.ts:171:57

    attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────
    test-results\a11y-responsive-keyboard-a-f1894-re-at-least-24x24-at-320-px-a11y-responsive\test-failed-1.png
    ────────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results\a11y-responsive-keyboard-a-f1894-re-at-least-24x24-at-320-px-a11y-responsive\error-context.md

    attachment #3: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results\a11y-responsive-keyboard-a-f1894-re-at-least-24x24-at-320-px-a11y-responsive\trace.zip
    Usage:

        npx playwright show-trace test-results\a11y-responsive-keyboard-a-f1894-re-at-least-24x24-at-320-px-a11y-responsive\trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 320 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 320 px 
  76 passed (3.5m)
```

## Análisis de fallos

### Fallo de la ejecución final: defecto de la app (D-E2E-1)

- **Test:** `a11y-responsive › Viewport 320 px › AC-03.35 summary, payment and confirmation … at 320 px`.
- **Qué falla:** la casilla "Acepto los términos y condiciones" (`#accept-terms`) mide **22,2 × 24 px** a 320 px de ancho; AC-03.35 y REQ-03.36 exigen al menos 24 × 24 px CSS. A 375 y 1280 px pasa. El resto del escenario a 320 px (sin desplazamiento horizontal, términos desplazables, pago y confirmación) también se cumple: la comprobación de tamaño es `expect.soft` para no ocultarlo.
- **Causa (leída, no corregida):** `frontend/src/app/features/summary-step/summary-step-page.css:68-81`. `.accept` es `display: flex` y la casilla tiene `width: 24px; height: 24px` pero no `flex-shrink: 0`. Cuando el texto de la etiqueta se parte en dos líneas a 320 px, el elemento flex se encoge.
- **Propuesta para el Angular Developer:** `flex: none` (o `flex-shrink: 0`) en `input[type='checkbox'], input[type='radio']` de ese archivo. Conviene revisar la misma regla en `dynamic-form.css` (paso 1), aunque AC-01.28 no exige tamaño mínimo.

### Fallos de ejecuciones anteriores: del test o del entorno (corregidos en los tests, no en la app)

| Ejecución | Fallo | Causa | Tipo | Corrección |
|---|---|---|---|---|
| Iterativa | `toBeFocused` tras la fecha | Chrome da al `<input type="date">` paradas de tabulación internas (día, mes, año) | Test | `tabOutOfDate`: sigue pulsando Tab solo mientras el foco sigue en el mismo input y luego exige el control siguiente |
| Iterativa | Región de términos ambigua | La `<section>` y la región desplazable tienen el mismo nombre accesible ("Términos y condiciones") | Test | Selector por rol **y** `tabindex="0"`. Observación menor para G5: dos regiones anidadas con el mismo nombre |
| Iterativa | Casilla de términos sin marcar tras Espacio | El test pulsaba Espacio antes de que llegaran los términos (la casilla está deshabilitada mientras cargan) | Test | `goToCoSummary` espera a que la casilla esté habilitada |
| Iterativa | Listas de planes vacías | `allTextContents()` no espera; se leía antes de que respondiera C5 | Test | `toHaveText([...])`, que reintenta |
| Iterativa | `getByLabel(…, { exact: true })` sin resultados | El texto de la `<label>` incluye el `*` visible (`aria-hidden`) | Test | `getByLabel` sin `exact` + `toHaveAccessibleName(label)` exacto, que sí excluye el `*` |
| Iterativa | AC-03.21 mostraba el campo retirado | `page.unroute` con un predicado nuevo no coincide con el registrado | Test | Bandera `published` dentro del mismo manejador |
| Iterativa | AC-01.19: forma del almacenamiento | `ciq.v1.co.step1` es `{ values: {…} }` | Test | Expectativa corregida |
| 4 workers (76 tests: 73 pasan, 3 fallan) | AC-02.4 mostró "error de carga" | En la traza, C5 vía `route.fetch()` tardó 10 394 ms y C6 sin interceptar 9 105 ms. La app aplicó **correctamente** su timeout de 10 000 ms (api-contracts §1) | Entorno | 2 workers y `expect.timeout` 15 s. Sin cambiar ninguna aserción ni añadir reintentos |
| 4 workers | AC-03.21 seguía en "cargando" | En la traza, tras `reload()` las peticiones a `/api` empezaron 12 s después de cargar el HTML: CPU del host saturada (8 GB, 2 GB libres, 4 Chrome + Strapi + Docker) | Entorno | Ídem |
| 4 workers | AC-03.35 a 320 px | D-E2E-1 | App | — |

Con 2 workers, dos ejecuciones completas consecutivas dieron el mismo resultado (76 pasan, 1 falla: D-E2E-1).

## Técnicas usadas (ADR-0007)

- **Reloj:** `page.clock.setFixedTime` antes de `goto` (fixture automático). AC-01.19 usa `2026-11-23T01:00:00Z` con `timezoneId: 'America/Bogota'` (20:00 del 22 en Bogotá). Los 1500 ms del pago corren con temporizadores reales.
- **Red:** `page.route` con predicado sobre `URL.pathname` y los parámetros que distinguen C3, C6 y C7 (las tres usan `/api/countries`). Los cambios de contenido parten siempre de la respuesta real (`route.fetch()` + `route.fulfill({ response, json })`). Los retrasos se hacen con una promesa que el test libera y los fallos con `route.fulfill({ status: 500/503 })`. Nada escribe en Strapi ni usa credenciales (G3-3).
- **Guarda de red (`networkGuard`, automático en los 77 tests):** registra `page.on('request')` y al final exige que toda petición sea `GET`, sin `Authorization` y sin parámetros `status` ni `publicationFilter`. Respalda AC-01.30, AC-02.31 y AC-03.24 en todo el recorrido, no solo en su test dedicado.
- **Doble envío (AC-03.22):** un `addInitScript` solo observa: cuenta los `setTimeout(…, 1500)`, que es la única traza de un intento en `MockPaymentGateway`, y los eventos `click` que llegan al botón. Para cada variante (doble clic, Enter mantenido con `keydown` repetidos, Enter + clic real con `page.mouse`) se exige **≥ 2 clics recibidos y exactamente 1 intento**, así el test no puede pasar sin que la entrada repetida se haya producido.
- **Responsive:** `scrollWidth ≤ clientWidth` de `documentElement`, `toBeInViewport` tras `scrollIntoViewIfNeeded` y medida de `getBoundingClientRect` de botones, casillas y radios a 320, 375 y 1280 px.

## AC de cambio de contenido (G3-3)

Automatizados por intercepción y pendientes de comprobación manual del cambio real en Strapi en G5 ([`manual-check.md`](manual-check.md) §4):

| AC | Test (verde) | G5 |
|---|---|---|
| AC-01.3 | `content-changes › AC-01.3 a new published field appears after reload without code changes` | §4.2–4.3 (campo nuevo publicado) |
| AC-01.10 | `content-changes › AC-01.10 …` | indirecto (§4.2) |
| AC-01.11 | `content-changes › AC-01.11 …`: contra el seed real, sin intercepción | No hace falta |
| AC-01.31 | `content-changes › AC-01.31 …` | indirecto |
| AC-02.4 | `states › AC-02.4 …` (dos variantes) | §4.4–4.5 |
| AC-02.21 | `content-changes › AC-02.21 …` | §4.4–4.5 (plan desactivado) |
| AC-02.25 | `content-changes › AC-02.25 deactivation, order, recommended flag, base price and a price factor …` | §4.4–4.6 (plan desactivado, factor) |
| AC-03.15 | `content-changes › AC-03.15 …` | opcional |

## Vigencia de esta evidencia

1. **La pila probada no incluye `40dfcae` ni `8f763cb`.** Los contenedores se crearon a las 01:11 y 01:15 (−05) y esos commits son de las 02:01 y 02:13. La API en ejecución todavía devuelve para `cl_rut` el patrón `[0-9]{7,8}-[0-9Kk]`, mientras que `cms/src/seed/data/cl.ts:120` ya acepta `12.345.678-5`. El mensaje de `40dfcae` indica que la verificación de la pila necesita un volumen limpio después del e2e. **Hay que reconstruir (`docker compose up -d --build`, con volumen limpio para el seed) y repetir `npx playwright test`** para que la evidencia cubra `8f763cb`. No reconstruí la pila: no lo pide mi rol y borra el volumen de la demo.
2. **AC-03.6 con puntos (`12.345.678-5`):** según el aviso del orquestador, el test de CL usa `12345678-5`, que acepta el patrón antiguo y el nuevo, y comprueba `*****678-5`. El formato con puntos queda **Pendiente de G4 (F-03.2)** en el plan. Tras reconstruir, se puede añadir un test con `12.345.678-5` → `**.***.678-5`. No lo añadí ahora porque fallaría por la pila desactualizada, no por la app.

## Re-ejecución tras G4 (2026-11-23 02:27, orquestador)

Pila reconstruida con volumen limpio (`docker compose down -v && docker compose up -d --build`) con las correcciones `40dfcae` (F-00.12, F-03.2, F-00.13), `8f763cb` (F-03.1, F-02.1) y `0086e5a` (F-03.3 / D-E2E-1).

```text
$ cd e2e && npx playwright test --reporter=line
...
[71/77] [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 320 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 320 px
...
[77/77] [a11y-responsive] › tests\a11y-responsive\keyboard-and-viewports.spec.ts:157:5 › Viewport 1280 px › AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at 1280 px
  77 passed (3.7m)
```

D-E2E-1 queda corregido (AC-03.35 a 320 px en verde). AC-03.6 con RUT con puntos sigue cubierto solo por unit tests de `maskDocument`; el seed ya admite ese formato (F-03.2).
