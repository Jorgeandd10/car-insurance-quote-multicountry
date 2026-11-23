/**
 * Route middleware `global::published-only` (ADR-0003 section 3, REQ-01.6, REQ-02.2).
 *
 * Strapi 5 lets any role with `find` read drafts through `?status=draft`. This middleware
 * runs before the core `find` controller of every public content type and:
 *   - replaces `status` with `published`;
 *   - removes `publicationFilter`;
 *   - removes `hasPublishedVersion`, the legacy alias that Strapi 5.63 still maps to the same
 *     publication filter (@strapi/core document-service/transform/query.js).
 *
 * The query is reassigned (not mutated in place) so Koa re-serialises it through the
 * qs-based setter installed by `strapi::query`; the controller then reads the sanitised value.
 */
import type { Core } from '@strapi/strapi';

const PUBLISHED = 'published';

export default (_config: unknown, _ctx: { strapi: Core.Strapi }) => {
  return async (ctx: { query: Record<string, unknown> }, next: () => Promise<void>) => {
    const {
      publicationFilter: _publicationFilter,
      hasPublishedVersion: _hasPublishedVersion,
      ...rest
    } = ctx.query ?? {};
    ctx.query = { ...rest, status: PUBLISHED };
    await next();
  };
};
