/**
 * Seed galleries for the demo creator (noor@hikaya.sa).
 *
 * Mirrors the Prisma `Collection` + `CollectionImage` models. Replace this
 * file with @hikaya/api fetches once the backend ships — only `mock-store.ts`
 * and `queries.ts` change.
 */

export type GalleryAccess = 'OPEN_LINK' | 'PASSWORD' | 'EMAIL_GATED';

export interface GalleryImage {
  id: string;
  url: string;
  width: number;
  height: number;
  /** Short caption shown on hover; optional. */
  titleEn?: string;
}

export interface Gallery {
  id: string;
  /** URL slug used at /g/<shareSlug>. */
  shareSlug: string;
  /** Creator that owns this gallery (matches CreatorProfile.id). */
  creatorId: string;
  titleEn: string;
  titleAr?: string;
  coverUrl: string;
  message?: string;
  /** Welcome line shown above the gallery to the client. */
  access: GalleryAccess;
  allowDownloads: boolean;
  watermarkPreviews: boolean;
  expiresAt?: string; // ISO
  publishedAt: string; // ISO
  createdAt: string; // ISO
  images: GalleryImage[];
}

const pic = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

function buildImages(prefix: string, count: number): GalleryImage[] {
  const shapes = ['p', 'l', 's', 'p', 'l'] as const;
  const out: GalleryImage[] = [];
  for (let i = 0; i < count; i += 1) {
    const shape = shapes[i % shapes.length];
    const w = shape === 'l' ? 1400 : shape === 's' ? 1100 : 900;
    const h = shape === 'l' ? 900 : shape === 's' ? 1100 : 1300;
    out.push({ id: `${prefix}-img-${i}`, url: pic(`${prefix}-${i}`, w, h), width: w, height: h });
  }
  return out;
}

const now = new Date().toISOString();
const inDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const SEED_GALLERIES: Gallery[] = [
  {
    id: 'gl_sara_hassan',
    shareSlug: 'sara-hassan-wedding',
    creatorId: 'cr_noor',
    titleEn: 'Sara & Hassan — Wedding Day',
    titleAr: 'سارة وحسن — يوم الزفاف',
    coverUrl: pic('sara-cover', 1800, 900),
    message:
      "Sara — favorites for the album spread by Friday, and let me know which two go on the parents' wall.",
    access: 'OPEN_LINK',
    allowDownloads: true,
    watermarkPreviews: false,
    expiresAt: inDays(45),
    publishedAt: now,
    createdAt: now,
    images: buildImages('sara-hassan', 18),
  },
  {
    id: 'gl_reem_portraits',
    shareSlug: 'reem-portraits',
    creatorId: 'cr_noor',
    titleEn: 'Reem — Brand portraits',
    titleAr: 'ريم — بورتريه العلامة',
    coverUrl: pic('reem-cover', 1800, 900),
    message:
      'Reem — the natural-light selects are first; studio at the bottom. Heart your top six.',
    access: 'OPEN_LINK',
    allowDownloads: false,
    watermarkPreviews: true,
    expiresAt: inDays(20),
    publishedAt: now,
    createdAt: now,
    images: buildImages('reem-portraits', 14),
  },
];
