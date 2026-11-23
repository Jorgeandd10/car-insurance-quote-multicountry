import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';

/** Lower-cases only the first path segment of a URL (`/CO/plans?x=1` → `/co/plans?x=1`). */
export function lowercaseFirstSegment(url: string): string {
  return url.replace(/^\/([^/?#;]+)/, (_match, segment: string) => `/${segment.toLowerCase()}`);
}

/**
 * Guard of `/:country`: a country segment with upper-case letters redirects to the same URL in
 * lower case (`/CO` → `/co`, REQ-01.2, ADR-0001). Only the case is normalised: an unknown code is
 * not redirected, the shell shows "país no disponible".
 */
export const countryCaseGuard: CanActivateFn = (route, state) => {
  const segment = route.paramMap.get('country') ?? '';
  if (segment === segment.toLowerCase()) {
    return true;
  }
  const router = inject(Router);
  return new RedirectCommand(router.parseUrl(lowercaseFirstSegment(state.url)), {
    replaceUrl: true,
  });
};
