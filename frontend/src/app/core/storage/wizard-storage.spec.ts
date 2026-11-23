import { TestBed } from '@angular/core/testing';
import { InMemoryStorage } from './testing/in-memory-storage';
import {
  WIZARD_STORAGE,
  WizardStorage,
  parseStoredStep1,
  wizardStorageKey,
} from './wizard-storage';

describe('WizardStorage', () => {
  let memory: InMemoryStorage;
  let storage: WizardStorage;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    memory = new InMemoryStorage();
    TestBed.configureTestingModule({ providers: [{ provide: WIZARD_STORAGE, useValue: memory }] });
    storage = TestBed.inject(WizardStorage);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  it('ADR-0004 keys are ciq.v1.{cc}.{kind}', () => {
    expect(wizardStorageKey('co', 'step1')).toBe('ciq.v1.co.step1');
    expect(wizardStorageKey('cl', 'plan')).toBe('ciq.v1.cl.plan');
    expect(wizardStorageKey('co', 'confirmation')).toBe('ciq.v1.co.confirmation');
  });

  it('REQ-01.25 a key is only built from a validated lower-case country code', () => {
    expect(() => wizardStorageKey('CO', 'step1')).toThrow();
    expect(() => wizardStorageKey('../x', 'step1')).toThrow();
  });

  it('REQ-01.23 stores only the step 1 values, without any completed flag', () => {
    storage.writeStep1('co', {
      co_documentNumber: '1234567890',
      co_vehicleYear: 2020,
      co_terms: true,
      co_city: null,
    });
    expect(memory.keys()).toEqual(['ciq.v1.co.step1']);
    expect(JSON.parse(memory.getItem('ciq.v1.co.step1') ?? '')).toEqual({
      values: {
        co_documentNumber: '1234567890',
        co_vehicleYear: 2020,
        co_terms: true,
        co_city: null,
      },
    });
    expect(memory.getItem('ciq.v1.co.step1')).not.toMatch(/isComplete|completed/);
  });

  it('AC-01.22 REQ-01.25 data of one country is never read from another', () => {
    storage.writeStep1('co', { co_plate: 'ABC123' });
    expect(storage.readStep1('cl')).toBeNull();
    expect(storage.readStep1('co')?.values).toEqual({ co_plate: 'ABC123' });
    storage.writePlan('co', 'plan-co');
    expect(storage.readPlan('cl')).toBeNull();
  });

  it('REQ-01.26 corrupt JSON is discarded with a warning and the key is removed', () => {
    memory.setItem('ciq.v1.co.step1', '{not json');
    expect(storage.readStep1('co')).toBeNull();
    expect(memory.getItem('ciq.v1.co.step1')).toBeNull();
    expect(warn).toHaveBeenCalledWith('[storage] step1 discarded: invalid JSON');
  });

  it('REQ-01.26 an unexpected shape is discarded', () => {
    memory.setItem('ciq.v1.co.step1', JSON.stringify({ values: ['a'] }));
    expect(storage.readStep1('co')).toBeNull();
    expect(memory.getItem('ciq.v1.co.step1')).toBeNull();
  });

  it('REQ-01.26 a value of an unexpected type is dropped on its own, without logging the value', () => {
    memory.setItem(
      'ciq.v1.co.step1',
      JSON.stringify({ values: { ok: 'ABC123', obj: { a: 1 }, list: [1], num: 7 } }),
    );
    expect(storage.readStep1('co')?.values).toEqual({ ok: 'ABC123', num: 7 });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0][0])).not.toContain('ABC123');
  });

  it('REQ-01.26 a non-finite number is not a valid stored value', () => {
    const parsed = parseStoredStep1('{"values":{"a":1e999}}');
    expect(parsed.value?.values).toEqual({});
  });

  it('REQ-02.16 the plan stores only its documentId', () => {
    storage.writePlan('co', 'p0o9i8u7y6t5r4e3w2q1a0s9');
    expect(JSON.parse(memory.getItem('ciq.v1.co.plan') ?? '')).toEqual({
      planDocumentId: 'p0o9i8u7y6t5r4e3w2q1a0s9',
    });
    expect(storage.readPlan('co')).toEqual({ planDocumentId: 'p0o9i8u7y6t5r4e3w2q1a0s9' });
  });

  it('REQ-02.17 an invalid stored plan is discarded', () => {
    memory.setItem('ciq.v1.co.plan', JSON.stringify({ planDocumentId: 12 }));
    expect(storage.readPlan('co')).toBeNull();
    expect(memory.getItem('ciq.v1.co.plan')).toBeNull();
  });

  it('REQ-03.28 the confirmation round-trips and an incomplete one is discarded', () => {
    const confirmation = {
      quoteNumber: 'CO-20261122-7K3F9Q',
      planName: 'Plan Esencial',
      finalPrice: 1_320_000,
      currency: 'COP',
      paidAt: '2026-11-22T15:04:05.000Z',
    };
    storage.writeConfirmation('co', confirmation);
    expect(storage.readConfirmation('co')).toEqual(confirmation);

    memory.setItem('ciq.v1.cl.confirmation', JSON.stringify({ ...confirmation, finalPrice: '1' }));
    expect(storage.readConfirmation('cl')).toBeNull();
    expect(memory.getItem('ciq.v1.cl.confirmation')).toBeNull();
  });

  it('REQ-03.28 remove deletes only the given key of the given country', () => {
    storage.writeStep1('co', { a: 'x' });
    storage.writePlan('co', 'p');
    storage.writeStep1('cl', { a: 'y' });
    storage.remove('co', 'step1');
    expect(memory.keys().sort()).toEqual(['ciq.v1.cl.step1', 'ciq.v1.co.plan']);
  });

  it('ADR-0004 a storage that throws does not break the app', () => {
    const broken = new InMemoryStorage();
    broken.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    broken.getItem = () => {
      throw new Error('SecurityError');
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: WIZARD_STORAGE, useValue: broken }] });
    const brokenStorage = TestBed.inject(WizardStorage);
    expect(() => brokenStorage.writeStep1('co', { a: 'x' })).not.toThrow();
    expect(brokenStorage.readStep1('co')).toBeNull();
  });
});
