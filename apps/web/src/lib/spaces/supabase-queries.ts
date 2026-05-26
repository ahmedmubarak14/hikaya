import 'server-only';

import type { Space, SpaceAddOn, SpaceBooking, BookingDurationKind, BookingStatus, SpaceStatus } from './mock-data';

/**
 * Real Supabase queries for spaces (Space + SpaceBooking).
 *
 * These tables are NOT part of the original Prisma schema — they were added
 * via `scripts/migrate-missing-tables.sql`. If the tables don't exist yet,
 * queries will fail gracefully and the caller falls back to mock data.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end shape
// ---------------------------------------------------------------------------

interface DbSpaceRow {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  capacity: number;
  hourlyHalalas: number;
  dailyHalalas: number;
  equipmentIncluded: string[];
  photos: string[];
  status: string;
  houseRules: string | null;
  addOns: SpaceAddOn[] | null;
  createdAt: string;
}

interface DbSpaceBookingRow {
  id: string;
  spaceId: string;
  renterId: string;
  startISO: string;
  endISO: string;
  durationKind: string;
  totalHalalas: number;
  status: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInPhotos: string[] | null;
  checkOutPhotos: string[] | null;
  selectedAddOns: SpaceAddOn[] | null;
  createdAt: string;
}

function mapSpace(row: DbSpaceRow): Space {
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    description: row.description,
    address: row.address,
    city: row.city as Space['city'],
    capacity: row.capacity,
    hourlyHalalas: row.hourlyHalalas,
    dailyHalalas: row.dailyHalalas,
    equipmentIncluded: row.equipmentIncluded ?? [],
    photos: row.photos ?? [],
    status: row.status as SpaceStatus,
    houseRules: row.houseRules ?? '',
    addOns: (row.addOns as SpaceAddOn[] | null) ?? [],
    createdAt: row.createdAt,
  };
}

function mapSpaceBooking(row: DbSpaceBookingRow): SpaceBooking {
  return {
    id: row.id,
    spaceId: row.spaceId,
    renterId: row.renterId,
    startISO: row.startISO,
    endISO: row.endISO,
    durationKind: row.durationKind as BookingDurationKind,
    totalHalalas: row.totalHalalas,
    status: row.status as BookingStatus,
    checkInAt: row.checkInAt ?? null,
    checkOutAt: row.checkOutAt ?? null,
    checkInPhotos: row.checkInPhotos ?? [],
    checkOutPhotos: row.checkOutPhotos ?? [],
    selectedAddOns: (row.selectedAddOns as SpaceAddOn[] | null) ?? [],
    createdAt: row.createdAt,
  };
}

const SPACE_SELECT = `
  id, ownerId, name, description, address, city,
  capacity, hourlyHalalas, dailyHalalas,
  equipmentIncluded, photos, status,
  houseRules, addOns, createdAt
`;

const BOOKING_SELECT = `
  id, spaceId, renterId, startISO, endISO,
  durationKind, totalHalalas, status,
  checkInAt, checkOutAt, checkInPhotos, checkOutPhotos,
  selectedAddOns, createdAt
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export interface ListSpacesFilter {
  city?: Space['city'];
  status?: SpaceStatus;
  minCapacity?: number;
}

export async function listSpacesFromDB(
  filter: ListSpacesFilter = {},
): Promise<Space[]> {
  const supabase = await getClient();

  let query = supabase.from('Space').select(SPACE_SELECT);

  if (filter.city) query = query.eq('city', filter.city);
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.minCapacity != null) query = query.gte('capacity', filter.minCapacity);

  query = query.order('createdAt', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[supabase-queries] listSpacesFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapSpace(row as DbSpaceRow));
}

export async function getSpaceByIdFromDB(id: string): Promise<Space | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Space')
    .select(SPACE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getSpaceByIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapSpace(data as unknown as DbSpaceRow);
}

export async function listSpacesByOwnerFromDB(ownerId: string): Promise<Space[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Space')
    .select(SPACE_SELECT)
    .eq('ownerId', ownerId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listSpacesByOwnerFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapSpace(row as DbSpaceRow));
}

export async function listBookingsForSpaceFromDB(spaceId: string): Promise<SpaceBooking[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('SpaceBooking')
    .select(BOOKING_SELECT)
    .eq('spaceId', spaceId)
    .order('startISO', { ascending: true });

  if (error) {
    console.error('[supabase-queries] listBookingsForSpaceFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapSpaceBooking(row as DbSpaceBookingRow));
}

export async function listBookingsByRenterFromDB(renterId: string): Promise<SpaceBooking[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('SpaceBooking')
    .select(BOOKING_SELECT)
    .eq('renterId', renterId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listBookingsByRenterFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapSpaceBooking(row as DbSpaceBookingRow));
}
