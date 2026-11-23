# Test report — US-02 (plan list), phase 4c

| Field | Value |
|---|---|
| Author | Angular Developer (subagent) |
| Date | 2026-11-23 |
| Tested commit | No commit of its own: working tree on top of `f5e47f1` (branch `phase-4/implementation`) with the 4c changes uncommitted. The orchestrator makes the commit |
| Environment | Node 24.22.3 · npm 11.19.1 · Angular 22.3.0 · TypeScript 6.0.3 · Vitest 5.1.1 · jsdom 31.0.1 · Windows 11 (Git Bash). No Strapi: fixtures in the v5 format of `api-contracts.md` C5 and C6 (`frontend/src/app/features/plans-step/testing/plans-fixtures.ts`, with the seed factors from `pricing-rule.md` §3) |

Scope:

- `features/plans-step/`: order and single recommended plan (`sort-plans.ts`), selection and its restoration (`plan-selection.ts`), paginated C5 data and C6 (`plans-data.ts`), price and format (`plan-views.ts`) and the page with its states.
- `domain/pricing/price-inputs.ts`: step 1 values by role.
- `features/summary-step/plan-selected-guard.ts` on `/:country/summary`.

The outputs are pasted as they are. Only the ANSI color codes were removed (`sed 's/\x1b\[[0-9;]*m//g'`). The exit codes were captured with `set -o pipefail`.

## Command and real output

### Build

```text
$ npx ng build
❯ Building...
✔ Building...
Initial chunk files | Names                  |  Raw size | Estimated transfer size
main-OPQP7RGG.js    | main                   | 293.33 kB |                79.58 kB
styles-32OBUCRH.css | styles                 | 583 bytes |               583 bytes

                    | Initial total          | 293.92 kB |                80.16 kB

Lazy chunk files    | Names                  |  Raw size | Estimated transfer size
chunk-BteKimOF.js   | form-step-page         |  61.69 kB |                16.14 kB
chunk-D2wYjpf5.js   | plans-step-page        |  12.14 kB |                 4.10 kB
chunk-BXmHMlsT.js   | country-shell          |   5.43 kB |                 1.93 kB
chunk-Qy5lyQf7.js   | country-selection-page |   2.51 kB |                 1.16 kB
chunk-CYBlzLKp.js   | -                      |   1.35 kB |               655 bytes
chunk-D7CX2D4n.js   | -                      |   1.28 kB |               632 bytes
chunk--eY3ftWO.js   | -                      |   1.03 kB |               528 bytes
chunk-Dsz_RMjE.js   | -                      | 625 bytes |               625 bytes
chunk-COT9XSbV.js   | -                      | 529 bytes |               529 bytes
chunk-l0cg_8xC.js   | confirmation-page      | 467 bytes |               467 bytes
chunk-CkkDwpmw.js   | summary-step-page      | 461 bytes |               461 bytes

Application bundle generation complete. [9.483 seconds] - 2026-11-23T05:44:55.520Z

Output location: C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend\dist\car-insurance-quote
```

Exit code: `0`.

### Unit tests

