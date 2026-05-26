import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/download/[token]
 *
 * Validates a download token from an OrderItem, checks 7-day expiry,
 * and redirects to the file URL. Tokens are generated at purchase time.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const supabase = await createClient();

  // Look up the OrderItem by downloadToken
  const { data: item, error } = await supabase
    .from('OrderItem')
    .select('id, productId, downloadToken, downloadExpiresAt, fileUrl')
    .eq('downloadToken', token)
    .maybeSingle();

  if (error || !item) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  // Check expiry
  const expiresAt = new Date(item.downloadExpiresAt as string);
  if (expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Download link has expired. Visit your purchases page to request a new link.' },
      { status: 410 },
    );
  }

  // Get the file URL — prefer the snapshot on OrderItem, fall back to Product
  let fileUrl = item.fileUrl as string | null;

  if (!fileUrl) {
    const { data: product } = await supabase
      .from('Product')
      .select('fileUrl')
      .eq('id', item.productId as string)
      .maybeSingle();

    fileUrl = (product?.fileUrl as string | null) ?? null;
  }

  if (!fileUrl) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Redirect to the actual file URL
  return NextResponse.redirect(fileUrl, 302);
}
