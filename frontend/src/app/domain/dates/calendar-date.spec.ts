import { compareCalendarDates, isLeapYear, parseCalendarDate } from './calendar-date';

describe('calendar dates', () => {
  it('REQ-01.21 parses a YYYY-MM-DD calendar date without time zone', () => {
    expect(parseCalendarDate('2008-11-23')).toEqual({ year: 2008, month: 11, day: 23 });
  });

  it.each([
    '2026-02-30',
    '2025-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-1-1',
    '2026-11-22T00:00',
    '',
  ])('REQ-01.21 rejects %j as a calendar date', (value) => {
    expect(parseCalendarDate(value)).toBeNull();
  });

  it('REQ-01.20 knows leap years (29 February rule)', () => {
    expect(isLeapYear(2008)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(parseCalendarDate('2008-02-29')).not.toBeNull();
  });

  it('REQ-01.21 compares calendar dates by day', () => {
    const a = { year: 2026, month: 11, day: 22 };
    const b = { year: 2026, month: 11, day: 23 };
    expect(compareCalendarDates(a, b)).toBeLessThan(0);
    expect(compareCalendarDates(b, a)).toBeGreaterThan(0);
    expect(compareCalendarDates(a, { ...a })).toBe(0);
  });
});
