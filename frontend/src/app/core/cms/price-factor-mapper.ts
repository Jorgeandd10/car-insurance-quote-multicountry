import {
  PRICE_OPERANDS,
  PRICE_ROLES,
  PriceFactorRule,
  isValidPriceFactorRule,
} from '../../domain/pricing/compute-final-price';
import { contractError } from './cms-error';
import {
  CountryPriceFactorsDto,
  PriceFactorDto,
  arrayOrEmpty,
  asDto,
  integerOrNull,
  isOneOf,
  numeric,
} from './strapi-dto';

export interface PriceFactorsMapping {
  /** Valid bands in the configured order (ADR-0005). */
  readonly rules: readonly PriceFactorRule[];
  readonly warnings: readonly string[];
}

/**
 * C6 → price factor bands (api-contracts C6, ADR-0005).
 *
 * - 0 countries (unpublished between steps) or more than one → contract error ("error de carga").
 * - `priceFactors` empty or `null` → `[]`, so the final price is the base price (REQ-02.9).
 * - Bands outside the catalog, with an incompatible role-operand pair (G3-10), non-integer
 *   limits, `min > max` or a multiplier that is not finite and > 0 are dropped (REQ-02.12).
 *   `multiplier` may arrive as a number or a numeric string (Strapi `decimal`).
 */
export function mapPriceFactors(
  data: readonly unknown[],
  requestedCode: string,
): PriceFactorsMapping {
  if (data.length !== 1) {
    throw contractError(`expected one country with code ${requestedCode}, got ${data.length}`);
  }
  const dto = asDto<keyof CountryPriceFactorsDto & string>(data[0]);
  if (!dto || dto.code !== requestedCode) {
    throw contractError(`unexpected country in price factors for ${requestedCode}`);
  }
  const warnings: string[] = [];
  const items = arrayOrEmpty(dto.priceFactors);
  if (items === null) {
    warnings.push(`[cms] priceFactors ignored: not a list (code=${requestedCode})`);
    return { rules: [], warnings };
  }
  const rules: PriceFactorRule[] = [];
  items.forEach((item, index) => {
    const rule = mapRule(item);
    if (rule && isValidPriceFactorRule(rule)) {
      rules.push(rule);
    } else {
      warnings.push(
        `[cms] price factor skipped: invalid band (code=${requestedCode}, index=${index})`,
      );
    }
  });
  return { rules, warnings };
}

function mapRule(item: unknown): PriceFactorRule | null {
  const dto = asDto<keyof PriceFactorDto & string>(item);
  if (!dto || !isOneOf(dto.role, PRICE_ROLES) || !isOneOf(dto.operand, PRICE_OPERANDS)) {
    return null;
  }
  const min = integerOrNull(dto.min);
  const max = integerOrNull(dto.max);
  const multiplier = numeric(dto.multiplier);
  if (min === undefined || max === undefined || multiplier === null) {
    return null;
  }
  return { role: dto.role, operand: dto.operand, min, max, multiplier };
}