```text
$ npx ng test --watch=false --reporters=verbose
Using Vitest configuration file: C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend\vitest-base.config.mts
❯ Building...
✔ Building...
Application bundle generation complete. [15.218 seconds] - 2026-11-23T05:45:15.422Z


 RUN  v5.1.1 C:/Users/Jorge Andres/Documents/_SURA/car-insurance-quote-multicountry/frontend

 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > AC-02.6 orders by order, ties by name, empty order last: Basic, Gold, Plus, Lite 106ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > REQ-02.4 several plans without order keep name order after the ordered ones 3ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > REQ-02.4 the name is compared with the locale of the country 3ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > REQ-02.4 with same order and name, the documentId decides 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > sortPlans > REQ-02.4 is pure: the input array is not modified 2ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > recommendedPlanId > AC-02.7 with Basic (order 1) and Gold (order 2) recommended, only Basic is highlighted 2ms
 ✓  car-insurance-quote  src/app/features/plans-step/sort-plans.spec.ts > recommendedPlanId > Q-02.1 with no plan marked nothing is highlighted 1ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.1 requests C3 and C4 only for the country of the URL and builds a ready config 489ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > AC-01.6 an unknown country gives notAvailable 157ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > Q-01.20 the configuration is requested once per app load and country 15ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.4 a failure puts the resource in error and "reintentar" requests it again 61ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.7 logs a warning for each skipped field, without user data 63ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > ADR-0004 whenSettled resolves with the result for the step guards, or null on error 40ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > ADR-0004 whenSettled resolves immediately when the configuration is already loaded 184ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.3 AC-01.7 shows only the fixed "cargando" while the configuration loads 1832ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 1: an empty <input type="number"> writes null (not NaN) to a number | null model 595ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > REQ-03.13 with a complete step 1 but no chosen plan, the summary redirects to step 2 2166ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 1: a decimal is kept as a number (the integer rule is ours) 232ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 2: <input type="date"> keeps a string model as "YYYY-MM-DD" in both directions 221ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 3: FormField sets the native required property but no aria-invalid nor aria-describedby 63ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > touched becomes true on blur (error shown after the first blur) 45ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > a checkbox writes a boolean 25ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.35 sends a GET to the relative /api URL, without Authorization nor credentials 17ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-02.21 each request has a 10 000 ms timeout 7ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.6 the query is encoded by HttpParams and carries no status parameter 6ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > AC-02.32 REQ-02.24 walks every page in series and concatenates the data 12ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-02.24 a single page is not requested again 16ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an HTTP 500 is a request error 23ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 a network error (or timeout) is a request error 9ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (data missing) is a contract error 11ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.1 REQ-02.1 shows the active plans of the country in the configured order 2327ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (data is not an array) is a contract error 25ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (body is not an object) is a contract error 8ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.2 a single type must have an object in data; a 404 is an error 10ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > ADR-0004 aborting (resource cancelled) cancels the HTTP request 10ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > AC-02.22 without step 1 data for Chile, "/cl/plans" redirects to "/cl/form" and no plan is requested 3152ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > AC-01.5 lists the published countries with their Strapi names, and Chile goes to "/cl" 2876ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.5 the plans of another country are never shown 204ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.2 every text of "/" comes from Strapi (country-selection) 206ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.3 shows the fixed "cargando" while loading 58ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.4 if country-selection is not published (404) shows "error de carga" and retries 94ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > AC-01.8 shows "error de carga" + "reintentar" and retrying shows the step 1157ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > G3-10 a missing required text of "/" is shown as "error de carga", without defaults 82ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > AC-02.22 valid data that a new required field makes incomplete redirects to step 1, keeping the data 355ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-views.spec.ts > buildPlanViews > AC-02.9 E1: CO base 1 200 000, 2018 and 2000-05-10 → $ 1.320.000 (with U+00A0) 4ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-views.spec.ts > buildPlanViews > AC-02.9 E4 and E6: CL prices with the seed factors of Chile 3ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-views.spec.ts > buildPlanViews > AC-02.10 without factors each plan shows its base price 2ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-views.spec.ts > buildPlanViews > REQ-02.5 only the first recommended plan in display order is highlighted 3ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > REQ-03.13 with a complete step 1 and a chosen plan, the summary opens 153ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.2 AC-02.7 only the first recommended plan is highlighted, with a visible text label 233ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.1 shows only the fields of the country, in sections and in the configured order 1990ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 loading is announced as status with the fixed "cargando" 22ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 REQ-01.4 error is an alert with "error de carga" and a "reintentar" button that emits 20ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 a Strapi message is announced as an alert 14ms
 ✓  car-insurance-quote  src/app/core/country/country-route-reuse-strategy.spec.ts > CountryRouteReuseStrategy > REQ-01.25 a route component is created again when the country changes 127ms
 ✓  car-insurance-quote  src/app/core/country/country-route-reuse-strategy.spec.ts > CountryRouteReuseStrategy > REQ-01.25 within the same country the component is reused (only the query changes) 63ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.1 requests only the configuration of the country of the URL 247ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 shows the 3 steps (D7) in an ordered list inside a named nav 20ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 only the current step has aria-current="step" 21ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 the step number is decorative for assistive technologies 35ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > AC-01.6 "/CO" is redirected to "/co" (and then to its first step) 34ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 only the case of the country segment changes: "/CO/plans?x=1" → "/co/plans?x=1" 39ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 a lower-case code passes, even if it is unknown (the shell shows "país no disponible") 35ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 lowercaseFirstSegment leaves the rest of the URL untouched 3ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > REQ-03.13 an incomplete step 1 wins: without step 1 and without plan, it goes to step 1 846ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.9 AC-02.8 each plan shows its final price from the step 1 data, in COP without decimals 226ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > AC-03.27 matches ^CO-20261122-[A-HJ-NP-Z2-9]{6}$ with a fixed clock 6ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > AC-03.27 the same random source always gives the same number 2ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > REQ-03.26 uses the UTC date of the payment 1ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > REQ-03.26 the alphabet has 32 symbols without 0, O, 1 or I, for every byte value 6ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > ADR-0004 keys are ciq.v1.{cc}.{kind} 9ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.25 a key is only built from a validated lower-case country code 10ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.23 stores only the step 1 values, without any completed flag 7ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > AC-01.22 REQ-01.25 data of one country is never read from another 7ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 corrupt JSON is discarded with a warning and the key is removed 13ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 an unexpected shape is discarded 7ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 a value of an unexpected type is dropped on its own, without logging the value 6ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 a non-finite number is not a valid stored value 6ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-02.16 the plan stores only its documentId 8ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-02.17 an invalid stored plan is discarded 12ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-03.28 the confirmation round-trips and an incomplete one is discarded 7ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.26 REQ-01.12 each section is a fieldset with its Strapi legend, policyholder first 322ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-03.28 remove deletes only the given key of the given country 8ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > ADR-0004 a storage that throws does not break the app 12ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C1 published countries > AC-01.5 maps the published countries with the names from Strapi, in the received order 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C1 published countries > REQ-01.7 drops items with an invalid code or without name, and duplicated codes 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.2 maps the texts of "/" from Strapi 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.2 intro is optional 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.13 a missing heading or list label is not interpretable (null → error state) 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.1 maps market data and texts of the requested country 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > AC-01.6 no country with that code → notAvailable 4ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 more than one country with the code is not interpretable 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is not an integer) is not interpretable 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is negative) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is missing) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (currency is not ISO 4217) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (intlLocale is empty) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (code does not match) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.13 without genericErrorMessage the configuration is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > AC-01.35 a blank continue text marks the form step as configError, without defaults 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-03.38 a missing summary text only breaks its own section 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.13 texts are trimmed 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.1 a complete configuration is ready 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.13 a missing step 1 text makes the form configError before empty or unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.13 a missing section legend (wizard texts) also makes the form configError 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > AC-01.20 the documented C4 example lacks birthDate and documentNumber → unavailable 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 identifies the fields with roles documentNumber, birthDate and vehicleYear 8ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 gives the option label of each select, not only the value 7ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 reports a valid step 1 as complete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 when the business makes a stored value invalid, the result becomes incomplete 5ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-02.22 a new required field makes the stored data incomplete 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.20 a change of minimum age revalidates the birth date 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 no data at all is incomplete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is empty is never complete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is unavailable is never complete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is configError is never complete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 exposes normalised values: text trimmed 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.23 normalised values to store: trimmed text, NaN → null, only current fields 7ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.8 Chile shows CLP: "$21.589" (19 990 × 1.08, rounded once) 261ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-02.19 a complete step 1 lets the plans step open 308ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 maps the documented C4 example to the domain 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.28 a configuration with the three roles is ready 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.20 without a field with role birthDate the form is unavailable and warns 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.5 no valid field → empty 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.25 a field with an unknown type and a field without label are skipped with one warning each 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.7 an element that is not an object, an invalid key or an unknown section is skipped 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 orders by fixed section, then order ascending, empty order last, ties by key 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.10 swapping order in Strapi swaps the fields on screen 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 a repeated key keeps the first by order and warns 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.13 select options keep the Strapi order; invalid and repeated values are dropped 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.11 a select without valid options is skipped 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.14 required is true only when Strapi says exactly true 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.9 empty help text and error message become null 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.15 keeps the validations of the catalog for each type, with decimal values as strings 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.15 the pattern is anchored to the whole value 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.15 validations of another type or with invalid parameters are ignored, the field stays 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.28 a role on an incompatible type is ignored with a warning (and G2-5 applies) 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.22 several fields with the same role keep it on all of them 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.7 a non-integer order is treated as empty with a warning 2ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 todayLocal gives the local calendar date as YYYY-MM-DD 3ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > AC-01.19 dates are not shifted by the time zone (America/Bogota, 20:00 local = 01:00 UTC next day) 6ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 control: changing TZ really changes the local date (Asia/Tokyo is a day ahead) 2ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 CLOCK is injectable and can be replaced in tests 7ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 the default CLOCK returns the current date 10ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > REQ-03.37 a plan chosen in Colombia does not open the summary of Chile 305ms
 ✓  car-insurance-quote  src/app/app.spec.ts > App > ADR-0004 G3-9 shows the global "cargando" while a guard keeps the navigation pending 47ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.10 without price factors each plan shows its base price 156ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.14 a value of only spaces is blank 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > Q-01.16 lengths count characters of the trimmed value 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > Q-01.16 the pattern covers the whole value 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.15 number rules: min, max and integer 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.15 ruleHolds only accepts the value type of each rule 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with pattern and value ABC123 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with pattern and value ABC12 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with maxLength and value ABCDEF → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 number with min and value 0 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 number with integer and value 2.5 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.14 a required text left empty or with only spaces is invalid 1ms
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
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2008-11-22 → valid=true 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2008-11-23 → valid=false 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2026-11-23 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-02-28, 2008-02-29 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-03-01, 2008-02-29 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.20 the legal age uses the minimum age of the country 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.22 the role rules cannot be switched off: an optional birthDate or vehicleYear is still required 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.21 a date that is not a calendar date YYYY-MM-DD is invalid 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.26 a value of an unexpected type is invalid 1ms
 ✓  car-insurance-quote  src/app/features/summary-step/plan-selected-guard.spec.ts > planSelectedGuard > ADR-0004 a corrupt stored plan counts as no plan 242ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-selection.spec.ts > restorePlanSelection > REQ-02.16 a stored plan that is still available is preselected 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-selection.spec.ts > restorePlanSelection > AC-02.21 REQ-02.17 a stored plan that is no longer in the list is discarded 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-selection.spec.ts > restorePlanSelection > REQ-02.15 without a stored plan nothing is selected and there is no notice 1ms
 ✓  car-insurance-quote  src/app/features/plans-step/plan-selection.spec.ts > restorePlanSelection > REQ-02.22 with an empty list a stored plan is discarded 0ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E1 final price is 1320000 3ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E2 final price is 1440000 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E3 final price is 1221875 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E4 final price is 38985 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E5 final price is 25990 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E6 final price is 21589 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 reports the multiplier applied for each role (E3: both limits inclusive) 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.10 without price factors the final price is the base price 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.11 without a value for birthDate its factor is 1 and vehicleYear still applies 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.10 a value that cannot be interpreted gives factor 1 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.12 a vehicle from next year uses vehicle age 0 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.13 a band with multiplier 0 is ignored and the remaining valid bands apply 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 bands with a negative or non-finite multiplier or min > max are discarded 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 with overlapping bands the first in the configured order wins 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 a band with an incompatible role and operand is discarded (G3-10) 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.11 rounds once at the end, not after each factor 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.8 is pure: same inputs give the same output and the rules are not modified 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.8 depends on the reference date passed in, not on the clock 1ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a text field is a native control with its label 268ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.9 maps the documented C6 example in the configured order 2ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > AC-02.10 null or empty priceFactors → no rules (final price = base price) 5ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > AC-02.13 a band with multiplier 0 is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with min > max is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with negative multiplier is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with non numeric multiplier is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with non-integer limit is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with unknown role is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with unknown operand is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with incompatible role and operand (G3-10) is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.9 a decimal multiplier serialised as a string is accepted (ADR-0005) 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.21 a country unpublished between steps (no data) is an error 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.3 maps the documented C5 example to the domain 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.2 a plan that is not active (false or null) is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > AC-02.14 a plan with another currency is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > AC-02.15 a plan without base price is discarded and the others are kept 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (empty name) is discarded with a warning 3ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (base price 0) is discarded with a warning 14ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (negative base price) is discarded with a warning 6ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (non numeric base price) is discarded with a warning 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (empty documentId) is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a numeric string base price is accepted 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.3 null coverages or benefits are empty lists and blank labels are omitted 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.4 empty or non-integer order is null; recommended is true only when exactly true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.24 restores the stored values of the current fields 6ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 without stored data every field starts empty, by type 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > AC-01.23 a removed field and a removed option are discarded; make must be chosen again 5ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > AC-01.24 a stored value that breaks a new validation is kept and revalidated as invalid 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a new published field starts empty and the rest is kept 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a changed field type discards a value that does not fit the new type 6ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (text with a number) is discarded on its own 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (number with a string) is discarded on its own 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (checkbox with a string) is discarded on its own 7ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (date that is not YYYY-MM-DD) is discarded on its own 6ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (select with null) is discarded on its own 5ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > US-01 §7 warnings never contain the stored values 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-03.13 the summary also requires a complete step 1 312ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.15 maps the documented C7 example: paragraph and unordered list with bold 3ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.16 supports ordered lists, headings, quotes, marks and links (text only) 2ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > AC-03.14 HTML inside the text is kept as literal text, never as a node 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.16 unknown, code and image nodes are degraded to plain text or omitted, with a warning 2ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are null → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are an empty list → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are blocks without text → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 more than one country record → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.32 no country (unpublished between steps) is an error 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C1 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C2 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 Colombia: "$ 1.320.000" with U+00A0 between "$" and the number 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 Chile: "$38.985" without separator after "$" 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 the price has no decimal part 3ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > REQ-02.6 locale and currency come from the arguments (Strapi), not from code 8ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C3 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C4 never asks for drafts: no status nor publicationFilter 0ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C5 never asks for drafts: no status nor publicationFilter 0ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C6 never asks for drafts: no status nor publicationFilter 0ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C7 never asks for drafts: no status nor publicationFilter 0ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.1 country requests filter only by the country of the URL 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.24 collections that can grow ask for an explicit page size of 100 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.2 plans are filtered by active = true 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > api-contracts C3 asks for the five text components and pageSize 2 to detect duplicates 2ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.9 price factors are requested without texts 2ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a number field is a native control with its label 321ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.31 AC-01.27 the step indicator marks the current step with aria-current="step" 445ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "1234567890" → "******7890" 3ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "12.345.678-5" → "**.***.678-5" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "E-123456" → "*-***456" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "12345" → "***45" 0ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "1234" → "**34" 0ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "7" → "*" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.5 the full Colombian document does not appear in the masked value 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.6 the full RUT does not appear and separators are kept 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > REQ-03.7 spaces are separators and never more than half is shown 1ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > D7 form, plans and summary are steps 1-3; the confirmation is not a step 2ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > REQ-01.13 the heading of each screen is its Strapi title 3ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > REQ-01.13 any missing text of the screen gives the generic error, never a default 2ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > REQ-02.3 shows description, coverages and benefits as lists; an empty list is not shown 204ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2005 → valid=false 4ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2006 → valid=true 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2026 → valid=true 0ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2027 → valid=true 0ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2028 → valid=false 0ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-01.19 only integers are valid 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-01.19 the current year comes from the reference date, limits inclusive 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-02.12 a vehicle from next year has vehicle age 0, not -1 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-02.8 vehicle age is the difference of years (E1, E3, E4) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-02.10 a non-integer year has no vehicle age 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-01.25 complete data of Colombia does not open the plans of Chile 273ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 parses a YYYY-MM-DD calendar date without time zone 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-02-30" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2025-02-29" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-13-01" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-00-10" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-1-1" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-11-22T00:00" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "" as a calendar date 0ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.20 knows leap years (29 February rule) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 compares calendar dates by day 2ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2008-11-22 → valid=true (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2008-11-23 → valid=false (minimum age 18) 0ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2026-11-23 → valid=false (minimum age 18) 0ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-02-28, birth date 2008-02-29 → valid=false (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-03-01, birth date 2008-02-29 → valid=true (minimum age 18) 0ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.20 a future birth date is invalid even with minimum age 0 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.20 uses the minimum age of the country from Strapi 0ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.21 a value that is not a calendar date is invalid 0ms
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
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-02.8 gives the ages of the price examples E1-E6 (reference 2026-11-22) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.20 a future birth date gives a negative age 1ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.21 returns null for values that are not calendar dates 1ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.31 the focus goes to the heading of the step and document.title follows it 465ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > ADR-0004 if the configuration fails, the guard lets the navigation through and the shell shows the error 130ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > D7 the confirmation is not a step: no step is marked as current 187ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-01.2 an unknown country is not redirected: the shell shows "país no disponible" 133ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > G2-10 the guard never writes a "completed" flag 116ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.14 a plan with another currency is not shown and a warning is logged 405ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a select field is a native control with its label 418ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > ADR-0001 "/co" and unknown sub-paths redirect to "/co/form" 115ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.15 a plan without base price is not shown and the others are 118ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a date field is a native control with its label 122ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > AC-01.6 an unknown code shows "país no disponible" and the published countries as links 124ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.2 a code that cannot be a country is not requested to Strapi 40ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.32 more plans than the default page size are all listed 128ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a checkbox field is a native control with its label 111ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.2 if the country list fails, "país no disponible" shows "error de carga" + "reintentar" 62ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.13 a missing step indicator text shows the generic error instead of the wizard 57ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-02.32 a missing step title shows the generic error of the country, never a default 110ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.3 a selected plan is checked and continue goes to the summary 155ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 REQ-01.9 the help text is associated with aria-describedby 135ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.17 REQ-02.14 selecting another plan replaces the selection (one radio group) 95ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.16 G2-9 only the documentId of the plan is stored 77ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.13 the select offers exactly the Strapi options, in order, after an empty option 133ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > REQ-01.14 REQ-01.29 required fields are marked visually and with the native required property 111ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.18 continue without a selection shows the Strapi message on the group and moves the focus to it 109ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > REQ-01.31 the focus is on the heading of the step and the indicator marks step 1 123ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.31 the continue button shows the Strapi text 86ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.15 the message is removed once a plan is chosen 94ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.19 the selection survives a reload 71ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 the error is not shown while typing, only after leaving the field 145ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.2 AC-01.26 an invalid field shows its configured message, aria-invalid and aria-describedby 85ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.20 the selection is kept per country 180ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.21 a stored plan that is no longer available is discarded with an announced notice 77ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 the error disappears as soon as the value is valid 86ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 an empty field message falls back to the generic message of the country 71ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.14 a required text with only spaces shows its message and stays on step 1 163ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.16 REQ-01.17 trying to continue shows all errors, focuses the first invalid field and keeps the URL 133ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.17 with an untouched empty form, continue reveals every required error 93ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.16 AC-02.30 after editing step 1 the price is recalculated and the selection is kept 547ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.33 a required checkbox left unchecked shows its message and stays on step 1 116ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.23 the plans are requested again on every entry to the step 188ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > AC-02.27 the group has a name and each option names the plan, price and recommendation 65ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.17 a vehicle year outside 2006-2027 is invalid; 2027 is valid 100ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.18 a policyholder who turns 18 tomorrow is invalid with the field message 86ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > AC-02.28 the focus is on the heading of the step and the indicator marks step 2 67ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > REQ-02.26 the buttons are back (button) and continue (submit of the form) 62ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.4 AC-02.22 with no active plans shows the empty message, no continue, and back to step 1 108ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.32 with a valid form, continue goes to step 2 of the same country and stores the data 247ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > REQ-01.23 every change is stored, normalised (trimmed text), without any completed flag 88ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.23 REQ-02.20 while loading shows the fixed "cargando" as status and no continue 63ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.24 REQ-02.21 a failure shows "error de carga" and "reintentar"; retrying lists the plans 85ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > REQ-02.21 a failure of the price factors is also "error de carga" (no partial prices) 47ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.33 a missing continue text shows the generic error, no plans, and no plan request 30ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > Q-01.16 leaving a text field replaces its value by the trimmed one 76ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.4 going back from step 2 keeps the data filled in 200ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.19 REQ-01.21 the birth date is stored exactly as typed, YYYY-MM-DD 55ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.21 REQ-01.24 the stored values are restored when the page is opened again (reload) 52ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.22 data is separated by country 174ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.23 a stored option that no longer exists leaves the select empty, with a warning 66ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.24 a stored value that breaks a new validation is shown and fails on continue 75ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > REQ-01.26 a corrupt stored entry is discarded and the form starts empty 61ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.9 REQ-01.5 without published fields shows the empty message of the country and no continue 40ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.20 without a field with role birthDate shows the generic error, no continue, and warns 35ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.35 a missing continue text shows the generic error instead of the form, with no default text 29ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.25 skipped malformed fields do not break the rest of the form 134ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > formStepState (pure) > REQ-01.13 G2-2 the states use only Strapi texts 3ms

 Test Files  39 passed (39)
      Tests  388 passed (388)
   Start at  00:45:17
   Duration  18.58s (environment 79%, tests 11%, setup 7%, import 2%)
```

