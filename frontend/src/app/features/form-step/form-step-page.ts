import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CountryConfig } from '../../core/country/country-config';
import { CountryContext } from '../../core/country/country-context';
import { StatusMessage } from '../../shared/status-message';
import { StepHeading } from '../../shared/step-heading';
import { DynamicForm, Step1FormView } from './dynamic-form';
import { Step1ResultReader } from './validation/step1-result-reader';

/** What step 1 shows, derived from the configuration of the country (ADR-0004 `viewState`). */
export type FormStepState =
  | { readonly kind: 'configError'; readonly message: string }
  | { readonly kind: 'empty'; readonly title: string; readonly message: string }
  | { readonly kind: 'unavailable'; readonly title: string; readonly message: string }
  | { readonly kind: 'ready'; readonly title: string; readonly view: Step1FormView };

/**
 * Pure derivation of the state of step 1 (REQ-01.5, REQ-01.13, REQ-01.22):
 *
 * - A missing text of step 1 → generic error of the country instead of the form (AC-01.35).
 * - No valid field → empty-state message of the country, no continue (AC-01.9).
 * - A required role missing → generic error, no continue (AC-01.20).
 */
export function formStepState(
  config: CountryConfig,
  ruleContext: Step1FormView['ruleContext'],
): FormStepState {
  const formTexts = config.texts.formStep;
  const wizardTexts = config.texts.wizard;
  if (
    config.form.status === 'configError' ||
    formTexts.status !== 'ok' ||
    wizardTexts.status !== 'ok'
  ) {
    return { kind: 'configError', message: config.genericErrorMessage };
  }
  const title = formTexts.texts.title;
  switch (config.form.status) {
    case 'empty':
      return { kind: 'empty', title, message: formTexts.texts.emptyMessage };
    case 'unavailable':
      return { kind: 'unavailable', title, message: config.genericErrorMessage };
    case 'ready':
      return {
        kind: 'ready',
        title,
        view: {
          countryCode: config.country.code,
          fields: config.form.fields,
          legends: {
            policyholder: wizardTexts.texts.policyholderSectionLabel,
            vehicle: wizardTexts.texts.vehicleSectionLabel,
          },
          continueLabel: formTexts.texts.continueLabel,
          genericErrorMessage: config.genericErrorMessage,
          ruleContext,
        },
      };
  }
}

/**
 * Step 1, `/:country/form` (US-01). The shell shows "cargando" and "error de carga" while the
 * configuration is not ready (REQ-01.3, REQ-01.4), so this page always has a configuration.
 */
@Component({
  selector: 'app-form-step-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamicForm, StatusMessage, StepHeading],
  template: `
    @if (state(); as s) {
      @if (s.kind === 'configError') {
        <app-status-message kind="message" [message]="s.message" />
      } @else if (s.kind === 'ready') {
        <app-step-heading [text]="s.title" />
        <app-dynamic-form [view]="s.view" />
      } @else {
        <app-step-heading [text]="s.title" />
        <app-status-message kind="message" [message]="s.message" />
      }
    }
  `,
})
export class FormStepPage {
  private readonly context = inject(CountryContext);
  private readonly reader = inject(Step1ResultReader);

  protected readonly state = computed(() => {
    const config = this.context.config();
    return config ? formStepState(config, this.reader.ruleContext(config)) : null;
  });
}
