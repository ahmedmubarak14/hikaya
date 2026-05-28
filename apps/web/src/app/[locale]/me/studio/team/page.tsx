import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { TeamManager, type TeamMember } from '@/components/studio/team-manager';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'studioTeam' });
  return { title: t('pageTitle') };
}

export default async function StudioTeamPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/studio/team`);

  const t = await getTranslations('studioTeam');
  const supabase = await createClient();

  // Get the user's studio
  const { data: studio } = await supabase
    .from('StudioProfile')
    .select('id, userId, nameEn')
    .eq('userId', session.user.id)
    .maybeSingle();

  if (!studio) redirect(`/${locale}/me/studio`);

  const isOwner = (studio.userId as string) === session.user.id;

  // Fetch team members with user info
  const { data: memberRows } = await supabase
    .from('StudioMember')
    .select('id, userId, isAdmin, joinedAt, User:User ( displayName, email )')
    .eq('studioId', studio.id as string)
    .order('joinedAt', { ascending: true });

  const members: TeamMember[] = (memberRows ?? []).map((row: Record<string, unknown>) => {
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
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
        <Link
          href={`/${locale}/me/studio`}
          className="text-2xs text-surface/40 hover:text-surface transition-colors"
        >
          {t('backToStudio')}
        </Link>

        <header className="mb-10 mt-4 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">
            {studio.nameEn as string}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t('headline')}
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        <TeamManager members={members} isOwner={isOwner} />
      </div>
  );
}
