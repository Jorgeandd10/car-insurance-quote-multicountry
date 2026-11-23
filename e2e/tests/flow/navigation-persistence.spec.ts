import {
  CL,
  CO,
  NBSP,
  expect,
  fillClStep1,
  fillCoStep1,
  goToCoPlans,
  goToCoSummary,
  heading,
  planRadio,
  test,
} from '../../support/fixtures';

/** Navigation, guards and `sessionStorage` per country (D6) against the seed. */
test.describe('Country resolution', () => {
  test('AC-01.5 the root lists the countries from Strapi and Chile opens /cl step 1', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Países disponibles' });
    await expect(nav.getByRole('link')).toHaveText(['Chile', 'Colombia']);
    await nav.getByRole('link', { name: 'Chile' }).click();
    await expect(page).toHaveURL(/\/cl\/form$/);
    await expect(heading(page)).toHaveText(CL.formTitle);
  });

  test('AC-01.6 an unknown code shows "país no disponible" with links; an uppercase code redirects', async ({
    page,
  }) => {
    await page.goto('/pe');
    await expect(page.getByText('país no disponible')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Colombia' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Chile' })).toBeVisible();

    await page.goto('/CO');
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(heading(page)).toHaveText(CO.formTitle);
  });
});

test.describe('Persistence and back navigation', () => {
  test('AC-01.4 AC-02.30 back from step 2 keeps step 1 data and the selection with the same price', async ({
    page,
  }) => {
    await goToCoPlans(page);
    await planRadio(page, 'Plan Total').check();
    await page.getByRole('button', { name: CO.texts.back }).click();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(page.getByLabel(CO.labels.documentType)).toHaveValue(CO.data.documentType);
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue(CO.data.documentNumber);
    await expect(page.getByLabel(CO.labels.birthDate)).toHaveValue(CO.data.birthDate);
    await expect(page.getByLabel(CO.labels.city)).toHaveValue(CO.data.city);
    await expect(page.getByLabel(CO.labels.dataConsent)).toBeChecked();
    await expect(page.getByLabel(CO.labels.plate)).toHaveValue(CO.data.plate);
    await expect(page.getByLabel(CO.labels.make)).toHaveValue(CO.data.make);
    await expect(page.getByLabel(CO.labels.vehicleYear)).toHaveValue(CO.data.vehicleYear);

    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(planRadio(page, 'Plan Total')).toBeChecked();
    await expect(planRadio(page, 'Plan Total')).toHaveAccessibleName(`Plan Total ${CO.prices['Plan Total']}`);
  });

  test('AC-01.21 a reload keeps step 1 data in the same tab and a new tab starts empty', async ({
    page,
    context,
  }) => {
    await page.goto('/co/form');
    await page.getByLabel(CO.labels.documentNumber).fill('99887766');
    await page.getByLabel(CO.labels.plate).fill('XYZ987');
    await page.reload();
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue('99887766');
    await expect(page.getByLabel(CO.labels.plate)).toHaveValue('XYZ987');

    const other = await context.newPage();
    await other.clock.setFixedTime(new Date('2026-11-22T17:00:00.000Z'));
    await other.goto('/co/form');
    await expect(other.getByLabel(CO.labels.documentNumber)).toHaveValue('');
    await expect(other.getByLabel(CO.labels.plate)).toHaveValue('');
    await other.close();
  });

  test('AC-01.22 AC-02.20 data and plan selection are separated by country', async ({ page }) => {
    await goToCoPlans(page);
    await planRadio(page, 'Plan Total').check();

    await page.goto('/cl/form');
    await expect(heading(page)).toHaveText(CL.formTitle);
    await expect(page.getByLabel(CL.labels.rut)).toHaveValue('');
    await expect(page.getByLabel(CL.labels.plate)).toHaveValue('');
    await fillClStep1(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/cl\/plans$/);
    await expect(page.getByRole('radio')).toHaveCount(3);
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);

    await page.goto('/co/plans');
    await expect(planRadio(page, 'Plan Total')).toBeChecked();
    await page.goto('/co/form');
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue(CO.data.documentNumber);
  });

  test('AC-02.19 the selected plan survives a reload', async ({ page }) => {
    await goToCoPlans(page);
    await planRadio(page, 'Plan Total').check();
    await page.reload();
    await expect(planRadio(page, 'Plan Total')).toBeChecked();
  });

  test('AC-02.16 AC-03.9 AC-03.10 edit data from the summary: full document, plan kept, new price, terms unchecked', async ({
    page,
  }) => {
    await goToCoSummary(page);
    await expect(page.locator('.summary-plan .final-price strong')).toHaveText(`$${NBSP}1.320.000`);
    await page.getByRole('checkbox', { name: CO.texts.acceptTerms }).check();

    await page.getByRole('button', { name: CO.texts.editData }).click();
    await expect(page).toHaveURL(/\/co\/form$/);
    // Full document, not masked (REQ-03.8).
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue(CO.data.documentNumber);
    // Vehicle 2018 → 2022: age 4, band 0–5, factor 1.00 → 1 200 000.
    await page.getByLabel(CO.labels.vehicleYear).fill('2022');
    await page.getByRole('button', { name: CO.texts.continue }).click();

    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(planRadio(page, 'Plan Plus')).toBeChecked();
    await expect(page.locator('.plan', { has: page.getByText('Plan Plus', { exact: true }) }).locator('.plan-price')).toHaveText(
      `$${NBSP}1.200.000`,
    );
    await page.getByRole('button', { name: CO.texts.continue }).click();

    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(page.locator('.summary-data')).toContainText('2022');
    await expect(page.locator('.summary-plan .plan-name')).toHaveText('Plan Plus');
    await expect(page.locator('.summary-plan .final-price strong')).toHaveText(`$${NBSP}1.200.000`);
    await expect(page.getByRole('checkbox', { name: CO.texts.acceptTerms })).not.toBeChecked();
    await expect(page.getByRole('button', { name: CO.texts.pay })).toBeDisabled();
  });

  test('AC-03.11 change plan from the summary keeps the data and shows the new plan and price', async ({
    page,
  }) => {
    await goToCoSummary(page);
    await page.getByRole('button', { name: CO.texts.changePlan }).click();
    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(planRadio(page, 'Plan Plus')).toBeChecked();
    await planRadio(page, 'Plan Esencial').check();
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(page.locator('.summary-plan .plan-name')).toHaveText('Plan Esencial');
    await expect(page.locator('.summary-plan .final-price strong')).toHaveText(`$${NBSP}935.000`);
    await expect(page.locator('.summary-data')).toContainText(CO.data.maskedDocument);
    await expect(page.locator('.summary-data')).toContainText(CO.data.plate);
  });
});

