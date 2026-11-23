import { CmsRequestError } from '../../core/cms/cms-error';
import { pending, requestIdOf } from '../../core/cms/testing/fake-cms-client';
import { strapiC3 } from '../../core/cms/testing/strapi-fixtures';
import { validCoValues } from '../form-step/testing/form-fixtures';
import { WizardContent, createWizardHarness } from '../form-step/testing/wizard-harness';
import { coPlansDto, planDto } from './testing/plans-fixtures';

const ESENCIAL = 'p0o9i8u7y6t5r4e3w2q1a0s9';
const PLUS = 'plan-co-plus';
const TOTAL = 'plan-co-total';

const validClValues = () =>
  Object.fromEntries(
    Object.entries(validCoValues()).map(([k, v]) => [k.replace(/^co_/, 'cl_'), v]),
  );

/** Harness with a complete step 1 for CO and CL, so the guard lets step 2 open. */
async function setup(patch: Partial<WizardContent> = {}) {
  const w = await createWizardHarness(patch);
  w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
  w.storage.setItem('ciq.v1.cl.step1', JSON.stringify({ values: validClValues() }));
  // Accessible name of a plan. Only ASCII whitespace is collapsed: `\s` would also turn the
  // U+00A0 of the COP price into a normal space and hide an AC-02.8 regression.
  const labelOf = (id: string) =>
    w
      .root()
      .querySelector(`label[for="plan-${id}"]`)
      ?.textContent?.replace(/[ \t\r\n]+/g, ' ')
      .trim() ?? null;
  const planIds = () =>
    Array.from(w.root().querySelectorAll<HTMLInputElement>('input[type="radio"]'), (r) => r.value);
  const button = (text: string) =>
    Array.from(w.root().querySelectorAll('button')).find((b) => b.textContent?.trim() === text) ??
    null;
  const pick = async (id: string) => {
    w.radio(id).click();
    await w.settle();
  };
  const continueClick = async () => {
    button('Continuar')?.click();
    await w.settle();
    await w.settle();
  };
  return { ...w, labelOf, planIds, button, pick, continueClick };
}

