import 'server-only';

import { randomUUID } from 'node:crypto';

import { createClient, createServiceClient } from '@/lib/supabase/server';

import { getActiveRole } from './active-role';

import type { SessionUser } from './session';

type UserRole = 'CREATOR' | 'STUDIO_OWNER' | 'CLIENT';

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

/**
 * Idempotently ensure the public.User row + role-specific profile row exist
 * for a confirmed auth user. Uses the SERVICE client so it works regardless
 * of RLS / whether a session cookie is present yet (called from both the
 * email/password flow and the /auth/confirm handler).
 */
export async function ensureUserAndProfile(input: {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  locale: 'en' | 'ar';
  avatarUrl?: string | null;
}): Promise<void> {
  // Prefer the service client; fall back to the cookie client when the
  // service-role key isn't configured so this still works in dev/preview.
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await createServiceClient()
    : await createClient();

  const { data: existingUser } = await supabase
    .from('User')
    .select('id')
    .eq('id', input.userId)
    .maybeSingle();

  if (!existingUser) {
    await supabase.from('User').insert({
      id: input.userId,
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      locale: input.locale === 'ar' ? 'AR' : 'EN',
      roles: [input.role],
      activeRole: input.role,
      avatarUrl: input.avatarUrl ?? null,
      updatedAt: new Date().toISOString(),
    });
  }

  if (input.role === 'CREATOR') {
    const { data: cp } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('userId', input.userId)
      .maybeSingle();
    if (!cp) {
      await supabase.from('CreatorProfile').insert({
        id: `cr_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        userId: input.userId,
        username: `${slugify(input.displayName) || 'creator'}-${randomUUID().slice(0, 4)}`,
        displayNameEn: input.displayName,
        displayNameAr: input.displayName,
        city: 'RIYADH',
        disciplines: [],
      });
    }
  } else if (input.role === 'STUDIO_OWNER') {
    const { data: sp } = await supabase
      .from('StudioProfile')
      .select('id')
      .eq('userId', input.userId)
      .maybeSingle();
    if (!sp) {
      await supabase.from('StudioProfile').insert({
        id: `st_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        userId: input.userId,
        slug: `${slugify(input.displayName) || 'studio'}-${randomUUID().slice(0, 4)}`,
        nameEn: input.displayName,
        nameAr: input.displayName,
        city: 'RIYADH',
      });
    }
  }
}

/**
 * Sign up with email + password via Supabase Auth.
 *
 * Behavior depends on the project's email-confirmation setting:
 *  - Confirmation OFF → a session is returned immediately; we provision the
 *    User + profile rows now and return needsConfirmation:false.
 *  - Confirmation ON  → no session yet; the confirmation email links to
 *    /auth/confirm which provisions the rows AFTER the user clicks through.
 *    We return needsConfirmation:true so the UI shows a "check your email"
 *    screen instead of bouncing to a session-less /me.
 */
export async function supabaseSignUp(input: {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  locale: 'en' | 'ar';
}): Promise<
  | { ok: true; user: SessionUser; needsConfirmation: boolean }
  | { ok: false; error: string }
> {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        role: input.role,
        locale: input.locale,
      },
      emailRedirectTo: `${appUrl()}/auth/confirm?locale=${input.locale}`,
    },
  });

  if (authError) {
    if (/already registered|already been registered/i.test(authError.message)) {
      return { ok: false, error: 'EMAIL_TAKEN' };
    }
    return { ok: false, error: authError.message };
  }

  if (!authData.user) {
    return { ok: false, error: 'SIGNUP_FAILED' };
  }

  const needsConfirmation = !authData.session;

  // When a session exists (confirmation disabled), provision rows now. When
  // it doesn't, /auth/confirm will provision after the user confirms.
  if (!needsConfirmation) {
    await ensureUserAndProfile({
      userId: authData.user.id,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      locale: input.locale,
    });
  }

  return {
    ok: true,
    needsConfirmation,
    user: {
      id: authData.user.id,
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      roles: [input.role],
      primaryRole: input.role,
      currentRole: input.role,
      locale: input.locale,
    },
  };
}

/**
 * Sign in with email + password via Supabase Auth.
 */
