import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { StatTile } from '@/components/studio/stat-tile';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
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

  const roleKey: 'roleClient' | 'roleCreator' | 'roleStudioOwner' =
    session.user.currentRole === 'CREATOR'
      ? 'roleCreator'
      : session.user.currentRole === 'STUDIO_OWNER'
        ? 'roleStudioOwner'
        : 'roleClient';

  // Fetch dashboard data in parallel
  const [stats, recentThreads, upcomingSessions] = await Promise.all([
    getDashboardStats(session.user.id),
    getRecentThreads(session.user.id, 3),
    getUpcomingSessions(session.user.id, 3),
  ]);

  const fmtNum = (n: number): string =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA').format(n);

  const profileUrl = session.user.username ? `/${locale}/${session.user.username}` : null;

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-6xl px-6 md:px-10">
        {/* ---- Welcome banner ---- */}
        <header className="border-surface/10 bg-surface/[0.03] mb-8 flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            {session.user.avatarUrl ? (
              <Image
                src={session.user.avatarUrl}
                alt={session.user.displayName}
                width={56}
                height={56}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="bg-accent/10 text-accent-secondary flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold">
                {session.user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-surface text-2xl font-bold tracking-tight sm:text-3xl">
                {t('greeting', { name: session.user.displayName })}
              </h1>
              <div className="flex items-center gap-2">
                <Badge tone="accent">{tAuth(roleKey)}</Badge>
                <span className="text-surface/40 text-sm">{session.user.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/me/portfolio`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-lg border px-4 py-2 text-sm transition-colors"
            >
              {t('editProfile')}
            </Link>
            {profileUrl && (
              <Link
                href={profileUrl}
                className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-lg border px-4 py-2 text-sm transition-colors"
              >
                {t('viewPublicProfile')}
              </Link>
            )}
            <Link
              href={`/${locale}/me/settings`}
              className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-lg border px-4 py-2 text-sm transition-colors"
            >
              {t('settingsLink')}
            </Link>
          </div>
        </header>

        {/* ---- Stats row ---- */}
        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label={t('stats.profileViews')}
            value={fmtNum(stats.profileViews)}
          />
          <StatTile
            label={t('stats.activeBookings')}
            value={fmtNum(stats.activeBookings)}
            tone="accent"
          />
          <StatTile
            label={t('stats.unreadMessages')}
            value={fmtNum(stats.unreadMessages)}
          />
          <StatTile
            label={t('stats.revenueThisMonth')}
            value={formatSarFromHalalas(stats.revenueThisMonthHalalas, locale)}
            tone="accent"
          />
        </section>

        {/* ---- Recent activity ---- */}
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent messages */}
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-surface text-lg font-semibold">{t('activity.recentMessages')}</h2>
              <Link
                href={`/${locale}/me/messages`}
                className="text-accent-secondary text-sm hover:underline"
              >
                {t('activity.viewAll')} →
              </Link>
            </div>

            {recentThreads.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-surface/50 text-sm">{t('activity.noMessages')}</p>
                <p className="text-surface/30 mt-1 text-xs">{t('activity.noMessagesHint')}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {recentThreads.map((thread) => (
                  <li key={thread.id}>
                    <Link
                      href={`/${locale}/me/messages/${thread.id}`}
                      className="border-surface/10 hover:border-surface/20 flex items-center gap-3 rounded-lg border p-3 transition-colors"
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
                        <div className="bg-surface/10 text-surface/50 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                          {thread.otherName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-surface text-sm font-medium">{thread.otherName}</span>
                        <span className="text-surface/40 truncate text-xs">
                          {thread.lastMessageBody || '...'}
                        </span>
                      </div>
                      {thread.lastMessageAt && (
                        <span className="text-surface/30 shrink-0 text-xs">
                          {formatTimeAgo(thread.lastMessageAt, locale)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming sessions */}
          <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-surface text-lg font-semibold">{t('activity.upcomingSessions')}</h2>
              <Link
                href={`/${locale}/me/studio`}
                className="text-accent-secondary text-sm hover:underline"
              >
                {t('activity.viewAll')} →
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-surface/50 text-sm">{t('activity.noSessions')}</p>
                <p className="text-surface/30 mt-1 text-xs">{t('activity.noSessionsHint')}</p>
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
                      <div className="border-surface/10 flex items-center justify-between rounded-lg border p-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-surface text-sm font-medium">{s.clientName}</span>
                          <span className="text-surface/40 text-xs">
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

        {/* ---- Quick navigation grid ---- */}
        <section className="mb-8">
          {/* Create */}
          <h3 className="text-surface/40 mb-3 text-xs font-semibold uppercase tracking-wider">
            {t('nav.create')}
          </h3>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <NavCard href={`/${locale}/me/portfolio`} title={t('links.portfolio')} hint={t('links.portfolioHint')} icon="palette" />
            <NavCard href={`/${locale}/me/blog`} title={t('links.blog')} hint={t('links.blogHint')} icon="edit" />
            <NavCard href={`/${locale}/me/store`} title={t('links.store')} hint={t('links.storeHint')} icon="store" />
            <NavCard href={`/${locale}/me/galleries`} title={t('links.galleries')} hint={t('links.galleriesHint')} icon="image" />
          </div>

          {/* Business */}
          <h3 className="text-surface/40 mb-3 text-xs font-semibold uppercase tracking-wider">
            {t('nav.business')}
          </h3>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <NavCard href={`/${locale}/me/quotes`} title={t('links.quotes')} hint={t('links.quotesHint')} icon="receipt" />
            <NavCard href={`/${locale}/me/contracts`} title={t('links.contracts')} hint={t('links.contractsHint')} icon="file-text" />
            <NavCard href={`/${locale}/me/jobs`} title={t('links.jobs')} hint={t('links.jobsHint')} icon="briefcase" />
            <NavCard href={`/${locale}/me/studio`} title={t('links.studio')} hint={t('links.studioHint')} icon="building" />
            <NavCard href={`/${locale}/me/services`} title={t('links.services')} hint={t('links.servicesHint')} icon="layers" />
            <NavCard href={`/${locale}/me/inquiries`} title={t('links.inquiries')} hint={t('links.inquiriesHint')} icon="inbox" />
            <NavCard href={`/${locale}/me/templates`} title={t('links.templates')} hint={t('links.templatesHint')} icon="copy" />
            <NavCard href={`/${locale}/me/spaces`} title={t('links.spaces')} hint={t('links.spacesHint')} icon="home" />
          </div>

          {/* Account */}
          <h3 className="text-surface/40 mb-3 text-xs font-semibold uppercase tracking-wider">
            {t('nav.account')}
          </h3>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <NavCard href={`/${locale}/me/settings`} title={t('links.settings')} hint={t('links.settingsHint')} icon="settings" />
            <NavCard href={`/${locale}/me/analytics`} title={t('links.analytics')} hint={t('links.analyticsHint')} icon="bar-chart" />
            <NavCard href={`/${locale}/me/favorites`} title={t('links.favorites')} hint={t('links.favoritesHint')} icon="heart" />
            <NavCard href={`/${locale}/me/disputes`} title={t('links.disputes')} hint={t('links.disputesHint')} icon="shield" />
            <NavCard href={`/${locale}/me/availability`} title={t('links.availability')} hint={t('links.availabilityHint')} icon="calendar" />
            <NavCard href={`/${locale}/me/discounts`} title={t('links.discounts')} hint={t('links.discountsHint')} icon="tag" />
            <NavCard href={`/${locale}/me/purchases`} title={t('links.purchases')} hint={t('links.purchasesHint')} icon="shopping-bag" />
          </div>
        </section>

        {/* ---- Sign out (small text link at bottom) ---- */}
        <footer className="border-surface/5 flex justify-end border-t pt-6 pb-4">
          <SignOutButton locale={locale} />
        </footer>
      </main>
    </>
  );
}

/* ---------- Nav card component ---------- */

const ICON_MAP: Record<string, string> = {
  palette: '\u{1F3A8}',
  edit: '\u{270F}\u{FE0F}',
  store: '\u{1F6D2}',
  image: '\u{1F5BC}\u{FE0F}',
  receipt: '\u{1F9FE}',
  'file-text': '\u{1F4C4}',
  briefcase: '\u{1F4BC}',
  building: '\u{1F3E2}',
  settings: '\u{2699}\u{FE0F}',
  'bar-chart': '\u{1F4CA}',
  heart: '\u{2764}\u{FE0F}',
  shield: '\u{1F6E1}\u{FE0F}',
  calendar: '\u{1F4C5}',
  tag: '\u{1F3F7}\u{FE0F}',
  'shopping-bag': '\u{1F6CD}\u{FE0F}',
  layers: '\u{1F4DA}',
  inbox: '\u{1F4E5}',
  copy: '\u{1F4CB}',
  home: '\u{1F3E0}',
};

function NavCard({
  href,
  title,
  hint,
  icon,
}: {
  href: string;
  title: string;
  hint: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="border-surface/10 bg-surface/[0.03] hover:border-surface/20 hover:bg-surface/[0.06] group flex flex-col gap-2 rounded-xl border p-4 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-lg" role="img" aria-hidden="true">
          {ICON_MAP[icon] ?? ''}
        </span>
        <span className="text-surface/20 group-hover:text-surface/40 text-sm transition-colors">
          →
        </span>
      </div>
      <span className="text-surface text-sm font-medium">{title}</span>
      <span className="text-surface/40 text-xs leading-relaxed">{hint}</span>
    </Link>
  );
}

/* ---------- Helpers ---------- */

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
