import { useLocale, useTranslations } from 'next-intl';

import { Logo } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';

export function SiteFooter() {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;

  return (
    <footer className="mt-26 border-t border-surface/5">
      <div className="mx-auto flex w-full max-w-8xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="flex items-center gap-3 text-surface/80">
          <Logo arabic={locale === 'ar'} className="h-6" />
          <span className="font-mono text-xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
            {t('made')}
          </span>
        </div>
        <p className="text-sm text-surface/40">{t('rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
