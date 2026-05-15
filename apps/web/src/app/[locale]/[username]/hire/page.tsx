import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Logo } from '@hikaya/ui';

import { InquiryForm } from '@/components/inquiries/inquiry-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getCreatorByUsername } from '@/lib/creators/queries';

import type { Metadata } from 'next';

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

interface Props {
  params: Promise<{ locale: Locale; username: string }>;
}

export async function generateStaticParams() {
  const { CREATORS } = await import('@/lib/creators/mock-data');
  const { locales } = await import('@/i18n/config');
  return locales.flatMap((locale) => CREATORS.map((c) => ({ locale, username: c.username })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: 'inquiry' });
  return { title: `${t('title')} · ${username}` };
}

export default async function HireCreatorPage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const creator = await getCreatorByUsername(username);
  if (!creator) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/sign-in?next=/${locale}/${username}/hire`);
  }

  const t = await getTranslations('inquiry');
  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;

  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <aside className="border-surface/5 bg-bg relative hidden overflow-hidden border-e lg:block">
        <div className="grain-overlay relative flex h-full flex-col justify-between p-10">
          <Link href={`/${locale}`} className="text-surface self-start" aria-label="Hikaya">
            <Logo arabic={locale === 'ar'} className="h-7" />
          </Link>

          <div className="flex flex-col gap-6">
            <div className="border-bg relative h-24 w-24 overflow-hidden rounded-full border-4">
              <Image
                src={creator.avatarUrl}
                alt={name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <h2 className="max-w-md text-balance text-4xl">
              <span className="text-accent-secondary font-bold">{t('panelLineItalic')}</span>{' '}
              <span>{t('panelLineWith', { name })}</span>
            </h2>
            <p className="text-surface/60 max-w-sm text-sm">{t('panelBody')}</p>
          </div>

          <p className="text-surface/30 text-xs">{t('panelFooter')}</p>
        </div>
      </aside>

      <div className="flex flex-col px-6 py-12 md:px-10 lg:px-16">
        <header className="mb-8 flex flex-col gap-2">
          <Link
            href={`/${locale}/${creator.username}`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backTo', { name })}
          </Link>
          <h1 className="text-balance text-4xl">{t('title')}</h1>
          <p className="text-surface/60 text-sm">{t('subtitle')}</p>
        </header>

        <InquiryForm
          locale={locale}
          username={creator.username}
          defaultDiscipline={creator.disciplines[0] ?? 'COMMERCIAL_PHOTOGRAPHY'}
          defaultCity={creator.city}
        />
      </div>
    </main>
  );
}
