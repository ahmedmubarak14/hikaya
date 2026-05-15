import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Card } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { formatSarFromHalalas } from '@/lib/format';
import type { Space } from '@/lib/spaces/mock-data';

interface Props {
  space: Space;
  href: string;
  locale: Locale;
}

/**
 * Browse-grid card for the studio marketplace. Tall photo on top, compact
 * meta below. Matches the existing creator/product card density on
 * `/discover` and `/{username}/store`.
 */
export function SpaceCard({ space, href, locale }: Props) {
  const t = useTranslations('spaces.public');
  const tCity = useTranslations('cities');
  const cover = space.photos[0];

  return (
    <Link href={href} className="block">
      <Card interactive className="overflow-hidden">
        <div className="bg-surface/5 relative aspect-[4/3] w-full">
          {cover ? (
            <Image
              src={cover}
              alt={space.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5 p-4">
          <h3 className="text-surface line-clamp-1 text-base">{space.name}</h3>
          <p className="text-2xs text-surface/50">
            {tCity(space.city as 'RIYADH')} · {t('capacity', { count: space.capacity })}
          </p>
          <p className="text-surface mt-1 font-mono text-sm tabular-nums">
            {space.dailyHalalas > 0
              ? t('from', { price: formatSarFromHalalas(space.dailyHalalas, locale) })
              : t('fromHourly', { price: formatSarFromHalalas(space.hourlyHalalas, locale) })}
          </p>
        </div>
      </Card>
    </Link>
  );
}
