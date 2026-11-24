# ADR-0004 — Wizard state, data loading, persistence and navigation

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Deciders | Human (G3) |
| Motivated by | D6, D7, D9 · G2-9, G2-10, G2-11, G2-12, G2-13 · REQ-01.3, REQ-01.4, REQ-01.6, REQ-01.18, REQ-01.23 to REQ-01.27, REQ-01.31, REQ-02.16 to REQ-02.23, REQ-02.30, REQ-03.1, REQ-03.5, REQ-03.9 to REQ-03.14, REQ-03.19, REQ-03.21 to REQ-03.32, REQ-03.37 |

## Context and problem

The wizard has 3 steps plus a confirmation (D7) and persists in `sessionStorage`, separated by country (D6). The specs set rules that cut across the three stories:

- Only values are stored; `isComplete` is computed each time with the current configuration and is never persisted (G2-10, F-00.5).
- Only the plan's `documentId` is persisted, and the price is recomputed (G2-9).
- The terms acceptance, the chosen outcome and the payment state are not persisted (US-03 §6.2).
- After a successful payment the country's state is cleared and a minimal confirmation with no personal data remains (REQ-03.28).
- The country configuration is requested once per app load (Q-01.20). Plans and factors, on every entry to step 2 (REQ-02.23) and to the summary (REQ-03.5, REQ-03.14).

We need to decide the storage format and keys, where the state lives, how data is loaded with explicit states, how the guards work and how the payment is protected.

## Decision drivers

- State with `signal`/`computed`, zoneless, no NgModules (D2, `CLAUDE.md` §8).
- Logic in pure functions (reconciliation, `isComplete`, price, masking, quote number).
- Strict separation by country (REQ-01.25, REQ-03.37).
- Tolerance to corrupted or tampered data (US-01 5.4).
- Loading, error and empty states on every call, with "cargando" announced (REQ-01.3, REQ-02.20, REQ-03.31).
- No new dependencies.

## Considered options

**Persistence format**

1. **P1. One key per country and per data type** (`ciq.v1.{cc}.step1`, `.plan`, `.confirmation`), JSON validated on read.
2. **P2. A single object per country** (`ciq.{cc}` with `step1`, `plan`, `confirmation`).
3. **P3. State library with persistence** (e.g. `@ngrx/signals` with a storage plugin).

**Data loading**

1. **L1. Angular `resource()`** (stable since v22) with a *loader* that calls `CmsClient` (`HttpClient`), which paginates and maps.
2. **L2. `httpResource()`** (stable since v22) directly on each URL.
3. **L3. `HttpClient` + hand-written state signals.**

**Navigation guards**

1. **G1. Functional `canActivate` guards** that wait for the country configuration (in memory) and return `RedirectCommand`, plus a "cargando" indicator while navigation is pending.
2. **G2. Check inside each page**, which redirects with `router.navigate(..., { replaceUrl: true })` after loading.

## Decision

Chosen option: **P1 + L1 + G1** (with the G2 check as a fallback after a retry).

### Persistence (P1)

Access through `WizardStorage` (`frontend/src/app/core/storage/`), which receives the `Storage` through a `WIZARD_STORAGE` token (by default `sessionStorage`, replaceable in tests).

| Key | Content (JSON) | Owner | Cleared |
|---|---|---|---|
| `ciq.v1.{cc}.step1` | `{ "values": { "<fieldKey>": string \| number \| boolean \| null } }` | US-01 | After a successful payment |
| `ciq.v1.{cc}.plan` | `{ "planDocumentId": "<documentId>" }` | US-02 | After a successful payment; when discarding an unavailable plan (REQ-02.17) |
| `ciq.v1.{cc}.confirmation` | `{ "quoteNumber": "CO-20261122-7K3F9Q", "planName": "...", "finalPrice": 1320000, "currency": "COP", "paidAt": "2026-11-22T15:04:05.000Z" }` | US-03 | With "new quote" |

