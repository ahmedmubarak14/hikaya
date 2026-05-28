'use server';

import { randomBytes } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

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

/**
 * Parse add-ons from a textarea text input. Each line is "Name, PriceSAR".
 * Returns an array of { name, priceHalalas }.
 */
function parseAddOnsText(raw: string): { name: string; priceHalalas: number }[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const lastComma = line.lastIndexOf(',');
      if (lastComma === -1) return { name: line, priceHalalas: 0 };
      const name = line.slice(0, lastComma).trim();
      const price = parseInt(line.slice(lastComma + 1).trim(), 10);
      return { name, priceHalalas: (Number.isFinite(price) ? price : 0) * SAR_TO_HALALAS };
    });
}

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

  const supabase = await createClient();
  const spaceId = `sp_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const houseRules = formData.get('houseRules')?.toString() ?? '';
  const addOnsRaw = formData.get('addOnsRaw')?.toString() ?? '';
  const addOns = parseAddOnsText(addOnsRaw);

  const { error } = await supabase
    .from('Space')
    .insert({
      id: spaceId,
      ownerId: auth.session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      address: parsed.data.address,
      city: parsed.data.city,
      capacity: parsed.data.capacity,
      hourlyHalalas: parsed.data.hourlySar * SAR_TO_HALALAS,
      dailyHalalas: parsed.data.dailySar * SAR_TO_HALALAS,
      halfDayHalalas: parsed.data.halfDaySar * SAR_TO_HALALAS,
      equipmentIncluded: parsed.data.equipmentRaw,
      photos: parsed.data.photosRaw,
      status: parsed.data.status,
      houseRules,
      cancellationPolicy: parsed.data.cancellationPolicy,
      addOns,
      createdAt: now,
    });

  if (error) {
    console.error('[spaces/actions] createSpaceAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/spaces`);
  revalidatePath(`/${locale}/spaces`);
  redirect(`/${locale}/me/spaces/${spaceId}`);
}

