'use server';

import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

import { setActiveRole } from './active-role-actions';

import type { MockUserRole } from './mock-store';

const VALID_ROLES: ReadonlySet<MockUserRole> = new Set([
  'CREATOR',
  'STUDIO_OWNER',
  'CLIENT',
]);

/**
 * Add a role (workspace) to the signed-in user and switch into it.
 *
 * - Validates that the requested role is one of the three known values.
 * - Reads the user's current `roles` from the DB, appends the new one if
 *   it isn't already present, and writes the merged array back.
 * - Sets the active-role cookie so the next render shows the new workspace.
 * - Redirects to the role-appropriate setup or landing page.
 */
export async function addWorkspaceAction(locale: Locale, role: MockUserRole): Promise<void> {
  if (!VALID_ROLES.has(role)) {
    redirect(`/${locale}/me/workspaces/new?error=INVALID_ROLE`);
  }

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/sign-in?next=/${locale}/me/workspaces/new`);
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from('User')
    .select('roles')
    .eq('id', session.user.id)
    .maybeSingle();

  if (fetchErr || !row) {
    redirect(`/${locale}/me/workspaces/new?error=NOT_FOUND`);
  }

  const current = Array.isArray(row.roles) ? (row.roles as MockUserRole[]) : [];
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

  await setActiveRole(role);

  const destination =
    role === 'STUDIO_OWNER'
      ? `/${locale}/me/studio/setup`
      : role === 'CREATOR'
        ? `/${locale}/me/portfolio`
        : `/${locale}/me`;
  redirect(destination);
}
