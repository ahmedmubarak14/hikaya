import 'server-only';

import type { Locale } from '@/i18n/config';
import type {
  CreatorProfile,
  PortfolioItem,
  City,
  Discipline,
  Availability,
  PortfolioLayout,
} from './mock-data';

/**
 * Real Supabase queries for creator profiles + portfolios.
 *
 * Each function uses the Next.js server Supabase client (cookie-based auth,
 * anon key) and returns data shaped to match the `CreatorProfile` type from
 * mock-data.ts so downstream components don't need changes.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end CreatorProfile shape
// ---------------------------------------------------------------------------

/** DB stores Locale as 'EN'|'AR'; front-end uses 'en'|'ar'. */
function mapLocale(dbLocale: string): Locale {
  return dbLocale.toLowerCase() as Locale;
}

interface DbCreatorRow {
  id: string;
  userId: string;
  username: string;
  displayNameEn: string;
  displayNameAr: string | null;
  bioEn: string | null;
  bioAr: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  disciplines: Discipline[];
  city: City;
  startingPriceSar: number | null;
  yearsExperience: number | null;
  languages: string[];
  availability: Availability;
  preferredLayout: PortfolioLayout;
  accentColor: string | null;
  sectionsOrder: string[] | null;
  reviewScore: number;
  reviewCount: number;
  isVerified: boolean;
  socialLinks: Record<string, string> | null;
  User?: { email: string } | null;
  PortfolioItem?: DbPortfolioRow[];
}

interface DbPortfolioRow {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  titleEn: string | null;
  titleAr: string | null;
  projectId: string | null;
  orderIndex: number;
}

function mapCreator(row: DbCreatorRow): CreatorProfile {
  const portfolioItems: PortfolioItem[] = (row.PortfolioItem ?? [])
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((p) => ({
      id: p.id,
      url: p.url,
      width: p.width ?? 800,
      height: p.height ?? 800,
      titleEn: p.titleEn ?? undefined,
      titleAr: p.titleAr ?? undefined,
      projectId: p.projectId ?? undefined,
    }));

  return {
    id: row.id,
    username: row.username,
    ownerEmail: row.User?.email,
    displayNameEn: row.displayNameEn,
    displayNameAr: row.displayNameAr ?? row.displayNameEn,
    bioEn: row.bioEn ?? '',
    bioAr: row.bioAr ?? '',
    avatarUrl: row.avatarUrl ?? '',
    coverUrl: row.coverUrl ?? '',
    disciplines: row.disciplines,
    city: row.city,
    startingPriceSar: row.startingPriceSar,
    yearsExperience: row.yearsExperience ?? 0,
    languages: (row.languages ?? []).map(mapLocale),
    availability: row.availability,
    preferredLayout: row.preferredLayout,
    accentColor: row.accentColor ?? null,
    sectionsOrder: (row.sectionsOrder as ('work' | 'store' | 'about')[] | null) ?? null,
    reviewScore: row.reviewScore,
    reviewCount: row.reviewCount,
    isVerified: row.isVerified,
    socialLinks: (row.socialLinks as { instagram?: string; website?: string }) ?? {},
    portfolio: portfolioItems,
  };
}

