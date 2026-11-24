# Row format of `docs/traceability.md`

One row per `REQ`. The cells use repo paths and real short SHAs; `—` if it does not exist yet.

```markdown
| US | REQ | AC | ADR | Code | Tests | Review | Status |
|---|---|---|---|---|---|---|---|
| US-01 | REQ-01.3 | AC-01.2 | ADR-0002 | `frontend/src/app/...` (`a1b2c3d`) | `...spec.ts › AC-01.2` ✅ | F-01.4 Fixed (`d4e5f6a`) | Done |
```

Statuses: `Spec` → `Designed` → `Implemented` → `Tested` → `Reviewed` → `Done`.
