import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CLOCK } from '../../core/clock/clock';
import { CmsClient } from '../../core/cms/cms-client';
import { logCmsWarnings } from '../../core/cms/cms-error';
import { termsQuery } from '../../core/cms/cms-queries';
import { TermsMapping, mapTerms } from '../../core/cms/terms-mapper';
import { CountryConfig } from '../../core/country/country-config';
import { CountryContext } from '../../core/country/country-context';
import { WizardStorage } from '../../core/storage/wizard-storage';
import { loadStateOf } from '../../core/ui-state/view-state';
import { priceInputsFrom } from '../../domain/pricing/price-inputs';
import { createQuoteNumber } from '../../domain/quote-number/create-quote-number';
import { TermsDocument } from '../../domain/terms/terms-document';
import { StatusMessage } from '../../shared/status-message';
import { StepHeading } from '../../shared/step-heading';
import { Step1Result } from '../form-step/validation/evaluate-step1';
import { step1Backstop } from '../form-step/validation/step1-backstop';
import { Step1ResultReader } from '../form-step/validation/step1-result-reader';
import { PlanView, buildPlanViews } from '../plans-step/plan-views';
import { PlansData } from '../plans-step/plans-data';
import { MockPaymentGateway, QUOTE_RANDOM_FILL } from './payment/mock-payment-gateway';
import { PaymentOutcome, PaymentState, canPay } from './payment/payment-state';
import { buildSummarySections } from './summary-values';
import { TermsBlocks } from './terms/terms-blocks';

/** Texts of one summary section, or `null` when one is missing (G2-2, REQ-03.38). */
function textsOf<T>(group: { status: 'ok'; texts: T } | { status: 'configError' }): T | null {
  return group.status === 'ok' ? group.texts : null;
}

export type PlanSectionState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | { readonly kind: 'ready'; readonly plan: PlanView };

export type TermsSectionState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'ready'; readonly document: TermsDocument };

/**
 * Step 3, `/:country/summary` (US-03). The guards already checked step 1 and that a plan was
 * chosen (REQ-03.13). Each section loads and fails on its own (REQ-03.31, REQ-03.32): the plan
 * and its price with the same data and function as step 2 (REQ-03.5), and the terms (C7).
 * Nothing of this page is persisted except the confirmation after a successful payment.
 */
@Component({
  selector: 'app-summary-step-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusMessage, StepHeading, TermsBlocks],
  templateUrl: './summary-step-page.html',
  styleUrl: './summary-step-page.css',
})
export class SummaryStepPage {
  private readonly context = inject(CountryContext);
  private readonly reader = inject(Step1ResultReader);
  private readonly plansData = inject(PlansData);
  private readonly cms = inject(CmsClient);
  private readonly storage = inject(WizardStorage);
  private readonly router = inject(Router);
  private readonly gateway = inject(MockPaymentGateway);
  private readonly clock = inject(CLOCK);
  private readonly randomFill = inject(QUOTE_RANDOM_FILL);

  /** REQ-03.12: not persisted; unchecked on every entry to the summary. */
  protected readonly termsAccepted = signal(false);
  /** REQ-03.21: "approved" selected by default. */
  protected readonly outcome = signal<PaymentOutcome>('approved');
  protected readonly payment = signal<PaymentState>('idle');
  protected readonly processing = computed(() => this.payment() === 'processing');

  /** Pending simulated payment; aborted if the page is left (REQ-03.22). */
  private pending: AbortController | null = null;

  protected readonly config = computed(() => this.context.config());
  protected readonly genericErrorMessage = computed(() => this.config()?.genericErrorMessage ?? '');

  /**
   * Step 1 with the current configuration; recomputed when it arrives, also after a retry
   * (review 002 F-03.1). It feeds the data section, the price, the backstop and `canPay`.
   */
  private readonly step1 = computed<Step1Result | null>(() => {
    const config = this.config();
    return config ? this.reader.read(config) : null;
  });
  private readonly step1Complete = computed(() => this.step1()?.isComplete === true);

