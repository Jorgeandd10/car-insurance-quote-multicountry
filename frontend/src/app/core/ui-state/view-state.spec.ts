import { ResourceStatus } from '@angular/core';
import { FIXED_TEXTS } from './fixed-texts';
import { loadStateOf } from './view-state';

describe('ui state', () => {
  it.each<[ResourceStatus, string]>([
    ['idle', 'loading'],
    ['loading', 'loading'],
    ['reloading', 'loading'],
    ['error', 'error'],
    ['resolved', 'ready'],
    ['local', 'ready'],
  ])('REQ-01.3 REQ-01.4 resource status %s → %s', (status, expected) => {
    expect(loadStateOf(status)).toBe(expected);
  });

  it('REQ-01.13 G2-2 there are exactly the four fixed texts, in Spanish', () => {
    expect(FIXED_TEXTS).toEqual({
      loading: 'cargando',
      loadError: 'error de carga',
      retry: 'reintentar',
      countryNotAvailable: 'país no disponible',
    });
  });
});
