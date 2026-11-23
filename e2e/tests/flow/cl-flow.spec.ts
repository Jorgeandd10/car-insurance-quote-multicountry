import {
  CL,
  CO,
  QUOTE_NUMBER_CL,
  expect,
  fillClStep1,
  heading,
  planRadio,
  test,
} from '../../support/fixtures';

/**
 * Short flow of Chile with the same build (D3): seed form with RUT and "Patente", CLP prices,
 * Chilean terms, masked RUT and confirmation. The RUT uses the seed pattern `[0-9]{7,8}-[0-9Kk]`
 * (no dots): the dotted example of AC-03.6 is pending G4 (F-03.2).
 */
test('AC-01.34 AC-02.5 AC-02.8 AC-03.6 AC-03.32 CL form → plans in CLP → summary with masked RUT and Chilean terms → confirmation', async ({
  page,
}) => {
  await page.goto('/cl');
  await expect(page).toHaveURL(/\/cl\/form$/);
  await expect(heading(page)).toHaveText(CL.formTitle);

  // AC-01.34: document, "Patente", make and city selects, birth date, vehicle year; all 5 types.
  const types = await page.locator('form input, form select').evaluateAll((els) =>
    els.map((el) => (el.tagName === 'SELECT' ? 'select' : (el as HTMLInputElement).type)),
  );
  expect(new Set(types)).toEqual(new Set(['text', 'number', 'select', 'date', 'checkbox']));
  await expect(page.getByLabel(CL.labels.rut)).toBeVisible();
  await expect(page.getByLabel(CL.labels.plate)).toBeVisible();
  await expect(page.getByLabel('Placa')).toHaveCount(0);

  await fillClStep1(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page).toHaveURL(/\/cl\/plans$/);

  // AC-02.5: only Chilean active and published plans (no inactive, draft or Colombian plan).
  await expect(page.locator('.plan-name')).toHaveText([...CL.plans]);
  for (const name of [...CO.plans, 'Plan Clásico']) {
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  }
  // AC-02.8 / E4: CLP without separator after "$" and without decimals.
  const fullPrice = page.locator('.plan', { has: page.getByText('Plan Full', { exact: true }) }).locator('.plan-price');
  await expect(fullPrice).toHaveText('$38.985');
  await expect(page.locator('.plan--recommended .plan-name')).toHaveText([CL.recommended]);

  await planRadio(page, 'Plan Full').check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page).toHaveURL(/\/cl\/summary$/);

  // AC-03.6 (seed format): masked RUT, full value nowhere in the DOM.
  await expect(page.locator('.summary-data')).toContainText(CL.data.maskedRut);
  expect(await page.content()).not.toContain(CL.data.rut);
  // AC-03.32: Chilean terms, not the Colombian ones.
  await expect(page.locator('.terms-region')).toContainText(CL.texts.termsStart);
  await expect(page.locator('.terms-region')).not.toContainText(CO.texts.termsStart);
  await expect(page.locator('.summary-plan .final-price strong')).toHaveText('$38.985');

  await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones' }).check();
  await page.getByRole('button', { name: 'Pagar' }).click();
  await expect(page).toHaveURL(/\/cl\/confirmation$/);
  await expect(page.locator('.quote-number')).toHaveText(QUOTE_NUMBER_CL);
  await expect(page.locator('.confirmation')).toContainText('$38.985');
});
