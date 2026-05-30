'use server';

import { cookies } from 'next/headers';

import { createClient, createServiceClient } from '@/lib/supabase/server';

import { ACTIVE_ROLE_COOKIE } from './active-role';
import { type MockUserRole } from './mock-store';
import { getSession } from './session';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persist the active role for the signed-in user.
 *
 * Validates against the LIVE session roles[] (works for both Supabase and the
 * legacy mock session — the old `findUserById` lookup silently failed for real
 * Supabase users, so switching workspaces was a no-op) so a forged form value
 * can't elevate a CLIENT-only account to STUDIO_OWNER.
 *
 * Writes BOTH:
 *  - the `hikaya_active_role` cookie (read by the session resolver), and
 *  - the `User.activeRole` DB column (so the choice survives across devices and
 *    the two sources of truth never drift).
 *
 * On a static-export build this file is replaced by `_export-stub/actions.ts`.
 */
export async function setActiveRole(role: MockUserRole): Promise<void> {
  const session = await getSession();
  if (!session) return;
  if (!session.user.roles.includes(role)) return;

  (await cookies()).set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });

  // Best-effort: persist to the DB so the session resolver and sign-in agree.
  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient();
    await supabase.from('User').update({ activeRole: role }).eq('id', session.user.id);
  } catch {
    // Cookie already set; DB persistence is non-critical for the current view.
  }
}
