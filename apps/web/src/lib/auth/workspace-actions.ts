'use server';

import { randomUUID } from 'node:crypto';

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
 * Slugify a display name into a candidate username. Falls back to a random
 * suffix when the slug is taken.
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

async function ensureUniqueUsername(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
): Promise<string> {
  const root = base || 'creator';
  for (let i = 0; i < 5; i += 1) {
    const candidate = i === 0 ? root : `${root}-${randomUUID().slice(0, 4)}`;
    const { data } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('username', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${randomUUID().slice(0, 8)}`;
}

/**
 * Add a role (workspace) to the signed-in user and switch into it.
 *
 * - Validates that the requested role is one of the three known values.
 * - Reads the user's current `roles` from the DB, appends the new one if
 *   it isn't already present, and writes the merged array back.
 * - For CREATOR: also provisions a starter CreatorProfile row (userId,
 *   unique username, displayName, default city) so /me/portfolio renders
 *   the editor instead of "Client account".
 * - For STUDIO_OWNER: also provisions a starter StudioProfile row so the
 *   studio setup page can edit it directly.
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
    .select('roles, displayName')
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

  // Provision the role-specific profile row if it doesn't already exist.
  if (role === 'CREATOR') {
    const { data: existing } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('userId', session.user.id)
      .maybeSingle();
    if (!existing) {
      const displayName = (row.displayName as string | null) ?? session.user.displayName ?? 'Creator';
      const username = await ensureUniqueUsername(supabase, slugify(displayName));
      const { error: profileErr } = await supabase.from('CreatorProfile').insert({
        id: `cr_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        userId: session.user.id,
        username,
        displayNameEn: displayName,
        displayNameAr: displayName,
        city: 'RIYADH',
        disciplines: [],
      });
      if (profileErr) {
        console.error(
          '[workspace-actions] addWorkspaceAction creator-profile insert error:',
          profileErr.message,
        );
        // Non-fatal: the role is granted; the user can still finish setup
        // via the empty-profile gate on /me/portfolio.
      }
    }
  } else if (role === 'STUDIO_OWNER') {
    const { data: existing } = await supabase
      .from('StudioProfile')
      .select('id')
      .eq('userId', session.user.id)
      .maybeSingle();
    if (!existing) {
      const displayName = (row.displayName as string | null) ?? session.user.displayName ?? 'Studio';
      const slug = `${slugify(displayName) || 'studio'}-${randomUUID().slice(0, 4)}`;
      const { error: profileErr } = await supabase.from('StudioProfile').insert({
        id: `st_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        userId: session.user.id,
        slug,
        nameEn: displayName,
        nameAr: displayName,
        city: 'RIYADH',
      });
      if (profileErr) {
        console.error(
          '[workspace-actions] addWorkspaceAction studio-profile insert error:',
          profileErr.message,
        );
      }
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
