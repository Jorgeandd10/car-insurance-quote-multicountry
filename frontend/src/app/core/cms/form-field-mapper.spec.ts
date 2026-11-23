import { FormFieldConfig } from '../../domain/form/form-config';
import { mapFormFields } from './form-field-mapper';
import { strapiC4, strapiC4Complete } from './testing/strapi-fixtures';

type RawField = Record<string, unknown>;

const field = (overrides: RawField): RawField => ({
  id: 1,
  documentId: 'doc',
  key: 'co_field',
  label: 'Campo',
  type: 'text',
  required: false,
  helpText: null,
  errorMessage: null,
  order: 1,
  section: 'policyholder',
  role: null,
  options: [],
  validations: [],
  ...overrides,
});

/** The three required roles, so tests of other rules see a `ready` form. */
const roleFields = (): RawField[] => strapiC4Complete().data.filter((f) => f.role !== null);

const byKey = (fields: readonly FormFieldConfig[], key: string) =>
  fields.find((f) => f.key === key);

describe('mapFormFields', () => {
  it('REQ-01.8 maps the documented C4 example to the domain', () => {
    const { fields } = mapFormFields(strapiC4().data);
    expect(fields).toEqual([
      {
        key: 'co_documentType',
        label: 'Tipo de documento',
        type: 'select',
        required: true,
        helpText: null,
        errorMessage: 'Elige el tipo de documento.',
        order: 1,
        section: 'policyholder',
        role: null,
        options: [
          { value: 'cc', label: 'Cédula de ciudadanía' },
          { value: 'ce', label: 'Cédula de extranjería' },
        ],
        validations: [],
      },
      {
        key: 'co_vehicleYear',
        label: 'Año del vehículo',
        type: 'number',
        required: true,
        helpText: 'Año del modelo, por ejemplo 2020.',
        errorMessage: 'Ingresa un año válido.',
        order: 3,
        section: 'vehicle',
        role: 'vehicleYear',
        options: [],
        validations: [{ kind: 'integer' }],
      },
    ]);
  });

  it('REQ-01.28 a configuration with the three roles is ready', () => {
    const result = mapFormFields(strapiC4Complete().data);
    expect(result.status).toBe('ready');
    expect(result.warnings).toEqual([]);
  });

  it('AC-01.20 without a field with role birthDate the form is unavailable and warns', () => {
    const data = strapiC4Complete().data.filter((f) => f.role !== 'birthDate');
    const result = mapFormFields(data);
    expect(result.status).toBe('unavailable');
    expect(result.warnings).toContain('[cms] form unavailable: no valid field with role birthDate');
  });

  it('REQ-01.5 no valid field → empty', () => {
    expect(mapFormFields([]).status).toBe('empty');
    expect(mapFormFields([field({ type: 'radio' })]).status).toBe('empty');
  });

  it('AC-01.25 a field with an unknown type and a field without label are skipped with one warning each', () => {
    const data = [
      ...roleFields(),
      field({ key: 'co_unknown', type: 'slider' }),
      field({ key: 'co_noLabel', label: '   ' }),
      field({ key: 'co_ok' }),
    ];
    const result = mapFormFields(data);
    expect(result.fields.map((f) => f.key)).not.toContain('co_unknown');
    expect(result.fields.map((f) => f.key)).not.toContain('co_noLabel');
    expect(byKey(result.fields, 'co_ok')).toBeDefined();
    expect(result.status).toBe('ready');
    expect(result.warnings).toEqual([
      '[cms] form-field skipped: unknown type (key=co_unknown)',
      '[cms] form-field skipped: empty label (key=co_noLabel)',
    ]);
  });

  it('REQ-01.7 an element that is not an object, an invalid key or an unknown section is skipped', () => {
    const data = [
      ...roleFields(),
      42,
      field({ key: 'Bad-Key' }),
      field({ key: 'co_x', section: 'driver' }),
    ];
    const result = mapFormFields(data);
    expect(result.fields).toHaveLength(3);
    expect(result.warnings).toHaveLength(3);
  });

  it('REQ-01.8 orders by fixed section, then order ascending, empty order last, ties by key', () => {
    const data = [
      field({ key: 'v_b', section: 'vehicle', order: 1 }),
      field({ key: 'p_null', section: 'policyholder', order: null }),
      field({ key: 'p_2b', section: 'policyholder', order: 2 }),
      field({ key: 'p_2a', section: 'policyholder', order: 2 }),
      field({ key: 'p_1', section: 'policyholder', order: 1 }),
      field({ key: 'v_a', section: 'vehicle', order: null }),
    ];
    expect(mapFormFields(data).fields.map((f) => f.key)).toEqual([
      'p_1',
      'p_2a',
      'p_2b',
      'p_null',
      'v_b',
      'v_a',
    ]);
  });

  it('AC-01.10 swapping order in Strapi swaps the fields on screen', () => {
    const before = [field({ key: 'co_b', order: 1 }), field({ key: 'co_c', order: 2 })];
    const after = [field({ key: 'co_b', order: 2 }), field({ key: 'co_c', order: 1 })];
    expect(mapFormFields(before).fields.map((f) => f.key)).toEqual(['co_b', 'co_c']);
    expect(mapFormFields(after).fields.map((f) => f.key)).toEqual(['co_c', 'co_b']);
  });

  it('REQ-01.8 a repeated key keeps the first by order and warns', () => {
    const data = [
      field({ key: 'co_dup', label: 'Second', order: 5 }),
      field({ key: 'co_dup', label: 'First', order: 1 }),
    ];
    const result = mapFormFields(data);
    expect(result.fields.map((f) => f.label)).toEqual(['First']);
    expect(result.warnings).toContain('[cms] form-field skipped: duplicated key (key=co_dup)');
  });

  it('AC-01.13 select options keep the Strapi order; invalid and repeated values are dropped', () => {
    const data = [
      field({
        key: 'co_make',
        type: 'select',
        options: [
          { id: 1, value: 'marca_a', label: 'Marca A' },
          { id: 2, value: '', label: 'Sin valor' },
          { id: 3, value: 'marca_b', label: 'Marca B' },
          { id: 4, value: 'marca_a', label: 'Repetida' },
          { id: 5, value: 'marca_c', label: ' ' },
        ],
      }),
    ];
    const make = byKey(mapFormFields(data).fields, 'co_make');
    expect(make?.options).toEqual([
      { value: 'marca_a', label: 'Marca A' },
      { value: 'marca_b', label: 'Marca B' },
    ]);
  });

  it('REQ-01.11 a select without valid options is skipped', () => {
    const result = mapFormFields([field({ key: 'co_city', type: 'select', options: [] })]);
    expect(result.fields).toEqual([]);
    expect(result.warnings).toContain(
      '[cms] form-field skipped: select without valid options (key=co_city)',
    );
  });

  it('REQ-01.14 required is true only when Strapi says exactly true', () => {
    const fields = mapFormFields([
      field({ key: 'co_a', required: true }),
      field({ key: 'co_b', required: 'true' }),
      field({ key: 'co_c', required: null }),
    ]).fields;
    expect(fields.map((f) => f.required)).toEqual([true, false, false]);
  });

  it('REQ-01.9 empty help text and error message become null', () => {
    const [mapped] = mapFormFields([field({ helpText: '  ', errorMessage: '' })]).fields;
    expect(mapped.helpText).toBeNull();
    expect(mapped.errorMessage).toBeNull();
  });

  it('REQ-01.15 keeps the validations of the catalog for each type, with decimal values as strings', () => {
    const fields = mapFormFields([
      field({
        key: 'co_plate',
        validations: [
          { id: 1, kind: 'minLength', value: 6, pattern: null },
          { id: 2, kind: 'maxLength', value: '6', pattern: null },
          { id: 3, kind: 'pattern', value: null, pattern: '[A-Z]{3}\\d{3}' },
        ],
      }),
      field({
        key: 'co_amount',
        type: 'number',
        validations: [
          { id: 4, kind: 'min', value: '1.5', pattern: null },
          { id: 5, kind: 'max', value: 10, pattern: null },
          { id: 6, kind: 'integer', value: null, pattern: null },
        ],
      }),
    ]).fields;
    const plate = byKey(fields, 'co_plate');
    expect(plate?.validations.map((v) => v.kind)).toEqual(['minLength', 'maxLength', 'pattern']);
    expect(plate?.validations[1]).toEqual({ kind: 'maxLength', value: 6 });
    expect(byKey(fields, 'co_amount')?.validations).toEqual([
      { kind: 'min', value: 1.5 },
      { kind: 'max', value: 10 },
      { kind: 'integer' },
    ]);
  });

  it('AC-01.15 the pattern is anchored to the whole value', () => {
    const [plate] = mapFormFields([
      field({ validations: [{ id: 1, kind: 'pattern', value: null, pattern: '[A-Z]{3}\\d{3}' }] }),
    ]).fields;
    const rule = plate.validations[0];
    expect(rule.kind).toBe('pattern');
    if (rule.kind === 'pattern') {
      expect(rule.regex.test('ABC123')).toBe(true);
      expect(rule.regex.test('ABC12')).toBe(false);
      expect(rule.regex.test('xABC123')).toBe(false);
      expect(rule.source).toBe('[A-Z]{3}\\d{3}');
    }
  });

  it('REQ-01.15 validations of another type or with invalid parameters are ignored, the field stays', () => {
    const result = mapFormFields([
      field({
        key: 'co_text',
        validations: [
          { id: 1, kind: 'min', value: 1, pattern: null },
          { id: 2, kind: 'pattern', value: null, pattern: '([' },
          { id: 3, kind: 'maxLength', value: -1, pattern: null },
          { id: 4, kind: 'minLength', value: 2.5, pattern: null },
          { id: 5, kind: 'unknownKind', value: 1, pattern: null },
        ],
      }),
      field({
        key: 'co_date',
        type: 'date',
        validations: [{ id: 6, kind: 'maxLength', value: 3, pattern: null }],
      }),
      field({
        key: 'co_num',
        type: 'number',
        validations: [
          { id: 7, kind: 'min', value: 10, pattern: null },
          { id: 8, kind: 'max', value: 1, pattern: null },
          { id: 9, kind: 'integer', value: null, pattern: null },
        ],
      }),
    ]);
    expect(byKey(result.fields, 'co_text')?.validations).toEqual([]);
    expect(byKey(result.fields, 'co_date')?.validations).toEqual([]);
    expect(byKey(result.fields, 'co_num')?.validations).toEqual([{ kind: 'integer' }]);
    expect(result.warnings).toContain('[cms] validations min/max ignored: min > max (key=co_num)');
    expect(result.warnings.filter((w) => w.startsWith('[cms] validation ignored'))).toHaveLength(6);
  });

  it('REQ-01.28 a role on an incompatible type is ignored with a warning (and G2-5 applies)', () => {
    const data = strapiC4Complete().data.map((f) =>
      f.role === 'birthDate' ? { ...f, type: 'text' } : f,
    );
    const result = mapFormFields(data);
    expect(byKey(result.fields, 'co_birthDate')?.role).toBeNull();
    expect(result.warnings).toContain(
      '[cms] form-field role ignored: birthDate is not compatible with text (key=co_birthDate)',
    );
    expect(result.status).toBe('unavailable');
  });

  it('REQ-01.22 several fields with the same role keep it on all of them', () => {
    const data = [
      ...strapiC4Complete().data,
      field({ key: 'co_documentNumber2', role: 'documentNumber', order: 9 }),
    ];
    const result = mapFormFields(data);
    expect(result.fields.filter((f) => f.role === 'documentNumber')).toHaveLength(2);
    expect(result.status).toBe('ready');
  });

  it('REQ-01.7 a non-integer order is treated as empty with a warning', () => {
    const result = mapFormFields([
      field({ key: 'co_a', order: 1.5 }),
      field({ key: 'co_b', order: 2 }),
    ]);
    expect(result.fields.map((f) => f.key)).toEqual(['co_b', 'co_a']);
    expect(result.warnings).toContain('[cms] form-field order ignored: not an integer (key=co_a)');
  });
});
