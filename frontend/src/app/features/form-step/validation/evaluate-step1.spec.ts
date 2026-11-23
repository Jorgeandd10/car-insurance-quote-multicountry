import {
  coCountryConfig,
  coFormFieldsDto,
  TODAY_CTX,
  validCoValues,
} from '../testing/form-fixtures';
import { evaluateStep1 } from './evaluate-step1';
import { normalizeStep1Values } from './step1-model';

describe('evaluateStep1', () => {
  it('AC-01.29 identifies the fields with roles documentNumber, birthDate and vehicleYear', () => {
    const result = evaluateStep1(coCountryConfig().form, validCoValues(), TODAY_CTX);
    const byRole = (role: string) => result.fields.filter((f) => f.role === role).map((f) => f.key);
    expect(byRole('documentNumber')).toEqual(['co_documentNumber']);
    expect(byRole('birthDate')).toEqual(['co_birthDate']);
    expect(byRole('vehicleYear')).toEqual(['co_vehicleYear']);
  });

  it('AC-01.29 gives the option label of each select, not only the value', () => {
    const result = evaluateStep1(coCountryConfig().form, validCoValues(), TODAY_CTX);
    const documentType = result.fields.find((f) => f.key === 'co_documentType');
    expect(documentType).toMatchObject({ value: 'cc', displayValue: 'Cédula de ciudadanía' });
    expect(result.fields.find((f) => f.key === 'co_make')?.displayValue).toBe('Mazda');
    expect(result.fields.find((f) => f.key === 'co_plate')?.displayValue).toBeNull();
  });

  it('AC-01.29 reports a valid step 1 as complete', () => {
    expect(evaluateStep1(coCountryConfig().form, validCoValues(), TODAY_CTX).isComplete).toBe(true);
  });

  it('AC-01.29 when the business makes a stored value invalid, the result becomes incomplete', () => {
    const stricter = coFormFieldsDto().map((dto) =>
      dto['key'] === 'co_documentNumber'
        ? { ...dto, validations: [{ id: 1, kind: 'pattern', value: null, pattern: '[0-9]{12}' }] }
        : dto,
    );
    expect(
      evaluateStep1(coCountryConfig(stricter).form, validCoValues(), TODAY_CTX).isComplete,
    ).toBe(false);
  });

  it('AC-02.22 a new required field makes the stored data incomplete', () => {
    const withNewField = [
      ...coFormFieldsDto(),
      {
        id: 99,
        key: 'co_color',
        label: 'Color',
        type: 'text',
        required: true,
        order: 5,
        section: 'vehicle',
      },
    ];
    expect(
      evaluateStep1(coCountryConfig(withNewField).form, validCoValues(), TODAY_CTX).isComplete,
    ).toBe(false);
  });

  it('REQ-01.20 a change of minimum age revalidates the birth date', () => {
    const values = { ...validCoValues(), co_birthDate: '2006-01-01' };
    expect(evaluateStep1(coCountryConfig().form, values, TODAY_CTX).isComplete).toBe(true);
    expect(
      evaluateStep1(coCountryConfig().form, values, { ...TODAY_CTX, minimumAge: 21 }).isComplete,
    ).toBe(false);
  });

  it('REQ-01.27 no data at all is incomplete', () => {
    expect(evaluateStep1(coCountryConfig().form, {}, TODAY_CTX).isComplete).toBe(false);
  });

  it.each(['empty', 'unavailable', 'configError'] as const)(
    'REQ-01.27 a form that is %s is never complete',
    (status) => {
      const form = { ...coCountryConfig().form, status };
      expect(evaluateStep1(form, validCoValues(), TODAY_CTX).isComplete).toBe(false);
    },
  );

  it('REQ-01.27 exposes normalised values: text trimmed', () => {
    const result = evaluateStep1(
      coCountryConfig().form,
      { ...validCoValues(), co_plate: '  ABC123 ' },
      TODAY_CTX,
    );
    expect(result.fields.find((f) => f.key === 'co_plate')).toMatchObject({
      value: 'ABC123',
      valid: true,
    });
  });

  it('REQ-01.23 normalised values to store: trimmed text, NaN → null, only current fields', () => {
    const fields = coCountryConfig().form.fields;
    const stored = normalizeStep1Values(fields, {
      ...validCoValues(),
      co_plate: ' ABC123 ',
      co_vehicleYear: Number.NaN,
      co_removed: 'x',
    });
    expect(stored['co_plate']).toBe('ABC123');
    expect(stored['co_vehicleYear']).toBeNull();
    expect(stored).not.toHaveProperty('co_removed');
    expect(Object.keys(stored)).toHaveLength(fields.length);
  });
});
