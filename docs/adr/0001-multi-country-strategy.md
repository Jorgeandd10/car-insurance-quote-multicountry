# ADR-0001 — Estrategia multipaís en Strapi y Angular

| Campo | Valor |
|---|---|
| Estado | Proposed |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisores | Humano (G3) |
| Motivado por | D3, D2, D7 · G2-1, G2-2, G2-3, G2-4, G2-6 · REQ-01.1, REQ-01.2, REQ-01.12, REQ-01.13, REQ-01.18, REQ-01.25, REQ-01.28, REQ-02.1, REQ-02.6, REQ-02.32, REQ-03.15, REQ-03.18, REQ-03.37, REQ-03.38 |

## Contexto y problema

El PDF exige que "the same application and the same build serve Colombia and Chile", que la estrategia multipaís quede documentada en un ADR y que el negocio cambie formulario, planes, precios y textos desde Strapi sin cambiar código. D3 (G0) ya fijó el enfoque: colección `Country` con relaciones, sin i18n de Strapi, y país en la URL. Este ADR documenta las alternativas y concreta lo que D3 deja abierto:

1. Cómo se modela en Strapi el contenido de cada país (formulario, planes, factores, términos y textos de interfaz).
2. Dónde vive el contenido que no pertenece a ningún país: la página `/` de selección de país (G2-3, REQ-01.2).
3. Cómo se representan los roles de campo (G2-1) y las secciones (G2-6).
4. Cómo resuelve Angular el país y cómo se forman las rutas del wizard (D7).

## Factores de decisión

- Un único build (PDF). Nada que dependa del país puede resolverse en tiempo de compilación.
- Configurable sin código: campos, opciones, validaciones, planes, factores, términos y textos (PDF; `CLAUDE.md` §11; G2-2).
- CO y CL usan el mismo idioma (español). Las diferencias son de mercado (moneda, documento, edad mínima, planes), no de idioma.
- Un país nuevo no debería exigir código (caso C de `country-content`).
- Las reglas del PDF se enlazan por rol y no por etiqueta ni orden (G2-1). El catálogo de roles y el de secciones son cerrados y viven en código (REQ-01.28, REQ-01.12).
- El modelo debe poder impedir que haya más de un texto de términos por país (Q-03.12).
- Seguridad D4: lecturas públicas mínimas y sin token.

## Opciones consideradas

**Eje A: modelado del país en Strapi**

1. **A1. Colección `Country` + relaciones (D3).** `Country` guarda los datos del mercado, los textos de interfaz, los factores de precio y los términos. `form-field` y `plan` son colecciones con una relación `manyToOne` hacia `Country`.
2. **A2. i18n de Strapi, con un locale por país** (`es-CO`, `es-CL`). Cada documento tiene una versión por locale y el país se deduce del parámetro `locale`.
3. **A3. Un build, un entorno o una instancia de Strapi por país.** `environment.co.ts` y `environment.cl.ts`, dos despliegues, o dos bases de contenido.

**Eje B: contenido global (página `/`)**

1. **B1. Single type `country-selection`** con los textos de la página.
2. **B2. Un pseudo-país "global"** en la colección `Country`.
3. **B3. Textos de `/` en código.**

**Eje C: textos de interfaz por país**

1. **C1. Componentes tipados dentro de `Country`**, uno por pantalla (`ui.wizard-texts`, `ui.form-step-texts`, `ui.plans-step-texts`, `ui.summary-step-texts`, `ui.confirmation-texts`).
2. **C2. Colección clave-valor `ui-text`** (`key`, `value`, relación a `Country`).

**Eje D: resolución del país en Angular**

1. **D1. Primer segmento de la ruta** (`/co/...`), como fija D3.
2. **D2. Subdominio** (`co.example.test`).
3. **D3. Parámetro de query o país guardado en el navegador.**

## Decisión

Opción elegida: **A1 + B1 + C1 + D1**.

**Strapi** (detalle en [`docs/architecture/content-model.md`](../architecture/content-model.md)):

