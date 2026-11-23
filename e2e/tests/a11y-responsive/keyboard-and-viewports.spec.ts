import type { Page } from '@playwright/test';
import {
  CO,
  expect,
  expectNoHorizontalScroll,
  fillCoStep1,
  goToCoPlans,
  goToCoSummary,
  heading,
  planRadio,
  test,
} from '../../support/fixtures';

/**
 * Keyboard, accessible names and viewports (ADR-0007, project `a11y-responsive`). These are the
 * gaps that jsdom cannot cover (docs/qa/phase-4-implementation-notes.md, "Pendiente para la Fase 5").
 */

test.describe('Keyboard', () => {
  test('AC-01.27 pressing Enter in a text field submits step 1 and moves to step 2', async ({
    page,
  }) => {
    await page.goto('/co/form');
    await fillCoStep1(page);
    // Focus back on a text field (plate) and press Enter: implicit submission of the form.
    await page.getByLabel(CO.labels.plate).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(heading(page)).toHaveText(CO.plansTitle);
    await expect(heading(page)).toBeFocused();
  });

  test('AC-01.27 AC-01.16 Enter in a text field with invalid fields stays on step 1 and focuses the first invalid field', async ({
    page,
  }) => {
    await page.goto('/co/form');
    await page.getByLabel(CO.labels.documentType).selectOption('cc');
    await page.getByLabel(CO.labels.documentNumber).fill('12AB'); // pattern [0-9]{6,10}
    await page.getByLabel(CO.labels.plate).fill('ABC123');
    await page.getByLabel(CO.labels.plate).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/co\/form$/);
    // Second field on screen is the first invalid one.
    await expect(page.getByLabel(CO.labels.documentNumber)).toBeFocused();
    await expect(page.getByText('Ingresa un número de documento válido.')).toBeVisible();
  });
});

test.describe('Accessible names and errors', () => {
  test('AC-01.26 AC-01.2 AC-01.14 AC-01.33 every control by its label, help text and errors referenced, sections as named groups', async ({
    page,
  }) => {
    await page.goto('/co/form');
    // The visible "*" is aria-hidden: the accessible name is exactly the Strapi label.
    for (const [key, label] of Object.entries(CO.labels)) {
      await expect(page.getByLabel(label)).toHaveCount(1);
      await expect(page.locator(`#f-co_${key}`)).toHaveAccessibleName(label);
    }
    await expect(page.getByRole('group', { name: 'Datos del asegurado' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Datos del vehículo' })).toBeVisible();
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveAccessibleDescription(
      'Solo números, sin puntos ni espacios (6 a 10 dígitos).',
    );

    // Required text with only spaces, required checkbox unchecked → configured messages, stay.
    await page.getByLabel(CO.labels.documentNumber).fill('   ');
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/form$/);
    const doc = page.getByLabel(CO.labels.documentNumber);
    await expect(doc).toHaveAttribute('aria-invalid', 'true');
    await expect(doc).toHaveAccessibleDescription(/Ingresa un número de documento válido\./);
    const consent = page.getByLabel(CO.labels.dataConsent);
    await expect(consent).toHaveAttribute('aria-invalid', 'true');
    await expect(consent).toHaveAccessibleDescription('Debes autorizar el tratamiento de datos para continuar.');
    // First invalid field on screen gets the focus (document type).
    await expect(page.getByLabel(CO.labels.documentType)).toBeFocused();
  });

  test('AC-02.18 AC-02.17 continue without a plan shows the configured message and focuses the group; a new choice replaces the old one', async ({
    page,
  }) => {
    await goToCoPlans(page);
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/plans$/);
    await expect(page.getByRole('alert').filter({ hasText: CO.texts.choosePlan })).toBeVisible();
    await expect(planRadio(page, 'Plan Esencial')).toBeFocused();
    await expect(page.getByRole('group', { name: 'Planes disponibles' })).toHaveAccessibleDescription(
      CO.texts.choosePlan,
    );

    await planRadio(page, 'Plan Esencial').check();
    await planRadio(page, 'Plan Total').check();
    await expect(planRadio(page, 'Plan Total')).toBeChecked();
    await expect(planRadio(page, 'Plan Esencial')).not.toBeChecked();
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);
  });

  test('AC-02.27 each plan option is named with the plan, the recommended label and the price', async ({
    page,
  }) => {
    await goToCoPlans(page);
    await expect(page.getByRole('radio', { name: `Plan Plus Recomendado ${CO.prices['Plan Plus']}`, exact: true })).toHaveCount(1);
    await expect(page.getByRole('radio', { name: `Plan Esencial ${CO.prices['Plan Esencial']}`, exact: true })).toHaveCount(1);
  });
});

/** Every visible button, checkbox and radio measures at least 24×24 CSS px (WCAG 2.5.8). */
async function smallTargets(page: Page, scope: string): Promise<string[]> {
  return page.locator(scope).evaluate((root) => {
    const result: string[] = [];
    root.querySelectorAll('button, input[type="checkbox"], input[type="radio"]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      if (rect.width < 24 || rect.height < 24) {
        result.push(`${el.tagName.toLowerCase()}#${el.id || el.textContent?.trim()} ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`);
      }
    });
    return result;
  });
}

for (const width of [320, 375, 1280]) {
  test.describe(`Viewport ${width} px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test(`AC-01.28 step 1 has no horizontal scroll and every field and continue are usable at ${width} px`, async ({
      page,
    }) => {
      await page.goto('/co/form');
      await expect(heading(page)).toHaveText(CO.formTitle);
      await expectNoHorizontalScroll(page);
      for (const label of Object.values(CO.labels)) {
        const control = page.getByLabel(label);
        await control.scrollIntoViewIfNeeded();
        await expect(control).toBeInViewport();
      }
      await fillCoStep1(page);
      await page.getByRole('button', { name: CO.texts.continue }).click();
      await expect(page).toHaveURL(/\/co\/plans$/);
    });

    test(`AC-02.29 plans have no horizontal scroll and every plan, price and continue are reachable at ${width} px`, async ({
      page,
    }) => {
      await goToCoPlans(page);
      await expect(page.getByRole('radio')).toHaveCount(3);
      await expectNoHorizontalScroll(page);
      for (const name of CO.plans) {
        const price = page.locator('.plan', { has: page.getByText(name, { exact: true }) }).locator('.plan-price');
        await price.scrollIntoViewIfNeeded();
        await expect(price).toBeInViewport();
      }
      await page.getByRole('button', { name: CO.texts.continue }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: CO.texts.continue })).toBeInViewport();
    });

    test(`AC-03.35 summary, payment and confirmation have no horizontal scroll, terms scroll and targets are at least 24x24 at ${width} px`, async ({
      page,
    }) => {
      await goToCoSummary(page);
      await expectNoHorizontalScroll(page);
      // Terms readable and scrollable with the keyboard.
      const region = page.locator('.terms-region');
      await region.focus();
      const scroll = await region.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }));
      if (scroll.sh > scroll.ch) {
        await page.keyboard.press('PageDown');
        await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      }
      // Soft: a size defect is reported without hiding the rest of the scenario.
      expect.soft(await smallTargets(page, '.summary')).toEqual([]);

      await page.getByRole('checkbox', { name: CO.texts.acceptTerms }).check();
      await page.getByRole('button', { name: CO.texts.pay }).click();
      await expect(page).toHaveURL(/\/co\/confirmation$/);
      await expectNoHorizontalScroll(page);
    });
  });
}
