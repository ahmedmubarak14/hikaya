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
  | 'FREE_TIER_LIMIT'
  | 'UNKNOWN';

/** Free-plan cap on visible portfolio items. PRO+ removes the cap. */
const FREE_TIER_PORTFOLIO_LIMIT = 10;

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
  const creator = await getMyCreatorProfile({ userId: session.user.id, email: session.user.email });
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
    accentColor: formData.get('accentColor') || undefined,
    sectionsOrder: formData.get('sectionsOrder') || undefined,
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
      accentColor: parsed.data.accentColor ? parsed.data.accentColor : null,
      sectionsOrder: parsed.data.sectionsOrder
        ? parsed.data.sectionsOrder
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter((s): s is 'work' | 'store' | 'about' =>
              s === 'work' || s === 'store' || s === 'about',
            )
        : null,
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

  // Free-tier portfolio cap. Look up the user's subscription plan; if it's
  // unset OR FREE, enforce the FREE_TIER_PORTFOLIO_LIMIT.
  const { data: subscription } = await supabase
    .from('Subscription')
    .select('plan, status')
    .eq('userId', auth.session.user.id)
    .maybeSingle();

  const plan = (subscription?.plan as string | undefined) ?? 'FREE';
  const planIsFree = plan === 'FREE';
  if (planIsFree && (existingItems?.length ?? 0) >= FREE_TIER_PORTFOLIO_LIMIT) {
    return { ok: false, error: 'FREE_TIER_LIMIT' };
  }

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

/**
 * Reorder a portfolio item via drag-and-drop.
 * Moves the item at `fromIndex` to `toIndex`, shifting others accordingly.
 */
export async function reorderPortfolioItemAction(
  locale: Locale,
  itemId: string,
  toIndex: number,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: items, error: fetchErr } = await supabase
    .from('PortfolioItem')
    .select('id, orderIndex')
    .eq('creatorId', auth.creator.id)
    .order('orderIndex', { ascending: true });

  if (fetchErr || !items || items.length === 0) {
    return { ok: false, error: 'UNKNOWN' };
  }

  const fromIndex = items.findIndex((p) => (p.id as string) === itemId);
  if (fromIndex === -1) return { ok: true };
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return { ok: true };

  // Build new ordering: remove item, insert at target position
  const ordered = [...items];
  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved!);

  // Update each item's orderIndex
  for (let i = 0; i < ordered.length; i++) {
    const item = ordered[i]!;
    if ((item.orderIndex as number) !== i) {
      await supabase
        .from('PortfolioItem')
        .update({ orderIndex: i })
        .eq('id', item.id as string);
    }
  }

  revalidatePath(`/${locale}/${auth.creator.username}`);
  revalidatePath(`/${locale}/me/portfolio`);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Discount Code actions
// ---------------------------------------------------------------------------

export async function createDiscountAction(
  locale: Locale,
  _prev: EditorResult | null,
  formData: FormData,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const code = (formData.get('code') as string | null)?.trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 30) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: { code: 'Code must be 3-30 characters.' } };
  }

  const discountType = formData.get('discountType') as string; // 'percentage' | 'fixed'
  const amount = Number(formData.get('amount'));
  if (!amount || amount <= 0) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: { amount: 'Amount must be positive.' } };
  }

  const maxUses = formData.get('maxUses') ? Number(formData.get('maxUses')) : null;
  const minOrder = formData.get('minOrderHalalas') ? Number(formData.get('minOrderHalalas')) : null;
  const expiresInDays = formData.get('expiresInDays') ? Number(formData.get('expiresInDays')) : null;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null;

  const { error } = await supabase.from('DiscountCode').insert({
    ownerUserId: auth.session.user.id,
    code,
    percentageOff: discountType === 'percentage' ? amount : null,
    amountOffHalalas: discountType === 'fixed' ? Math.round(amount * 100) : null,
    minOrderHalalas: minOrder ? Math.round(minOrder * 100) : null,
    maxUses: maxUses || null,
    usedCount: 0,
    expiresAt,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  if (error) {
    console.error('[creators/actions] createDiscountAction error:', error.message);
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return { ok: false, error: 'INVALID_INPUT', fieldErrors: { code: 'Code already exists.' } };
    }
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/discounts`);
  return { ok: true, message: 'DISCOUNT_CREATED' };
}

export async function updateDiscountAction(
  locale: Locale,
  discountId: string,
  formData: FormData,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const isActive = formData.get('isActive') === 'true';
  const maxUses = formData.get('maxUses') ? Number(formData.get('maxUses')) : null;

  const { error } = await supabase
    .from('DiscountCode')
    .update({
      isActive,
      maxUses: maxUses || null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', discountId)
    .eq('ownerUserId', auth.session.user.id);

  if (error) {
    console.error('[creators/actions] updateDiscountAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/discounts`);
  return { ok: true, message: 'DISCOUNT_UPDATED' };
}

