'use server';

import { redirect } from 'next/navigation';

import { defaultLocale, type Locale } from '@/i18n/config';

import { signInFormSchema, signUpFormSchema } from './schemas';
import { supabaseSignIn, supabaseSignOut, supabaseSignUp } from './supabase-auth';

export type AuthErrorKey = 'INVALID_INPUT' | 'INVALID_CREDENTIALS' | 'EMAIL_TAKEN' | 'UNKNOWN';

export interface AuthFailure {
  ok: false;
  error: AuthErrorKey;
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
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const result = await supabaseSignIn({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (!result.ok) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

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
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const result = await supabaseSignUp({
    email: parsed.data.email,
    password: parsed.data.password,
    displayName: parsed.data.displayName,
    role: parsed.data.role,
    locale: parsed.data.locale,
  });

  if (!result.ok) {
    if (result.error === 'EMAIL_TAKEN') {
      return { ok: false, error: 'EMAIL_TAKEN', fieldErrors: { email: 'EMAIL_TAKEN' } };
    }
    return { ok: false, error: 'UNKNOWN' };
  }

  const next = parsed.data.role === 'STUDIO_OWNER' ? '/me/studio/setup' : '/me';
  redirect(`/${locale ?? defaultLocale}${next}`);
}

export async function signOutAction(locale: Locale): Promise<void> {
  await supabaseSignOut();
  redirect(`/${locale ?? defaultLocale}`);
}
