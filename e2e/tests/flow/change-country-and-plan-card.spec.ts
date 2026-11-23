import type { Page } from '@playwright/test';
import {
  CO,
  COUNTRY_SELECTION,
  QUOTE_NUMBER_CO,
  expect,
  fillCoStep1,
  goToCoPlans,
  heading,
  planRadio,
  test,
} from '../../support/fixtures';

/** Changes requested by the human after G5 (D14): US-01 v0.4 and US-02 v0.4, against the CO seed. */

const changeCountryLink = (page: Page) => page.getByRole('link', { name: CO.texts.changeCountry });

/** Plan card (`.plan`) whose name is exactly `planName`. */
const planCard = (page: Page, planName: string) =>
  page.locator('.plan', { has: page.getByText(planName, { exact: true }) });

/** The path of the current URL is exactly `/` (the country selection). */
const isRoot = (url: URL) => url.pathname === '/';

/**
 * Real pointer click in the centre of `target`. The plan `label` covers the whole card with a
 * `::after` (REQ-02.34), so `locator.click()` refuses because the label intercepts the pointer;
 * `page.mouse.click()` sends the click where a user would, without `force: true`.
 */
async function mouseClickCentre(page: Page, target: ReturnType<Page['locator']>): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  expect(box, 'target has a bounding box').not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

test.describe('D14 change country link (US-01)', () => {
  test('AC-01.36 the "change country" link goes back to the country selection and the step 1 data is kept', async ({
    page,
  }) => {
    await page.goto('/co/form');
    await expect(heading(page)).toHaveText(CO.formTitle);
    await fillCoStep1(page);

    // Visible link with the Strapi text, pointing to `/`, target of at least 24×24 px (REQ-01.36).
    const link = changeCountryLink(page);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/');
    const box = await link.boundingBox();
    expect(box, 'link has a bounding box').not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);

    // Activated with the keyboard (focus + Enter).
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');

    // Country selection.
    await expect(page).toHaveURL(isRoot);
    const nav = page.getByRole('navigation', { name: COUNTRY_SELECTION.countryListLabel });
    await expect(nav.getByRole('link')).toHaveText([...COUNTRY_SELECTION.countries]);

    // Back to Colombia: the step 1 data is still there (D6).
    await nav.getByRole('link', { name: 'Colombia' }).click();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(heading(page)).toHaveText(CO.formTitle);
    const l = CO.labels;
    const d = CO.data;
    await expect(page.getByLabel(l.documentType)).toHaveValue(d.documentType);
    await expect(page.getByLabel(l.documentNumber)).toHaveValue(d.documentNumber);
    await expect(page.getByLabel(l.birthDate)).toHaveValue(d.birthDate);
    await expect(page.getByLabel(l.city)).toHaveValue(d.city);
    await expect(page.getByLabel(l.dataConsent)).toBeChecked();
    await expect(page.getByLabel(l.plate)).toHaveValue(d.plate);
    await expect(page.getByLabel(l.make)).toHaveValue(d.make);
    await expect(page.getByLabel(l.vehicleYear)).toHaveValue(d.vehicleYear);
  });

  test('AC-01.36 the "change country" link is on the plans, summary and confirmation screens', async ({
    page,
  }) => {
    // Plans.
    await goToCoPlans(page);
    await expect(changeCountryLink(page)).toBeVisible();
    await expect(changeCountryLink(page)).toHaveAttribute('href', '/');

    // Summary.
    await planRadio(page, CO.recommended).check();
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(heading(page)).toHaveText(CO.summaryTitle);
    await expect(changeCountryLink(page)).toBeVisible();
    await expect(changeCountryLink(page)).toHaveAttribute('href', '/');

    // Confirmation (approved payment, the default of the simulated gateway).
    const accept = page.getByRole('checkbox', { name: CO.texts.acceptTerms });
    await expect(accept).toBeEnabled();
    await accept.check();
    await page.getByRole('button', { name: CO.texts.pay }).click();
    await expect(page).toHaveURL(/\/co\/confirmation$/);
    await expect(heading(page)).toHaveText(CO.confirmationTitle);
    await expect(page.locator('.quote-number')).toHaveText(QUOTE_NUMBER_CO);
    await expect(changeCountryLink(page)).toBeVisible();

    // From the confirmation it also leads to the country selection.
    await changeCountryLink(page).click();
    await expect(page).toHaveURL(isRoot);
    await expect(
      page.getByRole('navigation', { name: COUNTRY_SELECTION.countryListLabel }).getByRole('link'),
    ).toHaveText([...COUNTRY_SELECTION.countries]);
  });
});

test.describe('D14 whole plan card selects the plan (US-02)', () => {
  test('AC-02.34 clicking anywhere on a plan card selects the plan', async ({ page }) => {
    await goToCoPlans(page);
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);

    // Click on an item of the coverages list of "Plan Total" (scenario of AC-02.34).
    const total = planCard(page, 'Plan Total');
    const coverage = total
      .getByRole('list', { name: CO.texts.coveragesHeading })
      .getByRole('listitem')
      .filter({ hasText: /^\s*Pérdida total y parcial por daños\s*$/ });
    await expect(coverage).toBeVisible();
    await mouseClickCentre(page, coverage);

    await expect(planRadio(page, 'Plan Total')).toBeChecked();
    await expect(total).toHaveClass(/plan--selected/);
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);

    // Another area of another card (the short description of "Plan Esencial") moves the selection.
    const essential = planCard(page, 'Plan Esencial');
    await mouseClickCentre(page, essential.locator('.plan-description'));
    await expect(planRadio(page, 'Plan Esencial')).toBeChecked();
    await expect(planRadio(page, 'Plan Total')).not.toBeChecked();
    await expect(essential).toHaveClass(/plan--selected/);

    // Still the native radio: the selection goes on to the summary as usual.
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(page.locator('.summary-plan .plan-name')).toHaveText('Plan Esencial');
  });
});
