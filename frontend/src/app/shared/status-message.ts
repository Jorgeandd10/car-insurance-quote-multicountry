import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FIXED_TEXTS } from '../core/ui-state/fixed-texts';

/**
 * Announced state message (REQ-01.32, REQ-02.20, REQ-03.31).
 *
 * - `loading`: fixed "cargando" with `role="status"`.
 * - `error`: fixed "error de carga" with `role="alert"` and the "reintentar" button.
 * - `message`: a Strapi text (empty state, generic error) with `role="alert"`.
 */
@Component({
  selector: 'app-status-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (kind()) {
      @case ('loading') {
        <p class="status status--loading" role="status">{{ texts.loading }}</p>
      }
      @case ('error') {
        <div class="status status--error">
          <p role="alert">{{ texts.loadError }}</p>
          <button type="button" (click)="retry.emit()">{{ texts.retry }}</button>
        </div>
      }
      @case ('message') {
        <p class="status status--message" role="alert">{{ message() }}</p>
      }
    }
  `,
  /* D12: loading with a decorative spinner (empty pseudo-element); error and message as panels. */
  styles: `
    .status {
      margin: 1rem 0;
    }
    .status--loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--color-primary-dark);
      font-weight: 600;
    }
    .status--loading::before {
      content: '';
      flex: none;
      width: 1.5rem;
      height: 1.5rem;
      border: 3px solid var(--color-surface);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: status-spin 0.8s linear infinite;
    }
    .status--error,
    .status--message {
      padding: 1rem 1.25rem;
      border-left: 4px solid var(--color-primary);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      background: var(--color-surface-soft);
    }
    .status--error {
      border-left-color: var(--color-error);
      background: var(--color-error-surface);
    }
    .status--error p {
      margin: 0 0 0.75rem;
      color: var(--color-error);
      font-weight: 600;
    }
    @keyframes status-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class StatusMessage {
  readonly kind = input.required<'loading' | 'error' | 'message'>();
  /** Text from Strapi, only for `kind="message"`. */
  readonly message = input<string>('');
  readonly retry = output<void>();

  protected readonly texts = FIXED_TEXTS;
}
