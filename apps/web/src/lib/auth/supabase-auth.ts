import 'server-only';

import { createClient } from '@/lib/supabase/server';

import type { SessionUser } from './session';

type UserRole = 'CREATOR' | 'STUDIO_OWNER' | 'CLIENT';

/**
 * Sign up with email + password via Supabase Auth, then create the
 * corresponding row in public."User". Returns the new user's session
 * or an error string.
 */
export async function supabaseSignUp(input: {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  locale: 'en' | 'ar';
}): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const supabase = await createClient();

  // 1. Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        role: input.role,
      },
    },
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { ok: false, error: 'EMAIL_TAKEN' };
    }
    return { ok: false, error: authError.message };
  }

  if (!authData.user) {
    return { ok: false, error: 'SIGNUP_FAILED' };
  }

  // 2. Create the public.User row
  const roles: UserRole[] = [input.role];
  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from('User').insert({
    id: authData.user.id,
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    locale: input.locale === 'ar' ? 'AR' : 'EN',
    roles: roles,
    activeRole: input.role,
    updatedAt: now,
  });

  if (insertError) {
    console.error('Failed to create User row:', insertError);
    return { ok: false, error: 'DB_ERROR' };
  }

  return {
    ok: true,
    user: {
      id: authData.user.id,
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      roles,
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
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: userRow } = await supabase
    .from('User')
    .select('id, email, displayName, roles, activeRole, locale')
    .eq('id', authUser.id)
    .single();

  if (!userRow) return null;

  const locale = userRow.locale === 'AR' ? 'ar' : 'en';
  const roles = (userRow.roles ?? ['CLIENT']) as UserRole[];
  const currentRole = (userRow.activeRole ?? roles[0] ?? 'CLIENT') as UserRole;

  return {
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
