import {
  CO,
  NBSP,
  QUOTE_NUMBER_CO,
  expect,
  heading,
  planRadio,
  tabOutOfDate,
  tabTo,
  test,
} from '../../support/fixtures';

/**
 * Full flow of Colombia required by the PDF ("at least one end-to-end test of the full flow"),
 * done with the keyboard only: no click, no fill, no selectOption. Covers the PDF scenarios
 * of the three stories plus the keyboard ACs (AC-01.27, AC-02.26, AC-03.33).
 */
test.describe('CO full flow (keyboard only)', () => {
  test('AC-01.1 AC-01.27 AC-01.32 AC-02.1 AC-02.2 AC-02.3 AC-02.8 AC-02.9 AC-02.26 AC-02.28 AC-03.1 AC-03.2 AC-03.3 AC-03.5 AC-03.8 AC-03.25 AC-03.27 AC-03.33 AC-03.34 CO form → plans → summary → terms → approved payment → confirmation', async ({
    page,
  }) => {
    const l = CO.labels;
    const d = CO.data;

    // ---------------- Step 1 (US-01) ----------------
    await page.goto('/co');
    await expect(page).toHaveURL(/\/co\/form$/);
    // AC-01.27: focus on the step heading, step indicator marks step 1.
    await expect(heading(page)).toHaveText(CO.formTitle);
    await expect(heading(page)).toBeFocused();
    await expect(page.locator('[aria-current="step"]')).toContainText('Tus datos');

    // AC-01.1: only the CO fields, in the configured order (sections policyholder, vehicle).
    const controls = page.locator('form input, form select');
    const ids = await controls.evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual([
      'f-co_documentType',
      'f-co_documentNumber',
      'f-co_birthDate',
      'f-co_city',
      'f-co_dataConsent',
      'f-co_plate',
      'f-co_make',
      'f-co_vehicleYear',
    ]);

    // Keyboard: Tab through every control in order and fill it.
    await tabTo(page, page.getByLabel(l.documentType));
    await page.keyboard.press('ArrowDown'); // "" → cc
    await expect(page.getByLabel(l.documentType)).toHaveValue(d.documentType);

    await tabTo(page, page.getByLabel(l.documentNumber));
    await page.keyboard.type(d.documentNumber);

    await tabTo(page, page.getByLabel(l.birthDate));
    await page.keyboard.type('10052000'); // es-CO date input: dd mm yyyy
    await expect(page.getByLabel(l.birthDate)).toHaveValue(d.birthDate);

    await tabOutOfDate(page, page.getByLabel(l.birthDate), page.getByLabel(l.city));
    await page.keyboard.press('ArrowDown'); // "" → bogota
    await expect(page.getByLabel(l.city)).toHaveValue(d.city);

    await tabTo(page, page.getByLabel(l.dataConsent));
    await page.keyboard.press('Space');
    await expect(page.getByLabel(l.dataConsent)).toBeChecked();

    await tabTo(page, page.getByLabel(l.plate));
    await page.keyboard.type(d.plate);

    await tabTo(page, page.getByLabel(l.make));
    await page.keyboard.press('ArrowDown'); // "" → make_a
    await expect(page.getByLabel(l.make)).toHaveValue(d.make);

    await tabTo(page, page.getByLabel(l.vehicleYear));
    await page.keyboard.type(d.vehicleYear);

    // AC-01.32: continue (Tab to the button, Enter).
    await tabTo(page, page.getByRole('button', { name: CO.texts.continue }));
    await page.keyboard.press('Enter');

    // ---------------- Step 2 (US-02) ----------------
    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(heading(page)).toHaveText(CO.plansTitle);
    await expect(heading(page)).toBeFocused(); // AC-02.28
    await expect(page.locator('[aria-current="step"]')).toContainText('Planes');

    // AC-02.1: only active and published plans of CO, in the configured order.
    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(3);
    const names = await page.locator('.plan-name').allTextContents();
    expect(names.map((n) => n.trim())).toEqual([...CO.plans]);
    for (const hidden of CO.hiddenPlans) {
      await expect(page.getByText(hidden)).toHaveCount(0);
    }

    // AC-02.2: the recommended plan is distinguished visually and textually.
    const recommendedCard = page.locator('.plan', { has: page.getByText(CO.recommended, { exact: true }) });
    await expect(recommendedCard).toHaveClass(/plan--recommended/);
    await expect(recommendedCard.locator('.badge')).toHaveText(CO.texts.recommended);
    await expect(page.locator('.badge')).toHaveCount(1);

    // AC-02.8: COP without decimals, U+00A0 between "$" and the amount (exact string).
    const prices = (await page.locator('.plan-price').allTextContents()).map((p) => p.trim());
    expect(prices).toEqual(CO.plans.map((name) => CO.prices[name]));
    expect(prices[1]).toBe(`$${NBSP}1.320.000`);

    // AC-02.26: Tab to the group, arrow to Plan Plus, Space, Tab to continue, Enter.
    await tabTo(page, planRadio(page, 'Plan Esencial'));
    await page.keyboard.press('ArrowDown');
    await expect(planRadio(page, 'Plan Plus')).toBeFocused();
    await page.keyboard.press('Space');
    // AC-02.3: marked as chosen.
    await expect(planRadio(page, 'Plan Plus')).toBeChecked();
    await expect(planRadio(page, 'Plan Esencial')).not.toBeChecked();
    await expect(recommendedCard).toHaveClass(/plan--selected/);
    await tabTo(page, page.getByRole('button', { name: CO.texts.back }));
    await tabTo(page, page.getByRole('button', { name: CO.texts.continue }));
    await page.keyboard.press('Enter');

    // ---------------- Step 3 (US-03) ----------------
    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(heading(page)).toHaveText(CO.summaryTitle);
    await expect(heading(page)).toBeFocused(); // AC-03.34
    await expect(page.locator('[aria-current="step"]')).toContainText('Resumen y pago');

    // AC-03.1: data of the policyholder, of the vehicle and the chosen plan with its final price.
    const data = page.locator('.summary-data');
    await expect(data.getByRole('heading', { name: 'Datos del asegurado' })).toBeVisible();
    await expect(data.getByRole('heading', { name: 'Datos del vehículo' })).toBeVisible();
    const items = await data.locator('.item').evaluateAll((els) =>
      els.map((el) => [
        el.querySelector('dt')?.textContent?.trim(),
        el.querySelector('dd')?.textContent?.trim(),
      ]),
    );
    expect(items).toEqual([
      [l.documentType, d.documentTypeLabel],
      [l.documentNumber, d.maskedDocument],
      [l.birthDate, '10 de mayo de 2000'],
      [l.city, d.cityLabel],
      [l.dataConsent, 'Sí'],
      [l.plate, d.plate],
      [l.make, d.makeLabel],
      [l.vehicleYear, '2018'],
    ]);
    const plan = page.locator('.summary-plan');
    await expect(plan.locator('.plan-name')).toHaveText(CO.recommended);
    await expect(plan.locator('.final-price strong')).toHaveText(`$${NBSP}1.320.000`);

    // AC-03.5: document masked, type in clear, full value nowhere in the DOM.
    expect(await page.content()).not.toContain(d.documentNumber);
    const a11yTree = await page.locator('body').ariaSnapshot();
    expect(a11yTree).not.toContain(d.documentNumber);

    // AC-03.2: terms of CO from Strapi; pay disabled until accepted.
    // The scrollable region (the enclosing <section> carries the same accessible name).
    const terms = page
      .getByRole('region', { name: 'Términos y condiciones' })
      .and(page.locator('[tabindex="0"]'));
    await expect(terms).toContainText(CO.texts.termsStart);
    const payButton = page.getByRole('button', { name: CO.texts.pay });
    await expect(payButton).toBeDisabled();
    // AC-03.34: disabled pay button described by the hint.
    await expect(payButton).toHaveAccessibleDescription(CO.texts.acceptTermsHint);
    const accept = page.getByRole('checkbox', { name: CO.texts.acceptTerms });
    await expect(accept).not.toBeChecked();

    // AC-03.33: logical focus order — edit data, change plan, terms region, checkbox, outcome, pay.
    await tabTo(page, page.getByRole('button', { name: CO.texts.editData }));
    await tabTo(page, page.getByRole('button', { name: CO.texts.changePlan }));
    await tabTo(page, terms);
    // The terms region scrolls with the keyboard (it may not overflow at 1280 px; no error then).
    await page.keyboard.press('ArrowDown');
    await tabTo(page, accept);
    await page.keyboard.press('Space');
    await expect(accept).toBeChecked();
    await expect(payButton).toBeEnabled();

    // AC-03.25: "approved" is selected by default in the simulated gateway.
    const approved = page.getByRole('radio', { name: CO.texts.approved });
    await tabTo(page, approved);
    await expect(approved).toBeChecked();
    await tabTo(page, payButton);

    // AC-03.3: the button is locked while the payment is processed.
    await page.keyboard.press('Enter');
    await expect(payButton).toHaveAttribute('aria-disabled', 'true');
    await expect(payButton).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#pay-status')).toHaveText(CO.texts.processing);
    await expect(payButton).toBeFocused(); // AC-03.34: focus does not go to body.
    await expect(page.getByRole('checkbox', { name: CO.texts.acceptTerms })).toBeDisabled();

    // ---------------- Confirmation ----------------
    await expect(page).toHaveURL(/\/co\/confirmation$/);
    await expect(heading(page)).toHaveText(CO.confirmationTitle);
    await expect(heading(page)).toBeFocused();
    const quoteNumber = page.locator('.quote-number');
    await expect(quoteNumber).toHaveText(QUOTE_NUMBER_CO);
    await expect(page.getByText(CO.texts.quoteNumberLabel)).toBeVisible();
    const confirmation = page.locator('.confirmation');
    await expect(confirmation).toContainText(CO.recommended);
    await expect(confirmation).toContainText(`$${NBSP}1.320.000`);
    expect(await page.content()).not.toContain(d.documentNumber);
  });
});
