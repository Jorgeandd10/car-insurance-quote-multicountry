# CLAUDE.md — Contexto global del proyecto

Lo leen el orquestador y **todos** los subagentes. Si una instrucción de un agente o de una Skill contradice este archivo, gana este archivo; si este archivo contradice el PDF de la prueba, gana el PDF.

## 1. Qué construimos

Wizard de cotización de seguro de auto para **Colombia (CO)** y **Chile (CL)**: un único build de Angular que consume de Strapi el formulario, los planes y los términos de cada país. Tres historias: US-01 formulario, US-02 planes, US-03 resumen y pago simulado.

## 2. Fuentes de verdad (orden de precedencia)

1. `docs/assessment/Technical assessment -Frontend.pdf`: requisitos. No se inventan requisitos ni se contradicen.
2. `specs/US-XX/spec.md` aprobadas (gate G2): fuente de verdad de cada historia. El código se deriva de la spec.
3. `docs/adr/` aceptados (gate G3).
4. Este archivo y `docs/decision-log.md` (decisiones humanas D1–Dn).
5. `docs/assessment/master-prompt.md`: contexto operativo.

Si encuentras un hueco o una contradicción: **no supongas**. Regístralo como pregunta abierta en la spec o en tu salida y detente.

## 3. Decisiones vigentes (G0, ver `docs/decision-log.md`)

| # | Decisión |
|---|---|
| D2 | Angular 22: standalone, signals, `@if`/`@for`, sin NgModules, zoneless |
| D3 | Multipaís: colección `Country` + relaciones en Strapi (sin i18n); país en la URL `/co/...`, `/cl/...` |
| D4 | Rol público de Strapi solo `find`/`findOne`; nginx proxy GET-only con allowlist; ningún token en el navegador |
| D5 | Formularios con **Signal Forms** (`@angular/forms/signals`) |
| D6 | Persistencia del wizard en `sessionStorage`, separada por país |
| D7 | 3 pasos + pantalla de confirmación |
| D8 | Precio: factores por país en Strapi + función pura documentada |
| D9 | Pago: pasarela mock con resultado elegido (éxito/rechazo), sin campos de tarjeta |
| D10 | SDD propio y ligero mediante la Skill `sdd-traceability` |
| D11 | 6 subagentes en `.claude/agents/` + Skills `sdd-traceability` y `country-content` |

Cambiar una decisión aprobada exige una nueva entrada en `docs/decision-log.md` y aprobación humana.

## 4. Stack y entorno verificado

Node 24.22.3 · npm 11 · Angular 22.3 · Strapi 5.63 (SQLite) · Vitest (unit, `jsdom`) · Playwright (e2e, Chrome del sistema con `channel: 'chrome'`) · Docker Compose v5 · nginx. Host Windows 11; los contenedores son Linux.

## 5. Estructura del repositorio

```
CLAUDE.md · FLOW.md · README.md · docker-compose.yml · .env.example
.claude/agents/        subagentes (uno por rol)
.claude/skills/        sdd-traceability, country-content
specs/US-0X/spec.md    una spec por historia
docs/adr/              ADRs (MADR)
docs/architecture/     modelo de contenido, contratos de API
docs/qa/               plan e informes de pruebas
docs/traceability.md   matriz US → REQ → AC → ADR → código → tests → review
docs/decision-log.md   decisiones y rechazos humanos
reviews/               informes de code review y su resolución
logs/sessions/         transcripciones originales (NO EDITAR)
frontend/  cms/  e2e/
```

## 6. Reglas no negociables

