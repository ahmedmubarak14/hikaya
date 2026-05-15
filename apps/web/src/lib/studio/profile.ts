import 'server-only';

import { randomUUID } from 'node:crypto';

import { findUserByEmail } from '@/lib/auth/mock-store';
import type { City, Discipline } from '@/lib/creators/mock-data';

/**
 * Public studio profile.
 *
 * Distinct from `lib/studio/mock-data.ts` — that file is the studio's CRM
 * (bookings + private clients). This one is the studio's PUBLIC face: what
 * shows up at `/studios/<slug>` for visitors who want to hire the team.
 *
 * Owned by a `MockUser.id`; one user owns at most one StudioProfile in the
 * mock. The seed sits at module-load time alongside the user store; new
 * profiles are appended via `createStudioProfile`.
 */

export interface StudioProfile {
  id: string;
  /** MockUser.id of the studio owner. */
  ownerId: string;
  /** URL slug, e.g. "crescent-studio". Lowercase, hyphenated. */
  slug: string;
  nameEn: string;
  nameAr?: string;
  logoUrl?: string;
  coverUrl?: string;
  city: City;
  address?: string;
  specializations: Discipline[];
  /** Number of simultaneous sessions the studio can run. */
  capacity: number;
  descriptionEn: string;
  descriptionAr?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Creator MockUser.ids on the team. */
  teamMemberIds: string[];
  createdAt: string;
}

interface Store {
  byId: Map<string, StudioProfile>;
  bySlug: Map<string, string>;     // slug → id
  byOwnerId: Map<string, string>;  // ownerId → id
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaStudioProfileStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaStudioProfileStore ??
  (() => {
    const fresh: Store = {
      byId: new Map(),
      bySlug: new Map(),
      byOwnerId: new Map(),
    };
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaStudioProfileStore = store;
}

/**
 * Seed initial studios. Called lazily from the read helpers so we can wire
 * the seed user IDs at first access without circular imports between the
 * auth store and this file.
 *
 * We look up the studio owner by email — it's the only stable identifier
 * across runs of the seed function (UUIDs are randomized).
 */
let seeded = false;
function ensureSeed(): void {
  if (seeded) return;
  seeded = true;

  const owner = findUserByEmail('studio@hikaya.sa');
  if (!owner) return; // auth seed hasn't run — fine, no studio shows up.

  const noor = findUserByEmail('noor@hikaya.sa');
  const teamMemberIds = noor ? [noor.id] : [];

  const profile: StudioProfile = {
    id: randomUUID(),
    ownerId: owner.id,
    slug: 'crescent-studio',
    nameEn: 'Crescent Studio',
    nameAr: 'استوديو الهلال',
    logoUrl: 'https://picsum.photos/seed/crescent-logo/200/200',
    coverUrl: 'https://picsum.photos/seed/crescent-cover/1800/800',
    city: 'RIYADH',
    address: 'King Fahd Rd, Riyadh',
    specializations: ['WEDDING_PHOTOGRAPHY', 'PORTRAIT_PHOTOGRAPHY', 'COMMERCIAL_PHOTOGRAPHY'],
    capacity: 3,
    descriptionEn:
      'A boutique production studio in Riyadh focused on weddings, portraiture, and brand films. We bring a small, hand-picked team and full lighting kit to every project.',
    descriptionAr:
      'استوديو إنتاج بوتيكي في الرياض يركز على الأعراس والصور الشخصية والأفلام التجارية. نأتي بفريق صغير منتقى وعدّة إضاءة كاملة لكل مشروع.',
    contactEmail: 'studio@hikaya.sa',
    contactPhone: '+966 5x xxx 0001',
    teamMemberIds,
    createdAt: new Date().toISOString(),
  };

  store.byId.set(profile.id, profile);
  store.bySlug.set(profile.slug, profile.id);
  store.byOwnerId.set(profile.ownerId, profile.id);
}

/* ----------------------------------- read ---------------------------------- */

export function getAllStudios(): StudioProfile[] {
  ensureSeed();
  return [...store.byId.values()];
}

export function getStudioBySlug(slug: string): StudioProfile | null {
  ensureSeed();
  const id = store.bySlug.get(slug.toLowerCase());
  return id ? (store.byId.get(id) ?? null) : null;
}

export function getStudioByOwnerId(ownerId: string): StudioProfile | null {
  ensureSeed();
  const id = store.byOwnerId.get(ownerId);
  return id ? (store.byId.get(id) ?? null) : null;
}

/* ---------------------------------- write ---------------------------------- */

export interface CreateStudioInput {
  ownerId: string;
  nameEn: string;
  nameAr?: string;
  logoUrl?: string;
  coverUrl?: string;
  city: City;
  address?: string;
  specializations: Discipline[];
  capacity: number;
  descriptionEn: string;
  descriptionAr?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/** Slugify a studio name. Falls back to a random suffix if collisions occur. */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'studio';

  let candidate = base;
  let i = 1;
  while (store.bySlug.has(candidate)) {
    candidate = `${base}-${++i}`;
  }
  return candidate;
}

export function createStudioProfile(input: CreateStudioInput): StudioProfile {
  ensureSeed();
  if (store.byOwnerId.has(input.ownerId)) {
    throw new Error('STUDIO_ALREADY_EXISTS');
  }
  const profile: StudioProfile = {
    id: randomUUID(),
    ownerId: input.ownerId,
    slug: slugify(input.nameEn),
    nameEn: input.nameEn,
    nameAr: input.nameAr,
    logoUrl: input.logoUrl,
    coverUrl: input.coverUrl,
    city: input.city,
    address: input.address,
    specializations: [...input.specializations],
    capacity: input.capacity,
    descriptionEn: input.descriptionEn,
    descriptionAr: input.descriptionAr,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    teamMemberIds: [],
    createdAt: new Date().toISOString(),
  };
  store.byId.set(profile.id, profile);
  store.bySlug.set(profile.slug, profile.id);
  store.byOwnerId.set(profile.ownerId, profile.id);
  return profile;
}

export type EditableStudioFields = Partial<
  Pick<
    StudioProfile,
    | 'nameEn'
    | 'nameAr'
    | 'logoUrl'
    | 'coverUrl'
    | 'city'
    | 'address'
    | 'specializations'
    | 'capacity'
    | 'descriptionEn'
    | 'descriptionAr'
    | 'contactEmail'
    | 'contactPhone'
    | 'teamMemberIds'
  >
>;

export function updateStudioProfile(id: string, patch: EditableStudioFields): StudioProfile {
  ensureSeed();
  const existing = store.byId.get(id);
  if (!existing) throw new Error('STUDIO_NOT_FOUND');
  const updated: StudioProfile = {
    ...existing,
    ...patch,
    specializations: patch.specializations
      ? [...patch.specializations]
      : existing.specializations,
    teamMemberIds: patch.teamMemberIds
      ? [...patch.teamMemberIds]
      : existing.teamMemberIds,
  };
  store.byId.set(id, updated);
  return updated;
}
