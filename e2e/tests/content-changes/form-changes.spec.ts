import {
  CO,
  CL,
  expect,
  fillCoStep1,
  heading,
  isCountryConfig,
  isFormFields,
  modifyRealResponse,
  test,
} from '../../support/fixtures';

/**
 * Configuration changes of step 1 without deployment (ADR-0007, project `content-changes`).
 * The test first loads the real seed, then simulates the published change by intercepting C4/C3
 * over the real response (route.fetch + route.fulfill) and reloads. The real change in the Strapi
 * admin is checked by hand in G5 (G3-3, docs/qa/manual-check.md).
 */

interface FieldDto {
  id: number;
  documentId: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  helpText: string | null;
  errorMessage: string | null;
  order: number | null;
  section: string;
  role: string | null;
  options: { id: number; value: string; label: string }[];
  validations: { id: number; kind: string; value: number | null; pattern: string | null }[];
}

const NEW_FIELD: FieldDto = {
  id: 9001,
  documentId: 'e2enewfield0000000000001',
  key: 'co_licenseNumber',
  label: 'Número de licencia de conducción',
  type: 'text',
  required: true,
  helpText: 'Tal como aparece en tu licencia.',
  errorMessage: 'Ingresa el número de tu licencia.',
  order: 6,
  section: 'policyholder',
  role: null,
  options: [],
  validations: [],
};

const fieldIds = (page: import('@playwright/test').Page) =>
  page.locator('form input, form select').evaluateAll((els) => els.map((el) => el.id));

