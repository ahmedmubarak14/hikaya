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
 * Server-only query helpers. Today they read from the mutable in-memory
 * blog store; the eventual swap to @hikaya/api only touches this file.
 * Shapes match the future API response.
 */

export async function listPostsByCreator(
  creatorId: string,
  opts: { status?: PostStatus; limit?: number } = {},
): Promise<BlogPost[]> {
  return getPostsByCreatorRaw(creatorId, opts);
}

export async function listPublishedPostsByCreator(creatorId: string): Promise<BlogPost[]> {
  return getPublishedPostsByCreatorRaw(creatorId);
}

export async function getPostBySlug(creatorId: string, slug: string): Promise<BlogPost | null> {
  return getPostBySlugRaw(creatorId, slug);
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  return getPostByIdRaw(id);
}

export async function listAllPublishedPosts(limit?: number): Promise<BlogPost[]> {
  return getAllPublishedPostsRaw(limit);
}
