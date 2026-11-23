# Contratos de API: Angular → nginx → Strapi 5

| Campo | Valor |
|---|---|
| Estado | Proposed (G3) |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisiones | D3, D4, D6 · ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006 |
| Modelo | [`content-model.md`](content-model.md) |

## 1. Reglas comunes

- **Origen:** URLs relativas `/api/...` desde el navegador hacia nginx (mismo origen). nginx solo permite `GET`/`HEAD` en `/api/countries`, `/api/form-fields`, `/api/plans` y `/api/country-selection` (ADR-0003).
- **Sin autenticación:** ninguna petición lleva `Authorization` ni cookies (REQ-01.35, REQ-02.31). No hay interceptores de autenticación.
- **Solo publicado:** la app **nunca** envía `status` ni `publicationFilter`. Por defecto la REST API devuelve la versión publicada, y el middleware `published-only` lo fuerza en Strapi.
- **Codificación:** los parámetros se construyen con `HttpParams` (codifican `[` y `]`). Los ejemplos se muestran sin codificar para que se lean mejor.
- **Paginación:** `pagination[pageSize]=100` (el `maxLimit` de Strapi está configurado en 100) y `pagination[page]=n`. Si `meta.pagination.pageCount > 1`, `CmsClient` pide las páginas `2..pageCount` en serie y concatena `data` (REQ-02.24). Aplica a C4 y C5. C1 usa una sola página de 100 (más de 100 países no es un caso realista; si `pageCount > 1` se recorren igual).
- **Timeout:** 10 000 ms por petición (ADR-0004).
- **Errores de petición** → estado `error` ("error de carga" + "reintentar"): error de red, timeout, HTTP distinto de 2xx, cuerpo que no es JSON, o forma global inesperada (`data` ausente, o de tipo distinto a array en collection types o a objeto en single types).
- **Errores de elemento** → el elemento se descarta (o el atributo se ignora) con `console.warn('[cms] …')`, **sin datos del usuario** (US-02 §7). No convierten la respuesta en error.
- **Caché:** respuestas con `Cache-Control: no-store` (nginx). La app no guarda respuestas fuera de memoria (REQ-01.6).
- **Formato v5:** atributos planos en cada elemento (sin `attributes`), `id` numérico y `documentId` string; los componentes incluyen su propio `id`. La app usa `documentId` como identidad (nunca `id`).

### Cuándo se hace cada petición

| Petición | Momento | Historia |
|---|---|---|
| C1 Países publicados | Al entrar en `/`, y en `/:country` solo si C3 no encuentra el país | US-01 |
| C2 Textos de `/` | Al entrar en `/` | US-01 |
| C3 Configuración del país | Una vez por carga de la app y país (y con "reintentar") | US-01, US-02, US-03 |
| C4 Campos del formulario | Junto con C3 (en paralelo) | US-01, US-02, US-03 |
| C5 Planes | En cada entrada al paso 2 y al resumen | US-02, US-03 |
| C6 Factores de precio | En cada entrada al paso 2 y al resumen (en paralelo con C5) | US-02, US-03 |
| C7 Términos | En cada entrada al resumen | US-03 |

C3 y C4 forman la **configuración del país** (`CountryConfig`): si falla cualquiera de las dos, el estado es `error`.

## 2. Peticiones

### C1 — Países publicados

```
GET /api/countries
  ?fields[0]=code&fields[1]=name
  &sort[0]=name:asc
  &pagination[pageSize]=100
```

```json
{
  "data": [
    { "id": 4, "documentId": "q2w8e4r6t1y3u5i7o9p0a2s4", "code": "cl", "name": "Chile" },
    { "id": 2, "documentId": "z1x3c5v7b9n2m4k6j8h0g2f4", "code": "co", "name": "Colombia" }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 100, "pageCount": 1, "total": 2 } }
}
```

Dominio: `CountrySummary { code: string; name: string }[]`. Se descartan los elementos con un `code` que no cumple `^[a-z]{2}$` o sin `name`. Si hay códigos duplicados, se queda el primero. La resolución de `/:country` no usa esta lista sino C3: si C3 devuelve 0 países, se pide C1 para mostrar "país no disponible" con los países publicados como enlaces (REQ-01.2). Si C1 falla, aparece "país no disponible" con "error de carga" + "reintentar" en lugar de la lista.

