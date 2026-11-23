/**
 * Rules of `text` fields (US-01 §5.2, Q-01.16). They work on the trimmed value: leading and
 * trailing spaces never count, and a value of only spaces is empty (REQ-01.14).
 */

export function isBlank(value: string): boolean {
  return value.trim() === '';
}

export function hasMinLength(trimmed: string, min: number): boolean {
  return Array.from(trimmed).length >= min;
}

export function hasMaxLength(trimmed: string, max: number): boolean {
  return Array.from(trimmed).length <= max;
}

/** `regex` is already anchored to the whole value by the mapper (`^(?:source)$`). */
export function matchesFully(trimmed: string, regex: RegExp): boolean {
  regex.lastIndex = 0;
  return regex.test(trimmed);
}
