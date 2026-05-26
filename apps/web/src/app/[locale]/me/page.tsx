import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { UpcomingBookingsWidget } from '@/components/studio/upcoming-bookings-widget';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getUpcomingBookings } from '@/lib/bookings/actions';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'me' });
  return { title: t('title') };
}

export default async function MePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('me');
  const tAuth = await getTranslations('auth');
  const upcomingBookings = await getUpcomingBookings(session.user.id, 3);

  const roleKey: 'roleClient' | 'roleCreator' | 'roleStudioOwner' =
    session.user.currentRole === 'CREATOR'
      ? 'roleCreator'
      : session.user.currentRole === 'STUDIO_OWNER'
        ? 'roleStudioOwner'
        : 'roleClient';

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">
            {tAuth(roleKey)}
          </Badge>
          <h1 className="text-balance text-5xl">
            {t('greeting', { name: session.user.displayName })}
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardBody className="flex flex-col gap-2 p-6">
              <span className="text-2xs text-surface/40">{t('emailLabel')}</span>
              <p className="text-surface text-base">{session.user.email}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-2 p-6">
              <span className="text-2xs text-surface/40">{t('roleLabel')}</span>
              <p className="text-surface text-base">{tAuth(roleKey)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Upcoming bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mt-8">
            <UpcomingBookingsWidget bookings={upcomingBookings} />
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/me/portfolio`}
              className="border-accent/40 bg-accent/10 text-accent-secondary hover:bg-accent/15 rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('portfolioLink')} →
            </Link>
            <Link
              href={`/${locale}/me/messages`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('messagesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/galleries`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('galleriesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/quotes`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('quotesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/contracts`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('contractsLink')} →
            </Link>
            <Link
              href={`/${locale}/me/jobs`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('jobsLink')} →
            </Link>
            <Link
              href={`/${locale}/me/store`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('storeLink')} →
            </Link>
            <Link
              href={`/${locale}/me/purchases`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('purchasesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/inquiries`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('inquiriesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/studio`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('studioLink')} →
            </Link>
            <Link
              href={`/${locale}/me/services`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('servicesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/templates`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('templatesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/availability`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('availabilityLink')} →
            </Link>
            <Link
              href={`/${locale}/me/discounts`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('discountsLink')} →
            </Link>
            <Link
              href={`/${locale}/me/favorites`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('favoritesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/analytics`}
              className="border-accent/40 bg-accent/10 text-accent-secondary hover:bg-accent/15 rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('analyticsLink')} →
            </Link>
            <Link
              href={`/${locale}/me/disputes`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('disputesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/settings`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
            >
              {t('settingsLink')} →
            </Link>
          </div>
          <SignOutButton locale={locale} />
        </div>
      </main>
    </>
  );
}
