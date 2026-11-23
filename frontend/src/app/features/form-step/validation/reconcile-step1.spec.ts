import { coCountryConfig, coFormFieldsDto, validCoValues } from '../testing/form-fixtures';
import { evaluateStep1 } from './evaluate-step1';
import { reconcileStep1 } from './reconcile-step1';
import { TODAY_CTX } from '../testing/form-fixtures';

const fields = () => coCountryConfig().form.fields;

describe('reconcileStep1', () => {
  it('REQ-01.24 restores the stored values of the current fields', () => {
    const result = reconcileStep1(fields(), { values: validCoValues() });
    expect(result.values).toEqual(validCoValues());
    expect(result.warnings).toEqual([]);
  });

  it('REQ-01.26 without stored data every field starts empty, by type', () => {
    expect(reconcileStep1(fields(), null).values).toEqual({
      co_documentType: '',
      co_documentNumber: '',
      co_birthDate: '',
      co_dataConsent: false,
      co_nickname: '',
      co_plate: '',
      co_make: '',
      co_vehicleYear: null,
    });
  });

  it('AC-01.23 a removed field and a removed option are discarded; make must be chosen again', () => {
    const stored = { values: { ...validCoValues(), co_removed: 'A value', co_make: 'renault' } };
    const withoutRenault = coFormFieldsDto().map((dto) =>
      dto['key'] === 'co_make'
        ? { ...dto, options: [{ id: 111, value: 'mazda', label: 'Mazda' }] }
        : dto,
    );
    const result = reconcileStep1(coCountryConfig(withoutRenault).form.fields, stored);
    expect(result.values).not.toHaveProperty('co_removed');
    expect(result.values['co_make']).toBe('');
    expect(result.warnings).toEqual([
      '[storage] step1 value discarded: does not fit the current field (key=co_make)',
    ]);
  });

  it('AC-01.24 a stored value that breaks a new validation is kept and revalidated as invalid', () => {
    const stored = { values: { ...validCoValues(), co_plate: 'ABC12' } };
    const config = coCountryConfig();
    const result = reconcileStep1(config.form.fields, stored);
    expect(result.values['co_plate']).toBe('ABC12');
    const evaluation = evaluateStep1(config.form, result.values, TODAY_CTX);
    expect(evaluation.fields.find((f) => f.key === 'co_plate')?.valid).toBe(false);
    expect(evaluation.isComplete).toBe(false);
  });

  it('REQ-01.26 a new published field starts empty and the rest is kept', () => {
    const stored = { values: { ...validCoValues() } };
    Reflect.deleteProperty(stored.values, 'co_nickname');
    const result = reconcileStep1(fields(), stored);
    expect(result.values['co_nickname']).toBe('');
    expect(result.values['co_plate']).toBe('ABC123');
  });

  it('REQ-01.26 a changed field type discards a value that does not fit the new type', () => {
    const asNumber = coFormFieldsDto().map((dto) =>
      dto['key'] === 'co_plate' ? { ...dto, type: 'number', validations: [] } : dto,
    );
    const result = reconcileStep1(coCountryConfig(asNumber).form.fields, {
      values: validCoValues(),
    });
    expect(result.values['co_plate']).toBeNull();
    expect(result.warnings).toHaveLength(1);
  });

  it.each([
    ['text with a number', 'co_plate', 123],
    ['number with a string', 'co_vehicleYear', '2018'],
    ['checkbox with a string', 'co_dataConsent', 'true'],
    ['date that is not YYYY-MM-DD', 'co_birthDate', '10/05/2000'],
    ['select with null', 'co_make', null],
  ])(
    'REQ-01.26 a value of an unexpected type (%s) is discarded on its own',
    (_case, key, value) => {
      const result = reconcileStep1(fields(), { values: { ...validCoValues(), [key]: value } });
      expect(result.warnings).toEqual([
        `[storage] step1 value discarded: does not fit the current field (key=${key})`,
      ]);
      expect(result.values['co_documentNumber']).toBe('1234567890');
    },
  );

  it('US-01 §7 warnings never contain the stored values', () => {
    const result = reconcileStep1(fields(), {
      values: { ...validCoValues(), co_documentNumber: 1234567890 },
    });
    expect(result.warnings.join(' ')).not.toContain('1234567890');
  });
});
