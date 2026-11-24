# Simulated price rule

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Origin | PDF US-02, rule 4 ("The rule is documented") · D8 · G2-8 · REQ-02.8 to REQ-02.13 · ADR-0005 |
| Functional source | `specs/US-02/spec.md` §6.3. This document describes the same rule in implementation terms; if they differ, the spec wins |

## 1. Formula

```
finalPrice = Math.round( basePrice × factor(vehicleYear · vehicleAge) × factor(birthDate · ageInYears) )
```

- `basePrice`: `plan.basePrice` (integer > 0, in the country's currency).
- Each factor is the `multiplier` of the country's **first** valid band, in the order configured in `country.priceFactors`, whose interval `[min, max]` (inclusive; empty = no bound) contains `x`. If no band contains `x`, or there is no value for the role, the factor is 1.
- `x` for `vehicleAge` = `max(0, year(referenceDate) − value of the field with role vehicleYear)`.
- `x` for `ageInYears` = completed years between the value of the field with role `birthDate` and `referenceDate` (same function as the US-01 legal age; February 29 counts from March 1 in non-leap years).
- `referenceDate` = the device's local date, `YYYY-MM-DD`, injected.
- Rounding only once, at the end (`Math.round`, to a whole unit).
- Bands discarded before evaluating: non-finite or ≤ 0 `multiplier`, `min > max`, or incompatible role and operand.

## 2. Implementation

| Piece | Location | Nature |
|---|---|---|
| `computeFinalPrice(basePrice, inputs, rules, referenceDate)` | `frontend/src/app/domain/pricing/compute-final-price.ts` | Pure function |
| `ageInYears(birthDate, referenceDate)` | `frontend/src/app/domain/dates/` | Pure function, shared with US-01 |
| `formatPrice(amount, intlLocale, currency)` | `frontend/src/app/domain/pricing/format-price.ts` | `Intl.NumberFormat` with 0 decimals |
| `mapPriceFactors(dto)` | `frontend/src/app/core/cms/` | DTO → `PriceFactorRule[]` mapper (api-contracts C6) |
| Bands and multipliers | Strapi, `country.priceFactors` | Content (no deployment) |

Step 2 and the summary call the same function with the freshly requested factors (C6), the values by role from `Step1Result` and the same `referenceDate`. No price is persisted (G2-9).

## 3. Seed values (fictitious)

| Country | Role · operand | Band | Multiplier |
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

## 4. Verifiable examples (reference date 2026-11-22)

These are the unit test cases (AC-02.9). They are copied from US-02 §6.3:

| # | Country | Base price | `vehicleYear` → age → factor | `birthDate` → age → factor | Final price |
|---|---|---|---|---|---|
| E1 | CO | 1 200 000 | 2018 → 8 → 1.10 | 2000-05-10 → 26 → 1.00 | 1 320 000 |
| E2 | CO | 1 200 000 | 2027 → 0 → 1.00 | 2005-12-01 → 20 → 1.20 | 1 440 000 |
| E3 | CO | 850 000 | 2006 → 20 → 1.25 | 1960-11-22 → 66 → 1.15 | 1 221 875 |
| E4 | CL | 25 990 | 2012 → 14 → 1.20 | 2004-03-15 → 22 → 1.25 | 38 985 |
| E5 | CL | 25 990 | 2022 → 4 → 1.00 | no value → 1 | 25 990 |
| E6 | CL | 19 990 | 2017 → 9 → 1.08 | 1990-01-01 → 36 → 1.00 | 21 589 |

Format (AC-02.8): `formatPrice(1320000, 'es-CO', 'COP')` = `"$ 1.320.000"` (with U+00A0 between `$` and `1`); `formatPrice(38985, 'es-CL', 'CLP')` = `"$38.985"`.

## 5. What the business can change

From Strapi: bands, multipliers, their order and the role they apply to (out of `vehicleYear` and `birthDate`), per country. Requires code: a new operand, a new role, another way of combining factors or of rounding (case B of `country-content`).

> Translated into English on 2026-11-23 (D16); no content change.
