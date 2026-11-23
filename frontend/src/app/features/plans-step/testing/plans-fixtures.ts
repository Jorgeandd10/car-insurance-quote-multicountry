import { strapiC5 } from '../../../core/cms/testing/strapi-fixtures';

type Dto = Record<string, unknown>;

/** A C5 plan item in Strapi 5 shape (test-only). */
export function planDto(attrs: Dto): Dto {
  return {
    id: 1,
    shortDescription: null,
    order: null,
    recommended: false,
    active: true,
    coverages: [],
    benefits: [],
    ...attrs,
  };
}

/**
 * Plans of Colombia: the documented C5 plan plus two more. "Plan Total" is also marked as
 * recommended, so only "Plan Plus" (first in order) must be highlighted (AC-02.7).
 */
export function coPlansDto(): Dto[] {
  return [
    ...(strapiC5().data as unknown as Dto[]),
    planDto({
      id: 13,
      documentId: 'plan-co-plus',
      name: 'Plan Plus',
      shortDescription: 'Daños propios y conductor elegido.',
      basePrice: 1_200_000,
      currency: 'COP',
      order: 2,
      recommended: true,
      coverages: [
        { id: 202, label: 'Responsabilidad civil' },
        { id: 203, label: 'Daños propios' },
      ],
      benefits: [],
    }),
    planDto({
      id: 14,
      documentId: 'plan-co-total',
      name: 'Plan Total',
      basePrice: 1_600_000,
      currency: 'COP',
      order: 3,
      recommended: true,
      coverages: [{ id: 204, label: 'Todo riesgo' }],
      benefits: [{ id: 302, label: 'Vehículo de reemplazo' }],
    }),
  ];
}

export function clPlansDto(): Dto[] {
  return [
    planDto({
      id: 21,
      documentId: 'plan-cl-base',
      name: 'Plan Base',
      basePrice: 19_990,
      currency: 'CLP',
      order: 1,
      recommended: true,
      coverages: [{ id: 211, label: 'Responsabilidad civil' }],
    }),
    planDto({
      id: 22,
      documentId: 'plan-cl-full',
      name: 'Plan Full',
      basePrice: 25_990,
      currency: 'CLP',
      order: 2,
      coverages: [{ id: 212, label: 'Daños propios' }],
    }),
  ];
}

const band = (
  id: number,
  role: string,
  min: number | null,
  max: number | null,
  multiplier: number,
): Dto => ({
  id,
  role,
  operand: role === 'vehicleYear' ? 'vehicleAge' : 'ageInYears',
  min,
  max,
  multiplier,
});

/** Seed factors of Colombia (pricing-rule.md §3). */
export function coFactorsDto(): Dto[] {
  return [
    band(401, 'vehicleYear', 0, 5, 1),
    band(402, 'vehicleYear', 6, 10, 1.1),
    band(403, 'vehicleYear', 11, 20, 1.25),
    band(404, 'birthDate', 18, 25, 1.2),
    band(405, 'birthDate', 26, 65, 1),
    band(406, 'birthDate', 66, null, 1.15),
  ];
}

/** Seed factors of Chile (pricing-rule.md §3). */
export function clFactorsDto(): Dto[] {
  return [
    band(411, 'vehicleYear', 0, 5, 1),
    band(412, 'vehicleYear', 6, 12, 1.08),
    band(413, 'vehicleYear', 13, 20, 1.2),
    band(414, 'birthDate', 18, 24, 1.25),
    band(415, 'birthDate', 25, 70, 1),
    band(416, 'birthDate', 71, null, 1.1),
  ];
}

/** C6 data array: the country with its `priceFactors`. */
export function factorsCountryDto(code: string, priceFactors: unknown): Dto[] {
  return [{ id: 2, documentId: `country-${code}`, code, priceFactors }];
}
