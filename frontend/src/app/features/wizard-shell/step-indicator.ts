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
    <nav class="step-indicator hero-bleed" [attr.aria-label]="label()">
      <ol>
        @for (step of steps(); track $index) {
          <li
            [class.current]="current() === $index + 1"
            [class.done]="(current() ?? 0) > $index + 1"
            [attr.aria-current]="current() === $index + 1 ? 'step' : null"
          >
            <span class="number" aria-hidden="true">{{ $index + 1 }}</span>
            <span class="name">{{ step }}</span>
          </li>
        }
      </ol>
    </nav>
  `,
  /*
   * Visual stepper on the hero band (D12): numbered circles joined by connectors. Pending: white
   * circle with grey border; current: filled primary with a halo; done: filled primary with a
   * drawn check (the digit stays in the DOM, it is aria-hidden). Status is never colour-only:
   * the current step also has a bold name and the halo; done steps show the check.
   */
  styles: `
    .step-indicator {
      padding-top: 1.5rem;
    }
    ol {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(0, 1fr);
      max-width: 36rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.25rem;
      color: var(--color-text-muted);
      font-size: 0.875rem;
      line-height: 1.3;
      text-align: center;
    }
    li + li::before {
      content: '';
      position: absolute;
      top: calc(1.25rem - 1.5px);
      left: calc(-50% + 1.75rem);
      right: calc(50% + 1.75rem);
      height: 3px;
      border-radius: 3px;
      background: var(--color-border-strong);
    }
    li + li.current::before,
    li + li.done::before {
      background: var(--color-primary);
    }
    .number {
      position: relative;
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 2px solid var(--color-border-strong);
      border-radius: 50%;
      background: #ffffff;
      color: var(--color-text-muted);
      font-size: 1rem;
      font-weight: 700;
    }
    .current {
      color: var(--color-primary-dark);
      font-weight: 700;
    }
    .current .number,
    .done .number {
      border-color: var(--color-primary);
      background: var(--color-primary);
      color: #ffffff;
    }
    .current .number {
      box-shadow: 0 0 0 4px rgb(45 109 246 / 0.25);
    }
    .done {
      color: var(--color-text);
    }
    .done .number {
      color: transparent;
    }
    .done .number::after {
      content: '';
      position: absolute;
      inset: 0;
      width: 0.5rem;
      height: 0.95rem;
      margin: auto;
      border: solid #ffffff;
      border-width: 0 3px 3px 0;
      transform: translateY(-2px) rotate(45deg);
    }
    @media (min-width: 48rem) {
      li {
        font-size: 0.9375rem;
      }
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