test.describe('Step 1 configuration changes (interception of C3/C4)', () => {
  test('AC-01.3 a new published field appears after reload without code changes', async ({ page }) => {
    await page.goto('/co/form');
    await expect(heading(page)).toHaveText(CO.formTitle);
    await expect(page.getByLabel(NEW_FIELD.label)).toHaveCount(0);
    expect(await fieldIds(page)).toHaveLength(8);

    // The business publishes a new required field (policyholder, order 6).
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as FieldDto[]).push(NEW_FIELD);
      }),
    );
    await page.reload();

    const input = page.getByLabel(NEW_FIELD.label);
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveAccessibleDescription(NEW_FIELD.helpText!);
    // In its configured place: after the consent (order 5) and before the vehicle section.
    expect(await fieldIds(page)).toEqual([
      'f-co_documentType',
      'f-co_documentNumber',
      'f-co_birthDate',
      'f-co_city',
      'f-co_dataConsent',
      'f-co_licenseNumber',
      'f-co_plate',
      'f-co_make',
      'f-co_vehicleYear',
    ]);

    // It takes part in the validation: empty + required → its message, no advance.
    await fillCoStep1(page);
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(page.getByText(NEW_FIELD.errorMessage!)).toBeVisible();
    await expect(input).toBeFocused();
    await input.fill('LIC-778899');
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/plans$/);
  });

  test('AC-01.10 a field removed and two fields reordered are reflected after reload', async ({
    page,
  }) => {
    await page.goto('/co/form');
    await expect(page.getByLabel(CO.labels.city)).toBeVisible();

    // Unpublish "city" (A) and swap the order of "plate" (B, 1) and "make" (C, 2).
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const fields = (body.data as FieldDto[]).filter((f) => f.key !== 'co_city');
        for (const f of fields) {
          if (f.key === 'co_plate') f.order = 2;
          else if (f.key === 'co_make') f.order = 1;
        }
        body.data = fields;
      }),
    );
    await page.reload();

    await expect(page.getByLabel(CO.labels.make)).toBeVisible();
    await expect(page.getByLabel(CO.labels.city)).toHaveCount(0);
    const ids = await fieldIds(page);
    expect(ids.indexOf('f-co_make')).toBeLessThan(ids.indexOf('f-co_plate'));
    expect(ids).not.toContain('f-co_city');
  });

  test('AC-01.11 the draft field of the seed is not shown and no request asks for drafts', async ({
    page,
    requests,
  }) => {
    await page.goto('/co/form');
    await expect(page.getByLabel(CO.labels.vehicleYear)).toBeVisible();
    await expect(page.getByText('Código de referido (borrador)')).toHaveCount(0);
    const c4 = requests.filter((r) => r.url.pathname === '/api/form-fields');
    expect(c4.length).toBeGreaterThan(0);
    for (const r of c4) {
      expect([...r.url.searchParams.keys()].some((k) => k === 'status' || k.includes('publicationFilter'))).toBe(false);
    }
  });

  test('AC-01.13 select options come from Strapi in order and a new option is offered after reload', async ({
    page,
  }) => {
    await page.goto('/co/form');
    const make = page.getByLabel(CO.labels.make);
    const labels = () =>
      make.locator('option').evaluateAll((els) => els.map((el) => el.textContent?.trim()).filter(Boolean));
    await expect.poll(labels).toEqual(['Marca A', 'Marca B']);

    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const field = (body.data as FieldDto[]).find((f) => f.key === 'co_make')!;
        field.options.push({ id: 9002, value: 'make_c', label: 'Marca C' });
      }),
    );
    await page.reload();
    await expect.poll(labels).toEqual(['Marca A', 'Marca B', 'Marca C']);
  });

  test('AC-01.31 the continue text of Chile changes after reload and Colombia is unchanged', async ({
    page,
  }) => {
    await page.route(isCountryConfig('cl'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as { formStepTexts: { continueLabel: string } }[])[0].formStepTexts.continueLabel =
          'Siguiente paso';
      }),
    );
    await page.goto('/cl/form');
    await expect(heading(page)).toHaveText(CL.formTitle);
    await expect(page.getByRole('button', { name: 'Siguiente paso' })).toBeVisible();

    await page.goto('/co/form');
    await expect(heading(page)).toHaveText(CO.formTitle);
    await expect(page.getByRole('button', { name: CO.texts.continue })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Siguiente paso' })).toHaveCount(0);
  });

  test('AC-01.35 an empty step text of Chile shows the generic error and no default text', async ({
    page,
  }) => {
    await page.route(isCountryConfig('cl'), (route) =>
      modifyRealResponse(route, (body) => {
        (body.data as { formStepTexts: { continueLabel: string } }[])[0].formStepTexts.continueLabel = '';
      }),
    );
    await page.goto('/cl/form');
    await expect(page.getByRole('alert')).toHaveText(CL.texts.genericError);
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.getByRole('button')).toHaveCount(0);
  });

  test('AC-01.24 a stored value that no longer meets a new pattern is kept and shows the error', async ({
    page,
  }) => {
    await page.goto('/co/form');
    await fillCoStep1(page, { plate: 'XYZ789' });
    // Stored: the business now requires plates that start with "A".
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const plate = (body.data as FieldDto[]).find((f) => f.key === 'co_plate')!;
        plate.validations = [{ id: 9003, kind: 'pattern', value: null, pattern: 'A[A-Za-z]{2}[0-9]{3}' }];
      }),
    );
    await page.reload();
    const plate = page.getByLabel(CO.labels.plate);
    await expect(plate).toHaveValue('XYZ789');
    await page.getByRole('button', { name: CO.texts.continue }).click();
    await expect(page).toHaveURL(/\/co\/form$/);
    await expect(plate).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Ingresa una placa válida (tres letras y tres números).')).toBeVisible();
  });

  test('AC-01.23 a stored option removed in Strapi leaves the select empty', async ({ page }) => {
    await page.goto('/co/form');
    await fillCoStep1(page, { make: 'make_b' });
    await page.route(isFormFields('co'), (route) =>
      modifyRealResponse(route, (body) => {
        const make = (body.data as FieldDto[]).find((f) => f.key === 'co_make')!;
        make.options = make.options.filter((o) => o.value !== 'make_b');
      }),
    );
    await page.reload();
    await expect(page.getByLabel(CO.labels.make)).toHaveValue('');
    await expect(page.getByLabel(CO.labels.plate)).toHaveValue(CO.data.plate);
  });
});
