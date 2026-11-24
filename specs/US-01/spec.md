# US-01 — Policyholder and vehicle data form

| Field | Value |
|---|---|
| Status | Approved (2026-11-22, G2) |
| Version | 0.5 (post-G2 change approved by the human in D14; translated into English under D16) |
| Author | Requirements Analyst (subagent) |
| Approver | Human (G2) |
| Related ADRs | ADR-0001 (multi-country), ADR-0002 (Signal Forms), ADR-0003 (access and security), ADR-0004 (state and navigation), ADR-0007 (testing); `docs/architecture/content-model.md`, `api-contracts.md` (Accepted, G3) |
| Related decisions | D3, D4, D5, D6, D7, D10 · G2-1, G2-2, G2-3, G2-4, G2-5, G2-6, G2-7, G2-10, G2-13 · `CLAUDE.md` §8 and §11 |

> Conventions of this spec:
> - **Config.** column: `Strapi` = the business changes it without a deployment; `Code` = fixed in the frontend, changing it requires development; `Strapi + Code` = the catalog or the logic are in code and the values in Strapi.
> - A REQ with origin `Q-01.n → G2-n` comes from a question resolved in G2 (see `docs/decision-log.md`, G2 section).
> - Attribute names (`key`, `role`, `section`, `minimumAge`...) are **indicative**. The final names are set by the Software Architect in the content model (G3).
> - The added scenarios are written in English, like the PDF ones, to align them with the test names (`it('AC-01.n ...')`).

## 1. Story (literal from the PDF)

> As a person interested in insuring my car, I want to enter my data and my vehicle's data in a simple form, so that I receive insurance options suited to my country and my vehicle.

**Context (literal):** Fields change by country. In Colombia the identity document is usually the citizenship ID (cédula de ciudadanía) or foreigner ID (cédula de extranjería), and the vehicle is identified by its license plate (placa). In Chile the document is the RUT and the vehicle is identified by its license plate (patente). The business team wants to add, remove or reorder fields from Strapi without asking development for changes.

**Business rules (literal):**

1. Each field is configured in Strapi with: label, type (text, number, select, date, checkbox), required flag, validations, help text, error message, order and country.
2. Select fields (for example, make or city) get their options from Strapi.
3. The vehicle year cannot be later than next year or more than 20 years old.
4. The policyholder must be of legal age.

**Other PDF sources that apply to this story (literal):**

- Step 1, *Data form*: "Captures policyholder and vehicle data. Fields, types, validations, copy and order are configured in Strapi per country."
- Scope rules: "The same application and the same build serve Colombia and Chile." · "Changing a form field or a plan in Strapi must be reflected in the app without changing code." · "Use fictitious data only." · "Use a front-end strategy to persist the data; a database is not required."
- Technical requirements: Forms "Step 1 form generated dynamically from the Strapi configuration, with typed validations" · Security "No Strapi token with write permissions may reach the browser. Public role permissions minimal and justified" · Environment "[...] with seed data for both countries" · Accessibility "The wizard can be completed using only the keyboard, and fields have accessible labels" · Responsive "Works on mobile and desktop".
- Evaluation criteria: "loading and error state handling" · "form and plans 100% configurable from Strapi".

## 2. Scope

**Included**

- Resolving the country from the URL (D3, G2-3) and the behavior when the country is missing or unknown.
- Loading the country's form configuration from Strapi, with loading, error, empty and malformed-configuration states.
- Dynamic rendering of the 5 field types, in the configured order, with label, help text, required, typed validations and error message.
- Business rules for the vehicle year and legal age (G2-4).
- Blocking progress to step 2 while there are errors; progress when the form is valid.
- Per-country persistence in `sessionStorage` (D6) and reconciliation of the stored data with the current configuration.
- Output contract consumed by US-02 (price, by roles) and US-03 (summary and masking, by roles) (G2-1).
- Wizard shell (step indicator, navigation between steps and focus on step change), reused by US-02 and US-03 (Q-01.19 → G2-13).
- Accessibility (labels, associated errors, keyboard, focus, announcements) and responsive layout of step 1.
- Field seed for CO and CL (minimum content that exercises the story).

**Out of scope**

- Plan list, selection and price calculation (US-02). Summary, document masking, terms and payment (US-03).
- Cross-field validations (e.g., the number pattern depending on the document type), RUT check digit, conditional fields, default values and placeholders (Q-01.17 → G2-13; the PDF does not list them among a field's attributes).
- Validating the document against official registries.
- Translation into other languages: CO and CL use Spanish; the texts come from Strapi per country.

## 3. Requirements

### A. Country and configuration loading

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-01.1 | The app takes the country from the first URL segment (`/co`, `/cl`) and requests from Strapi **only** that country's configuration. The same build serves both countries. | D3; PDF AC "Form configured by country"; scope rule 1 | Countries: Strapi (`Country`). Route mechanism: Code | Unit · E2E |
| REQ-01.2 | At `/` a country selection is shown with the names of the countries published in Strapi; the other texts on that page (e.g., its heading) also come from Strapi, in content not tied to a country whose location is set by the content model (G3). With an unknown or unpublished code, the fixed text "país no disponible" ("country not available") is shown together with the list of published countries as links. `/CO` redirects to `/co`. None of these cases counts as a wizard step (D7). The country is not detected by IP or by browser language. | Q-01.1 → G2-3; G2-2 | Country list and texts: Strapi. Behavior and "país no disponible" text: Code | E2E |
| REQ-01.3 | While the configuration is being fetched, the fixed text "cargando" ("loading") is shown (G2-2); neither a partial form nor the continue button is shown. | Evaluation criteria ("loading and error state handling"); `CLAUDE.md` §8; Q-01.6 → G2-2 | Code | Unit · E2E |
| REQ-01.4 | If fetching the configuration fails (no network, timeout, HTTP 4xx/5xx or uninterpretable response), the fixed texts "error de carga" ("load error") and "reintentar" ("retry") are shown (G2-2); the retry action repeats the request. The form is not shown and progress is not possible. | Evaluation criteria; `CLAUDE.md` §8; Q-01.6 → G2-2 | Code | Unit · E2E (intercepting the network) |
| REQ-01.5 | If the country has no published and valid field, an empty state is shown with the empty-state message configured for the country in Strapi, and progress is not possible. If that message is missing in Strapi, it is a configuration error and the country's generic message is shown (REQ-01.13). | Q-01.12 → G2-13, adjusted by G2-2 | Message: Strapi | Unit · E2E |
| REQ-01.6 | The configuration is read from Strapi on every application load, with no persistent cache in the browser (no `localStorage`, no `sessionStorage`, no service worker). Only **published** entries are used; drafts do not appear. | PDF AC "Configuration change without deployment"; scope rule 2; Q-01.20 → G2-13 | Code | E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) · Review |
| REQ-01.7 | Malformed configuration is handled according to the table in 5.3: an invalid field is skipped with a console warning; an invalid validation is ignored without losing the field. The app does not fail because of unexpected data from Strapi. | Gap checklist §3 ("empty, null or malformed data"); Q-01.11 → G2-13 | Code | Unit (mapper) |

