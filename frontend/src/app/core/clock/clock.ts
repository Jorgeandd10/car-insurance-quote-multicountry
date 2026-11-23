import { InjectionToken } from '@angular/core';

/** Source of "now". Injected so that tests are deterministic (REQ-01.21, ADR-0007). */
export type Clock = () => Date;

export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});

/**
 * Local calendar date of the device as `YYYY-MM-DD` (REQ-01.21).
 *
 * This is the only function that reads the device time zone (ADR-0007): every date rule
 * receives its result as a plain string and never converts time zones again.
 */
export function todayLocal(now: Date): string {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
