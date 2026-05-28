import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { AvailabilityForm } from '@/components/availability/availability-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getAvailabilityAction } from '@/lib/availability/actions';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'availability' });
  return { title: t('title') };
}

export default async function AvailabilityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('availability');
  const availability = await getAvailabilityAction();

  return (
    <>
      <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
        <Link
          href={`/${locale}/me`}
          className="text-2xs text-surface/40 hover:text-surface transition-colors"
        >
          {t('backToAccount')}
        </Link>

        <header className="mb-10 mt-4 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <AvailabilityForm
          initialStatus={availability?.status ?? 'AVAILABLE'}
          initialBlockedDates={availability?.blockedDates ?? []}
        />
      </main>
    </>
  );
}
