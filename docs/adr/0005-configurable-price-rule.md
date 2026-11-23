# ADR-0005 — Regla de precio configurable: factores por país y función pura

| Campo | Valor |
|---|---|
| Estado | Proposed |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisores | Humano (G3) |
| Motivado por | D8 · G2-1, G2-8, G2-9, G2-13 · REQ-02.6, REQ-02.8, REQ-02.9, REQ-02.10, REQ-02.11, REQ-02.12, REQ-02.13, REQ-02.23, REQ-03.4, REQ-03.5 |

## Contexto y problema

El PDF dice: "The final price may be adjusted by a simulated rule based on the step 1 data. The rule is documented." D8 fijó factores por país en Strapi más una función pura, y G2-8 aprobó el algoritmo: `Math.round(basePrice × Π multiplicadores)`, con operandos `vehicleAge` y `ageInYears`, bandas inclusivas por país y enlace por rol (G2-1). Falta decidir cómo se modelan los factores en Strapi, la firma exacta de la función y cómo se comparte entre el paso 2 y el resumen (G2-9). La documentación pedida por REQ-02.13 está en [`docs/architecture/pricing-rule.md`](../architecture/pricing-rule.md).

## Factores de decisión

- El negocio cambia bandas, multiplicadores, orden y el rol al que aplican sin código (REQ-02.9).
- "Primera banda en el orden configurado" (REQ-02.12): el orden tiene que ser explícito y fácil de editar.
- Los factores se piden en cada entrada al paso 2 y al resumen (REQ-02.23, REQ-03.5), sin pedir de nuevo los textos.
- Función pura y determinista con fecha inyectada (REQ-02.8).
- El mismo resultado en el paso 2 y en el resumen (REQ-03.5).

## Opciones consideradas

1. **Componente repetible `pricing.price-factor` dentro de `Country`** (`priceFactors`), en el orden del array.
2. **Colección `price-factor`** con relación a `Country` y un campo `order`.
3. **Campo JSON** `priceRules` en `Country`.

## Decisión

Opción elegida: **1. Componente repetible en `Country`**.

**Modelo (Strapi):**

| Atributo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `role` | enumeration `vehicleYear`, `birthDate` | Sí | Roles de US-01 que usa la regla (G2-1) |
| `operand` | enumeration `vehicleAge`, `ageInYears` | Sí | Operandos fijos en código (G2-8) |
| `min` | integer | No | Vacío = sin límite inferior |
| `max` | integer | No | Vacío = sin límite superior |
| `multiplier` | decimal | Sí | Debe ser > 0 y finito |

Se piden con una proyección que no incluye los textos: `GET /api/countries?filters[code][$eq]={cc}&fields[0]=code&populate[0]=priceFactors` (C6 en api-contracts).

**Funciones puras** (`frontend/src/app/domain/pricing/`):

```ts
export type PriceRole = 'vehicleYear' | 'birthDate';
export type PriceOperand = 'vehicleAge' | 'ageInYears';
export interface PriceFactorRule { role: PriceRole; operand: PriceOperand; min: number | null; max: number | null; multiplier: number; }
export interface PriceInputs { vehicleYear: number | null; birthDate: string | null; } // valores por rol, desde Step1Result
export interface AppliedFactor { role: PriceRole; operand: PriceOperand; x: number | null; multiplier: number; }
export function computeFinalPrice(basePrice: number, inputs: PriceInputs, rules: readonly PriceFactorRule[], referenceDate: string /* YYYY-MM-DD */): { finalPrice: number; appliedFactors: AppliedFactor[] };
export function formatPrice(amount: number, intlLocale: string, currency: string): string;
```

- Algoritmo idéntico a US-02 §6.3:
  1. Descartar las reglas inválidas.
  2. Agrupar por (`role`, `operand`).
  3. Calcular `x` (`vehicleAge = max(0, año(ref) − año)`; `ageInYears` con la misma función `ageInYears` que usa la mayoría de edad de US-01, en `domain/dates/`).
  4. El factor es la primera banda con `min ≤ x ≤ max` o, si no hay ninguna, 1.
  5. `Math.round` una sola vez al final.