### C2 — Textos de la página `/`

```
GET /api/country-selection?fields[0]=heading&fields[1]=intro&fields[2]=countryListLabel
```

```json
{
  "data": { "id": 1, "documentId": "m3n5b7v9c1x3z5l7k9j1h3g5", "heading": "Cotiza el seguro de tu auto", "intro": "Elige tu país para empezar.", "countryListLabel": "Países disponibles" },
  "meta": {}
}
```

Dominio: `CountrySelectionTexts { heading: string; intro: string | null; countryListLabel: string }`. Un `404` (single type no publicado), o la falta de `heading` o `countryListLabel`, se tratan como **error** ("error de carga" + "reintentar"), porque en `/` no hay mensaje genérico de país. Ver "Huecos" (§4).

### C3 — Configuración del país (datos y textos)

```
GET /api/countries
  ?filters[code][$eq]=co
  &fields[0]=code&fields[1]=name&fields[2]=intlLocale&fields[3]=currency&fields[4]=minimumAge
  &populate[0]=wizardTexts&populate[1]=formStepTexts&populate[2]=plansStepTexts
  &populate[3]=summaryStepTexts&populate[4]=confirmationTexts
  &pagination[pageSize]=2
```

`pageSize=2` permite detectar un duplicado (`data.length > 1` → error de configuración, que en la práctica impide `code` único).

```json
{
  "data": [
    {
      "id": 2,
      "documentId": "z1x3c5v7b9n2m4k6j8h0g2f4",
      "code": "co",
      "name": "Colombia",
      "intlLocale": "es-CO",
      "currency": "COP",
      "minimumAge": 18,
      "wizardTexts": {
        "id": 7,
        "stepIndicatorLabel": "Progreso de la cotización",
        "step1Label": "Tus datos",
        "step2Label": "Planes",
        "step3Label": "Resumen y pago",
        "policyholderSectionLabel": "Datos del asegurado",
        "vehicleSectionLabel": "Datos del vehículo",
        "genericErrorMessage": "No pudimos mostrar esta sección. Intenta más tarde."
      },
      "formStepTexts": { "id": 7, "title": "Tus datos y los de tu vehículo", "continueLabel": "Continuar", "emptyMessage": "El formulario no está disponible por ahora." },
      "plansStepTexts": { "id": 7, "title": "Elige tu plan", "groupLegend": "Planes disponibles", "recommendedLabel": "Recomendado", "coveragesHeading": "Coberturas", "benefitsHeading": "Beneficios", "backLabel": "Volver", "continueLabel": "Continuar", "choosePlanMessage": "Elige un plan para continuar.", "emptyMessage": "No hay planes disponibles.", "planUnavailableMessage": "El plan que elegiste ya no está disponible." },
      "summaryStepTexts": { "id": 7, "title": "Resumen", "editDataLabel": "Editar datos", "yesLabel": "Sí", "noLabel": "No", "emptyValueLabel": "—", "planHeading": "Plan elegido", "changePlanLabel": "Cambiar plan", "finalPriceLabel": "Precio final", "termsHeading": "Términos y condiciones", "acceptTermsLabel": "Acepto los términos y condiciones", "acceptTermsHint": "Acepta los términos para habilitar el pago.", "termsUnavailableMessage": "Los términos no están disponibles.", "gatewayLegend": "Pasarela simulada", "approvedOptionLabel": "Pago aprobado", "rejectedOptionLabel": "Pago rechazado", "payLabel": "Pagar", "processingMessage": "Procesando el pago…", "rejectedMessage": "El pago fue rechazado. Puedes intentarlo de nuevo." },
      "confirmationTexts": { "id": 7, "title": "¡Listo!", "quoteNumberLabel": "Número de cotización", "planLabel": "Plan", "paidPriceLabel": "Precio pagado", "newQuoteLabel": "Nueva cotización" }
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 2, "pageCount": 1, "total": 1 } }
}
```

Mapeo a dominio:

