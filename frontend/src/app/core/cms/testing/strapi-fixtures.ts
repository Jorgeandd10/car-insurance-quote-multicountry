/**
 * Strapi 5 responses copied from the examples of `docs/architecture/api-contracts.md` (C1–C7).
 * Test-only. Builders return fresh copies so a test can modify them freely.
 */

const clone = <T>(value: T): T => structuredClone(value);

/** C1 — `GET /api/countries` (published countries). */
const C1 = {
  data: [
    { id: 4, documentId: 'q2w8e4r6t1y3u5i7o9p0a2s4', code: 'cl', name: 'Chile' },
    { id: 2, documentId: 'z1x3c5v7b9n2m4k6j8h0g2f4', code: 'co', name: 'Colombia' },
  ],
  meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: 2 } },
};

/** C2 — `GET /api/country-selection`. */
const C2 = {
  data: {
    id: 1,
    documentId: 'm3n5b7v9c1x3z5l7k9j1h3g5',
    heading: 'Cotiza el seguro de tu auto',
    intro: 'Elige tu país para empezar.',
    countryListLabel: 'Países disponibles',
  },
  meta: {},
};

/** C3 — `GET /api/countries?filters[code][$eq]=co&populate...`. */
const C3 = {
  data: [
    {
      id: 2,
      documentId: 'z1x3c5v7b9n2m4k6j8h0g2f4',
      code: 'co',
      name: 'Colombia',
      intlLocale: 'es-CO',
      currency: 'COP',
      minimumAge: 18,
      wizardTexts: {
        id: 7,
        stepIndicatorLabel: 'Progreso de la cotización',
        step1Label: 'Tus datos',
        step2Label: 'Planes',
        step3Label: 'Resumen y pago',
        policyholderSectionLabel: 'Datos del asegurado',
        vehicleSectionLabel: 'Datos del vehículo',
        changeCountryLabel: 'Cambiar de país',
        genericErrorMessage: 'No pudimos mostrar esta sección. Intenta más tarde.',
      },
      formStepTexts: {
        id: 7,
        title: 'Tus datos y los de tu vehículo',
        continueLabel: 'Continuar',
        emptyMessage: 'El formulario no está disponible por ahora.',
      },
      plansStepTexts: {
        id: 7,
        title: 'Elige tu plan',
        groupLegend: 'Planes disponibles',
        recommendedLabel: 'Recomendado',
        coveragesHeading: 'Coberturas',
        benefitsHeading: 'Beneficios',
        backLabel: 'Volver',
        continueLabel: 'Continuar',
        choosePlanMessage: 'Elige un plan para continuar.',
        emptyMessage: 'No hay planes disponibles.',
        planUnavailableMessage: 'El plan que elegiste ya no está disponible.',
      },
      summaryStepTexts: {
        id: 7,
        title: 'Resumen',
        editDataLabel: 'Editar datos',
        yesLabel: 'Sí',
        noLabel: 'No',
        emptyValueLabel: '—',
        planHeading: 'Plan elegido',
        changePlanLabel: 'Cambiar plan',
        finalPriceLabel: 'Precio final',
        termsHeading: 'Términos y condiciones',
        acceptTermsLabel: 'Acepto los términos y condiciones',
        acceptTermsHint: 'Acepta los términos para habilitar el pago.',
        termsUnavailableMessage: 'Los términos no están disponibles.',
        gatewayLegend: 'Pasarela simulada',
        approvedOptionLabel: 'Pago aprobado',
        rejectedOptionLabel: 'Pago rechazado',
        payLabel: 'Pagar',
        processingMessage: 'Procesando el pago…',
        rejectedMessage: 'El pago fue rechazado. Puedes intentarlo de nuevo.',
      },
      confirmationTexts: {
        id: 7,
        title: '¡Listo!',
        quoteNumberLabel: 'Número de cotización',
        planLabel: 'Plan',
        paidPriceLabel: 'Precio pagado',
        newQuoteLabel: 'Nueva cotización',
      },
    },
  ],
  meta: { pagination: { page: 1, pageSize: 2, pageCount: 1, total: 1 } },
};

