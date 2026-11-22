---
name: country-content
description: End-to-end procedure to add or change country-specific content in this project (a form field, a select option, a validation rule, a plan, terms text, or a whole new country) across Strapi content types, seed data, Angular mappers/validators and tests. Use when touching cms/ content types or seed, the Angular dynamic form or validator registry, or when the business asks for a new field, plan or country.
---

# country-content

> **Estado: ESQUELETO (Fase 2).** Los pasos concretos (nombres de content types, rutas de archivos, nombres de validadores) se completan **después de G3**, cuando el modelo de contenido y los ADRs estén aprobados. Hasta entonces, esta Skill solo fija el orden y las comprobaciones; no inventes nombres que no existan en `docs/architecture/`.

Decisión de base: D3 (colección `Country` + relaciones, sin i18n; país en la URL). Fuente del modelo: `docs/architecture/content-model.md` (Fase 3).

## Principio

El negocio cambia contenido desde Strapi **sin despliegue**. Desarrollo solo interviene cuando aparece un **tipo nuevo** (un tipo de campo, un tipo de validación o un país nuevo). Esta Skill distingue ambos casos.

## Caso A — Cambio solo de contenido (sin código)

Ejemplos: añadir un campo de tipo existente, reordenar, cambiar textos, añadir una opción a un select, crear o desactivar un plan, editar términos.

1. Hacerlo en el admin de Strapi y **publicar** (Draft & Publish).
2. Recargar la app en `/co` o `/cl` y comprobar el cambio.
3. Si el cambio debe formar parte del entorno reproducible, reflejarlo en el seed (`cms/`, ruta exacta: *pendiente G3*) para que `docker compose up` lo reproduzca.

Comprobación: ningún archivo de `frontend/` cambia.

## Caso B — Nuevo tipo de validación o de campo (requiere código)

Orden obligatorio (spec primero):

1. Requisito en la spec afectada (`REQ`) y, si cambia el contrato, ADR.
2. Strapi: añadir el valor al enum o componente correspondiente (*pendiente G3*).
3. Angular: DTO → mapper → dominio → registro de validadores (*pendiente G3*). El validador es una función pura con unit test nombrado por `REQ`/`AC`.
4. Seed: un ejemplo por país que lo use.
5. Tests: unit del validador y del mapper; e2e si afecta al flujo.
6. Matriz de trazabilidad actualizada.

## Caso C — Nuevo país

1. Decisión humana (`Dn`) y ADR si cambia algo del modelo.
2. Strapi: entrada `Country` (código, moneda, locale, edad mínima) y su contenido relacionado (*pendiente G3*).
3. Angular: comprobar que la ruta y el formato de moneda funcionan sin código nuevo. Si hace falta código, es un defecto de diseño: registrarlo.
4. Seed y e2e de humo para el nuevo país.

## Comprobaciones comunes

- Ningún token llega al navegador; el rol público solo lee (D4).
- Precio formateado con `Intl.NumberFormat` según la moneda del país (COP y CLP sin decimales).
- Los textos visibles vienen de Strapi, no de constantes en Angular.
- El dato persistido en `sessionStorage` sigue siendo válido tras el cambio (o se descarta de forma controlada).
