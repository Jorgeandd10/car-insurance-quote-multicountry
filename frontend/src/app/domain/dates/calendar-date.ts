/**
 * Calendar dates (`YYYY-MM-DD`) without time or time zone (REQ-01.21).
 *
 * All date rules work on these values, so no `Date` object is ever shifted by a time zone.
 */
export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Parses a strict `YYYY-MM-DD` string that names a real day; anything else is `null`. */
export function parseCalendarDate(value: string): CalendarDate | null {
  const match = ISO_CALENDAR_DATE.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

/** Negative if `a` is before `b`, 0 if equal, positive if after. */
export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
