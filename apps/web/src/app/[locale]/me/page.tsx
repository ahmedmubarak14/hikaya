import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ActionItemsCard, type ActionItem } from '@/components/me/action-items';
import { DiscoveryScore } from '@/components/me/discovery-score';
import { PromoCard } from '@/components/me/promo-card';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import {
  getProfileActionItems,
  getProfileCompletionPercent,
} from '@/lib/me/profile-completion';

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
  const creator = await getMyCreatorProfile({ userId: session.user.id, email: session.user.email });

  const actionItems = getProfileActionItems(creator, locale);
  const items: ActionItem[] = actionItems.map((it) => ({
    id: it.id,
    label: t(`actions.${it.labelKey}` as 'actions.bio'),
    href: it.href,
    done: it.done,
  }));
  const percent = getProfileCompletionPercent(actionItems);

  const tRaw = await getTranslations({ locale, namespace: 'me.opportunities' });
  const opportunitiesRaw = tRaw.raw('items') as unknown;
  const opportunities = Array.isArray(opportunitiesRaw)
    ? (opportunitiesRaw as string[])
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <header className="mb-8 flex items-center gap-3">
        {session.user.avatarUrl ? (
          <Image
            src={session.user.avatarUrl}
            alt={session.user.displayName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="bg-accent/20 text-accent flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold">
            {session.user.displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <h1 className="text-surface text-3xl font-semibold tracking-tight">
          {t('welcome', { name: session.user.displayName.split(' ')[0] })}{' '}
          <span aria-hidden>👋</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActionItemsCard
            title={t('actionItems')}
            groupLabel={t('completeProfile')}
            percent={percent}
            items={items}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          <PromoCard
            visual={
              <div className="bg-accent/10 text-accent flex h-full items-center justify-center rounded-lg text-xl font-semibold">
                {t('promo.invoiceAmount')}
              </div>
            }
            body={t('promo.invoice')}
            cta={{ href: `/${locale}/me/quotes/new`, label: t('promo.sendInvoice') }}
          />
          <PromoCard
            visual={
              <div className="bg-purple/10 text-purple flex h-full items-center justify-center rounded-lg text-3xl">
                ✦
              </div>
            }
            body={t('promo.project')}
            cta={{ href: `/${locale}/me/studio`, label: t('promo.startProject') }}
          />
        </div>
      </div>

      <section className="border-line/60 mt-6 rounded-2xl border bg-paper p-6">
        <h3 className="text-surface text-base font-semibold">{t('opportunities.title')}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {opportunities.map((label) => (
            <span
              key={label}
              className="border-line bg-bg/60 text-surface inline-flex items-center rounded-full border px-3 py-1.5 text-sm"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="mt-5">
          <Link
            href={`/${locale}/discover`}
            className="bg-surface text-bg hover:bg-surface/90 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors"
          >
            {t('opportunities.cta')}
          </Link>
        </div>
      </section>

      <div className="mt-6">
        <DiscoveryScore
          percent={percent}
          score={percent * 10}
          scoreLabel={t('discovery.pts')}
          title={t('discovery.title')}
          body={t('discovery.body')}
          avatarUrl={session.user.avatarUrl ?? null}
          fallbackInitial={session.user.displayName.charAt(0).toUpperCase()}
        />
      </div>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-line/60 rounded-2xl border bg-paper p-6">
          <h3 className="text-surface text-base font-semibold">{t('income.title')}</h3>
          <p className="text-muted mt-1 text-sm">{t('income.body')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-surface/[0.04] h-20 rounded-xl" aria-hidden />
            <div className="bg-surface/[0.04] h-20 rounded-xl" aria-hidden />
          </div>
        </div>
        <div className="border-line/60 rounded-2xl border bg-paper p-6">
          <h3 className="text-surface text-base font-semibold">{t('views.title')}</h3>
          <p className="text-muted mt-1 text-sm">{t('views.body')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-surface/[0.04] h-20 rounded-xl" aria-hidden />
            <div className="bg-surface/[0.04] h-20 rounded-xl" aria-hidden />
          </div>
        </div>
      </section>
    </div>
  );
}
