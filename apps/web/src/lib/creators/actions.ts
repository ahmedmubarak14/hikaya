'use server';

import { randomBytes } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

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
  error?: undefined;
  fieldErrors?: undefined;
  message?: string;
}
export type EditorResult = EditorSuccess | EditorFailure;

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

async function requireOwnedCreator() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: 'NOT_AUTHENTICATED' as const };
  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) return { ok: false as const, error: 'NO_CREATOR_PROFILE' as const };
  return { ok: true as const, creator, session };
}

export async function updateProfileAction(
  locale: Locale,
  _prev: EditorResult | null,
  formData: FormData,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

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

  const supabase = await createClient();

  const { error } = await supabase
    .from('CreatorProfile')
    .update({
      displayNameEn: parsed.data.displayNameEn,
      displayNameAr: parsed.data.displayNameAr,
      bioEn: parsed.data.bioEn || '',
      bioAr: parsed.data.bioAr || '',
      city: parsed.data.city,
      disciplines: parsed.data.disciplines,
      startingPriceSar: parsed.data.startingPriceSar ?? null,
      availability: parsed.data.availability,
      preferredLayout: parsed.data.preferredLayout,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', auth.creator.id);

  if (error) {
    console.error('[creators/actions] updateProfileAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

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
  if (!auth.ok) return { ok: false, error: auth.error };

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

  const url =
    parsed.data.url || `https://picsum.photos/seed/${randomBytes(6).toString('hex')}/1200/900`;

  const supabase = await createClient();

  // Determine orderIndex: new item goes to the front (orderIndex 0).
  // Shift existing items up by 1.
  const { data: existingItems } = await supabase
    .from('PortfolioItem')
    .select('id, orderIndex')
    .eq('creatorId', auth.creator.id)
    .order('orderIndex', { ascending: true });

  if (existingItems && existingItems.length > 0) {
    // Bulk shift — increment all orderIndex by 1
    for (const item of existingItems) {
      await supabase
        .from('PortfolioItem')
        .update({ orderIndex: (item.orderIndex as number) + 1 })
        .eq('id', item.id as string);
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('PortfolioItem').insert({
    creatorId: auth.creator.id,
    type: 'PHOTO' as const,
    url,
    width: 1200,
    height: 900,
    titleEn: parsed.data.titleEn || null,
    orderIndex: 0,
    createdAt: now,
    updatedAt: now,
  });

  if (error) {
    console.error('[creators/actions] addPortfolioItemAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/${auth.creator.username}`);
  revalidatePath(`/${locale}/me/portfolio`);

  return { ok: true, message: 'ITEM_ADDED' };
}

export async function deletePortfolioItemAction(
  locale: Locale,
  itemId: string,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from('PortfolioItem')
    .delete()
    .eq('id', itemId)
    .eq('creatorId', auth.creator.id);

  if (error) {
    console.error('[creators/actions] deletePortfolioItemAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

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
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  // Fetch all portfolio items in order
  const { data: items, error: fetchErr } = await supabase
    .from('PortfolioItem')
    .select('id, orderIndex')
    .eq('creatorId', auth.creator.id)
    .order('orderIndex', { ascending: true });

  if (fetchErr || !items) {
    return { ok: false, error: 'UNKNOWN' };
  }

  const idx = items.findIndex((p) => (p.id as string) === itemId);
  if (idx === -1) return { ok: true }; // item not found, no-op

  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) return { ok: true }; // boundary, no-op

  const a = items[idx]!;
  const b = items[swapWith]!;

  // Swap orderIndex values
  await supabase
    .from('PortfolioItem')
    .update({ orderIndex: b.orderIndex as number })
    .eq('id', a.id as string);
  await supabase
    .from('PortfolioItem')
    .update({ orderIndex: a.orderIndex as number })
    .eq('id', b.id as string);

  revalidatePath(`/${locale}/${auth.creator.username}`);
  revalidatePath(`/${locale}/me/portfolio`);

  return { ok: true };
}
