import { FormConfig, FormStatus } from '../../domain/form/form-config';
import {
  CONFIRMATION_TEXT_KEYS,
  Country,
  CountryConfig,
  CountrySelectionTexts,
  CountrySummary,
  FORM_STEP_TEXT_KEYS,
  PLANS_STEP_TEXT_KEYS,
  SUMMARY_STEP_TEXT_SECTIONS,
  TextGroup,
  UiTexts,
  WIZARD_TEXT_KEYS,
  isCountryCode,
} from '../country/country-config';
import { contractError } from './cms-error';
import { FormFieldsMapping } from './form-field-mapper';
import {
  CountryConfigDto,
  CountrySelectionDto,
  CountrySummaryDto,
  asDto,
  isRecord,
  trimmedString,
} from './strapi-dto';

export interface CountrySummariesMapping {
  readonly countries: readonly CountrySummary[];
  readonly warnings: readonly string[];
}

/**
 * C1 → published countries. Items with a code that is not `^[a-z]{2}$` or without a name are
 * dropped with a warning; on duplicated codes the first one is kept (api-contracts C1).
 */
export function mapCountrySummaries(data: readonly unknown[]): CountrySummariesMapping {
  const countries: CountrySummary[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  data.forEach((item, index) => {
    const dto = asDto<keyof CountrySummaryDto & string>(item);
    const code = typeof dto?.code === 'string' ? dto.code : null;
    const name = trimmedString(dto?.name);
    if (code === null || !isCountryCode(code) || name === null) {
      warnings.push(`[cms] country skipped: invalid code or name (index=${index})`);
      return;
    }
    if (seen.has(code)) {
      warnings.push(`[cms] country skipped: duplicated code (code=${code})`);
      return;
    }
    seen.add(code);
    countries.push({ code, name });
  });
  return { countries, warnings };
}

/**
 * C2 → texts of `/`. Missing `heading` or `countryListLabel` gives `null`, which the page shows
 * as "error de carga" + "reintentar" (api-contracts §4, G3-10).
 */
export function mapCountrySelectionTexts(data: unknown): CountrySelectionTexts | null {
  const dto = asDto<keyof CountrySelectionDto & string>(data);
  const heading = trimmedString(dto?.heading);
  const countryListLabel = trimmedString(dto?.countryListLabel);
  if (heading === null || countryListLabel === null) {
    return null;
  }
  return { heading, intro: trimmedString(dto?.intro), countryListLabel };
}

/** Reads a group of required texts; any missing or blank text makes the group `configError`. */
export function mapTextGroup<K extends string>(raw: unknown, keys: readonly K[]): TextGroup<K> {
  const source = isRecord(raw) ? raw : {};
  const texts: Partial<Record<K, string>> = {};
  const missing: K[] = [];
  for (const key of keys) {
    const value = trimmedString(source[key]);
    if (value === null) {
      missing.push(key);
    } else {
      texts[key] = value;
    }
  }
  return missing.length > 0
    ? { status: 'configError', missing }
    : { status: 'ok', texts: texts as Record<K, string> };
}

/** C3 part of the configuration: country data and texts, before combining with C4. */
export type CountryDataMapping =
  | { readonly status: 'notAvailable' }
  | {
      readonly status: 'ready';
      readonly country: Country;
      readonly genericErrorMessage: string;
      readonly texts: UiTexts;
    };

/**
 * C3 → country data and texts (api-contracts C3).
 *
 * - 0 items → `notAvailable` ("país no disponible").
 * - More than 1 item, invalid market data, or no `genericErrorMessage` → throws a contract error,
 *   shown as "error de carga" + "reintentar" (REQ-01.4, REQ-01.13).
 * - A missing screen text only marks that screen (or summary section) as `configError`.
 */
export function mapCountryConfig(
  data: readonly unknown[],
  requestedCode: string,
): CountryDataMapping {
  if (data.length === 0) {
    return { status: 'notAvailable' };
  }
  if (data.length > 1) {
    throw contractError(`more than one country with code ${requestedCode}`);
  }
  const dto = asDto<keyof CountryConfigDto & string>(data[0]);
  if (!dto) {
    throw contractError('country is not an object');
  }
  if (dto.code !== requestedCode) {
    throw contractError(`country code does not match ${requestedCode}`);
  }
  const name = trimmedString(dto.name);
  const intlLocale = trimmedString(dto.intlLocale);
  const currency = trimmedString(dto.currency);
  if (name === null || intlLocale === null || currency === null) {
    throw contractError(`missing market data for ${requestedCode}`);
  }
  if (!isSupportedByIntl(intlLocale, currency)) {
    throw contractError(`intlLocale or currency not accepted by Intl for ${requestedCode}`);
  }
  const minimumAge = dto.minimumAge;
  if (typeof minimumAge !== 'number' || !Number.isInteger(minimumAge) || minimumAge < 0) {
    throw contractError(`invalid minimumAge for ${requestedCode}`);
  }

  const wizardRaw = dto.wizardTexts;
  const genericErrorMessage = trimmedString(
    isRecord(wizardRaw) ? wizardRaw['genericErrorMessage'] : null,
  );
  if (genericErrorMessage === null) {
    throw contractError(`missing genericErrorMessage for ${requestedCode}`);
  }

  const summaryRaw = dto.summaryStepTexts;
  const texts: UiTexts = {
    wizard: mapTextGroup(wizardRaw, WIZARD_TEXT_KEYS),
    formStep: mapTextGroup(dto.formStepTexts, FORM_STEP_TEXT_KEYS),
    plansStep: mapTextGroup(dto.plansStepTexts, PLANS_STEP_TEXT_KEYS),
    summaryStep: {
      page: mapTextGroup(summaryRaw, SUMMARY_STEP_TEXT_SECTIONS.page),
      data: mapTextGroup(summaryRaw, SUMMARY_STEP_TEXT_SECTIONS.data),
      plan: mapTextGroup(summaryRaw, SUMMARY_STEP_TEXT_SECTIONS.plan),
      terms: mapTextGroup(summaryRaw, SUMMARY_STEP_TEXT_SECTIONS.terms),
      payment: mapTextGroup(summaryRaw, SUMMARY_STEP_TEXT_SECTIONS.payment),
    },
    confirmation: mapTextGroup(dto.confirmationTexts, CONFIRMATION_TEXT_KEYS),
  };

  return {
    status: 'ready',
    country: { code: requestedCode, name, intlLocale, currency, minimumAge },
    genericErrorMessage,
    texts,
  };
}

/**
 * Warnings for missing texts: attribute names only (no user data). The configuration is still
 * usable; the affected screen shows the generic error message.
 */
export function missingTextWarnings(texts: UiTexts): string[] {
  const groups: [string, TextGroup<string>][] = [
    ['wizardTexts', texts.wizard],
    ['formStepTexts', texts.formStep],
    ['plansStepTexts', texts.plansStep],
    ['summaryStepTexts.page', texts.summaryStep.page],
    ['summaryStepTexts.data', texts.summaryStep.data],
    ['summaryStepTexts.plan', texts.summaryStep.plan],
    ['summaryStepTexts.terms', texts.summaryStep.terms],
    ['summaryStepTexts.payment', texts.summaryStep.payment],
    ['confirmationTexts', texts.confirmation],
  ];
  const warnings: string[] = [];
  for (const [name, group] of groups) {
    if (group.status === 'configError') {
      warnings.push(`[cms] missing texts in ${name}: ${group.missing.join(', ')}`);
    }
  }
  return warnings;
}

/**
 * Combines C3 and C4 into the country configuration (api-contracts "Estado de FormConfig").
 * Precedence: a missing step 1 text (form step or wizard texts: legends and indicator) →
 * `configError` (REQ-01.13); then `empty` (REQ-01.5); then `unavailable` (REQ-01.22).
 */
export function assembleCountryConfig(
  countryData: Extract<CountryDataMapping, { status: 'ready' }>,
  formFields: FormFieldsMapping,
): CountryConfig {
  const textsMissing =
    countryData.texts.formStep.status === 'configError' ||
    countryData.texts.wizard.status === 'configError';
  const status: FormStatus = textsMissing ? 'configError' : formFields.status;
  const form: FormConfig = { status, fields: formFields.fields };
  return {
    country: countryData.country,
    genericErrorMessage: countryData.genericErrorMessage,
    texts: countryData.texts,
    form,
  };
}

function isSupportedByIntl(intlLocale: string, currency: string): boolean {
  try {
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency });
    return true;
  } catch {
    return false;
  }
}
