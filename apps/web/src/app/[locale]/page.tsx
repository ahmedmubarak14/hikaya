import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Button } from '@hikaya/ui';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';
import { listFeaturedCreators } from '@/lib/creators/queries';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const featured = (await listFeaturedCreators(3)).slice(0, 3);
  const isArabic = locale === 'ar';
  const heroImage = '/landing-assets/hikaya-hero-collage.png';
  const creatorCrops = ['25% 45%', '58% 28%', '78% 62%'];

  const copy = getLandingCopy(locale);

  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden bg-bg text-surface">
        <section className="relative border-b border-surface/10">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(244,241,234,0.96),rgba(244,241,234,0.72)_62%,rgba(244,241,234,1))]" />
          <div className="max-w-8xl mx-auto grid min-h-[calc(100svh-4.5rem)] w-full items-center gap-8 px-5 py-8 md:px-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(480px,1.12fr)] lg:gap-12">
            <div className="flex max-w-3xl flex-col">
              <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-surface/10 bg-bg/70 px-3 py-1.5 text-xs font-medium text-surface/65 shadow-sm shadow-ink/5 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />
                {copy.eyebrow}
              </div>

              <h1 className="text-balance text-5xl font-bold leading-[0.9] tracking-tight sm:text-6xl lg:text-7xl">
                {copy.heroTitle}{' '}
                <span
                  className={
                    isArabic
                      ? 'font-bold text-[var(--accent-secondary)]'
                      : 'font-display font-normal italic text-[var(--accent-secondary)]'
                  }
                >
                  {copy.heroAccent}
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-balance text-base leading-7 text-surface/68 md:text-lg">
                {copy.heroBody}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={`/${locale}/discover`}>
                  <Button size="lg" variant="primary">
                    {t('ctaSecondary')}
                  </Button>
                </Link>
                <Link href={`/${locale}/sign-up`}>
                  <Button size="lg" variant="outline">
                    {t('ctaPrimary')}
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-3 divide-x divide-surface/10 overflow-hidden rounded-2xl border border-surface/10 bg-bg/72 shadow-sm shadow-ink/5 backdrop-blur rtl:divide-x-reverse">
                {copy.metrics.map((metric) => (
                  <div key={metric.label} className="px-4 py-4">
                    <p className="text-2xl font-bold tracking-tight md:text-3xl">{metric.value}</p>
                    <p className="mt-1 text-xs leading-4 tracking-normal text-surface/52">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[560px] lg:min-h-[650px]">
              <div className="absolute inset-x-0 top-0 h-[64%] overflow-hidden rounded-[1.25rem] bg-surface shadow-[0_34px_90px_rgba(21,20,18,0.16)]">
                <Image
                  src={heroImage}
                  alt={copy.heroImageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 52vw, 95vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/62 via-ink/8 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-paper">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-paper/58">
                      {copy.featuredBriefKicker}
                    </p>
                    <p className="mt-1 max-w-xs text-xl font-semibold tracking-tight">
                      {copy.featuredBriefTitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-bg px-3 py-1.5 text-xs font-semibold text-surface">
                    {copy.featuredBriefMeta}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-0 end-0 w-[92%] rounded-[1.25rem] border border-surface/10 bg-bg/94 p-3 shadow-[0_28px_90px_rgba(21,20,18,0.18)] backdrop-blur md:w-[82%]">
                <div className="rounded-[1rem] border border-surface/10 bg-paper p-4">
                  <div className="flex items-start justify-between gap-4 border-b border-surface/10 pb-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-surface/45">
                        {copy.commandKicker}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold tracking-tight">
                        {copy.commandTitle}
                      </h2>
                    </div>
                    <span className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]">
                      {copy.commandStatus}
                    </span>
                  </div>

                  <div className="divide-y divide-surface/10">
                    {copy.commandRows.map((row) => (
                      <div key={row.title} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                        <div className="min-w-0">
                          <p className="text-xs text-surface/45">{row.label}</p>
                          <p className="mt-1 truncate text-sm font-medium">{row.title}</p>
                        </div>
                        <p className="self-center rounded-full bg-surface/[0.045] px-3 py-1.5 text-sm font-semibold">
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {copy.pipeline.map((item) => (
                      <div key={item.label} className="rounded-xl bg-surface/[0.045] p-3">
                        <p className="text-lg font-bold leading-none">{item.value}</p>
                        <p className="mt-2 text-xs leading-4 text-surface/50">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-surface/10 bg-paper/45">
          <div className="max-w-8xl mx-auto grid w-full gap-px px-5 py-5 md:grid-cols-4 md:px-10">
            {copy.entryPoints.map((entry) => (
              <Link
                key={entry.title}
                href={`/${locale}${entry.href}`}
                className="group flex min-h-44 flex-col justify-between border border-surface/10 bg-bg p-5 transition-colors hover:bg-paper"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-surface/40">
                    {entry.kicker}
                  </span>
                  <span className="text-lg text-surface/35 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                    {isArabic ? '←' : '→'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{entry.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-surface/58">{entry.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-8xl mx-auto grid w-full gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[0.84fr_1.16fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-surface/45">
              {copy.productKicker}
            </p>
            <h2 className="mt-3 max-w-xl text-balance text-4xl font-bold leading-none tracking-tight md:text-6xl">
              {copy.productTitle}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-surface/62">
              {copy.productBody}
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.25rem] bg-surface p-4 text-bg shadow-[0_28px_80px_rgba(21,20,18,0.15)]">
              <div className="grid gap-3 rounded-[1rem] border border-bg/10 bg-bg/[0.035] p-3 md:grid-cols-[1fr_0.9fr]">
                <div className="rounded-xl bg-bg p-4 text-surface">
                  <div className="flex items-center justify-between border-b border-surface/10 pb-4">
                    <div>
                      <p className="text-xs text-surface/45">{copy.inboxLabel}</p>
                      <h3 className="mt-1 text-lg font-semibold">{copy.inboxTitle}</h3>
                    </div>
                    <span className="rounded-full bg-[var(--accent-secondary)] px-3 py-1 text-xs font-semibold text-paper">
                      {copy.inboxMeta}
                    </span>
                  </div>
                  <div className="space-y-3 pt-4">
                    {copy.inboxRows.map((row) => (
                      <div key={row.title} className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-full bg-surface/[0.06]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{row.title}</p>
                          <p className="truncate text-xs text-surface/48">{row.body}</p>
                        </div>
                        <span className="text-xs text-surface/42">{row.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-xl bg-bg p-4 text-surface">
                    <p className="text-xs text-surface/45">{copy.quoteLabel}</p>
                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-3xl font-bold tracking-tight">{copy.quoteValue}</p>
                        <p className="mt-1 text-xs text-surface/45">{copy.quoteCaption}</p>
                      </div>
                      <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">
                        {copy.quoteStatus}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-bg p-4 text-surface">
                    <p className="text-xs text-surface/45">{copy.deliveryLabel}</p>
                    <div className="mt-4 grid grid-cols-5 gap-1.5">
                      {Array.from({ length: 10 }).map((_, index) => (
                        <span
                          key={index}
                          className="aspect-square rounded-md bg-surface/[0.055]"
                          aria-hidden
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm font-medium">{copy.deliveryTitle}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {copy.productCards.map((card) => (
                <div key={card.title} className="border border-surface/10 bg-paper p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-surface/40">
                    {card.kicker}
                  </p>
                  <h3 className="mt-8 text-lg font-semibold tracking-tight">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-surface/58">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface text-bg">
          <div className="max-w-8xl mx-auto w-full px-5 py-16 md:px-10 md:py-24">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-bg/45">
                  {copy.creatorsKicker}
                </p>
                <h2 className="mt-3 max-w-2xl text-balance text-4xl font-bold leading-none tracking-tight md:text-6xl">
                  {featured.length > 0 ? t('featured.title') : t('featured.emptyTitle')}
                </h2>
              </div>
              {featured.length > 0 ? (
                <Link
                  href={`/${locale}/discover`}
                  className="w-fit rounded-full border border-bg/18 px-4 py-2 text-sm text-bg/72 transition-colors hover:border-bg/45 hover:text-bg"
                >
                  {t('featured.viewAll')}
                </Link>
              ) : null}
            </div>

            {featured.length > 0 ? (
              <ul className="grid gap-4 md:grid-cols-3">
                {featured.map((creator, index) => {
                  const name = isArabic ? creator.displayNameAr : creator.displayNameEn;
                  const bio = isArabic ? creator.bioAr : creator.bioEn;

                  return (
                    <li key={creator.id}>
                      <Link
                        href={`/${locale}/${creator.username}`}
                        className="group block overflow-hidden rounded-[1.25rem] bg-bg text-surface"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-bg">
                          <Image
                            src={heroImage}
                            alt={`${name} portfolio preview`}
                            fill
                            sizes="(min-width: 1024px) 33vw, 95vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            style={{ objectPosition: creatorCrops[index % creatorCrops.length] }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/8 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-5 text-paper">
                            <div className="flex items-end justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="truncate text-xl font-semibold tracking-tight">
                                  {name}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-sm leading-5 text-paper/72">
                                  {bio}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-surface">
                                {creator.reviewScore.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-[1.25rem] border border-bg/12 bg-bg/[0.06] px-8 py-16 text-center">
                <p className="mx-auto max-w-lg text-base leading-7 text-bg/65">
                  {t('featured.emptyBody')}
                </p>
                <div className="mt-8">
                  <Link href={`/${locale}/sign-up`}>
                    <Button size="lg" variant="primary">
                      {t('featured.emptyCta')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="max-w-8xl mx-auto grid w-full gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-surface/45">
              {copy.systemKicker}
            </p>
            <h2 className="mt-3 max-w-xl text-balance text-4xl font-bold leading-none tracking-tight md:text-6xl">
              {copy.systemTitle}
            </h2>
          </div>
          <div className="grid gap-3">
            {copy.systemRows.map((row, index) => (
              <div key={row.title} className="grid gap-4 border-t border-surface/10 py-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                <span className="text-sm font-semibold tabular-nums text-surface/34">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{row.title}</h3>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-surface/58">{row.body}</p>
                </div>
                <span className="w-fit rounded-full border border-surface/10 px-3 py-1.5 text-xs font-medium text-surface/52">
                  {row.meta}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 pb-16 md:px-10 md:pb-24">
          <div className="max-w-8xl mx-auto grid overflow-hidden rounded-[1.25rem] bg-surface text-bg lg:grid-cols-[1.06fr_0.94fr]">
            <div className="p-6 md:p-10 lg:p-12">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-bg/45">
                {copy.finalKicker}
              </p>
              <h2 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-none tracking-tight md:text-6xl">
                {t('ctaStrip.title')}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-bg/65 md:text-lg">
                {t('ctaStrip.body')}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/${locale}/sign-up`}>
                  <Button size="lg" variant="primary">
                    {t('ctaPrimary')}
                  </Button>
                </Link>
                <Link href={`/${locale}/jobs`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-bg/24 text-bg hover:border-bg/50 hover:bg-bg/10"
                  >
                    {t('ctaStrip.browseJobs')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative min-h-80">
              <Image
                src={heroImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 44vw, 95vw"
                className="object-cover"
                style={{ objectPosition: '68% 46%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-surface/35 to-transparent rtl:bg-gradient-to-l" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function getLandingCopy(locale: Locale) {
  if (locale === 'ar') {
    return {
      eyebrow: 'سوق ومساحة شغل للمبدعين في الخليج',
      heroTitle: 'حكاية تخلي الشغل الإبداعي',
      heroAccent: 'أهدأ، أرقى، وينحجز أسرع.',
      heroBody:
        'شوف المبدعين، احجز استوديو، انشر فرصة، وسلّم مشروعك من مساحة واحدة مصممة للشغل البصري في الخليج.',
      heroImageAlt: 'واجهة حكاية تعرض أعمال مبدعين ولوحة ترتيب المشاريع',
      metrics: [
        { value: '6', label: 'مدن نشطة' },
        { value: '4.9', label: 'تقييم المبدعين' },
        { value: '48h', label: 'وقت رد واضح' },
      ],
      featuredBriefKicker: 'فرصة مختارة',
      featuredBriefTitle: 'حملة عطر تحتاج تصوير، موشن، واتجاه فني',
      featuredBriefMeta: 'الرياض',
      commandKicker: 'مساحة الشغل',
      commandTitle: 'كل مشروع مرتب من أول رسالة',
      commandStatus: 'شغال',
      commandRows: [
        { label: 'طلب جديد', title: 'تصوير حملة عطرية', value: '48 ساعة' },
        { label: 'عرض سعر', title: 'يوم إنتاج كامل مع معرض تسليم', value: '12,800 ر.س' },
        { label: 'تسليم', title: 'معرض عميل محمي برقم سري', value: '124 ملف' },
      ],
      pipeline: [
        { value: '18', label: 'محادثات شغالة' },
        { value: '7', label: 'عروض قيد المراجعة' },
        { value: '3', label: 'تسليمات هالأسبوع' },
      ],
      entryPoints: [
        {
          kicker: 'اكتشف',
          title: 'وظّف مبدع',
          body: 'ابحث حسب المدينة والتخصص والتوفر، وابدأ بطلب واضح من البداية.',
          href: '/discover',
        },
        {
          kicker: 'مساحات',
          title: 'احجز استوديو',
          body: 'قارن الإضاءة والمعدات والأسعار بدون رسائل متفرقة.',
          href: '/spaces',
        },
        {
          kicker: 'فرص',
          title: 'انشر فرصة',
          body: 'حوّل احتياجك إلى موجز واضح يوصل لك عروض مرتبة.',
          href: '/jobs',
        },
        {
          kicker: 'انضم',
          title: 'ابنِ مكانك المهني',
          body: 'بروفايل أعمال، حجوزات، عروض أسعار، وتسليم في مكان واحد.',
          href: '/sign-up',
        },
      ],
      productKicker: 'المنتج',
      productTitle: 'مو بس دليل مبدعين. هذا نظام يشغّل شغلك.',
      productBody:
        'الفكرة بسيطة: العميل يشوف الشغل ويطلبه، والمبدع يدير المحادثة والسعر والعقد والتسليم بدون تشتت.',
      inboxLabel: 'صندوق الطلبات',
      inboxTitle: 'طلبات تنتظر قرارك',
      inboxMeta: '3 جديدة',
      inboxRows: [
        { title: 'مطعم جديد في الخبر', body: 'تصوير قائمة وهوية افتتاح', time: '9:40' },
        { title: 'علامة عبايات', body: 'فيلم قصير وصور حملة', time: '11:15' },
        { title: 'استوديو للإيجار', body: 'إضاءة ثابتة وخلفية هادئة', time: '14:20' },
      ],
      quoteLabel: 'عرض السعر',
      quoteValue: '18.4k',
      quoteCaption: 'متوسط قيمة المشروع',
      quoteStatus: 'جاهز',
      deliveryLabel: 'تسليم العميل',
      deliveryTitle: 'اختيارات، تحميل، وعلامة مائية',
      productCards: [
        {
          kicker: 'عرض',
          title: 'بروفايلات أعمال تنشاف بوضوح',
          body: 'تصميم هادي يخلي الشغل هو البطل، مو زحمة الصفحة.',
        },
        {
          kicker: 'اتفاق',
          title: 'قرارات ما تضيع بين الرسائل',
          body: 'المحادثات والعروض والعقود تبقى مربوطة بنفس المشروع.',
        },
        {
          kicker: 'تسليم',
          title: 'نهاية المشروع تصير أرتب',
          body: 'معارض عملاء منظمة بدل روابط تضيع بين المحادثات.',
        },
      ],
      creatorsKicker: 'اختيارات من السوق',
      systemKicker: 'طريقة الشغل',
      systemTitle: 'من أول بحث إلى آخر تسليم، الطريق واضح.',
      systemRows: [
        {
          title: 'ابدأ باللي تحتاجه',
          body: 'تصفح مبدعين أو استوديوهات أو فرص حسب الشغل اللي تبغاه فعلاً.',
          meta: 'بحث أذكى',
        },
        {
          title: 'حوّل الاهتمام إلى طلب واضح',
          body: 'كل طلب يبدأ بسياق كافي عشان ما تضيعون في الأخذ والرد.',
          meta: 'قرار أسرع',
        },
        {
          title: 'اختم المشروع بشكل يليق بالشغل',
          body: 'التسليم والمعرض والدفع في مكان واحد لين آخر ملف.',
          meta: 'تسليم أرتب',
        },
      ],
      finalKicker: 'ابدأ اليوم',
    };
  }

  return {
    eyebrow: 'A marketplace and work system for Gulf creatives',
    heroTitle: 'Hikaya makes creative work feel',
    heroAccent: 'calm, premium, and booked.',
    heroBody:
      'Find creators, book studios, open briefs, and deliver projects from one beautifully focused workspace built for visual work in the Gulf.',
    heroImageAlt: 'Hikaya interface showing creative work and project operations',
    metrics: [
      { value: '6', label: 'active cities' },
      { value: '4.9', label: 'creator rating' },
      { value: '48h', label: 'clear reply window' },
    ],
    featuredBriefKicker: 'Featured brief',
    featuredBriefTitle: 'Fragrance campaign looking for photo, motion, and art direction',
    featuredBriefMeta: 'Riyadh',
    commandKicker: 'Work console',
    commandTitle: 'Every project organized from first message',
    commandStatus: 'Live now',
    commandRows: [
      { label: 'New inquiry', title: 'Fragrance campaign shoot', value: '48h' },
      { label: 'Quote', title: 'Full production day with gallery delivery', value: 'SAR 12.8k' },
      { label: 'Delivery', title: 'Password protected client gallery', value: '124 files' },
    ],
    pipeline: [
      { value: '18', label: 'active conversations' },
      { value: '7', label: 'quotes in review' },
      { value: '3', label: 'deliveries this week' },
    ],
    entryPoints: [
      {
        kicker: 'Discover',
        title: 'Hire a creator',
        body: 'Search by city, craft, availability, and start with a clean brief.',
        href: '/discover',
      },
      {
        kicker: 'Spaces',
        title: 'Book a studio',
        body: 'Compare light, equipment, pricing, and rules without scattered messages.',
        href: '/spaces',
      },
      {
        kicker: 'Briefs',
        title: 'Post an opportunity',
        body: 'Turn a need into a brief creators can answer with structured proposals.',
        href: '/jobs',
      },
      {
        kicker: 'Join',
        title: 'Build your creative home',
        body: 'Portfolio, bookings, quotes, and delivery in one polished workspace.',
        href: '/sign-up',
      },
    ],
    productKicker: 'The product',
    productTitle: 'Not just a creator directory. A work operating system.',
    productBody:
      'The loop is simple: clients see the work and request it; creators manage the message, price, contract, and delivery without losing the thread.',
    inboxLabel: 'Inquiry inbox',
    inboxTitle: 'Requests that need a decision',
    inboxMeta: '3 new',
    inboxRows: [
      { title: 'New restaurant in Khobar', body: 'Menu shoot and launch identity', time: '9:40' },
      { title: 'Abaya label', body: 'Short film and campaign stills', time: '11:15' },
      { title: 'Studio rental', body: 'Continuous light and neutral backdrop', time: '14:20' },
    ],
    quoteLabel: 'Quote value',
    quoteValue: '18.4k',
    quoteCaption: 'average project value',
    quoteStatus: 'Ready',
    deliveryLabel: 'Client delivery',
    deliveryTitle: 'Favorites, downloads, watermarking',
    productCards: [
      {
        kicker: 'Show',
        title: 'Portfolios built for scrutiny',
        body: 'Quiet layouts make the work carry the page, not the decoration.',
      },
      {
        kicker: 'Agree',
        title: 'Fewer decisions get lost',
        body: 'Messages, quotes, and contracts stay attached to the same project.',
      },
      {
        kicker: 'Deliver',
        title: 'The ending feels professional',
        body: 'Client galleries replace links scattered across chat threads.',
      },
    ],
    creatorsKicker: 'Marketplace edit',
    systemKicker: 'Operating model',
    systemTitle: 'From first search to final handoff, the path stays visible.',
    systemRows: [
      {
        title: 'Start with intent',
        body: 'Browse creators, studios, or briefs based on the job you actually need done.',
        meta: 'Smarter search',
      },
      {
        title: 'Turn interest into a brief',
        body: 'Every request begins with enough context to protect both sides from messy back-and-forth.',
        meta: 'Faster decisions',
      },
      {
        title: 'Close with a beautiful handoff',
        body: 'Delivery, galleries, and payment live together through the last file.',
        meta: 'Better endings',
      },
    ],
    finalKicker: 'Start today',
  };
}
