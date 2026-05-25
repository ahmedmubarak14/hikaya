import 'server-only';

import type { Space, SpaceBooking, SpaceCity, SpaceStatus } from './mock-data';
import {
  getAllSpaces as rawGetAllSpaces,
  getBookingById as rawGetBookingById,
  getBookingsByRenter as rawGetBookingsByRenter,
  getBookingsForOwner as rawGetBookingsForOwner,
  getBookingsForSpace as rawGetBookingsForSpace,
  getSpaceById as rawGetSpaceById,
  getSpacesByOwner as rawGetSpacesByOwner,
  isSpaceAvailable as rawIsSpaceAvailable,
} from './mock-store';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export interface ListSpacesFilter {
  city?: SpaceCity;
  status?: SpaceStatus;
  minCapacity?: number;
}

export async function listSpaces(filter: ListSpacesFilter = {}): Promise<Space[]> {
  if (!isStaticExport) {
    try {
      const { listSpacesFromDB } = await import('./supabase-queries');
      const result = await listSpacesFromDB(filter);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return rawGetAllSpaces(filter);
}

export async function listActiveSpaces(
  filter: Omit<ListSpacesFilter, 'status'> = {},
): Promise<Space[]> {
  if (!isStaticExport) {
    try {
      const { listSpacesFromDB } = await import('./supabase-queries');
      const result = await listSpacesFromDB({ ...filter, status: 'ACTIVE' });
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return rawGetAllSpaces({ ...filter, status: 'ACTIVE' });
}

export async function getSpace(id: string): Promise<Space | null> {
  if (!isStaticExport) {
    try {
      const { getSpaceByIdFromDB } = await import('./supabase-queries');
      const result = await getSpaceByIdFromDB(id);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return rawGetSpaceById(id);
}

export async function listSpacesByOwner(ownerId: string): Promise<Space[]> {
  if (!isStaticExport) {
    try {
      const { listSpacesByOwnerFromDB } = await import('./supabase-queries');
      const result = await listSpacesByOwnerFromDB(ownerId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return rawGetSpacesByOwner(ownerId);
}

export async function listBookingsForSpace(spaceId: string): Promise<SpaceBooking[]> {
  if (!isStaticExport) {
    try {
      const { listBookingsForSpaceFromDB } = await import('./supabase-queries');
      const result = await listBookingsForSpaceFromDB(spaceId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return rawGetBookingsForSpace(spaceId);
}

export async function listBookingsByRenter(renterId: string): Promise<SpaceBooking[]> {
  if (!isStaticExport) {
    try {
      const { listBookingsByRenterFromDB } = await import('./supabase-queries');
      const result = await listBookingsByRenterFromDB(renterId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return rawGetBookingsByRenter(renterId);
}

export async function listBookingsForOwner(ownerId: string): Promise<SpaceBooking[]> {
  // No direct Supabase query for owner bookings yet — fall through to mock.
  return rawGetBookingsForOwner(ownerId);
}

export async function getBooking(id: string): Promise<SpaceBooking | null> {
  return rawGetBookingById(id);
}

export async function checkSpaceAvailable(
  spaceId: string,
  startISO: string,
  endISO: string,
): Promise<boolean> {
  return rawIsSpaceAvailable(spaceId, startISO, endISO);
}
