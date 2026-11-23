# Review 003 — Estilo visual (D12, D13), cambiar de país y tarjeta pulsable (D14), favicon (D15)

| Campo | Valor |
|---|---|
| Revisor | Code Reviewer (subagente), modelo: Claude Opus 5.5 (`claude-opus-5-5`) |
| Fecha | 2026-11-23 |
| Alcance | `git diff 95c2c0c..c4f5095` (rama `style/sura-visual-refresh`, 10 commits: `fe5c56c`, `1d1c668`, `792119b`, `db808c1`, `47443de`, `63ca979`, `3bd348e`, `60311e5`, `af53c7e`, `c4f5095`) · 54 archivos: `frontend/` (estilos, shell, assets, dependencia), `cms/` (campo y backfill), `e2e/`, `specs/US-01`, `specs/US-02`, `docs/`. Fuera de alcance: `e54001a` (README y FLOW, posterior a `c4f5095`; solo docs, no toca `frontend/` ni `cms/`) |
| Specs / ADRs de referencia | `specs/US-01/spec.md` v0.4 (REQ-01.33, REQ-01.36, AC-01.36), `specs/US-02/spec.md` v0.4 (REQ-02.26, REQ-02.27, REQ-02.29, REQ-02.34, AC-02.34), `specs/US-03/spec.md` (REQ-03.36); ADR-0001, ADR-0003, ADR-0004, ADR-0007; `docs/architecture/content-model.md`, `api-contracts.md`; `docs/decision-log.md` (D12, D13, D14, D15, G2-2, G3-5); `CLAUDE.md` |
| Veredicto | **Aprobado con cambios** (0 Blocker, 0 Major; 4 Minor y 4 Nit para triage en G4) |

## Comandos ejecutados

Todos son de lectura, build o test. El build escribe en `frontend/dist/` (ignorado por git). Las sondas de Playwright del revisor se escribieron y ejecutaron desde el scratchpad de la sesión, fuera del repo, con salida de artefactos también fuera del repo. `git status` limpio al empezar y al terminar (salvo este informe).

### Alcance

```text
$ git log --oneline 95c2c0c..c4f5095
c4f5095 feat(frontend): add brand favicon and touch icons [D15]
af53c7e docs: update traceability for D14 and e2e 80/80 [D14][US-01][US-02]
60311e5 test(e2e): cover change-country link and clickable plan card, 80/80 [D14][AC-01.36][AC-02.34]
3bd348e feat(frontend): add change-country link and make the whole plan card selectable [D14][REQ-01.36][REQ-02.34]
63ca979 feat(cms): add wizardTexts.changeCountryLabel with idempotent backfill [D14][US-01][REQ-01.36]
47443de specs: add change-country link and clickable plan card after G5 [D14][REQ-01.36][AC-01.36][REQ-02.34][AC-02.34]
db808c1 feat(frontend): add SURA logo, Figtree font, hero illustration and polished UX [D13][REQ-01.33][REQ-02.29][REQ-03.36]
792119b docs: record D13 extending visual style with logo, font and illustration [D13]
1d1c668 feat(frontend): apply SURA-inspired visual style with design tokens [D12][REQ-01.33][REQ-02.29][REQ-03.36]
fe5c56c docs: record phase 5 merge and D12 SURA-inspired visual style [D12]

$ git log --oneline c4f5095..HEAD ; git diff --stat c4f5095..HEAD
e54001a docs: add README and complete FLOW sections 6-8 for delivery
 FLOW.md   | 25 ++++++++++++++----
 README.md | 87 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 107 insertions(+), 5 deletions(-)
```

`e54001a` solo cambia documentación, así que el build y los tests ejecutados sobre el árbol actual equivalen a `c4f5095` en `frontend/` y `cms/`.

### Build, unit tests y formato (en `frontend/`)

