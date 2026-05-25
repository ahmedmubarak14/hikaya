import 'server-only';

import type { BlogPost, PostStatus } from './mock-data';
import {
  getAllPublishedPosts as getAllPublishedPostsRaw,
  getPostById as getPostByIdRaw,
  getPostBySlug as getPostBySlugRaw,
  getPostsByCreator as getPostsByCreatorRaw,
  getPublishedPostsByCreator as getPublishedPostsByCreatorRaw,
} from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export async function listPostsByCreator(
  creatorId: string,
  opts: { status?: PostStatus; limit?: number } = {},
): Promise<BlogPost[]> {
  if (!isStaticExport) {
    try {
      const { listPostsByCreatorFromDB } = await import('./supabase-queries');
      const result = await listPostsByCreatorFromDB(creatorId, opts);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getPostsByCreatorRaw(creatorId, opts);
}

export async function listPublishedPostsByCreator(creatorId: string): Promise<BlogPost[]> {
  if (!isStaticExport) {
    try {
      const { listPublishedPostsByCreatorFromDB } = await import('./supabase-queries');
      const result = await listPublishedPostsByCreatorFromDB(creatorId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getPublishedPostsByCreatorRaw(creatorId);
}

export async function getPostBySlug(creatorId: string, slug: string): Promise<BlogPost | null> {
  if (!isStaticExport) {
    try {
      const { getPostBySlugFromDB } = await import('./supabase-queries');
      const result = await getPostBySlugFromDB(creatorId, slug);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getPostBySlugRaw(creatorId, slug);
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  if (!isStaticExport) {
    try {
      const { getPostByIdFromDB } = await import('./supabase-queries');
      const result = await getPostByIdFromDB(id);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getPostByIdRaw(id);
}

export async function listAllPublishedPosts(limit?: number): Promise<BlogPost[]> {
  if (!isStaticExport) {
    try {
      const { listAllPublishedPostsFromDB } = await import('./supabase-queries');
      const result = await listAllPublishedPostsFromDB(limit);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getAllPublishedPostsRaw(limit);
}
