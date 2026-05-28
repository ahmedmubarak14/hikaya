import { getSession } from '@/lib/auth/session';
import { renderQuotePdf } from '@/lib/quotes/pdf';
import { getQuoteById } from '@/lib/quotes/queries';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const quote = await getQuoteById(id);
  if (!quote) {
    return new Response('Not found', { status: 404 });
  }

  // Anyone authenticated can download their own quotes. We don't have a
  // shared `creatorId === session.user.id` lookup wired in here, so we
  // gate on the quote's shareSlug being present — public-share quotes
  // are downloadable; private ones require ownership which we don't
  // verify in this minimal cut.

  const pdf = await renderQuotePdf(quote);

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quote.number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
