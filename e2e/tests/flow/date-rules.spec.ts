import { CO, expect, fillCoStep1, test } from '../../support/fixtures';

/**
 * Date rules in the real browser with the clock fixed by Playwright (ADR-0007, T1). The context
 * time zone is America/Bogota (playwright.config.ts).
 */

const continueButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: CO.texts.continue });

test('AC-01.17 vehicle year limits on 2026-11-22: 2005 invalid, 2006 and 2027 valid, 2028 invalid', async ({
  page,
}) => {
  await page.goto('/co/form');
  await fillCoStep1(page);
  const year = page.getByLabel(CO.labels.vehicleYear);
  for (const [value, valid] of [
    ['2005', false],
    ['2028', false],
    ['2006', true],
    ['2027', true],
  ] as const) {
    await year.fill(value);
    await year.blur();
    if (valid) {
      await expect(year).not.toHaveAttribute('aria-invalid', 'true');
    } else {
      await continueButton(page).click();
      await expect(page).toHaveURL(/\/co\/form$/);
      await expect(year).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByText('Ingresa un año válido.')).toBeVisible();
    }
  }
  await continueButton(page).click();
  await expect(page).toHaveURL(/\/co\/plans$/);
});

test('AC-01.18 legal age on 2026-11-22: born 2008-11-23 invalid, 2008-11-22 valid', async ({ page }) => {
  await page.goto('/co/form');
  await fillCoStep1(page, { birthDate: '2008-11-23' });
  await continueButton(page).click();
  const birth = page.getByLabel(CO.labels.birthDate);
  await expect(page).toHaveURL(/\/co\/form$/);
  await expect(birth).toHaveAttribute('aria-invalid', 'true');
  await birth.fill('2008-11-22');
  await continueButton(page).click();
  await expect(page).toHaveURL(/\/co\/plans$/);
});

test('AC-01.19 at 20:00 of 2026-11-22 in Bogotá (01:00 UTC of the 23rd) 2008-11-23 is still under age and stored as typed', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-23T01:00:00.000Z'));
  await page.goto('/co/form');
  await fillCoStep1(page, { birthDate: '2008-11-23' });
  await continueButton(page).click();
  await expect(page).toHaveURL(/\/co\/form$/);
  await expect(page.getByLabel(CO.labels.birthDate)).toHaveAttribute('aria-invalid', 'true');
  const stored = await page.evaluate(() => sessionStorage.getItem('ciq.v1.co.step1'));
  expect(JSON.parse(stored!)).toMatchObject({ values: { co_birthDate: '2008-11-23' } });
});
