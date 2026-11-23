import { FieldRole, FieldType, FormConfig, Section } from '../../../domain/form/form-config';
import { Step1Model, Step1RuleContext, Step1Value, normalizeValue } from './step1-model';
import { isFieldValueValid } from './validator-registry';

/** Result of one current field (api-contracts §3). */
export interface Step1FieldResult {
  readonly key: string;
  readonly type: FieldType;
  readonly section: Section;
  readonly role: FieldRole | null;
  readonly label: string;
  /** Normalised value (text trimmed). */
  readonly value: Step1Value;
  /** Label of the chosen option for `select` (REQ-01.11); `null` for the other types. */
  readonly displayValue: string | null;
  readonly valid: boolean;
}

/**
 * What US-01 exposes to US-02 and US-03 (REQ-01.27, REQ-01.28). Computed every time from the
 * stored values and the current configuration; never persisted (G2-10, F-00.5).
 */
export interface Step1Result {
  /** Current fields in display order. */
  readonly fields: readonly Step1FieldResult[];
  /** `false` if the form is not `ready` (empty, unavailable, configError) or any field is invalid. */
  readonly isComplete: boolean;
}

/** Pure evaluation of step 1 with the current configuration and rules (ADR-0004). */
export function evaluateStep1(
  form: FormConfig,
  values: Readonly<Step1Model>,
  ctx: Step1RuleContext,
): Step1Result {
  const fields = form.fields.map((field): Step1FieldResult => {
    const value = normalizeValue(field, values[field.key]);
    const option =
      field.type === 'select' ? field.options.find((o) => o.value === value) : undefined;
    return {
      key: field.key,
      type: field.type,
      section: field.section,
      role: field.role,
      label: field.label,
      value,
      displayValue: option?.label ?? null,
      valid: isFieldValueValid(field, values[field.key], ctx),
    };
  });
  return {
    fields,
    isComplete: form.status === 'ready' && fields.length > 0 && fields.every((f) => f.valid),
  };
}
