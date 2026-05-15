import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { DemoModeNotice } from '@/components/demo-mode-notice';
import { SiteHeader } from '@/components/site-header';
import { StudioProfileForm } from '@/components/studio/studio-profile-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { getStudioByOwnerId } from '@/lib/studio/profile';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'studioSetup' });
  return { title: t('title') };
}

export default async function StudioSetupPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/studio/setup`);

  // If the studio profile is already set up, jump straight to the dashboard.
  // The dashboard / profile-edit screen is the right home, not this wizard.
  const existing = getStudioByOwnerId(session.user.id);
  if (existing) redirect(`/${locale}/me/studio`);

  const t = await getTranslations('studioSetup');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 transition-colors hover:text-surface"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="font-bold text-accent-secondary">{t('headlineItalic')}</span>
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        <StudioProfileForm locale={locale} />
      </main>
    </>
  );
}
