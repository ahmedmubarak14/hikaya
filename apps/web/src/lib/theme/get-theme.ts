import 'server-only';

import { cookies } from 'next/headers';

import { IS_STATIC_EXPORT } from '@/lib/static-export';

export type Theme = 'light' | 'dark';

export const THEME_COOKIE = 'hikaya_theme';

/**
 * Resolve the active theme for SSR. Light is the default; users opt into dark
 * via the header toggle, which writes a cookie. In static-export builds we
 * skip cookies entirely — the inline anti-FOUC script handles localStorage on
 * the client.
 */
export async function getTheme(): Promise<Theme | null> {
  if (IS_STATIC_EXPORT) return null;
  const raw = (await cookies()).get(THEME_COOKIE)?.value;
  return raw === 'dark' || raw === 'light' ? raw : null;
}
