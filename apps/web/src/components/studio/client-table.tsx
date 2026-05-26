'use client';

import { useCallback, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Badge, Button, Input } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import type { StudioClient } from '@/lib/studio/mock-data';
import {
  updateClientAction,
  addClientAction,
  getClientHistory,
} from '@/lib/studio/client-actions';

interface Props {
  clients: StudioClient[];
}

interface ClientHistory {
  bookings: Array<{
    id: string;
    discipline: string;
    status: string;
    sessionStart: string;
    totalHalalas: number;
  }>;
  quotes: Array<{
    id: string;
    number: string;
    status: string;
    totalHalalas: number;
    createdAt: string;
  }>;
  contracts: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

export function ClientTable({ clients }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations('studio.clients');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<ClientHistory | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Edit form state
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSaved, setEditSaved] = useState(false);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addTags, setAddTags] = useState('');
  const [addSaved, setAddSaved] = useState(false);

  const fmtSar = useCallback(
    (sar: number) =>
      new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(sar),
    [locale],
  );

  const fmtNum = useCallback(
    (n: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA').format(n),
    [locale],
  );

  const fmtDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(iso)),
    [locale],
  );

  const handleExpandRow = (clientId: string) => {
    if (expandedId === clientId) {
      setExpandedId(null);
      setEditingId(null);
      setHistoryId(null);
      setHistory(null);
    } else {
      setExpandedId(clientId);
      setEditingId(null);
      setHistoryId(null);
      setHistory(null);
    }
  };

  const handleEditClient = (client: StudioClient) => {
    setEditingId(client.id);
    setEditNotes('');
    setEditTags(client.tags.join(', '));
    setEditSaved(false);
  };

  const handleSaveEdit = (clientId: string) => {
    setEditSaved(false);
    startTransition(async () => {
      const result = await updateClientAction(clientId, {
        notes: editNotes,
        tags: editTags,
      });
      if (result.ok) {
        setEditSaved(true);
        setEditingId(null);
      }
    });
  };

  const handleViewHistory = (clientId: string) => {
    setHistoryId(clientId);
    startTransition(async () => {
      const data = await getClientHistory(clientId);
      setHistory(data);
    });
  };

  const handleAddClient = () => {
    setAddSaved(false);
    startTransition(async () => {
      const result = await addClientAction({
        name: addName,
        email: addEmail,
        tags: addTags,
      });
      if (result.ok) {
        setAddSaved(true);
        setAddName('');
        setAddEmail('');
        setAddTags('');
        setShowAddForm(false);
      }
    });
  };

  const sorted = [...clients].sort((a, b) => b.totalSpendSar - a.totalSpendSar);

  return (
    <section className="border-surface/10 bg-surface/[0.03] overflow-hidden rounded-xl border">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-baseline gap-3">
          <h3 className="text-surface text-2xl">{t('title')}</h3>
          <span className="text-2xs text-surface/40">
            {t('count', { count: clients.length })}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? t('cancelAdd') : t('addClient')}
        </Button>
      </header>

      {/* Add client form */}
      {showAddForm && (
        <div className="border-surface/10 border-t p-6">
          <h4 className="text-surface mb-4 text-lg">{t('addClientTitle')}</h4>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label={t('name')}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder={t('namePlaceholder')}
              />
              <Input
                label={t('emailLabel')}
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
              />
              <Input
                label={t('tagsLabel')}
                value={addTags}
                onChange={(e) => setAddTags(e.target.value)}
                placeholder={t('tagsPlaceholder')}
                hint={t('tagsHint')}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleAddClient} isLoading={isPending}>
                {t('saveClient')}
              </Button>
              {addSaved && (
                <span className="text-2xs text-accent-secondary">{t('clientSaved')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead className="border-surface/10 bg-surface/[0.02] border-y">
            <tr className="text-2xs text-surface/40 text-start">
              <Th>{t('name')}</Th>
              <Th>{t('tags')}</Th>
              <Th align="end">{t('bookings')}</Th>
              <Th align="end">{t('totalSpend')}</Th>
              <Th align="end">{t('lastSession')}</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <>
                <tr
                  key={c.id}
                  className="border-surface/5 hover:bg-surface/[0.03] cursor-pointer border-b transition-colors last:border-0"
                  onClick={() => handleExpandRow(c.id)}
                >
                  <Td>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-surface text-base">{c.name}</span>
                      <span className="text-2xs text-surface/40 font-mono">{c.email}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {c.isBusiness ? <Badge tone="info">{t('business')}</Badge> : null}
                      {c.tags.map((tag) => (
                        <Badge key={tag} tone="neutral">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td align="end">{fmtNum(c.bookingsCount)}</Td>
                  <Td align="end">{fmtSar(c.totalSpendSar)}</Td>
                  <Td align="end">{fmtDate(c.lastBookingAt)}</Td>
                </tr>

                {/* Expanded row */}
                {expandedId === c.id && (
                  <tr key={`${c.id}-expand`} className="border-surface/5 border-b">
                    <td colSpan={5} className="bg-surface/[0.02] p-6">
                      <div className="flex gap-3 mb-4">
                        <Button
                          variant={editingId === c.id ? 'primary' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(c);
                          }}
                        >
                          {t('editNotesTags')}
                        </Button>
                        <Button
                          variant={historyId === c.id ? 'primary' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewHistory(c.id);
                          }}
                        >
                          {t('viewHistory')}
                        </Button>
                      </div>

                      {/* Edit notes/tags form */}
                      {editingId === c.id && (
                        <div className="flex flex-col gap-4 mb-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-surface/80 text-sm font-medium">
                              {t('notesLabel')}
                            </label>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="border-surface/15 bg-surface/5 text-surface focus:border-accent min-h-[80px] rounded-md border p-3 text-base outline-none"
                              placeholder={t('notesPlaceholder')}
                            />
                          </div>
                          <Input
                            label={t('tagsLabel')}
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            hint={t('tagsHint')}
                          />
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(c.id);
                              }}
                              isLoading={isPending}
                            >
                              {t('saveChanges')}
                            </Button>
                            {editSaved && (
                              <span className="text-2xs text-accent-secondary">
                                {t('changesSaved')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Client history */}
                      {historyId === c.id && (
                        <div className="flex flex-col gap-4">
                          {isPending && !history && (
                            <p className="text-surface/50 text-sm">{t('loadingHistory')}</p>
                          )}
                          {history && (
                            <>
                              <div>
                                <h5 className="text-surface mb-2 text-sm font-medium">
                                  {t('historyBookings')} ({history.bookings.length})
                                </h5>
                                {history.bookings.length === 0 ? (
                                  <p className="text-surface/40 text-sm">{t('noBookings')}</p>
                                ) : (
                                  <ul className="flex flex-col gap-2">
                                    {history.bookings.map((b) => (
                                      <li
                                        key={b.id}
                                        className="border-surface/10 flex items-center justify-between rounded-lg border p-3"
                                      >
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-surface text-sm">
                                            {b.discipline.replace(/_/g, ' ')}
                                          </span>
                                          <span className="text-2xs text-surface/40">
                                            {fmtDate(b.sessionStart)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge tone="neutral">{b.status}</Badge>
                                          <span className="text-surface/60 text-sm">
                                            {fmtSar(b.totalHalalas / 100)}
                                          </span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div>
                                <h5 className="text-surface mb-2 text-sm font-medium">
                                  {t('historyQuotes')} ({history.quotes.length})
                                </h5>
                                {history.quotes.length === 0 ? (
                                  <p className="text-surface/40 text-sm">{t('noQuotes')}</p>
                                ) : (
                                  <ul className="flex flex-col gap-2">
                                    {history.quotes.map((q) => (
                                      <li
                                        key={q.id}
                                        className="border-surface/10 flex items-center justify-between rounded-lg border p-3"
                                      >
                                        <span className="text-surface text-sm">
                                          #{q.number}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <Badge tone="neutral">{q.status}</Badge>
                                          <span className="text-surface/60 text-sm">
                                            {fmtSar(q.totalHalalas / 100)}
                                          </span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div>
                                <h5 className="text-surface mb-2 text-sm font-medium">
                                  {t('historyContracts')} ({history.contracts.length})
                                </h5>
                                {history.contracts.length === 0 ? (
                                  <p className="text-surface/40 text-sm">{t('noContracts')}</p>
                                ) : (
                                  <ul className="flex flex-col gap-2">
                                    {history.contracts.map((ct) => (
                                      <li
                                        key={ct.id}
                                        className="border-surface/10 flex items-center justify-between rounded-lg border p-3"
                                      >
                                        <span className="text-surface text-sm">
                                          {t('contract')}
                                        </span>
                                        <Badge tone="neutral">{ct.status}</Badge>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({
  children,
  align = 'start',
}: {
  children: React.ReactNode;
  align?: 'start' | 'end';
}) {
  return (
    <th className={align === 'end' ? 'p-4 text-end' : 'p-4 text-start'} scope="col">
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'start',
}: {
  children: React.ReactNode;
  align?: 'start' | 'end';
}) {
  return <td className={align === 'end' ? 'p-4 text-end' : 'p-4 text-start'}>{children}</td>;
}
