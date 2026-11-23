import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StepNumber } from './wizard-screens';

/**
 * Indicator of the 3 steps (D7). The current one has `aria-current="step"` (REQ-01.31); every
 * text (accessible name and step names) comes from Strapi (`ui.wizard-texts`).
 */
@Component({
  selector: 'app-step-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="step-indicator" [attr.aria-label]="label()">
      <ol>
        @for (step of steps(); track $index) {
          <li
            [class.current]="current() === $index + 1"
            [attr.aria-current]="current() === $index + 1 ? 'step' : null"
          >
            <span class="number" aria-hidden="true">{{ $index + 1 }}</span>
            <span class="name">{{ step }}</span>
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    ol {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4a4a4a;
    }
    .number {
      display: inline-grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border: 2px solid currentColor;
      border-radius: 50%;
      font-size: 0.875rem;
    }
    .current {
      color: #0b57d0;
      font-weight: 700;
    }
    .current .number {
      background: #0b57d0;
      border-color: #0b57d0;
      color: #ffffff;
    }
  `,
})
export class StepIndicator {
  /** Accessible name of the indicator (`stepIndicatorLabel`). */
  readonly label = input.required<string>();
  /** Names of steps 1, 2 and 3. */
  readonly steps = input.required<readonly string[]>();
  /** Current step; `null` on screens that are not a step. */
  readonly current = input<StepNumber | null>(null);
}