/** Standard select clause for CreatorProfile + nested relations. */
const CREATOR_SELECT = `
  id, userId, username,
  displayNameEn, displayNameAr,
  bioEn, bioAr,
  avatarUrl, coverUrl,
  disciplines, city,
  startingPriceSar, yearsExperience,
  languages, availability,
  preferredLayout, accentColor, sectionsOrder,
  reviewScore, reviewCount,
  isVerified, socialLinks,
  User ( email ),
  PortfolioItem ( id, url, thumbnailUrl, width, height, titleEn, titleAr, projectId, orderIndex )
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export interface ListCreatorsFilter {
  city?: City;
  discipline?: Discipline;
  available?: boolean;
}

export async function listCreatorsFromDB(
  filter: ListCreatorsFilter = {},
): Promise<CreatorProfile[]> {
  const supabase = await getClient();

  let query = supabase.from('CreatorProfile').select(CREATOR_SELECT);

  if (filter.city) {
    query = query.eq('city', filter.city);
  }
  if (filter.discipline) {
    query = query.contains('disciplines', [filter.discipline]);
  }
  if (filter.available) {
    query = query.eq('availability', 'AVAILABLE');
  }

  // Sort: verified first, then by reviewScore descending
  query = query.order('isVerified', { ascending: false }).order('reviewScore', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[supabase-queries] listCreatorsFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapCreator(row as DbCreatorRow));
}

export async function getCreatorByUsernameFromDB(
  username: string,
): Promise<CreatorProfile | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('CreatorProfile')
    .select(CREATOR_SELECT)
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getCreatorByUsernameFromDB error:', error.message);
    return null;
  }

  if (!data) return null;

  return mapCreator(data as unknown as DbCreatorRow);
}

/**
 * Featured creators — homepage recommendation algorithm.
 *
 * Pulls a 50-row candidate window (verified-first, top reviewScore) from
 * Supabase, then re-ranks in JS using a simple weighted score that combines
 * three signals: verified badge (boost), normalised reviewScore (0-5), and a
 * log-scaled profileViewCount so popular profiles surface without burying
 * new high-quality ones.
 *
 * Score = (isVerified ? 1.0 : 0) + (reviewScore / 5) + log10(viewCount+1)/4
 *
 * Tie-break: createdAt desc so fresh additions get a fair shake.
 */
export async function listFeaturedCreatorsFromDB(limit = 4): Promise<CreatorProfile[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('CreatorProfile')
    .select(CREATOR_SELECT)
    .order('isVerified', { ascending: false })
    .order('reviewScore', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[supabase-queries] listFeaturedCreatorsFromDB error:', error.message);
    return [];
  }

  const candidates = (data ?? []).map((row: unknown) => mapCreator(row as DbCreatorRow));

  // Re-rank with the weighted score. `profileViewCount` lives outside the
  // CreatorProfile select; fetch a small batch for the candidate ids.
  let viewsById = new Map<string, number>();
  if (candidates.length > 0) {
    const ids = candidates.map((c) => c.id);
    const { data: viewRows } = await supabase
      .from('CreatorProfile')
      .select('id, profileViewCount')
      .in('id', ids);
    viewsById = new Map(
      (viewRows ?? []).map((r) => [r.id as string, (r.profileViewCount as number) ?? 0]),
    );
  }

  const scored = candidates.map((c) => {
    const views = viewsById.get(c.id) ?? 0;
    const score =
      (c.isVerified ? 1 : 0) +
      (c.reviewScore ?? 0) / 5 +
      Math.log10(views + 1) / 4;
    return { c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ c }) => c);
}

export async function getCreatorByOwnerEmailFromDB(
  email: string,
): Promise<CreatorProfile | null> {
  const supabase = await getClient();

  // Step 1: resolve the User by email — we own the User table and the row
  // is small. (The previous one-shot join used `.eq('User.email', …)` which
  // PostgREST does NOT filter through a relation, so it silently returned
  // the wrong row + .maybeSingle() threw "more than one row" → null.)
  const { data: userRow } = await supabase
    .from('User')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!userRow) return null;

  return getCreatorByUserIdFromDB(userRow.id as string);
}

/**
 * Direct lookup by User.id — preferred over the email-roundtrip variant.
 * Called from the /me pages where the signed-in user id is known.
 */
export async function getCreatorByUserIdFromDB(
  userId: string,
): Promise<CreatorProfile | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('CreatorProfile')
    .select(CREATOR_SELECT)
    .eq('userId', userId)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getCreatorByUserIdFromDB error:', error.message);
    return null;
  }
  if (!data) return null;
  return mapCreator(data as unknown as DbCreatorRow);
}
