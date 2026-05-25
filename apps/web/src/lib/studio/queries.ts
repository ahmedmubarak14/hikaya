import 'server-only';

import type { StudioBooking, StudioClient } from './mock-data';
import { STUDIO_BOOKINGS, STUDIO_CLIENTS } from './mock-data';
import type { StudioProfile } from './profile';
import {
  getAllStudios as getAllStudiosRaw,
  getStudioByOwnerId as getStudioByOwnerIdRaw,
  getStudioBySlug as getStudioBySlugRaw,
} from './profile';

/**
 * Server-only query helpers. When EXPORT=1 (static export), we use mock data
 * directly. Otherwise we try the real Supabase query first and fall back to
 * mock data if the result is empty (gradual migration).
 */

const isStaticExport = process.env.EXPORT === '1';

export async function getAllStudios(): Promise<StudioProfile[]> {
  if (!isStaticExport) {
    try {
      const { listAllStudiosFromDB } = await import('./supabase-queries');
      const result = await listAllStudiosFromDB();
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getAllStudiosRaw();
}

export async function getStudioBySlug(slug: string): Promise<StudioProfile | null> {
  if (!isStaticExport) {
    try {
      const { getStudioBySlugFromDB } = await import('./supabase-queries');
      const result = await getStudioBySlugFromDB(slug);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getStudioBySlugRaw(slug);
}

export async function getStudioByOwnerId(ownerId: string): Promise<StudioProfile | null> {
  if (!isStaticExport) {
    try {
      const { getStudioByOwnerIdFromDB } = await import('./supabase-queries');
      const result = await getStudioByOwnerIdFromDB(ownerId);
      if (result) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  return getStudioByOwnerIdRaw(ownerId);
}

export async function listStudioBookings(studioId: string): Promise<StudioBooking[]> {
  if (!isStaticExport) {
    try {
      const { listBookingsByStudioFromDB } = await import('./supabase-queries');
      const result = await listBookingsByStudioFromDB(studioId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  // Mock: return all studio bookings (single-studio mock).
  return STUDIO_BOOKINGS;
}

export async function listStudioClients(studioId: string): Promise<StudioClient[]> {
  if (!isStaticExport) {
    try {
      const { listClientsByStudioFromDB } = await import('./supabase-queries');
      const result = await listClientsByStudioFromDB(studioId);
      if (result.length > 0) return result;
    } catch {
      // Supabase unavailable — fall through to mock
    }
  }

  // Mock: return all studio clients (single-studio mock).
  return STUDIO_CLIENTS;
}
