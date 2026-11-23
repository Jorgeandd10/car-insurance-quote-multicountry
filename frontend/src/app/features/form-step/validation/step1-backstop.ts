import { Signal, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Step1Result } from './evaluate-step1';

/**
 * G2 backstop of ADR-0004 for steps 2 and 3 (review 002: F-02.1, F-03.1).
 *
 * `step1CompleteGuard` lets the navigation through when the country configuration fails, so the
 * shell can show "error de carga". When the configuration becomes available (first load or a
 * successful "reintentar"), the page itself evaluates step 1 and, if `isComplete` is false, goes to
 * `/:country/form` with the data kept (REQ-02.19, REQ-03.13). The pages also gate their requests
 * and the payment on the same `Step1Result`.
 *
 * Must be called in an injection context (field initialiser or constructor).
 */
export function step1Backstop(step1: Signal<Step1Result | null>, countryCode: () => string): void {
  const router = inject(Router);
  effect(() => {
    const result = step1();
    if (result !== null && !result.isComplete) {
      untracked(() => {
        void router.navigate(['/', countryCode(), 'form'], { replaceUrl: true });
      });
    }
  });
}
