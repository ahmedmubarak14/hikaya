import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Badge } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { formatDate, formatSarFromHalalas } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'billing' });
  return { title: t('title') };
}

const STATUS_TONE: Record<string, 'neutral' | 'sage' | 'accent' | 'warning'> = {
  DRAFT: 'neutral',
  ISSUED: 'accent',
  PAID: 'sage',
  VOID: 'warning',
};

export default async function BillingHistoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/billing`);

  const t = await getTranslations('billing');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('Invoice')
    .select(
      'id, number, status, subtotalHalalas, vatHalalas, totalHalalas, pdfUrl, issuedAt, createdAt',
    )
    .eq('issuedToUserId', session.user.id)
    .order('createdAt', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[billing] list error:', error.message);
  }

  type Row = {
    id: string;
    number: string;
    status: string;
    subtotalHalalas: number;
    vatHalalas: number;
    totalHalalas: number;
    pdfUrl: string | null;
    issuedAt: string | null;
    createdAt: string;
  };
  const rows = ((data as Row[] | null) ?? []);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-10">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-surface text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted text-sm">{t('subtitle')}</p>
      </header>

      {rows.length === 0 ? (
        <div className="border-line/60 bg-paper rounded-2xl border p-10 text-center">
          <p className="text-surface text-base font-medium">{t('emptyTitle')}</p>
          <p className="text-muted mt-2 text-sm">{t('emptyBody')}</p>
        </div>
      ) : (
        <div className="border-line/60 overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-surface/[0.04] text-2xs text-surface/50 uppercase">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('colNumber')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('colIssued')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('colSubtotal')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('colVat')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('colTotal')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('colStatus')}</th>
                <th className="px-4 py-3 text-end font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const issued = r.issuedAt ?? r.createdAt;
                return (
                  <tr key={r.id} className="border-line/60 border-t">
                    <td className="text-surface px-4 py-3 font-mono tabular-nums">{r.number}</td>
                    <td className="text-muted px-4 py-3 font-mono tabular-nums">
                      {formatDate(issued, locale)}
                    </td>
                    <td className="text-surface px-4 py-3 text-end font-mono tabular-nums">
                      {formatSarFromHalalas(r.subtotalHalalas, locale)}
                    </td>
                    <td className="text-surface px-4 py-3 text-end font-mono tabular-nums">
                      {formatSarFromHalalas(r.vatHalalas, locale)}
                    </td>
                    <td className="text-surface px-4 py-3 text-end font-mono tabular-nums">
                      {formatSarFromHalalas(r.totalHalalas, locale)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      {r.pdfUrl ? (
                        <Link
                          href={r.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent text-xs hover:underline"
                        >
                          {t('downloadPdf')}
                        </Link>
                      ) : (
                        <span className="text-muted/50 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
