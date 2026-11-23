import { PriceFactorRule, computeFinalPrice } from './compute-final-price';

const REFERENCE_DATE = '2026-11-22';

const band = (
  role: PriceFactorRule['role'],
  min: number | null,
  max: number | null,
  multiplier: number,
): PriceFactorRule => ({
  role,
  operand: role === 'vehicleYear' ? 'vehicleAge' : 'ageInYears',
  min,
  max,
  multiplier,
});

/** Seed factors of US-02 §6.3 / pricing-rule.md §3. */
const CO_FACTORS: readonly PriceFactorRule[] = [
  band('vehicleYear', 0, 5, 1.0),
  band('vehicleYear', 6, 10, 1.1),
  band('vehicleYear', 11, 20, 1.25),
  band('birthDate', 18, 25, 1.2),
  band('birthDate', 26, 65, 1.0),
  band('birthDate', 66, null, 1.15),
];

const CL_FACTORS: readonly PriceFactorRule[] = [
  band('vehicleYear', 0, 5, 1.0),
  band('vehicleYear', 6, 12, 1.08),
  band('vehicleYear', 13, 20, 1.2),
  band('birthDate', 18, 24, 1.25),
  band('birthDate', 25, 70, 1.0),
  band('birthDate', 71, null, 1.1),
];

