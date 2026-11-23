import { parseCalendarDate } from '../../../domain/dates/calendar-date';
import { isOfLegalAge } from '../../../domain/dates/legal-age';
import { isVehicleYearValid } from '../../../domain/dates/vehicle-year';
import { FormFieldConfig, ValidationRule } from '../../../domain/form/form-config';
import { isAtLeast, isAtMost, isInteger } from './number-rules';
import { Step1RuleContext, Step1Value, isEffectivelyRequired } from './step1-model';
import { hasMaxLength, hasMinLength, isBlank, matchesFully } from './text-rules';

/**
 * Why a value is not valid. It is never shown: every field has a single message (REQ-01.16).
 * It exists for the tests and for debugging.
 */
export type FieldViolation =
  | 'required'
  | 'type'
  | ValidationRule['kind']
  | 'option'
  | 'calendarDate'
  | 'vehicleYear'
  | 'birthDate';

/**
 * Registry of the validation kinds of the catalog (G2-7): whether a value satisfies one rule. A
 * new kind is a case B of `country-content`: a new `case` here plus its pure function and test.
 * Each rule only applies to its field type (the mapper already dropped the others).
 */
export function ruleHolds(rule: ValidationRule, value: string | number): boolean {
  switch (rule.kind) {
    case 'minLength':
      return typeof value === 'string' && hasMinLength(value, rule.value);
    case 'maxLength':
      return typeof value === 'string' && hasMaxLength(value, rule.value);
    case 'pattern':
      return typeof value === 'string' && matchesFully(value, rule.regex);
    case 'min':
      return typeof value === 'number' && isAtLeast(value, rule.value);
    case 'max':
      return typeof value === 'number' && isAtMost(value, rule.value);
    case 'integer':
      return typeof value === 'number' && isInteger(value);
  }
}

/**
 * All the rules of one field for one value (REQ-01.14, REQ-01.15, REQ-01.19, REQ-01.20; ADR-0002):
 * required, the typed validations of the catalog, the implicit option check of `select` and the
 * role rules, which are always active. Pure: "today" and the minimum age come in `ctx`.
 *
 * An empty optional field is valid and its other rules do not run. The same function decides the
 * live errors of the form and `isComplete` (REQ-01.27), so both always agree.
 */
export function fieldViolations(
  field: FormFieldConfig,
  value: Step1Value | undefined,
  ctx: Step1RuleContext,
): FieldViolation[] {
  const required = isEffectivelyRequired(field);
  switch (field.type) {
    case 'text': {
      if (typeof value !== 'string') {
        return ['type'];
      }
      if (isBlank(value)) {
        return required ? ['required'] : [];
      }
      const trimmed = value.trim();
      return field.validations.filter((rule) => !ruleHolds(rule, trimmed)).map((rule) => rule.kind);
    }
    case 'number': {
      if (
        value === null ||
        value === undefined ||
        (typeof value === 'number' && Number.isNaN(value))
      ) {
        return required ? ['required'] : [];
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return ['type'];
      }
      const violations: FieldViolation[] = field.validations
        .filter((rule) => !ruleHolds(rule, value))
        .map((rule) => rule.kind);
      if (field.role === 'vehicleYear' && !isVehicleYearValid(value, ctx.today)) {
        violations.push('vehicleYear');
      }
      return violations;
    }
    case 'select': {
      if (typeof value !== 'string') {
        return ['type'];
      }
      if (value === '') {
        return required ? ['required'] : [];
      }
      return field.options.some((option) => option.value === value) ? [] : ['option'];
    }
    case 'date': {
      if (typeof value !== 'string') {
        return ['type'];
      }
      if (value === '') {
        return required ? ['required'] : [];
      }
      if (parseCalendarDate(value) === null) {
        return ['calendarDate'];
      }
      if (field.role === 'birthDate' && !isOfLegalAge(value, ctx.today, ctx.minimumAge)) {
        return ['birthDate'];
      }
      return [];
    }
    case 'checkbox': {
      if (typeof value !== 'boolean') {
        return ['type'];
      }
      return required && !value ? ['required'] : [];
    }
  }
}

export function isFieldValueValid(
  field: FormFieldConfig,
  value: Step1Value | undefined,
  ctx: Step1RuleContext,
): boolean {
  return fieldViolations(field, value, ctx).length === 0;
}
