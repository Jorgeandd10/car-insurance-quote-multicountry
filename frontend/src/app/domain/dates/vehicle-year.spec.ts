import { isVehicleYearValid, vehicleAge } from './vehicle-year';

describe('vehicle year', () => {
  it.each([
    { year: 2005, valid: false },
    { year: 2006, valid: true },
    { year: 2026, valid: true },
    { year: 2027, valid: true },
    { year: 2028, valid: false },
  ])('AC-01.17 today 2026-11-22, year $year → valid=$valid', ({ year, valid }) => {
    expect(isVehicleYearValid(year, '2026-11-22')).toBe(valid);
  });

  it('REQ-01.19 only integers are valid', () => {
    expect(isVehicleYearValid(2020.5, '2026-11-22')).toBe(false);
    expect(isVehicleYearValid(Number.NaN, '2026-11-22')).toBe(false);
  });

  it('REQ-01.19 the current year comes from the reference date, limits inclusive', () => {
    expect(isVehicleYearValid(2010, '2030-01-01')).toBe(true);
    expect(isVehicleYearValid(2009, '2030-01-01')).toBe(false);
    expect(isVehicleYearValid(2031, '2030-12-31')).toBe(true);
  });

  it('AC-02.12 a vehicle from next year has vehicle age 0, not -1', () => {
    expect(vehicleAge(2027, '2026-11-22')).toBe(0);
  });

  it('REQ-02.8 vehicle age is the difference of years (E1, E3, E4)', () => {
    expect(vehicleAge(2018, '2026-11-22')).toBe(8);
    expect(vehicleAge(2006, '2026-11-22')).toBe(20);
    expect(vehicleAge(2012, '2026-11-22')).toBe(14);
  });

  it('REQ-02.10 a non-integer year has no vehicle age', () => {
    expect(vehicleAge(2018.5, '2026-11-22')).toBeNull();
  });
});
