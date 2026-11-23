# Regla de precio simulada

| Campo | Valor |
|---|---|
| Estado | Proposed (G3) |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Origen | PDF US-02, regla 4 ("The rule is documented") · D8 · G2-8 · REQ-02.8 a REQ-02.13 · ADR-0005 |
| Fuente funcional | `specs/US-02/spec.md` §6.3. Este documento describe la misma regla en términos de implementación; si difieren, gana la spec |

## 1. Fórmula

```
finalPrice = Math.round( basePrice × factor(vehicleYear · vehicleAge) × factor(birthDate · ageInYears) )
```

- `basePrice`: `plan.basePrice` (entero > 0, en la moneda del país).
- Cada factor es el `multiplier` de la **primera** banda válida del país, en el orden configurado en `country.priceFactors`, cuyo intervalo `[min, max]` (inclusivo; vacío = sin límite) contiene `x`. Si ninguna banda contiene `x`, o no hay dato para el rol, el factor es 1.
- `x` para `vehicleAge` = `max(0, año(referenceDate) − valor del campo con rol vehicleYear)`.
- `x` para `ageInYears` = años cumplidos entre el valor del campo con rol `birthDate` y `referenceDate` (misma función que la mayoría de edad de US-01; el 29 de febrero cuenta desde el 1 de marzo en años no bisiestos).
- `referenceDate` = fecha local del dispositivo, `YYYY-MM-DD`, inyectada.
- Redondeo una sola vez, al final (`Math.round`, a unidad entera).
- Bandas descartadas antes de evaluar: `multiplier` no finito o ≤ 0, `min > max`, o rol y operando incompatibles.

## 2. Implementación

| Pieza | Ubicación | Naturaleza |
|---|---|---|
| `computeFinalPrice(basePrice, inputs, rules, referenceDate)` | `frontend/src/app/domain/pricing/compute-final-price.ts` | Función pura |
| `ageInYears(birthDate, referenceDate)` | `frontend/src/app/domain/dates/` | Función pura, compartida con US-01 |
| `formatPrice(amount, intlLocale, currency)` | `frontend/src/app/domain/pricing/format-price.ts` | `Intl.NumberFormat` con 0 decimales |
| `mapPriceFactors(dto)` | `frontend/src/app/core/cms/` | Mapper DTO → `PriceFactorRule[]` (api-contracts C6) |
| Bandas y multiplicadores | Strapi, `country.priceFactors` | Contenido (sin despliegue) |

El paso 2 y el resumen llaman a la misma función con los factores recién pedidos (C6), los valores por rol de `Step1Result` y la misma `referenceDate`. No se persiste ningún precio (G2-9).

## 3. Valores del seed (ficticios)

| País | Rol · operando | Banda | Multiplicador |
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

## 4. Ejemplos verificables (fecha de referencia 2026-11-22)

Son los casos de los unit tests (AC-02.9). Se copian de US-02 §6.3:

| # | País | Precio base | `vehicleYear` → edad → factor | `birthDate` → edad → factor | Precio final |
|---|---|---|---|---|---|
| E1 | CO | 1 200 000 | 2018 → 8 → 1.10 | 2000-05-10 → 26 → 1.00 | 1 320 000 |
| E2 | CO | 1 200 000 | 2027 → 0 → 1.00 | 2005-12-01 → 20 → 1.20 | 1 440 000 |
| E3 | CO | 850 000 | 2006 → 20 → 1.25 | 1960-11-22 → 66 → 1.15 | 1 221 875 |
| E4 | CL | 25 990 | 2012 → 14 → 1.20 | 2004-03-15 → 22 → 1.25 | 38 985 |
| E5 | CL | 25 990 | 2022 → 4 → 1.00 | sin valor → 1 | 25 990 |
| E6 | CL | 19 990 | 2017 → 9 → 1.08 | 1990-01-01 → 36 → 1.00 | 21 589 |

Formato (AC-02.8): `formatPrice(1320000, 'es-CO', 'COP')` = `"$ 1.320.000"` (con U+00A0 entre `$` y `1`); `formatPrice(38985, 'es-CL', 'CLP')` = `"$38.985"`.

## 5. Qué puede cambiar el negocio

Desde Strapi: bandas, multiplicadores, su orden y el rol al que aplican (de `vehicleYear` y `birthDate`), por país. Exige código: un operando nuevo, un rol nuevo, otra forma de combinar factores o de redondear (caso B de `country-content`).
