import Image from 'next/image';

import { cn } from '@hikaya/ui';

import type { PortfolioItem, PortfolioLayout } from '@/lib/creators/mock-data';

interface Props {
  items: PortfolioItem[];
  layout: PortfolioLayout;
  altPrefix: string;
}

/**
 * Three layouts per the PRD. All implemented with CSS only — no JS layout
 * library — so they're cheap, accessible, and degrade fine without JS.
 *
 * - MASONRY: CSS columns, variable heights, the default for varied work.
 * - EDITORIAL: alternating wide / paired tiles, magazine-spread feel.
 * - REEL: horizontal scroll for video showreels.
 */
export function PortfolioGrid({ items, layout, altPrefix }: Props) {
  if (layout === 'EDITORIAL') return <Editorial items={items} altPrefix={altPrefix} />;
  if (layout === 'REEL') return <Reel items={items} altPrefix={altPrefix} />;
  return <Masonry items={items} altPrefix={altPrefix} />;
}

function Masonry({ items, altPrefix }: { items: PortfolioItem[]; altPrefix: string }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {items.map((item, idx) => (
        <PortfolioFigure key={item.id} item={item} altPrefix={altPrefix} index={idx} />
      ))}
    </div>
  );
}

function Editorial({ items, altPrefix }: { items: PortfolioItem[]; altPrefix: string }) {
  // Group every 3 items into "wide + pair" rows.
  const rows: PortfolioItem[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));

  return (
    <div className="flex flex-col gap-6">
      {rows.map((row, rIdx) => {
        const [wide, ...pair] = row;
        if (!wide) return null;
        const reverse = rIdx % 2 === 1;
        return (
          <div key={rIdx} className={cn('grid gap-4 md:grid-cols-3', reverse && 'md:[&>:first-child]:order-2')}>
            <div className="md:col-span-2">
              <PortfolioFigure item={wide} altPrefix={altPrefix} index={rIdx * 3} aspect="aspect-[4/3]" />
            </div>
            <div className="grid gap-4 md:grid-cols-1">
              {pair.map((it, i) => (
                <PortfolioFigure
                  key={it.id}
                  item={it}
                  altPrefix={altPrefix}
                  index={rIdx * 3 + i + 1}
                  aspect="aspect-[4/5]"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Reel({ items, altPrefix }: { items: PortfolioItem[]; altPrefix: string }) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 md:-mx-10 md:px-10">
      <ul className="flex gap-4 pb-2">
        {items.map((item, idx) => (
          <li key={item.id} className="w-[80vw] shrink-0 sm:w-[60vw] md:w-[40vw] lg:w-[30vw]">
            <PortfolioFigure item={item} altPrefix={altPrefix} index={idx} aspect="aspect-video" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PortfolioFigure({
  item,
  altPrefix,
  index,
  aspect,
}: {
  item: PortfolioItem;
  altPrefix: string;
  index: number;
  aspect?: string;
}) {
  return (
    <figure
      className={cn(
        'group relative overflow-hidden rounded-md border border-surface/5 bg-surface/[0.03]',
        aspect,
      )}
      style={!aspect ? { aspectRatio: `${item.width} / ${item.height}` } : undefined}
    >
      <Image
        src={item.url}
        alt={`${altPrefix} — ${item.titleEn ?? `image ${index + 1}`}`}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-cinematic ease-out group-hover:scale-[1.02]"
      />
    </figure>
  );
}
