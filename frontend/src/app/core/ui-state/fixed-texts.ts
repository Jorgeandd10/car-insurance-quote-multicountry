/**
 * The only user-visible copy allowed in code (G2-2, CLAUDE.md §11).
 *
 * They are shown when there is no configuration yet or Strapi does not answer. Every other
 * text comes from Strapi; a missing Strapi text is a configuration error, never a default here.
 */
export const FIXED_TEXTS = {
  loading: 'cargando',
  loadError: 'error de carga',
  retry: 'reintentar',
  countryNotAvailable: 'país no disponible',
} as const;

export type FixedTextKey = keyof typeof FIXED_TEXTS;
