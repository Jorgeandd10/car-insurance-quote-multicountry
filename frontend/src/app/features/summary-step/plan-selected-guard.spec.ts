import { validCoValues } from '../form-step/testing/form-fixtures';
import { createWizardHarness } from '../form-step/testing/wizard-harness';

describe('planSelectedGuard', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('REQ-03.13 with a complete step 1 but no chosen plan, the summary redirects to step 2', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    await w.open('/co/summary');
    expect(w.router.url).toBe('/co/plans');
  });

  it('REQ-03.13 with a complete step 1 and a chosen plan, the summary opens', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: 'plan-co-plus' }));
    await w.open('/co/summary');
    expect(w.router.url).toBe('/co/summary');
  });

  it('REQ-03.13 an incomplete step 1 wins: without step 1 and without plan, it goes to step 1', async () => {
    const w = await createWizardHarness();
    await w.open('/co/summary');
    expect(w.router.url).toBe('/co/form');
  });

  it('REQ-03.37 a plan chosen in Colombia does not open the summary of Chile', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: 'plan-co-plus' }));
    w.storage.setItem(
      'ciq.v1.cl.step1',
      JSON.stringify({
        values: Object.fromEntries(
          Object.entries(validCoValues()).map(([k, v]) => [k.replace(/^co_/, 'cl_'), v]),
        ),
      }),
    );
    await w.open('/cl/summary');
    expect(w.router.url).toBe('/cl/plans');
  });

  it('ADR-0004 a corrupt stored plan counts as no plan', async () => {
    const w = await createWizardHarness();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    w.storage.setItem('ciq.v1.co.plan', '{broken');
    await w.open('/co/summary');
    expect(w.router.url).toBe('/co/plans');
  });
});
