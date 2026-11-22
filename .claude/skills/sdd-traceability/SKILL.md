---
name: sdd-traceability
description: Spec-Driven Development procedure and traceability conventions for this project. Use when writing or updating a spec (specs/US-XX/spec.md), an ADR (docs/adr/), a code review report (reviews/), a test report (docs/qa/), the traceability matrix (docs/traceability.md), a human gate entry (docs/decision-log.md), or when choosing IDs (US, REQ, AC, Q, ADR, F, D) and commit messages that cite them.
---

# sdd-traceability

Variante propia y ligera de SDD (decisión D10). La spec aprobada es la fuente de verdad; el código, los tests y las revisiones se derivan de ella y la citan por ID, de modo que el hilo **US → spec → ADR → código → tests → review** se puede seguir con `git log` y `grep`.

## 1. IDs

| ID | Qué es | Dónde nace | Ejemplo |
|---|---|---|---|
| `US-0X` | Historia de usuario del PDF | PDF | `US-01` |
| `REQ-0X.n` | Requisito verificable de la spec | `specs/US-0X/spec.md` | `REQ-01.3` |
| `AC-0X.n` | Criterio de aceptación (Gherkin) | spec | `AC-01.2` |
| `Q-0X.n` | Pregunta abierta o hueco de la historia | spec | `Q-01.4` |
| `ADR-NNNN` | Decisión de arquitectura | `docs/adr/NNNN-titulo.md` | `ADR-0001` |
| `F-0X.n` | Hallazgo de code review | `reviews/` | `F-02.3` |
| `Dn` | Decisión humana en un gate | `docs/decision-log.md` | `D5` |

- `0X = 00` se usa para lo transversal (seguridad, entorno, infraestructura).
- Los IDs **no se reutilizan**. Un requisito eliminado se marca `~~REQ-01.3~~ (retirado, motivo)`.
- Numeración secuencial dentro de cada historia.

## 2. Procedimientos

### 2.1 Escribir una spec (Requirements Analyst)

1. Copia [templates/spec.md](templates/spec.md) a `specs/US-0X/spec.md`.
2. Copia **literalmente** del PDF la historia, el contexto, las reglas de negocio y los escenarios.
3. Convierte cada regla y cada escenario en uno o más `REQ` verificables. Cada `REQ` indica su **origen**: `PDF`, `AC del PDF`, `Dn` o `Q-0X.n resuelta`.
4. Busca huecos con la lista de la sección 3 y regístralos como `Q`. Cada `Q` lleva una **propuesta** de respuesta; nunca se resuelve en silencio.
5. Añade `AC` nuevos en Gherkin para los huecos resueltos y para estados de carga, vacío y error.
6. Estado `Draft` hasta que el humano la apruebe en G2; entonces `Approved` con fecha.

### 2.2 Escribir un ADR (Software Architect)

1. Copia [templates/adr.md](templates/adr.md) a `docs/adr/NNNN-titulo-en-kebab-case.md`.
2. Mínimo **dos opciones reales** consideradas, con pros y contras. Si una alternativa es de paja, no cuenta.
3. Consecuencias positivas **y negativas**.
4. Enlaza los `REQ` y `Dn` que motivan la decisión.
5. Estado `Proposed` → `Accepted` en G3. Un ADR aceptado no se edita: se crea otro que lo `Supersedes`.

### 2.3 Escribir un informe de review (Code Reviewer)

1. Copia [templates/review.md](templates/review.md) a `reviews/NNN-US-0X-tema.md`.
2. Registra el rango de commits revisado (`git diff <base>..<head>`) y los comandos ejecutados con su salida real.
3. Cada hallazgo: `F-0X.n`, severidad, `archivo:línea`, evidencia, `REQ` o regla afectada, propuesta.
4. No hay hallazgos sin `archivo:línea` ni sin evidencia. Si no encuentras nada, dilo y explica qué revisaste.
5. Cierre: cada hallazgo queda `Fixed in <sha>`, `Accepted (D-n)` o `Rejected (motivo)`. Solo el humano acepta o rechaza (G4).

### 2.4 Escribir un informe de pruebas (QA Engineer / Angular Developer)

1. Copia [templates/test-report.md](templates/test-report.md) a `docs/qa/US-0X-test-report.md` (o `docs/qa/e2e-report.md`).
2. Pega el comando exacto y la salida real (resumen final incluido). No se resume ni se reescribe la salida.
3. Mapea cada `AC` a su test y resultado. Un `AC` sin test se marca como `No cubierto` con motivo.

### 2.5 Actualizar la matriz

Tras cada spec, ADR, implementación, informe de pruebas o review, actualiza la fila correspondiente de `docs/traceability.md` (formato en [templates/traceability-row.md](templates/traceability-row.md)). Usa rutas y SHAs reales.

### 2.6 Registrar un gate humano (orquestador)

Añade en `docs/decision-log.md`: gate, fecha, qué se presentó, veredicto (`Aprobada`, `Rechazada`, `Modificada`) y el **motivo literal** del humano. En un rechazo, añade el feedback que recibe el agente productor y el SHA de la corrección cuando exista.

## 3. Lista de comprobación de huecos (para specs)

- ¿Qué pasa con datos vacíos, nulos o mal formados que vienen de Strapi?
- ¿Límites inclusivos o exclusivos? ¿Relativos a qué fecha y zona horaria?
- ¿Qué pasa si el negocio elimina o renombra un campo del que depende otra regla?
- ¿Varios elementos marcados cuando la regla espera uno (p. ej. varios "recomendados")?
- ¿Datos persistidos que ya no coinciden con la configuración actual?
- ¿Estados de carga, vacío y error de cada llamada?
- ¿Accesibilidad: etiqueta, foco, anuncio de errores, navegación con teclado?
- ¿Cómo se prueba de forma determinista (fechas, pago simulado)?
- ¿Qué es configurable desde Strapi y qué es fijo en código?

## 4. Commits

```
<type>(<scope>): <summary in English> [US-0X][REQ-0X.n]
```

- Un commit de corrección de review cita el hallazgo: `fix(frontend): mask document on summary [US-03][F-03.2]`.
- Los commits de documentación de specs y ADRs citan su propio ID: `docs(specs): draft US-01 spec [US-01]`.

## 5. Tests

El nombre del test empieza por el `AC` o `REQ` que verifica: `it('AC-02.4 shows empty message when no active plans', ...)`. Así `grep -r "AC-02.4"` lleva de la spec al test.
