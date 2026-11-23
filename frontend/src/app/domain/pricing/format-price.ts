/**
 * Formats a price in the currency and format of the country (REQ-02.6, ADR-0005).
 *
 * `intlLocale` and `currency` come from the `Country` entry in Strapi; no symbol or separator is
 * written in code. COP and CLP are shown without decimals. Locale data comes from `Intl` at
 * runtime (ADR-0001: no Angular locale token nor locale data registered at build time).
 */
export function formatPrice(amount: number, intlLocale: string, currency: string): string {
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