Exit code: `0`. Summary: **39 files, 388 tests, 388 pass, 0 fail** (336 from phases 4a and 4b, and 52 new in 6 new files).

### Formatting

```text
$ npx prettier --check "src/**/*.{ts,html,css}" vitest-base.config.mts
Checking formatting...
All matched files use Prettier code style!
```

### `grep` of the rules

Run in `frontend/`. Each block is the exact command followed by its output.

```text
$ grep -rnE ":\s*any\b|<any\b|\bas any\b|\bany\[\]|Array<any>|Record<[^>]*any>" src --include="*.ts"
(sin resultados)

$ grep -rnE "\*ngIf|\*ngFor|\*ngSwitch" src
(sin resultados)

$ grep -rnE "NgModule|CommonModule|ReactiveFormsModule|FormGroup|FormControl|NgModel|FormsModule" src
(sin resultados)

$ grep -rnE "innerHTML|bypassSecurityTrust|DomSanitizer|LOCALE_ID|registerLocaleData" src
(sin resultados)

$ grep -rnE "localStorage|serviceWorker|isComplete.*setItem" src
(sin resultados)

$ grep -rln "sessionStorage" src
src/app/core/storage/wizard-storage.ts

$ grep -rn "Math.round" src/app --include="*.ts" | grep -v "spec.ts"
src/app/domain/pricing/compute-final-price.ts:68: * `finalPrice = Math.round(basePrice × Π factor(role, operand))`, where each factor is the
src/app/domain/pricing/compute-final-price.ts:109:  return { finalPrice: Math.round(price), appliedFactors };
src/app/features/plans-step/plan-views.ts:11:  /** `Math.round(basePrice × Π factors)` (REQ-02.8, REQ-02.11). */

$ grep -rnE "today=|__TEST__|isE2E" src
(sin resultados)

$ grep -rnE "http\.(post|put|patch|delete)\(" src --include="*.ts"
(sin resultados)

$ grep -rLE "ChangeDetectionStrategy.OnPush" $(grep -rlE "@Component\(" src/app --include="*.ts" | grep -v "spec.ts")
(sin resultados)

$ grep -rnF -e 'COP' -e 'CLP' -e '$ ' -e 'Recomendado' src/app --include='*.html' --include='*.ts' --exclude='*.spec.ts' --exclude-dir=testing
src/app/core/country/country-config.ts:29:  /** ISO 4217 (`COP`, `CLP`). */
src/app/domain/pricing/format-price.ts:5: * written in code. COP and CLP are shown without decimals. Locale data comes from `Intl` at
```

