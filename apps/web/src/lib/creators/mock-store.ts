import 'server-only';

import { randomUUID } from 'node:crypto';

import { CREATORS as SEED_CREATORS, type CreatorProfile, type PortfolioItem } from './mock-data';

/**
 * Mutable in-memory store for creator profiles + portfolios.
 *
 * The seed in `mock-data.ts` is the read-only source of truth at boot. This
 * file copies it into a Map on first load and exposes mutators so server
 * actions can update profile fields, add/remove/reorder portfolio items, etc.
 *
 * Survives Next.js dev HMR via globalThis. Replace with @hikaya/api calls
 * when the backend lands — only the contents of this file change; queries.ts
 * and the actions stay.
 */

interface Store {
  byId: Map<string, CreatorProfile>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaCreatorStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaCreatorStore ??
  (() => {
    const fresh: Store = { byId: new Map() };
    for (const c of SEED_CREATORS) {
      // Deep-ish clone so mutations don't leak back into the seed const.
      fresh.byId.set(c.id, {
        ...c,
        disciplines: [...c.disciplines],
        languages: [...c.languages],
        socialLinks: { ...c.socialLinks },
        portfolio: c.portfolio.map((p) => ({ ...p })),
      });
    }
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaCreatorStore = store;
}

/* ----------------------------------- read ---------------------------------- */

export function getAllCreators(): CreatorProfile[] {
  return [...store.byId.values()];
}

export function getCreatorById(id: string): CreatorProfile | null {
  return store.byId.get(id) ?? null;
}

export function getCreatorByUsernameRaw(username: string): CreatorProfile | null {
  const u = username.toLowerCase();
  for (const c of store.byId.values()) if (c.username === u) return c;
  return null;
}

export function getCreatorByOwnerEmail(email: string): CreatorProfile | null {
  const e = email.toLowerCase();
  for (const c of store.byId.values()) if (c.ownerEmail?.toLowerCase() === e) return c;
  return null;
}

/* ---------------------------------- write ---------------------------------- */

export type EditableProfileFields = Partial<
  Pick<
    CreatorProfile,
    | 'displayNameEn'
    | 'displayNameAr'
    | 'bioEn'
    | 'bioAr'
    | 'disciplines'
    | 'city'
    | 'startingPriceSar'
    | 'availability'
    | 'preferredLayout'
  >
>;

export function updateCreatorProfile(id: string, patch: EditableProfileFields): CreatorProfile {
  const existing = store.byId.get(id);
  if (!existing) throw new Error('CREATOR_NOT_FOUND');
  const updated: CreatorProfile = {
    ...existing,
    ...patch,
    disciplines: patch.disciplines ? [...patch.disciplines] : existing.disciplines,
  };
  store.byId.set(id, updated);
  return updated;
}

export function addPortfolioItem(
  creatorId: string,
  input: { url: string; width: number; height: number; titleEn?: string },
): PortfolioItem {
  const existing = store.byId.get(creatorId);
  if (!existing) throw new Error('CREATOR_NOT_FOUND');
  const item: PortfolioItem = {
    id: randomUUID(),
    url: input.url,
    width: input.width,
    height: input.height,
    titleEn: input.titleEn,
  };
  existing.portfolio = [item, ...existing.portfolio];
  return item;
}

export function removePortfolioItem(creatorId: string, itemId: string): void {
  const existing = store.byId.get(creatorId);
  if (!existing) throw new Error('CREATOR_NOT_FOUND');
  existing.portfolio = existing.portfolio.filter((p) => p.id !== itemId);
}

export function movePortfolioItem(
  creatorId: string,
  itemId: string,
  direction: 'up' | 'down',
): void {
  const existing = store.byId.get(creatorId);
  if (!existing) throw new Error('CREATOR_NOT_FOUND');

  const idx = existing.portfolio.findIndex((p) => p.id === itemId);
  if (idx === -1) return;

  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= existing.portfolio.length) return;

  const next = [...existing.portfolio];
  const a = next[idx]!;
  const b = next[swapWith]!;
  next[idx] = b;
  next[swapWith] = a;
  existing.portfolio = next;
}
