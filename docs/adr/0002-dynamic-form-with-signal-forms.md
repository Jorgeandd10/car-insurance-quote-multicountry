# ADR-0002 — Dynamic step 1 form with Signal Forms

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Deciders | Human (G3) |
| Motivated by | D5, D2 · G2-1, G2-4, G2-5, G2-7, G2-13 · REQ-01.7, REQ-01.8, REQ-01.10, REQ-01.11, REQ-01.14, REQ-01.15, REQ-01.16, REQ-01.17, REQ-01.19, REQ-01.20, REQ-01.21, REQ-01.22, REQ-01.29, REQ-01.30 |

## Context and problem

Step 1 is generated at runtime from the country's configuration in Strapi: the fields, their type (`text`, `number`, `select`, `date`, `checkbox`), whether they are required, their typed validations (G2-7 catalog), their role (G2-1) and a single error message per field. D5 set Signal Forms (`@angular/forms/signals`), which the official comparison table marks as "Stable (v22+)". This ADR specifies how to build that form when the keys and the rules arrive over HTTP, and which parts of the API are used.

## Decision drivers

- The configuration arrives asynchronously and changes without deploying (REQ-01.6).
- Typed validations from a closed catalog, plus role rules that are always active (G2-4, G2-5).
- One message per field, visible when leaving the field or when trying to advance (REQ-01.16).
- Pure functions testable without Angular (`CLAUDE.md` §8; REQ-01.21).
- Accessibility: `<label>`, `aria-describedby`, `aria-invalid`, focus on the first invalid field (REQ-01.17, REQ-01.29).
- Use only stable API in v22, with no new dependencies.

## API verification (angular.dev, 2026-11-22)

| Need | Signal Forms API | Verified status |
|---|---|---|
| Create the form from a model | `form(model, schema, options)` | Stable since v22.0 |
| Create the form outside the constructor | `FormOptions.injector` | Stable since v22.0 (`FormOptions` interface) |
| Bind a native control | `FormField` directive, `formField` input (`[formField]="..."`) | Stable since v22.0 |
| Submit from `<form>` (including Enter) | `[formRoot]` + `FormOptions.submission` (`action`, `onInvalid`) | "Form submission" guide: `FormRoot` sets `novalidate`, prevents navigation and calls `submit` if there is a `submission` option |
| Dynamic keys | `Record<string, ...>` model + schema that iterates over the configuration | Official "Dynamic forms with JSON" guide |
| Built-in validators | `required`, `min`, `max`, `minLength`, `maxLength`, `pattern` | "Validation" guide |
| Custom validators | `validate(path, ({ value }) => error \| null)` | "Validation" guide |
| Per-field state | `value()`, `valid()`, `invalid()`, `errors()`, `touched()`, `markAsTouched()` | "Field state management" guide: `touched()` becomes `true` on focus and blur |
| Mark everything as touched on submit | `submit()` marks the interactive fields as touched | "Form submission" guide |
| Focus a field | `fieldTree().focusBoundControl()` | "Form submission" guide (`onInvalid` example) |
| Native types | text, number (converts between string and number), checkbox (boolean), select with dynamic options, date | "Forms with signals" guide (essentials). `<select multiple>` is not supported |

**Documentation gaps to check with a spike when starting US-01** (none blocks the decision):

1. **Value of an empty `<input type="number">`.** The dynamic forms guide initializes numeric fields to `null`, but does not document which value the control writes when it is emptied (`null` or `NaN`). The `required` validator treats `null`, `undefined`, `''`, `false` and `NaN` as empty, so either works, and the output mapper normalizes `NaN` to `null`.
2. **`<input type="date">` with a `string` model.** The guide says date controls "also accept `Date`", but not whether they keep a `YYYY-MM-DD` `string`. A `string` is required so the date is not shifted by time zone (REQ-01.21; the validation guide itself warns about the shift with `Date`). If the spike shows that the control writes a `Date`, a custom control implementing `FormValueControl<string>` is used ("Custom controls" guide), with no dependencies.
3. **`aria-invalid` and `aria-describedby`.** The `FormField` reference does not say it sets them, so they are bound manually in the template.

No required API is marked as experimental. The only experimental property found (`FormOptions.experimentalWebMcpTool`) is not used.

