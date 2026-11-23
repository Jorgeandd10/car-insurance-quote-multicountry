# Informe de pruebas — US-03 (resumen, términos, pago simulado y confirmación), fase 4d

| Campo | Valor |
|---|---|
| Autor | Angular Developer (subagente) |
| Fecha | 2026-11-23 |
| Commit probado | Sin commit propio: árbol de trabajo sobre `f411a8b` (rama `phase-4/implementation`) con los cambios de 4d sin confirmar. El commit lo hace el orquestador |
| Entorno | Node 24.22.3 · npm 11.19.1 · Angular 22.3.0 · TypeScript 6.0.3 · Vitest 5.1.1 · jsdom 31.0.1 · Windows 11 (Git Bash). Sin Strapi: fixtures en formato v5 de `api-contracts.md` (C3 a C7), con el C7 documentado para CO y unos términos ficticios de CL en `frontend/src/app/features/form-step/testing/wizard-harness.ts` |

Alcance:

- `features/summary-step/`:
  - `summary-values.ts`: secciones, valor visible por tipo y enmascarado por rol.
  - `terms/terms-blocks.ts` y `terms/terms-text.ts`: render de Blocks sin `innerHTML`.
  - `payment/payment-state.ts` (`canPay`) y `payment/mock-payment-gateway.ts` (`PAYMENT_DELAY_MS` y `QUOTE_RANDOM_FILL` inyectables).
  - La página del resumen.
- `features/confirmation/`: página y `confirmationGuard`.

El resumen reutiliza `Step1ResultReader`, `PlansData`, `buildPlanViews` y `priceInputsFrom`, de modo que el precio sale del mismo cálculo que en el paso 2 (REQ-03.5).

Las salidas se pegan tal cual. Solo se han quitado los códigos de color ANSI (`sed 's/\x1b\[[0-9;]*m//g'`). Los códigos de salida se capturaron con `set -o pipefail`.

## Comando y salida real

### Build

```text
$ npx ng build
❯ Building...
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

Application bundle generation complete. [10.780 seconds] - 2026-11-23T06:00:08.873Z

Output location: C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend\dist\car-insurance-quote
```

Código de salida: `0`, sin avisos.

### Unit tests

