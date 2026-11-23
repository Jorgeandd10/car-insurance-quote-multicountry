import { FieldRole, FieldType, FormFieldConfig } from '../../../domain/form/form-config';
import { StoredFieldValue } from '../../../core/storage/wizard-storage';

/**
 * Value of one field of step 1, by type (ADR-0002): `text`, `select` and `date` → string
 * (`date` as `YYYY-MM-DD`), `number` → number or `null` when empty, `checkbox` → boolean.
 */
export type Step1Value = StoredFieldValue;

/** Flat model of step 1, indexed by the technical key of each field (ADR-0002). */
export type Step1Model = Record<string, Step1Value>;

/** Context of the rules that do not come from the field configuration (REQ-01.21). */
export interface Step1RuleContext {
  /** Local calendar date of the device, `YYYY-MM-DD`. */
  readonly today: string;
  /** Minimum age of the country (Strapi, G2-4). */
  readonly minimumAge: number;
}

/** Initial (empty) value of each field type (ADR-0002). */
export function initialValue(type: FieldType): Step1Value {
  switch (type) {
    case 'text':
    case 'select':
    case 'date':
      return '';
    case 'number':
      return null;
    case 'checkbox':
      return false;
  }
}

/**
 * Roles whose business rule can never be switched off from Strapi (REQ-01.22, G2-4): an empty
 * value cannot prove the rule, so these fields are required even if Strapi says otherwise.
 */
const ROLES_THAT_REQUIRE_A_VALUE: readonly FieldRole[] = ['birthDate', 'vehicleYear'];

/** Required as configured in Strapi, or because its role rule needs a value. */
export function isEffectivelyRequired(field: FormFieldConfig): boolean {
  return field.required || (field.role !== null && ROLES_THAT_REQUIRE_A_VALUE.includes(field.role));
}

/**
 * Value to store and to evaluate (ADR-0004, REQ-01.23): text trimmed, `NaN` → `null`. Values
 * of the wrong type for the field become its empty value.
 */
export function normalizeValue(field: FormFieldConfig, value: Step1Value | undefined): Step1Value {
  switch (field.type) {
    case 'text':
      return typeof value === 'string' ? value.trim() : '';
    case 'select':
    case 'date':
      return typeof value === 'string' ? value : '';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    case 'checkbox':
      return value === true;
  }
}

/** Normalised values of the current fields only (values of removed fields are dropped). */
export function normalizeStep1Values(
  fields: readonly FormFieldConfig[],
  model: Readonly<Step1Model>,
): Step1Model {
  const values: Step1Model = {};
  for (const field of fields) {
    values[field.key] = normalizeValue(field, model[field.key]);
  }
  return values;
}
