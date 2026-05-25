import 'server-only';

import type { Gallery } from './mock-data';
import {
  getGalleryById as getGalleryByIdRaw,
  getGalleryBySlug as getGalleryBySlugRaw,
  listGalleriesByCreator as listGalleriesByCreatorRaw,
} from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export async function listGalleriesByCreator(creatorId: string): Promise<Gallery[]> {
  if (!isStaticExport) {
    try {
      const { listGalleriesByCreatorFromDB } = await import('./supabase-queries');
      const result = await listGalleriesByCreatorFromDB(creatorId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return listGalleriesByCreatorRaw(creatorId);
}

export async function getGalleryById(id: string): Promise<Gallery | null> {
  if (!isStaticExport) {
    try {
      const { getGalleryByIdFromDB } = await import('./supabase-queries');
      const result = await getGalleryByIdFromDB(id);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getGalleryByIdRaw(id);
}

export async function getGalleryBySlug(slug: string): Promise<Gallery | null> {
  if (!isStaticExport) {
    try {
      const { getGalleryBySlugFromDB } = await import('./supabase-queries');
      const result = await getGalleryBySlugFromDB(slug);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getGalleryBySlugRaw(slug);
}
