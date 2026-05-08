'use server';

import { redirect } from 'next/navigation';

import { defaultLocale, type Locale } from '@/i18n/config';

import { authenticate, createUser } from './mock-store';
import { signInFormSchema, signUpFormSchema } from './schemas';
import { createSession, destroySession } from './session';

/**
 * Server actions for the mock auth flow.
 *
 * Action results follow a `{ ok: false, error: 'KEY' }` pattern so the form
 * can render translated error copy without hard-coding English in the action.
 * Successful actions redirect — they do not return.
 */

export type AuthErrorKey =
  | 'INVALID_INPUT'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'UNKNOWN';

export interface AuthFailure {
  ok: false;
  error: AuthErrorKey;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function signInAction(
  locale: Locale,
  _prev: AuthFailure | null,
  formData: FormData,
): Promise<AuthFailure> {
  const parsed = signInFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const user = authenticate(parsed.data.email, parsed.data.password);
  if (!user) return { ok: false, error: 'INVALID_CREDENTIALS' };

  await createSession(user.id);
  redirect(`/${locale ?? defaultLocale}/me`);
}

export async function signUpAction(
  locale: Locale,
  _prev: AuthFailure | null,
  formData: FormData,
): Promise<AuthFailure> {
  const parsed = signUpFormSchema.safeParse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role') ?? 'CLIENT',
    locale: formData.get('locale') ?? locale,
    acceptedTerms: formData.get('acceptedTerms') === 'on',
  });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  let user;
  try {
    user = createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      locale: parsed.data.locale,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return { ok: false, error: 'EMAIL_TAKEN', fieldErrors: { email: 'EMAIL_TAKEN' } };
    }
    return { ok: false, error: 'UNKNOWN' };
  }

  await createSession(user.id);
  redirect(`/${locale ?? defaultLocale}/me`);
}

export async function signOutAction(locale: Locale): Promise<void> {
  await destroySession();
  redirect(`/${locale ?? defaultLocale}`);
}