export async function supabaseSignIn(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    if (
      error.code === 'email_not_confirmed' ||
      /email not confirmed|not confirmed/i.test(error.message)
    ) {
      return { ok: false, error: 'EMAIL_NOT_CONFIRMED' };
    }
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  // Fetch the User row for roles + display name
  const { data: userRow } = await supabase
    .from('User')
    .select('id, email, displayName, roles, activeRole, locale')
    .eq('id', data.user.id)
    .single();

  if (!userRow) {
    return { ok: false, error: 'USER_NOT_FOUND' };
  }

  const locale = userRow.locale === 'AR' ? 'ar' : 'en';
  const roles = (userRow.roles ?? ['CLIENT']) as UserRole[];
  const currentRole = (userRow.activeRole ?? roles[0] ?? 'CLIENT') as UserRole;

  return {
    ok: true,
    user: {
      id: userRow.id,
      email: userRow.email,
      displayName: userRow.displayName,
      roles,
      primaryRole: roles[0] ?? 'CLIENT',
      currentRole,
      locale,
    },
  };
}

/**
 * Sign out — clears the Supabase session cookie.
 */
export async function supabaseSignOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * Get the current Supabase auth user + their public.User row.
 * Returns null if not authenticated. This is the "real" replacement
 * for the mock-store getSession().
 */
export async function getSupabaseSession(): Promise<{ user: SessionUser } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: userRow } = await supabase
    .from('User')
    .select('id, email, displayName, roles, activeRole, locale, avatarUrl')
    .eq('id', authUser.id)
    .single();

  if (!userRow) return null;

  const locale = userRow.locale === 'AR' ? 'ar' : 'en';

  // --- Single source of truth: reconcile roles[] with real profile rows ---
  // The roles[] column and the existence of a CreatorProfile / StudioProfile
  // row are two signals that the rest of the app reads independently. If they
  // ever drift (a profile row exists but the role was dropped, or vice versa)
  // the user sees "mixed roles" — creator views gated as a client, etc. We
  // reconcile here so the session can never under-report a capability the user
  // actually has, and CLIENT is always available as the baseline.
  const [{ data: creatorProfile }, { data: studioProfile }] = await Promise.all([
    supabase.from('CreatorProfile').select('username').eq('userId', authUser.id).maybeSingle(),
    supabase.from('StudioProfile').select('id').eq('userId', authUser.id).maybeSingle(),
  ]);

  const dbRoles = Array.isArray(userRow.roles) ? (userRow.roles as UserRole[]) : [];
  const roleSet = new Set<UserRole>(dbRoles.length ? dbRoles : ['CLIENT']);
  roleSet.add('CLIENT'); // every account can hire/buy — baseline capability
  if (creatorProfile) roleSet.add('CREATOR');
  if (studioProfile) roleSet.add('STUDIO_OWNER');
  const roles = [...roleSet] as UserRole[];

  // Heal the DB once when divergent so sign-in / other read paths agree too.
  if (roles.length !== dbRoles.length || roles.some((r) => !dbRoles.includes(r))) {
    try {
      const writer = process.env.SUPABASE_SERVICE_ROLE_KEY
        ? await createServiceClient()
        : supabase;
      await writer.from('User').update({ roles }).eq('id', authUser.id);
    } catch {
      // Non-critical — the reconciled roles are still used for this request.
    }
  }

  // Active role: cookie wins (iff still held), then the DB column, then a
  // sensible default. The cookie is what the workspace switcher writes.
  const cookieRole = await getActiveRole();
  const dbActive = (userRow.activeRole as UserRole | null) ?? null;
  const currentRole: UserRole =
    cookieRole && roles.includes(cookieRole)
      ? cookieRole
      : dbActive && roles.includes(dbActive)
        ? dbActive
        : (roles[0] ?? 'CLIENT');

  const username = (creatorProfile?.username as string) ?? undefined;

  return {
    user: {
      id: userRow.id,
      email: userRow.email,
      displayName: userRow.displayName,
      roles,
      primaryRole: dbActive && roles.includes(dbActive) ? dbActive : (roles[0] ?? 'CLIENT'),
      currentRole,
      locale,
      avatarUrl: (userRow.avatarUrl as string) ?? undefined,
      username,
    },
  };
}
