# API contracts: Angular → nginx → Strapi 5

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Decisions | D3, D4, D6 · ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006 |
| Model | [`content-model.md`](content-model.md) |

## 1. Common rules

- **Origin:** relative URLs `/api/...` from the browser to nginx (same origin). nginx only allows `GET`/`HEAD` on `/api/countries`, `/api/form-fields`, `/api/plans` and `/api/country-selection` (ADR-0003).
- **No authentication:** no request carries `Authorization` or cookies (REQ-01.35, REQ-02.31). There are no authentication interceptors.
- **Published only:** the app **never** sends `status` or `publicationFilter`. By default the REST API returns the published version, and the `published-only` middleware enforces it in Strapi.
- **Encoding:** parameters are built with `HttpParams` (which encode `[` and `]`). The examples are shown unencoded for readability.
- **Pagination:** `pagination[pageSize]=100` (Strapi's `maxLimit` is configured at 100) and `pagination[page]=n`. If `meta.pagination.pageCount > 1`, `CmsClient` requests pages `2..pageCount` serially and concatenates `data` (REQ-02.24). It applies to C4 and C5. C1 uses a single page of 100 (more than 100 countries is not a realistic case; if `pageCount > 1` the pages are walked anyway).
- **Timeout:** 10 000 ms per request (ADR-0004).
- **Request errors** → `error` state ("error de carga" + "reintentar"): network error, timeout, HTTP other than 2xx, a body that is not JSON, or an unexpected overall shape (`data` missing, or of a type other than an array for collection types or an object for single types).
- **Item errors** → the item is discarded (or the attribute is ignored) with `console.warn('[cms] …')`, **without user data** (US-02 §7). They do not turn the response into an error.
- **Caching:** responses with `Cache-Control: no-store` (nginx). The app does not store responses outside memory (REQ-01.6).
- **v5 format:** flat attributes in each item (no `attributes`), numeric `id` and string `documentId`; components include their own `id`. The app uses `documentId` as identity (never `id`).

### When each request is made

| Request | When | Story |
|---|---|---|
| C1 Published countries | On entering `/`, and on `/:country` only if C3 does not find the country | US-01 |
| C2 `/` texts | On entering `/` | US-01 |
| C3 Country configuration | Once per app load and country (and with "reintentar") | US-01, US-02, US-03 |
| C4 Form fields | Together with C3 (in parallel) | US-01, US-02, US-03 |
| C5 Plans | On every entry to step 2 and to the summary | US-02, US-03 |
| C6 Price factors | On every entry to step 2 and to the summary (in parallel with C5) | US-02, US-03 |
| C7 Terms | On every entry to the summary | US-03 |

C3 and C4 make up the **country configuration** (`CountryConfig`): if either of them fails, the state is `error`.

## 2. Requests

### C1 — Published countries

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

Domain: `CountrySummary { code: string; name: string }[]`. Items with a `code` that does not match `^[a-z]{2}$` or without a `name` are discarded. If there are duplicate codes, the first one is kept. Resolving `/:country` does not use this list but C3: if C3 returns 0 countries, C1 is requested to show "país no disponible" with the published countries as links (REQ-01.2). If C1 fails, "país no disponible" appears with "error de carga" + "reintentar" instead of the list.

### C2 — `/` page texts

```
GET /api/country-selection?fields[0]=heading&fields[1]=intro&fields[2]=countryListLabel
```

```json
{
  "data": { "id": 1, "documentId": "m3n5b7v9c1x3z5l7k9j1h3g5", "heading": "Cotiza el seguro de tu auto", "intro": "Elige tu país para empezar.", "countryListLabel": "Países disponibles" },
  "meta": {}
}
```

Domain: `CountrySelectionTexts { heading: string; intro: string | null; countryListLabel: string }`. A `404` (single type not published), or a missing `heading` or `countryListLabel`, is treated as an **error** ("error de carga" + "reintentar"), because there is no country generic message on `/`. See "Gaps" (§4).

### C3 — Country configuration (data and texts)

```
GET /api/countries
  ?filters[code][$eq]=co
  &fields[0]=code&fields[1]=name&fields[2]=intlLocale&fields[3]=currency&fields[4]=minimumAge
  &populate[0]=wizardTexts&populate[1]=formStepTexts&populate[2]=plansStepTexts
  &populate[3]=summaryStepTexts&populate[4]=confirmationTexts
  &pagination[pageSize]=2
```

`pageSize=2` allows detecting a duplicate (`data.length > 1` → configuration error, which in practice the unique `code` prevents).

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
        "genericErrorMessage": "No pudimos mostrar esta sección. Intenta más tarde.",
        "changeCountryLabel": "Cambiar de país"
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

Mapping to domain:

| DTO | Domain | Rule |
|---|---|---|
| `data.length === 0` | `notAvailable` | "país no disponible" (not published or unknown code) |
| `data.length > 1` | `error` | Configuration cannot be interpreted |
| `code`, `name`, `intlLocale`, `currency` | `Country.code`, `.name`, `.intlLocale`, `.currency` | `intlLocale` and `currency` must be accepted by `Intl.NumberFormat` (checked in a `try`); otherwise, `error` |
| `minimumAge` | `Country.minimumAge: number` | Integer ≥ 0; otherwise, `error` (without it REQ-01.20 cannot be applied) |
| `*Texts.*` | `UiTexts` (one object per screen) | Each text is trimmed; empty or missing → the screen or section becomes `configError` (content-model §3.5). If `genericErrorMessage` is missing → `error` |

### C4 — Form fields

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

Mapping to `FormConfig` (pure function `mapFormFields(dtos, country) → { config, warnings }`; tables 5.2 to 5.4 of US-01):

| DTO | `FormFieldConfig` domain | Rule |
|---|---|---|
| `key` | `key: string` | Must match `^[a-z][a-zA-Z0-9_]{0,49}$`; otherwise → the field is omitted. If repeated → the first by `order` is kept (5.3) |
| `label` | `label: string` | Trimmed; empty → the field is omitted (5.3) |
| `type` | `type: FieldType` | Outside the catalog → the field is omitted |
| `required` | `required: boolean` | `true` only if it is exactly `true` |
| `helpText` | `helpText: string \| null` | Empty → `null` (not shown) |
| `errorMessage` | `errorMessage: string \| null` | Empty → `null` (`genericErrorMessage` is used) |
| `order` | `order: number \| null` | Integer or `null`. Order: fixed section (`policyholder`, `vehicle`), then ascending `order`, `null` last, tie broken by `key` |
| `section` | `section: Section` | Outside the catalog → the field is omitted |
| `role` | `role: FieldRole \| null` | Outside the catalog or incompatible with `type` → `null` with a warning |
| `options` | `options: { value; label }[]` | Only for `select`. Options without `value` or `label` and repeated `value`s are omitted. No valid options → the field is omitted |
| `validations` | `validations: ValidationRule[]` | Discriminated union by `kind` (ADR-0002). Invalid ones or those for another field type → ignored |

`FormConfig` state:

- `empty` if no field remains (REQ-01.5).
- `unavailable` if a required role (`documentNumber`, `birthDate` or `vehicleYear`) is missing from a valid field (REQ-01.22, G2-5).
- `configError` if a step text is missing (REQ-01.13).
- `ready` in all other cases.

### C5 — The country's plans

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

Mapping to `Plan` (pure function `mapPlans(dtos, country) → { plans, warnings }`):

| DTO | Domain | Rule |
|---|---|---|
| `documentId` | `id: string` | Persisted identity (G2-9); empty → the plan is discarded |
| `active` | — | `=== true` is checked again (defense against a change of the filter); otherwise, it is discarded (REQ-02.2) |
| `name` | `name: string` | Trimmed; empty → discarded (REQ-02.25) |
| `shortDescription` | `shortDescription: string \| null` | Empty → `null` |
| `basePrice` | `basePrice: number` | Finite number (or numeric string) > 0; otherwise → discarded (REQ-02.25) |
| `currency` | — | Different from `Country.currency` → discarded with a warning (REQ-02.7, G2-11) |
| `coverages`, `benefits` | `string[]` | `null` → `[]`; empty `label`s are omitted (REQ-02.3) |
| `order` | `order: number \| null` | Order: ascending `order`, `null` last, then `name.localeCompare(other, intlLocale)` and then `documentId` (REQ-02.4) |
| `recommended` | `recommended: boolean` | Only the first one in order with `true` is highlighted (REQ-02.5); pure function `markRecommended` |

Empty list after filtering → `empty` state (REQ-02.22). The summary checks that the persisted plan is in this list (REQ-03.14).

### C6 — Price factors

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

Mapping to `PriceFactorRule[]`, in array order (ADR-0005):

| DTO | Domain | Rule |
|---|---|---|
| `role`, `operand` | `role`, `operand` | Outside the catalog, or an incompatible combination → discarded |
| `min`, `max` | `number \| null` | Integer or `null`; `min > max` → discarded (REQ-02.12) |
| `multiplier` | `number` | `number` or numeric string; non-finite or ≤ 0 → discarded (REQ-02.12) |

`data.length === 0` (the country was unpublished between steps) → `error`. Empty or `null` `priceFactors` → `[]` (price = base price, REQ-02.9).

### C7 — Terms and conditions

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

Mapping to `TermsDocument` (ADR-0006). The shape of the `list` and `list-item` nodes in the example is confirmed against the real seed response before fixing the test fixture:

| DTO | Domain | Rule |
|---|---|---|
| `termsAndConditions` | `TermsBlock[]` | Closed tree (`paragraph`, `heading`, `list`, `text` with marks); unknown nodes degrade to text |
| `null`, `[]` or no text | `unavailable` | "terms not available" (REQ-03.18) |
| `data.length > 1` | `unavailable` | REQ-03.18 (several records) |
| `data.length === 0` | `error` | Country unpublished between steps |

## 3. Domain types (summary)

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
interface Step1Result { fields: readonly Step1FieldResult[]; isComplete: boolean; } // REQ-01.27, never persisted
```

The DTOs (`frontend/src/app/core/cms/strapi-dto.ts`) are declared as `unknown` at the boundary and narrowed in the mappers (`CLAUDE.md` §8: no `any`).

## 4. Gaps found (for the orchestrator)

| Gap | Proposal | Why architecture does not decide it |
|---|---|---|
| What is shown on `/` if `country-selection` is not published or is missing a required text | "error de carga" + "reintentar", without the list, applying the F-00.7 rule (there is no country generic message on `/`) | REQ-01.2 does not specify it; it is visible behavior |
| Incompatible role-operand combination in a factor | The band is discarded with a warning (like REQ-02.12) | It extends REQ-02.12 |

## 5. References

Consulted on 2026-11-22:

- REST API (v5 response format with `documentId`, endpoints): https://docs.strapi.io/cms/api/rest
- REST API parameters (`filters`, `status`, `populate`, `fields`, `sort`, `pagination`): https://docs.strapi.io/cms/api/rest/parameters
- `status` (default `published`): https://docs.strapi.io/cms/api/rest/status
- Populate and field selection (`populate[0]=component`, `fields[0]=…`; `find` required on the populated types): https://docs.strapi.io/cms/api/rest/populate-select
- Filters (operators, filtering by relation): https://docs.strapi.io/cms/api/rest/filters
- Sorting and pagination (`pagination[page]`, `pagination[pageSize]` with a default of 25 and the `api.rest.maxLimit` limit; `sort[0]=field:asc`): https://docs.strapi.io/cms/api/rest/sort-pagination
- Official Blocks renderer (block types): https://github.com/strapi/blocks-react-renderer

> Translated into English on 2026-11-23 (D16); no content change.
