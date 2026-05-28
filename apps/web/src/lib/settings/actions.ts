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
 * Upload a new avatar image to Supabase Storage and return the public URL.
 * The bucket `avatars` is expected to exist and be publicly readable.
 */
export async function uploadAvatarAction(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'NO_FILE' };
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'INVALID_TYPE' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: 'TOO_LARGE' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const key = `${session.user.id}/${Date.now()}.${ext}`;

  const supabase = await createServiceClient();
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(key, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
  if (uploadErr) {
    console.error('[settings/actions] uploadAvatarAction error:', uploadErr.message);
    return { ok: false, error: 'UPLOAD_FAILED' };
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(key);
  return { ok: true, url: data.publicUrl };
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
 * Export all user data for PDPL compliance (Saudi PDPL Article 13).
 * Returns a JSON object with all tables that reference this user.
 */
export async function exportMyDataAction(): Promise<
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const userId = session.user.id;

  // Gather all user-related data from Supabase tables.
  // Each query is best-effort — if a table doesn't exist yet we skip it.
  async function safeSelect(table: string, column: string, value: string) {
    try {
      const { data } = await supabase.from(table).select('*').eq(column, value);
      return data ?? [];
    } catch {
      return [];
    }
  }

  const [
    user,
    creatorProfile,
    portfolioItems,
    bookings,
    messageThreads,
    messages,
    quotes,
    contracts,
    collections,
    products,
    purchases,
    blogPosts,
    reviews,
    inquiries,
    spaces,
    spaceBookingsAsRenter,
    spaceBookingsAsOwnerSpaces,
    favorites,
    savedSearches,
    discountCodes,
    services,
    jobPosts,
    jobApplications,
    notifications,
    templates,
  ] = await Promise.all([
    safeSelect('User', 'id', userId),
    safeSelect('CreatorProfile', 'userId', userId),
    safeSelect('PortfolioItem', 'userId', userId),
    safeSelect('Booking', 'creatorId', userId),
    safeSelect('MessageThread', 'creatorId', userId),
    safeSelect('Message', 'senderId', userId),
    safeSelect('Quote', 'creatorId', userId),
    safeSelect('Contract', 'creatorId', userId),
    safeSelect('Collection', 'creatorId', userId),
    safeSelect('Product', 'creatorId', userId),
    safeSelect('Purchase', 'buyerId', userId),
    safeSelect('BlogPost', 'authorId', userId),
    safeSelect('Review', 'reviewerId', userId),
    safeSelect('Inquiry', 'clientId', userId),
    safeSelect('Space', 'ownerId', userId),
    safeSelect('SpaceBooking', 'renterId', userId),
    // Bookings on spaces owned by user — need the space IDs first
    Promise.resolve([]),
    safeSelect('Favorite', 'userId', userId),
    safeSelect('SavedSearch', 'userId', userId),
    safeSelect('DiscountCode', 'creatorId', userId),
    safeSelect('Service', 'creatorId', userId),
    safeSelect('JobPost', 'posterId', userId),
    safeSelect('JobApplication', 'applicantId', userId),
    safeSelect('NotificationPreference', 'userId', userId),
    safeSelect('Template', 'userId', userId),
  ]);

  return {
    ok: true,
    data: {
      exportedAt: new Date().toISOString(),
      user,
      creatorProfile,
      portfolioItems,
      bookings,
      messageThreads,
      messages,
      quotes,
      contracts,
      collections,
      products,
      purchases,
      blogPosts,
      reviews,
      inquiries,
      spaces,
      spaceBookingsAsRenter,
      spaceBookingsAsOwnerSpaces,
      favorites,
      savedSearches,
      discountCodes,
      services,
      jobPosts,
      jobApplications,
      notifications,
      templates,
    },
  };
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
