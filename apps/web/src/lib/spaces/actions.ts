'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

import {
  createBooking,
  createSpace,
  getBookingById,
  getSpaceById,
  isSpaceAvailable,
  setBookingStatus,
  setSpaceStatus,
  updateSpace,
} from './mock-store';
import { bookSpaceSchema, spaceSchema } from './schemas';

export type SpacesErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'SPACE_NOT_FOUND'
  | 'NOT_OWNER'
  | 'SPACE_NOT_ACTIVE'
  | 'UNAVAILABLE'
  | 'CANNOT_BOOK_OWN'
  | 'BOOKING_NOT_FOUND'
  | 'NOT_RENTER'
  | 'UNKNOWN';

export interface SpacesFailure {
  ok: false;
  error: SpacesErrorKey;
  fieldErrors?: Record<string, string>;
}
export interface SpacesSuccess {
  ok: true;
  error?: undefined;
  fieldErrors?: undefined;
  message?: string;
}
export type SpacesResult = SpacesSuccess | SpacesFailure;

const SAR_TO_HALALAS = 100;

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function requireSession() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: 'NOT_AUTHENTICATED' as const };
  return { ok: true as const, session };
}

function parseSpaceForm(formData: FormData) {
  return spaceSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    address: formData.get('address'),
    city: formData.get('city'),
    capacity: formData.get('capacity'),
    hourlySar: formData.get('hourlySar') ?? '0',
    dailySar: formData.get('dailySar') ?? '0',
    status: formData.get('status') ?? 'DRAFT',
    photosRaw: formData.get('photosRaw') ?? '',
    equipmentRaw: formData.get('equipmentRaw') ?? '',
  });
}

/* ------------------------------ owner actions ----------------------------- */

export async function createSpaceAction(
  locale: Locale,
  _prev: SpacesResult | null,
  formData: FormData,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = parseSpaceForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const space = createSpace({
    ownerId: auth.session.user.id,
    name: parsed.data.name,
    description: parsed.data.description,
    address: parsed.data.address,
    city: parsed.data.city,
    capacity: parsed.data.capacity,
    hourlyHalalas: parsed.data.hourlySar * SAR_TO_HALALAS,
    dailyHalalas: parsed.data.dailySar * SAR_TO_HALALAS,
    equipmentIncluded: parsed.data.equipmentRaw,
    photos: parsed.data.photosRaw,
    status: parsed.data.status,
  });

  revalidatePath(`/${locale}/me/spaces`);
  revalidatePath(`/${locale}/spaces`);
  redirect(`/${locale}/me/spaces/${space.id}`);
}

export async function updateSpaceAction(
  locale: Locale,
  spaceId: string,
  _prev: SpacesResult | null,
  formData: FormData,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const space = getSpaceById(spaceId);
  if (!space) return { ok: false, error: 'SPACE_NOT_FOUND' };
  if (space.ownerId !== auth.session.user.id) return { ok: false, error: 'NOT_OWNER' };

  const parsed = parseSpaceForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  updateSpace(spaceId, {
    name: parsed.data.name,
    description: parsed.data.description,
    address: parsed.data.address,
    city: parsed.data.city,
    capacity: parsed.data.capacity,
    hourlyHalalas: parsed.data.hourlySar * SAR_TO_HALALAS,
    dailyHalalas: parsed.data.dailySar * SAR_TO_HALALAS,
    equipmentIncluded: parsed.data.equipmentRaw,
    photos: parsed.data.photosRaw,
    status: parsed.data.status,
  });

  revalidatePath(`/${locale}/me/spaces`);
  revalidatePath(`/${locale}/me/spaces/${spaceId}`);
  revalidatePath(`/${locale}/spaces`);
  revalidatePath(`/${locale}/spaces/${spaceId}`);
  return { ok: true, message: 'SAVED' };
}

export async function setSpaceStatusAction(
  locale: Locale,
  spaceId: string,
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED',
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const space = getSpaceById(spaceId);
  if (!space) return { ok: false, error: 'SPACE_NOT_FOUND' };
  if (space.ownerId !== auth.session.user.id) return { ok: false, error: 'NOT_OWNER' };

  setSpaceStatus(spaceId, status);

  revalidatePath(`/${locale}/me/spaces`);
  revalidatePath(`/${locale}/me/spaces/${spaceId}`);
  revalidatePath(`/${locale}/spaces`);
  revalidatePath(`/${locale}/spaces/${spaceId}`);
  return { ok: true };
}

/* ----------------------------- renter actions ----------------------------- */

/**
 * Compute booking total in halalas given the window and duration kind.
 * Hourly billing rounds up to the next whole hour; daily rounds up to the
 * next whole day — matches what most real studio rentals charge.
 */
function computeTotalHalalas(
  start: number,
  end: number,
  kind: 'HOURLY' | 'DAILY',
  hourly: number,
  daily: number,
): number {
  const ms = end - start;
  if (kind === 'HOURLY') {
    const hours = Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
    return hours * hourly;
  }
  const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  return days * daily;
}

export async function bookSpaceAction(
  locale: Locale,
  spaceId: string,
  _prev: SpacesResult | null,
  formData: FormData,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) {
    redirect(`/${locale}/sign-in?next=/${locale}/spaces/${spaceId}`);
  }

  const space = getSpaceById(spaceId);
  if (!space) return { ok: false, error: 'SPACE_NOT_FOUND' };
  if (space.status !== 'ACTIVE') return { ok: false, error: 'SPACE_NOT_ACTIVE' };
  if (space.ownerId === auth.session.user.id) {
    return { ok: false, error: 'CANNOT_BOOK_OWN' };
  }

  const parsed = bookSpaceSchema.safeParse({
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    durationKind: formData.get('durationKind') ?? 'DAILY',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  // Interpret HOURLY as 9am→6pm same-day default if start === end day;
  // we just keep the date strings — date input UX is intentionally simple.
  const startISO = new Date(`${parsed.data.startDate}T09:00:00.000Z`).toISOString();
  const endISO = new Date(`${parsed.data.endDate}T18:00:00.000Z`).toISOString();

  if (!isSpaceAvailable(spaceId, startISO, endISO)) {
    return { ok: false, error: 'UNAVAILABLE' };
  }

  const total = computeTotalHalalas(
    Date.parse(startISO),
    Date.parse(endISO),
    parsed.data.durationKind,
    space.hourlyHalalas,
    space.dailyHalalas,
  );

  const booking = createBooking({
    spaceId,
    renterId: auth.session.user.id,
    startISO,
    endISO,
    durationKind: parsed.data.durationKind,
    totalHalalas: total,
  });

  revalidatePath(`/${locale}/spaces/${spaceId}`);
  revalidatePath(`/${locale}/me/space-rentals`);
  revalidatePath(`/${locale}/me/space-bookings`);
  redirect(`/${locale}/me/space-rentals/${booking.id}`);
}

export async function cancelBookingAction(
  locale: Locale,
  bookingId: string,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const booking = getBookingById(bookingId);
  if (!booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };

  const space = getSpaceById(booking.spaceId);
  const isRenter = booking.renterId === auth.session.user.id;
  const isOwner = space?.ownerId === auth.session.user.id;
  if (!isRenter && !isOwner) return { ok: false, error: 'NOT_RENTER' };

  setBookingStatus(bookingId, 'CANCELLED');

  revalidatePath(`/${locale}/me/space-rentals`);
  revalidatePath(`/${locale}/me/space-rentals/${bookingId}`);
  revalidatePath(`/${locale}/me/space-bookings`);
  if (space) {
    revalidatePath(`/${locale}/spaces/${space.id}`);
  }
  return { ok: true };
}
