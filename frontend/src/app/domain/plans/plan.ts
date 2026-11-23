/** Domain model of a plan (api-contracts §3 and C5). */
export interface Plan {
  /** Strapi `documentId`: the only plan data that is persisted (G2-9). */
  readonly id: string;
  readonly name: string;
  readonly shortDescription: string | null;
  /** Whole currency units, > 0, already checked against the country currency (REQ-02.7). */
  readonly basePrice: number;
  readonly coverages: readonly string[];
  readonly benefits: readonly string[];
  readonly order: number | null;
  /** Raw flag from Strapi; only the first one in display order is highlighted (REQ-02.5, US-02). */
  readonly recommended: boolean;
}