```text
$ npx ng test --watch=false --reporters=verbose
Using Vitest configuration file: C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend\vitest-base.config.mts
❯ Building...
✔ Building...
Application bundle generation complete. [11.976 seconds] - 2026-11-23T06:01:47.331Z


 RUN  v5.1.1 C:/Users/Jorge Andres/Documents/_SURA/car-insurance-quote-multicountry/frontend

 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.3 AC-01.7 shows only the fixed "cargando" while the configuration loads 1335ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.1 REQ-02.1 shows the active plans of the country in the configured order 1511ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.5 the plans of another country are never shown 170ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.2 AC-02.7 only the first recommended plan is highlighted, with a visible text label 211ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > summary > AC-03.1 shows my data, my vehicle data and the chosen plan with its final price 1960ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.9 AC-02.8 each plan shows its final price from the step 1 data, in COP without decimals 315ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > AC-02.22 without step 1 data for Chile, "/cl/plans" redirects to "/cl/form" and no plan is requested 2418ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > AC-01.5 lists the published countries with their Strapi names, and Chile goes to "/cl" 2497ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.8 Chile shows CLP: "$21.589" (19 990 × 1.08, rounded once) 203ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.1 shows only the fields of the country, in sections and in the configured order 1757ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > AC-01.8 shows "error de carga" + "reintentar" and retrying shows the step 940ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.2 every text of "/" comes from Strapi (country-selection) 88ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.3 shows the fixed "cargando" while loading 55ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > summary > AC-03.5 the Colombian document is masked, the type in clear, and the full value is not in the DOM 379ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.10 without price factors each plan shows its base price 209ms
 ✓  car-insurance-quote  src/app/features/confirmation/confirmation-page.spec.ts > ConfirmationPage and confirmationGuard > AC-03.30 REQ-03.29 opening the confirmation without a payment in this session goes to step 1 2530ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > REQ-02.3 shows description, coverages and benefits as lists; an empty list is not shown 149ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.4 if country-selection is not published (404) shows "error de carga" and retries 362ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > G3-10 a missing required text of "/" is shown as "error de carga", without defaults 52ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.26 REQ-01.12 each section is a fieldset with its Strapi legend, policyholder first 379ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > AC-02.22 valid data that a new required field makes incomplete redirects to step 1, keeping the data 572ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.1 requests only the configuration of the country of the URL 275ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > summary > AC-03.6 the Chilean RUT is masked keeping its separators 341ms
 ✓  car-insurance-quote  src/app/features/confirmation/confirmation-page.spec.ts > ConfirmationPage and confirmationGuard > REQ-03.37 a confirmation of Colombia does not open the confirmation of Chile 401ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.14 a plan with another currency is not shown and a warning is logged 200ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > summary > AC-03.8 values are readable: option label, yes text, local date and "—" for an empty optional 246ms
 ✓  car-insurance-quote  src/app/features/confirmation/confirmation-page.spec.ts > ConfirmationPage and confirmationGuard > ADR-0004 a corrupt confirmation is discarded and goes to step 1 253ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a text field is a native control with its label 338ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-02.19 a complete step 1 lets the plans step open 318ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.15 a plan without base price is not shown and the others are 195ms
 ✓  car-insurance-quote  src/app/features/confirmation/confirmation-page.spec.ts > ConfirmationPage and confirmationGuard > AC-03.28 AC-03.31 reloading shows the same number, the plan and the price paid, without personal data 128ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.32 more plans than the default page size are all listed 210ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a number field is a native control with its label 302ms
 ✓  car-insurance-quote  src/app/features/confirmation/confirmation-page.spec.ts > ConfirmationPage and confirmationGuard > AC-03.34 REQ-03.33 the focus is on the heading of the confirmation and no step is current 133ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.31 AC-01.27 the step indicator marks the current step with aria-current="step" 595ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > REQ-03.13 with a complete step 1 but no chosen plan, the summary redirects to step 2 350ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a select field is a native control with its label 219ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > summary > AC-03.9 the price is recalculated from the stored plan id and follows a change of step 1 562ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.3 a selected plan is checked and continue goes to the summary 387ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a date field is a native control with its label 181ms
 ✓  car-insurance-quote  src/app/features/confirmation/confirmation-page.spec.ts > ConfirmationPage and confirmationGuard > AC-03.31 REQ-03.28 "nueva cotización" deletes the confirmation and opens an empty step 1 344ms
 ✓  car-insurance-quote  src/app/features/confirmation/confirmation-page.spec.ts > ConfirmationPage and confirmationGuard > REQ-03.38 a missing confirmation text shows the generic error, never a default 82ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > summary > AC-03.21 a field removed from the configuration is not shown and the rest is 181ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > REQ-03.13 with a complete step 1 and a chosen plan, the summary opens 367ms
 ✓  car-insurance-quote  src/app/features/confirmation/confirmation-page.spec.ts > ConfirmationPage and confirmationGuard > REQ-03.28 the confirmation does not bring back step 1 data 110ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.31 the focus goes to the heading of the step and document.title follows it 506ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > D7 the confirmation is not a step: no step is marked as current 68ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.17 REQ-02.14 selecting another plan replaces the selection (one radio group) 131ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > REQ-03.13 an incomplete step 1 wins: without step 1 and without plan, it goes to step 1 267ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-03.13 the summary also requires a complete step 1 690ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > ADR-0001 "/co" and unknown sub-paths redirect to "/co/form" 145ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > summary > AC-03.34 REQ-03.33 the focus is on the heading of the summary and the indicator marks step 3 232ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 1: an empty <input type="number"> writes null (not NaN) to a number | null model 64ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 1: a decimal is kept as a number (the integer rule is ours) 36ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-01.25 complete data of Colombia does not open the plans of Chile 231ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.16 G2-9 only the documentId of the plan is stored 223ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 2: <input type="date"> keeps a string model as "YYYY-MM-DD" in both directions 76ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 3: FormField sets the native required property but no aria-invalid nor aria-describedby 35ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > ADR-0004 if the configuration fails, the guard lets the navigation through and the shell shows the error 106ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > touched becomes true on blur (error shown after the first blur) 140ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > a checkbox writes a boolean 45ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > AC-01.6 an unknown code shows "país no disponible" and the published countries as links 286ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > REQ-03.37 a plan chosen in Colombia does not open the summary of Chile 211ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a checkbox field is a native control with its label 188ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.1 requests C3 and C4 only for the country of the URL and builds a ready config 20ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > AC-01.6 an unknown country gives notAvailable 30ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.18 continue without a selection shows the Strapi message on the group and moves the focus to it 290ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > ADR-0004 a corrupt stored plan counts as no plan 324ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-01.2 an unknown country is not redirected: the shell shows "país no disponible" 142ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.2 a code that cannot be a country is not requested to Strapi 173ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > G2-10 the guard never writes a "completed" flag 215ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > Q-01.20 the configuration is requested once per app load and country 34ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.4 a failure puts the resource in error and "reintentar" requests it again 68ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.35 sends a GET to the relative /api URL, without Authorization nor credentials 18ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-02.21 each request has a 10 000 ms timeout 8ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.6 the query is encoded by HttpParams and carries no status parameter 7ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > AC-02.32 REQ-02.24 walks every page in series and concatenates the data 11ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-02.24 a single page is not requested again 7ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an HTTP 500 is a request error 24ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 a network error (or timeout) is a request error 7ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (data missing) is a contract error 7ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (data is not an array) is a contract error 10ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.15 the message is removed once a plan is chosen 120ms
 ✓  car-insurance-quote  src/app/features/summary-step/terms/terms-blocks.spec.ts > TermsBlocks > REQ-03.15 renders the documented C7 terms: a paragraph and an unordered list with bold 23ms
 ✓  car-insurance-quote  src/app/features/summary-step/terms/terms-blocks.spec.ts > TermsBlocks > AC-03.14 HTML in the content is shown as literal text and no element is inserted 22ms
 ✓  car-insurance-quote  src/app/features/summary-step/terms/terms-blocks.spec.ts > TermsBlocks > REQ-03.16 ordered lists and nested marks are rendered with their own elements 35ms
 ✓  car-insurance-quote  src/app/features/summary-step/terms/terms-blocks.spec.ts > TermsBlocks > ADR-0006 a Strapi heading of level n becomes h(n+2), at most h6 28ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.2 if the country list fails, "país no disponible" shows "error de carga" + "reintentar" 112ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.13 a missing step indicator text shows the generic error instead of the wizard 45ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.7 logs a warning for each skipped field, without user data 78ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-02.32 a missing step title shows the generic error of the country, never a default 119ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 REQ-01.9 the help text is associated with aria-describedby 554ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (body is not an object) is a contract error 53ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > ADR-0004 whenSettled resolves with the result for the step guards, or null on error 111ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > ADR-0004 whenSettled resolves immediately when the configuration is already loaded 32ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > AC-01.6 "/CO" is redirected to "/co" (and then to its first step) 22ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 only the case of the country segment changes: "/CO/plans?x=1" → "/co/plans?x=1" 29ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 a lower-case code passes, even if it is unknown (the shell shows "país no disponible") 16ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 lowercaseFirstSegment leaves the rest of the URL untouched 2ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.2 a single type must have an object in data; a 404 is an error 59ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > ADR-0004 aborting (resource cancelled) cancels the HTTP request 9ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > ADR-0004 keys are ciq.v1.{cc}.{kind} 8ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.25 a key is only built from a validated lower-case country code 10ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.23 stores only the step 1 values, without any completed flag 8ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > AC-01.22 REQ-01.25 data of one country is never read from another 7ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 corrupt JSON is discarded with a warning and the key is removed 6ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 an unexpected shape is discarded 6ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 a value of an unexpected type is dropped on its own, without logging the value 6ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 shows the 3 steps (D7) in an ordered list inside a named nav 18ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.19 the selection survives a reload 197ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 only the current step has aria-current="step" 18ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 the step number is decorative for assistive technologies 20ms
 ✓  car-insurance-quote  src/app/core/country/country-route-reuse-strategy.spec.ts > CountryRouteReuseStrategy > REQ-01.25 a route component is created again when the country changes 30ms
 ✓  car-insurance-quote  src/app/core/country/country-route-reuse-strategy.spec.ts > CountryRouteReuseStrategy > REQ-01.25 within the same country the component is reused (only the query changes) 25ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 loading is announced as status with the fixed "cargando" 13ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 REQ-01.4 error is an alert with "error de carga" and a "reintentar" button that emits 18ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 a Strapi message is announced as an alert 17ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 a non-finite number is not a valid stored value 10ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-02.16 the plan stores only its documentId 47ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-02.17 an invalid stored plan is discarded 25ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-03.28 the confirmation round-trips and an incomplete one is discarded 11ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/mock-payment-gateway.spec.ts > MockPaymentGateway > REQ-03.24 the simulated processing lasts 1500 ms by default and resolves with the chosen outcome 17ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/mock-payment-gateway.spec.ts > MockPaymentGateway > REQ-03.24 the duration is injectable 10ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/mock-payment-gateway.spec.ts > MockPaymentGateway > REQ-03.22 leaving the page aborts the pending payment and its result is discarded 12ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/mock-payment-gateway.spec.ts > MockPaymentGateway > REQ-03.20 D9 no request of any kind is made 25ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/mock-payment-gateway.spec.ts > MockPaymentGateway > REQ-03.26 the quote number uses the cryptographic random source by default 57ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-03.28 remove deletes only the given key of the given country 43ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > ADR-0004 a storage that throws does not break the app 11ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > AC-03.8 REQ-03.2 shows policyholder then vehicle, with Strapi legends, labels and configured order 5ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > AC-03.8 REQ-03.3 select shows the option label, checkbox the yes text, empty optional "—" 5ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > AC-03.8 a date is shown in the long format of the locale, without shifting the day 6ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > REQ-03.21 AC-01.19 the date does not depend on the time zone of the device 6ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.13 the select offers exactly the Strapi options, in order, after an empty option 342ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > AC-03.5 REQ-03.6 the documentNumber role is masked; the document type is shown in clear 4ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > AC-03.6 a Chilean RUT keeps its separators 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > REQ-03.6 every field with role documentNumber is masked 4ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > REQ-03.3 a vehicle year is shown without grouping; other numbers with the locale format 2ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > REQ-03.3 an unchecked checkbox shows the no text, not "—" 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-values.spec.ts > summary values > AC-03.21 a field removed from the configuration is not shown; the rest is 12ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C1 published countries > AC-01.5 maps the published countries with the names from Strapi, in the received order 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C1 published countries > REQ-01.7 drops items with an invalid code or without name, and duplicated codes 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.2 maps the texts of "/" from Strapi 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.2 intro is optional 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.13 a missing heading or list label is not interpretable (null → error state) 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.1 maps market data and texts of the requested country 5ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > AC-01.6 no country with that code → notAvailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 more than one country with the code is not interpretable 5ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is not an integer) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is negative) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is missing) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (currency is not ISO 4217) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (intlLocale is empty) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (code does not match) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.13 without genericErrorMessage the configuration is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > AC-01.35 a blank continue text marks the form step as configError, without defaults 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-03.38 a missing summary text only breaks its own section 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.13 texts are trimmed 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.1 a complete configuration is ready 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.13 a missing step 1 text makes the form configError before empty or unavailable 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.13 a missing section legend (wizard texts) also makes the form configError 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > AC-01.20 the documented C4 example lacks birthDate and documentNumber → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 maps the documented C4 example to the domain 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.28 a configuration with the three roles is ready 10ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.20 without a field with role birthDate the form is unavailable and warns 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.5 no valid field → empty 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.25 a field with an unknown type and a field without label are skipped with one warning each 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.7 an element that is not an object, an invalid key or an unknown section is skipped 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 orders by fixed section, then order ascending, empty order last, ties by key 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.10 swapping order in Strapi swaps the fields on screen 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 a repeated key keeps the first by order and warns 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.13 select options keep the Strapi order; invalid and repeated values are dropped 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.11 a select without valid options is skipped 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.14 required is true only when Strapi says exactly true 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.9 empty help text and error message become null 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.15 keeps the validations of the catalog for each type, with decimal values as strings 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.15 the pattern is anchored to the whole value 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.15 validations of another type or with invalid parameters are ignored, the field stays 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.28 a role on an incompatible type is ignored with a warning (and G2-5 applies) 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.22 several fields with the same role keep it on all of them 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.7 a non-integer order is treated as empty with a warning 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 identifies the fields with roles documentNumber, birthDate and vehicleYear 11ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 gives the option label of each select, not only the value 5ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 reports a valid step 1 as complete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 when the business makes a stored value invalid, the result becomes incomplete 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-02.22 a new required field makes the stored data incomplete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.20 a change of minimum age revalidates the birth date 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 no data at all is incomplete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is empty is never complete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is unavailable is never complete 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is configError is never complete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 exposes normalised values: text trimmed 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.23 normalised values to store: trimmed text, NaN → null, only current fields 6ms
 ✓  car-insurance-quote  src/app/app.spec.ts > App > ADR-0004 G3-9 shows the global "cargando" while a guard keeps the navigation pending 27ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 todayLocal gives the local calendar date as YYYY-MM-DD 2ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > AC-01.19 dates are not shifted by the time zone (America/Bogota, 20:00 local = 01:00 UTC next day) 6ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 control: changing TZ really changes the local date (Asia/Tokyo is a day ahead) 2ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 CLOCK is injectable and can be replaced in tests 4ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 the default CLOCK returns the current date 6ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.24 restores the stored values of the current fields 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 without stored data every field starts empty, by type 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > AC-01.23 a removed field and a removed option are discarded; make must be chosen again 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > AC-01.24 a stored value that breaks a new validation is kept and revalidated as invalid 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a new published field starts empty and the rest is kept 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a changed field type discards a value that does not fit the new type 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (text with a number) is discarded on its own 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (number with a string) is discarded on its own 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (checkbox with a string) is discarded on its own 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (date that is not YYYY-MM-DD) is discarded on its own 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (select with null) is discarded on its own 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > US-01 §7 warnings never contain the stored values 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.14 a value of only spaces is blank 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > Q-01.16 lengths count characters of the trimmed value 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > Q-01.16 the pattern covers the whole value 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.15 number rules: min, max and integer 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.15 ruleHolds only accepts the value type of each rule 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with pattern and value ABC123 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with pattern and value ABC12 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with maxLength and value ABCDEF → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 number with min and value 0 → valid=false 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 number with integer and value 2.5 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.14 a required text left empty or with only spaces is invalid 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > Q-01.16 text validations run on the trimmed value 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.15 an empty optional field is valid and its other rules do not run 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.16 several failing rules still make one invalid field 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.33 a required checkbox must be checked; an optional one may stay unchecked 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.11 a select value must be one of the current options 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2005 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2006 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2026 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2027 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2028 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2008-11-22 → valid=true 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2008-11-23 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2026-11-23 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-02-28, 2008-02-29 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-03-01, 2008-02-29 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.20 the legal age uses the minimum age of the country 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.22 the role rules cannot be switched off: an optional birthDate or vehicleYear is still required 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.21 a date that is not a calendar date YYYY-MM-DD is invalid 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.26 a value of an unexpected type is invalid 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E1 final price is 1320000 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E2 final price is 1440000 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E3 final price is 1221875 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E4 final price is 38985 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E5 final price is 25990 0ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E6 final price is 21589 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 reports the multiplier applied for each role (E3: both limits inclusive) 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.10 without price factors the final price is the base price 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.11 without a value for birthDate its factor is 1 and vehicleYear still applies 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.10 a value that cannot be interpreted gives factor 1 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.12 a vehicle from next year uses vehicle age 0 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.13 a band with multiplier 0 is ignored and the remaining valid bands apply 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 bands with a negative or non-finite multiplier or min > max are discarded 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 with overlapping bands the first in the configured order wins 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 a band with an incompatible role and operand is discarded (G3-10) 0ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.11 rounds once at the end, not after each factor 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.8 is pure: same inputs give the same output and the rules are not modified 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.8 depends on the reference date passed in, not on the clock 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.3 maps the documented C5 example to the domain 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.2 a plan that is not active (false or null) is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > AC-02.14 a plan with another currency is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > AC-02.15 a plan without base price is discarded and the others are kept 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (empty name) is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (base price 0) is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (negative base price) is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.9 maps the documented C6 example in the configured order 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > AC-02.10 null or empty priceFactors → no rules (final price = base price) 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > AC-02.13 a band with multiplier 0 is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with min > max is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with negative multiplier is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with non numeric multiplier is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with non-integer limit is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with unknown role is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (non numeric base price) is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (empty documentId) is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a numeric string base price is accepted 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.3 null coverages or benefits are empty lists and blank labels are omitted 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.4 empty or non-integer order is null; recommended is true only when exactly true 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with unknown operand is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with incompatible role and operand (G3-10) is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.9 a decimal multiplier serialised as a string is accepted (ADR-0005) 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.21 a country unpublished between steps (no data) is an error 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 Colombia: "$ 1.320.000" with U+00A0 between "$" and the number 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 Chile: "$38.985" without separator after "$" 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 the price has no decimal part 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > REQ-02.6 locale and currency come from the arguments (Strapi), not from code 3ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.15 maps the documented C7 example: paragraph and unordered list with bold 2ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.16 supports ordered lists, headings, quotes, marks and links (text only) 2ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > AC-03.14 HTML inside the text is kept as literal text, never as a node 2ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.16 unknown, code and image nodes are degraded to plain text or omitted, with a warning 2ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are null → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are an empty list → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are blocks without text → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 more than one country record → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.32 no country (unpublished between steps) is an error 2ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C1 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C2 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C3 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C4 never asks for drafts: no status nor publicationFilter 0ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C5 never asks for drafts: no status nor publicationFilter 0ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C6 never asks for drafts: no status nor publicationFilter 0ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C7 never asks for drafts: no status nor publicationFilter 0ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.1 country requests filter only by the country of the URL 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.24 collections that can grow ask for an explicit page size of 100 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.2 plans are filtered by active = true 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > api-contracts C3 asks for the five text components and pageSize 2 to detect duplicates 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.9 price factors are requested without texts 1ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > AC-03.27 matches ^CO-20261122-[A-HJ-NP-Z2-9]{6}$ with a fixed clock 5ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > AC-03.27 the same random source always gives the same number 2ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > REQ-03.26 uses the UTC date of the payment 1ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > REQ-03.26 the alphabet has 32 symbols without 0, O, 1 or I, for every byte value 10ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > AC-02.6 orders by order, ties by name, empty order last: Basic, Gold, Plus, Lite 10ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > REQ-02.4 several plans without order keep name order after the ordered ones 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > REQ-02.4 the name is compared with the locale of the country 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > REQ-02.4 with same order and name, the documentId decides 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > REQ-02.4 is pure: the input array is not modified 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > recommendedPlanId > AC-02.7 with Basic (order 1) and Gold (order 2) recommended, only Basic is highlighted 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > recommendedPlanId > Q-02.1 with no plan marked nothing is highlighted 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "1234567890" → "******7890" 2ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "12.345.678-5" → "**.***.678-5" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "E-123456" → "*-***456" 0ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "12345" → "***45" 0ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "1234" → "**34" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "7" → "*" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.5 the full Colombian document does not appear in the masked value 2ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.6 the full RUT does not appear and separators are kept 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > REQ-03.7 spaces are separators and never more than half is shown 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-views.spec.ts > buildPlanViews > AC-02.9 E1: CO base 1 200 000, 2018 and 2000-05-10 → $ 1.320.000 (with U+00A0) 2ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-views.spec.ts > buildPlanViews > AC-02.9 E4 and E6: CL prices with the seed factors of Chile 2ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-views.spec.ts > buildPlanViews > AC-02.10 without factors each plan shows its base price 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-views.spec.ts > buildPlanViews > REQ-02.5 only the first recommended plan in display order is highlighted 2ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2005 → valid=false 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2006 → valid=true 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2026 → valid=true 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2027 → valid=true 0ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2028 → valid=false 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-01.19 only integers are valid 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-01.19 the current year comes from the reference date, limits inclusive 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-02.12 a vehicle from next year has vehicle age 0, not -1 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-02.8 vehicle age is the difference of years (E1, E3, E4) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-02.10 a non-integer year has no vehicle age 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 parses a YYYY-MM-DD calendar date without time zone 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-02-30" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2025-02-29" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-13-01" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-00-10" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-1-1" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-11-22T00:00" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.20 knows leap years (29 February rule) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 compares calendar dates by day 2ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.20 the selection is kept per country 395ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2008-11-22 → valid=true (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2008-11-23 → valid=false (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2026-11-23 → valid=false (minimum age 18) 0ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-02-28, birth date 2008-02-29 → valid=false (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-03-01, birth date 2008-02-29 → valid=true (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.20 a future birth date is invalid even with minimum age 0 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.20 uses the minimum age of the country from Strapi 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.21 a value that is not a calendar date is invalid 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/payment-state.spec.ts > canPay > REQ-03.19 is true only when data, plan and terms are ready and the terms are accepted 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/payment-state.spec.ts > canPay > REQ-03.19 is false with terms not accepted 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/payment-state.spec.ts > canPay > REQ-03.19 is false with terms not loaded or unavailable 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/payment-state.spec.ts > canPay > REQ-03.19 is false with plan not loaded 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/payment-state.spec.ts > canPay > REQ-03.19 is false with data texts missing 0ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/payment-state.spec.ts > canPay > REQ-03.19 is false with payment texts missing 0ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/payment-state.spec.ts > canPay > REQ-03.19 is false with a payment in progress 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/payment/payment-state.spec.ts > canPay > REQ-03.30 a rejected payment can be retried 1ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > D7 form, plans and summary are steps 1-3; the confirmation is not a step 1ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > REQ-01.13 the heading of each screen is its Strapi title 2ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > REQ-01.13 any missing text of the screen gives the generic error, never a default 2ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status idle → loading 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status loading → loading 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status reloading → loading 0ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status error → error 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status resolved → ready 0ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status local → ready 0ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.13 G2-2 there are exactly the four fixed texts, in Spanish 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/price-inputs.spec.ts > priceInputsFrom > REQ-02.10 takes the values by role, never by key or label 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/price-inputs.spec.ts > priceInputsFrom > AC-02.11 without a field with role birthDate its input is null (factor 1) 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/price-inputs.spec.ts > priceInputsFrom > REQ-02.10 empty or unusable values are null 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/price-inputs.spec.ts > priceInputsFrom > ADR-0005 with several fields of the same role the first in display order is used 1ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.20 the birthday counts as completed 1ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.20 someone born on 29 February has the birthday on 1 March in non-leap years 1ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-02.8 gives the ages of the price examples E1-E6 (reference 2026-11-22) 2ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.20 a future birth date gives a negative age 1ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.21 returns null for values that are not calendar dates 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-selection.spec.ts > restorePlanSelection > REQ-02.16 a stored plan that is still available is preselected 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-selection.spec.ts > restorePlanSelection > AC-02.21 REQ-02.17 a stored plan that is no longer in the list is discarded 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-selection.spec.ts > restorePlanSelection > REQ-02.15 without a stored plan nothing is selected and there is no notice 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-selection.spec.ts > restorePlanSelection > REQ-02.22 with an empty list a stored plan is discarded 1ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > REQ-01.14 REQ-01.29 required fields are marked visually and with the native required property 279ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.21 a stored plan that is no longer available is discarded with an announced notice 208ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > REQ-01.31 the focus is on the heading of the step and the indicator marks step 1 315ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.31 the continue button shows the Strapi text 81ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > navigation > AC-03.10 edit data: full document in step 1, then step 2 with the plan, then the summary with terms unchecked 1435ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 the error is not shown while typing, only after leaving the field 93ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.2 AC-01.26 an invalid field shows its configured message, aria-invalid and aria-describedby 85ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > navigation > AC-03.11 change plan: step 2 with the plan marked, choose another and the summary shows it 237ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 the error disappears as soon as the value is valid 98ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 an empty field message falls back to the generic message of the country 104ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > navigation > AC-03.19 a stored plan that is no longer available goes to step 2, which warns and selects nothing 146ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > navigation > AC-03.20 data that no longer meets the configuration goes to step 1 with the data kept 153ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.16 AC-02.30 after editing step 1 the price is recalculated and the selection is kept 615ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.14 a required text with only spaces shows its message and stays on step 1 168ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > navigation > AC-03.32 data and terms are separated by country 131ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.23 the plans are requested again on every entry to the step 200ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > AC-03.2 shows the terms of the country and the pay button is disabled until they are accepted 87ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > AC-02.27 the group has a name and each option names the plan, price and recommendation 71ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.16 REQ-01.17 trying to continue shows all errors, focuses the first invalid field and keeps the URL 163ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > AC-03.12 unchecking the terms disables the pay button again 130ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > AC-02.28 the focus is on the heading of the step and the indicator marks step 2 121ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > REQ-02.26 the buttons are back (button) and continue (submit of the form) 82ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.17 with an untouched empty form, continue reveals every required error 159ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > REQ-03.16 the terms region is focusable, scrollable and named by its heading 100ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.4 AC-02.22 with no active plans shows the empty message, no continue, and back to step 1 113ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.33 a required checkbox left unchecked shows its message and stays on step 1 179ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > AC-03.34 REQ-03.17 the checkbox is named by its label and the disabled button points to the hint 106ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > AC-03.13 when no terms are published, terms are unavailable; checkbox and pay are disabled; data and plan stay 94ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.23 REQ-02.20 while loading shows the fixed "cargando" as status and no continue 43ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > AC-03.13 when the published terms are empty, terms are unavailable; checkbox and pay are disabled; data and plan stay 79ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.24 REQ-02.21 a failure shows "error de carga" and "reintentar"; retrying lists the plans 102ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > REQ-02.21 a failure of the price factors is also "error de carga" (no partial prices) 68ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.33 a missing continue text shows the generic error, no plans, and no plan request 46ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.17 a vehicle year outside 2006-2027 is invalid; 2027 is valid 99ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.18 a policyholder who turns 18 tomorrow is invalid with the field message 90ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > AC-03.13 when more than one terms record arrives, terms are unavailable 83ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > AC-03.14 markup in the terms is shown as text and never inserted 88ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > terms > AC-03.17 a terms failure shows "error de carga" there; retrying shows them and they can be accepted 124ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > states > AC-03.16 REQ-03.31 while loading, each pending section shows "cargando" and pay is disabled 65ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.32 with a valid form, continue goes to step 2 of the same country and stores the data 293ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > REQ-01.23 every change is stored, normalised (trimmed text), without any completed flag 88ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > Q-01.16 leaving a text field replaces its value by the trimmed one 78ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > states > REQ-03.32 a failure of the plans shows "error de carga" in the plan section and keeps the data 85ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > states > AC-03.36 a missing checkbox label shows the generic error in the terms section, with no default text 57ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > states > AC-03.36 a missing rejection message shows the generic error in the payment section and no pay button 72ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > states > REQ-03.38 a missing page title shows only the generic error 40ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.4 going back from step 2 keeps the data filled in 185ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > payment > AC-03.25 REQ-03.21 the simulated gateway is in step 3 with "approved" selected by default and no card fields 94ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > payment > AC-03.3 AC-03.23 while processing the button is locked, keeps the focus and the other controls are disabled 76ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.19 REQ-01.21 the birth date is stored exactly as typed, YYYY-MM-DD 64ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.21 REQ-01.24 the stored values are restored when the page is opened again (reload) 72ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > payment > AC-03.22 a double click, a held Enter or Enter plus click produce exactly one payment attempt 101ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > payment > AC-03.3 AC-03.27 AC-03.28 an approved payment shows the confirmation and keeps only a minimal record 108ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.22 data is separated by country 183ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.23 a stored option that no longer exists leaves the select empty, with a warning 72ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.24 a stored value that breaks a new validation is shown and fails on continue 71ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > REQ-01.26 a corrupt stored entry is discarded and the form starts empty 69ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > payment > AC-03.4 AC-03.26 a rejection shows the Strapi message as an alert, keeps everything and allows a retry 143ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.9 REQ-01.5 without published fields shows the empty message of the country and no continue 43ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.20 without a field with role birthDate shows the generic error, no continue, and warns 61ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.35 a missing continue text shows the generic error instead of the form, with no default text 29ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > payment > REQ-03.22 leaving the summary during the payment discards it: no confirmation 145ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.25 skipped malformed fields do not break the rest of the form 166ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > formStepState (pure) > REQ-01.13 G2-2 the states use only Strapi texts 2ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > payment > AC-03.29 REQ-03.28 after a successful payment the summary is not reachable: it goes to an empty step 1 141ms
 ✓  car-insurance-quote  src/app/features/summary-step/summary-step-page.spec.ts > SummaryStepPage > payment > AC-03.24 no request other than GET is made while paying (the fake CMS only reads) 78ms

 Test Files  45 passed (45)
      Tests  457 passed (457)
   Start at  01:01:48
   Duration  17.58s (environment 77%, tests 15%, setup 6%, import 2%, transform 1%)
```