Reading:

- There is no `any` as a type, no `*ngIf`/`*ngFor` and no NgModules. Every component is `OnPush`.
- `sessionStorage` only appears in `core/storage/`.
- `Math.round` only runs in `domain/pricing/compute-final-price.ts`; the line in `plan-views.ts` is a comment.
- There is only `GET`.
- There are no currency symbols or plan texts in the code: the two occurrences of `COP`/`CLP` are documentation comments.

## US-02 criteria coverage

Paths are relative to `frontend/src/app/`. "E2E" marks the part that belongs to the QA Engineer in `e2e/` (ADR-0007).

| AC | Test (file › name) | Result |
|---|---|---|
| AC-02.1 | `features/plans-step/plans-step-page.spec.ts › AC-02.1 REQ-02.1 shows the active plans of the country in the configured order` | ✅ Pass (E2E against the seed: QA) |
| AC-02.2 | `plans-step-page.spec.ts › AC-02.2 AC-02.7 only the first recommended plan is highlighted, with a visible text label` | ✅ Pass |
| AC-02.3 | `plans-step-page.spec.ts › AC-02.3 a selected plan is checked and continue goes to the summary` | ✅ Pass |
| AC-02.4 | `plans-step-page.spec.ts › AC-02.4 AC-02.22 with no active plans shows the empty message, no continue, and back to step 1` | ✅ Pass |
| AC-02.5 | `plans-step-page.spec.ts › AC-02.5 the plans of another country are never shown`; `core/cms/plan-mapper.spec.ts › REQ-02.2 …` and `core/cms/cms-queries.spec.ts › REQ-02.2 …` (4a) | ✅ Pass (unit part). Draft and inactive against the real seed: E2E |
| AC-02.6 | `features/plans-step/sort-plans.spec.ts › AC-02.6 orders by order, ties by name, empty order last: Basic, Gold, Plus, Lite` | ✅ Pass |
| AC-02.7 | `sort-plans.spec.ts › AC-02.7 …`; `plans-step-page.spec.ts › AC-02.2 AC-02.7 …` | ✅ Pass |
| AC-02.8 | `domain/pricing/format-price.spec.ts › AC-02.8 …` (4a); `features/plans-step/plan-views.spec.ts › AC-02.9 E1 … → $ 1.320.000 (with U+00A0)`; `plans-step-page.spec.ts › AC-02.9 AC-02.8 …`, `› AC-02.8 Chile shows CLP …` | ✅ Pass (compared with a literal ` `, without normalizing spaces) |
| AC-02.9 | `domain/pricing/compute-final-price.spec.ts › AC-02.9 E1 … E6` (4a); `plan-views.spec.ts › AC-02.9 E1 …`, `› AC-02.9 E4 and E6 …`; `plans-step-page.spec.ts › AC-02.9 AC-02.8 each plan shows its final price from the step 1 data …` | ✅ Pass |
| AC-02.10 | `plans-step-page.spec.ts › AC-02.10 …`; `plan-views.spec.ts › AC-02.10 …`; `compute-final-price.spec.ts`, `price-factor-mapper.spec.ts › AC-02.10 …` (4a) | ✅ Pass |
| AC-02.11 | `domain/pricing/price-inputs.spec.ts › AC-02.11 …`; `compute-final-price.spec.ts › AC-02.11 …` (4a) | ✅ Pass |
| AC-02.12 | `compute-final-price.spec.ts › AC-02.12 …`, `vehicle-year.spec.ts › AC-02.12 …` (4a) | ✅ Pass |
| AC-02.13 | `compute-final-price.spec.ts › AC-02.13 …`, `price-factor-mapper.spec.ts › AC-02.13 …` (4a) | ✅ Pass |
| AC-02.14 | `plans-step-page.spec.ts › AC-02.14 a plan with another currency is not shown and a warning is logged`; `plan-mapper.spec.ts › AC-02.14 …` (4a) | ✅ Pass |
| AC-02.15 | `plans-step-page.spec.ts › AC-02.15 a plan without base price is not shown and the others are`; `plan-mapper.spec.ts › AC-02.15 …` (4a) | ✅ Pass |
| AC-02.16 | `plans-step-page.spec.ts › AC-02.16 AC-02.30 after editing step 1 the price is recalculated and the selection is kept` (2018 → 2010: 1 320 000 → 1 500 000) | ✅ Pass |
| AC-02.17 | `plans-step-page.spec.ts › AC-02.17 REQ-02.14 selecting another plan replaces the selection (one radio group)` | ✅ Pass |
| AC-02.18 | `plans-step-page.spec.ts › AC-02.18 continue without a selection shows the Strapi message on the group and moves the focus to it`, `› REQ-02.15 the message is removed once a plan is chosen` | ✅ Pass |
| AC-02.19 | `plans-step-page.spec.ts › AC-02.19 the selection survives a reload` | ✅ Pass |
| AC-02.20 | `plans-step-page.spec.ts › AC-02.20 the selection is kept per country` | ✅ Pass |
| AC-02.21 | `features/plans-step/plan-selection.spec.ts › AC-02.21 REQ-02.17 …`; `plans-step-page.spec.ts › AC-02.21 a stored plan that is no longer available is discarded with an announced notice` | ✅ Pass (real change in the admin: E2E by interception + G5) |
| AC-02.22 | `features/form-step/validation/step1-complete-guard.spec.ts › AC-02.22 …` (2, from 4b; they still do not request plans) | ✅ Pass |
| AC-02.23 | `plans-step-page.spec.ts › AC-02.23 REQ-02.20 while loading shows the fixed "cargando" as status and no continue` | ✅ Pass |
| AC-02.24 | `plans-step-page.spec.ts › AC-02.24 REQ-02.21 a failure shows "error de carga" and "reintentar"; retrying lists the plans`, `› REQ-02.21 a failure of the price factors is also "error de carga" …` | ✅ Pass |
| AC-02.25 | — | ⏭ Not covered by unit: change in Strapi and reload. E2E by interception + G5 (G3-3). The unit part, that they are requested again on every entry, is in `› REQ-02.23 …` |
| AC-02.26 | `plans-step-page.spec.ts › REQ-02.26 the buttons are back (button) and continue (submit of the form)`, `› AC-02.17 REQ-02.14 … (one radio group)` | ✅ Pass (structure). Tab, arrows and Space: E2E + G5 |
| AC-02.27 | `plans-step-page.spec.ts › AC-02.27 the group has a name and each option names the plan, price and recommendation`; `› REQ-02.3 … as lists …` | ✅ Pass (real screen reader: G5) |
| AC-02.28 | `plans-step-page.spec.ts › AC-02.28 the focus is on the heading of the step and the indicator marks step 2` | ✅ Pass |
| AC-02.29 | — | ⏭ Not covered by unit: 320, 375 and 1280 viewports. E2E + G5 |
| AC-02.30 | `plans-step-page.spec.ts › AC-02.16 AC-02.30 …` | ✅ Pass |
| AC-02.31 | `core/cms/cms-client.spec.ts › REQ-01.35 sends a GET …` (4a) | ✅ Pass (unit part). Network inspection: E2E |
| AC-02.32 | `cms-client.spec.ts › AC-02.32 REQ-02.24 walks every page …` (4a); `plans-step-page.spec.ts › AC-02.32 more plans than the default page size are all listed` | ✅ Pass |
| AC-02.33 | Scenario 1: `plans-step-page.spec.ts › AC-02.33 a missing continue text shows the generic error, no plans, and no plan request`. Scenario 2 (the generic message is missing too): `core/cms/country-mapper.spec.ts › REQ-01.13 without genericErrorMessage the configuration is not interpretable` + `country-shell.spec.ts › AC-01.8 …` (4a), which show "error de carga" + "reintentar" | ✅ Pass |

