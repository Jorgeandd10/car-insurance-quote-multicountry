import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CmsClient } from '../../core/cms/cms-client';
import { logCmsWarnings } from '../../core/cms/cms-error';
import { countriesListQuery } from '../../core/cms/cms-queries';
import { mapCountrySummaries } from '../../core/cms/country-mapper';
import { CountrySummary } from '../../core/country/country-config';
import { FIXED_TEXTS } from '../../core/ui-state/fixed-texts';
import { loadStateOf } from '../../core/ui-state/view-state';
import { StatusMessage } from '../../shared/status-message';

/**
 * "país no disponible" (REQ-01.2, AC-01.6): unknown or unpublished code. Shows the fixed text and
 * the published countries (C1) as links; if C1 fails, "error de carga" + "reintentar" instead.
 */
@Component({
  selector: 'app-country-not-available',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StatusMessage],
  template: `
    <h1 id="country-not-available-heading">{{ texts.countryNotAvailable }}</h1>
    @switch (loadState()) {
      @case ('loading') {
        <app-status-message kind="loading" />
      }
      @case ('error') {
        <app-status-message kind="error" (retry)="countries.reload()" />
      }
      @case ('ready') {
        <nav aria-labelledby="country-not-available-heading">
          <ul class="country-links">
            @for (country of countries.value(); track country.code) {
              <li>
                <a [routerLink]="['/', country.code]">{{ country.name }}</a>
              </li>
            }
          </ul>
        </nav>
      }
    }
  `,
})
export class CountryNotAvailable {
  private readonly cms = inject(CmsClient);

  protected readonly texts = FIXED_TEXTS;

  protected readonly countries = resource({
    defaultValue: [] as readonly CountrySummary[],
    loader: async ({ abortSignal }) => {
      const list = mapCountrySummaries(
        await this.cms.findAll('countries', countriesListQuery(), abortSignal),
      );
      logCmsWarnings(list.warnings);
      return list.countries;
    },
  });

  protected readonly loadState = computed(() => loadStateOf(this.countries.status()));

  constructor() {
    inject(Title).setTitle(FIXED_TEXTS.countryNotAvailable);
  }
}
