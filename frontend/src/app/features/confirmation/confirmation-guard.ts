import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { isCountryCode } from '../../core/country/country-config';
import { countryCodeOf } from '../../core/country/country-route';
import { WizardStorage } from '../../core/storage/wizard-storage';

/**
 * Guard of `/:country/confirmation` (REQ-03.29, ADR-0004): without a valid
 * `ciq.v1.{cc}.confirmation` (no successful payment in this session for this country) the
 * navigation goes to `/:country/form`. A corrupt entry is discarded by `WizardStorage`.
 */
export const confirmationGuard: CanActivateFn = (route) => {
  const storage = inject(WizardStorage);
  const router = inject(Router);
  const code = countryCodeOf(route);
  if (code === null || !isCountryCode(code) || storage.readConfirmation(code) !== null) {
    return true;
  }
  return new RedirectCommand(router.createUrlTree(['/', code, 'form']), { replaceUrl: true });
};