Other new tests:

- `features/summary-step/plan-selected-guard.spec.ts` (5): no plan → step 2; with a plan → summary; an incomplete step 1 takes priority; separation by country (REQ-03.37); a corrupt plan counts as "no plan".
- `plans-step-page.spec.ts › REQ-02.16 G2-9 only the documentId of the plan is stored`, `› REQ-02.3 …` and `› REQ-02.23 the plans are requested again on every entry to the step`.

## Failures and cause

No test fails in the final run. These are the issues of the phase, with their cause and fix:

| # | Symptom | Cause | Fix |
|---|---|---|---|
| 1 | Four tests saw the plan label as "Plan PlusRecomendado$ 1.320.000" | **Real accessibility failure.** By default Angular removes the text nodes that only contain whitespace between elements (`preserveWhitespaces: false`), and the accessible name concatenates the inline `span` elements without a separator: a screen reader would read "PlusRecomendado" | `&ngsp;` (the Angular entity that keeps a space) between the name, the "recomendado" label and the price, in `plans-step-page.html`. AC-02.27 compares the exact full name |
| 2 | `AC-02.23` used up the 15 s | Test failure: with C5 pending forever, `open()` waited for `whenStable()`, which never arrives while the `resource()` is loading | The test navigates with the harness and calls `detectChanges()` without waiting for stability, like the shell loading test from 4a |
| 3 | After fix 1, four tests compared two strings that looked equal | Failure of the test helper: `labelOf` normalized with `/\s+/g`, and in JavaScript `\s` includes U+00A0, so it turned the price's non-breaking space into a normal one | Only ASCII spaces are collapsed (`/[ \t\r\n]+/g`), with a comment. This way the test still detects an AC-02.8 regression |
| 4 | `step1-complete-guard.spec.ts › REQ-03.13 the summary also requires a complete step 1` expected `/co/summary` | This is expected: with step 1 complete but no plan, `planSelectedGuard` sends to `/co/plans` (REQ-03.13) | The test also stores a plan before opening the summary |
| 5 | Two tests in `country-shell.spec.ts` (4a) used up the 15 s when opening `/co/plans` and `/co/summary` | Now the plans page requests C5 and C6, and that spec's handler left the requests it did not know pending | The handler answers C5 and C6 with the fixtures from `api-contracts.md`, and the helper stores a plan for the summary |

