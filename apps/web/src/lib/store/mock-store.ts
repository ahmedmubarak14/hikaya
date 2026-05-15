import 'server-only';

import { randomBytes, randomUUID } from 'node:crypto';

import {
  commissionFor,
  type Order,
  type OrderItem,
  type Product,
  type ProductCategory,
  type ProductStatus,
  SEED_ORDERS,
  SEED_PRODUCTS,
} from './mock-data';

interface Store {
  products: Map<string, Product>;
  orders: Map<string, Order>;
}

declare global {
  // eslint-disable-next-line no-var
  var __hikayaStoreStore: Store | undefined;
}

const store: Store =
  globalThis.__hikayaStoreStore ??
  (() => {
    const fresh: Store = { products: new Map(), orders: new Map() };
    for (const p of SEED_PRODUCTS) {
      fresh.products.set(p.id, {
        ...p,
        previewImageUrls: [...p.previewImageUrls],
        compatibleSoftware: [...p.compatibleSoftware],
      });
    }
    for (const o of SEED_ORDERS)
      fresh.orders.set(o.id, { ...o, items: o.items.map((i) => ({ ...i })) });
    return fresh;
  })();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hikayaStoreStore = store;
}

const DOWNLOAD_TTL_DAYS = 7;

/* ----------------------------------- read --------------------------------- */

export function listActiveProductsByCreator(creatorId: string): Product[] {
  return [...store.products.values()]
    .filter((p) => p.creatorId === creatorId && p.status === 'ACTIVE')
    .sort((a, b) => b.salesCount - a.salesCount);
}

export function listAllProductsByCreator(creatorId: string): Product[] {
  return [...store.products.values()]
    .filter((p) => p.creatorId === creatorId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProductById(id: string): Product | null {
  return store.products.get(id) ?? null;
}

export function getProductBySlug(creatorId: string, slug: string): Product | null {
  for (const p of store.products.values()) {
    if (p.creatorId === creatorId && p.slug === slug) return p;
  }
  return null;
}

export function listOrdersByBuyer(buyerUserId: string): Order[] {
  return [...store.orders.values()]
    .filter((o) => o.buyerUserId === buyerUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findOrderItemForBuyer(buyerUserId: string, productId: string): OrderItem | null {
  for (const o of store.orders.values()) {
    if (o.buyerUserId !== buyerUserId) continue;
    const hit = o.items.find((i) => i.productId === productId);
    if (hit) return hit;
  }
  return null;
}

/* ---------------------------------- write --------------------------------- */

function uniqueSlug(creatorId: string, base: string): string {
  const norm = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  let candidate = norm.length >= 3 ? norm : `product-${randomBytes(3).toString('hex')}`;
  let i = 1;
  while (
    [...store.products.values()].some((p) => p.creatorId === creatorId && p.slug === candidate)
  ) {
    i += 1;
    candidate = `${norm}-${i}`;
  }
  return candidate;
}

export interface CreateProductInput {
  creatorId: string;
  titleEn: string;
  titleAr?: string;
  descriptionEn: string;
  descriptionAr?: string;
  category: ProductCategory;
  status: ProductStatus;
  priceHalalas: number;
  previewImageUrls: string[];
  fileUrl: string;
  freeSampleUrl?: string;
  compatibleSoftware: string[];
}

export function createProduct(input: CreateProductInput): Product {
  const id = `p_${randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();
  const product: Product = {
    id,
    creatorId: input.creatorId,
    slug: uniqueSlug(input.creatorId, input.titleEn),
    titleEn: input.titleEn,
    titleAr: input.titleAr,
    descriptionEn: input.descriptionEn,
    descriptionAr: input.descriptionAr,
    category: input.category,
    status: input.status,
    priceHalalas: input.priceHalalas,
    previewImageUrls: input.previewImageUrls,
    fileUrl: input.fileUrl,
    freeSampleUrl: input.freeSampleUrl,
    compatibleSoftware: input.compatibleSoftware,
    salesCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.products.set(id, product);
  return product;
}

export type ProductPatch = Partial<
  Omit<Product, 'id' | 'creatorId' | 'slug' | 'salesCount' | 'createdAt' | 'updatedAt'>
>;

export function updateProduct(id: string, patch: ProductPatch): Product {
  const existing = store.products.get(id);
  if (!existing) throw new Error('PRODUCT_NOT_FOUND');
  const updated: Product = {
    ...existing,
    ...patch,
    previewImageUrls: patch.previewImageUrls
      ? [...patch.previewImageUrls]
      : existing.previewImageUrls,
    compatibleSoftware: patch.compatibleSoftware
      ? [...patch.compatibleSoftware]
      : existing.compatibleSoftware,
    updatedAt: new Date().toISOString(),
  };
  store.products.set(id, updated);
  return updated;
}

export function setProductStatus(id: string, status: ProductStatus): Product {
  return updateProduct(id, { status });
}

/**
 * Create an order containing a single product. Mock checkout — no actual
 * money moves. Issues a 7-day download token per the PRD; the link is
 * accessible from the buyer's account indefinitely.
 */
export function purchase(input: {
  buyerUserId: string;
  buyerName: string;
  product: Product;
}): Order {
  const id = `o_${randomBytes(6).toString('hex')}`;
  const now = new Date();
  const expires = new Date(now.getTime() + DOWNLOAD_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const item: OrderItem = {
    productId: input.product.id,
    productTitleEn: input.product.titleEn,
    unitHalalas: input.product.priceHalalas,
    commissionHalalas: commissionFor(input.product.priceHalalas),
    downloadToken: randomUUID(),
    downloadExpiresAt: expires,
  };

  const order: Order = {
    id,
    buyerUserId: input.buyerUserId,
    buyerName: input.buyerName,
    totalHalalas: input.product.priceHalalas,
    items: [item],
    createdAt: now.toISOString(),
  };

  // Bump the product's sales counter — visible on the storefront.
  const existing = store.products.get(input.product.id);
  if (existing) {
    store.products.set(input.product.id, {
      ...existing,
      salesCount: existing.salesCount + 1,
      updatedAt: now.toISOString(),
    });
  }

  store.orders.set(id, order);
  return order;
}
