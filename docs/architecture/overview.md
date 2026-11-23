# Visión general de la arquitectura

| Campo | Valor |
|---|---|
| Estado | Proposed (G3) |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| ADRs | [0001](../adr/0001-multi-country-strategy.md) multipaís · [0002](../adr/0002-dynamic-form-with-signal-forms.md) formulario · [0003](../adr/0003-strapi-access-and-security.md) acceso y seguridad · [0004](../adr/0004-wizard-state-persistence-and-navigation.md) estado y navegación · [0005](../adr/0005-configurable-price-rule.md) precio · [0006](../adr/0006-terms-rich-text-safe-rendering.md) términos · [0007](../adr/0007-test-strategy.md) pruebas |
| Documentos | [content-model.md](content-model.md) · [api-contracts.md](api-contracts.md) · [pricing-rule.md](pricing-rule.md) |

Stack: Angular 22.3 (standalone, signals, zoneless, Signal Forms) · Strapi 5.63 (SQLite) · nginx · Node 24.22.3 · Vitest (jsdom) · Playwright 1.65.1 (`channel: 'chrome'`) · Docker Compose v5. **No se añaden dependencias** a las que traen por defecto Angular CLI, Strapi y Playwright.

## 1. Componentes

```mermaid
flowchart LR
    subgraph Host["Host (Windows 11)"]
        B["Navegador<br/>Angular 22 SPA<br/>(sin tokens)"]
        PW["Playwright (proceso Node)<br/>sin credenciales<br/>page.route para simular cambios"]
        ADM["Admin de Strapi<br/>(equipo de negocio)"]
    end

    subgraph Docker["docker compose"]
        NG["nginx :80 → host :8080<br/>• SPA estático<br/>• /api: GET/HEAD, allowlist exacta<br/>• quita Authorization y Cookie<br/>• Cache-Control: no-store<br/>• rechaza status/publicationFilter"]
        ST["Strapi 5 :1337<br/>• rol público: solo find (4 tipos, G3-2)<br/>• routers only find + middleware published-only<br/>• seed + permisos en bootstrap"]
        DB[("SQLite<br/>(volumen)")]
    end

    B -- "GET /api/countries · /api/form-fields<br/>/api/plans · /api/country-selection" --> NG
    B -- "GET / (index.html, bundles)" --> NG
    NG -- "proxy (red interna)" --> ST
    ST --- DB
    ADM -- "127.0.0.1:1337/admin<br/>(sesión de admin)" --> ST
    PW -- "controla el navegador de pruebas<br/>e intercepta /api (page.route)" --> B
```

Flujo de datos en el navegador:

```mermaid
flowchart TD
    URL["/:country/..."] --> Shell["CountryShell<br/>(ADR-0001)"]
    Shell --> CCS["CountryConfigStore<br/>C3 + C4, una vez por carga"]
    CCS --> Map["Mappers DTO → dominio<br/>(api-contracts)"]
    Map --> Form["Paso 1: DynamicForm<br/>Signal Forms (ADR-0002)"]
    Form --> WS["WizardStorage<br/>sessionStorage ciq.v1.{cc}.*<br/>(ADR-0004)"]
    WS --> Eval["evaluateStep1 → Step1Result<br/>isComplete calculado"]
    Eval --> Guards["Guards de paso 2 y 3"]
    Eval --> P2["Paso 2: planes C5 + factores C6<br/>computeFinalPrice (ADR-0005)"]
    P2 --> WS
    Eval --> P3["Paso 3: resumen + términos C7<br/>(ADR-0006) + pago simulado"]
    P3 --> Conf["Confirmación<br/>ciq.v1.{cc}.confirmation"]
```

## 2. Estructura de carpetas

Nombres de archivo según el estilo de Angular 22 (`ng generate`: kebab-case, sin sufijo `.component`). Organización por funcionalidad, sin carpetas por tipo de código (guía de estilo de angular.dev). Cada archivo `*.ts` con lógica lleva su `*.spec.ts` al lado.

### `frontend/` (Angular Developer)