| DTO | Dominio | Regla |
|---|---|---|
| `data.length === 0` | `notAvailable` | "país no disponible" (no publicado o código desconocido) |
| `data.length > 1` | `error` | Configuración no interpretable |
| `code`, `name`, `intlLocale`, `currency` | `Country.code`, `.name`, `.intlLocale`, `.currency` | `intlLocale` y `currency` deben ser aceptados por `Intl.NumberFormat` (se comprueba en un `try`); si no, `error` |
| `minimumAge` | `Country.minimumAge: number` | Entero ≥ 0; si no, `error` (sin él no se puede aplicar REQ-01.20) |
| `*Texts.*` | `UiTexts` (un objeto por pantalla) | Cada texto se recorta; vacío o ausente → la pantalla o sección queda `configError` (content-model §3.5). Si falta `genericErrorMessage` → `error` |

### C4 — Campos del formulario

```
GET /api/form-fields
  ?filters[country][code][$eq]=co
  &fields[0]=key&fields[1]=label&fields[2]=type&fields[3]=required&fields[4]=helpText
  &fields[5]=errorMessage&fields[6]=order&fields[7]=section&fields[8]=role
  &populate[0]=options&populate[1]=validations
  &pagination[pageSize]=100&pagination[page]=1
```

```json
{
  "data": [
    {
      "id": 31,
      "documentId": "f9d8s7a6p5o4i3u2y1t0r9e8",
      "key": "co_documentType",
      "label": "Tipo de documento",
      "type": "select",
      "required": true,
      "helpText": null,
      "errorMessage": "Elige el tipo de documento.",
      "order": 1,
      "section": "policyholder",
      "role": null,
      "options": [
        { "id": 101, "value": "cc", "label": "Cédula de ciudadanía" },
        { "id": 102, "value": "ce", "label": "Cédula de extranjería" }
      ],
      "validations": []
    },
    {
      "id": 32,
      "documentId": "g1h2j3k4l5z6x7c8v9b0n1m2",
      "key": "co_vehicleYear",
      "label": "Año del vehículo",
      "type": "number",
      "required": true,
      "helpText": "Año del modelo, por ejemplo 2020.",
      "errorMessage": "Ingresa un año válido.",
      "order": 3,
      "section": "vehicle",
      "role": "vehicleYear",
      "options": [],
      "validations": [ { "id": 55, "kind": "integer", "value": null, "pattern": null } ]
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 100, "pageCount": 1, "total": 9 } }
}
```

Mapeo a `FormConfig` (función pura `mapFormFields(dtos, country) → { config, warnings }`; tablas 5.2 a 5.4 de US-01):

| DTO | Dominio `FormFieldConfig` | Regla |
|---|---|---|
| `key` | `key: string` | Debe cumplir `^[a-z][a-zA-Z0-9_]{0,49}$`; si no → se omite el campo. Si se repite → se queda el primero por `order` (5.3) |
| `label` | `label: string` | Recortado; vacío → se omite el campo (5.3) |
| `type` | `type: FieldType` | Fuera del catálogo → se omite el campo |
| `required` | `required: boolean` | `true` solo si es exactamente `true` |
| `helpText` | `helpText: string \| null` | Vacío → `null` (no se muestra) |
| `errorMessage` | `errorMessage: string \| null` | Vacío → `null` (se usa `genericErrorMessage`) |
| `order` | `order: number \| null` | Entero o `null`. Orden: sección fija (`policyholder`, `vehicle`), luego `order` ascendente, `null` al final, desempate por `key` |
| `section` | `section: Section` | Fuera del catálogo → se omite el campo |
| `role` | `role: FieldRole \| null` | Fuera del catálogo o incompatible con `type` → `null` con aviso |
| `options` | `options: { value; label }[]` | Solo en `select`. Se omiten las opciones sin `value` o `label` y los `value` repetidos. Sin opciones válidas → se omite el campo |
| `validations` | `validations: ValidationRule[]` | Unión discriminada por `kind` (ADR-0002). Inválidas o de otro tipo de campo → se ignoran |

Estado de `FormConfig`:

- `empty` si no queda ningún campo (REQ-01.5).
- `unavailable` si falta algún rol obligatorio (`documentNumber`, `birthDate` o `vehicleYear`) en un campo válido (REQ-01.22, G2-5).
- `configError` si falta un texto del paso (REQ-01.13).
- `ready` en el resto de casos.

### C5 — Planes del país

