import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { isCountryCode } from '../../../core/country/country-config';
import { CountryConfigStore } from '../../../core/country/country-config-store';
import { countryCodeOf } from '../../../core/country/country-route';
import { Step1ResultReader } from './step1-result-reader';

/**
 * Guard of `/:country/plans` and `/:country/summary` (REQ-01.27, REQ-02.19, REQ-03.13; ADR-0004).
 *
 * Waits for the country configuration (in memory after the first load) and evaluates step 1 with
 * it. If `isComplete` is false the navigation goes to `/:country/form`, before the step is
 * activated, so no plan is requested (AC-02.22). Stored data is never touched.
 *
 * It lets the navigation through when the configuration fails or the country is not available:
 * the shell then shows "error de carga" or "país no disponible" (ADR-0004).
 */
export const step1CompleteGuard: CanActivateFn = async (route) => {
  const store = inject(CountryConfigStore);
  const reader = inject(Step1ResultReader);
  const router = inject(Router);

  const code = countryCodeOf(route);
  if (code === null || !isCountryCode(code)) {
    return true;
  }
  const result = await store.whenSettled(code);
  if (result === null || result.status !== 'ready') {
    return true;
  }
  if (reader.read(result.config).isComplete) {
    return true;
  }
  return new RedirectCommand(router.createUrlTree(['/', code, 'form']), { replaceUrl: true });
};
