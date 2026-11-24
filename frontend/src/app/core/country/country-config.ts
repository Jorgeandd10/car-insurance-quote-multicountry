import { FormConfig } from '../../domain/form/form-config';

/** Lower-case ISO-like country code used in the URL and storage keys (content-model §2.1). */
export const COUNTRY_CODE_PATTERN = /^[a-z]{2}$/;

export function isCountryCode(value: string): boolean {
  return COUNTRY_CODE_PATTERN.test(value);
}

/** Item of the list of published countries (C1). */
export interface CountrySummary {
  readonly code: string;
  readonly name: string;
}

/** Texts of the `/` page (C2, single type `country-selection`). */
export interface CountrySelectionTexts {
  readonly heading: string;
  readonly intro: string | null;
  readonly countryListLabel: string;
}

/** Market data of the active country (C3). */
export interface Country {
  readonly code: string;
  readonly name: string;
  /** BCP 47 tag for `Intl` (`es-CO`). Not `locale`: reserved in Strapi 5. */
  readonly intlLocale: string;
  /** ISO 4217 (`COP`, `CLP`). */
  readonly currency: string;
  readonly minimumAge: number;
}

/** Attribute names of each `ui.*` component (content-model §3.5). */
export const WIZARD_TEXT_KEYS = [
  'stepIndicatorLabel',
  'step1Label',
  'step2Label',
  'step3Label',
  'policyholderSectionLabel',
  'vehicleSectionLabel',
  /** Link back to the country selection `/` on every wizard screen (REQ-01.36, D14). */
  'changeCountryLabel',
] as const;

export const FORM_STEP_TEXT_KEYS = ['title', 'continueLabel', 'emptyMessage'] as const;

export const PLANS_STEP_TEXT_KEYS = [
  'title',
  'groupLegend',
  'recommendedLabel',
  'coveragesHeading',
  'benefitsHeading',
  'backLabel',
  'continueLabel',
  'choosePlanMessage',
  'emptyMessage',
  'planUnavailableMessage',
] as const;

/** The summary is split in sections: a missing text only breaks its own section (REQ-03.38). */
export const SUMMARY_STEP_TEXT_SECTIONS = {
  page: ['title'],
  data: ['editDataLabel', 'yesLabel', 'noLabel', 'emptyValueLabel'],
  plan: ['planHeading', 'changePlanLabel', 'finalPriceLabel'],
  terms: ['termsHeading', 'acceptTermsLabel', 'acceptTermsHint', 'termsUnavailableMessage'],
  payment: [
    'gatewayLegend',
    'approvedOptionLabel',
    'rejectedOptionLabel',
    'payLabel',
    'processingMessage',
    'rejectedMessage',
  ],
} as const;

export const CONFIRMATION_TEXT_KEYS = [
  'title',
  'quoteNumberLabel',
  'planLabel',
  'paidPriceLabel',
  'newQuoteLabel',
] as const;

/**
 * Texts of one screen or section. A missing or blank text makes the whole group `configError`
 * (G2-2): the screen shows the generic error message instead of its content, never a default.
 */
export type TextGroup<K extends string> =
  | { readonly status: 'ok'; readonly texts: Readonly<Record<K, string>> }
  | { readonly status: 'configError'; readonly missing: readonly K[] };

export type WizardTextKey = (typeof WIZARD_TEXT_KEYS)[number];
export type FormStepTextKey = (typeof FORM_STEP_TEXT_KEYS)[number];
export type PlansStepTextKey = (typeof PLANS_STEP_TEXT_KEYS)[number];
export type SummarySection = keyof typeof SUMMARY_STEP_TEXT_SECTIONS;
export type SummaryTextKey<S extends SummarySection> =
  (typeof SUMMARY_STEP_TEXT_SECTIONS)[S][number];
export type ConfirmationTextKey = (typeof CONFIRMATION_TEXT_KEYS)[number];

export interface UiTexts {
  readonly wizard: TextGroup<WizardTextKey>;
  readonly formStep: TextGroup<FormStepTextKey>;
  readonly plansStep: TextGroup<PlansStepTextKey>;
  readonly summaryStep: { readonly [S in SummarySection]: TextGroup<SummaryTextKey<S>> };
  readonly confirmation: TextGroup<ConfirmationTextKey>;
}

/** Configuration of a country: market data + texts (C3) + form (C4), loaded once (Q-01.20). */
export interface CountryConfig {
  readonly country: Country;
  /** Always present: without it the configuration is not interpretable (REQ-01.13). */
  readonly genericErrorMessage: string;
  readonly texts: UiTexts;
  readonly form: FormConfig;
}

export type CountryConfigResult =
  | { readonly status: 'ready'; readonly config: CountryConfig }
  | { readonly status: 'notAvailable' };
