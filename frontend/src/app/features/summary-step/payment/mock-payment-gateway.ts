import { Injectable, InjectionToken, inject } from '@angular/core';
import { RandomFill, cryptoRandomFill } from '../../../domain/quote-number/create-quote-number';
import { PaymentOutcome } from './payment-state';

/** Fixed duration of the simulated processing (REQ-03.24): 1500 ms, injectable in tests. */
export const PAYMENT_DELAY_MS = new InjectionToken<number>('PAYMENT_DELAY_MS', {
  providedIn: 'root',
  factory: () => 1500,
});

/** Random source of the quote number (REQ-03.26): the browser's cryptographic generator. */
export const QUOTE_RANDOM_FILL = new InjectionToken<RandomFill>('QUOTE_RANDOM_FILL', {
  providedIn: 'root',
  factory: () => cryptoRandomFill,
});

/**
 * Simulated payment gateway (D9, G2-12). It resolves with the outcome the person chose after
 * `PAYMENT_DELAY_MS`. No request of any kind is made (REQ-03.20), there is no randomness and no
 * card data. Aborting (the person left the summary) rejects with an `AbortError` and the pending
 * result is discarded (REQ-03.22).
 */
@Injectable({ providedIn: 'root' })
export class MockPaymentGateway {
  private readonly delayMs = inject(PAYMENT_DELAY_MS);

  pay(outcome: PaymentOutcome, signal: AbortSignal): Promise<PaymentOutcome> {
    return new Promise<PaymentOutcome>((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Payment aborted', 'AbortError'));
        return;
      }
      const timer = setTimeout(() => resolve(outcome), this.delayMs);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Payment aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  }
}