describe('PlansStepPage', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  describe('list', () => {
    it('AC-02.1 REQ-02.1 shows the active plans of the country in the configured order', async () => {
      const w = await setup();
      await w.open('/co/plans');
      expect(w.planIds()).toEqual([ESENCIAL, PLUS, TOTAL]);
      expect(w.cms.callsTo('plans').map((c) => c.query['filters[country][code][$eq]'])).toEqual([
        'co',
      ]);
    });

    it('AC-02.5 the plans of another country are never shown', async () => {
      const w = await setup();
      await w.open('/cl/plans');
      expect(w.planIds()).toEqual(['plan-cl-base', 'plan-cl-full']);
    });

    it('AC-02.2 AC-02.7 only the first recommended plan is highlighted, with a visible text label', async () => {
      const w = await setup();
      await w.open('/co/plans');
      const highlighted = Array.from(
        w.root().querySelectorAll('.plan--recommended input'),
        (r) => (r as HTMLInputElement).value,
      );
      expect(highlighted).toEqual([PLUS]);
      expect(w.labelOf(PLUS)).toContain('Recomendado');
      expect(w.labelOf(TOTAL)).not.toContain('Recomendado');
    });

    it('AC-02.9 AC-02.8 each plan shows its final price from the step 1 data, in COP without decimals', async () => {
      const w = await setup();
      await w.open('/co/plans');
      // 2018 → 8 years → 1.10; 2000-05-10 → 26 years → 1.00.
      expect(w.labelOf(ESENCIAL)).toContain('$ 935.000');
      expect(w.labelOf(PLUS)).toContain('$ 1.320.000');
      expect(w.labelOf(TOTAL)).toContain('$ 1.760.000');
    });

    it('AC-02.8 Chile shows CLP: "$21.589" (19 990 × 1.08, rounded once)', async () => {
      const w = await setup();
      await w.open('/cl/plans');
      expect(w.labelOf('plan-cl-base')).toContain('$21.589');
    });

    it('AC-02.10 without price factors each plan shows its base price', async () => {
      const w = await setup({ coFactors: null });
      await w.open('/co/plans');
      expect(w.labelOf(ESENCIAL)).toContain('$ 850.000');
      expect(w.labelOf(PLUS)).toContain('$ 1.200.000');
    });

    it('REQ-02.3 shows description, coverages and benefits as lists; an empty list is not shown', async () => {
      const w = await setup();
      await w.open('/co/plans');
      const plus = w.radio(PLUS).closest('.plan') as HTMLElement;
      expect(plus.querySelector('.plan-description')?.textContent?.trim()).toBe(
        'Daños propios y conductor elegido.',
      );
      const coverages = plus.querySelector('ul[aria-labelledby="coverages-plan-co-plus"]');
      expect(
        Array.from(coverages?.querySelectorAll('li') ?? [], (li) => li.textContent?.trim()),
      ).toEqual(['Responsabilidad civil', 'Daños propios']);
      expect(plus.querySelector('#coverages-plan-co-plus')?.textContent?.trim()).toBe('Coberturas');
      expect(plus.querySelector('#benefits-plan-co-plus')).toBeNull();
    });

    it('AC-02.14 a plan with another currency is not shown and a warning is logged', async () => {
      const usd = planDto({
        id: 30,
        documentId: 'plan-co-usd',
        name: 'Plan USD',
        basePrice: 100,
        currency: 'USD',
        order: 0,
      });
      const w = await setup({ coPlans: [...coPlansDto(), usd] });
      await w.open('/co/plans');
      expect(w.planIds()).not.toContain('plan-co-usd');
      expect(w.planIds()).toHaveLength(3);
      expect(warn).toHaveBeenCalledWith(
        '[cms] plan skipped: currency differs from the country currency (id=plan-co-usd)',
      );
    });

    it('AC-02.15 a plan without base price is not shown and the others are', async () => {
      const broken = planDto({
        id: 31,
        documentId: 'plan-co-broken',
        name: 'Roto',
        basePrice: null,
        currency: 'COP',
        order: 0,
      });
      const w = await setup({ coPlans: [...coPlansDto(), broken] });
      await w.open('/co/plans');
      expect(w.planIds()).toEqual([ESENCIAL, PLUS, TOTAL]);
    });

    it('AC-02.32 more plans than the default page size are all listed', async () => {
      const many = Array.from({ length: 30 }, (_, i) =>
        planDto({
          id: 100 + i,
          documentId: `plan-${i}`,
          name: `Plan ${i}`,
          basePrice: 1000,
          currency: 'COP',
          order: i,
        }),
      );
      const w = await setup({ coPlans: many });
      await w.open('/co/plans');
      expect(w.planIds()).toHaveLength(30);
    });
  });

  describe('selection', () => {
    it('AC-02.3 a selected plan is checked and continue goes to the summary', async () => {
      const w = await setup();
      await w.open('/co/plans');
      await w.pick(PLUS);
      expect(w.radio(PLUS).checked).toBe(true);
      expect(w.radio(PLUS).closest('.plan')?.classList).toContain('plan--selected');
      await w.continueClick();
      expect(w.router.url).toBe('/co/summary');
    });

    it('AC-02.17 REQ-02.14 selecting another plan replaces the selection (one radio group)', async () => {
      const w = await setup();
      await w.open('/co/plans');
      await w.pick(ESENCIAL);
      await w.pick(PLUS);
      expect(w.radio(PLUS).checked).toBe(true);
      expect(w.radio(ESENCIAL).checked).toBe(false);
      const names = new Set(
        Array.from(
          w.root().querySelectorAll<HTMLInputElement>('input[type="radio"]'),
          (r) => r.name,
        ),
      );
      expect([...names]).toEqual(['plan']);
    });

    it('REQ-02.16 G2-9 only the documentId of the plan is stored', async () => {
      const w = await setup();
      await w.open('/co/plans');
      await w.pick(PLUS);
      expect(w.storedPlan('co')).toEqual({ planDocumentId: PLUS });
    });

    it('AC-02.18 continue without a selection shows the Strapi message on the group and moves the focus to it', async () => {
      const w = await setup();
      await w.open('/co/plans');
      await w.continueClick();
      expect(w.router.url).toBe('/co/plans');
      const message = w.root().querySelector('#choose-plan-message');
      expect(message?.textContent?.trim()).toBe('Elige un plan para continuar.');
      expect(message?.getAttribute('role')).toBe('alert');
      expect(w.root().querySelector('fieldset')?.getAttribute('aria-describedby')).toBe(
        'choose-plan-message',
      );
      expect(document.activeElement).toBe(w.radio(ESENCIAL));
    });

    it('REQ-02.15 the message is removed once a plan is chosen', async () => {
      const w = await setup();
      await w.open('/co/plans');
      await w.continueClick();
      await w.pick(TOTAL);
      expect(w.root().querySelector('#choose-plan-message')).toBeNull();
      expect(w.root().querySelector('fieldset')?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('AC-02.19 the selection survives a reload', async () => {
      const w = await setup();
      w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: PLUS }));
      await w.open('/co/plans');
      expect(w.radio(PLUS).checked).toBe(true);
    });

    it('AC-02.20 the selection is kept per country', async () => {
      const w = await setup();
      await w.open('/co/plans');
      await w.pick(PLUS);
      await w.open('/cl/plans');
      expect(
        Array.from(w.root().querySelectorAll<HTMLInputElement>('input[type="radio"]')).some(
          (r) => r.checked,
        ),
      ).toBe(false);
      await w.open('/co/plans');
      expect(w.radio(PLUS).checked).toBe(true);
    });

    it('AC-02.21 a stored plan that is no longer available is discarded with an announced notice', async () => {
      const w = await setup();
      w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: 'plan-co-gone' }));
      await w.open('/co/plans');
      expect(
        Array.from(w.root().querySelectorAll<HTMLInputElement>('input[type="radio"]')).some(
          (r) => r.checked,
        ),
      ).toBe(false);
      const notice = w.root().querySelector('.notice');
      expect(notice?.textContent?.trim()).toBe('El plan que elegiste ya no está disponible.');
      expect(notice?.getAttribute('role')).toBe('alert');
      expect(w.storedPlan('co')).toBeNull();

      await w.continueClick();
      expect(w.router.url).toBe('/co/plans');
    });

    it('AC-02.16 AC-02.30 after editing step 1 the price is recalculated and the selection is kept', async () => {
      const w = await setup();
      await w.open('/co/plans');
      await w.pick(PLUS);
      w.button('Volver')?.click();
      await w.settle();
      expect(w.router.url).toBe('/co/form');
      expect(w.control('co_plate').value).toBe('ABC123');

      await w.fill('co_vehicleYear', '2010'); // 16 years → band 11-20 → 1.25
      await w.submit();
      expect(w.router.url).toBe('/co/plans');
      expect(w.radio(PLUS).checked).toBe(true);
      expect(w.labelOf(PLUS)).toContain('$ 1.500.000');
    });

    it('REQ-02.23 the plans are requested again on every entry to the step', async () => {
      const w = await setup();
      await w.open('/co/plans');
      await w.open('/co/form');
      await w.open('/co/plans');
      expect(w.cms.callsTo('plans')).toHaveLength(2);
      expect(w.cms.calls.filter((c) => requestIdOf(c) === 'C6')).toHaveLength(2);
    });

    /*
     * The click on the coverages list reaches the label through a CSS pseudo-element that covers
     * the card (REQ-02.34). jsdom has no layout nor hit testing, so that click is covered by the
     * e2e of AC-02.34. Here: the preconditions of the technique, i.e. the radio is the only
     * interactive element of the card (nothing else would capture the click) and a click on the
     * label (what the overlay is) selects the plan.
     */
    it('AC-02.34 REQ-02.34 the radio is the only interactive element of a card and its label selects the plan', async () => {
      const w = await setup();
      await w.open('/co/plans');
      const cards = Array.from(w.root().querySelectorAll<HTMLElement>('.plan'));
      expect(cards).toHaveLength(3);
      for (const card of cards) {
        const interactive = Array.from(
          card.querySelectorAll(
            'a, button, input, select, textarea, [tabindex], [contenteditable]',
          ),
        );
        expect(interactive).toEqual([card.querySelector('input[type="radio"]')]);
        expect(card.querySelectorAll('label')).toHaveLength(1);
      }

      w.root().querySelector<HTMLElement>(`label[for="plan-${TOTAL}"]`)?.click();
      await w.settle();
      expect(w.radio(TOTAL).checked).toBe(true);
      expect(w.radio(TOTAL).closest('.plan')?.classList).toContain('plan--selected');
    });
  });

  describe('accessibility', () => {
    it('AC-02.27 the group has a name and each option names the plan, price and recommendation', async () => {
      const w = await setup();
      await w.open('/co/plans');
      expect(w.root().querySelector('fieldset > legend')?.textContent?.trim()).toBe(
        'Planes disponibles',
      );
      expect(w.labelOf(PLUS)).toBe('Plan Plus Recomendado $ 1.320.000');
      expect(w.labelOf(ESENCIAL)).toBe('Plan Esencial $ 935.000');
    });

    it('AC-02.28 the focus is on the heading of the step and the indicator marks step 2', async () => {
      const w = await setup();
      await w.open('/co/plans');
      const heading = w.root().querySelector('h1');
      expect(heading?.textContent?.trim()).toBe('Elige tu plan');
      expect(document.activeElement).toBe(heading);
      expect(w.root().querySelector('nav li[aria-current="step"]')?.textContent).toContain(
        'Planes',
      );
    });

    it('REQ-02.26 the buttons are back (button) and continue (submit of the form)', async () => {
      const w = await setup();
      await w.open('/co/plans');
      expect(w.button('Volver')?.getAttribute('type')).toBe('button');
      expect(w.button('Continuar')?.getAttribute('type')).toBe('submit');
      expect(w.button('Continuar')?.disabled).toBe(false);
    });
  });

  describe('states', () => {
    it('AC-02.4 AC-02.22 with no active plans shows the empty message, no continue, and back to step 1', async () => {
      const w = await setup({ coPlans: [] });
      await w.open('/co/plans');
      expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        'No hay planes disponibles.',
      );
      expect(w.root().querySelector('input[type="radio"]')).toBeNull();
      expect(w.button('Continuar')).toBeNull();
      w.button('Volver')?.click();
      await w.settle();
      expect(w.router.url).toBe('/co/form');
    });

    it('AC-02.23 REQ-02.20 while loading shows the fixed "cargando" as status and no continue', async () => {
      const w = await setup();
      const working = w.cms.handler;
      w.cms.handler = (call) => (requestIdOf(call) === 'C5' ? pending() : working(call));
      // The request never answers, so the app never becomes stable: do not wait for whenStable.
      await w.harness.navigateByUrl('/co/plans');
      w.harness.detectChanges();
      expect(
        w.root().querySelector('[role="status"]:not(.global-loading)')?.textContent?.trim(),
      ).toBe('cargando');
      expect(w.button('Continuar')).toBeNull();
      expect(w.root().querySelector('h1')?.textContent?.trim()).toBe('Elige tu plan');
    });

    it('AC-02.24 REQ-02.21 a failure shows "error de carga" and "reintentar"; retrying lists the plans', async () => {
      const w = await setup();
      let fail = true;
      const working = w.cms.handler;
      w.cms.handler = (call) =>
        fail && requestIdOf(call) === 'C5'
          ? Promise.reject(new CmsRequestError('http', 'HTTP 500', 500))
          : working(call);
      await w.open('/co/plans');
      expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe('error de carga');
      expect(w.root().querySelector('input[type="radio"]')).toBeNull();
      expect(w.root().textContent).not.toContain('$');

      fail = false;
      w.button('reintentar')?.click();
      await w.settle();
      expect(w.planIds()).toEqual([ESENCIAL, PLUS, TOTAL]);
    });

    it('REQ-02.21 a failure of the price factors is also "error de carga" (no partial prices)', async () => {
      const w = await setup();
      const working = w.cms.handler;
      w.cms.handler = (call) =>
        requestIdOf(call) === 'C6'
          ? Promise.reject(new CmsRequestError('network', 'down'))
          : working(call);
      await w.open('/co/plans');
      expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe('error de carga');
      expect(w.root().querySelector('input[type="radio"]')).toBeNull();
    });

    it('AC-02.33 a missing continue text shows the generic error, no plans, and no plan request', async () => {
      const co = strapiC3().data[0];
      co.plansStepTexts.continueLabel = '';
      const w = await setup({ co: co as unknown as Record<string, unknown> });
      await w.open('/co/plans');
      expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        'No pudimos mostrar esta sección. Intenta más tarde.',
      );
      expect(w.root().querySelector('input[type="radio"]')).toBeNull();
      expect(w.root().textContent).not.toContain('Continuar');
      expect(w.cms.callsTo('plans')).toEqual([]);
    });
  });
});
