import 'server-only';

import type { BlogPost, PostStatus } from './mock-data';

/**
 * Real Supabase queries for blog posts (BlogPost table).
 *
 * Each function uses the Next.js server Supabase client (cookie-based auth,
 * anon key) and returns data shaped to match the `BlogPost` type from
 * mock-data.ts so downstream components don't need changes.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end BlogPost shape
// ---------------------------------------------------------------------------

interface DbBlogPostRow {
  id: string;
  creatorId: string;
  slug: string;
  titleEn: string;
  titleAr: string | null;
  coverUrl: string | null;
  bodyEn: string;
  bodyAr: string | null;
  tags: string[];
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapPost(row: DbBlogPostRow): BlogPost {
  return {
    id: row.id,
    creatorId: row.creatorId,
    slug: row.slug,
    titleEn: row.titleEn,
    titleAr: row.titleAr ?? undefined,
    coverUrl: row.coverUrl ?? undefined,
    bodyEn: row.bodyEn,
    bodyAr: row.bodyAr ?? undefined,
    tags: row.tags ?? [],
    status: row.status,
    publishedAt: row.publishedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const BLOGPOST_SELECT = `
  id, creatorId, slug,
  titleEn, titleAr,
  coverUrl,
  bodyEn, bodyAr,
  tags, status,
  publishedAt, createdAt, updatedAt
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export async function listPostsByCreatorFromDB(
  creatorId: string,
  opts: { status?: PostStatus; limit?: number } = {},
): Promise<BlogPost[]> {
  const supabase = await getClient();

  let query = supabase
    .from('BlogPost')
    .select(BLOGPOST_SELECT)
    .eq('creatorId', creatorId);

  if (opts.status) {
    query = query.eq('status', opts.status);
  }

  query = query.order('publishedAt', { ascending: false, nullsFirst: false });

  if (typeof opts.limit === 'number') {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[supabase-queries] listPostsByCreatorFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapPost(row as DbBlogPostRow));
}

export async function listPublishedPostsByCreatorFromDB(
  creatorId: string,
): Promise<BlogPost[]> {
  return listPostsByCreatorFromDB(creatorId, { status: 'PUBLISHED' });
}

export async function listAllPublishedPostsFromDB(limit?: number): Promise<BlogPost[]> {
  const supabase = await getClient();

  let query = supabase
    .from('BlogPost')
    .select(BLOGPOST_SELECT)
    .eq('status', 'PUBLISHED')
    .order('publishedAt', { ascending: false, nullsFirst: false });

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[supabase-queries] listAllPublishedPostsFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapPost(row as DbBlogPostRow));
}

export async function getPostBySlugFromDB(
  creatorId: string,
  slug: string,
): Promise<BlogPost | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('BlogPost')
    .select(BLOGPOST_SELECT)
    .eq('creatorId', creatorId)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getPostBySlugFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapPost(data as unknown as DbBlogPostRow);
}

export async function getPostByIdFromDB(id: string): Promise<BlogPost | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('BlogPost')
    .select(BLOGPOST_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getPostByIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapPost(data as unknown as DbBlogPostRow);
}
