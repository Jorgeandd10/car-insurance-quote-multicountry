import {
  QUOTE_NUMBER_ALPHABET,
  RandomFill,
  createQuoteNumber,
  cryptoRandomFill,
} from './create-quote-number';

const fixedFill =
  (bytes: readonly number[]): RandomFill =>
  (target) => {
    target.set(bytes.slice(0, target.length));
  };

describe('createQuoteNumber', () => {
  const now = new Date('2026-11-22T10:00:00Z');

  it('AC-03.27 matches ^CO-20261122-[A-HJ-NP-Z2-9]{6}$ with a fixed clock', () => {
    expect(createQuoteNumber('co', now, cryptoRandomFill)).toMatch(
      /^CO-20261122-[A-HJ-NP-Z2-9]{6}$/,
    );
  });

  it('AC-03.27 the same random source always gives the same number', () => {
    const fill = fixedFill([0, 1, 31, 32, 200, 255]);
    const first = createQuoteNumber('co', now, fill);
    expect(createQuoteNumber('co', now, fill)).toBe(first);
    // 0→A, 1→B, 31→9, 32→A, 200 (8)→J, 255 (31)→9
    expect(first).toBe('CO-20261122-AB9AJ9');
  });

  it('REQ-03.26 uses the UTC date of the payment', () => {
    const lateEveningInBogota = new Date('2026-11-22T23:30:00-05:00');
    expect(createQuoteNumber('cl', lateEveningInBogota, fixedFill([0, 0, 0, 0, 0, 0]))).toBe(
      'CL-20261123-AAAAAA',
    );
  });

  it('REQ-03.26 the alphabet has 32 symbols without 0, O, 1 or I, for every byte value', () => {
    expect(QUOTE_NUMBER_ALPHABET).toHaveLength(32);
    const symbols = new Set<string>();
    for (let byte = 0; byte < 256; byte++) {
      const suffix = createQuoteNumber(
        'co',
        now,
        fixedFill([byte, byte, byte, byte, byte, byte]),
      ).slice(-6);
      suffix.split('').forEach((s) => symbols.add(s));
    }
    expect([...symbols].sort().join('')).toBe([...QUOTE_NUMBER_ALPHABET].sort().join(''));
    expect([...symbols].some((s) => '0O1I'.includes(s))).toBe(false);
  });
});
