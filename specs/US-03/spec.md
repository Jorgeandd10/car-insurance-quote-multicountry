# US-03 — Summary and payment

| Field | Value |
|---|---|
| Status | Approved (2026-11-22, G2) |
| Version | 0.5 (translated into English under D16) |
| Author | Requirements Analyst (subagent) |
| Approver | Human (G2) |
| Related ADRs | ADR-0001 (multi-country), ADR-0003 (access and security), ADR-0004 (state, navigation and simulated payment), ADR-0005 (price rule), ADR-0006 (terms), ADR-0007 (testing); `docs/architecture/content-model.md`, `api-contracts.md` (Accepted, G3) |
| Related decisions | D3, D4, D6, D7, D8, D9, D10 · G2-1, G2-2, G2-5, G2-6, G2-8, G2-9, G2-10, G2-11, G2-12, G2-13 |
| Related specs | `specs/US-01/spec.md` and `specs/US-02/spec.md` (dependencies in section 6.3) |
| Related review | `reviews/000-G2-specs-cross-consistency.md` (F-00.1, F-00.3, F-00.4, F-00.5) |

> **How to read this spec.** All the `Q`s were resolved in G2 (`docs/decision-log.md`, section "G2"). A `REQ` with origin `Q-03.n → G2-n` derives from the answer approved in that decision. The names of content types, fields, routes and storage keys that appear here are descriptive; the real names are set by the Software Architect in G3.

## 1. Story (literal from the PDF)

> As a person who chose a plan, I want to review a summary of my quote and pay, so that I become insured.

**Context (literal):** Before paying, the person must confirm their data and accept the terms and conditions, whose text varies by country and is managed by the business team from Strapi. Payment is simulated for this test.

**Business rules (literal):**

1. The summary shows the policyholder's data, the vehicle's data and the chosen plan with its final price.
2. The document number is shown partially masked.
3. From the summary the person can go back to edit their data or change the plan.
4. The pay button is enabled only after accepting the terms and conditions.
5. The payment cannot be submitted twice.
6. On successful payment, a confirmation with a simulated quote number is shown.

**PDF scope rules that apply (literal):**

- "Payment is simulated: a button that leads to a confirmation screen or a mock gateway. Do not integrate real payment gateways or use real card data."
- "Use fictitious data only."
- "Use a front-end strategy to persist the data; a database is not required."
- Accessibility: "The wizard can be completed using only the keyboard, and fields have accessible labels".
- Responsive: "Works on mobile and desktop".

## 2. Scope

- **Included:**
  - Step 3 of the wizard (summary): policyholder and vehicle data, chosen plan and final price, masked document.
  - Terms and conditions per country from Strapi and acceptance checkbox.
  - "Edit data" (step 1) and "change plan" (step 2) actions from the summary.
  - Simulated payment gateway inside step 3, with a chosen result (approved/rejected) and without card fields (D9, G2-12).
  - Confirmation screen with a simulated quote number (D7: 3 steps + confirmation).
  - Protection against double submission, rejection message and retry.
  - Loading, empty and error states of the calls the summary needs; accessibility and responsive layout of step 3 and of the confirmation.
  - Behavior of the persisted data (D6) on entering the summary, after a rejection and after a successful payment.
- **Out of scope:**
  - Real gateways, card or bank data (PDF, D9).
  - Recording the quote or the payment in Strapi or in any backend: the public role only reads and the proxy only lets `GET` through (D4).
  - Real policy issuance, sending emails, PDF download.
  - Definition of the price rule (US-02, D8, G2-8): US-03 **consumes** it.
  - Validations of the step 1 form (US-01): US-03 uses the `isComplete` flag exposed by US-01 (G2-10).

## 3. Requirements

**Config** column: `Strapi` = the business changes it without a deployment; `Code` = fixed in the frontend; `Strapi + Code` = the content comes from Strapi and the logic or the format are in code.

### 3.1 Data and plan summary

| ID | Verifiable requirement | Origin | Config | Verification |
|---|---|---|---|---|
| REQ-03.1 | The summary shows all the step 1 data (policyholder and vehicle) of the URL's country, taken from the step 1 result exposed by US-01 (REQ-01.27) from the state persisted for that country. | PDF rule 1; PDF AC "Complete summary"; D6 | Strapi + Code (which fields exist: Strapi; reading the state: code) | Unit · E2E |
| REQ-03.2 | Each data item is shown with the **label** configured in Strapi for its field (never the technical key), grouped in the `policyholder` and `vehicle` sections in that fixed order, with each section's legend from Strapi, and within each section in the configured order. | PDF rule 1; Q-03.3 → G2-6 | Strapi (label, field section, legend, order) + Code (section catalog and order) | Unit |
| REQ-03.3 | The values are shown readably according to their type: `select` shows the option label (the display value of REQ-01.27, not the internal value); `checkbox` shows the configured yes/no text; `date` is shown with the format of the country's locale without shifting the day by time zone; `number` with the number format of the locale; an empty optional field is shown as "—". | Q-03.4 → G2-13 | Strapi + Code (labels and texts: Strapi; `Intl` formatting: code) | Unit |
| REQ-03.4 | The summary shows the chosen plan with its name, short description, coverages, benefits and **final price** in the country's currency and format (COP and CLP without decimals), with no breakdown between base price and adjustment. | PDF rule 1; US-02 rule "price in the country's currency"; Q-03.5 → G2-13 | Strapi + Code (plan, currency and locale: Strapi; `Intl` format: code) | Unit · E2E |
| REQ-03.5 | The summary's final price is recalculated when the summary loads, from the **stored plan id** (the only plan data that is persisted), with the **same pure function** that step 2 uses (D8, G2-8: `Math.round(basePrice × Π multipliers)`), the step 1 data and the current plan and factors in Strapi. For the same data and the same configuration, step 2 and the summary show the same value. | D8; PDF rule 1; Q-03.6 → G2-9; G2-8 | Strapi + Code (factors: Strapi; function: code) | Unit |

### 3.2 Masked document

| ID | Verifiable requirement | Origin | Config | Verification |
|---|---|---|---|---|
| REQ-03.6 | The fields with **role `documentNumber`** (role assigned in Strapi according to the US-01 catalog, REQ-01.28) are shown partially masked in the summary and on any later screen. If several fields have that role, all of them are masked. The document type (a different field, without that role) is shown in clear. The full value does not appear in the DOM of those screens (not in text, nor in attributes, nor in accessible names). If no field has that role, the US-01 form is already "unavailable" (G2-5) and the summary is not reached. | PDF rule 2; Q-03.1 → G2-1; G2-5; F-00.1 | Strapi + Code (field role: Strapi; role catalog and masking: code) | Unit · E2E |
| REQ-03.7 | The masking is done by a pure function with this rule: only alphanumeric characters are counted; the last `min(4, floor(n/2))` remain visible; the rest of the alphanumerics are replaced with `*`; the separators (`.`, `-`, space) are kept. Same rule in CO and CL. | Q-03.2 → G2-13 | Code | Unit |
| REQ-03.8 | The masking is presentation only: the wizard state keeps the full value so that "edit data" shows it in full in step 1. | PDF rule 3; US-01 PDF AC "Keep data when going back"; Q-03.23 → G2-13 | Code | Unit · E2E |

