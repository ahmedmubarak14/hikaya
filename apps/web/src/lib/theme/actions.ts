'use server';

import { cookies } from 'next/headers';

import { THEME_COOKIE, type Theme } from './get-theme';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setTheme(theme: Theme): Promise<void> {
  // httpOnly: the cookie is only read by getTheme() server-side. The client
  // toggle owns its own localStorage copy + a synchronous DOM flip, so JS
  // never needs to read this cookie.
  (await cookies()).set(THEME_COOKIE, theme, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });
}
