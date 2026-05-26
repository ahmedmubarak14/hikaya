import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { SettingsProfileForm } from '@/components/settings/settings-profile-form';
import { SettingsPasswordForm } from '@/components/settings/settings-password-form';
import { SettingsDataExport } from '@/components/settings/settings-data-export';
import { SettingsDeleteAccount } from '@/components/settings/settings-delete-account';
import { NotificationPreferencesForm } from '@/components/settings/notification-preferences-form';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getNotificationPreferencesAction } from '@/lib/notifications/actions';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });
  return { title: t('title') };
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('settings');

  // Fetch the full User row for the profile form
  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from('User')
    .select('id, email, displayName, avatarUrl, locale')
    .eq('id', session.user.id)
    .single();

  const notificationPrefs = await getNotificationPreferencesAction();

  const user = userRow ?? {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    avatarUrl: null,
    locale: session.user.locale === 'ar' ? 'AR' : 'EN',
  };

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-3xl px-6 md:px-10">
        <Link
          href={`/${locale}/me`}
          className="text-2xs text-surface/40 hover:text-surface transition-colors"
        >
          {t('backToAccount')}
        </Link>

        <header className="mb-10 mt-4 flex flex-col gap-3">
          <Badge tone="accent" className="self-start">
            {t('eyebrow')}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {t('headline')}
          </h1>
          <p className="text-surface/60 max-w-prose">{t('subtitle')}</p>
        </header>

        {/* Profile section */}
        <section className="mb-12">
          <SectionHeader title={t('profileSection')} subtitle={t('profileSectionSubtitle')} />
          <SettingsProfileForm
            locale={locale}
            user={{
              id: user.id as string,
              email: user.email as string,
              displayName: user.displayName as string,
              avatarUrl: (user.avatarUrl as string) ?? '',
              locale: (user.locale as string) === 'AR' ? 'ar' : 'en',
            }}
          />
        </section>

        {/* Password section */}
        <section className="mb-12">
          <SectionHeader title={t('passwordSection')} subtitle={t('passwordSectionSubtitle')} />
          <SettingsPasswordForm locale={locale} />
        </section>

        {/* Notification preferences */}
        <section className="mb-12">
          <SectionHeader
            title={t('notificationsSection')}
            subtitle={t('notificationsSectionSubtitle')}
          />
          <NotificationPreferencesForm initialPrefs={notificationPrefs} />
        </section>

        {/* Danger zone */}
        <section>
          <SectionHeader title={t('dangerZone')} subtitle={t('dangerZoneSubtitle')} />
          <SettingsDataExport />
          <SettingsDeleteAccount locale={locale} />
        </section>
      </main>
    </>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="border-surface/10 mb-6 flex flex-col gap-1.5 border-b pb-4">
      <h2 className="text-surface text-2xl">{title}</h2>
      <p className="text-surface/60 max-w-prose text-sm">{subtitle}</p>
    </header>
  );
}
