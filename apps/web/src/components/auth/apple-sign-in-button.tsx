'use client';

/**
 * Apple Sign-In button for Supabase Auth.
 *
 * SETUP REQUIRED: Before this button will work, the user must:
 * 1. Create an Apple Developer account and a Services ID
 * 2. Configure the return URL in Apple Developer Console
 *    (https://<project-ref>.supabase.co/auth/v1/callback)
 * 3. Add the Apple provider credentials (client ID + secret) in the
 *    Supabase dashboard under Authentication > Providers > Apple.
 *
 * Once configured, this button calls Supabase's signInWithOAuth with
 * provider: 'apple' and redirects to the auth callback route.
 */

import { createClient } from '@/lib/supabase/client';

interface Props {
  locale: string;
  label: string;
  /** Role to assign when this OAuth flow creates a brand-new account. */
  role?: 'CREATOR' | 'STUDIO_OWNER' | 'CLIENT';
}

export function AppleSignInButton({ locale, label, role }: Props) {
  async function handleClick() {
    const supabase = createClient();
    const params = new URLSearchParams({ locale });
    if (role) params.set('role', role);
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?${params.toString()}`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border-surface/15 text-surface hover:border-surface/40 hover:bg-surface/[0.03] flex h-12 w-full items-center justify-center gap-3 rounded-full border text-sm font-medium transition-colors"
    >
      <AppleIcon />
      {label}
    </button>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C3.79 16.17 4.36 9.02 8.73 8.76c1.23.06 2.08.72 2.8.75.97-.2 1.9-.77 2.93-.7 1.24.1 2.17.59 2.78 1.51-2.54 1.52-1.94 4.87.42 5.8-.5 1.31-.73 1.9-1.61 3.16zM12.04 8.7c-.15-2.24 1.62-4.2 3.74-4.37.29 2.57-2.34 4.5-3.74 4.37z" />
    </svg>
  );
}
