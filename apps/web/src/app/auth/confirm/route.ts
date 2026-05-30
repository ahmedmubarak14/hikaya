import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { ensureUserAndProfile } from '@/lib/auth/supabase-auth';

/**
 * Email-confirmation handler. Supabase's confirmation email links here
 * (via emailRedirectTo set in supabaseSignUp). Handles both link shapes:
 *   - token_hash + type  → verifyOtp (the default confirmation link)
 *   - code               → exchangeCodeForSession (PKCE)
 *
 * On success it establishes the session, provisions the public.User +
 * role-specific profile row from the auth user's metadata, then redirects
 * into the app. This is what was missing — without it the confirmation
 * link had nowhere valid to land, so users were stuck after "receiving the
 * code".
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const locale = searchParams.get('locale') ?? 'en';

  let next = `/${locale}/me`;
  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  let verifyError: string | null = null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) verifyError = error.message;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) verifyError = error.message;
  } else {
    verifyError = 'missing_token';
  }

  if (verifyError) {
    console.error('[auth/confirm] verification failed:', verifyError);
    return NextResponse.redirect(
      new URL(`/${locale}/sign-in?error=confirm_failed`, origin),
    );
  }

  // Session is now established. Provision the User + profile rows from the
  // metadata we stashed at signUp time.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = (user.user_metadata?.role as 'CREATOR' | 'STUDIO_OWNER' | 'CLIENT') ?? 'CLIENT';
    const displayName =
      (user.user_metadata?.display_name as string) ??
      user.email?.split('@')[0] ??
      'User';
    const metaLocale = (user.user_metadata?.locale as 'en' | 'ar') ?? (locale as 'en' | 'ar');

    try {
      await ensureUserAndProfile({
        userId: user.id,
        email: user.email ?? '',
        displayName,
        role,
        locale: metaLocale,
        avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
      });
    } catch (e) {
      console.error('[auth/confirm] ensureUserAndProfile failed:', e);
    }

    if (role === 'STUDIO_OWNER') next = `/${locale}/me/studio/setup`;
    else if (role === 'CREATOR') next = `/${locale}/me/portfolio`;
  }

  return NextResponse.redirect(new URL(next, origin), { headers: response.headers });
}
