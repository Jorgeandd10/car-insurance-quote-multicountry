import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CMS_TIMEOUT_MS, CmsClient } from './cms-client';
import { CmsRequestError } from './cms-error';
import { plansQuery } from './cms-queries';
import { strapiC2, strapiC5 } from './testing/strapi-fixtures';

const page = (data: unknown[], pageNumber: number, pageCount: number) => ({
  data,
  meta: {
    pagination: { page: pageNumber, pageSize: 100, pageCount, total: data.length * pageCount },
  },
});

/** Lets the client's `await` chain run, so the next sequential request is issued. */
const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('CmsClient', () => {
  let client: CmsClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client = TestBed.inject(CmsClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const expectOne = (path: string): TestRequest =>
    http.expectOne((req) => req.url === `/api/${path}`);

  it('REQ-01.35 sends a GET to the relative /api URL, without Authorization nor credentials', async () => {
    const result = client.findFirstPage('plans', plansQuery('co'));
    const req = expectOne('plans');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.withCredentials).toBe(false);
    req.flush(strapiC5());
    expect(await result).toEqual(strapiC5().data);
  });

  it('REQ-02.21 each request has a 10 000 ms timeout', async () => {
    const result = client.findFirstPage('plans', plansQuery('co'));
    const req = expectOne('plans');
    expect(CMS_TIMEOUT_MS).toBe(10_000);
    expect(req.request.timeout).toBe(10_000);
    req.flush(strapiC5());
    await result;
  });

  it('REQ-01.6 the query is encoded by HttpParams and carries no status parameter', async () => {
    const result = client.findFirstPage('plans', plansQuery('co'));
    const req = expectOne('plans');
    expect(req.request.params.get('filters[country][code][$eq]')).toBe('co');
    expect(req.request.urlWithParams).toContain('filters%5Bcountry%5D%5Bcode%5D%5B$eq%5D=co');
    expect(req.request.params.has('status')).toBe(false);
    req.flush(strapiC5());
    await result;
  });

  it('AC-02.32 REQ-02.24 walks every page in series and concatenates the data', async () => {
    const plans = Array.from({ length: 30 }, (_, i) => ({
      ...strapiC5().data[0],
      documentId: `p${i}`,
    }));
    const result = client.findAll('plans', plansQuery('co'));

    const first = expectOne('plans');
    expect(first.request.params.get('pagination[page]')).toBe('1');
    first.flush(page(plans.slice(0, 10), 1, 3));
    await flushMicrotasks();

    const second = expectOne('plans');
    expect(second.request.params.get('pagination[page]')).toBe('2');
    second.flush(page(plans.slice(10, 20), 2, 3));
    await flushMicrotasks();

    const third = expectOne('plans');
    expect(third.request.params.get('pagination[page]')).toBe('3');
    third.flush(page(plans.slice(20), 3, 3));

    expect((await result).length).toBe(30);
  });

  it('REQ-02.24 a single page is not requested again', async () => {
    const result = client.findAll('plans', plansQuery('co'));
    expectOne('plans').flush(page([{ id: 1 }], 1, 1));
    expect(await result).toEqual([{ id: 1 }]);
  });

  it('REQ-01.4 an HTTP 500 is a request error', async () => {
    const result = client.findFirstPage('plans', plansQuery('co'));
    expectOne('plans').flush('boom', { status: 500, statusText: 'Server Error' });
    await expect(result).rejects.toMatchObject({ kind: 'http', status: 500 });
  });

  it('REQ-01.4 a network error (or timeout) is a request error', async () => {
    const result = client.findFirstPage('plans', plansQuery('co'));
    expectOne('plans').error(new ProgressEvent('error'));
    await expect(result).rejects.toMatchObject({ kind: 'network' });
  });

  it.each([
    ['data missing', { meta: {} }],
    ['data is not an array', { data: { id: 1 } }],
    ['body is not an object', 'hello'],
  ])('REQ-01.4 an unexpected collection shape (%s) is a contract error', async (_case, body) => {
    const result = client.findFirstPage('plans', plansQuery('co'));
    expectOne('plans').flush(body);
    await expect(result).rejects.toBeInstanceOf(CmsRequestError);
  });

  it('REQ-01.2 a single type must have an object in data; a 404 is an error', async () => {
    const ok = client.findSingle('country-selection', {});
    expectOne('country-selection').flush(strapiC2());
    expect(await ok).toEqual(strapiC2().data);

    const array = client.findSingle('country-selection', {});
    expectOne('country-selection').flush({ data: [] });
    await expect(array).rejects.toMatchObject({ kind: 'contract' });

    const notPublished = client.findSingle('country-selection', {});
    expectOne('country-selection').flush({ error: {} }, { status: 404, statusText: 'Not Found' });
    await expect(notPublished).rejects.toMatchObject({ kind: 'http', status: 404 });
  });

  it('ADR-0004 aborting (resource cancelled) cancels the HTTP request', async () => {
    const controller = new AbortController();
    const result = client.findFirstPage('plans', plansQuery('co'), controller.signal);
    const req = expectOne('plans');
    controller.abort();
    expect(req.cancelled).toBe(true);
    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
  });
});
