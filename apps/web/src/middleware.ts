import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';

import { defaultLocale, locales } from './i18n/config';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  // 1. Refresh the Supabase session cookie (keeps auth alive).
  await updateSession(request);

  // 2. Skip i18n middleware for the OAuth callback route — it's not locale-prefixed.
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return;
  }

  // 3. Run the next-intl locale middleware (redirect, rewrite, etc.)
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
