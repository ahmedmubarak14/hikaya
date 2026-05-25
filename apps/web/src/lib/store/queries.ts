import 'server-only';

import type { Product } from './mock-data';
import {
  getProductById as getProductByIdRaw,
  getProductBySlug as getProductBySlugRaw,
  listAllProductsByCreator as listAllProductsByCreatorRaw,
} from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export async function listProductsByCreator(creatorId: string): Promise<Product[]> {
  if (!isStaticExport) {
    try {
      const { listProductsByCreatorFromDB } = await import('./supabase-queries');
      const result = await listProductsByCreatorFromDB(creatorId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return listAllProductsByCreatorRaw(creatorId);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isStaticExport) {
    try {
      const { getProductByIdFromDB } = await import('./supabase-queries');
      const result = await getProductByIdFromDB(id);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getProductByIdRaw(id);
}

export async function getProductBySlug(
  creatorId: string,
  slug: string,
): Promise<Product | null> {
  if (!isStaticExport) {
    try {
      const { getProductBySlugFromDB } = await import('./supabase-queries');
      const result = await getProductBySlugFromDB(creatorId, slug);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getProductBySlugRaw(creatorId, slug);
}
