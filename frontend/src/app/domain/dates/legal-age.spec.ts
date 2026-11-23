import { isOfLegalAge } from './legal-age';

describe('isOfLegalAge', () => {
  it.each([
    { today: '2026-11-22', birthDate: '2008-11-22', valid: true },
    { today: '2026-11-22', birthDate: '2008-11-23', valid: false },
    { today: '2026-11-22', birthDate: '2026-11-23', valid: false },
    { today: '2026-02-28', birthDate: '2008-02-29', valid: false },
    { today: '2026-03-01', birthDate: '2008-02-29', valid: true },
  ])(
    'AC-01.18 today $today, birth date $birthDate → valid=$valid (minimum age 18)',
    ({ today, birthDate, valid }) => {
      expect(isOfLegalAge(birthDate, today, 18)).toBe(valid);
    },
  );

  it('REQ-01.20 a future birth date is invalid even with minimum age 0', () => {
    expect(isOfLegalAge('2026-11-23', '2026-11-22', 0)).toBe(false);
    expect(isOfLegalAge('2026-11-22', '2026-11-22', 0)).toBe(true);
  });

  it('REQ-01.20 uses the minimum age of the country from Strapi', () => {
    expect(isOfLegalAge('2006-01-01', '2026-11-22', 18)).toBe(true);
    expect(isOfLegalAge('2006-01-01', '2026-11-22', 21)).toBe(false);
  });

  it('REQ-01.21 a value that is not a calendar date is invalid', () => {
    expect(isOfLegalAge('22/11/2000', '2026-11-22', 18)).toBe(false);
    expect(isOfLegalAge('', '2026-11-22', 18)).toBe(false);
  });
});
