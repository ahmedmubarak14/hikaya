import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge, Button, Card, CardBody } from '@hikaya/ui';

import { PortfolioEditor } from '@/components/portfolio/portfolio-editor';
import { ProfileEditForm } from '@/components/portfolio/profile-edit-form';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import type { Metadata } from 'next';

import { IS_STATIC_EXPORT } from '@/lib/static-export';
import { DemoModeNotice } from '@/components/demo-mode-notice';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'portfolioEditor' });
  return { title: t('title') };
}

export default async function MyPortfolioPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (IS_STATIC_EXPORT) return <DemoModeNotice locale={locale} />;

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/portfolio`);

  const t = await getTranslations('portfolioEditor');
  const creator = await getMyCreatorProfile(session.user.email);

  if (!creator) return <NoCreatorProfile locale={locale} />;

  const displayName = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-22 md:px-10">
        <header className="mb-12 flex flex-col gap-3">
          <Link
            href={`/${locale}/me`}
            className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
          >
            ← {t('backToAccount')}
          </Link>
          <Badge tone="accent" className="self-start">
            @{creator.username}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            <span>{t('headline')}</span>{' '}
            <span className="font-bold text-accent-secondary">{t('headlineItalic')}</span>
          </h1>
          <p className="max-w-prose text-surface/60">{t('subtitle')}</p>
          <div className="mt-2">
            <Link
              href={`/${locale}/${creator.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-2xs uppercase tracking-widest text-accent underline decoration-accent decoration-2 underline-offset-4 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
            >
              {t('viewLive', { name: displayName })} ↗
            </Link>
          </div>
        </header>

        {/* Profile section */}
        <section className="mb-16">
          <SectionHeader title={t('sections.profile')} subtitle={t('sections.profileSubtitle')} />
          <ProfileEditForm locale={locale} creator={creator} />
        </section>

        {/* Portfolio section */}
        <section>
          <SectionHeader title={t('sections.portfolio')} subtitle={t('sections.portfolioSubtitle')} />
          <PortfolioEditor
            locale={locale}
            items={creator.portfolio}
            altPrefix={displayName}
          />
        </section>
      </main>
    </>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-6 flex flex-col gap-1.5 border-b border-surface/10 pb-4">
      <h2 className="text-3xl text-surface">{title}</h2>
      <p className="max-w-prose text-sm text-surface/60">{subtitle}</p>
    </header>
  );
}

async function NoCreatorProfile({ locale }: { locale: Locale }) {
  const t = await getTranslations('portfolioEditor');
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-22 md:px-10">
        <Link
          href={`/${locale}/me`}
          className="font-mono text-2xs uppercase tracking-widest text-surface/40 transition-colors hover:text-surface [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case"
        >
          ← {t('backToAccount')}
        </Link>
        <Card className="mt-8">
          <CardBody className="flex flex-col gap-4 p-8">
            <Badge tone="warning" className="self-start">
              {t('noProfile.label')}
            </Badge>
            <h1 className="text-balance text-3xl">{t('noProfile.title')}</h1>
            <p className="text-surface/60">{t('noProfile.body')}</p>
            <p className="text-sm text-surface/50">{t('noProfile.demoHint')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={`/${locale}/discover`}>
                <Button size="md" variant="outline">
                  {t('noProfile.discover')}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
