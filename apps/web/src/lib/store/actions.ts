'use server';

import { randomBytes, randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

import { commissionFor } from './mock-data';
import { productSchema } from './schemas';

export type StoreErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'NO_CREATOR_PROFILE'
  | 'PRODUCT_NOT_FOUND'
  | 'NOT_OWNER'
  | 'PRODUCT_NOT_ACTIVE'
  | 'CANNOT_BUY_OWN'
  | 'ALREADY_PURCHASED'
  | 'CREATOR_NOT_FOUND'
  | 'UNKNOWN';

export interface StoreFailure {
  ok: false;
  error: StoreErrorKey;
  fieldErrors?: Record<string, string>;
}
export interface StoreSuccess {
  ok: true;
  error?: undefined;
  fieldErrors?: undefined;
  message?: string;
}
export type StoreResult = StoreSuccess | StoreFailure;

const SAR_TO_HALALAS = 100;
const DOWNLOAD_TTL_DAYS = 7;

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

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    titleEn: formData.get('titleEn'),
    titleAr: formData.get('titleAr') || undefined,
    descriptionEn: formData.get('descriptionEn'),
    descriptionAr: formData.get('descriptionAr') || undefined,
    category: formData.get('category'),
    status: formData.get('status') ?? 'DRAFT',
    priceSar: formData.get('priceSar') ?? '0',
    fileUrl: formData.get('fileUrl'),
    freeSampleUrl: formData.get('freeSampleUrl') || undefined,
    previewImagesRaw: formData.get('previewImagesRaw') ?? '',
    compatibleSoftwareRaw: formData.get('compatibleSoftwareRaw') ?? '',
  });
}

function uniqueSlug(base: string): string {
  const norm = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const suffix = randomBytes(3).toString('hex');
  return norm.length >= 3 ? `${norm}-${suffix}` : `product-${suffix}`;
}

/* ----------------------------- creator actions ----------------------------- */

export async function createProductAction(
  locale: Locale,
  _prev: StoreResult | null,
  formData: FormData,
): Promise<StoreResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const productId = `p_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('Product')
    .insert({
      id: productId,
      creatorId: auth.creator.id,
      slug: uniqueSlug(parsed.data.titleEn),
      titleEn: parsed.data.titleEn,
      titleAr: parsed.data.titleAr || null,
      descriptionEn: parsed.data.descriptionEn,
      descriptionAr: parsed.data.descriptionAr || null,
      category: parsed.data.category,
      status: parsed.data.status,
      priceHalalas: parsed.data.priceSar * SAR_TO_HALALAS,
      previewImageUrls: parsed.data.previewImagesRaw,
      fileUrl: parsed.data.fileUrl,
      freeSampleUrl: parsed.data.freeSampleUrl || null,
      compatibleSoftware: parsed.data.compatibleSoftwareRaw,
      salesCount: 0,
      createdAt: now,
      updatedAt: now,
    });

  if (error) {
    console.error('[store/actions] createProductAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/store`);
  revalidatePath(`/${locale}/${auth.creator.username}/store`);
  redirect(`/${locale}/me/store/${productId}`);
}

