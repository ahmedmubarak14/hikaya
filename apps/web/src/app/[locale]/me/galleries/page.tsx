import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { EmptyState } from '@/components/empty-state';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { countDistinctVisitors, listGalleriesByCreator } from '@/lib/galleries/mock-store';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery.list' });
  return { title: t('title') };
}

export default async function MyGalleriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/galleries`);

  const t = await getTranslations('gallery.list');
  const tNoProfile = await getTranslations('portfolioEditor.noProfile');

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator)
    return <NoCreatorState locale={locale} t={tNoProfile} backLabel={t('backToAccount')} />;

  const galleries = listGalleriesByCreator(creator.id);

  return (
    <>
      <main className="py-22 mx-auto w-full max-w-6xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="text-accent-secondary font-bold">{t('headlineItalic')}</span>
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <div className="mb-8">
          <Link href={`/${locale}/me/galleries/new`}>
            <Button size="md" variant="primary">
              + {t('newCta')}
            </Button>
          </Link>
        </div>

        {galleries.length === 0 ? (
          <EmptyState
            title={t('empty')}
            subtitle={t('emptySubtitle')}
            ctaLabel={t('newCta')}
            ctaHref={`/${locale}/me/galleries/new`}
            icon={'\u{1F5BC}\u{FE0F}'}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((g) => {
              const title = locale === 'ar' && g.titleAr ? g.titleAr : g.titleEn;
              const visitors = countDistinctVisitors(g.id);
              return (
                <li key={g.id}>
                  <Link href={`/${locale}/me/galleries/${g.id}`} className="group block">
                    <Card interactive className="overflow-hidden">
                      <div className="bg-surface/5 relative aspect-[16/10] w-full overflow-hidden">
                        <Image
                          src={g.coverUrl}
                          alt={title}
                          fill
                          sizes="(min-width: 1024px) 33vw, 50vw"
                          className="duration-cinematic object-cover transition-transform ease-out group-hover:scale-[1.03]"
                        />
                        <div className="from-bg via-bg/30 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
                      </div>
                      <CardBody className="flex flex-col gap-3 p-5">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-surface truncate text-lg">{title}</h3>
                          <span className="text-2xs text-surface/50 shrink-0">
                            {t('imageCount', { count: g.images.length })}
                          </span>
                        </div>
                        <div className="text-2xs flex items-center justify-between">
                          <span className="text-surface/40 [lang=ar]:font-sansAr font-mono">
                            {t('visitorCount', { count: visitors })}
                          </span>
                          {g.expiresAt ? (
                            <span className="text-surface/40 [lang=ar]:font-sansAr font-mono">
                              {t('expires', { date: formatDate(new Date(g.expiresAt), locale) })}
                            </span>
                          ) : null}
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

function formatDate(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

function NoCreatorState({
  locale,
  t,
  backLabel,
}: {
  locale: Locale;
  t: Awaited<ReturnType<typeof getTranslations>>;
  backLabel: string;
}) {
  return (
    <>
      <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
        <Link
          href={`/${locale}/me`}
          className="text-2xs text-surface/40 hover:text-surface transition-colors"
        >
          ← {backLabel}
        </Link>
        <Card className="mt-8">
          <CardBody className="flex flex-col gap-4 p-8">
            <Badge tone="warning" className="self-start">
              {t('label')}
            </Badge>
            <h1 className="text-balance text-3xl">{t('title')}</h1>
            <p className="text-surface/60">{t('body')}</p>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
