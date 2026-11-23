import type { Page } from '@playwright/test';
import {
  CO,
  NBSP,
  expect,
  goToCoPlans,
  goToCoSummary,
  heading,
  isFormFields,
  isPlans,
  isPriceFactors,
  isTerms,
  modifyRealResponse,
  planRadio,
  test,
} from '../../support/fixtures';

/**
 * Plan, price factor and terms changes without deployment (ADR-0007, project `content-changes`).
 * First the real seed, then the change simulated over the real response, then reload. The real
 * change in the Strapi admin is checked by hand in G5 (G3-3, docs/qa/manual-check.md).
 */

interface PlanDto {
  id: number;
  documentId: string;
  name: string;
  shortDescription: string | null;
  basePrice: number | string | null;
  currency: string;
  order: number | null;
  recommended: boolean;
  active: boolean;
  coverages: { id: number; label: string }[] | null;
  benefits: { id: number; label: string }[] | null;
}

interface FactorDto {
  id: number;
  role: string;
  operand: string;
  min: number | null;
  max: number | null;
  multiplier: number;
}

const priceOf = (page: Page, planName: string) =>
  page.locator('.plan', { has: page.getByText(planName, { exact: true }) }).locator('.plan-price');

test.describe('Plans changes in Strapi (interception of C5/C6/C7)', () => {
  test('AC-02.25 deactivation, order, recommended flag, base price and a price factor are reflected after reload', async ({
    page,
  }) => {
    await goToCoPlans(page);
    await expect(page.locator('.plan-name')).toHaveText([...CO.plans]);
    await expect(page.locator('.plan--recommended .plan-name')).toHaveText(['Plan Plus']);
    await expect(priceOf(page, 'Plan Plus')).toHaveText(`$${NBSP}1.320.000`);
    await expect(priceOf(page, 'Plan Esencial')).toHaveText(`$${NBSP}935.000`);

    // Published change: "Plan Total" deactivated, "Plan Esencial" moved after "Plan Plus",
    // recommended moved to "Plan Esencial", base price of "Plan Plus" 1 200 000 → 1 000 000.
    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, (body) => {
        for (const plan of body.data as PlanDto[]) {
          if (plan.name === 'Plan Total') plan.active = false;
          if (plan.name === 'Plan Esencial') {
            plan.order = 5;
            plan.recommended = true;
          }
          if (plan.name === 'Plan Plus') {
            plan.recommended = false;
            plan.basePrice = 1000000;
          }
        }
      }),
    );
    // And the 6–10 years vehicle band multiplier 1.10 → 1.50.
    await page.route(isPriceFactors('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const factors = (body.data as { priceFactors: FactorDto[] }[])[0].priceFactors;
        factors.find((f) => f.operand === 'vehicleAge' && f.min === 6)!.multiplier = 1.5;
      }),
    );
    await page.reload();

    await expect(heading(page)).toHaveText(CO.plansTitle);
    await expect(page.getByRole('radio')).toHaveCount(2);
    await expect(page.locator('.plan-name')).toHaveText(['Plan Plus', 'Plan Esencial']);
    await expect(page.locator('.plan--recommended .plan-name')).toHaveText(['Plan Esencial']);
    // 1 000 000 × 1.50 × 1.00 and 850 000 × 1.50 × 1.00.
    await expect(priceOf(page, 'Plan Plus')).toHaveText(`$${NBSP}1.500.000`);
    await expect(priceOf(page, 'Plan Esencial')).toHaveText(`$${NBSP}1.275.000`);
    await expect(page.getByText('Plan Total')).toHaveCount(0);
  });

  test('AC-02.21 the persisted plan is deactivated: no selection, announced message, no advance', async ({
    page,
  }) => {
    await goToCoPlans(page);
    await planRadio(page, 'Plan Total').check();
    await expect(planRadio(page, 'Plan Total')).toBeChecked();

    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, (body) => {
        body.data = (body.data as PlanDto[]).filter((p) => p.name !== 'Plan Total');
      }),
    );
    await page.reload();

    await expect(page.getByRole('alert').filter({ hasText: CO.texts.planUnavailable })).toBeVisible();
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(page.getByRole('alert').filter({ hasText: CO.texts.choosePlan })).toBeVisible();
  });

  test('AC-03.19 the chosen plan is deactivated before reaching the summary: back to step 2 with the notice', async ({
    page,
  }) => {
    await goToCoSummary(page, 'Plan Total');
    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, (body) => {
        for (const plan of body.data as PlanDto[]) {
          if (plan.name === 'Plan Total') plan.active = false;
        }
      }),
    );
    await page.reload();
    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(page.getByRole('alert').filter({ hasText: CO.texts.planUnavailable })).toBeVisible();
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  });

  test('AC-03.19 the chosen plan gets another currency: back to step 2 with the notice', async ({
    page,
  }) => {
    await goToCoSummary(page, 'Plan Esencial');
    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, (body) => {
        for (const plan of body.data as PlanDto[]) {
          if (plan.name === 'Plan Esencial') plan.currency = 'USD';
        }
      }),
    );
    await page.reload();
    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(page.getByRole('alert').filter({ hasText: CO.texts.planUnavailable })).toBeVisible();
    // AC-02.14: the plan with another currency is not shown; the rest in COP.
    await expect(page.getByText('Plan Esencial', { exact: true })).toHaveCount(0);
    await expect(priceOf(page, 'Plan Plus')).toHaveText(`$${NBSP}1.320.000`);
  });

  test('AC-02.15 a plan without base price is not shown and the rest are normal', async ({ page }) => {
    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, (body) => {
        for (const plan of body.data as PlanDto[]) {
          if (plan.name === 'Plan Plus') plan.basePrice = null;
        }
      }),
    );
    await goToCoPlans(page);
    await expect(page.locator('.plan-name')).toHaveText(['Plan Esencial', 'Plan Total']);
    await expect(priceOf(page, 'Plan Total')).toHaveText(`$${NBSP}1.815.000`);
  });

  test('AC-02.6 AC-02.7 order ties, empty order and several recommended', async ({ page }) => {
    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const [esencial, plus, total] = ['Plan Esencial', 'Plan Plus', 'Plan Total'].map(
          (n) => (body.data as PlanDto[]).find((p) => p.name === n)!,
        );
        // "Plan Total" order 1, "Plan Plus" and "Plan Esencial" tie at 2, plus one with no order.
        total.order = 1;
        plus.order = 2;
        esencial.order = 2;
        const lite: PlanDto = { ...esencial, id: 9100, documentId: 'e2elite00000000000000001', name: 'Plan Lite', order: null, recommended: false };
        (body.data as PlanDto[]).push(lite);
        // Two recommended: only the first in order is highlighted.
        total.recommended = true;
        plus.recommended = true;
      }),
    );
    await goToCoPlans(page);
    // Tie at order 2 broken by name with the es-CO locale: "Plan Esencial" < "Plan Plus".
    await expect(page.locator('.plan-name')).toHaveText(['Plan Total', 'Plan Esencial', 'Plan Plus', 'Plan Lite']);
    await expect(page.locator('.plan--recommended .plan-name')).toHaveText(['Plan Total']);
    await expect(page.locator('.badge')).toHaveCount(1);
  });

  test('AC-02.10 without price factors each plan shows its base price', async ({ page }) => {
    await page.route(isPriceFactors('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as { priceFactors: FactorDto[] }[])[0].priceFactors = [];
      }),
    );
    await goToCoPlans(page);
    await expect(priceOf(page, 'Plan Esencial')).toHaveText(`$${NBSP}850.000`);
    await expect(priceOf(page, 'Plan Plus')).toHaveText(`$${NBSP}1.200.000`);
    await expect(priceOf(page, 'Plan Total')).toHaveText(`$${NBSP}1.650.000`);
  });

  test('AC-02.32 thirty active plans are all listed', async ({ page }) => {
    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const template = (body.data as PlanDto[])[0];
        body.data = Array.from({ length: 30 }, (_, i) => ({
          ...template,
          id: 9200 + i,
          documentId: `e2eplan${String(i).padStart(17, '0')}`,
          name: `Plan ${String(i + 1).padStart(2, '0')}`,
          order: i + 1,
          recommended: false,
        }));
        body.meta = { pagination: { page: 1, pageSize: 100, pageCount: 1, total: 30 } };
      }),
    );
    await goToCoPlans(page);
    await expect(page.getByRole('radio')).toHaveCount(30);
  });

  test('AC-02.22 a new required field published after step 1 sends the user back to step 1 without asking for plans', async ({
    page,
    requests,
  }) => {
    await goToCoPlans(page);
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as unknown[]).push({
          id: 9300,
          documentId: 'e2erequired0000000000001',
          key: 'co_licenseNumber',
          label: 'Número de licencia de conducción',
          type: 'text',
          required: true,
          helpText: null,
          errorMessage: 'Ingresa el número de tu licencia.',
          order: 6,
          section: 'policyholder',
          role: null,
          options: [],
          validations: [],
        });
      }),
    );
    const before = requests.length;
    await page.reload();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(page.getByLabel('Número de licencia de conducción')).toBeVisible();
    // Data kept.
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue(CO.data.documentNumber);
    expect(requests.slice(before).filter((r) => r.url.pathname === '/api/plans')).toEqual([]);
  });

  test('AC-03.20 a new required field published after choosing a plan sends the summary back to step 1', async ({
    page,
  }) => {
    await goToCoSummary(page);
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as unknown[]).push({
          id: 9301,
          documentId: 'e2erequired0000000000002',
          key: 'co_licenseNumber',
          label: 'Número de licencia de conducción',
          type: 'text',
          required: true,
          helpText: null,
          errorMessage: 'Ingresa el número de tu licencia.',
          order: 6,
          section: 'policyholder',
          role: null,
          options: [],
          validations: [],
        });
      }),
    );
    await page.reload();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(page.getByLabel(CO.labels.plate)).toHaveValue(CO.data.plate);
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page.getByText('Ingresa el número de tu licencia.')).toBeVisible();
  });

  test('AC-03.15 terms edited and published are shown after reloading the summary', async ({
    page,
  }) => {
    await goToCoSummary(page);
    await expect(page.locator('.terms-region')).toContainText(CO.texts.termsStart);
    await page.route(isTerms('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as { termsAndConditions: unknown }[])[0].termsAndConditions = [
          { type: 'paragraph', children: [{ type: 'text', text: 'Términos nuevos publicados por negocio.' }] },
        ];
      }),
    );
    await page.reload();
    await expect(page.locator('.terms-region')).toHaveText('Términos nuevos publicados por negocio.');
  });

  test('AC-03.14 terms with unsafe markup do not execute or insert elements', async ({ page }) => {
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    await page.route(isTerms('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as { termsAndConditions: unknown }[])[0].termsAndConditions = [
          { type: 'paragraph', children: [{ type: 'text', text: '<img src=x onerror=alert(1)>' }] },
          { type: 'html', value: '<script>alert(2)</script>' },
        ];
      }),
    );
    await goToCoSummary(page);
    const region = page.locator('.terms-region');
    await expect(region).toContainText('<img src=x onerror=alert(1)>');
    await expect(region.locator('img, script')).toHaveCount(0);
    expect(dialogs).toEqual([]);
  });

  test('AC-03.13 empty terms show the "not available" notice, checkbox and pay disabled, data visible', async ({
    page,
  }) => {
    await page.route(isTerms('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as { termsAndConditions: unknown }[])[0].termsAndConditions = [];
      }),
    );
    await goToCoPlans(page);
    await planRadio(page, 'Plan Plus').check();
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(page.getByRole('alert').filter({ hasText: 'Los términos no están disponibles.' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: CO.texts.acceptTerms })).toBeDisabled();
    await expect(page.getByRole('button', { name: CO.texts.pay })).toBeDisabled();
    await expect(page.locator('.summary-data')).toContainText(CO.data.maskedDocument);
    await expect(page.locator('.summary-plan .plan-name')).toHaveText('Plan Plus');
  });
});
