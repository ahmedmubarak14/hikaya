'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { getCreatorByUsernameRaw } from '@/lib/creators/mock-store';

import {
  createProduct,
  findOrderItemForBuyer,
  getProductById,
  getProductBySlug,
  purchase,
  setProductStatus,
  updateProduct,
} from './mock-store';
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

  const product = createProduct({
    creatorId: auth.creator.id,
    titleEn: parsed.data.titleEn,
    titleAr: parsed.data.titleAr || undefined,
    descriptionEn: parsed.data.descriptionEn,
    descriptionAr: parsed.data.descriptionAr || undefined,
    category: parsed.data.category,
    status: parsed.data.status,
    priceHalalas: parsed.data.priceSar * SAR_TO_HALALAS,
    previewImageUrls: parsed.data.previewImagesRaw,
    fileUrl: parsed.data.fileUrl,
    freeSampleUrl: parsed.data.freeSampleUrl || undefined,
    compatibleSoftware: parsed.data.compatibleSoftwareRaw,
  });

  revalidatePath(`/${locale}/me/store`);
  revalidatePath(`/${locale}/${auth.creator.username}/store`);
  redirect(`/${locale}/me/store/${product.id}`);
}

export async function updateProductAction(
  locale: Locale,
  productId: string,
  _prev: StoreResult | null,
  formData: FormData,
): Promise<StoreResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const product = getProductById(productId);
  if (!product) return { ok: false, error: 'PRODUCT_NOT_FOUND' };
  if (product.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  updateProduct(productId, {
    titleEn: parsed.data.titleEn,
    titleAr: parsed.data.titleAr || undefined,
    descriptionEn: parsed.data.descriptionEn,
    descriptionAr: parsed.data.descriptionAr || undefined,
    category: parsed.data.category,
    status: parsed.data.status,
    priceHalalas: parsed.data.priceSar * SAR_TO_HALALAS,
    previewImageUrls: parsed.data.previewImagesRaw,
    fileUrl: parsed.data.fileUrl,
    freeSampleUrl: parsed.data.freeSampleUrl || undefined,
    compatibleSoftware: parsed.data.compatibleSoftwareRaw,
  });

  revalidatePath(`/${locale}/me/store`);
  revalidatePath(`/${locale}/me/store/${productId}`);
  revalidatePath(`/${locale}/${auth.creator.username}/store`);
  revalidatePath(`/${locale}/${auth.creator.username}/store/${product.slug}`);
  return { ok: true, message: 'SAVED' };
}

export async function setProductStatusAction(
  locale: Locale,
  productId: string,
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
): Promise<StoreResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const product = getProductById(productId);
  if (!product) return { ok: false, error: 'PRODUCT_NOT_FOUND' };
  if (product.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  setProductStatus(productId, status);

  revalidatePath(`/${locale}/me/store`);
  revalidatePath(`/${locale}/me/store/${productId}`);
  revalidatePath(`/${locale}/${auth.creator.username}/store`);
  revalidatePath(`/${locale}/${auth.creator.username}/store/${product.slug}`);
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

  const creator = getCreatorByUsernameRaw(username);
  if (!creator) return { ok: false, error: 'CREATOR_NOT_FOUND' };

  const product = getProductBySlug(creator.id, productSlug);
  if (!product) return { ok: false, error: 'PRODUCT_NOT_FOUND' };
  if (product.status !== 'ACTIVE') return { ok: false, error: 'PRODUCT_NOT_ACTIVE' };
  if (creator.ownerEmail === session.user.email) return { ok: false, error: 'CANNOT_BUY_OWN' };
  if (findOrderItemForBuyer(session.user.id, product.id)) {
    return { ok: false, error: 'ALREADY_PURCHASED' };
  }

  purchase({
    buyerUserId: session.user.id,
    buyerName: session.user.displayName,
    product,
  });

  revalidatePath(`/${locale}/me/purchases`);
  revalidatePath(`/${locale}/${username}/store/${productSlug}`);
  revalidatePath(`/${locale}/${username}/store`);

  redirect(`/${locale}/me/purchases?bought=${product.id}`);
}
