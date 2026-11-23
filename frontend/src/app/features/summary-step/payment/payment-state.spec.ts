import { PayConditions, canPay } from './payment-state';

const ready: PayConditions = {
  dataReady: true,
  step1Complete: true,
  planReady: true,
  termsReady: true,
  termsAccepted: true,
  paymentTextsReady: true,
  payment: 'idle',
};

describe('canPay', () => {
  it('REQ-03.19 is true only when data, plan and terms are ready and the terms are accepted', () => {
    expect(canPay(ready)).toBe(true);
  });

  it.each([
    ['terms not accepted', { termsAccepted: false }],
    ['terms not loaded or unavailable', { termsReady: false }],
    ['plan not loaded', { planReady: false }],
    ['data texts missing', { dataReady: false }],
    [
      'F-03.1 an incomplete or invalid step 1, although its texts are loaded',
      { step1Complete: false },
    ],
    ['payment texts missing', { paymentTextsReady: false }],
    ['a payment in progress', { payment: 'processing' as const }],
  ])('REQ-03.19 is false with %s', (_case, patch) => {
    expect(canPay({ ...ready, ...patch })).toBe(false);
  });

  it('REQ-03.30 a rejected payment can be retried', () => {
    expect(canPay({ ...ready, payment: 'rejected' })).toBe(true);
  });
});