**Checks on the tests themselves (mutation):**

- Keeping a stored plan that is no longer available (`discarded: false`) makes `plan-selection.spec.ts › AC-02.21 REQ-02.17 …` and `› REQ-02.22 …`, and `plans-step-page.spec.ts › AC-02.21 …` fail.
- Putting the plans without `order` first makes `sort-plans.spec.ts › AC-02.6 …` fail.

After each mutation I restored the code and ran the full suite again (output above).

## D14 (2026-11-23)

Scope: REQ-02.34 / AC-02.34, the whole plan card selects the plan. It is done with an `::after` pseudo-element of the `label` that covers the card; the control is still the native `radio`.

Tested commit: none of its own. Working tree on top of `47443de` (branch `style/sura-visual-refresh`) with the D14 changes uncommitted. The outputs are pasted as they are, except for two things: the ANSI codes and the repeated blank lines were removed. In the verbose run, the lines of this story's spec are filtered (`grep`), and I say so where it is done.

### Build

```text
$ npm run build

> car-insurance-quote@0.0.0 build
> ng build

❯ Building...
✔ Building...
Initial chunk files | Names                  |  Raw size | Estimated transfer size
main-SOBT4VEK.js    | main                   | 295.92 kB |                80.30 kB
styles-NTDGXMFB.css | styles                 |   6.21 kB |                 1.91 kB

                    | Initial total          | 302.13 kB |                82.22 kB

Lazy chunk files    | Names                  |  Raw size | Estimated transfer size
chunk-C8VTNn4N.js   | form-step-page         |  65.25 kB |                16.98 kB
chunk-Bjw0i0Qb.js   | summary-step-page      |  23.19 kB |                 6.18 kB
chunk-BYpa-ZCU.js   | plans-step-page        |  10.46 kB |                 3.17 kB
chunk-Bsx2fnci.js   | country-shell          |   8.23 kB |                 2.64 kB
chunk-Ce3_FM81.js   | -                      |   4.14 kB |                 1.71 kB
chunk-DvNqx6U3.js   | confirmation-page      |   3.45 kB |                 1.37 kB
chunk-B4DYgJbP.js   | country-selection-page |   3.37 kB |                 1.50 kB
chunk-CXDbEDFl.js   | -                      |   3.08 kB |                 1.17 kB
chunk-BvN-fAav.js   | -                      |   1.35 kB |               658 bytes
chunk-FpvmFjhC.js   | -                      | 622 bytes |               622 bytes
chunk-CGwJUSht.js   | -                      | 153 bytes |               153 bytes

Application bundle generation complete. [21.507 seconds] - 2026-11-23T21:27:04.864Z

Output location: C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend\dist\car-insurance-quote
```

