# Informe de pruebas — US-01 (formulario dinámico del paso 1), fase 4b

| Campo | Valor |
|---|---|
| Autor | Angular Developer (subagente) |
| Fecha | 2026-11-23 |
| Commit probado | Sin commit propio: árbol de trabajo sobre `40840ed` (rama `phase-4/implementation`) con los cambios de 4b sin confirmar. El commit lo hace el orquestador |
| Entorno | Node 24.22.3 · npm 11.19.1 · Angular 22.3.0 (`@angular/forms/signals` 22.3.0) · TypeScript 6.0.3 · Vitest 5.1.1 · jsdom 31.0.1 · Windows 11 (Git Bash). Sin Strapi: fixtures en formato v5 de `api-contracts.md` (`frontend/src/app/core/cms/testing/strapi-fixtures.ts`, `frontend/src/app/features/form-step/testing/form-fixtures.ts`) |

Alcance: `features/form-step/` (página del paso 1, formulario dinámico con Signal Forms, schema generado, registro de validadores, reconciliación, evaluación, `isComplete` y `step1CompleteGuard` en `/:country/plans` y `/:country/summary`), más `CountryRouteReuseStrategy` (corrección de un fallo que encontró AC-01.22; ver "Fallos y causa").

Las salidas se pegan tal cual. Solo se han quitado los códigos de color ANSI (`sed 's/\x1b\[[0-9;]*m//g'`). Los códigos de salida se capturaron con `set -o pipefail`.

## Spike de ADR-0002

Lo hice leyendo `node_modules/@angular/forms/types/*.d.ts` y `fesm2022/signals.mjs` (funciones `getNativeControlValue`, `setNativeControlValue`, `nativeControlCreate` y `FormField.elementAcceptsNativeProperty`) y lo confirmé con `frontend/src/app/features/form-step/signal-forms-spike.spec.ts`. Ese test sigue en la suite para detectar cambios de comportamiento al actualizar Angular.

| Hueco | Resultado | ¿Coincide con ADR-0002? |
|---|---|---|
| 1. `<input type="number">` vacío | Con un modelo `number \| null`, Signal Forms escribe `element.value === '' ? null : element.valueAsNumber`: el vacío es `null`, nunca `NaN`. Un decimal llega como número (la regla `integer` es nuestra). Si el navegador marca `validity.badInput` (p. ej. una "e" suelta), no escribe el modelo y añade al campo un error `NativeInputParseError` (`kind: 'parse'`) | Sí. La normalización `NaN` → `null` se mantiene como defensa (`normalizeValue`) |
| 2. `<input type="date">` con modelo `string` | Si el modelo es `string`, lee y escribe `element.value` (`YYYY-MM-DD`) sin pasar por `Date`. **Condición:** si el modelo vale `null` o un `Date`, cambia a `valueAsDate`. Por eso el valor inicial de `date` es `''` y nunca `null` (`initialValue`) | Sí. No hace falta un control propio con `FormValueControl` |
| 3. `aria-invalid` y `aria-describedby` | `FormField` solo pone propiedades nativas: `disabled`, `required`, `readonly`, `name`, `min`/`max` y `minLength`/`maxLength` (en controles de texto). No pone `aria-invalid` ni `aria-describedby` | Sí. Se enlazan a mano con `[attr.aria-invalid]` y `[attr.aria-describedby]` |

Consecuencias en la implementación:

- No se usan los validadores incorporados `minLength`, `maxLength` ni `pattern`: no recortan espacios, y `maxLength` pondría el atributo nativo, que trunca lo que se escribe. Se usa `required()` (para que `FormField` ponga `required` nativo) y un `validate()` por campo que llama a las funciones puras de `validator-registry.ts`.
- `touched()` pasa a `true` en `blur` (lo confirma el spike), y `submit()` marca todo el árbol como tocado antes de llamar a `onInvalid`.

## Comando y salida real

### Build

```text
$ npx ng build
❯ Building...
✔ Building...
Initial chunk files | Names                  |  Raw size | Estimated transfer size
main-P4PH32WD.js    | main                   | 292.59 kB |                79.47 kB
styles-32OBUCRH.css | styles                 | 583 bytes |               583 bytes

                    | Initial total          | 293.18 kB |                80.05 kB

Lazy chunk files    | Names                  |  Raw size | Estimated transfer size
chunk-Dj0bLCqG.js   | form-step-page         |  61.69 kB |                16.14 kB
chunk-43leZdnU.js   | country-shell          |   5.43 kB |                 1.93 kB
chunk-CAQDyYxC.js   | country-selection-page |   2.51 kB |                 1.16 kB
chunk-DX2jqiia.js   | -                      |   1.35 kB |               684 bytes
chunk-CKquo0a9.js   | -                      |   1.28 kB |               626 bytes
chunk-CJMUJNEB.js   | -                      |   1.03 kB |               542 bytes
chunk-aFr6cMAi.js   | -                      | 625 bytes |               625 bytes
chunk-COT9XSbV.js   | -                      | 529 bytes |               529 bytes
chunk-Cb0RsLe1.js   | confirmation-page      | 468 bytes |               468 bytes
chunk-6wzaEjYe.js   | summary-step-page      | 462 bytes |               462 bytes
chunk-B65dPsMQ.js   | plans-step-page        | 456 bytes |               456 bytes

Application bundle generation complete. [25.382 seconds] - 2026-11-23T05:13:10.633Z

Output location: C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend\dist\car-insurance-quote
```