```text
$ npx ng build
✔ Building...
Initial chunk files | Names                  |  Raw size | Estimated transfer size
main-SOBT4VEK.js    | main                   | 295.92 kB |                80.30 kB
styles-NTDGXMFB.css | styles                 |   6.21 kB |                 1.91 kB

                    | Initial total          | 302.13 kB |                82.22 kB

Lazy chunk files    | Names                  |  Raw size | Estimated transfer size
chunk-C8VTNn4N.js   | form-step-page         |  65.25 kB |                16.98 kB
chunk-Bjw0i0Qb.js   | summary-step-page      |  23.19 kB |                 6.18 kB
chunk-BYpa-ZCU.js   | plans-step-page        |  10.46 kB |                 3.17 kB
chunk-Bsx2fnci.js   | country-shell          |   8.23 kB |                 2.64 kB
chunk-Ce3_FM81.js   | -                      |   4.14 kB |                 1.71 kB
chunk-DvNqx6U3.js   | confirmation-page      |   3.45 kB |                 1.37 kB
chunk-B4DYgJbP.js   | country-selection-page |   3.37 kB |                 1.50 kB
chunk-CXDbEDFl.js   | -                      |   3.08 kB |                 1.17 kB
chunk-BvN-fAav.js   | -                      |   1.35 kB |               658 bytes
chunk-FpvmFjhC.js   | -                      | 622 bytes |               622 bytes
chunk-CGwJUSht.js   | -                      | 153 bytes |               153 bytes

Application bundle generation complete. [13.405 seconds] - 2026-11-23T22:22:27.018Z

$ npx ng test --watch=false
 RUN  v5.1.1 C:/Users/Jorge Andres/Documents/_SURA/car-insurance-quote-multicountry/frontend

 Test Files  46 passed (46)
      Tests  469 passed (469)
   Start at  17:23:02
   Duration  25.47s (environment 75%, tests 19%, setup 4%, import 2%)

$ npx prettier --check "src/**/*.{ts,html,css}"
Checking formatting...
All matched files use Prettier code style!
```

Sin avisos de budget (`initial` 500 kB / 1 MB; `anyComponentStyle` 4 kB / 8 kB en `angular.json:34-45`). El `index.html` servido en `:8080` referencia `main-SOBT4VEK.js` y `styles-NTDGXMFB.css`, los mismos hashes que el build local: la pila levantada corresponde al código revisado.

### Assets, fuente y CSP contra la pila (`http://localhost:8080`)

```text
$ curl -s http://localhost:8080/ | grep -o 'main-[A-Z0-9]*\.js\|styles-[A-Z0-9]*\.css'
styles-NTDGXMFB.css
main-SOBT4VEK.js

$ for p in /favicon.ico /brand/icon-32.png /brand/icon-192.png /brand/apple-touch-icon.png /brand/sura-logo-white.png /illustrations/car-protection.svg /media/figtree-latin-wght-normal-SOXVSX3R.woff2 /brand/does-not-exist.png; do echo "== $p"; curl -s -o /dev/null -D - "http://localhost:8080$p" | grep -iE "^HTTP|content-type|cache-control|content-security|content-length"; done
== /favicon.ico
HTTP/1.1 200 OK
Content-Type: image/x-icon
Content-Length: 1081
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
== /brand/icon-32.png
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 1059
[... misma CSP ...]
== /brand/icon-192.png
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 10904
== /brand/apple-touch-icon.png
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 10664
== /brand/sura-logo-white.png
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 21796
== /illustrations/car-protection.svg
HTTP/1.1 200 OK
Content-Type: image/svg+xml
Content-Length: 4212
== /media/figtree-latin-wght-normal-SOXVSX3R.woff2
HTTP/1.1 200 OK
Content-Type: font/woff2
Content-Length: 20156
Cache-Control: public, max-age=31536000, immutable
== /brand/does-not-exist.png
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 857
Cache-Control: no-cache
```

[nota del revisor: la salida se recorta solo en la repetición de la cabecera CSP, idéntica en las 8 respuestas. `does-not-exist.png` → `index.html` es el `try_files $uri /index.html` previo a este rango (`infra/nginx/default.conf:74-75`), sin cambios aquí.]

```text
$ grep -o "@font-face{[^}]*}" dist/car-insurance-quote/browser/styles-*.css
@font-face{font-family:Figtree Variable;font-style:normal;font-display:swap;font-weight:300 900;src:url("./media/figtree-latin-ext-wght-normal-O22BDGD7.woff2") format("woff2-variations");unicode-range:U+0100-02BA,...}
@font-face{font-family:Figtree Variable;font-style:normal;font-display:swap;font-weight:300 900;src:url("./media/figtree-latin-wght-normal-SOXVSX3R.woff2") format("woff2-variations");unicode-range:U+0000-00FF,...}

$ grep -rnoE "https?://[a-zA-Z0-9./_-]+" dist/car-insurance-quote/browser --include=*.css --include=*.html --include=*.svg
dist/car-insurance-quote/browser/illustrations/car-protection.svg:1:http://www.w3.org/2000/svg

$ grep -nE "<text|<script|href|xlink|on[a-z]+=|<foreignObject|<title|<desc|url\(http" public/illustrations/car-protection.svg
[sin salida]

$ file public/favicon.ico public/brand/*.png
public/favicon.ico:                MS Windows icon resource - 1 icon, 32x32 with PNG image data, 32 x 32, 8-bit/color RGBA, non-interlaced, 32 bits/pixel
public/brand/apple-touch-icon.png: PNG image data, 180 x 180, 8-bit/color RGBA, non-interlaced
public/brand/icon-192.png:         PNG image data, 192 x 192, 8-bit/color RGBA, non-interlaced
public/brand/icon-32.png:          PNG image data, 32 x 32, 8-bit/color RGBA, non-interlaced
public/brand/sura-logo-white.png:  PNG image data, 640 x 118, 8-bit/color RGBA, non-interlaced
[chunks tEXt/iTXt/zTXt/eXIf en los 4 PNG: ninguno (script de Python de lectura)]

$ npm ls @fontsource-variable/figtree
car-insurance-quote@0.0.0 C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend
`-- @fontsource-variable/figtree@5.3.0