### Unit tests (full suite)

```text
$ npx ng test --watch=false
Using Vitest configuration file: C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend\vitest-base.config.mts
❯ Building...
✔ Building...
Application bundle generation complete. [12.965 seconds] - 2026-11-23T21:31:08.878Z

 RUN  v5.1.1 C:/Users/Jorge Andres/Documents/_SURA/car-insurance-quote-multicountry/frontend

 Test Files  46 passed (46)
      Tests  469 passed (469)
   Start at  16:31:09
   Duration  29.92s (environment 70%, tests 22%, setup 5%, import 2%, transform 1%)
$ echo $?
0
```

### Unit tests of the change (verbose reporter, lines of the affected spec)

```text
$ npx ng test --watch=false --reporters=verbose --include src/app/features/wizard-shell/country-shell.spec.ts --include src/app/features/plans-step/plans-step-page.spec.ts
 RUN  v5.1.1 C:/Users/Jorge Andres/Documents/_SURA/car-insurance-quote-multicountry/frontend
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.1 REQ-02.1 shows the active plans of the country in the configured order 1074ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.5 the plans of another country are never shown 121ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.2 AC-02.7 only the first recommended plan is highlighted, with a visible text label 143ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.9 AC-02.8 each plan shows its final price from the step 1 data, in COP without decimals 124ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.8 Chile shows CLP: "$21.589" (19 990 × 1.08, rounded once) 105ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.10 without price factors each plan shows its base price 138ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > REQ-02.3 shows description, coverages and benefits as lists; an empty list is not shown 103ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.14 a plan with another currency is not shown and a warning is logged 104ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.15 a plan without base price is not shown and the others are 103ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > list > AC-02.32 more plans than the default page size are all listed 155ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.3 a selected plan is checked and continue goes to the summary 285ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.17 REQ-02.14 selecting another plan replaces the selection (one radio group) 149ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.16 G2-9 only the documentId of the plan is stored 133ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.18 continue without a selection shows the Strapi message on the group and moves the focus to it 114ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.15 the message is removed once a plan is chosen 82ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.19 the selection survives a reload 73ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.20 the selection is kept per country 193ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.21 a stored plan that is no longer available is discarded with an announced notice 101ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.16 AC-02.30 after editing step 1 the price is recalculated and the selection is kept 670ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > REQ-02.23 the plans are requested again on every entry to the step 183ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > selection > AC-02.34 REQ-02.34 the radio is the only interactive element of a card and its label selects the plan 122ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > AC-02.27 the group has a name and each option names the plan, price and recommendation 82ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > AC-02.28 the focus is on the heading of the step and the indicator marks step 2 63ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > accessibility > REQ-02.26 the buttons are back (button) and continue (submit of the form) 65ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.4 AC-02.22 with no active plans shows the empty message, no continue, and back to step 1 106ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.23 REQ-02.20 while loading shows the fixed "cargando" as status and no continue 56ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.24 REQ-02.21 a failure shows "error de carga" and "reintentar"; retrying lists the plans 86ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > REQ-02.21 a failure of the price factors is also "error de carga" (no partial prices) 45ms
 ✓  car-insurance-quote  src/app/features/plans-step/plans-step-page.spec.ts > PlansStepPage > states > AC-02.33 a missing continue text shows the generic error, no plans, and no plan request 34ms
 Test Files  2 passed (2)
      Tests  44 passed (44)
   Start at  16:32:08
   Duration  12.24s (tests 38%, environment 38%, setup 15%, import 4%, transform 4%, worker 1%)
```