### B. Form rendering

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-01.8 | Only the published fields of the active country are shown, in ascending `order` within each section (REQ-01.12). Ties and empty `order` values are resolved deterministically: empty ones last, ties broken by identifier (5.3). | Rule 1; PDF AC "Form configured by country"; context ("add, remove or reorder"); Q-01.11 → G2-13 | Strapi | Unit · E2E (seed) · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) |
| REQ-01.9 | Each field shows its configured label and, if present, its configured help text. No field label or help text is in the code. | Rule 1; step 1 ("copy [...] configured in Strapi") | Strapi | Unit · E2E |
| REQ-01.10 | Supported types: `text`, `number`, `select`, `date` and `checkbox`. Each type uses a control with the equivalent native semantics (implementation detail pending the forms ADR, D5). The type catalog is fixed in code; each field's type is configured in Strapi. | Rule 1; technical requirement Forms | Strapi + Code | Unit · E2E |
| REQ-01.11 | `select` fields show the options configured in Strapi for that field and country, in the configured order. The stable **value** of the option is stored, not its label; the label is resolved with the current configuration. | Rule 2 | Strapi | Unit · E2E (seed) · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) |
| REQ-01.12 | Each field belongs to a `policyholder` section or a `vehicle` section assigned in Strapi. The sections are shown as groups with an accessible legend, in a fixed order: policyholder, then vehicle. Each section's legend is a country text in Strapi. | Step 1 ("policyholder and vehicle data"); US-03 rule 1; Q-01.4 → G2-6 | Field section and legend: Strapi. Section catalog and order: Code | Unit · E2E |
| REQ-01.13 | All step 1 UI texts come from Strapi per country: step title, continue button, empty-state message, generic error message, section legends and step indicator texts. The only fixed texts in code are "cargando", "error de carga", "reintentar" and "país no disponible" (G2-2). If a required text is missing in Strapi, it is a configuration error: instead of the form, the country's generic message is shown and progress is not possible. There are no default texts in code. If the generic message itself is missing, the configuration is treated as uninterpretable (REQ-01.4). | Step 1 ("copy"); `CLAUDE.md` §11; Q-01.6 → G2-2 | Strapi (the 4 fixed texts: Code) | Unit · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) · Review |

### C. Validation and progress

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-01.14 | A field marked as required is indicated visually and programmatically. It is empty (and therefore invalid) if it has no value. In `text`, a whitespace-only value counts as empty. In `checkbox`, required means "checked". | Rule 1 (required flag); Q-01.16 → G2-13 | Strapi | Unit · E2E |
| REQ-01.15 | Each field accepts **typed** validations from a closed catalog per field type (5.2): `text` accepts `minLength`, `maxLength` and `pattern`; `number` accepts `min`, `max` and `integer`; `select`, `date` and `checkbox` only accept `required` and the role rules. The business chooses in Strapi which validations apply and with which parameters. A validation that does not match the field's type is ignored (REQ-01.7). | Rule 1 (validations); technical requirement "typed validations"; Q-01.5 → G2-7 | Catalog: Code. Assignment and parameters: Strapi | Unit · E2E |
| REQ-01.16 | When a field does not meet its validation, its single configured error message (the same for any failing validation or rule) is shown next to the field, programmatically associated, and the field is marked as invalid. It is shown when the field loses focus with an invalid value or when trying to proceed, not while typing. If the field's message is empty, the country's generic message is used (REQ-01.13). | PDF AC "Field validation"; rule 1 (error message); Q-01.10 → G2-13 | Text: Strapi. When it is shown: Code | Unit · E2E |
| REQ-01.17 | While any field is invalid, it is not possible to move to step 2. On attempting it, all errors are shown, the focus goes to the first invalid field (in on-screen order) and the URL does not change. | PDF AC "Field validation"; `CLAUDE.md` §8 (focus) | Code | Unit · E2E |
| REQ-01.18 | With a valid form, the continue action stores the data (REQ-01.23) and navigates to step 2 of the same country. The route name is set by the multi-country ADR. | PDF scope (step 1 → step 2); D7 | Code | E2E |

### D. Business rules

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-01.19 | Vehicle year: valid if and only if `currentYear − 20 ≤ year ≤ currentYear + 1`, with both limits **inclusive** and `currentYear` = calendar year of the device's local date. Integers only. It applies to the fields with role `vehicleYear` (REQ-01.28). | Rule 3; Q-01.2 and Q-01.9 → G2-4 | Code (logic and fixed limits, G2-4) | Unit · E2E |
| REQ-01.20 | Legal age: the age in completed years at the device's local date must be `≥ minimumAge` of the country. The birthday itself counts as completed. A future date is invalid. For someone born on 29 February, in non-leap years the birthday counts from 1 March. It applies to the fields with role `birthDate` (REQ-01.28). | Rule 4; Q-01.2 → G2-4; Q-01.8 → G2-13 | Strapi + Code (logic in code; minimum age per country in Strapi, seed 18 in CO and CL, G2-4) | Unit · E2E |
| REQ-01.21 | Dates are stored and compared as calendar dates `YYYY-MM-DD`, without time zone conversion. The age and year validators are pure functions that receive the reference date ("today") as a parameter, so that tests are deterministic. | Gap checklist §3 (time zone, deterministic testing); `CLAUDE.md` §8 (pure functions) | Code | Unit (including the `America/Bogota` zone) · E2E (fixed clock) |
| REQ-01.22 | The rules in REQ-01.19 and REQ-01.20 cannot be disabled from Strapi. If the country's published configuration lacks a valid field with any of the required roles (`birthDate`, `vehicleYear`, `documentNumber`), the form becomes "unavailable": the country's generic message is shown, progress is not possible and a console warning is logged. If several fields have the same role, the rule applies to all of them. | Rules 3 and 4; gap checklist §3 ("if the business removes or renames a field"); Q-01.2 → G2-4; Q-01.7 → G2-5 | Code | Unit · E2E |