- `{cc}` is the already validated lowercase country code from the URL. `v1` is the schema version: if it changes, `v2` is used and the `v1` keys are ignored and removed.
- **Nothing else is stored:** no configuration, plans, prices, factors, terms, `isComplete`, terms acceptance or payment outcome (REQ-01.6, REQ-02.23, G2-9, G2-10, REQ-03.12).
- **Defensive read:** if the JSON cannot be parsed or does not have the expected shape, that key is discarded and a console warning is logged without personal data (5.4). A value of an unexpected type is discarded individually.
- **Step 1 write:** an `effect()` in `DynamicForm` writes the **normalized** values on every model change: trimmed `text`, `NaN` → `null`, `date` as `YYYY-MM-DD` (REQ-01.23, Q-01.16). `action` writes again on continue. While typing, the model keeps the untrimmed text, and when leaving the field it is replaced by the trimmed one.
- The document and the birth date remain in plain text in `sessionStorage` (Q-01.15, Q-03.23); this is documented in the README.

### In-memory state

- `CountryConfigStore` (`providedIn: 'root'`) holds a `Map<cc, ResourceRef<CountryConfig>>`. `CountryConfig` = country + texts + `FormConfig`. It is created when entering the country and **is not requested again** when navigating between steps, only on reload or when pressing "reintentar" (Q-01.20).
- `Step1State` derives from the storage and the configuration:
  - `reconcileStep1(config, stored) → Step1Model`: pure function with table 5.4.
  - `evaluateStep1(config, values, { today, minimumAge }) → Step1Result`: pure function. For each current field it returns `key`, `type`, `section`, `role`, `value`, `displayValue` (option label for `select`) and `valid`, plus `isComplete` (REQ-01.27). `isComplete` is `false` if the configuration is not `ready` (empty, unavailable or with an error).
  - `isComplete` is a `computed` over those functions: it is recomputed when read and never written.
- Plans and factors are requested with a `resource()` created by the page (step 2 and summary), so they are cancelled on leaving and requested again on every entry (REQ-02.23).
- The terms, with their own `resource()` in the summary, to show loading and error in that section (REQ-03.31, REQ-03.32, AC-03.17).

### Data loading (L1) and states

- `CmsClient` (`core/cms/`) makes the `GET` request, applies a **10 000 ms timeout** (REQ-02.21 leaves the value to the ADR), walks the pages if `pageCount > 1` (REQ-02.24), validates the overall shape and delivers DTOs. The mappers convert DTOs into domain objects (api-contracts).
- `resource()` exposes the loading state, the error and the value, and allows reloading. The pages derive a single `viewState`: `loading` | `error` | `configError` (a text is missing, G2-2) | `empty` | `unavailable` (G2-5) | `ready`.
  - `loading` → "cargando" with `role="status"`.
  - `error` → "error de carga" + "reintentar" with `role="alert"`.
  - `configError` → the country's generic message or, if that is also missing, "error de carga" (F-00.7).
- No automatic retries: only the "reintentar" button (REQ-01.4).
- The 4 fixed texts (G2-2) are in a single file, `core/ui-state/fixed-texts.ts`.

### Navigation and guards (G1)

| Route | Guard | Rule | Redirect |
|---|---|---|---|
| `/:country` (shell) | `countryCaseGuard` | Uppercase segment | Same URL in lowercase (ADR-0001) |
| `/:country/plans` | `step1CompleteGuard` | Waits for `CountryConfig`. If it is `ready` and `isComplete` is false | `/:country/form`, without requesting plans (REQ-02.19, AC-02.22) |
| `/:country/summary` | `step1CompleteGuard`, `planSelectedGuard` | `isComplete` false → step 1; no `ciq.v1.{cc}.plan` → step 2 | REQ-03.13, AC-03.18 |
| `/:country/confirmation` | `confirmationGuard` | No valid `ciq.v1.{cc}.confirmation` | `/:country/form` (REQ-03.29) |

