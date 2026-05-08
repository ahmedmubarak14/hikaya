import Link from 'next/link';

import { Badge, Card, CardBody } from '@hikaya/ui';

import { SiteHeader } from '@/components/site-header';
import { type Locale } from '@/i18n/config';

/**
 * Rendered in place of any auth-gated page (and any page that mutates state)
 * on the GitHub Pages static build. Browsing flows work; mutations don't —
 * this notice keeps the URL valid and points the visitor at the read-only
 * surfaces that *do* function.
 */
export function DemoModeNotice({ locale }: { locale: Locale }) {
  const linkClass =
    'rounded-full border border-surface/15 px-4 py-2 text-sm text-surface/80 transition-colors hover:border-surface/40 hover:text-surface';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-6 py-22 md:px-10">
        <Card>
          <CardBody className="flex flex-col gap-4 p-8">
            <Badge tone="accent" className="self-start">
              Static demo
            </Badge>
            <h1 className="text-balance text-3xl">
              This surface needs the <em className="font-display italic text-accent">live</em> app.
            </h1>
            <p className="text-surface/70">
              You&apos;re viewing the GitHub Pages preview. It&apos;s a fully-static export
              of the codebase, which means anything that mutates state — sign-in, posting
              a job, sending a message, building a quote, signing a contract,
              buying a product — needs the server-rendered version.
            </p>
            <p className="text-sm text-surface/50">
              The pages below all work on this preview. They&apos;re seeded with realistic
              demo data so you can browse the design end-to-end.
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={`/${locale}`} className={linkClass}>← Home</Link>
              <Link href={`/${locale}/discover`} className={linkClass}>Discover creatives</Link>
              <Link href={`/${locale}/jobs`} className={linkClass}>Job board</Link>
              <Link href={`/${locale}/noor`} className={linkClass}>Creator profile</Link>
              <Link href={`/${locale}/noor/store`} className={linkClass}>Storefront</Link>
              <Link href={`/${locale}/g/sara-hassan-wedding`} className={linkClass}>Public gallery</Link>
              <Link href={`/${locale}/q/sara-hassan-wedding-q1`} className={linkClass}>Public quote</Link>
            </div>

            <p className="mt-4 font-mono text-2xs uppercase tracking-widest text-surface/40 [lang=ar]:font-sansAr [lang=ar]:tracking-normal [lang=ar]:normal-case">
              For the full interactive app, run locally — see the README for instructions.
            </p>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
