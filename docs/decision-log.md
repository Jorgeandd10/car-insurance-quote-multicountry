# Decision log

Record of the human decisions taken at each gate. Each entry keeps the proposal, the verdict and the human's **literal** reason.

- Statuses: `Approved` · `Rejected` · `Modified` · `Superseded`.
- An approved decision is not changed without a new entry that references it and explains the change.
- Rejections at any gate are recorded here with the feedback for the producing agent.

## G0 — Strategy (Phase 1)

- Date: 2026-11-22
- Approver: Jorge (human)
- Source of the proposals: [`docs/phase-1/analysis.md`](phase-1/analysis.md), section 7, and the review done in the local Claude Code session (verification of the environment and of official sources).

| # | Decision | Approved resolution | Status | Human's literal reason |
|---|---|---|---|---|
| D1 | Work environment and repo | Local Claude Code on the human's own private GitHub repository | Modified (visibility: see "D1 change") | "D1 ya está decidida por mí: trabajamos en Claude Code local sobre este repositorio GitHub privado." (*D1 is already decided by me: we work in local Claude Code on this private GitHub repository.*) |
| D2 | Angular version | Angular 22 (22.3.0 as of 2026-11-22) | Approved | "Apruebo todas" (*I approve all*) |
| D3 | Multi-country strategy | `Country` collection + relations (no Strapi i18n); country in the URL (`/co`, `/cl`) | Approved | "Apruebo todas" (*I approve all*) |
| D4 | Access to Strapi | Public role only `find`/`findOne` + GET-only nginx proxy with allowlist; no tokens in the browser and no BFF | Approved | "Apruebo todas" (*I approve all*) |
| D5 | Forms | **Signal Forms** (stable in v22). Documented in an ADR | Approved (recommendation modified before the gate, see note) | "Apruebo todas" (*I approve all*) |
| D6 | Persistence | `sessionStorage` per country | Approved | "Apruebo todas" (*I approve all*) |
| D7 | Wizard steps | 3 steps + confirmation screen | Approved | "Apruebo todas" (*I approve all*) |
| D8 | Price rule | Per-country factors configurable in Strapi + documented pure function | Approved | "Apruebo todas" (*I approve all*) |
| D9 | Simulated payment | Mock gateway with a chosen result (success/rejection), no card fields | Approved | "Apruebo todas" (*I approve all*) |
| D10 | SDD | Own lightweight variant through a Skill (not Spec Kit) | Approved | "Apruebo todas" (*I approve all*) |
| D11 | Agents and Skills | 6 agents (Requirements Analyst, Software Architect, Strapi Developer, Angular Developer, QA Engineer, Code Reviewer with a security checklist) + Skills `sdd-traceability` and `country-content` | Approved | "Apruebo todas" (*I approve all*) |

The human approved D2–D11 as a block, with no specific reason per decision.

### Note on D5 (recommendation changed before the gate)

