import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CountryContext } from '../../core/country/country-context';
import { StatusMessage } from '../../shared/status-message';
import { StepHeading } from '../../shared/step-heading';
import { WizardScreen, screenHeading } from './wizard-screens';

/**
 * Temporary body of a step (phase 4a): only its heading, so that routing, focus and the step
 * indicator can be exercised. Phases 4b–4d replace it with the real screens.
 */
@Component({
  selector: 'app-step-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusMessage, StepHeading],
  template: `
    @if (heading(); as heading) {
      @if (heading.kind === 'title') {
        <app-step-heading [text]="heading.text" />
      } @else {
        <app-status-message kind="message" [message]="heading.text" />
      }
    }
  `,
})
export class StepPlaceholder {
  readonly screen = input.required<WizardScreen>();

  private readonly context = inject(CountryContext);

  protected readonly heading = computed(() => {
    const config = this.context.config();
    return config ? screenHeading(config, this.screen()) : null;
  });
}
