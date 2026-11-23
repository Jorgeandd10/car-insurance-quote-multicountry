import {
  FIELD_ROLES,
  FIELD_TYPES,
  FieldRole,
  FieldType,
  FormFieldConfig,
  REQUIRED_ROLES,
  ROLE_FIELD_TYPE,
  SECTIONS,
  SelectOption,
  VALIDATION_KINDS_BY_TYPE,
  ValidationKind,
  ValidationRule,
} from '../../domain/form/form-config';
import {
  FormFieldDto,
  SelectOptionDto,
  ValidationRuleDto,
  arrayOrEmpty,
  asDto,
  integerOrNull,
  isOneOf,
  numeric,
  trimmedString,
} from './strapi-dto';

/** Technical identifier of a field (content-model §2.2). */
export const FIELD_KEY_PATTERN = /^[a-z][a-zA-Z0-9_]{0,49}$/;

const VALIDATION_KINDS: readonly ValidationKind[] = [
  'minLength',
  'maxLength',
  'pattern',
  'min',
  'max',
  'integer',
];

export interface FormFieldsMapping {
  /** Valid fields in display order. */
  readonly fields: readonly FormFieldConfig[];
  /** Status from the fields alone; `configError` (missing texts) is added with the C3 texts. */
  readonly status: 'ready' | 'empty' | 'unavailable';
  /** Technical warnings for `console.warn` (no user data). */
  readonly warnings: readonly string[];
}

interface Candidate {
  readonly field: FormFieldConfig;
  readonly index: number;
}

/**
 * C4 → form configuration (api-contracts C4; US-01 tables 5.2 and 5.3; ADR-0002).
 *
 * Pure: a malformed field is skipped, a malformed validation or role is ignored, and each case
 * adds a warning. The app never fails because of an unexpected value from Strapi (REQ-01.7).
 */
export function mapFormFields(data: readonly unknown[]): FormFieldsMapping {
  const warnings: string[] = [];
  const candidates: Candidate[] = [];
  data.forEach((item, index) => {
    const field = mapField(item, index, warnings);
    if (field) {
      candidates.push({ field, index });
    }
  });

  // Repeated key: keep the first by `order` (empty last), then by position (US-01 5.3).
  const byOrder = [...candidates].sort(
    (a, b) => compareOrder(a.field.order, b.field.order) || a.index - b.index,
  );
  const unique = new Map<string, FormFieldConfig>();
  for (const { field } of byOrder) {
    if (unique.has(field.key)) {
      warnings.push(`[cms] form-field skipped: duplicated key (key=${field.key})`);
    } else {
      unique.set(field.key, field);
    }
  }

  const fields = [...unique.values()].sort(compareDisplayOrder);
  if (fields.length === 0) {
    return { fields, status: 'empty', warnings };
  }

  const presentRoles = new Set(fields.map((f) => f.role).filter((r): r is FieldRole => r !== null));
  const missingRoles = REQUIRED_ROLES.filter((role) => !presentRoles.has(role));
  for (const role of missingRoles) {
    warnings.push(`[cms] form unavailable: no valid field with role ${role}`);
  }
  return { fields, status: missingRoles.length > 0 ? 'unavailable' : 'ready', warnings };
}

/** Display order: fixed section order, then `order` ascending (empty last), then `key`. */
export function compareDisplayOrder(a: FormFieldConfig, b: FormFieldConfig): number {
  return (
    SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) ||
    compareOrder(a.order, b.order) ||
    (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
  );
}

function compareOrder(a: number | null, b: number | null): number {
  if (a === null || b === null) {
    return a === b ? 0 : a === null ? 1 : -1;
  }
  return a - b;
}

function mapField(item: unknown, index: number, warnings: string[]): FormFieldConfig | null {
  const dto = asDto<keyof FormFieldDto & string>(item);
  if (!dto) {
    warnings.push(`[cms] form-field skipped: not an object (index=${index})`);
    return null;
  }
  const key = typeof dto.key === 'string' && FIELD_KEY_PATTERN.test(dto.key) ? dto.key : null;
  if (key === null) {
    warnings.push(`[cms] form-field skipped: invalid key (index=${index})`);
    return null;
  }
  const label = trimmedString(dto.label);
  if (label === null) {
    warnings.push(`[cms] form-field skipped: empty label (key=${key})`);
    return null;
  }
  if (!isOneOf(dto.type, FIELD_TYPES)) {
    warnings.push(`[cms] form-field skipped: unknown type (key=${key})`);
    return null;
  }
  const type: FieldType = dto.type;
  if (!isOneOf(dto.section, SECTIONS)) {
    warnings.push(`[cms] form-field skipped: unknown section (key=${key})`);
    return null;
  }

  let options: readonly SelectOption[] = [];
  if (type === 'select') {
    options = mapOptions(dto.options, key, warnings);
    if (options.length === 0) {
      warnings.push(`[cms] form-field skipped: select without valid options (key=${key})`);
      return null;
    }
  }

  const order = integerOrNull(dto.order);
  if (order === undefined) {
    warnings.push(`[cms] form-field order ignored: not an integer (key=${key})`);
  }

  return {
    key,
    label,
    type,
    required: dto.required === true,
    helpText: trimmedString(dto.helpText),
    errorMessage: trimmedString(dto.errorMessage),
    order: order ?? null,
    section: dto.section,
    role: mapRole(dto.role, type, key, warnings),
    options,
    validations: mapValidations(dto.validations, type, key, warnings),
  };
}

