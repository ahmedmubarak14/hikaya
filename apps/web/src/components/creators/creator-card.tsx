import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { type Locale } from '@/i18n/config';
import type { CreatorProfile } from '@/lib/creators/mock-data';

import { DisciplineTag } from './discipline-tag';

interface Props {
  creator: CreatorProfile;
}

/**
 * Creator card on /discover. Photo-first, no dark gradient overlay — the
 * disciplines + meta live below the image so the work breathes uncovered.
 */
export function CreatorCard({ creator }: Props) {
  const tCity = useTranslations('cities');
  const tCommon = useTranslations('creator');
  const locale = useLocale() as Locale;

  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
  const bio = locale === 'ar' ? creator.bioAr : creator.bioEn;

  return (
    <Link href={`/${locale}/${creator.username}`} className="group flex flex-col gap-3">
      <div className="bg-surface/5 relative aspect-[4/5] w-full overflow-hidden rounded-xl">
        <Image
          src={creator.coverUrl}
          alt={`${name} — cover`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-base font-semibold underline-offset-2 group-hover:underline">
            {name}
          </h3>
          <span className="text-surface/50 shrink-0 text-xs">
            {tCity(creator.city as 'RIYADH')}
          </span>
        </div>

        <p className="text-surface/60 line-clamp-2 text-sm">{bio}</p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {(creator.disciplines ?? []).slice(0, 2).map((d) => (
            <DisciplineTag key={d} discipline={d} tone="neutral" />
          ))}
        </div>

        <div className="text-surface/60 mt-2 flex items-center justify-between text-xs">
          <span>
            <span className="text-accent-secondary">★</span> {creator.reviewScore.toFixed(1)}
            <span className="text-surface/40 ms-1">({creator.reviewCount})</span>
          </span>
          {creator.startingPriceSar ? (
            <span>
              {tCommon('fromPrice', {
                price: creator.startingPriceSar.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA'),
              })}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