Código de salida: `0`.

### Unit tests

```text
$ npx ng test --watch=false --reporters=verbose
Using Vitest configuration file: C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend\vitest-base.config.mts
❯ Building...
✔ Building...
Application bundle generation complete. [14.731 seconds] - 2026-11-23T05:16:07.535Z


 RUN  v5.1.1 C:/Users/Jorge Andres/Documents/_SURA/car-insurance-quote-multicountry/frontend

 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > AC-01.6 "/CO" is redirected to "/co" (and then to its first step) 549ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 only the case of the country segment changes: "/CO/plans?x=1" → "/co/plans?x=1" 568ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 a lower-case code passes, even if it is unknown (the shell shows "país no disponible") 412ms
 ✓  car-insurance-quote  src/app/core/country/country-case-guard.spec.ts > countryCaseGuard > REQ-01.2 lowercaseFirstSegment leaves the rest of the URL untouched 30ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 1: an empty <input type="number"> writes null (not NaN) to a number | null model 1321ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 1: a decimal is kept as a number (the integer rule is ours) 355ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 2: <input type="date"> keeps a string model as "YYYY-MM-DD" in both directions 208ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.1 requests C3 and C4 only for the country of the URL and builds a ready config 624ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > AC-01.6 an unknown country gives notAvailable 153ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > Q-01.20 the configuration is requested once per app load and country 61ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > gap 3: FormField sets the native required property but no aria-invalid nor aria-describedby 139ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.4 a failure puts the resource in error and "reintentar" requests it again 122ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > touched becomes true on blur (error shown after the first blur) 240ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > REQ-01.7 logs a warning for each skipped field, without user data 250ms
 ✓  car-insurance-quote  src/app/features/form-step/signal-forms-spike.spec.ts > ADR-0002 Signal Forms spike > a checkbox writes a boolean 288ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > ADR-0004 whenSettled resolves with the result for the step guards, or null on error 59ms
 ✓  car-insurance-quote  src/app/core/country/country-config-store.spec.ts > CountryConfigStore > ADR-0004 whenSettled resolves immediately when the configuration is already loaded 159ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > ADR-0004 keys are ciq.v1.{cc}.{kind} 13ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.25 a key is only built from a validated lower-case country code 14ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.23 stores only the step 1 values, without any completed flag 15ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > AC-01.22 REQ-01.25 data of one country is never read from another 12ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 corrupt JSON is discarded with a warning and the key is removed 71ms
 ✓  car-insurance-quote  src/app/core/country/country-route-reuse-strategy.spec.ts > CountryRouteReuseStrategy > REQ-01.25 a route component is created again when the country changes 1453ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 an unexpected shape is discarded 13ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 a value of an unexpected type is dropped on its own, without logging the value 8ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-01.26 a non-finite number is not a valid stored value 7ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-02.16 the plan stores only its documentId 102ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-02.17 an invalid stored plan is discarded 30ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 shows the 3 steps (D7) in an ordered list inside a named nav 464ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-03.28 the confirmation round-trips and an incomplete one is discarded 52ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > REQ-03.28 remove deletes only the given key of the given country 6ms
 ✓  car-insurance-quote  src/app/core/country/country-route-reuse-strategy.spec.ts > CountryRouteReuseStrategy > REQ-01.25 within the same country the component is reused (only the query changes) 253ms
 ✓  car-insurance-quote  src/app/core/storage/wizard-storage.spec.ts > WizardStorage > ADR-0004 a storage that throws does not break the app 89ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 only the current step has aria-current="step" 132ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/step-indicator.spec.ts > StepIndicator > REQ-01.31 the step number is decorative for assistive technologies 84ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 loading is announced as status with the fixed "cargando" 38ms
 ✓  car-insurance-quote  src/app/app.spec.ts > App > ADR-0004 G3-9 shows the global "cargando" while a guard keeps the navigation pending 271ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.35 sends a GET to the relative /api URL, without Authorization nor credentials 86ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-02.21 each request has a 10 000 ms timeout 12ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 REQ-01.4 error is an alert with "error de carga" and a "reintentar" button that emits 45ms
 ✓  car-insurance-quote  src/app/shared/status-message.spec.ts > StatusMessage > REQ-01.32 a Strapi message is announced as an alert 299ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 identifies the fields with roles documentNumber, birthDate and vehicleYear 21ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 gives the option label of each select, not only the value 7ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 reports a valid step 1 as complete 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-01.29 when the business makes a stored value invalid, the result becomes incomplete 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > AC-02.22 a new required field makes the stored data incomplete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.20 a change of minimum age revalidates the birth date 5ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 no data at all is incomplete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is empty is never complete 5ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is unavailable is never complete 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 a form that is configError is never complete 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.27 exposes normalised values: text trimmed 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/evaluate-step1.spec.ts > evaluateStep1 > REQ-01.23 normalised values to store: trimmed text, NaN → null, only current fields 13ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 maps the documented C4 example to the domain 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.28 a configuration with the three roles is ready 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.20 without a field with role birthDate the form is unavailable and warns 4ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.5 no valid field → empty 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.25 a field with an unknown type and a field without label are skipped with one warning each 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.7 an element that is not an object, an invalid key or an unknown section is skipped 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 orders by fixed section, then order ascending, empty order last, ties by key 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.10 swapping order in Strapi swaps the fields on screen 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.8 a repeated key keeps the first by order and warns 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.13 select options keep the Strapi order; invalid and repeated values are dropped 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.11 a select without valid options is skipped 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.14 required is true only when Strapi says exactly true 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.9 empty help text and error message become null 1ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.15 keeps the validations of the catalog for each type, with decimal values as strings 3ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > AC-01.15 the pattern is anchored to the whole value 4ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.15 validations of another type or with invalid parameters are ignored, the field stays 4ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.28 a role on an incompatible type is ignored with a warning (and G2-5 applies) 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.22 several fields with the same role keep it on all of them 2ms
 ✓  car-insurance-quote  src/app/core/cms/form-field-mapper.spec.ts > mapFormFields > REQ-01.7 a non-integer order is treated as empty with a warning 2ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.6 the query is encoded by HttpParams and carries no status parameter 215ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.24 restores the stored values of the current fields 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 without stored data every field starts empty, by type 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > AC-01.23 a removed field and a removed option are discarded; make must be chosen again 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > AC-01.24 a stored value that breaks a new validation is kept and revalidated as invalid 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a new published field starts empty and the rest is kept 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a changed field type discards a value that does not fit the new type 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (text with a number) is discarded on its own 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (number with a string) is discarded on its own 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (checkbox with a string) is discarded on its own 4ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (date that is not YYYY-MM-DD) is discarded on its own 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > REQ-01.26 a value of an unexpected type (select with null) is discarded on its own 3ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/reconcile-step1.spec.ts > reconcileStep1 > US-01 §7 warnings never contain the stored values 2ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > AC-02.32 REQ-02.24 walks every page in series and concatenates the data 176ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C1 published countries > AC-01.5 maps the published countries with the names from Strapi, in the received order 5ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C1 published countries > REQ-01.7 drops items with an invalid code or without name, and duplicated codes 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.2 maps the texts of "/" from Strapi 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.2 intro is optional 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C2 country selection texts > REQ-01.13 a missing heading or list label is not interpretable (null → error state) 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.14 a value of only spaces is blank 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > Q-01.16 lengths count characters of the trimmed value 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > Q-01.16 the pattern covers the whole value 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.15 number rules: min, max and integer 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > text and number rules > REQ-01.15 ruleHolds only accepts the value type of each rule 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with pattern and value ABC123 → valid=true 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with pattern and value ABC12 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 text with maxLength and value ABCDEF → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 number with min and value 0 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.15 number with integer and value 2.5 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.14 a required text left empty or with only spaces is invalid 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > Q-01.16 text validations run on the trimmed value 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.15 an empty optional field is valid and its other rules do not run 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.16 several failing rules still make one invalid field 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.33 a required checkbox must be checked; an optional one may stay unchecked 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.11 a select value must be one of the current options 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2005 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2006 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2026 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2027 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.17 the field with role vehicleYear and year 2028 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2008-11-22 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2008-11-23 → valid=false 2ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-11-22, 2026-11-23 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-02-28, 2008-02-29 → valid=false 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > AC-01.18 the field with role birthDate, today 2026-03-01, 2008-02-29 → valid=true 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.20 the legal age uses the minimum age of the country 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.22 the role rules cannot be switched off: an optional birthDate or vehicleYear is still required 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.21 a date that is not a calendar date YYYY-MM-DD is invalid 1ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/validator-registry.spec.ts > validator registry > REQ-01.26 a value of an unexpected type is invalid 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.1 maps market data and texts of the requested country 226ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > AC-01.6 no country with that code → notAvailable 11ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 more than one country with the code is not interpretable 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is not an integer) is not interpretable 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is negative) is not interpretable 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (minimumAge is missing) is not interpretable 4ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (currency is not ISO 4217) is not interpretable 4ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (intlLocale is empty) is not interpretable 1ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.4 invalid market data (code does not match) is not interpretable 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.13 without genericErrorMessage the configuration is not interpretable 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > AC-01.35 a blank continue text marks the form step as configError, without defaults 2ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-03.38 a missing summary text only breaks its own section 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > C3 country configuration > REQ-01.13 texts are trimmed 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.1 a complete configuration is ready 8ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.13 a missing step 1 text makes the form configError before empty or unavailable 4ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > REQ-01.13 a missing section legend (wizard texts) also makes the form configError 3ms
 ✓  car-insurance-quote  src/app/core/cms/country-mapper.spec.ts > country mapper > CountryConfig (C3 + C4) > AC-01.20 the documented C4 example lacks birthDate and documentNumber → unavailable 16ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-02.24 a single page is not requested again 132ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an HTTP 500 is a request error 68ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > AC-03.27 matches ^CO-20261122-[A-HJ-NP-Z2-9]{6}$ with a fixed clock 36ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > AC-03.27 the same random source always gives the same number 5ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > REQ-03.26 uses the UTC date of the payment 1ms
 ✓  car-insurance-quote  src/app/domain/quote-number/create-quote-number.spec.ts > createQuoteNumber > REQ-03.26 the alphabet has 32 symbols without 0, O, 1 or I, for every byte value 10ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C1 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C2 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C3 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C4 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C5 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C6 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.6 C7 never asks for drafts: no status nor publicationFilter 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-01.1 country requests filter only by the country of the URL 2ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.24 collections that can grow ask for an explicit page size of 100 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.2 plans are filtered by active = true 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > api-contracts C3 asks for the five text components and pageSize 2 to detect duplicates 2ms
 ✓  car-insurance-quote  src/app/core/cms/cms-queries.spec.ts > CMS queries > REQ-02.9 price factors are requested without texts 2ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 todayLocal gives the local calendar date as YYYY-MM-DD 15ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > AC-01.19 dates are not shifted by the time zone (America/Bogota, 20:00 local = 01:00 UTC next day) 21ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 control: changing TZ really changes the local date (Asia/Tokyo is a day ahead) 3ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 CLOCK is injectable and can be replaced in tests 21ms
 ✓  car-insurance-quote  src/app/core/clock/clock.spec.ts > clock > REQ-01.21 the default CLOCK returns the current date 36ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 a network error (or timeout) is a request error 106ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (data missing) is a contract error 33ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (data is not an array) is a contract error 36ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E1 final price is 1320000 3ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E2 final price is 1440000 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E3 final price is 1221875 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E4 final price is 38985 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E5 final price is 25990 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 E6 final price is 21589 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.9 reports the multiplier applied for each role (E3: both limits inclusive) 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.10 without price factors the final price is the base price 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.11 without a value for birthDate its factor is 1 and vehicleYear still applies 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.10 a value that cannot be interpreted gives factor 1 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.12 a vehicle from next year uses vehicle age 0 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > AC-02.13 a band with multiplier 0 is ignored and the remaining valid bands apply 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 bands with a negative or non-finite multiplier or min > max are discarded 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 with overlapping bands the first in the configured order wins 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.12 a band with an incompatible role and operand is discarded (G3-10) 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.11 rounds once at the end, not after each factor 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.8 is pure: same inputs give the same output and the rules are not modified 2ms
 ✓  car-insurance-quote  src/app/domain/pricing/compute-final-price.spec.ts > computeFinalPrice > REQ-02.8 depends on the reference date passed in, not on the clock 2ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.9 maps the documented C6 example in the configured order 4ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > AC-02.10 null or empty priceFactors → no rules (final price = base price) 2ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > AC-02.13 a band with multiplier 0 is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with min > max is discarded 2ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with negative multiplier is discarded 2ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with non numeric multiplier is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with non-integer limit is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with unknown role is discarded 1ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with unknown operand is discarded 2ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.12 a band with incompatible role and operand (G3-10) is discarded 2ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.9 a decimal multiplier serialised as a string is accepted (ADR-0005) 2ms
 ✓  car-insurance-quote  src/app/core/cms/price-factor-mapper.spec.ts > mapPriceFactors > REQ-02.21 a country unpublished between steps (no data) is an error 1ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 Colombia: "$ 1.320.000" with U+00A0 between "$" and the number 11ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 Chile: "$38.985" without separator after "$" 9ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > AC-02.8 the price has no decimal part 3ms
 ✓  car-insurance-quote  src/app/domain/pricing/format-price.spec.ts > formatPrice > REQ-02.6 locale and currency come from the arguments (Strapi), not from code 4ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.4 an unexpected collection shape (body is not an object) is a contract error 63ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.15 maps the documented C7 example: paragraph and unordered list with bold 4ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.16 supports ordered lists, headings, quotes, marks and links (text only) 3ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > AC-03.14 HTML inside the text is kept as literal text, never as a node 3ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.16 unknown, code and image nodes are degraded to plain text or omitted, with a warning 3ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are null → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are an empty list → unavailable 7ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 terms that are blocks without text → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.18 more than one country record → unavailable 1ms
 ✓  car-insurance-quote  src/app/core/cms/terms-mapper.spec.ts > mapTerms > REQ-03.32 no country (unpublished between steps) is an error 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.3 maps the documented C5 example to the domain 3ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.2 a plan that is not active (false or null) is discarded 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > AC-02.14 a plan with another currency is discarded with a warning 6ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > AC-02.15 a plan without base price is discarded and the others are kept 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (empty name) is discarded with a warning 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (base price 0) is discarded with a warning 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (negative base price) is discarded with a warning 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (non numeric base price) is discarded with a warning 3ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a malformed plan (empty documentId) is discarded with a warning 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.25 a numeric string base price is accepted 1ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.3 null coverages or benefits are empty lists and blank labels are omitted 2ms
 ✓  car-insurance-quote  src/app/core/cms/plan-mapper.spec.ts > mapPlans > REQ-02.4 empty or non-integer order is null; recommended is true only when exactly true 2ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.20 the birthday counts as completed 2ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.20 someone born on 29 February has the birthday on 1 March in non-leap years 1ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-02.8 gives the ages of the price examples E1-E6 (reference 2026-11-22) 2ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.20 a future birth date gives a negative age 1ms
 ✓  car-insurance-quote  src/app/domain/dates/age-in-years.spec.ts > ageInYears > REQ-01.21 returns null for values that are not calendar dates 2ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "1234567890" → "******7890" 3ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "12.345.678-5" → "**.***.678-5" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "E-123456" → "*-***456" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "12345" → "***45" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "1234" → "**34" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.7 "7" → "*" 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.5 the full Colombian document does not appear in the masked value 1ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > AC-03.6 the full RUT does not appear and separators are kept 2ms
 ✓  car-insurance-quote  src/app/domain/masking/mask-document.spec.ts > maskDocument > REQ-03.7 spaces are separators and never more than half is shown 2ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > D7 form, plans and summary are steps 1-3; the confirmation is not a step 2ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > REQ-01.13 the heading of each screen is its Strapi title 4ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/wizard-screens.spec.ts > wizard screens > REQ-01.13 any missing text of the screen gives the generic error, never a default 3ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > REQ-01.2 a single type must have an object in data; a 404 is an error 136ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2005 → valid=false 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2006 → valid=true 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2026 → valid=true 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2027 → valid=true 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-01.17 today 2026-11-22, year 2028 → valid=false 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-01.19 only integers are valid 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-01.19 the current year comes from the reference date, limits inclusive 2ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > AC-02.12 a vehicle from next year has vehicle age 0, not -1 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-02.8 vehicle age is the difference of years (E1, E3, E4) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/vehicle-year.spec.ts > vehicle year > REQ-02.10 a non-integer year has no vehicle age 1ms
 ✓  car-insurance-quote  src/app/core/cms/cms-client.spec.ts > CmsClient > ADR-0004 aborting (resource cancelled) cancels the HTTP request 89ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 parses a YYYY-MM-DD calendar date without time zone 2ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-02-30" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2025-02-29" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-13-01" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-00-10" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-1-1" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "2026-11-22T00:00" as a calendar date 1ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 rejects "" as a calendar date 3ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.20 knows leap years (29 February rule) 3ms
 ✓  car-insurance-quote  src/app/domain/dates/calendar-date.spec.ts > calendar dates > REQ-01.21 compares calendar dates by day 2ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2008-11-22 → valid=true (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2008-11-23 → valid=false (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-11-22, birth date 2026-11-23 → valid=false (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-02-28, birth date 2008-02-29 → valid=false (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > AC-01.18 today 2026-03-01, birth date 2008-02-29 → valid=true (minimum age 18) 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.20 a future birth date is invalid even with minimum age 0 2ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.20 uses the minimum age of the country from Strapi 1ms
 ✓  car-insurance-quote  src/app/domain/dates/legal-age.spec.ts > isOfLegalAge > REQ-01.21 a value that is not a calendar date is invalid 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status idle → loading 2ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status loading → loading 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status reloading → loading 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status error → error 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status resolved → ready 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.3 REQ-01.4 resource status local → ready 1ms
 ✓  car-insurance-quote  src/app/core/ui-state/view-state.spec.ts > ui state > REQ-01.13 G2-2 there are exactly the four fixed texts, in Spanish 3ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.3 AC-01.7 shows only the fixed "cargando" while the configuration loads 4458ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > AC-01.5 lists the published countries with their Strapi names, and Chile goes to "/cl" 4475ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > AC-01.8 shows "error de carga" + "reintentar" and retrying shows the step 778ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.2 every text of "/" comes from Strapi (country-selection) 205ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.3 shows the fixed "cargando" while loading 83ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > AC-02.22 without step 1 data for Chile, "/cl/plans" redirects to "/cl/form" and no plan is requested 3804ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.1 requests only the configuration of the country of the URL 292ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > REQ-01.4 if country-selection is not published (404) shows "error de carga" and retries 128ms
 ✓  car-insurance-quote  src/app/features/country-selection/country-selection-page.spec.ts > CountrySelectionPage > G3-10 a missing required text of "/" is shown as "error de carga", without defaults 83ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.31 AC-01.27 the step indicator marks the current step with aria-current="step" 304ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.1 shows only the fields of the country, in sections and in the configured order 1680ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > AC-02.22 valid data that a new required field makes incomplete redirects to step 1, keeping the data 349ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.26 REQ-01.12 each section is a fieldset with its Strapi legend, policyholder first 305ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-02.19 a complete step 1 lets the plans step open 109ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.31 the focus goes to the heading of the step and document.title follows it 233ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > D7 the confirmation is not a step: no step is marked as current 71ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a text field is a native control with its label 185ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > ADR-0001 "/co" and unknown sub-paths redirect to "/co/form" 165ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > AC-01.6 an unknown code shows "país no disponible" and the published countries as links 89ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a number field is a native control with its label 180ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-03.13 the summary also requires a complete step 1 246ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.2 a code that cannot be a country is not requested to Strapi 48ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.2 if the country list fails, "país no disponible" shows "error de carga" + "reintentar" 60ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-01.25 complete data of Colombia does not open the plans of Chile 146ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > ADR-0004 if the configuration fails, the guard lets the navigation through and the shell shows the error 70ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a select field is a native control with its label 153ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-01.13 a missing step indicator text shows the generic error instead of the wizard 48ms
 ✓  car-insurance-quote  src/app/features/wizard-shell/country-shell.spec.ts > CountryShell > REQ-02.32 a missing step title shows the generic error of the country, never a default 46ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a date field is a native control with its label 133ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > REQ-01.2 an unknown country is not redirected: the shell shows "país no disponible" 84ms
 ✓  car-insurance-quote  src/app/features/form-step/validation/step1-complete-guard.spec.ts > step1CompleteGuard > G2-10 the guard never writes a "completed" flag 112ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 a checkbox field is a native control with its label 146ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.12 REQ-01.9 the help text is associated with aria-describedby 97ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.13 the select offers exactly the Strapi options, in order, after an empty option 113ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > REQ-01.14 REQ-01.29 required fields are marked visually and with the native required property 82ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > REQ-01.31 the focus is on the heading of the step and the indicator marks step 1 62ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > render > AC-01.31 the continue button shows the Strapi text 56ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 the error is not shown while typing, only after leaving the field 55ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.2 AC-01.26 an invalid field shows its configured message, aria-invalid and aria-describedby 61ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 the error disappears as soon as the value is valid 71ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.16 an empty field message falls back to the generic message of the country 62ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.14 a required text with only spaces shows its message and stays on step 1 153ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.16 REQ-01.17 trying to continue shows all errors, focuses the first invalid field and keeps the URL 135ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > REQ-01.17 with an untouched empty form, continue reveals every required error 63ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.33 a required checkbox left unchecked shows its message and stays on step 1 97ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.17 a vehicle year outside 2006-2027 is invalid; 2027 is valid 54ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > validation > AC-01.18 a policyholder who turns 18 tomorrow is invalid with the field message 47ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.32 with a valid form, continue goes to step 2 of the same country and stores the data 119ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > REQ-01.23 every change is stored, normalised (trimmed text), without any completed flag 62ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > Q-01.16 leaving a text field replaces its value by the trimmed one 41ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.4 going back from step 2 keeps the data filled in 119ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.19 REQ-01.21 the birth date is stored exactly as typed, YYYY-MM-DD 76ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.21 REQ-01.24 the stored values are restored when the page is opened again (reload) 112ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.22 data is separated by country 141ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.23 a stored option that no longer exists leaves the select empty, with a warning 52ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > AC-01.24 a stored value that breaks a new validation is shown and fails on continue 89ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > continue and persistence > REQ-01.26 a corrupt stored entry is discarded and the form starts empty 71ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.9 REQ-01.5 without published fields shows the empty message of the country and no continue 54ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.20 without a field with role birthDate shows the generic error, no continue, and warns 31ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.35 a missing continue text shows the generic error instead of the form, with no default text 66ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > states of the configuration > AC-01.25 skipped malformed fields do not break the rest of the form 117ms
 ✓  car-insurance-quote  src/app/features/form-step/form-step-page.spec.ts > FormStepPage > formStepState (pure) > REQ-01.13 G2-2 the states use only Strapi texts 3ms

 Test Files  33 passed (33)
      Tests  336 passed (336)
   Start at  00:16:09
   Duration  24.30s (environment 74%, setup 11%, tests 10%, import 3%, transform 2%)
```

