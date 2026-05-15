'use server';

import { cookies } from 'next/headers';

import { ACTIVE_ROLE_COOKIE } from './active-role';
import { findUserById, type MockUserRole } from './mock-store';
import { getSession } from './session';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persist the active role for the signed-in user.
 *
 * Mirrors the theme cookie pattern (httpOnly, sameSite lax, 1y). The role is
 * validated against the user's actual roles[] so a forged form value can't
 * elevate a CLIENT-only account to STUDIO_OWNER. On a static-export build
 * this file is replaced wholesale by `_export-stub/actions.ts`.
 */
export async function setActiveRole(role: MockUserRole): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const user = findUserById(session.user.id);
  if (!user) return;
  if (!user.roles.includes(role)) return;

  (await cookies()).set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });
}
