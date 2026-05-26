'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Input } from '@hikaya/ui';

import {
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
  type DocumentTemplateRow,
} from '@/lib/templates/actions';

interface Props {
  templates: DocumentTemplateRow[];
}

export function TemplateList({ templates: initialTemplates }: Props) {
  const t = useTranslations('templates');
  const [isPending, startTransition] = useTransition();
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formKind, setFormKind] = useState<'QUOTE' | 'CONTRACT'>('CONTRACT');
  const [formBody, setFormBody] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormNameAr('');
    setFormKind('CONTRACT');
    setFormBody('');
  };

  const handleCreate = () => {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await createTemplateAction({
        nameEn: formName,
        nameAr: formNameAr || undefined,
        kind: formKind,
        bodyHtml: formBody,
      });
      if (result.ok) {
        setSaved(true);
        setShowCreate(false);
        resetForm();
        // Refresh will come from revalidatePath
        window.location.reload();
      } else {
        setError(result.error);
      }
    });
  };

  const handleEdit = (tpl: DocumentTemplateRow) => {
    setEditingId(tpl.id);
    setFormName(tpl.nameEn);
    setFormNameAr(tpl.nameAr ?? '');
    setFormKind(tpl.kind as 'QUOTE' | 'CONTRACT');
    setFormBody(tpl.bodyHtml);
    setSaved(false);
    setError(null);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateTemplateAction(editingId, {
        nameEn: formName,
        nameAr: formNameAr || undefined,
        kind: formKind,
        bodyHtml: formBody,
      });
      if (result.ok) {
        setSaved(true);
        setEditingId(null);
        resetForm();
        window.location.reload();
      } else {
        setError(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTemplateAction(id);
      if (result.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    });
  };

  const isEditing = editingId !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <span className="text-surface/40 text-sm">
          {t('count', { count: templates.length })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowCreate(!showCreate);
            setEditingId(null);
            resetForm();
          }}
        >
          {showCreate ? t('cancel') : t('createTemplate')}
        </Button>
      </div>

      {/* Create / Edit form */}
      {(showCreate || isEditing) && (
        <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-6">
          <h3 className="text-surface mb-4 text-lg">
            {isEditing ? t('editTemplate') : t('newTemplate')}
          </h3>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label={t('templateName')}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('templateNamePlaceholder')}
              />
              <Input
                label={t('templateNameAr')}
                value={formNameAr}
                onChange={(e) => setFormNameAr(e.target.value)}
                placeholder={t('templateNameArPlaceholder')}
              />
            </div>

            <label className="flex w-full flex-col gap-1.5">
              <span className="text-surface/80 text-sm font-medium">{t('templateKind')}</span>
              <select
                value={formKind}
                onChange={(e) => setFormKind(e.target.value as 'QUOTE' | 'CONTRACT')}
                className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
              >
                <option value="CONTRACT">{t('kindContract')}</option>
                <option value="QUOTE">{t('kindQuote')}</option>
              </select>
            </label>

            <div className="flex flex-col gap-1.5">
              <label className="text-surface/80 text-sm font-medium">{t('templateBody')}</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                className="border-surface/15 bg-surface/5 text-surface focus:border-accent min-h-[200px] rounded-md border p-3 text-base outline-none"
                placeholder={t('templateBodyPlaceholder')}
              />
              <p className="text-surface/50 text-xs">{t('templateBodyHint')}</p>
            </div>

            {error && (
              <p className="text-accent-secondary text-sm">{t('error')}</p>
            )}

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={isEditing ? handleUpdate : handleCreate}
                isLoading={isPending}
              >
                {isEditing ? t('saveChanges') : t('createTemplate')}
              </Button>
              {saved && (
                <span className="text-2xs text-accent-secondary">{t('saved')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 && !showCreate ? (
        <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-10 text-center">
          <p className="text-surface/50 text-sm">{t('empty')}</p>
          <p className="text-surface/30 mt-1 text-xs">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="border-surface/10 bg-surface/[0.03] flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-surface text-base">{tpl.nameEn}</span>
                  <Badge tone={tpl.kind === 'CONTRACT' ? 'purple' : 'info'}>
                    {tpl.kind === 'CONTRACT' ? t('kindContract') : t('kindQuote')}
                  </Badge>
                </div>
                <span className="text-2xs text-surface/40">
                  {t('lastUpdated')}{' '}
                  {new Date(tpl.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(tpl)}>
                  {t('edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(tpl.id)}
                  isLoading={isPending}
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