/** C4 — `GET /api/form-fields?filters[country][code][$eq]=co...` (the two documented fields). */
const C4 = {
  data: [
    {
      id: 31,
      documentId: 'f9d8s7a6p5o4i3u2y1t0r9e8',
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
        { id: 101, value: 'cc', label: 'Cédula de ciudadanía' },
        { id: 102, value: 'ce', label: 'Cédula de extranjería' },
      ],
      validations: [],
    },
    {
      id: 32,
      documentId: 'g1h2j3k4l5z6x7c8v9b0n1m2',
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
      validations: [{ id: 55, kind: 'integer', value: null, pattern: null }],
    },
  ],
  meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: 9 } },
};

/** Extra fields (same v5 shape) that complete the required roles of C4. */
const C4_ROLE_FIELDS = [
  {
    id: 33,
    documentId: 'h2j3k4l5z6x7c8v9b0n1m2q3',
    key: 'co_documentNumber',
    label: 'Número de documento',
    type: 'text',
    required: true,
    helpText: null,
    errorMessage: 'Ingresa un número de documento válido.',
    order: 2,
    section: 'policyholder',
    role: 'documentNumber',
    options: [],
    validations: [{ id: 56, kind: 'pattern', value: null, pattern: '[0-9]{6,10}' }],
  },
  {
    id: 34,
    documentId: 'j3k4l5z6x7c8v9b0n1m2q3w4',
    key: 'co_birthDate',
    label: 'Fecha de nacimiento',
    type: 'date',
    required: true,
    helpText: null,
    errorMessage: 'Debes ser mayor de edad.',
    order: 3,
    section: 'policyholder',
    role: 'birthDate',
    options: [],
    validations: [],
  },
];

/** C5 — `GET /api/plans?filters[country][code][$eq]=co&filters[active][$eq]=true...`. */
const C5 = {
  data: [
    {
      id: 12,
      documentId: 'p0o9i8u7y6t5r4e3w2q1a0s9',
      name: 'Plan Esencial',
      shortDescription: 'Responsabilidad civil y asistencia básica.',
      basePrice: 850000,
      currency: 'COP',
      order: 1,
      recommended: false,
      active: true,
      coverages: [{ id: 201, label: 'Responsabilidad civil' }],
      benefits: [{ id: 301, label: 'Grúa 24 h' }],
    },
  ],
  meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: 3 } },
};

/** C6 — `GET /api/countries?filters[code][$eq]=co&fields[0]=code&populate[0]=priceFactors`. */
const C6 = {
  data: [
    {
      id: 2,
      documentId: 'z1x3c5v7b9n2m4k6j8h0g2f4',
      code: 'co',
      priceFactors: [
        { id: 401, role: 'vehicleYear', operand: 'vehicleAge', min: 0, max: 5, multiplier: 1 },
        { id: 402, role: 'vehicleYear', operand: 'vehicleAge', min: 6, max: 10, multiplier: 1.1 },
        { id: 406, role: 'birthDate', operand: 'ageInYears', min: 66, max: null, multiplier: 1.15 },
      ],
    },
  ],
  meta: { pagination: { page: 1, pageSize: 2, pageCount: 1, total: 1 } },
};

/** C7 — `GET /api/countries?filters[code][$eq]=co&fields[1]=termsAndConditions`. */
const C7 = {
  data: [
    {
      id: 2,
      documentId: 'z1x3c5v7b9n2m4k6j8h0g2f4',
      code: 'co',
      termsAndConditions: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Este documento es ficticio y solo sirve para la prueba técnica.',
            },
          ],
        },
        {
          type: 'list',
          format: 'unordered',
          children: [
            {
              type: 'list-item',
              children: [{ type: 'text', text: 'La cotización es simulada.', bold: true }],
            },
            {
              type: 'list-item',
              children: [{ type: 'text', text: 'No se realiza ningún cobro.' }],
            },
          ],
        },
      ],
    },
  ],
  meta: { pagination: { page: 1, pageSize: 2, pageCount: 1, total: 1 } },
};

export const strapiC1 = () => clone(C1);
export const strapiC2 = () => clone(C2);
export const strapiC3 = () => clone(C3);
export const strapiC4 = () => clone(C4);
/** C4 plus the fields with roles `documentNumber` and `birthDate`: a `ready` form. */
export const strapiC4Complete = () => {
  const response = clone(C4);
  return { ...response, data: [...response.data, ...clone(C4_ROLE_FIELDS)] };
};
export const strapiC5 = () => clone(C5);
export const strapiC6 = () => clone(C6);
export const strapiC7 = () => clone(C7);