export async function updateSpaceAction(
  locale: Locale,
  spaceId: string,
  _prev: SpacesResult | null,
  formData: FormData,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: space, error: fetchErr } = await supabase
    .from('Space')
    .select('id, ownerId')
    .eq('id', spaceId)
    .maybeSingle();

  if (fetchErr || !space) return { ok: false, error: 'SPACE_NOT_FOUND' };
  if ((space.ownerId as string) !== auth.session.user.id) return { ok: false, error: 'NOT_OWNER' };

  const parsed = parseSpaceForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const houseRulesUpdate = formData.get('houseRules')?.toString() ?? '';
  const cancellationPolicyUpdate = formData.get('cancellationPolicy')?.toString() ?? '';
  const addOnsRawUpdate = formData.get('addOnsRaw')?.toString() ?? '';
  const addOnsUpdate = parseAddOnsText(addOnsRawUpdate);

  const { error: updateErr } = await supabase
    .from('Space')
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      address: parsed.data.address,
      city: parsed.data.city,
      capacity: parsed.data.capacity,
      hourlyHalalas: parsed.data.hourlySar * SAR_TO_HALALAS,
      dailyHalalas: parsed.data.dailySar * SAR_TO_HALALAS,
      halfDayHalalas: parsed.data.halfDaySar * SAR_TO_HALALAS,
      equipmentIncluded: parsed.data.equipmentRaw,
      photos: parsed.data.photosRaw,
      status: parsed.data.status,
      houseRules: houseRulesUpdate,
      cancellationPolicy: cancellationPolicyUpdate,
      addOns: addOnsUpdate,
    })
    .eq('id', spaceId);

  if (updateErr) {
    console.error('[spaces/actions] updateSpaceAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

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

  const supabase = await createClient();

  const { data: space, error: fetchErr } = await supabase
    .from('Space')
    .select('id, ownerId')
    .eq('id', spaceId)
    .maybeSingle();

  if (fetchErr || !space) return { ok: false, error: 'SPACE_NOT_FOUND' };
  if ((space.ownerId as string) !== auth.session.user.id) return { ok: false, error: 'NOT_OWNER' };

  const { error: updateErr } = await supabase
    .from('Space')
    .update({ status })
    .eq('id', spaceId);

  if (updateErr) {
    console.error('[spaces/actions] setSpaceStatusAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

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
  kind: 'HOURLY' | 'HALF_DAY' | 'DAILY',
  hourly: number,
  daily: number,
  halfDay: number,
): number {
  const ms = end - start;
  if (kind === 'HOURLY') {
    const hours = Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
    return hours * hourly;
  }
  const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  // Half-day bills the half-day rate per booked day.
  if (kind === 'HALF_DAY') {
    return days * (halfDay > 0 ? halfDay : Math.round(daily * 0.6));
  }
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

  const supabase = await createClient();

  const { data: space, error: spaceFetchErr } = await supabase
    .from('Space')
    .select('id, ownerId, status, hourlyHalalas, dailyHalalas, halfDayHalalas')
    .eq('id', spaceId)
    .maybeSingle();

  if (spaceFetchErr || !space) return { ok: false, error: 'SPACE_NOT_FOUND' };
  if ((space.status as string) !== 'ACTIVE') return { ok: false, error: 'SPACE_NOT_ACTIVE' };
  if ((space.ownerId as string) === auth.session.user.id) {
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

  const startISO = new Date(`${parsed.data.startDate}T09:00:00+03:00`).toISOString();
  const endISO = new Date(`${parsed.data.endDate}T18:00:00+03:00`).toISOString();

  // Check availability: no overlapping non-cancelled bookings
  const { data: overlapping } = await supabase
    .from('SpaceBooking')
    .select('id')
    .eq('spaceId', spaceId)
    .neq('status', 'CANCELLED')
    .lt('startISO', endISO)
    .gt('endISO', startISO)
    .limit(1);

  if (overlapping && overlapping.length > 0) {
    return { ok: false, error: 'UNAVAILABLE' };
  }

  // Parse selected add-ons from form data
  const selectedAddOnsRaw = formData.get('selectedAddOns')?.toString() ?? '[]';
  let selectedAddOns: { name: string; priceHalalas: number }[] = [];
  try {
    selectedAddOns = JSON.parse(selectedAddOnsRaw);
  } catch {
    // ignore parse errors
  }
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.priceHalalas, 0);

  const total = computeTotalHalalas(
    Date.parse(startISO),
    Date.parse(endISO),
    parsed.data.durationKind,
    space.hourlyHalalas as number,
    space.dailyHalalas as number,
    (space.halfDayHalalas as number) ?? 0,
  ) + addOnsTotal;

  const bookingId = `sb_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const { error: bookingErr } = await supabase
    .from('SpaceBooking')
    .insert({
      id: bookingId,
      spaceId,
      renterId: auth.session.user.id,
      startISO,
      endISO,
      durationKind: parsed.data.durationKind,
      totalHalalas: total,
      status: 'PENDING',
      selectedAddOns,
      createdAt: now,
    });

  if (bookingErr) {
    console.error('[spaces/actions] bookSpaceAction error:', bookingErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/spaces/${spaceId}`);
  revalidatePath(`/${locale}/me/space-rentals`);
  revalidatePath(`/${locale}/me/space-bookings`);
  redirect(`/${locale}/me/space-rentals/${bookingId}`);
}

/* ----------------------------- check-in/out ----------------------------- */

export async function checkInAction(
  locale: Locale,
  bookingId: string,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: booking, error: fetchErr } = await supabase
    .from('SpaceBooking')
    .select('id, renterId, status, checkInAt')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchErr || !booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };
  if ((booking.renterId as string) !== auth.session.user.id) return { ok: false, error: 'NOT_RENTER' };
  if ((booking.status as string) !== 'CONFIRMED') return { ok: false, error: 'BOOKING_NOT_FOUND' };
  if (booking.checkInAt) return { ok: false, error: 'BOOKING_NOT_FOUND' };

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('SpaceBooking')
    .update({ checkInAt: now })
    .eq('id', bookingId);

  if (updateErr) {
    console.error('[spaces/actions] checkInAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/space-rentals/${bookingId}`);
  return { ok: true };
}

export async function checkOutAction(
  locale: Locale,
  bookingId: string,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: booking, error: fetchErr } = await supabase
    .from('SpaceBooking')
    .select('id, renterId, status, checkInAt, checkOutAt')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchErr || !booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };
  if ((booking.renterId as string) !== auth.session.user.id) return { ok: false, error: 'NOT_RENTER' };
  if ((booking.status as string) !== 'CONFIRMED') return { ok: false, error: 'BOOKING_NOT_FOUND' };
  if (!booking.checkInAt || booking.checkOutAt) return { ok: false, error: 'BOOKING_NOT_FOUND' };

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('SpaceBooking')
    .update({ checkOutAt: now, status: 'COMPLETED' })
    .eq('id', bookingId);

  if (updateErr) {
    console.error('[spaces/actions] checkOutAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/space-rentals/${bookingId}`);
  revalidatePath(`/${locale}/me/space-rentals`);
  return { ok: true };
}

export async function addConditionPhotoAction(
  locale: Locale,
  bookingId: string,
  phase: 'checkIn' | 'checkOut',
  photoUrl: string,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const col = phase === 'checkIn' ? 'checkInPhotos' : 'checkOutPhotos';

  const { data: booking, error: fetchErr } = await supabase
    .from('SpaceBooking')
    .select('id, renterId, checkInPhotos, checkOutPhotos')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchErr || !booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };
  if ((booking.renterId as string) !== auth.session.user.id) return { ok: false, error: 'NOT_RENTER' };

  const existing = ((booking as Record<string, unknown>)[col] as string[] | null) ?? [];
  const updated = [...existing, photoUrl];

  const { error: updateErr } = await supabase
    .from('SpaceBooking')
    .update({ [col]: updated })
    .eq('id', bookingId);

  if (updateErr) {
    console.error('[spaces/actions] addConditionPhotoAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/space-rentals/${bookingId}`);
  return { ok: true };
}

/* ----------------------------- cancel booking ----------------------------- */

export async function cancelBookingAction(
  locale: Locale,
  bookingId: string,
): Promise<SpacesResult> {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: booking, error: fetchErr } = await supabase
    .from('SpaceBooking')
    .select('id, spaceId, renterId')
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchErr || !booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };

  // Check if user is the renter or the space owner
  const isRenter = (booking.renterId as string) === auth.session.user.id;
  let isOwner = false;
  if (!isRenter) {
    const { data: space } = await supabase
      .from('Space')
      .select('ownerId')
      .eq('id', booking.spaceId as string)
      .maybeSingle();
    isOwner = !!space && (space.ownerId as string) === auth.session.user.id;
  }

  if (!isRenter && !isOwner) return { ok: false, error: 'NOT_RENTER' };

  const { error: updateErr } = await supabase
    .from('SpaceBooking')
    .update({ status: 'CANCELLED' })
    .eq('id', bookingId);

  if (updateErr) {
    console.error('[spaces/actions] cancelBookingAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/space-rentals`);
  revalidatePath(`/${locale}/me/space-rentals/${bookingId}`);
  revalidatePath(`/${locale}/me/space-bookings`);
  if (booking.spaceId) {
    revalidatePath(`/${locale}/spaces/${booking.spaceId as string}`);
  }
  return { ok: true };
}