## Considered options

1. **Signal Forms with a flat `Record<key, FieldValue>` model and a schema generated from the configuration**, following the official "Dynamic forms with JSON" guide.
2. **Signal Forms with a model nested by section** (`{ policyholder: {...}, vehicle: {...} }`).
3. **Typed Reactive Forms** (`FormRecord` + `ValidatorFn`).
4. **Custom form using only `signal`/`computed`**, without `@angular/forms`.

Sub-decision on **how to model the validations in Strapi** (affects the contract):

- **V1.** Repeatable component `form.validation-rule` with `kind` (enum) and parameters `value` (decimal) and `pattern` (string).
- **V2.** Dynamic zone with one component per validation type.
- **V3.** Free-form JSON field.

## Decision

Chosen option: **1 (Signal Forms, flat model) + V1**.

### Construction

1. `FormStepPage` waits until the country configuration is ready (ADR-0004). Only then does it render `DynamicForm` with the already mapped configuration (`FormConfig`) as `input.required`.
2. `DynamicForm` creates the form in `ngOnInit` (the inputs are already available) with `form(model, buildStep1Schema(config, ctx), { injector, submission })`. The `injector` is obtained with `inject(Injector)` in the class field. The configuration is treated as immutable during the component's lifetime: if it is reloaded (retry), the component is recreated because the `@if` destroys it.
3. **Model:** `signal<Step1Model>()`, where `Step1Model = Record<FieldKey, string | number | boolean | null>`. Initial values by type: `text` → `''`, `number` → `null`, `select` → `''`, `date` → `''`, `checkbox` → `false`. The restored and reconciled values are applied on top of them (ADR-0004). Keys match `^[a-z][a-zA-Z0-9_]*$` (content-model), so `Object.keys` keeps insertion order, although the screen order does not depend on it.
4. **Typed accessors** by type (`asText(key): FieldTree<string>`, `asNumber`, `asBoolean`...), with the deliberate cast documented by the official guide ("deliberate escape hatches"). The cast is covered by a mapper test: the field type determines the initial value.
5. **Template:** `<form [formRoot]="f">`, `@for (section of sections(); track section.id)` inside `<fieldset><legend>`, and `@for (field of section.fields; track field.key)` with a `@switch (field.type)` that renders the native control with `[formField]`. `select`: `<select>` with a first empty `<option value="">`, with no text (G2-2 and Q-01.17: there are no placeholders), and the options in Strapi order.

### Validation (generated schema)

For each field of the configuration, in order:

| Source | How it is applied | Pure function (no Angular) |
|---|---|---|
| `required` (Strapi) | built-in `required(path)` (reflects `required` on the native control) and, for `text`, also `validate(path, notBlank)` | `isBlank(value)`: a text of only spaces counts as empty (REQ-01.14). Required `checkbox` = `true`, which the built-in `required` already covers because it treats `false` as empty |
| `minLength` / `maxLength` (`text`) | `validate(path, ...)` | `hasMinLength(trimmed, n)`, `hasMaxLength(trimmed, n)` on the trimmed value (Q-01.16) |
| `pattern` (`text`) | `validate(path, ...)` | `matchesFully(trimmed, regex)`. The mapper compiles `new RegExp('^(?:' + source + ')$')` without flags; if it does not compile, the validation is ignored with a warning (5.3) |
| `min` / `max` / `integer` (`number`) | `validate(path, ...)` | `isAtLeast`, `isAtMost`, `isInteger` |
| `vehicleYear` role (`number`) | `validate(path, ...)`, always active | `isVehicleYearValid(year, today)`: `year(today) − 20 ≤ year ≤ year(today) + 1`, integer (REQ-01.19) |
| `birthDate` role (`date`) | `validate(path, ...)`, always active | `isOfLegalAge(birthDate, today, minimumAge)`, with a future date invalid and the February 29 rule (REQ-01.20) |
| `select` | implicit `validate(path, ...)` | The value, if not empty, must be a current option |