function mapRole(raw: unknown, type: FieldType, key: string, warnings: string[]): FieldRole | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (!isOneOf(raw, FIELD_ROLES)) {
    warnings.push(`[cms] form-field role ignored: unknown role (key=${key})`);
    return null;
  }
  if (ROLE_FIELD_TYPE[raw] !== type) {
    warnings.push(
      `[cms] form-field role ignored: ${raw} is not compatible with ${type} (key=${key})`,
    );
    return null;
  }
  return raw;
}

function mapOptions(raw: unknown, key: string, warnings: string[]): SelectOption[] {
  const items = arrayOrEmpty(raw);
  if (items === null) {
    warnings.push(`[cms] form-field options ignored: not a list (key=${key})`);
    return [];
  }
  const options: SelectOption[] = [];
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const dto = asDto<keyof SelectOptionDto & string>(item);
    const value = typeof dto?.value === 'string' && dto.value.trim() !== '' ? dto.value : null;
    const label = trimmedString(dto?.label);
    if (value === null || label === null) {
      warnings.push(
        `[cms] select option skipped: missing value or label (key=${key}, index=${index})`,
      );
      return;
    }
    if (seen.has(value)) {
      warnings.push(`[cms] select option skipped: duplicated value (key=${key}, index=${index})`);
      return;
    }
    seen.add(value);
    options.push({ value, label });
  });
  return options;
}

function mapValidations(
  raw: unknown,
  type: FieldType,
  key: string,
  warnings: string[],
): ValidationRule[] {
  const items = arrayOrEmpty(raw);
  if (items === null) {
    warnings.push(`[cms] validations ignored: not a list (key=${key})`);
    return [];
  }
  const rules: ValidationRule[] = [];
  items.forEach((item, index) => {
    const rule = mapValidation(item, type);
    if (rule) {
      rules.push(rule);
    } else {
      warnings.push(
        `[cms] validation ignored: invalid or not allowed for ${type} (key=${key}, index=${index})`,
      );
    }
  });

  // `min > max` makes both limits invalid (US-01 5.3, content-model §3.2).
  const min = rules.find((r) => r.kind === 'min');
  const max = rules.find((r) => r.kind === 'max');
  if (min && max && min.kind === 'min' && max.kind === 'max' && min.value > max.value) {
    warnings.push(`[cms] validations min/max ignored: min > max (key=${key})`);
    return rules.filter((r) => r.kind !== 'min' && r.kind !== 'max');
  }
  return rules;
}

function mapValidation(item: unknown, type: FieldType): ValidationRule | null {
  const dto = asDto<keyof ValidationRuleDto & string>(item);
  if (!dto || !isOneOf(dto.kind, VALIDATION_KINDS)) {
    return null;
  }
  const kind = dto.kind;
  if (!VALIDATION_KINDS_BY_TYPE[type].includes(kind)) {
    return null;
  }
  switch (kind) {
    case 'minLength':
    case 'maxLength': {
      const value = numeric(dto.value);
      return value !== null && Number.isInteger(value) && value >= 0 ? { kind, value } : null;
    }
    case 'min':
    case 'max': {
      const value = numeric(dto.value);
      return value === null ? null : { kind, value };
    }
    case 'integer':
      return { kind };
    case 'pattern': {
      if (typeof dto.pattern !== 'string' || dto.pattern === '') {
        return null;
      }
      const regex = compileFullMatch(dto.pattern);
      return regex ? { kind, regex, source: dto.pattern } : null;
    }
  }
}

/** The pattern always covers the whole value (Q-01.16): `^(?:source)$`, without flags (ADR-0002). */
function compileFullMatch(source: string): RegExp | null {
  try {
    return new RegExp(`^(?:${source})$`);
  } catch {
    return null;
  }
}
