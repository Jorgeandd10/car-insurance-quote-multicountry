# Matriz de trazabilidad

Hilo **US → REQ → AC → ADR → código → tests → review** por requisito. Formato y estados en la Skill [`sdd-traceability`](../.claude/skills/sdd-traceability/templates/traceability-row.md). Se actualiza tras cada spec, ADR, implementación, informe de pruebas y review; usa rutas y SHAs reales.

Estados: `Spec` → `Designed` → `Implemented` → `Tested` → `Reviewed` → `Done`.

| US | REQ | AC | ADR | Código | Tests | Review | Estado |
|---|---|---|---|---|---|---|---|
| US-01 | REQ-01.1–REQ-01.35 | AC-01.1–AC-01.34 | — | — | — | [000](../reviews/000-G2-specs-cross-consistency.md) | Spec (Draft, pendiente G2) |
| US-02 | REQ-02.1–REQ-02.33 | AC-02.1–AC-02.32 | — | — | — | [000](../reviews/000-G2-specs-cross-consistency.md) | Spec (Draft, pendiente G2) |
| US-03 | REQ-03.1–REQ-03.38 | AC-03.1–AC-03.35 | — | — | — | [000](../reviews/000-G2-specs-cross-consistency.md) | Spec (Draft, pendiente G2) |

Las filas pasan a una por `REQ` cuando cada spec se apruebe en G2.

## Decisiones humanas relacionadas

Ver [`decision-log.md`](decision-log.md). G0 aprobado el 2026-11-22 (D1–D11).
