import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from './i18n/config';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match everything except API routes, static, and image-optimisation paths.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
