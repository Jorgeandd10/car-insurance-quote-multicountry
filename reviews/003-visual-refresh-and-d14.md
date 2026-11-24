# Review 003 — Visual style (D12, D13), change country and clickable card (D14), favicon (D15)

| Field | Value |
|---|---|
| Reviewer | Code Reviewer (subagent), model: Claude Opus 5.5 (`claude-opus-5-5`) |
| Date | 2026-11-23 |
| Scope | `git diff 95c2c0c..c4f5095` (branch `style/sura-visual-refresh`, 10 commits: `fe5c56c`, `1d1c668`, `792119b`, `db808c1`, `47443de`, `63ca979`, `3bd348e`, `60311e5`, `af53c7e`, `c4f5095`) · 54 files: `frontend/` (styles, shell, assets, dependency), `cms/` (field and backfill), `e2e/`, `specs/US-01`, `specs/US-02`, `docs/`. Out of scope: `e54001a` (README and FLOW, after `c4f5095`; docs only, does not touch `frontend/` or `cms/`) |
| Reference specs / ADRs | `specs/US-01/spec.md` v0.4 (REQ-01.33, REQ-01.36, AC-01.36), `specs/US-02/spec.md` v0.4 (REQ-02.26, REQ-02.27, REQ-02.29, REQ-02.34, AC-02.34), `specs/US-03/spec.md` (REQ-03.36); ADR-0001, ADR-0003, ADR-0004, ADR-0007; `docs/architecture/content-model.md`, `api-contracts.md`; `docs/decision-log.md` (D12, D13, D14, D15, G2-2, G3-5); `CLAUDE.md` |
| Verdict | **Approved with changes** (0 Blocker, 0 Major; 4 Minor and 4 Nit for triage in G4) |

## Commands run

All of them are read, build or test commands. The build writes to `frontend/dist/` (ignored by git). The reviewer's Playwright probes were written and run from the session scratchpad, outside the repo, with their artefact output also outside the repo. `git status` clean at the start and at the end (except for this report).

### Scope

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

`e54001a` only changes documentation, so the build and the tests run on the current tree are equivalent to `c4f5095` in `frontend/` and `cms/`.

### Build, unit tests and formatting (in `frontend/`)

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

No budget warnings (`initial` 500 kB / 1 MB; `anyComponentStyle` 4 kB / 8 kB in `angular.json:34-45`). The `index.html` served on `:8080` references `main-SOBT4VEK.js` and `styles-NTDGXMFB.css`, the same hashes as the local build: the running stack corresponds to the reviewed code.

### Assets, font and CSP against the stack (`http://localhost:8080`)

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
[... same CSP ...]
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

