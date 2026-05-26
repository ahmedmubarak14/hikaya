'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import {
  listTemplatesAction,
  type DocumentTemplateRow,
} from '@/lib/templates/actions';

interface Props {
  kind: 'QUOTE' | 'CONTRACT';
  onSelect: (template: DocumentTemplateRow) => void;
}

/**
 * "Load from template" dropdown to populate contract/quote forms.
 */
export function TemplatePicker({ kind, onSelect }: Props) {
  const t = useTranslations('templates');
  const [templates, setTemplates] = useState<DocumentTemplateRow[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const all = await listTemplatesAction();
      setTemplates(all.filter((tpl) => tpl.kind === kind));
    });
  }, [kind]);

  if (templates.length === 0 && !isPending) return null;

  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-surface/80 text-sm font-medium">{t('loadFromTemplate')}</span>
      <select
        className="border-surface/15 bg-surface/5 text-surface focus-visible:border-accent h-11 rounded-md border px-3 text-base outline-none"
        defaultValue=""
        onChange={(e) => {
          const tpl = templates.find((t) => t.id === e.target.value);
          if (tpl) onSelect(tpl);
        }}
        disabled={isPending}
      >
        <option value="" disabled>
          {isPending ? t('loading') : t('selectTemplate')}
        </option>
        {templates.map((tpl) => (
          <option key={tpl.id} value={tpl.id}>
            {tpl.nameEn}
          </option>
        ))}
      </select>
    </label>
  );
}
