'use server';

import { randomBytes } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

import type { BlogPost } from './mock-data';
import { createPostSchema, updatePostSchema } from './schemas';

/**
 * Per-creator blog server actions. Each returns a discriminated union the
 * client can switch on; the editor surfaces field errors and the row
 * controls surface a generic failure. Mirrors the shape used by
 * `lib/store/actions.ts`.
 */

export type BlogErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'NO_CREATOR_PROFILE'
  | 'POST_NOT_FOUND'
  | 'NOT_OWNER'
  | 'UNKNOWN';

export interface BlogSuccess {
  ok: true;
  post?: BlogPost;
  message?: string;
  error?: undefined;
  fieldErrors?: undefined;
}
export interface BlogFailure {
  ok: false;
  error: BlogErrorKey;
  fieldErrors?: Record<string, string>;
  post?: undefined;
  message?: undefined;
}
export type BlogResult = BlogSuccess | BlogFailure;

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function requireOwnedCreator() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: 'NOT_AUTHENTICATED' as const };
  const creator = await getMyCreatorProfile({ userId: session.user.id, email: session.user.email });
  if (!creator) return { ok: false as const, error: 'NO_CREATOR_PROFILE' as const };
  return { ok: true as const, creator, session };
}

function parsePostForm(formData: FormData) {
  return createPostSchema.safeParse({
    titleEn: formData.get('titleEn'),
    titleAr: formData.get('titleAr') || undefined,
    coverUrl: formData.get('coverUrl') || undefined,
    bodyEn: formData.get('bodyEn'),
    bodyAr: formData.get('bodyAr') || undefined,
    tagsRaw: formData.get('tagsRaw') ?? '',
    status: formData.get('status') ?? 'DRAFT',
    slug: formData.get('slug') || undefined,
  });
}

function revalidateAuthorPaths(locale: Locale, username: string, slug?: string) {
  revalidatePath(`/${locale}/me/blog`);
  revalidatePath(`/${locale}/${username}/blog`);
  if (slug) revalidatePath(`/${locale}/${username}/blog/${slug}`);
  // The profile page shows a "Read N posts on Journal" link when posts exist.
  revalidatePath(`/${locale}/${username}`);
}

/**
 * Generate a URL-safe slug from a title string, ensuring uniqueness per
 * creator by querying Supabase.
 */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string,
  base: string,
): Promise<string> {
  const norm = base
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const candidate = norm.length >= 3 ? norm : `post-${randomBytes(3).toString('hex')}`;

  // Check for slug collisions
  const { data: existing } = await supabase
    .from('BlogPost')
    .select('id')
    .eq('creatorId', creatorId)
    .eq('slug', candidate)
    .maybeSingle();

  if (!existing) return candidate;

  // Add suffix until unique
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const suffixed = `${norm}-${i}`;
    const { data: collision } = await supabase
      .from('BlogPost')
      .select('id')
      .eq('creatorId', creatorId)
      .eq('slug', suffixed)
      .maybeSingle();
    if (!collision) return suffixed;
    i += 1;
  }
}

