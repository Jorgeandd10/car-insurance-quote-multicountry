import { PriceInputs } from './compute-final-price';

/** The part of the step 1 result that the price rule needs (structural, see `Step1Result`). */
export interface RoleValueSource {
  readonly fields: readonly { readonly role: string | null; readonly value: unknown }[];
}

/**
 * Step 1 values by role for the price rule (REQ-02.10, ADR-0005): never by key nor label.
 * With several fields of the same role, the first in display order is used. A missing or
 * unusable value is `null`, so its factor is 1.
 */
export function priceInputsFrom(source: RoleValueSource): PriceInputs {
  const first = (role: string) => source.fields.find((field) => field.role === role)?.value;
  const year = first('vehicleYear');
  const birth = first('birthDate');
  return {
    vehicleYear: typeof year === 'number' && Number.isFinite(year) ? year : null,
    birthDate: typeof birth === 'string' && birth !== '' ? birth : null,
  };
}
