import { CmsRequestError } from '../../core/cms/cms-error';
import { pending, requestIdOf } from '../../core/cms/testing/fake-cms-client';
import { strapiC3, strapiC7 } from '../../core/cms/testing/strapi-fixtures';
import { RandomFill } from '../../domain/quote-number/create-quote-number';
import { coFormFieldsDto, validCoValues } from '../form-step/testing/form-fixtures';
import {
  WizardContent,
  clFormFieldsDto,
  createWizardHarness,
} from '../form-step/testing/wizard-harness';
import { MockPaymentGateway, QUOTE_RANDOM_FILL } from './payment/mock-payment-gateway';
import { PaymentOutcome } from './payment/payment-state';

const PLUS = 'plan-co-plus';
const TOTAL = 'plan-co-total';
const CO_TERMS = 'Este documento es ficticio y solo sirve para la prueba técnica.';

/** Controllable gateway: counts attempts and resolves when the test says so. */
class FakeGateway {
  readonly attempts: PaymentOutcome[] = [];
  private readonly pendingPayments: (() => void)[] = [];

  pay(outcome: PaymentOutcome, signal: AbortSignal): Promise<PaymentOutcome> {
    this.attempts.push(outcome);
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      this.pendingPayments.push(() => resolve(outcome));
    });
  }

  finish(): void {
    this.pendingPayments.shift()?.();
  }
}

const zeros: RandomFill = (target) => target.fill(0);

const clValues = (overrides: Record<string, unknown> = {}) => ({
  ...Object.fromEntries(
    Object.entries(validCoValues()).map(([k, v]) => [k.replace(/^co_/, 'cl_'), v]),
  ),
  ...overrides,
});

/** CL form whose document accepts a RUT with separators. */
const clFieldsWithRut = () =>
  clFormFieldsDto().map((dto) =>
    dto['key'] === 'cl_documentNumber'
      ? {
          ...dto,
          validations: [{ id: 1, kind: 'pattern', value: null, pattern: '[0-9.]+-[0-9kK]' }],
        }
      : dto,
  );

/** Complete step 1 and plan "Plan Plus" for Colombia, so both guards let the summary open. */
async function setup(patch: Partial<WizardContent> = {}, plan: string = PLUS) {
  const gateway = new FakeGateway();
  const w = await createWizardHarness(patch, [
    { provide: MockPaymentGateway, useValue: gateway },
    { provide: QUOTE_RANDOM_FILL, useValue: zeros },
  ]);
  w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
  w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: plan }));
  const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
    w.root().querySelector<T>(selector);
  const text = (selector: string) =>
    q(selector)
      ?.textContent?.replace(/[ \t\r\n]+/g, ' ')
      .trim() ?? null;
  const payButton = () => q<HTMLButtonElement>('button.pay') as HTMLButtonElement;
  const acceptBox = () => q<HTMLInputElement>('#accept-terms') as HTMLInputElement;
  const button = (label: string) =>
    Array.from(w.root().querySelectorAll('button')).find((b) => b.textContent?.trim() === label) ??
    null;
  const accept = async () => {
    acceptBox().click();
    await w.settle();
  };
  const clickPay = async () => {
    payButton().click();
    await w.settle();
  };
  /** Lets the fake gateway answer and the page react (navigation included). */
  const finishPayment = async () => {
    gateway.finish();
    await w.settle();
    await w.settle();
  };
  return { ...w, gateway, q, text, payButton, acceptBox, button, accept, clickPay, finishPayment };
}

