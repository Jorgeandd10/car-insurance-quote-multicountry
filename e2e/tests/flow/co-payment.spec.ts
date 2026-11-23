import type { Page } from '@playwright/test';
import {
  CO,
  NBSP,
  QUOTE_NUMBER_CO,
  expect,
  goToCoSummary,
  heading,
  test,
} from '../../support/fixtures';

const payButton = (page: Page) => page.getByRole('button', { name: CO.texts.pay });
const acceptTerms = (page: Page) => page.getByRole('checkbox', { name: CO.texts.acceptTerms });
const rejectedAlert = (page: Page) =>
  page.getByRole('alert').filter({ hasText: CO.texts.rejectedMessage });

/**
 * Counts the attempts that reach the simulated gateway. `MockPaymentGateway.pay` starts exactly one
 * `setTimeout(…, 1500)` per attempt (REQ-03.24) and makes no request (REQ-03.20), so the only
 * observable trace of an attempt from outside is that timer. The wrapper only counts; it does not
 * change the behaviour of the app.
 */
async function countGatewayAttempts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = window.setTimeout;
    (window as unknown as { __paymentAttempts: number }).__paymentAttempts = 0;
    (window as unknown as { __payClicks: number }).__payClicks = 0;
    document.addEventListener(
      'click',
      (event) => {
        if (event.target instanceof Element && event.target.closest('button.pay')) {
          (window as unknown as { __payClicks: number }).__payClicks++;
        }
      },
      true,
    );
    window.setTimeout = function (handler: TimerHandler, timeout?: number, ...args: unknown[]) {
      if (timeout === 1500) {
        (window as unknown as { __paymentAttempts: number }).__paymentAttempts++;
      }
      return original.call(window, handler, timeout, ...args);
    } as typeof window.setTimeout;
  });
}

/** Click events that reached the pay button (to prove the repeated input really happened). */
const payClicks = (page: Page) =>
  page.evaluate(() => (window as unknown as { __payClicks: number }).__payClicks);

const attempts = (page: Page) =>
  page.evaluate(() => (window as unknown as { __paymentAttempts: number }).__paymentAttempts);