  protected readonly title = computed(() => {
    const config = this.config();
    return config ? (textsOf(config.texts.summaryStep.page)?.title ?? null) : null;
  });
  protected readonly dataTexts = computed(() => {
    const config = this.config();
    return config ? textsOf(config.texts.summaryStep.data) : null;
  });
  /** The plan section also uses the coverage and benefit headings of step 2 (content-model §3.5). */
  protected readonly planTexts = computed(() => {
    const config = this.config();
    const plan = config ? textsOf(config.texts.summaryStep.plan) : null;
    const plans = config ? textsOf(config.texts.plansStep) : null;
    return plan && plans
      ? {
          ...plan,
          coveragesHeading: plans.coveragesHeading,
          benefitsHeading: plans.benefitsHeading,
        }
      : null;
  });
  protected readonly termsTexts = computed(() => {
    const config = this.config();
    return config ? textsOf(config.texts.summaryStep.terms) : null;
  });
  protected readonly paymentTexts = computed(() => {
    const config = this.config();
    return config ? textsOf(config.texts.summaryStep.payment) : null;
  });

  /** REQ-03.1 to REQ-03.3, REQ-03.6: sections with labels, readable values and masked document. */
  protected readonly sections = computed(() => {
    const config = this.config();
    const texts = this.dataTexts();
    const wizard = config ? textsOf(config.texts.wizard) : null;
    const step1 = this.step1();
    if (!config || !texts || !wizard || !step1?.isComplete) {
      return null;
    }
    return buildSummarySections(
      step1,
      { policyholder: wizard.policyholderSectionLabel, vehicle: wizard.vehicleSectionLabel },
      texts,
      config.country.intlLocale,
    );
  });

  /**
   * REQ-03.4, REQ-03.5, REQ-03.14: the stored plan against the current list, priced with the same
   * function as step 2. If it is no longer available, step 2 discards it and warns (G2-11).
   */
  protected readonly planResource = resource({
    params: () => (this.step1Complete() ? (this.config() ?? undefined) : undefined),
    loader: async ({ params, abortSignal }) => this.loadChosenPlan(params, abortSignal),
  });

  /** REQ-03.15, REQ-03.18: terms of the country (C7). Not requested if a terms text is missing. */
  protected readonly termsResource = resource({
    params: () => {
      const config = this.config();
      return config && this.termsTexts() && this.step1Complete() ? config.country.code : undefined;
    },
    loader: async ({ params: code, abortSignal }): Promise<TermsMapping> => {
      const mapped = mapTerms(
        await this.cms.findFirstPage('countries', termsQuery(code), abortSignal),
        code,
      );
      logCmsWarnings(mapped.warnings);
      return mapped;
    },
  });

  protected readonly planState = computed<PlanSectionState>(() => {
    const load = loadStateOf(this.planResource.status());
    if (load === 'error') {
      return { kind: 'error' };
    }
    const plan = this.planResource.hasValue() ? this.planResource.value() : null;
    // `null` once loaded: the plan is gone and the page is navigating to step 2.
    return load === 'ready' && plan ? { kind: 'ready', plan } : { kind: 'loading' };
  });

  protected readonly termsState = computed<TermsSectionState>(() => {
    const load = loadStateOf(this.termsResource.status());
    if (load !== 'ready' || !this.termsResource.hasValue()) {
      return load === 'error' ? { kind: 'error' } : { kind: 'loading' };
    }
    const terms = this.termsResource.value();
    return terms?.status === 'ready'
      ? { kind: 'ready', document: terms.document }
      : { kind: 'unavailable' };
  });

