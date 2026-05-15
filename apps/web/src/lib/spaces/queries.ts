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
 * Server-only query helpers. Today they read from the mutable mock store;
 * when @hikaya/api is wired in, replace each function body with `fetch(...)`.
 * Mirrors `lib/creators/queries.ts` and `lib/store/queries.ts` patterns.
 */

export interface ListSpacesFilter {
  city?: SpaceCity;
  status?: SpaceStatus;
  minCapacity?: number;
}

export async function listSpaces(filter: ListSpacesFilter = {}): Promise<Space[]> {
  return rawGetAllSpaces(filter);
}

export async function listActiveSpaces(
  filter: Omit<ListSpacesFilter, 'status'> = {},
): Promise<Space[]> {
  return rawGetAllSpaces({ ...filter, status: 'ACTIVE' });
}

export async function getSpace(id: string): Promise<Space | null> {
  return rawGetSpaceById(id);
}

export async function listSpacesByOwner(ownerId: string): Promise<Space[]> {
  return rawGetSpacesByOwner(ownerId);
}

export async function listBookingsForSpace(spaceId: string): Promise<SpaceBooking[]> {
  return rawGetBookingsForSpace(spaceId);
}

export async function listBookingsByRenter(renterId: string): Promise<SpaceBooking[]> {
  return rawGetBookingsByRenter(renterId);
}

export async function listBookingsForOwner(ownerId: string): Promise<SpaceBooking[]> {
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
