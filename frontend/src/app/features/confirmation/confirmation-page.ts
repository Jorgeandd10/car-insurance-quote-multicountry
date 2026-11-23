import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StepPlaceholder } from '../wizard-shell/step-placeholder';

/** Confirmation, `/:country/confirmation` (US-03, phase 4d). Not a step (D7). Heading only for now. */
@Component({
  selector: 'app-confirmation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepPlaceholder],
  template: `<app-step-placeholder screen="confirmation" />`,
})
export class ConfirmationPage {}
