import 'server-only';

import { randomBytes, randomUUID } from 'node:crypto';

import { type Gallery, type GalleryImage, SEED_GALLERIES } from './mock-data';

/**
 * Mutable in-memory store for galleries and visitor selections.
 *
 * Mirrors the Prisma `Collection`, `CollectionImage`, and
 * `CollectionSelection` models. Selections are keyed by visitor ID rather
 * than email — the public viewer issues a random visitor ID via cookie on
 * first visit, so the demo works without an email gate.
 *
 * HMR-safe via globalThis. Replace with @hikaya/api when the backend lands.
 */

interface Store {
  galleries: Map<string, Gallery>;
  /** key: `${galleryId}:${visitorId}:${imageId}` → 1 (heart) */
  selections: Set<string>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaGalleriesStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaGalleriesStore ??
  (() => {
    const fresh: Store = { galleries: new Map(), selections: new Set() };
    for (const g of SEED_GALLERIES) {
      fresh.galleries.set(g.id, {
        ...g,
        images: g.images.map((i) => ({ ...i })),
      });
    }
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaGalleriesStore = store;
}

const key = (galleryId: string, visitorId: string, imageId: string): string =>
  `${galleryId}:${visitorId}:${imageId}`;

/* ----------------------------------- read ---------------------------------- */

export function listGalleriesByCreator(creatorId: string): Gallery[] {
  return [...store.galleries.values()]
    .filter((g) => g.creatorId === creatorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGalleryById(id: string): Gallery | null {
  return store.galleries.get(id) ?? null;
}

export function getGalleryBySlug(slug: string): Gallery | null {
  for (const g of store.galleries.values()) if (g.shareSlug === slug) return g;
  return null;
}

/** Visitor's selected image IDs in a given gallery. */
export function getVisitorSelections(galleryId: string, visitorId: string): Set<string> {
  const out = new Set<string>();
  const prefix = `${galleryId}:${visitorId}:`;
  for (const k of store.selections) {
    if (k.startsWith(prefix)) out.add(k.slice(prefix.length));
  }
  return out;
}

/** Aggregate selection counts per image (for the creator-side view). */
export function countSelectionsPerImage(galleryId: string): Map<string, number> {
  const out = new Map<string, number>();
  const prefix = `${galleryId}:`;
  for (const k of store.selections) {
    if (!k.startsWith(prefix)) continue;
    const imageId = k.split(':')[2];
    if (!imageId) continue;
    out.set(imageId, (out.get(imageId) ?? 0) + 1);
  }
  return out;
}

export function countDistinctVisitors(galleryId: string): number {
  const prefix = `${galleryId}:`;
  const visitors = new Set<string>();
  for (const k of store.selections) {
    if (!k.startsWith(prefix)) continue;
    const visitorId = k.split(':')[1];
    if (visitorId) visitors.add(visitorId);
  }
  return visitors.size;
}

/* ---------------------------------- write ---------------------------------- */

export interface CreateGalleryInput {
  creatorId: string;
  titleEn: string;
  titleAr?: string;
  coverUrl?: string;
  message?: string;
  allowDownloads: boolean;
  watermarkPreviews: boolean;
  expiresInDays?: number;
}

function uniqueSlug(base: string): string {
  const norm = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  let candidate = norm.length >= 3 ? norm : `gallery-${randomBytes(3).toString('hex')}`;
  let i = 1;
  while ([...store.galleries.values()].some((g) => g.shareSlug === candidate)) {
    i += 1;
    candidate = `${norm}-${i}`;
  }
  return candidate;
}

export function createGallery(input: CreateGalleryInput): Gallery {
  const id = `gl_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();
  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

  const gallery: Gallery = {
    id,
    shareSlug: uniqueSlug(input.titleEn),
    creatorId: input.creatorId,
    titleEn: input.titleEn,
    titleAr: input.titleAr,
    coverUrl: input.coverUrl ?? `https://picsum.photos/seed/${randomBytes(4).toString('hex')}/1800/900`,
    message: input.message,
    access: 'OPEN_LINK',
    allowDownloads: input.allowDownloads,
    watermarkPreviews: input.watermarkPreviews,
    expiresAt,
    publishedAt: now,
    createdAt: now,
    images: [],
  };
  store.galleries.set(id, gallery);
  return gallery;
}

export function deleteGallery(id: string): void {
  store.galleries.delete(id);
  // Drop any selections too.
  const prefix = `${id}:`;
  for (const k of store.selections) if (k.startsWith(prefix)) store.selections.delete(k);
}

export function addImagesToGallery(
  galleryId: string,
  inputs: { url: string }[],
): GalleryImage[] {
  const gallery = store.galleries.get(galleryId);
  if (!gallery) throw new Error('GALLERY_NOT_FOUND');

  const created: GalleryImage[] = inputs.map((i) => ({
    id: randomUUID(),
    url: i.url,
    width: 1200,
    height: 900,
  }));
  gallery.images = [...gallery.images, ...created];
  return created;
}

export function removeImageFromGallery(galleryId: string, imageId: string): void {
  const gallery = store.galleries.get(galleryId);
  if (!gallery) return;
  gallery.images = gallery.images.filter((i) => i.id !== imageId);
}

/** Toggle a visitor's heart on an image; returns the new state. */
export function toggleVisitorSelection(
  galleryId: string,
  visitorId: string,
  imageId: string,
): boolean {
  const k = key(galleryId, visitorId, imageId);
  if (store.selections.has(k)) {
    store.selections.delete(k);
    return false;
  }
  store.selections.add(k);
  return true;
}
