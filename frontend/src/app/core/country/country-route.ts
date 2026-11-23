import { ActivatedRouteSnapshot } from '@angular/router';

/**
 * Country segment of the URL for any route under `/:country`. Child routes do not inherit the
 * parent's params (default `paramsInheritanceStrategy`), so the path from the root is searched.
 */
export function countryCodeOf(route: ActivatedRouteSnapshot): string | null {
  for (const snapshot of [...route.pathFromRoot].reverse()) {
    const code = snapshot.paramMap.get('country');
    if (code !== null) {
      return code;
    }
  }
  return null;
}
