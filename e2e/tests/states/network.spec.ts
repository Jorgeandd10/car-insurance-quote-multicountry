import { CO, expect, goToCoSummary, test } from '../../support/fixtures';

/**
 * Explicit, named check of the network rules (the `networkGuard` fixture applies the same rules
 * to every test of the suite): read-only GET through the nginx proxy, no Authorization header,
 * no draft parameters, nothing sent to Strapi directly (127.0.0.1:1337) nor to third parties.
 */
test('AC-01.30 AC-02.31 every content request of the three steps is a GET through the proxy without Authorization', async ({
  page,
  requests,
  baseURL,
}) => {
  await page.goto('/cl/form');
  await expect(page.getByLabel('RUT')).toBeVisible();
  await goToCoSummary(page);
  await page.getByRole('checkbox', { name: CO.texts.acceptTerms }).check();
  await page.getByRole('button', { name: CO.texts.pay }).click();
  await expect(page).toHaveURL(/\/co\/confirmation$/);

  const api = requests.filter((r) => r.url.pathname.startsWith('/api/'));
  const paths = new Set(api.map((r) => r.url.pathname));
  // C1–C7 of api-contracts.md that this journey uses.
  expect([...paths].sort()).toEqual(['/api/countries', '/api/form-fields', '/api/plans']);
  const origin = new URL(baseURL!).origin;
  for (const r of requests) {
    expect(r.url.origin, `${r.method} ${r.url.href}`).toBe(origin);
    expect(r.method).toBe('GET');
    const headers = await r.request.allHeaders();
    expect(Object.keys(headers)).not.toContain('authorization');
    expect(Object.keys(headers)).not.toContain('cookie');
  }
});
