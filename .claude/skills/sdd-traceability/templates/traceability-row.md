# Formato de fila de `docs/traceability.md`

Una fila por `REQ`. Las celdas usan rutas del repo y SHAs cortos reales; `—` si aún no existe.

```markdown
| US | REQ | AC | ADR | Código | Tests | Review | Estado |
|---|---|---|---|---|---|---|---|
| US-01 | REQ-01.3 | AC-01.2 | ADR-0002 | `frontend/src/app/...` (`a1b2c3d`) | `...spec.ts › AC-01.2` ✅ | F-01.4 Fixed (`d4e5f6a`) | Done |
```

Estados: `Spec` → `Designed` → `Implemented` → `Tested` → `Reviewed` → `Done`.
