import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
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
  if (!creator) return <NoCreatorState locale={locale} t={tNoProfile} backLabel={t('backToAccount')} />;

  const galleries = listGalleriesByCreator(creator.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-22 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-5xl md:text-6xl">
            <span>{t('headline')}</span>{' '}
            <em className="font-display italic text-accent">{t('headlineItalic')}</em>
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
        </header>

        <div className="mb-8">
          <Link href={`/${locale}/me/galleries/new`}>
            <Button size="md" variant="primary">
              + {t('newCta')}
            </Button>
          </Link>
        </div>

        {galleries.length === 0 ? (
          <div className="rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
            <p className="text-lg text-surface/70">{t('empty')}</p>
            <p className="mt-2 text-sm text-surface/40">{t('emptyHint')}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((g) => {
              const title = locale === 'ar' && g.titleAr ? g.titleAr : g.titleEn;
              const visitors = countDistinctVisitors(g.id);
              return (
                <li key={g.id}>
                  <Link href={`/${locale}/me/galleries/${g.id}`} className="group block">
                    <Card interactive className="overflow-hidden">
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface/5">
                        <Image
                          src={g.coverUrl}
                          alt={title}
                          fill
                          sizes="(min-width: 1024px) 33vw, 50vw"
                          className="object-cover transition-transform duration-cinematic ease-out group-hover:scale-[1.03]"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                      </div>
                      <CardBody className="flex flex-col gap-3 p-5">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="truncate text-lg text-surface">{title}</h3>
                          <span className="shrink-0 font-mono text-2xs uppercase tracking-wider text-surface/50 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
                            {t('imageCount', { count: g.images.length })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-2xs">
                          <span className="font-mono text-surface/40 [lang=ar]:font-sansAr">
                            {t('visitorCount', { count: visitors })}
                          </span>
                          {g.expiresAt ? (
                            <span className="font-mono text-surface/40 [lang=ar]:font-sansAr">
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
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-22 md:px-10">
        <Link
          href={`/${locale}/me`}
          className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
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
            <p className="text-sm text-surface/50">{t('demoHint')}</p>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