function mapRowToPost(row: Record<string, unknown>): BlogPost {
  return {
    id: row.id as string,
    creatorId: row.creatorId as string,
    slug: row.slug as string,
    titleEn: row.titleEn as string,
    titleAr: (row.titleAr as string) ?? undefined,
    coverUrl: (row.coverUrl as string) ?? undefined,
    bodyEn: row.bodyEn as string,
    bodyAr: (row.bodyAr as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    status: row.status as BlogPost['status'],
    publishedAt: (row.publishedAt as string) ?? undefined,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export async function createPostAction(
  locale: Locale,
  _prev: BlogResult | null,
  formData: FormData,
): Promise<BlogResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const slug = await uniqueSlug(supabase, auth.creator.id, parsed.data.slug || parsed.data.titleEn);
  const isPublished = parsed.data.status === 'PUBLISHED';

  const { data: post, error } = await supabase
    .from('BlogPost')
    .insert({
      creatorId: auth.creator.id,
      slug,
      titleEn: parsed.data.titleEn,
      titleAr: parsed.data.titleAr || null,
      coverUrl: parsed.data.coverUrl || null,
      bodyEn: parsed.data.bodyEn,
      bodyAr: parsed.data.bodyAr || null,
      tags: parsed.data.tagsRaw,
      status: parsed.data.status,
      publishedAt: isPublished ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    console.error('[blog/actions] createPostAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidateAuthorPaths(locale, auth.creator.username, post.slug as string);
  return { ok: true, post: mapRowToPost(post as Record<string, unknown>) };
}

export async function updatePostAction(
  locale: Locale,
  postId: string,
  _prev: BlogResult | null,
  formData: FormData,
): Promise<BlogResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  // Fetch existing post to verify ownership
  const { data: existing, error: fetchErr } = await supabase
    .from('BlogPost')
    .select('id, creatorId, slug, status, publishedAt')
    .eq('id', postId)
    .maybeSingle();

  if (fetchErr || !existing) return { ok: false, error: 'POST_NOT_FOUND' };
  if ((existing.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const parsed = updatePostSchema.safeParse({
    titleEn: formData.get('titleEn'),
    titleAr: formData.get('titleAr') || undefined,
    coverUrl: formData.get('coverUrl') || undefined,
    bodyEn: formData.get('bodyEn'),
    bodyAr: formData.get('bodyAr') || undefined,
    tagsRaw: formData.get('tagsRaw') ?? '',
    status: formData.get('status') ?? (existing.status as string),
    slug: formData.get('slug') || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  // Determine if this is a first-time publish
  const becomingPublished =
    parsed.data.status === 'PUBLISHED' &&
    (existing.status as string) !== 'PUBLISHED' &&
    !existing.publishedAt;

  const now = new Date().toISOString();

  const { data: post, error: updateErr } = await supabase
    .from('BlogPost')
    .update({
      titleEn: parsed.data.titleEn,
      titleAr: parsed.data.titleAr || null,
      coverUrl: parsed.data.coverUrl || null,
      bodyEn: parsed.data.bodyEn,
      bodyAr: parsed.data.bodyAr || null,
      tags: parsed.data.tagsRaw,
      status: parsed.data.status,
      publishedAt: becomingPublished ? now : (existing.publishedAt as string | null),
      updatedAt: now,
    })
    .eq('id', postId)
    .select()
    .single();

  if (updateErr) {
    console.error('[blog/actions] updatePostAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  const mappedPost = mapRowToPost(post as Record<string, unknown>);
  revalidateAuthorPaths(locale, auth.creator.username, existing.slug as string);
  if (mappedPost.slug !== (existing.slug as string)) {
    revalidatePath(`/${locale}/${auth.creator.username}/blog/${mappedPost.slug}`);
  }
  return { ok: true, post: mappedPost, message: 'SAVED' };
}

export async function deletePostAction(locale: Locale, postId: string): Promise<BlogResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('BlogPost')
    .select('id, creatorId, slug')
    .eq('id', postId)
    .maybeSingle();

  if (fetchErr || !existing) return { ok: false, error: 'POST_NOT_FOUND' };
  if ((existing.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const { error: deleteErr } = await supabase.from('BlogPost').delete().eq('id', postId);

  if (deleteErr) {
    console.error('[blog/actions] deletePostAction error:', deleteErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidateAuthorPaths(locale, auth.creator.username, existing.slug as string);
  return { ok: true };
}

export async function publishPostAction(
  locale: Locale,
  postId: string,
  publish: boolean,
): Promise<BlogResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('BlogPost')
    .select('id, creatorId, slug, status, publishedAt')
    .eq('id', postId)
    .maybeSingle();

  if (fetchErr || !existing) return { ok: false, error: 'POST_NOT_FOUND' };
  if ((existing.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const now = new Date().toISOString();
  const isFirstPublish = publish && !existing.publishedAt;

  const { data: post, error: updateErr } = await supabase
    .from('BlogPost')
    .update({
      status: publish ? 'PUBLISHED' : 'DRAFT',
      publishedAt: isFirstPublish ? now : (existing.publishedAt as string | null),
      updatedAt: now,
    })
    .eq('id', postId)
    .select()
    .single();

  if (updateErr) {
    console.error('[blog/actions] publishPostAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidateAuthorPaths(locale, auth.creator.username, existing.slug as string);
  return { ok: true, post: mapRowToPost(post as Record<string, unknown>) };
}
