import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { isCountryCode } from '../../core/country/country-config';
import { countryCodeOf } from '../../core/country/country-route';
import { WizardStorage } from '../../core/storage/wizard-storage';

/**
 * Guard of `/:country/summary` (REQ-03.13, ADR-0004): without `ciq.v1.{cc}.plan` the navigation
 * goes to `/:country/plans`. It runs together with `step1CompleteGuard`, which is declared first,
 * so an incomplete step 1 wins and goes to `/:country/form`.
 *
 * It only checks that a plan was chosen. Whether that plan is still available is checked by the
 * summary against the current list (REQ-03.14, phase 4d).
 */
export const planSelectedGuard: CanActivateFn = (route) => {
  const storage = inject(WizardStorage);
  const router = inject(Router);
  const code = countryCodeOf(route);
  if (code === null || !isCountryCode(code) || storage.readPlan(code) !== null) {
    return true;
  }
  return new RedirectCommand(router.createUrlTree(['/', code, 'plans']), { replaceUrl: true });
};