Código de salida: `0`. Resumen: **45 archivos, 457 tests, 457 pasan, 0 fallan** (388 de las fases 4a a 4c, y 69 nuevos en 6 archivos nuevos).

### Formato

```text
$ npx prettier --check "src/**/*.{ts,html,css}" vitest-base.config.mts
Checking formatting...
All matched files use Prettier code style!
```

### `grep` de reglas

Ejecutados en `frontend/`. Cada bloque es el comando exacto seguido de su salida.

```text
$ grep -rnE ":\s*any\b|<any\b|\bas any\b|\bany\[\]|Array<any>|Record<[^>]*any>|\$any\(" src --include="*.ts" --include="*.html"
(sin resultados)

$ grep -rnE "\*ngIf|\*ngFor|\*ngSwitch" src
(sin resultados)

$ grep -rnE "NgModule|CommonModule|ReactiveFormsModule|FormGroup|FormControl|NgModel|FormsModule" src
(sin resultados)

$ grep -rnE "innerHTML|outerHTML|bypassSecurityTrust|DomSanitizer|insertAdjacentHTML" src --exclude="*.spec.ts"
src/app/features/summary-step/terms/terms-blocks.ts:7: * lists only, built with `@if`/`@for` and interpolation. No `innerHTML`, no `DomSanitizer`, no
src/app/features/summary-step/terms/terms-blocks.ts:8: * `bypassSecurityTrust*` (REQ-03.16, AC-03.14). A Strapi heading of level n becomes `h(n+2)`,

$ grep -rnE "innerHTML" src --include="*.spec.ts"
src/app/features/summary-step/summary-step-page.spec.ts:118:      expect(w.root().innerHTML).not.toContain('1234567890');
src/app/features/summary-step/summary-step-page.spec.ts:132:      expect(w.root().innerHTML).not.toContain('12.345.678-5');

$ grep -rnE "LOCALE_ID|registerLocaleData" src
(sin resultados)

$ grep -rnE "localStorage|serviceWorker|isComplete.*setItem" src
(sin resultados)

$ grep -rln "sessionStorage" src
src/app/core/storage/wizard-storage.ts

$ grep -rn "Math.round" src/app --include="*.ts" | grep -v "spec.ts"
src/app/domain/pricing/compute-final-price.ts:68: * `finalPrice = Math.round(basePrice × Π factor(role, operand))`, where each factor is the
src/app/domain/pricing/compute-final-price.ts:109:  return { finalPrice: Math.round(price), appliedFactors };
src/app/features/plans-step/plan-views.ts:11:  /** `Math.round(basePrice × Π factors)` (REQ-02.8, REQ-02.11). */

$ grep -rnE "Math.random" src/app --include="*.ts"
(sin resultados)

$ grep -rnE "today=|__TEST__|isE2E|outcome=" src
(sin resultados)

$ grep -rnE "http\.(post|put|patch|delete)\(|method:\s*.(POST|PUT|PATCH|DELETE)" src --include="*.ts"
(sin resultados)

$ grep -rniwE "card|tarjeta|cvv|iban" src/app --include="*.html" --include="*.ts" --exclude="*.spec.ts"
src/app/features/summary-step/payment/mock-payment-gateway.ts:20: * card data. Aborting (the person left the summary) rejects with an `AbortError` and the pending

$ grep -rLE "ChangeDetectionStrategy.OnPush" $(grep -rlE "@Component\(" src/app --include="*.ts" | grep -v "spec.ts")
(sin resultados)
```