### E. Persistence

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-01.23 | Step 1 values are stored in `sessionStorage`, separated by country, on every value change and on continue. When going back from step 2 to step 1 (with the app's action or with the browser's "back"), the values are still loaded. Only values are stored: no "step completed" flag is persisted (G2-10). They are cleared only after a successful payment, as US-03 decides, and never after a rejected payment. | PDF AC "Keep data when going back"; scope rule (front-end persistence); D6; Q-01.15 → G2-13; G2-10 | Code | Unit · E2E |
| REQ-01.24 | On reloading the page in the same tab, the step 1 values are restored. In a new tab the form starts empty. | D6 | Code | E2E |
| REQ-01.25 | One country's data is never shown or used in another: `/co` and `/cl` have independent storage. | D6; D3 | Code | Unit · E2E |
| REQ-01.26 | On restore, the stored data is reconciled with the current configuration according to the table in 5.4: values of removed fields, of removed options or of fields whose type changed are discarded; new fields start empty; the rest is kept and revalidated with the current rules. Corrupt storage is discarded without breaking the app. | Gap checklist §3 ("persisted data that no longer matches"); `country-content` (common checks); Q-01.14 → G2-13 | Code | Unit · E2E |

### F. Contract for US-02 and US-03

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-01.27 | US-01 exposes, per country, the step 1 result: for each current field, its identifier, type, section, role (if any), value and display value (option label for `select`), and an `isComplete` flag. `isComplete` is **computed every time** from the stored values and the current configuration and rules; it is never persisted (G2-10, F-00.5). If it is false, US-02 and US-03 redirect to step 1 of the same country with the data kept (G2-10). | US-02 rule 4 (price based on the step 1 data); US-03 rule 1 (summary); Q-01.3 → G2-1; Q-01.4 → G2-6; Q-01.18 → G2-10 | Code | Unit |
| REQ-01.28 | The fields with data that other stories need are identified by a **role** assigned in Strapi from a catalog fixed in code with three values: `documentNumber`, `birthDate` and `vehicleYear`. Consumers: the US-01 rules (`birthDate` → REQ-01.20, `vehicleYear` → REQ-01.19); **US-02**, which computes the price with `ageInYears` (from `birthDate`) and `vehicleAge` (from `vehicleYear`) (G2-8); and **US-03**, which masks all the fields with role `documentNumber`. Nothing is bound to the field's label, order or technical identifier. A new role requires code (case B of `country-content`). | US-03 rule 2 ("document number [...] partially masked"); US-02 rule 4; rules 3 and 4; Q-01.3 → G2-1 | Field role: Strapi. Role catalog: Code | Unit |

### G. Accessibility and responsive

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-01.29 | Each control has an associated visible `<label>`. The help text and the error message are associated with `aria-describedby`; the invalid field has `aria-invalid="true"`; the required one is marked programmatically. Each section is a group with a legend. | Technical requirement Accessibility; `CLAUDE.md` §8 | Code | Unit (DOM) · E2E (`getByLabel`) · Manual (G5) |
| REQ-01.30 | Step 1 can be completed with the keyboard only: all fields, the `select` options, the `checkbox`es, continue and retry. The tab order matches the visual order, with no positive `tabindex`, and the focus is always visible. Enter in a text field submits the form (equivalent to continue). | Technical requirement Accessibility | Code | E2E (keyboard only) · Manual (G5) |
| REQ-01.31 | On entering step 1 (initial load, return from step 2 or successful retry) the focus goes to the step heading. The step indicator (3 steps, D7) marks the current one with `aria-current="step"`; its texts come from Strapi. US-01 implements this shell and US-02 and US-03 reuse it. | `CLAUDE.md` §8 ("focus managed when changing step"); D7; Q-01.19 → G2-13 | Code (texts: Strapi) | E2E · Manual (G5) |
| REQ-01.32 | Changes to the loading, error and empty states are announced to screen readers (live region or `role="alert"`). | `CLAUDE.md` §8; technical requirement Accessibility | Code | Unit (DOM) · Manual (G5) |
| REQ-01.33 | Step 1 works without horizontal scroll from 320 CSS px wide up to desktop; on narrow screens the fields are in a single column. | Technical requirement Responsive | Code | E2E (viewport 320 and 1280) · Manual (G5) |
| REQ-01.36 | On every wizard screen of a country (steps 1 to 3 and confirmation) there is a visible link to go back to the country selection (`/`). Its text comes from Strapi per country (`wizardTexts.changeCountryLabel`, required like the other texts, G3-5). Going back does not erase the country's stored data (D6): on entering that country again, it is recovered. It is keyboard operable and has an area of at least 24×24 px. | D14 (human request after G5) | Strapi (text) + Code | E2E |

### H. Seed and security

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-01.34 | The seed includes one form for CO and another for CL with fictitious data that, together, use the 5 field types and contain: document (CO: document type with cédula de ciudadanía and cédula de extranjería, plus number; CL: RUT), placa (CO) or patente (CL), make and city as `select`, birth date and vehicle year. The document, birth date and year fields carry their roles; all the required texts of the country are filled in. | Context (literal); rule 2; technical requirement Environment ("seed data for both countries"); G2-1; G2-2 | Strapi (seed) | E2E · Manual |
| REQ-01.35 | The configuration is fetched with read-only requests to the allowed public endpoints (D4): no browser request carries a Strapi token. | Technical requirement Security; D4; `CLAUDE.md` §6 | Code + permissions in Strapi | E2E (network inspection) · Review |

## 4. Acceptance criteria

### PDF scenarios (literal)

```gherkin
# AC-01.1
Scenario: Form configured by country
  Given fields are configured in Strapi for Colombia and for Chile
  When I open the application in the context of a country
  Then I see only the fields configured for that country, in the defined order

# AC-01.2
Scenario: Field validation
  Given I am filling out the form
  When a field does not meet its configured validation
  Then I see the configured error message next to the field
  And I cannot move to the next step

# AC-01.3
Scenario: Configuration change without deployment
  Given the business team adds a new published field in Strapi
  When I reload the application
  Then the new field appears without code changes

# AC-01.4
Scenario: Keep data when going back
  Given I moved on to step 2
  When I go back to step 1
  Then my data is still filled in
```

### Scenarios added by the spec

The example dates assume `today = 2026-11-22` and minimum age 18, unless the scenario says otherwise. In the tests the date is fixed (REQ-01.21).

