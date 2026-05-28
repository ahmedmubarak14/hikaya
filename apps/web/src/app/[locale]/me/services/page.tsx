import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { ServicesEditor } from '@/components/services/services-editor';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';
import type { CreatorService } from '@/lib/services/types';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  return { title: t('editorTitle') };
}

export default async function MyServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/services`);

  const t = await getTranslations('services');
  const creator = await getMyCreatorProfile(session.user.email);

  if (!creator) return <NoCreatorProfile locale={locale} />;

  // Fetch the services JSONB from the CreatorProfile row
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('CreatorProfile')
    .select('services')
    .eq('id', creator.id)
    .single();

  const services: CreatorService[] = Array.isArray(row?.services)
    ? (row.services as CreatorService[])
    : [];

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
        <Link
          href={`/${locale}/me`}
          className="text-2xs text-surface/40 hover:text-surface transition-colors"
        >
          {t('backToAccount')}
        </Link>

        <header className="mb-10 mt-4 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">
            @{creator.username}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t('editorHeadline')}
          </h1>
          <p className="text-surface/60 max-w-prose">{t('editorSubtitle')}</p>
          <div className="mt-2">
            <Link
              href={`/${locale}/${creator.username}?tab=about`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xs text-accent-secondary decoration-accent-secondary underline decoration-2 underline-offset-4"
            >
              {t('viewLiveProfile')} ↗
            </Link>
          </div>
        </header>

        <ServicesEditor locale={locale} initialServices={services} />
      </div>
  );
}

async function NoCreatorProfile({ locale }: { locale: Locale }) {
  const t = await getTranslations('services');
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
        <Link
          href={`/${locale}/me`}
          className="text-2xs text-surface/40 hover:text-surface transition-colors"
        >
          {t('backToAccount')}
        </Link>
        <Card className="mt-8">
          <CardBody className="flex flex-col gap-4 p-8">
            <Badge tone="warning" className="self-start">
              {t('noProfileLabel')}
            </Badge>
            <h1 className="text-balance text-3xl">{t('noProfileTitle')}</h1>
            <p className="text-surface/60">{t('noProfileBody')}</p>
          </CardBody>
        </Card>
      </div>
  );
}
