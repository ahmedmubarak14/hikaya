'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@hikaya/ui';

import { CreatorCard } from '@/components/creators/creator-card';
import { type Locale } from '@/i18n/config';
import type { CreatorProfile } from '@/lib/creators/mock-data';

interface Props {
  creators: CreatorProfile[];
  locale: Locale;
}

export function FavoriteCreatorGrid({ creators, locale }: Props) {
  const t = useTranslations('favorites');

  if (creators.length === 0) {
    return (
      <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
        <p className="text-surface/70 text-lg">{t('creatorsEmpty')}</p>
        <p className="text-surface/40 mt-2 text-sm">{t('creatorsEmptyHint')}</p>
        <div className="mt-4">
          <Link href={`/${locale}/discover`}>
            <Button size="md" variant="outline">
              {t('discoverCta')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {creators.map((creator) => (
        <li key={creator.id}>
          <CreatorCard creator={creator} />
        </li>
      ))}
    </ul>
  );
}