- The guards return `true` if the configuration **fails** to load. The page then shows "error de carga" and, after a successful "reintentar", evaluates `isComplete` again and redirects if needed (G2 fallback).
- While a guard is waiting, the root component shows "cargando" (a signal derived from `Router` events: `NavigationStart` → `true`; `NavigationEnd`, `NavigationCancel` or `NavigationError` → `false`). This satisfies REQ-02.20 when entering by URL.
- **Plan not available in the summary** (REQ-03.14, G2-11): the summary loads the plans and, if the persisted plan is not in the current list, navigates to `/:country/plans` without clearing anything. Step 2 detects the same case, discards the selection and shows the notice (REQ-02.17). This way there is a single implementation of the discard.
- **From the summary** (REQ-03.9 to REQ-03.11): "edit data" → `/form`; from there continue → `/plans` with the plan preselected → `/summary`.
- **Focus when changing step** (REQ-01.31, REQ-02.28, REQ-03.33): each page focuses its `<h1 tabindex="-1">` with `afterNextRender`, and the shell updates `document.title` with the step title (Strapi text).

### Simulated payment and confirmation (D9, G2-12)

- Local state of `SummaryStepPage`, not persisted:
  - `termsAccepted = signal(false)`
  - `outcome = signal<'approved' | 'rejected'>('approved')`
  - `payment = signal<'idle' | 'processing' | 'rejected'>('idle')`
- `canPay = computed(...)` with the data loaded and valid, the plan valid, the terms loaded and accepted, and `payment() !== 'processing'` (REQ-03.19).
- `pay()` returns immediately if `payment() === 'processing'`. This is the **guard in the state**, independent of the `disabled` attribute (REQ-03.23). Then it changes the state to `processing` and calls `MockPaymentGateway.pay(outcome, abortSignal)`, which resolves after `PAYMENT_DELAY_MS` (token, 1500 ms by default; REQ-03.24). It makes no request (REQ-03.20).
- When the page is destroyed, the pending payment is aborted (`DestroyRef`) and its result is ignored (REQ-03.22).
- **Success**, in this order:
  1. Generates the number with `createQuoteNumber(cc, now, randomSource)`, a pure function with `crypto.getRandomValues` injected (REQ-03.26).
  2. Writes `confirmation`.
  3. Clears `step1` and `plan`.
  4. Navigates to `/:country/confirmation` with `replaceUrl: true`.

  If the user goes back afterwards, the summary redirects to an empty step 1 because `isComplete` is false (REQ-03.28, AC-03.29).
- **Rejection:** `payment.set('rejected')`, message with `role="alert"`; the data and the terms acceptance are kept (REQ-03.30).
- **New quote:** clears `confirmation` and navigates to `/:country/form`.

## Consequences

- **Positive:**
  - Each key has a single owner and a clear life cycle. If a key is corrupted, only that one is lost (e.g. step 1), as 5.4 requires.
  - `isComplete` cannot become stale because it does not exist in storage (F-00.5).
  - `resource()` provides cancellation via `AbortSignal` when leaving the page or reloading, and a uniform state for loading, error and retry.
  - Redirects happen before rendering the step and before requesting plans (AC-02.22).
- **Negative:**
  - Three keys per country: clearing after payment is two operations, without atomicity. If the tab dies between the two, an orphan `plan` may remain, which is harmless because without `step1` the summary redirects to step 1.
  - The document remains in plain text in `sessionStorage` for the duration of the quote (risk accepted in G2).
  - The guards wait for an HTTP request: the first navigation by direct URL to `/plans` or `/summary` shows the global "cargando" before the step's.
  - There are two places that evaluate `isComplete` (guard and page after a retry); this is mitigated by using the same pure function.
  - Paying in a duplicated tab is not prevented (accepted limitation, REQ-03.23).
