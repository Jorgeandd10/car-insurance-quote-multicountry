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
        <button type="button" (click)="newQuote()">{{ v.texts.newQuoteLabel }}</button>
      } @else {
        <app-status-message kind="message" [message]="v.message" />
      }
    }
  `,
  styles: `
    .confirmation {
      display: grid;
      gap: 0.5rem;
      max-width: 36rem;
      margin: 0 0 1.5rem;
    }
    .item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 0.5rem;
    }
    dt {
      font-weight: 600;
    }
    dd {
      margin: 0;
    }
    .quote-number {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.05em;
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