export async function updateProductAction(
  locale: Locale,
  productId: string,
  _prev: StoreResult | null,
  formData: FormData,
): Promise<StoreResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: product, error: fetchErr } = await supabase
    .from('Product')
    .select('id, creatorId, slug')
    .eq('id', productId)
    .maybeSingle();

  if (fetchErr || !product) return { ok: false, error: 'PRODUCT_NOT_FOUND' };
  if ((product.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { error: updateErr } = await supabase
    .from('Product')
    .update({
      titleEn: parsed.data.titleEn,
      titleAr: parsed.data.titleAr || null,
      descriptionEn: parsed.data.descriptionEn,
      descriptionAr: parsed.data.descriptionAr || null,
      category: parsed.data.category,
      status: parsed.data.status,
      priceHalalas: parsed.data.priceSar * SAR_TO_HALALAS,
      previewImageUrls: parsed.data.previewImagesRaw,
      fileUrl: parsed.data.fileUrl,
      freeSampleUrl: parsed.data.freeSampleUrl || null,
      compatibleSoftware: parsed.data.compatibleSoftwareRaw,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', productId);

  if (updateErr) {
    console.error('[store/actions] updateProductAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/store`);
  revalidatePath(`/${locale}/me/store/${productId}`);
  revalidatePath(`/${locale}/${auth.creator.username}/store`);
  revalidatePath(`/${locale}/${auth.creator.username}/store/${product.slug as string}`);
  return { ok: true, message: 'SAVED' };
}

export async function setProductStatusAction(
  locale: Locale,
  productId: string,
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
): Promise<StoreResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: product, error: fetchErr } = await supabase
    .from('Product')
    .select('id, creatorId, slug')
    .eq('id', productId)
    .maybeSingle();

  if (fetchErr || !product) return { ok: false, error: 'PRODUCT_NOT_FOUND' };
  if ((product.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const { error: updateErr } = await supabase
    .from('Product')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', productId);

  if (updateErr) {
    console.error('[store/actions] setProductStatusAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/store`);
  revalidatePath(`/${locale}/me/store/${productId}`);
  revalidatePath(`/${locale}/${auth.creator.username}/store`);
  revalidatePath(`/${locale}/${auth.creator.username}/store/${product.slug as string}`);
  return { ok: true };
}

/* ------------------------------- buyer action ----------------------------- */

export async function purchaseProductAction(
  locale: Locale,
  username: string,
  productSlug: string,
): Promise<StoreResult> {
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/sign-in?next=/${locale}/${username}/store/${productSlug}`);
  }

  const supabase = await createClient();

  // Look up creator by username
  const { data: creator } = await supabase
    .from('CreatorProfile')
    .select('id, ownerEmail')
    .eq('username', username)
    .maybeSingle();

  if (!creator) return { ok: false, error: 'CREATOR_NOT_FOUND' };

  // Find the product by creator + slug
  const { data: product, error: productErr } = await supabase
    .from('Product')
    .select('id, creatorId, status, priceHalalas, titleEn, slug')
    .eq('creatorId', creator.id as string)
    .eq('slug', productSlug)
    .maybeSingle();

  if (productErr || !product) return { ok: false, error: 'PRODUCT_NOT_FOUND' };
  if ((product.status as string) !== 'ACTIVE') return { ok: false, error: 'PRODUCT_NOT_ACTIVE' };
  if ((creator.ownerEmail as string) === session.user.email) {
    return { ok: false, error: 'CANNOT_BUY_OWN' };
  }

  // Check if already purchased — look for any OrderItem for this product
  // in any order by this buyer
  const { data: buyerOrders } = await supabase
    .from('Order')
    .select('id')
    .eq('buyerUserId', session.user.id);

  if (buyerOrders && buyerOrders.length > 0) {
    const orderIds = buyerOrders.map((o) => o.id as string);
    const { data: existingItem } = await supabase
      .from('OrderItem')
      .select('productId')
      .eq('productId', product.id as string)
      .in('orderId', orderIds)
      .maybeSingle();

    if (existingItem) {
      return { ok: false, error: 'ALREADY_PURCHASED' };
    }
  }

  // Create the order
  const orderId = `o_${randomBytes(6).toString('hex')}`;
  const now = new Date();
  const priceHalalas = product.priceHalalas as number;
  const expires = new Date(now.getTime() + DOWNLOAD_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: orderErr } = await supabase
    .from('Order')
    .insert({
      id: orderId,
      buyerUserId: session.user.id,
      buyerName: session.user.displayName,
      totalHalalas: priceHalalas,
      createdAt: now.toISOString(),
    });

  if (orderErr) {
    console.error('[store/actions] purchaseProductAction create order error:', orderErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  // Create the order item
  const { error: itemErr } = await supabase
    .from('OrderItem')
    .insert({
      id: randomUUID(),
      orderId,
      productId: product.id as string,
      productTitleEn: product.titleEn as string,
      unitHalalas: priceHalalas,
      commissionHalalas: commissionFor(priceHalalas),
      downloadToken: randomUUID(),
      downloadExpiresAt: expires,
    });

  if (itemErr) {
    console.error('[store/actions] purchaseProductAction create order item error:', itemErr.message);
  }

  // Bump salesCount — read current then write back incremented value
  const { data: currentProduct } = await supabase
    .from('Product')
    .select('salesCount')
    .eq('id', product.id as string)
    .maybeSingle();

  const currentSales = (currentProduct?.salesCount as number) ?? 0;
  await supabase
    .from('Product')
    .update({ salesCount: currentSales + 1, updatedAt: now.toISOString() })
    .eq('id', product.id as string);

  revalidatePath(`/${locale}/me/purchases`);
  revalidatePath(`/${locale}/${username}/store/${productSlug}`);
  revalidatePath(`/${locale}/${username}/store`);

  redirect(`/${locale}/me/purchases?bought=${product.id as string}`);
}
