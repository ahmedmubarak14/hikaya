import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button } from '@hikaya/ui';

import { StatTile } from '@/components/studio/stat-tile';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import {
  getDashboardStats,
  getRecentThreads,
  getUpcomingSessions,
} from '@/lib/dashboard/queries';
import { formatSarFromHalalas } from '@/lib/format';

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
  const tDisciplines = await getTranslations('disciplines');

  const creatorProfile = await getMyCreatorProfile(session.user.email);
  const showOnboarding = !creatorProfile;

  const roleKey: 'roleClient' | 'roleCreator' | 'roleStudioOwner' =
    session.user.currentRole === 'CREATOR'
      ? 'roleCreator'
      : session.user.currentRole === 'STUDIO_OWNER'
        ? 'roleStudioOwner'
        : 'roleClient';

  const [stats, recentThreads, upcomingSessions] = await Promise.all([
    getDashboardStats(session.user.id),
    getRecentThreads(session.user.id, 3),
    getUpcomingSessions(session.user.id, 3),
  ]);

  const fmtNum = (n: number): string =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA').format(n);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-surface text-3xl font-semibold tracking-tight">
            {t('greeting', { name: session.user.displayName })}
          </h1>
          <Badge tone="accent">{tAuth(roleKey)}</Badge>
        </div>
        <p className="text-muted text-sm">{session.user.email}</p>
      </header>

      {showOnboarding ? (
        <div className="border-accent/30 bg-accent/[0.06] mb-8 flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-surface text-base font-semibold">{t('onboarding.title')}</h2>
            <p className="text-muted text-sm">{t('onboarding.body')}</p>
          </div>
          <Link href={`/${locale}/me/portfolio`} className="shrink-0">
            <Button size="md" variant="primary">
              {t('onboarding.cta')}
            </Button>
          </Link>
        </div>
      ) : null}

      <section className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t('stats.profileViews')} value={fmtNum(stats.profileViews)} />
        <StatTile
          label={t('stats.activeBookings')}
          value={fmtNum(stats.activeBookings)}
          tone="accent"
        />
        <StatTile label={t('stats.unreadMessages')} value={fmtNum(stats.unreadMessages)} />
        <StatTile
          label={t('stats.revenueThisMonth')}
          value={formatSarFromHalalas(stats.revenueThisMonthHalalas, locale)}
          tone="accent"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-line/60 rounded-xl border bg-bg/40 p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-surface text-base font-semibold">{t('activity.recentMessages')}</h2>
            <Link
              href={`/${locale}/me/messages`}
              className="text-accent text-sm hover:underline"
            >
              {t('activity.viewAll')} →
            </Link>
          </div>

          {recentThreads.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted text-sm">{t('activity.noMessages')}</p>
              <p className="text-muted/70 mt-1 text-xs">{t('activity.noMessagesHint')}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentThreads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/${locale}/me/messages/${thread.id}`}
                    className="border-line/60 hover:border-surface/20 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                  >
                    {thread.otherAvatarUrl ? (
                      <Image
                        src={thread.otherAvatarUrl}
                        alt={thread.otherName}
                        width={36}
                        height={36}
                        className="shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-surface/10 text-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                        {thread.otherName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-surface text-sm font-medium">{thread.otherName}</span>
                      <span className="text-muted truncate text-xs">
                        {thread.lastMessageBody || '...'}
                      </span>
                    </div>
                    {thread.lastMessageAt ? (
                      <span className="text-muted/70 shrink-0 text-xs">
                        {formatTimeAgo(thread.lastMessageAt, locale)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-line/60 rounded-xl border bg-bg/40 p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-surface text-base font-semibold">
              {t('activity.upcomingSessions')}
            </h2>
            <Link
              href={`/${locale}/me/studio`}
              className="text-accent text-sm hover:underline"
            >
              {t('activity.viewAll')} →
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted text-sm">{t('activity.noSessions')}</p>
              <p className="text-muted/70 mt-1 text-xs">{t('activity.noSessionsHint')}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcomingSessions.map((s) => {
                const d = new Date(s.sessionStart);
                const dateStr = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(d);

                return (
                  <li key={s.id}>
                    <div className="border-line/60 flex items-center justify-between rounded-lg border p-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-surface text-sm font-medium">{s.clientName}</span>
                        <span className="text-muted text-xs">
                          {dateStr} · {tDisciplines(disciplineKey(s.discipline) as 'weddingPhoto')}
                        </span>
                      </div>
                      <Badge
                        tone={
                          s.status === 'CONFIRMED'
                            ? 'sage'
                            : s.status === 'IN_PROGRESS'
                              ? 'accent'
                              : 'neutral'
                        }
                      >
                        {s.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function formatTimeAgo(isoDate: string, locale: Locale): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMinutes = Math.round((now - then) / 60000);

  if (diffMinutes < 1) return locale === 'ar' ? 'الآن' : 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate));
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
