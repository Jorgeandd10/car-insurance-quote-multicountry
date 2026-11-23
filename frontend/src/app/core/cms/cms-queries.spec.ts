import {
  CMS_PAGE_SIZE,
  countriesListQuery,
  countryConfigQuery,
  countrySelectionQuery,
  formFieldsQuery,
  plansQuery,
  priceFactorsQuery,
  termsQuery,
} from './cms-queries';

const ALL_QUERIES = {
  C1: countriesListQuery(),
  C2: countrySelectionQuery(),
  C3: countryConfigQuery('co'),
  C4: formFieldsQuery('co'),
  C5: plansQuery('co'),
  C6: priceFactorsQuery('co'),
  C7: termsQuery('co'),
};

describe('CMS queries', () => {
  it.each(Object.entries(ALL_QUERIES))(
    'REQ-01.6 %s never asks for drafts: no status nor publicationFilter',
    (_name, query) => {
      expect(Object.keys(query).some((key) => /status|publicationFilter/i.test(key))).toBe(false);
    },
  );

  it('REQ-01.1 country requests filter only by the country of the URL', () => {
    expect(countryConfigQuery('cl')['filters[code][$eq]']).toBe('cl');
    expect(formFieldsQuery('cl')['filters[country][code][$eq]']).toBe('cl');
    expect(plansQuery('cl')['filters[country][code][$eq]']).toBe('cl');
    expect(priceFactorsQuery('cl')['filters[code][$eq]']).toBe('cl');
    expect(termsQuery('cl')['filters[code][$eq]']).toBe('cl');
  });

  it('REQ-02.24 collections that can grow ask for an explicit page size of 100', () => {
    expect(CMS_PAGE_SIZE).toBe(100);
    expect(countriesListQuery()['pagination[pageSize]']).toBe('100');
    expect(formFieldsQuery('co')['pagination[pageSize]']).toBe('100');
    expect(plansQuery('co')['pagination[pageSize]']).toBe('100');
  });

  it('REQ-02.2 plans are filtered by active = true', () => {
    expect(plansQuery('co')['filters[active][$eq]']).toBe('true');
  });

  it('api-contracts C3 asks for the five text components and pageSize 2 to detect duplicates', () => {
    const query = countryConfigQuery('co');
    expect(
      Object.entries(query)
        .filter(([key]) => key.startsWith('populate'))
        .map(([, v]) => v),
    ).toEqual([
      'wizardTexts',
      'formStepTexts',
      'plansStepTexts',
      'summaryStepTexts',
      'confirmationTexts',
    ]);
    expect(query['pagination[pageSize]']).toBe('2');
  });

  it('REQ-02.9 price factors are requested without texts', () => {
    expect(Object.values(priceFactorsQuery('co'))).not.toContain('wizardTexts');
    expect(priceFactorsQuery('co')['populate[0]']).toBe('priceFactors');
  });
});
