import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

import { Button, Logo } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

/**
 * Server component — reads the session cookie directly so the right-hand side
 * of the header can render either auth CTAs or the signed-in user's chip on
 * first paint, no client-side flash.
 */
export async function SiteHeader() {
  const t = await getTranslations('nav');
  const locale = (await getLocale()) as Locale;
  const otherLocale: Locale = locale === 'en' ? 'ar' : 'en';
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-surface/5 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-8xl items-center justify-between px-6 md:px-10">
        <Link href={`/${locale}`} className="flex items-center text-surface" aria-label="Hikaya">
          <Logo arabic={locale === 'ar'} className="h-7" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink href={`/${locale}/discover`}>{t('discover')}</NavLink>
          <NavLink href={`/${locale}/jobs`}>{t('jobs')}</NavLink>
          <NavLink href={`/${locale}/studios`}>{t('studios')}</NavLink>
          <NavLink href={`/${locale}/blog`}>{t('blog')}</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`/${otherLocale}`}
            hrefLang={otherLocale}
            className="rounded-full border border-surface/15 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-surface/70 transition-colors hover:border-surface/40 hover:text-surface"
          >
            {t('switchLanguage')}
          </Link>

          {session ? (
            <Link
              href={`/${locale}/me`}
              className="flex items-center gap-2 rounded-full border border-surface/15 px-3 py-1.5 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
              aria-label={session.user.displayName}
            >
              <span
                aria-hidden
                className="grid h-6 w-6 place-items-center rounded-full bg-accent/20 font-mono text-2xs uppercase text-accent"
              >
                {session.user.displayName.charAt(0)}
              </span>
              <span className="hidden md:inline">{session.user.displayName.split(' ')[0]}</span>
            </Link>
          ) : (
            <>
              <Link
                href={`/${locale}/sign-in`}
                className="hidden rounded-full px-4 py-2 text-sm text-surface/80 transition-colors hover:text-surface md:inline-flex"
              >
                {t('signIn')}
              </Link>
              <Link href={`/${locale}/sign-up`}>
                <Button size="sm" variant="primary">
                  {t('joinAsCreator')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-surface/70 transition-colors hover:text-surface"
    >
      {children}
    </Link>
  );
}
