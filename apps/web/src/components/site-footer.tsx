import { useLocale, useTranslations } from 'next-intl';

import { Logo } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';

export function SiteFooter() {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;

  return (
    <footer className="mt-26 border-surface/5 border-t">
      <div className="max-w-8xl mx-auto flex w-full flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="text-surface/80 flex items-center gap-3">
          <Logo arabic={locale === 'ar'} className="h-6" />
          <span className="text-surface/40 text-xs">{t('made')}</span>
        </div>
        <p className="text-surface/40 text-sm">{t('rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
