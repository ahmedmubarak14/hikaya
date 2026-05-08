import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { Card, CardBody } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { CreatorProfile } from '@/lib/creators/mock-data';

import { DisciplineTag } from './discipline-tag';

interface Props {
  creator: CreatorProfile;
}

/**
 * The creator card on /discover. The cover image is the hero — UI chrome stays
 * minimal so the work breathes (per the PRD's editorial tone).
 */
export function CreatorCard({ creator }: Props) {
  const tCity = useTranslations('cities');
  const tCommon = useTranslations('creator');
  const locale = useLocale() as Locale;

  const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
  const bio = locale === 'ar' ? creator.bioAr : creator.bioEn;

  return (
    <Link href={`/${locale}/${creator.username}`} className="group block">
      <Card interactive className="overflow-hidden">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface/5">
          <Image
            src={creator.coverUrl}
            alt={`${name} — cover`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-cinematic ease-out group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-5">
            {creator.disciplines.slice(0, 2).map((d) => (
              <DisciplineTag key={d} discipline={d} tone="accent" />
            ))}
          </div>
        </div>

        <CardBody className="flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-xl text-surface">{name}</h3>
            <span className="shrink-0 font-mono text-2xs uppercase tracking-wider text-surface/50 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
              {tCity(creator.city as 'RIYADH')}
            </span>
          </div>

          <p className="line-clamp-2 text-sm text-surface/60">{bio}</p>

          <div className="mt-1 flex items-center justify-between text-2xs">
            <span className="font-mono text-surface/40 [lang=ar]:font-sansAr">
              ★ {creator.reviewScore.toFixed(1)}
              <span className="ms-1 text-surface/30">({creator.reviewCount})</span>
            </span>
            {creator.startingPriceSar ? (
              <span className="font-mono text-surface/60 [lang=ar]:font-sansAr">
                {tCommon('fromPrice', { price: creator.startingPriceSar.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-SA') })}
              </span>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