  protected readonly payEnabled = computed(() =>
    canPay({
      dataReady: this.sections() !== null,
      step1Complete: this.step1Complete(),
      planReady: this.planState().kind === 'ready',
      termsReady: this.termsState().kind === 'ready' && this.termsTexts() !== null,
      termsAccepted: this.termsAccepted(),
      paymentTextsReady: this.paymentTexts() !== null,
      payment: this.payment(),
    }),
  );

  /**
   * While processing, the button keeps focus: it is not natively disabled but `aria-disabled`,
   * and `pay()` ignores activations (REQ-03.23, REQ-03.35). Otherwise it is disabled natively
   * until the conditions of REQ-03.19 hold.
   */
  protected readonly payNativelyDisabled = computed(() => !this.payEnabled() && !this.processing());

  protected readonly payDescribedBy = computed(() => {
    const ids = [
      !this.termsAccepted() && this.termsTexts() ? 'pay-hint' : null,
      this.processing() ? 'pay-status' : null,
      this.payment() === 'rejected' ? 'pay-rejected' : null,
    ].filter((id): id is string => id !== null);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  constructor() {
    step1Backstop(this.step1, () => this.context.code());
    inject(DestroyRef).onDestroy(() => this.pending?.abort());
  }

  protected onTermsChange(event: Event): void {
    this.termsAccepted.set((event.target as HTMLInputElement).checked);
  }

  protected chooseOutcome(outcome: PaymentOutcome): void {
    this.outcome.set(outcome);
  }

  /**
   * One attempt per valid activation (REQ-03.23): the guard is the state, checked before any
   * `await`, so a double click, a held Enter or Enter + click start a single payment.
   */
  protected async pay(): Promise<void> {
    if (this.processing() || !this.payEnabled()) {
      return;
    }
    const config = this.config();
    const planState = this.planState();
    if (!config || planState.kind !== 'ready') {
      return;
    }
    this.payment.set('processing');
    const controller = new AbortController();
    this.pending = controller;
    let result: PaymentOutcome;
    try {
      result = await this.gateway.pay(this.outcome(), controller.signal);
    } catch {
      return; // Aborted: the person left the summary; the result is discarded.
    }
    if (controller.signal.aborted) {
      return;
    }
    this.pending = null;
    if (result === 'approved') {
      this.complete(config, planState.plan);
    } else {
      this.payment.set('rejected'); // REQ-03.30: data, plan and accepted terms are kept.
    }
  }

  protected editData(): void {
    void this.router.navigate(['/', this.context.code(), 'form']);
  }

  protected changePlan(): void {
    void this.router.navigate(['/', this.context.code(), 'plans']);
  }

  /** REQ-03.26 to REQ-03.28, in the order of ADR-0004. */
  private complete(config: CountryConfig, chosen: PlanView): void {
    const code = config.country.code;
    const now = this.clock();
    this.storage.writeConfirmation(code, {
      quoteNumber: createQuoteNumber(code, now, this.randomFill),
      planName: chosen.plan.name,
      finalPrice: chosen.finalPrice,
      currency: config.country.currency,
      paidAt: now.toISOString(),
    });
    this.storage.remove(code, 'step1');
    this.storage.remove(code, 'plan');
    void this.router.navigate(['/', code, 'confirmation'], { replaceUrl: true });
  }

  private async loadChosenPlan(
    config: CountryConfig,
    signal: AbortSignal,
  ): Promise<PlanView | null> {
    const code = config.country.code;
    const data = await this.plansData.load(config.country, signal);
    const storedId = this.storage.readPlan(code)?.planDocumentId ?? null;
    const views = buildPlanViews(
      data,
      priceInputsFrom(this.reader.read(config)),
      this.reader.ruleContext(config).today,
      config.country,
    );
    const chosen = views.find((view) => view.plan.id === storedId) ?? null;
    if (!chosen) {
      // REQ-03.14: step 2 is the single place that discards the selection and warns (ADR-0004).
      void this.router.navigate(['/', code, 'plans'], { replaceUrl: true });
    }
    return chosen;
  }
}
