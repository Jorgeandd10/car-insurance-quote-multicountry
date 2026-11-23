import { Plan } from '../../domain/plans/plan';

export interface PlanSelectionRestore {
  /** Plan selected when the step opens. */
  readonly selectedId: string | null;
  /** The stored plan is no longer in the current list: discard it and warn (REQ-02.17, G2-11). */
  readonly discarded: boolean;
}

/**
 * Stored selection (`ciq.v1.{cc}.plan`) against the current list of plans (REQ-02.16,
 * REQ-02.17). Only the `documentId` is stored (G2-9), so a plan that is inactive, unpublished,
 * deleted, of another currency or malformed is simply not in `plans`.
 */
export function restorePlanSelection(
  storedId: string | null,
  plans: readonly Plan[],
): PlanSelectionRestore {
  if (storedId === null) {
    return { selectedId: null, discarded: false };
  }
  return plans.some((plan) => plan.id === storedId)
    ? { selectedId: storedId, discarded: false }
    : { selectedId: null, discarded: true };
}
