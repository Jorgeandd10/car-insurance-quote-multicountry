import { strapiC3 } from '../../core/cms/testing/strapi-fixtures';
import { validCoValues } from '../form-step/testing/form-fixtures';
import { WizardContent, createWizardHarness } from '../form-step/testing/wizard-harness';

const CONFIRMATION = {
  quoteNumber: 'CO-20261122-7K3F9Q',
  planName: 'Plan Plus',
  finalPrice: 1_320_000,
  currency: 'COP',
  paidAt: '2026-11-22T17:00:00.000Z',
};

async function setup(patch: Partial<WizardContent> = {}) {
  const w = await createWizardHarness(patch);
  const text = (selector: string) => w.root().querySelector(selector)?.textContent?.trim() ?? null;
  return { ...w, text };
}

describe('ConfirmationPage and confirmationGuard', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('AC-03.30 REQ-03.29 opening the confirmation without a payment in this session goes to step 1', async () => {
    const w = await setup();
    await w.open('/cl/confirmation');
    expect(w.router.url).toBe('/cl/form');
  });

  it('REQ-03.37 a confirmation of Colombia does not open the confirmation of Chile', async () => {
    const w = await setup();
    w.storage.setItem('ciq.v1.co.confirmation', JSON.stringify(CONFIRMATION));
    await w.open('/cl/confirmation');
    expect(w.router.url).toBe('/cl/form');
  });

  it('ADR-0004 a corrupt confirmation is discarded and goes to step 1', async () => {
    const w = await setup();
    w.storage.setItem('ciq.v1.co.confirmation', '{oops');
    await w.open('/co/confirmation');
    expect(w.router.url).toBe('/co/form');
    expect(w.storage.getItem('ciq.v1.co.confirmation')).toBeNull();
  });

  it('AC-03.28 AC-03.31 reloading shows the same number, the plan and the price paid, without personal data', async () => {
    const w = await setup();
    w.storage.setItem('ciq.v1.co.confirmation', JSON.stringify(CONFIRMATION));
    await w.open('/co/confirmation');
    const pairs = Array.from(w.root().querySelectorAll('.item'), (item) => [
      item.querySelector('dt')?.textContent?.trim(),
      item.querySelector('dd')?.textContent?.trim(),
    ]);
    expect(pairs).toEqual([
      ['Número de cotización', 'CO-20261122-7K3F9Q'],
      ['Plan', 'Plan Plus'],
      ['Precio pagado', '$ 1.320.000'],
    ]);
    expect(w.root().textContent).not.toMatch(/1234567890|7890|ABC123/);
  });

  it('AC-03.34 REQ-03.33 the focus is on the heading of the confirmation and no step is current', async () => {
    const w = await setup();
    w.storage.setItem('ciq.v1.co.confirmation', JSON.stringify(CONFIRMATION));
    await w.open('/co/confirmation');
    const heading = w.root().querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('¡Listo!');
    expect(document.activeElement).toBe(heading);
    expect(w.root().querySelector('nav li[aria-current]')).toBeNull();
  });

  it('AC-03.31 REQ-03.28 "nueva cotización" deletes the confirmation and opens an empty step 1', async () => {
    const w = await setup();
    w.storage.setItem('ciq.v1.co.confirmation', JSON.stringify(CONFIRMATION));
    await w.open('/co/confirmation');
    (
      Array.from(w.root().querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Nueva cotización',
      ) as HTMLButtonElement
    ).click();
    await w.settle();
    expect(w.router.url).toBe('/co/form');
    expect(w.storage.getItem('ciq.v1.co.confirmation')).toBeNull();
    expect(w.control('co_plate').value).toBe('');

    await w.open('/co/confirmation');
    expect(w.router.url).toBe('/co/form');
  });

  it('REQ-03.38 a missing confirmation text shows the generic error, never a default', async () => {
    const co = strapiC3().data[0];
    co.confirmationTexts.newQuoteLabel = '';
    const w = await setup({ co: co as unknown as Record<string, unknown> });
    w.storage.setItem('ciq.v1.co.confirmation', JSON.stringify(CONFIRMATION));
    await w.open('/co/confirmation');
    expect(w.text('[role="alert"]')).toBe('No pudimos mostrar esta sección. Intenta más tarde.');
    expect(w.root().querySelector('button')).toBeNull();
  });

  it('REQ-03.28 the confirmation does not bring back step 1 data', async () => {
    const w = await setup();
    w.storage.setItem('ciq.v1.co.step1', JSON.stringify({ values: validCoValues() }));
    w.storage.setItem('ciq.v1.co.confirmation', JSON.stringify(CONFIRMATION));
    await w.open('/co/confirmation');
    expect(w.root().textContent).not.toContain('1234567890');
  });
});
