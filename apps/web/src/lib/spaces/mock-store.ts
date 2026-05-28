import 'server-only';

import { randomBytes } from 'node:crypto';

import {
  type BookingDurationKind,
  type BookingStatus,
  SEED_BOOKINGS,
  SEED_SPACES,
  type Space,
  type SpaceBooking,
  type SpaceCity,
  type SpaceStatus,
} from './mock-data';

/**
 * In-memory mock store for the studios-for-rent marketplace.
 *
 * Mirrors `lib/store/mock-store.ts` exactly — global cache survives Next
 * dev hot-reloads, replaced by `@hikaya/api` calls when the real backend
 * lands. Maps over Sets so we can `.values()` cheaply per query.
 */

interface Store {
  spaces: Map<string, Space>;
  bookings: Map<string, SpaceBooking>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaSpacesStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaSpacesStore ??
  (() => {
    const fresh: Store = { spaces: new Map(), bookings: new Map() };
    for (const sp of SEED_SPACES) {
      fresh.spaces.set(sp.id, {
        ...sp,
        photos: [...sp.photos],
        equipmentIncluded: [...sp.equipmentIncluded],
      });
    }
    for (const b of SEED_BOOKINGS) {
      fresh.bookings.set(b.id, { ...b });
    }
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaSpacesStore = store;
}

/* ----------------------------------- read --------------------------------- */

export interface ListSpacesFilter {
  city?: SpaceCity;
  status?: SpaceStatus;
  minCapacity?: number;
}

export function getAllSpaces(filter: ListSpacesFilter = {}): Space[] {
  let results = [...store.spaces.values()];
  if (filter.city) results = results.filter((s) => s.city === filter.city);
  if (filter.status) results = results.filter((s) => s.status === filter.status);
  if (filter.minCapacity != null) {
    const min = filter.minCapacity;
    results = results.filter((s) => s.capacity >= min);
  }
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSpaceById(id: string): Space | null {
  return store.spaces.get(id) ?? null;
}

export function getSpacesByOwner(ownerId: string): Space[] {
  return [...store.spaces.values()]
    .filter((s) => s.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBookingsForSpace(spaceId: string): SpaceBooking[] {
  return [...store.bookings.values()]
    .filter((b) => b.spaceId === spaceId)
    .sort((a, b) => a.startISO.localeCompare(b.startISO));
}

export function getBookingsByRenter(renterId: string): SpaceBooking[] {
  return [...store.bookings.values()]
    .filter((b) => b.renterId === renterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBookingById(id: string): SpaceBooking | null {
  return store.bookings.get(id) ?? null;
}

export function getBookingsForOwner(ownerId: string): SpaceBooking[] {
  const ownedIds = new Set(
    [...store.spaces.values()].filter((s) => s.ownerId === ownerId).map((s) => s.id),
  );
  return [...store.bookings.values()]
    .filter((b) => ownedIds.has(b.spaceId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Basic availability check — the space must be ACTIVE and the proposed
 * window must not overlap an existing non-cancelled booking. Cancelled
 * bookings are ignored.
 *
 * Overlap rule: [aStart, aEnd) ∩ [bStart, bEnd) is non-empty iff
 * aStart < bEnd && bStart < aEnd.
 */
export function isSpaceAvailable(spaceId: string, startISO: string, endISO: string): boolean {
  const space = store.spaces.get(spaceId);
  if (!space || space.status !== 'ACTIVE') return false;

  const start = Date.parse(startISO);
  const end = Date.parse(endISO);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return false;

  for (const b of store.bookings.values()) {
    if (b.spaceId !== spaceId) continue;
    if (b.status === 'CANCELLED') continue;
    const bStart = Date.parse(b.startISO);
    const bEnd = Date.parse(b.endISO);
    if (start < bEnd && bStart < end) return false;
  }
  return true;
}

/* ---------------------------------- write --------------------------------- */

export interface CreateSpaceInput {
  ownerId: string;
  name: string;
  description: string;
  address: string;
  city: SpaceCity;
  capacity: number;
  hourlyHalalas: number;
  dailyHalalas: number;
  halfDayHalalas?: number;
  equipmentIncluded: string[];
  photos: string[];
  status: SpaceStatus;
  houseRules?: string;
  cancellationPolicy?: string;
  addOns?: { name: string; priceHalalas: number }[];
}

export function createSpace(input: CreateSpaceInput): Space {
  const id = `sp_${randomBytes(6).toString('hex')}`;
  const space: Space = {
    id,
    ownerId: input.ownerId,
    name: input.name,
    description: input.description,
    address: input.address,
    city: input.city,
    capacity: input.capacity,
    hourlyHalalas: input.hourlyHalalas,
    dailyHalalas: input.dailyHalalas,
    halfDayHalalas: input.halfDayHalalas ?? 0,
    equipmentIncluded: [...input.equipmentIncluded],
    photos: [...input.photos],
    status: input.status,
    houseRules: input.houseRules ?? '',
    cancellationPolicy: input.cancellationPolicy ?? '',
    addOns: input.addOns ? [...input.addOns] : [],
    createdAt: new Date().toISOString(),
  };
  store.spaces.set(id, space);
  return space;
}

export type SpacePatch = Partial<Omit<Space, 'id' | 'ownerId' | 'createdAt'>>;

export function updateSpace(id: string, patch: SpacePatch): Space {
  const existing = store.spaces.get(id);
  if (!existing) throw new Error('SPACE_NOT_FOUND');
  const updated: Space = {
    ...existing,
    ...patch,
    photos: patch.photos ? [...patch.photos] : existing.photos,
    equipmentIncluded: patch.equipmentIncluded
      ? [...patch.equipmentIncluded]
      : existing.equipmentIncluded,
  };
  store.spaces.set(id, updated);
  return updated;
}

export function setSpaceStatus(id: string, status: SpaceStatus): Space {
  return updateSpace(id, { status });
}

export interface CreateBookingInput {
  spaceId: string;
  renterId: string;
  startISO: string;
  endISO: string;
  durationKind: BookingDurationKind;
  totalHalalas: number;
  selectedAddOns?: { name: string; priceHalalas: number }[];
  accessCode?: string | null;
}

export function createBooking(input: CreateBookingInput): SpaceBooking {
  const id = `sb_${randomBytes(6).toString('hex')}`;
  const booking: SpaceBooking = {
    id,
    spaceId: input.spaceId,
    renterId: input.renterId,
    startISO: input.startISO,
    endISO: input.endISO,
    durationKind: input.durationKind,
    totalHalalas: input.totalHalalas,
    status: 'PENDING',
    checkInAt: null,
    checkOutAt: null,
    checkInPhotos: [],
    checkOutPhotos: [],
    selectedAddOns: input.selectedAddOns ?? [],
    accessCode: input.accessCode ?? null,
    createdAt: new Date().toISOString(),
  };
  store.bookings.set(id, booking);
  return booking;
}

export function setBookingStatus(id: string, status: BookingStatus): SpaceBooking {
  const existing = store.bookings.get(id);
  if (!existing) throw new Error('BOOKING_NOT_FOUND');
  const updated: SpaceBooking = { ...existing, status };
  store.bookings.set(id, updated);
  return updated;
}

export type BookingPatch = Partial<Omit<SpaceBooking, 'id' | 'spaceId' | 'renterId' | 'createdAt'>>;

export function updateBooking(id: string, patch: BookingPatch): SpaceBooking {
  const existing = store.bookings.get(id);
  if (!existing) throw new Error('BOOKING_NOT_FOUND');
  const updated: SpaceBooking = { ...existing, ...patch };
  store.bookings.set(id, updated);
  return updated;
}
