import { Plan } from '../../domain/plans/plan';
import { Country } from '../country/country-config';
import {
  PlanDto,
  PlanItemDto,
  arrayOrEmpty,
  asDto,
  integerOrNull,
  numeric,
  trimmedString,
} from './strapi-dto';

export interface PlansMapping {
  /** Valid plans in the order received. Sorting and the single "recommended" are US-02 (4c). */
  readonly plans: readonly Plan[];
  readonly warnings: readonly string[];
}

/**
 * C5 → plans of the country (api-contracts C5). Discards, with a warning, plans that are not
 * active (REQ-02.2), have another currency (REQ-02.7, G2-11) or are malformed (REQ-02.25).
 */
export function mapPlans(
  data: readonly unknown[],
  country: Pick<Country, 'currency'>,
): PlansMapping {
  const plans: Plan[] = [];
  const warnings: string[] = [];
  data.forEach((item, index) => {
    const dto = asDto<keyof PlanDto & string>(item);
    const id = typeof dto?.documentId === 'string' && dto.documentId !== '' ? dto.documentId : null;
    if (!dto || id === null) {
      warnings.push(`[cms] plan skipped: missing documentId (index=${index})`);
      return;
    }
    if (dto.active !== true) {
      warnings.push(`[cms] plan skipped: not active (id=${id})`);
      return;
    }
    const name = trimmedString(dto.name);
    if (name === null) {
      warnings.push(`[cms] plan skipped: empty name (id=${id})`);
      return;
    }
    const basePrice = numeric(dto.basePrice);
    if (basePrice === null || basePrice <= 0) {
      warnings.push(`[cms] plan skipped: invalid basePrice (id=${id})`);
      return;
    }
    if (dto.currency !== country.currency) {
      warnings.push(`[cms] plan skipped: currency differs from the country currency (id=${id})`);
      return;
    }
    const order = integerOrNull(dto.order);
    if (order === undefined) {
      warnings.push(`[cms] plan order ignored: not an integer (id=${id})`);
    }
    plans.push({
      id,
      name,
      shortDescription: trimmedString(dto.shortDescription),
      basePrice,
      coverages: mapItems(dto.coverages, id, 'coverages', warnings),
      benefits: mapItems(dto.benefits, id, 'benefits', warnings),
      order: order ?? null,
      recommended: dto.recommended === true,
    });
  });
  return { plans, warnings };
}

/** `null` → `[]`; blank labels are omitted (REQ-02.3, REQ-02.25). */
function mapItems(raw: unknown, id: string, name: string, warnings: string[]): string[] {
  const items = arrayOrEmpty(raw);
  if (items === null) {
    warnings.push(`[cms] plan ${name} ignored: not a list (id=${id})`);
    return [];
  }
  const labels: string[] = [];
  for (const item of items) {
    const label = trimmedString(asDto<keyof PlanItemDto & string>(item)?.label);
    if (label !== null) {
      labels.push(label);
    }
  }
  return labels;
}
