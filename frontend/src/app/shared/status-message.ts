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
        <p class="status" role="status">{{ texts.loading }}</p>
      }
      @case ('error') {
        <div class="status status--error">
          <p role="alert">{{ texts.loadError }}</p>
          <button type="button" (click)="retry.emit()">{{ texts.retry }}</button>
        </div>
      }
      @case ('message') {
        <p class="status" role="alert">{{ message() }}</p>
      }
    }
  `,
  styles: `
    .status {
      margin: 1rem 0;
    }
    .status--error p {
      margin: 0 0 0.5rem;
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
