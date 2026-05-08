'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createContractFromQuote } from '@/lib/contracts/mock-store';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import {
  createQuote,
  deleteQuote as storeDeleteQuote,
  getQuoteById,
  getQuoteBySlug,
  setQuoteContractId,
  updateQuoteStatus,
} from './mock-store';
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

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
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
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const quote = createQuote({
    creatorId: auth.creator.id,
    clientName: parsed.data.clientName,
    clientEmail: parsed.data.clientEmail || undefined,
    notes: parsed.data.notes || undefined,
    expiresInDays: parsed.data.expiresInDays,
    discountHalalas: (parsed.data.discountSar ?? 0) * SAR_TO_HALALAS,
    lineItems: parsed.data.lineItems.map((li) => ({
      descriptionEn: li.descriptionEn,
      descriptionAr: li.descriptionAr || undefined,
      quantity: li.quantity,
      unitHalalas: li.unitSar * SAR_TO_HALALAS,
    })),
  });

  revalidatePath(`/${locale}/me/quotes`);
  redirect(`/${locale}/me/quotes/${quote.id}`);
}

export async function sendQuoteAction(locale: Locale, quoteId: string): Promise<QuoteResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const quote = getQuoteById(quoteId);
  if (!quote) return { ok: false, error: 'QUOTE_NOT_FOUND' };
  if (quote.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };
  if (quote.status !== 'DRAFT') return { ok: false, error: 'WRONG_STATE' };

  updateQuoteStatus(quoteId, 'SENT');
  revalidatePath(`/${locale}/me/quotes`);
  revalidatePath(`/${locale}/me/quotes/${quoteId}`);
  revalidatePath(`/${locale}/q/${quote.shareSlug}`);
  return { ok: true, message: 'SENT' };
}

export async function deleteQuoteAction(locale: Locale, quoteId: string): Promise<QuoteResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const quote = getQuoteById(quoteId);
  if (!quote) return { ok: false, error: 'QUOTE_NOT_FOUND' };
  if (quote.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };

  storeDeleteQuote(quoteId);
  revalidatePath(`/${locale}/me/quotes`);
  redirect(`/${locale}/me/quotes`);
}

/* ----------------------------- public actions ------------------------------ */

export async function approveQuoteAction(locale: Locale, slug: string): Promise<QuoteResult> {
  const quote = getQuoteBySlug(slug);
  if (!quote) return { ok: false, error: 'QUOTE_NOT_FOUND' };
  if (quote.status !== 'SENT') return { ok: false, error: 'WRONG_STATE' };
  if (quote.expiresAt && new Date(quote.expiresAt) < new Date()) {
    updateQuoteStatus(quote.id, 'EXPIRED');
    return { ok: false, error: 'EXPIRED' };
  }

  // Convert to a contract on approval per the PRD ("with one click").
  const contract = createContractFromQuote(quote);
  setQuoteContractId(quote.id, contract.id);
  updateQuoteStatus(quote.id, 'APPROVED');

  revalidatePath(`/${locale}/q/${slug}`);
  revalidatePath(`/${locale}/me/quotes/${quote.id}`);
  revalidatePath(`/${locale}/me/quotes`);
  revalidatePath(`/${locale}/me/contracts`);

  // Send the client straight to the new contract's signing page.
  redirect(`/${locale}/c/${contract.shareSlug}`);
}

export async function rejectQuoteAction(
  locale: Locale,
  slug: string,
  _prev: QuoteResult | null,
  formData: FormData,
): Promise<QuoteResult> {
  const quote = getQuoteBySlug(slug);
  if (!quote) return { ok: false, error: 'QUOTE_NOT_FOUND' };
  if (quote.status !== 'SENT') return { ok: false, error: 'WRONG_STATE' };

  const parsed = rejectQuoteSchema.safeParse({ reason: formData.get('reason') ?? '' });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  updateQuoteStatus(quote.id, 'REJECTED', { rejectReason: parsed.data.reason || undefined });
  revalidatePath(`/${locale}/q/${slug}`);
  revalidatePath(`/${locale}/me/quotes/${quote.id}`);
  revalidatePath(`/${locale}/me/quotes`);
  return { ok: true, message: 'REJECTED' };
}
