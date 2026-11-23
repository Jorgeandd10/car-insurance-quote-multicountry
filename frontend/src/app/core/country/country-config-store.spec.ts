import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CmsClient } from '../cms/cms-client';
import { CmsRequestError } from '../cms/cms-error';
import { FakeCmsClient, countryOf, requestIdOf } from '../cms/testing/fake-cms-client';
import { strapiC3, strapiC4Complete } from '../cms/testing/strapi-fixtures';
import { CountryConfigStore } from './country-config-store';

describe('CountryConfigStore', () => {
  let cms: FakeCmsClient;
  let store: CountryConfigStore;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cms = new FakeCmsClient();
    cms.handler = async (call) => {
      const id = requestIdOf(call);
      if (id === 'C3') {
        return countryOf(call) === 'co' ? strapiC3().data : [];
      }
      if (id === 'C4') {
        return countryOf(call) === 'co' ? strapiC4Complete().data : [];
      }
      throw new Error(`unexpected ${id}`);
    };
    TestBed.configureTestingModule({ providers: [{ provide: CmsClient, useValue: cms }] });
    store = TestBed.inject(CountryConfigStore);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  it('REQ-01.1 requests C3 and C4 only for the country of the URL and builds a ready config', async () => {
    const ref = store.get('co');
    expect(ref.status()).toBe('loading');
    await settle();

    expect(cms.calls.map((c) => [requestIdOf(c), countryOf(c)])).toEqual([
      ['C3', 'co'],
      ['C4', 'co'],
    ]);
    const value = ref.value();
    expect(value?.status).toBe('ready');
    if (value?.status === 'ready') {
      expect(value.config.country.currency).toBe('COP');
      expect(value.config.form.status).toBe('ready');
      expect(value.config.form.fields.map((f) => f.key)).toEqual([
        'co_documentType',
        'co_documentNumber',
        'co_birthDate',
        'co_vehicleYear',
      ]);
    }
  });

  it('AC-01.6 an unknown country gives notAvailable', async () => {
    const ref = store.get('pe');
    await settle();
    expect(ref.value()).toEqual({ status: 'notAvailable' });
  });

  it('Q-01.20 the configuration is requested once per app load and country', async () => {
    expect(store.get('co')).toBe(store.get('co'));
    await settle();
    store.get('co');
    await settle();
    expect(cms.calls).toHaveLength(2);
  });

  it('REQ-01.4 a failure puts the resource in error and "reintentar" requests it again', async () => {
    let fail = true;
    const working = cms.handler;
    cms.handler = (call) =>
      fail ? Promise.reject(new CmsRequestError('http', 'HTTP 500', 500)) : working(call);

    const ref = store.get('co');
    await settle();
    expect(ref.status()).toBe('error');

    fail = false;
    store.reload('co');
    await settle();
    expect(ref.value()?.status).toBe('ready');
    expect(cms.calls).toHaveLength(4);
  });

  it('REQ-01.7 logs a warning for each skipped field, without user data', async () => {
    const working = cms.handler;
    cms.handler = async (call) =>
      requestIdOf(call) === 'C4'
        ? [
            ...strapiC4Complete().data,
            { key: 'co_bad', label: 'X', type: 'radio', section: 'vehicle' },
          ]
        : working(call);
    store.get('co');
    await settle();
    expect(warn).toHaveBeenCalledWith('[cms] form-field skipped: unknown type (key=co_bad)');
  });

  it('ADR-0004 whenSettled resolves with the result for the step guards, or null on error', async () => {
    const ready = store.whenSettled('co');
    await settle();
    expect((await ready)?.status).toBe('ready');

    cms.handler = () => Promise.reject(new CmsRequestError('network', 'down'));
    const failed = store.whenSettled('cl');
    await settle();
    expect(await failed).toBeNull();
  });

  it('ADR-0004 whenSettled resolves immediately when the configuration is already loaded', async () => {
    store.get('co');
    await settle();
    const again = store.whenSettled('co');
    await settle();
    expect((await again)?.status).toBe('ready');
    expect(cms.calls).toHaveLength(2);
  });
});
