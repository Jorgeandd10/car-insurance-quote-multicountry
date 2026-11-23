/**
 * Request-level failure of a CMS call (api-contracts §1): network error, timeout, non-2xx, body
 * that is not JSON or an unexpected global shape. Pages show "error de carga" + "reintentar".
 *
 * Messages only contain technical context (path, status), never user data (US-02 §7).
 */
export type CmsErrorKind = 'network' | 'http' | 'contract';

export class CmsRequestError extends Error {
  constructor(
    readonly kind: CmsErrorKind,
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'CmsRequestError';
  }
}

/** Throws a contract error: the response cannot be interpreted. */
export function contractError(message: string): CmsRequestError {
  return new CmsRequestError('contract', `[cms] ${message}`);
}

/**
 * Element-level problems are dropped by the mappers and reported here (api-contracts §1), so the
 * mappers stay pure and the warnings can be asserted in tests.
 */
export function logCmsWarnings(warnings: readonly string[]): void {
  for (const warning of warnings) {
    console.warn(warning);
  }
}
