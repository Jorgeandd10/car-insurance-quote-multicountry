/**
 * Domain model of the step 1 form (api-contracts §3, ADR-0002). Produced by `mapFormFields`
 * from the Strapi DTOs; components never read DTOs.
 */

/** Closed catalog of field types (REQ-01.10). */
export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';
export const FIELD_TYPES: readonly FieldType[] = ['text', 'number', 'select', 'date', 'checkbox'];

/** Closed catalog of roles (REQ-01.28, G2-1). */
export type FieldRole = 'documentNumber' | 'birthDate' | 'vehicleYear';
export const FIELD_ROLES: readonly FieldRole[] = ['documentNumber', 'birthDate', 'vehicleYear'];

/** Roles that must exist in a valid field, or the form is "unavailable" (REQ-01.22, G2-5). */
export const REQUIRED_ROLES: readonly FieldRole[] = ['documentNumber', 'birthDate', 'vehicleYear'];

/** Field type each role is compatible with (US-01 §5.2; content-model §2.2). */
export const ROLE_FIELD_TYPE: Readonly<Record<FieldRole, FieldType>> = {
  documentNumber: 'text',
  birthDate: 'date',
  vehicleYear: 'number',
};

/** Sections in their fixed display order (REQ-01.12, G2-6). */
export type Section = 'policyholder' | 'vehicle';
export const SECTIONS: readonly Section[] = ['policyholder', 'vehicle'];

/** Typed validations of the closed catalog (REQ-01.15, G2-7). */
export type ValidationRule =
  | { readonly kind: 'minLength'; readonly value: number }
  | { readonly kind: 'maxLength'; readonly value: number }
  | { readonly kind: 'pattern'; readonly regex: RegExp; readonly source: string }
  | { readonly kind: 'min'; readonly value: number }
  | { readonly kind: 'max'; readonly value: number }
  | { readonly kind: 'integer' };

export type ValidationKind = ValidationRule['kind'];

/** Validation kinds each field type accepts (US-01 §5.2). */
export const VALIDATION_KINDS_BY_TYPE: Readonly<Record<FieldType, readonly ValidationKind[]>> = {
  text: ['minLength', 'maxLength', 'pattern'],
  number: ['min', 'max', 'integer'],
  select: [],
  date: [],
  checkbox: [],
};

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface FormFieldConfig {
  readonly key: string;
  readonly label: string;
  readonly type: FieldType;
  readonly required: boolean;
  readonly helpText: string | null;
  readonly errorMessage: string | null;
  readonly order: number | null;
  readonly section: Section;
  readonly role: FieldRole | null;
  readonly options: readonly SelectOption[];
  readonly validations: readonly ValidationRule[];
}

/**
 * - `ready`: form can be rendered.
 * - `empty`: no valid field (REQ-01.5).
 * - `unavailable`: a required role is missing (REQ-01.22, G2-5).
 * - `configError`: a step 1 text is missing in Strapi (REQ-01.13).
 */
export type FormStatus = 'ready' | 'empty' | 'unavailable' | 'configError';

export interface FormConfig {
  readonly status: FormStatus;
  /** Valid fields in display order: fixed section order, then `order`, `null` last, then `key`. */
  readonly fields: readonly FormFieldConfig[];
}
