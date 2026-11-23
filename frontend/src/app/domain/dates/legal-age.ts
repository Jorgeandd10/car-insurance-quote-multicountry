import { ageInYears } from './age-in-years';
import { compareCalendarDates, parseCalendarDate } from './calendar-date';

/**
 * Legal-age rule for the field with role `birthDate` (REQ-01.20, G2-4).
 *
 * Valid if and only if the birth date is a real calendar date, is not in the future and the
 * completed age at `today` is at least `minimumAge` (from the country in Strapi).
 */
export function isOfLegalAge(birthDate: string, today: string, minimumAge: number): boolean {
  const birth = parseCalendarDate(birthDate);
  const reference = parseCalendarDate(today);
  if (!birth || !reference || compareCalendarDates(birth, reference) > 0) {
    return false;
  }
  const age = ageInYears(birthDate, today);
  return age !== null && age >= minimumAge;
}
