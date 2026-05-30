'use server';

import { redirect } from 'next/navigation';

import { defaultLocale, type Locale } from '@/i18n/config';

import { signInFormSchema, signUpFormSchema } from './schemas';
import { supabaseSignIn, supabaseSignOut, supabaseSignUp } from './supabase-auth';

export type AuthErrorKey =
  | 'INVALID_INPUT'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'EMAIL_TAKEN'
  | 'UNKNOWN';

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
    if (result.error === 'EMAIL_NOT_CONFIRMED') {
      return { ok: false, error: 'EMAIL_NOT_CONFIRMED' };
    }
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
    console.error('[auth/signUpAction] supabaseSignUp failed:', result.error);
    // In non-prod surface the real error string so we can diagnose quickly.
    return {
      ok: false,
      error: process.env.NODE_ENV === 'production' ? 'UNKNOWN' : (result.error as 'UNKNOWN'),
    };
  }

  // Email confirmation is on → no session yet. Send the user to a
  // "check your email" screen instead of bouncing through a session-less
  // /me (which silently redirected back to sign-in — the reported bug).
  if (result.needsConfirmation) {
    redirect(
      `/${locale ?? defaultLocale}/sign-up/check-email?email=${encodeURIComponent(parsed.data.email)}`,
    );
  }

  const next = parsed.data.role === 'STUDIO_OWNER' ? '/me/studio/setup' : '/me';
  redirect(`/${locale ?? defaultLocale}${next}`);
}

export async function signOutAction(locale: Locale): Promise<void> {
  await supabaseSignOut();
  redirect(`/${locale ?? defaultLocale}`);
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function forgotPasswordAction(
  locale: Locale,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'INVALID_INPUT' };
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Determine the origin for the redirect URL. In production this is the
  // Vercel deployment URL; locally it falls back to localhost.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password?locale=${locale}`,
  });

  if (error) {
    console.error('[auth/actions] forgotPasswordAction error:', error.message);
    // Still return ok:true to avoid leaking whether the email exists
  }

  return { ok: true };
}

export async function resetPasswordAction(
  locale: Locale,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: 'PASSWORD_TOO_SHORT' };
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error('[auth/actions] resetPasswordAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  redirect(`/${locale ?? defaultLocale}/sign-in`);
}
