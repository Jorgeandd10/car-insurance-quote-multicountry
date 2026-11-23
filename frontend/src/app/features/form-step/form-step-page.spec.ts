import { strapiC3 } from '../../core/cms/testing/strapi-fixtures';
import {
  CO_FIELD_ORDER,
  coCountryConfig,
  coFormFieldsDto,
  TODAY_CTX,
  validCoValues,
} from './testing/form-fixtures';
import { WizardHarness, createWizardHarness } from './testing/wizard-harness';
import { formStepState } from './form-step-page';

/** Fills step 1 of Colombia with valid data, like a user. */
async function fillValidCo(w: WizardHarness): Promise<void> {
  await w.fill('co_documentType', 'cc');
  await w.fill('co_documentNumber', '1234567890');
  await w.fill('co_birthDate', '2000-05-10');
  await w.check('co_dataConsent', true);
  await w.fill('co_plate', 'ABC123');
  await w.fill('co_make', 'mazda');
  await w.fill('co_vehicleYear', '2018');
}

describe('FormStepPage', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  describe('render', () => {
    it('AC-01.1 shows only the fields of the country, in sections and in the configured order', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      const ids = Array.from(w.root().querySelectorAll('form [id^="f-"]'), (el) => el.id.slice(2));
      expect(ids).toEqual([...CO_FIELD_ORDER]);
    });

    it('AC-01.26 REQ-01.12 each section is a fieldset with its Strapi legend, policyholder first', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      const legends = Array.from(w.root().querySelectorAll('fieldset > legend'), (l) =>
        l.textContent?.trim(),
      );
      expect(legends).toEqual(['Datos del asegurado', 'Datos del vehículo']);
      const vehicle = w.root().querySelectorAll('fieldset')[1];
      expect(vehicle.querySelector('#f-co_vehicleYear')).not.toBeNull();
    });

    it.each([
      ['text', 'co_plate', 'INPUT', 'text'],
      ['number', 'co_vehicleYear', 'INPUT', 'number'],
      ['select', 'co_make', 'SELECT', 'select-one'],
      ['date', 'co_birthDate', 'INPUT', 'date'],
      ['checkbox', 'co_dataConsent', 'INPUT', 'checkbox'],
    ])('AC-01.12 a %s field is a native control with its label', async (_type, key, tag, type) => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      const control = w.control<HTMLInputElement | HTMLSelectElement>(key);
      expect(control.tagName).toBe(tag);
      expect(control.type).toBe(type);
      const label = w.root().querySelector(`label[for="f-${key}"]`);
      expect(label?.textContent).toContain(
        coFormFieldsDto().find((f) => f['key'] === key)?.['label'],
      );
    });

    it('AC-01.12 REQ-01.9 the help text is associated with aria-describedby', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      expect(w.control('co_plate').getAttribute('aria-describedby')).toBe('help-co_plate');
      expect(w.root().querySelector('#help-co_plate')?.textContent?.trim()).toBe(
        'Seis caracteres, por ejemplo ABC123.',
      );
      expect(w.control('co_make').hasAttribute('aria-describedby')).toBe(false);
    });

    it('AC-01.13 the select offers exactly the Strapi options, in order, after an empty option', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      const options = Array.from(w.control<HTMLSelectElement>('co_make').options, (o) => [
        o.value,
        o.textContent?.trim(),
      ]);
      expect(options).toEqual([
        ['', ''],
        ['mazda', 'Mazda'],
        ['renault', 'Renault'],
      ]);
    });

    it('REQ-01.14 REQ-01.29 required fields are marked visually and with the native required property', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      expect(w.control('co_plate').required).toBe(true);
      expect(w.control('co_dataConsent').required).toBe(true);
      expect(w.control('co_nickname').required).toBe(false);
      expect(
        w
          .root()
          .querySelector('label[for="f-co_plate"] .required-mark')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
      expect(w.root().querySelector('label[for="f-co_nickname"] .required-mark')).toBeNull();
    });

    it('REQ-01.31 the focus is on the heading of the step and the indicator marks step 1', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      const heading = w.root().querySelector('h1');
      expect(heading?.textContent?.trim()).toBe('Tus datos y los de tu vehículo');
      expect(document.activeElement).toBe(heading);
      expect(w.root().querySelector('nav li[aria-current="step"]')?.textContent).toContain(
        'Tus datos',
      );
    });

    it('AC-01.31 the continue button shows the Strapi text', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      const button = w.root().querySelector('form button');
      expect(button?.getAttribute('type')).toBe('submit');
      expect(button?.textContent?.trim()).toBe('Continuar');
    });
  });

  describe('validation', () => {
    it('REQ-01.16 the error is not shown while typing, only after leaving the field', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_plate', 'AB', { blur: false });
      expect(w.root().querySelector('#err-co_plate')).toBeNull();
      expect(w.control('co_plate').hasAttribute('aria-invalid')).toBe(false);

      w.control('co_plate').dispatchEvent(new Event('blur'));
      await w.settle();
      expect(w.root().querySelector('#err-co_plate')?.textContent?.trim()).toBe(
        'Ingresa una placa válida.',
      );
    });

    it('AC-01.2 AC-01.26 an invalid field shows its configured message, aria-invalid and aria-describedby', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_plate', 'ABC12');
      const plate = w.control('co_plate');
      expect(plate.getAttribute('aria-invalid')).toBe('true');
      expect(plate.getAttribute('aria-describedby')).toBe('help-co_plate err-co_plate');
      expect(w.root().querySelector('#err-co_plate')?.textContent?.trim()).toBe(
        'Ingresa una placa válida.',
      );
    });

    it('REQ-01.16 the error disappears as soon as the value is valid', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_plate', 'ABC12');
      await w.fill('co_plate', 'ABC123', { blur: false });
      expect(w.root().querySelector('#err-co_plate')).toBeNull();
      expect(w.control('co_plate').getAttribute('aria-describedby')).toBe('help-co_plate');
    });

    it('REQ-01.16 an empty field message falls back to the generic message of the country', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_nickname', 'Demasiado largo');
      expect(w.root().querySelector('#err-co_nickname')?.textContent?.trim()).toBe(
        'No pudimos mostrar esta sección. Intenta más tarde.',
      );
    });

    it('AC-01.14 a required text with only spaces shows its message and stays on step 1', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await fillValidCo(w);
      await w.fill('co_documentNumber', '   ');
      await w.submit();
      expect(w.root().querySelector('#err-co_documentNumber')?.textContent?.trim()).toBe(
        'Ingresa un número de documento válido.',
      );
      expect(w.router.url).toBe('/co/form');
    });

    it('AC-01.16 REQ-01.17 trying to continue shows all errors, focuses the first invalid field and keeps the URL', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await fillValidCo(w);
      // Second and fourth on screen invalid: documentNumber and dataConsent.
      await w.fill('co_documentNumber', '12', { blur: false });
      await w.check('co_dataConsent', false);
      w.control('co_plate').focus();
      await w.submit();

      expect(w.root().querySelector('#err-co_documentNumber')).not.toBeNull();
      expect(w.root().querySelector('#err-co_dataConsent')?.textContent?.trim()).toBe(
        'Debes aceptar el tratamiento de datos.',
      );
      expect(document.activeElement).toBe(w.control('co_documentNumber'));
      expect(w.router.url).toBe('/co/form');
    });

    it('REQ-01.17 with an untouched empty form, continue reveals every required error', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.submit();
      const errors = Array.from(w.root().querySelectorAll('.error'), (e) => e.id);
      expect(errors).toEqual(
        CO_FIELD_ORDER.filter((key) => key !== 'co_nickname').map((key) => `err-${key}`),
      );
      expect(document.activeElement).toBe(w.control<HTMLSelectElement>('co_documentType'));
    });

    it('AC-01.33 a required checkbox left unchecked shows its message and stays on step 1', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await fillValidCo(w);
      await w.check('co_dataConsent', false);
      await w.submit();
      expect(w.root().querySelector('#err-co_dataConsent')).not.toBeNull();
      expect(w.router.url).toBe('/co/form');
    });

    it('AC-01.17 a vehicle year outside 2006-2027 is invalid; 2027 is valid', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_vehicleYear', '2028');
      expect(w.root().querySelector('#err-co_vehicleYear')?.textContent?.trim()).toBe(
        'Ingresa un año válido.',
      );
      await w.fill('co_vehicleYear', '2027');
      expect(w.root().querySelector('#err-co_vehicleYear')).toBeNull();
    });

    it('AC-01.18 a policyholder who turns 18 tomorrow is invalid with the field message', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_birthDate', '2008-11-23');
      expect(w.root().querySelector('#err-co_birthDate')?.textContent?.trim()).toBe(
        'Debes ser mayor de edad.',
      );
      await w.fill('co_birthDate', '2008-11-22');
      expect(w.root().querySelector('#err-co_birthDate')).toBeNull();
    });
  });

  describe('continue and persistence', () => {
    it('AC-01.32 with a valid form, continue goes to step 2 of the same country and stores the data', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await fillValidCo(w);
      await w.submit();
      expect(w.router.url).toBe('/co/plans');
      expect(w.storedStep1('co')).toEqual({ values: validCoValues() });
    });

    it('REQ-01.23 every change is stored, normalised (trimmed text), without any completed flag', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_plate', '  ABC123  ', { blur: false });
      const stored = w.storedStep1('co') as { values: Record<string, unknown> };
      expect(stored.values['co_plate']).toBe('ABC123');
      expect(JSON.stringify(stored)).not.toMatch(/complete/i);
      expect(w.storage.keys()).toEqual(['ciq.v1.co.step1']);
    });

    it('Q-01.16 leaving a text field replaces its value by the trimmed one', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_plate', '  ABC123  ');
      expect(w.control('co_plate').value).toBe('ABC123');
    });

    it('AC-01.4 going back from step 2 keeps the data filled in', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await fillValidCo(w);
      await w.submit();
      expect(w.router.url).toBe('/co/plans');

      await w.open('/co/form');
      expect(w.control('co_plate').value).toBe('ABC123');
      expect(w.control('co_dataConsent').checked).toBe(true);
      expect(w.control<HTMLSelectElement>('co_make').value).toBe('mazda');
      expect(w.control('co_vehicleYear').value).toBe('2018');
    });

    it('AC-01.19 REQ-01.21 the birth date is stored exactly as typed, YYYY-MM-DD', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_birthDate', '2008-11-23');
      const stored = w.storedStep1('co') as { values: Record<string, unknown> };
      expect(stored.values['co_birthDate']).toBe('2008-11-23');
    });

    it('AC-01.21 REQ-01.24 the stored values are restored when the page is opened again (reload)', async () => {
      const w = await createWizardHarness();
      w.storage.setItem(
        'ciq.v1.co.step1',
        JSON.stringify({ values: { ...validCoValues(), co_plate: 'XYZ789' } }),
      );
      await w.open('/co/form');
      expect(w.control('co_plate').value).toBe('XYZ789');
      expect(w.control('co_birthDate').value).toBe('2000-05-10');
    });

    it('AC-01.22 data is separated by country', async () => {
      const w = await createWizardHarness();
      await w.open('/co/form');
      await w.fill('co_plate', 'ABC123');

      await w.open('/cl/form');
      expect(w.control('cl_plate').value).toBe('');

      await w.open('/co/form');
      expect(w.control('co_plate').value).toBe('ABC123');
      expect(w.storage.keys().sort()).toEqual(['ciq.v1.cl.step1', 'ciq.v1.co.step1']);
    });

    it('AC-01.23 a stored option that no longer exists leaves the select empty, with a warning', async () => {
      const onlyMazda = coFormFieldsDto().map((dto) =>
        dto['key'] === 'co_make'
          ? { ...dto, options: [{ id: 111, value: 'mazda', label: 'Mazda' }] }
          : dto,
      );
      const w = await createWizardHarness({ coFields: onlyMazda });
      w.storage.setItem(
        'ciq.v1.co.step1',
        JSON.stringify({ values: { ...validCoValues(), co_make: 'renault' } }),
      );
      await w.open('/co/form');
      expect(w.control<HTMLSelectElement>('co_make').value).toBe('');
      expect(warn).toHaveBeenCalledWith(
        '[storage] step1 value discarded: does not fit the current field (key=co_make)',
      );
      expect((w.storedStep1('co') as { values: Record<string, unknown> }).values['co_make']).toBe(
        '',
      );
    });

    it('AC-01.24 a stored value that breaks a new validation is shown and fails on continue', async () => {
      const w = await createWizardHarness();
      w.storage.setItem(
        'ciq.v1.co.step1',
        JSON.stringify({ values: { ...validCoValues(), co_plate: 'ABC12' } }),
      );
      await w.open('/co/form');
      expect(w.control('co_plate').value).toBe('ABC12');
      await w.submit();
      expect(w.root().querySelector('#err-co_plate')?.textContent?.trim()).toBe(
        'Ingresa una placa válida.',
      );
      expect(w.router.url).toBe('/co/form');
    });

    it('REQ-01.26 a corrupt stored entry is discarded and the form starts empty', async () => {
      const w = await createWizardHarness();
      w.storage.setItem('ciq.v1.co.step1', '{oops');
      await w.open('/co/form');
      expect(w.control('co_plate').value).toBe('');
      expect(warn).toHaveBeenCalledWith('[storage] step1 discarded: invalid JSON');
    });
  });

  describe('states of the configuration', () => {
    it('AC-01.9 REQ-01.5 without published fields shows the empty message of the country and no continue', async () => {
      const w = await createWizardHarness({ coFields: [] });
      await w.open('/co/form');
      expect(w.root().querySelector('h1')?.textContent?.trim()).toBe(
        'Tus datos y los de tu vehículo',
      );
      expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        'El formulario no está disponible por ahora.',
      );
      expect(w.root().querySelector('form')).toBeNull();
      expect(w.root().querySelector('button')).toBeNull();
    });

    it('AC-01.20 without a field with role birthDate shows the generic error, no continue, and warns', async () => {
      const withoutBirthDate = coFormFieldsDto().filter((dto) => dto['role'] !== 'birthDate');
      const w = await createWizardHarness({ coFields: withoutBirthDate });
      await w.open('/co/form');
      expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        'No pudimos mostrar esta sección. Intenta más tarde.',
      );
      expect(w.root().querySelector('form')).toBeNull();
      expect(warn).toHaveBeenCalledWith(
        '[cms] form unavailable: no valid field with role birthDate',
      );
    });

    it('AC-01.35 a missing continue text shows the generic error instead of the form, with no default text', async () => {
      const co = strapiC3().data[0];
      co.formStepTexts.continueLabel = '';
      const w = await createWizardHarness({ co: co as unknown as Record<string, unknown> });
      await w.open('/co/form');
      expect(w.root().querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        'No pudimos mostrar esta sección. Intenta más tarde.',
      );
      expect(w.root().querySelector('form')).toBeNull();
      expect(w.root().textContent).not.toMatch(/Continuar|Continue/);
    });

    it('AC-01.25 skipped malformed fields do not break the rest of the form', async () => {
      const withBroken = [
        ...coFormFieldsDto(),
        {
          id: 90,
          key: 'co_slider',
          label: 'Deslizador',
          type: 'slider',
          section: 'vehicle',
          order: 1,
        },
        { id: 91, key: 'co_noLabel', label: '', type: 'text', section: 'vehicle', order: 1 },
      ];
      const w = await createWizardHarness({ coFields: withBroken });
      await w.open('/co/form');
      expect(w.root().querySelector('#f-co_slider')).toBeNull();
      expect(w.root().querySelector('#f-co_noLabel')).toBeNull();
      await fillValidCo(w);
      await w.submit();
      expect(w.router.url).toBe('/co/plans');
    });
  });

  describe('formStepState (pure)', () => {
    it('REQ-01.13 G2-2 the states use only Strapi texts', () => {
      const state = formStepState(coCountryConfig(), TODAY_CTX);
      expect(state.kind).toBe('ready');
      if (state.kind === 'ready') {
        expect(state.view.continueLabel).toBe('Continuar');
        expect(state.view.legends).toEqual({
          policyholder: 'Datos del asegurado',
          vehicle: 'Datos del vehículo',
        });
        expect(state.view.fields.map((f) => f.key)).toEqual([...CO_FIELD_ORDER]);
      }
    });
  });
});