- Original recommendation (Phase 1, claude.ai): typed Reactive Forms, unless Signal Forms were stable in v22.
- Verification (local session, 2026-11-22): the official angular.dev comparison table marks Signal Forms as "Stable (v22+)" (https://angular.dev/guide/forms/signals/comparison).
- Change: the orchestrator recommended Signal Forms, flagging the change explicitly. The human approved it.
- Pending: the forms ADR (Phase 3) must cover alternatives and consequences.

## G1 — Agentic flow (Phase 2)

- Date: 2026-11-22
- Approver: Jorge (human)
- Presented: `CLAUDE.md`, `.claude/agents/` (6), `.claude/skills/` (`sdd-traceability`, `country-content` as a skeleton), `FLOW.md` (draft), `docs/traceability.md`, `.gitattributes`.

| # | Decision | Approved resolution | Status | Human's literal reason |
|---|---|---|---|---|
| G1-a | Protect `logs/` | `PreToolUse` hook (PowerShell) that blocks `Write` and `Edit` inside `logs/` | Approved | "Apruebo G1" (*I approve G1*) |
| G1-b | Model of each agent | `model: inherit` in the 6 subagents (Opus 5.5) | Approved | "Apruebo G1" (*I approve G1*) |
| G1-c | Branches | One branch and one PR per phase into `main`; each push is asked of the human first | Approved | "Apruebo G1" (*I approve G1*) |
| G1-d | Scope of `strapi-developer` (clarifies D11) | Besides `cms/`, it owns `docker-compose.yml`, nginx and `.env.example` | Approved | "Apruebo G1" (*I approve G1*) |
| G1-e | Copy of logs | When each session closes, copy the original JSONL as is to `logs/sessions/` (files are only added) | Approved | "Apruebo G1" (*I approve G1*) |

The human approved G1 as a block, with no specific reason per decision.

### G1-f — Personal data in the transcripts (2026-11-22)

- **Context:** while preparing the G1-e copy, the review of the transcript found the human's real email (Claude Code adds it as session context). There are no tokens or credentials. The PDF requires both "unedited logs" and "no real personal data in the repository".
- **Options presented:** (1) redact only the email in a copy made outside `logs/` and document the substitution with the SHA-256 of the original and of the copy; (2) copy without changes.
- **Resolution:** option 1. The only transformation allowed: replace the strings listed in a redaction file that lives **outside** the repository. No file in `logs/` is modified after it is placed. The manifest with hashes goes in `docs/logs-manifest.md`.
- **Status:** Approved.
- **Human's literal reason:** "Redactar solo email" (*Redact only the email*)

### G1 close — PR review and merge (2026-11-22)

- **Evidence:** [PR #1](https://github.com/Jorgeandd10/car-insurance-quote-multicountry/pull/1), 20 commits and 53 files from `phase-2/agentic-flow` into `main`.
- **Human review** (GitHub review, state `COMMENTED`; GitHub does not allow approving one's own PR): "G0/G1 reviewed: decisions, CLAUDE.md, agents, skills, and FLOW.md. OK to merge."
- **Merge:** done by the human with merge commit `29eccf5` (keeps the commits and their IDs).
- **Status:** G1 closed. Phase 3 starts in `phase-3/specs-adrs`.

## D1 change — Repository visibility (2026-11-22)

- **Context:** when opening the Phase 2 PR, the orchestrator detected that the repository is **public** (GitHub API: `private=False visibility=public`), while D1 said "private", and flagged it to the human after the first push of `phase-2/agentic-flow`.
- **Resolution:** the repository is **public**. The rest of D1 stays (local Claude Code, the human's own GitHub repository).
- **Human's literal reason:** "El tema de ponerlo publico no creoq  deba, pq cuando me pasaron la prueba, el reclutador decia lo sig: \"Para enviar, responde a este correo antes de la fecha límite con la URL de tu repositorio, que debe ser pública.\"" (*As for making it public, I don't think I should [keep it private], because when I was given the assessment, the recruiter said the following: "To submit, reply to this email before the deadline with the URL of your repository, which must be public."*)
- **Consequences:** everything pushed is visible. It reinforces G1-f (redaction of personal data in the logs), the rule of not versioning `.env` or credentials, and the exclusive use of fictitious data. Compatible with the PDF ("public or private and shared").
- **Status:** Approved.

## G2 — Specs of US-01, US-02 and US-03 (Phase 3)

- Date: 2026-11-22
- Approver: Jorge (human)
- Presented: `specs/US-01/spec.md`, `specs/US-02/spec.md`, `specs/US-03/spec.md` (Draft, commits `c27274b`, `b5a3852`, `fa038a7`) and the orchestrator's review [`reviews/000-G2-specs-cross-consistency.md`](../reviews/000-G2-specs-cross-consistency.md) (F-00.1–F-00.6). The 60 open questions were grouped into 13 decisions.

| # | Decision | Approved resolution | Questions / findings | Status | Human's literal reason |
|---|---|---|---|---|---|
| G2-1 | Identify document, date of birth and vehicle year | Field roles (`documentNumber`, `birthDate`, `vehicleYear`) assigned in Strapi; rules, price and masking are bound to the role | Q-01.3, Q-03.1, Q-02.4; F-00.1, F-00.2 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-2 | Fixed texts in code (exception to `CLAUDE.md` §11) | Only "cargando", "error de carga", "reintentar" and "país no disponible" (*loading*, *load error*, *retry*, *country not available*), in Spanish. Everything else from Strapi. Text missing in Strapi = configuration error with the generic message | Q-01.6, Q-02.13, Q-03.14; F-00.3, F-00.4 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-3 | Entry to the country | `/` = selection among published countries; unknown or unpublished code = "país no disponible"; `/CO` → `/co` | Q-01.1 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-4 | Legal age and vehicle year | Logic in code, always applied; minimum age per country in Strapi (18 CO and CL); year in `[currentYear − 20, currentYear + 1]` inclusive, fixed in code | Q-01.2, Q-01.9 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-5 | The field of a mandatory role is missing | Form "not available"; a PDF rule is never skipped | Q-01.7 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-6 | Sections | Section attribute per field (`policyholder` · `vehicle`), sections in a fixed order | Q-01.4, Q-03.3 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-7 | Configurable validations | `text`: `minLength`, `maxLength`, `pattern`; `number`: `min`, `max`, `integer`; `select`/`date`/`checkbox`: only `required` + rules per role | Q-01.5 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-8 | Price rule | `Math.round(basePrice × Π multipliers)`; operands `vehicleAge` and `ageInYears` with bands per country in Strapi (§6.3 of US-02) | Q-02.3, Q-02.6 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-9 | Price between steps 2 and 3 | Only the plan id is persisted; the summary recomputes with the same function | Q-02.12, Q-03.6 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-10 | Access to a step without the previous one | Redirect to the missing step; `isComplete` is computed with the current configuration, no flag is persisted | Q-01.18, Q-02.10, Q-03.8; F-00.5 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-11 | Plan unavailable or in another currency | Deactivated plan: it is deselected with a notice and the user goes back to step 2; plan with a currency different from the country's: not shown | Q-02.11, Q-02.2 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-12 | Result of the simulated payment | Visible options approved (default) / rejected inside step 3, in a "simulated gateway" block | Q-03.15 | Approved | "Apruebo todo" (*I approve everything*) |
| G2-13 | Remaining open questions | The proposals of each spec are approved as they are | Rest of Q-01, Q-02, Q-03 | Approved | "Apruebo todo" (*I approve everything*) |

In addition, F-00.6 is fixed (AC-02.8 must use U+00A0 in the COP example), which is a verified fact and not a decision.

## G3 — ADRs and architecture (Phase 3)

- Date: 2026-11-22
- Approver: Jorge (human)
- Presented: `docs/adr/0001`–`0007` (Proposed, commit `2b21fdc`), `docs/architecture/` and the orchestrator's review [`reviews/001-G3-architecture-check.md`](../reviews/001-G3-architecture-check.md) (F-00.8–F-00.11).
- Before deciding, the human asked about progress and remaining time and asked for a recommendation on G3-3. The orchestrator **changed its recommendation** from 3a (manual token) to 3c (interception + manual check in G5), because the manual token left 5 AC "Not executed" for whoever clones the repository.

| # | Decision | Approved resolution | Status | Human's literal reason |
|---|---|---|---|---|
| G3-1 | ADR-0001 to 0007 | Accepted, with the G3-3 adjustment in ADR-0003 and ADR-0007 | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-2 | Public role permissions (refines D4, F-00.8) | Only `find`, no `findOne` | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-3 | e2e with content changes (F-00.9) | **Option 3c: interception only (`page.route`)**. No write token. The real change in Strapi (new field, deactivated plan) is checked by hand in G5 and recorded in `docs/qa/manual-check.md` | Modified (initial recommendation: 3a) | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-4 | Uniqueness of `key` | Strapi `unique` + country prefix | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-5 | Mandatory interface texts in Strapi | Yes; the missing-text AC are tested by interception | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-6 | Terms | Attribute of `Country` | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-7 | Price factors | Repeatable component of `Country` | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-8 | Terms format | Strapi Blocks + own renderer | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-9 | Guards | Functional + global "cargando" indicator | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |
| G3-10 | Functional gaps covered by the architect | Their reading is accepted (missing global content → "error de carga" + "reintentar"; band with incompatible role/operand is discarded; live error after the first blur; "—" from Strapi; same section legends in step 1 and summary) | Approved | "Apruebo G3 con G3-3 en intercepción" (*I approve G3 with G3-3 as interception*) |

### Phase 3 close — review and merge of PR #2 (2026-11-22)

- **Evidence:** [PR #2](https://github.com/Jorgeandd10/car-insurance-quote-multicountry/pull/2), 21 commits and 21 files from `phase-3/specs-adrs` into `main`.
- **Human review** (GitHub review, `COMMENTED`): "OK to merge."
- **Merge:** done by the human with merge commit `3708a48` (parents `29eccf5` and `1c2f366`).
- **Deadline communicated by the human:** delivery by 2026-11-23 at 23:59 (UTC-5).
- **Adjustment requested by the human for the next PRs:** "para el proximo merge pasame tambien los comentarios para el review del merge" (*for the next merge also give me the comments for the merge review*). From Phase 4 on, each PR comes with the review text ready to paste.

## Plan of Phases 4–6 (2026-11-22, 20:40 UTC-5)

- **Presented:** plan up to the deadline of 2026-11-23 23:59.
  - 4a in parallel: `strapi-developer` (cms, seed, nginx, Docker) and `angular-developer` (frontend base).
  - 4b–4d: US-01, US-02 and US-03 in sequence; integration; demo and Phase 4 PR on the morning of the 23rd.
  - Phase 5: e2e and review 002 in parallel, G4 and G5.
  - Phase 6: final documentation and G6, targeting before 20:00 on the 23rd.
  - Local commits only during the night; push when opening each PR with the human's permission (G1-c).
- **Adjustments to the `FLOW.md` flow:** a single demo at the end of Phase 4 instead of one per story, and a single review (002) for the three stories.
- **Status:** Approved.
- **Human's literal reason:** "Aprobado, arranca" (*Approved, go ahead*)

## Phase 4 close — demo, review and merge of PR #3 (2026-11-23)

- **Evidence:** [PR #3](https://github.com/Jorgeandd10/car-insurance-quote-multicountry/pull/3), 9 commits from `phase-4/implementation` into `main`. Merge commit `f69ae34` (parents `3708a48` and `b423202`), done by the human.
- **Human review** (GitHub review, `COMMENTED`), text prepared by the orchestrator and pasted by the human: "Phase 4 reviewed (implementation): - Demo on http://localhost:8080 (docker compose up): country selection, CO form, plans, summary, approved and rejected payment, confirmation. - Verified orchestrator evidence: 457/457 unit tests, curl checks on nginx/Strapi (draft blocked, writes 403/405, no-store, CSP), no .env committed. - Reviewed docs/qa/phase-4-implementation-notes.md: implementer decisions 1–18 accepted [or: rejected n, m → findings for review 002]. …OK to merge."
- **Orchestrator's interpretation:** the text keeps the template's alternative. The 18 decisions of `docs/qa/phase-4-implementation-notes.md` are recorded as **accepted**, and the human is asked to say so if any is not.
- **Model of the Phase 5 subagents:** the human did not answer the proposal to use Sonnet; G1-b stays (`model: inherit`).

## G4 — Triage of review 002 (2026-11-23)

- Presented: [`reviews/002-phase-4-implementation.md`](../reviews/002-phase-4-implementation.md) (commit `2dac3aa`). The orchestrator reproduced F-00.12 before the gate.

| Finding | Severity | Decision | Owner | Human's literal reason |
|---|---|---|---|---|
| F-00.12 | Major (security) | Fix: `proxy_pass` with the normalized URI and verification with `curl` | `strapi-developer` | "Apruebo el triage de G4" (*I approve the G4 triage*) |
| F-03.1 | Major | Fix: re-evaluate `isComplete` after the retry and `canPay` requires valid data | `angular-developer` | "Apruebo el triage de G4" (*I approve the G4 triage*) |
| F-02.1 | Minor | Fix together with F-03.1 | `angular-developer` | "Apruebo el triage de G4" (*I approve the G4 triage*) |
| F-03.2 | Minor | Fix the seed: RUT with and without dots | `strapi-developer` | "Apruebo el triage de G4" (*I approve the G4 triage*) |
| F-00.13 | Nit | Fix (nginx cache regex) | `strapi-developer` | "Apruebo el triage de G4" (*I approve the G4 triage*) |
| F-00.14 | Nit | Accept; check in G5 | — | "Apruebo el triage de G4" (*I approve the G4 triage*) |

## G5 — Manual test with keyboard and mobile, without AI (2026-11-23)

- **Presented:** step-by-step guide over chat derived from [`docs/qa/manual-check.md`](qa/manual-check.md) (parts 0–4), on the stack brought up from `e2713d2`.
- **Human's first message:** it pasted the orchestrator's example text, with a fictitious failure in 1.13. The orchestrator did not record it and asked for the real results.
- **Status:** Approved. No defects.
- **Human's literal reason:** "NO pues los reusltados es que todo quedo ok, no salio ningun error de lo q me pediste q probara" (*Well, the results are that everything was OK; no error came up in anything you asked me to test*)
- **Scope not detailed by the human:** device or viewport, browser version and part 3 (screen reader, optional). F-00.14 stays Accepted as a known limitation; it is documented in the README.

## Phase 5 close — merge of PR #4 (2026-11-23)

- **Evidence:** [PR #4](https://github.com/Jorgeandd10/car-insurance-quote-multicountry/pull/4), 9 commits from `phase-5/validation` into `main`. Merge commit `95c2c0c` (parents `f69ae34` and `2daa00d`), done by the human. The `main` tree is identical to the branch's.
- **Human review** (GitHub review, `COMMENTED`), text prepared by the orchestrator and pasted by the human: "Phase 5 reviewed (validation): … G5 manual check done by me without AI … approved, no defects … OK to merge."

## D12 — Visual style inspired by SURA (2026-11-23)

- **Human's proposal**, before Phase 6: redesign the app's styles with a look similar to the SURA site (https://www.sura.co/seguros/empresas-sura/tecnologia-y-transformacion-digital), because the assessment is for SURA.
- **Status:** Approved (the human's own decision).
- **Human's literal reason:** "la prueba tecnica es para sura tech, entonces si quisiera como que usaramos un estilo similar al q ellos tienen para venderles mi propuesta de prueba tecnica" (*the technical assessment is for SURA Tech, so I would like us to use a style similar to theirs to sell them my technical assessment proposal*)
- **Reference measured by the orchestrator** (computed styles of the site with Claude in Chrome): primary blue `#2D6DF6`, dark blue `#0033A0`, button text `#26328C`, yellow accent `#E3E829`, surface `#DFEAFF`, text `#1C1C24` and `#3F3F41`, pill buttons (28 px radius), cards with 8 px radius and no shadow, proprietary font `SuraSans`.
- **Limits set by the orchestrator** (they do not change any approved decision):
  - Only CSS and presentational markup; no changes to behavior, specs or Strapi content.
  - No SURA logos, images or `SuraSans` font: they are not ours. A system font stack is used; the CSP (`font-src` defaulting to `'self'`) does not change.
  - No new text in code (G2-2) and no new dependency.
  - The accessibility requirements of the specs are kept: AA contrast (normal text ≥ 4.5:1), visible focus, touch targets of 24 px or more, no horizontal scrolling from 320 px.
- **Planned verification:** unit tests, build, full e2e against the rebuilt stack and screenshots at 375 px and desktop.

## D13 — Extension of D12: logo, typography, illustration and user experience (2026-11-23)

- **Context:** the human reviewed the result of D12 ("Me gusta" (*I like it*)) and asked to bring it closer to the SURA site.
- **Human's literal reason:** "Me gusta pero podemos hacerlo mas amigable y similar, te adjunto una imagen q puedes agregar para hacerlo mas amigable, lo puedes poner con las letras blancas para q se vea por encima de l fondo azul q dejaste [...] quiero que uses el mismo eestilo de tipo de letra que usan en la url q te suministre [...] diseñes una imagen relavionada con lo q vamo s ahacer, puedes poner un automovil [...] piknsa en la edperienica de usuario, el paso de vistas q haya un lazy loadigna, etc pero que se vea el profesionalimos, los estilos de los inputs, de los dropdowns, hazlo bien" (*I like it but we can make it friendlier and more similar; I'm attaching an image you can add to make it friendlier, you can put it with white letters so it shows over the blue background you left [...] I want you to use the same font style they use on the URL I gave you [...] design an image related to what we are going to do, you can put a car [...] think about the user experience, the transition between views, that there is lazy loading, etc., but make it look professional, the styles of the inputs, of the dropdowns, do it well*)
- **Status:** Approved (the human's own decision).
- **Changes to the D12 limits, flagged explicitly:**
  1. **Logo:** D12 excluded logos. Now the top band uses the "Seguros SURA" logo provided by the human, converted to white by the orchestrator. It is decorative (`alt=""`), because an alternative text would be text in code (G2-2). The logo is a SURA trademark and is used at the human's request, only as presentation of the technical assessment.
  2. **Typography:** the `SuraSans` font is proprietary and is not copied from their site. **Figtree** is used, a geometric sans with an OFL license and a similar look, self-hosted with the npm package `@fontsource-variable/figtree`. It is a new dependency, justified here; the CSP does not change because the font is served from `'self'`.
  3. **Illustration:** an original SVG illustration (car and protection) is created for the country selection screen. The image on the SURA site is only a reference and is not copied. It is decorative and has no text.
- **User experience:**
  - Smooth transition when entering each view, respecting `prefers-reduced-motion`.
  - Loading skeletons that keep the "cargando" text of G2-2.
  - Inputs and dropdowns with their own style and hover, focus, error and disabled states.
  - The routes were already *lazy* (ADR-0001).
- **What does not change:** behavior, specs, Strapi content, no new text in code, accessibility (AA, visible focus, targets of 24 px or more, no horizontal scroll from 320 px) and `infra/`.

## D14 — Back to country selection and clickable plan card (2026-11-23)

- **Context:** the human reviewed D13 in the app ("Esta quedando muy bien" (*It's turning out very well*)) and raised three points.
- **Human's literal reason:**
  - "Si acceso a Chile o Colombia, pero quiero devolverme no hay un bootn para regresar a la vista principal, no consideras que sea necesario un boton asi?" (*If I go into Chile or Colombia but want to go back, there is no button to return to the main view; don't you think a button like that is necessary?*)
  - "la idea es q se le pueda dar click a cualquier parte de la \"card\" delm plan que vaya a escoger, y se seleccione [...] tiene q ser en cualquier parte de este" (*the idea is that you can click anywhere on the "card" of the plan you are going to choose, and it gets selected [...] it has to be anywhere on it*)
- **Orchestrator's analysis:** the PDF only asks for going back between steps (AC "Keep data when going back") and the specs do not cover going back to country selection. Even so, it is a clear usability improvement, and it is cheap: the data is already saved per country (D6).
- **Status:** Approved (the human's own request).
- **Changes to specs approved in G2, flagged explicitly:**
  - US-01 v0.4: REQ-01.36 and AC-01.36, the "change country" link. Its text comes from Strapi in a new mandatory field, `wizardTexts.changeCountryLabel` (G2-2, G3-5), so the content model and the seed also change.
  - US-02 v0.4: REQ-02.34 and AC-02.34, the whole plan card selects the plan. The control is still the native `radio`.
- **Third point (payment gateway):** nothing changes. See the answer to the human: the PDF says "a button that leads to a confirmation screen or a mock gateway. Do not integrate real payment gateways or use real card data", and D9 and REQ-03.20 exclude card fields.

## D15 — Brand favicon and scope of the close (2026-11-23)

- **Orchestrator's proposals:**
  - Extras: review 003; a new country with content only, with an e2e; CI with GitHub Actions.
  - User experience polish: favicon; sticky buttons on mobile; payment and confirmation animations; illustrations in the error states.
- **Human's decision, literal:**
  - On the extras: "de lo unico q propusiste solo aprobaria el extra 1 del review 003, de resto no" (*of everything you proposed I would only approve extra 1, review 003; nothing else*).
  - On the polish: "te adjunto la imagen del favicon, muy buena propuesta esa. De hecho es la unica q apruebo de todas esas. Entonces haz eso y ya podemos proceder con el review 003" (*I'm attaching the favicon image, that's a very good proposal. In fact it's the only one of all those I approve. So do that and then we can proceed with review 003*).
- **Status:** Approved. Only the favicon and review 003; the rest is rejected (the human's reason: the time left until submission).
- **Implementation** (orchestrator, a two-file change plus assets):
  - `frontend/public/favicon.ico` (32 px PNG embedded in an ICO).
  - `frontend/public/brand/icon-32.png`, `icon-192.png` and `apple-touch-icon.png`, generated with the Chrome canvas from the human's image.
  - `<link>` in `src/index.html` and `theme-color`.
  - Verified: build OK, and the rebuilt stack serves the three icons with 200.

## G4 — Triage of review 003 (2026-11-23)

- Presented: [`reviews/003-visual-refresh-and-d14.md`](../reviews/003-visual-refresh-and-d14.md) (commit `2a76a89`), verdict "Approved with changes", 0 Blocker / 0 Major.

| Finding | Severity | Decision | Owner | Human's literal reason |
|---|---|---|---|---|
| F-00.15 | Minor | Fix: remove `reducedMotion` from the e2e config, re-run the full suite and correct the e2e report (the cause was not isolated) | orchestrator + `qa-engineer` | "Apruebo ambos" (approval of the proposed triage) |
| F-00.16 | Minor | Fix: the human repeats a short G5 on the current UI | human | "Apruebo ambos" |
| F-02.2 | Minor | Accept: side effect of the whole-card click the human asked for (D14); keyboard and accessible name unchanged | — | "Apruebo ambos" |
| F-02.3 | Minor | Fix: misplaced scenario in US-02 | `requirements-analyst` | "Apruebo ambos" |
| F-00.17 | Nit | Accept: fixing it would rewrite Git history | — | "Apruebo ambos" |
| F-00.18 | Nit | Accept: minor CSS cleanup, no impact | — | "Apruebo ambos" |
| F-00.19 | Nit | Fix: retake the README screenshots | orchestrator | "Apruebo ambos" |
| F-01.1 | Nit | Fix the misleading seed log message; accept the missing backfill test (verified for real on an existing and an empty volume) | orchestrator | "Apruebo ambos" |

- **Note on the approval:** the human answered with the "Apruebo ambos" button of the next-step box (triage + English docs) and then wrote the message quoted in D16. The orchestrator records the button text as the literal answer.

## D16 — All documentation in English (2026-11-23)

- **Context:** `CLAUDE.md` §11 (approved in G1) set documentation in Spanish and code/commits in English. The orchestrator found no language rule in the PDF text it could extract and recommended translating only README and FLOW.
- **Human's evidence:** the recruiter's email, attached as an image, says the assessment "está redactada y respondida en inglés" ("is written and answered in English").
- **Human's literal reason:** "Si tenemos que hacerlo en ingles, te adjunto el correo para que veas que el reclutador lo solicito, manos a la obra"
- **Status:** Approved. **This changes the G1 decision (`CLAUDE.md` §11), as stated explicitly here.**
- **Scope:** every versioned document is translated into English: `README.md`, `FLOW.md`, `CLAUDE.md`, agents, Skills, specs, ADRs, architecture, reviews, QA reports, traceability, decision log and the Phase 1 analysis.
- **Exceptions:**
  - The human's literal quotes in this log stay in Spanish, because they are evidence; an English translation is added next to each one.
  - `logs/` is never edited (G1-a).
  - The end-user texts in the Strapi seed stay in Spanish, because the app's users are in Colombia and Chile (G2-2).
  - Communication between the human and the orchestrator stays in Spanish.
- **How:** each owning agent translates its own paths in parallel. The translation must be faithful: same IDs, links, tables and meaning. A translation pass that changes content is a defect.

## G5 re-check and clean start before G6 (2026-11-23)

- **G5 re-check (F-00.16):** the human repeated a short manual check on the current UI (keyboard, "Cambiar de país", clickable plan card, 375 px).
  - **Human's literal result:** "G5 OK" (*G5 OK*).
  - **Status:** Approved.
- **Clean start, verified by the orchestrator:**
  - The usual stack was stopped, then `docker compose -p ciq-fresh up -d --build` ran with an empty volume (9 min 52 s, mostly the Strapi admin build).
  - Seed: `[seed] done: 30 created, 0 already present`. The public role has exactly 4 `find` permissions. `hasAdmin:false`, so the superadmin is created on first access.
  - `/api/countries` → 200, with `co` and `cl` and `changeCountryLabel`. Home → 200. Admin → 200.
  - E2E smoke on that stack: `co-full-flow` and `cl-flow` → `2 passed (36.8s)`.
  - Torn down with `docker compose -p ciq-fresh down -v`, and the usual stack restored.

### Verifications that back the decisions

- Angular's default test runner: Vitest with `jsdom` (https://angular.dev/guide/testing, https://angular.dev/cli/test). It matches the quality proposal of the analysis.
- Local environment: see [`docs/phase-1/analysis.md`](phase-1/analysis.md), section "Verified environment (local)".