```gherkin
# AC-01.5 — origin: Q-01.1 → G2-3
Scenario: Root URL without country
  Given Colombia and Chile are published in Strapi
  When I open "/"
  Then I see a country selection listing Colombia and Chile with the names configured in Strapi
  And choosing Chile takes me to step 1 of "/cl"

# AC-01.6 — origin: Q-01.1 → G2-3, G2-2
Scenario Outline: Unknown or unavailable country code
  When I open "<url>"
  Then <result>

  Examples:
    | url | result                                                                         |
    | /pe | I see the fixed text "país no disponible" and the published countries as links |
    | /CO | I am redirected to "/co"                                                       |

# AC-01.7 — origin: REQ-01.3, REQ-01.32, G2-2
Scenario: Loading the form configuration
  Given the form configuration request for my country has not answered yet
  When I open step 1
  Then I see the fixed text "cargando" announced to assistive technologies
  And I see neither form fields nor the continue button

# AC-01.8 — origin: REQ-01.4, REQ-01.32, G2-2
Scenario: Error loading the form configuration and retry
  Given the form configuration request fails
  When I open step 1
  Then I see the fixed text "error de carga" announced to assistive technologies
  And I see the action "reintentar" and no continue button
  When the service is available again and I activate "reintentar"
  Then the form is shown with the fields of my country

# AC-01.9 — origin: Q-01.12 → G2-13
Scenario: Country without configured fields
  Given my country has no published fields in Strapi
  When I open step 1
  Then I see the empty-state message configured for my country
  And I cannot move to the next step

# AC-01.10 — origin: PDF context ("add, remove or reorder fields")
Scenario: Field removed and fields reordered without deployment
  Given the business team unpublishes field "A" and swaps the order of fields "B" and "C" in Strapi
  When I reload the application
  Then field "A" is not shown
  And field "C" appears before field "B"

# AC-01.11 — origin: REQ-01.6
Scenario: Draft fields are not shown
  Given a field for my country is saved as draft but not published in Strapi
  When I open step 1
  Then that field is not shown

# AC-01.12 — origin: REQ-01.9, REQ-01.10
Scenario Outline: Each field type is rendered with its configured copy
  Given a published field of type "<type>" with a label and help text
  When I open step 1
  Then I see a <control> with that label
  And the help text is associated with the control

  Examples:
    | type     | control                  |
    | text     | text input               |
    | number   | numeric input            |
    | select   | list of options          |
    | date     | date input               |
    | checkbox | checkbox                 |

# AC-01.13 — origin: rule 2
Scenario: Select options come from Strapi
  Given the select field "make" has the options "Marca A", "Marca B" in that order in Strapi
  When I open the options of "make"
  Then I see exactly "Marca A" and "Marca B" in that order
  When the business adds the option "Marca C" and I reload
  Then "Marca C" is offered without code changes

# AC-01.14 — origin: rule 1 (required flag)
Scenario: Required field left empty
  Given a required text field
  When I leave it empty or with only spaces and try to continue
  Then I see its configured error message next to it
  And I stay on step 1

# AC-01.15 — origin: Q-01.5 → G2-7
Scenario Outline: Typed validation configured in Strapi
  Given a "<type>" field configured with the validation "<validation>"
  When I enter "<value>" and leave the field
  Then the field is <state>

  Examples:
    | type   | validation              | value  | state   |
    | text   | pattern ^[A-Z]{3}\d{3}$ | ABC123 | valid   |
    | text   | pattern ^[A-Z]{3}\d{3}$ | ABC12  | invalid |
    | text   | maxLength 5             | ABCDEF | invalid |
    | number | min 1                   | 0      | invalid |
    | number | integer                 | 2.5    | invalid |

# AC-01.16 — origin: REQ-01.17
Scenario: Focus goes to the first invalid field when trying to continue
  Given the second and fourth fields on screen are invalid
  When I activate continue
  Then all error messages are shown
  And the focus is on the second field
  And the URL is still step 1

# AC-01.17 — origin: rule 3, Q-01.9 → G2-4
Scenario Outline: Vehicle year limits
  Given today is "2026-11-22"
  When I enter "<year>" in the vehicle year field and try to continue
  Then the vehicle year is <state>

  Examples:
    | year | state   |
    | 2005 | invalid |
    | 2006 | valid   |
    | 2026 | valid   |
    | 2027 | valid   |
    | 2028 | invalid |

# AC-01.18 — origin: rule 4, Q-01.2 → G2-4, Q-01.8 → G2-13
Scenario Outline: Policyholder of legal age
  Given today is "<today>" and the minimum age of my country is 18
  When I enter "<birthDate>" as birth date and try to continue
  Then the birth date is <state>

  Examples:
    | today      | birthDate  | state   |
    | 2026-11-22 | 2008-11-22 | valid   |
    | 2026-11-22 | 2008-11-23 | invalid |
    | 2026-11-22 | 2026-11-23 | invalid |
    | 2026-02-28 | 2008-02-29 | invalid |
    | 2026-03-01 | 2008-02-29 | valid   |

# AC-01.19 — origin: REQ-01.21 (time zone)
Scenario: Dates are not shifted by the time zone
  Given the device time zone is "America/Bogota"
  And the local date-time is "2026-11-22 20:00" (UTC "2026-11-23 01:00")
  When I enter "2008-11-23" as birth date
  Then the birth date is invalid because I am 17 on my local date
  And the stored value is exactly "2008-11-23"

# AC-01.20 — origin: Q-01.2 → G2-4, Q-01.7 → G2-5
Scenario: A field required by a business rule is missing in the configuration
  Given the published configuration of my country has no field with role "birthDate"
  When I open step 1
  Then I see the generic error message configured for my country instead of the form
  And I cannot move to the next step
  And a configuration warning is logged in the console

# AC-01.21 — origin: D6
Scenario: Reload keeps step 1 data in the same tab
  Given I filled some fields of step 1
  When I reload the page
  Then the fields keep their values
  When I open the application in a new tab
  Then step 1 is empty

# AC-01.22 — origin: D6, D3
Scenario: Data is separated by country
  Given I filled step 1 in "/co"
  When I open "/cl"
  Then the Chile form is empty
  When I go back to "/co"
  Then my Colombia data is still filled in

# AC-01.23 — origin: Q-01.14 → G2-13
Scenario: Stored data after a field or option is removed in Strapi
  Given I saved a value for field "A" and the option "Marca B" for "make"
  And the business unpublishes field "A" and removes the option "Marca B"
  When I reload the application
  Then field "A" is not shown and its value is discarded
  And "make" is empty and must be selected again

# AC-01.24 — origin: Q-01.14 → G2-13
Scenario: Stored value no longer meets a changed validation
  Given I saved "ABC12" in a text field whose configuration had no pattern
  And the business adds the pattern ^[A-Z]{3}\d{3}$ to that field
  When I reload the application and try to continue
  Then the value "ABC12" is still shown
  And I see the configured error message next to the field

# AC-01.25 — origin: Q-01.11 → G2-13
Scenario: Malformed field configuration is skipped
  Given my country has a published field with an unknown type and another without label
  When I open step 1
  Then both fields are skipped and the rest of the form works
  And a warning is logged in the console for each skipped field

# AC-01.26 — origin: technical requirement Accessibility
Scenario: Accessible labels and descriptions
  Given step 1 is shown
  Then every control can be found by its visible label
  And each control with help text references it with aria-describedby
  And each invalid control has aria-invalid="true" and references its error message
  And each section is a group with an accessible name

# AC-01.27 — origin: technical requirement Accessibility, REQ-01.31
Scenario: Complete step 1 using only the keyboard
  Given I open step 1 of my country
  Then the focus is on the step heading
  And the step indicator marks step 1 with aria-current="step"
  When I fill every field, choose select options and toggle checkboxes using only the keyboard
  And I press Enter in a text field
  Then I move to step 2 without using a pointer

# AC-01.28 — origin: technical requirement Responsive
Scenario Outline: Step 1 on mobile and desktop
  Given the viewport is <width> CSS pixels wide
  When I open step 1
  Then there is no horizontal scroll and every field and the continue button are visible and usable

  Examples:
    | width |
    | 320   |
    | 1280  |

# AC-01.29 — origin: REQ-01.27, REQ-01.28 (contract for US-02 and US-03), G2-1, G2-10
Scenario: Step 1 result exposed to the next steps
  Given I completed step 1 of "/co" with valid data
  Then the step 1 result identifies the fields with roles "documentNumber", "birthDate" and "vehicleYear"
  And it gives the option label, not only the value, for each select
  And it reports the result as complete
  And no "completed" flag is stored in sessionStorage
  When the business makes one of my stored values invalid and I reload
  Then the step 1 result is reported as incomplete

# AC-01.30 — origin: D4, technical requirement Security
Scenario: No Strapi token reaches the browser
  When I load step 1 of any country
  Then every request to the content API is a GET without an Authorization header

# AC-01.31 — origin: step 1 ("copy"), CLAUDE.md §11
Scenario: Step copy comes from Strapi
  Given the business changes the continue button text for Chile in Strapi
  When I reload "/cl"
  Then the continue button shows the new text
  And the Colombia button text is unchanged

# AC-01.32 — origin: REQ-01.18
Scenario: Continue with a valid form
  Given every field of step 1 is valid
  When I activate continue
  Then I am on step 2 of the same country
  And my step 1 data is stored for that country

# AC-01.33 — origin: Q-01.16 → G2-13
Scenario: Required checkbox
  Given a required checkbox field
  When I leave it unchecked and try to continue
  Then I see its configured error message next to it
  And I stay on step 1

# AC-01.34 — origin: PDF context, technical requirement Environment
Scenario Outline: Seed form for each country
  Given the project was started with the seed data
  When I open "<url>"
  Then I see a document field, a <plate> field, make and city selects, a birth date and a vehicle year
  And the form uses the types text, number, select, date and checkbox

  Examples:
    | url | plate   |
    | /co | placa   |
    | /cl | patente |

# AC-01.35 — origin: Q-01.6 → G2-2
Scenario: Missing text in Strapi is a configuration error
  Given the continue button text for Chile is empty in Strapi
  When I open step 1 of "/cl"
  Then I see the generic error message configured for Chile instead of the form
  And I cannot move to the next step
  And no default text from the code is shown

# AC-01.36 — origin: D14
Scenario: Go back to the country selection
  Given I am on any screen of the "/co" quote
  When I activate the "change country" link configured in Strapi for Colombia
  Then I see the country selection
  And when I choose Colombia again my step 1 data is still filled in
```

