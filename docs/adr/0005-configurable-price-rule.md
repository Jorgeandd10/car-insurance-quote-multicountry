# ADR-0005 — Configurable price rule: factors per country and a pure function

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Deciders | Human (G3) |
| Motivated by | D8 · G2-1, G2-8, G2-9, G2-13 · REQ-02.6, REQ-02.8, REQ-02.9, REQ-02.10, REQ-02.11, REQ-02.12, REQ-02.13, REQ-02.23, REQ-03.4, REQ-03.5 |

## Context and problem

The PDF says: "The final price may be adjusted by a simulated rule based on the step 1 data. The rule is documented." D8 set factors per country in Strapi plus a pure function, and G2-8 approved the algorithm: `Math.round(basePrice × Π multipliers)`, with operands `vehicleAge` and `ageInYears`, inclusive bands per country and linking by role (G2-1). It remains to decide how the factors are modeled in Strapi, the exact signature of the function and how it is shared between step 2 and the summary (G2-9). The documentation required by REQ-02.13 is in [`docs/architecture/pricing-rule.md`](../architecture/pricing-rule.md).

## Decision drivers

- The business changes bands, multipliers, order and the role they apply to without code (REQ-02.9).
- "First band in the configured order" (REQ-02.12): the order has to be explicit and easy to edit.
- The factors are requested on every entry to step 2 and to the summary (REQ-02.23, REQ-03.5), without requesting the texts again.
- Pure, deterministic function with an injected date (REQ-02.8).
- The same result in step 2 and in the summary (REQ-03.5).

## Considered options

1. **Repeatable component `pricing.price-factor` inside `Country`** (`priceFactors`), in array order.
2. **`price-factor` collection** with a relation to `Country` and an `order` field.
3. **JSON field** `priceRules` on `Country`.

## Decision

Chosen option: **1. Repeatable component on `Country`**.

**Model (Strapi):**

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `role` | enumeration `vehicleYear`, `birthDate` | Yes | US-01 roles used by the rule (G2-1) |
| `operand` | enumeration `vehicleAge`, `ageInYears` | Yes | Operands fixed in code (G2-8) |
| `min` | integer | No | Empty = no lower bound |
| `max` | integer | No | Empty = no upper bound |
| `multiplier` | decimal | Yes | Must be > 0 and finite |

They are requested with a projection that does not include the texts: `GET /api/countries?filters[code][$eq]={cc}&fields[0]=code&populate[0]=priceFactors` (C6 in api-contracts).

**Pure functions** (`frontend/src/app/domain/pricing/`):

```ts
export type PriceRole = 'vehicleYear' | 'birthDate';
export type PriceOperand = 'vehicleAge' | 'ageInYears';
export interface PriceFactorRule { role: PriceRole; operand: PriceOperand; min: number | null; max: number | null; multiplier: number; }
export interface PriceInputs { vehicleYear: number | null; birthDate: string | null; } // values by role, from Step1Result
export interface AppliedFactor { role: PriceRole; operand: PriceOperand; x: number | null; multiplier: number; }
export function computeFinalPrice(basePrice: number, inputs: PriceInputs, rules: readonly PriceFactorRule[], referenceDate: string /* YYYY-MM-DD */): { finalPrice: number; appliedFactors: AppliedFactor[] };
export function formatPrice(amount: number, intlLocale: string, currency: string): string;
```

- Algorithm identical to US-02 §6.3:
  1. Discard the invalid rules.
  2. Group by (`role`, `operand`).
  3. Compute `x` (`vehicleAge = max(0, year(ref) − year)`; `ageInYears` with the same `ageInYears` function that the US-01 legal age uses, in `domain/dates/`).
  4. The factor is the first band with `min ≤ x ≤ max` or, if there is none, 1.
  5. `Math.round` only once at the end.