- **Spec antes que código.** Ninguna historia se implementa sin su spec aprobada en G2.
- **`logs/` es evidencia original.** Nunca se edita, reescribe ni borra nada dentro de `logs/`. Solo se añaden copias sin modificar.
- **Seguridad.** Ningún token de Strapi llega al navegador. El rol público solo lee. Credenciales solo en `.env` (versionado únicamente `.env.example` con valores ficticios).
- **Datos ficticios.** Nada de datos personales reales, tarjetas reales ni pasarelas reales.
- **Evidencia real.** No se declaran tests, builds ni revisiones que no se hayan ejecutado. Los informes incluyen el comando y su salida real.
- **Dependencias.** Ninguna dependencia nueva sin justificarla en el commit o en un ADR.
- **Git.** Commits pequeños, Conventional Commits. Sin `push` salvo petición humana. Nunca `--no-verify`.
- **Errores.** Ante un fallo, primero la causa; después la corrección.

## 7. Trazabilidad

IDs (definidos en la Skill `sdd-traceability`):

- `US-01` historia · `REQ-01.3` requisito de la spec · `AC-01.2` criterio de aceptación · `Q-01.1` pregunta abierta
- `ADR-0001` decisión de arquitectura · `F-01.4` hallazgo de review · `D7` decisión humana

Commits que implementan algo citan los IDs al final del asunto:

```
feat(frontend): render dynamic fields by order [US-01][REQ-01.2]
```

Scopes: `frontend`, `cms`, `e2e`, `infra`, `docs`, `specs`, `adr`, `agents`, `skills`, `review`.

Los tests nombran el criterio que verifican: `it('AC-01.2 shows the configured error message', ...)`.

## 8. Convenciones de código

**Angular (`frontend/`)**

- Componentes standalone con `ChangeDetectionStrategy.OnPush`; estado con `signal`/`computed`; `inject()` en lugar de constructores con parámetros.
- Plantillas con `@if`, `@for` (con `track`), `@switch`. Prohibido `*ngIf`, `*ngFor` y NgModules.
- TypeScript `strict`; prohibido `any` (usar `unknown` + validación). DTOs de Strapi separados del dominio mediante mappers.
- Lógica de negocio (precio, enmascarado, validadores, edad, año) en **funciones puras** con unit tests.
- Nombres de archivo según lo que genera `ng generate` en Angular 22.
- Accesibilidad: cada control con `<label>` asociado, errores con `aria-describedby`, foco gestionado al cambiar de paso, todo operable con teclado.
- Estados de carga, vacío y error explícitos en cada llamada a Strapi.

**Strapi (`cms/`)**

- Content types y componentes como código (`src/api`, `src/components`).
- Seed y permisos del rol público en `bootstrap`, idempotentes.
- Nada de lógica de presentación en Strapi.

**Tests**

- Unit (Vitest): junto al código, `*.spec.ts`. Los mantiene el Angular Developer.
- E2E (Playwright): `e2e/`. Los mantiene el QA Engineer. Al menos el flujo completo de un país.

## 9. Flujo y gates humanos

Detalle en `FLOW.md`. Resumen:

| Gate | Qué aprueba el humano |
|---|---|
| G0 | Estrategia (Fase 1) |
| G1 | Flujo agéntico: este archivo, agentes, Skills, FLOW.md |
| G2 | Specs de cada historia |
| G3 | ADRs y modelo de contenido |
| Demo | Cada historia implementada, antes de la siguiente |
| G4 | Triage de hallazgos de review |
| G5 | Prueba manual con teclado y móvil, sin IA |
| G6 | Entrega |

Un rechazo devuelve el trabajo al agente productor con el motivo registrado en `docs/decision-log.md`.

## 10. Definition of Done (por historia)

- [ ] Spec aprobada y sin preguntas abiertas bloqueantes.
- [ ] Código que cumple cada `REQ` de la spec, con commits que citan los IDs.
- [ ] Unit tests de la lógica relevante, ejecutados en verde (salida real en `docs/qa/`).
- [ ] E2E del flujo afectado ejecutado en verde.
- [ ] Review en `reviews/` con hallazgos resueltos o aceptados por el humano (G4).
- [ ] `docs/traceability.md` actualizado.

## 11. Idioma

Documentación y comunicación con el humano en **español**. Código, identificadores, nombres de archivo y mensajes de commit en **inglés**. Los textos visibles al usuario final vienen de Strapi.
