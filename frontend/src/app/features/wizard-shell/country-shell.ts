import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { CountryContext } from '../../core/country/country-context';
import { StatusMessage } from '../../shared/status-message';
import { CountryNotAvailable } from '../country-selection/country-not-available';
import { StepIndicator } from './step-indicator';
import { WizardScreen, isWizardScreen, screenHeading, stepOf } from './wizard-screens';

/**
 * Component of `/:country` (ADR-0001). Resolves the country and shows "cargando", "error de carga"
 * + "reintentar", "país no disponible" with the published countries, or the wizard: the link back
 * to the country selection on every screen (REQ-01.36), the step indicator (REQ-01.31) and the
 * step routed below. Provides the `CountryContext` of its steps.
 */
@Component({
  selector: 'app-country-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CountryContext],
  imports: [RouterOutlet, RouterLink, StatusMessage, StepIndicator, CountryNotAvailable],
  template: `
    <div class="shell">
      @switch (context.state()) {
        @case ('loading') {
          <app-status-message kind="loading" />
        }
        @case ('error') {
          <app-status-message kind="error" (retry)="context.reload()" />
        }
        @case ('notAvailable') {
          <app-country-not-available />
        }
        @case ('ready') {
          @let wizard = wizardTexts();
          @if (wizard) {
            <div class="change-country hero-bleed">
              <a class="change-country-link" routerLink="/">{{ wizard.changeCountryLabel }}</a>
            </div>
            @if (currentStep(); as step) {
              <app-step-indicator
                [label]="wizard.stepIndicatorLabel"
                [steps]="[wizard.step1Label, wizard.step2Label, wizard.step3Label]"
                [current]="step"
              />
            }
            <router-outlet (activate)="onActivate()" />
          } @else {
            <app-status-message kind="message" [message]="genericErrorMessage()" />
          }
        }
      }
    </div>
  `,
  styles: `
    /* Central container; no top padding so the hero band touches the brand band (D12). */
    .shell {
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 0 var(--gutter);
    }
    /*
     * "Change country" link (REQ-01.36, D14) on the hero band, above the step indicator. Its only
     * text is the Strapi label: the chevron is an empty pseudo-element drawn with borders, so it
     * adds nothing to the accessible name. 44 px high target; #0033A0 on #DFEAFF is 8.76:1.
     */
    .change-country {
      padding-top: 0.75rem;
    }
    .change-country-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 44px;
      padding: 0 0.5rem 0 0.25rem;
      margin-inline-start: -0.25rem;
      border-radius: var(--radius-md);
      color: var(--color-primary-dark);
      font-weight: 700;
      text-decoration: none;
    }
    .change-country-link::before {
      content: '';
      flex: none;
      width: 0.55rem;
      height: 0.55rem;
      border: solid currentColor;
      border-width: 0 0 2.5px 2.5px;
      transform: translateX(2px) rotate(45deg);
      transition: transform var(--duration-fast) ease;
    }
    .change-country-link:hover {
      color: var(--color-on-accent);
      text-decoration: underline;
    }
    .change-country-link:hover::before {
      transform: translateX(-1px) rotate(45deg);
    }
  `,
})
export class CountryShell {
  protected readonly context = inject(CountryContext);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);

  private readonly currentScreen = signal<WizardScreen | null>(null);

  protected readonly currentStep = computed(() => {
    const screen = this.currentScreen();
    return screen === null ? null : stepOf(screen);
  });

  /** Wizard texts, or `null` if one is missing (configuration error, G2-2). */
  protected readonly wizardTexts = computed(() => {
    const wizard = this.context.config()?.texts.wizard;
    return wizard?.status === 'ok' ? wizard.texts : null;
  });

  protected readonly genericErrorMessage = computed(
    () => this.context.config()?.genericErrorMessage ?? '',
  );

  constructor() {
    // document.title follows the heading of the current screen (ADR-0004), always a Strapi text.
    effect(() => {
      const config = this.context.config();
      const screen = this.currentScreen();
      if (!config) {
        return;
      }
      if (config.texts.wizard.status !== 'ok') {
        this.title.setTitle(config.genericErrorMessage);
      } else if (screen) {
        this.title.setTitle(screenHeading(config, screen).text);
      }
    });
  }

  protected onActivate(): void {
    const screen: unknown = this.route.firstChild?.snapshot.data['screen'];
    this.currentScreen.set(isWizardScreen(screen) ? screen : null);
  }
}
