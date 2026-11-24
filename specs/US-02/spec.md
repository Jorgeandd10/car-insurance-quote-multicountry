# US-02 — Plan list

| Field | Value |
|---|---|
| Status | Approved (2026-11-22, G2) |
| Version | 0.5 (post-G2 change approved by the human in D14; translated into English under D16) |
| Author | Requirements Analyst (subagent) |
| Approver | Human (G2) |
| Related ADRs | ADR-0001 (multi-country), ADR-0003 (access and security), ADR-0004 (state and navigation), ADR-0005 (price rule), ADR-0007 (testing); `docs/architecture/pricing-rule.md`, `content-model.md`, `api-contracts.md` (Accepted, G3) |
| Related decisions | D3, D4, D6, D7, D8 · G2-1, G2-2, G2-4, G2-5, G2-8, G2-9, G2-10, G2-11, G2-13 (`docs/decision-log.md`, G2 section) |
| Related specs | `specs/US-01/spec.md` (delivers the step 1 data), `specs/US-03/spec.md` (receives the chosen plan and its final price) |

## 1. Story (literal from the PDF)

> As a person getting a quote, I want to see the plans available for my country with their price and coverages, so that I can choose the one that best fits my needs.

**Context (literal):** Plans, coverages, benefits and prices change by country and are managed by the business team from Strapi. The business team wants to highlight one plan as "recommended" and control the order in which plans appear.

**Business rules (literal):**

1. Each plan is configured in Strapi with: name, short description, base price, currency, coverages, benefits, order, recommended flag, active status and country.
2. Only published and active plans for the country are shown.
3. The price is shown in the country's currency and format (Colombian pesos or Chilean pesos).
4. The final price may be adjusted by a simulated rule based on the step 1 data. The rule is documented.
5. Only one plan can be selected.

**PDF scope rules that apply (literal):**

- "The same application and the same build serve Colombia and Chile."
- "Changing a form field or a plan in Strapi must be reflected in the app without changing code."
- "Price calculation may be simulated: a real rating engine is not expected."
- "Use a front-end strategy to persist the data; a database is not required."
- Accessibility: "The wizard can be completed using only the keyboard, and fields have accessible labels".
- Responsive: "Works on mobile and desktop".
- Environment: "(...) with seed data for both countries".

## 2. Scope

- **Included:**
  - Step 2 of the wizard (D7) for CO and CL, with the country taken from the URL (D3).
  - Reading the country's plans from Strapi and presenting them (name, short description, final price, coverages, benefits, recommended).
  - Simulated price rule as a pure function with per-country factors configurable in Strapi (D8), and its documentation.
  - Currency formatting per country with `Intl.NumberFormat`.
  - Single selection, persistence of the selection in `sessionStorage` per country (D6) and moving on to the summary (US-03).
  - Access guard for step 2 when step 1 is not complete.
  - Loading, empty and error states; accessibility with keyboard and screen reader; responsive.
  - Seed requirements for plans and factors so that the ACs can be verified.
- **Out of scope:**
  - Real rating engine (PDF: "a real rating engine is not expected").
  - Currency conversion.
  - Filtering plans by eligibility based on the step 1 data (the PDF does not ask for it; the price rule only adjusts the price).
  - Plan comparator, filters or search.
  - Validation in the Strapi admin of "a single recommended plan" (Q-02.1 → G2-13; the app protects itself on read).
  - Selecting and validating the country in the URL: it is cross-cutting (D3, G2-3, multi-country ADR). US-02 only consumes the already resolved country.
  - The content and validation of the step 1 form (US-01) and the summary and payment (US-03).

## 3. Requirements

**Config.** column: `Strapi` = the business changes it without a deployment; `Code` = fixed in the frontend (changing it requires spec + code); `Strapi + Code` = the data is configurable and the rule that interprets it is fixed.

All the `Q`s were resolved in G2 (`docs/decision-log.md`, G2 section). In the origin column, `Q-02.n → G2-n` indicates the question and the decision that resolved it.

