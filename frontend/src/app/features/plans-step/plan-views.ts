import { Country } from '../../core/country/country-config';
import { Plan } from '../../domain/plans/plan';
import { PriceInputs, computeFinalPrice } from '../../domain/pricing/compute-final-price';
import { formatPrice } from '../../domain/pricing/format-price';
import { PlansStepData } from './plans-data';
import { recommendedPlanId } from './sort-plans';

/** A plan as shown in step 2. Nothing of this is persisted (G2-9). */
export interface PlanView {
  readonly plan: Plan;
  /** `Math.round(basePrice × Π factors)` (REQ-02.8, REQ-02.11). */
  readonly finalPrice: number;
  /** In the currency and format of the country, without decimals (REQ-02.6). */
  readonly formattedPrice: string;
  /** Only the first recommended plan in display order (REQ-02.5). */
  readonly highlighted: boolean;
}

/**
 * Pure: the plans of step 2 with their final price, computed with the same function the summary
 * uses (REQ-02.18, REQ-03.5) and the step 1 values by role (REQ-02.10).
 */
export function buildPlanViews(
  data: PlansStepData,
  inputs: PriceInputs,
  referenceDate: string,
  country: Pick<Country, 'intlLocale' | 'currency'>,
): PlanView[] {
  const recommended = recommendedPlanId(data.plans);
  return data.plans.map((plan) => {
    const { finalPrice } = computeFinalPrice(plan.basePrice, inputs, data.rules, referenceDate);
    return {
      plan,
      finalPrice,
      formattedPrice: formatPrice(finalPrice, country.intlLocale, country.currency),
      highlighted: plan.id === recommended,
    };
  });
}
