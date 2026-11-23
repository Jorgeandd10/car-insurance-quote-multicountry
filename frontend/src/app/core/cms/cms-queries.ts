/**
 * Query parameters of the read-only requests C1–C7 (api-contracts §2).
 *
 * The app never sends `status` nor `publicationFilter`: the REST API returns the published version
 * by default and the `published-only` middleware enforces it (REQ-01.6, ADR-0003). Values are
 * encoded by `HttpParams`; here they are written unencoded for readability.
 */
export type CmsQuery = Readonly<Record<string, string>>;

/** Explicit page size; Strapi `maxLimit` is 100 (REQ-02.24). */
export const CMS_PAGE_SIZE = 100;

const fields = (names: readonly string[]): Record<string, string> =>
  Object.fromEntries(names.map((name, i) => [`fields[${i}]`, name]));

const populate = (names: readonly string[]): Record<string, string> =>
  Object.fromEntries(names.map((name, i) => [`populate[${i}]`, name]));

/** C1 — published countries for `/` and "país no disponible". */
export function countriesListQuery(): CmsQuery {
  return {
    ...fields(['code', 'name']),
    'sort[0]': 'name:asc',
    'pagination[pageSize]': String(CMS_PAGE_SIZE),
  };
}

/** C2 — texts of `/` (single type). */
export function countrySelectionQuery(): CmsQuery {
  return fields(['heading', 'intro', 'countryListLabel']);
}

/** C3 — data and texts of one country. `pageSize=2` detects a duplicated code. */
export function countryConfigQuery(countryCode: string): CmsQuery {
  return {
    'filters[code][$eq]': countryCode,
    ...fields(['code', 'name', 'intlLocale', 'currency', 'minimumAge']),
    ...populate([
      'wizardTexts',
      'formStepTexts',
      'plansStepTexts',
      'summaryStepTexts',
      'confirmationTexts',
    ]),
    'pagination[pageSize]': '2',
  };
}

/** C4 — form fields of one country (paginated by `CmsClient`). */
export function formFieldsQuery(countryCode: string): CmsQuery {
  return {
    'filters[country][code][$eq]': countryCode,
    ...fields([
      'key',
      'label',
      'type',
      'required',
      'helpText',
      'errorMessage',
      'order',
      'section',
      'role',
    ]),
    ...populate(['options', 'validations']),
    'pagination[pageSize]': String(CMS_PAGE_SIZE),
  };
}

/** C5 — active plans of one country (paginated by `CmsClient`). */
export function plansQuery(countryCode: string): CmsQuery {
  return {
    'filters[country][code][$eq]': countryCode,
    'filters[active][$eq]': 'true',
    ...fields([
      'name',
      'shortDescription',
      'basePrice',
      'currency',
      'order',
      'recommended',
      'active',
    ]),
    ...populate(['coverages', 'benefits']),
    'pagination[pageSize]': String(CMS_PAGE_SIZE),
  };
}

/** C6 — price factors of one country, without texts. */
export function priceFactorsQuery(countryCode: string): CmsQuery {
  return {
    'filters[code][$eq]': countryCode,
    ...fields(['code']),
    ...populate(['priceFactors']),
    'pagination[pageSize]': '2',
  };
}

/** C7 — terms and conditions of one country. */
export function termsQuery(countryCode: string): CmsQuery {
  return {
    'filters[code][$eq]': countryCode,
    ...fields(['code', 'termsAndConditions']),
    'pagination[pageSize]': '2',
  };
}