- Custom validators **are not reimplemented on top of the built-in ones** when these do not trim spaces (`minLength`, `pattern`). That is why pure functions wrapped in `validate()` are used. They all live in `frontend/src/app/domain/` and `features/form-step/validation/`, and have unit tests named by AC (AC-01.14, AC-01.15, AC-01.17, AC-01.18, AC-01.19, AC-01.33).
- **"Today"** is obtained from a `CLOCK` token (`() => Date`) and converted into a local `YYYY-MM-DD` date (`todayLocal`). The validators receive the date as a parameter (REQ-01.21).
- The error `kind` is never shown. **A single message per field** (REQ-01.16): `field.errorMessage` if it is not empty and, if it is, the country's generic message.
- **Error visibility:** `state.touched() && state.invalid()`. `touched()` becomes `true` when leaving the field (blur) and `submit()` marks all interactive fields. Interpretation of "not while typing" (REQ-01.16): the error does not appear before the first blur or the first attempt to advance. After that it updates live, so it disappears as soon as the value is valid. If the human prefers to freeze it until the next blur, it is a local change (an `errorShown` signal per field) that does not affect this decision.
- **G2-5 (REQ-01.22)** is not validated in the form: the configuration mapper decides it. If a valid field with one of the required roles is missing, `FormConfig.status = 'unavailable'` and `DynamicForm` is never created.

### Submission, advancing and focus

- `submission.action`: saves the normalized values (ADR-0004) and navigates to `/:country/plans`.
- `submission.onInvalid`: walks the ordered list of fields (section and then `order`), finds the first one with `invalid()` and calls `focusBoundControl()`. `errorSummary()` is not used for the order, because the screen order is defined by the configuration (REQ-01.17).
- Enter in a text field submits the `<form>` natively, which is equivalent to "continue" (REQ-01.30). The continue button is `type="submit"` and is always enabled.

### Accessibility (manual bindings)

- Control `id` `f-{key}`; `<label for="f-{key}">`; help `help-{key}`; error `err-{key}`.
- `[attr.aria-describedby]` with `help-{key}` and, only if the error is visible, `err-{key}`. `[attr.aria-invalid]` is `'true'` or `null`. For `checkbox` and `select` the native `required` is set by `FormField`, and it is checked in a DOM unit test.

### Validations in Strapi (V1)

Repeatable component `form.validation-rule { kind: enumeration[minLength, maxLength, pattern, min, max, integer], value: decimal?, pattern: string? }` inside `form-field.validations`. The mapper checks that each rule has the parameters of its `kind` and that the `kind` matches the field type (5.2 and 5.3). Whatever does not fit is ignored with a warning.

## Consequences

- **Positive:**
  - It follows the pattern documented by Angular for JSON-driven forms, with stable API in v22.
  - All business logic stays in pure functions with deterministic tests. The schema is just an adapter.
  - Changing a field, the order, an option or a catalog validation in Strapi requires no code (case A of `country-content`). A new validation type is a localized case B: one value in the `kind` enum, one pure function and one line in the registry.
  - The flat model by key fits the persistence by technical identifier (ADR-0004) and the reconciliation of 5.4. Moving a field to another section does not move the value.
- **Negative:**
  - The typed accessor casts trade the compiler's structural guarantee for a runtime invariant (the guide itself warns about this). It is mitigated with tests of the mapper and of the initial value by type.
  - The form does not react to hot configuration changes: it has to be recreated. This is consistent with Q-01.20 (one load per app reload).
  - Signal Forms is stable only since v22 and there are fewer community examples and answers than for Reactive Forms. There are three documentation gaps that require a spike.
  - With V1, the admin shows the `value` and `pattern` fields for any `kind`, and the business can fill in the wrong one. The mapper ignores it with a warning, but the business gets no warning in the admin.
  - The `kind` catalog is duplicated (Strapi enum and TypeScript type).
- **Risks and mitigation:**
  - *ReDoS from a malicious `pattern`:* the pattern is written by a trusted team in the admin (US-01 §7). The risk is accepted and documented.
  - *The spike results contradict an assumption:* the alternatives are local (custom control with `FormValueControl`) and do not change the decision. If a real Signal Forms blocker appeared, option 3 requires a new decision log entry replacing D5.

### Confirmation

