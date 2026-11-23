# Review 001 — ADRs y arquitectura (pre-G3)

| Campo | Valor |
|---|---|
| Revisor | Orquestador (sesión principal de Claude Code, Claude Opus 5.5) |
| Fecha | 2026-11-22 |
| Alcance | `docs/adr/0001`–`0007`, `docs/architecture/{overview,content-model,api-contracts,pricing-rule}.md`, escritos por `software-architect` |
| Specs / decisiones de referencia | `specs/US-0X/spec.md` (Approved), `docs/decision-log.md` (D1–D11, G1, G2) |
| Veredicto | Aprobado con cambios (decisiones para G3) |

## Comprobaciones ejecutadas

- Estructura de los 7 ADRs (encabezados extraídos con `Select-String`): todos `Proposed`, con 3–4 alternativas con pros y contras por decisión, consecuencias negativas y entre 3 y 23 URLs oficiales.
- Búsqueda de tokens o contraseñas en `docs/adr/` y `docs/architecture/`: 0 coincidencias.
- Verificación independiente de dos afirmaciones críticas (subagente `web-fetch`, 2026-11-22):
  - https://docs.strapi.io/cms/api/rest/status — `status=draft` devuelve la versión borrador y el valor por defecto es `published`. La página **no** dice qué permiso exige `status=draft`; la afirmación del ADR-0003 de que basta `find` se apoya en el portal de feedback de Strapi. El middleware `published-only` se mantiene como defensa en profundidad y su `curl` de confirmación queda como prueba obligatoria al implementar.
  - https://angular.dev/guide/forms/signals/dynamic-forms-with-json — la guía existe (angular.dev v22.3.0), construye formularios desde `FieldConfig[]` en tiempo de ejecución con `form()`, `required()`, `min()`, `max()`, `applyWhen()`, `applyEach()` y `[formField]`, sin marcas de experimental o developer preview.

## Hallazgos

| ID | Severidad | Ubicación | Descripción | Propuesta |
|---|---|---|---|---|
| F-00.8 | Minor | `docs/architecture/content-model.md:207` · ADR-0003 | El rol público queda solo con `find`, sin `findOne`. Es más restrictivo que el texto de D4 ("`find`/`findOne`"). Coherente con los contratos de API, pero cambia la redacción de una decisión aprobada. | Presentarlo en G3 como precisión de D4. |
| F-00.9 | Major | ADR-0003 §5, ADR-0007 | Los e2e que cambian contenido real necesitan un token de escritura creado **a mano** en el admin. Va contra el "un solo comando" del PDF para esa parte de las pruebas y deja sin ejecutar AC-01.3, AC-01.10, AC-01.11, AC-01.31 y AC-02.25 si falta el token. El token nunca llega al navegador, así que cumple el requisito de seguridad. | Decisión de G3 (opciones 3a/3b/3c del ADR-0003). |
| F-00.10 | Minor | ADR-0003 · `CLAUDE.md` §5 | nginx en `infra/nginx/`, carpeta que no figura en la estructura de `CLAUDE.md` §5. | Actualizar `CLAUDE.md` §5 tras G3. |
| F-00.11 | Minor | `.claude/skills/country-content/SKILL.md` | La Skill sigue en esqueleto; el arquitecto deja los nombres concretos en `overview.md` §4. | Completar la Skill tras G3 (orquestador). |

## Resolución

Decisiones humanas de G3 en [`docs/decision-log.md`](../docs/decision-log.md) (motivo literal: "Apruebo G3 con G3-3 en intercepción").

| ID | Decisión humana | Estado | Commit / motivo |
|---|---|---|---|
| F-00.8 | G3-2: solo `find` | Fixed | `content-model.md` §4 y ADR-0003 §1 dicen "solo `find`" como precisión de D4; el arquitecto añadió routers con `only: ['find']` (coherente con G3-2) |
| F-00.9 | G3-3: opción 3c (intercepción) + comprobación manual en G5 | Fixed | ADR-0003 §5 y ADR-0007 reescritos sin token de escritura; specs US-01 y US-02 v0.3 (`5a28ea2`, `e5ad6b6`) |
| F-00.10 | — (consecuencia de G1-d) | Fixed | `CLAUDE.md` §5 incluye `infra/nginx/` y `scripts/` (`2dc7d25`) |
| F-00.11 | — | Fixed | Skill `country-content` completada con los nombres de G3 (`61e8466`) |

## Re-review (2026-11-22)

- Búsqueda de `E2E_STRAPI|cms-admin|Bearer` en `docs/adr/` y `docs/architecture/`: 1 coincidencia, `0003:174`. Es el propio comando `grep` de la confirmación, que comprueba la ausencia de cabeceras de autorización: correcta.
- Cambios añadidos por el arquitecto sin pedírselos, aceptados por el orquestador por encajar en decisiones aprobadas: routers `only: ['find']` (G3-2) y AC-01.11 verificado contra un campo en borrador del seed, sin intercepción, lo que además prueba el middleware `published-only`.
- ADR-0001 a ADR-0007 pasan a `Accepted (2026-11-22, G3)`. Las cabeceras de las specs enlazan los ADRs aceptados.

Veredicto final: **Aprobado**.
