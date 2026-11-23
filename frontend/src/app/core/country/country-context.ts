import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { loadStateOf } from '../ui-state/view-state';
import { CountryConfig, isCountryCode } from './country-config';
import { CountryConfigResource, CountryConfigStore } from './country-config-store';

/** State of the active country as shown by the shell (ADR-0001). */
export type CountryState = 'loading' | 'error' | 'notAvailable' | 'ready';

/**
 * Read-only context of the active country (ADR-0001): the only source of the country for the
 * steps. Provided by `CountryShell` (route `/:country`), so it reads that route's parameter;
 * the step pages inject the shell's instance.
 */
@Injectable()
export class CountryContext {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CountryConfigStore);

  /** Country segment of the URL (already lower case thanks to `countryCaseGuard`). */
  readonly code: Signal<string> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('country') ?? '')),
    { requireSync: true },
  );

  /** `null` when the code cannot be a country: no request is made, "país no disponible". */
  private readonly resource = computed<CountryConfigResource | null>(() => {
    const code = this.code();
    return isCountryCode(code) ? this.store.get(code) : null;
  });

  readonly state = computed<CountryState>(() => {
    const ref = this.resource();
    if (!ref) {
      return 'notAvailable';
    }
    const load = loadStateOf(ref.status());
    if (load !== 'ready') {
      return load;
    }
    return ref.value()?.status === 'ready' ? 'ready' : 'notAvailable';
  });

  /** Configuration of the active country once loaded; `null` otherwise. */
  readonly config = computed<CountryConfig | null>(() => {
    const ref = this.resource();
    if (!ref || !ref.hasValue()) {
      return null;
    }
    const value = ref.value();
    return value?.status === 'ready' ? value.config : null;
  });

  /** "reintentar" (REQ-01.4). */
  reload(): void {
    const code = this.code();
    if (isCountryCode(code)) {
      this.store.reload(code);
    }
  }
}
