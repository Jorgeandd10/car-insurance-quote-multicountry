/**
 * country router (ADR-0003 section 3).
 * Content API exposes only 'find': findOne, create, update and delete routes are not loaded.
 * 'find' goes through global::published-only, which forces status=published.
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::country.country', {
  only: ['find'],
  config: {
    find: {
      middlewares: ['global::published-only'],
    },
  },
});
