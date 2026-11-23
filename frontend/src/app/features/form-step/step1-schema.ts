import { SchemaFn, required, validate } from '@angular/forms/signals';
import { FormFieldConfig } from '../../domain/form/form-config';
import { Step1Model, Step1RuleContext, isEffectivelyRequired } from './validation/step1-model';
import { isFieldValueValid } from './validation/validator-registry';

/** Kind of the single error of a field; it is never shown (REQ-01.16). */
export const STEP1_RULE_ERROR = 'step1Rule';

/**
 * Signal Forms schema generated from the configuration (ADR-0002). It is only an adapter:
 *
 * - `required()` of Signal Forms, so that `FormField` sets the native `required` property
 *   (REQ-01.14, REQ-01.29: required marked programmatically).
 * - One `validate()` per field that runs the pure rules of `validator-registry.ts`, the same ones
 *   `evaluateStep1` uses for `isComplete`. Text is checked trimmed, which the built-in
 *   `minLength`/`pattern` do not do, so those built-ins are not used.
 */
export function buildStep1Schema(
  fields: readonly FormFieldConfig[],
  ctx: Step1RuleContext,
): SchemaFn<Step1Model> {
  return (path) => {
    for (const field of fields) {
      const fieldPath = path[field.key];
      if (isEffectivelyRequired(field)) {
        required(fieldPath);
      }
      validate(fieldPath, ({ value }) =>
        isFieldValueValid(field, value(), ctx) ? null : { kind: STEP1_RULE_ERROR },
      );
    }
  };
}
