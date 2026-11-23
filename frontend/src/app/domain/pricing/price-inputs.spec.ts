import { priceInputsFrom } from './price-inputs';

describe('priceInputsFrom', () => {
  it('REQ-02.10 takes the values by role, never by key or label', () => {
    const inputs = priceInputsFrom({
      fields: [
        { role: null, value: 1999 },
        { role: 'vehicleYear', value: 2018 },
        { role: 'birthDate', value: '2000-05-10' },
      ],
    });
    expect(inputs).toEqual({ vehicleYear: 2018, birthDate: '2000-05-10' });
  });

  it('AC-02.11 without a field with role birthDate its input is null (factor 1)', () => {
    expect(priceInputsFrom({ fields: [{ role: 'vehicleYear', value: 2018 }] })).toEqual({
      vehicleYear: 2018,
      birthDate: null,
    });
  });

  it('REQ-02.10 empty or unusable values are null', () => {
    expect(
      priceInputsFrom({
        fields: [
          { role: 'vehicleYear', value: null },
          { role: 'birthDate', value: '' },
        ],
      }),
    ).toEqual({ vehicleYear: null, birthDate: null });
    expect(
      priceInputsFrom({ fields: [{ role: 'vehicleYear', value: Number.NaN }] }).vehicleYear,
    ).toBeNull();
  });

  it('ADR-0005 with several fields of the same role the first in display order is used', () => {
    const inputs = priceInputsFrom({
      fields: [
        { role: 'vehicleYear', value: 2010 },
        { role: 'vehicleYear', value: 2020 },
      ],
    });
    expect(inputs.vehicleYear).toBe(2010);
  });
});
