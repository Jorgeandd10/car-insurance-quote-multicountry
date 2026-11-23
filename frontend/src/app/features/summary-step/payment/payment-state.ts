/** State of the simulated payment in the summary. Never persisted (US-03 §6.2). */
export type PaymentState = 'idle' | 'processing' | 'rejected';

/** Result chosen in the simulated gateway (D9, G2-12). "approved" is the default. */
export type PaymentOutcome = 'approved' | 'rejected';

export interface PayConditions {
  /** Step 1 data shown (texts present). */
  readonly dataReady: boolean;
  /** The chosen plan is loaded, still available and its price is computed. */
  readonly planReady: boolean;
  /** Terms loaded with text (not loading, not failed, not unavailable). */
  readonly termsReady: boolean;
  readonly termsAccepted: boolean;
  /** Texts of the payment block present. */
  readonly paymentTextsReady: boolean;
  readonly payment: PaymentState;
}

/**
 * REQ-03.19: pay is enabled if and only if data and plan are loaded and valid, the terms are
 * loaded and accepted, and no payment is in progress. A rejected payment can be retried
 * (REQ-03.30).
 */
export function canPay(c: PayConditions): boolean {
  return (
    c.dataReady &&
    c.planReady &&
    c.termsReady &&
    c.termsAccepted &&
    c.paymentTextsReady &&
    c.payment !== 'processing'
  );
}
