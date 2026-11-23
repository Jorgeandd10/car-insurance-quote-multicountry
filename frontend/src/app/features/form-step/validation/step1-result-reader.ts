import { Injectable, inject } from '@angular/core';
import { CLOCK, todayLocal } from '../../../core/clock/clock';
import { CountryConfig } from '../../../core/country/country-config';
import { WizardStorage } from '../../../core/storage/wizard-storage';
import { Step1Result, evaluateStep1 } from './evaluate-step1';
import { reconcileStep1 } from './reconcile-step1';
import { Step1RuleContext } from './step1-model';

/**
 * Step 1 result of a country, read from `ciq.v1.{cc}.step1` and evaluated with the current
 * configuration (REQ-01.27, ADR-0004). The entry point for the guards and for US-02 and US-03:
 * nothing is cached and `isComplete` is never stored.
 */
@Injectable({ providedIn: 'root' })
export class Step1ResultReader {
  private readonly storage = inject(WizardStorage);
  private readonly clock = inject(CLOCK);

  /** "Today" and minimum age for the rules of step 1 (REQ-01.21). */
  ruleContext(config: CountryConfig): Step1RuleContext {
    return { today: todayLocal(this.clock()), minimumAge: config.country.minimumAge };
  }

  read(config: CountryConfig): Step1Result {
    const reconciled = reconcileStep1(
      config.form.fields,
      this.storage.readStep1(config.country.code),
    );
    return evaluateStep1(config.form, reconciled.values, this.ruleContext(config));
  }
}
