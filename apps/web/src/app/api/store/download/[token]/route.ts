import { type NextRequest } from 'next/server';

import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Params {
  params: Promise<{ token: string }>;
}

/**
 * Signed-URL delivery for purchased products.
 *
 * Flow:
 *   1. Validate the token against OrderItem.downloadToken.
 *   2. Verify the buyer owns this order, the link hasn't expired, and the
 *      buyer hasn't hit the download cap.
 *   3. Generate a short-lived Supabase Storage signed URL for the product
 *      file. Increment OrderItem.downloadCount and 302 → signed URL.
 *
 * Stale / over-limit / unauthorised requests get the appropriate 4xx.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!token) return new Response('Missing token', { status: 400 });

  const session = await getSession();
  if (!session) return new Response('Unauthorised', { status: 401 });

  const supabase = await createServiceClient();

  const { data: item, error: itemErr } = await supabase
    .from('OrderItem')
    .select(
      'id, orderId, productId, downloadToken, downloadExpiresAt, downloadCount, maxDownloads, Order:orderId(buyerUserId), Product:productId(fileUrls)',
    )
    .eq('downloadToken', token)
    .maybeSingle();

  if (itemErr || !item) return new Response('Not found', { status: 404 });

  // Supabase join: relations come back as arrays even when singular.
  type SingleOrArray<T> = T | T[] | null;
  const orderRel = (item as unknown as { Order?: SingleOrArray<{ buyerUserId: string }> }).Order;
  const productRel = (item as unknown as { Product?: SingleOrArray<{ fileUrls: string[] }> })
    .Product;
  const buyerUserId = Array.isArray(orderRel) ? orderRel[0]?.buyerUserId : orderRel?.buyerUserId;
  const fileUrls = Array.isArray(productRel)
    ? (productRel[0]?.fileUrls ?? [])
    : (productRel?.fileUrls ?? []);

  if (!buyerUserId || buyerUserId !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  const expires = Date.parse(item.downloadExpiresAt as string);
  if (Number.isFinite(expires) && expires < Date.now()) {
    return new Response('Link expired', { status: 410 });
  }

  const downloadCount = (item.downloadCount as number | null) ?? 0;
  const maxDownloads = (item.maxDownloads as number | null) ?? 5;
  if (downloadCount >= maxDownloads) {
    return new Response('Download limit reached', { status: 410 });
  }

  const firstFile = fileUrls[0];
  if (!firstFile) return new Response('No file', { status: 404 });

  // Best-effort: extract bucket + object key from the stored URL. We store
  // products either as full Supabase Storage URLs (preferred) or external
  // links (return raw, no signing).
  const signedUrl = await maybeSignSupabaseUrl(supabase, firstFile);

  // Tick the counter — best-effort; a failure here shouldn't deny the user
  // a download they're entitled to.
  await supabase
    .from('OrderItem')
    .update({ downloadCount: downloadCount + 1 })
    .eq('id', item.id as string);

  return Response.redirect(signedUrl ?? firstFile, 302);
}

async function maybeSignSupabaseUrl(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  rawUrl: string,
): Promise<string | null> {
  // Match `https://<project>.supabase.co/storage/v1/object/{public,sign}/{bucket}/{key}`
  const match = rawUrl.match(
    /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/,
  );
  if (!match) return null;
  const [, bucket, encodedKey] = match;
  if (!bucket || !encodedKey) return null;
  const key = decodeURIComponent(encodedKey);

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, 60 * 5);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
