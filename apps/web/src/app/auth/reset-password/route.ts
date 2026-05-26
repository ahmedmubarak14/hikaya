import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Password reset callback handler. When the user clicks the reset link in
 * their email, Supabase redirects here with a `code` query param. We
 * exchange it for a session, then redirect to the locale-prefixed
 * reset-password page where the user can set a new password.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const locale = searchParams.get('locale') ?? 'en';
  const next = `/${locale}/reset-password`;

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in?error=no_code`, origin));
  }

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
    console.error('[auth/reset-password] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(new URL(`/${locale}/sign-in?error=reset_failed`, origin));
  }

  return response;
}
