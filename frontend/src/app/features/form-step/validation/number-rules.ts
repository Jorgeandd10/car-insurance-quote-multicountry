/** Rules of `number` fields (US-01 §5.2). Decimals are allowed unless `integer` applies. */

export function isAtLeast(value: number, min: number): boolean {
  return value >= min;
}

export function isAtMost(value: number, max: number): boolean {
  return value <= max;
}

export function isInteger(value: number): boolean {
  return Number.isInteger(value);
}
