import { mapPlans } from './plan-mapper';
import { strapiC5 } from './testing/strapi-fixtures';

const COP = { currency: 'COP' };
const plan = (overrides: Record<string, unknown>) => ({ ...strapiC5().data[0], ...overrides });

describe('mapPlans', () => {
  it('REQ-02.3 maps the documented C5 example to the domain', () => {
    expect(mapPlans(strapiC5().data, COP)).toEqual({
      plans: [
        {
          id: 'p0o9i8u7y6t5r4e3w2q1a0s9',
          name: 'Plan Esencial',
          shortDescription: 'Responsabilidad civil y asistencia básica.',
          basePrice: 850000,
          coverages: ['Responsabilidad civil'],
          benefits: ['Grúa 24 h'],
          order: 1,
          recommended: false,
        },
      ],
      warnings: [],
    });
  });

  it('REQ-02.2 a plan that is not active (false or null) is discarded', () => {
    const result = mapPlans(
      [plan({ active: false }), plan({ documentId: 'b', active: null })],
      COP,
    );
    expect(result.plans).toEqual([]);
    expect(result.warnings).toHaveLength(2);
  });

  it('AC-02.14 a plan with another currency is discarded with a warning', () => {
    const result = mapPlans(
      [plan({ documentId: 'usd', currency: 'USD' }), plan({ documentId: 'cop' })],
      COP,
    );
    expect(result.plans.map((p) => p.id)).toEqual(['cop']);
    expect(result.warnings).toEqual([
      '[cms] plan skipped: currency differs from the country currency (id=usd)',
    ]);
  });

  it('AC-02.15 a plan without base price is discarded and the others are kept', () => {
    const result = mapPlans(
      [plan({ documentId: 'none', basePrice: null }), plan({ documentId: 'ok' })],
      COP,
    );
    expect(result.plans.map((p) => p.id)).toEqual(['ok']);
  });

  it.each([
    ['empty name', { name: '  ' }],
    ['base price 0', { basePrice: 0 }],
    ['negative base price', { basePrice: -10 }],
    ['non numeric base price', { basePrice: 'mil' }],
    ['empty documentId', { documentId: '' }],
  ])('REQ-02.25 a malformed plan (%s) is discarded with a warning', (_case, patch) => {
    const result = mapPlans([plan(patch)], COP);
    expect(result.plans).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('REQ-02.25 a numeric string base price is accepted', () => {
    expect(mapPlans([plan({ basePrice: '850000' })], COP).plans[0].basePrice).toBe(850000);
  });

  it('REQ-02.3 null coverages or benefits are empty lists and blank labels are omitted', () => {
    const [mapped] = mapPlans(
      [
        plan({
          coverages: null,
          benefits: [
            { id: 1, label: ' ' },
            { id: 2, label: 'Grúa' },
          ],
        }),
      ],
      COP,
    ).plans;
    expect(mapped.coverages).toEqual([]);
    expect(mapped.benefits).toEqual(['Grúa']);
  });

  it('REQ-02.4 empty or non-integer order is null; recommended is true only when exactly true', () => {
    const plans = mapPlans(
      [
        plan({ documentId: 'a', order: null, recommended: true }),
        plan({ documentId: 'b', order: 2.5, recommended: 'yes' }),
      ],
      COP,
    ).plans;
    expect(plans.map((p) => [p.order, p.recommended])).toEqual([
      [null, true],
      [null, false],
    ]);
  });
});
