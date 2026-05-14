import { useLocale, useTranslations } from 'next-intl';

import { type Locale } from '@/i18n/config';
import { formatSarFromHalalas } from '@/lib/format';
import type { Quote } from '@/lib/quotes/mock-data';

interface Props {
  quote: Quote;
}

/**
 * Read-only quote rendering — used by both the creator-side detail page
 * and the public approval page so the numbers and copy stay in lockstep.
 */
export function QuoteSummary({ quote }: Props) {
  const t = useTranslations('quotes.summary');
  const locale = useLocale() as Locale;

  return (
    <article className="rounded-xl border border-surface/10 bg-surface/[0.03] overflow-hidden">
      <header className="flex items-baseline justify-between gap-3 border-b border-surface/10 p-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs text-surface/40">
            {t('quoteFor', { name: quote.clientName })}
          </span>
          <h3 className="font-display text-3xl text-surface">{quote.number}</h3>
        </div>
        {quote.expiresAt ? (
          <span className="text-end text-2xs text-surface/40">
            {t('expires')}
            <br />
            {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(new Date(quote.expiresAt))}
          </span>
        ) : null}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead className="border-b border-surface/10 bg-surface/[0.02]">
            <tr className="text-start text-2xs text-surface/40">
              <th className="p-4 text-start">{t('description')}</th>
              <th className="p-4 text-end">{t('quantity')}</th>
              <th className="p-4 text-end">{t('unit')}</th>
              <th className="p-4 text-end">{t('total')}</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-surface/5 last:border-0">
                <td className="p-4 align-top text-surface">
                  <div className="font-medium">
                    {locale === 'ar' && li.descriptionAr ? li.descriptionAr : li.descriptionEn}
                  </div>
                </td>
                <td className="p-4 text-end font-mono text-surface/80 tabular-nums">{li.quantity}</td>
                <td className="p-4 text-end font-mono text-surface/80 tabular-nums">
                  {formatSarFromHalalas(li.unitHalalas, locale)}
                </td>
                <td className="p-4 text-end font-mono text-surface tabular-nums">
                  {formatSarFromHalalas(li.totalHalalas, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-2 border-t border-surface/10 p-6">
        <Row label={t('subtotal')} value={formatSarFromHalalas(quote.subtotalHalalas, locale)} />
        {quote.discountHalalas > 0 ? (
          <Row
            label={t('discount')}
            value={`- ${formatSarFromHalalas(quote.discountHalalas, locale)}`}
          />
        ) : null}
        <Row label={t('vat')} value={formatSarFromHalalas(quote.vatHalalas, locale)} />
        <Row
          label={t('grandTotal')}
          value={formatSarFromHalalas(quote.totalHalalas, locale)}
          accent
        />

        {quote.notes ? (
          <div className="mt-4 border-t border-surface/10 pt-4">
            <p className="text-2xs text-surface/40">
              {t('notes')}
            </p>
            <p className="mt-2 max-w-prose text-sm text-surface/70">{quote.notes}</p>
          </div>
        ) : null}
      </footer>
    </article>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span
        className={
          accent
            ? 'text-base font-medium text-surface'
            : 'text-2xs text-surface/40'
        }
      >
        {label}
      </span>
      <span
        className={
          accent
            ? 'font-display text-3xl text-accent-secondary tabular-nums'
            : 'font-mono text-sm text-surface/80 tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  );
}
