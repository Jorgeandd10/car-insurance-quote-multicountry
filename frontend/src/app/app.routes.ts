import { EnvironmentProviders, Provider } from '@angular/core';
import { RouteReuseStrategy, Routes, provideRouter } from '@angular/router';
import { countryCaseGuard } from './core/country/country-case-guard';
import { CountryRouteReuseStrategy } from './core/country/country-route-reuse-strategy';
import { step1CompleteGuard } from './features/form-step/validation/step1-complete-guard';
import { WizardScreen } from './features/wizard-shell/wizard-screens';

const screen = (value: WizardScreen) => ({ screen: value });

/**
 * Routes (ADR-0001), all lazy loaded. Steps 2 and 3 require a complete step 1 (`step1CompleteGuard`,
 * ADR-0004). `planSelectedGuard` and `confirmationGuard` arrive with US-03 (phase 4d).
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/country-selection/country-selection-page').then(
        (m) => m.CountrySelectionPage,
      ),
  },
  {
    path: ':country',
    canActivate: [countryCaseGuard],
    loadComponent: () =>
      import('./features/wizard-shell/country-shell').then((m) => m.CountryShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'form' },
      {
        path: 'form',
        data: screen('form'),
        loadComponent: () =>
          import('./features/form-step/form-step-page').then((m) => m.FormStepPage),
      },
      {
        path: 'plans',
        data: screen('plans'),
        canActivate: [step1CompleteGuard],
        loadComponent: () =>
          import('./features/plans-step/plans-step-page').then((m) => m.PlansStepPage),
      },
      {
        path: 'summary',
        data: screen('summary'),
        canActivate: [step1CompleteGuard],
        loadComponent: () =>
          import('./features/summary-step/summary-step-page').then((m) => m.SummaryStepPage),
      },
      {
        path: 'confirmation',
        data: screen('confirmation'),
        loadComponent: () =>
          import('./features/confirmation/confirmation-page').then((m) => m.ConfirmationPage),
      },
      { path: '**', redirectTo: 'form' },
    ],
  },
];

/** Router of the app: the routes plus the per-country reuse strategy. Also used by the tests. */
export function provideAppRouting(): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: CountryRouteReuseStrategy },
  ];
}
