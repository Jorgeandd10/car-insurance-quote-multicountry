import { FormFieldConfig, ValidationRule } from '../../../domain/form/form-config';
import { TODAY_CTX } from '../testing/form-fixtures';
import { hasMaxLength, hasMinLength, isBlank, matchesFully } from './text-rules';
import { isAtLeast, isAtMost, isInteger } from './number-rules';
import { fieldViolations, isFieldValueValid, ruleHolds } from './validator-registry';

const field = (overrides: Partial<FormFieldConfig>): FormFieldConfig => ({
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

const pattern = (source: string): ValidationRule => ({
  kind: 'pattern',
  regex: new RegExp(`^(?:${source})$`),
  source,
});

describe('validator registry', () => {
  describe('text and number rules', () => {
    it('REQ-01.14 a value of only spaces is blank', () => {
      expect(isBlank('   ')).toBe(true);
      expect(isBlank(' a ')).toBe(false);
    });

    it('Q-01.16 lengths count characters of the trimmed value', () => {
      expect(hasMinLength('ñandú', 5)).toBe(true);
      expect(hasMaxLength('ñandú', 4)).toBe(false);
    });

    it('Q-01.16 the pattern covers the whole value', () => {
      const anchored = /^(?:[A-Z]{3}\d{3})$/;
      expect(matchesFully('ABC123', anchored)).toBe(true);
      expect(matchesFully('ABC1234', anchored)).toBe(false);
      expect(matchesFully('xABC123', anchored)).toBe(false);
    });

    it('REQ-01.15 number rules: min, max and integer', () => {
      expect(isAtLeast(1, 1)).toBe(true);
      expect(isAtMost(11, 10)).toBe(false);
      expect(isInteger(2.5)).toBe(false);
    });

    it('REQ-01.15 ruleHolds only accepts the value type of each rule', () => {
      expect(ruleHolds({ kind: 'min', value: 1 }, '5')).toBe(false);
      expect(ruleHolds({ kind: 'maxLength', value: 3 }, 12)).toBe(false);
    });
  });

  it.each([
    { type: 'text', validation: pattern('[A-Z]{3}\\d{3}'), value: 'ABC123', valid: true },
    { type: 'text', validation: pattern('[A-Z]{3}\\d{3}'), value: 'ABC12', valid: false },
    { type: 'text', validation: { kind: 'maxLength', value: 5 }, value: 'ABCDEF', valid: false },
    { type: 'number', validation: { kind: 'min', value: 1 }, value: 0, valid: false },
    { type: 'number', validation: { kind: 'integer' }, value: 2.5, valid: false },
  ] as const)(
    'AC-01.15 $type with $validation.kind and value $value → valid=$valid',
    ({ type, validation, value, valid }) => {
      const config = field({ type, validations: [validation] });
      expect(isFieldValueValid(config, value, TODAY_CTX)).toBe(valid);
    },
  );

  it('AC-01.14 a required text left empty or with only spaces is invalid', () => {
    const required = field({ required: true });
    expect(fieldViolations(required, '', TODAY_CTX)).toEqual(['required']);
    expect(fieldViolations(required, '   ', TODAY_CTX)).toEqual(['required']);
    expect(isFieldValueValid(required, ' x ', TODAY_CTX)).toBe(true);
  });

  it('Q-01.16 text validations run on the trimmed value', () => {
    const plate = field({
      validations: [pattern('[A-Z]{3}\\d{3}'), { kind: 'maxLength', value: 6 }],
    });
    expect(isFieldValueValid(plate, '  ABC123  ', TODAY_CTX)).toBe(true);
  });

  it('REQ-01.15 an empty optional field is valid and its other rules do not run', () => {
    expect(
      isFieldValueValid(field({ validations: [{ kind: 'minLength', value: 3 }] }), '', TODAY_CTX),
    ).toBe(true);
    expect(
      isFieldValueValid(
        field({ type: 'number', validations: [{ kind: 'min', value: 1 }] }),
        null,
        TODAY_CTX,
      ),
    ).toBe(true);
    expect(isFieldValueValid(field({ type: 'date' }), '', TODAY_CTX)).toBe(true);
  });

  it('REQ-01.16 several failing rules still make one invalid field', () => {
    const config = field({ validations: [{ kind: 'minLength', value: 8 }, pattern('[0-9]+')] });
    expect(fieldViolations(config, 'abc', TODAY_CTX)).toEqual(['minLength', 'pattern']);
  });

  it('AC-01.33 a required checkbox must be checked; an optional one may stay unchecked', () => {
    expect(fieldViolations(field({ type: 'checkbox', required: true }), false, TODAY_CTX)).toEqual([
      'required',
    ]);
    expect(isFieldValueValid(field({ type: 'checkbox', required: true }), true, TODAY_CTX)).toBe(
      true,
    );
    expect(isFieldValueValid(field({ type: 'checkbox' }), false, TODAY_CTX)).toBe(true);
  });

  it('REQ-01.11 a select value must be one of the current options', () => {
    const make = field({
      type: 'select',
      required: true,
      options: [
        { value: 'mazda', label: 'Mazda' },
        { value: 'renault', label: 'Renault' },
      ],
    });
    expect(isFieldValueValid(make, 'mazda', TODAY_CTX)).toBe(true);
    expect(fieldViolations(make, 'kia', TODAY_CTX)).toEqual(['option']);
    expect(fieldViolations(make, '', TODAY_CTX)).toEqual(['required']);
  });

  it.each([
    { year: 2005, valid: false },
    { year: 2006, valid: true },
    { year: 2026, valid: true },
    { year: 2027, valid: true },
    { year: 2028, valid: false },
  ])(
    'AC-01.17 the field with role vehicleYear and year $year → valid=$valid',
    ({ year, valid }) => {
      const vehicleYear = field({ type: 'number', role: 'vehicleYear', required: true });
      expect(isFieldValueValid(vehicleYear, year, TODAY_CTX)).toBe(valid);
    },
  );

  it.each([
    { today: '2026-11-22', birthDate: '2008-11-22', valid: true },
    { today: '2026-11-22', birthDate: '2008-11-23', valid: false },
    { today: '2026-11-22', birthDate: '2026-11-23', valid: false },
    { today: '2026-02-28', birthDate: '2008-02-29', valid: false },
    { today: '2026-03-01', birthDate: '2008-02-29', valid: true },
  ])(
    'AC-01.18 the field with role birthDate, today $today, $birthDate → valid=$valid',
    ({ today, birthDate, valid }) => {
      const birth = field({ type: 'date', role: 'birthDate', required: true });
      expect(isFieldValueValid(birth, birthDate, { today, minimumAge: 18 })).toBe(valid);
    },
  );

  it('REQ-01.20 the legal age uses the minimum age of the country', () => {
    const birth = field({ type: 'date', role: 'birthDate', required: true });
    expect(isFieldValueValid(birth, '2006-01-01', { today: '2026-11-22', minimumAge: 21 })).toBe(
      false,
    );
  });

  it('REQ-01.22 the role rules cannot be switched off: an optional birthDate or vehicleYear is still required', () => {
    expect(fieldViolations(field({ type: 'date', role: 'birthDate' }), '', TODAY_CTX)).toEqual([
      'required',
    ]);
    expect(
      fieldViolations(field({ type: 'number', role: 'vehicleYear' }), null, TODAY_CTX),
    ).toEqual(['required']);
    // documentNumber has no rule of its own (US-01 §5.2): optional stays optional.
    expect(isFieldValueValid(field({ role: 'documentNumber' }), '', TODAY_CTX)).toBe(true);
  });

  it('REQ-01.21 a date that is not a calendar date YYYY-MM-DD is invalid', () => {
    expect(fieldViolations(field({ type: 'date' }), '2026-02-30', TODAY_CTX)).toEqual([
      'calendarDate',
    ]);
  });

  it('REQ-01.26 a value of an unexpected type is invalid', () => {
    expect(fieldViolations(field({ type: 'text' }), 12, TODAY_CTX)).toEqual(['type']);
    expect(fieldViolations(field({ type: 'checkbox' }), 'true', TODAY_CTX)).toEqual(['type']);
    expect(fieldViolations(field({ type: 'number' }), '2020', TODAY_CTX)).toEqual(['type']);
  });
});
