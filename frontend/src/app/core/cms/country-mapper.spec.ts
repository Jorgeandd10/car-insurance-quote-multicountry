import { CmsRequestError } from './cms-error';
import {
  assembleCountryConfig,
  mapCountryConfig,
  mapCountrySelectionTexts,
  mapCountrySummaries,
  missingTextWarnings,
} from './country-mapper';
import { mapFormFields } from './form-field-mapper';
import {
  strapiC1,
  strapiC2,
  strapiC3,
  strapiC4,
  strapiC4Complete,
} from './testing/strapi-fixtures';

const readyCountry = (data: readonly unknown[] = strapiC3().data) => {
  const result = mapCountryConfig(data, 'co');
  if (result.status !== 'ready') {
    throw new Error('expected a ready country');
  }
  return result;
};

describe('country mapper', () => {
  describe('C1 published countries', () => {
    it('AC-01.5 maps the published countries with the names from Strapi, in the received order', () => {
      expect(mapCountrySummaries(strapiC1().data)).toEqual({
        countries: [
          { code: 'cl', name: 'Chile' },
          { code: 'co', name: 'Colombia' },
        ],
        warnings: [],
      });
    });

    it('REQ-01.7 drops items with an invalid code or without name, and duplicated codes', () => {
      const data = [
        ...strapiC1().data,
        { id: 9, documentId: 'x', code: 'CO', name: 'Upper' },
        { id: 10, documentId: 'y', code: 'pe', name: '  ' },
        { id: 11, documentId: 'z', code: 'co', name: 'Colombia bis' },
        'not an object',
      ];
      const result = mapCountrySummaries(data);
      expect(result.countries.map((c) => c.code)).toEqual(['cl', 'co']);
      expect(result.warnings).toHaveLength(4);
    });
  });

  describe('C2 country selection texts', () => {
    it('REQ-01.2 maps the texts of "/" from Strapi', () => {
      expect(mapCountrySelectionTexts(strapiC2().data)).toEqual({
        heading: 'Cotiza el seguro de tu auto',
        intro: 'Elige tu país para empezar.',
        countryListLabel: 'Países disponibles',
      });
    });

    it('REQ-01.2 intro is optional', () => {
      const data = { ...strapiC2().data, intro: null };
      expect(mapCountrySelectionTexts(data)?.intro).toBeNull();
    });

    it('REQ-01.13 a missing heading or list label is not interpretable (null → error state)', () => {
      expect(mapCountrySelectionTexts({ ...strapiC2().data, heading: ' ' })).toBeNull();
      expect(mapCountrySelectionTexts({ ...strapiC2().data, countryListLabel: null })).toBeNull();
      expect(mapCountrySelectionTexts('nope')).toBeNull();
    });
  });

  describe('C3 country configuration', () => {
    it('REQ-01.1 maps market data and texts of the requested country', () => {
      const result = readyCountry();
      expect(result.country).toEqual({
        code: 'co',
        name: 'Colombia',
        intlLocale: 'es-CO',
        currency: 'COP',
        minimumAge: 18,
      });
      expect(result.genericErrorMessage).toBe(
        'No pudimos mostrar esta sección. Intenta más tarde.',
      );
      expect(result.texts.formStep).toEqual({
        status: 'ok',
        texts: {
          title: 'Tus datos y los de tu vehículo',
          continueLabel: 'Continuar',
          emptyMessage: 'El formulario no está disponible por ahora.',
        },
      });
      expect(result.texts.summaryStep.data).toEqual({
        status: 'ok',
        texts: {
          editDataLabel: 'Editar datos',
          yesLabel: 'Sí',
          noLabel: 'No',
          emptyValueLabel: '—',
        },
      });
      expect(missingTextWarnings(result.texts)).toEqual([]);
    });

    it('AC-01.6 no country with that code → notAvailable', () => {
      expect(mapCountryConfig([], 'pe')).toEqual({ status: 'notAvailable' });
    });

    it('REQ-01.4 more than one country with the code is not interpretable', () => {
      const data = strapiC3().data;
      expect(() => mapCountryConfig([...data, ...data], 'co')).toThrow(CmsRequestError);
    });

    it.each([
      ['minimumAge is not an integer', { minimumAge: 17.5 }],
      ['minimumAge is negative', { minimumAge: -1 }],
      ['minimumAge is missing', { minimumAge: null }],
      ['currency is not ISO 4217', { currency: 'PESOS' }],
      ['intlLocale is empty', { intlLocale: '' }],
      ['code does not match', { code: 'cl' }],
    ])('REQ-01.4 invalid market data (%s) is not interpretable', (_case, patch) => {
      const data = [{ ...strapiC3().data[0], ...patch }];
      expect(() => mapCountryConfig(data, 'co')).toThrow(CmsRequestError);
    });

    it('REQ-01.13 without genericErrorMessage the configuration is not interpretable', () => {
      const country = strapiC3().data[0];
      country.wizardTexts.genericErrorMessage = '   ';
      expect(() => mapCountryConfig([country], 'co')).toThrow(CmsRequestError);
    });

    it('AC-01.35 a blank continue text marks the form step as configError, without defaults', () => {
      const country = strapiC3().data[0];
      country.formStepTexts.continueLabel = '';
      const result = readyCountry([country]);
      expect(result.texts.formStep).toEqual({ status: 'configError', missing: ['continueLabel'] });
      expect(result.texts.plansStep.status).toBe('ok');
      expect(missingTextWarnings(result.texts)).toEqual([
        '[cms] missing texts in formStepTexts: continueLabel',
      ]);
    });

    it('REQ-03.38 a missing summary text only breaks its own section', () => {
      const country = strapiC3().data[0];
      Reflect.deleteProperty(country.summaryStepTexts, 'payLabel');
      const result = readyCountry([country]);
      expect(result.texts.summaryStep.payment).toEqual({
        status: 'configError',
        missing: ['payLabel'],
      });
      expect(result.texts.summaryStep.data.status).toBe('ok');
      expect(result.texts.summaryStep.terms.status).toBe('ok');
    });

    it('REQ-01.13 texts are trimmed', () => {
      const country = strapiC3().data[0];
      country.formStepTexts.title = '  Tus datos  ';
      const formStep = readyCountry([country]).texts.formStep;
      expect(formStep.status === 'ok' && formStep.texts.title).toBe('Tus datos');
    });
  });

  describe('CountryConfig (C3 + C4)', () => {
    it('REQ-01.1 a complete configuration is ready', () => {
      const config = assembleCountryConfig(readyCountry(), mapFormFields(strapiC4Complete().data));
      expect(config.form.status).toBe('ready');
      expect(config.form.fields).toHaveLength(4);
    });

    it('REQ-01.13 a missing step 1 text makes the form configError before empty or unavailable', () => {
      const country = strapiC3().data[0];
      country.formStepTexts.title = '';
      expect(assembleCountryConfig(readyCountry([country]), mapFormFields([])).form.status).toBe(
        'configError',
      );
    });

    it('REQ-01.13 a missing section legend (wizard texts) also makes the form configError', () => {
      const country = strapiC3().data[0];
      country.wizardTexts.vehicleSectionLabel = '';
      const config = assembleCountryConfig(
        readyCountry([country]),
        mapFormFields(strapiC4Complete().data),
      );
      expect(config.form.status).toBe('configError');
    });

    it('AC-01.20 the documented C4 example lacks birthDate and documentNumber → unavailable', () => {
      expect(
        assembleCountryConfig(readyCountry(), mapFormFields(strapiC4().data)).form.status,
      ).toBe('unavailable');
    });
  });
});
