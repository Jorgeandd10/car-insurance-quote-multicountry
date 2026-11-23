/**
 * Public role permissions (content-model section 4, ADR-0003 section 1, D4 refined by G3-2).
 *
 * Applied on every bootstrap, idempotently: after it runs the public role has EXACTLY the
 * permissions below and nothing else; the authenticated role has none; sign-ups are disabled.
 * Any permission added by hand in the admin is revoked on the next start (by design).
 *
 * Only `find`, no `findOne`: no read in api-contracts needs it (the chosen plan is checked
 * against the list, REQ-03.14). No upload, users-permissions (auth/user/role) or i18n permissions.
 */
import type { Core } from '@strapi/strapi';

export const PUBLIC_PERMISSIONS: ReadonlyArray<{ action: string; reason: string }> = [
  {
    action: 'api::country.country.find',
    reason: 'Country list, country config, price factors and terms (api-contracts C1, C3, C6, C7)',
  },
  { action: 'api::form-field.form-field.find', reason: 'Step 1 fields of the country (C4)' },
  { action: 'api::plan.plan.find', reason: 'Plans of the country for step 2 and summary (C5)' },
  { action: 'api::country-selection.country-selection.find', reason: 'Texts of the / page (C2)' },
];

const ROLE = 'plugin::users-permissions.role';
const PERMISSION = 'plugin::users-permissions.permission';

const log = (strapi: Core.Strapi, message: string) => strapi.log.info(`[permissions] ${message}`);

async function findRole(strapi: Core.Strapi, type: 'public' | 'authenticated') {
  const role = await strapi.db.query(ROLE).findOne({ where: { type } });
  if (!role) {
    throw new Error(`[permissions] users-permissions role "${type}" not found`);
  }
  return role as { id: number };
}

async function permissionsOf(strapi: Core.Strapi, roleId: number) {
  return (await strapi.db.query(PERMISSION).findMany({ where: { role: { id: roleId } } })) as Array<{
    id: number;
    action: string;
  }>;
}

export async function applyPublicPermissions(strapi: Core.Strapi): Promise<void> {
  const allowed = new Set(PUBLIC_PERMISSIONS.map((p) => p.action));

  // Public role: grant the allowlist, revoke everything else.
  const publicRole = await findRole(strapi, 'public');
  const current = await permissionsOf(strapi, publicRole.id);
  const revoked: string[] = [];
  const kept = new Set<string>();
  for (const permission of current) {
    if (allowed.has(permission.action) && !kept.has(permission.action)) {
      kept.add(permission.action);
    } else {
      await strapi.db.query(PERMISSION).delete({ where: { id: permission.id } });
      revoked.push(permission.action);
    }
  }
  const granted: string[] = [];
  for (const action of allowed) {
    if (!kept.has(action)) {
      await strapi.db.query(PERMISSION).create({ data: { action, role: publicRole.id } });
      granted.push(action);
    }
  }

  // Authenticated role: no permissions (content-model section 4).
  const authenticatedRole = await findRole(strapi, 'authenticated');
  const authenticatedRevoked: string[] = [];
  for (const permission of await permissionsOf(strapi, authenticatedRole.id)) {
    await strapi.db.query(PERMISSION).delete({ where: { id: permission.id } });
    authenticatedRevoked.push(permission.action);
  }

  // "Enable sign-ups" = false (ADR-0003 section 1).
  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advanced = ((await store.get({ key: 'advanced' })) ?? {}) as Record<string, unknown>;
  if (advanced.allow_register !== false) {
    await store.set({ key: 'advanced', value: { ...advanced, allow_register: false } });
    log(strapi, 'sign-ups disabled (allow_register=false)');
  }

  log(strapi, `public: granted [${granted.join(', ')}], revoked [${revoked.join(', ')}]`);
  log(strapi, `authenticated: revoked [${authenticatedRevoked.join(', ')}]`);
  const final = (await permissionsOf(strapi, publicRole.id)).map((p) => p.action).sort();
  log(strapi, `public role now has exactly: [${final.join(', ')}]`);
}
