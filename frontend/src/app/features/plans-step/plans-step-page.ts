import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StepPlaceholder } from '../wizard-shell/step-placeholder';

/** Step 2, `/:country/plans` (US-02, phase 4c). Placeholder until its phase: heading only. */
@Component({
  selector: 'app-plans-step-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepPlaceholder],
  template: `<app-step-placeholder screen="plans" />`,
})
export class PlansStepPage {}