[reviewer's note: the output is trimmed only in the repeated CSP header, identical in the 8 responses. `does-not-exist.png` → `index.html` is the `try_files $uri /index.html` that predates this range (`infra/nginx/default.conf:74-75`), unchanged here.]

```text
$ grep -o "@font-face{[^}]*}" dist/car-insurance-quote/browser/styles-*.css
@font-face{font-family:Figtree Variable;font-style:normal;font-display:swap;font-weight:300 900;src:url("./media/figtree-latin-ext-wght-normal-O22BDGD7.woff2") format("woff2-variations");unicode-range:U+0100-02BA,...}
@font-face{font-family:Figtree Variable;font-style:normal;font-display:swap;font-weight:300 900;src:url("./media/figtree-latin-wght-normal-SOXVSX3R.woff2") format("woff2-variations");unicode-range:U+0000-00FF,...}

$ grep -rnoE "https?://[a-zA-Z0-9./_-]+" dist/car-insurance-quote/browser --include=*.css --include=*.html --include=*.svg
dist/car-insurance-quote/browser/illustrations/car-protection.svg:1:http://www.w3.org/2000/svg

$ grep -nE "<text|<script|href|xlink|on[a-z]+=|<foreignObject|<title|<desc|url\(http" public/illustrations/car-protection.svg
[no output]

$ file public/favicon.ico public/brand/*.png
public/favicon.ico:                MS Windows icon resource - 1 icon, 32x32 with PNG image data, 32 x 32, 8-bit/color RGBA, non-interlaced, 32 bits/pixel
public/brand/apple-touch-icon.png: PNG image data, 180 x 180, 8-bit/color RGBA, non-interlaced
public/brand/icon-192.png:         PNG image data, 192 x 192, 8-bit/color RGBA, non-interlaced
public/brand/icon-32.png:          PNG image data, 32 x 32, 8-bit/color RGBA, non-interlaced
public/brand/sura-logo-white.png:  PNG image data, 640 x 118, 8-bit/color RGBA, non-interlaced
[tEXt/iTXt/zTXt/eXIf chunks in the 4 PNGs: none (read-only Python script)]

$ npm ls @fontsource-variable/figtree
car-insurance-quote@0.0.0 C:\Users\Jorge Andres\Documents\_SURA\car-insurance-quote-multicountry\frontend
`-- @fontsource-variable/figtree@5.3.0

$ head -5 node_modules/@fontsource-variable/figtree/LICENSE
Copyright 2022 The Figtree Project Authors (https://github.com/erikdkennedy/figtree) Figtree-Italic[wght].ttf: Copyright 2022 The Figtree Project Authors (https://github.com/erikdkennedy/figtree)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
```

`package.json` pins `"@fontsource-variable/figtree": "5.3.0"` (without `^`), and `package-lock.json` records `resolved` on `registry.npmjs.org`, `integrity sha512-VRVo…` and `"license": "OFL-1.1"`. The justification is in D13 and in the body of `db808c1`.

### Secrets and code rules (`frontend/`)

```text
$ grep -rnE "content:\s*['\"][^'\"]+['\"]" src --include=*.css --include=*.ts
[no output]
$ grep -rnE "\balt=\"[^\"]+\"|\baria-label=\"|\btitle=\"|placeholder=\"" src --include=*.html --include=*.ts
[no output]
$ grep -rnE ":\s*any\b|<any>|as any|\*ngIf|\*ngFor|NgModule" src --include=*.ts --include=*.html
[no output]
$ grep -rl "@Component" src/app --include=*.ts | grep -v spec | while read f; do grep -q "OnPush" "$f" || echo "NO OnPush: $f"; done
[no output]
$ grep -rlE "Bearer|api_token|APP_KEYS|JWT_SECRET|ADMIN_JWT" dist/car-insurance-quote/browser; echo "exit $?"
exit 1
```

### Strapi: backfill and public role

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

The container's last start writes nothing (there are no `wizardTexts backfilled` lines): the backfill had already been applied and is idempotent. `git diff 95c2c0c..c4f5095 --stat -- cms/` only touches `wizard-texts.json`, `seed/data/{co,cl}.ts` and `seed/seed.ts`; the public role permissions do not change. There is no local `tsc` in `cms/` (`npx tsc` asks to install TypeScript), so the typing of the seed is backed only by the container starting with that code.

### WCAG contrast of the pairs in use

Node script in the scratchpad with the WCAG 2.x relative luminance formula:

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

All the values match the comments in `frontend/src/styles.css:12-35`. The pairs below 4.5:1 are justified:

- `#2d6df6` on `#dfeaff` (3.75): only in the `h1`, at 32 px or more and weight 800, so it is large text (≥ 3:1).
- `#0b5fff` on `#dfeaff` (4.24): there is no `<a>` on the light blue surface. The "Cambiar de país" link uses `#0033a0`, and the country cards are white.
- `#2d6df6` on `#f5f8ff` (4.27): not used as a text colour.
- `#e3eaf7` (1.21): decorative card border. The control is the native radio.
- `#0033a0` versus `#2d6df6` (2.34): with `outline-offset: 2px`, the focus ring sits on white or on the surface, not against the primary.

### E2E of the change and reviewer probes (Playwright, system Chrome, stack on `:8080`)

```text
$ cd e2e && npx playwright test tests/flow/change-country-and-plan-card.spec.ts --reporter=line --output <scratchpad>/pw-out
Running 3 tests using 2 workers
[1/3] [flow] › tests\flow\change-country-and-plan-card.spec.ts:38:3 › D14 change country link (US-01) › AC-01.36 the "change country" link goes back to the country selection and the step 1 data is kept
[2/3] [flow] › tests\flow\change-country-and-plan-card.spec.ts:80:3 › D14 change country link (US-01) › AC-01.36 the "change country" link is on the plans, summary and confirmation screens
[3/3] [flow] › tests\flow\change-country-and-plan-card.spec.ts:116:3 › D14 whole plan card selects the plan (US-02) › AC-02.34 clicking anywhere on a plan card selects the plan
  3 passed (16.5s)
```

**Probe 1: the suite with animations.** Scratchpad config identical to `e2e/playwright.config.ts` (2 workers, 0 retries, timeouts 60 s / 15 s, Chrome, es-CO, America/Bogota, 1280×900), with `reducedMotion: 'no-preference'` and the same `tests/`:

```text
$ npx playwright test -c <scratchpad>/motion.config.mjs          # proyectos flow + a11y-responsive
  42 passed (1.4m)
real	1m30.031s

$ npx playwright test -c <scratchpad>/motion2.config.mjs         # proyectos states + content-changes
Running 38 tests using 2 workers
  38 passed (1.1m)
real	1m11.674s
```

**Probe 2: hit testing, focus, scroll and sizes.** Scratchpad script that imports `e2e/support/fixtures.ts`:

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

| Area | Result | Notes |
|---|---|---|
| Meets the REQs of the spec | ✅ | **REQ-01.36** (link on steps 1 to 3 and on the confirmation, `href="/"`, text from Strapi, required, does not delete data, 147–154×44 px, visible focus): unit in `country-shell.spec.ts`, e2e AC-01.36 and probe 2. **REQ-02.34** (a click on the coverage or the description selects the plan, the native radio is still the only control, the accessible name does not change): e2e AC-02.34, unit and probe 2 (aria snapshot). See F-02.2 about the technique. **REQ-01.33, REQ-02.29, REQ-03.36** (no horizontal scroll): e2e at 320, 375 and 1280 px green, also with animations (probe 1), and `/` at 320 px (probe 2). See F-02.3 in the spec |
| Security (tokens, permissions, data) | ✅ | No tokens in the bundle (`grep` → exit 1). Self-hosted font from `'self'`, pinned version, lockfile with integrity, OFL-1.1 licence. The SVG has no script, links or text. The PNGs have no text metadata. The CSP does not change and covers the `data:` icons of `select`/`date` (`img-src 'self' data:`). The backfill uses the Query Engine only on the `ui.wizard-texts` component, only on empty fields and without publishing. The public role does not change (POST/PUT/DELETE rejected, `status=draft` → 400). `infra/` unchanged. The data in the screenshots is fictitious (`1234567890`, `ABC123`, "Marca A") |
| Modern Angular (standalone, signals, control flow, no `any`) | ✅ | No `any`, `*ngIf`/`*ngFor` or NgModules. Every component is OnPush. `RouterLink` imported in `country-shell.ts`. The D12 and D13 changes are presentational: classes, wrappers and `[class.done]`, no new logic |
| Texts in code (G2-2) | ✅ | No `content:` with text. No literal `alt`, `aria-label`, `title` or `placeholder`. The logo has `alt=""` and its band `aria-hidden="true"`. The illustration has `alt=""` and the SVG `aria-hidden`. The link takes `wizard.changeCountryLabel`, and if it is missing the generic error is shown (test `REQ-01.36 REQ-01.13 …`) |
| Loading / empty / error states | ✅ | The skeleton is `aria-hidden`, without text, and still shows "cargando" with a single `role="status"` inside `StatusMessage` (unit `REQ-01.3 D13 …`). Error and message keep `role="alert"`. The global "cargando" stays in its `role="status"` |
| Accessibility (contrast, focus, targets, motion) | ✅ with observations | AA contrast is verified in the table. Visible 3 px `#0033A0` focus on the "Cambiar de país" link (Shift+Tab from the h1) and on the country cards. Targets: link 147×44, cards 288×76, radios and checkboxes 24×24, buttons ≥ 48 px high. Every animation and transition is cancelled with `prefers-reduced-motion` (global rule in `styles.css:330-345` and local rules in `app.css`, `status-message.ts` and `plans-step-page.css`). See F-02.2 and F-00.16 |
| Tests that validate behaviour | ✅ with observation | New unit and e2e tests named by AC/REQ/D (`AC-01.36 …`, `AC-02.34 …`, `D13 G2-2 …`, `REQ-01.3 D13 …`). The AC-02.34 e2e makes a real click with `page.mouse`, without `force`. See F-00.15 (`reducedMotion`) |
| Traceability (IDs in commits and tests) | ✅ with observations | The 10 commits cite IDs. `docs/traceability.md` and `docs/qa/test-plan.md` are up to date (AC-01.36, AC-02.34, totals 106/99). See F-02.3 (spec), F-00.17 (commit type) and F-00.19 (screenshots) |
| Maintainability | ✅ with observations | Consistent tokens in `styles.css`. Small assets: 21.8 kB logo at 640×118, which covers 2× its displayed size; 4.2 kB SVG; 20 + 10 kB font, the second only under `unicode-range`. Budgets without warnings. See F-00.18 and F-01.1 |

## Findings

| ID | Severity | File:line | Description | Evidence | REQ / rule | Proposal |
|---|---|---|---|---|---|---|
| F-00.15 | Minor | `e2e/playwright.config.ts:31-34`; `docs/qa/e2e-report.md:248-249` | The e2e suite always runs with `reducedMotion: 'reduce'`, so the path most users see (animations on) has no automated coverage. Besides, the documented cause ("the animations … doubled the time … and pushed the Strapi responses beyond 10 s") is presented as a fact, but it was not isolated: the failures were intermittent "error de carga" on a loaded host, and the report had already documented that same symptom before D13 (config comment: "with 4 workers real responses took up to 10.4 s"). | Probe 1: with `reducedMotion: 'no-preference'` and the rest of the config unchanged, the 80 tests pass, `42 passed (1.4m)` + `38 passed (1.1m)`. It hides no defect the suite can detect today, but the decision and its justification are not supported by the current evidence. | ADR-0007 (e2e against the stack); `CLAUDE.md` §6 ("On a failure, the cause first"); config: "a flaky test is a defect to explain, not to hide" | Remove `reducedMotion: 'reduce'` and run the full suite again. If the intermittent failures come back, attribute them with a measurement (e.g. the same run with and without `reduce`). Minimal alternative: keep it, add a project without `reduce` for `flow/` and rewrite the "Cause" of `e2e-report.md:248` as an unconfirmed hypothesis. |
| F-00.16 | Minor | `docs/decision-log.md:161-168` versus `:174-230` | The G5 manual test (keyboard and mobile, without AI) was approved **before** D12–D15. Since then the whole presentation has changed (controls with `appearance: none` on `select` and `date`, floating legends, focus rings, band, animations) and so has the behaviour (D14: new link, clickable card). The recorded G5 approval covers a different interface. D14 mentions that the human reviewed the app ("Esta quedando muy bien", "It's looking very good"), but there is no record of a keyboard and mobile check. | Log order: G5 on line 161, D12 on 174, D14 on 203. No changes to `docs/qa/manual-check.md` in the range (`git diff --stat 95c2c0c..c4f5095` does not include it). The accessibility checks of this review are automated (e2e and probes), not manual. | DoD of `CLAUDE.md` §9 (G5); REQ-02.26, REQ-02.27 (keyboard); AC-01.28, AC-02.29 (mobile) | Before G6, repeat a short G5 pass on the current build: keyboard (including the "Cambiar de país" link and the plans) and a real mobile at 375 px (the `date` without native appearance and the `select` with its own chevron on iOS and Android). Record it in `docs/qa/manual-check.md`. Or accept the risk explicitly in G4. |
| F-02.2 | Minor | `frontend/src/app/features/plans-step/plans-step-page.css:114-119` | REQ-02.34 is implemented with an absolute `label::after` that covers the whole card. It meets the REQ, but it diverts all the hit testing of the content to the `label`. Consequences: (1) the description, the coverages and the benefits cannot be selected or copied with the mouse (the comment itself acknowledges it as a trade-off); (2) a screen reader with touch exploration (TalkBack/VoiceOver), which uses the browser's hit testing, lands on the radio and the label when touching a coverage instead of reading the coverage. The lists are still accessible with swipe gestures and with the virtual cursor. Point (2) is an inference from the hit testing; it has not been tested on a device. | Probe 2: `elementFromPoint(centre of "Hurto" of Plan Total) = LABEL class="plan-label"`. `e2e/tests/flow/change-country-and-plan-card.spec.ts:26-28`: "`locator.click()` refuses because the label intercepts the pointer". The accessible name and the keyboard do not change (aria snapshot: `radio "Plan Total $ 1.815.000"`). | REQ-02.34 (met); REQ-02.26 and REQ-02.27 (no regression); mobile accessibility good practice | Decide in G4. (a) **Accept** the trade-off, documenting it in the spec or in `manual-check.md`. (b) Replace the overlay with a `(click)` on `.plan` that calls `select(id)` when the target is neither the `input` nor the `label`. The radio stays the only keyboard control (the `div` does not need focus), the text can be selected and touch exploration reads the content. The AC-02.34 e2e would remain valid unchanged. |
| F-02.3 | Minor | `specs/US-02/spec.md:370-381` | The Gherkin block of AC-02.34 was inserted **between the two scenarios of AC-02.33**. The second scenario of AC-02.33 ("A step text and the generic error message are missing in Strapi") now sits under the comment `# AC-02.34 — origen: D14`. Anyone navigating by IDs (`grep "AC-02.34"`) attributes to D14 a scenario that belongs to G2-2, and AC-02.33 seems to have a single scenario, although `docs/qa/test-plan.md` says "`cst › AC-02.33 …` (two scenarios)". | `sed -n 355,385p specs/US-02/spec.md`: line 360 `# AC-02.33`, scenario 1; line 370 `# AC-02.34`, the card scenario; line 375 `Scenario: A step text and the generic error message are missing in Strapi`, which is the second one of AC-02.33. | `sdd-traceability` Skill §1 and §5 (traceability by `grep`); the spec is the source of truth (`CLAUDE.md` §2) | Move the `# AC-02.34` block after the second scenario of AC-02.33 (just before the end of the code block). It is an editorial change, with no content change, noted in the spec history. |
| F-00.17 | Nit | commit `47443de` | The subject uses the type `specs:`, which is not a Conventional Commits type. The repo convention for specs is `docs(specs): …` (Skill §4; history: `2c34185`, `8ca08f7`, `5a28ea2`, …). | `git show --stat 47443de` → `specs: add change-country link and clickable plan card after G5 [...]` | `CLAUDE.md` §6–7 (Conventional Commits, scopes) | Do not rewrite history: the commit is already part of the branch. It is enough to note it and apply the convention from now on. |
| F-00.18 | Nit | `frontend/src/app/features/wizard-shell/step-indicator.ts:96`; `frontend/src/app/shared/status-message.ts:75`, `:89-97`; `frontend/src/app/features/plans-step/plans-step-page.css:170-177`; `frontend/src/app/features/summary-step/summary-step-page.css:169-175`; `frontend/src/app/features/country-selection/country-selection-page.ts:51` | Small inconsistencies with the token system. (1) The halo of the current step is a literal `rgb(45 109 246 / 0.25)` that almost duplicates `--focus-halo` (`0.22`, `styles.css:29`). (2) The skeleton colours (`#e6edfa`) are not a token. (3) The "4 px left border + radius + background" panel is repeated in three components. (4) The `countries` class no longer has styles (`.countries` was deleted and `.country-links` is used instead), and no test uses it (`grep` in `frontend/src` and `e2e/`). | `grep -n "rgb(45 109 246\|#e6edfa\|border-left: 4px" -r frontend/src/app` → the 4 lines quoted | `CLAUDE.md` §8 (maintainability); comment in `styles.css:3` ("components reuse them") | Use `var(--focus-halo)` or a `--halo-current` token; add `--color-skeleton`; extract the panel into a global class (e.g. `.panel`, `.panel--error`); remove `countries` from the `ul`. None of them is urgent. |
| F-00.19 | Nit | `docs/assets/screenshots/*.png` (added in `1d1c668`/`db808c1`) | The screenshots predate D14: they do not show the "Cambiar de país" link (e.g. `04b-plans-selected-1280.png`, where the step indicator starts right below the band). The README of `e54001a` uses them as the product image. | Reading of `docs/assets/screenshots/04b-plans-selected-1280.png` | Consistency of the delivery documentation (G6) | Regenerate the screenshots with the current build, or note that they are from D13. |
| F-01.1 | Nit | `cms/src/seed/seed.ts:234` | Since the backfill, the seed's final summary (`"... already present (left untouched)"`) can be false: on the start that fills `changeCountryLabel`, the existing countries **are** modified. Besides, the backfill has no automated test: its correctness relies on the C3 response and the logs. | `seed.ts:172` calls `backfillWizardTexts` for an existing country, and `:158` does an `update`. Line 234 does not reflect it. Current log: `done: 0 created, 30 already present (left untouched)` | `CLAUDE.md` §8 ("Seed … idempotent"); `CLAUDE.md` §6 (real evidence) | Change the text to `already present (content kept; see backfill lines)` or count the backfills in `Counters`. The backfill test is optional, because `cms/` has no test runner; the human decides. |

There are no `F-03.n` findings: the changes in US-03 are style only (`summary-step-page.css`, `confirmation-page.ts`). Probe 1 covers them (AC-03.35 at 320, 375 and 1280 px green, with and without animations), as does the contrast table.

### What was reviewed with no finding

- **Security of the range:** new dependency, assets, CSP, no external URLs in CSS, HTML and SVG, tokens, `infra/` unchanged, public role permissions, backfill (Query Engine on the component row, draft and published separately, only empty fields, no `publish`, idempotent).
- **G2-2:** no new text in code, in any of its forms.
- **Decorative elements:** the band is a `<header aria-hidden="true">` outside `<main>`, with logo `alt=""` and declared `width`/`height` (unit `D13 G2-2 …`); the illustration, `alt=""` + `aria-hidden` on the SVG; the chevron, the pin, the check and the dots, pseudo-elements with `content: ''`; the skeleton, `aria-hidden` and without text.
- **Step indicator:** the state does not depend on colour alone (current: bold + halo + `aria-current="step"`; done: drawn check; the digit stays `aria-hidden`).
- **Motion:** every new `animation`/`transition` has its `prefers-reduced-motion` override.
- **Horizontal scroll:** the full-bleed band uses `border-image` with *outset*, which is *ink overflow* and adds no scroll. Checked: `scrollWidth === clientWidth` at 320 and 1280 px on `/` and `/co/form`.
- **Observation without a finding:** on reaching each step, focus goes to the `h1` (ADR-0004) and the "Cambiar de país" link comes earlier in the DOM, so with the keyboard it is reached with Shift+Tab, not with Tab (probe 2: the first Tab from `/co/form` goes to the first `select`). The focus order follows the visual order (WCAG 2.4.3) and REQ-01.36 only requires it to be keyboard operable, so it is not reported as a defect.

## Findings table for the triage (G4)

| ID | Severity | Summary | Status |
|---|---|---|---|
| F-00.15 | Minor | `reducedMotion: 'reduce'` in the e2e without an isolated cause; the suite passes 80/80 with animations | Open |
| F-00.16 | Minor | Manual G5 approved before D12–D15; there is no manual check of the current interface | Open |
| F-02.2 | Minor | The REQ-02.34 `label::after` overlay prevents text selection and diverts touch exploration to the radio | Open |
| F-02.3 | Minor | AC-02.34 inserted between the two scenarios of AC-02.33 in the spec | Open |
| F-00.17 | Nit | Commit `47443de` with type `specs:` instead of `docs(specs):` | Open |
| F-00.18 | Nit | Colour literals outside tokens, repeated panel and unused `countries` class | Open |
| F-00.19 | Nit | Screenshots in `docs/assets/screenshots/` predate D14 | Open |
| F-01.1 | Nit | The seed's final log says "left untouched" even when the backfill writes; backfill without a test | Open |

## Resolution

Human G4 decisions in [`docs/decision-log.md`](../docs/decision-log.md), section "G4 — Triage of review 003" (literal reason: "Apruebo ambos", "I approve both"). The human answered with the "Apruebo ambos" button of the next-step box (triage + English documentation); the orchestrator records the button text as the literal answer. Accepted findings are closed; the fixes are in progress and the orchestrator closes them with the SHA of each fix.

| ID | Human decision | Status | Commit / reason |
|---|---|---|---|
| F-00.15 | Fix: remove `reducedMotion` from the e2e config, re-run the full suite and correct the e2e report (the cause was not isolated) | Fixed | `bb34dab` (config + e2e report); final run 80/80 with animations |
| F-00.16 | Fix: the human repeats a short G5 on the current UI | Fixed | Human: "G5 OK" (`docs/qa/manual-check.md`) |
| F-02.2 | Accept | Accepted | Side effect of the whole-card click the human asked for (D14); keyboard and accessible name unchanged |
| F-02.3 | Fix: misplaced scenario in US-02 | Fixed | `43e681e` |
| F-00.17 | Accept | Accepted | Fixing it would rewrite Git history |
| F-00.18 | Accept | Accepted | Minor CSS cleanup, no impact |
| F-00.19 | Fix: retake the README screenshots | Fixed | `f97a837` |
| F-01.1 | Fix the misleading seed log message; accept the missing backfill test (verified for real on an existing and an empty volume) | Fixed (log) / Accepted (test) | `795cde5` |

## Re-review

Verified by the orchestrator after the G4 fixes (2026-11-23):

- F-00.15: `reducedMotion` is no longer in `e2e/playwright.config.ts`. Final full run on an idle machine: `npx playwright test --reporter=line` → `80 passed (8.3m)`.
- F-02.3: the `# AC-02.34` block now follows both AC-02.33 scenarios in `specs/US-02/spec.md`.
- F-00.19: the README screenshots were retaken after D14 and show the "Cambiar de país" link.
- F-01.1: the seed summary log now reads "content kept; see backfill lines above for any filled-in field".
- F-00.16: the human repeated a short G5 on the current UI: "G5 OK" (`docs/qa/manual-check.md`).
