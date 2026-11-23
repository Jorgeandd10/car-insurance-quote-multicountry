import { parseCalendarDate } from './calendar-date';

/** Fixed in code by G2-4: the vehicle can be at most 20 years old and at most one year ahead. */
export const VEHICLE_MAX_AGE_YEARS = 20;
export const VEHICLE_MAX_YEARS_AHEAD = 1;

/**
 * Vehicle-year rule for the field with role `vehicleYear` (REQ-01.19).
 *
 * Valid if and only if `year` is an integer and `currentYear − 20 ≤ year ≤ currentYear + 1`,
 * both limits inclusive, where `currentYear` is the year of `today` (`YYYY-MM-DD`).
 */
export function isVehicleYearValid(year: number, today: string): boolean {
  const reference = parseCalendarDate(today);
  if (!reference || !Number.isInteger(year)) {
    return false;
  }
  return (
    year >= reference.year - VEHICLE_MAX_AGE_YEARS &&
    year <= reference.year + VEHICLE_MAX_YEARS_AHEAD
  );
}

/**
 * `vehicleAge` operand of the price rule: `max(0, year(referenceDate) − year)` (ADR-0005, Q-02.5).
 * A vehicle from next year has age 0, not −1. Non-integer years or a bad date give `null`.
 */
export function vehicleAge(year: number, referenceDate: string): number | null {
  const reference = parseCalendarDate(referenceDate);
  if (!reference || !Number.isInteger(year)) {
    return null;
  }
  return Math.max(0, reference.year - year);
}