```
frontend/
├── angular.json · package.json · tsconfig*.json
├── proxy.conf.json                  # ng serve: /api → http://localhost:8080 (nginx)
└── src/
    ├── index.html · main.ts · styles.css
    └── app/
        ├── app.ts · app.html · app.config.ts · app.routes.ts   # indicador global "cargando" de navegación
        ├── core/
        │   ├── cms/                 # cms-client.ts (GET, timeout, paginación), strapi-dto.ts,
        │   │                        # country-mapper.ts, form-field-mapper.ts, plan-mapper.ts,
        │   │                        # price-factor-mapper.ts, terms-mapper.ts
        │   ├── country/             # country-context.ts, country-config-store.ts, country-case-guard.ts
        │   ├── storage/             # wizard-storage.ts (WIZARD_STORAGE, claves ciq.v1.{cc}.*)
        │   ├── clock/               # clock.ts (CLOCK, todayLocal)
        │   └── ui-state/            # fixed-texts.ts (los 4 textos de G2-2), view-state.ts
        ├── domain/                  # funciones puras compartidas
        │   ├── dates/               # age-in-years.ts, legal-age.ts, vehicle-year.ts
        │   ├── pricing/             # compute-final-price.ts, format-price.ts
        │   ├── masking/             # mask-document.ts (REQ-03.7)
        │   └── quote-number/        # create-quote-number.ts (REQ-03.26)
        ├── shared/                  # status-message.ts (role=status/alert), step-heading.ts
        └── features/
            ├── country-selection/   # country-selection-page.ts, country-not-available.ts
            ├── wizard-shell/        # country-shell.ts, step-indicator.ts
            ├── form-step/           # form-step-page.ts, dynamic-form.ts, step1-schema.ts,
            │   └── validation/      # validator-registry.ts, text-rules.ts, number-rules.ts,
            │                        # reconcile-step1.ts, evaluate-step1.ts, step1-complete-guard.ts
            ├── plans-step/          # plans-step-page.ts, sort-plans.ts, plan-selection.ts
            ├── summary-step/        # summary-step-page.ts, summary-values.ts, plan-selected-guard.ts
            │   ├── terms/           # terms-blocks.ts (render sin innerHTML)
            │   └── payment/         # mock-payment-gateway.ts (PAYMENT_DELAY_MS)
            └── confirmation/        # confirmation-page.ts, confirmation-guard.ts
```

### `cms/` (Strapi Developer)

```
cms/
├── Dockerfile                       # node:24-*-slim; node_modules dentro de la imagen
├── package.json · tsconfig.json
├── config/
│   ├── api.ts                       # rest.defaultLimit 25, rest.maxLimit 100
│   ├── database.ts                  # SQLite en volumen
│   ├── middlewares.ts · server.ts · admin.ts · plugins.ts
└── src/
    ├── index.ts                     # bootstrap: permisos públicos + seed (idempotentes)
    ├── middlewares/
    │   └── published-only.ts        # fuerza status=published (ADR-0003)
    ├── api/
    │   ├── country/                 # content-types/country/schema.json, routes/country.ts,
    │   │                            # controllers/, services/
    │   ├── form-field/              # ídem
    │   ├── plan/                    # ídem
    │   └── country-selection/       # ídem (single type)
    ├── components/
    │   ├── form/                    # select-option.json, validation-rule.json
    │   ├── plan/                    # plan-item.json
    │   ├── pricing/                 # price-factor.json
    │   └── ui/                      # wizard-texts.json, form-step-texts.json, plans-step-texts.json,
    │                                # summary-step-texts.json, confirmation-texts.json
    └── seed/
        ├── seed.ts · permissions.ts
        └── data/                    # co.ts, cl.ts, country-selection.ts
```

### Otras carpetas

```
infra/nginx/                         # Strapi Developer (G1-d): default.conf, Dockerfile (build de Angular + nginx)
e2e/                                 # QA Engineer: playwright.config.ts, fixtures/ (network-guard.ts, cms-route.ts:
                                     # helpers de page.route + route.fetch), tests/ (flow, states, content-changes
                                     # por intercepción, a11y-responsive). Sin credenciales (G3-3)
docker-compose.yml · .env.example    # Strapi Developer (G1-d)
```

`infra/` no aparece en la estructura de `CLAUDE.md` §5. Es la ubicación propuesta para nginx, porque G1-d asigna nginx al Strapi Developer y `frontend/` pertenece al Angular Developer. Si el humano prefiere otra ruta (p. ej. `cms/nginx/`), solo cambia esta sección.

## 3. Cobertura de REQ con impacto técnico

