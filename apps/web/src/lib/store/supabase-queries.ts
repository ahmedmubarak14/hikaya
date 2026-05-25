import 'server-only';

import type { Product, ProductCategory, ProductStatus } from './mock-data';

/**
 * Real Supabase queries for the creator store (Product table).
 *
 * Each function uses the Next.js server Supabase client (cookie-based auth,
 * anon key) and returns data shaped to match the `Product` type from
 * mock-data.ts so downstream components don't need changes.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end Product shape
// ---------------------------------------------------------------------------

interface DbProductRow {
  id: string;
  creatorId: string;
  slug: string;
  titleEn: string;
  titleAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  category: string;
  status: string;
  priceHalalas: number;
  freeSampleUrl: string | null;
  fileUrls: string[];
  previewImageUrls: string[];
  compatibleSoftware: string[];
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

function mapProduct(row: DbProductRow): Product {
  return {
    id: row.id,
    creatorId: row.creatorId,
    slug: row.slug,
    titleEn: row.titleEn,
    titleAr: row.titleAr ?? undefined,
    descriptionEn: row.descriptionEn ?? '',
    descriptionAr: row.descriptionAr ?? undefined,
    category: row.category as ProductCategory,
    status: row.status as ProductStatus,
    priceHalalas: row.priceHalalas,
    previewImageUrls: row.previewImageUrls ?? [],
    fileUrl: row.fileUrls?.[0] ?? '',
    freeSampleUrl: row.freeSampleUrl ?? undefined,
    compatibleSoftware: row.compatibleSoftware ?? [],
    salesCount: row.salesCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const PRODUCT_SELECT = `
  id, creatorId, slug,
  titleEn, titleAr,
  descriptionEn, descriptionAr,
  category, status,
  priceHalalas, freeSampleUrl,
  fileUrls, previewImageUrls,
  compatibleSoftware, salesCount,
  createdAt, updatedAt
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export async function listProductsByCreatorFromDB(creatorId: string): Promise<Product[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Product')
    .select(PRODUCT_SELECT)
    .eq('creatorId', creatorId)
    .order('updatedAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listProductsByCreatorFromDB error:', error.message);
    return [];
  }

  return (data ?? []).map((row: unknown) => mapProduct(row as DbProductRow));
}

export async function getProductByIdFromDB(id: string): Promise<Product | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Product')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getProductByIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapProduct(data as unknown as DbProductRow);
}

export async function getProductBySlugFromDB(
  creatorId: string,
  slug: string,
): Promise<Product | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Product')
    .select(PRODUCT_SELECT)
    .eq('creatorId', creatorId)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getProductBySlugFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapProduct(data as unknown as DbProductRow);
}
