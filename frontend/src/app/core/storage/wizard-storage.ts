import { Injectable, InjectionToken, inject } from '@angular/core';
import { isCountryCode } from '../country/country-config';

/**
 * Browser storage of the wizard (D6, ADR-0004). `sessionStorage` by default; tests provide an
 * in-memory `Storage`. Only `core/storage/` touches it.
 */
export const WIZARD_STORAGE = new InjectionToken<Storage>('WIZARD_STORAGE', {
  providedIn: 'root',
  factory: () => sessionStorage,
});

/** Schema version of the keys. A new version uses `v2` and ignores `v1` (ADR-0004). */
export const WIZARD_STORAGE_VERSION = 'v1';

export type WizardStorageKind = 'step1' | 'plan' | 'confirmation';

/** `ciq.v1.{cc}.{kind}`: one key per country and per data type (ADR-0004, P1). */
export function wizardStorageKey(countryCode: string, kind: WizardStorageKind): string {
  if (!isCountryCode(countryCode)) {
    throw new Error('[storage] invalid country code for a storage key');
  }
  return `ciq.${WIZARD_STORAGE_VERSION}.${countryCode}.${kind}`;
}

/** Value of a step 1 field, by type: text/date/select → string, number → number, checkbox → boolean. */
export type StoredFieldValue = string | number | boolean | null;

/** `ciq.v1.{cc}.step1`: only values, never a "completed" flag (G2-10). */
export interface StoredStep1 {
  readonly values: Readonly<Record<string, StoredFieldValue>>;
}

/** `ciq.v1.{cc}.plan`: only the plan `documentId` (G2-9). */
export interface StoredPlan {
  readonly planDocumentId: string;
}

/** `ciq.v1.{cc}.confirmation`: minimal confirmation without personal data (REQ-03.28). */
export interface StoredConfirmation {
  readonly quoteNumber: string;
  readonly planName: string;
  readonly finalPrice: number;
  readonly currency: string;
  readonly paidAt: string;
}

export interface Parsed<T> {
  /** `null` when the stored entry is missing or must be discarded. */
  readonly value: T | null;
  /** The whole entry is unusable and must be removed. */
  readonly discard: boolean;
  readonly warnings: readonly string[];
}

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value !== '';

function parseJson(
  raw: string,
  kind: WizardStorageKind,
): { ok: true; json: unknown } | { ok: false; warning: string } {
  try {
    return { ok: true, json: JSON.parse(raw) };
  } catch {
    return { ok: false, warning: `[storage] ${kind} discarded: invalid JSON` };
  }
}

/**
 * Defensive read of step 1 (US-01 5.4): invalid JSON or shape → the entry is discarded; a value
 * of an unexpected type is dropped on its own. Warnings never contain values (user data).
 */
export function parseStoredStep1(raw: string): Parsed<StoredStep1> {
  const parsed = parseJson(raw, 'step1');
  if (!parsed.ok) {
    return { value: null, discard: true, warnings: [parsed.warning] };
  }
  const values = isObject(parsed.json) ? parsed.json['values'] : undefined;
  if (!isObject(values)) {
    return {
      value: null,
      discard: true,
      warnings: ['[storage] step1 discarded: unexpected shape'],
    };
  }
  const kept: Record<string, StoredFieldValue> = {};
  const warnings: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      kept[key] = value;
    } else {
      warnings.push(`[storage] step1 value discarded: unexpected type (key=${key})`);
    }
  }
  return { value: { values: kept }, discard: false, warnings };
}

export function parseStoredPlan(raw: string): Parsed<StoredPlan> {
  const parsed = parseJson(raw, 'plan');
  if (!parsed.ok) {
    return { value: null, discard: true, warnings: [parsed.warning] };
  }
  const id = isObject(parsed.json) ? parsed.json['planDocumentId'] : undefined;
  if (!nonEmptyString(id)) {
    return { value: null, discard: true, warnings: ['[storage] plan discarded: unexpected shape'] };
  }
  return { value: { planDocumentId: id }, discard: false, warnings: [] };
}

export function parseStoredConfirmation(raw: string): Parsed<StoredConfirmation> {
  const parsed = parseJson(raw, 'confirmation');
  if (!parsed.ok) {
    return { value: null, discard: true, warnings: [parsed.warning] };
  }
  const json = parsed.json;
  if (
    !isObject(json) ||
    !nonEmptyString(json['quoteNumber']) ||
    !nonEmptyString(json['planName']) ||
    typeof json['finalPrice'] !== 'number' ||
    !Number.isFinite(json['finalPrice']) ||
    !nonEmptyString(json['currency']) ||
    !nonEmptyString(json['paidAt'])
  ) {
    return {
      value: null,
      discard: true,
      warnings: ['[storage] confirmation discarded: unexpected shape'],
    };
  }
  return {
    value: {
      quoteNumber: json['quoteNumber'],
      planName: json['planName'],
      finalPrice: json['finalPrice'],
      currency: json['currency'],
      paidAt: json['paidAt'],
    },
    discard: false,
    warnings: [],
  };
}

/**
 * Typed access to the wizard keys of one country (ADR-0004). Countries never share data
 * (REQ-01.25, REQ-03.37): every method takes the validated code of the URL.
 */
@Injectable({ providedIn: 'root' })
export class WizardStorage {
  private readonly storage = inject(WIZARD_STORAGE);

  readStep1(countryCode: string): StoredStep1 | null {
    return this.read(countryCode, 'step1', parseStoredStep1);
  }

  writeStep1(countryCode: string, values: Readonly<Record<string, StoredFieldValue>>): void {
    const entry: StoredStep1 = { values };
    this.write(countryCode, 'step1', entry);
  }

  readPlan(countryCode: string): StoredPlan | null {
    return this.read(countryCode, 'plan', parseStoredPlan);
  }

  writePlan(countryCode: string, planDocumentId: string): void {
    const entry: StoredPlan = { planDocumentId };
    this.write(countryCode, 'plan', entry);
  }

  readConfirmation(countryCode: string): StoredConfirmation | null {
    return this.read(countryCode, 'confirmation', parseStoredConfirmation);
  }

  writeConfirmation(countryCode: string, confirmation: StoredConfirmation): void {
    this.write(countryCode, 'confirmation', confirmation);
  }

  remove(countryCode: string, kind: WizardStorageKind): void {
    try {
      this.storage.removeItem(wizardStorageKey(countryCode, kind));
    } catch {
      console.warn(`[storage] ${kind} could not be removed`);
    }
  }

  private read<T>(
    countryCode: string,
    kind: WizardStorageKind,
    parse: (raw: string) => Parsed<T>,
  ): T | null {
    let raw: string | null;
    try {
      raw = this.storage.getItem(wizardStorageKey(countryCode, kind));
    } catch {
      console.warn(`[storage] ${kind} could not be read`);
      return null;
    }
    if (raw === null) {
      return null;
    }
    const parsed = parse(raw);
    for (const warning of parsed.warnings) {
      console.warn(warning);
    }
    if (parsed.discard) {
      this.remove(countryCode, kind);
    }
    return parsed.value;
  }

  private write(countryCode: string, kind: WizardStorageKind, value: object): void {
    try {
      this.storage.setItem(wizardStorageKey(countryCode, kind), JSON.stringify(value));
    } catch {
      console.warn(`[storage] ${kind} could not be written`);
    }
  }
}
