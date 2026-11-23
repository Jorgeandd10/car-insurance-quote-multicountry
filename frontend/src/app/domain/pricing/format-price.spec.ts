import { formatPrice } from './format-price';

describe('formatPrice', () => {
  it('AC-02.8 Colombia: "$ 1.320.000" with U+00A0 between "$" and the number', () => {
    const formatted = formatPrice(1_320_000, 'es-CO', 'COP');
    // Escape kept on purpose: the expected separator is U+00A0, not a normal space.
    expect(formatted).toBe('$\u00A01.320.000');
    expect(Array.from(formatted, (c) => c.charCodeAt(0).toString(16))).toEqual([
      '24',
      'a0',
      '31',
      '2e',
      '33',
      '32',
      '30',
      '2e',
      '30',
      '30',
      '30',
    ]);
  });

  it('AC-02.8 Chile: "$38.985" without separator after "$"', () => {
    expect(formatPrice(38_985, 'es-CL', 'CLP')).toBe('$38.985');
  });

  it('AC-02.8 the price has no decimal part', () => {
    expect(formatPrice(21_589, 'es-CL', 'CLP')).toBe('$21.589');
    expect(formatPrice(1_221_875, 'es-CO', 'COP')).not.toMatch(/,\d/);
  });

  it('REQ-02.6 locale and currency come from the arguments (Strapi), not from code', () => {
    expect(formatPrice(1_000, 'en-US', 'USD')).toBe('$1,000');
  });
});
