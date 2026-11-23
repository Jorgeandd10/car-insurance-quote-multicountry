import { CountryConfig, TextGroup } from '../../core/country/country-config';

/** Screens under `/:country` (ADR-0001). The confirmation is not a step (D7). */
export type WizardScreen = 'form' | 'plans' | 'summary' | 'confirmation';
export type StepNumber = 1 | 2 | 3;

const STEP_BY_SCREEN: Readonly<Record<WizardScreen, StepNumber | null>> = {
  form: 1,
  plans: 2,
  summary: 3,
  confirmation: null,
};

export function isWizardScreen(value: unknown): value is WizardScreen {
  return typeof value === 'string' && value in STEP_BY_SCREEN;
}

/** Step number shown in the indicator, or `null` for the confirmation. */
export function stepOf(screen: WizardScreen): StepNumber | null {
  return STEP_BY_SCREEN[screen];
}

/** What the main heading of a screen shows: its Strapi title, or the generic error (G2-2). */
export type ScreenHeading =
  | { readonly kind: 'title'; readonly text: string }
  | { readonly kind: 'configError'; readonly text: string };

/**
 * Heading of a screen from the country texts. A missing title is a configuration error: the
 * screen shows the generic error message of the country, never a default text (REQ-01.13).
 */
export function screenHeading(config: CountryConfig, screen: WizardScreen): ScreenHeading {
  const title = screenTitle(config, screen);
  return title === null
    ? { kind: 'configError', text: config.genericErrorMessage }
    : { kind: 'title', text: title };
}

function screenTitle(config: CountryConfig, screen: WizardScreen): string | null {
  switch (screen) {
    case 'form':
      return titleOf(config.texts.formStep);
    case 'plans':
      return titleOf(config.texts.plansStep);
    case 'summary':
      return titleOf(config.texts.summaryStep.page);
    case 'confirmation':
      return titleOf(config.texts.confirmation);
  }
}

/** The title of a group is only usable when the whole group is complete (G2-2). */
function titleOf<K extends string>(group: TextGroup<K | 'title'>): string | null {
  return group.status === 'ok' ? group.texts.title : null;
}