Lectura:

- No hay `any` (tampoco `$any()` en las plantillas), ni `*ngIf`/`*ngFor`, ni NgModules. Todos los componentes son `OnPush`.
- **ADR-0006:** fuera de los tests no hay `innerHTML`, `DomSanitizer` ni `bypassSecurityTrust`; las dos líneas que aparecen son el comentario que lo declara. Los tests sí leen `innerHTML`, para comprobar que el documento completo no está en el DOM (AC-03.5, AC-03.6).
- **D9 y REQ-03.20:** solo hay `GET`, ningún `Math.random` y ningún campo de tarjeta. La única aparición de "card" es el comentario que dice que no la hay.
- `sessionStorage` solo aparece en `core/storage/`, y el redondeo solo se ejecuta en `domain/pricing/`.

## Cobertura de criterios de US-03

Las rutas son relativas a `frontend/src/app/`. "E2E" indica la parte que corresponde al QA Engineer en `e2e/` (ADR-0007).

| AC | Test (archivo › nombre) | Resultado |
|---|---|---|
| AC-03.1 | `features/summary-step/summary-step-page.spec.ts › AC-03.1 shows my data, my vehicle data and the chosen plan with its final price` | ✅ Pass |
| AC-03.2 | `summary-step-page.spec.ts › AC-03.2 shows the terms of the country and the pay button is disabled until they are accepted` | ✅ Pass |
| AC-03.3 | `summary-step-page.spec.ts › AC-03.3 AC-03.23 while processing the button is locked …`, `› AC-03.3 AC-03.27 AC-03.28 an approved payment shows the confirmation …` | ✅ Pass |
| AC-03.4 | `summary-step-page.spec.ts › AC-03.4 AC-03.26 a rejection shows the Strapi message as an alert, keeps everything and allows a retry` | ✅ Pass |
| AC-03.5 | `summary-step-page.spec.ts › AC-03.5 the Colombian document is masked, the type in clear, and the full value is not in the DOM`; `summary-values.spec.ts › AC-03.5 REQ-03.6 …` | ✅ Pass |
| AC-03.6 | `summary-step-page.spec.ts › AC-03.6 the Chilean RUT is masked keeping its separators`; `summary-values.spec.ts › AC-03.6 …` | ✅ Pass |
| AC-03.7 | `domain/masking/mask-document.spec.ts › AC-03.7 …` (6 casos, 4a) | ✅ Pass |
| AC-03.8 | `summary-values.spec.ts › AC-03.8 …` (3); `summary-step-page.spec.ts › AC-03.8 values are readable …` | ✅ Pass |
| AC-03.9 | `summary-step-page.spec.ts › AC-03.9 the price is recalculated from the stored plan id and follows a change of step 1` (compara con el precio del paso 2) | ✅ Pass |
| AC-03.10 | `summary-step-page.spec.ts › AC-03.10 edit data: full document in step 1, then step 2 with the plan, then the summary with terms unchecked` | ✅ Pass |
| AC-03.11 | `summary-step-page.spec.ts › AC-03.11 change plan: step 2 with the plan marked, choose another and the summary shows it` | ✅ Pass |
| AC-03.12 | `summary-step-page.spec.ts › AC-03.12 unchecking the terms disables the pay button again` | ✅ Pass |
| AC-03.13 | `summary-step-page.spec.ts › AC-03.13 when no terms are published …`, `› … when the published terms are empty …`, `› AC-03.13 when more than one terms record arrives …`; `core/cms/terms-mapper.spec.ts › REQ-03.18 …` (4a) | ✅ Pass |
| AC-03.14 | `terms/terms-blocks.spec.ts › AC-03.14 HTML in the content is shown as literal text and no element is inserted`; `summary-step-page.spec.ts › AC-03.14 …`; `terms-mapper.spec.ts › AC-03.14 …` (4a) | ✅ Pass |
| AC-03.15 | `terms-blocks.spec.ts › REQ-03.15 …`; `summary-step-page.spec.ts › AC-03.32 …` (los términos vienen de C7 del país) | ✅ Pass (parte unit). Cambio en Strapi y recarga: E2E por intercepción + G5 |
| AC-03.16 | `summary-step-page.spec.ts › AC-03.16 REQ-03.31 while loading, each pending section shows "cargando" and pay is disabled` | ✅ Pass |
| AC-03.17 | `summary-step-page.spec.ts › AC-03.17 a terms failure shows "error de carga" there; retrying shows them and they can be accepted` | ✅ Pass |
| AC-03.18 | `features/summary-step/plan-selected-guard.spec.ts › REQ-03.13 …` (4c); `features/form-step/validation/step1-complete-guard.spec.ts › REQ-03.13 …` (4b) | ✅ Pass |
| AC-03.19 | `summary-step-page.spec.ts › AC-03.19 a stored plan that is no longer available goes to step 2, which warns and selects nothing` | ✅ Pass |
| AC-03.20 | `summary-step-page.spec.ts › AC-03.20 data that no longer meets the configuration goes to step 1 with the data kept` | ✅ Pass |
| AC-03.21 | `summary-step-page.spec.ts › AC-03.21 …`; `summary-values.spec.ts › AC-03.21 …` | ✅ Pass |
| AC-03.22 | `summary-step-page.spec.ts › AC-03.22 a double click, a held Enter or Enter plus click produce exactly one payment attempt` | ✅ Pass. Se simula con clics repetidos: en el navegador, Enter y Espacio sobre un botón generan `click`. El teclado real lo cubre el E2E |
| AC-03.23 | `summary-step-page.spec.ts › AC-03.3 AC-03.23 while processing the button is locked, keeps the focus and the other controls are disabled` | ✅ Pass |
| AC-03.24 | `summary-step-page.spec.ts › AC-03.25 REQ-03.21 … and no card fields`, `› AC-03.24 no request other than GET is made while paying …`; `payment/mock-payment-gateway.spec.ts › REQ-03.20 D9 no request of any kind is made` | ✅ Pass (parte unit). Inspección de red real: E2E |
| AC-03.25 | `summary-step-page.spec.ts › AC-03.25 REQ-03.21 the simulated gateway is in step 3 with "approved" selected by default …`, y los tests de aprobado y rechazado | ✅ Pass |
| AC-03.26 | `summary-step-page.spec.ts › AC-03.4 AC-03.26 …` (el mensaje desaparece al iniciar el reintento) | ✅ Pass |
| AC-03.27 | `domain/quote-number/create-quote-number.spec.ts › AC-03.27 …` (4a); `summary-step-page.spec.ts › AC-03.3 AC-03.27 AC-03.28 …` (`CO-20261122-AAAAAA` con fuente fija) | ✅ Pass |
| AC-03.28 | `features/confirmation/confirmation-page.spec.ts › AC-03.28 AC-03.31 reloading shows the same number …`; `summary-step-page.spec.ts › AC-03.3 AC-03.27 AC-03.28 …` (solo queda `ciq.v1.co.confirmation`, sin documento) | ✅ Pass |
| AC-03.29 | `summary-step-page.spec.ts › AC-03.29 REQ-03.28 after a successful payment the summary is not reachable: it goes to an empty step 1` | ✅ Pass (parte unit). El "atrás" real del navegador: E2E |
| AC-03.30 | `confirmation-page.spec.ts › AC-03.30 REQ-03.29 opening the confirmation without a payment in this session goes to step 1` | ✅ Pass |
| AC-03.31 | `confirmation-page.spec.ts › AC-03.28 AC-03.31 …`, `› AC-03.31 REQ-03.28 "nueva cotización" deletes the confirmation and opens an empty step 1` | ✅ Pass |
| AC-03.32 | `summary-step-page.spec.ts › AC-03.32 data and terms are separated by country`; `confirmation-page.spec.ts › REQ-03.37 …`; `plan-selected-guard.spec.ts › REQ-03.37 …` | ✅ Pass |
| AC-03.33 | `summary-step-page.spec.ts › REQ-03.16 the terms region is focusable, scrollable and named by its heading` | ✅ Pass (estructura). Recorrido con Tab, Espacio y flechas: E2E + G5 |
| AC-03.34 | `summary-step-page.spec.ts › AC-03.34 REQ-03.33 the focus is on the heading …`, `› AC-03.34 REQ-03.17 the checkbox is named by its label and the disabled button points to the hint`, `› AC-03.3 AC-03.23 …` (`aria-live="polite"`, el foco se queda en el botón), `› AC-03.4 AC-03.26 …` (`role="alert"`); `confirmation-page.spec.ts › AC-03.34 REQ-03.33 …` | ✅ Pass (lector de pantalla real: G5) |
| AC-03.35 | — | ⏭ No cubierto por unit: viewports 320, 375 y 1280. E2E + G5 |
| AC-03.36 | Filas 1 y 2: `summary-step-page.spec.ts › AC-03.36 a missing checkbox label …`, `› AC-03.36 a missing rejection message …`. Fila 3 (falta también el genérico): `core/cms/country-mapper.spec.ts › REQ-01.13 without genericErrorMessage the configuration is not interpretable` + `country-shell.spec.ts › AC-01.8 …` (4a), que muestran "error de carga" + "reintentar" | ✅ Pass |

