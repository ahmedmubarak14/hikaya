import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

import { Button, Logo } from '@hikaya/ui';

import { RoleSwitcher } from '@/components/role-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { type Locale } from '@/i18n/config';
import type { MockUserRole } from '@/lib/auth/mock-store';
import { getSession } from '@/lib/auth/session';
import { getTheme } from '@/lib/theme/get-theme';

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
  const theme = (await getTheme()) ?? 'light';

  return (
    <header className="border-surface/5 bg-bg/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="max-w-8xl mx-auto flex h-16 w-full items-center justify-between px-6 md:px-10">
        <Link href={`/${locale}`} className="text-surface flex items-center" aria-label="Hikaya">
          <Logo arabic={locale === 'ar'} className="h-7" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink href={`/${locale}/discover`}>{t('discover')}</NavLink>
          <NavLink href={`/${locale}/spaces`}>{t('spaces')}</NavLink>
          <NavLink href={`/${locale}/jobs`}>{t('jobs')}</NavLink>
          <NavLink href={`/${locale}/studios`}>{t('studios')}</NavLink>
          <NavLink href={`/${locale}/blog`}>{t('blog')}</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle
            initial={theme}
            labels={{ switchToLight: t('switchToLight'), switchToDark: t('switchToDark') }}
          />
          <Link
            href={`/${otherLocale}`}
            hrefLang={otherLocale}
            className="border-surface/15 text-surface/70 hover:border-surface/40 hover:text-surface rounded-full border px-3 py-1.5 text-xs transition-colors"
          >
            {t('switchLanguage')}
          </Link>

          {session && session.user.roles.length >= 2 ? (
            <RoleSwitcher
              current={session.user.currentRole}
              available={session.user.roles}
              labels={
                {
                  CREATOR: t('roleCreatorShort'),
                  STUDIO_OWNER: t('roleStudioOwnerShort'),
                  CLIENT: t('roleClientShort'),
                } as Record<MockUserRole, string>
              }
            />
          ) : null}

          {session ? (
            <Link
              href={`/${locale}/me`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
              aria-label={session.user.displayName}
            >
              <span
                aria-hidden
                className="bg-accent text-2xs text-ink grid h-6 w-6 place-items-center rounded-full font-semibold uppercase"
              >
                {session.user.displayName.charAt(0)}
              </span>
              <span className="hidden md:inline">{session.user.displayName.split(' ')[0]}</span>
            </Link>
          ) : (
            <>
              <Link
                href={`/${locale}/sign-in`}
                className="text-surface/80 hover:text-surface hidden rounded-full px-4 py-2 text-sm transition-colors md:inline-flex"
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
    <Link href={href} className="text-surface/70 hover:text-surface text-sm transition-colors">
      {children}
    </Link>
  );
}
