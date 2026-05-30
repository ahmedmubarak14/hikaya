'use server';

import { randomUUID } from 'node:crypto';

import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { setActiveRole } from '@/lib/auth/active-role-actions';
import { createClient } from '@/lib/supabase/server';

type Role = 'CREATOR' | 'STUDIO_OWNER' | 'CLIENT';
const VALID_ROLES: ReadonlySet<Role> = new Set(['CREATOR', 'STUDIO_OWNER', 'CLIENT']);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

/**
 * Server action called from the Choose Role step that finishes setting up
 * a brand-new OAuth user. Creates the public.User row + the role-specific
 * profile row, then redirects into the appropriate setup destination.
 *
 * Called only for OAuth users who didn't carry a `?role=` param through the
 * sign-in URL (e.g. they came from the standalone "Continue with Google"
 * button instead of the sign-up page).
 */
export async function chooseRoleAction(locale: Locale, role: Role): Promise<void> {
  if (!VALID_ROLES.has(role)) {
    redirect(`/${locale}/sign-up/choose-role?error=INVALID_ROLE`);
  }

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/sign-in?next=/${locale}/sign-up/choose-role`);
  }

  const supabase = await createClient();
  const userId = session.user.id;

  // Insert the User row if absent. supabaseSignUp would have done this
  // for the email/password flow; the OAuth callback short-circuits to
  // this page so the user picks before the row gets created.
  const { data: existing } = await supabase
    .from('User')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  const displayName = session.user.displayName || 'User';

  if (!existing) {
    await supabase.from('User').insert({
      id: userId,
      email: session.user.email.toLowerCase(),
      displayName,
      locale: locale === 'ar' ? 'AR' : 'EN',
      roles: [role],
      activeRole: role,
      updatedAt: new Date().toISOString(),
    });
  } else {
    // Already exists — promote the role to active.
    await supabase
      .from('User')
      .update({ roles: [role], activeRole: role })
      .eq('id', userId);
  }

  // Provision the role-specific profile row.
  if (role === 'CREATOR') {
    const { data: existingCp } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('userId', userId)
      .maybeSingle();
    if (!existingCp) {
      const base = slugify(displayName) || 'creator';
      const username = `${base}-${randomUUID().slice(0, 4)}`;
      await supabase.from('CreatorProfile').insert({
        id: `cr_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        userId,
        username,
        displayNameEn: displayName,
        displayNameAr: displayName,
        city: 'RIYADH',
        disciplines: [],
      });
    }
  } else if (role === 'STUDIO_OWNER') {
    const { data: existingSp } = await supabase
      .from('StudioProfile')
      .select('id')
      .eq('userId', userId)
      .maybeSingle();
    if (!existingSp) {
      const slug = `${slugify(displayName) || 'studio'}-${randomUUID().slice(0, 4)}`;
      await supabase.from('StudioProfile').insert({
        id: `st_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        userId,
        slug,
        nameEn: displayName,
        nameAr: displayName,
        city: 'RIYADH',
      });
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
