'use server';

import { randomBytes, randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

import { computeQuoteTotals, type QuoteLineItem } from './mock-data';
import { createQuoteSchema, rejectQuoteSchema } from './schemas';

export type QuoteErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'NO_CREATOR_PROFILE'
  | 'QUOTE_NOT_FOUND'
  | 'NOT_OWNER'
  | 'WRONG_STATE'
  | 'EXPIRED'
  | 'UNKNOWN';

export interface QuoteFailure {
  ok: false;
  error: QuoteErrorKey;
  fieldErrors?: Record<string, string>;
}
export interface QuoteSuccess {
  ok: true;
  error?: undefined;
  fieldErrors?: undefined;
  message?: string;
}
export type QuoteResult = QuoteSuccess | QuoteFailure;

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join('.');
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

const SAR_TO_HALALAS = 100;

function nextQuoteNumber(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(2).toString('hex');
  return `Q-${year}-${rand}`;
}

function uniqueSlug(base: string): string {
  const norm = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const suffix = randomBytes(3).toString('hex');
  return norm.length >= 3 ? `${norm}-${suffix}` : `quote-${suffix}`;
}

/* ----------------------------- creator actions ----------------------------- */

export async function createQuoteAction(
  locale: Locale,
  _prev: QuoteResult | null,
  formData: FormData,
): Promise<QuoteResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Reconstruct line items from indexed form keys: lineItems.<i>.descriptionEn etc.
  const lineItemMap = new Map<string, Record<string, string>>();
  for (const [key, raw] of formData.entries()) {
    const m = key.match(/^lineItems\.(\d+)\.(.+)$/);
    if (!m) continue;
    const idx = m[1]!;
    const field = m[2]!;
    const row = lineItemMap.get(idx) ?? {};
    row[field] = typeof raw === 'string' ? raw : '';
    lineItemMap.set(idx, row);
  }
  const lineItems = [...lineItemMap.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, row]) => ({
      descriptionEn: row.descriptionEn ?? '',
      descriptionAr: row.descriptionAr ?? '',
      quantity: row.quantity ?? '1',
      unitSar: row.unitSar ?? '0',
    }));

  const parsed = createQuoteSchema.safeParse({
    clientName: formData.get('clientName'),
    clientEmail: formData.get('clientEmail') || undefined,
    notes: formData.get('notes') || undefined,
    expiresInDays: formData.get('expiresInDays') || undefined,
    discountSar: formData.get('discountSar') || undefined,
    lineItems,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const quoteId = `q_${randomBytes(6).toString('hex')}`;

  const builtLineItems: QuoteLineItem[] = parsed.data.lineItems.map((li) => ({
    id: randomUUID(),
    descriptionEn: li.descriptionEn,
    descriptionAr: li.descriptionAr || undefined,
    quantity: li.quantity,
    unitHalalas: li.unitSar * SAR_TO_HALALAS,
    totalHalalas: Math.max(0, Math.round(li.quantity * li.unitSar * SAR_TO_HALALAS)),
  }));

  const discountHalalas = (parsed.data.discountSar ?? 0) * SAR_TO_HALALAS;
  const totals = computeQuoteTotals(builtLineItems, discountHalalas);
  const expiresAt =
    parsed.data.expiresInDays && parsed.data.expiresInDays > 0
      ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { error: quoteErr } = await supabase
    .from('Quote')
    .insert({
      id: quoteId,
      number: nextQuoteNumber(),
      shareSlug: uniqueSlug(`${parsed.data.clientName}-${quoteId.slice(2, 6)}`),
      creatorId: auth.creator.id,
      clientName: parsed.data.clientName,
      clientEmail: parsed.data.clientEmail || null,
      notes: parsed.data.notes || null,
      status: 'DRAFT',
      expiresAt,
      subtotalHalalas: totals.subtotalHalalas,
      vatHalalas: totals.vatHalalas,
      discountHalalas: totals.discountHalalas,
      totalHalalas: totals.totalHalalas,
      createdAt: now,
      updatedAt: now,
    });

  if (quoteErr) {
    console.error('[quotes/actions] createQuoteAction insert quote error:', quoteErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  // Insert line items
  if (builtLineItems.length > 0) {
    const { error: liErr } = await supabase
      .from('QuoteLineItem')
      .insert(
        builtLineItems.map((li) => ({
          id: li.id,
          quoteId,
          descriptionEn: li.descriptionEn,
          descriptionAr: li.descriptionAr || null,
          quantity: li.quantity,
          unitHalalas: li.unitHalalas,
          totalHalalas: li.totalHalalas,
        })),
      );

    if (liErr) {
      console.error('[quotes/actions] createQuoteAction insert line items error:', liErr.message);
    }
  }

  revalidatePath(`/${locale}/me/quotes`);
  redirect(`/${locale}/me/quotes/${quoteId}`);
}

export async function sendQuoteAction(locale: Locale, quoteId: string): Promise<QuoteResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: quote, error: fetchErr } = await supabase
    .from('Quote')
    .select('id, creatorId, status, shareSlug')
    .eq('id', quoteId)
    .maybeSingle();

  if (fetchErr || !quote) return { ok: false, error: 'QUOTE_NOT_FOUND' };
  if ((quote.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };
  if ((quote.status as string) !== 'DRAFT') return { ok: false, error: 'WRONG_STATE' };

  const { error: updateErr } = await supabase
    .from('Quote')
    .update({ status: 'SENT', updatedAt: new Date().toISOString() })
    .eq('id', quoteId);

  if (updateErr) {
    console.error('[quotes/actions] sendQuoteAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/quotes`);
  revalidatePath(`/${locale}/me/quotes/${quoteId}`);
  revalidatePath(`/${locale}/q/${quote.shareSlug as string}`);
  return { ok: true, message: 'SENT' };
}

export async function deleteQuoteAction(locale: Locale, quoteId: string): Promise<QuoteResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: quote, error: fetchErr } = await supabase
    .from('Quote')
    .select('id, creatorId')
    .eq('id', quoteId)
    .maybeSingle();

  if (fetchErr || !quote) return { ok: false, error: 'QUOTE_NOT_FOUND' };
  if ((quote.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  // Delete line items first (child rows)
  await supabase.from('QuoteLineItem').delete().eq('quoteId', quoteId);

  const { error: deleteErr } = await supabase.from('Quote').delete().eq('id', quoteId);

  if (deleteErr) {
    console.error('[quotes/actions] deleteQuoteAction error:', deleteErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/quotes`);
  redirect(`/${locale}/me/quotes`);
}

/* ----------------------------- public actions ------------------------------ */

export async function approveQuoteAction(locale: Locale, slug: string): Promise<QuoteResult> {
  const supabase = await createClient();

  const { data: quote, error: fetchErr } = await supabase
    .from('Quote')
    .select('id, creatorId, status, expiresAt, shareSlug, clientName, clientEmail, totalHalalas')
    .eq('shareSlug', slug)
    .maybeSingle();

  if (fetchErr || !quote) return { ok: false, error: 'QUOTE_NOT_FOUND' };
  if ((quote.status as string) !== 'SENT') return { ok: false, error: 'WRONG_STATE' };
  if (quote.expiresAt && new Date(quote.expiresAt as string) < new Date()) {
    await supabase
      .from('Quote')
      .update({ status: 'EXPIRED', updatedAt: new Date().toISOString() })
      .eq('id', quote.id as string);
    return { ok: false, error: 'EXPIRED' };
  }

  const now = new Date().toISOString();

  // Create a Contract row from the approved quote
  const contractId = `c_${randomBytes(6).toString('hex')}`;
  const contractYear = new Date().getFullYear();
  const contractRand = randomBytes(2).toString('hex');
  const contractSlugBase = ((quote.clientName as string) || 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const contractSlug = `${contractSlugBase}-${randomBytes(3).toString('hex')}`;

  const defaultSections = [
    {
      key: 'scopeOfWork',
      body: 'The Photographer agrees to provide creative services as detailed in the attached quote, including pre-session planning, the session(s) listed therein, and post-production through digital delivery.',
    },
    {
      key: 'deliverables',
      body: 'Edited digital images delivered via a private Hikaya gallery within four (4) weeks of the session date. Originals (RAW) are not delivered unless explicitly listed in the quote.',
    },
    {
      key: 'paymentTerms',
      body: 'A 50% non-refundable retainer is due upon signature. The remaining balance is due no later than the day before the session. All payments are processed in SAR including 15% VAT where applicable.',
    },
    {
      key: 'cancellationPolicy',
      body: 'Cancellation by the Client more than 30 days before the session: retainer applied to a future booking within 12 months. Within 30 days: retainer is forfeit. The Photographer may cancel for cause and refund all monies paid; no further liability.',
    },
    {
      key: 'usageRights',
      body: 'The Client receives a personal-use license to all delivered images. Commercial use, including resale or use in advertising, requires a separate written license. The Photographer retains copyright and may use a representative selection in their portfolio and on social media unless mutually agreed otherwise.',
    },
    {
      key: 'additionalTerms',
      body: "Either party may amend this agreement only in writing, signed by both. Disputes shall be resolved per Hikaya's published dispute-resolution policy and the laws of the Kingdom of Saudi Arabia.",
    },
  ];

  const { error: contractErr } = await supabase
    .from('Contract')
    .insert({
      id: contractId,
      number: `C-${contractYear}-${contractRand}`,
      shareSlug: contractSlug,
      creatorId: quote.creatorId as string,
      quoteId: quote.id as string,
      clientName: (quote.clientName as string) || '',
      clientEmail: (quote.clientEmail as string) || null,
      totalHalalas: (quote.totalHalalas as number) || 0,
      sections: defaultSections,
      status: 'SENT',
      createdAt: now,
      updatedAt: now,
    });

  if (contractErr) {
    console.error('[quotes/actions] approveQuoteAction create contract error:', contractErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  // Update quote: mark as APPROVED and link the contract
  const { error: quoteUpdateErr } = await supabase
    .from('Quote')
    .update({
      status: 'APPROVED',
      approvedAt: now,
      contractId,
      updatedAt: now,
    })
    .eq('id', quote.id as string);

  if (quoteUpdateErr) {
    console.error('[quotes/actions] approveQuoteAction update quote error:', quoteUpdateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/q/${slug}`);
  revalidatePath(`/${locale}/me/quotes/${quote.id as string}`);
  revalidatePath(`/${locale}/me/quotes`);
  revalidatePath(`/${locale}/me/contracts`);

  // Send the client straight to the new contract's signing page.
  redirect(`/${locale}/c/${contractSlug}`);
}

export async function rejectQuoteAction(
  locale: Locale,
  slug: string,
  _prev: QuoteResult | null,
  formData: FormData,
): Promise<QuoteResult> {
  const supabase = await createClient();

  const { data: quote, error: fetchErr } = await supabase
    .from('Quote')
    .select('id, status, shareSlug')
    .eq('shareSlug', slug)
    .maybeSingle();

  if (fetchErr || !quote) return { ok: false, error: 'QUOTE_NOT_FOUND' };
  if ((quote.status as string) !== 'SENT') return { ok: false, error: 'WRONG_STATE' };

  const parsed = rejectQuoteSchema.safeParse({ reason: formData.get('reason') ?? '' });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('Quote')
    .update({
      status: 'REJECTED',
      rejectedAt: now,
      rejectReason: parsed.data.reason || null,
      updatedAt: now,
    })
    .eq('id', quote.id as string);

  if (updateErr) {
    console.error('[quotes/actions] rejectQuoteAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/q/${slug}`);
  revalidatePath(`/${locale}/me/quotes/${quote.id as string}`);
  revalidatePath(`/${locale}/me/quotes`);
  return { ok: true, message: 'REJECTED' };
}
