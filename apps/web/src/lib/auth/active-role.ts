import 'server-only';

import { cookies } from 'next/headers';

import { IS_STATIC_EXPORT } from '@/lib/static-export';

import type { MockUserRole } from './mock-store';

/**
 * Active-role cookie.
 *
 * Users can hold multiple roles (e.g. Creator + Studio Owner). The "active"
 * role drives the default destination after sign-in, redirects on /me, and
 * which header CTAs feel native. Modelled on `lib/theme/get-theme.ts`:
 * cookie is httpOnly, read only on the server, written through a thin
 * server action.
 */

export const ACTIVE_ROLE_COOKIE = 'hikaya_active_role';

const VALID_ROLES: ReadonlySet<MockUserRole> = new Set([
  'CREATOR',
  'STUDIO_OWNER',
  'CLIENT',
]);

/**
 * Read the active-role cookie. Returns null in static-export builds (no
 * cookies on a GitHub Pages host). The session resolver is responsible for
 * validating the value against the user's actual roles[] — this helper is
 * intentionally dumb so it can be called from places that don't yet have a
 * user in hand.
 */
export async function getActiveRole(): Promise<MockUserRole | null> {
  if (IS_STATIC_EXPORT) return null;
  const raw = (await cookies()).get(ACTIVE_ROLE_COOKIE)?.value;
  return raw && VALID_ROLES.has(raw as MockUserRole) ? (raw as MockUserRole) : null;
}
