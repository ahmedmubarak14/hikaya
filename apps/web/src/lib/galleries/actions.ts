'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import {
  addImagesToGallery,
  createGallery,
  deleteGallery,
  getGalleryById,
  getGalleryBySlug,
  removeImageFromGallery,
  toggleVisitorSelection,
} from './mock-store';
import { addImagesSchema, createGallerySchema } from './schemas';

const VISITOR_COOKIE = 'hikaya_visitor';

export type GalleryErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'NO_CREATOR_PROFILE'
  | 'GALLERY_NOT_FOUND'
  | 'NOT_OWNER'
  | 'UNKNOWN';

export interface GalleryFailure {
  ok: false;
  error: GalleryErrorKey;
  fieldErrors?: Record<string, string>;
}
export interface GallerySuccess {
  ok: true;
  error?: undefined;
  fieldErrors?: undefined;
  message?: string;
}
export type GalleryResult = GallerySuccess | GalleryFailure;

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
  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) return { ok: false as const, error: 'NO_CREATOR_PROFILE' as const };
  return { ok: true as const, creator, session };
}

/* ----------------------------- creator actions ----------------------------- */

export async function createGalleryAction(
  locale: Locale,
  _prev: GalleryResult | null,
  formData: FormData,
): Promise<GalleryResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = createGallerySchema.safeParse({
    titleEn: formData.get('titleEn'),
    titleAr: formData.get('titleAr') || undefined,
    message: formData.get('message') || undefined,
    coverUrl: formData.get('coverUrl') || undefined,
    allowDownloads: formData.get('allowDownloads') === 'on',
    watermarkPreviews: formData.get('watermarkPreviews') === 'on',
    expiresInDays: formData.get('expiresInDays') || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const gallery = createGallery({
    creatorId: auth.creator.id,
    titleEn: parsed.data.titleEn,
    titleAr: parsed.data.titleAr || undefined,
    message: parsed.data.message || undefined,
    coverUrl: parsed.data.coverUrl || undefined,
    allowDownloads: parsed.data.allowDownloads,
    watermarkPreviews: parsed.data.watermarkPreviews,
    expiresInDays: parsed.data.expiresInDays,
  });

  revalidatePath(`/${locale}/me/galleries`);
  redirect(`/${locale}/me/galleries/${gallery.id}`);
}

export async function deleteGalleryAction(
  locale: Locale,
  galleryId: string,
): Promise<GalleryResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const gallery = getGalleryById(galleryId);
  if (!gallery) return { ok: false, error: 'GALLERY_NOT_FOUND' };
  if (gallery.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  deleteGallery(galleryId);
  revalidatePath(`/${locale}/me/galleries`);
  redirect(`/${locale}/me/galleries`);
}

export async function addImagesAction(
  locale: Locale,
  galleryId: string,
  _prev: GalleryResult | null,
  formData: FormData,
): Promise<GalleryResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const gallery = getGalleryById(galleryId);
  if (!gallery) return { ok: false, error: 'GALLERY_NOT_FOUND' };
  if (gallery.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const parsed = addImagesSchema.safeParse({ urls: formData.get('urls') ?? '' });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  addImagesToGallery(
    galleryId,
    parsed.data.urls.map((url) => ({ url })),
  );

  revalidatePath(`/${locale}/me/galleries/${galleryId}`);
  revalidatePath(`/${locale}/g/${gallery.shareSlug}`);

  return { ok: true, message: 'IMAGES_ADDED' };
}

export async function removeImageAction(
  locale: Locale,
  galleryId: string,
  imageId: string,
): Promise<GalleryResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const gallery = getGalleryById(galleryId);
  if (!gallery) return { ok: false, error: 'GALLERY_NOT_FOUND' };
  if (gallery.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  removeImageFromGallery(galleryId, imageId);

  revalidatePath(`/${locale}/me/galleries/${galleryId}`);
  revalidatePath(`/${locale}/g/${gallery.shareSlug}`);

  return { ok: true };
}

/* ------------------------------- public action ----------------------------- */

async function getOrIssueVisitorId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;
  const fresh = randomUUID();
  jar.set(VISITOR_COOKIE, fresh, {
    httpOnly: false, // visitor id is not a credential; readable on client is fine
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return fresh;
}

export async function readVisitorId(): Promise<string | null> {
  // Static export has no cookies — visitor selections aren't persisted.
  if (process.env.EXPORT === '1') return null;
  const jar = await cookies();
  return jar.get(VISITOR_COOKIE)?.value ?? null;
}

/**
 * Heart toggle for the public gallery viewer. Anyone can call this — no auth
 * required, since the gallery itself is the access control. Identity is the
 * visitor cookie, issued lazily on first selection.
 */
export async function toggleSelectionAction(
  locale: Locale,
  shareSlug: string,
  imageId: string,
): Promise<GalleryResult> {
  const gallery = getGalleryBySlug(shareSlug);
  if (!gallery) return { ok: false, error: 'GALLERY_NOT_FOUND' };

  const visitorId = await getOrIssueVisitorId();
  toggleVisitorSelection(gallery.id, visitorId, imageId);

  revalidatePath(`/${locale}/g/${shareSlug}`);
  revalidatePath(`/${locale}/me/galleries/${gallery.id}`);

  return { ok: true };
}
