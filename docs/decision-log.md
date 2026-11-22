# Decision log

Registro de las decisiones humanas tomadas en cada gate. Cada entrada guarda la propuesta, el veredicto y el motivo **literal** del humano.

- Estados: `Aprobada` · `Rechazada` · `Modificada` · `Reemplazada`.
- Una decisión aprobada no se cambia sin una nueva entrada que la referencie y explique el cambio.
- Los rechazos en cualquier gate se registran aquí con el feedback para el agente productor.

## G0 — Estrategia (Fase 1)

- Fecha: 2026-11-22
- Aprobador: Jorge (humano)
- Fuente de las propuestas: [`docs/phase-1/analysis.md`](phase-1/analysis.md), sección 7, y la revisión hecha en la sesión local de Claude Code (verificación del entorno y de fuentes oficiales).

| # | Decisión | Resolución aprobada | Estado | Motivo literal del humano |
|---|---|---|---|---|
| D1 | Entorno de trabajo y repo | Claude Code local sobre el repositorio GitHub privado propio | Aprobada (decidida por el humano) | "D1 ya está decidida por mí: trabajamos en Claude Code local sobre este repositorio GitHub privado." |
| D2 | Versión de Angular | Angular 22 (22.3.0 al 2026-11-22) | Aprobada | "Apruebo todas" |
| D3 | Estrategia multipaís | Colección `Country` + relaciones (sin i18n de Strapi); país en la URL (`/co`, `/cl`) | Aprobada | "Apruebo todas" |
| D4 | Acceso a Strapi | Rol público solo `find`/`findOne` + proxy nginx GET-only con allowlist; sin tokens en el navegador ni BFF | Aprobada | "Apruebo todas" |
| D5 | Formularios | **Signal Forms** (estable en v22). Se documenta en un ADR | Aprobada (recomendación modificada antes del gate, ver nota) | "Apruebo todas" |
| D6 | Persistencia | `sessionStorage` por país | Aprobada | "Apruebo todas" |
| D7 | Pasos del wizard | 3 pasos + pantalla de confirmación | Aprobada | "Apruebo todas" |
| D8 | Regla de precio | Factores por país configurables en Strapi + función pura documentada | Aprobada | "Apruebo todas" |
| D9 | Pago simulado | Pasarela mock con resultado elegido (éxito/rechazo), sin campos de tarjeta | Aprobada | "Apruebo todas" |
| D10 | SDD | Variante propia y ligera mediante una Skill (no Spec Kit) | Aprobada | "Apruebo todas" |
| D11 | Agentes y Skills | 6 agentes (Requirements Analyst, Software Architect, Strapi Developer, Angular Developer, QA Engineer, Code Reviewer con checklist de seguridad) + Skills `sdd-traceability` y `country-content` | Aprobada | "Apruebo todas" |

El humano aprobó D2–D11 en bloque, sin motivo específico por decisión.

### Nota sobre D5 (cambio de recomendación antes del gate)

- Recomendación original (Fase 1, claude.ai): Reactive Forms tipados, salvo que Signal Forms fuera estable en v22.
- Verificación (sesión local, 2026-11-22): la tabla comparativa oficial de angular.dev marca Signal Forms como "Stable (v22+)" (https://angular.dev/guide/forms/signals/comparison).
- Cambio: el orquestador recomendó Signal Forms, señalando el cambio de forma explícita. El humano lo aprobó.
- Pendiente: el ADR de formularios (Fase 3) debe recoger alternativas y consecuencias.

## G1 — Flujo agéntico (Fase 2)

- Fecha: 2026-11-22
- Aprobador: Jorge (humano)
- Presentado: `CLAUDE.md`, `.claude/agents/` (6), `.claude/skills/` (`sdd-traceability`, `country-content` en esqueleto), `FLOW.md` (borrador), `docs/traceability.md`, `.gitattributes`.

| # | Decisión | Resolución aprobada | Estado | Motivo literal del humano |
|---|---|---|---|---|
| G1-a | Proteger `logs/` | Hook `PreToolUse` (PowerShell) que bloquea `Write` y `Edit` dentro de `logs/` | Aprobada | "Apruebo G1" |
| G1-b | Modelo de cada agente | `model: inherit` en los 6 subagentes (Opus 5.5) | Aprobada | "Apruebo G1" |
| G1-c | Ramas | Una rama y un PR por fase hacia `main`; cada push se pide antes al humano | Aprobada | "Apruebo G1" |
| G1-d | Alcance de `strapi-developer` (aclara D11) | Además de `cms/`, es dueño de `docker-compose.yml`, nginx y `.env.example` | Aprobada | "Apruebo G1" |
| G1-e | Copia de logs | Al cerrar cada sesión, copiar el JSONL original tal cual a `logs/sessions/` (solo se añaden archivos) | Aprobada | "Apruebo G1" |

El humano aprobó G1 en bloque, sin motivo específico por decisión.

### G1-f — Datos personales en las transcripciones (2026-11-22)

- **Contexto:** al preparar la copia de G1-e, la revisión de la transcripción encontró el email real del humano (lo añade Claude Code como contexto de la sesión). No hay tokens ni credenciales. El PDF exige a la vez "logs sin editar" y "sin datos personales reales en el repositorio".
- **Opciones presentadas:** (1) redactar solo el email en una copia hecha fuera de `logs/` y documentar la sustitución con SHA-256 del original y de la copia; (2) copiar sin cambios.
- **Resolución:** opción 1. Única transformación permitida: sustituir las cadenas listadas en un archivo de redacción que vive **fuera** del repositorio. Ningún archivo de `logs/` se modifica después de colocarlo. El manifiesto con hashes va en `docs/logs-manifest.md`.
- **Estado:** Aprobada.
- **Motivo literal del humano:** "Redactar solo email"

### Verificaciones que respaldan las decisiones

- Test runner por defecto de Angular: Vitest con `jsdom` (https://angular.dev/guide/testing, https://angular.dev/cli/test). Coincide con la propuesta de calidad del análisis.
- Entorno local: ver [`docs/phase-1/analysis.md`](phase-1/analysis.md), sección "Entorno verificado (local)".
