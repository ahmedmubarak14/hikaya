'use server';

import { redirect } from 'next/navigation';

import { defaultLocale, type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Update the user's profile (displayName, avatarUrl, locale) in public.User.
 */
export async function updateProfileSettingsAction(
  locale: Locale,
  input: { displayName: string; avatarUrl: string | null; locale: 'en' | 'ar' },
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  if (!input.displayName || input.displayName.length < 2) {
    return { ok: false, error: 'INVALID_INPUT' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('User')
    .update({
      displayName: input.displayName,
      avatarUrl: input.avatarUrl || null,
      locale: input.locale === 'ar' ? 'AR' : 'EN',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', session.user.id);

  if (error) {
    console.error('[settings/actions] updateProfileSettingsAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  return { ok: true };
}

/**
 * Update the user's password via Supabase Auth.
 */
export async function updatePasswordSettingsAction(
  locale: Locale,
  newPassword: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: 'PASSWORD_TOO_SHORT' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error('[settings/actions] updatePasswordSettingsAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  return { ok: true };
}

/**
 * Delete the user's account:
 * 1. Delete the User row from public.User
 * 2. Delete the auth user via service-role client
 * 3. Sign out and redirect to home
 */
export async function deleteAccountAction(
  locale: Locale,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  // 1. Delete the public.User row (cascading to CreatorProfile, etc.)
  const { error: deleteRowError } = await supabase
    .from('User')
    .delete()
    .eq('id', session.user.id);

  if (deleteRowError) {
    console.error('[settings/actions] deleteAccountAction row error:', deleteRowError.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  // 2. Delete the auth user via service-role client
  try {
    const serviceClient = await createServiceClient();
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(session.user.id);
    if (authDeleteError) {
      console.error(
        '[settings/actions] deleteAccountAction auth error:',
        authDeleteError.message,
      );
      // Continue anyway — row is already gone
    }
  } catch (err) {
    console.error('[settings/actions] deleteAccountAction service client error:', err);
    // Continue anyway — the auth user may linger but the app row is gone
  }

  // 3. Sign out
  await supabase.auth.signOut();

  redirect(`/${locale ?? defaultLocale}`);
}