### 3.3 Going back to edit, changing the plan and guards

| ID | Verifiable requirement | Origin | Config | Verification |
|---|---|---|---|---|
| REQ-03.9 | From the summary there is an "edit data" action that leads to step 1 of the same country with all the data preloaded. | PDF rule 3 | Code (navigation); Strapi (text) | E2E |
| REQ-03.10 | From the summary there is a "change plan" action that leads to step 2 with the current plan marked as chosen. | PDF rule 3; US-02 PDF AC "Plan selection" | Code (navigation); Strapi (text) | E2E |
| REQ-03.11 | On returning to the summary after editing data or changing the plan, the summary shows the new values and the recalculated final price. Editing data keeps the chosen plan if it is still available. From the edited step 1, the flow continues through step 2 (with the plan preselected) before returning to the summary. | PDF rules 1 and 3; Q-03.9 → G2-13 | Code | Unit · E2E |
| REQ-03.12 | The acceptance of the terms **is not persisted**: the checkbox starts unchecked every time the summary is entered (including the reload and the return from step 1 or 2). It stays checked after a rejected payment while the person remains on the summary. | Q-03.9 → G2-13; Q-03.21 → G2-13 | Code | Unit · E2E |
| REQ-03.13 | Access guards for the summary (on entering by navigation, by direct URL or on reload): if the step 1 `isComplete` exposed by US-01 (REQ-01.27), **computed with the current configuration**, is false, the app redirects to step 1 of the same country with the data kept; if it is true but there is no stored plan, it redirects to step 2. No "step completed" flag is persisted. | Q-03.8 → G2-10; Q-03.7 → G2-10; F-00.5 | Code | Unit · E2E |
| REQ-03.14 | When the summary loads, the stored plan is checked against the current list in Strapi: if it is no longer published and active, or its currency is not the country's, the app redirects to step 2, where the selection is discarded and the announced warning of US-02 is shown (REQ-02.17); it is not possible to pay for that plan. The persisted values of fields that no longer exist in the configuration are not shown (US-01 discards them). It is not checked again right before paying. | analysis.md §1 (persisted data vs. inactive plan); Skill §3; Q-03.7 → G2-11 and G2-13 | Code (check); Strapi (status of plans and fields) | Unit · E2E |

### 3.4 Terms and conditions

| ID | Verifiable requirement | Origin | Config | Verification |
|---|---|---|---|---|
| REQ-03.15 | The summary shows the terms and conditions of the URL's country, obtained from Strapi. The text is not in the code: if the business edits and publishes it, the change is visible on reload. | PDF context; PDF AC "Terms by country"; D3 | Strapi | Unit · E2E |
| REQ-03.16 | The terms text is presented without executing or inserting arbitrary HTML or scripts that come in the content, inline in the summary, inside a region with a maximum height, readable, focusable and scrollable with the keyboard. Scrolling to the end is not required in order to accept. The text format (plain, Markdown or rich text) is decided by the Software Architect in G3 and must support paragraphs and lists. | CLAUDE.md §6 (security); Q-03.11 → G2-13; Q-03.13 → G2-13 | Code (render); Strapi (text) | Unit · Manual |
| REQ-03.17 | There is an acceptance checkbox with an associated `<label>` (text from Strapi), unchecked by default. Checking it is a condition for enabling the payment; unchecking it disables it again. | PDF rule 4; PDF AC "Terms by country"; PDF Accessibility | Strapi (text) + Code | Unit · E2E |
| REQ-03.18 | If there are no published terms for the country, the text is empty or more than one record arrives, a "terms unavailable" state is shown; the checkbox and the payment are disabled; the data and the plan remain visible. | Skill §3 (empty/null, several items); Q-03.12 → G2-13 | Code (behavior); Strapi (notice text) | Unit |
| REQ-03.19 | The pay button is enabled **if and only if**: the data and the plan are loaded and valid, the terms are loaded and accepted, and there is no payment in progress. | PDF rules 4 and 5; Q-03.7 → G2-10 and G2-11; Q-03.12 → G2-13 | Code | Unit · E2E |

### 3.5 Simulated payment

| ID | Verifiable requirement | Origin | Config | Verification |
|---|---|---|---|---|
| REQ-03.20 | The payment is simulated in the browser: there are no card or bank fields and no request other than `GET` is made (neither to Strapi nor to third parties). | PDF scope rules; D4; D9 | Code | Unit · E2E |
| REQ-03.21 | The result of the simulated payment is chosen by the user in a "simulated gateway" block **inside step 3** (no separate screen, D7), with two visible options: approved (selected by default) and rejected. There are no URL parameters, hidden flags or randomness: the e2e chooses the option like a user. | D9; analysis.md §1 (deterministic rejection); Q-03.15 → G2-12 | Code (mechanism); Strapi (texts, G2-2) | Unit · E2E |
| REQ-03.22 | On pressing pay, the button is locked and indicates that the payment is being processed during the whole operation; the terms checkbox, the result selector and the "edit data" and "change plan" actions are disabled until it finishes. If the person leaves the screen during the process, the pending result is discarded and no confirmation is shown. | PDF rule 5; PDF AC "Successful payment"; Q-03.16 → G2-13 | Code | Unit · E2E |
| REQ-03.23 | Each valid activation produces **a single** payment attempt even with a double click, a held Enter or a combination of Enter and click. The protection is in the application state, not only in the `disabled` attribute. Accepted limitation, documented in the README: without a backend (D4), paying in a duplicated tab is not prevented. | PDF rule 5; Q-03.17 → G2-13 | Code | Unit · E2E |
| REQ-03.24 | The simulated processing duration is fixed (1500 ms), is defined in code and is injectable in the tests. | Q-03.16 → G2-13 | Code | Unit |
| REQ-03.25 | With an approved result, the app navigates to the confirmation screen (D7), which shows the simulated quote number. | PDF rule 6; PDF AC "Successful payment"; D7 | Code; Strapi (texts) | E2E |
| REQ-03.26 | The quote number has the format `<CC>-<YYYYMMDD>-<XXXXXX>`: country code in uppercase, UTC date of the payment and 6 characters from the alphabet `A-H J-N P-Z 2-9` (without `0`, `O`, `1`, `I`), generated with a cryptographic random source of the browser. Uniqueness is only probabilistic (there is no central registry, D4). The clock and the random source are injectable in the tests. | Q-03.18 → G2-13 | Code | Unit |
| REQ-03.27 | The confirmation shows the quote number, the plan name and the final price paid (copied at the moment of payment), without personal data or document, and offers a "new quote" action that leads to the empty step 1 of the same country. | Q-03.20 → G2-13 | Strapi (texts) + Code | E2E |
| REQ-03.28 | After a successful payment, the country's wizard state in `sessionStorage` is cleared and only a minimal confirmation is stored (number, plan name, final price, currency, date; **no document or personal data**). Reloading the confirmation shows it again. Going back with the browser does not allow paying for that quote again: the summary redirects to the empty step 1. "New quote" also clears the stored confirmation. | PDF rule 5; D6; Q-03.19 → G2-13 | Code | Unit · E2E |
| REQ-03.29 | If the confirmation is accessed without a successful payment in that country's session, the app redirects to step 1. | Q-03.19 → G2-13 | Code | Unit |
| REQ-03.30 | With a rejected result, a clear error message is shown (text from Strapi, without technical details) next to the pay button; the user stays on the summary with their data, the plan, the price and the terms acceptance intact; the button is re-enabled to retry; the message is removed when a new attempt starts; there is no retry limit. | PDF AC "Rejected payment"; Q-03.21 → G2-13 | Strapi (message) + Code | Unit · E2E |

