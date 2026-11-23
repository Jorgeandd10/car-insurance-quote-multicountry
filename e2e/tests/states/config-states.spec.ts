import {
  CO,
  expect,
  fillClStep1,
  fillCoStep1,
  goToCoPlans,
  goToCoSummary,
  heading,
  isCountryConfig,
  isFormFields,
  isPlans,
  isTerms,
  modifyRealResponse,
  planRadio,
  test,
} from '../../support/fixtures';

/**
 * Loading, error, empty and malformed configuration by interception (ADR-0007, project `states`).
 */

interface FieldDto {
  key: string;
  type: string;
  label: string;
  role: string | null;
}

type CountryDto = Record<string, Record<string, string>>;

test.describe('Step 1 states', () => {
  test('AC-01.7 loading the form configuration shows "cargando" and no fields', async ({ page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(isFormFields('co'), async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/co/form');
    await expect(page.getByRole('status')).toHaveText('cargando');
    await expect(page.locator('form input, form select')).toHaveCount(0);
    await expect(page.getByRole('button', { name: CO.texts.continue })).toHaveCount(0);
    release();
    await expect(page.getByLabel(CO.labels.documentNumber)).toBeVisible();
  });

  test('AC-01.8 error loading the configuration, then "reintentar" shows the form', async ({ page }) => {
    let fail = true;
    await page.route(isFormFields('co'), (route) =>
      fail ? route.fulfill({ status: 503, body: 'unavailable' }) : route.continue(),
    );
    await page.goto('/co/form');
    await expect(page.getByRole('alert')).toHaveText('error de carga');
    await expect(page.getByRole('button', { name: CO.texts.continue })).toHaveCount(0);
    fail = false;
    await page.getByRole('button', { name: 'reintentar' }).click();
    await expect(page.getByLabel(CO.labels.documentNumber)).toBeVisible();
    await expect(page.getByRole('button', { name: CO.texts.continue })).toBeVisible();
  });

  test('AC-01.9 a country without published fields shows its empty message and no continue', async ({
    page,
  }) => {
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, () => ({
        data: [],
        meta: { pagination: { page: 1, pageSize: 100, pageCount: 0, total: 0 } },
      })),
    );
    await page.goto('/co/form');
    await expect(page.getByRole('alert')).toHaveText('El formulario no está disponible por ahora.');
    await expect(page.getByRole('button', { name: CO.texts.continue })).toHaveCount(0);
  });

  test('AC-01.20 no field with role "birthDate" shows the generic error and logs a warning', async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        body.data = (body.data as FieldDto[]).filter((f) => f.role !== 'birthDate');
      }),
    );
    await page.goto('/co/form');
    await expect(page.getByRole('alert')).toHaveText(CO.texts.genericError);
    await expect(page.getByRole('button', { name: CO.texts.continue })).toHaveCount(0);
    expect(warnings.length).toBeGreaterThan(0);
  });

  test('AC-01.25 a field with an unknown type and another without label are skipped with warnings', async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const fields = body.data as FieldDto[];
        fields.find((f) => f.key === 'co_city')!.type = 'slider';
        fields.find((f) => f.key === 'co_plate')!.label = '';
      }),
    );
    await page.goto('/co/form');
    await expect(page.getByLabel(CO.labels.documentNumber)).toBeVisible();
    await expect(page.locator('#f-co_city')).toHaveCount(0);
    await expect(page.locator('#f-co_plate')).toHaveCount(0);
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    // The rest of the form works: continue reaches step 2.
    await page.getByLabel(CO.labels.documentType).selectOption('cc');
    await page.getByLabel(CO.labels.documentNumber).fill(CO.data.documentNumber);
    await page.getByLabel(CO.labels.birthDate).fill(CO.data.birthDate);
    await page.getByLabel(CO.labels.dataConsent).check();
    await page.getByLabel(CO.labels.make).selectOption('make_a');
    await page.getByLabel(CO.labels.vehicleYear).fill('2018');
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/plans$/);
  });
});

