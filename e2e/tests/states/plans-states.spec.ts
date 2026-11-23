import {
  CO,
  expect,
  fillCoStep1,
  goToCoPlans,
  heading,
  isPlans,
  modifyRealResponse,
  test,
} from '../../support/fixtures';

/**
 * States of step 2 by interception of C5 (ADR-0007, project `states`). The real response is
 * fetched through nginx and only the data of the scenario is changed (G3-3: no write to Strapi).
 */
test.describe('Plans step states (interception)', () => {
  test('AC-02.4 no active plans for the country shows the configured "no plans" message', async ({
    page,
  }) => {
    // The business deactivated every plan: the real C5 response with no element left.
    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, () => ({
        data: [],
        meta: { pagination: { page: 1, pageSize: 100, pageCount: 0, total: 0 } },
      })),
    );
    await goToCoPlans(page);

    const message = page.getByRole('alert').filter({ hasText: CO.texts.emptyPlans });
    await expect(message).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.locator('.plan-price')).toHaveCount(0);
    // No continue; back to step 1 is kept (REQ-02.22).
    await expect(page.getByRole('button', { name: CO.texts.continue })).toHaveCount(0);
    await page.getByRole('button', { name: CO.texts.back }).click();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(page.getByLabel(CO.labels.documentNumber)).toHaveValue(CO.data.documentNumber);
  });

  test('AC-02.4 plans present but all inactive (active=false) are discarded and the message is shown', async ({
    page,
  }) => {
    // Defence in depth of the mapper: even if Strapi returned them, inactive plans are not shown.
    await page.route(isPlans('co'), (route) =>
      modifyRealResponse(route, (body) => {
        for (const plan of body.data as { active: boolean }[]) {
          plan.active = false;
        }
      }),
    );
    await goToCoPlans(page);
    await expect(page.getByRole('alert').filter({ hasText: CO.texts.emptyPlans })).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
  });

  test('AC-02.23 loading state while the plan request has not answered', async ({ page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(isPlans('co'), async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('/co/form');
    await fillCoStep1(page);
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/plans$/);

    await expect(page.getByRole('status')).toHaveText('cargando');
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.getByRole('button', { name: CO.texts.continue })).toHaveCount(0);

    release();
    await expect(page.getByRole('radio')).toHaveCount(3);
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('AC-02.24 error loading plans, then retry lists the plans', async ({ page }) => {
    let fail = true;
    await page.route(isPlans('co'), (route) =>
      fail ? route.fulfill({ status: 500, json: { data: null, error: { status: 500 } } }) : route.continue(),
    );
    await goToCoPlans(page);

    await expect(page.getByRole('alert')).toHaveText('error de carga');
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.locator('.plan-price')).toHaveCount(0);
    await expect(page.getByRole('button', { name: CO.texts.continue })).toHaveCount(0);

    fail = false;
    await page.getByRole('button', { name: 'reintentar' }).click();
    await expect(page.getByRole('radio')).toHaveCount(3);
    await expect(heading(page)).toHaveText(CO.plansTitle);
  });
});
