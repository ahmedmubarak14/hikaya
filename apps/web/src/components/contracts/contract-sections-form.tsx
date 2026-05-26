'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useFormState } from 'react-dom';

import { Button } from '@hikaya/ui';

import { TemplatePicker } from '@/components/templates/template-picker';
import { type Locale } from '@/i18n/config';
import { updateContractSectionsAction, type ContractResult } from '@/lib/contracts/actions';
import type { ContractSection } from '@/lib/contracts/mock-data';
import { sectionKeys, type SectionKey } from '@/lib/contracts/schemas';

interface Props {
  locale: Locale;
  contractId: string;
  sections: ContractSection[];
  /** When true, renders read-only — used after signing locks the contract. */
  locked?: boolean;
}

export function ContractSectionsForm({ locale, contractId, sections, locked }: Props) {
  const t = useTranslations('contracts.sections');
  const [serverState, formAction] = useFormState<ContractResult | null, FormData>(
    updateContractSectionsAction.bind(null, locale, contractId),
    null,
  );
  const [isPending, startTransition] = useTransition();

  const byKey = new Map(sections.map((s) => [s.key, s.body]));

  return (
    <form
      action={(fd) => {
        startTransition(() => formAction(fd));
      }}
      className="flex flex-col gap-6"
    >
      {/* Load from template */}
      {!locked && (
        <TemplatePicker
          kind="CONTRACT"
          onSelect={(tpl) => {
            // Populate the first textarea (scopeOfWork) with the template body
            const firstTextarea = document.querySelector<HTMLTextAreaElement>(
              `textarea[name="${sectionKeys[0]}"]`,
            );
            if (firstTextarea) {
              firstTextarea.value = tpl.bodyHtml;
              firstTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }}
        />
      )}

      {sectionKeys.map((key) => (
        <SectionField
          key={key}
          name={key}
          label={t(`${key}.title` as 'scopeOfWork.title')}
          description={t(`${key}.description` as 'scopeOfWork.description')}
          defaultValue={byKey.get(key) ?? ''}
          locked={locked}
          error={serverState?.fieldErrors?.[key]}
        />
      ))}

      {!locked ? (
        <div className="flex items-center gap-3">
          <Button type="submit" size="md" isLoading={isPending}>
            {t('save')}
          </Button>
          {serverState?.ok ? (
            <span className="text-2xs text-accent-secondary">{t('saved')}</span>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function SectionField({
  name,
  label,
  description,
  defaultValue,
  locked,
  error,
}: {
  name: SectionKey;
  label: string;
  description: string;
  defaultValue: string;
  locked?: boolean;
  error?: string;
}) {
  return (
    <div className="border-surface/10 bg-surface/[0.03] rounded-md border p-5">
      <header className="mb-3 flex flex-col gap-0.5">
        <span className="text-2xs text-accent-secondary">{label}</span>
        <span className="text-surface/50 text-xs">{description}</span>
      </header>
      {locked ? (
        <p className="text-surface/80 whitespace-pre-wrap text-sm">{defaultValue}</p>
      ) : (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={5}
          className="border-surface/15 bg-bg/50 text-surface focus-visible:border-accent w-full rounded-md border px-3 py-2 text-sm outline-none"
        />
      )}
      {error ? <p className="text-accent-secondary mt-2 text-xs">{error}</p> : null}
    </div>
  );
}