export async function deleteDiscountAction(
  locale: Locale,
  discountId: string,
): Promise<EditorResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('DiscountCode')
    .delete()
    .eq('id', discountId)
    .eq('ownerUserId', auth.session.user.id);

  if (error) {
    console.error('[creators/actions] deleteDiscountAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/discounts`);
  return { ok: true, message: 'DISCOUNT_DELETED' };
}

export async function validateDiscountAction(
  code: string,
): Promise<
  | { ok: true; discountId: string; percentageOff: number | null; amountOffHalalas: number | null }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('DiscountCode')
    .select('id, percentageOff, amountOffHalalas, maxUses, usedCount, expiresAt, isActive')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (error || !data) return { ok: false, error: 'INVALID_CODE' };
  if (!(data.isActive as boolean)) return { ok: false, error: 'CODE_INACTIVE' };
  if (data.maxUses && (data.usedCount as number) >= (data.maxUses as number))
    return { ok: false, error: 'CODE_EXHAUSTED' };
  if (data.expiresAt && new Date(data.expiresAt as string) < new Date())
    return { ok: false, error: 'CODE_EXPIRED' };

  return {
    ok: true,
    discountId: data.id as string,
    percentageOff: data.percentageOff as number | null,
    amountOffHalalas: data.amountOffHalalas as number | null,
  };
}

// ---------------------------------------------------------------------------
// Favorites actions
// ---------------------------------------------------------------------------

export async function toggleFavoriteAction(
  creatorProfileId: string,
): Promise<{ ok: boolean; isFavorited: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false, isFavorited: false };

  const supabase = await createClient();
  const userId = session.user.id;

  // Check if already favorited
  const { data: existing } = await supabase
    .from('Favorite')
    .select('id')
    .eq('userId', userId)
    .eq('creatorProfileId', creatorProfileId)
    .maybeSingle();

  if (existing) {
    await supabase.from('Favorite').delete().eq('id', existing.id as string);
    return { ok: true, isFavorited: false };
  }

  const { error } = await supabase.from('Favorite').insert({
    userId,
    creatorProfileId,
    createdAt: new Date().toISOString(),
  });

  if (error) {
    console.error('[creators/actions] toggleFavoriteAction error:', error.message);
    return { ok: false, isFavorited: false };
  }

  return { ok: true, isFavorited: true };
}

export async function getFavoriteStatus(
  creatorProfileIds: string[],
): Promise<Record<string, boolean>> {
  const session = await getSession();
  if (!session) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from('Favorite')
    .select('creatorProfileId')
    .eq('userId', session.user.id)
    .in('creatorProfileId', creatorProfileIds);

  const result: Record<string, boolean> = {};
  for (const id of creatorProfileIds) result[id] = false;
  if (data) {
    for (const row of data) result[row.creatorProfileId as string] = true;
  }
  return result;
}

export async function getMyFavorites(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('Favorite')
    .select('creatorProfileId')
    .eq('userId', session.user.id)
    .order('createdAt', { ascending: false });

  return data ? data.map((r) => r.creatorProfileId as string) : [];
}

// ---------------------------------------------------------------------------
// Saved Search actions
// ---------------------------------------------------------------------------

export async function saveSearchAction(
  locale: Locale,
  name: string,
  params: { city?: string; discipline?: string; available?: string },
): Promise<EditorResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from('SavedSearch').insert({
    userId: session.user.id,
    name: name.trim() || 'Untitled search',
    filterParams: params,
    createdAt: now,
  });

  if (error) {
    console.error('[creators/actions] saveSearchAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/favorites`);
  return { ok: true, message: 'SEARCH_SAVED' };
}

export async function deleteSavedSearchAction(
  locale: Locale,
  searchId: string,
): Promise<EditorResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('SavedSearch')
    .delete()
    .eq('id', searchId)
    .eq('userId', session.user.id);

  if (error) {
    console.error('[creators/actions] deleteSavedSearchAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/favorites`);
  return { ok: true, message: 'SEARCH_DELETED' };
}

export async function getMySavedSearches(): Promise<
  { id: string; name: string; filterParams: Record<string, string>; createdAt: string }[]
> {
  const session = await getSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('SavedSearch')
    .select('id, name, filterParams, createdAt')
    .eq('userId', session.user.id)
    .order('createdAt', { ascending: false });

  return (data ?? []) as { id: string; name: string; filterParams: Record<string, string>; createdAt: string }[];
}
