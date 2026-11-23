import { CmsQuery } from '../cms-queries';

/** One call received by the fake client. */
export interface CmsCall {
  readonly method: 'findAll' | 'findFirstPage' | 'findSingle';
  readonly path: string;
  readonly query: CmsQuery;
}

export type CmsHandler = (call: CmsCall) => Promise<unknown>;

export type CmsRequestId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7';

/** Which request of api-contracts §2 a call is. */
export function requestIdOf(call: CmsCall): CmsRequestId {
  switch (call.path) {
    case 'country-selection':
      return 'C2';
    case 'form-fields':
      return 'C4';
    case 'plans':
      return 'C5';
  }
  if (call.query['populate[0]'] === 'wizardTexts') {
    return 'C3';
  }
  if (call.query['populate[0]'] === 'priceFactors') {
    return 'C6';
  }
  return call.query['fields[1]'] === 'termsAndConditions' ? 'C7' : 'C1';
}

/** Country code of a filtered call (`filters[code]` or `filters[country][code]`). */
export function countryOf(call: CmsCall): string | undefined {
  return call.query['filters[code][$eq]'] ?? call.query['filters[country][code][$eq]'];
}

/** A promise that never settles: the request stays "loading". */
export const pending = (): Promise<never> => new Promise<never>(() => undefined);

/**
 * Fake `CmsClient` for component tests (ADR-0007). Records every call and answers with the
 * handler set by the test. Provide it with `{ provide: CmsClient, useValue: fake }`. Test-only.
 */
export class FakeCmsClient {
  readonly calls: CmsCall[] = [];
  handler: CmsHandler = () => pending();

  findAll(path: string, query: CmsQuery): Promise<unknown> {
    return this.dispatch({ method: 'findAll', path, query });
  }

  findFirstPage(path: string, query: CmsQuery): Promise<unknown> {
    return this.dispatch({ method: 'findFirstPage', path, query });
  }

  findSingle(path: string, query: CmsQuery): Promise<unknown> {
    return this.dispatch({ method: 'findSingle', path, query });
  }

  callsTo(path: string): CmsCall[] {
    return this.calls.filter((call) => call.path === path);
  }

  private dispatch(call: CmsCall): Promise<unknown> {
    this.calls.push(call);
    return this.handler(call);
  }
}
