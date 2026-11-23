import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StepPlaceholder } from '../wizard-shell/step-placeholder';

/** Step 1, `/:country/form` (US-01, phase 4b). Placeholder until its phase: heading only. */
@Component({
  selector: 'app-form-step-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepPlaceholder],
  template: `<app-step-placeholder screen="form" />`,
})
export class FormStepPage {}
