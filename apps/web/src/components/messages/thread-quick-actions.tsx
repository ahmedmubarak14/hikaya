'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { type Locale } from '@/i18n/config';

interface Props {
  otherUserEmail?: string;
}

/**
 * Contextual quick-action links displayed near the composer in the thread view.
 * These navigate to relevant pages with pre-filled context where possible.
 */
export function ThreadQuickActions({ otherUserEmail }: Props) {
  const t = useTranslations('messages.quickActions');
  const locale = useLocale() as Locale;

  const quoteHref = otherUserEmail
    ? `/${locale}/me/quotes/new?client=${encodeURIComponent(otherUserEmail)}`
    : `/${locale}/me/quotes/new`;

  return (
    <div className="border-surface/5 flex items-center gap-2 border-b px-4 py-2">
      <span className="text-2xs text-surface/40 mr-1 shrink-0">{t('label')}</span>
      <Link
        href={quoteHref}
        className="text-2xs text-surface/60 hover:text-accent rounded-full border border-surface/10 px-3 py-1 transition-colors hover:border-accent/30"
      >
        {t('sendQuote')}
      </Link>
      <Link
        href={`/${locale}/me/contracts`}
        className="text-2xs text-surface/60 hover:text-accent rounded-full border border-surface/10 px-3 py-1 transition-colors hover:border-accent/30"
      >
        {t('sendContract')}
      </Link>
      <Link
        href={`/${locale}/me/studio`}
        className="text-2xs text-surface/60 hover:text-accent rounded-full border border-surface/10 px-3 py-1 transition-colors hover:border-accent/30"
      >
        {t('createBooking')}
      </Link>
    </div>
  );
}
