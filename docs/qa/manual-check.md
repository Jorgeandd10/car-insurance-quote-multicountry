# G5 manual test

| Field | Value |
|---|---|
| Gate | G5 (manual test with keyboard and mobile, without AI) |
| Who runs it | Human |
| Date | 2026-11-23 |
| Tested commit (`git rev-parse --short HEAD`) | `e2713d2` (stack started from that commit; checked by the orchestrator before the test: `/api/countries` 200, `/admin` 200) |
| Browser and version | Chrome (version not stated by the human) |
| Mobile device (model, OS, browser) or viewport used | Not stated by the human |
| Screen reader (optional: NVDA, Narrator, VoiceOver, TalkBack) | Not stated by the human |

> Template prepared by the QA Engineer in Phase 5; the human's result is in "Recorded result". Each step states the AC it backs. In "Result" write `OK`, `Fails` or `Not run`; in "Notes", what you observed (and, if it fails, what you expected and what you got).
>
> The content-change AC (AC-01.3, AC-01.10, AC-01.31, AC-02.4, AC-02.21, AC-02.25, AC-03.15) are already automated by interception in `e2e/` (G3-3). This document records the real integration with Strapi, which interception does not test (ADR-0007, "Negative consequences").

## Recorded result (2026-11-23)

The human ran the test following the step-by-step version of this template that the orchestrator gave them by chat (same parts 0–4 and same steps). Result reported by the human, literally:

> "NO pues los reusltados es que todo quedo ok, no salio ningun error de lo q me pediste q probara"
>
> (English translation: "Well, no, the results are that everything was OK, no error came up in what you asked me to test")

Their first result message ("Ya hice toda la prueba, y quedo super check"; in English: "I already did the whole test, and it came out all checked") pasted the **example** text that the orchestrator had given them (including a fictitious failure in 1.13). The orchestrator did not record it as evidence and asked for confirmation; the quote above is that confirmation.

Orchestrator's reading:

- Parts 1, 2 and 4: **OK** in every step, with no defects. Part 4 includes restoring the seed (4.7).
- The human did not detail the mobile device or viewport used, the browser version, or whether they ran part 3, which was optional. The tables below are not filled in step by step so as not to attribute to them details they did not give.
- **F-00.14** (announcement of the per-section "cargando" with a screen reader) is not explicitly verified. It stays **Accepted** as a known limitation and is documented in the README.

## 0. Preparation

| # | Step | AC | Result | Notes |
|---|---|---|---|---|
| 0.1 | At the repository root: `docker compose up -d` (with `.env` created from `.env.example`). Wait until `http://localhost:8080/api/countries` answers 200. | AC-01.34 | | |
| 0.2 | Open a new or private browser window (empty `sessionStorage`). | — | | |
| 0.3 | For the real mobile device: find the machine's IP on the local network and open `http://<IP>:8080` on the phone (port 8080 is published on all interfaces; note 2 of `phase-4-implementation-notes.md`). | AC-01.28, AC-02.29, AC-03.35 | | |

## 1. Full Colombia journey with the keyboard only (no mouse or touchpad)

Fictitious data: type "Cédula de ciudadanía", number `1234567890`, birth date `10/05/2000`, city Bogotá, authorization checked, plate `ABC123`, Marca A, year `2018`.

| # | Step | AC | Result | Notes |
|---|---|---|---|---|
| 1.1 | Open `http://localhost:8080/`. With Tab reach the "Colombia" link and press Enter. | AC-01.5 | | |
| 1.2 | On step 1 the focus is on the heading and the indicator marks step 1. The focus is always visible. | AC-01.27 | | |
| 1.3 | With Tab and Shift+Tab go through the 8 fields in order (type, number, date, city, authorization, plate, brand, year). Choose select options with the arrows, check the checkbox with Space and type the date with the keyboard. | AC-01.27, AC-01.1 | | |
| 1.4 | Leave the document number as `12AB` and press Enter in a text field: it stays on step 1, the configured message is shown next to the field and the focus goes to the first invalid field. | AC-01.2, AC-01.16, AC-01.27 | | |
| 1.5 | Correct the number (`1234567890`) and press Enter in the plate field: it moves to step 2 without using the mouse. | AC-01.27, AC-01.32 | | |
| 1.6 | On step 2 the focus is on the heading. With Tab reach the plans group, move with the arrows to "Plan Plus" (marked as "Recomendado"), confirm with Space. | AC-02.26, AC-02.2, AC-02.28 | | |
| 1.7 | Check that the prices are shown in Colombian pesos without decimals ("$ 1.320.000" for Plan Plus). | AC-02.8 | | |
| 1.8 | Tab to "Volver" and Enter: the step 1 data is still there. Continue again with the keyboard and check that "Plan Plus" is still selected. | AC-01.4, AC-02.30 | | |
| 1.9 | Tab to "Continuar" and Enter: it reaches the summary with the focus on the heading. | AC-02.26, AC-03.34 | | |
| 1.10 | In the summary: policyholder and vehicle data with their labels, document as `******7890`, document type in clear, plan and final price. | AC-03.1, AC-03.5, AC-03.8 | | |
| 1.11 | Go through with Tab and Shift+Tab: "Editar datos", "Cambiar plan", terms region, checkbox, result selector, "Pagar". Scroll the terms with the arrows or Page Down. | AC-03.33 | | |
| 1.12 | With "Pagar" disabled, check the checkbox with Space: "Pagar" becomes enabled. Uncheck it: it becomes disabled. Check it again. | AC-03.2, AC-03.12 | | |
| 1.13 | With the arrows choose "Pago rechazado" and press Enter on "Pagar": for ~1.5 s "Procesando el pago…" is shown and the button does not react; then the rejection message appears, and you stay on the summary with the data and the checkbox checked. | AC-03.4, AC-03.23, AC-03.26 | | |
| 1.14 | With the arrows choose "Pago aprobado" and press Enter on "Pagar" (hold Enter down for a moment): the confirmation is shown with the number `CO-AAAAMMDD-XXXXXX`, the plan and the price paid, only once. | AC-03.3, AC-03.22, AC-03.25, AC-03.31 | | |
| 1.15 | Use the browser's "back" (Alt+Left arrow): no summary with "Pagar" appears; the empty step 1 is shown. | AC-03.29 | | |

