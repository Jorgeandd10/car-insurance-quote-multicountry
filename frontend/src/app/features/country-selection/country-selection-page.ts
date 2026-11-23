import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CmsClient } from '../../core/cms/cms-client';
import { logCmsWarnings, contractError } from '../../core/cms/cms-error';
import { countriesListQuery, countrySelectionQuery } from '../../core/cms/cms-queries';
import { mapCountrySelectionTexts, mapCountrySummaries } from '../../core/cms/country-mapper';
import { CountrySelectionTexts, CountrySummary } from '../../core/country/country-config';
import { loadStateOf } from '../../core/ui-state/view-state';
import { StatusMessage } from '../../shared/status-message';

interface CountrySelectionContent {
  readonly texts: CountrySelectionTexts;
  readonly countries: readonly CountrySummary[];
}

/**
 * Page `/` (REQ-01.2, G2-3): published countries (C1) with the texts of the `country-selection`
 * single type (C2). It is not a wizard step (D7). No detection by IP or browser language.
 * If C2 is not published or lacks a required text → "error de carga" + "reintentar" (G3-10).
 */
@Component({
  selector: 'app-country-selection-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StatusMessage],
  template: `
    <div class="page">
      @switch (loadState()) {
        @case ('loading') {
          <app-status-message kind="loading" />
        }
        @case ('error') {
          <app-status-message kind="error" (retry)="content.reload()" />
        }
        @case ('ready') {
          @if (content.value(); as page) {
            <h1>{{ page.texts.heading }}</h1>
            @if (page.texts.intro) {
              <p>{{ page.texts.intro }}</p>
            }
            <nav [attr.aria-label]="page.texts.countryListLabel">
              <ul class="countries country-links">
                @for (country of page.countries; track country.code) {
                  <li>
                    <a [routerLink]="['/', country.code]">{{ country.name }}</a>
                  </li>
                }
              </ul>
            </nav>
          }
        }
      }
    </div>
  `,
  styles: `
    /* Central container; the h1 paints the hero band (D12). Country pills: .country-links. */
    .page {
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 0 var(--gutter);
    }
    h1 + p {
      max-width: 40rem;
      margin: 0;
      color: var(--color-text-muted);
      font-size: 1.125rem;
    }
  `,
})
export class CountrySelectionPage {
  private readonly cms = inject(CmsClient);
  private readonly title = inject(Title);

  protected readonly content = resource({
    loader: ({ abortSignal }) => this.load(abortSignal),
  });

  protected readonly loadState = computed(() => loadStateOf(this.content.status()));

  constructor() {
    effect(() => {
      if (this.content.hasValue()) {
        const page = this.content.value();
        if (page) {
          this.title.setTitle(page.texts.heading);
        }
      }
    });
  }

  private async load(signal: AbortSignal): Promise<CountrySelectionContent> {
    const [selection, countries] = await Promise.all([
      this.cms.findSingle('country-selection', countrySelectionQuery(), signal),
      this.cms.findAll('countries', countriesListQuery(), signal),
    ]);
    const texts = mapCountrySelectionTexts(selection);
    if (!texts) {
      throw contractError('country-selection is missing a required text');
    }
    const list = mapCountrySummaries(countries);
    logCmsWarnings(list.warnings);
    return { texts, countries: list.countries };
  }
}
