/**
 * Strapi 5 REST DTOs (api-contracts §2).
 *
 * Responses are `unknown` at the boundary (CLAUDE.md §8: no `any`) and are narrowed here. A DTO
 * type only fixes the attribute *names* documented in the contract; every value stays `unknown`
 * until a mapper checks it, so a change in Strapi can never reach the domain unvalidated.
 */

export type UnknownRecord = Readonly<Record<string, unknown>>;

/** Documented attribute names with unchecked values. */
export type Dto<K extends string> = { readonly [P in K]?: unknown };

export type CountrySummaryDto = Dto<'documentId' | 'code' | 'name'>;
export type CountrySelectionDto = Dto<'heading' | 'intro' | 'countryListLabel'>;
export type CountryConfigDto = Dto<
  | 'documentId'
  | 'code'
  | 'name'
  | 'intlLocale'
  | 'currency'
  | 'minimumAge'
  | 'wizardTexts'
  | 'formStepTexts'
  | 'plansStepTexts'
  | 'summaryStepTexts'
  | 'confirmationTexts'
>;
export type FormFieldDto = Dto<
  | 'documentId'
  | 'key'
  | 'label'
  | 'type'
  | 'required'
  | 'helpText'
  | 'errorMessage'
  | 'order'
  | 'section'
  | 'role'
  | 'options'
  | 'validations'
>;
export type SelectOptionDto = Dto<'value' | 'label'>;
export type ValidationRuleDto = Dto<'kind' | 'value' | 'pattern'>;
export type PlanDto = Dto<
  | 'documentId'
  | 'name'
  | 'shortDescription'
  | 'basePrice'
  | 'currency'
  | 'order'
  | 'recommended'
  | 'active'
  | 'coverages'
  | 'benefits'
>;
export type PlanItemDto = Dto<'label'>;
export type CountryPriceFactorsDto = Dto<'code' | 'priceFactors'>;
export type PriceFactorDto = Dto<'role' | 'operand' | 'min' | 'max' | 'multiplier'>;
export type CountryTermsDto = Dto<'code' | 'termsAndConditions'>;
export type BlockNodeDto = Dto<
  | 'type'
  | 'children'
  | 'text'
  | 'level'
  | 'format'
  | 'url'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Narrows an unknown value to a DTO with the given attribute names, or `null`. */
export function asDto<K extends string>(value: unknown): Dto<K> | null {
  // Safe: every attribute of `Dto<K>` is optional and `unknown`, so any object fits.
  return isRecord(value) ? (value as Dto<K>) : null;
}

/** Trimmed non-empty string, or `null` (empty, blank or not a string). */
export function trimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Finite number from a JSON number or a numeric string (Strapi `decimal`, ADR-0005), or `null`. */
export function numeric(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Integer or `null`; anything else (decimal, string, NaN) is `undefined` = malformed. */
export function integerOrNull(value: unknown): number | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

/** `null`/absent → `[]`; an array → itself; anything else → `null` (malformed). */
export function arrayOrEmpty(value: unknown): readonly unknown[] | null {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : null;
}

export function isOneOf<T extends string>(value: unknown, catalog: readonly T[]): value is T {
  return typeof value === 'string' && (catalog as readonly string[]).includes(value);
}
