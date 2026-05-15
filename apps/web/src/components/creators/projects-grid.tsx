import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/config';
import type { CreatorProfile, PortfolioItem } from '@/lib/creators/mock-data';

interface Props {
  locale: Locale;
  creators: CreatorProfile[];
  emptyLabel: string;
}

interface ProjectTile {
  item: PortfolioItem;
  creator: CreatorProfile;
}

/**
 * Contra-style "every project from every creator" grid. Each tile is the work
 * image at aspect-square, with a translucent creator chip pinned to the
 * top-leading corner. Hovering lifts the tile and reveals the project title at
 * the bottom. Clicking takes you to the creator's profile.
 */
export async function ProjectsGrid({ locale, creators, emptyLabel }: Props) {
  const t = await getTranslations('discover');

  const tiles: ProjectTile[] = creators.flatMap((c) =>
    c.portfolio.map((item) => ({ item, creator: c })),
  );

  if (tiles.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-surface/10 bg-surface/[0.03] p-10 text-center">
        <p className="text-lg text-surface/70">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {tiles.map(({ item, creator }, i) => {
        const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
        const title =
          (locale === 'ar' ? item.titleAr : item.titleEn) ??
          t('projectFallback', { name });
        return (
          <li key={`${creator.id}-${item.id}-${i}`}>
            <Link
              href={`/${locale}/${creator.username}`}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-surface/5 transition-transform hover:-translate-y-0.5"
            >
              <Image
                src={item.url}
                alt={title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-cinematic ease-out group-hover:scale-[1.02]"
              />

              {/* Creator chip — top leading */}
              <div className="absolute start-2 top-2 z-10 inline-flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-bg/60 py-1 pe-3 ps-1 text-xs backdrop-blur-sm ring-1 ring-surface/10">
                <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface/10">
                  <Image
                    src={creator.avatarUrl}
                    alt=""
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </span>
                <span className="truncate font-medium text-surface">{name}</span>
              </div>

              {/* Title — bottom, fades in on hover */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent p-3 opacity-0 transition-opacity duration-cinematic group-hover:opacity-100">
                <span className="line-clamp-2 text-xs font-medium text-bg">{title}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
