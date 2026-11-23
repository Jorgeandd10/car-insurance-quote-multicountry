import { CalendarDate, isLeapYear, parseCalendarDate } from './calendar-date';

/**
 * Completed years between `birthDate` and `referenceDate`, both `YYYY-MM-DD` (REQ-01.20).
 *
 * - The birthday itself counts as completed.
 * - Someone born on 29 February has their birthday on 1 March in non-leap years.
 * - A birth date after the reference date gives a negative age (callers decide what it means).
 * - Unparseable input gives `null`.
 *
 * Shared by the legal-age rule of US-01 and the `ageInYears` operand of the price rule (ADR-0005).
 */
export function ageInYears(birthDate: string, referenceDate: string): number | null {
  const birth = parseCalendarDate(birthDate);
  const reference = parseCalendarDate(referenceDate);
  if (!birth || !reference) {
    return null;
  }
  const birthday = birthdayInYear(birth, reference.year);
  const hadBirthday =
    reference.month > birthday.month ||
    (reference.month === birthday.month && reference.day >= birthday.day);
  return reference.year - birth.year - (hadBirthday ? 0 : 1);
}

function birthdayInYear(birth: CalendarDate, year: number): { month: number; day: number } {
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(year)) {
    return { month: 3, day: 1 };
  }
  return { month: birth.month, day: birth.day };
}