- `country` (collection type, Draft & Publish): `code` (único, `^[a-z]{2}$`), `name`, `intlLocale` (BCP 47, p. ej. `es-CO`; `locale` es un nombre reservado en Strapi 5), `currency` (ISO 4217), `minimumAge` (G2-4), los cinco componentes de textos (C1), `priceFactors` (ADR-0005) y `termsAndConditions` (ADR-0006).
- `form-field` y `plan` (collection types, Draft & Publish) con relación `country` `manyToOne` (inversa `oneToMany` en `Country`). Cada campo y cada plan se publica por separado, como piden AC-01.3, AC-01.10, AC-01.11 y AC-02.5.
- Los términos son un atributo de `Country` y no una colección aparte. Como `code` es único, **no puede haber más de un texto de términos por país** (Q-03.12). La app sigue defendiéndose si llegaran dos países con el mismo código (REQ-03.18).
- **Roles (G2-1):** atributo `role` de `form-field`, de tipo `enumeration` con exactamente los tres valores del catálogo de código (`documentNumber`, `birthDate`, `vehicleYear`), opcional y con un valor por campo como máximo. Un rol nuevo exige código (caso B de `country-content`), así que el enum de Strapi y el de TypeScript cambian juntos.
- **Secciones (G2-6):** atributo `section` de tipo `enumeration` (`policyholder`, `vehicle`), obligatorio. El orden de las secciones es fijo en código; sus leyendas son textos del país (`ui.wizard-texts`), compartidos por el paso 1 y el resumen.
- **i18n desactivado** en todos los content types (`pluginOptions.i18n.localized` ausente o `false`).
- **Contenido global (B1):** single type `country-selection` (Draft & Publish) con `heading`, `intro` (opcional) y `countryListLabel`. La lista de países sale de los `Country` publicados.

**Angular:**

- Rutas (paths en inglés, `CLAUDE.md` §11):

  | Ruta | Pantalla | Paso (D7) |
  |---|---|---|
  | `/` | Selección de país | No es paso |
  | `/:country` | Redirige a `/:country/form` | — |
  | `/:country/form` | Datos del asegurado y del vehículo | 1 |
  | `/:country/plans` | Planes | 2 |
  | `/:country/summary` | Resumen y pago simulado | 3 |
  | `/:country/confirmation` | Confirmación | No es paso |
  | `/:country/**` | Redirige a `/:country/form` | — |

- Un **`CountryShell`** (componente de la ruta `/:country`) resuelve el país y muestra "cargando", "error de carga" con "reintentar", "país no disponible" con los países publicados como enlaces, o el paso. El shell contiene el indicador de pasos (REQ-01.31).
- **Mayúsculas:** un guard funcional de la ruta `/:country` devuelve un `RedirectCommand` hacia la misma URL con el segmento en minúsculas (`/CO/plans` → `/co/plans`). Solo se normaliza la caja. Un código que no está publicado no redirige: muestra "país no disponible" (REQ-01.2).
- **`CountryContext`**: una señal de solo lectura con el país activo (código, `intlLocale`, moneda, edad mínima y textos), que alimenta a los pasos. Ningún componente lee el país de otra fuente.
- **Formato por país:** `Intl.NumberFormat` e `Intl.DateTimeFormat` con `intlLocale` y `currency` del país. **No** se usa `LOCALE_ID` ni los pipes de Angular que dependen de datos de locale registrados al compilar, porque el locale se conoce en tiempo de ejecución.
- Ninguna detección por IP ni por idioma del navegador (G2-3).

## Consecuencias

- **Positivas:**
  - Un solo build y una sola instancia de Strapi. Añadir un país es contenido (entrada `Country`, campos, planes) y no código (caso C de `country-content`).
  - El país forma parte del estado navegable: se puede enlazar, recargar y separar el almacenamiento por país (REQ-01.25, REQ-03.37).
  - Las consultas filtran por relación (`filters[country][code][$eq]=co`), una operación documentada de la REST API.
  - Los textos son atributos tipados. Un texto que falta se detecta sin buscar claves libres, y el admin de Strapi muestra un formulario por pantalla.
  - Términos únicos por país por construcción.
- **Negativas:**
  - `Country` es un documento grande (datos del mercado, unas 45 cadenas de texto, factores y términos). Cambiar un texto, un factor o los términos exige volver a publicar el país entero, y un borrador a medias de `Country` bloquea publicar otros cambios del mismo país hasta completarlo o descartarlo.
  - Añadir un texto nuevo de interfaz exige cambiar el esquema de un componente y el código (es un caso B, no A).
  - Sin i18n, si un país necesitara dos idiomas habría que superseder este ADR (p. ej., activar i18n solo para los textos).
  - Strapi no impone que un `form-field` o un `plan` tenga país: uno sin relación simplemente no aparece en ningún país.
  - Los roles se duplican: enum en Strapi y tipo en TypeScript. Si divergen, el mapper ignora el rol desconocido con aviso (tabla 5.3 de US-01) y puede aplicar G2-5.
- **Riesgos y mitigación:**
  - *Relaciones con Draft & Publish:* un campo publicado que apunta a un país despublicado no aparece; es el comportamiento buscado. Se verifica con el seed (país, campos y planes publicados).
  - *Rendimiento de los filtros por relación:* la documentación de Strapi advierte que los filtros profundos pueden ser lentos. Con dos países y decenas de documentos no aplica; se revisa si el volumen crece.

### Confirmación

- E2E AC-01.1, AC-01.5, AC-01.6 (incluido `/CO` → `/co`), AC-01.22, AC-02.5 y AC-03.32 contra el seed.
- Unit del guard de minúsculas y del `CountryShell` (estados de carga, error y país no disponible).
- Review: `grep -rE "LOCALE_ID|registerLocaleData|environment\.(co|cl)" frontend/src` sin resultados; ningún content type con `i18n.localized: true` en `cms/src/api/**/schema.json`.