- **Incompatible role-operand combination** (`birthDate` with `vehicleAge` or `vehicleYear` with `ageInYears`): the mapper discards it with a warning, just like an invalid band. It is an extension of REQ-02.12 that needs human confirmation (see Decisions for G3).
- `PriceInputs` is obtained by **role** from `Step1Result`, never by `key` (REQ-02.10). If there are several fields with the same role (G2-5 allows it), the first one in screen order is used. For the price there is no practical ambiguity, because all of them must be valid for `isComplete` to be true. It is documented as a deterministic rule.
- `formatPrice` uses `new Intl.NumberFormat(intlLocale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })` (REQ-02.6). Setting 0 decimals is a decision approved in the spec for COP and CLP. A currency with decimals would require superseding this ADR.
- **Shared by step 2 and the summary:** both pages call `computeFinalPrice` with the same `Step1Result`, the same freshly requested factors and `todayLocal(clock())`. Nothing about the price is persisted (G2-9).
- `basePrice` is an `integer` in Strapi (whole currency units, `min: 1`), which avoids decimal serialization ambiguities. `multiplier` is a `decimal`, and the mapper accepts a `number` or a numeric `string`, and discards anything that is not finite.

## Consequences

- **Positive:**
  - The business edits all the bands of a country on a single admin screen and reorders them by dragging; the order is the array order and no `order` field is needed.
  - There are no bands without a country nor bands of one country in another: the component belongs to `Country`.
  - Pure function, table E1–E6 as a unit test, and the same code in step 2 and in the summary.
- **Negative:**
  - Changing a factor requires republishing the whole `Country` (ADR-0001), and a pending draft of texts for the same country blocks publishing the factor.
  - `Country` is requested twice in the same flow (configuration once per load and factors on every entry), with different projections.
  - `role` and `operand` are redundant (each role has a single valid operand). They are kept because G2-8 approved them that way and because they allow new operands on the same role, but they require the rule for discarding incompatible combinations.
  - An integer `basePrice` does not support currencies with cents.
- **Risks and mitigation:**
  - *Serialization of `decimal` in the REST API* (number or string depending on the database): the documentation consulted does not specify it. The mapper accepts both, and a unit test covers both cases.
  - *Bands that change close to the e2e date:* the e2e fixes the clock (ADR-0007).

### Confirmation

- Unit: `computeFinalPrice` with E1–E6, AC-02.10, AC-02.11, AC-02.12 and AC-02.13; `formatPrice` with the exact strings of AC-02.8 (U+00A0 in `es-CO`); factor mapper (multiplier 0, `min > max`, incompatible combination, decimal as a string).
- E2E: AC-02.9 (with the clock fixed), AC-02.16, AC-02.25 (factor change and reload, ADR-0003) and AC-03.9.
- Review: `grep -rn "Math.round" frontend/src/app` → only in `domain/pricing/`.

## Pros and cons of the options

### 1. Repeatable component on `Country` (chosen)

- For: native order; editing grouped by country; no orphan documents; a small request with a projection.
- Against: it is published with the whole country; redundancy between role and operand.

### 2. `price-factor` collection

- For: publication per band; requested without touching `Country`; separate permissions.
- Against: it needs an `order` field with its ties and gaps (another tie-breaking rule). There can be bands without a country. Another public permission and another allowlist route are needed. The business edits loose bands without seeing the whole set.

### 3. JSON field

- For: maximum flexibility without changing the schema.
- Against: the admin validates nothing (a syntax error breaks the rule); it is not "configurable by the business" in any reasonable sense.

## References

Consulted on 2026-11-22:

- Strapi 5, populate of components (`populate[0]=component-name`) and field selection: https://docs.strapi.io/cms/api/rest/populate-select
- Strapi 5, attribute types (`integer`, `decimal`, `enumeration`, repeatable `component`): https://docs.strapi.io/cms/backend-customization/models
- MDN, `Intl.NumberFormat` constructor (`style: 'currency'`, `currency` required, `minimumFractionDigits`/`maximumFractionDigits`): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
- Currency formatting in Node 24.22.3 (`es-CO` → `24 a0 31 2e …`, `es-CL` → `24 33 38 2e …`): `reviews/000-G2-specs-cross-consistency.md` (real run, F-00.6)

> Translated into English on 2026-11-23 (D16); no content change.
