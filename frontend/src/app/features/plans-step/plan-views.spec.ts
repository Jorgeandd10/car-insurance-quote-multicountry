import { mapPriceFactors } from '../../core/cms/price-factor-mapper';
import { Plan } from '../../domain/plans/plan';
import { buildPlanViews } from './plan-views';
import { clFactorsDto, coFactorsDto, factorsCountryDto } from './testing/plans-fixtures';

const plan = (id: string, basePrice: number, order: number, recommended = false): Plan => ({
  id,
  name: id,
  shortDescription: null,
  basePrice,
  coverages: [],
  benefits: [],
  order,
  recommended,
});

const CO = { intlLocale: 'es-CO', currency: 'COP' };
const CL = { intlLocale: 'es-CL', currency: 'CLP' };
const coRules = mapPriceFactors(factorsCountryDto('co', coFactorsDto()), 'co').rules;
const clRules = mapPriceFactors(factorsCountryDto('cl', clFactorsDto()), 'cl').rules;

describe('buildPlanViews', () => {
  it('AC-02.9 E1: CO base 1 200 000, 2018 and 2000-05-10 → $ 1.320.000 (with U+00A0)', () => {
    const [view] = buildPlanViews(
      { plans: [plan('gold', 1_200_000, 1)], rules: coRules },
      { vehicleYear: 2018, birthDate: '2000-05-10' },
      '2026-11-22',
      CO,
    );
    expect(view.finalPrice).toBe(1_320_000);
    expect(view.formattedPrice).toBe('$ 1.320.000');
  });

  it('AC-02.9 E4 and E6: CL prices with the seed factors of Chile', () => {
    const views = buildPlanViews(
      { plans: [plan('e4', 25_990, 1)], rules: clRules },
      { vehicleYear: 2012, birthDate: '2004-03-15' },
      '2026-11-22',
      CL,
    );
    expect(views[0].formattedPrice).toBe('$38.985');
    const e6 = buildPlanViews(
      { plans: [plan('e6', 19_990, 1)], rules: clRules },
      { vehicleYear: 2017, birthDate: '1990-01-01' },
      '2026-11-22',
      CL,
    );
    expect(e6[0].finalPrice).toBe(21_589);
  });

  it('AC-02.10 without factors each plan shows its base price', () => {
    const [view] = buildPlanViews(
      { plans: [plan('basic', 850_000, 1)], rules: [] },
      { vehicleYear: 2018, birthDate: '2000-05-10' },
      '2026-11-22',
      CO,
    );
    expect(view.finalPrice).toBe(850_000);
  });

  it('REQ-02.5 only the first recommended plan in display order is highlighted', () => {
    const views = buildPlanViews(
      { plans: [plan('a', 1, 1), plan('b', 1, 2, true), plan('c', 1, 3, true)], rules: [] },
      { vehicleYear: null, birthDate: null },
      '2026-11-22',
      CO,
    );
    expect(views.map((v) => v.highlighted)).toEqual([false, true, false]);
  });
});
