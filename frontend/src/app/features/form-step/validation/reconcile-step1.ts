import { parseCalendarDate } from '../../../domain/dates/calendar-date';
import { FormFieldConfig } from '../../../domain/form/form-config';
import { StoredStep1 } from '../../../core/storage/wizard-storage';
import { Step1Model, Step1Value, initialValue } from './step1-model';

export interface Step1Reconciliation {
  /** One value per current field: the stored one if it still fits, or the empty one. */
  readonly values: Step1Model;
  /** Technical warnings (keys only, never values: US-01 §7). */
  readonly warnings: readonly string[];
}

/**
 * Restored values against the current configuration (US-01 table 5.4, REQ-01.26; ADR-0004).
 *
 * - New field → empty value. Removed field → its value is not carried over.
 * - Label, help, message, order, section, `required` or validations changed → value kept; it is
 *   revalidated by `evaluateStep1` and by the form.
 * - Removed `select` option, value of an unexpected type, or a `date` that is not `YYYY-MM-DD`
 *   → that value is discarded.
 * - Changed field type → discarded when the stored value does not have the shape of the new type.
 *   Only values are stored (ADR-0004), so a value that also fits the new type (e.g. a `text`
 *   holding "2000-01-01" that becomes a `date`) is kept and revalidated.
 *
 * Pure. A corrupt entry never reaches this function: `WizardStorage` already discarded it.
 */
export function reconcileStep1(
  fields: readonly FormFieldConfig[],
  stored: StoredStep1 | null,
): Step1Reconciliation {
  const values: Step1Model = {};
  const warnings: string[] = [];
  for (const field of fields) {
    const raw = stored?.values[field.key];
    if (raw === undefined) {
      values[field.key] = initialValue(field.type);
      continue;
    }
    const kept = fitValue(field, raw);
    if (kept === undefined) {
      warnings.push(
        `[storage] step1 value discarded: does not fit the current field (key=${field.key})`,
      );
      values[field.key] = initialValue(field.type);
    } else {
      values[field.key] = kept;
    }
  }
  return { values, warnings };
}

/** The stored value if it fits the current field, `undefined` if it must be discarded. */
function fitValue(field: FormFieldConfig, raw: Step1Value): Step1Value | undefined {
  switch (field.type) {
    case 'text':
      return typeof raw === 'string' ? raw : undefined;
    case 'number':
      return raw === null || (typeof raw === 'number' && Number.isFinite(raw)) ? raw : undefined;
    case 'checkbox':
      return typeof raw === 'boolean' ? raw : undefined;
    case 'date':
      return typeof raw === 'string' && (raw === '' || parseCalendarDate(raw) !== null)
        ? raw
        : undefined;
    case 'select':
      return typeof raw === 'string' &&
        (raw === '' || field.options.some((option) => option.value === raw))
        ? raw
        : undefined;
  }
}
