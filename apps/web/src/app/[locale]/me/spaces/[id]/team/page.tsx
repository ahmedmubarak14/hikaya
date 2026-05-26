import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { SpaceTeamManager, type SpaceTeamMember } from '@/components/spaces/space-team-manager';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  return locales.map((locale) => ({ locale, id: '_demo' }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spaces.team' });
  return { title: t('pageTitle') };
}

export default async function SpaceTeamPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/spaces/${id}/team`);

  const t = await getTranslations('spaces.team');
  const supabase = await createClient();

  // Get the space
  const { data: space } = await supabase
    .from('Space')
    .select('id, ownerId, name')
    .eq('id', id)
    .maybeSingle();

  if (!space) notFound();
  if ((space.ownerId as string) !== session.user.id) notFound();

  const isOwner = (space.ownerId as string) === session.user.id;

  // Fetch team members with user info
  const { data: memberRows } = await supabase
    .from('SpaceMember')
    .select('id, userId, isAdmin, joinedAt, User:User ( displayName, email )')
    .eq('spaceId', space.id as string)
    .order('joinedAt', { ascending: true });

  const members: SpaceTeamMember[] = (memberRows ?? []).map((row: Record<string, unknown>) => {
    const user = row.User as { displayName: string; email: string } | null;
    return {
      id: row.id as string,
      userId: row.userId as string,
      displayName: user?.displayName ?? 'Team member',
      email: user?.email ?? '',
      isAdmin: row.isAdmin as boolean,
      joinedAt: row.joinedAt as string,
    };
  });

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
        <Link
          href={`/${locale}/me/spaces/${id}`}
          className="text-2xs text-surface/40 hover:text-surface transition-colors"
        >
          {t('backToSpace')}
        </Link>

        <header className="mb-10 mt-4 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">
            {space.name as string}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t('headline')}
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <SpaceTeamManager locale={locale} spaceId={id} members={members} isOwner={isOwner} />
      </main>
    </>
  );
}
