import { TestBed } from '@angular/core/testing';
import { isOfLegalAge } from '../../domain/dates/legal-age';
import { WIZARD_STORAGE, WizardStorage } from '../storage/wizard-storage';
import { InMemoryStorage } from '../storage/testing/in-memory-storage';
import { CLOCK, todayLocal } from './clock';

describe('clock', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('REQ-01.21 todayLocal gives the local calendar date as YYYY-MM-DD', () => {
    vi.stubEnv('TZ', 'UTC');
    expect(todayLocal(new Date('2026-03-05T10:00:00Z'))).toBe('2026-03-05');
  });

  it('AC-01.19 dates are not shifted by the time zone (America/Bogota, 20:00 local = 01:00 UTC next day)', () => {
    vi.stubEnv('TZ', 'America/Bogota');
    const now = new Date('2026-11-23T01:00:00Z');

    const today = todayLocal(now);
    expect(today).toBe('2026-11-22');
    // 17 years old on the local date: invalid.
    expect(isOfLegalAge('2008-11-23', today, 18)).toBe(false);

    // The stored value is exactly the calendar date typed by the user.
    TestBed.configureTestingModule({
      providers: [{ provide: WIZARD_STORAGE, useValue: new InMemoryStorage() }],
    });
    const storage = TestBed.inject(WizardStorage);
    storage.writeStep1('co', { co_birthDate: '2008-11-23' });
    expect(storage.readStep1('co')?.values['co_birthDate']).toBe('2008-11-23');
  });

  it('REQ-01.21 control: changing TZ really changes the local date (Asia/Tokyo is a day ahead)', () => {
    // Guards AC-01.19 against a host that is already in America/Bogota.
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(todayLocal(new Date('2026-11-22T20:00:00Z'))).toBe('2026-11-23');
    vi.stubEnv('TZ', 'America/Bogota');
    expect(todayLocal(new Date('2026-11-22T20:00:00Z'))).toBe('2026-11-22');
  });

  it('REQ-01.21 CLOCK is injectable and can be replaced in tests', () => {
    const fixed = new Date('2026-11-22T12:00:00Z');
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => fixed }] });
    expect(TestBed.inject(CLOCK)()).toBe(fixed);
  });

  it('REQ-01.21 the default CLOCK returns the current date', () => {
    const before = Date.now();
    const now = TestBed.inject(CLOCK)().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
  });
});
