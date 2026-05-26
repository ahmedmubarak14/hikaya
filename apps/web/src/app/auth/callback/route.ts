import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler. After the user signs in with Google (or any
 * OAuth provider), Supabase redirects here with a `code` query param.
 * We exchange it for a session, then redirect to /me.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const locale = searchParams.get('locale') ?? 'en';
  const next = searchParams.get('next') ?? `/${locale}/me`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Session established — check if we need to create a User row
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure a public.User row exists for this auth user
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

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // OAuth failed — send back to sign-in with error
  return NextResponse.redirect(new URL(`/${locale}/sign-in?error=oauth_failed`, origin));
}
