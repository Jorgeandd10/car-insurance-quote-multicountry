import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { CmsClient } from '../../core/cms/cms-client';
import { CmsRequestError } from '../../core/cms/cms-error';
import {
  CmsHandler,
  FakeCmsClient,
  countryOf,
  pending,
  requestIdOf,
} from '../../core/cms/testing/fake-cms-client';
import { strapiC1, strapiC3, strapiC4Complete } from '../../core/cms/testing/strapi-fixtures';

type C3Country = ReturnType<typeof strapiC3>['data'][number];

/** C1, C3 and C4 answered as the seed would; `patchCountry` edits the C3 country of `co`. */
const seedHandler =
  (patchCountry: (country: C3Country) => void = () => undefined): CmsHandler =>
  async (call) => {
    switch (requestIdOf(call)) {
      case 'C1':
        return strapiC1().data;
      case 'C3': {
        if (countryOf(call) !== 'co') {
          return [];
        }
        const country = strapiC3().data[0];
        patchCountry(country);
        return [country];
      }
      case 'C4':
        return countryOf(call) === 'co' ? strapiC4Complete().data : [];
      default:
        return pending();
    }
  };

describe('CountryShell', () => {
  let cms: FakeCmsClient;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    cms = new FakeCmsClient();
    cms.handler = seedHandler();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: CmsClient, useValue: cms }],
    });
    harness = await RouterTestingHarness.create();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  const root = () => harness.fixture.nativeElement as HTMLElement;
  const text = (selector: string) => root().querySelector(selector)?.textContent?.trim() ?? null;
  const open = async (url: string) => {
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
  };

  it('REQ-01.3 AC-01.7 shows only the fixed "cargando" while the configuration loads', async () => {
    cms.handler = () => pending();
    await harness.navigateByUrl('/co/form');
    harness.detectChanges();
    expect(text('[role="status"]')).toBe('cargando');
    expect(root().querySelector('h1')).toBeNull();
    expect(root().querySelector('nav')).toBeNull();
  });

  it('AC-01.8 shows "error de carga" + "reintentar" and retrying shows the step', async () => {
    let fail = true;
    const working = seedHandler();
    cms.handler = (call) =>
      fail ? Promise.reject(new CmsRequestError('http', 'HTTP 500', 500)) : working(call);

    await open('/co/form');
    expect(text('[role="alert"]')).toBe('error de carga');
    const retry = root().querySelector('button');
    expect(retry?.textContent?.trim()).toBe('reintentar');
    expect(root().querySelector('h1')).toBeNull();

    fail = false;
    retry?.click();
    await harness.fixture.whenStable();
    expect(text('h1')).toBe('Tus datos y los de tu vehículo');
  });

  it('REQ-01.1 requests only the configuration of the country of the URL', async () => {
    await open('/co/form');
    expect(cms.calls.map((c) => [requestIdOf(c), countryOf(c)])).toEqual([
      ['C3', 'co'],
      ['C4', 'co'],
    ]);
  });

  it('REQ-01.31 AC-01.27 the step indicator marks the current step with aria-current="step"', async () => {
    await open('/co/form');
    const nav = root().querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Progreso de la cotización');
    const steps = Array.from(root().querySelectorAll('nav li'));
    expect(steps.map((li) => li.textContent?.replace(/\d/g, '').trim())).toEqual([
      'Tus datos',
      'Planes',
      'Resumen y pago',
    ]);
    expect(steps.map((li) => li.getAttribute('aria-current'))).toEqual(['step', null, null]);

    await open('/co/plans');
    const current = Array.from(root().querySelectorAll('nav li[aria-current="step"]'));
    expect(current.map((li) => li.textContent?.replace(/\d/g, '').trim())).toEqual(['Planes']);
  });

  it('REQ-01.31 the focus goes to the heading of the step and document.title follows it', async () => {
    await open('/co/form');
    const heading = root().querySelector('h1');
    expect(heading?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading);
    expect(TestBed.inject(Title).getTitle()).toBe('Tus datos y los de tu vehículo');

    await open('/co/summary');
    expect(text('h1')).toBe('Resumen');
    expect(document.activeElement).toBe(root().querySelector('h1'));
  });

  it('D7 the confirmation is not a step: no step is marked as current', async () => {
    await open('/co/confirmation');
    expect(text('h1')).toBe('¡Listo!');
    expect(root().querySelector('nav li[aria-current]')).toBeNull();
  });

  it('ADR-0001 "/co" and unknown sub-paths redirect to "/co/form"', async () => {
    await open('/co');
    expect(TestBed.inject(Router).url).toBe('/co/form');
    await open('/co/does/not/exist');
    expect(TestBed.inject(Router).url).toBe('/co/form');
  });

  it('AC-01.6 an unknown code shows "país no disponible" and the published countries as links', async () => {
    await open('/pe/form');
    expect(text('h1')).toBe('país no disponible');
    const links = Array.from(root().querySelectorAll('a'));
    expect(links.map((a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual([
      ['Chile', '/cl'],
      ['Colombia', '/co'],
    ]);
    expect(TestBed.inject(Title).getTitle()).toBe('país no disponible');
  });

  it('REQ-01.2 a code that cannot be a country is not requested to Strapi', async () => {
    await open('/peru/form');
    expect(text('h1')).toBe('país no disponible');
    expect(cms.calls.map(requestIdOf)).toEqual(['C1']);
  });

  it('REQ-01.2 if the country list fails, "país no disponible" shows "error de carga" + "reintentar"', async () => {
    const working = seedHandler();
    cms.handler = (call) =>
      requestIdOf(call) === 'C1'
        ? Promise.reject(new CmsRequestError('network', 'down'))
        : working(call);
    await open('/pe/form');
    expect(text('h1')).toBe('país no disponible');
    expect(text('[role="alert"]')).toBe('error de carga');
    expect(root().querySelector('button')?.textContent?.trim()).toBe('reintentar');
  });

  it('REQ-01.13 a missing step indicator text shows the generic error instead of the wizard', async () => {
    cms.handler = seedHandler((country) => {
      country.wizardTexts.step2Label = '';
    });
    await open('/co/form');
    expect(text('[role="alert"]')).toBe('No pudimos mostrar esta sección. Intenta más tarde.');
    expect(root().querySelector('nav')).toBeNull();
    expect(root().querySelector('h1')).toBeNull();
  });

  it('REQ-02.32 a missing step title shows the generic error of the country, never a default', async () => {
    cms.handler = seedHandler((country) => {
      country.plansStepTexts.title = ' ';
    });
    await open('/co/plans');
    expect(root().querySelector('nav')).not.toBeNull();
    expect(root().querySelector('h1')).toBeNull();
    expect(text('[role="alert"]')).toBe('No pudimos mostrar esta sección. Intenta más tarde.');
  });
});
