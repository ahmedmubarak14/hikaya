import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * OAuth callback handler. After the user signs in with Google (or any
 * OAuth provider), Supabase redirects here with a `code` query param.
 * We exchange it for a session, then redirect to /me.
 *
 * We build the Supabase client manually here (not via the shared
 * helper) so we can attach session cookies to the redirect response.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const locale = searchParams.get('locale') ?? 'en';
  const next = `/${locale}/me`;

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in?error=no_code`, origin));
  }

  // Build redirect response FIRST so we can set cookies on it.
  const redirectUrl = new URL(next, origin);
  const response = NextResponse.redirect(redirectUrl);

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(new URL(`/${locale}/sign-in?error=oauth_failed`, origin));
  }

  // Ensure a public.User row exists for this auth user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      const displayName =
        user.user_metadata?.full_name ??
        user.user_metadata?.display_name ??
        user.email?.split('@')[0] ??
        'User';

      await supabase.from('User').insert({
        id: user.id,
        email: user.email?.toLowerCase() ?? '',
        displayName,
        locale: locale === 'ar' ? 'AR' : 'EN',
        roles: ['CREATOR'],
        activeRole: 'CREATOR',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return response;
}