- **Combinación rol-operando incompatible** (`birthDate` con `vehicleAge` o `vehicleYear` con `ageInYears`): el mapper la descarta con aviso, igual que una banda inválida. Es una extensión de REQ-02.12 que necesita confirmación humana (ver Decisiones para G3).
- `PriceInputs` se obtiene por **rol** desde `Step1Result`, nunca por `key` (REQ-02.10). Si hay varios campos con el mismo rol (G2-5 lo permite), se usa el primero en el orden de pantalla. Para el precio no hay ambigüedad práctica, porque todos deben ser válidos para que `isComplete` sea verdadero. Se documenta como regla determinista.
- `formatPrice` usa `new Intl.NumberFormat(intlLocale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })` (REQ-02.6). Fijar 0 decimales es una decisión aprobada en la spec para COP y CLP. Una moneda con decimales exigiría superseder este ADR.
- **Compartida por el paso 2 y el resumen:** las dos páginas llaman a `computeFinalPrice` con el mismo `Step1Result`, los mismos factores recién pedidos y `todayLocal(clock())`. Nada de precio se persiste (G2-9).
- `basePrice` es `integer` en Strapi (unidades enteras de la moneda, `min: 1`), lo que evita ambigüedades de serialización de los decimales. `multiplier` es `decimal`, y el mapper acepta un `number` o un `string` numérico, y descarta todo lo que no sea finito.

## Consecuencias

- **Positivas:**
  - El negocio edita todas las bandas de un país en una sola pantalla del admin y las reordena arrastrando; el orden es el del array y no hace falta un campo `order`.
  - No hay bandas sin país ni bandas de un país en otro: el componente pertenece a `Country`.
  - Función pura, tabla E1–E6 como unit test, y el mismo código en el paso 2 y en el resumen.
- **Negativas:**
  - Cambiar un factor exige volver a publicar `Country` completo (ADR-0001), y un borrador pendiente de textos del mismo país bloquea publicar el factor.
  - Se pide `Country` dos veces en un mismo flujo (configuración una vez por carga y factores en cada entrada), con proyecciones distintas.
  - `role` y `operand` son redundantes (cada rol tiene un único operando válido). Se conservan porque G2-8 los aprobó así y porque permiten operandos nuevos sobre el mismo rol, pero exigen la regla de descarte de combinaciones incompatibles.
  - `basePrice` entero no admite monedas con céntimos.
- **Riesgos y mitigación:**
  - *Serialización de `decimal` en la REST API* (número o cadena según la base de datos): la documentación consultada no lo precisa. El mapper acepta ambos, y un unit test cubre los dos casos.
  - *Bandas que cambian cerca de la fecha del e2e:* el e2e fija el reloj (ADR-0007).

### Confirmación

- Unit: `computeFinalPrice` con E1–E6, AC-02.10, AC-02.11, AC-02.12 y AC-02.13; `formatPrice` con las cadenas exactas de AC-02.8 (U+00A0 en `es-CO`); mapper de factores (multiplicador 0, `min > max`, combinación incompatible, decimal como cadena).
- E2E: AC-02.9 (con reloj fijado), AC-02.16, AC-02.25 (cambio de factor y recarga, ADR-0003) y AC-03.9.
- Review: `grep -rn "Math.round" frontend/src/app` → solo en `domain/pricing/`.

## Pros y contras de las opciones

### 1. Componente repetible en `Country` (elegida)

- A favor: orden nativo; edición agrupada por país; ningún documento huérfano; una petición pequeña con proyección.
- En contra: se publica con todo el país; redundancia entre rol y operando.

### 2. Colección `price-factor`

- A favor: publicación por banda; se pide sin tocar `Country`; permisos separados.
- En contra: necesita un campo `order` con sus empates y vacíos (otra regla de desempate). Puede haber bandas sin país. Hace falta otro permiso público y otra ruta en la allowlist. El negocio edita bandas sueltas sin ver el conjunto.

### 3. Campo JSON

- A favor: máxima flexibilidad sin cambiar el esquema.
- En contra: el admin no valida nada (un error de sintaxis rompe la regla); no es "configurable por el negocio" en un sentido razonable.

## Referencias

Consultadas el 2026-11-22:

- Strapi 5, populate de componentes (`populate[0]=component-name`) y selección de campos: https://docs.strapi.io/cms/api/rest/populate-select
- Strapi 5, tipos de atributo (`integer`, `decimal`, `enumeration`, `component` repetible): https://docs.strapi.io/cms/backend-customization/models
- MDN, constructor `Intl.NumberFormat` (`style: 'currency'`, `currency` obligatorio, `minimumFractionDigits`/`maximumFractionDigits`): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
- Formato de moneda en Node 24.22.3 (`es-CO` → `24 a0 31 2e …`, `es-CL` → `24 33 38 2e …`): `reviews/000-G2-specs-cross-consistency.md` (ejecución real, F-00.6)
