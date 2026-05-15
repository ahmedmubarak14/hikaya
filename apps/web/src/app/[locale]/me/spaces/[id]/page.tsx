import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { SpaceForm } from '@/components/spaces/space-form';
import { SpaceStatusButton } from '@/components/spaces/space-status-button';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getSpace } from '@/lib/spaces/queries';

import type { Metadata } from 'next';

import { DemoModeNotice } from '@/components/demo-mode-notice';
import { IS_STATIC_EXPORT } from '@/lib/static-export';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — generate one placeholder per locale so Next has something
// to render at export time; the page short-circuits to DemoModeNotice when
// EXPORT=1, so the placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  return locales.map((locale) => ({ locale, id: '_demo' }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const space = await getSpace(id);
  if (!space) return {};
  const t = await getTranslations({ locale, namespace: 'spaces.edit' });
  return { title: `${t('title')} · ${space.name}` };
}

export default async function EditSpacePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/spaces/${id}`);

  const space = await getSpace(id);
  if (!space || space.ownerId !== session.user.id) notFound();

  const t = await getTranslations('spaces.edit');

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 py-22 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/spaces`}
            className="text-2xs text-surface/40 transition-colors hover:text-surface"
          >
            ← {t('back')}
          </Link>
          <h1 className="text-balance text-4xl">{t('headline', { name: space.name })}</h1>
        </header>

        {space.status === 'ACTIVE' ? (
          <Card className="mb-6 border-sage/30 bg-sage/10">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="sage" className="self-start">{t('liveLabel')}</Badge>
                <p className="mt-2 text-sm text-surface/70">{t('liveBody')}</p>
              </div>
              <SpaceStatusButton locale={locale} spaceId={space.id} to="PAUSED" variant="outline" />
            </CardBody>
          </Card>
        ) : space.status === 'DRAFT' ? (
          <Card className="mb-6">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="neutral" className="self-start">{t('draftLabel')}</Badge>
                <p className="mt-2 text-sm text-surface/70">{t('draftBody')}</p>
              </div>
              <SpaceStatusButton locale={locale} spaceId={space.id} to="ACTIVE" variant="primary" />
            </CardBody>
          </Card>
        ) : (
          <Card className="mb-6 border-accent-secondary/30 bg-accent-secondary/5">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="warning" className="self-start">{t('pausedLabel')}</Badge>
                <p className="mt-2 text-sm text-surface/70">{t('pausedBody')}</p>
              </div>
              <SpaceStatusButton locale={locale} spaceId={space.id} to="ACTIVE" variant="primary" />
            </CardBody>
          </Card>
        )}

        <SpaceForm locale={locale} space={space} />
      </main>
    </>
  );
}
