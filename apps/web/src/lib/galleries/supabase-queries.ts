import 'server-only';

import type { Gallery, GalleryAccess, GalleryImage } from './mock-data';

/**
 * Real Supabase queries for galleries (Collection + CollectionImage).
 *
 * Each function uses the Next.js server Supabase client (cookie-based auth,
 * anon key) and returns data shaped to match the `Gallery` type from
 * mock-data.ts so downstream components don't need changes.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end Gallery shape
// ---------------------------------------------------------------------------

interface DbCollectionImageRow {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  orderIndex: number;
}

interface DbCollectionRow {
  id: string;
  creatorId: string;
  shareSlug: string;
  titleEn: string;
  titleAr: string | null;
  coverUrl: string | null;
  message: string | null;
  access: CollectionAccess;
  allowDownloads: boolean;
  watermarkPreviews: boolean;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  CollectionImage?: DbCollectionImageRow[];
}

// DB uses CollectionAccess enum; front-end uses GalleryAccess (same values).
type CollectionAccess = 'OPEN_LINK' | 'PASSWORD' | 'EMAIL_GATED';

function mapGallery(row: DbCollectionRow): Gallery {
  const images: GalleryImage[] = (row.CollectionImage ?? [])
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((img) => ({
      id: img.id,
      url: img.url,
      width: img.width ?? 1200,
      height: img.height ?? 900,
    }));

  return {
    id: row.id,
    shareSlug: row.shareSlug,
    creatorId: row.creatorId,
    titleEn: row.titleEn,
    titleAr: row.titleAr ?? undefined,
    coverUrl: row.coverUrl ?? '',
    message: row.message ?? undefined,
    access: row.access as GalleryAccess,
    allowDownloads: row.allowDownloads,
    watermarkPreviews: row.watermarkPreviews,
    expiresAt: row.expiresAt ?? undefined,
    publishedAt: row.publishedAt ?? row.createdAt,
    createdAt: row.createdAt,
    images,
  };
}

/** Standard select clause for Collection + nested CollectionImage. */
const COLLECTION_SELECT = `
  id, creatorId, shareSlug,
  titleEn, titleAr,
  coverUrl, message,
  access, allowDownloads, watermarkPreviews,
  expiresAt, publishedAt, createdAt,
  CollectionImage ( id, url, thumbnailUrl, width, height, orderIndex )
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export async function listGalleriesByCreatorFromDB(
  creatorId: string,
): Promise<Gallery[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Collection')
    .select(COLLECTION_SELECT)
    .eq('creatorId', creatorId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listGalleriesByCreatorFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapGallery(row as DbCollectionRow));
}

export async function getGalleryByIdFromDB(id: string): Promise<Gallery | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Collection')
    .select(COLLECTION_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getGalleryByIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapGallery(data as unknown as DbCollectionRow);
}

export async function getGalleryBySlugFromDB(slug: string): Promise<Gallery | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Collection')
    .select(COLLECTION_SELECT)
    .eq('shareSlug', slug)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getGalleryBySlugFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapGallery(data as unknown as DbCollectionRow);
}