describe('SummaryStepPage', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  describe('summary', () => {
    it('AC-03.1 shows my data, my vehicle data and the chosen plan with its final price', async () => {
      const w = await setup();
      await w.open('/co/summary');
      const headings = Array.from(w.root().querySelectorAll('h2'), (h) => h.textContent?.trim());
      expect(headings.slice(0, 2)).toEqual(['Datos del asegurado', 'Datos del vehículo']);
      expect(w.text('.plan-name')).toBe('Plan Plus');
      expect(w.text('.final-price')).toBe('Precio final $ 1.320.000');
    });

    it('AC-03.5 the Colombian document is masked, the type in clear, and the full value is not in the DOM', async () => {
      const w = await setup();
      await w.open('/co/summary');
      const values = Array.from(w.root().querySelectorAll('dd'), (dd) => dd.textContent?.trim());
      expect(values).toContain('******7890');
      expect(values).toContain('Cédula de ciudadanía');
      expect(w.root().innerHTML).not.toContain('1234567890');
    });

    it('AC-03.6 the Chilean RUT is masked keeping its separators', async () => {
      const w = await setup({ clFields: clFieldsWithRut() });
      w.storage.setItem(
        'ciq.v1.cl.step1',
        JSON.stringify({ values: clValues({ cl_documentNumber: '12.345.678-5' }) }),
      );
      w.storage.setItem('ciq.v1.cl.plan', JSON.stringify({ planDocumentId: 'plan-cl-base' }));
      await w.open('/cl/summary');
      expect(w.router.url).toBe('/cl/summary');
      const values = Array.from(w.root().querySelectorAll('dd'), (dd) => dd.textContent?.trim());
      expect(values).toContain('**.***.678-5');
      expect(w.root().innerHTML).not.toContain('12.345.678-5');
    });

    it('AC-03.8 values are readable: option label, yes text, local date and "—" for an empty optional', async () => {
      const w = await setup();
      await w.open('/co/summary');
      const pairs = Array.from(w.root().querySelectorAll('.item'), (item) => [
        item.querySelector('dt')?.textContent?.trim(),
        item.querySelector('dd')?.textContent?.trim(),
      ]);
      expect(pairs).toContainEqual(['Marca', 'Mazda']);
      expect(pairs).toContainEqual(['Acepto el tratamiento de mis datos', 'Sí']);
      expect(pairs).toContainEqual(['Fecha de nacimiento', '10 de mayo de 2000']);
      expect(pairs).toContainEqual(['Cómo quieres que te llamemos', '—']);
      expect(pairs).toContainEqual(['Año del vehículo', '2018']);
    });

    it('AC-03.9 the price is recalculated from the stored plan id and follows a change of step 1', async () => {
      const w = await setup();
      await w.open('/co/summary');
      expect(w.text('.final-price strong')).toBe('$ 1.320.000');
      expect(w.storage.getItem('ciq.v1.co.plan')).toBe(JSON.stringify({ planDocumentId: PLUS }));

      w.storage.setItem(
        'ciq.v1.co.step1',
        JSON.stringify({ values: { ...validCoValues(), co_vehicleYear: 2010 } }),
      );
      await w.open('/co/plans');
      const step2Price = w
        .root()
        .querySelector(`label[for="plan-${PLUS}"] .plan-price`)
        ?.textContent?.trim();
      await w.open('/co/summary');
      expect(w.text('.final-price strong')).toBe('$ 1.500.000');
      expect(step2Price).toBe('$ 1.500.000');
    });

    it('AC-03.21 a field removed from the configuration is not shown and the rest is', async () => {
      const w = await setup({
        coFields: coFormFieldsDto().filter((dto) => dto['key'] !== 'co_nickname'),
      });
      await w.open('/co/summary');
      const labels = Array.from(w.root().querySelectorAll('dt'), (dt) => dt.textContent?.trim());
      expect(labels).not.toContain('Cómo quieres que te llamemos');
      expect(labels).toHaveLength(7);
    });

    it('AC-03.34 REQ-03.33 the focus is on the heading of the summary and the indicator marks step 3', async () => {
      const w = await setup();
      await w.open('/co/summary');
      const heading = w.q('h1');
      expect(heading?.textContent?.trim()).toBe('Resumen');
      expect(document.activeElement).toBe(heading);
      expect(w.text('nav li[aria-current="step"]')).toContain('Resumen y pago');
    });
  });

  describe('navigation', () => {
    it('AC-03.10 edit data: full document in step 1, then step 2 with the plan, then the summary with terms unchecked', async () => {
      const w = await setup();
      await w.open('/co/summary');
      await w.accept();
      w.button('Editar datos')?.click();
      await w.settle();
      expect(w.router.url).toBe('/co/form');
      expect(w.control('co_documentNumber').value).toBe('1234567890');

      await w.fill('co_plate', 'XYZ789');
      await w.submit();
      expect(w.router.url).toBe('/co/plans');
      expect(w.radio(PLUS).checked).toBe(true);

      w.button('Continuar')?.click();
      await w.settle();
      await w.settle();
      expect(w.router.url).toBe('/co/summary');
      expect(Array.from(w.root().querySelectorAll('dd'), (dd) => dd.textContent?.trim())).toContain(
        'XYZ789',
      );
      expect(w.text('.plan-name')).toBe('Plan Plus');
      expect(w.acceptBox().checked).toBe(false);
      expect(w.payButton().disabled).toBe(true);
    });

    it('AC-03.11 change plan: step 2 with the plan marked, choose another and the summary shows it', async () => {
      const w = await setup();
      await w.open('/co/summary');
      w.button('Cambiar plan')?.click();
      await w.settle();
      expect(w.router.url).toBe('/co/plans');
      expect(w.radio(PLUS).checked).toBe(true);

      w.radio(TOTAL).click();
      await w.settle();
      w.button('Continuar')?.click();
      await w.settle();
      await w.settle();
      expect(w.router.url).toBe('/co/summary');
      expect(w.text('.plan-name')).toBe('Plan Total');
      expect(w.text('.final-price strong')).toBe('$ 1.760.000');
      expect(w.storedStep1('co')).toEqual({ values: validCoValues() });
    });

    it('AC-03.19 a stored plan that is no longer available goes to step 2, which warns and selects nothing', async () => {
      const w = await setup({}, 'plan-co-deactivated');
      await w.open('/co/summary');
      await w.settle();
      expect(w.router.url).toBe('/co/plans');
      expect(w.text('.notice')).toBe('El plan que elegiste ya no está disponible.');
      expect(
        Array.from(w.root().querySelectorAll<HTMLInputElement>('input[type="radio"]')).some(
          (r) => r.checked,
        ),
      ).toBe(false);
    });

    it('AC-03.20 data that no longer meets the configuration goes to step 1 with the data kept', async () => {
      const withNewField = [
        ...coFormFieldsDto(),
        {
          id: 99,
          key: 'co_color',
          label: 'Color',
          type: 'text',
          required: true,
          order: 5,
          section: 'vehicle',
          errorMessage: 'Indica el color.',
        },
      ];
      const w = await setup({ coFields: withNewField });
      await w.open('/co/summary');
      expect(w.router.url).toBe('/co/form');
      expect(w.control('co_plate').value).toBe('ABC123');
      await w.submit();
      expect(w.text('#err-co_color')).toBe('Indica el color.');
    });

    it('AC-03.32 data and terms are separated by country', async () => {
      const w = await setup({ clFields: clFieldsWithRut() });
      await w.open('/cl/summary');
      expect(w.router.url).toBe('/cl/form');
      expect(w.control('cl_plate').value).toBe('');

      w.storage.setItem(
        'ciq.v1.cl.step1',
        JSON.stringify({ values: clValues({ cl_documentNumber: '12.345.678-5' }) }),
      );
      w.storage.setItem('ciq.v1.cl.plan', JSON.stringify({ planDocumentId: 'plan-cl-base' }));
      await w.open('/cl/summary');
      expect(w.text('.terms-region')).toBe('Términos ficticios de Chile.');
      expect(w.root().textContent).not.toContain(CO_TERMS);
    });
  });

  describe('terms', () => {
    it('AC-03.2 shows the terms of the country and the pay button is disabled until they are accepted', async () => {
      const w = await setup();
      await w.open('/co/summary');
      expect(w.text('.terms-region p')).toBe(CO_TERMS);
      expect(w.payButton().disabled).toBe(true);
      await w.accept();
      expect(w.payButton().disabled).toBe(false);
    });

    it('AC-03.12 unchecking the terms disables the pay button again', async () => {
      const w = await setup();
      await w.open('/co/summary');
      await w.accept();
      await w.accept();
      expect(w.acceptBox().checked).toBe(false);
      expect(w.payButton().disabled).toBe(true);
    });

    it('REQ-03.16 the terms region is focusable, scrollable and named by its heading', async () => {
      const w = await setup();
      await w.open('/co/summary');
      const region = w.q('.terms-region');
      expect(region?.getAttribute('tabindex')).toBe('0');
      expect(region?.getAttribute('role')).toBe('region');
      expect(region?.getAttribute('aria-labelledby')).toBe('summary-terms-heading');
      expect(w.text('#summary-terms-heading')).toBe('Términos y condiciones');
    });

    it('AC-03.34 REQ-03.17 the checkbox is named by its label and the disabled button points to the hint', async () => {
      const w = await setup();
      await w.open('/co/summary');
      expect(w.text('label[for="accept-terms"]')).toBe('Acepto los términos y condiciones');
      expect(w.payButton().getAttribute('aria-describedby')).toBe('pay-hint');
      expect(w.text('#pay-hint')).toBe('Acepta los términos para habilitar el pago.');
      await w.accept();
      expect(w.payButton().hasAttribute('aria-describedby')).toBe(false);
    });

    it.each([
      ['no terms are published', null],
      [
        'the published terms are empty',
        [{ type: 'paragraph', children: [{ type: 'text', text: '  ' }] }],
      ],
    ])(
      'AC-03.13 when %s, terms are unavailable; checkbox and pay are disabled; data and plan stay',
      async (_case, terms) => {
        const w = await setup({ coTerms: terms });
        await w.open('/co/summary');
        expect(w.text('.summary-terms [role="alert"]')).toBe('Los términos no están disponibles.');
        expect(w.acceptBox().disabled).toBe(true);
        expect(w.payButton().disabled).toBe(true);
        expect(w.text('.plan-name')).toBe('Plan Plus');
        expect(w.root().querySelectorAll('dd').length).toBeGreaterThan(0);
      },
    );

    it('AC-03.13 when more than one terms record arrives, terms are unavailable', async () => {
      const w = await setup();
      const working = w.cms.handler;
      w.cms.handler = (call) =>
        requestIdOf(call) === 'C7'
          ? Promise.resolve([...strapiC7().data, ...strapiC7().data])
          : working(call);
      await w.open('/co/summary');
      expect(w.text('.summary-terms [role="alert"]')).toBe('Los términos no están disponibles.');
      expect(w.payButton().disabled).toBe(true);
    });

    it('AC-03.14 markup in the terms is shown as text and never inserted', async () => {
      const w = await setup({
        coTerms: [
          { type: 'paragraph', children: [{ type: 'text', text: '<img src=x onerror=alert(1)>' }] },
        ],
      });
      await w.open('/co/summary');
      expect(w.root().querySelector('.terms-region img')).toBeNull();
      expect(w.text('.terms-region p')).toBe('<img src=x onerror=alert(1)>');
    });

    it('AC-03.17 a terms failure shows "error de carga" there; retrying shows them and they can be accepted', async () => {
      const w = await setup();
      let fail = true;
      const working = w.cms.handler;
      w.cms.handler = (call) =>
        fail && requestIdOf(call) === 'C7'
          ? Promise.reject(new CmsRequestError('http', 'HTTP 500', 500))
          : working(call);
      await w.open('/co/summary');
      expect(w.text('.summary-terms [role="alert"]')).toBe('error de carga');
      expect(w.payButton().disabled).toBe(true);
      expect(w.storedStep1('co')).toEqual({ values: validCoValues() });

      fail = false;
      (
        Array.from(w.root().querySelectorAll('.summary-terms button')).find(
          (b) => b.textContent?.trim() === 'reintentar',
        ) as HTMLButtonElement
      ).click();
      await w.settle();
      expect(w.text('.terms-region p')).toBe(CO_TERMS);
      await w.accept();
      expect(w.payButton().disabled).toBe(false);
    });
  });

  describe('states', () => {
    it('AC-03.16 REQ-03.31 while loading, each pending section shows "cargando" and pay is disabled', async () => {
      const w = await setup();
      const working = w.cms.handler;
      w.cms.handler = (call) =>
        ['C5', 'C7'].includes(requestIdOf(call)) ? pending() : working(call);
      // Pending requests never settle, so do not wait for stability.
      await w.harness.navigateByUrl('/co/summary');
      w.harness.detectChanges();
      expect(w.text('.summary-plan [role="status"]')).toBe('cargando');
      expect(w.text('.summary-terms [role="status"]')).toBe('cargando');
      expect(w.payButton().disabled).toBe(true);
    });

    it('REQ-03.32 a failure of the plans shows "error de carga" in the plan section and keeps the data', async () => {
      const w = await setup();
      const working = w.cms.handler;
      w.cms.handler = (call) =>
        requestIdOf(call) === 'C5'
          ? Promise.reject(new CmsRequestError('network', 'down'))
          : working(call);
      await w.open('/co/summary');
      expect(w.text('.summary-plan [role="alert"]')).toBe('error de carga');
      expect(w.payButton().disabled).toBe(true);
      expect(w.root().querySelectorAll('dd').length).toBeGreaterThan(0);
    });

    it('AC-03.36 a missing checkbox label shows the generic error in the terms section, with no default text', async () => {
      const co = strapiC3().data[0];
      co.summaryStepTexts.acceptTermsLabel = '';
      const w = await setup({ co: co as unknown as Record<string, unknown> });
      await w.open('/co/summary');
      expect(w.text('.summary-terms [role="alert"]')).toBe(
        'No pudimos mostrar esta sección. Intenta más tarde.',
      );
      expect(w.acceptBox()).toBeNull();
      expect(w.payButton().disabled).toBe(true);
      expect(w.cms.calls.filter((c) => requestIdOf(c) === 'C7')).toEqual([]);
    });

    it('AC-03.36 a missing rejection message shows the generic error in the payment section and no pay button', async () => {
      const co = strapiC3().data[0];
      co.summaryStepTexts.rejectedMessage = ' ';
      const w = await setup({ co: co as unknown as Record<string, unknown> });
      await w.open('/co/summary');
      expect(w.text('.summary-payment [role="alert"]')).toBe(
        'No pudimos mostrar esta sección. Intenta más tarde.',
      );
      expect(w.payButton()).toBeNull();
      expect(w.text('.plan-name')).toBe('Plan Plus');
    });

    it('REQ-03.38 a missing page title shows only the generic error', async () => {
      const co = strapiC3().data[0];
      co.summaryStepTexts.title = '';
      const w = await setup({ co: co as unknown as Record<string, unknown> });
      await w.open('/co/summary');
      expect(w.q('h1')).toBeNull();
      expect(w.text('[role="alert"]')).toBe('No pudimos mostrar esta sección. Intenta más tarde.');
      expect(w.payButton()).toBeNull();
    });
  });

  describe('payment', () => {
    it('AC-03.25 REQ-03.21 the simulated gateway is in step 3 with "approved" selected by default and no card fields', async () => {
      const w = await setup();
      await w.open('/co/summary');
      expect(w.text('.gateway legend')).toBe('Pasarela simulada');
      expect(w.q<HTMLInputElement>('#outcome-approved')?.checked).toBe(true);
      expect(w.q<HTMLInputElement>('#outcome-rejected')?.checked).toBe(false);
      // AC-03.24: no text, number or other entry fields at all in the summary.
      expect(
        w
          .root()
          .querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea'),
      ).toHaveLength(0);
    });

    it('AC-03.3 AC-03.23 while processing the button is locked, keeps the focus and the other controls are disabled', async () => {
      const w = await setup();
      await w.open('/co/summary');
      await w.accept();
      w.payButton().focus();
      await w.clickPay();

      expect(w.payButton().getAttribute('aria-disabled')).toBe('true');
      expect(w.payButton().getAttribute('aria-busy')).toBe('true');
      expect(w.payButton().disabled).toBe(false);
      expect(document.activeElement).toBe(w.payButton());
      expect(w.acceptBox().disabled).toBe(true);
      expect(w.q<HTMLInputElement>('#outcome-approved')?.disabled).toBe(true);
      expect(w.q<HTMLInputElement>('#outcome-rejected')?.disabled).toBe(true);
      expect(w.button('Editar datos')?.disabled).toBe(true);
      expect(w.button('Cambiar plan')?.disabled).toBe(true);
      expect(w.q('#pay-status')?.getAttribute('aria-live')).toBe('polite');
      expect(w.text('#pay-status')).toBe('Procesando el pago…');
      expect(w.payButton().getAttribute('aria-describedby')).toBe('pay-status');
    });

    it('AC-03.22 a double click, a held Enter or Enter plus click produce exactly one payment attempt', async () => {
      const w = await setup();
      await w.open('/co/summary');
      await w.accept();
      w.payButton().click();
      w.payButton().click();
      w.payButton().click();
      await w.settle();
      w.payButton().click();
      await w.settle();
      expect(w.gateway.attempts).toEqual(['approved']);
    });

    it('AC-03.3 AC-03.27 AC-03.28 an approved payment shows the confirmation and keeps only a minimal record', async () => {
      const w = await setup();
      await w.open('/co/summary');
      await w.accept();
      await w.clickPay();
      await w.finishPayment();

      expect(w.router.url).toBe('/co/confirmation');
      expect(w.text('.quote-number')).toBe('CO-20261122-AAAAAA');
      expect(JSON.parse(w.storage.getItem('ciq.v1.co.confirmation') ?? '')).toEqual({
        quoteNumber: 'CO-20261122-AAAAAA',
        planName: 'Plan Plus',
        finalPrice: 1_320_000,
        currency: 'COP',
        paidAt: new Date(2026, 10, 22, 12, 0, 0).toISOString(),
      });
      expect(w.storage.keys()).toEqual(['ciq.v1.co.confirmation']);
      expect(JSON.stringify(w.storage.getItem('ciq.v1.co.confirmation'))).not.toContain(
        '1234567890',
      );
    });

    it('AC-03.4 AC-03.26 a rejection shows the Strapi message as an alert, keeps everything and allows a retry', async () => {
      const w = await setup();
      await w.open('/co/summary');
      await w.accept();
      w.q<HTMLInputElement>('#outcome-rejected')?.click();
      await w.settle();
      await w.clickPay();
      await w.finishPayment();

      expect(w.router.url).toBe('/co/summary');
      expect(w.q('#pay-rejected')?.getAttribute('role')).toBe('alert');
      expect(w.text('#pay-rejected')).toBe('El pago fue rechazado. Puedes intentarlo de nuevo.');
      expect(w.acceptBox().checked).toBe(true);
      expect(w.text('.final-price strong')).toBe('$ 1.320.000');
      expect(w.payButton().disabled).toBe(false);
      expect(w.storedStep1('co')).toEqual({ values: validCoValues() });
      expect(w.storedPlan('co')).toEqual({ planDocumentId: PLUS });

      w.q<HTMLInputElement>('#outcome-approved')?.click();
      await w.settle();
      await w.clickPay();
      expect(w.q('#pay-rejected')).toBeNull();
      await w.finishPayment();
      expect(w.router.url).toBe('/co/confirmation');
      expect(w.gateway.attempts).toEqual(['rejected', 'approved']);
    });

    it('REQ-03.22 leaving the summary during the payment discards it: no confirmation', async () => {
      const w = await setup();
      await w.open('/co/summary');
      await w.accept();
      await w.clickPay();
      await w.open('/co/form');
      await w.finishPayment();
      expect(w.router.url).toBe('/co/form');
      expect(w.storage.getItem('ciq.v1.co.confirmation')).toBeNull();
      expect(w.storedPlan('co')).toEqual({ planDocumentId: PLUS });
    });

    it('AC-03.29 REQ-03.28 after a successful payment the summary is not reachable: it goes to an empty step 1', async () => {
      const w = await setup();
      await w.open('/co/summary');
      await w.accept();
      await w.clickPay();
      await w.finishPayment();
      await w.open('/co/summary');
      expect(w.router.url).toBe('/co/form');
      expect(w.control('co_plate').value).toBe('');
    });

    it('AC-03.24 no request other than GET is made while paying (the fake CMS only reads)', async () => {
      const w = await setup();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await w.open('/co/summary');
      await w.accept();
      await w.clickPay();
      await w.finishPayment();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
