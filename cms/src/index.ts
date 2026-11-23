import type { Core } from '@strapi/strapi';
import { applyPublicPermissions } from './seed/permissions';
import { runSeed } from './seed/seed';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Runs after the plugins' bootstrap on every start. Both steps are idempotent
   * (content-model sections 4 and 6, ADR-0003 section 1). A failure stops Strapi on purpose:
   * the stack must not serve content with unexpected permissions or a partial seed.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await applyPublicPermissions(strapi);
    await runSeed(strapi);
  },
};