test.describe('Step 2 and 3 missing texts and terms', () => {
  test('AC-02.33 a missing continue text of the plans step shows the generic error and no plans', async ({
    page,
  }) => {
    await page.route(isCountryConfig('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as CountryDto[])[0].plansStepTexts.continueLabel = '';
      }),
    );
    await page.goto('/co/form');
    await fillCoStep1(page);
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(page.getByRole('alert')).toHaveText(CO.texts.genericError);
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.getByRole('button')).toHaveCount(0);
  });

  test('AC-02.33 a missing plans text and a missing generic message show "error de carga" and "reintentar"', async ({
    page,
  }) => {
    await goToCoPlans(page);
    await page.route(isCountryConfig('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const country = (body.data as CountryDto[])[0];
        country.plansStepTexts.continueLabel = '';
        country.wizardTexts.genericErrorMessage = '';
      }),
    );
    await page.reload();
    await expect(page.getByText('error de carga')).toBeVisible();
    await expect(page.getByRole('button', { name: 'reintentar' })).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
  });

  test('AC-03.16 the summary shows "cargando" while the terms have not arrived and pay is disabled', async ({
    page,
  }) => {
    await goToCoPlans(page);
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(isTerms('co'), async (route) => {
      await gate;
      await route.continue();
    });
    await planRadio(page, 'Plan Plus').check();
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(page.locator('.summary-terms').getByRole('status')).toHaveText('cargando');
    await expect(page.getByRole('button', { name: CO.texts.pay })).toBeDisabled();
    release();
    await expect(page.locator('.terms-region')).toContainText(CO.texts.termsStart);
  });

  test('AC-03.17 error loading the terms, retry shows them and they can be accepted; data kept', async ({
    page,
  }) => {
    let fail = true;
    await page.route(isTerms('co'), (route) =>
      fail ? route.fulfill({ status: 500, body: 'error' }) : route.continue(),
    );
    await goToCoPlans(page);
    await planRadio(page, 'Plan Plus').check();
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/summary$/);
    const terms = page.locator('.summary-terms');
    await expect(terms.getByRole('alert')).toHaveText('error de carga');
    await expect(page.getByRole('button', { name: CO.texts.pay })).toBeDisabled();
    await expect(page.locator('.summary-data')).toContainText(CO.data.maskedDocument);

    fail = false;
    await terms.getByRole('button', { name: 'reintentar' }).click();
    await expect(page.locator('.terms-region')).toContainText(CO.texts.termsStart);
    await page.getByRole('checkbox', { name: CO.texts.acceptTerms }).check();
    await expect(page.getByRole('button', { name: CO.texts.pay })).toBeEnabled();
  });

  test('AC-03.36 a missing label of the terms checkbox shows the generic error and pay disabled', async ({
    page,
  }) => {
    await goToCoSummary(page);
    await page.route(isCountryConfig('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as CountryDto[])[0].summaryStepTexts.acceptTermsLabel = '';
      }),
    );
    await page.reload();
    await expect(heading(page)).toHaveText(CO.summaryTitle);
    await expect(page.locator('.summary-terms').getByRole('alert')).toHaveText(CO.texts.genericError);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('button', { name: CO.texts.pay })).toBeDisabled();
  });

  test('AC-03.21 an optional field unpublished after step 1 is not shown in the summary', async ({
    page,
  }) => {
    // Seed fields are all required; the scenario adds an optional field, fills it, then removes it.
    let published = true;
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        if (!published) return;
        (body.data as unknown[]).push({
          id: 9400,
          documentId: 'e2eoptional0000000000001',
          key: 'co_nickname',
          label: 'Apodo',
          type: 'text',
          required: false,
          helpText: null,
          errorMessage: null,
          order: 7,
          section: 'policyholder',
          role: null,
          options: [],
          validations: [],
        });
      }),
    );
    await page.goto('/co/form');
    await page.getByLabel('Apodo').fill('Pepe');
    await fillCoStep1(page);
    // The business unpublishes "Apodo"; the configuration is read again on reload.
    published = false;
    await page.reload();
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue(CO.data.documentNumber);
    await expect(page.getByLabel('Apodo')).toHaveCount(0);
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await planRadio(page, 'Plan Plus').check();
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(page.locator('.summary-data')).not.toContainText('Apodo');
    await expect(page.locator('.summary-data')).not.toContainText('Pepe');
    await expect(page.locator('.summary-data')).toContainText(CO.data.maskedDocument);
  });
});

test('AC-02.14 a Chilean plan with currency USD is not shown and the rest are in CLP', async ({ page }) => {
  await page.route(isPlans('cl'), (route) =>
    modifyRealResponse(route, (body) => {
      for (const plan of body.data as { name: string; currency: string }[]) {
        if (plan.name === 'Plan Máximo') plan.currency = 'USD';
      }
    }),
  );
  await page.goto('/cl/form');
  await fillClStep1(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.locator('.plan-name')).toHaveText(['Plan Básico', 'Plan Full']);
  await expect(page.locator('.plan', { has: page.getByText('Plan Full', { exact: true }) }).locator('.plan-price')).toHaveText('$38.985');
});