test.describe('Guards', () => {
  test('AC-03.18 direct summary URL without step 1 goes to step 1; with step 1 but no plan goes to step 2', async ({
    page,
  }) => {
    await page.goto('/co/summary');
    await expect(page).toHaveURL(/\/co\/form$/);
    await fillCoStep1(page);
    await page.goto('/co/summary');
    await expect(page).toHaveURL(/\/co\/plans$/);
  });

  test('AC-02.22 direct plans URL of Chile without step 1 data goes to step 1 without asking for plans', async ({
    page,
    requests,
  }) => {
    await page.goto('/cl/plans');
    await expect(page).toHaveURL(/\/cl\/form$/);
    expect(requests.filter((r) => r.url.pathname === '/api/plans')).toEqual([]);
  });

  test('AC-03.30 direct confirmation URL of Chile without payment goes to step 1', async ({ page }) => {
    await page.goto('/cl/confirmation');
    await expect(page).toHaveURL(/\/cl\/form$/);
  });

  test('AC-03.32 the summary URL of Chile after completing Colombia goes to an empty Chile step 1', async ({
    page,
  }) => {
    await goToCoSummary(page);
    await page.goto('/cl/summary');
    await expect(page).toHaveURL(/\/cl\/form$/);
    await expect(page.getByLabel(CL.labels.rut)).toHaveValue('');
  });
});
