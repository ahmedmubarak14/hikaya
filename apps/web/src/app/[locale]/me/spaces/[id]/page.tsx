import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { SpaceForm } from '@/components/spaces/space-form';
import { SpaceStatusButton } from '@/components/spaces/space-status-button';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getSpace } from '@/lib/spaces/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

// Auth-gated route — generate one placeholder per locale so Next has something
// EXPORT=1, so the placeholder id is never actually used.
export async function generateStaticParams() {
  const { locales } = await import('@/i18n/config');
  const { getSpacesByOwner } = await import('@/lib/spaces/mock-store');
  const items = getSpacesByOwner('u_noor_demo');
  return locales.flatMap((locale) => {
    const real = items.map((item) => ({ locale, id: item.id }));
    // Always include a `_demo` placeholder so Next has a path to render
    // even when no items have been seeded for this entity.
    return real.length > 0 ? real : [{ locale, id: '_demo' }];
  });
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

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/spaces/${id}`);

  const space = await getSpace(id);
  if (!space || space.ownerId !== session.user.id) notFound();

  const t = await getTranslations('spaces.edit');

  return (
    <>
      <main className="py-22 mx-auto w-full max-w-4xl px-6 md:px-10">
        <header className="mb-8 flex flex-col gap-3">
          <Link
            href={`/${locale}/me/spaces`}
            className="text-2xs text-surface/40 hover:text-surface transition-colors"
          >
            ← {t('back')}
          </Link>
          <h1 className="text-balance text-4xl">{t('headline', { name: space.name })}</h1>
        </header>

        {space.status === 'ACTIVE' ? (
          <Card className="border-sage/30 bg-sage/10 mb-6">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="sage" className="self-start">
                  {t('liveLabel')}
                </Badge>
                <p className="text-surface/70 mt-2 text-sm">{t('liveBody')}</p>
              </div>
              <SpaceStatusButton locale={locale} spaceId={space.id} to="PAUSED" variant="outline" />
            </CardBody>
          </Card>
        ) : space.status === 'DRAFT' ? (
          <Card className="mb-6">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="neutral" className="self-start">
                  {t('draftLabel')}
                </Badge>
                <p className="text-surface/70 mt-2 text-sm">{t('draftBody')}</p>
              </div>
              <SpaceStatusButton locale={locale} spaceId={space.id} to="ACTIVE" variant="primary" />
            </CardBody>
          </Card>
        ) : (
          <Card className="border-accent-secondary/30 bg-accent-secondary/5 mb-6">
            <CardBody className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge tone="warning" className="self-start">
                  {t('pausedLabel')}
                </Badge>
                <p className="text-surface/70 mt-2 text-sm">{t('pausedBody')}</p>
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
