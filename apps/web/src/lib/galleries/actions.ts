'use server';

import { randomBytes, randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

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
  const creator = await getMyCreatorProfile({ userId: session.user.id, email: session.user.email });
  if (!creator) return { ok: false as const, error: 'NO_CREATOR_PROFILE' as const };
  return { ok: true as const, creator, session };
}

/**
 * Generate a URL-safe slug for a gallery, ensuring uniqueness by querying
 * the Collection table.
 */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
): Promise<string> {
  const norm = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const candidate = norm.length >= 3 ? norm : `gallery-${randomBytes(3).toString('hex')}`;

  const { data: existing } = await supabase
    .from('Collection')
    .select('id')
    .eq('shareSlug', candidate)
    .maybeSingle();

  if (!existing) return candidate;

  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const suffixed = `${norm}-${i}`;
    const { data: collision } = await supabase
      .from('Collection')
      .select('id')
      .eq('shareSlug', suffixed)
      .maybeSingle();
    if (!collision) return suffixed;
    i += 1;
  }
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

  const supabase = await createClient();
  const now = new Date().toISOString();
  const shareSlug = await uniqueSlug(supabase, parsed.data.titleEn);
  const expiresAt =
    parsed.data.expiresInDays && parsed.data.expiresInDays > 0
      ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const coverUrl =
    parsed.data.coverUrl ||
    `https://picsum.photos/seed/${randomBytes(4).toString('hex')}/1800/900`;

  const { data: gallery, error } = await supabase
    .from('Collection')
    .insert({
      creatorId: auth.creator.id,
      shareSlug,
      titleEn: parsed.data.titleEn,
      titleAr: parsed.data.titleAr || null,
      coverUrl,
      message: parsed.data.message || null,
      access: 'OPEN_LINK',
      allowDownloads: parsed.data.allowDownloads,
      watermarkPreviews: parsed.data.watermarkPreviews,
      expiresAt,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .select('id')
    .single();

  if (error || !gallery) {
    console.error('[galleries/actions] createGalleryAction error:', error?.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/galleries`);
  redirect(`/${locale}/me/galleries/${gallery.id as string}`);
}

export async function deleteGalleryAction(
  locale: Locale,
  galleryId: string,
): Promise<GalleryResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: gallery, error: fetchErr } = await supabase
    .from('Collection')
    .select('id, creatorId')
    .eq('id', galleryId)
    .maybeSingle();

  if (fetchErr || !gallery) return { ok: false, error: 'GALLERY_NOT_FOUND' };
  if ((gallery.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  // Delete associated images and selections (cascading should handle this via FK,
  // but we delete explicitly to be safe)
  await supabase.from('CollectionSelection').delete().eq('collectionId', galleryId);
  await supabase.from('CollectionImage').delete().eq('collectionId', galleryId);
  const { error: deleteErr } = await supabase.from('Collection').delete().eq('id', galleryId);

  if (deleteErr) {
    console.error('[galleries/actions] deleteGalleryAction error:', deleteErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

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

  const supabase = await createClient();

  const { data: gallery, error: fetchErr } = await supabase
    .from('Collection')
    .select('id, creatorId, shareSlug')
    .eq('id', galleryId)
    .maybeSingle();

  if (fetchErr || !gallery) return { ok: false, error: 'GALLERY_NOT_FOUND' };
  if ((gallery.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const parsed = addImagesSchema.safeParse({ urls: formData.get('urls') ?? '' });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  // Determine the current max orderIndex
  const { data: lastImage } = await supabase
    .from('CollectionImage')
    .select('orderIndex')
    .eq('collectionId', galleryId)
    .order('orderIndex', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextIndex = ((lastImage?.orderIndex as number | null) ?? -1) + 1;
  const now = new Date().toISOString();

  const rows = parsed.data.urls.map((url) => {
    const row = {
      collectionId: galleryId,
      url,
      width: 1200,
      height: 900,
      orderIndex: nextIndex,
      createdAt: now,
    };
    nextIndex += 1;
    return row;
  });

  const { error: insertErr } = await supabase.from('CollectionImage').insert(rows);

  if (insertErr) {
    console.error('[galleries/actions] addImagesAction error:', insertErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/galleries/${galleryId}`);
  revalidatePath(`/${locale}/g/${gallery.shareSlug as string}`);

  return { ok: true, message: 'IMAGES_ADDED' };
}

export async function removeImageAction(
  locale: Locale,
  galleryId: string,
  imageId: string,
): Promise<GalleryResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: gallery, error: fetchErr } = await supabase
    .from('Collection')
    .select('id, creatorId, shareSlug')
    .eq('id', galleryId)
    .maybeSingle();

  if (fetchErr || !gallery) return { ok: false, error: 'GALLERY_NOT_FOUND' };
  if ((gallery.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  // Delete any selections for this image first
  await supabase.from('CollectionSelection').delete().eq('imageId', imageId);
  const { error: deleteErr } = await supabase
    .from('CollectionImage')
    .delete()
    .eq('id', imageId)
    .eq('collectionId', galleryId);

  if (deleteErr) {
    console.error('[galleries/actions] removeImageAction error:', deleteErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/galleries/${galleryId}`);
  revalidatePath(`/${locale}/g/${gallery.shareSlug as string}`);

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
  const supabase = await createClient();

  const { data: gallery, error: fetchErr } = await supabase
    .from('Collection')
    .select('id')
    .eq('shareSlug', shareSlug)
    .maybeSingle();

  if (fetchErr || !gallery) return { ok: false, error: 'GALLERY_NOT_FOUND' };

  const visitorId = await getOrIssueVisitorId();
  const collectionId = gallery.id as string;

  // Check if selection already exists
  const { data: existingSelection } = await supabase
    .from('CollectionSelection')
    .select('id')
    .eq('collectionId', collectionId)
    .eq('imageId', imageId)
    .eq('clientEmail', visitorId)
    .maybeSingle();

  if (existingSelection) {
    // Remove selection (un-heart)
    await supabase.from('CollectionSelection').delete().eq('id', existingSelection.id as string);
  } else {
    // Add selection (heart)
    const now = new Date().toISOString();
    await supabase.from('CollectionSelection').insert({
      collectionId,
      imageId,
      clientEmail: visitorId,
      createdAt: now,
    });
  }

  revalidatePath(`/${locale}/g/${shareSlug}`);
  revalidatePath(`/${locale}/me/galleries/${collectionId}`);

  return { ok: true };
}