To avoid trimming the output, only the `plans-step-page.spec.ts` lines are filtered here. The run's total (44 tests in 2 files) includes `country-shell.spec.ts`, which is in `US-01-test-report.md`.

### AC-02.34 coverage

| AC / REQ | Test (file › name) | Result |
|---|---|---|
| AC-02.34, REQ-02.34 (preconditions) | `features/plans-step/plans-step-page.spec.ts › AC-02.34 REQ-02.34 the radio is the only interactive element of a card and its label selects the plan` | ✅ Pass |
| AC-02.34 (click on the coverage list) | — | ⏭ Not covered by unit. jsdom has no layout or *hit testing*, so a click on the `li` does not reach the `label` pseudo-element. The E2E (QA) covers it |

The unit test checks what the technique needs: in each card the only interactive element is the `radio` (no other element would capture the click) and a click on the `label`, which is what the pseudo-element paints, selects the plan.

Visual check (throwaway Playwright script against `ng serve` on port 4300). A real mouse click on the first coverage item of "Plan Total" selects it (`checked=true`), and so does a click on the description of the first plan, at both 375 and 1280 px. There is no horizontal scroll.

**Note for the AC-02.34 E2E:** Playwright's `locator('li').click()` does not perform the click: its actionability check reports `<label class="plan-label"> intercepts pointer events` and retries until the timeout. This is expected, because the `label` covers the card on purpose. Use `click({ force: true })` on the `li` or `page.mouse.click()` at its coordinates: it is the same real click at that point, without the interception check.

**Accepted trade-off:** the card text cannot be selected with the mouse, because the `label` layer covers it. It is read-only content and the human asked for the whole card to be clickable. The keyboard and the accessible name do not change (REQ-02.26, REQ-02.27).