| AC | Scenario | REQs covered |
|---|---|---|
| AC-01.1 | Form configured by country (PDF) | REQ-01.1, REQ-01.8 |
| AC-01.2 | Field validation (PDF) | REQ-01.15, REQ-01.16, REQ-01.17 |
| AC-01.3 | Configuration change without deployment (PDF) | REQ-01.6, REQ-01.8 |
| AC-01.4 | Keep data when going back (PDF) | REQ-01.23 |
| AC-01.5 | Root URL without country | REQ-01.2 |
| AC-01.6 | Unknown or unavailable country code | REQ-01.2 |
| AC-01.7 | Loading the form configuration | REQ-01.3, REQ-01.32 |
| AC-01.8 | Error loading and retry | REQ-01.4, REQ-01.32, REQ-01.31 |
| AC-01.9 | Country without configured fields | REQ-01.5 |
| AC-01.10 | Field removed and reordered without deployment | REQ-01.6, REQ-01.8 |
| AC-01.11 | Draft fields are not shown | REQ-01.6 |
| AC-01.12 | Each field type rendered with its copy | REQ-01.9, REQ-01.10 |
| AC-01.13 | Select options come from Strapi | REQ-01.11 |
| AC-01.14 | Required field left empty | REQ-01.14, REQ-01.16 |
| AC-01.15 | Typed validation configured in Strapi | REQ-01.15, REQ-01.16 |
| AC-01.16 | Focus on first invalid field | REQ-01.17 |
| AC-01.17 | Vehicle year limits | REQ-01.19, REQ-01.21 |
| AC-01.18 | Policyholder of legal age | REQ-01.20, REQ-01.21 |
| AC-01.19 | Dates not shifted by time zone | REQ-01.21 |
| AC-01.20 | Field required by a rule is missing | REQ-01.22, REQ-01.28 |
| AC-01.21 | Reload keeps data in the same tab | REQ-01.24 |
| AC-01.22 | Data separated by country | REQ-01.25 |
| AC-01.23 | Stored data after field or option removed | REQ-01.26 |
| AC-01.24 | Stored value no longer meets changed validation | REQ-01.26 |
| AC-01.25 | Malformed field configuration skipped | REQ-01.7 |
| AC-01.26 | Accessible labels and descriptions | REQ-01.12, REQ-01.29 |
| AC-01.27 | Complete step 1 with keyboard only | REQ-01.30, REQ-01.31 |
| AC-01.28 | Step 1 on mobile and desktop | REQ-01.33 |
| AC-01.29 | Step 1 result exposed to next steps | REQ-01.23, REQ-01.27, REQ-01.28 |
| AC-01.30 | No Strapi token reaches the browser | REQ-01.35 |
| AC-01.31 | Step copy comes from Strapi | REQ-01.13 |
| AC-01.32 | Continue with a valid form | REQ-01.18, REQ-01.23 |
| AC-01.33 | Required checkbox | REQ-01.14 |
| AC-01.34 | Seed form for each country | REQ-01.34, REQ-01.10 |
| AC-01.35 | Missing text in Strapi is a configuration error | REQ-01.13 |
| AC-01.36 | Go back to the country selection | REQ-01.36 |

