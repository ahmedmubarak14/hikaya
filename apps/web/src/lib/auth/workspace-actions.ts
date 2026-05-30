'use server';

import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { ensureUserAndProfile } from '@/lib/auth/supabase-auth';
import { createClient, createServiceClient } from '@/lib/supabase/server';

import { setActiveRole } from './active-role-actions';

import type { MockUserRole } from './mock-store';

const VALID_ROLES: ReadonlySet<MockUserRole> = new Set([
  'CREATOR',
  'STUDIO_OWNER',
  'CLIENT',
]);

/**
 * Prefer the service client (bypasses RLS for the privileged roles update).
 * Fall back to the cookie-auth client when SUPABASE_SERVICE_ROLE_KEY isn't
 * configured — that still works if the project has a self-update RLS policy.
 */
async function getWriteClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServiceClient();
  }
  return createClient();
}

/**
 * Add a role (workspace) to the signed-in user and switch into it.
 *
 * All writes go through the SERVICE client — adding a role mutates the
 * privileged `User.roles` column and inserts CreatorProfile / StudioProfile
 * rows, none of which the anon (cookie-auth) client can do under RLS. The
 * user is already authenticated via getSession(), and every write is scoped
 * to their own id, so this is safe.
 *
 * - Merges the new role into User.roles (no-op if already present).
 * - Provisions the role-specific profile row via the shared, idempotent
 *   ensureUserAndProfile() so /me/portfolio (creator) or /me/studio/setup
 *   (studio) render the editor instead of the empty-profile gate.
 * - Sets the active-role cookie and redirects into the role's setup page.
 */
export async function addWorkspaceAction(locale: Locale, role: MockUserRole): Promise<void> {
  if (!VALID_ROLES.has(role)) {
    redirect(`/${locale}/me/workspaces/new?error=INVALID_ROLE`);
  }

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/sign-in?next=/${locale}/me/workspaces/new`);
  }

  const supabase = await getWriteClient();

  const { data: row, error: fetchErr } = await supabase
    .from('User')
    .select('roles, displayName')
    .eq('id', session.user.id)
    .maybeSingle();

  if (fetchErr || !row) {
    console.error(
      '[workspace-actions] addWorkspaceAction fetch error:',
      fetchErr?.message ?? 'user row not found',
    );
    redirect(`/${locale}/me/workspaces/new?error=NOT_FOUND`);
  }

  const current = Array.isArray(row!.roles) ? (row!.roles as MockUserRole[]) : [];
  if (!current.includes(role)) {
    const merged = [...current, role];
    const { error: updateErr } = await supabase
      .from('User')
      .update({ roles: merged })
      .eq('id', session.user.id);
    if (updateErr) {
      console.error('[workspace-actions] addWorkspaceAction update error:', updateErr.message);
      redirect(`/${locale}/me/workspaces/new?error=UPDATE_FAILED`);
    }
  }

  // Provision the role-specific profile row (idempotent; service client).
  const displayName =
    (row!.displayName as string | null) ?? session.user.displayName ?? 'User';
  try {
    await ensureUserAndProfile({
      userId: session.user.id,
      email: session.user.email,
      displayName,
      role,
      locale: locale === 'ar' ? 'ar' : 'en',
    });
  } catch (e) {
    console.error('[workspace-actions] ensureUserAndProfile failed:', e);
    // Non-fatal — the role is granted; profile can still be set up via the
    // editor's empty-state gate.
  }

  await setActiveRole(role);

  const destination =
    role === 'STUDIO_OWNER'
      ? `/${locale}/me/studio/setup`
      : role === 'CREATOR'
        ? `/${locale}/me/portfolio`
        : `/${locale}/me`;
  redirect(destination);
}
