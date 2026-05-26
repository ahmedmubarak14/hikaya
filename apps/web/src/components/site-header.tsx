import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

import { Button, Logo } from '@hikaya/ui';

import { UnreadBadge } from '@/components/messages/unread-badge';
import { RoleSwitcher } from '@/components/role-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { type Locale } from '@/i18n/config';
import type { MockUserRole } from '@/lib/auth/mock-store';
import { getSession } from '@/lib/auth/session';
import { getUnreadMessageCount } from '@/lib/messages/queries';
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

  // Fetch unread message count for the badge
  let unreadCount = 0;
  if (session) {
    try {
      unreadCount = await getUnreadMessageCount(session.user.id);
    } catch {
      // Non-critical — badge just won't show
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-surface/10 bg-bg/75 backdrop-blur-xl">
      <div className="max-w-8xl mx-auto flex h-18 w-full items-center justify-between px-5 md:px-10">
        <Link href={`/${locale}`} className="text-surface flex items-center" aria-label="Hikaya">
          <Logo arabic={locale === 'ar'} className="h-7" />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-surface/10 bg-surface/[0.035] p-1 md:flex">
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

          {session && Array.isArray(session.user.roles) && session.user.roles.length >= 2 ? (
            <RoleSwitcher
              current={session.user.currentRole}
              available={session.user.roles}
              labels={roleLabels(t)}
            />
          ) : null}

          {session ? (
            <Link
              href={`/${locale}/me`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
              aria-label={session.user.displayName}
            >
              <span
                aria-hidden
                className="text-2xs relative grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)] font-semibold uppercase text-[var(--ink)]"
              >
                {session.user.displayName.charAt(0)}
                <UnreadBadge initialCount={unreadCount} userId={session.user.id} />
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
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm text-surface/65 transition-colors hover:bg-bg/70 hover:text-surface"
    >
      {children}
    </Link>
  );
}

/**
 * Build a fully-typed role-label map. Declaring the type at the binding site
 * (instead of casting at the usage site) makes TS exhaustiveness-check the
 * object: adding a new MockUserRole becomes a compile error here.
 */
function roleLabels(
  t: Awaited<ReturnType<typeof getTranslations<'nav'>>>,
): Record<MockUserRole, string> {
  return {
    CREATOR: t('roleCreatorShort'),
    STUDIO_OWNER: t('roleStudioOwnerShort'),
    CLIENT: t('roleClientShort'),
  };
}
