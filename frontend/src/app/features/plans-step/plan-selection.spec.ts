import { Plan } from '../../domain/plans/plan';
import { restorePlanSelection } from './plan-selection';

const plan = (id: string): Plan => ({
  id,
  name: id,
  shortDescription: null,
  basePrice: 1000,
  coverages: [],
  benefits: [],
  order: null,
  recommended: false,
});

describe('restorePlanSelection', () => {
  const plans = [plan('basic'), plan('gold')];

  it('REQ-02.16 a stored plan that is still available is preselected', () => {
    expect(restorePlanSelection('gold', plans)).toEqual({ selectedId: 'gold', discarded: false });
  });

  it('AC-02.21 REQ-02.17 a stored plan that is no longer in the list is discarded', () => {
    expect(restorePlanSelection('platinum', plans)).toEqual({ selectedId: null, discarded: true });
  });

  it('REQ-02.15 without a stored plan nothing is selected and there is no notice', () => {
    expect(restorePlanSelection(null, plans)).toEqual({ selectedId: null, discarded: false });
  });

  it('REQ-02.22 with an empty list a stored plan is discarded', () => {
    expect(restorePlanSelection('gold', [])).toEqual({ selectedId: null, discarded: true });
  });
});
