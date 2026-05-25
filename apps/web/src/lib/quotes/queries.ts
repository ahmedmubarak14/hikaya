import 'server-only';

import type { Quote } from './mock-data';
import {
  getQuoteById as getQuoteByIdRaw,
  getQuoteBySlug as getQuoteBySlugRaw,
  listQuotesByCreator as listQuotesByCreatorRaw,
} from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export async function listQuotesByCreator(creatorId: string): Promise<Quote[]> {
  if (!isStaticExport) {
    try {
      const { listQuotesByCreatorFromDB } = await import('./supabase-queries');
      const result = await listQuotesByCreatorFromDB(creatorId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return listQuotesByCreatorRaw(creatorId);
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  if (!isStaticExport) {
    try {
      const { getQuoteByIdFromDB } = await import('./supabase-queries');
      const result = await getQuoteByIdFromDB(id);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getQuoteByIdRaw(id);
}

export async function getQuoteBySlug(slug: string): Promise<Quote | null> {
  if (!isStaticExport) {
    try {
      const { getQuoteBySlugFromDB } = await import('./supabase-queries');
      const result = await getQuoteBySlugFromDB(slug);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getQuoteBySlugRaw(slug);
}
