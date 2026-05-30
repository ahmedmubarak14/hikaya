import { randomUUID } from 'node:crypto';

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

type Role = 'CREATOR' | 'STUDIO_OWNER' | 'CLIENT';
const VALID_ROLES: ReadonlySet<Role> = new Set(['CREATOR', 'STUDIO_OWNER', 'CLIENT']);

/**
 * OAuth callback handler. After the user signs in with Google / Apple, Supabase
 * redirects here with a `code` query param. We exchange it for a session,
 * provision the public.User + role-specific profile row on first sign-in,
 * then redirect to /me (or the role-appropriate setup page).
 *
 * The `?role=` query is passed in from the sign-up page so the user's
 * pre-OAuth role pick is preserved. When absent, we send the brand-new
 * user to /sign-up/choose-role so they pick before we provision anything
 * — avoids the previous bug where every Google signup became a Creator.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const locale = searchParams.get('locale') ?? 'en';
  const rawRole = searchParams.get('role');
  const requestedRole: Role | null = rawRole && VALID_ROLES.has(rawRole as Role)
    ? (rawRole as Role)
    : null;

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in?error=no_code`, origin));
  }

  // Build redirect response FIRST so we can set cookies on it. Final URL
  // gets rewritten below once we know the user's role.
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(new URL(`/${locale}/sign-in?error=oauth_failed`, origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase
      .from('User')
      .select('id, roles')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      // Brand-new account. If the OAuth was initiated from a role-aware
      // entry point (sign-up page), `requestedRole` is set; honor it.
      // Otherwise bounce to the choose-role step so they actively pick
      // instead of silently defaulting to CREATOR.
      if (!requestedRole) {
        const chooseUrl = new URL(`/${locale}/sign-up/choose-role`, origin);
        chooseUrl.searchParams.set('userId', user.id);
        return NextResponse.redirect(chooseUrl, { headers: response.headers });
      }

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
        roles: [requestedRole],
        activeRole: requestedRole,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        updatedAt: new Date().toISOString(),
      });

      await provisionRoleProfile(supabase, user.id, displayName, requestedRole);

      if (requestedRole === 'STUDIO_OWNER') next = `/${locale}/me/studio/setup`;
      else if (requestedRole === 'CREATOR') next = `/${locale}/me/portfolio`;
    }
  }

  return NextResponse.redirect(new URL(next, origin), { headers: response.headers });
}

/**
 * For a freshly-created OAuth user, also create the role-specific profile
 * row so /me/portfolio (creator) or /me/studio/setup (studio) renders the
 * editor directly instead of the "no profile" gate.
 */
async function provisionRoleProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  displayName: string,
  role: Role,
): Promise<void> {
  if (role === 'CREATOR') {
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
  } else if (role === 'STUDIO_OWNER') {
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
  // CLIENT: no separate profile row needed.
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}
