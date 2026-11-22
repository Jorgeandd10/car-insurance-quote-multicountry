# Fase 1 — Análisis y contextualización

> Origen: sesión en claude.ai (chat agéntico), 2026-11-22. Este documento es el entregable de la Fase 1.
> Estado: **pendiente de aprobación (G0)**. Ver sección 7.
> Nota posterior (misma fecha): el humano decidió continuar el proyecto en **Claude Code local**; esto modifica D1 (ver al final).

Fuente principal de requisitos: `docs/assessment/Technical assessment -Frontend.pdf`.
Contexto operativo: `docs/assessment/master-prompt.md`.
No se encontraron contradicciones entre ambos. Matices: el PDF exige el e2e para **al menos un país** y pide **justificar la herramienta** de IA elegida.

## Entorno verificado (sandbox cloud de claude.ai — debe re-verificarse en local)

| Elemento | Estado |
|---|---|
| Node 22.23 / npm 10.9 / Git 2.43 | OK |
| Angular CLI | Última estable 22.3.0 (cumple "21+"). `@angular/core@22` exige Node `^22.22.3 \|\| ^24.15.0 \|\| >=26` |
| Strapi | Última 5.63.0. Exige Node `>=22 <=26` |
| Docker | CLI presente, daemon no disponible y Docker Hub bloqueado en el sandbox |
| Playwright | CDN de navegadores bloqueado; Google Chrome del sistema disponible |

## 1. Interpretación ejecutiva

El 65 % de la nota evalúa el proceso agéntico; el 35 % la aplicación. La app es un wizard de cotización (CO/CL) con un único build Angular, donde Strapi gobierna formulario, planes y términos por país.

Hay que demostrar: agentes con responsabilidades separadas, puntos de control humanos reales, trazabilidad verificable (US → spec → ADR → código → tests → review) y evidencia auténtica.

Vacíos detectados en las historias (a formalizar en specs):

- Cómo se selecciona el país.
- Mayoría de edad: ¿18 en ambos? ¿configurable?
- Límite inclusivo del año del vehículo (¿exactamente 20 años se acepta?).
- Varios planes marcados como recomendados.
- Moneda del plan distinta a la del país.
- Regla de precio que depende de un campo que el negocio puede eliminar.
- Qué campo es el documento y cuántos dígitos se muestran al enmascarar.
- Cómo forzar un pago rechazado de forma determinista para el e2e.
- Datos persistidos vs. cambios de configuración o planes que dejan de estar activos.

## 2. Arquitectura propuesta

```
Navegador ──► nginx (Angular estático + proxy /api GET-only con allowlist) ──► Strapi 5 (SQLite + seed)
```

**Frontend (Angular 22):** standalone, zoneless, Signals, `@if`/`@for`. País en la ruta (`/co/...`, `/cl/...`) validado por guard. `CountryContext` (signal). `CmsApiClient` tipado con mappers DTO→dominio. `DynamicFormComponent` con registro de validadores tipados (`required`, `pattern`, `min`/`max`, `minAge`, `yearRange` relativo). `QuoteStore` con signals + sessionStorage por país. Funciones puras de precio, enmascarado y validación. Pasarela de pago simulada.

**Backend (Strapi 5):** `Country` (código, moneda, locale, edad mínima), `FormField` (key, label, type, required, helpText, errorMessage, order, section, masked, opciones y validaciones como componentes, relación a Country), `Plan` (coberturas/beneficios como componentes, order, recommended, active, Country), `Terms` (por país). Seed y permisos públicos como código en `bootstrap` (idempotente). Rol público solo `find`/`findOne`.

**Seguridad:** ningún token en el navegador; nginx solo deja pasar `GET` a la allowlist; credenciales de admin en `.env` (solo `.env.example` en el repo).

**Calidad:** Vitest (unit), Playwright (e2e), `docker compose up` como único comando.

## 3. Equipo de agentes propuesto

