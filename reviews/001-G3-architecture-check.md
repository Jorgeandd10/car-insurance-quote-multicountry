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

## Resolución (se completa tras G3)

| ID | Decisión humana | Estado | Commit / motivo |
|---|---|---|---|
| F-00.8 | | | |
| F-00.9 | | | |
| F-00.10 | | | |
| F-00.11 | | | |
