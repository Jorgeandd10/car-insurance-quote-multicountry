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
  pending,
  requestIdOf,
} from '../../core/cms/testing/fake-cms-client';
import {
  strapiC1,
  strapiC2,
  strapiC3,
  strapiC4Complete,
} from '../../core/cms/testing/strapi-fixtures';

const seedHandler: CmsHandler = async (call) => {
  switch (requestIdOf(call)) {
    case 'C1':
      return strapiC1().data;
    case 'C2':
      return strapiC2().data;
    case 'C3':
      return [{ ...strapiC3().data[0], code: call.query['filters[code][$eq]'] }];
    case 'C4':
      return strapiC4Complete().data;
    default:
      return pending();
  }
};

describe('CountrySelectionPage', () => {
  let cms: FakeCmsClient;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    cms = new FakeCmsClient();
    cms.handler = seedHandler;
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: CmsClient, useValue: cms }],
    });
    harness = await RouterTestingHarness.create();
  });

  const root = () => harness.fixture.nativeElement as HTMLElement;
  const open = async () => {
    await harness.navigateByUrl('/');
    await harness.fixture.whenStable();
  };

  it('AC-01.5 lists the published countries with their Strapi names, and Chile goes to "/cl"', async () => {
    await open();
    const links = Array.from(root().querySelectorAll('nav a'));
    expect(links.map((a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual([
      ['Chile', '/cl'],
      ['Colombia', '/co'],
    ]);

    (links[0] as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/cl/form');
  });

  it('REQ-01.2 every text of "/" comes from Strapi (country-selection)', async () => {
    await open();
    expect(root().querySelector('h1')?.textContent?.trim()).toBe('Cotiza el seguro de tu auto');
    expect(root().querySelector('p')?.textContent?.trim()).toBe('Elige tu país para empezar.');
    expect(root().querySelector('nav')?.getAttribute('aria-label')).toBe('Países disponibles');
    expect(TestBed.inject(Title).getTitle()).toBe('Cotiza el seguro de tu auto');
  });

  it('REQ-01.3 shows the fixed "cargando" while loading', async () => {
    cms.handler = () => pending();
    await harness.navigateByUrl('/');
    harness.detectChanges();
    expect(root().querySelector('[role="status"]')?.textContent?.trim()).toBe('cargando');
    expect(root().querySelector('nav')).toBeNull();
  });

  it('REQ-01.4 if country-selection is not published (404) shows "error de carga" and retries', async () => {
    let fail = true;
    cms.handler = (call) =>
      fail && requestIdOf(call) === 'C2'
        ? Promise.reject(new CmsRequestError('http', 'HTTP 404', 404))
        : seedHandler(call);
    await open();
    expect(root().querySelector('[role="alert"]')?.textContent?.trim()).toBe('error de carga');
    expect(root().querySelector('nav')).toBeNull();

    fail = false;
    root().querySelector('button')?.click();
    await harness.fixture.whenStable();
    expect(root().querySelectorAll('nav a')).toHaveLength(2);
  });

  it('G3-10 a missing required text of "/" is shown as "error de carga", without defaults', async () => {
    cms.handler = (call) =>
      requestIdOf(call) === 'C2'
        ? Promise.resolve({ ...strapiC2().data, heading: '' })
        : seedHandler(call);
    await open();
    expect(root().querySelector('[role="alert"]')?.textContent?.trim()).toBe('error de carga');
    expect(root().querySelector('h1')).toBeNull();
  });
});
