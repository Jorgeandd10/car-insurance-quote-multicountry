const ALPHANUMERIC = /[\p{L}\p{N}]/u;
const MAX_VISIBLE = 4;

/**
 * Partially masks a document number for presentation (REQ-03.7, same rule in CO and CL).
 *
 * Only alphanumeric characters are counted (`n`). The last `min(4, floor(n / 2))` stay visible,
 * the other alphanumerics become `*`, and separators (`.`, `-`, space) are kept as they are.
 * The stored value is never changed (REQ-03.8): this is presentation only.
 */
export function maskDocument(value: string): string {
  const characters = Array.from(value);
  const alphanumericCount = characters.filter((c) => ALPHANUMERIC.test(c)).length;
  const visible = Math.min(MAX_VISIBLE, Math.floor(alphanumericCount / 2));
  const hidden = alphanumericCount - visible;

  let seen = 0;
  return characters
    .map((c) => {
      if (!ALPHANUMERIC.test(c)) {
        return c;
      }
      seen += 1;
      return seen <= hidden ? '*' : c;
    })
    .join('');
}
