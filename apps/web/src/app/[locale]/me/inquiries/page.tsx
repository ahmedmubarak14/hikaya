import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getCreatorByUsername } from '@/lib/creators/queries';
import { listInquiriesByClient, type InquiryStatus } from '@/lib/inquiries/mock-store';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ sent?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inquiries' });
  return { title: t('title') };
}

const STATUS_TONE: Record<InquiryStatus, 'neutral' | 'accent' | 'sage' | 'warning'> = {
  PENDING: 'accent',
  ACCEPTED: 'sage',
  DECLINED: 'warning',
  EXPIRED: 'neutral',
};

export default async function MyInquiriesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Static export drops searchParams.
  const { sent } = IS_STATIC_EXPORT ? {} : await searchParams;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/inquiries`);

  const t = await getTranslations('inquiries');
  const tCity = await getTranslations('cities');
  const tDiscipline = await getTranslations('disciplines');

  const inquiries = listInquiriesByClient(session.user.id);

  // Resolve creator names for the rows; mock-store stores only the username.
  const creators = await Promise.all(inquiries.map((i) => getCreatorByUsername(i.creatorUsername)));

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-5xl px-6 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('backToAccount')}
          </Link>
          <h1 className="text-balance text-5xl">{t('title')}</h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {sent === '1' ? (
          <Card className="border-accent/40 bg-accent/5 mb-8">
            <CardBody className="flex flex-col gap-1 p-5">
              <span className="text-2xs text-accent-secondary">{t('sentLabel')}</span>
              <p className="text-surface/80 text-sm">{t('sentBody')}</p>
            </CardBody>
          </Card>
        ) : null}

        {inquiries.length === 0 ? (
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
            <p className="text-surface/70 text-lg">{t('empty')}</p>
            <p className="text-surface/40 mt-2 text-sm">{t('emptyHint')}</p>
            <Link
              href={`/${locale}/discover`}
              className="bg-accent text-ink mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-medium transition-transform hover:scale-[1.02]"
            >
              {t('discoverCta')}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {inquiries.map((inq, idx) => {
              const creator = creators[idx];
              if (!creator) return null;
              const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
              const sessionDate = new Date(inq.sessionDates[0] ?? inq.createdAt);
              const createdAt = new Date(inq.createdAt);
              return (
                <li key={inq.id}>
                  <Card>
                    <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between md:gap-6">
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href={`/${locale}/${creator.username}`}
                          className="text-surface text-lg underline-offset-4 hover:underline"
                        >
                          {name}
                        </Link>
                        <p className="text-2xs text-surface/40">
                          {tDiscipline(disciplineKey(inq.discipline) as 'weddingPhoto')}
                          {' · '}
                          {tCity(inq.city as 'RIYADH')}
                          {' · '}
                          {formatDate(sessionDate, locale)}
                        </p>
                        <p className="text-surface/60 line-clamp-2 max-w-prose text-sm">
                          {inq.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge tone={STATUS_TONE[inq.status]}>
                          {t(`status.${inq.status}` as 'status.PENDING')}
                        </Badge>
                        <span className="text-2xs text-surface/40 font-mono">
                          {t('sentAgo', { time: formatRelative(createdAt, locale) })}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
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
    year: 'numeric',
  }).format(d);
}

function formatRelative(d: Date, locale: Locale): string {
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const fmt = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', { numeric: 'auto' });
  if (diffMin < 60) return fmt.format(-diffMin, 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return fmt.format(-diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  return fmt.format(-diffDay, 'day');
}

const DISCIPLINE_KEYS_REVERSE: Record<string, string> = {
  WEDDING_PHOTOGRAPHY: 'weddingPhoto',
  PORTRAIT_PHOTOGRAPHY: 'portraitPhoto',
  COMMERCIAL_PHOTOGRAPHY: 'commercialPhoto',
  PRODUCT_PHOTOGRAPHY: 'productPhoto',
  EVENT_PHOTOGRAPHY: 'eventPhoto',
  FASHION_PHOTOGRAPHY: 'fashionPhoto',
  COMMERCIAL_VIDEO: 'commercialVideo',
  WEDDING_VIDEO: 'weddingVideo',
  EVENT_VIDEO: 'eventVideo',
  DOCUMENTARY: 'documentary',
  GRAPHIC_DESIGN: 'graphicDesign',
  BRAND_IDENTITY: 'brandIdentity',
  MOTION_GRAPHICS: 'motionGraphics',
  VIDEO_EDITING: 'videoEditing',
  COLOR_GRADING: 'colorGrading',
  RETOUCHING: 'retouching',
  DRONE_OPERATION: 'drone',
};

function disciplineKey(d: string): string {
  return DISCIPLINE_KEYS_REVERSE[d] ?? 'commercialPhoto';
}
