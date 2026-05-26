import 'server-only';

import type { CreatorProfile } from './mock-data';

/**
 * Algorithm-based creator recommendations.
 *
 * Score = reviewScore * 0.4 + profileViewCount * 0.3 + portfolioCount * 0.3
 *
 * The scoring uses normalized values to prevent any single metric from
 * dominating. Falls back to the mock `listCreators` path when Supabase
 * is unavailable.
 */

const isStaticExport = process.env.EXPORT === '1';

interface ScoredCreatorRow {
  id: string;
  userId: string;
  username: string;
  displayNameEn: string;
  displayNameAr: string | null;
  bioEn: string | null;
  bioAr: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  disciplines: string[];
  city: string;
  startingPriceSar: number | null;
  yearsExperience: number | null;
  languages: string[];
  availability: string;
  preferredLayout: string;
  reviewScore: number;
  reviewCount: number;
  isVerified: boolean;
  socialLinks: Record<string, string> | null;
  profileViewCount: number;
  portfolioItemCount: number;
}

function computeScore(row: ScoredCreatorRow, maxViews: number, maxPortfolio: number): number {
  const normalizedReview = row.reviewScore / 5; // 0–1
  const normalizedViews = maxViews > 0 ? row.profileViewCount / maxViews : 0;
  const normalizedPortfolio = maxPortfolio > 0 ? row.portfolioItemCount / maxPortfolio : 0;

  return normalizedReview * 0.4 + normalizedViews * 0.3 + normalizedPortfolio * 0.3;
}

export async function getRecommendedCreators(
  _userId?: string,
  limit = 6,
): Promise<CreatorProfile[]> {
  if (!isStaticExport) {
    try {
      const result = await getRecommendedFromDB(limit);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  // Mock fallback: sort by reviewScore
  const { listCreators } = await import('./queries');
  const all = await listCreators();
  return all.slice(0, limit);
}

async function getRecommendedFromDB(limit: number): Promise<CreatorProfile[]> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Fetch creators with their portfolio item count and profile view count
  const { data: creators, error } = await supabase
    .from('CreatorProfile')
    .select(`
      id, userId, username,
      displayNameEn, displayNameAr,
      bioEn, bioAr,
      avatarUrl, coverUrl,
      disciplines, city,
      startingPriceSar, yearsExperience,
      languages, availability,
      preferredLayout,
      reviewScore, reviewCount,
      isVerified, socialLinks,
      profileViewCount,
      User ( email ),
      PortfolioItem ( id )
    `);

  if (error || !creators || creators.length === 0) {
    return [];
  }

  // Build scored rows
  const scoredRows: ScoredCreatorRow[] = creators.map((c: Record<string, unknown>) => ({
    id: c.id as string,
    userId: c.userId as string,
    username: c.username as string,
    displayNameEn: c.displayNameEn as string,
    displayNameAr: c.displayNameAr as string | null,
    bioEn: c.bioEn as string | null,
    bioAr: c.bioAr as string | null,
    avatarUrl: c.avatarUrl as string | null,
    coverUrl: c.coverUrl as string | null,
    disciplines: c.disciplines as string[],
    city: c.city as string,
    startingPriceSar: c.startingPriceSar as number | null,
    yearsExperience: c.yearsExperience as number | null,
    languages: c.languages as string[],
    availability: c.availability as string,
    preferredLayout: c.preferredLayout as string,
    reviewScore: (c.reviewScore as number) ?? 0,
    reviewCount: (c.reviewCount as number) ?? 0,
    isVerified: (c.isVerified as boolean) ?? false,
    socialLinks: c.socialLinks as Record<string, string> | null,
    profileViewCount: ((c.profileViewCount as number) ?? 0),
    portfolioItemCount: Array.isArray(c.PortfolioItem) ? (c.PortfolioItem as unknown[]).length : 0,
  }));

  // Find max values for normalization
  const maxViews = Math.max(...scoredRows.map((r) => r.profileViewCount), 1);
  const maxPortfolio = Math.max(...scoredRows.map((r) => r.portfolioItemCount), 1);

  // Score and sort
  const scored = scoredRows
    .map((row) => ({ row, score: computeScore(row, maxViews, maxPortfolio) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Map to CreatorProfile shape
  const { getCreatorByUsernameFromDB } = await import('./supabase-queries');

  // For simplicity, fetch full profiles for the top N
  const profiles: CreatorProfile[] = [];
  for (const { row } of scored) {
    const profile = await getCreatorByUsernameFromDB(row.username);
    if (profile) profiles.push(profile);
  }

  return profiles;
}
