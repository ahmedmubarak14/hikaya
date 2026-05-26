import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { StatTile } from '@/components/studio/stat-tile';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getAdminStatsAction, listUsersAction } from '@/lib/admin/actions';
import { getRecentAuditLogs } from '@/lib/audit/log';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('title') };
}

export default async function AdminPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  // Check admin role via DB
  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from('User')
    .select('roles')
    .eq('id', session.user.id)
    .maybeSingle();

  const dbRoles = (userRow?.roles ?? []) as string[];
  const sessionRoles = session.user.roles as string[];
  const allRoles = [...new Set([...dbRoles, ...sessionRoles])];
  const isAdmin = allRoles.includes('ADMIN');

  const t = await getTranslations('admin');

  if (!isAdmin) {
    return (
      <>
        <SiteHeader />
        <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
          <h1 className="text-3xl">{t('accessDenied')}</h1>
          <p className="text-surface/60 mt-2">{t('accessDeniedBody')}</p>
        </main>
      </>
    );
  }

  const stats = await getAdminStatsAction();
  const users = await listUsersAction(q);
  const auditLogs = await getRecentAuditLogs(50);

  const formatSar = (halalas: number) => `SAR ${(halalas / 100).toLocaleString()}`;

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-5xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="text-surface/50 hover:text-surface/70 text-sm transition-colors"
          >
            {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">{t('eyebrow')}</Badge>
          <h1 className="text-balance text-5xl">{t('title')}</h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {/* Stats */}
        {stats && (
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile label={t('stats.totalUsers')} value={String(stats.totalUsers)} />
            <StatTile label={t('stats.totalCreators')} value={String(stats.totalCreators)} />
            <StatTile label={t('stats.totalBookings')} value={String(stats.totalBookings)} />
            <StatTile
              label={t('stats.totalRevenue')}
              value={formatSar(stats.totalRevenueHalalas)}
              tone="accent"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mb-8 flex gap-3">
          <Link
            href={`/${locale}/me/admin/moderation`}
            className="border-surface/15 text-surface/80 hover:border-surface/40 hover:text-surface rounded-full border px-5 py-2 text-sm transition-colors"
          >
            {t('moderationLink')} &rarr;
          </Link>
        </div>

        {/* User list */}
        <section>
          <h2 className="text-surface mb-4 text-2xl font-semibold">{t('usersTitle')}</h2>

          <form method="GET" className="mb-4 flex gap-2">
            <input
              name="q"
              type="search"
              defaultValue={q ?? ''}
              placeholder={t('searchPlaceholder')}
              className="border-surface/15 bg-surface/[0.03] text-surface flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="border-accent/40 bg-accent/10 text-accent-secondary hover:bg-accent/15 rounded-md border px-4 py-2 text-sm transition-colors"
            >
              {t('search')}
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-surface/50 border-surface/10 border-b text-left">
                  <th className="px-3 py-2 font-medium">{t('colName')}</th>
                  <th className="px-3 py-2 font-medium">{t('colEmail')}</th>
                  <th className="px-3 py-2 font-medium">{t('colRoles')}</th>
                  <th className="px-3 py-2 font-medium">{t('colCreated')}</th>
                  <th className="px-3 py-2 font-medium">{t('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-surface/5 border-b">
                    <td className="text-surface px-3 py-3">{user.displayName}</td>
                    <td className="text-surface/70 px-3 py-3">{user.email}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} tone="neutral" className="text-2xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="text-surface/50 px-3 py-3 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      {user.isSuspended ? (
                        <Badge tone="warning">{t('suspended')}</Badge>
                      ) : (
                        <Badge tone="accent">{t('active')}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className="text-surface/40 mt-4 text-center text-sm">{t('noUsers')}</p>
          )}
        </section>

        {/* Audit log */}
        <section className="mt-10">
          <h2 className="text-surface mb-4 text-2xl font-semibold">{t('auditLog.title')}</h2>
          <p className="text-surface/50 mb-4 text-sm">{t('auditLog.subtitle')}</p>

          {auditLogs.length === 0 ? (
            <p className="text-surface/40 text-center text-sm">{t('auditLog.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-surface/50 border-surface/10 border-b text-left">
                    <th className="px-3 py-2 font-medium">{t('auditLog.colAction')}</th>
                    <th className="px-3 py-2 font-medium">{t('auditLog.colUser')}</th>
                    <th className="px-3 py-2 font-medium">{t('auditLog.colEntity')}</th>
                    <th className="px-3 py-2 font-medium">{t('auditLog.colIp')}</th>
                    <th className="px-3 py-2 font-medium">{t('auditLog.colTime')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-surface/5 border-b">
                      <td className="px-3 py-3">
                        <Badge tone="neutral" className="text-2xs">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="text-surface/70 px-3 py-3 text-xs">
                        {log.userId ?? '-'}
                      </td>
                      <td className="text-surface/70 px-3 py-3 text-xs">
                        {log.entityType ? `${log.entityType}:${log.entityId ?? ''}` : '-'}
                      </td>
                      <td className="text-surface/50 px-3 py-3 text-xs">
                        {log.ipAddress ?? '-'}
                      </td>
                      <td className="text-surface/50 px-3 py-3 text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
