# Review 000 — Consistencia entre specs US-01, US-02, US-03 (pre-G2)

| Campo | Valor |
|---|---|
| Revisor | Orquestador (sesión principal de Claude Code, Claude Opus 5.5) |
| Fecha | 2026-11-22 |
| Alcance | `specs/US-01/spec.md`, `specs/US-02/spec.md`, `specs/US-03/spec.md` (Draft), escritas en paralelo por 3 instancias de `requirements-analyst` |
| Veredicto | Cambios requeridos tras G2 (alineación entre specs) |

## Comprobaciones ejecutadas

- Los 12 escenarios del PDF aparecen literales (4 por spec): OK.
- Todo REQ tiene columna de verificación: OK.
- Formato de moneda de AC-02.8 ejecutado en Node 24.22.3:

```text
$ node -e "...Intl.NumberFormat(l,{style:'currency',currency:c,minimumFractionDigits:0,maximumFractionDigits:0})..."
es-CO "$ 1.320.000" 24 a0 31 2e 33 32 30 2e 30 30 30
es-CL "$38.985" 24 33 38 2e 39 38 35
```

## Hallazgos

| ID | Severidad | Ubicación | Descripción | Propuesta |
|---|---|---|---|---|
| F-00.1 | Major | `specs/US-01/spec.md` Q-01.3 · `specs/US-03/spec.md` Q-03.1 | Dos mecanismos distintos para identificar el documento: US-01 propone **roles** de campo (`documentNumber`, `birthDate`, `vehicleYear`); US-03 propone un **booleano** `masked`. | Usar los roles de US-01 en las tres specs; US-03 enmascara los campos con rol `documentNumber`. |
| F-00.2 | Major | `specs/US-02/spec.md` Q-02.4 · `specs/US-01/spec.md` Q-01.3 | US-02 enlaza la regla de precio con el `key` del campo; US-01 propone enlazar reglas por **rol** porque el negocio puede cambiar el `key`. | US-02 usa los roles (`birthDate`, `vehicleYear`). |
| F-00.3 | Major | Q-01.6 · Q-02.13 · Q-03.14 | Tres variantes de la misma excepción a `CLAUDE.md` §11 (textos fijos en código): conjunto mínimo en español / por locale / un único mensaje. | Una sola decisión transversal y un cambio explícito en `CLAUDE.md` §11. |
| F-00.4 | Minor | Q-02.13 · Q-03.14 | Texto que falta en Strapi: US-02 usa un texto por defecto del código; US-03 lo trata como error de configuración. | Una sola regla, decidida junto con F-00.3. |
| F-00.5 | Minor | Q-01.18 · Q-02.10 · Q-03.8 | Guardas de navegación: US-02 confía en una señal persistida de "paso 1 completado"; US-01 expone `isComplete` calculado y US-03 revalida con los validadores. Una señal persistida puede quedar obsoleta si cambia la configuración. | `isComplete` se calcula siempre con la configuración vigente; no se persiste una señal. |
| F-00.6 | Minor | `specs/US-02/spec.md:167` (AC-02.8) | El ejemplo `"$ 1.320.000"` usa un espacio normal; `Intl` en Node 24 produce U+00A0 (espacio no separable). Un test con el literal fallaría. | Indicar U+00A0 en el ejemplo o comparar normalizando espacios. |

## Resolución (se completa tras G2)

| ID | Decisión humana | Estado | Commit / motivo |
|---|---|---|---|
| F-00.1 | | | |
| F-00.2 | | | |
| F-00.3 | | | |
| F-00.4 | | | |
| F-00.5 | | | |
| F-00.6 | | | |
