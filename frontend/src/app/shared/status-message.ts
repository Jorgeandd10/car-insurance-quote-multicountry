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
        <div class="status status--loading">
          <p class="loading-label" role="status">{{ texts.loading }}</p>
          <div class="skeleton" aria-hidden="true">
            <span class="bone bone--title"></span>
            <span class="bone"></span>
            <span class="bone bone--wide"></span>
            <span class="bone bone--short"></span>
          </div>
        </div>
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
  /*
   * D13: loading keeps the visible fixed "cargando" (role="status", REQ-01.3) above a decorative
   * shimmer skeleton (empty aria-hidden blocks, no text), static with prefers-reduced-motion.
   * Error and message are panels with a coloured left edge.
   */
  styles: `
    .status {
      margin: 1rem 0;
    }
    .loading-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem;
      color: var(--color-primary-dark);
      font-size: 0.9375rem;
      font-weight: 600;
    }
    .loading-label::before {
      content: '';
      flex: none;
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      background: var(--color-primary);
      animation: status-pulse 0.9s ease-in-out infinite alternate;
    }
    .skeleton {
      display: grid;
      gap: 0.75rem;
      max-width: 36rem;
    }
    .bone {
      display: block;
      width: 80%;
      height: 0.875rem;
      border-radius: var(--radius-pill);
      background: linear-gradient(90deg, #e6edfa 25%, #f5f8ff 50%, #e6edfa 75%) 0 0 / 200% 100%;
      animation: status-shimmer 1.4s linear infinite;
    }
    .bone--title {
      width: 55%;
      height: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .bone--wide {
      width: 100%;
    }
    .bone--short {
      width: 40%;
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
    @keyframes status-shimmer {
      to {
        background-position: -200% 0;
      }
    }
    @keyframes status-pulse {
      from {
        opacity: 0.35;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .bone,
      .loading-label::before {
        animation: none;
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
