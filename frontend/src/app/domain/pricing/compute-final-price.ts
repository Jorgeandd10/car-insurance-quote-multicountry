import { ageInYears } from '../dates/age-in-years';
import { vehicleAge } from '../dates/vehicle-year';

/** Roles of step 1 used by the price rule (G2-1). */
export type PriceRole = 'vehicleYear' | 'birthDate';
/** Operands fixed in code (G2-8). A new operand is a case B of `country-content`. */
export type PriceOperand = 'vehicleAge' | 'ageInYears';

export const PRICE_ROLES: readonly PriceRole[] = ['vehicleYear', 'birthDate'];
export const PRICE_OPERANDS: readonly PriceOperand[] = ['vehicleAge', 'ageInYears'];

/** The only valid operand of each role (ADR-0005; incompatible pairs are discarded, G3-10). */
export const OPERAND_BY_ROLE: Readonly<Record<PriceRole, PriceOperand>> = {
  vehicleYear: 'vehicleAge',
  birthDate: 'ageInYears',
};

/** One band of a country, in the order configured in Strapi (`country.priceFactors`). */
export interface PriceFactorRule {
  readonly role: PriceRole;
  readonly operand: PriceOperand;
  /** Inclusive lower limit; `null` = no limit. */
  readonly min: number | null;
  /** Inclusive upper limit; `null` = no limit. */
  readonly max: number | null;
  readonly multiplier: number;
}

/** Step 1 values by role (from `Step1Result`, never by key or label: REQ-02.10). */
export interface PriceInputs {
  readonly vehicleYear: number | null;
  /** `YYYY-MM-DD`. */
  readonly birthDate: string | null;
}

export interface AppliedFactor {
  readonly role: PriceRole;
  readonly operand: PriceOperand;
  /** Operand value; `null` when the role has no interpretable value (factor 1). */
  readonly x: number | null;
  readonly multiplier: number;
}

export interface FinalPrice {
  readonly finalPrice: number;
  readonly appliedFactors: readonly AppliedFactor[];
}

/**
 * Validity of a band (REQ-02.12, G3-10): finite multiplier > 0, integer or empty limits,
 * `min ≤ max` and a compatible role-operand pair.
 */
export function isValidPriceFactorRule(rule: PriceFactorRule): boolean {
  const limitOk = (limit: number | null) => limit === null || Number.isInteger(limit);
  return (
    Number.isFinite(rule.multiplier) &&
    rule.multiplier > 0 &&
    limitOk(rule.min) &&
    limitOk(rule.max) &&
    (rule.min === null || rule.max === null || rule.min <= rule.max) &&
    OPERAND_BY_ROLE[rule.role] === rule.operand
  );
}

/**
 * Simulated price rule (REQ-02.8 to REQ-02.12, US-02 §6.3, `docs/architecture/pricing-rule.md`).
 *
 * `finalPrice = Math.round(basePrice × Π factor(role, operand))`, where each factor is the
 * multiplier of the first valid band (configured order) whose inclusive `[min, max]` contains the
 * operand value, or 1 if no band matches or the role has no value. Pure: no clock, no I/O.
 *
 * @param referenceDate local calendar date `YYYY-MM-DD` ("today", injected by the caller).
 */
export function computeFinalPrice(
  basePrice: number,
  inputs: PriceInputs,
  rules: readonly PriceFactorRule[],
  referenceDate: string,
): FinalPrice {
  const groups = new Map<string, PriceFactorRule[]>();
  for (const rule of rules) {
    if (!isValidPriceFactorRule(rule)) {
      continue;
    }
    const groupKey = `${rule.role}|${rule.operand}`;
    const group = groups.get(groupKey);
    if (group) {
      group.push(rule);
    } else {
      groups.set(groupKey, [rule]);
    }
  }

  let price = basePrice;
  const appliedFactors: AppliedFactor[] = [];
  for (const group of groups.values()) {
    const { role, operand } = group[0];
    const x = operandValue(operand, inputs, referenceDate);
    const band =
      x === null
        ? undefined
        : group.find((r) => (r.min === null || r.min <= x) && (r.max === null || x <= r.max));
    const multiplier = band?.multiplier ?? 1;
    appliedFactors.push({ role, operand, x, multiplier });
    price *= multiplier;
  }

  // REQ-02.11: rounded once, at the end, to whole currency units.
  return { finalPrice: Math.round(price), appliedFactors };
}

function operandValue(
  operand: PriceOperand,
  inputs: PriceInputs,
  referenceDate: string,
): number | null {
  switch (operand) {
    case 'vehicleAge':
      return inputs.vehicleYear === null ? null : vehicleAge(inputs.vehicleYear, referenceDate);
    case 'ageInYears':
      return inputs.birthDate === null ? null : ageInYears(inputs.birthDate, referenceDate);
  }
}
