import { assembleCountryConfig, mapCountryConfig } from '../../core/cms/country-mapper';
import { mapFormFields } from '../../core/cms/form-field-mapper';
import { strapiC3, strapiC4Complete } from '../../core/cms/testing/strapi-fixtures';
import { isWizardScreen, screenHeading, stepOf } from './wizard-screens';

const configWith = (
  patch: (country: ReturnType<typeof strapiC3>['data'][number]) => void = () => undefined,
) => {
  const country = strapiC3().data[0];
  patch(country);
  const mapped = mapCountryConfig([country], 'co');
  if (mapped.status !== 'ready') {
    throw new Error('expected ready');
  }
  return assembleCountryConfig(mapped, mapFormFields(strapiC4Complete().data));
};

describe('wizard screens', () => {
  it('D7 form, plans and summary are steps 1-3; the confirmation is not a step', () => {
    expect([stepOf('form'), stepOf('plans'), stepOf('summary'), stepOf('confirmation')]).toEqual([
      1,
      2,
      3,
      null,
    ]);
    expect(isWizardScreen('plans')).toBe(true);
    expect(isWizardScreen('payment')).toBe(false);
    expect(isWizardScreen(undefined)).toBe(false);
  });

  it('REQ-01.13 the heading of each screen is its Strapi title', () => {
    const config = configWith();
    expect(screenHeading(config, 'form')).toEqual({
      kind: 'title',
      text: 'Tus datos y los de tu vehículo',
    });
    expect(screenHeading(config, 'plans')).toEqual({ kind: 'title', text: 'Elige tu plan' });
    expect(screenHeading(config, 'summary')).toEqual({ kind: 'title', text: 'Resumen' });
    expect(screenHeading(config, 'confirmation')).toEqual({ kind: 'title', text: '¡Listo!' });
  });

  it('REQ-01.13 any missing text of the screen gives the generic error, never a default', () => {
    const config = configWith((country) => {
      country.confirmationTexts.newQuoteLabel = '';
    });
    expect(screenHeading(config, 'confirmation')).toEqual({
      kind: 'configError',
      text: 'No pudimos mostrar esta sección. Intenta más tarde.',
    });
    expect(screenHeading(config, 'form').kind).toBe('title');
  });
});
