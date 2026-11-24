# Traceability matrix

Thread **US → REQ → AC → ADR → code → tests → review** per requirement. Format and statuses in the [`sdd-traceability`](../.claude/skills/sdd-traceability/templates/traceability-row.md) Skill. It is updated after each spec, ADR, implementation, test report and review; it uses real paths and SHAs.

Statuses: `Spec` → `Designed` → `Implemented` → `Tested` → `Reviewed` → `Done`.

| US | REQ | AC | ADR | Code | Tests | Review | Status |
|---|---|---|---|---|---|---|---|
| US-01 | REQ-01.1–REQ-01.36 (01.36: D14) | AC-01.1–AC-01.36 | ADR-0001, 0002, 0003, 0004, 0007 | `frontend/src/app/features/form-step/` (`f5e47f1`), `cms/` (`078d59a`) | `docs/qa/US-01-test-report.md` ✅ | [000](../reviews/000-G2-specs-cross-consistency.md), [001](../reviews/001-G3-architecture-check.md), [002](../reviews/002-phase-4-implementation.md), [003](../reviews/003-visual-refresh-and-d14.md) | Reviewed (e2e 80/80, reviews 002–003 closed, G5 approved and re-checked; G6 pending) |
| US-02 | REQ-02.1–REQ-02.34 (02.34: D14) | AC-02.1–AC-02.34 | ADR-0001, 0003, 0004, 0005, 0007 | `frontend/src/app/features/plans-step/`, `domain/pricing/` (`f411a8b`) | `docs/qa/US-02-test-report.md` ✅ | [000](../reviews/000-G2-specs-cross-consistency.md), [001](../reviews/001-G3-architecture-check.md), [002](../reviews/002-phase-4-implementation.md), [003](../reviews/003-visual-refresh-and-d14.md) | Reviewed (e2e 80/80, reviews 002–003 closed, G5 approved and re-checked; G6 pending) |
| US-03 | REQ-03.1–REQ-03.38 | AC-03.1–AC-03.36 | ADR-0001, 0003, 0004, 0005, 0006, 0007 | `frontend/src/app/features/summary-step/`, `confirmation/` (`0cb032c`) | `docs/qa/US-03-test-report.md` ✅ | [000](../reviews/000-G2-specs-cross-consistency.md), [001](../reviews/001-G3-architecture-check.md), [002](../reviews/002-phase-4-implementation.md), [003](../reviews/003-visual-refresh-and-d14.md) | Reviewed (e2e 80/80, reviews 002–003 closed, G5 approved and re-checked; G6 pending) |

The REQ → ADR or architecture section detail is in [`docs/architecture/overview.md`](architecture/overview.md) §3. The matrix is broken down into one row per `REQ` when each story is implemented (Phase 4), once there is code and tests to link.

## Related human decisions

See [`decision-log.md`](decision-log.md). G0 approved on 2026-11-22 (D1–D11).
