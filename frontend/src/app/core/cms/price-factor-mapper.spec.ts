import { CmsRequestError } from './cms-error';
import { mapPriceFactors } from './price-factor-mapper';
import { strapiC6 } from './testing/strapi-fixtures';

const withFactors = (priceFactors: unknown) => [{ ...strapiC6().data[0], priceFactors }];

describe('mapPriceFactors', () => {
  it('REQ-02.9 maps the documented C6 example in the configured order', () => {
    expect(mapPriceFactors(strapiC6().data, 'co')).toEqual({
      rules: [
        { role: 'vehicleYear', operand: 'vehicleAge', min: 0, max: 5, multiplier: 1 },
        { role: 'vehicleYear', operand: 'vehicleAge', min: 6, max: 10, multiplier: 1.1 },
        { role: 'birthDate', operand: 'ageInYears', min: 66, max: null, multiplier: 1.15 },
      ],
      warnings: [],
    });
  });

  it('AC-02.10 null or empty priceFactors → no rules (final price = base price)', () => {
    expect(mapPriceFactors(withFactors(null), 'co').rules).toEqual([]);
    expect(mapPriceFactors(withFactors([]), 'co').rules).toEqual([]);
  });

  it('AC-02.13 a band with multiplier 0 is discarded with a warning', () => {
    const result = mapPriceFactors(
      withFactors([
        { id: 1, role: 'vehicleYear', operand: 'vehicleAge', min: 0, max: 5, multiplier: 0 },
        { id: 2, role: 'vehicleYear', operand: 'vehicleAge', min: 6, max: 10, multiplier: 1.1 },
      ]),
      'co',
    );
    expect(result.rules).toEqual([
      { role: 'vehicleYear', operand: 'vehicleAge', min: 6, max: 10, multiplier: 1.1 },
    ]);
    expect(result.warnings).toEqual([
      '[cms] price factor skipped: invalid band (code=co, index=0)',
    ]);
  });

  it.each([
    ['min > max', { min: 10, max: 5 }],
    ['negative multiplier', { multiplier: -1 }],
    ['non numeric multiplier', { multiplier: 'x' }],
    ['non-integer limit', { min: 1.5 }],
    ['unknown role', { role: 'documentNumber' }],
    ['unknown operand', { operand: 'plateAge' }],
    ['incompatible role and operand (G3-10)', { role: 'birthDate', operand: 'vehicleAge' }],
  ])('REQ-02.12 a band with %s is discarded', (_case, patch) => {
    const base = {
      id: 1,
      role: 'vehicleYear',
      operand: 'vehicleAge',
      min: 0,
      max: 5,
      multiplier: 1,
    };
    const result = mapPriceFactors(withFactors([{ ...base, ...patch }]), 'co');
    expect(result.rules).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('REQ-02.9 a decimal multiplier serialised as a string is accepted (ADR-0005)', () => {
    const result = mapPriceFactors(
      withFactors([
        { id: 1, role: 'birthDate', operand: 'ageInYears', min: 18, max: 25, multiplier: '1.2' },
      ]),
      'co',
    );
    expect(result.rules[0].multiplier).toBe(1.2);
  });

  it('REQ-02.21 a country unpublished between steps (no data) is an error', () => {
    expect(() => mapPriceFactors([], 'co')).toThrow(CmsRequestError);
  });
});