## 5. Open questions and gaps

All questions were resolved in G2 (2026-11-22, "Apruebo todo" ("I approve everything"); see `docs/decision-log.md`, G2 section). The "Answer" column holds the approved resolution: the proposal of draft 0.1, except where the G2 table says otherwise, which is indicated in the row.

| ID | Question | Answer | Status | Resolved by |
|---|---|---|---|---|
| Q-01.1 | How does one enter a country? What happens at `/`, with an unknown code (`/pe`), with an existing but unpublished country, or with uppercase (`/CO`)? | `/` shows the selection among the `Country` entries published in Strapi (it is not a wizard step, D7 intact). Unknown or unpublished code: "país no disponible" (fixed text, G2-2) with the published countries as links. `/CO` redirects to `/co`. The country is not detected by IP or by browser language. | Resolved | G2-3 |
| Q-01.2 | Are legal age and vehicle year validations configurable by the business, or rules fixed in code? Is the age 18 in both countries? | Option C (5.1): the logic of both rules is in code and always applies; the field is chosen in Strapi through its role (G2-1); the minimum age is a `Country` attribute in Strapi (18 in CO and CL); the year limits (20 back, +1) are fixed in code. | Resolved | G2-4 |
| Q-01.3 | How does the app know which field is the birth date, the vehicle year or the document number, if the business can rename, reorder or remove fields? | Closed catalog of roles in code: `documentNumber`, `birthDate`, `vehicleYear`. The business assigns at most one role per field in Strapi. The US-01 rules, the US-02 price (`birthDate`, `vehicleYear`) and the US-03 masking (`documentNumber`) are bound to the role, never to the label, the order or the technical identifier. | Resolved | G2-1 |
| Q-01.4 | The PDF speaks of "policyholder and vehicle data" and US-03 shows both separately, but there is no section among a field's attributes. How are they grouped? | Per-field section attribute with the closed catalog `policyholder` · `vehicle`. The sections go in a fixed order (policyholder, vehicle); within each one, `order` is respected. Each section's legend is a country text in Strapi. | Resolved | G2-6 |
| Q-01.5 | The PDF says "validations" and "typed validations" without saying which. What validations can the business configure for each type? | Catalog in 5.2: `text` accepts `minLength`, `maxLength` and `pattern`; `number` accepts `min`, `max` and `integer`; `select`, `date` and `checkbox` only `required` and the role rules. A new validation type follows case B of `country-content`. | Resolved | G2-7 |
| Q-01.6 | `CLAUDE.md` §11 says the visible texts come from Strapi, but some states are shown before the configuration is available or when Strapi does not respond. Where do those texts come from? | Adjusted in G2: only four fixed texts in code, in Spanish: "cargando", "error de carga", "reintentar" and "país no disponible" (`CLAUDE.md` §11, exception G2-2). Everything else comes from Strapi, including the country-selection texts. If a text is missing in Strapi, it is a configuration error and the generic message is shown; there are no default texts in code. | Resolved | G2-2 |
| Q-01.7 | What happens if the business removes or unpublishes the field a rule depends on (birth date, vehicle year, document), or removes its role? And if two fields have the same role? | A required role is missing: form "unavailable" with the country's generic message, no progress possible and a console warning; a PDF rule is never skipped. Repeated role: the rule applies to all the fields with that role (and US-03 masks all the `documentNumber` fields). | Resolved | G2-5 |
| Q-01.8 | Legal age details: reference date and time zone? Does the birthday itself count? 29 February? Future date? | Device's local date; computation with calendar dates only. The birthday counts as completed. For 29 February, in non-leap years the birthday is reached on 1 March. A future date is invalid, with the same field error message. | Resolved | G2-13 |
| Q-01.9 | Vehicle year: inclusive limits? Is "20 years" counted by year or by exact date? Current year according to which time zone? | By year only: range `[currentYear − 20, currentYear + 1]` with both ends inclusive (in 2026: from 2006 to 2027). `currentYear` according to the device's local date. Integers only. | Resolved | G2-4 |
| Q-01.10 | The PDF defines **one** error message per field. What is shown if several validations fail, if the message is empty, and when? | One message per field (literal from the PDF), the same for any failing validation or rule. If it is empty, the country's generic message (consistent with G2-2). It is shown when leaving the field with an invalid value and when trying to proceed; not while typing. | Resolved | G2-13 |
| Q-01.11 | What happens with empty, null or malformed data coming from Strapi? | Table in 5.3: skip the field or ignore the validation with a console warning, without breaking the app. | Resolved | G2-13 |
| Q-01.12 | What is shown if a country has no published field? | Empty state with the country's message in Strapi, without the continue button. Adjusted by G2-2: if that message is missing in Strapi, it is a configuration error and the country's generic message is shown (a fixed text from the code is no longer used). | Resolved | G2-13 (adjusted by G2-2) |
| Q-01.13 | The PDF does not include a technical field identifier, but persisting and reconciling data requires a stable one. What happens if the business changes it? | Technical identifier per field, unique within the country, not visible to the user. Changing the label, the order, the section or the texts keeps the data; changing the identifier is equivalent to removing a field and creating another (the stored value is discarded). The content model (G3) decides how uniqueness is guaranteed. | Resolved | G2-13 |
| Q-01.14 | What happens to the data stored in `sessionStorage` when the configuration changes in Strapi (new field, removed field, field with another validation, removed option, changed type)? | Table in 5.4. | Resolved | G2-13 |
| Q-01.15 | When is the step 1 data stored and when is it cleared? | It is stored on every value change and on continue. It is cleared only after a successful payment (US-03 decides) and never after a rejected payment. No "completed" flag is persisted (G2-10). The document number and the birth date remain in clear text in `sessionStorage`; this is acceptable with fictitious data, tab-bound storage and D6 approved. | Resolved | G2-13 |
| Q-01.16 | Semantics of each type: are spaces trimmed? Must `pattern` cover the whole value? What does required mean in a `checkbox`? Does `number` accept decimals? | `text`: leading and trailing spaces are trimmed before validating and storing; `pattern` always covers the full value. Required `checkbox` = checked. `number`: accepts decimals unless `integer` is set; the decimal separator is handled by the native control. `date`: stored as `YYYY-MM-DD`. No uppercase transformation. | Resolved | G2-13 |
| Q-01.17 | Country-specific documents: must the RUT check digit be validated? Does the CO number pattern depend on the chosen type (CC or CE)? | Only a configurable `pattern` per field, without check digit or cross-field validations (CO uses a pattern that accepts CC and CE). A check digit would be a new validation type (case B of `country-content`) with a new REQ. The seed patterns are proposed by the Strapi Developer with fictitious data and reviewed in the demo. | Resolved | G2-13 |
| Q-01.18 | What happens if step 2 or 3 is opened by URL without a complete and valid step 1? | Redirect to the missing step (step 1 of the same country, with the data kept). `isComplete` is exposed by US-01 and always computed with the current configuration; no flag is persisted (F-00.5). | Resolved | G2-10 |
| Q-01.19 | Which story owns the wizard shell (step indicator, navigation between steps, focus on step change)? | US-01, because it is implemented first; US-02 and US-03 reuse it. The indicator marks the current step with `aria-current="step"`; its texts come from Strapi. It has 3 steps (D7). | Resolved | G2-13 |
| Q-01.20 | Is the configuration requested again when going back from step 2 to 1, or only on app load? | Once per app load; to see Strapi changes you have to reload, which is what the PDF AC asks for. No persistent cache in the browser (REQ-01.6). The absence of an intermediate HTTP cache (nginx, Strapi headers) is guaranteed by the ADR or the API contract (G3). | Resolved | G2-13 |

