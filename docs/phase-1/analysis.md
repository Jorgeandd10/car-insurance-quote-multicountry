# Fase 1 — Análisis y contextualización

> Origen: sesión en claude.ai (chat agéntico), 2026-11-22. Este documento es el entregable de la Fase 1.
> Estado: **aprobado en G0 (2026-11-22)**. D1–D11 registradas en [`docs/decision-log.md`](../decision-log.md).
> Nota posterior (misma fecha): el humano decidió continuar el proyecto en **Claude Code local**; esto modifica D1 (ver al final).
> Revisión local (misma fecha): entorno re-verificado en la máquina local y recomendación de **D5 cambiada** a Signal Forms antes del gate (ver secciones "Entorno verificado (local)" y 7).

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

## Entorno verificado (local, Windows 11) — 2026-11-22

| Elemento | Salida real | Resultado |
|---|---|---|
| Node | `v24.22.3` | Cumple Angular 22 (`^24.15.0`) y Strapi 5.63 (`>=22 <=26`) |
| npm | `11.19.1` | OK (no se actualiza a npm 12) |
| Git | `2.47.0.windows.1`, `core.autocrlf=true`, remote `origin` en GitHub | OK |
| Docker | `29.7.2`; `docker info`: Docker Desktop, linux/x86_64, 8 CPU, ~3,7 GiB RAM | Daemon activo |
| Docker Compose | `v5.5.0` | OK |
| Docker Hub | `registry-1.docker.io/v2/` → 401 (respuesta normal sin autenticación) | Accesible |
| Navegadores | Chrome `159.0.8154.13`, Edge `158.0.4370.33`; caché `ms-playwright` vacía | Playwright usará `channel: 'chrome'` salvo que se apruebe descargar Chromium |
| Puertos 80, 1337, 3000, 4200, 8080 | Libres | OK |
| Versiones npm | `@angular/core 22.3.0`, `@strapi/strapi 5.63.0`, `@playwright/test 1.65.1`, `vitest 5.1.1` | Coinciden con el análisis |

Fuentes oficiales verificadas: Signal Forms "Stable (v22+)" ([angular.dev](https://angular.dev/guide/forms/signals/comparison)); test runner por defecto Vitest con `jsdom` ([guía de testing](https://angular.dev/guide/testing), [`ng test`](https://angular.dev/cli/test)).

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

**Actualización tras la verificación local (2026-11-22):**

- Resueltos: verificación de Docker (daemon activo, Docker Hub accesible); madurez de Signal Forms (estable en v22); autenticidad de los logs (las transcripciones JSONL originales de Claude Code quedan en local).
- Siguen: formato de Strapi 5, sin caché agresiva, fechas date-only, formato COP/CLP y los riesgos metodológicos.
- Nuevos:
  - `core.autocrlf=true`: los `.sh` y entrypoints llegarían con CRLF a contenedores Linux → `.gitattributes` con `eol=lf`.
  - Módulos nativos (`better-sqlite3`): no montar `node_modules` desde Windows; instalar dentro de la imagen con base Debian (`node:24-*-slim`).
  - ~3,7 GiB de RAM en Docker: el build del admin de Strapi puede ir justo; se comprueba al ejecutarlo.
  - Playwright sin navegadores descargados: usar Chrome del sistema o pedir permiso para descargar Chromium.
  - Exportación de logs: copiar (sin editar) los JSONL de `~/.claude/projects/` a `logs/sessions/` al cierre de cada fase.

## 7. Decisiones de G0 (aprobadas el 2026-11-22)

Detalle, veredicto y motivo literal en [`docs/decision-log.md`](../decision-log.md).

| # | Decisión | Recomendación | Estado |
|---|---|---|---|
| D1 | Entorno de trabajo y repo | *(actualizada, ver nota)* | Aprobada |
| D2 | Versión de Angular | 22 | Aprobada |
| D3 | Estrategia multipaís | Colección `Country` + relaciones (no i18n); país en la URL `/co`, `/cl` | Aprobada |
| D4 | Acceso a Strapi | Rol público read-only + nginx GET-only; sin tokens ni BFF | Aprobada |
| D5 | Formularios | ~~Reactive Forms tipados, salvo que Signal Forms sea estable en v22~~ → **Signal Forms** (verificado estable en v22; ADR en Fase 3) | Aprobada (recomendación cambiada) |
| D6 | Persistencia | sessionStorage por país | Aprobada |
| D7 | Pasos del wizard | 3 + pantalla de confirmación | Aprobada |
| D8 | Regla de precio | Factores por país configurables en Strapi + función pura documentada | Aprobada |
| D9 | Pago simulado | Pasarela mock con resultado elegido (éxito/rechazo), sin campos de tarjeta | Aprobada |
| D10 | SDD | Variante propia ligera vía Skill (no Spec Kit) | Aprobada |
| D11 | Equipo de agentes y Skills | Los de la sección 3 | Aprobada |

### Nota posterior sobre D1

Decisión del humano (2026-11-22): el proyecto continúa en **Claude Code local** sobre un repositorio GitHub propio (inicialmente descrito como privado; **es público** por requisito del reclutador, ver "Cambio de D1" en `docs/decision-log.md`). Motivos: los subagentes de `.claude/agents/` se cargan de forma nativa, las transcripciones JSONL originales quedan en `~/.claude/projects/` (requisito de "logs sin editar"), Docker se puede verificar en la máquina y `git push` usa las credenciales del humano. Esta fase (claude.ai) se conserva como exportación en `logs/sessions/`.
