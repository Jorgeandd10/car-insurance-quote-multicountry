import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CountryContext } from '../../core/country/country-context';
import { WizardStorage } from '../../core/storage/wizard-storage';
import { formatPrice } from '../../domain/pricing/format-price';
import { StatusMessage } from '../../shared/status-message';
import { StepHeading } from '../../shared/step-heading';

/**
 * Confirmation, `/:country/confirmation` (REQ-03.25, REQ-03.27, REQ-03.28). Not a step (D7).
 * It shows only what was copied at payment time: quote number, plan name and price paid, without
 * personal data. Reloading shows it again; "nueva cotización" deletes it and opens an empty
 * step 1 (step 1 data was already deleted after the payment).
 */
@Component({
  selector: 'app-confirmation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusMessage, StepHeading],
  template: `
    @if (view(); as v) {
      @if (v.kind === 'ready') {
        <app-step-heading [text]="v.texts.title" />
        <div class="success-card">
          <dl class="confirmation">
            <div class="item">
              <dt>{{ v.texts.quoteNumberLabel }}</dt>
              <dd class="quote-number">{{ v.quoteNumber }}</dd>
            </div>
            <div class="item">
              <dt>{{ v.texts.planLabel }}</dt>
              <dd>{{ v.planName }}</dd>
            </div>
            <div class="item">
              <dt>{{ v.texts.paidPriceLabel }}</dt>
              <dd>{{ v.paidPrice }}</dd>
            </div>
          </dl>
        </div>
        <button type="button" class="btn-primary" (click)="newQuote()">
          {{ v.texts.newQuoteLabel }}
        </button>
      } @else {
        <app-status-message kind="message" [message]="v.message" />
      }
    }
  `,
  /*
   * Success card (D12): light-blue surface with a primary accent and a decorative check drawn
   * with CSS (empty pseudo-elements, no text). Dark blue on surface: 8.76:1.
   */
  styles: `
    .success-card {
      position: relative;
      max-width: 40rem;
      margin: 0 0 2rem;
      padding: 4.5rem var(--card-padding) var(--card-padding);
      border-top: 6px solid var(--color-primary);
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }
    .success-card::before {
      content: '';
      position: absolute;
      top: 1.25rem;
      left: var(--card-padding);
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--color-primary-dark);
    }
    .success-card::after {
      content: '';
      position: absolute;
      top: calc(1.25rem + 0.6rem);
      left: calc(var(--card-padding) + 0.95rem);
      width: 0.6rem;
      height: 1.05rem;
      border: solid #ffffff;
      border-width: 0 3px 3px 0;
      transform: rotate(45deg);
    }
    .confirmation {
      display: grid;
      gap: 0.75rem;
      margin: 0;
    }
    .item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 0.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgb(0 51 160 / 0.15);
    }
    .item:last-child {
      padding-bottom: 0;
      border-bottom: 0;
    }
    dt {
      color: var(--color-text-muted);
      font-weight: 600;
    }
    dd {
      margin: 0;
      font-weight: 600;
    }
    .quote-number {
      color: var(--color-primary-dark);
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    @media (max-width: 30rem) {
      .item {
        grid-template-columns: 1fr;
        gap: 0.125rem;
      }
    }
  `,
})
export class ConfirmationPage {
  private readonly context = inject(CountryContext);
  private readonly storage = inject(WizardStorage);
  private readonly router = inject(Router);

  protected readonly view = computed(() => {
    const config = this.context.config();
    if (!config) {
      return null;
    }
    const group = config.texts.confirmation;
    const confirmation = this.storage.readConfirmation(config.country.code);
    if (group.status !== 'ok' || !confirmation) {
      return { kind: 'configError' as const, message: config.genericErrorMessage };
    }
    return {
      kind: 'ready' as const,
      texts: group.texts,
      quoteNumber: confirmation.quoteNumber,
      planName: confirmation.planName,
      paidPrice: formatPrice(
        confirmation.finalPrice,
        config.country.intlLocale,
        confirmation.currency,
      ),
    };
  });

  /** REQ-03.27, REQ-03.28: deletes the confirmation and starts again at an empty step 1. */
  protected newQuote(): void {
    const code = this.context.code();
    this.storage.remove(code, 'confirmation');
    void this.router.navigate(['/', code, 'form']);
  }
}
