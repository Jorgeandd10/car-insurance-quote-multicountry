import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StepPlaceholder } from '../wizard-shell/step-placeholder';

/** Step 3, `/:country/summary` (US-03, phase 4d). Placeholder until its phase: heading only. */
@Component({
  selector: 'app-summary-step-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepPlaceholder],
  template: `<app-step-placeholder screen="summary" />`,
})
export class SummaryStepPage {}
