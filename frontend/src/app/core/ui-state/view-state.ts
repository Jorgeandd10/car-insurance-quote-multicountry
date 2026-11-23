import { ResourceStatus } from '@angular/core';

/**
 * Single view state that every page derives from its data (ADR-0004).
 *
 * - `loading` → fixed "cargando" (`role="status"`).
 * - `error` → fixed "error de carga" + "reintentar" (`role="alert"`).
 * - `configError` → generic error message of the country (a Strapi text is missing, G2-2).
 * - `empty` → empty-state message of the screen.
 * - `unavailable` → a required role is missing in the form configuration (G2-5).
 * - `ready` → content.
 */
export type ViewState = 'loading' | 'error' | 'configError' | 'empty' | 'unavailable' | 'ready';

/** Loading phase of a request, before interpreting its value. */
export type LoadState = 'loading' | 'error' | 'ready';

/** Maps the status of an Angular `resource()` to the loading phase shown by the page. */
export function loadStateOf(status: ResourceStatus): LoadState {
  switch (status) {
    case 'error':
      return 'error';
    case 'resolved':
    case 'local':
      return 'ready';
    case 'idle':
    case 'loading':
    case 'reloading':
      return 'loading';
  }
}