test.describe('CO summary and simulated payment', () => {
  test('AC-03.4 AC-03.26 AC-03.25 AC-03.34 rejected payment shows a clear message and the retry is approved without losing data', async ({
    page,
  }) => {
    await goToCoSummary(page);
    const price = `$${NBSP}1.320.000`;

    // Keyboard: Space on the checkbox, arrow to "rejected" in the gateway, Enter on pay.
    await acceptTerms(page).focus();
    await page.keyboard.press('Space');
    await expect(acceptTerms(page)).toBeChecked();
    await page.getByRole('radio', { name: CO.texts.approved }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: CO.texts.rejected })).toBeChecked();
    await payButton(page).focus();
    await page.keyboard.press('Enter');

    // Processing announced in an aria-live region (AC-03.34).
    await expect(page.locator('#pay-status')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#pay-status')).toHaveText(CO.texts.processing);

    // AC-03.26: rejection message from Strapi, announced as an alert, next to the pay button.
    await expect(rejectedAlert(page)).toBeVisible();
    await expect(payButton(page)).toHaveAccessibleDescription(new RegExp(CO.texts.rejectedMessage));
    // Still on the summary with data, plan, price and accepted terms intact; pay enabled again.
    await expect(page).toHaveURL(/\/co\/summary$/);
    await expect(heading(page)).toHaveText(CO.summaryTitle);
    await expect(page.locator('.summary-data')).toContainText(CO.data.maskedDocument);
    await expect(page.locator('.summary-data')).toContainText(CO.data.plate);
    await expect(page.locator('.summary-plan .plan-name')).toHaveText(CO.recommended);
    await expect(page.locator('.summary-plan .final-price strong')).toHaveText(price);
    await expect(acceptTerms(page)).toBeChecked();
    await expect(payButton(page)).toBeEnabled();
    await expect(payButton(page)).not.toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#pay-status')).toHaveText('');

    // Retry: choose "approved" with the arrows, pay again with Enter.
    await page.getByRole('radio', { name: CO.texts.rejected }).focus();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('radio', { name: CO.texts.approved })).toBeChecked();
    await payButton(page).focus();
    await page.keyboard.press('Enter');
    // The rejection message is removed when the new attempt starts.
    await expect(page.locator('#pay-status')).toHaveText(CO.texts.processing);
    await expect(rejectedAlert(page)).toHaveCount(0);

    await expect(page).toHaveURL(/\/co\/confirmation$/);
    await expect(heading(page)).toBeFocused();
    await expect(page.locator('.quote-number')).toHaveText(QUOTE_NUMBER_CO);
    await expect(page.locator('.confirmation')).toContainText(price);
  });

  test('AC-03.12 unchecking the terms disables pay again', async ({ page }) => {
    await goToCoSummary(page);
    await expect(payButton(page)).toBeDisabled();
    await acceptTerms(page).check();
    await expect(payButton(page)).toBeEnabled();
    await acceptTerms(page).uncheck();
    await expect(payButton(page)).toBeDisabled();
  });

  test('AC-03.24 the summary has no card or bank fields and payments make no non-GET request', async ({
    page,
    requests,
  }) => {
    await goToCoSummary(page);
    // Only the terms checkbox and the two outcome radios are inputs; no text inputs at all.
    await expect(page.locator('input[type="text"], input[type="number"], input[type="tel"], input[type="password"]')).toHaveCount(0);
    await expect(page.locator('[autocomplete^="cc-"]')).toHaveCount(0);
    await expect(page.getByText(/tarjeta|cvv|cuenta bancaria/i)).toHaveCount(0);

    const before = requests.length;
    await acceptTerms(page).check();
    await page.getByRole('radio', { name: CO.texts.rejected }).check();
    await payButton(page).click();
    await expect(rejectedAlert(page)).toBeVisible();
    await page.getByRole('radio', { name: CO.texts.approved }).check();
    await payButton(page).click();
    await expect(page).toHaveURL(/\/co\/confirmation$/);
    const duringPayment = requests.slice(before);
    expect(duringPayment.filter((r) => r.method !== 'GET')).toEqual([]);
    // The network guard fixture also checks every request of the test (GET only, no Authorization).
  });

  test('AC-03.22 double click on pay starts exactly one payment attempt', async ({ page }) => {
    await countGatewayAttempts(page);
    await goToCoSummary(page);
    await acceptTerms(page).check();
    await page.getByRole('radio', { name: CO.texts.rejected }).check();
    await payButton(page).dblclick();
    await expect(rejectedAlert(page)).toBeVisible();
    expect(await payClicks(page)).toBeGreaterThanOrEqual(2);
    expect(await attempts(page)).toBe(1);
  });

  test('AC-03.22 holding Enter on pay starts exactly one payment attempt', async ({ page }) => {
    await countGatewayAttempts(page);
    await goToCoSummary(page);
    await acceptTerms(page).check();
    await page.getByRole('radio', { name: CO.texts.rejected }).check();
    await payButton(page).focus();
    // Held key: the first keydown and then auto-repeated keydowns (repeat=true) before keyup.
    await page.keyboard.down('Enter');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.down('Enter');
    }
    await page.keyboard.up('Enter');
    await expect(rejectedAlert(page)).toBeVisible();
    expect(await payClicks(page)).toBeGreaterThanOrEqual(2);
    expect(await attempts(page)).toBe(1);
  });

  test('AC-03.22 AC-03.23 Enter and then a click before the end start exactly one attempt and lock the controls', async ({
    page,
  }) => {
    await countGatewayAttempts(page);
    await goToCoSummary(page);
    await acceptTerms(page).check();
    await page.getByRole('radio', { name: CO.texts.rejected }).check();
    await payButton(page).focus();
    await page.keyboard.press('Enter');

    // AC-03.23: while processing, pay is busy and the other controls are disabled.
    await expect(payButton(page)).toHaveAttribute('aria-busy', 'true');
    await expect(acceptTerms(page)).toBeDisabled();
    await expect(page.getByRole('radio', { name: CO.texts.approved })).toBeDisabled();
    await expect(page.getByRole('radio', { name: CO.texts.rejected })).toBeDisabled();
    await expect(page.getByRole('button', { name: CO.texts.editData })).toBeDisabled();
    await expect(page.getByRole('button', { name: CO.texts.changePlan })).toBeDisabled();

    // A real pointer click on the button while it is aria-disabled (no actionability wait).
    const box = await payButton(page).boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(rejectedAlert(page)).toBeVisible();
    expect(await payClicks(page)).toBeGreaterThanOrEqual(2);
    expect(await attempts(page)).toBe(1);
    // When the simulated duration ends, the controls leave the processing state.
    await expect(payButton(page)).not.toHaveAttribute('aria-busy', 'true');
    await expect(acceptTerms(page)).toBeEnabled();
    await expect(page.getByRole('button', { name: CO.texts.editData })).toBeEnabled();
  });

  test('AC-03.28 AC-03.31 reloading the confirmation keeps the number without the document; new quote opens an empty step 1', async ({
    page,
  }) => {
    await goToCoSummary(page);
    await acceptTerms(page).check();
    await payButton(page).click();
    await expect(page).toHaveURL(/\/co\/confirmation$/);
    const number = (await page.locator('.quote-number').textContent())!.trim();
    expect(number).toMatch(QUOTE_NUMBER_CO);

    await page.reload();
    await expect(page.locator('.quote-number')).toHaveText(number);
    const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage }));
    expect(stored).not.toContain(CO.data.documentNumber);
    expect(stored).not.toContain(CO.data.plate);
    // AC-03.31: no personal data nor document on the confirmation.
    const content = await page.content();
    expect(content).not.toContain(CO.data.documentNumber);
    expect(content).not.toContain(CO.data.maskedDocument);
    expect(content).not.toContain(CO.data.plate);

    await page.getByRole('button', { name: CO.texts.newQuote }).click();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue('');
    await expect(page.getByLabel(CO.labels.documentType)).toHaveValue('');
    await expect(page.getByLabel(CO.labels.dataConsent)).not.toBeChecked();
    expect(await page.evaluate(() => sessionStorage.getItem('ciq.v1.co.confirmation'))).toBeNull();
  });

  test('AC-03.29 browser back after a successful payment does not allow paying again', async ({
    page,
  }) => {
    await goToCoSummary(page);
    await acceptTerms(page).check();
    await payButton(page).click();
    await expect(page).toHaveURL(/\/co\/confirmation$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(heading(page)).toHaveText(CO.formTitle);
    await expect(payButton(page)).toHaveCount(0);
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue('');
    await expect(page.getByLabel(CO.labels.plate)).toHaveValue('');

    // Opening the summary URL directly also goes to the empty step 1.
    await page.goto('/co/summary');
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(payButton(page)).toHaveCount(0);
  });
});
