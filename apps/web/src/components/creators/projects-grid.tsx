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
      <div className="from-surface/[0.02] via-surface/[0.05] to-surface/[0.02] relative mt-6 overflow-hidden rounded-2xl border border-surface/10 bg-gradient-to-br px-8 py-14 text-center">
        <div className="pointer-events-none absolute -top-16 -end-16 h-48 w-48 rounded-full bg-accent/[0.04]" />
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface/[0.06] text-2xl">
          {'\u{1F3A8}'}
        </div>
        <p className="text-surface text-xl font-semibold tracking-tight">{emptyLabel}</p>
        <p className="text-surface/55 mx-auto mt-3 max-w-md text-sm leading-relaxed">
          {t('emptySubtitle')}
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {tiles.map(({ item, creator }, i) => {
        const name = locale === 'ar' ? creator.displayNameAr : creator.displayNameEn;
        const title =
          (locale === 'ar' ? item.titleAr : item.titleEn) ?? t('projectFallback', { name });
        return (
          <li key={`${creator.id}-${item.id}-${i}`}>
            <Link
              href={`/${locale}/${creator.username}`}
              className="bg-surface/5 group relative block aspect-square w-full overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5"
            >
              <Image
                src={item.url}
                alt={title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="duration-cinematic object-cover transition-transform ease-out group-hover:scale-[1.02]"
              />

              {/* Creator chip — top leading */}
              <div className="bg-bg/60 ring-surface/10 absolute start-2 top-2 z-10 inline-flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full py-1 pe-3 ps-1 text-xs ring-1 backdrop-blur-sm">
                <span className="bg-surface/10 relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={creator.avatarUrl}
                    alt=""
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </span>
                <span className="text-surface truncate font-medium">{name}</span>
              </div>

              {/* Title — bottom, fades in on hover */}
              <div className="from-ink/70 via-ink/30 duration-cinematic pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-bg line-clamp-2 text-xs font-medium">{title}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