## 2. Real mobile device or 375 px viewport

If there is no real mobile device, use the browser's developer tools with a 375 px wide device (and optionally 320 px). State above what was used.

| # | Step | AC | Result | Notes |
|---|---|---|---|---|
| 2.1 | Step 1: there is no horizontal scroll; every field and "Continuar" can be seen and used with a finger; the mobile keyboard for the year is numeric and the date opens the native picker. | AC-01.28 | | |
| 2.2 | Step 2: the plans stack in one column, with no horizontal scroll; each plan, its price and "Continuar" are reachable. | AC-02.29 | | |
| 2.3 | Summary: one column, no horizontal scroll; the terms can be read and scrolled; the checkbox, the payment options and the buttons are easy to tap (≥ 24×24 px). Pay attention to the terms checkbox at 320 px (defect D-E2E-1 in `docs/qa/e2e-report.md`). | AC-03.35 | | |
| 2.4 | Pay with "Pago aprobado": the confirmation is fully visible with no horizontal scroll. | AC-03.35 | | |
| 2.5 | Repeat a short journey on `/cl` (RUT `12345678-5`, plate `BCDF12`): prices in Chilean pesos ("$38.985" for Plan Full with year 2012 and birth date 15/03/2004) and masked RUT `*****678-5`. | AC-01.34, AC-02.8, AC-03.6 | | |

## 3. Screen reader (optional)

| # | Step | AC | Result | Notes |
|---|---|---|---|---|
| 3.1 | Step 1: each field is announced with its label and its help text; when validation fails the associated error is announced. | AC-01.26 | | |
| 3.2 | Step 2: the group is announced as "Planes disponibles"; each option with its name, "Recomendado" if it applies, price and selected state. | AC-02.27 | | |
| 3.3 | Summary: the checkbox is announced with its label; the disabled "Pagar" reads the instruction to accept the terms; "Procesando el pago…" is announced; the rejection is announced as an alert. | AC-03.34 | | |
| 3.4 | Confirmation: the focus is on the heading and the quote number is read. | AC-03.34 | | |

## 4. Real change in the Strapi admin (G3-3)

The admin only listens on `127.0.0.1`. No administrator is seeded: the first access registers the super admin (note 5 of `phase-4-implementation-notes.md`). Use fictitious data and a password that is not reused; do **not** store it in the repository.

| # | Step | AC | Result | Notes |
|---|---|---|---|---|
| 4.1 | Open `http://127.0.0.1:1337/admin` and create the super admin (fictitious name and email). | — | | |
| 4.2 | Content Manager → Form Field → create a new field for Colombia: key `co_licenseNumber`, label "Número de licencia de conducción", type `text`, required `true`, section `policyholder`, order `6`, error message "Ingresa el número de tu licencia.", relation country = Colombia. **Publish**. | AC-01.3 | | |
| 4.3 | In the app, reload `http://localhost:8080/co/form` (F5): the new field appears after the authorization, without changing code or rebuilding. Leave it empty and continue: its message is shown and it does not advance. | AC-01.3, REQ-01.6 | | |
| 4.4 | With a plan selected in step 2 (for example "Plan Total"), in the admin: Content Manager → Plan → Colombia's "Plan Total" → `active` = `false` → **Publish**. | AC-02.25, AC-02.21 | | |
| 4.5 | Reload `http://localhost:8080/co/plans`: "Plan Total" no longer appears, no plan stays selected and "El plan que elegiste ya no está disponible." is announced. | AC-02.25, AC-02.21 | | |
| 4.6 | (Optional) Change the multiplier of one of Colombia's price factor bands, publish and reload step 2: the prices change. | AC-02.25 | | |
| 4.7 | Leave the seed as it was: unpublish or delete the field from 4.2 and reactivate "Plan Total" (or recreate the Strapi volume). Note how it was restored. | — | | |

## 5. Closing

| Field | Value |
|---|---|
| Verdict (Approved / Rejected / Modified) | Approved |
| Defects found (steps, expected, obtained) | None |
| Signature or initials | Human's confirmation by chat (quote in "Recorded result") |
