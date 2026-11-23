import { Injectable, inject } from '@angular/core';
import { CmsClient } from '../../core/cms/cms-client';
import { logCmsWarnings } from '../../core/cms/cms-error';
import { plansQuery, priceFactorsQuery } from '../../core/cms/cms-queries';
import { mapPlans } from '../../core/cms/plan-mapper';
import { mapPriceFactors } from '../../core/cms/price-factor-mapper';
import { Country } from '../../core/country/country-config';
import { Plan } from '../../domain/plans/plan';
import { PriceFactorRule } from '../../domain/pricing/compute-final-price';
import { sortPlans } from './sort-plans';

export interface PlansStepData {
  /** Valid plans of the country (active, same currency, well formed) in display order. */
  readonly plans: readonly Plan[];
  /** Valid price bands of the country, in the configured order. */
  readonly rules: readonly PriceFactorRule[];
}

/**
 * Plans (C5, every page, REQ-02.24) and price factors (C6) of a country, requested in parallel
 * on every entry to the step (REQ-02.23) and kept in memory only. Shared with the summary, which
 * must use the same plans and factors (REQ-03.5, REQ-03.14). Any request failure rejects with a
 * `CmsRequestError` ("error de carga").
 */
@Injectable({ providedIn: 'root' })
export class PlansData {
  private readonly cms = inject(CmsClient);

  async load(country: Country, signal: AbortSignal): Promise<PlansStepData> {
    const [planData, factorData] = await Promise.all([
      this.cms.findAll('plans', plansQuery(country.code), signal),
      this.cms.findFirstPage('countries', priceFactorsQuery(country.code), signal),
    ]);
    const plans = mapPlans(planData, country);
    const factors = mapPriceFactors(factorData, country.code);
    logCmsWarnings([...plans.warnings, ...factors.warnings]);
    return { plans: sortPlans(plans.plans, country.intlLocale), rules: factors.rules };
  }
}
