/**
 * Alphabet of the random part (REQ-03.26): `A-H`, `J-N`, `P-Z` and `2-9`, without `0`, `O`, `1`
 * and `I`. It has exactly 32 symbols, so `byte % 32` is unbiased.
 */
export const QUOTE_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const QUOTE_NUMBER_RANDOM_LENGTH = 6;

/** Fills the buffer with random bytes (same contract as `crypto.getRandomValues`). */
export type RandomFill = (target: Uint8Array<ArrayBuffer>) => void;

/** Default random source: the browser's cryptographic generator (REQ-03.26). */
export const cryptoRandomFill: RandomFill = (target) => {
  crypto.getRandomValues(target);
};

/**
 * Simulated quote number `<CC>-<YYYYMMDD>-<XXXXXX>` (REQ-03.26): country code in upper case, UTC
 * date of the payment and 6 random symbols. Clock and random source are injected, so the function
 * is pure for tests (AC-03.27). Uniqueness is only probabilistic (no central registry, D4).
 */
export function createQuoteNumber(countryCode: string, now: Date, fillRandom: RandomFill): string {
  const bytes = new Uint8Array(QUOTE_NUMBER_RANDOM_LENGTH);
  fillRandom(bytes);
  const suffix = Array.from(
    bytes,
    (byte) => QUOTE_NUMBER_ALPHABET[byte % QUOTE_NUMBER_ALPHABET.length],
  ).join('');
  const date =
    String(now.getUTCFullYear()).padStart(4, '0') +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0');
  return `${countryCode.toUpperCase()}-${date}-${suffix}`;
}
