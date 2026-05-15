'use server';

import { revalidatePath } from 'next/cache';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import type { BlogPost } from './mock-data';
import {
  createPost,
  deletePost,
  getPostById,
  publishPost,
  unpublishPost,
  updatePost,
} from './mock-store';
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

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
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
  const creator = await getMyCreatorProfile(session.user.email);
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

export async function createPostAction(
  locale: Locale,
  _prev: BlogResult | null,
  formData: FormData,
): Promise<BlogResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const post = createPost({
    creatorId: auth.creator.id,
    titleEn: parsed.data.titleEn,
    titleAr: parsed.data.titleAr || undefined,
    coverUrl: parsed.data.coverUrl || undefined,
    bodyEn: parsed.data.bodyEn,
    bodyAr: parsed.data.bodyAr || undefined,
    tags: parsed.data.tagsRaw,
    status: parsed.data.status,
    slug: parsed.data.slug || undefined,
  });

  revalidateAuthorPaths(locale, auth.creator.username, post.slug);
  return { ok: true, post };
}

export async function updatePostAction(
  locale: Locale,
  postId: string,
  _prev: BlogResult | null,
  formData: FormData,
): Promise<BlogResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const existing = getPostById(postId);
  if (!existing) return { ok: false, error: 'POST_NOT_FOUND' };
  if (existing.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const parsed = updatePostSchema.safeParse({
    titleEn: formData.get('titleEn'),
    titleAr: formData.get('titleAr') || undefined,
    coverUrl: formData.get('coverUrl') || undefined,
    bodyEn: formData.get('bodyEn'),
    bodyAr: formData.get('bodyAr') || undefined,
    tagsRaw: formData.get('tagsRaw') ?? '',
    status: formData.get('status') ?? existing.status,
    slug: formData.get('slug') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const post = updatePost(postId, {
    titleEn: parsed.data.titleEn,
    titleAr: parsed.data.titleAr || undefined,
    coverUrl: parsed.data.coverUrl || undefined,
    bodyEn: parsed.data.bodyEn,
    bodyAr: parsed.data.bodyAr || undefined,
    tags: parsed.data.tagsRaw,
    status: parsed.data.status,
  });

  revalidateAuthorPaths(locale, auth.creator.username, existing.slug);
  if (post.slug !== existing.slug) {
    revalidatePath(`/${locale}/${auth.creator.username}/blog/${post.slug}`);
  }
  return { ok: true, post, message: 'SAVED' };
}

export async function deletePostAction(
  locale: Locale,
  postId: string,
): Promise<BlogResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const existing = getPostById(postId);
  if (!existing) return { ok: false, error: 'POST_NOT_FOUND' };
  if (existing.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  deletePost(postId);
  revalidateAuthorPaths(locale, auth.creator.username, existing.slug);
  return { ok: true };
}

export async function publishPostAction(
  locale: Locale,
  postId: string,
  publish: boolean,
): Promise<BlogResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const existing = getPostById(postId);
  if (!existing) return { ok: false, error: 'POST_NOT_FOUND' };
  if (existing.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const post = publish ? publishPost(postId) : unpublishPost(postId);
  revalidateAuthorPaths(locale, auth.creator.username, existing.slug);
  return { ok: true, post };
}