| ID | Verifiable requirement | Origin | Config. | Verification |
|---|---|---|---|---|
| REQ-02.1 | Step 2 shows only plans related to the URL's country (`/co/...` → Colombia, `/cl/...` → Chile). A plan of another country or without a country is never shown. | PDF (rule 2), PDF AC "Plans for the country", D3 | Strapi (plan–country relation) | Unit (mapper/filter) · E2E |
| REQ-02.2 | Only **published** plans (Strapi 5 Draft & Publish) with **active** status = true are shown. A draft plan, or one with active = false (or null active), does not appear and is not selectable. The app never requests drafts. | PDF (rule 2), PDF AC "Plans for the country" | Strapi | Unit · E2E (seed with one draft plan and one inactive plan per country) |
| REQ-02.3 | Each displayed plan presents: name, short description, final price (REQ-02.8), list of coverages and list of benefits, as they come from Strapi. If the list of coverages or of benefits is empty, that section is not shown and the plan is still selectable. | PDF (rule 1, story), Q-02.9 → G2-13 | Strapi | Unit (component) · E2E |
| REQ-02.4 | The plans are sorted by the `order` field in ascending order. Ties and null values (Q-02.8 → G2-13): with equal `order`, by name (comparison with the country's locale) and then by document identifier; plans with null `order` go last. | PDF (context, PDF AC "Plans for the country"), Q-02.8 → G2-13 | Strapi + Code (configurable data; fixed tie-breaking criterion) | Unit (pure sort function) · E2E |
| REQ-02.5 | The plan marked as recommended is distinguished from the rest visually **and** textually (a visible label exposed to assistive technologies), not by color alone. If several are marked, only the first according to the order of REQ-02.4 is highlighted; the rest are shown as regular plans. | PDF AC "Recommended plan", PDF (context: "highlight one plan"), Q-02.1 → G2-13 | Strapi + Code | Unit · E2E · Manual (G5) |
| REQ-02.6 | The price is formatted with `Intl.NumberFormat(country locale, { style: 'currency', currency: country currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })`. COP and CLP are shown **without decimals**. The locale and the currency come from the `Country` entry in Strapi (e.g. `es-CO`/`COP`, `es-CL`/`CLP`); no symbol or separator is written in code. | PDF (rule 3), D3 | Strapi + Code (configurable locale and currency; fixed format options) | Unit (pure format function) · E2E |
| REQ-02.7 | The plan's currency must match the country's currency. A plan with a different, empty or unknown currency is not shown and is not selectable (it is not converted), and the app logs a technical warning in the console. | PDF (rules 1 and 3), gap in `analysis.md` §1, Q-02.2 → G2-11 | Code | Unit · E2E (interception with `page.route`; the seed does not include plans with a different currency) |
| REQ-02.8 | The final price of each plan is computed by a **pure function** (`basePrice`, step 1 data, country factors, reference date) → integer, defined in section 6.3. The function does not read the clock, does no I/O and returns the same result for the same inputs. | PDF (rule 4), D8, Q-02.3 → G2-8 | Code (algorithm) | Unit (table of examples in §6.3) |
| REQ-02.9 | The adjustment factors (step 1 field **role** they apply to, `vehicleYear` or `birthDate`; operand type; inclusive `min`–`max` bands; multiplier) are configured **per country** in Strapi. If the country has no configured factors, the final price equals the base price. Adding, removing or changing a band or a multiplier does not require changing code. | D8, PDF (scope rule "reflected without changing code"), Q-02.3 → G2-8, Q-02.4 → G2-1 | Strapi | Unit · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) |
| REQ-02.10 | The price rule locates the step 1 data by the field's **role** (`vehicleYear`, `birthDate`) according to the current US-01 configuration, never by its `key` or its label (G2-1). If no field has that role, or its value is empty or cannot be interpreted, that factor is 1 (neutral) and the rest of the factors are applied. Note: under G2-5, US-01 marks the form as "unavailable" if the field of a required role is missing, so in the normal flow this case does not reach step 2; the neutral factor is the pure function's defense. | Gap in `analysis.md` §1, Q-02.4 → G2-1, G2-5 | Code | Unit (pure function). No E2E: under G2-5 the case does not reach step 2 |
| REQ-02.11 | Rounding is applied **only once**, at the end: `Math.round` of the product `basePrice × Π factors` to whole units of the currency. The result is the final price that is shown and that is handed to US-03. | PDF (rule 3), D8, Q-02.6 → G2-8 | Code | Unit |
| REQ-02.12 | Factors with a non-numeric, non-finite or ≤ 0 multiplier, or with `min` > `max`, are discarded before evaluating. With overlapping bands, the first in the configured order applies. | Q-02.7 → G2-13 | Code | Unit |
| REQ-02.13 | The price rule is documented in this spec (§6.3, with verifiable examples) and in `docs/architecture/` (Software Architect's document, pending G3), with the same algorithm and the seed values. | PDF (rule 4: "The rule is documented") | — | Review (Code Reviewer) |
| REQ-02.14 | Only **one** plan can be chosen at a time. Choosing another replaces the previous selection. The selection is exposed as a group of exclusive options (radio group semantics). | PDF (rule 5), PDF AC "Plan selection" | Code | Unit · E2E |
| REQ-02.15 | The chosen plan is marked as such (visually and programmatically: `checked` / `aria-checked`). With a chosen and available plan, the "continue" action leads to the summary (US-03). Without a chosen plan, progress is not possible: the button stays enabled and, when activated, shows a message associated with the group and moves the focus to the group (Q-02.14). | PDF AC "Plan selection", Q-02.14 → G2-13 | Code | Unit · E2E |
| REQ-02.16 | The selection is persisted in `sessionStorage` in the current country's space (D6) and restored on reload, on returning from step 3 and on returning to step 2 from step 1. What is persisted is the plan identifier (`documentId`), not a copy of the price or of the texts (G2-9). One country's selection does not affect the other. | D6, Q-02.12 → G2-9 | Code | Unit (store) · E2E |
| REQ-02.17 | If the persisted plan is no longer in the current list (inactive, unpublished, deleted, of another currency or malformed), the selection is discarded, the user is informed with a message announced by screen reader, and "continue" has no effect until another plan is chosen. | Gap in `analysis.md` §1, Q-02.11 → G2-11 | Code (text from Strapi, G2-2) | Unit · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) |
| REQ-02.18 | Handover to US-03: US-02 leaves the `documentId` of the chosen plan persisted for the country, and US-03 obtains the plan and its final price by applying **the same** function of REQ-02.8 with the same data. US-02 does not guarantee the price against Strapi changes made after the selection (G2-9). | PDF (US-03 rule 1: "chosen plan with its final price"), Q-02.12 → G2-9, cross-reference `specs/US-03/spec.md` | Code | Unit · E2E (full flow) |
| REQ-02.19 | On entering step 2 of a country, the guard evaluates US-01's `isComplete` for **that** country: it is computed on the persisted step 1 data (D6) with the **current** form configuration, and no "step 1 completed" flag is persisted (G2-10). If `isComplete` is false (there is no data, or it no longer meets the current configuration), the app redirects to step 1 of the same country without requesting plans from Strapi. While the configuration needed to compute it is being fetched, the loading state applies (REQ-02.20) and, if it fails, the error state (REQ-02.21). | Gap detected by the orchestrator, Q-02.10 → G2-10 (F-00.5), cross-reference `specs/US-01/spec.md` | Code | Unit (guard) · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) |
| REQ-02.20 | While the plans are loading (and the country's factors and data, if they are requested separately), a loading indicator announced by screen reader is shown (`aria-busy` on the region or a `role="status"` message), and continuing is not possible. | PDF (criterion "loading and error state handling"), CLAUDE.md §8 | Code (fixed text "cargando" ("loading"), G2-2) | Unit · E2E (delayed response) |
| REQ-02.21 | There are two error cases. (a) **Request failure** (Strapi does not respond: network error, non-2xx HTTP, response that does not meet the contract, or timeout, value in an ADR): the fixed texts "error de carga" ("load error") and "reintentar" ("retry") are shown; the action repeats the request. (b) **A required step text is missing in Strapi**: it is a configuration error and the country's generic error message is shown, according to REQ-02.32. In both cases no partial plans or prices are shown and continuing is not possible. | PDF (criterion "loading and error state handling"), CLAUDE.md §8 and §11, Q-02.13 → G2-2, F-00.7 | Code (fixed texts "error de carga" and "reintentar", G2-2) | Unit · E2E (intercepted network) |
| REQ-02.22 | If no plan remains to be shown for the country (none published and active, or all discarded by REQ-02.7 or REQ-02.25), a message explaining that no plans are available is shown, announced by screen reader, and continuing is not possible. The navigation to go back to step 1 is kept. | PDF AC "No plans available" | Strapi (text, G2-2) + Code | Unit · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) |
| REQ-02.23 | Plans and factors are requested from Strapi every time step 2 is entered (no persistent cache between reloads nor a copy of the catalog in `sessionStorage`). A change published in Strapi (addition, removal, deactivation, order, recommended, base price, factors) is reflected on reload without changing code. | PDF (scope rule: "Changing (...) a plan in Strapi must be reflected in the app without changing code"), "no aggressive cache" risk in `analysis.md` §6 | Code | E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) |
| REQ-02.24 | The app obtains **all** the published and active plans of the country, without truncation by Strapi's default pagination: it requests with an explicit page size and walks the remaining pages if `pageCount > 1` (Q-02.15). | Q-02.15 → G2-13 | Code | Unit (client with simulated paginated response) |
| REQ-02.25 | A plan with malformed data (empty or null name; null, non-numeric or ≤ 0 base price) is discarded without breaking the list, and the app logs a technical warning in the console. Null coverages or benefits are treated as empty lists (REQ-02.3). | Skill gap checklist (empty or null data from Strapi), Q-02.9 → G2-13 | Code | Unit (mapper) |
| REQ-02.26 | Step 2 can be completed with the keyboard only: `Tab` reaches the plan group, the arrow keys change the option within the group (native radio behavior), `Space` selects, `Tab` reaches "back" and "continue", and `Enter` activates the buttons. The focus is always visible. | PDF (Accessibility), CLAUDE.md §8 | Code | E2E (keyboard only) · Manual (G5) |
| REQ-02.27 | Accessible semantics: the group has an accessible name (`fieldset` + `legend` or `role="radiogroup"` + `aria-labelledby`); the accessible name of each option includes the plan name, its formatted final price and, if applicable, the recommended label; coverages and benefits are exposed as lists. The empty, error and "plan no longer available" messages are announced (`role="status"` or `role="alert"`). | PDF (Accessibility: "fields have accessible labels"), CLAUDE.md §8 | Code | Unit (ARIA attributes) · Manual with screen reader (G5) |
| REQ-02.28 | On entering step 2, the focus moves to the step heading (or to its container with `tabindex="-1"`), and the document title reflects the step. | CLAUDE.md §8 ("focus managed when changing step") | Code | E2E · Manual (G5) |
| REQ-02.29 | Responsive: at 320 CSS px wide there is no horizontal scroll and the plans are stacked in one column; on desktop (≥ 1024 px) they are shown in several columns or in a list that makes use of the width. The selection touch targets are at least 24 × 24 CSS px. | PDF (Responsive) | Code | E2E (mobile and desktop viewport) · Manual (G5) |
| REQ-02.30 | From step 2 it is possible to go back to step 1 without losing the step 1 data or the step 2 selection. If the step 1 data changes when going back, the final price of each plan is recalculated on returning to step 2 and the selection is kept if the plan is still available. | US-01 PDF AC "Keep data when going back", PDF (rule 4), D6 | Code | E2E |
| REQ-02.31 | The requests for plans, factors and country are read-only `GET` requests through the nginx proxy, without a token in the browser or in the bundle. | D4, PDF (Security) | Code + infrastructure | E2E (network inspection) · Review |
| REQ-02.32 | The visible texts of step 2 (title, group legend, recommended label, "back" and "continue" buttons, "choose a plan" message, empty message, plan-unavailable message and the **country's generic error message**) come from Strapi per country, as UI texts. There are only four fixed texts in code, in Spanish: "cargando", "error de carga", "reintentar" and "país no disponible" ("country not available") (G2-2). If a required step text is missing in Strapi, it is a configuration error: the step shows the country's generic error message and continuing is not possible. If that generic message is missing too, the fixed texts "error de carga" and "reintentar" are used. There are **no** default texts in code for the Strapi texts. Common definition with US-01 REQ-01.13. | CLAUDE.md §11 (exception G2-2), PDF (context: "copy" per country), Q-02.13 → G2-2, F-00.7 | Strapi (exception of 4 texts in Code, G2-2) | Unit (missing text → error state) · Review |
| REQ-02.33 | The seed of each country (CO and CL) includes, at least: 3 published and active plans with different `order` and different base price; exactly 1 recommended; 1 published and inactive plan; 1 draft plan; the factors of §6.3; and currency and locale in `Country`. This way AC-02.1, AC-02.2 and AC-02.5 are verifiable with `docker compose up`. | PDF (Environment: "seed data for both countries"), PDF AC | Strapi (seed as code) | E2E · Review |
| REQ-02.34 | Clicking or tapping anywhere on a plan card selects that plan, the same as pressing its option button. The control is still the native `radio` with its `label` (same accessible name and same keyboard behavior, REQ-02.26 and REQ-02.27). | D14 (human request after G5) | Code | E2E |

## 4. Acceptance criteria

### PDF scenarios (literal)

```gherkin
# AC-02.1 — origin: PDF
Scenario: Plans for the country
  Given I completed the step 1 form
  When I reach the plans step
  Then I see only the active and published plans for my country, in the configured order

# AC-02.2 — origin: PDF
Scenario: Recommended plan
  Given a plan is marked as recommended in Strapi
  When I view the plan list
  Then that plan is visually distinguished from the others

# AC-02.3 — origin: PDF
Scenario: Plan selection
  Given I am on the plan list
  When I select a plan
  Then it is marked as chosen
  And I can move on to the summary

# AC-02.4 — origin: PDF
Scenario: No plans available
  Given there are no active plans for my country
  When I reach the plans step
  Then I see a message explaining that no plans are available
```

### Scenarios added by the spec

```gherkin
# AC-02.5 — origin: REQ-02.1, REQ-02.2, REQ-02.33 (verifiable version of AC-02.1)
Scenario Outline: Draft, inactive and other-country plans are not shown
  Given Strapi has for <country> a published active plan "A", a published inactive plan "B" and a draft plan "C"
  And Strapi has a published active plan "D" for the other country
  And I completed step 1 for <country>
  When I open "/<code>/" at the plans step
  Then I see plan "A"
  And I do not see plans "B", "C" or "D"
  Examples:
    | country  | code |
    | Colombia | co   |
    | Chile    | cl   |

# AC-02.6 — origin: Q-02.8 → G2-13
Scenario: Order with ties and empty order
  Given the active plans of my country are "Gold" (order 2), "Basic" (order 1), "Plus" (order 2) and "Lite" (no order)
  When I reach the plans step
  Then the plans appear as "Basic", "Gold", "Plus", "Lite"

# AC-02.7 — origin: Q-02.1 → G2-13
Scenario: Several plans marked as recommended
  Given plans "Basic" (order 1) and "Gold" (order 2) are both marked as recommended
  When I view the plan list
  Then only "Basic" is shown as recommended
  And "Gold" is shown as a regular plan

# AC-02.8 — origin: REQ-02.6
Scenario Outline: Price in the country currency without decimals
  Given the final price of a plan is <amount> for <country>
  When I view the plan list
  Then the price is shown as <formatted>
  And it has no decimal part
  Examples:
    | country  | amount  | formatted            |
    | Colombia | 1320000 | "$ 1.320.000"   |
    | Chile    | 38985   | "$38.985"            |
  # Colombia: between "$" and "1" there is U+00A0 (non-breaking space), not a normal space; it looks like "$ 1.320.000".
  # Chile: no separator between "$" and the number.
  # Both strings verified with Intl in Node 24.22.3 (reviews/000-G2-specs-cross-consistency.md, F-00.6):
  #   es-CO → bytes 24 a0 31 2e 33 32 30 2e 30 30 30 · es-CL → bytes 24 33 38 2e 39 38 35
  # The test compares with the exact string, including U+00A0, without normalizing spaces.

# AC-02.9 — origin: REQ-02.8, REQ-02.11, Q-02.3 → G2-8, Q-02.4 → G2-1
Scenario Outline: Final price adjusted by step 1 data
  Given the reference date is 2026-11-22
  And the price factors of <country> are the seed factors of section 6.3
  And a plan has base price <base>
  And in step 1 I entered <year> in the field with role "vehicleYear" and <birth> in the field with role "birthDate"
  When I reach the plans step
  Then the final price of that plan is <final>
  Examples: see table "Verifiable examples" in section 6.3 (E1 to E6)

# AC-02.10 — origin: REQ-02.9
Scenario: No price factors configured
  Given my country has no price factors configured in Strapi
  When I reach the plans step
  Then each plan shows its base price as the final price

# AC-02.11 — origin: Q-02.4 → G2-1 (pure-function level; under G2-5 the normal flow does not reach this point)
Scenario: No step 1 value for a role used by the price rule
  Given the price rule of my country has factors for the roles "vehicleYear" and "birthDate"
  And the step 1 data has no field with the role "birthDate"
  When the final price is calculated
  Then the "birthDate" factor is 1
  And the "vehicleYear" factor is applied
  And no error is raised

# AC-02.12 — origin: Q-02.5 → G2-13, G2-4
Scenario: Vehicle from next year
  Given the reference date is 2026-11-22
  And in step 1 I entered 2027 in the field with role "vehicleYear"
  When the final price is calculated
  Then the vehicle age used by the rule is 0

# AC-02.13 — origin: Q-02.7 → G2-13
Scenario: Invalid price factor configuration
  Given a price factor band of my country has multiplier 0
  When the final price is calculated
  Then that band is ignored
  And the price is calculated with the remaining valid bands

# AC-02.14 — origin: Q-02.2 → G2-11
Scenario: Plan with a currency different from the country
  Given an active published plan for Chile is configured with currency "USD"
  When I reach the plans step in Chile
  Then that plan is not shown
  And the other plans are shown in Chilean pesos

# AC-02.15 — origin: Q-02.9 → G2-13
Scenario: Malformed plan from Strapi
  Given an active published plan of my country has no base price
  When I reach the plans step
  Then that plan is not shown
  And the other plans are shown normally

# AC-02.16 — origin: REQ-02.30
Scenario: Price is recalculated after editing step 1
  Given I selected plan "Gold" and its final price is shown
  When I go back to step 1, change the field with role "vehicleYear" to a value in another price band and continue
  Then "Gold" is still selected
  And its final price reflects the new vehicle year

# AC-02.17 — origin: REQ-02.14
Scenario: Selecting another plan replaces the selection
  Given plan "Basic" is selected
  When I select plan "Gold"
  Then "Gold" is marked as chosen
  And "Basic" is no longer marked as chosen

# AC-02.18 — origin: Q-02.14 → G2-13
Scenario: Continue without a selected plan
  Given no plan is selected
  When I activate "continue"
  Then I stay on the plans step
  And I see the "choose a plan" message configured in Strapi for my country, associated with the plan group
  And the focus moves to the plan group

# AC-02.19 — origin: D6, REQ-02.16
Scenario: Selection survives a reload
  Given I selected plan "Gold" in Colombia
  When I reload the page
  Then "Gold" is still selected

# AC-02.20 — origin: D6, REQ-02.16
Scenario: Selection is kept per country
  Given I selected plan "Gold" in Colombia
  When I open the plans step in Chile after completing step 1 for Chile
  Then no Chilean plan is selected
  And when I go back to Colombia "Gold" is still selected

# AC-02.21 — origin: Q-02.11 → G2-11
Scenario: Persisted plan is no longer available
  Given I selected plan "Gold" and it is persisted
  And the business team deactivates or unpublishes "Gold" in Strapi
  When I reload the plans step
  Then no plan is selected
  And I see the "plan no longer available" message configured in Strapi, announced to screen readers
  And I cannot move on to the summary until I choose another plan

# AC-02.22 — origin: Q-02.10 → G2-10 (F-00.5)
Scenario Outline: Opening the plans step when step 1 is not complete
  Given <situation>
  When I open the plans step URL for Chile directly
  Then "isComplete" of step 1 for Chile is false with the current form configuration
  And I am redirected to step 1 for Chile
  And no plan request is sent to Strapi
  Examples:
    | situation                                                                                          |
    | there is no step 1 data for Chile in this session                                                  |
    | the step 1 data for Chile was valid, but the business team then published a new required field   |

# AC-02.23 — origin: REQ-02.20, G2-2
Scenario: Loading state
  Given the plan request takes time to respond
  When I reach the plans step
  Then I see a loading indicator with the fixed "loading" text, announced to screen readers
  And I cannot move on to the summary

# AC-02.24 — origin: REQ-02.21, G2-2
Scenario: Error loading plans
  Given the plan request fails
  When I reach the plans step
  Then I see the fixed "load error" message and the fixed "retry" action
  And no plans or prices are shown
  When the service recovers and I activate "retry"
  Then the plans are listed

# AC-02.25 — origin: REQ-02.23, REQ-02.9
Scenario: Plan change in Strapi without deployment
  Given I am on the plans step
  When the business team publishes a change in Strapi (deactivates a plan, changes its order, its recommended flag, its base price or a price factor)
  And I reload the application
  Then the plan list reflects the change without code changes

# AC-02.26 — origin: REQ-02.26
Scenario: Complete the plans step with the keyboard only
  Given I reached the plans step using only the keyboard
  When I move to the plan group with Tab, change option with the arrow keys and press Space
  And I move to "continue" with Tab and press Enter
  Then the plan is selected and I reach the summary without using a pointer

# AC-02.27 — origin: REQ-02.27
Scenario: Plan group exposed to assistive technologies
  Given I use a screen reader on the plans step
  When I move through the plans
  Then the group is announced with its name
  And each option is announced with the plan name, its final price, whether it is recommended and whether it is selected

# AC-02.28 — origin: REQ-02.28
Scenario: Focus when entering the step
  Given I completed step 1
  When the plans step is shown
  Then the focus is on the step heading

# AC-02.29 — origin: REQ-02.29
Scenario Outline: Responsive layout
  Given the viewport is <width> px wide
  When I view the plan list
  Then there is no horizontal scroll
  And every plan, its price and the "continue" action are reachable
  Examples:
    | width |
    | 320   |
    | 375   |
    | 1280  |

# AC-02.30 — origin: REQ-02.30
Scenario: Back to step 1 keeps data and selection
  Given I selected plan "Gold"
  When I go back to step 1 and return to the plans step without changes
  Then my step 1 data is still filled in
  And "Gold" is still selected with the same final price

# AC-02.31 — origin: REQ-02.31, D4
Scenario: Read-only requests without tokens
  Given I am on the plans step
  When I inspect the network requests to the content API
  Then they are GET requests through the proxy
  And none of them carries an Authorization header or token

# AC-02.32 — origin: Q-02.15 → G2-13
Scenario: More plans than the default page size
  Given my country has 30 active published plans
  When I reach the plans step
  Then the 30 plans are listed

# AC-02.33 — origin: Q-02.13 → G2-2 (F-00.4, F-00.7)
Scenario: A step text is missing in Strapi
  Given the "continue" text of the plans step is not configured in Strapi for my country
  And the generic error message of my country is configured in Strapi
  When I reach the plans step
  Then I see the generic error message configured in Strapi for my country
  And no plans are shown
  And I cannot move on to the summary
  And no default text from the code replaces the missing one

Scenario: A step text and the generic error message are missing in Strapi
  Given the "continue" text of the plans step is not configured in Strapi for my country
  And the generic error message of my country is not configured either
  When I reach the plans step
  Then I see the fixed "load error" message and the fixed "retry" action
  And no plans are shown
  And I cannot move on to the summary

# AC-02.34 — origin: D14
Scenario: Choose a plan by clicking anywhere on its card
  Given I am on the plans step of "/co"
  When I click on the coverages list of "Plan Total"
  Then "Plan Total" is the selected plan
```

| AC | Scenario | REQs covered |
|---|---|---|
| AC-02.1 | Plans for the country (PDF) | REQ-02.1, REQ-02.2, REQ-02.4 |
| AC-02.2 | Recommended plan (PDF) | REQ-02.5 |
| AC-02.3 | Plan selection (PDF) | REQ-02.14, REQ-02.15, REQ-02.18 |
| AC-02.4 | No plans available (PDF) | REQ-02.22 |
| AC-02.5 | Draft, inactive and other-country plans excluded | REQ-02.1, REQ-02.2, REQ-02.33 |
| AC-02.6 | Order with ties and nulls | REQ-02.4 |
| AC-02.7 | Several recommended | REQ-02.5 |
| AC-02.8 | Currency format without decimals | REQ-02.6 |
| AC-02.9 | Adjusted final price (E1–E6) | REQ-02.8, REQ-02.9, REQ-02.11, REQ-02.13 |
| AC-02.10 | No configured factors | REQ-02.9 |
| AC-02.11 | No value for a role used by the rule | REQ-02.10 |
| AC-02.12 | Vehicle from next year | REQ-02.8 |
| AC-02.13 | Misconfigured factor | REQ-02.12 |
| AC-02.14 | Different currency | REQ-02.7 |
| AC-02.15 | Malformed plan | REQ-02.25, REQ-02.3 |
| AC-02.16 | Recalculate after editing step 1 | REQ-02.30, REQ-02.8 |
| AC-02.17 | Single selection | REQ-02.14 |
| AC-02.18 | Continue without selection | REQ-02.15 |
| AC-02.19 | Selection after reload | REQ-02.16 |
| AC-02.20 | Selection per country | REQ-02.16 |
| AC-02.21 | Persisted plan unavailable | REQ-02.17 |
| AC-02.22 | Access with step 1 incomplete (`isComplete` false) | REQ-02.19 |
| AC-02.23 | Loading | REQ-02.20, REQ-02.32 |
| AC-02.24 | Error and retry | REQ-02.21, REQ-02.32 |
| AC-02.25 | Change in Strapi without deployment | REQ-02.23, REQ-02.9 |
| AC-02.26 | Keyboard only | REQ-02.26 |
| AC-02.27 | Screen reader | REQ-02.27, REQ-02.5 |
| AC-02.28 | Focus on entry | REQ-02.28 |
| AC-02.29 | Responsive | REQ-02.29 |
| AC-02.30 | Back to step 1 | REQ-02.30, REQ-02.16 |
| AC-02.31 | Read-only without token | REQ-02.31 |
| AC-02.32 | Pagination | REQ-02.24 |
| AC-02.33 | Missing text in Strapi | REQ-02.32, REQ-02.21 |
| AC-02.34 | Click anywhere on the card | REQ-02.34 |

REQ without its own AC: REQ-02.13 (documentation, verified in review).

## 5. Open questions and gaps

All questions were **resolved in G2** (2026-11-22, "Apruebo todo" ("I approve everything"); `docs/decision-log.md`, G2 section). The "Approved answer" column holds the v0.1 proposal, except where the G2 decision changed it; those cases are marked as **(adjusted by G2-n)**. No open or blocking questions remain.

| ID | Question | Approved answer | Status | Resolved by |
|---|---|---|---|---|
| Q-02.1 | The PDF says "highlight **one** plan", but the flag is per plan and nothing prevents marking several. What is shown if several are recommended (or none)? | Highlight only the first according to the order of REQ-02.4; the rest are shown as regular plans. If none is marked, none is highlighted. No validation is added in the Strapi admin; the seed has exactly one per country. | Resolved | G2-13 |
| Q-02.2 | Each plan has its own currency (rule 1), but the price is shown in the country's currency (rule 3). What happens if they do not match? | The plan is not shown (it is not converted) and a console warning is logged. If all are excluded, the empty state is shown. | Resolved | G2-11 |
| Q-02.3 | The PDF only says "may be adjusted by a simulated rule based on the step 1 data. The rule is documented". What are the inputs, the factors, the bands, the rounding, and what is configurable? | `Math.round(basePrice × Π multipliers)`; operands fixed in code, `vehicleAge` and `ageInYears`; inclusive bands and multipliers per country in Strapi (§6.3). Name and shape of the content type: Software Architect (G3). | Resolved | G2-8 |
| Q-02.4 | The rule depends on step 1 fields that the business can remove or rename from Strapi (US-01). What happens to the price? | **(adjusted by G2-1)** The rule is bound to the field's **role** (`vehicleYear`, `birthDate`), assigned in Strapi, and not to its `key` or its label. If no field has the role or the value is missing, the factor is 1 and the rest is applied. Under G2-5, US-01 marks the form as "unavailable" if the field of a required role is missing, so in the normal flow the case does not reach step 2. | Resolved | G2-1 |
| Q-02.5 | With which date and time zone are the vehicle's age and the policyholder's age computed? US-01 allows a vehicle from next year: its "age" would be −1. | Date-only reference date, the same source of "today" that US-01 uses (injectable clock for tests); policyholder age with the same function as US-01's legal age; vehicle age = `max(0, reference year − vehicle year)`. With the year range of G2-4 (`[currentYear − 20, currentYear + 1]`), the age used stays in `[0, 20]`. | Resolved | G2-13 (consistent with G2-4) |
| Q-02.6 | How is the final price rounded? To the unit, to multiples of 100 (COP) or of 10 (CLP)? | Rounding to whole units with `Math.round`, only once, at the end. No commercial multiples. | Resolved | G2-8 |
| Q-02.7 | What happens if the factors are misconfigured (multiplier 0, negative or empty; `min` > `max`; overlapping bands)? | The invalid band is discarded before evaluating; with overlaps the first in the configured order wins; if none matches, factor 1. Console warning, never an error to the user. | Resolved | G2-13 |
| Q-02.8 | The PDF asks for "configured order" but does not define ties or plans without `order`. | Ascending by `order`; tie → name with `localeCompare` in the country's locale; tie → `documentId`; null `order` last. | Resolved | G2-13 |
| Q-02.9 | What does the app do with malformed plans from Strapi (no name; null, ≤ 0 or non-numeric base price; empty coverages or benefits)? | No name or invalid price (including 0) → plan discarded and console warning. Empty or null coverages or benefits → plan visible without that section. | Resolved | G2-13 |
| Q-02.10 | What does "I completed the step 1 form" mean, and what happens if step 2 is entered by URL without having done it, or with step 1 data that no longer meets the current configuration? | **(adjusted by G2-10, F-00.5)** No "step 1 completed" flag is persisted. The guard uses US-01's `isComplete`, computed on the persisted data with the current configuration. If it is false → redirect to step 1 of the same country, without requesting plans. Cross-reference `specs/US-01/spec.md`. | Resolved | G2-10 |
| Q-02.11 | The chosen and persisted plan stops being active or published (or changes currency). What does the user see in step 2 and in the summary? | In step 2 the selection is discarded and an announced warning is shown (REQ-02.17). In step 3, US-03 detects it, deselects it with a warning and goes back to step 2 (cross-reference `specs/US-03/spec.md`). | Resolved | G2-11 |
| Q-02.12 | What does US-02 hand to US-03: only the plan identifier or a copy (snapshot) with name and final price? | Only the `documentId` is persisted. US-03 requests the plan again and recalculates the price with the same pure function (REQ-02.18). If the business changes the price between step 2 and step 3, the summary shows the current price. | Resolved | G2-9 |
| Q-02.13 | CLAUDE.md §11 says the visible texts come from Strapi, but the error message (and the loading one) is shown precisely when Strapi does not respond. Where do those texts come from? | **(adjusted by G2-2, F-00.3, F-00.4)** Exception recorded in `CLAUDE.md` §11: only four fixed texts in code, in Spanish: "cargando", "error de carga", "reintentar" and "país no disponible". The other step texts (title, legend, "recommended", buttons, "choose a plan", empty, plan unavailable and the country's generic error message) come from Strapi per country; where they are modeled is decided by the Software Architect. **(aligned with US-01 REQ-01.13, F-00.7)** If a required step text is missing in Strapi, it is a configuration error: the country's generic error message, configured in Strapi, is shown and continuing is not possible. If that message is missing too, the fixed texts "error de carga" and "reintentar" are used. A request failure (Strapi does not respond) always shows the fixed texts. There are **no** default texts in code. | Resolved | G2-2 |
| Q-02.14 | Is the "continue" button disabled until a plan is chosen, or enabled with validation when pressed? | Enabled. When it is pressed without a selection, a message associated with the group (`aria-describedby`) is shown and the focus goes to the group (AC-02.18). | Resolved | G2-13 |
| Q-02.15 | Strapi's REST API paginates by default (25 items). With more plans, the list would be silently truncated. | Request with an explicit page size and walk the remaining pages if `pageCount > 1`. The exact size and the contract are set by the Software Architect (G3). | Resolved | G2-13 |
| Q-02.16 | Is only the final price shown, or also the base price and the breakdown of the adjustment? | Only the final price. The rule is documented in §6.3 and in `docs/architecture/`. | Resolved | G2-13 |

## 6. Data and contracts

Names of content types, fields, routes and storage keys: **pending** from the Software Architect (`docs/architecture/content-model.md`, API contracts and ADRs, G3). This section sets what information is needed, not how it is modeled.

### 6.1 What is consumed from Strapi (read-only, D4)

| Data | Source | Use in US-02 |
|---|---|---|
| Country: code (`co`, `cl`), locale (`es-CO`, `es-CL`), currency (`COP`, `CLP`) | `Country` (D3) | REQ-02.1, REQ-02.6, REQ-02.7 |
| Plan: name, short description, base price, currency, coverages, benefits, `order`, recommended, active, country, `documentId`, publication status | Plan (PDF, rule 1) | REQ-02.1 to REQ-02.5, REQ-02.25 |
| Country price factors: `role`, operand, `min`, `max`, multiplier, order | Model pending from the Software Architect (D8, G2-8) | REQ-02.8 to REQ-02.12 |
| Step 1 form configuration (fields with their `role`) | US-01 (G2-1) | REQ-02.10 (resolve values by role), REQ-02.19 (`isComplete`) |
| Step texts per country (all except the four fixed ones of G2-2) | Model pending from the Software Architect (G2-2) | REQ-02.32 |

### 6.2 What is read and written in the browser (`sessionStorage`, per country, D6)

| Key (logical) | Who writes | Who reads | Content |
|---|---|---|---|
| Step 1 data | US-01 | US-02 (guard via `isComplete` and price), US-03 | Field values as persisted by US-01. US-02 resolves them by **role** with the current configuration (G2-1) |
| Chosen plan | US-02 | US-02 (restore), US-03 | Plan `documentId` (G2-9) |

The plan catalog, the prices, the factors and any "step 1 completed" flag are not persisted (REQ-02.23, G2-10).

### 6.3 Simulated price rule (approved in G2-8; role binding according to G2-1)

**Conceptual signature (pure function):**
`computeFinalPrice(basePrice, step1Values, factorRules, referenceDate) → { finalPrice: integer, appliedFactors: [...] }`

**Inputs:**

- `basePrice`: base price of the plan (number > 0, in the country's currency).
- `step1Values`: step 1 values indexed by field **role** (`vehicleYear`, `birthDate`), resolved from the current US-01 configuration (G2-1).
- `factorRules`: ordered list of the country's rules, each with `role`, `operand` (`vehicleAge` | `ageInYears`), `min` (integer or empty = no limit), `max` (integer or empty = no limit) and `multiplier` (decimal > 0).
- `referenceDate`: injected date-only date (Q-02.5).

**Algorithm:**

1. Discard invalid rules (REQ-02.12): non-finite or ≤ 0 `multiplier`, or `min` > `max`.
2. Group the rules by (`role`, `operand`). For each group, derive an integer `x` from the value of the field that has that role:
   - `vehicleAge`: `x = max(0, year(referenceDate) − vehicle year)`.
   - `ageInYears`: completed years between the field's date and `referenceDate` (same function as US-01's legal age).
   - No field with that role, or empty or uninterpretable value → group factor = 1 (REQ-02.10). Under G2-5 this should not happen in the normal flow.
3. The group factor is the `multiplier` of the **first** rule, in the configured order, with `min ≤ x ≤ max` (inclusive limits). If none matches → 1.
4. `finalPrice = Math.round(basePrice × Π factors)` (REQ-02.11).

**What is configurable and what is fixed:**

| Element | Where |
|---|---|
| Bands, multipliers, role each rule applies to (among the existing roles), order of the rules, per country | Strapi (no deployment) |
| Which step 1 field has each role | Strapi (US-01 configuration, G2-1) |
| Base price and currency of each plan | Strapi |
| Operand types (`vehicleAge`, `ageInYears`), set of roles, multiplicative composition, rounding, neutral factor on missing data | Code (a new operand follows Case B of the `country-content` Skill) |

**Seed factors** (fictitious values; the roles are those of US-01, G2-1):

| Country | `role` · operand | Band (inclusive) | Multiplier |
|---|---|---|---|
| CO | `vehicleYear` · `vehicleAge` | 0–5 | 1.00 |
| CO | `vehicleYear` · `vehicleAge` | 6–10 | 1.10 |
| CO | `vehicleYear` · `vehicleAge` | 11–20 | 1.25 |
| CO | `birthDate` · `ageInYears` | 18–25 | 1.20 |
| CO | `birthDate` · `ageInYears` | 26–65 | 1.00 |
| CO | `birthDate` · `ageInYears` | 66– | 1.15 |
| CL | `vehicleYear` · `vehicleAge` | 0–5 | 1.00 |
| CL | `vehicleYear` · `vehicleAge` | 6–12 | 1.08 |
| CL | `vehicleYear` · `vehicleAge` | 13–20 | 1.20 |
| CL | `birthDate` · `ageInYears` | 18–24 | 1.25 |
| CL | `birthDate` · `ageInYears` | 25–70 | 1.00 |
| CL | `birthDate` · `ageInYears` | 71– | 1.10 |

**Verifiable examples** (reference date 2026-11-22; basis of AC-02.9 and of the unit tests):

| # | Country | Base price | Role `vehicleYear` → age → factor | Role `birthDate` → age → factor | Final price |
|---|---|---|---|---|---|
| E1 | CO | 1 200 000 | 2018 → 8 → 1.10 | 2000-05-10 → 26 → 1.00 | 1 320 000 |
| E2 | CO | 1 200 000 | 2027 → 0 (not −1) → 1.00 | 2005-12-01 → 20 (not 21 yet) → 1.20 | 1 440 000 |
| E3 | CO | 850 000 | 2006 → 20 (limit) → 1.25 | 1960-11-22 → 66 (birthday today, limit) → 1.15 | 1 221 875 |
| E4 | CL | 25 990 | 2012 → 14 → 1.20 | 2004-03-15 → 22 → 1.25 | 38 985 |
| E5 | CL | 25 990 | 2022 → 4 → 1.00 | no value for the role → factor 1 | 25 990 |
| E6 | CL | 19 990 | 2017 → 9 → 1.08 | 1990-01-01 → 36 → 1.00 | 21 589 (from 21 589,2) |

## 7. Applicable non-functional requirements

- **Accessibility:** REQ-02.26 to REQ-02.28. Native radio group semantics preferred over custom ARIA. The recommended condition is not conveyed by color alone (WCAG 1.4.1). Visible focus, managed on step change. Status messages announced.
- **Responsive:** REQ-02.29 (reflow at 320 px, WCAG 1.4.10; minimum target size 24 × 24 px, WCAG 2.5.8).
- **Loading, empty and error states:** REQ-02.20 to REQ-02.22, and REQ-02.17 for the stale selection.
- **Security:** REQ-02.31 (D4). Only `GET`, without tokens. The console warnings do not include step 1 data.
- **Test determinism:** the price rule receives the reference date as a parameter (REQ-02.8). The e2e fixes the browser clock or uses data whose bands do not change near the execution date. No e2e modifies real Strapi content: the ACs that depend on a content change are tested by interception (`page.route`) and the real change is checked by hand in G5 (`docs/qa/manual-check.md`) (G3-3).
- **Configurability:** no plan, price, factor or text is in the code, except the four texts of G2-2 ("cargando", "error de carga", "reintentar", "país no disponible"). There are no default texts in code.

## 8. Verification plan

The exact file paths depend on the structure set by the frontend ADR. The test names start with the AC or REQ they verify.

| AC / REQ | Test type | Planned location |
|---|---|---|
| AC-02.9, AC-02.10, AC-02.11, AC-02.12, AC-02.13 (E1–E6) | Unit (pure price function) | `frontend/` next to the price function, `*.spec.ts` |
| AC-02.8 | Unit (pure format function) | `frontend/`, `*.spec.ts` |
| AC-02.6, AC-02.7 | Unit (pure sort and recommended function) | `frontend/`, `*.spec.ts` |
| AC-02.5, AC-02.14, AC-02.15, AC-02.32 | Unit (DTO → domain mapper and client) | `frontend/`, `*.spec.ts` |
| AC-02.17, AC-02.18, AC-02.19, AC-02.20 | Unit (store and component) | `frontend/`, `*.spec.ts` |
| AC-02.21 | Unit (store and component) · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) | `frontend/`, `e2e/`, `docs/qa/manual-check.md` |
| AC-02.22 | Unit (guard) · E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) | `frontend/`, `e2e/`, `docs/qa/manual-check.md` |
| AC-02.23, AC-02.24, AC-02.33 | Unit (component with simulated client) · E2E with intercepted network | `frontend/`, `e2e/` |
| AC-02.1, AC-02.2, AC-02.3 | E2E against the seed (without modifying Strapi) | `e2e/` |
| AC-02.4 | E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) | `e2e/`, `docs/qa/manual-check.md` |
| AC-02.25 | E2E (interception with `page.route`) + Manual G5 (real change in the Strapi admin, `docs/qa/manual-check.md`) | `e2e/`, `docs/qa/manual-check.md` |
| AC-02.34 | E2E on the CO seed | `e2e/` |
| AC-02.16, AC-02.30 | E2E | `e2e/` |
| AC-02.26, AC-02.28, AC-02.29 | E2E (keyboard only; viewports 320, 375 and 1280) · Manual (G5) | `e2e/`, `docs/qa/` |
| AC-02.27 | Unit (ARIA attributes) · Manual with screen reader (G5) | `frontend/`, `docs/qa/` |
| AC-02.31 | E2E (request inspection) · Review | `e2e/`, `reviews/` |
| REQ-02.13, REQ-02.32, REQ-02.33 | Review (price document, origin of the texts, seed) | `reviews/` |

## 9. History

| Version | Date | Change | Reason |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial draft | Phase 3, G2 preparation |
| 0.2 | 2026-11-22 | G2 decisions applied | G2 approved by the human |
| 0.2 | 2026-11-22 | Generic message aligned with US-01 | F-00.7 |
| 0.3 | 2026-11-22 | AC verification with Strapi changes adjusted to G3-3 | G3 |
| 0.4 | 2026-11-23 | REQ-02.34 and AC-02.34: the whole plan card selects the plan | D14 |
| 0.5 | 2026-11-23 | Translated into English, no content change; F-02.3: AC-02.34 scenario moved after AC-02.33 | D16; F-02.3 |
