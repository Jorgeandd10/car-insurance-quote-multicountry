import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideAppRouting } from '../../../app.routes';
import { CLOCK } from '../../../core/clock/clock';
import { CmsClient } from '../../../core/cms/cms-client';
import {
  CmsHandler,
  FakeCmsClient,
  countryOf,
  pending,
  requestIdOf,
} from '../../../core/cms/testing/fake-cms-client';
import { strapiC1, strapiC3, strapiC7 } from '../../../core/cms/testing/strapi-fixtures';
import { WIZARD_STORAGE } from '../../../core/storage/wizard-storage';
import { InMemoryStorage } from '../../../core/storage/testing/in-memory-storage';
import { coFormFieldsDto } from './form-fixtures';
import {
  clFactorsDto,
  clPlansDto,
  coFactorsDto,
  coPlansDto,
  factorsCountryDto,
} from '../../plans-step/testing/plans-fixtures';

/** Same form for Chile, with the `cl_` key prefix of G3-4. Test-only. */
export function clFormFieldsDto(): Record<string, unknown>[] {
  return coFormFieldsDto().map((dto) => ({
    ...dto,
    key: String(dto['key']).replace(/^co_/, 'cl_'),
  }));
}

export function clCountryDto(): Record<string, unknown> {
  return { ...strapiC3().data[0], code: 'cl', name: 'Chile', intlLocale: 'es-CL', currency: 'CLP' };
}

export interface WizardContent {
  /** C3 country of `co` (edit it to remove texts). */
  co: Record<string, unknown>;
  coFields: unknown[];
  clFields: unknown[];
  /** C5 data of each country. */
  coPlans: unknown[];
  clPlans: unknown[];
  /** `priceFactors` of each country (C6). */
  coFactors: unknown;
  clFactors: unknown;
  /** `termsAndConditions` of each country (C7). */
  coTerms: unknown;
  clTerms: unknown;
}

/** Blocks with the terms of Chile, different from the documented ones of Colombia. */
export function clTermsBlocks(): unknown[] {
  return [
    { type: 'paragraph', children: [{ type: 'text', text: 'Términos ficticios de Chile.' }] },
  ];
}

/** C1 and C3 to C7 for CO and CL as the seed would answer them; C2 stays pending. */
export function wizardHandler(content: WizardContent): CmsHandler {
  return async (call) => {
    const code = countryOf(call);
    switch (requestIdOf(call)) {
      case 'C1':
        return strapiC1().data;
      case 'C3':
        return code === 'co' ? [content.co] : code === 'cl' ? [clCountryDto()] : [];
      case 'C4':
        return code === 'co' ? content.coFields : code === 'cl' ? content.clFields : [];
      case 'C5':
        return code === 'co' ? content.coPlans : code === 'cl' ? content.clPlans : [];
      case 'C6':
        return code === 'co'
          ? factorsCountryDto('co', content.coFactors)
          : code === 'cl'
            ? factorsCountryDto('cl', content.clFactors)
            : [];
      case 'C7':
        return code === 'co' || code === 'cl'
          ? [
              {
                id: 2,
                documentId: `country-${code}`,
                code,
                termsAndConditions: code === 'co' ? content.coTerms : content.clTerms,
              },
            ]
          : [];
      default:
        return pending();
    }
  };
}

/** Fixed "now": 2026-11-22 12:00 local time (REQ-01.21, ADR-0007). */
export const FIXED_NOW = new Date(2026, 10, 22, 12, 0, 0);

/**
 * Real routes and shell with a fake CMS, in-memory `WIZARD_STORAGE` and a fixed clock (ADR-0007).
 */
export async function createWizardHarness(
  patch: Partial<WizardContent> = {},
  extraProviders: (Provider | EnvironmentProviders)[] = [],
) {
  const content: WizardContent = {
    co: strapiC3().data[0] as unknown as Record<string, unknown>,
    coFields: coFormFieldsDto(),
    clFields: clFormFieldsDto(),
    coPlans: coPlansDto(),
    clPlans: clPlansDto(),
    coFactors: coFactorsDto(),
    clFactors: clFactorsDto(),
    coTerms: strapiC7().data[0].termsAndConditions,
    clTerms: clTermsBlocks(),
    ...patch,
  };
  const cms = new FakeCmsClient();
  cms.handler = wizardHandler(content);
  const storage = new InMemoryStorage();
  TestBed.configureTestingModule({
    providers: [
      ...provideAppRouting(),
      { provide: CmsClient, useValue: cms },
      { provide: WIZARD_STORAGE, useValue: storage },
      { provide: CLOCK, useValue: () => FIXED_NOW },
      ...extraProviders,
    ],
  });
  const harness = await RouterTestingHarness.create();
  const root = () => harness.fixture.nativeElement as HTMLElement;
  const router = TestBed.inject(Router);

  const settle = () => harness.fixture.whenStable();
  const open = async (url: string) => {
    await harness.navigateByUrl(url);
    await settle();
  };
  const control = <T extends HTMLElement = HTMLInputElement>(key: string) =>
    root().querySelector<T>(`#f-${key}`) as T;

  /** Types a value like a user: `input` event, then leaves the field (`blur`). */
  const fill = async (key: string, value: string, options: { blur?: boolean } = {}) => {
    const element = control<HTMLInputElement | HTMLSelectElement>(key);
    element.value = value;
    element.dispatchEvent(new Event('input'));
    if (options.blur ?? true) {
      element.dispatchEvent(new Event('blur'));
    }
    await settle();
  };
  const check = async (key: string, checked: boolean) => {
    const box = control(key);
    if (box.checked !== checked) {
      box.click();
    }
    box.dispatchEvent(new Event('blur'));
    await settle();
  };
  const submit = async () => {
    root().querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await settle();
    await settle();
  };
  const storedPlan = (code: string): unknown => {
    const raw = storage.getItem(`ciq.v1.${code}.plan`);
    return raw === null ? null : JSON.parse(raw);
  };
  const radio = (planId: string) =>
    root().querySelector<HTMLInputElement>(`#plan-${planId}`) as HTMLInputElement;
  const storedStep1 = (code: string): unknown => {
    const raw = storage.getItem(`ciq.v1.${code}.step1`);
    return raw === null ? null : JSON.parse(raw);
  };

  return {
    harness,
    cms,
    storage,
    router,
    root,
    settle,
    open,
    control,
    fill,
    check,
    submit,
    storedStep1,
    storedPlan,
    radio,
  };
}

export type WizardHarness = Awaited<ReturnType<typeof createWizardHarness>>;
