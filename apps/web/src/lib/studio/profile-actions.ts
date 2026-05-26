'use server';

import { randomUUID } from 'node:crypto';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { defaultLocale, type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

/**
 * Server actions for the public studio profile. Mirror the
 * `lib/creators/actions.ts` shape: `{ ok: false, error: 'KEY' }` on failure,
 * redirect on success.
 *
 * On a static-export build this file is replaced wholesale by the no-op stub
 * — see `next.config.mjs` and `_export-stub/actions.ts`.
 */

export type StudioProfileErrorKey =
  | 'NOT_AUTHENTICATED'
  | 'WRONG_ROLE'
  | 'INVALID_INPUT'
  | 'STUDIO_ALREADY_EXISTS'
  | 'STUDIO_NOT_FOUND'
  | 'UNKNOWN';

export interface StudioProfileFailure {
  ok: false;
  error: StudioProfileErrorKey;
  fieldErrors?: Record<string, string>;
}

const cityEnum = z.enum([
  'RIYADH',
  'JEDDAH',
  'DAMMAM',
  'KHOBAR',
  'MAKKAH',
  'MEDINA',
  'TABUK',
  'ABHA',
]);

const disciplineEnum = z.enum([
  'WEDDING_PHOTOGRAPHY',
  'PORTRAIT_PHOTOGRAPHY',
  'COMMERCIAL_PHOTOGRAPHY',
  'PRODUCT_PHOTOGRAPHY',
  'EVENT_PHOTOGRAPHY',
  'FASHION_PHOTOGRAPHY',
  'COMMERCIAL_VIDEO',
  'WEDDING_VIDEO',
  'EVENT_VIDEO',
  'DOCUMENTARY',
  'GRAPHIC_DESIGN',
  'BRAND_IDENTITY',
  'MOTION_GRAPHICS',
  'VIDEO_EDITING',
  'COLOR_GRADING',
  'RETOUCHING',
  'DRONE_OPERATION',
]);

const baseSchema = z.object({
  nameEn: z.string().min(2).max(80),
  nameAr: z.string().max(80).optional(),
  logoUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  coverUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  city: cityEnum,
  address: z.string().max(200).optional(),
  specializations: z.array(disciplineEnum).min(1, 'Pick at least one specialization').max(8),
  capacity: z.coerce.number().int().min(1).max(50),
  descriptionEn: z.string().min(20).max(2000),
  descriptionAr: z.string().max(2000).optional(),
  contactEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  contactPhone: z.string().max(40).optional(),
});

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

function parseFormData(
  formData: FormData,
): z.SafeParseReturnType<unknown, z.infer<typeof baseSchema>> {
  const specializations = formData.getAll('specializations').map(String);
  return baseSchema.safeParse({
    nameEn: formData.get('nameEn'),
    nameAr: formData.get('nameAr') ?? undefined,
    logoUrl: formData.get('logoUrl') ?? undefined,
    coverUrl: formData.get('coverUrl') ?? undefined,
    city: formData.get('city'),
    address: formData.get('address') ?? undefined,
    specializations,
    capacity: formData.get('capacity'),
    descriptionEn: formData.get('descriptionEn'),
    descriptionAr: formData.get('descriptionAr') ?? undefined,
    contactEmail: formData.get('contactEmail') ?? undefined,
    contactPhone: formData.get('contactPhone') ?? undefined,
  });
}

/** Slugify a studio name with a random suffix for uniqueness. */
function slugify(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'studio';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function createStudioProfileAction(
  locale: Locale,
  _prev: StudioProfileFailure | null,
  formData: FormData,
): Promise<StudioProfileFailure> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };
  if (!session.user.roles.includes('STUDIO_OWNER')) {
    return { ok: false, error: 'WRONG_ROLE' };
  }

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();

  // Check if studio already exists for this owner
  const { data: existing } = await supabase
    .from('StudioProfile')
    .select('id')
    .eq('ownerId', session.user.id)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: 'STUDIO_ALREADY_EXISTS' };
  }

  const studioId = randomUUID();
  const slug = slugify(parsed.data.nameEn);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('StudioProfile')
    .insert({
      id: studioId,
      ownerId: session.user.id,
      slug,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr || null,
      logoUrl: parsed.data.logoUrl || null,
      coverUrl: parsed.data.coverUrl || null,
      city: parsed.data.city,
      address: parsed.data.address || null,
      specializations: parsed.data.specializations,
      capacity: parsed.data.capacity,
      descriptionEn: parsed.data.descriptionEn,
      descriptionAr: parsed.data.descriptionAr || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      teamMemberIds: [],
      createdAt: now,
    });

  if (error) {
    console.error('[studio/profile-actions] createStudioProfileAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  redirect(`/${locale ?? defaultLocale}/studios/${slug}`);
}

export async function updateStudioProfileAction(
  locale: Locale,
  _prev: StudioProfileFailure | null,
  formData: FormData,
): Promise<StudioProfileFailure> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('StudioProfile')
    .select('id, slug')
    .eq('ownerId', session.user.id)
    .maybeSingle();

  if (fetchErr || !existing) return { ok: false, error: 'STUDIO_NOT_FOUND' };

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { error: updateErr } = await supabase
    .from('StudioProfile')
    .update({
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr || null,
      logoUrl: parsed.data.logoUrl || null,
      coverUrl: parsed.data.coverUrl || null,
      city: parsed.data.city,
      address: parsed.data.address || null,
      specializations: parsed.data.specializations,
      capacity: parsed.data.capacity,
      descriptionEn: parsed.data.descriptionEn,
      descriptionAr: parsed.data.descriptionAr || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
    })
    .eq('id', existing.id as string);

  if (updateErr) {
    console.error('[studio/profile-actions] updateStudioProfileAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  redirect(`/${locale ?? defaultLocale}/studios/${existing.slug as string}`);
}
