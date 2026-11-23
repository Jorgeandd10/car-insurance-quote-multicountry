import { parseCalendarDate } from '../../domain/dates/calendar-date';
import { SECTIONS, Section } from '../../domain/form/form-config';
import { maskDocument } from '../../domain/masking/mask-document';
import { Step1FieldResult, Step1Result } from '../form-step/validation/evaluate-step1';

/** Strapi texts used to show values (REQ-03.3; `ui.summary-step-texts`). */
export interface SummaryValueTexts {
  readonly yesLabel: string;
  readonly noLabel: string;
  /** Seed "—" (G3-10). */
  readonly emptyValueLabel: string;
}

export interface SummaryItem {
  readonly key: string;
  /** Label of the field in Strapi, never the technical key (REQ-03.2). */
  readonly label: string;
  /** Readable value. For `documentNumber` it is already masked: the full value never reaches the DOM. */
  readonly display: string;
}

export interface SummarySectionView {
  readonly id: Section;
  readonly legend: string;
  readonly items: readonly SummaryItem[];
}

/**
 * Readable value of one field (REQ-03.3, REQ-03.6; Q-03.4):
 *
 * - `documentNumber` role → masked with `maskDocument` (REQ-03.7). Presentation only (REQ-03.8).
 * - `select` → label of the current option, never the stored value.
 * - `checkbox` → the yes/no texts of the country.
 * - `date` → `Intl.DateTimeFormat` with the locale of the country, as a calendar date in UTC so
 *   the day never shifts with the time zone of the device.
 * - `number` → `Intl.NumberFormat` with the locale of the country. A `vehicleYear` is a year, not
 *   a quantity, so it is shown without grouping ("2018", not "2.018").
 * - Empty optional value → `emptyValueLabel`.
 */
export function displayValue(
  field: Step1FieldResult,
  texts: SummaryValueTexts,
  intlLocale: string,
): string {
  const value = field.value;
  if (field.type === 'checkbox') {
    return value === true ? texts.yesLabel : texts.noLabel;
  }
  if (value === null || value === '' || typeof value === 'boolean') {
    return texts.emptyValueLabel;
  }
  switch (field.type) {
    case 'select':
      return field.displayValue ?? texts.emptyValueLabel;
    case 'date':
      return formatCalendarDate(String(value), intlLocale) ?? texts.emptyValueLabel;
    case 'number':
      return typeof value === 'number'
        ? new Intl.NumberFormat(
            intlLocale,
            field.role === 'vehicleYear' ? { useGrouping: false } : {},
          ).format(value)
        : texts.emptyValueLabel;
    case 'text':
      return field.role === 'documentNumber' ? maskDocument(String(value)) : String(value);
  }
}

/** Calendar date `YYYY-MM-DD` in the long format of the locale (`7 de mayo de 1990`). */
export function formatCalendarDate(value: string, intlLocale: string): string | null {
  const date = parseCalendarDate(value);
  if (!date) {
    return null;
  }
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(date.year, date.month - 1, date.day)),
  );
}

/**
 * Sections of the summary (REQ-03.1, REQ-03.2): `policyholder` then `vehicle`, each with its
 * legend from Strapi and its fields in the configured order. Only the current fields of the
 * configuration are shown (a removed field is not, AC-03.21).
 */
export function buildSummarySections(
  result: Step1Result,
  legends: Readonly<Record<Section, string>>,
  texts: SummaryValueTexts,
  intlLocale: string,
): SummarySectionView[] {
  return SECTIONS.map((id) => ({
    id,
    legend: legends[id],
    items: result.fields
      .filter((field) => field.section === id)
      .map((field) => ({
        key: field.key,
        label: field.label,
        display: displayValue(field, texts, intlLocale),
      })),
  })).filter((section) => section.items.length > 0);
}