Código de salida: `0`. Resumen: **33 archivos, 336 tests, 336 pasan, 0 fallan** (229 de la fase 4a y 107 nuevos).

### Formato

```text
$ npx prettier --check "src/**/*.{ts,html,css}" vitest-base.config.mts
Checking formatting...
All matched files use Prettier code style!
```

### `grep` de reglas

Ejecutados en `frontend/`. Cada bloque es el comando exacto seguido de su salida.

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

$ grep -rnE "today=|__TEST__|isE2E" src
(sin resultados)

$ grep -rLE "ChangeDetectionStrategy.OnPush" $(grep -rlE "@Component\(" src/app --include="*.ts" | grep -v "spec.ts")
(sin resultados)

$ grep -rn "experimental" src --include="*.ts" | grep -v "spec.ts"
(sin resultados)

$ grep -rnE "placeholder=" src --include="*.html"
(sin resultados)
```

Lectura: no hay `any` como tipo, ni `*ngIf`/`*ngFor`, ni NgModules ni formularios reactivos. `sessionStorage` solo aparece en `core/storage/`. Todos los componentes son `OnPush`. No se usa ninguna API experimental de Signal Forms (`experimentalWebMcpTool`) ni placeholders (Q-01.17).

## Cobertura de criterios de US-01

Las rutas son relativas a `frontend/src/app/`. "E2E" indica la parte que corresponde al QA Engineer en `e2e/` (ADR-0007).

| AC | Test (archivo › nombre) | Resultado |
|---|---|---|
| AC-01.1 | `features/form-step/form-step-page.spec.ts › AC-01.1 shows only the fields of the country, in sections and in the configured order` | ✅ Pass (E2E contra el seed: QA) |
| AC-01.2 | `form-step-page.spec.ts › AC-01.2 AC-01.26 an invalid field shows its configured message, aria-invalid and aria-describedby`; `› AC-01.16 REQ-01.17 …` | ✅ Pass |
| AC-01.3 | — | ⏭ No cubierto por unit: es un cambio de contenido con recarga. E2E por intercepción + G5 (G3-3) |
| AC-01.4 | `form-step-page.spec.ts › AC-01.4 going back from step 2 keeps the data filled in` | ✅ Pass |
| AC-01.5 | `features/country-selection/country-selection-page.spec.ts › AC-01.5 …` (4a) | ✅ Pass |
| AC-01.6 | `core/country/country-case-guard.spec.ts › AC-01.6 …`, `features/wizard-shell/country-shell.spec.ts › AC-01.6 …` (4a) | ✅ Pass |
| AC-01.7 | `country-shell.spec.ts › REQ-01.3 AC-01.7 shows only the fixed "cargando" …` (4a) | ✅ Pass |
| AC-01.8 | `country-shell.spec.ts › AC-01.8 shows "error de carga" + "reintentar" and retrying shows the step` (4a) | ✅ Pass |
| AC-01.9 | `form-step-page.spec.ts › AC-01.9 REQ-01.5 without published fields shows the empty message of the country and no continue` | ✅ Pass |
| AC-01.10 | `core/cms/form-field-mapper.spec.ts › AC-01.10 swapping order in Strapi swaps the fields on screen` (4a) | ✅ Pass (cambio real con recarga: E2E por intercepción) |
| AC-01.11 | `core/cms/cms-queries.spec.ts › REQ-01.6 C4 never asks for drafts …` (4a) | ✅ Pass (parte unit). Contra Strapi real: E2E |
| AC-01.12 | `form-step-page.spec.ts › AC-01.12 a {text, number, select, date, checkbox} field is a native control with its label` (5), `› AC-01.12 REQ-01.9 the help text is associated with aria-describedby` | ✅ Pass |
| AC-01.13 | `form-step-page.spec.ts › AC-01.13 the select offers exactly the Strapi options, in order, after an empty option`; `form-field-mapper.spec.ts › AC-01.13 …` | ✅ Pass (primera parte). "Marca C" tras recargar: E2E por intercepción |
| AC-01.14 | `validation/validator-registry.spec.ts › AC-01.14 a required text left empty or with only spaces is invalid`; `form-step-page.spec.ts › AC-01.14 a required text with only spaces shows its message and stays on step 1` | ✅ Pass |
| AC-01.15 | `validator-registry.spec.ts › AC-01.15 …` (las 5 filas); `form-field-mapper.spec.ts › AC-01.15 the pattern is anchored to the whole value` | ✅ Pass |
| AC-01.16 | `form-step-page.spec.ts › AC-01.16 REQ-01.17 trying to continue shows all errors, focuses the first invalid field and keeps the URL` | ✅ Pass |
| AC-01.17 | `validator-registry.spec.ts › AC-01.17 …` (5 filas); `form-step-page.spec.ts › AC-01.17 …`; `domain/dates/vehicle-year.spec.ts › AC-01.17 …` (4a) | ✅ Pass |
| AC-01.18 | `validator-registry.spec.ts › AC-01.18 …` (5 filas); `form-step-page.spec.ts › AC-01.18 …`; `domain/dates/legal-age.spec.ts › AC-01.18 …` (4a) | ✅ Pass |
| AC-01.19 | `core/clock/clock.spec.ts › AC-01.19 …` (4a, `TZ=America/Bogota`); `form-step-page.spec.ts › AC-01.19 REQ-01.21 the birth date is stored exactly as typed, YYYY-MM-DD` | ✅ Pass |
| AC-01.20 | `form-step-page.spec.ts › AC-01.20 without a field with role birthDate shows the generic error, no continue, and warns`; `form-field-mapper.spec.ts › AC-01.20 …` | ✅ Pass |
| AC-01.21 | `form-step-page.spec.ts › AC-01.21 REQ-01.24 the stored values are restored when the page is opened again (reload)` | ✅ Pass (recarga). "Pestaña nueva vacía" depende del `sessionStorage` real: E2E |
| AC-01.22 | `form-step-page.spec.ts › AC-01.22 data is separated by country`; `core/storage/wizard-storage.spec.ts › AC-01.22 …` (4a); `step1-complete-guard.spec.ts › REQ-01.25 …` | ✅ Pass |
| AC-01.23 | `validation/reconcile-step1.spec.ts › AC-01.23 …`; `form-step-page.spec.ts › AC-01.23 a stored option that no longer exists leaves the select empty, with a warning` | ✅ Pass |
| AC-01.24 | `reconcile-step1.spec.ts › AC-01.24 …`; `form-step-page.spec.ts › AC-01.24 a stored value that breaks a new validation is shown and fails on continue` | ✅ Pass |
| AC-01.25 | `form-step-page.spec.ts › AC-01.25 skipped malformed fields do not break the rest of the form`; `form-field-mapper.spec.ts › AC-01.25 …` (4a) | ✅ Pass |
| AC-01.26 | `form-step-page.spec.ts › AC-01.26 REQ-01.12 each section is a fieldset with its Strapi legend …`, `› AC-01.2 AC-01.26 …`, `› AC-01.12 …` (labels) | ✅ Pass |
| AC-01.27 | `form-step-page.spec.ts › REQ-01.31 the focus is on the heading of the step and the indicator marks step 1`; `country-shell.spec.ts › REQ-01.31 AC-01.27 …` (4a) | ✅ Pass (foco y `aria-current`). Solo teclado y Enter: E2E, porque jsdom no implementa el envío implícito con Enter |
| AC-01.28 | — | ⏭ No cubierto por unit: responsive (viewports 320 y 1280). E2E + G5 |
| AC-01.29 | `validation/evaluate-step1.spec.ts › AC-01.29 …` (4); `form-step-page.spec.ts › REQ-01.23 every change is stored, normalised …, without any completed flag` | ✅ Pass |
| AC-01.30 | `core/cms/cms-client.spec.ts › REQ-01.35 sends a GET … without Authorization nor credentials` (4a) | ✅ Pass (parte unit). Inspección de red: E2E |
| AC-01.31 | `form-step-page.spec.ts › AC-01.31 the continue button shows the Strapi text` | ✅ Pass (el texto viene de Strapi). Cambio en CL con recarga: E2E por intercepción |
| AC-01.32 | `form-step-page.spec.ts › AC-01.32 with a valid form, continue goes to step 2 of the same country and stores the data` | ✅ Pass |
| AC-01.33 | `validator-registry.spec.ts › AC-01.33 …`; `form-step-page.spec.ts › AC-01.33 a required checkbox left unchecked shows its message and stays on step 1` | ✅ Pass |
| AC-01.34 | — | ⏭ No cubierto por unit: es el seed de Strapi (Strapi Developer). E2E |
| AC-01.35 | `form-step-page.spec.ts › AC-01.35 a missing continue text shows the generic error instead of the form, with no default text`; `country-mapper.spec.ts › AC-01.35 …` (4a) | ✅ Pass |

REQ sin AC propio que cubren los unit:

- REQ-01.16: el error solo aparece tras el primer blur, desaparece al corregir y usa el mensaje genérico si el del campo está vacío.
- REQ-01.22: las reglas por rol no se desactivan con `required: false`.
- REQ-01.23: normalización de los valores guardados.
- REQ-01.26: tipo cambiado, tipo inesperado y JSON corrupto.
- REQ-01.27: los estados `empty`, `unavailable` y `configError` nunca están completos.
- REQ-02.19 y REQ-03.13: `step1CompleteGuard` (8 tests).

## Fallos y causa

En la ejecución final no falla ningún test. Estas son las incidencias de la fase, con su causa y su corrección:

| # | Síntoma | Causa | Corrección |
|---|---|---|---|
| 1 | `AC-01.22 data is separated by country` fallaba: al volver a `/co/form`, `#f-co_plate` no existía | **Fallo real de la app.** El `RouteReuseStrategy` por defecto reutiliza un componente cuando solo cambian los parámetros. De `/cl/form` a `/co/form`, con las dos configuraciones ya en memoria, el shell seguía en `ready`, el outlet no se destruía y `DynamicForm`, que crea el formulario una sola vez en `ngOnInit` (ADR-0002), conservaba los campos de Chile. De `/co` a `/cl` no fallaba porque la configuración de CL aún no estaba cargada y el shell pasaba por "cargando" | `core/country/country-route-reuse-strategy.ts`: no reutiliza una ruta si cambia el país. Se registra con `provideAppRouting()` en `app.config.ts` y en los tests. Tiene su propio test: `country-route-reuse-strategy.spec.ts` (2) |
| 2 | Tres tests de `country-shell.spec.ts` (4a) dejaron de pasar: esperaban ver `/co/plans` y `/co/summary` | Es lo esperado: ahora `step1CompleteGuard` redirige a `/co/form` cuando el paso 1 no está completo (REQ-02.19, REQ-03.13). Además, ese archivo usaba el `sessionStorage` real de jsdom | El spec usa `WIZARD_STORAGE` en memoria y `CLOCK` fijo, y guarda un paso 1 válido antes de abrir los pasos 2 y 3. Lo que comprueban esos tests (indicador, foco, título ausente) no cambia |
| 3 | `AC-01.1`, `AC-01.5` y `AC-02.22` fallaron por timeout (entre 5,2 y 6,1 s) en la suite completa, pero pasaban ejecutados solos | Son el primer test con router de cada archivo: cargan los chunks lazy, y con la suite entera en paralelo en Windows superan los 5 s por defecto de Vitest. Es tiempo de carga, no un bloqueo | `frontend/vitest-base.config.mts` con `testTimeout: 15_000`, referenciado en `angular.json` (`test.options.runnerConfig`), que es la opción que documenta el builder (`ng test --help`). Sin dependencias nuevas |

**Control de los propios tests (mutación):** quitar `touched()` de `DynamicForm.errorVisible` (el error se vería mientras se escribe) hace fallar exactamente `REQ-01.16 the error is not shown while typing, only after leaving the field` y `AC-01.12 REQ-01.9 the help text is associated with aria-describedby`. Después restauré el código y volví a ejecutar la suite (salida de arriba).
