import 'server-only';

import type { CreatorProfile } from './mock-data';
import { getAllCreators, getCreatorByOwnerEmail, getCreatorByUsernameRaw } from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export interface ListCreatorsFilter {
  city?: CreatorProfile['city'];
  discipline?: CreatorProfile['disciplines'][number];
  available?: boolean;
}

export async function listCreators(filter: ListCreatorsFilter = {}): Promise<CreatorProfile[]> {
  if (!isStaticExport) {
    try {
      const { listCreatorsFromDB } = await import('./supabase-queries');
      const result = await listCreatorsFromDB(filter);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  // Mock fallback
  let results = getAllCreators();

  if (filter.city) results = results.filter((c) => c.city === filter.city);
  if (filter.discipline)
    results = results.filter((c) => c.disciplines.includes(filter.discipline!));
  if (filter.available) results = results.filter((c) => c.availability === 'AVAILABLE');

  // Sort by verified first, then by review score.
  return results.sort((a, b) => {
    if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
    return b.reviewScore - a.reviewScore;
  });
}

export async function getCreatorByUsername(username: string): Promise<CreatorProfile | null> {
  if (!isStaticExport) {
    try {
      const { getCreatorByUsernameFromDB } = await import('./supabase-queries');
      const result = await getCreatorByUsernameFromDB(username);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getCreatorByUsernameRaw(username);
}

export async function listFeaturedCreators(limit = 4): Promise<CreatorProfile[]> {
  if (!isStaticExport) {
    try {
      const { listFeaturedCreatorsFromDB } = await import('./supabase-queries');
      const result = await listFeaturedCreatorsFromDB(limit);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  const all = await listCreators();
  return all.slice(0, limit);
}

/** Resolve the creator profile owned by the currently signed-in user, if any. */
export async function getMyCreatorProfile(
  userEmailOrIdentity: string | { userId?: string; email: string },
): Promise<CreatorProfile | null> {
  // Caller may pass the bare email (legacy) or {userId, email} (preferred —
  // skips the email→User lookup roundtrip and avoids the previous broken
  // PostgREST `.eq('User.email', …)` join filter).
  const identity =
    typeof userEmailOrIdentity === 'string'
      ? { email: userEmailOrIdentity }
      : userEmailOrIdentity;

  if (!isStaticExport) {
    try {
      if (identity.userId) {
        const { getCreatorByUserIdFromDB } = await import('./supabase-queries');
        const direct = await getCreatorByUserIdFromDB(identity.userId);
        if (direct) return direct;
      }
      const { getCreatorByOwnerEmailFromDB } = await import('./supabase-queries');
      const result = await getCreatorByOwnerEmailFromDB(identity.email);
      if (result) return result;
    } catch (e) {
      console.error('[creators/queries] getMyCreatorProfile DB lookup failed:', e);
      // Supabase unavailable — fall through to mock
    }
  }

  return getCreatorByOwnerEmail(identity.email);
}