| REQ | Dónde se decide |
|---|---|
| REQ-01.1, REQ-01.2, REQ-01.25 | ADR-0001; api-contracts C1–C3 |
| REQ-01.3, REQ-01.4, REQ-01.5, REQ-01.32 | ADR-0004 (estados); api-contracts §1 |
| REQ-01.6 | ADR-0003 (caché, `published-only`); ADR-0004 (nada persistido) |
| REQ-01.7, REQ-01.8 | api-contracts C4 (mapper y orden) |
| REQ-01.9 a REQ-01.12 | content-model §2.2 y §3.1; ADR-0002 |
| REQ-01.13 | content-model §3.5; ADR-0001 (C1) |
| REQ-01.14 a REQ-01.17, REQ-01.22, REQ-01.29, REQ-01.30 | ADR-0002 |
| REQ-01.18, REQ-01.31 | ADR-0001 (rutas); ADR-0004 (foco y navegación) |
| REQ-01.19 a REQ-01.21 | ADR-0002 (reglas por rol); ADR-0007 (determinismo) |
| REQ-01.23, REQ-01.24, REQ-01.26, REQ-01.27 | ADR-0004 |
| REQ-01.28 | ADR-0001 (roles); content-model §2.2 |
| REQ-01.34 | content-model §6 |
| REQ-01.35 | ADR-0003 |
| REQ-02.1, REQ-02.2, REQ-02.4, REQ-02.5, REQ-02.7, REQ-02.24, REQ-02.25 | api-contracts C5 |
| REQ-02.3 | content-model §2.3 |
| REQ-02.6, REQ-02.8 a REQ-02.13 | ADR-0005; pricing-rule.md |
| REQ-02.16 a REQ-02.22, REQ-02.30 | ADR-0004 |
| REQ-02.23, REQ-02.31 | ADR-0003; ADR-0004 |
| REQ-02.32, REQ-02.33 | content-model §3.5 y §6 |
| REQ-03.1 a REQ-03.3 | ADR-0004 (`Step1Result`); content-model §3.5 |
| REQ-03.4, REQ-03.5 | ADR-0005 |
| REQ-03.9 a REQ-03.14, REQ-03.19, REQ-03.21 a REQ-03.32, REQ-03.37 | ADR-0004 |
| REQ-03.15 a REQ-03.18 | ADR-0006; content-model §2.1; api-contracts C7 |
| REQ-03.20 | ADR-0003; ADR-0004 |
| REQ-03.38 | content-model §3.5 (texto por sección) |

**Sin decisión de arquitectura** (implementación directa de la spec y de `CLAUDE.md` §8, sin alternativas que decidir): REQ-01.33, REQ-02.14, REQ-02.15, REQ-02.26 a REQ-02.29, REQ-03.6 a REQ-03.8 (función pura ya especificada en REQ-03.7; solo se fija su ubicación, `domain/masking/`), REQ-03.33 a REQ-03.36.

## 4. Skill `country-content`: partes desbloqueadas

| Paso de la Skill | Antes ("pendiente G3") | Ahora |
|---|---|---|
| Caso A.3 (seed) | Ruta del seed | `cms/src/seed/data/{co,cl}.ts`, idempotente, no sobrescribe cambios del admin |
| Caso B.2 (Strapi) | Enum o componente | Tipo de campo: enum `form-field.type`. Validación: enum `form.validation-rule.kind`. Rol: enum `form-field.role` (y `pricing.price-factor.role` si lo usa el precio). Operando: enum `pricing.price-factor.operand`. Texto de interfaz: atributo en `ui.*` |
| Caso B.3 (Angular) | DTO → mapper → dominio → registro | `core/cms/strapi-dto.ts` → `core/cms/form-field-mapper.ts` (tablas de api-contracts C4) → tipos de api-contracts §3 → `features/form-step/validation/validator-registry.ts` (función pura + test `AC-…`) |
| Caso C.2 (país nuevo) | Entrada `Country` y contenido | `country` con `code`, `name`, `intlLocale`, `currency`, `minimumAge`, los 5 componentes `ui.*`, `priceFactors`, `termsAndConditions`, más `form-field` y `plan` relacionados, todo publicado |
| Comprobaciones comunes | Sin nombres | `Intl` con `country.intlLocale` y `country.currency`; claves `ciq.v1.{cc}.*`; reconciliación en `reconcile-step1.ts` |

Sigue pendiente (no es de G3): actualizar el texto de la Skill con estos nombres una vez aceptados los ADRs. Lo hace el orquestador, porque `.claude/skills/` está fuera de las rutas del arquitecto.

## 5. Referencias

Consultadas el 2026-11-22:

- Guía de estilo de Angular (kebab-case, organización por funcionalidad): https://angular.dev/style-guide
- El resto de referencias están en cada ADR y en content-model y api-contracts.