Otros tests nuevos:

- `summary-step-page.spec.ts › REQ-03.22 leaving the summary during the payment discards it: no confirmation`, `› REQ-03.32 a failure of the plans …` y `› REQ-03.38 a missing page title …`.
- `mock-payment-gateway.spec.ts` (REQ-03.24: 1500 ms por defecto e inyectable; aborto).
- `payment/payment-state.spec.ts` (REQ-03.19: tabla de condiciones).
- `terms-blocks.spec.ts` (listas ordenadas, marcas anidadas, niveles de encabezado).
- `confirmation-page.spec.ts` (confirmación corrupta y texto ausente).

## Fallos y causa

En la ejecución final no falla ningún test. Estas son las incidencias de la fase, con su causa y su corrección:

| # | Síntoma | Causa | Corrección |
|---|---|---|---|
| 1 | `ng build`: TS2769 en `summary-values.ts` | Con el `lib` del proyecto, `Intl.NumberFormatOptions.useGrouping` solo admite `boolean`, no `'auto'`. Y `true` no equivale al valor por defecto: en `es`, `'auto'` no agrupa números de 4 cifras y `true` sí | Solo se pasa `{ useGrouping: false }` para el año del vehículo; el resto de números usa el formato por defecto del locale |
| 2 | Dos tests de `country-shell.spec.ts` (4a) dejaron de pasar: un timeout en `/co/summary` y "D7 the confirmation is not a step" | Es lo esperado: el resumen pide ahora los términos (C7), que el handler de ese spec dejaba pendientes, y `confirmationGuard` envía a `/co/form` cuando no ha habido pago (REQ-03.29) | El handler responde a C7 con la fixture de `api-contracts.md`, y el test de la confirmación guarda antes una confirmación |
| 3 | Una aserción del test de AC-03.24 no comprobaba nada (`console.warn` sin "POST") | Era un fallo de calidad del test, no de la app | La quité. Lo que se comprueba es que no hay `fetch` ni XHR, que no hay campos de entrada y que la pasarela no hace peticiones |

**Controles de los propios tests (mutación):**

- Quitar la guarda de estado de `pay()` hace fallar `AC-03.22 … exactly one payment attempt`.
- No enmascarar el documento hace fallar 5 tests (AC-03.5 y AC-03.6, en unit y en página, y `REQ-03.6 every field with role documentNumber is masked`).
- No borrar `ciq.v1.{cc}.step1` tras el pago hace fallar `AC-03.3 AC-03.27 AC-03.28 …` y `AC-03.29 …`.

Después de cada mutación restauré el código y volví a ejecutar la suite completa (salida de arriba).