```
GET /api/plans
  ?filters[country][code][$eq]=co&filters[active][$eq]=true
  &fields[0]=name&fields[1]=shortDescription&fields[2]=basePrice&fields[3]=currency
  &fields[4]=order&fields[5]=recommended&fields[6]=active
  &populate[0]=coverages&populate[1]=benefits
  &pagination[pageSize]=100&pagination[page]=1
```

```json
{
  "data": [
    {
      "id": 12,
      "documentId": "p0o9i8u7y6t5r4e3w2q1a0s9",
      "name": "Plan Esencial",
      "shortDescription": "Responsabilidad civil y asistencia básica.",
      "basePrice": 850000,
      "currency": "COP",
      "order": 1,
      "recommended": false,
      "active": true,
      "coverages": [ { "id": 201, "label": "Responsabilidad civil" } ],
      "benefits": [ { "id": 301, "label": "Grúa 24 h" } ]
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 100, "pageCount": 1, "total": 3 } }
}
```

Mapeo a `Plan` (función pura `mapPlans(dtos, country) → { plans, warnings }`):

| DTO | Dominio | Regla |
|---|---|---|
| `documentId` | `id: string` | Identidad persistida (G2-9); vacío → se descarta el plan |
| `active` | — | Se vuelve a comprobar `=== true` (defensa ante un cambio del filtro); si no, se descarta (REQ-02.2) |
| `name` | `name: string` | Recortado; vacío → se descarta (REQ-02.25) |
| `shortDescription` | `shortDescription: string \| null` | Vacío → `null` |
| `basePrice` | `basePrice: number` | Número (o cadena numérica) finito y > 0; si no → se descarta (REQ-02.25) |
| `currency` | — | Distinta de `Country.currency` → se descarta con aviso (REQ-02.7, G2-11) |
| `coverages`, `benefits` | `string[]` | `null` → `[]`; se omiten los `label` vacíos (REQ-02.3) |
| `order` | `order: number \| null` | Orden: `order` ascendente, `null` al final, luego `name.localeCompare(otro, intlLocale)` y luego `documentId` (REQ-02.4) |
| `recommended` | `recommended: boolean` | Solo el primero en orden con `true` se destaca (REQ-02.5); función pura `markRecommended` |

Lista vacía tras filtrar → estado `empty` (REQ-02.22). El resumen comprueba que el plan persistido esté en esta lista (REQ-03.14).

### C6 — Factores de precio

```
GET /api/countries
  ?filters[code][$eq]=co
  &fields[0]=code
  &populate[0]=priceFactors
  &pagination[pageSize]=2
```

```json
{
  "data": [
    {
      "id": 2,
      "documentId": "z1x3c5v7b9n2m4k6j8h0g2f4",
      "code": "co",
      "priceFactors": [
        { "id": 401, "role": "vehicleYear", "operand": "vehicleAge", "min": 0, "max": 5, "multiplier": 1 },
        { "id": 402, "role": "vehicleYear", "operand": "vehicleAge", "min": 6, "max": 10, "multiplier": 1.1 },
        { "id": 406, "role": "birthDate", "operand": "ageInYears", "min": 66, "max": null, "multiplier": 1.15 }
      ]
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 2, "pageCount": 1, "total": 1 } }
}
```

Mapeo a `PriceFactorRule[]`, en el orden del array (ADR-0005):

| DTO | Dominio | Regla |
|---|---|---|
| `role`, `operand` | `role`, `operand` | Fuera del catálogo, o combinación incompatible → se descarta |
| `min`, `max` | `number \| null` | Entero o `null`; `min > max` → se descarta (REQ-02.12) |
| `multiplier` | `number` | `number` o cadena numérica; no finito o ≤ 0 → se descarta (REQ-02.12) |

`data.length === 0` (el país se despublicó entre pasos) → `error`. `priceFactors` vacío o `null` → `[]` (precio = precio base, REQ-02.9).

### C7 — Términos y condiciones

```
GET /api/countries
  ?filters[code][$eq]=co
  &fields[0]=code&fields[1]=termsAndConditions
  &pagination[pageSize]=2
```

