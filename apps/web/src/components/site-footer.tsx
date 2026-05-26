import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { Logo } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';

export function SiteFooter() {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;

  return (
    <footer className="border-surface/10 bg-bg mt-26 border-t">
      <div className="max-w-8xl mx-auto flex w-full flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="flex flex-col gap-3">
          <div className="text-surface/80 flex items-center gap-3">
            <Logo arabic={locale === 'ar'} className="h-6" />
            <span className="text-surface/40 text-xs">{t('made')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/terms`} className="text-surface/40 hover:text-surface/70 text-xs transition-colors">
              {t('terms')}
            </Link>
            <Link href={`/${locale}/privacy`} className="text-surface/40 hover:text-surface/70 text-xs transition-colors">
              {t('privacy')}
            </Link>
            <Link href={`/${locale}/refund`} className="text-surface/40 hover:text-surface/70 text-xs transition-colors">
              {t('refund')}
            </Link>
          </div>
        </div>
        <p className="text-sm text-surface/40">{t('rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}