import 'server-only';

import { randomBytes } from 'node:crypto';

import { type BlogPost, type PostStatus, SEED_BLOG_POSTS } from './mock-data';

/**
 * Mutable in-memory store for creator blog posts. Mirrors the pattern in
 * `lib/store/mock-store.ts`: seed once into a Map at boot, survive Next.js
 * dev HMR via globalThis, expose a thin CRUD surface that the queries +
 * actions wrap.
 */

interface Store {
  posts: Map<string, BlogPost>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaBlogStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaBlogStore ??
  (() => {
    const fresh: Store = { posts: new Map() };
    for (const p of SEED_BLOG_POSTS) {
      fresh.posts.set(p.id, { ...p, tags: [...p.tags] });
    }
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaBlogStore = store;
}

/* ----------------------------------- read --------------------------------- */

interface ListOptions {
  status?: PostStatus;
  limit?: number;
}

export function getPostsByCreator(
  creatorId: string,
  { status, limit }: ListOptions = {},
): BlogPost[] {
  let out = [...store.posts.values()].filter((p) => p.creatorId === creatorId);
  if (status) out = out.filter((p) => p.status === status);
  // Newest first; published posts sort by publishedAt, drafts by updatedAt.
  out.sort((a, b) => {
    const aDate = a.publishedAt ?? a.updatedAt;
    const bDate = b.publishedAt ?? b.updatedAt;
    return bDate.localeCompare(aDate);
  });
  if (typeof limit === 'number') out = out.slice(0, limit);
  return out;
}

export function getPublishedPostsByCreator(creatorId: string): BlogPost[] {
  return getPostsByCreator(creatorId, { status: 'PUBLISHED' });
}

export function getPostBySlug(creatorId: string, slug: string): BlogPost | null {
  for (const p of store.posts.values()) {
    if (p.creatorId === creatorId && p.slug === slug) return p;
  }
  return null;
}

export function getPostById(id: string): BlogPost | null {
  return store.posts.get(id) ?? null;
}

/* ---------------------------------- write --------------------------------- */

function uniqueSlug(creatorId: string, base: string): string {
  const norm = base
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  let candidate = norm.length >= 3 ? norm : `post-${randomBytes(3).toString('hex')}`;
  let i = 1;
  while ([...store.posts.values()].some((p) => p.creatorId === creatorId && p.slug === candidate)) {
    i += 1;
    candidate = `${norm}-${i}`;
  }
  return candidate;
}

export interface CreatePostInput {
  creatorId: string;
  titleEn: string;
  titleAr?: string;
  coverUrl?: string;
  bodyEn: string;
  bodyAr?: string;
  tags: string[];
  status: PostStatus;
  /** Optional override; if absent we slugify titleEn. */
  slug?: string;
}

export function createPost(input: CreatePostInput): BlogPost {
  const id = `bp_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();
  const post: BlogPost = {
    id,
    creatorId: input.creatorId,
    slug: uniqueSlug(input.creatorId, input.slug || input.titleEn),
    titleEn: input.titleEn,
    titleAr: input.titleAr,
    coverUrl: input.coverUrl,
    bodyEn: input.bodyEn,
    bodyAr: input.bodyAr,
    tags: [...input.tags],
    status: input.status,
    publishedAt: input.status === 'PUBLISHED' ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };
  store.posts.set(id, post);
  return post;
}

export type PostPatch = Partial<
  Omit<BlogPost, 'id' | 'creatorId' | 'slug' | 'createdAt' | 'updatedAt'>
>;

export function updatePost(id: string, patch: PostPatch): BlogPost {
  const existing = store.posts.get(id);
  if (!existing) throw new Error('POST_NOT_FOUND');

  // Flipping DRAFT → PUBLISHED for the first time stamps publishedAt.
  const becomingPublished =
    patch.status === 'PUBLISHED' && existing.status !== 'PUBLISHED' && !existing.publishedAt;

  const updated: BlogPost = {
    ...existing,
    ...patch,
    tags: patch.tags ? [...patch.tags] : existing.tags,
    publishedAt: becomingPublished
      ? new Date().toISOString()
      : (patch.publishedAt ?? existing.publishedAt),
    updatedAt: new Date().toISOString(),
  };
  store.posts.set(id, updated);
  return updated;
}

export function deletePost(id: string): void {
  store.posts.delete(id);
}

export function publishPost(id: string): BlogPost {
  return updatePost(id, { status: 'PUBLISHED' });
}

export function unpublishPost(id: string): BlogPost {
  return updatePost(id, { status: 'DRAFT' });
}
