import { CmsRequestError } from '../../../core/cms/cms-error';
import { coFormFieldsDto, validCoValues } from '../testing/form-fixtures';
import { createWizardHarness } from '../testing/wizard-harness';

describe('step1CompleteGuard', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('AC-02.22 without step 1 data for Chile, "/cl/plans" redirects to "/cl/form" and no plan is requested', async () => {
    const w = await createWizardHarness();
    await w.open('/cl/plans');
    expect(w.router.url).toBe('/cl/form');
    expect(w.cms.callsTo('plans')).toEqual([]);
    expect(w.storage.keys()).toEqual(['ciq.v1.cl.step1']);
  });

  it('AC-02.22 valid data that a new required field makes incomplete redirects to step 1, keeping the data', async () => {
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
      },
    ];
    const w = await createWizardHarness({ coFields: withNewField });
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    await w.open('/co/plans');
    expect(w.router.url).toBe('/co/form');
    expect(w.control('co_plate').value).toBe('ABC123');
    expect(w.cms.callsTo('plans')).toEqual([]);
  });

  it('REQ-02.19 a complete step 1 lets the plans step open', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    await w.open('/co/plans');
    expect(w.router.url).toBe('/co/plans');
    expect(w.root().querySelector('h1')?.textContent?.trim()).toBe('Elige tu plan');
  });

  it('REQ-03.13 the summary also requires a complete step 1', async () => {
    const w = await createWizardHarness();
    await w.open('/co/summary');
    expect(w.router.url).toBe('/co/form');

    // With step 1 complete, the summary also needs a chosen plan (planSelectedGuard).
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: 'plan-co-plus' }));
    await w.open('/co/summary');
    expect(w.router.url).toBe('/co/summary');
  });

  it('REQ-01.25 complete data of Colombia does not open the plans of Chile', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    await w.open('/cl/plans');
    expect(w.router.url).toBe('/cl/form');
  });

  it('ADR-0004 if the configuration fails, the guard lets the navigation through and the shell shows the error', async () => {
    const w = await createWizardHarness();
    w.cms.handler = () => Promise.reject(new CmsRequestError('http', 'HTTP 500', 500));
    await w.open('/co/plans');
    expect(w.router.url).toBe('/co/plans');
    expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe('error de carga');
  });

  it('REQ-01.2 an unknown country is not redirected: the shell shows "país no disponible"', async () => {
    const w = await createWizardHarness();
    await w.open('/pe/plans');
    expect(w.router.url).toBe('/pe/plans');
    expect(w.root().querySelector('h1')?.textContent?.trim()).toBe('país no disponible');
  });

  it('G2-10 the guard never writes a "completed" flag', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    await w.open('/co/plans');
    expect(JSON.stringify(w.storedStep1('co'))).not.toMatch(/complete/i);
    expect(w.storage.keys()).toEqual(['ciq.v1.co.step1']);
  });
});
