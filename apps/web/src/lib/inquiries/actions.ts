'use server';

import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getCreatorByUsername } from '@/lib/creators/queries';

import { createInquiry } from './mock-store';
import { inquiryFormSchema } from './schemas';

export type SubmitInquiryError =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'CREATOR_NOT_FOUND'
  | 'UNKNOWN';

export interface SubmitInquiryFailure {
  ok: false;
  error: SubmitInquiryError;
  fieldErrors?: Record<string, string>;
}

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

export async function submitInquiryAction(
  locale: Locale,
  username: string,
  _prev: SubmitInquiryFailure | null,
  formData: FormData,
): Promise<SubmitInquiryFailure> {
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/sign-in?next=/${locale}/${username}/hire`);
  }

  const creator = await getCreatorByUsername(username);
  if (!creator) return { ok: false, error: 'CREATOR_NOT_FOUND' };

  const parsed = inquiryFormSchema.safeParse({
    discipline: formData.get('discipline'),
    sessionDate: formData.get('sessionDate'),
    city: formData.get('city'),
    locationDetail: formData.get('locationDetail') || undefined,
    description: formData.get('description'),
    budgetMinSar: formData.get('budgetMinSar') || undefined,
    budgetMaxSar: formData.get('budgetMaxSar') || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  createInquiry({
    clientUserId: session.user.id,
    creatorUsername: username,
    discipline: parsed.data.discipline,
    sessionDates: [new Date(parsed.data.sessionDate).toISOString()],
    city: parsed.data.city,
    locationDetail: parsed.data.locationDetail || undefined,
    description: parsed.data.description,
    budgetMinSar: parsed.data.budgetMinSar,
    budgetMaxSar: parsed.data.budgetMaxSar,
  });

  redirect(`/${locale}/me/inquiries?sent=1`);
}
