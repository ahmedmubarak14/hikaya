import { useLocale, useTranslations } from 'next-intl';

import { Logo } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';

export function SiteFooter() {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;

  return (
    <footer className="border-t border-surface/10 bg-bg">
      <div className="max-w-8xl mx-auto flex w-full flex-col gap-8 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="text-surface flex flex-col gap-3">
          <Logo arabic={locale === 'ar'} className="h-7" />
          <span className="max-w-sm text-sm leading-6 text-surface/50">{t('made')}</span>
        </div>
        <p className="text-sm text-surface/40">{t('rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
