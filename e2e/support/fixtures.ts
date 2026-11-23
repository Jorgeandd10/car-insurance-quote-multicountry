import { test as base, expect, type Page, type Request, type Route } from '@playwright/test';

/**
 * Shared fixtures (ADR-0007).
 *
 * - `page.clock.setFixedTime(FIXED_NOW)` before any navigation: `Date` is fixed, timers run
 *   normally (the 1500 ms of the payment are real).
 * - Network guard (AC-01.30, AC-02.31, AC-03.24): every request of the test is recorded and,
 *   at the end, every request must be a GET, no request may carry `Authorization`, and no request
 *   to the content API may ask for drafts (`status` / `publicationFilter`, AC-01.11).
 */

/** 2026-11-22 12:00 in America/Bogota (UTC−5): the reference date of the specs. */
export const FIXED_NOW = new Date('2026-11-22T17:00:00.000Z');

export interface RecordedRequest {
  readonly method: string;
  readonly url: URL;
  readonly request: Request;
}

interface Fixtures {
  /** Every request made by the page during the test (filled by the auto fixture). */
  requests: RecordedRequest[];
  networkGuard: void;
}

export const test = base.extend<Fixtures>({
  requests: async ({}, use) => {
    await use([]);
  },
  networkGuard: [
    async ({ page, requests }, use) => {
      page.on('request', (request) => {
        requests.push({ method: request.method(), url: new URL(request.url()), request });
      });
      await page.clock.setFixedTime(FIXED_NOW);
      await use();

      const offenders: string[] = [];
      for (const { method, url, request } of requests) {
        if (url.protocol === 'data:' || url.protocol === 'blob:') {
          continue;
        }
        if (method !== 'GET') {
          offenders.push(`${method} ${url.pathname}`);
        }
        let headers: Record<string, string> = {};
        try {
          headers = await request.allHeaders();
        } catch {
          headers = request.headers();
        }
        if ('authorization' in headers) {
          offenders.push(`Authorization header on ${url.pathname}`);
        }
        if (url.pathname.startsWith('/api/')) {
          for (const key of url.searchParams.keys()) {
            if (key === 'status' || key.includes('publicationFilter')) {
              offenders.push(`draft parameter "${key}" on ${url.pathname}`);
            }
          }
        }
      }
      expect(offenders, 'AC-01.30 / AC-02.31 / AC-03.24 network guard').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

// ---------------------------------------------------------------------------------------------
// Seed data (cms/src/seed/data/*.ts), as shown by the app.
// ---------------------------------------------------------------------------------------------

/** U+00A0 between "$" and the amount in es-CO (AC-02.8). Never normalised. */
export const NBSP = ' ';

export const CO = {
  code: 'co',
  formTitle: 'Tus datos y los de tu vehículo',
  plansTitle: 'Elige tu plan',
  summaryTitle: 'Resumen',
  confirmationTitle: '¡Listo!',
  labels: {
    documentType: 'Tipo de documento',
    documentNumber: 'Número de documento',
    birthDate: 'Fecha de nacimiento',
    city: 'Ciudad',
    dataConsent: 'Autorizo el tratamiento de mis datos personales',
    plate: 'Placa',
    make: 'Marca',
    vehicleYear: 'Año del vehículo',
  },
  /** E1 of US-02 §6.3: Plan Plus 1 200 000 × 1.10 (2018 → 8 years) × 1.00 (26 years). */
  data: {
    documentType: 'cc',
    documentTypeLabel: 'Cédula de ciudadanía',
    documentNumber: '1234567890',
    maskedDocument: '******7890',
    birthDate: '2000-05-10',
    city: 'bogota',
    cityLabel: 'Bogotá',
    plate: 'ABC123',
    make: 'make_a',
    makeLabel: 'Marca A',
    vehicleYear: '2018',
  },
  plans: ['Plan Esencial', 'Plan Plus', 'Plan Total'],
  recommended: 'Plan Plus',
  hiddenPlans: ['Plan Clásico', 'Plan Élite'],
  /** Final prices for the data above on 2026-11-22 (factors 1.10 × 1.00). */
  prices: {
    'Plan Esencial': `$${NBSP}935.000`,
    'Plan Plus': `$${NBSP}1.320.000`,
    'Plan Total': `$${NBSP}1.815.000`,
  } as Record<string, string>,
  texts: {
    continue: 'Continuar',
    back: 'Volver',
    recommended: 'Recomendado',
    emptyPlans: 'No hay planes disponibles.',
    planUnavailable: 'El plan que elegiste ya no está disponible.',
    choosePlan: 'Elige un plan para continuar.',
    editData: 'Editar datos',
    changePlan: 'Cambiar plan',
    acceptTerms: 'Acepto los términos y condiciones',
    acceptTermsHint: 'Acepta los términos para habilitar el pago.',
    approved: 'Pago aprobado',
    rejected: 'Pago rechazado',
    pay: 'Pagar',
    processing: 'Procesando el pago…',
    rejectedMessage: 'El pago fue rechazado. Puedes intentarlo de nuevo.',
    quoteNumberLabel: 'Número de cotización',
    newQuote: 'Nueva cotización',
    genericError: 'No pudimos mostrar esta sección. Intenta más tarde.',
    termsStart: 'No constituye una oferta de seguro en Colombia.',
  },
} as const;

export const CL = {
  code: 'cl',
  formTitle: 'Tus datos y los de tu auto',
  labels: {
    rut: 'RUT',
    birthDate: 'Fecha de nacimiento',
    city: 'Ciudad',
    dataConsent: 'Autorizo el tratamiento de mis datos personales',
    plate: 'Patente',
    make: 'Marca',
    vehicleYear: 'Año del auto',
  },
  /** E4 of US-02 §6.3: Plan Full 25 990 × 1.20 (2012 → 14 years) × 1.25 (22 years) = 38 985. */
  data: {
    rut: '12345678-5',
    /** 9 alphanumerics → last min(4, 4) visible, separator kept (REQ-03.7). */
    maskedRut: '*****678-5',
    birthDate: '2004-03-15',
    city: 'santiago',
    plate: 'BCDF12',
    make: 'make_b',
    vehicleYear: '2012',
  },
  plans: ['Plan Básico', 'Plan Full', 'Plan Máximo'],
  recommended: 'Plan Full',
  prices: { 'Plan Full': '$38.985' } as Record<string, string>,
  texts: {
    termsStart: 'No constituye una oferta de seguro en Chile.',
    genericError: 'No pudimos mostrar esta sección. Inténtalo más tarde.',
  },
} as const;

export const QUOTE_NUMBER_CO = /^CO-20261122-[A-HJ-NP-Z2-9]{6}$/;
export const QUOTE_NUMBER_CL = /^CL-20261122-[A-HJ-NP-Z2-9]{6}$/;

// ---------------------------------------------------------------------------------------------
// Network helpers (ADR-0007: predicate on URL.pathname, real response + targeted change).
// ---------------------------------------------------------------------------------------------

/** C3: country configuration with the UI texts. */
export const isCountryConfig = (code: string) => (url: URL) =>
  url.pathname === '/api/countries' &&
  url.searchParams.get('populate[0]') === 'wizardTexts' &&
  url.searchParams.get('filters[code][$eq]') === code;

/** C4: form fields of a country. */
export const isFormFields = (code: string) => (url: URL) =>
  url.pathname === '/api/form-fields' &&
  url.searchParams.get('filters[country][code][$eq]') === code;

/** C5: plans of a country. */
export const isPlans = (code: string) => (url: URL) =>
  url.pathname === '/api/plans' && url.searchParams.get('filters[country][code][$eq]') === code;

/** C6: price factors of a country. */
export const isPriceFactors = (code: string) => (url: URL) =>
  url.pathname === '/api/countries' &&
  url.searchParams.get('populate[0]') === 'priceFactors' &&
  url.searchParams.get('filters[code][$eq]') === code;

/** C7: terms and conditions of a country. */
export const isTerms = (code: string) => (url: URL) =>
  url.pathname === '/api/countries' &&
  url.searchParams.get('fields[1]') === 'termsAndConditions' &&
  url.searchParams.get('filters[code][$eq]') === code;

type Json = { data: unknown; meta?: unknown };

/** Fetches the real response through nginx and fulfils it with `change(body)` applied. */
export async function modifyRealResponse(
  route: Route,
  change: (body: Json) => Json | void,
): Promise<void> {
  const response = await route.fetch();
  const body = (await response.json()) as Json;
  const changed = change(body) ?? body;
  await route.fulfill({ response, json: changed });
}

// ---------------------------------------------------------------------------------------------
// UI helpers (pointer-free Playwright actions; the keyboard-only paths are written in the tests).
// ---------------------------------------------------------------------------------------------

export const heading = (page: Page) => page.getByRole('heading', { level: 1 });

/** Step 1 of Colombia filled with the seed-valid data of `CO.data` (fill / selectOption / check). */
export async function fillCoStep1(
  page: Page,
  overrides: Partial<Record<keyof typeof CO.data, string>> = {},
): Promise<void> {
  const d = { ...CO.data, ...overrides };
  const l = CO.labels;
  await page.getByLabel(l.documentType).selectOption(d.documentType);
  await page.getByLabel(l.documentNumber).fill(d.documentNumber);
  await page.getByLabel(l.birthDate).fill(d.birthDate);
  await page.getByLabel(l.city).selectOption(d.city);
  await page.getByLabel(l.dataConsent).check();
  await page.getByLabel(l.plate).fill(d.plate);
  await page.getByLabel(l.make).selectOption(d.make);
  await page.getByLabel(l.vehicleYear).fill(d.vehicleYear);
}

export async function fillClStep1(page: Page): Promise<void> {
  const d = CL.data;
  const l = CL.labels;
  await page.getByLabel(l.rut).fill(d.rut);
  await page.getByLabel(l.birthDate).fill(d.birthDate);
  await page.getByLabel(l.city).selectOption(d.city);
  await page.getByLabel(l.dataConsent).check();
  await page.getByLabel(l.plate).fill(d.plate);
  await page.getByLabel(l.make).selectOption(d.make);
  await page.getByLabel(l.vehicleYear).fill(d.vehicleYear);
}

/** `/co/form` → valid step 1 → `/co/plans`. */
export async function goToCoPlans(page: Page): Promise<void> {
  await page.goto('/co/form');
  await expect(heading(page)).toHaveText(CO.formTitle);
  await fillCoStep1(page);
  await page.getByRole('button', { name: CO.texts.continue }).click();
  await expect(page).toHaveURL(/\/co\/plans$/);
  await expect(heading(page)).toHaveText(CO.plansTitle);
}

/** Radio of a plan, found by its accessible name (name + optional badge + price). */
export const planRadio = (page: Page, planName: string) =>
  page.getByRole('radio', { name: new RegExp(`^${planName}\\b`) });

/** `/co/form` → plans → `planName` → `/co/summary`. */
export async function goToCoSummary(page: Page, planName: string = CO.recommended): Promise<void> {
  await goToCoPlans(page);
  await planRadio(page, planName).check();
  await page.getByRole('button', { name: CO.texts.continue }).click();
  await expect(page).toHaveURL(/\/co\/summary$/);
  await expect(heading(page)).toHaveText(CO.summaryTitle);
  // Plan and terms loaded (C5, C6 and C7 answered): the checkbox is enabled only then.
  await expect(page.locator('.summary-plan .final-price')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: CO.texts.acceptTerms })).toBeEnabled();
}

/** No horizontal scroll on the page (AC-01.28, AC-02.29, AC-03.35). */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth, `scrollWidth ${sizes.scrollWidth} > clientWidth ${sizes.clientWidth}`).toBeLessThanOrEqual(
    sizes.clientWidth,
  );
}

type Loc = ReturnType<Page['locator']>;

/** Presses Tab once and checks that the focus lands on `target` (strict keyboard order). */
export async function tabTo(page: Page, target: Loc): Promise<void> {
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
}

/**
 * Leaves a native `<input type="date">` with Tab. Chrome gives the date input internal tab stops
 * (day / month / year segments), so Tab may stay on the same element; the next element reached
 * must still be `target` (no other control in between).
 */
export async function tabOutOfDate(page: Page, dateInput: Loc, target: Loc): Promise<void> {
  const dateId = await dateInput.getAttribute('id');
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    const activeId = await page.evaluate(() => document.activeElement?.id ?? '');
    if (activeId !== dateId) {
      break;
    }
  }
  await expect(target).toBeFocused();
}