describe('computeFinalPrice', () => {
  it.each([
    {
      id: 'E1',
      factors: CO_FACTORS,
      base: 1_200_000,
      year: 2018,
      birth: '2000-05-10',
      ages: [8, 26],
      final: 1_320_000,
    },
    {
      id: 'E2',
      factors: CO_FACTORS,
      base: 1_200_000,
      year: 2027,
      birth: '2005-12-01',
      ages: [0, 20],
      final: 1_440_000,
    },
    {
      id: 'E3',
      factors: CO_FACTORS,
      base: 850_000,
      year: 2006,
      birth: '1960-11-22',
      ages: [20, 66],
      final: 1_221_875,
    },
    {
      id: 'E4',
      factors: CL_FACTORS,
      base: 25_990,
      year: 2012,
      birth: '2004-03-15',
      ages: [14, 22],
      final: 38_985,
    },
    {
      id: 'E5',
      factors: CL_FACTORS,
      base: 25_990,
      year: 2022,
      birth: null,
      ages: [4, null],
      final: 25_990,
    },
    {
      id: 'E6',
      factors: CL_FACTORS,
      base: 19_990,
      year: 2017,
      birth: '1990-01-01',
      ages: [9, 36],
      final: 21_589,
    },
  ])('AC-02.9 $id final price is $final', ({ factors, base, year, birth, ages, final }) => {
    const result = computeFinalPrice(
      base,
      { vehicleYear: year, birthDate: birth },
      factors,
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(final);
    expect(result.appliedFactors.map((f) => f.x)).toEqual(ages);
  });

  it('AC-02.9 reports the multiplier applied for each role (E3: both limits inclusive)', () => {
    const result = computeFinalPrice(
      850_000,
      { vehicleYear: 2006, birthDate: '1960-11-22' },
      CO_FACTORS,
      REFERENCE_DATE,
    );
    expect(result.appliedFactors).toEqual([
      { role: 'vehicleYear', operand: 'vehicleAge', x: 20, multiplier: 1.25 },
      { role: 'birthDate', operand: 'ageInYears', x: 66, multiplier: 1.15 },
    ]);
  });

  it('AC-02.10 without price factors the final price is the base price', () => {
    const result = computeFinalPrice(
      850_000,
      { vehicleYear: 2018, birthDate: '2000-05-10' },
      [],
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(850_000);
    expect(result.appliedFactors).toEqual([]);
  });

  it('AC-02.11 without a value for birthDate its factor is 1 and vehicleYear still applies', () => {
    const result = computeFinalPrice(
      1_000_000,
      { vehicleYear: 2018, birthDate: null },
      CO_FACTORS,
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(1_100_000);
    expect(result.appliedFactors).toContainEqual({
      role: 'birthDate',
      operand: 'ageInYears',
      x: null,
      multiplier: 1,
    });
  });

  it('REQ-02.10 a value that cannot be interpreted gives factor 1', () => {
    const result = computeFinalPrice(
      1_000_000,
      { vehicleYear: 2018.5, birthDate: '2000-02-30' },
      CO_FACTORS,
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(1_000_000);
  });

  it('AC-02.12 a vehicle from next year uses vehicle age 0', () => {
    const result = computeFinalPrice(
      100,
      { vehicleYear: 2027, birthDate: null },
      CO_FACTORS,
      REFERENCE_DATE,
    );
    expect(result.appliedFactors[0]).toEqual({
      role: 'vehicleYear',
      operand: 'vehicleAge',
      x: 0,
      multiplier: 1,
    });
  });

  it('AC-02.13 a band with multiplier 0 is ignored and the remaining valid bands apply', () => {
    const rules = [band('vehicleYear', 0, 10, 0), band('vehicleYear', 6, 10, 1.1)];
    const result = computeFinalPrice(
      1_000_000,
      { vehicleYear: 2018, birthDate: null },
      rules,
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(1_100_000);
  });

  it('REQ-02.12 bands with a negative or non-finite multiplier or min > max are discarded', () => {
    const rules = [
      band('vehicleYear', 0, 10, -1),
      band('vehicleYear', 0, 10, Number.POSITIVE_INFINITY),
      band('vehicleYear', 10, 0, 2),
    ];
    const result = computeFinalPrice(
      1_000,
      { vehicleYear: 2018, birthDate: null },
      rules,
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(1_000);
    expect(result.appliedFactors).toEqual([]);
  });

  it('REQ-02.12 with overlapping bands the first in the configured order wins', () => {
    const rules = [band('vehicleYear', 0, 10, 1.5), band('vehicleYear', 5, 10, 2)];
    const result = computeFinalPrice(
      1_000,
      { vehicleYear: 2018, birthDate: null },
      rules,
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(1_500);
  });

  it('REQ-02.12 a band with an incompatible role and operand is discarded (G3-10)', () => {
    const rules: PriceFactorRule[] = [
      { role: 'birthDate', operand: 'vehicleAge', min: 0, max: 100, multiplier: 3 },
    ];
    const result = computeFinalPrice(
      1_000,
      { vehicleYear: 2018, birthDate: '2000-05-10' },
      rules,
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(1_000);
  });

  it('REQ-02.11 rounds once at the end, not after each factor', () => {
    // 1 × 1.4 × 1.4 = 1.96 → 2. Rounding after each factor would give 1.
    const rules = [band('vehicleYear', null, null, 1.4), band('birthDate', null, null, 1.4)];
    const result = computeFinalPrice(
      1,
      { vehicleYear: 2018, birthDate: '2000-05-10' },
      rules,
      REFERENCE_DATE,
    );
    expect(result.finalPrice).toBe(2);
  });

  it('REQ-02.8 is pure: same inputs give the same output and the rules are not modified', () => {
    const rules = Object.freeze(CO_FACTORS.map((r) => Object.freeze({ ...r })));
    const inputs = Object.freeze({ vehicleYear: 2018, birthDate: '2000-05-10' });
    const first = computeFinalPrice(1_200_000, inputs, rules, REFERENCE_DATE);
    const second = computeFinalPrice(1_200_000, inputs, rules, REFERENCE_DATE);
    expect(second).toEqual(first);
  });

  it('REQ-02.8 depends on the reference date passed in, not on the clock', () => {
    const inputs = { vehicleYear: 2018, birthDate: '2000-05-10' };
    expect(computeFinalPrice(1_200_000, inputs, CO_FACTORS, '2023-01-01').finalPrice).toBe(
      1_440_000,
    );
    expect(computeFinalPrice(1_200_000, inputs, CO_FACTORS, '2026-11-22').finalPrice).toBe(
      1_320_000,
    );
  });
});
