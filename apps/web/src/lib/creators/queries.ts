import 'server-only';

import type { CreatorProfile } from './mock-data';
import { getAllCreators, getCreatorByOwnerEmail, getCreatorByUsernameRaw } from './mock-store';

/**
 * Server-only query helpers. Today they read from the mutable mock store; when
 * @hikaya/api is wired in, replace each function body with `fetch(...)`. The
 * shape of the return values matches the eventual API contract.
 */

export interface ListCreatorsFilter {
  city?: CreatorProfile['city'];
  discipline?: CreatorProfile['disciplines'][number];
  available?: boolean;
}

export async function listCreators(filter: ListCreatorsFilter = {}): Promise<CreatorProfile[]> {
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
  return getCreatorByUsernameRaw(username);
}

export async function listFeaturedCreators(limit = 4): Promise<CreatorProfile[]> {
  const all = await listCreators();
  return all.slice(0, limit);
}

/** Resolve the creator profile owned by the currently signed-in user, if any. */
export async function getMyCreatorProfile(userEmail: string): Promise<CreatorProfile | null> {
  return getCreatorByOwnerEmail(userEmail);
}
