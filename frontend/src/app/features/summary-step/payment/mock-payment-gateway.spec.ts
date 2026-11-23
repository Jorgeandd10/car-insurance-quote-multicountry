import { TestBed } from '@angular/core/testing';
import { MockPaymentGateway, PAYMENT_DELAY_MS, QUOTE_RANDOM_FILL } from './mock-payment-gateway';
import { cryptoRandomFill } from '../../../domain/quote-number/create-quote-number';

describe('MockPaymentGateway', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('REQ-03.24 the simulated processing lasts 1500 ms by default and resolves with the chosen outcome', async () => {
    expect(TestBed.inject(PAYMENT_DELAY_MS)).toBe(1500);
    const gateway = TestBed.inject(MockPaymentGateway);
    let result: string | null = null;
    void gateway.pay('rejected', new AbortController().signal).then((r) => (result = r));

    await vi.advanceTimersByTimeAsync(1499);
    expect(result).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(result).toBe('rejected');
  });

  it('REQ-03.24 the duration is injectable', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PAYMENT_DELAY_MS, useValue: 0 }] });
    const promise = TestBed.inject(MockPaymentGateway).pay(
      'approved',
      new AbortController().signal,
    );
    await vi.advanceTimersByTimeAsync(0);
    await expect(promise).resolves.toBe('approved');
  });

  it('REQ-03.22 leaving the page aborts the pending payment and its result is discarded', async () => {
    const gateway = TestBed.inject(MockPaymentGateway);
    const controller = new AbortController();
    const promise = gateway.pay('approved', controller.signal);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('REQ-03.20 D9 no request of any kind is made', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const open = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const promise = TestBed.inject(MockPaymentGateway).pay(
      'approved',
      new AbortController().signal,
    );
    await vi.advanceTimersByTimeAsync(1500);
    await promise;
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it('REQ-03.26 the quote number uses the cryptographic random source by default', () => {
    expect(TestBed.inject(QUOTE_RANDOM_FILL)).toBe(cryptoRandomFill);
  });
});
