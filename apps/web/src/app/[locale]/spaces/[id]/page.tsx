import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { BookForm } from '@/components/spaces/book-form';
import { SpaceAvailabilityCalendar } from '@/components/spaces/space-availability-calendar';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { formatSarFromHalalas, formatDate } from '@/lib/format';
import { getSpace, listBookingsForSpace } from '@/lib/spaces/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale; id: string }>;
}

export async function generateStaticParams() {
  const { SEED_SPACES } = await import('@/lib/spaces/mock-data');
  const { locales } = await import('@/i18n/config');
  return locales.flatMap((locale) => SEED_SPACES.map((s) => ({ locale, id: s.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const space = await getSpace(id);
  if (!space) return {};
  const t = await getTranslations({ locale, namespace: 'spaces.detail' });
  return { title: `${space.name} · ${t('book')}` };
}

export default async function SpaceDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const space = await getSpace(id);
  if (!space || space.status !== 'ACTIVE') notFound();

  const t = await getTranslations('spaces.detail');
  const tCity = await getTranslations('cities');

  const session = await getSession();
  const isOwn = session?.user.id === space.ownerId;

  const bookings = await listBookingsForSpace(space.id);
  const upcoming = bookings
    .filter((b) => b.status !== 'CANCELLED' && Date.parse(b.endISO) > Date.now())
    .slice(0, 3);

  const cover = space.photos[0];
  const rest = space.photos.slice(1);

  return (
    <>
      <SiteHeader />
      <main className="py-22 mx-auto w-full max-w-6xl px-6 md:px-10">
        <Link
          href={`/${locale}/spaces`}
          className="text-2xs text-surface/40 hover:text-surface mb-6 inline-block transition-colors"
        >
          ← {t('back')}
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[3fr_2fr]">
          {/* Gallery */}
          <section className="flex flex-col gap-3">
            {cover ? (
              <div className="border-surface/10 bg-surface/5 relative aspect-[4/3] w-full overflow-hidden rounded-xl border">
                <Image
                  src={cover}
                  alt={space.name}
                  fill
                  priority
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            {rest.length > 0 ? (
              <ul className="grid grid-cols-3 gap-3">
                {rest.slice(0, 6).map((url, idx) => (
                  <li key={`${url}-${idx}`}>
                    <div className="border-surface/10 bg-surface/5 relative aspect-square overflow-hidden rounded-md border">
                      <Image
                        src={url}
                        alt={`${space.name} ${idx + 2}`}
                        fill
                        sizes="(min-width: 768px) 20vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* Details */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{tCity(space.city as 'RIYADH')}</Badge>
              <span className="text-2xs text-surface/40">
                {t('capacity')} · {space.capacity}
              </span>
            </div>

            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              {space.name}
            </h1>

            <p className="text-2xs text-surface/50">
              {t('address')}: <span className="text-surface/80">{space.address}</span>
            </p>

            <div className="border-surface/10 bg-surface/[0.03] flex flex-col gap-1 rounded-xl border p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-2xs text-surface/40">{t('hourly')}</span>
                <span className="text-surface font-mono text-base tabular-nums">
                  {space.hourlyHalalas > 0
                    ? formatSarFromHalalas(space.hourlyHalalas, locale)
                    : '—'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-2xs text-surface/40">{t('daily')}</span>
                <span className="text-surface font-mono text-base tabular-nums">
                  {space.dailyHalalas > 0 ? formatSarFromHalalas(space.dailyHalalas, locale) : '—'}
                </span>
              </div>
            </div>

            {space.equipmentIncluded.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-2xs text-surface/40">{t('equipment')}</span>
                <div className="flex flex-wrap gap-2">
                  {space.equipmentIncluded.map((e) => (
                    <Badge key={e} tone="info">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* House rules */}
            {space.houseRules ? (
              <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
                <h3 className="text-surface mb-2 text-base font-semibold">
                  {t('houseRulesTitle')}
                </h3>
                <p className="text-surface/80 whitespace-pre-wrap text-sm">{space.houseRules}</p>
              </div>
            ) : null}

            {/* Add-ons */}
            {space.addOns.length > 0 ? (
              <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
                <h3 className="text-surface mb-2 text-base font-semibold">
                  {t('addOnsTitle')}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {space.addOns.map((addon, idx) => (
                    <li key={idx} className="text-surface/70 flex justify-between text-sm">
                      <span>{addon.name}</span>
                      <span className="font-mono tabular-nums">
                        {addon.priceHalalas > 0
                          ? formatSarFromHalalas(addon.priceHalalas, locale)
                          : t('addOnFree')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <BookForm
              locale={locale}
              spaceId={space.id}
              hourlyHalalas={space.hourlyHalalas}
              dailyHalalas={space.dailyHalalas}
              disabledReason={isOwn ? 'OWN' : null}
              houseRules={space.houseRules}
              addOns={space.addOns}
            />

            <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
              <p className="text-surface/80 whitespace-pre-wrap text-sm">{space.description}</p>
            </div>
          </section>
        </div>

        {/* Availability calendar */}
        <section className="mt-12">
          <h2 className="text-surface mb-4 text-base font-semibold">{t('availabilityTitle')}</h2>
          <SpaceAvailabilityCalendar bookings={bookings} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
