# Matriz de trazabilidad

Hilo **US → REQ → AC → ADR → código → tests → review** por requisito. Formato y estados en la Skill [`sdd-traceability`](../.claude/skills/sdd-traceability/templates/traceability-row.md). Se actualiza tras cada spec, ADR, implementación, informe de pruebas y review; usa rutas y SHAs reales.

Estados: `Spec` → `Designed` → `Implemented` → `Tested` → `Reviewed` → `Done`.

| US | REQ | AC | ADR | Código | Tests | Review | Estado |
|---|---|---|---|---|---|---|---|
| US-01 | REQ-01.1–REQ-01.36 (01.36: D14) | AC-01.1–AC-01.36 | ADR-0001, 0002, 0003, 0004, 0007 | `frontend/src/app/features/form-step/` (`f5e47f1`), `cms/` (`078d59a`) | `docs/qa/US-01-test-report.md` ✅ | [000](../reviews/000-G2-specs-cross-consistency.md), [001](../reviews/001-G3-architecture-check.md), [002](../reviews/002-phase-4-implementation.md) | Reviewed (e2e 80/80 tras D12–D14, review 002 cerrada, G5 aprobada; pendiente G6) |
| US-02 | REQ-02.1–REQ-02.34 (02.34: D14) | AC-02.1–AC-02.34 | ADR-0001, 0003, 0004, 0005, 0007 | `frontend/src/app/features/plans-step/`, `domain/pricing/` (`f411a8b`) | `docs/qa/US-02-test-report.md` ✅ | [000](../reviews/000-G2-specs-cross-consistency.md), [001](../reviews/001-G3-architecture-check.md), [002](../reviews/002-phase-4-implementation.md) | Reviewed (e2e 80/80 tras D12–D14, review 002 cerrada, G5 aprobada; pendiente G6) |
| US-03 | REQ-03.1–REQ-03.38 | AC-03.1–AC-03.36 | ADR-0001, 0003, 0004, 0005, 0006, 0007 | `frontend/src/app/features/summary-step/`, `confirmation/` (`0cb032c`) | `docs/qa/US-03-test-report.md` ✅ | [000](../reviews/000-G2-specs-cross-consistency.md), [001](../reviews/001-G3-architecture-check.md), [002](../reviews/002-phase-4-implementation.md) | Reviewed (e2e 80/80 tras D12–D14, review 002 cerrada, G5 aprobada; pendiente G6) |

El detalle REQ → ADR o sección de arquitectura está en [`docs/architecture/overview.md`](architecture/overview.md) §3. La matriz se desglosa en una fila por `REQ` al implementar cada historia (Fase 4), cuando existan código y tests que enlazar.

## Decisiones humanas relacionadas

Ver [`decision-log.md`](decision-log.md). G0 aprobado el 2026-11-22 (D1–D11).
