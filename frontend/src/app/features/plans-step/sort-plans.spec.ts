import { Plan } from '../../domain/plans/plan';
import { recommendedPlanId, sortPlans } from './sort-plans';

const plan = (id: string, name: string, order: number | null, recommended = false): Plan => ({
  id,
  name,
  shortDescription: null,
  basePrice: 1000,
  coverages: [],
  benefits: [],
  order,
  recommended,
});

describe('sortPlans', () => {
  it('AC-02.6 orders by order, ties by name, empty order last: Basic, Gold, Plus, Lite', () => {
    const plans = [
      plan('g', 'Gold', 2),
      plan('b', 'Basic', 1),
      plan('p', 'Plus', 2),
      plan('l', 'Lite', null),
    ];
    expect(sortPlans(plans, 'es-CO').map((p) => p.name)).toEqual(['Basic', 'Gold', 'Plus', 'Lite']);
  });

  it('REQ-02.4 several plans without order keep name order after the ordered ones', () => {
    const plans = [plan('z', 'Zeta', null), plan('a', 'Alfa', null), plan('m', 'Medio', 5)];
    expect(sortPlans(plans, 'es-CO').map((p) => p.name)).toEqual(['Medio', 'Alfa', 'Zeta']);
  });

  it('REQ-02.4 the name is compared with the locale of the country', () => {
    // Spanish collation: "Ñandú" goes after "Nube" and before "Oro"; code units would put it last.
    const plans = [plan('3', 'Oro', 1), plan('1', 'Ñandú', 1), plan('2', 'Nube', 1)];
    expect(sortPlans(plans, 'es-CL').map((p) => p.name)).toEqual(['Nube', 'Ñandú', 'Oro']);
  });

  it('REQ-02.4 with same order and name, the documentId decides', () => {
    const plans = [plan('b-doc', 'Plan', 1), plan('a-doc', 'Plan', 1)];
    expect(sortPlans(plans, 'es-CO').map((p) => p.id)).toEqual(['a-doc', 'b-doc']);
  });

  it('REQ-02.4 is pure: the input array is not modified', () => {
    const plans = Object.freeze([plan('b', 'B', 2), plan('a', 'A', 1)]);
    expect(sortPlans(plans, 'es-CO').map((p) => p.id)).toEqual(['a', 'b']);
    expect(plans.map((p) => p.id)).toEqual(['b', 'a']);
  });
});

describe('recommendedPlanId', () => {
  it('AC-02.7 with Basic (order 1) and Gold (order 2) recommended, only Basic is highlighted', () => {
    const sorted = sortPlans([plan('g', 'Gold', 2, true), plan('b', 'Basic', 1, true)], 'es-CO');
    expect(recommendedPlanId(sorted)).toBe('b');
  });

  it('Q-02.1 with no plan marked nothing is highlighted', () => {
    expect(recommendedPlanId([plan('a', 'A', 1), plan('b', 'B', 2)])).toBeNull();
  });
});
