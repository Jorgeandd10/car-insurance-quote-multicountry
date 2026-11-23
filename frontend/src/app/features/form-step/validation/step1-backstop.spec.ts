import { CmsRequestError } from '../../../core/cms/cms-error';
import { requestIdOf } from '../../../core/cms/testing/fake-cms-client';
import { coFormFieldsDto, validCoValues } from '../testing/form-fixtures';
import { WizardHarness, createWizardHarness } from '../testing/wizard-harness';

/**
 * Review 002, F-02.1 and F-03.1 (G4): when the country configuration fails on a direct entry to
 * step 2 or 3, `step1CompleteGuard` lets the navigation through (ADR-0004). After a successful
 * "reintentar" the page itself must evaluate `isComplete` and go to step 1 (ADR-0004, G2 backstop).
 */
async function failConfigThenRetry(w: WizardHarness, url: string): Promise<void> {
  let fail = true;
  const working = w.cms.handler;
  w.cms.handler = (call) =>
    fail && (requestIdOf(call) === 'C3' || requestIdOf(call) === 'C4')
      ? Promise.reject(new CmsRequestError('http', 'HTTP 500', 500))
      : working(call);

  await w.open(url);
  expect(w.router.url).toBe(url);
  expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe('error de carga');

  fail = false;
  const retry = Array.from(w.root().querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'reintentar',
  ) as HTMLButtonElement;
  retry.click();
  await w.settle();
  await w.settle();
}

/** A stored step 1 that a new required field of the current configuration makes incomplete. */
const withNewRequiredField = () => [
  ...coFormFieldsDto(),
  {
    id: 99,
    key: 'co_color',
    label: 'Color',
    type: 'text',
    required: true,
    order: 5,
    section: 'vehicle',
  },
];

describe('step 1 backstop after a configuration retry (review 002)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('F-02.1 REQ-02.19 on /plans, an incomplete step 1 goes to the form after the retry, without requesting plans', async () => {
    const w = await createWizardHarness({ coFields: withNewRequiredField() });
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));

    await failConfigThenRetry(w, '/co/plans');

    expect(w.router.url).toBe('/co/form');
    expect(w.cms.callsTo('plans')).toEqual([]);
    expect(w.root().querySelector('input[type="radio"]')).toBeNull();
    expect(w.control('co_plate').value).toBe('ABC123');
  });

  it('F-02.1 on /plans, a complete step 1 shows the plans after the retry', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));

    await failConfigThenRetry(w, '/co/plans');

    expect(w.router.url).toBe('/co/plans');
    expect(w.root().querySelectorAll('input[type="radio"]').length).toBe(3);
  });

  it('F-03.1 REQ-03.13 on /summary, no step 1 data goes to the form after the retry, without requesting plans or terms', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: 'plan-co-plus' }));

    await failConfigThenRetry(w, '/co/summary');

    expect(w.router.url).toBe('/co/form');
    expect(w.cms.callsTo('plans')).toEqual([]);
    expect(w.cms.calls.filter((c) => requestIdOf(c) === 'C7')).toEqual([]);
    expect(w.root().querySelector('button.pay')).toBeNull();
  });

  it('F-03.1 REQ-03.13 on /summary, a step 1 made incomplete by the configuration goes to the form with the data kept', async () => {
    const w = await createWizardHarness({ coFields: withNewRequiredField() });
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: 'plan-co-plus' }));

    await failConfigThenRetry(w, '/co/summary');

    expect(w.router.url).toBe('/co/form');
    expect(w.control('co_plate').value).toBe('ABC123');
    expect(w.storedPlan('co')).toEqual({ planDocumentId: 'plan-co-plus' });
  });

  it('F-03.1 on /summary, a complete step 1 shows the summary after the retry', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: 'plan-co-plus' }));

    await failConfigThenRetry(w, '/co/summary');

    expect(w.router.url).toBe('/co/summary');
    expect(w.root().querySelector('.plan-name')?.textContent?.trim()).toBe('Plan Plus');
  });
});