- **Risks and mitigation:**
  - *Exact names of the `ResourceRef` signals:* the `httpResource` guide documents `value()`, `hasValue()`, `error()` and `isLoading()`. The Angular Developer confirms the reload method in the `ResourceRef` reference before implementing it.
  - *The write `effect()` runs with the initial model and overwrites what was stored before reconciling:* the model is initialized with the already reconciled values, so the first write is idempotent. A unit test verifies it (AC-01.21).

### Confirmation

- Unit: `reconcileStep1` (AC-01.23, AC-01.24), `evaluateStep1` (AC-01.29), `WizardStorage` (corrupted JSON, unexpected types, separation by country: AC-01.22), guards (AC-02.22, AC-03.18, AC-03.30), `SummaryStepPage` with `PAYMENT_DELAY_MS = 0` and an attempt counter (AC-03.22, AC-03.23), `createQuoteNumber` (AC-03.27).
- E2E: AC-01.4, AC-01.21, AC-02.19, AC-02.20, AC-02.30, AC-03.10, AC-03.11, AC-03.28, AC-03.29.
- Review: `grep -rn "localStorage\|serviceWorker\|isComplete.*setItem" frontend/src` with no results; the only `sessionStorage` calls are in `core/storage/`.

## Pros and cons of the options

### P1. One key per country and per data item (chosen)

- For: isolated corruption; clear owner per story; easy to inspect in the e2e tests (AC-01.29: "no completed flag stored").
- Against: several writes when clearing; more keys.

### P2. One object per country

- For: a single write and an atomic clear.
- Against: if the JSON is corrupted the whole country is lost, not just step 1 (table 5.4 says "everything from step 1"). Each story rewrites the whole object, which couples the three.

### P3. State library with persistence

- For: ready-made patterns (hydration, selectors).
- Against: a new dependency without real need (`CLAUDE.md` §6); the state is small.

### L1. `resource()` + `CmsClient` (chosen)

- For: stable in v22; the asynchronous *loader* allows paginating and mapping in a single step; cancels when destroyed.
- Against: adds a level of indirection compared to `httpResource`.

### L2. `httpResource()`

- For: very concise; uses `HttpClient` (with interceptors); `parse` option for validation.
- Against: one URL per resource. Walking the pages (REQ-02.24) and combining the configuration requests (country + fields) requires composing several resources by hand.

### L3. `HttpClient` + manual signals

- For: full control and a very well-known API.
- Against: reimplements cancellation, state and reload in every page, with more surface for errors in the loading states.

### G1. Functional guards (chosen)

- For: the redirect happens before activating the component, so no plans are requested (AC-02.22). It is the idiomatic Angular mechanism.
- Against: a global pending-navigation indicator is needed; a guard that fails to load must let the navigation through.

### G2. Check in the page

- For: the loading state is local and natural.
- Against: the component gets activated and could request plans before deciding; the access logic is spread across pages.

## References

Consulted on 2026-11-22:

- Angular, `resource()` (stable since v22.0, cancellation with `AbortSignal`): https://angular.dev/api/core/resource
- Angular, `httpResource` (stable since v22.0): https://angular.dev/api/common/http/httpResource
- Angular, `httpResource` guide (`value`, `hasValue`, `error`, `isLoading`, `parse`, interceptors): https://angular.dev/guide/http/http-resource
- Angular, guards (`CanActivateFn`, `RedirectCommand`): https://angular.dev/guide/routing/route-guards
- Angular, zoneless by default (v21+), zoneless `TestBed`: https://angular.dev/guide/zoneless
- MDN, `crypto.getRandomValues` (cryptographically strong, also available outside secure contexts): https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
- Strapi 5, pagination (`pagination[page]`, `pagination[pageSize]`, `meta.pagination.pageCount`): https://docs.strapi.io/cms/api/rest/sort-pagination

> Translated into English on 2026-11-23 (D16); no content change.
