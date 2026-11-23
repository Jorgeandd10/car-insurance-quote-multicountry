/**
 * Idempotent seed (content-model section 6; REQ-01.34, REQ-02.33, REQ-03.15, REQ-01.2, AC-01.11).
 *
 * Runs on every bootstrap. It only creates what does not exist yet and never overwrites
 * what the business may have changed in the admin:
 *   - country           → looked up by `code`;
 *   - form-field        → looked up by `key` (globally unique, country prefix, G3-4);
 *   - plan              → looked up by `name` within the country;
 *   - country-selection → single type, created only if it has no document.
 *
 * Lookups use the draft version (Document Service default): in Strapi 5 every document
 * keeps a draft version, published or not, so a document is found whatever its state.
 * Items flagged `publish: false` are created as drafts and never published.
 */
import type { Core } from '@strapi/strapi';
import { co } from './data/co';
import { cl } from './data/cl';
import { countrySelection } from './data/country-selection';

// ---------- Seed data types (mirror content-model sections 2 and 3) ----------

type BlockText = { type: 'text'; text: string; bold?: boolean; italic?: boolean };
type BlockListItem = { type: 'list-item'; children: BlockText[] };
type Block =
  | { type: 'paragraph'; children: BlockText[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: BlockListItem[] };

export interface PriceFactorSeed {
  role: 'vehicleYear' | 'birthDate';
  operand: 'vehicleAge' | 'ageInYears';
  min: number | null;
  max: number | null;
  multiplier: number;
}

export interface CountryDataSeed {
  code: string;
  name: string;
  intlLocale: string;
  currency: string;
  minimumAge: number;
  wizardTexts: Record<string, string>;
  formStepTexts: Record<string, string>;
  plansStepTexts: Record<string, string>;
  summaryStepTexts: Record<string, string>;
  confirmationTexts: Record<string, string>;
  priceFactors: PriceFactorSeed[];
  termsAndConditions: Block[];
}

type ValidationRuleSeed =
  | { kind: 'minLength' | 'maxLength' | 'min' | 'max'; value: number }
  | { kind: 'pattern'; pattern: string }
  | { kind: 'integer' };

export interface FormFieldSeed {
  publish: boolean;
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  required: boolean;
  helpText?: string;
  errorMessage?: string;
  order?: number;
  section: 'policyholder' | 'vehicle';
  role?: 'documentNumber' | 'birthDate' | 'vehicleYear';
  options?: { value: string; label: string }[];
  validations?: ValidationRuleSeed[];
}

export interface PlanSeed {
  publish: boolean;
  name: string;
  shortDescription?: string;
  basePrice: number;
  currency: string;
  order?: number;
  recommended: boolean;
  active: boolean;
  coverages: { label: string }[];
  benefits: { label: string }[];
}

export interface CountrySeed {
  country: CountryDataSeed;
  formFields: FormFieldSeed[];
  plans: PlanSeed[];
}

export interface CountrySelectionSeed {
  heading: string;
  intro: string;
  countryListLabel: string;
}

// ---------- Implementation ----------

const COUNTRY = 'api::country.country';
const FORM_FIELD = 'api::form-field.form-field';
const PLAN = 'api::plan.plan';
const COUNTRY_SELECTION = 'api::country-selection.country-selection';

interface Counters {
  created: number;
  existing: number;
}

const log = (strapi: Core.Strapi, message: string) => strapi.log.info(`[seed] ${message}`);

async function seedCountry(strapi: Core.Strapi, seed: CountrySeed, counters: Counters) {
  const countries = strapi.documents(COUNTRY);
  const { code } = seed.country;

  let country = await countries.findFirst({ filters: { code } });
  if (country) {
    counters.existing += 1;
    log(strapi, `country ${code}: exists (documentId ${country.documentId}), not modified`);
  } else {
    country = await countries.create({ data: seed.country });
    await countries.publish({ documentId: country.documentId });
    counters.created += 1;
    log(strapi, `country ${code}: created and published (documentId ${country.documentId})`);
  }

  const fields = strapi.documents(FORM_FIELD);
  for (const { publish, ...field } of seed.formFields) {
    const found = await fields.findFirst({ filters: { key: field.key } });
    if (found) {
      counters.existing += 1;
      continue;
    }
    const created = await fields.create({ data: { ...field, country: country.documentId } });
    if (publish) {
      await fields.publish({ documentId: created.documentId });
    }
    counters.created += 1;
    log(strapi, `form-field ${field.key}: created (${publish ? 'published' : 'draft only'})`);
  }

  const plans = strapi.documents(PLAN);
  for (const { publish, ...plan } of seed.plans) {
    const found = await plans.findFirst({ filters: { name: plan.name, country: { code } } });
    if (found) {
      counters.existing += 1;
      continue;
    }
    const created = await plans.create({ data: { ...plan, country: country.documentId } });
    if (publish) {
      await plans.publish({ documentId: created.documentId });
    }
    counters.created += 1;
    log(
      strapi,
      `plan ${code}/"${plan.name}": created (${publish ? 'published' : 'draft only'}, active=${plan.active})`,
    );
  }
}

async function seedCountrySelection(strapi: Core.Strapi, counters: Counters) {
  const selection = strapi.documents(COUNTRY_SELECTION);
  const found = await selection.findFirst();
  if (found) {
    counters.existing += 1;
    log(strapi, 'country-selection: exists, not modified');
    return;
  }
  const created = await selection.create({ data: countrySelection });
  await selection.publish({ documentId: created.documentId });
  counters.created += 1;
  log(strapi, 'country-selection: created and published');
}

export async function runSeed(strapi: Core.Strapi): Promise<void> {
  const counters: Counters = { created: 0, existing: 0 };
  for (const seed of [co, cl]) {
    await seedCountry(strapi, seed, counters);
  }
  await seedCountrySelection(strapi, counters);
  log(strapi, `done: ${counters.created} created, ${counters.existing} already present (left untouched)`);
}
