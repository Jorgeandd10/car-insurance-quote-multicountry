import { Routes } from '@angular/router';
import { countryCaseGuard } from './core/country/country-case-guard';
import { WizardScreen } from './features/wizard-shell/wizard-screens';

const screen = (value: WizardScreen) => ({ screen: value });

/**
 * Routes (ADR-0001), all lazy loaded. Step guards that need step 1 data or a selected plan
 * (`step1CompleteGuard`, `planSelectedGuard`, `confirmationGuard`, ADR-0004) arrive with 4b–4d.
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
        loadComponent: () =>
          import('./features/plans-step/plans-step-page').then((m) => m.PlansStepPage),
      },
      {
        path: 'summary',
        data: screen('summary'),
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
