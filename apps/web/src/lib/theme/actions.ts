'use server';

import { cookies } from 'next/headers';

import { THEME_COOKIE, type Theme } from './get-theme';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setTheme(theme: Theme): Promise<void> {
  (await cookies()).set(THEME_COOKIE, theme, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });
}