### 5.1 Q-01.2 detail: configurable or fixed rules (resolved by G2-4)

| Option | Description | Pros | Cons |
|---|---|---|---|
| A. Fully configurable | `minAge(n)` and `yearRange(back, forward)` are generic catalog validations; the business assigns them to any field in Strapi. | Maximum configurability ("100% configurable") and no roles. | The business can remove the validation or the field and the PDF rule stops being met without anyone noticing. |
| B. Fully fixed | The logic and the parameters (18, 20, +1) are in code and bound to a field by role. | The PDF rules are always met. | Changing a country's age requires a deployment, and "legal age" depends on each country's regulation, which the PDF points out as different. |
| **C. Mixed (approved, G2-4)** | Logic in code and always active, bound by role (G2-1). Minimum age as a `Country` attribute in Strapi; year limits fixed in code. If the field with the role is missing, G2-5. | The PDF rules cannot be skipped; what depends on the country (age) is configurable; what the PDF sets as a number (20, +1) is not. | More concepts for the business (roles); a configuration error leaves the form unavailable (G2-5). |

### 5.2 Q-01.5 detail: validation catalog (approved, G2-7)

| Field type | `required` | Configurable validations (parameters) | Role rules (always active) |
|---|---|---|---|
| `text` | Yes (whitespace only = empty) | `minLength(n)`, `maxLength(n)`, `pattern(regex, full match)` | `documentNumber` (no validation of its own; US-03 consumes it for masking) |
| `number` | Yes | `min(n)`, `max(n)`, `integer` | `vehicleYear` → REQ-01.19 (US-02 uses it for `vehicleAge`) |
| `select` | Yes | None (the value must be a current option; implicit, in code) | — |
| `date` | Yes | None | `birthDate` → REQ-01.20 and future date invalid (US-02 uses it for `ageInYears`) |
| `checkbox` | Yes (= checked) | None | — |

A role assigned to an incompatible type (e.g., `birthDate` on a `text`) is treated as malformed configuration (5.3).

### 5.3 Q-01.11 detail: malformed configuration (approved, G2-13)

| Case | Handling |
|---|---|
| Global response not interpretable (not JSON, unexpected structure) | "error de carga" with "reintentar" (REQ-01.4) |
| Field with unknown type or without type | The field is skipped and a console warning is logged |
| Field without label | The field is skipped and a console warning is logged (there is no accessible control without a label) |
| `select` without options or with options lacking value or label | The invalid options are skipped; if none remains, the field is skipped and a console warning is logged |
| Validation that does not match the type or has invalid parameters (regex that does not compile, `min > max`, negative number in `maxLength`) | That validation is ignored, the field is kept and a console warning is logged |
| Role on an incompatible type | The role is ignored and a console warning is logged; if it was a required role, G2-5 applies (REQ-01.22) |
| Repeated field identifier in the country | The first by `order` is kept and the others are skipped with a console warning |
| Empty or repeated `order` | Empty ones go last; ties are sorted by identifier |
| Empty field `errorMessage` | Country's generic message (REQ-01.16) |
| Empty help text | Not shown (it is optional) |
| Empty required UI text of the country (title, continue, empty state, section legend, indicator texts) | Configuration error: country's generic message instead of the form (REQ-01.13, G2-2) |
| Empty country generic message | Uninterpretable configuration: "error de carga" (REQ-01.4) |
| Skipped field that had a required role | G2-5 (REQ-01.22) |
| No valid field left after skipping | Empty state (REQ-01.5) |

### 5.4 Q-01.14 detail: persisted data versus current configuration (approved, G2-13)

| Change in Strapi since the data was stored | Handling |
|---|---|
| New published field | It appears empty |
| Removed or unpublished field | Its value is discarded |
| Change of label, help text, error message, order or section | The value is kept |
| Change of `required` or of validations | The value is kept and revalidated; the error is shown when leaving the field or when trying to proceed; `isComplete` becomes false if it no longer complies |
| Removed `select` option | The value is discarded; the `select` is left unselected |
| Field type changed | The value is discarded |
| Change of the country's minimum age | The birth date is revalidated with the new age |
| Value with an unexpected type (tampered storage) | That value is discarded |
| Corrupt country storage (invalid JSON) | All the step 1 data of that country is discarded and a console warning is logged |

## 6. Data and contracts

The names are indicative; the final model goes in `docs/architecture/content-model.md` and the contracts in `docs/architecture/` (Software Architect, G3).

