import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';
import { countryCodeOf } from './country-route';

/**
 * Never reuses a route component across countries (REQ-01.25, REQ-03.37).
 *
 * The default strategy reuses a component when only the params change, so going from `/cl/form`
 * to `/co/form` kept the shell, its `CountryContext` and the step 1 form created for Chile (the
 * form is built once in `ngOnInit`, ADR-0002). With this strategy everything under `/:country` is
 * created again for the new country. Within one country, routes are reused as usual.
 */
@Injectable()
export class CountryRouteReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    return (
      super.shouldReuseRoute(future, current) && countryCodeOf(future) === countryCodeOf(current)
    );
  }
}
