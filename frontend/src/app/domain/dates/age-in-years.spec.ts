import { ageInYears } from './age-in-years';

describe('ageInYears', () => {
  it('REQ-01.20 the birthday counts as completed', () => {
    expect(ageInYears('2008-11-22', '2026-11-22')).toBe(18);
    expect(ageInYears('2008-11-23', '2026-11-22')).toBe(17);
  });

  it('REQ-01.20 someone born on 29 February has the birthday on 1 March in non-leap years', () => {
    expect(ageInYears('2008-02-29', '2026-02-28')).toBe(17);
    expect(ageInYears('2008-02-29', '2026-03-01')).toBe(18);
    expect(ageInYears('2008-02-29', '2028-02-29')).toBe(20);
  });

  it('REQ-02.8 gives the ages of the price examples E1-E6 (reference 2026-11-22)', () => {
    expect(ageInYears('2000-05-10', '2026-11-22')).toBe(26);
    expect(ageInYears('2005-12-01', '2026-11-22')).toBe(20);
    expect(ageInYears('1960-11-22', '2026-11-22')).toBe(66);
    expect(ageInYears('2004-03-15', '2026-11-22')).toBe(22);
    expect(ageInYears('1990-01-01', '2026-11-22')).toBe(36);
  });

  it('REQ-01.20 a future birth date gives a negative age', () => {
    expect(ageInYears('2027-11-23', '2026-11-22')).toBe(-2);
  });

  it('REQ-01.21 returns null for values that are not calendar dates', () => {
    expect(ageInYears('2008-02-30', '2026-11-22')).toBeNull();
    expect(ageInYears('2008-11-22', 'today')).toBeNull();
  });
});
