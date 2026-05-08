import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';

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

  const roleKey: 'roleClient' | 'roleCreator' =
    session.user.role === 'CREATOR' ? 'roleCreator' : 'roleClient';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">
            {tAuth(roleKey)}
          </Badge>
          <h1 className="text-balance text-5xl">
            {t('greeting', { name: session.user.displayName })}
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardBody className="flex flex-col gap-2 p-6">
              <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('emailLabel')}
              </span>
              <p className="text-base text-surface">{session.user.email}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-2 p-6">
              <span className="font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('roleLabel')}
              </span>
              <p className="text-base text-surface">{session.user.role}</p>
            </CardBody>
          </Card>

          <Card className="md:col-span-2">
            <CardBody className="flex flex-col gap-3 p-6">
              <span className="font-mono text-2xs uppercase tracking-widest text-accent [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                {t('nextLabel')}
              </span>
              <p className="text-base text-surface/70">{t('nextBody')}</p>
            </CardBody>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/me/portfolio`}
              className="rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm text-accent transition-colors hover:bg-accent/15"
            >
              {t('portfolioLink')} →
            </Link>
            <Link
              href={`/${locale}/me/galleries`}
              className="rounded-full border border-surface/15 px-5 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
            >
              {t('galleriesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/quotes`}
              className="rounded-full border border-surface/15 px-5 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
            >
              {t('quotesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/contracts`}
              className="rounded-full border border-surface/15 px-5 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
            >
              {t('contractsLink')} →
            </Link>
            <Link
              href={`/${locale}/me/inquiries`}
              className="rounded-full border border-surface/15 px-5 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
            >
              {t('inquiriesLink')} →
            </Link>
            <Link
              href={`/${locale}/me/studio`}
              className="rounded-full border border-surface/15 px-5 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface"
            >
              {t('studioLink')} →
            </Link>
          </div>
          <SignOutButton locale={locale} />
        </div>
      </main>
    </>
  );
}