### 3.6 Loading, error, country, texts, accessibility and responsive

| ID | Verifiable requirement | Origin | Config | Verification |
|---|---|---|---|---|
| REQ-03.31 | While the data the summary needs is loading (form configuration, plans and price factors, terms, UI texts), the "cargando" ("loading") indicator is shown in the affected section and the payment is disabled. | CLAUDE.md §8 (explicit states); PDF criterion "loading and error state handling"; G2-2 | Code (fixed text "cargando", G2-2) | Unit |
| REQ-03.32 | If one of those calls fails, the "error de carga" ("load error") message is shown in the affected section with the "reintentar" ("retry") action; the payment is disabled and the persisted data is not lost. | CLAUDE.md §8; PDF criterion "loading and error state handling"; Q-03.14 → G2-2 | Code (fixed texts "error de carga" and "reintentar", G2-2) | Unit · Manual |
| REQ-03.33 | On entering the summary and the confirmation, the focus moves to the main heading of the screen. | CLAUDE.md §8 (focus on step change) | Code | Unit · E2E |
| REQ-03.34 | Step 3 and the confirmation can be completed with the keyboard only, with a logical focus order: Tab/Shift+Tab between controls, Space on the checkbox, arrow keys on the result selector, Enter or Space on the buttons; the terms region is focusable and scrollable with the keyboard. | PDF Accessibility | Code | E2E · Manual (G5) |
| REQ-03.35 | Payment announcements and focus: the "processing" state is announced in an `aria-live="polite"` region; the rejection is announced as an alert (`role="alert"`); the focus is not lost (it does not go to `body`) when the button is locked (the technique is decided by the Angular Developer); the disabled button is associated via `aria-describedby` with the text explaining that the terms must be accepted. The masked document is read as is, without an alternative accessible text. | PDF Accessibility; CLAUDE.md §8; Q-03.22 → G2-13 | Code; Strapi (texts) | Unit · Manual (G5) |
| REQ-03.36 | Summary, payment and confirmation work from 320 px to desktop without horizontal page scrolling; on mobile the summary is in one column; the interactive controls have an area of at least 24×24 CSS px. | PDF Responsive; Q-03.24 → G2-13 | Code | E2E (viewport) · Manual (G5) |
| REQ-03.37 | The summary and the confirmation only read and write the state of the URL's country: the data, the plan and the confirmation of one country do not appear in the other. | D3; D6 | Code | Unit · E2E |
| REQ-03.38 | The visible texts of step 3 and of the confirmation (actions, checkbox label, yes/no, section legends, notices, options and title of the simulated gateway, rejection message, titles and the **country's generic error message**) come from Strapi per country. The only fixed texts in code, in Spanish, are "cargando", "error de carga", "reintentar" and "país no disponible" ("country not available"). If a required text of a section is missing in Strapi, it is treated as a configuration error: that section shows the country's generic error message (configured in Strapi, as in US-01 REQ-01.13) and the payment is disabled. If that generic message is missing too, the section shows the fixed texts "error de carga" and "reintentar". There are no other default texts in code. A network or contract failure follows REQ-03.32. | CLAUDE.md §11 (exception G2-2); Q-03.14 → G2-2; F-00.3; F-00.4; F-00.7; US-01 REQ-01.13 | Strapi (texts, including the generic message); Code (only the 4 fixed texts) | Unit |

### 3.7 PDF coverage

| PDF element | REQ | AC |
|---|---|---|
| Rule 1 (data, vehicle, plan, final price) | REQ-03.1 to REQ-03.5 | AC-03.1, AC-03.8, AC-03.9 |
| Rule 2 (masked document) | REQ-03.6, REQ-03.7, REQ-03.8 | AC-03.5, AC-03.6, AC-03.7 |
| Rule 3 (edit data, change plan) | REQ-03.9, REQ-03.10, REQ-03.11 | AC-03.10, AC-03.11 |
| Rule 4 (pay only after accepting the terms) | REQ-03.17, REQ-03.19 | AC-03.2, AC-03.12 |
| Rule 5 (no double submission) | REQ-03.22, REQ-03.23, REQ-03.28 | AC-03.3, AC-03.22, AC-03.29 |
| Rule 6 (confirmation with simulated number) | REQ-03.25, REQ-03.26 | AC-03.3, AC-03.27 |
| Context: confirm the data | Q-03.10 → G2-13 (reviewing the summary and paying is the confirmation) | AC-03.1 |
| Context: terms per country from Strapi | REQ-03.15 | AC-03.2, AC-03.15 |
| Context and scope: simulated payment, no cards | REQ-03.20, REQ-03.21 | AC-03.24, AC-03.25 |
| Scenario "Complete summary" | REQ-03.1, REQ-03.4 | AC-03.1 |
| Scenario "Terms by country" | REQ-03.15, REQ-03.17 | AC-03.2 |
| Scenario "Successful payment" | REQ-03.22, REQ-03.25 | AC-03.3 |
| Scenario "Rejected payment" | REQ-03.30 | AC-03.4 |
| Accessibility / Responsive | REQ-03.33 to REQ-03.36 | AC-03.33, AC-03.34, AC-03.35 |

## 4. Acceptance criteria

### PDF scenarios (literal)

```gherkin
# AC-03.1 — origin: PDF
Scenario: Complete summary
  Given I chose a plan
  When I reach the summary
  Then I see my data, my vehicle's data and the chosen plan with its final price

# AC-03.2 — origin: PDF
Scenario: Terms by country
  Given I am on the summary
  When I view the terms and conditions
  Then the text matches the one configured in Strapi for my country
  And the pay button is disabled until I accept them

# AC-03.3 — origin: PDF
Scenario: Successful payment
  Given I accepted the terms
  When I click pay
  Then the button is locked while the payment is processed
  And I see the confirmation with the quote number

# AC-03.4 — origin: PDF
Scenario: Rejected payment
  Given the simulated payment fails
  When I click pay
  Then I see a clear error message
  And I can try again without losing my information
```

### Scenarios added by the spec

The field and route names are descriptive; the real ones are set by G3.

```gherkin
# AC-03.5 — origin: PDF rule 2, Q-03.1 → G2-1, Q-03.2 → G2-13
Scenario: Colombian document partially masked
  Given I am on /co and the field with role "documentNumber" has the value "1234567890"
  When I reach the summary
  Then I see the document as "******7890"
  And the chosen document type is shown in clear
  And the text "1234567890" does not appear in the summary DOM

# AC-03.6 — origin: PDF rule 2, Q-03.1 → G2-1, Q-03.2 → G2-13
Scenario: Chilean RUT masked keeping the separators
  Given I am on /cl and the field with role "documentNumber" has the value "12.345.678-5"
  When I reach the summary
  Then I see the document as "**.***.678-5"
  And the text "12.345.678-5" does not appear in the summary DOM

# AC-03.7 — origin: Q-03.2 → G2-13 (unit test of the pure function)
Scenario Outline: Masking rule
  Given the document value is "<value>"
  When the masking function is applied
  Then the result is "<result>"

  Examples:
    | value        | result       |
    | 1234567890   | ******7890   |
    | 12.345.678-5 | **.***.678-5 |
    | E-123456     | *-***456     |
    | 12345        | ***45        |
    | 1234         | **34         |
    | 7            | *            |

# AC-03.8 — origin: PDF rule 1, Q-03.3 → G2-6, Q-03.4 → G2-13
Scenario: Readable data with Strapi labels
  Given in Strapi there is a select field with an option with value "mazda" and label "Mazda" that I chose in step 1
  And I checked a checkbox field
  And a date field has the value "1990-05-07"
  And an optional field was left empty
  When I reach the summary
  Then I see first the "policyholder" section and then the "vehicle" section, each with its legend configured in Strapi
  And each data item appears with the label configured in Strapi, in its section and in the configured order
  And the select shows "Mazda" and not "mazda"
  And the checkbox shows the "yes" text configured in Strapi for my country
  And the date shows 7 May 1990 in the format of my country's locale
  And the empty optional field shows "—"

# AC-03.9 — origin: D8, Q-03.6 → G2-9, G2-8
Scenario: Final price recalculated from the stored plan id
  Given in step 2 I chose a plan whose displayed final price was P
  And only the id of that plan is stored in sessionStorage, without a price
  When I reach the summary without my data or the configuration changing
  Then the summary shows the final price P in the currency and format of my country
  When I go back to step 1, change a data item used by the price rule and return to the summary
  Then the final price of the summary is the one computed by the price function with the new data item
  And it matches the one shown by step 2 for that plan

# AC-03.10 — origin: PDF rule 3, Q-03.9 → G2-13
Scenario: Edit data from the summary
  Given I am on the summary with the terms accepted
  When I choose "edit data"
  Then I see step 1 with all my data, including the full unmasked document
  When I change a data item and continue
  Then I go through step 2 with my plan preselected
  When I continue to the summary
  Then the summary shows the new data item and the same plan
  And the terms checkbox is unchecked and the pay button is disabled

# AC-03.11 — origin: PDF rule 3, Q-03.9 → G2-13
Scenario: Change plan from the summary
  Given I am on the summary with plan A chosen
  When I choose "change plan"
  Then I see step 2 with plan A marked as chosen
  When I choose plan B and continue
  Then the summary shows plan B with its final price
  And my step 1 data has not changed

# AC-03.12 — origin: PDF rule 4
Scenario: Withdraw the acceptance of the terms
  Given I accepted the terms and the pay button is enabled
  When I uncheck the checkbox
  Then the pay button is disabled again

# AC-03.13 — origin: Q-03.12 → G2-13 (empty state)
Scenario Outline: Terms unavailable for the country
  Given for my country <situation>
  When I reach the summary
  Then I see a notice that the terms are not available
  And the acceptance checkbox and the pay button are disabled
  And my data and the plan are still visible

  Examples:
    | situation                                  |
    | there are no published terms               |
    | the published terms have an empty text     |
    | more than one terms record arrives         |

# AC-03.14 — origin: CLAUDE.md §6, Q-03.11 → G2-13
Scenario: Terms with unsafe markup
  Given the terms text of my country contains "<img src=x onerror=alert(1)>"
  When the terms are shown
  Then no script is executed
  And no element coming from the unsanitized content is inserted into the DOM

# AC-03.15 — origin: PDF context
Scenario: Terms change without deployment
  Given the business edits and publishes the Chile terms in Strapi
  When I reload the summary on /cl
  Then I see the new text without code changes

# AC-03.16 — origin: CLAUDE.md §8 (loading state), G2-2
Scenario: Summary while the content is loading
  Given the Strapi responses that the summary needs have not arrived yet
  When I reach the summary
  Then I see the "cargando" indicator in each pending section
  And the pay button is disabled

# AC-03.17 — origin: CLAUDE.md §8 (error state), Q-03.14 → G2-2
Scenario: Error loading the terms and retry
  Given the terms request fails
  When I reach the summary
  Then I see the "error de carga" message in the terms section with the "reintentar" action
  And the pay button is disabled
  And my persisted data is not lost
  When I retry and the request responds correctly
  Then I see the terms and I can accept them

# AC-03.18 — origin: Q-03.8 → G2-10
Scenario Outline: Direct access to the summary with the wizard incomplete
  Given in the /co session <state>
  When I directly open the /co summary URL
  Then I am taken to <destination>

  Examples:
    | state                                                              | destination |
    | there is no step 1 data (isComplete is false)                      | step 1      |
    | step 1 is complete (isComplete true) but there is no stored plan   | step 2      |

# AC-03.19 — origin: analysis.md §1, Q-03.7 → G2-11
Scenario Outline: The chosen plan is no longer available
  Given I chose a plan and then the business <change> in Strapi
  When I reach the summary or reload it
  Then I am taken to step 2 of my country
  And I see the announced notice that the chosen plan is no longer available
  And no plan appears as chosen

  Examples:
    | change                                           |
    | deactivated it                                   |
    | unpublished it                                   |
    | gave it a currency different from my country's   |

# AC-03.20 — origin: analysis.md §1, Q-03.7 → G2-10, F-00.5
Scenario Outline: Persisted data that no longer meets the current configuration
  Given I completed step 1 and then the business <change> in Strapi
  When I reach the summary or reload it
  Then isComplete, computed with the current configuration, is false
  And I am taken to step 1 with my data kept
  When I try to proceed
  Then the affected field shows its configured error message

  Examples:
    | change                                                                 |
    | added a new required field                                             |
    | removed the option of a required select that I had chosen             |

# AC-03.21 — origin: Q-03.7 → G2-13
Scenario: Field removed from the configuration
  Given I completed step 1 and then the business removed or unpublished an optional field in Strapi
  When I reach the summary
  Then that field does not appear in the summary
  And the rest of my data is shown normally

# AC-03.22 — origin: PDF rule 5, Q-03.17 → G2-13
Scenario Outline: A single payment attempt on repeated inputs
  Given I accepted the terms
  When <action>
  Then the simulated gateway receives exactly one payment attempt

  Examples:
    | action                                                                      |
    | I double-click the pay button                                               |
    | I hold Enter down with the focus on the pay button                          |
    | I press Enter and click the pay button before the process finishes          |

# AC-03.23 — origin: PDF rule 5, Q-03.16 → G2-13
Scenario: Controls locked during processing
  Given I pressed pay and the payment is in progress
  Then the pay button indicates that the payment is being processed and does not accept new activations
  And the terms checkbox, the result selector and the "edit data" and "change plan" actions are disabled
  When the simulated duration ends
  Then the controls leave the processing state

# AC-03.24 — origin: PDF scope, D4, D9
Scenario: Simulated payment without card data or writes
  Given I am on the summary
  Then there are no card or bank data fields
  When I complete a payment with an approved or rejected result
  Then the browser has not made any request other than GET

# AC-03.25 — origin: D9, Q-03.15 → G2-12
Scenario Outline: Payment result chosen deterministically
  Given I accepted the terms
  And in the "simulated gateway" block of step 3 the "approved" option is selected by default
  When I choose the "<result>" option and press pay
  Then <effect>

  Examples:
    | result   | effect                                              |
    | approved | I see the confirmation with the quote number        |
    | rejected | I see the rejection message and stay on the summary |

# AC-03.26 — origin: PDF AC "Rejected payment", Q-03.21 → G2-13
Scenario: Rejection and retry without losing information
  Given I accepted the terms and chose the "rejected" result
  When I press pay
  Then I see next to the pay button the rejection message configured in Strapi for my country
  And the message is announced as an alert
  And I stay on the summary with my data, the plan, the final price and the terms acceptance intact
  And the pay button is enabled again
  When I choose the "approved" result and press pay again
  Then the rejection message disappears when the attempt starts
  And I see the confirmation with the quote number

# AC-03.27 — origin: PDF rule 6, Q-03.18 → G2-13 (unit test)
Scenario: Quote number format
  Given the injected clock reads 2026-11-22T10:00:00Z and the random source is fixed
  When the quote number is generated for Colombia
  Then the number matches the pattern "^CO-20261122-[A-HJ-NP-Z2-9]{6}$"
  And with the same random source the result is always the same

# AC-03.28 — origin: Q-03.19 → G2-13
Scenario: Reload the confirmation
  Given I paid successfully and I see the confirmation with number N
  When I reload the page
  Then I see the same confirmation with number N
  And the document is not stored in sessionStorage

# AC-03.29 — origin: PDF rule 5, Q-03.19 → G2-13
Scenario: Going back after a successful payment does not allow paying again
  Given I paid successfully and I see the confirmation
  When I use the browser's "back" action
  Then I do not see a summary with the pay button for that quote
  And I am taken to the empty step 1 of my country

# AC-03.30 — origin: Q-03.19 → G2-13
Scenario: Direct access to the confirmation without payment
  Given I have not paid successfully in the /cl session
  When I directly open the /cl confirmation URL
  Then I am taken to step 1 of /cl

# AC-03.31 — origin: Q-03.20 → G2-13
Scenario: Confirmation content and new quote
  Given I paid successfully
  Then the confirmation shows the quote number, the plan name and the final price paid
  And it does not show personal data or the document
  When I choose "new quote"
  Then I see the empty step 1 of my country

# AC-03.32 — origin: D3, D6
Scenario: Data and terms separated by country
  Given on /co I completed step 1 and chose a plan
  When I open in the same tab the /cl summary URL without having completed Chile
  Then I am taken to step 1 of /cl without Colombia data
  And when I reach the /cl summary I see the Chile terms and not the Colombia ones

# AC-03.33 — origin: PDF Accessibility
Scenario: Summary and payment with the keyboard only
  Given I reached the summary using only the keyboard
  When I go through the screen with Tab and Shift+Tab
  Then the focus goes in logical order through the edit actions, the terms region, the acceptance checkbox, the result selector and the pay button
  And I can scroll the terms with the keyboard, check the checkbox with Space, choose the result with the arrow keys and pay with Enter
  And I reach the confirmation without using the mouse

# AC-03.34 — origin: CLAUDE.md §8, Q-03.22 → G2-13
Scenario: Focus and announcements in step 3
  When I reach the summary
  Then the focus is on the main heading of the summary
  And the terms checkbox has an accessible name equal to its label
  And the disabled pay button is associated via aria-describedby with the text asking to accept the terms
  When I press pay
  Then the "processing" state is announced in an aria-live region
  And the focus does not go to body while the payment is processed
  When the payment is rejected
  Then the message is announced as an alert
  When I retry and the payment is approved
  Then the focus is on the confirmation heading and the quote number is readable by a screen reader

# AC-03.35 — origin: PDF Responsive, Q-03.24 → G2-13
Scenario Outline: Summary and payment on mobile and desktop
  Given a viewport <width> px wide
  When I complete the summary and the payment
  Then the page has no horizontal scrolling
  And the terms can be read and scrolled
  And the checkbox and the buttons have an area of at least 24×24 CSS px

  Examples:
    | width |
    | 320   |
    | 375   |
    | 1280  |

# AC-03.36 — origin: Q-03.14 → G2-2, F-00.4, F-00.7
Scenario Outline: UI text missing in Strapi
  Given in Strapi my country is missing <missing text>
  When I reach the summary
  Then the affected section shows <what I see>
  And no other default text written in the code appears
  And the pay button is disabled

  Examples:
    | missing text                                                 | what I see                                                    |
    | the terms checkbox label                                     | the generic error message configured in Strapi for my country |
    | the rejection message                                        | the generic error message configured in Strapi for my country |
    | the terms checkbox label and also the generic error message  | the fixed texts "error de carga" and "reintentar"             |
```

| AC | Scenario | REQs covered |
|---|---|---|
| AC-03.1 | Complete summary (PDF) | REQ-03.1, REQ-03.4 |
| AC-03.2 | Terms by country (PDF) | REQ-03.15, REQ-03.17, REQ-03.19 |
| AC-03.3 | Successful payment (PDF) | REQ-03.22, REQ-03.25 |
| AC-03.4 | Rejected payment (PDF) | REQ-03.30 |
| AC-03.5 | Colombian document masked | REQ-03.6, REQ-03.7 |
| AC-03.6 | RUT masked with separators | REQ-03.6, REQ-03.7 |
| AC-03.7 | Masking rule (unit) | REQ-03.7 |
| AC-03.8 | Readable data with Strapi labels and sections | REQ-03.1, REQ-03.2, REQ-03.3, REQ-03.38 |
| AC-03.9 | Price recalculated from the plan id | REQ-03.4, REQ-03.5, REQ-03.11 |
| AC-03.10 | Edit data from the summary | REQ-03.8, REQ-03.9, REQ-03.11, REQ-03.12 |
| AC-03.11 | Change plan from the summary | REQ-03.10, REQ-03.11 |
| AC-03.12 | Withdraw the acceptance of the terms | REQ-03.17, REQ-03.19 |
| AC-03.13 | Terms unavailable | REQ-03.18, REQ-03.19 |
| AC-03.14 | Terms with unsafe markup | REQ-03.16 |
| AC-03.15 | Terms change without deployment | REQ-03.15 |
| AC-03.16 | Loading state | REQ-03.19, REQ-03.31 |
| AC-03.17 | Error loading terms and retry | REQ-03.19, REQ-03.32 |
| AC-03.18 | Direct access to the incomplete summary | REQ-03.13 |
| AC-03.19 | Plan no longer available | REQ-03.14 |
| AC-03.20 | Invalid persisted data | REQ-03.13 |
| AC-03.21 | Field removed from the configuration | REQ-03.14 |
| AC-03.22 | A single payment attempt | REQ-03.23 |
| AC-03.23 | Controls locked during processing | REQ-03.22, REQ-03.24 |
| AC-03.24 | No card and no writes | REQ-03.20 |
| AC-03.25 | Deterministic result | REQ-03.21 |
| AC-03.26 | Rejection and retry | REQ-03.12, REQ-03.30, REQ-03.38 |
| AC-03.27 | Quote number format | REQ-03.26 |
| AC-03.28 | Reload the confirmation | REQ-03.28 |
| AC-03.29 | Back after the payment | REQ-03.28 |
| AC-03.30 | Confirmation without payment | REQ-03.29 |
| AC-03.31 | Confirmation content | REQ-03.27 |
| AC-03.32 | Separation by country | REQ-03.15, REQ-03.37 |
| AC-03.33 | Keyboard | REQ-03.16, REQ-03.34 |
| AC-03.34 | Focus and announcements | REQ-03.17, REQ-03.33, REQ-03.35 |
| AC-03.35 | Responsive | REQ-03.36 |
| AC-03.36 | UI text missing in Strapi | REQ-03.19, REQ-03.38 |

## 5. Open questions and gaps

All resolved in G2 (2026-11-22, `docs/decision-log.md`, human's literal reason: "Apruebo todo" ("I approve everything")). The "Approved answer" column is the spec's original proposal, except where a G2 decision replaces or refines it (indicated).

| ID | Question | Approved answer | Status | Resolved by |
|---|---|---|---|---|
| Q-03.1 | Which field is "the document" and how does the app identify it? In CO there is a document type (CC or CE) and a number; in CL, the RUT. The business can rename or reorder fields (US-01), so the app cannot depend on the technical key. (analysis.md §1) | **Replaced by G2-1 (F-00.1):** the document is identified by the field **role** `documentNumber` from the US-01 catalog (REQ-01.28), assigned in Strapi; there is no `masked` boolean. Only the number is masked; the document type is shown in clear. Several fields with that role → all of them are masked. None → the US-01 form is "unavailable" (G2-5) and the summary is not reached. | Resolved | G2-1 (and G2-5) |
| Q-03.2 | How many characters are shown, with which character is the value masked, and is it the same in CO and CL? What happens with short values and with the RUT separators? (analysis.md §1) | Same rule in CO and CL, fixed in code (not configurable in Strapi): only alphanumerics are counted; the last `min(4, floor(n/2))` are visible (never more than half is shown); character `*`; `.`, `-` and spaces are kept. Examples in AC-03.7. The rule is applied on the value as US-01 stores it. | Resolved | G2-13 |
| Q-03.3 | How are the data grouped and ordered in the summary? The PDF distinguishes "policyholder's data" and "vehicle's data", but the grouping depends on the US-01 configuration. | **Refined by G2-6:** the section attribute of each US-01 field is used, with the closed catalog `policyholder` · `vehicle`, in that fixed order; each section's legend comes from Strapi; within each section, the configured order. The summary does not define its own handling for invalid sections: it shows what US-01 exposes (REQ-01.27). | Resolved | G2-6 |
| Q-03.4 | How are the values of each type (select, checkbox, date, number) and the empty optional ones shown? | `select`: label of the current option (display value of REQ-01.27); `checkbox`: yes/no texts from Strapi per country; `date`: `Intl.DateTimeFormat` with the country's locale, treating the date as date-only (no time zone shift); `number`: `Intl.NumberFormat` with the country's locale; empty optional: "—". | Resolved | G2-13 |
| Q-03.5 | Which plan data is shown in the summary? The PDF only requires "the chosen plan with its final price". | Name and final price (required by the PDF) plus short description, coverages and benefits, so that the person confirms what they are buying. No base/adjustment breakdown (the rule is documented in D8 / US-02). | Resolved | G2-13 |
| Q-03.6 | Is the final price of the summary recalculated, or is the one stored in step 2 used? | **Confirmed by G2-9:** only the plan id is persisted; the summary recalculates on load with the same pure function as step 2 (G2-8), the step 1 data and the current plan and factors in Strapi. If the business changed prices, the new one is shown without an additional notice. | Resolved | G2-9 |
| Q-03.7 | What happens if the persisted data no longer matches the current configuration (plan deactivated or unpublished, new required field, removed option, removed field)? (analysis.md §1; Skill §3) | **Partly replaced by G2-10 and G2-11:** plan unavailable (inactive, unpublished or with a currency different from the country's) → redirect to step 2, where the selection is discarded and the US-02 warning is shown (REQ-02.17), instead of staying on the summary with the payment blocked; step 1 data that no longer complies → `isComplete` false (computed with the current configuration) → step 1 with the data kept. Kept from the proposal (G2-13): removed field → not shown; it is not revalidated again right before paying (accepted risk). | Resolved | G2-10, G2-11, G2-13 |
| Q-03.8 | What happens if the summary URL is opened directly or reloaded? | **Refined by G2-10 (F-00.5):** with `isComplete` true and a stored plan, the summary is rebuilt from `sessionStorage` (D6), with the terms checkbox unchecked. `isComplete` false → step 1; `isComplete` true without a plan → step 2. `isComplete` is always computed with the current configuration; no "step completed" flag is persisted. | Resolved | G2-10 |
| Q-03.9 | When going back to edit data or to change the plan, what is kept? Is the terms acceptance kept? After editing step 1, does the flow go straight back to the summary or through step 2? | The step 1 data and the plan are kept (D6). Editing data keeps the plan if it is still available, and the price is recalculated. After editing step 1, the flow goes through step 2 with the plan preselected. The terms acceptance is not persisted and is reset on leaving the summary or reloading. | Resolved | G2-13 |
| Q-03.10 | The context says "the person must confirm their data". Is an explicit confirmation (another checkbox or button) needed in addition to accepting the terms? | No: reviewing the summary and pressing pay constitutes the confirmation. The business rules only make the payment conditional on accepting the terms. | Resolved | G2-13 |
| Q-03.11 | In which format does the terms text arrive (plain text, Markdown, Strapi 5 rich text "blocks") and how is it rendered safely? | Technical decision of the Software Architect (G3). Functional requirement: it must support paragraphs and lists, and the render must not insert raw HTML from the content (REQ-03.16, AC-03.14). | Resolved (specific format: G3) | G2-13 |
| Q-03.12 | What happens if there are no terms for the country, the text is empty or there is more than one record? | "Terms unavailable" state with a notice (text from Strapi) and payment blocked in the three cases (REQ-03.18). With several records, none is chosen. The content model (G3) should prevent more than one record per country. | Resolved | G2-13 |
| Q-03.13 | Must the person be forced to read or scroll to the end of the terms before accepting them? Are they shown inline or in a modal? | Scrolling is not forced. They are shown inline in the summary, in a region with a maximum height, scrollable and focusable with the keyboard. | Resolved | G2-13 |
| Q-03.14 | Where do the UI texts of step 3 and of the confirmation come from? CLAUDE.md §11 says the visible texts come from Strapi, but if Strapi does not respond, the error message cannot come from Strapi. | **Refined by G2-2 (F-00.3, F-00.4; exception in `CLAUDE.md` §11):** all texts come from Strapi per country, including the country's generic error message, except four fixed texts in code, in Spanish: "cargando", "error de carga", "reintentar" and "país no disponible". **Aligned with US-01 REQ-01.13 (F-00.7):** if a required text of a section is missing in Strapi, it is a configuration error and that section shows the country's generic error message; if that message is missing too, the fixed texts "error de carga" and "reintentar" are used. A network or contract failure always shows the fixed texts (REQ-03.32). There are no other default texts in code. | Resolved | G2-2 |
| Q-03.15 | How is the result of the simulated payment chosen (D9) and how is a deterministic rejection forced in the e2e? (analysis.md §1) | **Confirmed by G2-12:** visible options approved (default) / rejected inside step 3, in a "simulated gateway" block. No URL parameters, hidden flags or randomness; it respects D7 (no separate screen). Its texts follow G2-2. | Resolved | G2-12 |
| Q-03.16 | How long does the simulated processing last and what can be done meanwhile? | Fixed duration of 1500 ms defined in code and injectable in tests. During the process the checkbox, the result selector and the edit actions are blocked. If the person leaves the screen during the process, the pending result is discarded and no confirmation is shown. | Resolved | G2-13 |
| Q-03.17 | What does "cannot be submitted twice" cover? | (a) Double click, held Enter and Enter+click → a single attempt, with a guard in the state in addition to the visual lock. (b) After a success, going back or reloading does not allow paying again (Q-03.19). (c) Accepted limitation: without a backend (D4), paying in a duplicated tab is not prevented; it is documented in the README. | Resolved | G2-13 |
| Q-03.18 | What format and what uniqueness does the simulated quote number have? | `<CC>-<YYYYMMDD>-<XXXXXX>` (e.g. `CO-20261122-7K3F9Q`): country, UTC date of the payment and 6 characters from a 32-character alphabet without ambiguous characters, with `crypto.getRandomValues`. Uniqueness only probabilistic; there is no central registry (D4). Clock and randomness injectable for tests. | Resolved | G2-13 |
| Q-03.19 | What happens to the data after a successful payment? What happens when reloading the confirmation or going back? | The country's wizard state is cleared and only a minimal confirmation without the document is stored (number, plan, price, currency, date). Reloading the confirmation shows it again. Back or summary URL → empty step 1. Opening the confirmation without payment → step 1. "New quote" also clears the stored confirmation. | Resolved | G2-13 |
| Q-03.20 | What does the confirmation show besides the number? | Quote number, plan name and final price paid (copied at the moment of payment) and the "new quote" action. No personal data or document. | Resolved | G2-13 |
| Q-03.21 | What is a "clear" rejection message and what does the retry keep? | Text per country from Strapi, without technical codes, next to the pay button and announced as an alert. The data, plan, price and terms acceptance are kept. The message is removed when a new attempt starts. No retry limit. | Resolved | G2-13 |
| Q-03.22 | How are the focus and the announcements of the payment result managed? | Focus to the heading on entering the summary and the confirmation; "processing" in `aria-live="polite"`; rejection with `role="alert"`; locking the button must not lose the focus (technique of the Angular Developer); reason for the disabled button with `aria-describedby`; the masked document is read as is. | Resolved | G2-13 |
| Q-03.23 | The full document remains in clear text in `sessionStorage` (D6) while the quote lasts. Is that acceptable? | Yes: D6 approved, fictitious data, `sessionStorage` is cleared when the tab is closed and cleaned after the payment. It is documented in the README as a known limitation. | Resolved | G2-13 |
| Q-03.24 | What does "works on mobile and desktop" mean for step 3? | Test widths 320, 375 and 1280 px; no horizontal scrolling; one column on mobile; touch targets of at least 24×24 CSS px (WCAG 2.2 AA, 2.5.8). | Resolved | G2-13 |

No open or blocking questions remain. Pending for G3 (not G2): the specific format of the terms text (Q-03.11) and the real names of content types, fields, routes and keys.

## 6. Data and contracts

Pending reference: `docs/architecture/content-model.md` and API contracts (G3). Descriptive names.

### 6.1 What the summary consumes from Strapi (only `GET`, through the nginx proxy, D4)

| Content | What for | REQ |
|---|---|---|
| Country (code, currency, locale) | Price, date and number format; quote number prefix; check of the plan currency | REQ-03.3, REQ-03.4, REQ-03.14, REQ-03.26 |
| Form configuration of the country (label, type, section, role, order, options, validations), through the US-01 step 1 result | Readable labels and values, sections, masking by role `documentNumber`, `isComplete` | REQ-03.2, REQ-03.3, REQ-03.6, REQ-03.13 |
| Published and active plans of the country + price factors (D8, G2-8) | Chosen plan, final price, check that it is still available | REQ-03.4, REQ-03.5, REQ-03.14 |
| Terms and conditions of the country | Text to accept | REQ-03.15, REQ-03.18 |
| UI texts of the country (G2-2) | Actions, checkbox label, yes/no, legends, notices, simulated gateway, rejection message, confirmation, country's generic error message | REQ-03.38 |

### 6.2 What is stored in the browser (`sessionStorage`, separated by country, D6)

| Data | Owner | Use in US-03 |
|---|---|---|
| Step 1 values | US-01 | Read (summary); cleared after a successful payment |
| Id of the chosen plan (`documentId`; the only plan data that is persisted, G2-9) | US-02 | Read (summary); cleared after a successful payment |
| Minimal confirmation: number, plan name, final price, currency, date | **US-03** | Written after success; read in the confirmation; cleared with "new quote" |

Not persisted: the terms acceptance, the result chosen in the simulated gateway, the processing state, the price or any "step completed" flag (G2-10).

### 6.3 Dependencies on other stories

| Dependency | Story | What US-03 needs | Decision |
|---|---|---|---|
| Field role `documentNumber` in the role catalog (REQ-01.28) | US-01 | Knowing which fields to mask without depending on the key | G2-1 |
| Form "unavailable" if a field with a required role is missing | US-01 | Guarantee that the summary is not reached without a document | G2-5 |
| How the document is stored (with or without separators) | US-01 | Applying the masking rule on the stored value | G2-13 |
| Section attribute `policyholder` · `vehicle`, fixed order, legend in Strapi (REQ-01.12) | US-01 | Grouping of the summary | G2-6 |
| Step 1 result with display value and `isComplete` flag computed with the current configuration (REQ-01.27) | US-01 | Readable values and summary guards | G2-10 |
| Shape of the persisted step 1 state and key per country | US-01 / persistence ADR (G3) | Reading and clearing after the payment | D6 |
| `documentId` of the chosen plan and preselection on returning to step 2 (REQ-02.16, REQ-02.18) | US-02 | "Change plan" and recalculation of the price | G2-9 |
| Discarding the selection and warning when the plan is no longer available or has another currency (REQ-02.7, REQ-02.17) | US-02 | Redirect from the summary to step 2 | G2-11 |
| Pure final price function (REQ-02.8, REQ-02.11) | US-02 | Recalculating the price in the summary | G2-8, G2-9 |
| COP/CLP currency format | US-02 | Same format in the summary and the confirmation | — |
| UI texts per country and the four fixed texts | US-01, US-02, US-03 / G3 | All visible texts | G2-2 |

## 7. Applicable non-functional requirements

- **Accessibility:** terms checkbox with an associated `<label>`; focusable and scrollable terms region; everything operable with the keyboard; focus to the heading on entering the summary and the confirmation; "processing" in an `aria-live` region; rejection with `role="alert"`; reason for the disabled button with `aria-describedby`; the focus is not lost when the button is locked (REQ-03.33 to REQ-03.35).
- **Responsive:** 320 px to desktop, no horizontal scrolling, one column on mobile, touch targets of 24×24 px or more (REQ-03.36).
- **States:** "cargando" and "error de carga" with "reintentar" per section (fixed texts, G2-2); empty state for unavailable terms; redirect with a notice for an unavailable plan; configuration error if a text is missing in Strapi (REQ-03.14, REQ-03.18, REQ-03.31, REQ-03.32, REQ-03.38).
- **Security:** only `GET` to Strapi (D4); no card data (D9); terms content rendered without raw HTML (REQ-03.16); masked document, with the clear value kept out of the DOM (REQ-03.6); persisted confirmation without personal data (REQ-03.28).
- **Test determinism:** payment result chosen by the user (G2-12); injectable duration, clock and randomness (REQ-03.21, REQ-03.24, REQ-03.26).

## 8. Verification plan

The exact paths depend on the structure set by G3; the test names start with the AC ID (`it('AC-03.7 masks document keeping last visible chars', ...)`).

| AC / REQ | Test type | Planned location |
|---|---|---|
| AC-03.5, AC-03.6, AC-03.7 (REQ-03.6, REQ-03.7) | Unit (masking function and selection by role `documentNumber`) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.8 (REQ-03.2, REQ-03.3) | Unit (sections and presentation of values by type) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.9 (REQ-03.5) | Unit (same price function as US-02, from the plan id) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.12, AC-03.13, AC-03.16, AC-03.17, AC-03.36 (REQ-03.17 to REQ-03.19, REQ-03.31, REQ-03.32, REQ-03.38) | Unit (summary component with simulated Strapi) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.14 (REQ-03.16) | Unit (terms render) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.18 to AC-03.21, AC-03.30 (REQ-03.13, REQ-03.14, REQ-03.29) | Unit (guards with `isComplete` and plan check) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.22, AC-03.23 (REQ-03.22 to REQ-03.24) | Unit (payment service with injected duration; attempt counter) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.27 (REQ-03.26) | Unit (generator with injected clock and randomness) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.28 (REQ-03.28) | Unit (store after success) + E2E (reload) | `frontend/src/app/**`, `e2e/` |
| AC-03.1 to AC-03.4, AC-03.5, AC-03.10, AC-03.11, AC-03.25, AC-03.26, AC-03.29, AC-03.31 | E2E full CO flow (approved and rejected + retry) | `e2e/` |
| AC-03.2, AC-03.6, AC-03.32 | E2E of CL (terms and RUT) and separation by country | `e2e/` |
| AC-03.15, AC-03.19, AC-03.20, AC-03.21 | E2E if the environment allows changing Strapi content in the test; otherwise, Manual with evidence | `e2e/` or `docs/qa/` |
| AC-03.24 (REQ-03.20) | E2E (log of network requests: none other than `GET`) | `e2e/` |
| AC-03.33, AC-03.34 (REQ-03.33 to REQ-03.35) | E2E with keyboard + Manual (G5, screen reader) | `e2e/`, `docs/qa/` |
| AC-03.35 (REQ-03.36) | E2E with viewports + Manual (G5, real mobile device) | `e2e/`, `docs/qa/` |

## 9. History

| Version | Date | Change | Reason |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial draft | — |
| 0.2 | 2026-11-22 | G2 decisions applied | G2 approved by the human |
| 0.2 | 2026-11-22 | Generic message aligned with US-01 | F-00.7 |
| 0.5 | 2026-11-23 | Translated into English, no content change | D16 |
