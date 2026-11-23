import { Plan } from '../../domain/plans/plan';

/**
 * Display order of the plans (REQ-02.4, Q-02.8): `order` ascending with empty `order` last, then
 * the name compared with the locale of the country, then the `documentId`. Pure: returns a new
 * array.
 */
export function sortPlans(plans: readonly Plan[], intlLocale: string): Plan[] {
  const collator = new Intl.Collator(intlLocale);
  return [...plans].sort((a, b) => {
    if (a.order !== b.order) {
      if (a.order === null) {
        return 1;
      }
      if (b.order === null) {
        return -1;
      }
      return a.order - b.order;
    }
    return collator.compare(a.name, b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
}

/**
 * The only plan highlighted as recommended (REQ-02.5, Q-02.1): the first one marked in display
 * order. The rest are shown as regular plans; with none marked, nothing is highlighted.
 */
export function recommendedPlanId(sortedPlans: readonly Plan[]): string | null {
  return sortedPlans.find((plan) => plan.recommended)?.id ?? null;
}
