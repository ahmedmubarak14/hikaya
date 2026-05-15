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
    <article className="border-surface/10 bg-surface/[0.03] overflow-hidden rounded-xl border">
      <header className="border-surface/10 flex items-baseline justify-between gap-3 border-b p-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs text-surface/40">
            {t('quoteFor', { name: quote.clientName })}
          </span>
          <h3 className="text-surface text-3xl font-bold tracking-tight">{quote.number}</h3>
        </div>
        {quote.expiresAt ? (
          <span className="text-2xs text-surface/40 text-end">
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
          <thead className="border-surface/10 bg-surface/[0.02] border-b">
            <tr className="text-2xs text-surface/40 text-start">
              <th className="p-4 text-start">{t('description')}</th>
              <th className="p-4 text-end">{t('quantity')}</th>
              <th className="p-4 text-end">{t('unit')}</th>
              <th className="p-4 text-end">{t('total')}</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((li) => (
              <tr key={li.id} className="border-surface/5 border-b last:border-0">
                <td className="text-surface p-4 align-top">
                  <div className="font-medium">
                    {locale === 'ar' && li.descriptionAr ? li.descriptionAr : li.descriptionEn}
                  </div>
                </td>
                <td className="text-surface/80 p-4 text-end font-mono tabular-nums">
                  {li.quantity}
                </td>
                <td className="text-surface/80 p-4 text-end font-mono tabular-nums">
                  {formatSarFromHalalas(li.unitHalalas, locale)}
                </td>
                <td className="text-surface p-4 text-end font-mono tabular-nums">
                  {formatSarFromHalalas(li.totalHalalas, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="border-surface/10 flex flex-col gap-2 border-t p-6">
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
          <div className="border-surface/10 mt-4 border-t pt-4">
            <p className="text-2xs text-surface/40">{t('notes')}</p>
            <p className="text-surface/70 mt-2 max-w-prose text-sm">{quote.notes}</p>
          </div>
        ) : null}
      </footer>
    </article>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={accent ? 'text-surface text-base font-medium' : 'text-2xs text-surface/40'}>
        {label}
      </span>
      <span
        className={
          accent
            ? 'text-accent-secondary text-3xl font-bold tabular-nums tracking-tight'
            : 'text-surface/80 text-sm tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  );
}