**What US-01 consumes from Strapi (read-only, D4):**

- `Country`: code (`co`, `cl`), display name, locale, minimum age (G2-4) and step 1 texts (title, continue, empty state, generic error, section legends, step indicator texts: REQ-01.13, G2-6). Currency and other data are used by US-02 and US-03.
- Country-selection texts, which do not depend on any country (REQ-01.2, G2-2). Where they live in the content model is decided in G3.
- Form field, related to a `Country`, with the PDF attributes (label, type, required, validations, help text, error message, order, country) plus those approved in G2: technical identifier (Q-01.13), optional role `documentNumber` · `birthDate` · `vehicleYear` (G2-1), section `policyholder` · `vehicle` (G2-6) and options for `select` (stable value, label and order; rule 2). Only published entries.
- Validations as typed structures from the catalog in 5.2 (G2-7), not as free text.

**What US-01 stores in the browser (D6):**

- `sessionStorage`, one entry per country, only with the step 1 values indexed by the field's technical identifier: `string` for `text` and `date` (`YYYY-MM-DD`), `number` for `number`, `boolean` for `checkbox` and the option value for `select`. It does not store the Strapi configuration (REQ-01.6) or any "completed" flag (G2-10). The format, the key and whether it carries a schema version are decided by the persistence ADR.

**What US-01 exposes to US-02 and US-03 (REQ-01.27, REQ-01.28):**

- Per country: the list of current fields with identifier, type, section, role, value and display value, plus `isComplete`, which is computed on every query with the current configuration and never persisted (G2-10).
- **US-02** uses the roles `birthDate` (→ `ageInYears`) and `vehicleYear` (→ `vehicleAge`) for the simulated price (G2-8), and `isComplete` for its navigation guard (G2-10).
- **US-03** uses the sections for the summary (policyholder and vehicle, G2-6), the `documentNumber` role for masking (G2-1) and `isComplete` for its guard (G2-10).

## 7. Applicable non-functional requirements

- **Accessibility:** REQ-01.29 to REQ-01.32. Associated visible labels, `aria-describedby` for the help and the error, `aria-invalid`, groups with a legend per section, full keyboard operation, focus on the heading on entering the step and on the first invalid field on failure, announcements of loading, error and empty states. Final manual verification in G5.
- **Responsive:** REQ-01.33. From 320 px to desktop without horizontal scroll.
- **States:** loading (REQ-01.3), error with retry (REQ-01.4), empty (REQ-01.5), malformed configuration (REQ-01.7), missing text (REQ-01.13), configuration incomplete for the rules (REQ-01.22).
- **Texts:** everything from Strapi except the four fixed texts of G2-2 (REQ-01.13).
- **Security:** REQ-01.35. Only GET to the allowed public endpoints, without a token. The `pattern` comes from the Strapi admin, operated by a trusted team; a regex that does not compile is ignored (5.3).
- **Determinism:** REQ-01.21. Injectable reference date; in e2e the browser clock is fixed.
- **Configurability:** any content change (field of an existing type, order, section, texts, options, catalog validations, role, minimum age) is visible on reload without changing code (case A of `country-content`). A new field type, validation type or role requires code (case B).

## 8. Verification plan

The exact paths depend on the structure set by G3; the planned location is indicated.

| AC / REQ | Test type | Planned location |
|---|---|---|
| AC-01.17, AC-01.18, AC-01.19 (REQ-01.19 to REQ-01.21) | Unit of pure functions with injected date; AC-01.19 with `TZ=America/Bogota` | `frontend/**/*.spec.ts` (validators) |
| AC-01.15, AC-01.14, AC-01.33 (REQ-01.14, REQ-01.15) | Unit of the validator registry | `frontend/**/*.spec.ts` |
| AC-01.25, AC-01.20, AC-01.35 (REQ-01.7, REQ-01.13, REQ-01.22), ordering and tie-breaking of REQ-01.8 | Unit of the DTO → domain mapper with sample Strapi responses | `frontend/**/*.spec.ts` (mapper) |
| AC-01.23, AC-01.24, AC-01.29 (REQ-01.26 to REQ-01.28) | Unit of the reconciliation and of the exposed contract (including that no completed flag is persisted) | `frontend/**/*.spec.ts` (store) |
| AC-01.7, AC-01.8, AC-01.9 (REQ-01.3 to REQ-01.5, REQ-01.32) | Component unit (DOM) + E2E intercepting the network | `frontend/**/*.spec.ts`, `e2e/` |
| AC-01.1, AC-01.2, AC-01.4, AC-01.12, AC-01.13, AC-01.16, AC-01.32, AC-01.34 | E2E on the CO and CL seed (the full flow of one country is mandatory in the PDF) | `e2e/` |
| AC-01.3, AC-01.10, AC-01.11, AC-01.13 (second part), AC-01.31 (REQ-01.6, REQ-01.8, REQ-01.11, REQ-01.13) | E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) (G3-3) | `e2e/`, `docs/qa/manual-check.md` |
| AC-01.35 (REQ-01.13) | E2E (interception with `page.route`) with an empty required text in the response (G3-5) | `e2e/` |
| AC-01.36 (REQ-01.36) | E2E on the CO seed | `e2e/` |
| AC-01.5, AC-01.6, AC-01.21, AC-01.22 | E2E | `e2e/` |
| AC-01.26, AC-01.27 | E2E (queries by role and label, keyboard only) + Manual G5 | `e2e/`, `docs/qa/manual-check.md` |
| AC-01.28 | E2E with viewport 320 and 1280 + Manual G5 on mobile | `e2e/`, `docs/qa/manual-check.md` |
| AC-01.30 | E2E (request inspection) + Review with security checklist | `e2e/`, `reviews/` |
| REQ-01.6 (no persistent cache) | Review + E2E (interception with `page.route`, AC-01.3) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) | `reviews/`, `e2e/`, `docs/qa/manual-check.md` |

## 9. History

| Version | Date | Change | Reason |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial draft | Phase 3, procedure 2.1 of `sdd-traceability` |
| 0.2 | 2026-11-22 | G2 decisions applied | G2 approved by the human |
| 0.3 | 2026-11-22 | AC verification with Strapi changes adjusted to G3-3 | G3 |
| 0.4 | 2026-11-23 | REQ-01.36 and AC-01.36: link to go back to the country selection | D14 |
| 0.5 | 2026-11-23 | Translated into English, no content change | D16 |
