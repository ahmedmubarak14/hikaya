'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { defaultLocale, type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

import {
  createStudioProfile,
  getStudioByOwnerId,
  updateStudioProfile,
  type StudioProfile,
} from './profile';

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
  'RIYADH', 'JEDDAH', 'DAMMAM', 'KHOBAR', 'MAKKAH', 'MEDINA', 'TABUK', 'ABHA',
]);

const disciplineEnum = z.enum([
  'WEDDING_PHOTOGRAPHY', 'PORTRAIT_PHOTOGRAPHY', 'COMMERCIAL_PHOTOGRAPHY',
  'PRODUCT_PHOTOGRAPHY', 'EVENT_PHOTOGRAPHY', 'FASHION_PHOTOGRAPHY',
  'COMMERCIAL_VIDEO', 'WEDDING_VIDEO', 'EVENT_VIDEO', 'DOCUMENTARY',
  'GRAPHIC_DESIGN', 'BRAND_IDENTITY', 'MOTION_GRAPHICS', 'VIDEO_EDITING',
  'COLOR_GRADING', 'RETOUCHING', 'DRONE_OPERATION',
]);

const baseSchema = z.object({
  nameEn: z.string().min(2).max(80),
  nameAr: z.string().max(80).optional(),
  logoUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  coverUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  city: cityEnum,
  address: z.string().max(200).optional(),
  specializations: z.array(disciplineEnum).min(1, 'Pick at least one specialization').max(8),
  capacity: z.coerce.number().int().min(1).max(50),
  descriptionEn: z.string().min(20).max(2000),
  descriptionAr: z.string().max(2000).optional(),
  contactEmail: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  contactPhone: z.string().max(40).optional(),
});

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function parseFormData(formData: FormData): z.SafeParseReturnType<unknown, z.infer<typeof baseSchema>> {
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
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  let studio: StudioProfile;
  try {
    studio = createStudioProfile({
      ownerId: session.user.id,
      ...parsed.data,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'STUDIO_ALREADY_EXISTS') {
      return { ok: false, error: 'STUDIO_ALREADY_EXISTS' };
    }
    return { ok: false, error: 'UNKNOWN' };
  }

  redirect(`/${locale ?? defaultLocale}/studios/${studio.slug}`);
}

export async function updateStudioProfileAction(
  locale: Locale,
  _prev: StudioProfileFailure | null,
  formData: FormData,
): Promise<StudioProfileFailure> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const existing = getStudioByOwnerId(session.user.id);
  if (!existing) return { ok: false, error: 'STUDIO_NOT_FOUND' };

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  try {
    updateStudioProfile(existing.id, parsed.data);
  } catch {
    return { ok: false, error: 'UNKNOWN' };
  }

  redirect(`/${locale ?? defaultLocale}/studios/${existing.slug}`);
}