```json
{
  "data": [
    {
      "id": 2,
      "documentId": "z1x3c5v7b9n2m4k6j8h0g2f4",
      "code": "co",
      "termsAndConditions": [
        { "type": "paragraph", "children": [ { "type": "text", "text": "Este documento es ficticio y solo sirve para la prueba técnica." } ] },
        { "type": "list", "format": "unordered", "children": [
          { "type": "list-item", "children": [ { "type": "text", "text": "La cotización es simulada.", "bold": true } ] },
          { "type": "list-item", "children": [ { "type": "text", "text": "No se realiza ningún cobro." } ] }
        ] }
      ]
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 2, "pageCount": 1, "total": 1 } }
}
```

Mapeo a `TermsDocument` (ADR-0006). La forma de los nodos `list` y `list-item` del ejemplo se confirma contra la respuesta real del seed antes de fijar la fixture de los tests:

| DTO | Dominio | Regla |
|---|---|---|
| `termsAndConditions` | `TermsBlock[]` | Árbol cerrado (`paragraph`, `heading`, `list`, `text` con marcas); los nodos desconocidos se degradan a texto |
| `null`, `[]` o sin texto | `unavailable` | "términos no disponibles" (REQ-03.18) |
| `data.length > 1` | `unavailable` | REQ-03.18 (varios registros) |
| `data.length === 0` | `error` | País despublicado entre pasos |

## 3. Tipos de dominio (resumen)

```ts
type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';
type FieldRole = 'documentNumber' | 'birthDate' | 'vehicleYear';
type Section = 'policyholder' | 'vehicle';
type ValidationRule =
  | { kind: 'minLength'; value: number } | { kind: 'maxLength'; value: number }
  | { kind: 'pattern'; regex: RegExp; source: string }
  | { kind: 'min'; value: number } | { kind: 'max'; value: number } | { kind: 'integer' };
interface FormFieldConfig { key: string; label: string; type: FieldType; required: boolean; helpText: string | null;
  errorMessage: string | null; order: number | null; section: Section; role: FieldRole | null;
  options: readonly { value: string; label: string }[]; validations: readonly ValidationRule[]; }
interface Plan { id: string; name: string; shortDescription: string | null; basePrice: number;
  coverages: readonly string[]; benefits: readonly string[]; order: number | null; recommended: boolean; }
interface Step1FieldResult { key: string; type: FieldType; section: Section; role: FieldRole | null;
  label: string; value: string | number | boolean | null; displayValue: string | null; valid: boolean; }
interface Step1Result { fields: readonly Step1FieldResult[]; isComplete: boolean; } // REQ-01.27, nunca persistido
```

Los DTOs (`frontend/src/app/core/cms/strapi-dto.ts`) se declaran como `unknown` en la frontera y se estrechan en los mappers (`CLAUDE.md` §8: sin `any`).

## 4. Huecos detectados (para el orquestador)

| Hueco | Propuesta | Por qué no lo decide la arquitectura |
|---|---|---|
| Qué se muestra en `/` si `country-selection` no está publicado o le falta un texto obligatorio | "error de carga" + "reintentar", sin lista, aplicando la regla de F-00.7 (no hay mensaje genérico de país en `/`) | REQ-01.2 no lo especifica; es comportamiento visible |
| Combinación rol-operando incompatible en un factor | Se descarta la banda con aviso (como REQ-02.12) | Amplía REQ-02.12 |

## 5. Referencias

Consultadas el 2026-11-22:

- REST API (formato de respuesta v5 con `documentId`, endpoints): https://docs.strapi.io/cms/api/rest
- Parámetros de la REST API (`filters`, `status`, `populate`, `fields`, `sort`, `pagination`): https://docs.strapi.io/cms/api/rest/parameters
- `status` (por defecto `published`): https://docs.strapi.io/cms/api/rest/status
- Populate y selección de campos (`populate[0]=component`, `fields[0]=…`; `find` obligatorio en los tipos poblados): https://docs.strapi.io/cms/api/rest/populate-select
- Filtros (operadores, filtro por relación): https://docs.strapi.io/cms/api/rest/filters
- Orden y paginación (`pagination[page]`, `pagination[pageSize]` con valor por defecto 25 y límite `api.rest.maxLimit`; `sort[0]=campo:asc`): https://docs.strapi.io/cms/api/rest/sort-pagination
- Renderer oficial de Blocks (tipos de bloque): https://github.com/strapi/blocks-react-renderer
