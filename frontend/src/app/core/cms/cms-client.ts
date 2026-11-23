import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CmsRequestError, contractError } from './cms-error';
import { CmsQuery } from './cms-queries';
import { UnknownRecord, isRecord } from './strapi-dto';

/** Same-origin base: nginx proxies `/api` to Strapi with a GET-only allowlist (ADR-0003). */
export const CMS_BASE_URL = '/api';
/** Timeout per request (ADR-0004, REQ-02.21). */
export const CMS_TIMEOUT_MS = 10_000;

export type CmsCollectionPath = 'countries' | 'form-fields' | 'plans';
export type CmsSinglePath = 'country-selection';

export interface CollectionPage {
  readonly data: readonly unknown[];
  readonly pageCount: number;
}

/**
 * Global shape of a collection response: `data` must be an array (api-contracts §1). A missing
 * or malformed `meta.pagination.pageCount` is read as a single page.
 */
export function parseCollectionEnvelope(body: unknown, path: string): CollectionPage {
  if (!isRecord(body) || !Array.isArray(body['data'])) {
    throw contractError(`unexpected collection shape for ${path}`);
  }
  const meta = body['meta'];
  const pagination = isRecord(meta) ? meta['pagination'] : undefined;
  const pageCount = isRecord(pagination) ? pagination['pageCount'] : undefined;
  return {
    data: body['data'],
    pageCount:
      typeof pageCount === 'number' && Number.isInteger(pageCount) && pageCount > 1 ? pageCount : 1,
  };
}

/** Global shape of a single-type response: `data` must be an object (api-contracts §1). */
export function parseSingleEnvelope(body: unknown, path: string): UnknownRecord {
  const data = isRecord(body) ? body['data'] : undefined;
  if (!isRecord(data)) {
    throw contractError(`unexpected single type shape for ${path}`);
  }
  return data;
}

/**
 * Read-only client for the public Strapi REST API (api-contracts §1, ADR-0004).
 *
 * - Only `GET`, relative `/api/...` URLs, no `Authorization` and no cookies (REQ-01.35, D4).
 * - 10 000 ms timeout per request.
 * - `findAll` walks every page in series when `pageCount > 1` (REQ-02.24).
 * - Any failure becomes a `CmsRequestError`, which pages show as "error de carga".
 * - Honours the `AbortSignal` of `resource()`: aborting cancels the HTTP request.
 */
@Injectable({ providedIn: 'root' })
export class CmsClient {
  private readonly http = inject(HttpClient);

  /** All pages of a collection, concatenated in order (C1, C4, C5). */
  async findAll(
    path: CmsCollectionPath,
    query: CmsQuery,
    signal?: AbortSignal,
  ): Promise<readonly unknown[]> {
    const first = parseCollectionEnvelope(
      await this.get(path, { ...query, 'pagination[page]': '1' }, signal),
      path,
    );
    const data = [...first.data];
    for (let page = 2; page <= first.pageCount; page++) {
      const next = parseCollectionEnvelope(
        await this.get(path, { ...query, 'pagination[page]': String(page) }, signal),
        path,
      );
      data.push(...next.data);
    }
    return data;
  }

  /** First page only (C3, C6, C7: `pageSize=2` is used to detect duplicates). */
  async findFirstPage(
    path: CmsCollectionPath,
    query: CmsQuery,
    signal?: AbortSignal,
  ): Promise<readonly unknown[]> {
    return parseCollectionEnvelope(await this.get(path, query, signal), path).data;
  }

  /** Single type (C2). A 404 (not published) is an HTTP error. */
  async findSingle(
    path: CmsSinglePath,
    query: CmsQuery,
    signal?: AbortSignal,
  ): Promise<UnknownRecord> {
    return parseSingleEnvelope(await this.get(path, query, signal), path);
  }

  private get(path: string, query: CmsQuery, signal?: AbortSignal): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      if (signal?.aborted) {
        reject(abortError());
        return;
      }
      const subscription = this.http
        .get<unknown>(`${CMS_BASE_URL}/${path}`, {
          params: new HttpParams({ fromObject: query }),
          timeout: CMS_TIMEOUT_MS,
        })
        .subscribe({
          next: (body) => resolve(body),
          error: (error: unknown) => reject(toCmsError(error, path)),
        });
      signal?.addEventListener(
        'abort',
        () => {
          subscription.unsubscribe();
          reject(abortError());
        },
        { once: true },
      );
    });
  }
}

function abortError(): DOMException {
  return new DOMException('CMS request aborted', 'AbortError');
}

function toCmsError(error: unknown, path: string): CmsRequestError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return new CmsRequestError('network', `[cms] network error or timeout on ${path}`, 0);
    }
    if (error.status >= 200 && error.status < 300) {
      // 2xx whose body could not be parsed as JSON.
      return new CmsRequestError('contract', `[cms] body is not JSON on ${path}`, error.status);
    }
    return new CmsRequestError('http', `[cms] HTTP ${error.status} on ${path}`, error.status);
  }
  return new CmsRequestError('network', `[cms] request failed on ${path}`);
}