## Pros y contras de las opciones

### A1. Colección `Country` + relaciones (elegida, D3)

- A favor: modela el mercado como entidad propia (moneda, edad mínima, locale de formato); cada campo y cada plan tiene su propio ciclo de publicación; un país nuevo es contenido.
- En contra: hay que filtrar por relación en cada consulta; `Country` crece con los textos.

### A2. i18n de Strapi (un locale por país)

- A favor: soporte nativo en Strapi 5 (`?locale=es-CO`); el admin trae un selector de locale; los textos traducibles quedan "por país" sin relaciones.
- En contra: confunde idioma con mercado. CO y CL hablan el mismo idioma, y un futuro `en-CO` rompería la equivalencia locale = país. Los atributos no localizados se comparten entre locales, así que el tipo, el orden o las opciones de un campo se compartirían o habría que localizarlos todos. Los datos del mercado (moneda, edad mínima) siguen necesitando una entidad propia. Además, `locale` y `localizations` son nombres reservados y el plugin añade complejidad a las consultas y a las relaciones. D3 ya la descartó en G0.

### A3. Build, entorno o Strapi por país

- A favor: aislamiento total; cada país se despliega por separado; no hay que filtrar por país.
- En contra: **incumple el PDF** ("the same application and the same build"). Duplica la infraestructura y el seed, y un país nuevo exige un despliegue. Se documenta porque es una práctica real del sector, pero queda descartada por una restricción del PDF.

### B1. Single type `country-selection` (elegida)

- A favor: separa el contenido global del contenido por país; una sola entrada, sin ambigüedad; tiene Draft & Publish propio.
- En contra: un content type y un permiso público más (`find` del single type).

### B2. Pseudo-país "global"

- A favor: no añade content types.
- En contra: contamina la lista de países (habría que excluirlo de `/` y de "país no disponible"); obliga a rellenar campos de mercado sin sentido (moneda, edad).

### B3. Textos de `/` en código

- A favor: es lo más simple.
- En contra: **contradice G2-2**, porque solo cuatro textos pueden estar en código.

### C1. Componentes tipados por pantalla (elegida)

- A favor: tipado, campos obligatorios por pantalla, formulario legible en el admin, sin claves libres con erratas, una sola petición.
- En contra: un texto nuevo exige cambiar el esquema; `Country` crece.

### C2. Colección clave-valor `ui-text`

- A favor: añadir un texto no exige cambiar el esquema de Strapi.
- En contra: el código igualmente tiene que conocer la clave, así que un texto nuevo sigue exigiendo código. Las claves son texto libre (una errata equivale a un texto ausente). Strapi no puede impedir claves duplicadas por país. El admin muestra decenas de documentos sueltos y hace falta otra petición paginada.

### D1. País en el primer segmento de la ruta (elegida, D3)

- A favor: un único origen; funciona en `localhost` sin configuración; el e2e navega por URL; enlazable.
- En contra: el usuario puede escribir cualquier código, lo que obliga a gestionar los desconocidos y las mayúsculas (ya especificado en G2-3).

### D2. Subdominio

- A favor: URLs limpias; permite cookies y CSP por país.
- En contra: exige DNS o `hosts` en local y en el e2e, y nginx con `server_name` por país; contradice D3.

### D3. Query param o país guardado

- A favor: simple de implementar.
- En contra: el país guardado no se puede enlazar ni recargar de forma fiable; con dos pestañas el estado se mezcla; contradice D3.

## Referencias

Consultadas el 2026-11-22:

- Strapi 5, REST API (endpoints de collection y single types, formato con `documentId`): https://docs.strapi.io/cms/api/rest
- Strapi 5, filtros por relación (`filters[relation][field][$operator]`) y aviso de rendimiento: https://docs.strapi.io/cms/api/rest/filters
- Strapi 5, modelos (`kind`, relaciones `manyToOne`/`oneToMany`, `options.draftAndPublish`): https://docs.strapi.io/cms/backend-customization/models
- Strapi 5, nombres reservados (`locale`, `localizations`, `status`, `meta`, `document`...): https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/attributes-and-content-types-names-reserved
- Strapi 5, Draft & Publish: https://docs.strapi.io/cms/features/draft-and-publish
- Angular, guards (`CanActivateFn`, retorno `UrlTree` o `RedirectCommand`): https://angular.dev/guide/routing/route-guards
- Angular, zoneless por defecto desde v21: https://angular.dev/guide/zoneless
- Versiones del proyecto: Angular 22.3.0, Strapi 5.63.0 y Node 24.22.3, verificadas en local (`docs/phase-1/analysis.md`, "Entorno verificado (local)").
