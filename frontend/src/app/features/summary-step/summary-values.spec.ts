import {
  coCountryConfig,
  coFormFieldsDto,
  TODAY_CTX,
  validCoValues,
} from '../form-step/testing/form-fixtures';
import { Step1FieldResult, evaluateStep1 } from '../form-step/validation/evaluate-step1';
import { buildSummarySections, displayValue, formatCalendarDate } from './summary-values';

const TEXTS = { yesLabel: 'Sí', noLabel: 'No', emptyValueLabel: '—' };
const LEGENDS = { policyholder: 'Datos del asegurado', vehicle: 'Datos del vehículo' };

const field = (overrides: Partial<Step1FieldResult>): Step1FieldResult => ({
  key: 'co_x',
  type: 'text',
  section: 'policyholder',
  role: null,
  label: 'X',
  value: '',
  displayValue: null,
  valid: true,
  ...overrides,
});

const sectionsFor = (values = validCoValues(), fields = coFormFieldsDto()) =>
  buildSummarySections(
    evaluateStep1(coCountryConfig(fields).form, values, TODAY_CTX),
    LEGENDS,
    TEXTS,
    'es-CO',
  );

describe('summary values', () => {
  it('AC-03.8 REQ-03.2 shows policyholder then vehicle, with Strapi legends, labels and configured order', () => {
    const sections = sectionsFor();
    expect(sections.map((s) => s.legend)).toEqual(['Datos del asegurado', 'Datos del vehículo']);
    expect(sections[0].items.map((i) => i.label)).toEqual([
      'Tipo de documento',
      'Número de documento',
      'Fecha de nacimiento',
      'Acepto el tratamiento de mis datos',
      'Cómo quieres que te llamemos',
    ]);
    expect(sections[1].items.map((i) => i.label)).toEqual(['Placa', 'Marca', 'Año del vehículo']);
  });

  it('AC-03.8 REQ-03.3 select shows the option label, checkbox the yes text, empty optional "—"', () => {
    const byKey = new Map(
      sectionsFor()
        .flatMap((s) => s.items)
        .map((i) => [i.key, i.display]),
    );
    expect(byKey.get('co_make')).toBe('Mazda');
    expect(byKey.get('co_documentType')).toBe('Cédula de ciudadanía');
    expect(byKey.get('co_dataConsent')).toBe('Sí');
    expect(byKey.get('co_nickname')).toBe('—');
  });

  it('AC-03.8 a date is shown in the long format of the locale, without shifting the day', () => {
    expect(formatCalendarDate('1990-05-07', 'es-CO')).toBe('7 de mayo de 1990');
    expect(formatCalendarDate('1990-05-07', 'es-CL')).toBe('7 de mayo de 1990');
    expect(displayValue(field({ type: 'date', value: '2000-01-01' }), TEXTS, 'es-CO')).toBe(
      '1 de enero de 2000',
    );
  });

  it('REQ-03.21 AC-01.19 the date does not depend on the time zone of the device', () => {
    vi.stubEnv('TZ', 'America/Bogota');
    expect(formatCalendarDate('1990-05-07', 'es-CO')).toBe('7 de mayo de 1990');
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(formatCalendarDate('1990-05-07', 'es-CO')).toBe('7 de mayo de 1990');
    vi.unstubAllEnvs();
  });

  it('AC-03.5 REQ-03.6 the documentNumber role is masked; the document type is shown in clear', () => {
    const items = sectionsFor().flatMap((s) => s.items);
    expect(items.find((i) => i.key === 'co_documentNumber')?.display).toBe('******7890');
    expect(JSON.stringify(items)).not.toContain('1234567890');
  });

  it('AC-03.6 a Chilean RUT keeps its separators', () => {
    expect(
      displayValue(field({ role: 'documentNumber', value: '12.345.678-5' }), TEXTS, 'es-CL'),
    ).toBe('**.***.678-5');
  });

  it('REQ-03.6 every field with role documentNumber is masked', () => {
    const second = {
      id: 40,
      key: 'co_otherDocument',
      label: 'Otro documento',
      type: 'text',
      required: false,
      order: 8,
      section: 'policyholder',
      role: 'documentNumber',
    };
    const items = sectionsFor({ ...validCoValues(), co_otherDocument: 'AB123456' }, [
      ...coFormFieldsDto(),
      second,
    ]).flatMap((s) => s.items);
    expect(items.find((i) => i.key === 'co_otherDocument')?.display).toBe('****3456');
  });

  it('REQ-03.3 a vehicle year is shown without grouping; other numbers with the locale format', () => {
    expect(
      displayValue(field({ type: 'number', role: 'vehicleYear', value: 2018 }), TEXTS, 'es-CO'),
    ).toBe('2018');
    expect(displayValue(field({ type: 'number', value: 1234567.5 }), TEXTS, 'es-CO')).toBe(
      '1.234.567,5',
    );
  });

  it('REQ-03.3 an unchecked checkbox shows the no text, not "—"', () => {
    expect(displayValue(field({ type: 'checkbox', value: false }), TEXTS, 'es-CO')).toBe('No');
  });

  it('AC-03.21 a field removed from the configuration is not shown; the rest is', () => {
    const withoutNickname = coFormFieldsDto().filter((dto) => dto['key'] !== 'co_nickname');
    const items = sectionsFor({ ...validCoValues(), co_nickname: 'Pepe' }, withoutNickname).flatMap(
      (s) => s.items,
    );
    expect(items.map((i) => i.key)).not.toContain('co_nickname');
    expect(items).toHaveLength(7);
  });
});
