import 'server-only';

import type { City, Discipline } from '@/lib/creators/mock-data';

import type { StudioBooking, StudioClient } from './mock-data';
import type { StudioProfile } from './profile';

/**
 * Real Supabase queries for studio profiles, bookings, and clients.
 *
 * StudioProfile and Booking tables exist in the Prisma schema.
 * ClientProfile + User provide client info. We map DB rows to the
 * front-end shapes from mock-data.ts and profile.ts.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Studio Profile queries
// ---------------------------------------------------------------------------

interface DbStudioProfileRow {
  id: string;
  userId: string;
  slug: string;
  nameEn: string;
  nameAr: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  city: string;
  address: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  specialties: string[];
  capacity: number | null;
  isVerified: boolean;
  createdAt: string;
  StudioMember?: { userId: string }[];
}

function mapStudioProfile(row: DbStudioProfileRow): StudioProfile {
  return {
    id: row.id,
    ownerId: row.userId,
    slug: row.slug,
    nameEn: row.nameEn,
    nameAr: row.nameAr ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    coverUrl: row.coverUrl ?? undefined,
    city: row.city as City,
    address: row.address ?? undefined,
    specializations: (row.specialties ?? []) as Discipline[],
    capacity: row.capacity ?? 1,
    descriptionEn: row.descriptionEn ?? '',
    descriptionAr: row.descriptionAr ?? undefined,
    teamMemberIds: (row.StudioMember ?? []).map((m) => m.userId),
    createdAt: row.createdAt,
  };
}

const STUDIO_PROFILE_SELECT = `
  id, userId, slug, nameEn, nameAr,
  logoUrl, coverUrl, city, address,
  descriptionEn, descriptionAr,
  specialties, capacity, isVerified, createdAt,
  StudioMember ( userId )
`;

export async function getStudioBySlugFromDB(slug: string): Promise<StudioProfile | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('StudioProfile')
    .select(STUDIO_PROFILE_SELECT)
    .eq('slug', slug.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getStudioBySlugFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapStudioProfile(data as unknown as DbStudioProfileRow);
}

export async function getStudioByOwnerIdFromDB(ownerId: string): Promise<StudioProfile | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('StudioProfile')
    .select(STUDIO_PROFILE_SELECT)
    .eq('userId', ownerId)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getStudioByOwnerIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapStudioProfile(data as unknown as DbStudioProfileRow);
}

export async function listAllStudiosFromDB(): Promise<StudioProfile[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('StudioProfile')
    .select(STUDIO_PROFILE_SELECT)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listAllStudiosFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapStudioProfile(row as DbStudioProfileRow));
}

// ---------------------------------------------------------------------------
// Studio Booking queries (Booking table, filtered by studioProfileId)
// ---------------------------------------------------------------------------

interface DbBookingRow {
  id: string;
  clientProfileId: string;
  discipline: string;
  status: string;
  city: string;
  sessionStart: string;
  sessionEnd: string | null;
  totalHalalas: number;
  depositHalalas: number;
  notes: string | null;
  ClientProfile?: { User?: { displayName: string } | null } | null;
}

function mapStudioBooking(row: DbBookingRow): StudioBooking {
  const start = new Date(row.sessionStart);
  const end = row.sessionEnd ? new Date(row.sessionEnd) : new Date(start.getTime() + 2 * 3600000);
  const durationHours = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));

  return {
    id: row.id,
    clientId: row.clientProfileId,
    clientName: row.ClientProfile?.User?.displayName ?? 'Client',
    discipline: row.discipline as Discipline,
    status: row.status as StudioBooking['status'],
    city: row.city as City,
    sessionStart: row.sessionStart,
    sessionDurationHours: durationHours,
    totalSar: Math.round(row.totalHalalas / 100),
    paidSar: Math.round(row.depositHalalas / 100),
    notes: row.notes ?? undefined,
  };
}

const BOOKING_SELECT = `
  id, clientProfileId, discipline, status, city,
  sessionStart, sessionEnd, totalHalalas, depositHalalas, notes,
  ClientProfile:ClientProfile ( User:User ( displayName ) )
`;

export async function listBookingsByStudioFromDB(studioId: string): Promise<StudioBooking[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Booking')
    .select(BOOKING_SELECT)
    .eq('studioProfileId', studioId)
    .order('sessionStart', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listBookingsByStudioFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapStudioBooking(row as DbBookingRow));
}

// ---------------------------------------------------------------------------
// Studio Client queries (ClientProfile joined through Booking)
// ---------------------------------------------------------------------------

interface DbClientRow {
  id: string;
  userId: string;
  isBusiness: boolean;
  companyName: string | null;
  city: string | null;
  User?: { displayName: string; email: string; phone: string | null } | null;
}

export async function listClientsByStudioFromDB(studioId: string): Promise<StudioClient[]> {
  const supabase = await getClient();

  // Get all bookings for this studio to derive client info
  const { data: bookings, error: bErr } = await supabase
    .from('Booking')
    .select('clientProfileId, totalHalalas, depositHalalas, status, sessionStart')
    .eq('studioProfileId', studioId);

  if (bErr || !bookings?.length) {
    if (bErr) console.error('[supabase-queries] listClientsByStudioFromDB booking error:', bErr.message);
    return [];
  }

  // Get unique client profile IDs
  const clientIds = [...new Set(bookings.map((b: { clientProfileId: string }) => b.clientProfileId))];

  const { data: clients, error: cErr } = await supabase
    .from('ClientProfile')
    .select('id, userId, isBusiness, companyName, city, User:User ( displayName, email, phone )')
    .in('id', clientIds);

  if (cErr || !clients?.length) {
    if (cErr) console.error('[supabase-queries] listClientsByStudioFromDB client error:', cErr.message);
    return [];
  }

  return (clients as unknown as DbClientRow[]).map((c) => {
    const clientBookings = bookings.filter((b: { clientProfileId: string }) => b.clientProfileId === c.id);
    const totalSpend = clientBookings.reduce((sum: number, b: { depositHalalas: number }) => sum + b.depositHalalas, 0);
    const lastBooking = clientBookings
      .map((b: { sessionStart: string }) => b.sessionStart)
      .sort()
      .pop() ?? new Date().toISOString();

    return {
      id: c.id,
      name: c.User?.displayName ?? c.companyName ?? 'Client',
      email: c.User?.email ?? '',
      phone: c.User?.phone ?? undefined,
      isBusiness: c.isBusiness,
      totalSpendSar: Math.round(totalSpend / 100),
      bookingsCount: clientBookings.length,
      tags: [],
      lastBookingAt: lastBooking,
    };
  });
}