$ head -5 node_modules/@fontsource-variable/figtree/LICENSE
Copyright 2022 The Figtree Project Authors (https://github.com/erikdkennedy/figtree) Figtree-Italic[wght].ttf: Copyright 2022 The Figtree Project Authors (https://github.com/erikdkennedy/figtree)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
```

`package.json` fija `"@fontsource-variable/figtree": "5.3.0"` (sin `^`), y `package-lock.json` registra `resolved` en `registry.npmjs.org`, `integrity sha512-VRVo…` y `"license": "OFL-1.1"`. La justificación está en D13 y en el cuerpo de `db808c1`.

### Secretos y reglas de código (`frontend/`)

```text
$ grep -rnE "content:\s*['\"][^'\"]+['\"]" src --include=*.css --include=*.ts
[sin salida]
$ grep -rnE "\balt=\"[^\"]+\"|\baria-label=\"|\btitle=\"|placeholder=\"" src --include=*.html --include=*.ts
[sin salida]
$ grep -rnE ":\s*any\b|<any>|as any|\*ngIf|\*ngFor|NgModule" src --include=*.ts --include=*.html
[sin salida]
$ grep -rl "@Component" src/app --include=*.ts | grep -v spec | while read f; do grep -q "OnPush" "$f" || echo "NO OnPush: $f"; done
[sin salida]
$ grep -rlE "Bearer|api_token|APP_KEYS|JWT_SECRET|ADMIN_JWT" dist/car-insurance-quote/browser; echo "exit $?"
exit 1
```

### Strapi: backfill y rol público

```text
$ for c in co cl; do curl -s "http://localhost:8080/api/countries?filters%5Bcode%5D%5B%24eq%5D=$c&populate%5BwizardTexts%5D=true" | grep -o '"changeCountryLabel":"[^"]*"'; done
"changeCountryLabel":"Cambiar de país"
"changeCountryLabel":"Cambiar de país"

$ curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8080/api/countries -H 'Content-Type: application/json' -d '{}'
403
$ curl ... -X POST http://127.0.0.1:1337/api/countries ; -X PUT .../api/countries/x ; -X DELETE .../api/countries/x
405
405
405
$ curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8080/api/countries?status=draft"
400

$ docker compose logs cms 2>&1 | grep -E "\[seed\]" | tail -20
cms-1  | [2026-11-23 21:42:11.399] info: [seed] country co: exists (documentId zcpwhxzi7tvo0rzx69wqmn3n), content kept
cms-1  | [2026-11-23 21:42:11.477] info: [seed] country cl: exists (documentId tsah25eawwtwblsw4s3vblfb), content kept
cms-1  | [2026-11-23 21:42:11.531] info: [seed] country-selection: exists, not modified
cms-1  | [2026-11-23 21:42:11.532] info: [seed] done: 0 created, 30 already present (left untouched)
```

El último arranque del contenedor no escribe nada (no hay líneas `wizardTexts backfilled`): el backfill ya se había aplicado y es idempotente. `git diff 95c2c0c..c4f5095 --stat -- cms/` solo toca `wizard-texts.json`, `seed/data/{co,cl}.ts` y `seed/seed.ts`; los permisos del rol público no cambian. No hay `tsc` local en `cms/` (`npx tsc` pide instalar TypeScript), así que el tipado del seed lo respalda solo el arranque del contenedor con ese código.

### Contraste WCAG de los pares usados

Script de Node en el scratchpad con la fórmula de luminancia relativa de WCAG 2.x:

```text
#2d6df6 on #ffffff: 4.54:1  primary/white (legend, h2)
#2d6df6 on #dfeaff: 3.75:1  primary/surface (h1 hero)
#0033a0 on #ffffff: 10.60:1  primary-dark/white
#0033a0 on #dfeaff: 8.76:1  change-country link / step current
#26328c on #dfeaff: 9.05:1  link hover / on-accent on surface
#26328c on #e3e829: 8.26:1  on-accent/accent (CTA, badge)
#26328c on #d4d91f: 7.17:1  CTA hover
#26328c on #c9ce14: 6.43:1  CTA active
#26328c on #ffffff: 10.95:1  secondary button
#26328c on #ccdcff: 7.95:1  secondary active
#1c1c24 on #ffffff: 16.92:1  text/white
#1c1c24 on #dfeaff: 13.98:1  text/surface
#1c1c24 on #f5f8ff: 15.92:1  text/soft
#3f3f41 on #dfeaff: 8.68:1  muted/surface (step labels)
#3f3f41 on #ffffff: 10.51:1  muted/white
#3f3f41 on #f5f8ff: 9.88:1  muted/soft
#0b5fff on #ffffff: 5.13:1  link/white
#0b5fff on #f5f8ff: 4.82:1  link/soft (terms region)
#0b5fff on #dfeaff: 4.24:1  link/surface
#6b6b70 on #ffffff: 5.30:1  border-strong/white
#6b6b70 on #dfeaff: 4.38:1  border-strong/surface
#6b6b70 on #f5f8ff: 4.99:1  border-strong/soft
#5c5c61 on #f2f2f2: 5.94:1  disabled
#b3261e on #ffffff: 6.54:1  error/white
#b3261e on #fdf1f0: 5.92:1  error/error-surface
#ffffff on #2d6df6: 4.54:1  white/primary (step number)
#ffffff on #0033a0: 10.60:1  white/primary-dark (loading pill)
#0033a0 on #e3e829: 8.00:1  focus ring on accent
#0033a0 on #2d6df6: 2.34:1  focus vs primary
#e3eaf7 on #ffffff: 1.21:1  card border/white
#2d6df6 on #f5f8ff: 4.27:1  primary/soft
```

Todos los valores coinciden con los comentarios de `frontend/src/styles.css:12-35`. Los pares por debajo de 4,5:1 están justificados:

- `#2d6df6` sobre `#dfeaff` (3,75): solo en `h1`, con al menos 32 px y peso 800, así que es texto grande (≥ 3:1).
- `#0b5fff` sobre `#dfeaff` (4,24): no hay ningún `<a>` sobre la superficie azul clara. El enlace "Cambiar de país" usa `#0033a0`, y las tarjetas de país son blancas.
- `#2d6df6` sobre `#f5f8ff` (4,27): no se usa como color de texto.
- `#e3eaf7` (1,21): borde decorativo de tarjeta. El control es el radio nativo.
- `#0033a0` frente a `#2d6df6` (2,34): con `outline-offset: 2px`, el anillo de foco queda sobre blanco o sobre la superficie, no pegado al primario.

### E2E del cambio y sondas del revisor (Playwright, Chrome del sistema, pila en `:8080`)

```text
$ cd e2e && npx playwright test tests/flow/change-country-and-plan-card.spec.ts --reporter=line --output <scratchpad>/pw-out
Running 3 tests using 2 workers
[1/3] [flow] › tests\flow\change-country-and-plan-card.spec.ts:38:3 › D14 change country link (US-01) › AC-01.36 the "change country" link goes back to the country selection and the step 1 data is kept
[2/3] [flow] › tests\flow\change-country-and-plan-card.spec.ts:80:3 › D14 change country link (US-01) › AC-01.36 the "change country" link is on the plans, summary and confirmation screens
[3/3] [flow] › tests\flow\change-country-and-plan-card.spec.ts:116:3 › D14 whole plan card selects the plan (US-02) › AC-02.34 clicking anywhere on a plan card selects the plan
  3 passed (16.5s)
```

**Sonda 1: la suite con animaciones.** Config del scratchpad idéntica a `e2e/playwright.config.ts` (2 workers, 0 retries, timeouts 60 s / 15 s, Chrome, es-CO, America/Bogota, 1280×900), con `reducedMotion: 'no-preference'` y los mismos `tests/`:

```text
$ npx playwright test -c <scratchpad>/motion.config.mjs          # proyectos flow + a11y-responsive
  42 passed (1.4m)
real	1m30.031s

$ npx playwright test -c <scratchpad>/motion2.config.mjs         # proyectos states + content-changes
Running 38 tests using 2 workers
  38 passed (1.1m)
real	1m11.674s
```

**Sonda 2: hit testing, foco, scroll y tamaños.** Script del scratchpad que importa `e2e/support/fixtures.ts`:

```text
elementFromPoint(centre of coverage "Hurto" of Plan Total) = LABEL class="plan-label" for="plan-w0wpckj1bpd9na29vbg5pr99"
activeElement after reaching plans = H1 Elige tu plan
after Shift+Tab = A "Cambiar de país" matches :focus-visible=true outline solid 3px rgb(0, 51, 160) offset 2px

aria snapshot (extracto) del grupo "Planes disponibles":
  - radio "Plan Plus Recomendado $ 1.320.000"
  - radio "Plan Total $ 1.815.000"
  - list "Coberturas": - listitem: Responsabilidad civil ...

320 country selection scrollWidth/clientWidth {"scrollW":320,"clientW":320}
320 first Tab focus on / : Chile | outline solid 3px rgb(0, 51, 160)
320 Colombia card box {"x":16,"y":347.77,"width":288,"height":76}
320 change-country box {"x":12,"y":74,"width":147,"height":44}
320 /co/form scrollWidth/clientWidth {"scrollW":320,"clientW":320}
320 first Tab on /co/form: <select ... id="f-co_documentType" ...
1280 country selection scrollWidth/clientWidth {"scrollW":1280,"clientW":1280}
1280 first Tab focus on / : Chile | outline solid 3px rgb(0, 51, 160)
1280 Colombia card box {"x":352,"y":464.34,"width":248,"height":76}
1280 change-country box {"x":84,"y":94,"width":154.39,"height":44}
1280 /co/form scrollWidth/clientWidth {"scrollW":1280,"clientW":1280}
  3 passed (9.1s)
```

## Checklist

| Área | Resultado | Notas |
|---|---|---|
| Cumple los REQ de la spec | ✅ | **REQ-01.36** (enlace en los pasos 1 a 3 y en la confirmación, `href="/"`, texto de Strapi, obligatorio, no borra datos, 147–154×44 px, foco visible): unit en `country-shell.spec.ts`, e2e AC-01.36 y sonda 2. **REQ-02.34** (clic en la cobertura o la descripción selecciona el plan, el radio nativo sigue siendo el único control, el nombre accesible no cambia): e2e AC-02.34, unit y sonda 2 (aria snapshot). Ver F-02.2 sobre la técnica. **REQ-01.33, REQ-02.29, REQ-03.36** (sin scroll horizontal): e2e a 320, 375 y 1280 px en verde, también con animaciones (sonda 1), y `/` a 320 px (sonda 2). Ver F-02.3 en la spec |
| Seguridad (tokens, permisos, datos) | ✅ | Sin tokens en el bundle (`grep` → exit 1). Fuente autoalojada desde `'self'`, versión fijada, lockfile con integrity, licencia OFL-1.1. El SVG no tiene script, enlaces ni texto. Los PNG no tienen metadatos de texto. La CSP no cambia y cubre los `data:` de los iconos de `select`/`date` (`img-src 'self' data:`). El backfill usa el Query Engine solo sobre el componente `ui.wizard-texts`, solo en campos vacíos y sin publicar. El rol público no cambia (POST/PUT/DELETE rechazados, `status=draft` → 400). `infra/` sin cambios. Los datos de las capturas son ficticios (`1234567890`, `ABC123`, "Marca A") |
| Angular moderno (standalone, signals, control flow, sin `any`) | ✅ | Sin `any`, `*ngIf`/`*ngFor` ni NgModules. Todos los componentes son OnPush. `RouterLink` importado en `country-shell.ts`. Los cambios de D12 y D13 son de presentación: clases, envoltorios y `[class.done]`, sin lógica nueva |
| Textos en código (G2-2) | ✅ | Ningún `content:` con texto. Ningún `alt`, `aria-label`, `title` ni `placeholder` literal. El logo tiene `alt=""` y su banda `aria-hidden="true"`. La ilustración tiene `alt=""` y el SVG `aria-hidden`. El enlace toma `wizard.changeCountryLabel`, y si falta se muestra el error genérico (test `REQ-01.36 REQ-01.13 …`) |
| Estados de carga / vacío / error | ✅ | El esqueleto es `aria-hidden`, sin texto, y sigue mostrando "cargando" con un solo `role="status"` dentro de `StatusMessage` (unit `REQ-01.3 D13 …`). Error y mensaje mantienen `role="alert"`. El "cargando" global sigue en su `role="status"` |
| Accesibilidad (contraste, foco, objetivos, movimiento) | ✅ con observaciones | El contraste AA se verifica en la tabla. Foco visible de 3 px `#0033A0` en el enlace "Cambiar de país" (Shift+Tab desde el h1) y en las tarjetas de país. Objetivos: enlace 147×44, tarjetas 288×76, radios y checkboxes 24×24, botones ≥ 48 px de alto. Todas las animaciones y transiciones se anulan con `prefers-reduced-motion` (regla global en `styles.css:330-345` y reglas locales en `app.css`, `status-message.ts` y `plans-step-page.css`). Ver F-02.2 y F-00.16 |
| Tests que validan comportamiento | ✅ con observación | Unit y e2e nuevos nombrados por AC/REQ/D (`AC-01.36 …`, `AC-02.34 …`, `D13 G2-2 …`, `REQ-01.3 D13 …`). El e2e de AC-02.34 hace un clic real con `page.mouse`, sin `force`. Ver F-00.15 (`reducedMotion`) |
| Trazabilidad (IDs en commits y tests) | ✅ con observaciones | Los 10 commits citan IDs. `docs/traceability.md` y `docs/qa/test-plan.md` están al día (AC-01.36, AC-02.34, totales 106/99). Ver F-02.3 (spec), F-00.17 (tipo de commit) y F-00.19 (capturas) |
| Mantenibilidad | ✅ con observaciones | Tokens coherentes en `styles.css`. Assets pequeños: logo de 21,8 kB a 640×118, que cubre 2× de su tamaño mostrado; SVG de 4,2 kB; fuente de 20 + 10 kB, la segunda solo bajo `unicode-range`. Budgets sin aviso. Ver F-00.18 y F-01.1 |

## Hallazgos

| ID | Severidad | Archivo:línea | Descripción | Evidencia | REQ / regla | Propuesta |
|---|---|---|---|---|---|---|
| F-00.15 | Minor | `e2e/playwright.config.ts:31-34`; `docs/qa/e2e-report.md:248-249` | La suite e2e se ejecuta siempre con `reducedMotion: 'reduce'`, de modo que el camino que ve la mayoría de los usuarios (animaciones activas) no tiene cobertura automatizada. Además, la causa que se documenta ("las animaciones … doblaron el tiempo … y empujaron las respuestas de Strapi más allá de 10 s") se presenta como un hecho, pero no se aisló: los fallos eran "error de carga" intermitentes en un host cargado, y el informe ya había documentado ese mismo síntoma antes de D13 (comentario del config: "with 4 workers real responses took up to 10.4 s"). | Sonda 1: con `reducedMotion: 'no-preference'` y el resto de la config igual, los 80 tests pasan, `42 passed (1.4m)` + `38 passed (1.1m)`. No oculta ningún defecto detectable hoy por la suite, pero la decisión y su justificación no se sostienen con la evidencia actual. | ADR-0007 (e2e contra la pila); `CLAUDE.md` §6 ("Ante un fallo, primero la causa"); config: "a flaky test is a defect to explain, not to hide" | Quitar `reducedMotion: 'reduce'` y volver a ejecutar la suite completa. Si vuelven los fallos intermitentes, atribuirlos con una medición (p. ej. la misma pasada con y sin `reduce`). Alternativa mínima: mantenerlo, añadir un proyecto sin `reduce` para `flow/` y reescribir la "Causa" de `e2e-report.md:248` como hipótesis no confirmada. |
| F-00.16 | Minor | `docs/decision-log.md:161-168` frente a `:174-230` | La prueba manual G5 (teclado y móvil, sin IA) se aprobó **antes** de D12–D15. Desde entonces cambiaron toda la presentación (controles con `appearance: none` en `select` y `date`, leyendas flotantes, anillos de foco, banda, animaciones) y el comportamiento (D14: enlace nuevo, tarjeta pulsable). La aprobación G5 registrada cubre otra interfaz. D14 menciona que el humano revisó la app ("Esta quedando muy bien"), pero no consta una comprobación con teclado y móvil. | Orden del log: G5 en la línea 161, D12 en la 174, D14 en la 203. Sin cambios en `docs/qa/manual-check.md` en el rango (`git diff --stat 95c2c0c..c4f5095` no lo incluye). Las comprobaciones de accesibilidad de esta review son automáticas (e2e y sondas), no manuales. | DoD de `CLAUDE.md` §9 (G5); REQ-02.26, REQ-02.27 (teclado); AC-01.28, AC-02.29 (móvil) | Repetir antes de G6 una pasada breve de G5 sobre la build actual: teclado (incluidos el enlace "Cambiar de país" y los planes) y móvil real a 375 px (el `date` sin apariencia nativa y el `select` con chevron propio en iOS y Android). Registrarla en `docs/qa/manual-check.md`. O aceptar el riesgo de forma explícita en G4. |
| F-02.2 | Minor | `frontend/src/app/features/plans-step/plans-step-page.css:114-119` | REQ-02.34 se implementa con un `label::after` absoluto que cubre toda la tarjeta. Cumple el REQ, pero desvía todo el hit testing del contenido hacia el `label`. Consecuencias: (1) la descripción, las coberturas y los beneficios no se pueden seleccionar ni copiar con el ratón (el propio comentario lo reconoce como trade-off); (2) un lector de pantalla con exploración táctil (TalkBack/VoiceOver), que usa el hit testing del navegador, al tocar una cobertura cae en el radio y el label en vez de leer la cobertura. Las listas siguen accesibles con gestos de desplazamiento y con el cursor virtual. El punto (2) es una inferencia desde el hit testing; no se ha probado en un dispositivo. | Sonda 2: `elementFromPoint(centro de "Hurto" de Plan Total) = LABEL class="plan-label"`. `e2e/tests/flow/change-country-and-plan-card.spec.ts:26-28`: "`locator.click()` refuses because the label intercepts the pointer". El nombre accesible y el teclado no cambian (aria snapshot: `radio "Plan Total $ 1.815.000"`). | REQ-02.34 (cumplido); REQ-02.26 y REQ-02.27 (sin regresión); buena práctica de accesibilidad móvil | Decidir en G4. (a) **Aceptar** el trade-off, documentándolo en la spec o en `manual-check.md`. (b) Sustituir el overlay por un `(click)` en `.plan` que llame a `select(id)` cuando el objetivo no es el `input` ni el `label`. El radio sigue siendo el único control de teclado (el `div` no necesita foco), el texto se puede seleccionar y la exploración táctil lee el contenido. El e2e de AC-02.34 valdría sin cambios. |
| F-02.3 | Minor | `specs/US-02/spec.md:370-381` | El bloque Gherkin de AC-02.34 se insertó **entre los dos escenarios de AC-02.33**. El segundo escenario de AC-02.33 ("A step text and the generic error message are missing in Strapi") queda ahora bajo el comentario `# AC-02.34 — origen: D14`. Quien navegue por IDs (`grep "AC-02.34"`) atribuye a D14 un escenario que es de G2-2, y AC-02.33 parece tener un solo escenario, aunque `docs/qa/test-plan.md` dice "`cst › AC-02.33 …` (dos escenarios)". | `sed -n 355,385p specs/US-02/spec.md`: línea 360 `# AC-02.33`, escenario 1; línea 370 `# AC-02.34`, escenario de la tarjeta; línea 375 `Scenario: A step text and the generic error message are missing in Strapi`, que es el segundo de AC-02.33. | Skill `sdd-traceability` §1 y §5 (trazabilidad por `grep`); la spec es la fuente de verdad (`CLAUDE.md` §2) | Mover el bloque `# AC-02.34` detrás del segundo escenario de AC-02.33 (justo antes del cierre del bloque de código). Es un cambio editorial, sin cambio de contenido, que se anota en el historial de la spec. |
| F-00.17 | Nit | commit `47443de` | El asunto usa el tipo `specs:`, que no es un tipo de Conventional Commits. La convención del repo para specs es `docs(specs): …` (Skill §4; historial: `2c34185`, `8ca08f7`, `5a28ea2`, …). | `git show --stat 47443de` → `specs: add change-country link and clickable plan card after G5 [...]` | `CLAUDE.md` §6–7 (Conventional Commits, scopes) | No reescribir la historia: el commit ya forma parte de la rama. Basta con anotarlo y aplicar la convención en adelante. |
| F-00.18 | Nit | `frontend/src/app/features/wizard-shell/step-indicator.ts:96`; `frontend/src/app/shared/status-message.ts:75`, `:89-97`; `frontend/src/app/features/plans-step/plans-step-page.css:170-177`; `frontend/src/app/features/summary-step/summary-step-page.css:169-175`; `frontend/src/app/features/country-selection/country-selection-page.ts:51` | Pequeñas incoherencias con el sistema de tokens. (1) El halo del paso actual es un literal `rgb(45 109 246 / 0.25)` que casi duplica `--focus-halo` (`0.22`, `styles.css:29`). (2) Los colores del esqueleto (`#e6edfa`) no son token. (3) El panel "borde izquierdo de 4 px + radio + fondo" se repite en tres componentes. (4) La clase `countries` ya no tiene estilos (se borró `.countries` y lo usa `.country-links`), y ningún test la usa (`grep` en `frontend/src` y `e2e/`). | `grep -n "rgb(45 109 246\|#e6edfa\|border-left: 4px" -r frontend/src/app` → las 4 líneas citadas | `CLAUDE.md` §8 (mantenibilidad); comentario de `styles.css:3` ("components reuse them") | Usar `var(--focus-halo)` o un token `--halo-current`; añadir `--color-skeleton`; extraer el panel a una clase global (p. ej. `.panel`, `.panel--error`); quitar `countries` del `ul`. Ninguno es urgente. |
| F-00.19 | Nit | `docs/assets/screenshots/*.png` (añadidas en `1d1c668`/`db808c1`) | Las capturas son anteriores a D14: no muestran el enlace "Cambiar de país" (p. ej. `04b-plans-selected-1280.png`, donde el indicador de pasos empieza justo bajo la banda). El README de `e54001a` las usa como imagen del producto. | Lectura de `docs/assets/screenshots/04b-plans-selected-1280.png` | Coherencia de la documentación de entrega (G6) | Regenerar las capturas con la build actual, o anotar que son de D13. |
| F-01.1 | Nit | `cms/src/seed/seed.ts:234` | Desde el backfill, el resumen final del seed (`"... already present (left untouched)"`) puede ser falso: en el arranque que rellena `changeCountryLabel`, los países existentes **sí** se modifican. Además, el backfill no tiene test automático: su corrección se apoya en la respuesta de C3 y en los logs. | `seed.ts:172` llama a `backfillWizardTexts` para un país existente, y `:158` hace `update`. La línea 234 no lo refleja. Log actual: `done: 0 created, 30 already present (left untouched)` | `CLAUDE.md` §8 ("Seed … idempotentes"); `CLAUDE.md` §6 (evidencia real) | Cambiar el texto a `already present (content kept; see backfill lines)` o contar los backfills en `Counters`. El test del backfill es opcional, porque `cms/` no tiene runner de tests; el humano decide. |

No hay hallazgos `F-03.n`: los cambios en US-03 son solo de estilo (`summary-step-page.css`, `confirmation-page.ts`). La sonda 1 los cubre (AC-03.35 a 320, 375 y 1280 px en verde, con y sin animaciones), igual que la tabla de contraste.

### Qué se revisó y no dio hallazgo

- **Seguridad del rango:** dependencia nueva, assets, CSP, ausencia de URLs externas en CSS, HTML y SVG, tokens, `infra/` sin cambios, permisos del rol público, backfill (Query Engine sobre la fila del componente, borrador y publicado por separado, solo campos vacíos, sin `publish`, idempotente).
- **G2-2:** sin texto nuevo en código, en ninguna de sus formas.
- **Decorativos:** la banda es `<header aria-hidden="true">` fuera de `<main>`, con logo `alt=""` y `width`/`height` declarados (unit `D13 G2-2 …`); la ilustración, `alt=""` + `aria-hidden` en el SVG; el chevron, el pin, el check y los puntos, pseudo-elementos con `content: ''`; el esqueleto, `aria-hidden` y sin texto.
- **Indicador de pasos:** el estado no depende solo del color (actual: negrita + halo + `aria-current="step"`; hecho: check dibujado; el dígito sigue `aria-hidden`).
- **Movimiento:** cada `animation`/`transition` nueva tiene su anulación con `prefers-reduced-motion`.
- **Scroll horizontal:** la banda a sangre usa `border-image` con *outset*, que es *ink overflow* y no añade scroll. Comprobado: `scrollWidth === clientWidth` a 320 y 1280 px en `/` y `/co/form`.
- **Observación sin hallazgo:** al llegar a cada paso, el foco va al `h1` (ADR-0004) y el enlace "Cambiar de país" queda antes en el DOM, así que con teclado se alcanza con Shift+Tab, no con Tab (sonda 2: el primer Tab desde `/co/form` va al primer `select`). El orden de foco sigue el visual (WCAG 2.4.3) y REQ-01.36 solo exige que sea operable con teclado, así que no se reporta como defecto.

## Tabla de hallazgos para el triage (G4)

| ID | Severidad | Resumen | Estado |
|---|---|---|---|
| F-00.15 | Minor | `reducedMotion: 'reduce'` en el e2e sin causa aislada; la suite pasa 80/80 con animaciones | Open |
| F-00.16 | Minor | G5 manual aprobada antes de D12–D15; no hay comprobación manual de la interfaz actual | Open |
| F-02.2 | Minor | El overlay `label::after` de REQ-02.34 impide seleccionar texto y desvía la exploración táctil al radio | Open |
| F-02.3 | Minor | AC-02.34 insertado entre los dos escenarios de AC-02.33 en la spec | Open |
| F-00.17 | Nit | Commit `47443de` con tipo `specs:` en lugar de `docs(specs):` | Open |
| F-00.18 | Nit | Literales de color fuera de tokens, panel repetido y clase `countries` sin uso | Open |
| F-00.19 | Nit | Capturas de `docs/assets/screenshots/` anteriores a D14 | Open |
| F-01.1 | Nit | El log final del seed dice "left untouched" aunque el backfill escriba; backfill sin test | Open |

## Resolución (se completa tras G4)

| ID | Decisión humana | Estado | Commit / motivo |
|---|---|---|---|
| F-00.15 | | Open | |
| F-00.16 | | Open | |
| F-02.2 | | Open | |
| F-02.3 | | Open | |
| F-00.17 | | Open | |
| F-00.18 | | Open | |
| F-00.19 | | Open | |
| F-01.1 | | Open | |

## Re-review

Pendiente de las correcciones que se decidan en G4.
