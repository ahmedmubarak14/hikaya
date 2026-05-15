import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { SpaceStatusButton } from '@/components/spaces/space-status-button';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { formatSarFromHalalas } from '@/lib/format';
import { listSpacesByOwner } from '@/lib/spaces/queries';
import type { SpaceStatus } from '@/lib/spaces/mock-data';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spaces.owner' });
  return { title: t('title') };
}

const STATUS_TONE: Record<SpaceStatus, 'neutral' | 'sage' | 'warning'> = {
  DRAFT: 'neutral',
  ACTIVE: 'sage',
  PAUSED: 'warning',
};

export default async function MySpacesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/spaces`);

  const t = await getTranslations('spaces.owner');
  const tStatus = await getTranslations('spaces.owner.status');

  const spaces = await listSpacesByOwner(session.user.id);

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-5xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('back')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t('title')}
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <span className="text-2xs text-surface/40">{t('count', { count: spaces.length })}</span>
          <Link href={`/${locale}/me/spaces/new`}>
            <Button size="md" variant="primary">
              + {t('new')}
            </Button>
          </Link>
        </div>

        {spaces.length === 0 ? (
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
            <p className="text-surface/70 text-lg">{t('empty')}</p>
            <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {spaces.map((s) => (
              <li key={s.id}>
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-[112px_1fr] gap-4 p-3">
                    <Link
                      href={`/${locale}/me/spaces/${s.id}`}
                      className="bg-surface/5 relative aspect-square overflow-hidden rounded-md"
                    >
                      {s.photos[0] ? (
                        <Image
                          src={s.photos[0]}
                          alt={s.name}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : null}
                    </Link>
                    <div className="flex flex-col gap-2 py-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/${locale}/me/spaces/${s.id}`}
                          className="text-surface text-base hover:underline"
                        >
                          {s.name}
                        </Link>
                        <Badge tone={STATUS_TONE[s.status]}>{tStatus(s.status)}</Badge>
                      </div>
                      <p className="text-2xs text-surface/60 font-mono tabular-nums">
                        {s.hourlyHalalas > 0
                          ? t('rowHourly', { price: formatSarFromHalalas(s.hourlyHalalas, locale) })
                          : null}
                        {s.hourlyHalalas > 0 && s.dailyHalalas > 0 ? ' · ' : null}
                        {s.dailyHalalas > 0
                          ? t('rowDaily', { price: formatSarFromHalalas(s.dailyHalalas, locale) })
                          : null}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-2">
                        <Link
                          href={`/${locale}/me/spaces/${s.id}`}
                          className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-3 py-1 text-xs transition-colors"
                        >
                          {t('edit')}
                        </Link>
                        {s.status === 'ACTIVE' ? (
                          <SpaceStatusButton locale={locale} spaceId={s.id} to="PAUSED" />
                        ) : (
                          <SpaceStatusButton
                            locale={locale}
                            spaceId={s.id}
                            to="ACTIVE"
                            variant="primary"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
