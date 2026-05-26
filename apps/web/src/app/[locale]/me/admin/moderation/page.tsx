import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('moderationTitle') };
}

export default async function ModerationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  // Check admin
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

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/admin`}
            className="text-surface/50 hover:text-surface/70 text-sm transition-colors"
          >
            {t('backToAdmin')}
          </Link>
          <Badge tone="accent" className="self-start">{t('moderationEyebrow')}</Badge>
          <h1 className="text-balance text-5xl">{t('moderationTitle')}</h1>
          <p className="text-surface/60 max-w-prose">{t('moderationSubtitle')}</p>
        </header>

        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-surface/60 text-lg">{t('moderationEmpty')}</p>
            <p className="text-surface/40 mt-2 text-sm">{t('moderationEmptyHint')}</p>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
