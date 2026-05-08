'use server';

import { randomBytes } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

import {
  addPortfolioItem as storeAddItem,
  getCreatorByOwnerEmail,
  movePortfolioItem as storeMoveItem,
  removePortfolioItem as storeRemoveItem,
  updateCreatorProfile as storeUpdateProfile,
  type EditableProfileFields,
} from './mock-store';
import { portfolioItemAddSchema, profileEditSchema } from './schemas';

export type EditorErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'NO_CREATOR_PROFILE'
  | 'UNKNOWN';

export interface EditorFailure {
  ok: false;
  error: EditorErrorKey;
  fieldErrors?: Record<string, string>;
}
export interface EditorSuccess {
  ok: true;
  message?: string;
}
export type EditorResult = EditorSuccess | EditorFailure;

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function requireOwnedCreator() {
  const session = await getSession();
  if (!session) return { error: 'NOT_AUTHENTICATED' as const };
  const creator = getCreatorByOwnerEmail(session.user.email);
  if (!creator) return { error: 'NO_CREATOR_PROFILE' as const };
  return { creator, session };
}

export async function updateProfileAction(
  locale: Locale,
  _prev: EditorResult | null,
  formData: FormData,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if ('error' in auth) return { ok: false, error: auth.error };

  const parsed = profileEditSchema.safeParse({
    displayNameEn: formData.get('displayNameEn'),
    displayNameAr: formData.get('displayNameAr'),
    bioEn: formData.get('bioEn') || undefined,
    bioAr: formData.get('bioAr') || undefined,
    city: formData.get('city'),
    disciplines: formData.getAll('disciplines'),
    startingPriceSar: formData.get('startingPriceSar') || undefined,
    availability: formData.get('availability'),
    preferredLayout: formData.get('preferredLayout'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const patch: EditableProfileFields = {
    displayNameEn: parsed.data.displayNameEn,
    displayNameAr: parsed.data.displayNameAr,
    bioEn: parsed.data.bioEn || '',
    bioAr: parsed.data.bioAr || '',
    city: parsed.data.city,
    disciplines: parsed.data.disciplines,
    startingPriceSar: parsed.data.startingPriceSar ?? null,
    availability: parsed.data.availability,
    preferredLayout: parsed.data.preferredLayout,
  };

  storeUpdateProfile(auth.creator.id, patch);

  revalidatePath(`/${locale}/${auth.creator.username}`);
  revalidatePath(`/${locale}/me/portfolio`);
  revalidatePath(`/${locale}/discover`);

  return { ok: true, message: 'PROFILE_SAVED' };
}

/**
 * Mock-friendly portfolio uploader: if the user pastes a URL, we use it; if
 * they leave the field empty we generate a deterministic picsum URL so they
 * can demo the flow without finding an image. The eventual real flow will
 * sign a Cloudinary upload preset and replace this entirely.
 */
export async function addPortfolioItemAction(
  locale: Locale,
  _prev: EditorResult | null,
  formData: FormData,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if ('error' in auth) return { ok: false, error: auth.error };

  const parsed = portfolioItemAddSchema.safeParse({
    url: formData.get('url') || undefined,
    titleEn: formData.get('titleEn') || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const url = parsed.data.url || `https://picsum.photos/seed/${randomBytes(6).toString('hex')}/1200/900`;

  storeAddItem(auth.creator.id, {
    url,
    width: 1200,
    height: 900,
    titleEn: parsed.data.titleEn || undefined,
  });

  revalidatePath(`/${locale}/${auth.creator.username}`);
  revalidatePath(`/${locale}/me/portfolio`);

  return { ok: true, message: 'ITEM_ADDED' };
}

export async function deletePortfolioItemAction(
  locale: Locale,
  itemId: string,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if ('error' in auth) return { ok: false, error: auth.error };

  storeRemoveItem(auth.creator.id, itemId);

  revalidatePath(`/${locale}/${auth.creator.username}`);
  revalidatePath(`/${locale}/me/portfolio`);

  return { ok: true, message: 'ITEM_DELETED' };
}

export async function movePortfolioItemAction(
  locale: Locale,
  itemId: string,
  direction: 'up' | 'down',
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if ('error' in auth) return { ok: false, error: auth.error };

  storeMoveItem(auth.creator.id, itemId, direction);

  revalidatePath(`/${locale}/${auth.creator.username}`);
  revalidatePath(`/${locale}/me/portfolio`);

  return { ok: true };
}
