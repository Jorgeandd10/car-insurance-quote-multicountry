import { assembleCountryConfig, mapCountryConfig } from '../../../core/cms/country-mapper';
import { mapFormFields } from '../../../core/cms/form-field-mapper';
import { strapiC3, strapiC4 } from '../../../core/cms/testing/strapi-fixtures';
import { CountryConfig } from '../../../core/country/country-config';
import { Step1Model, Step1RuleContext } from '../validation/step1-model';

/**
 * C4 response for Colombia with the 5 field types (test-only). It starts from the two fields
 * documented in api-contracts C4 and adds the rest of the seed of content-model §6, same v5 shape.
 */
export function coFormFieldsDto(): Record<string, unknown>[] {
  const documented = strapiC4().data as unknown as Record<string, unknown>[];
  const field = (id: number, attrs: Record<string, unknown>): Record<string, unknown> => ({
    id,
    documentId: `doc-${id}`,
    required: true,
    helpText: null,
    errorMessage: null,
    role: null,
    options: [],
    validations: [],
    ...attrs,
  });
  return [
    ...documented,
    field(33, {
      key: 'co_documentNumber',
      label: 'Número de documento',
      type: 'text',
      errorMessage: 'Ingresa un número de documento válido.',
      order: 2,
      section: 'policyholder',
      role: 'documentNumber',
      validations: [{ id: 56, kind: 'pattern', value: null, pattern: '[0-9]{6,10}' }],
    }),
    field(34, {
      key: 'co_birthDate',
      label: 'Fecha de nacimiento',
      type: 'date',
      errorMessage: 'Debes ser mayor de edad.',
      order: 3,
      section: 'policyholder',
      role: 'birthDate',
    }),
    field(35, {
      key: 'co_dataConsent',
      label: 'Acepto el tratamiento de mis datos',
      type: 'checkbox',
      errorMessage: 'Debes aceptar el tratamiento de datos.',
      order: 4,
      section: 'policyholder',
    }),
    field(36, {
      key: 'co_nickname',
      label: 'Cómo quieres que te llamemos',
      type: 'text',
      required: false,
      order: 9,
      section: 'policyholder',
      validations: [{ id: 57, kind: 'maxLength', value: 5, pattern: null }],
    }),
    field(37, {
      key: 'co_plate',
      label: 'Placa',
      type: 'text',
      helpText: 'Seis caracteres, por ejemplo ABC123.',
      errorMessage: 'Ingresa una placa válida.',
      order: 1,
      section: 'vehicle',
      validations: [{ id: 58, kind: 'pattern', value: null, pattern: '[A-Z]{3}[0-9]{3}' }],
    }),
    field(38, {
      key: 'co_make',
      label: 'Marca',
      type: 'select',
      errorMessage: 'Elige la marca.',
      order: 2,
      section: 'vehicle',
      options: [
        { id: 111, value: 'mazda', label: 'Mazda' },
        { id: 112, value: 'renault', label: 'Renault' },
      ],
    }),
  ];
}

/** Display order of `coFormFieldsDto()` (fixed sections, then `order`). */
export const CO_FIELD_ORDER = [
  'co_documentType',
  'co_documentNumber',
  'co_birthDate',
  'co_dataConsent',
  'co_nickname',
  'co_plate',
  'co_make',
  'co_vehicleYear',
] as const;

/** A valid step 1 for Colombia on 2026-11-22 (age 26, vehicle 8 years old). */
export function validCoValues(): Step1Model {
  return {
    co_documentType: 'cc',
    co_documentNumber: '1234567890',
    co_birthDate: '2000-05-10',
    co_dataConsent: true,
    co_nickname: '',
    co_plate: 'ABC123',
    co_make: 'mazda',
    co_vehicleYear: 2018,
  };
}

export const TODAY_CTX: Step1RuleContext = { today: '2026-11-22', minimumAge: 18 };

/** Country configuration of Colombia built with the real mappers. */
export function coCountryConfig(fields: unknown[] = coFormFieldsDto()): CountryConfig {
  const country = mapCountryConfig(strapiC3().data, 'co');
  if (country.status !== 'ready') {
    throw new Error('expected a ready country');
  }
  return assembleCountryConfig(country, mapFormFields(fields));
}
