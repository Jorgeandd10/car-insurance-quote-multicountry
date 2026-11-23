import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FieldTree, FormField, FormRoot, form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { WizardStorage } from '../../core/storage/wizard-storage';
import { FormFieldConfig, SECTIONS, Section } from '../../domain/form/form-config';
import { buildStep1Schema } from './step1-schema';
import { reconcileStep1 } from './validation/reconcile-step1';
import {
  Step1Model,
  Step1RuleContext,
  isEffectivelyRequired,
  normalizeStep1Values,
} from './validation/step1-model';

/** Everything the form needs, already checked by the page (texts present, form `ready`). */
export interface Step1FormView {
  readonly countryCode: string;
  /** Valid fields in display order. */
  readonly fields: readonly FormFieldConfig[];
  readonly legends: Readonly<Record<Section, string>>;
  readonly continueLabel: string;
  readonly genericErrorMessage: string;
  readonly ruleContext: Step1RuleContext;
}

interface SectionView {
  readonly id: Section;
  readonly legend: string;
  readonly fields: readonly FormFieldConfig[];
}

/**
 * Dynamic form of step 1 (ADR-0002): flat model indexed by key, schema generated from the
 * configuration, native controls bound with `[formField]`, accessibility attributes bound by hand
 * (the spike showed `FormField` does not set `aria-invalid` nor `aria-describedby`).
 *
 * The configuration is immutable for the life of the component: a reload recreates it.
 */
@Component({
  selector: 'app-dynamic-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField],
  templateUrl: './dynamic-form.html',
  styleUrl: './dynamic-form.css',
})
export class DynamicForm implements OnInit {
  readonly view = input.required<Step1FormView>();

  private readonly injector = inject(Injector);
  private readonly storage = inject(WizardStorage);
  private readonly router = inject(Router);

  private readonly model = signal<Step1Model>({});
  /** Created in `ngOnInit`, once the input is available (ADR-0002). */
  protected f!: FieldTree<Step1Model>;
  protected sections: readonly SectionView[] = [];

  ngOnInit(): void {
    const view = this.view();
    const reconciled = reconcileStep1(view.fields, this.storage.readStep1(view.countryCode));
    for (const warning of reconciled.warnings) {
      console.warn(warning);
    }
    // Initialised with the reconciled values, so the first write below is idempotent (ADR-0004).
    this.model.set(reconciled.values);

    this.sections = SECTIONS.map((id) => ({
      id,
      legend: view.legends[id],
      fields: view.fields.filter((field) => field.section === id),
    })).filter((section) => section.fields.length > 0);

    this.f = form(this.model, buildStep1Schema(view.fields, view.ruleContext), {
      injector: this.injector,
      submission: {
        action: async () => {
          this.persist();
          await this.router.navigate(['/', view.countryCode, 'plans']);
          return undefined;
        },
        onInvalid: () => this.focusFirstInvalid(),
      },
    });

    // REQ-01.23: every change of value is stored, normalised, for this country only.
    effect(() => this.persist(this.model()), { injector: this.injector });
  }

  // Typed accessors: the field type fixes the value type (initialValue / reconcileStep1). The
  // cast is the "deliberate escape hatch" of the dynamic-forms guide (ADR-0002).
  protected asText(key: string): FieldTree<string> {
    return this.f[key] as unknown as FieldTree<string>;
  }

  protected asNumber(key: string): FieldTree<number | null> {
    return this.f[key] as unknown as FieldTree<number | null>;
  }

  protected asBoolean(key: string): FieldTree<boolean> {
    return this.f[key] as unknown as FieldTree<boolean>;
  }

  protected isRequired(field: FormFieldConfig): boolean {
    return isEffectivelyRequired(field);
  }

  /** REQ-01.16: after the first blur or the first attempt to continue, then live. */
  protected errorVisible(key: string): boolean {
    const state = this.f[key]();
    return state.touched() && state.invalid();
  }

  /** The single message of the field, or the generic one of the country (REQ-01.16). */
  protected errorMessage(field: FormFieldConfig): string {
    return field.errorMessage ?? this.view().genericErrorMessage;
  }

  protected describedBy(field: FormFieldConfig): string | null {
    const ids = [
      field.helpText ? `help-${field.key}` : null,
      this.errorVisible(field.key) ? `err-${field.key}` : null,
    ].filter((id): id is string => id !== null);
    return ids.length > 0 ? ids.join(' ') : null;
  }

  /** While typing the raw text is kept; on leaving the field it is replaced by the trimmed one. */
  protected trimText(key: string): void {
    const value = this.model()[key];
    if (typeof value === 'string' && value !== value.trim()) {
      this.model.update((model) => ({ ...model, [key]: value.trim() }));
    }
  }

  private persist(model: Step1Model = this.model()): void {
    const view = this.view();
    this.storage.writeStep1(view.countryCode, normalizeStep1Values(view.fields, model));
  }

  /** REQ-01.17: focus the first invalid field in display order (not `errorSummary()`). */
  private focusFirstInvalid(): void {
    const first = this.view().fields.find((field) => this.f[field.key]().invalid());
    if (first) {
      this.f[first.key]().focusBoundControl();
    }
  }
}
