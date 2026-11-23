---
name: country-content
description: End-to-end procedure to add or change country-specific content in this project (a form field, a select option, a validation rule, a field role, a plan, a price factor, UI texts, terms, or a whole new country) across Strapi content types, seed data, Angular mappers/validators and tests. Use when touching cms/ content types or seed, the Angular dynamic form, validator registry or pricing, or when the business asks for a new field, plan or country.
---

# country-content

> **Estado: completa tras G3 (2026-11-22).** Los nombres vienen de `docs/architecture/overview.md` §4, `content-model.md` y `api-contracts.md`. Si algo de esta Skill choca con esos documentos o con un ADR aceptado, mandan ellos: avisa al orquestador.

Decisiones de base: D3 y ADR-0001 (colección `Country` + relaciones, sin i18n; país en la URL), G2-1 (roles de campo), G2-2 (solo 4 textos fijos en código), G2-7 (catálogo de validaciones), G2-8 y ADR-0005 (precio), G3-2 (rol público solo `find`).

## Principio

El negocio cambia contenido desde Strapi **sin despliegue**. Desarrollo solo interviene cuando aparece un **tipo nuevo** (tipo de campo, tipo de validación, rol, operando de precio) o un país nuevo con algo que el modelo no cubra.

## Caso A — Cambio solo de contenido (sin código)

Ejemplos: añadir un campo de un tipo existente, reordenar, cambiar textos o mensajes, asignar un rol existente, añadir una opción a un `select`, crear o desactivar un plan, cambiar una banda o multiplicador de precio, editar términos.

1. Hacerlo en el admin de Strapi y **publicar** (Draft & Publish). El borrador no llega a la app: el middleware `published-only` lo impide (ADR-0003).
2. Recargar la app en `/co` o `/cl` y comprobar el cambio. No hay caché: nginx responde con `Cache-Control: no-store` (ADR-0003).
3. Si el cambio debe formar parte del entorno reproducible, reflejarlo en el seed `cms/src/seed/data/{co,cl}.ts` (o `country-selection.ts` para la página `/`). El seed es idempotente y no sobrescribe cambios hechos en el admin.

Comprobación: ningún archivo de `frontend/` cambia. Si un e2e cubre el caso, se prueba por intercepción con `page.route` (G3-3); el cambio real en Strapi se comprueba a mano en G5 (`docs/qa/manual-check.md`).

## Caso B — Nuevo tipo de validación, de campo, rol u operando (requiere código)

Orden obligatorio (spec primero):

1. **Spec y ADR:** `REQ` nuevo en la spec afectada. Si cambia el contrato, ADR nuevo que haga `Supersedes` del afectado; un ADR aceptado no se edita.
2. **Strapi** (`cms/src/`):
   - Tipo de campo: enum `form-field.type`.
   - Tipo de validación: enum `form.validation-rule.kind` (componente `components/form/validation-rule.json`).
   - Rol: enum `form-field.role` (y `pricing.price-factor.role` si lo usa el precio).
   - Operando de precio: enum `pricing.price-factor.operand`.
   - Texto de interfaz nuevo: atributo obligatorio en el componente `ui.*` de la pantalla (G3-5).
3. **Angular** (`frontend/src/app/`): `core/cms/strapi-dto.ts` → `core/cms/form-field-mapper.ts` (tablas de `api-contracts.md` C4) → tipos de dominio (`api-contracts.md` §3) → `features/form-step/validation/validator-registry.ts`. El validador es una **función pura** con unit test nombrado por `REQ`/`AC`. Un operando nuevo va en `domain/pricing/compute-final-price.ts`.
4. **Seed:** un ejemplo por país en `cms/src/seed/data/{co,cl}.ts`.
5. **Tests:** unit del validador o del operando y del mapper; e2e por intercepción si afecta al flujo.
6. **Trazabilidad:** fila en `docs/traceability.md` y commit con los IDs.

## Caso C — Nuevo país

1. Decisión humana (`Dn`) y ADR si cambia algo del modelo.
2. **Strapi:** documento `country` publicado con `code`, `name`, `intlLocale` (no `locale`: es un nombre reservado en Strapi 5), `currency`, `minimumAge`, los 5 componentes `ui.*`, `priceFactors` y `termsAndConditions`, más sus `form-field` (con los roles `documentNumber`, `birthDate` y `vehicleYear` asignados, G2-5) y `plan` relacionados, todo publicado. Añadirlo al seed.
3. **Angular:** comprobar que la ruta `/:country/...`, `Intl` con `country.intlLocale` y `country.currency`, y las claves `ciq.v1.{cc}.*` funcionan sin código nuevo. Si hace falta código, es un defecto de diseño: registrarlo como hallazgo.
4. **Seed y e2e de humo** para el nuevo país.

## Comprobaciones comunes

- Ningún token llega al navegador. El rol público solo tiene `find` en los tipos que lee Angular (G3-2); el permiso nuevo se añade en `cms/src/seed/permissions.ts` con su motivo.
- Precio formateado con `Intl.NumberFormat(country.intlLocale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })`. COP usa U+00A0 tras `$` (AC-02.8).
- Los textos visibles vienen de Strapi. Las únicas excepciones son "cargando", "error de carga", "reintentar" y "país no disponible" (`core/ui-state/fixed-texts.ts`, G2-2).
- Los datos guardados en `sessionStorage` (`ciq.v1.{cc}.*`) siguen siendo válidos tras el cambio, o se descartan de forma controlada en `reconcile-step1.ts`.