- Unit: validator registry (AC-01.14, AC-01.15, AC-01.33), role rules with an injected date (AC-01.17, AC-01.18 and AC-01.19 with `TZ=America/Bogota`, ADR-0007), mapper (AC-01.20, AC-01.25) and form DOM (AC-01.26: `aria-describedby`, `aria-invalid`, `fieldset`/`legend`).
- E2E: AC-01.2, AC-01.12, AC-01.16 (focus on the first invalid field) and AC-01.27 (keyboard only and Enter).
- Review: `grep -rE "ReactiveFormsModule|FormGroup|FormControl|NgModel" frontend/src` with no results; no error text written in the code.

## Pros and cons of the options

### 1. Signal Forms, flat model (chosen)

- For: meets D5; official pattern; stable keys; reactive validation without subscriptions; fits zoneless.
- Against: casts in the accessors; young API; documentation gaps (empty number, date as string).

### 2. Signal Forms, model nested by section

- For: the model structure mirrors the screen, and the summary could read the sections directly.
- Against: if the business changes a field's section, its value changes path in the model. That complicates the reconciliation (5.4 says a section change keeps the value) and the persistence. The section order is fixed and can be derived without nesting.

### 3. Typed Reactive Forms (`FormRecord`)

- For: mature and well-documented API for dynamic forms; hot `addControl`/`removeControl`; the official comparison recommends it for "complex, dynamic forms" when proven stability is needed.
- Against: **contradicts D5**. It mixes Observables with state that is signals in the rest of the app. It would only be considered as a contingency plan with a new human decision.

### 4. Custom form with signals

- For: full control and no new API to learn.
- Against: it reimplements `touched`, submission, the native attributes and focus; more code to maintain and test; contradicts D5.

### V1. Repeatable component with `kind` (chosen)

- For: simple populate (`populate[n]=validations`); order and list visible in a single admin block; all rules share the same shape, so the mapper is simple.
- Against: irrelevant parameters visible depending on the `kind`; consistency is checked by the app and not by Strapi.

### V2. Dynamic zone, one component per validation type

- For: each type shows only its parameters; typing is stricter in the admin.
- Against: `integer` has no parameters, and a component without attributes is not documented as valid. Populating dynamic zones with several components is more verbose (`populate[dz][on][...]`). The filters documentation states that you cannot filter by dynamic zones (not needed here, but it limits evolution).

### V3. Free-form JSON

- For: maximum flexibility.
- Against: it is not "typed" (the PDF requires it and US-01 §6 forbids it: "no como texto libre"); the admin does not help the business.

## References

Consulted on 2026-11-22:

- Signal Forms, comparison ("Stable (v22+)" status): https://angular.dev/guide/forms/signals/comparison
- Signal Forms, overview (imports, `FormField`): https://angular.dev/guide/forms/signals/overview
- Dynamic forms with JSON (`Record` model, schema in a loop, `[formField]`, `[formRoot]`, casts): https://angular.dev/guide/forms/signals/dynamic-forms-with-json
- Validation (built-in validators, `validate`, error shape, `touched() && invalid()`): https://angular.dev/guide/forms/signals/validation
- Field state (`touched` on blur, `markAsTouched`): https://angular.dev/guide/forms/signals/field-state-management
- Submission (`submit`, `FormRoot`, `onInvalid`, `focusBoundControl`): https://angular.dev/guide/forms/signals/form-submission
- Models (`undefined` excluded from the tree, `null` for empty values, date controls and `Date`): https://angular.dev/guide/forms/signals/models
- Native controls (number, checkbox, dynamic select, no `select multiple`): https://angular.dev/essentials/signal-forms
- Custom controls (`FormValueControl`, `FormCheckboxControl`): https://angular.dev/guide/forms/signals/custom-controls
- `form` API (stable since v22.0): https://angular.dev/api/forms/signals/form
- `FormOptions` API (`injector`, `submission`; `experimentalWebMcpTool` experimental): https://angular.dev/api/forms/signals/FormOptions
- `FormField` API (`formField` input, stable since v22.0): https://angular.dev/api/forms/signals/FormField
- Strapi 5, populate of components and dynamic zones: https://docs.strapi.io/cms/api/rest/populate-select
- Strapi 5, filters (no filtering by dynamic zones): https://docs.strapi.io/cms/api/rest/filters

> Translated into English on 2026-11-23 (D16); no content change.
