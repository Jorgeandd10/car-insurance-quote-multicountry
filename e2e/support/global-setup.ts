/**
 * ADR-0007: the e2e runs against `docker compose up`. Before any test, wait until nginx answers
 * `/api/countries` (Strapi may still be booting). Fails with a clear message instead of a timeout
 * in every test.
 */
export default async function globalSetup(): Promise<void> {
  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:8080';
  const deadline = Date.now() + 90_000;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseURL}/api/countries`);
      if (response.ok) {
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(
    `The stack is not ready at ${baseURL}/api/countries (${lastError}). Run "docker compose up -d" first.`,
  );
}
