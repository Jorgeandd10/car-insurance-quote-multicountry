import {
  Injectable,
  Injector,
  ResourceRef,
  effect,
  inject,
  resource,
  untracked,
} from '@angular/core';
import { CmsClient } from '../cms/cms-client';
import { logCmsWarnings } from '../cms/cms-error';
import { countryConfigQuery, formFieldsQuery } from '../cms/cms-queries';
import {
  assembleCountryConfig,
  mapCountryConfig,
  missingTextWarnings,
} from '../cms/country-mapper';
import { mapFormFields } from '../cms/form-field-mapper';
import { loadStateOf } from '../ui-state/view-state';
import { CountryConfigResult } from './country-config';

export type CountryConfigResource = ResourceRef<CountryConfigResult | undefined>;

/**
 * Configuration of each country (C3 + C4 in parallel), loaded once per app load and country and
 * only requested again with "reintentar" (Q-01.20, ADR-0004). Kept in memory only (REQ-01.6).
 *
 * A request failure, or a C3 response that cannot be interpreted, puts the resource in `error`.
 */
@Injectable({ providedIn: 'root' })
export class CountryConfigStore {
  private readonly cms = inject(CmsClient);
  private readonly injector = inject(Injector);
  private readonly resources = new Map<string, CountryConfigResource>();

  /**
   * Resource of `countryCode` (a validated lower-case code), created on first use. Creation is
   * idempotent and untracked, so it is safe to call from a `computed`.
   */
  get(countryCode: string): CountryConfigResource {
    const existing = this.resources.get(countryCode);
    if (existing) {
      return existing;
    }
    const created = untracked(() =>
      resource({
        loader: ({ abortSignal }) => this.load(countryCode, abortSignal),
        injector: this.injector,
      }),
    );
    this.resources.set(countryCode, created);
    return created;
  }

  /** Requests the configuration again (action "reintentar", REQ-01.4). */
  reload(countryCode: string): void {
    this.get(countryCode).reload();
  }

  /**
   * Resolves once the configuration of `countryCode` is no longer loading: the result, or `null`
   * if it failed. For the functional guards of steps 2 and 3 (ADR-0004, G3-9).
   */
  whenSettled(countryCode: string): Promise<CountryConfigResult | null> {
    const ref = this.get(countryCode);
    return new Promise((resolve) => {
      const watcher = effect(
        () => {
          const state = loadStateOf(ref.status());
          if (state === 'loading') {
            return;
          }
          const result = state === 'ready' && ref.hasValue() ? (ref.value() ?? null) : null;
          untracked(() => {
            watcher.destroy();
            resolve(result);
          });
        },
        { injector: this.injector, manualCleanup: true },
      );
    });
  }

  private async load(countryCode: string, signal: AbortSignal): Promise<CountryConfigResult> {
    const [countryData, fieldData] = await Promise.all([
      this.cms.findFirstPage('countries', countryConfigQuery(countryCode), signal),
      this.cms.findAll('form-fields', formFieldsQuery(countryCode), signal),
    ]);
    const country = mapCountryConfig(countryData, countryCode);
    if (country.status === 'notAvailable') {
      return country;
    }
    const fields = mapFormFields(fieldData);
    logCmsWarnings([...missingTextWarnings(country.texts), ...fields.warnings]);
    return { status: 'ready', config: assembleCountryConfig(country, fields) };
  }
}
