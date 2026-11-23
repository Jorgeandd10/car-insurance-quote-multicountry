import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CountryConfig, PlansStepTextKey } from '../../core/country/country-config';
import { CountryContext } from '../../core/country/country-context';
import { WizardStorage } from '../../core/storage/wizard-storage';
import { loadStateOf } from '../../core/ui-state/view-state';
import { priceInputsFrom } from '../../domain/pricing/price-inputs';
import { StatusMessage } from '../../shared/status-message';
import { StepHeading } from '../../shared/step-heading';
import { Step1Result } from '../form-step/validation/evaluate-step1';
import { step1Backstop } from '../form-step/validation/step1-backstop';
import { Step1ResultReader } from '../form-step/validation/step1-result-reader';
import { restorePlanSelection } from './plan-selection';
import { PlanView, buildPlanViews } from './plan-views';
import { PlansData, PlansStepData } from './plans-data';

type PlansTexts = Readonly<Record<PlansStepTextKey, string>>;

/** What step 2 shows (ADR-0004 `viewState`). */
export type PlansStepView =
  | { readonly kind: 'configError'; readonly message: string }
  | { readonly kind: 'loading'; readonly texts: PlansTexts }
  | { readonly kind: 'error'; readonly texts: PlansTexts }
  | { readonly kind: 'empty'; readonly texts: PlansTexts }
  | { readonly kind: 'ready'; readonly texts: PlansTexts; readonly plans: readonly PlanView[] };

/**
 * Step 2, `/:country/plans` (US-02). The route guard already checked that step 1 is complete
 * (REQ-02.19). Plans and factors are requested on every entry (REQ-02.23) with `resource()`, which
 * cancels the request when leaving (ADR-0004).
 */
@Component({
  selector: 'app-plans-step-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusMessage, StepHeading],
  templateUrl: './plans-step-page.html',
  styleUrl: './plans-step-page.css',
})
export class PlansStepPage {
  private readonly context = inject(CountryContext);
  private readonly reader = inject(Step1ResultReader);
  private readonly plansData = inject(PlansData);
  private readonly storage = inject(WizardStorage);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly selected = signal<string | null>(null);
  /** REQ-02.17: the stored plan is no longer available. */
  protected readonly planUnavailable = signal(false);
  /** REQ-02.15: continue was activated without a selection. */
  protected readonly choosePlanShown = signal(false);

  /** Texts of the step; `null` if one is missing (configuration error, G2-2). */
  private readonly texts = computed<PlansTexts | null>(() => {
    const group = this.context.config()?.texts.plansStep;
    return group?.status === 'ok' ? group.texts : null;
  });

  /** Step 1 with the current configuration; recomputed when it arrives, also after a retry. */
  private readonly step1 = computed<Step1Result | null>(() => {
    const config = this.context.config();
    return config ? this.reader.read(config) : null;
  });

  /**
   * No request is made while a text of the step is missing (AC-02.33) nor while step 1 is not
   * complete (REQ-02.19, review 002 F-02.1): the backstop is then taking the user to step 1.
   */
  protected readonly data = resource({
    params: () => {
      const config = this.context.config();
      return config && this.texts() && this.step1()?.isComplete ? config : undefined;
    },
    loader: async ({ params, abortSignal }) => {
      const data = await this.plansData.load(params.country, abortSignal);
      this.restoreSelection(params, data);
      return data;
    },
  });

  protected readonly view = computed<PlansStepView | null>(() => {
    const config = this.context.config();
    if (!config) {
      return null;
    }
    const texts = this.texts();
    if (!texts) {
      return { kind: 'configError', message: config.genericErrorMessage };
    }
    const step1 = this.step1();
    if (!step1?.isComplete) {
      return { kind: 'loading', texts }; // Going back to step 1 (F-02.1).
    }
    const load = loadStateOf(this.data.status());
    if (load !== 'ready' || !this.data.hasValue()) {
      return load === 'error' ? { kind: 'error', texts } : { kind: 'loading', texts };
    }
    const data = this.data.value();
    if (!data || data.plans.length === 0) {
      return { kind: 'empty', texts };
    }
    const plans = buildPlanViews(
      data,
      priceInputsFrom(step1),
      this.reader.ruleContext(config).today,
      config.country,
    );
    return { kind: 'ready', texts, plans };
  });

  constructor() {
    step1Backstop(this.step1, () => this.context.code());
  }

  protected select(planId: string): void {
    const code = this.context.code();
    this.selected.set(planId);
    this.storage.writePlan(code, planId);
    this.choosePlanShown.set(false);
    this.planUnavailable.set(false);
  }

  /** REQ-02.15: continue is always enabled; without a valid selection it explains and focuses. */
  protected onContinue(event: Event): void {
    event.preventDefault();
    const view = this.view();
    const selected = this.selected();
    if (view?.kind === 'ready' && view.plans.some((p) => p.plan.id === selected)) {
      void this.router.navigate(['/', this.context.code(), 'summary']);
      return;
    }
    this.choosePlanShown.set(true);
    this.host.nativeElement.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
  }

  /** REQ-02.30: back to step 1; its data and this selection are kept. */
  protected back(): void {
    void this.router.navigate(['/', this.context.code(), 'form']);
  }

  protected retry(): void {
    this.data.reload();
  }

  /** REQ-02.16, REQ-02.17: preselect the stored plan or discard it with a notice. */
  private restoreSelection(config: CountryConfig, data: PlansStepData): void {
    const code = config.country.code;
    const stored = this.storage.readPlan(code)?.planDocumentId ?? null;
    const restored = restorePlanSelection(stored, data.plans);
    if (restored.discarded) {
      this.storage.remove(code, 'plan');
      console.warn('[plans] stored plan discarded: no longer available');
    }
    this.selected.set(restored.selectedId);
    this.planUnavailable.set(restored.discarded);
  }
}