| Agente | Herramientas | Salida | Ajuste |
|---|---|---|---|
| Requirements Analyst | Read, Grep, Write (`specs/`) | Spec con IDs, Gherkin y lista de vacíos/preguntas | — |
| Software Architect | Read, Write (`docs/adr/`, `docs/architecture/`), WebSearch | ADRs MADR, modelo de contenido, contratos de API | Verifica versiones reales |
| Strapi Developer | Read, Edit, Write, Bash (`cms/`) | Content types, seed, permisos como código | — |
| Angular Developer | Read, Edit, Write, Bash (`frontend/`) | Componentes, store, validadores + unit tests | Dueño de los unit tests |
| QA Engineer | Read, Write (`e2e/`, `docs/qa/`), Bash | Plan de pruebas trazado a AC, e2e, informe con salida real | No toca código de producción |
| Code Reviewer | Read, Grep, Bash (solo lint/test), Write (`reviews/`) | Informe con hallazgos, severidad, archivo:línea | Absorbe la revisión de seguridad (checklist en Skill). No corrige código |

Skills propuestas: `sdd-traceability` (plantillas spec/ADR/review + convención de IDs `US-01 → REQ-01.3 → AC-01.2 → F-01`, commits `[US-01][REQ-01.3]`) y `country-content` (procedimiento para añadir campo/plan/validador/país de punta a punta).

## 4. Estructura del repositorio

```
├── README.md · FLOW.md · CLAUDE.md · docker-compose.yml · .env.example
├── .claude/agents/*.md
├── .claude/skills/{sdd-traceability,country-content}/SKILL.md
├── specs/US-01 … US-03/spec.md
├── docs/adr/ · docs/architecture/ · docs/qa/
├── docs/traceability.md · docs/decision-log.md
├── reviews/
├── logs/sessions/
├── frontend/ · cms/ · e2e/
```

## 5. Plan por fases

| Fase | Entregables | Gate humano |
|---|---|---|
| 1 Análisis | Este documento | G0 aprobar estrategia |
| 2 Flujo agéntico | CLAUDE.md, agentes, skills, FLOW.md borrador | G1 |
| 3 Specs y ADRs | 3 specs, ADR multipaís y otros, modelo de contenido | G2 specs, G3 ADRs |
| 4 Implementación | Strapi+seed → base Angular → US-01 → US-02 → US-03 | Demo por historia |
| 5 Validación | Tests ejecutados, review independiente, fixes, re-review | G4 triage hallazgos, G5 prueba manual teclado/móvil sin IA |
| 6 Entrega | README, FLOW, matriz, `docker compose up` verificado | G6 |

Rechazo en cualquier gate: vuelve al agente productor con el feedback registrado en `docs/decision-log.md`.

## 6. Riesgos

**Técnicos:** verificación de Docker; formato de respuesta de Strapi 5 (`documentId`, Draft & Publish) → mappers + tests de contrato; "reflejar al recargar" → sin caché agresiva; validaciones relativas a fecha/edad → cálculo date-only; formato COP/CLP sin decimales con `Intl`; madurez de Signal Forms en v22.

**Metodológicos:** autenticidad de los logs; hallazgos triviales o inventados → exigir archivo:línea y commit de cierre; deriva de alcance o pérdida de contexto → specs como fuente de verdad + CLAUDE.md; sobreingeniería vs. tiempo.

## 7. Decisiones pendientes de aprobación (G0)

| # | Decisión | Recomendación |
|---|---|---|
| D1 | Entorno de trabajo y repo | *(actualizada, ver nota)* |
| D2 | Versión de Angular | 22 |
| D3 | Estrategia multipaís | Colección `Country` + relaciones (no i18n); país en la URL `/co`, `/cl` |
| D4 | Acceso a Strapi | Rol público read-only + nginx GET-only; sin tokens ni BFF |
| D5 | Formularios | Reactive Forms tipados, salvo que Signal Forms sea estable en v22 (verificar, ADR) |
| D6 | Persistencia | sessionStorage por país |
| D7 | Pasos del wizard | 3 + pantalla de confirmación |
| D8 | Regla de precio | Factores por país configurables en Strapi + función pura documentada |
| D9 | Pago simulado | Pasarela mock con resultado elegido (éxito/rechazo), sin campos de tarjeta |
| D10 | SDD | Variante propia ligera vía Skill (no Spec Kit) |
| D11 | Equipo de agentes y Skills | Los de la sección 3 |

### Nota posterior sobre D1

Decisión del humano (2026-11-22): el proyecto continúa en **Claude Code local** sobre un repositorio GitHub privado propio. Motivos: los subagentes de `.claude/agents/` se cargan de forma nativa, las transcripciones JSONL originales quedan en `~/.claude/projects/` (requisito de "logs sin editar"), Docker se puede verificar en la máquina y `git push` usa las credenciales del humano. Esta fase (claude.ai) se conserva como exportación en `logs/sessions/`.
