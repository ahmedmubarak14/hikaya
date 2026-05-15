'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';

import { Button, Input, cn } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';
import { createPostAction, updatePostAction, type BlogResult } from '@/lib/blog/actions';
import type { BlogPost, PostStatus } from '@/lib/blog/mock-data';

const STATUSES: PostStatus[] = ['DRAFT', 'PUBLISHED'];

interface Props {
  locale: Locale;
  /** Existing post when editing; undefined when creating. */
  post?: BlogPost;
}

interface FormShape {
  titleEn: string;
  titleAr?: string;
  coverUrl?: string;
  bodyEn: string;
  bodyAr?: string;
  tagsRaw: string;
  status: PostStatus;
}

export function PostEditor({ locale, post }: Props) {
  const t = useTranslations('blog.editor');
  const tStatus = useTranslations('blog.status');
  const router = useRouter();

  const isEdit = Boolean(post);
  const action = isEdit && post
    ? updatePostAction.bind(null, locale, post.id)
    : createPostAction.bind(null, locale);

  const [serverState, formAction] = useFormState<BlogResult | null, FormData>(action, null);
  const [isPending, startTransition] = useTransition();

  // tagsRaw is transformed string → string[] inside zod; RHF can't introspect
  // that, so the server action is the canonical validator (mirrors ProductForm).
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: post
      ? {
          titleEn: post.titleEn,
          titleAr: post.titleAr ?? '',
          coverUrl: post.coverUrl ?? '',
          bodyEn: post.bodyEn,
          bodyAr: post.bodyAr ?? '',
          tagsRaw: post.tags.join(', '),
          status: post.status,
        }
      : {
          titleEn: '',
          titleAr: '',
          coverUrl: '',
          bodyEn: '',
          bodyAr: '',
          tagsRaw: '',
          status: 'DRAFT',
        },
  });

  // Redirect to the index once the action returns successfully — keeps the
  // mock-store mutation visible without forcing a manual refresh.
  useEffect(() => {
    if (serverState?.ok) {
      router.push(`/${locale}/me/blog`);
    }
  }, [serverState, locale, router]);

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const fd = new FormData();
        fd.set('titleEn', values.titleEn);
        if (values.titleAr) fd.set('titleAr', values.titleAr);
        if (values.coverUrl) fd.set('coverUrl', values.coverUrl);
        fd.set('bodyEn', values.bodyEn);
        if (values.bodyAr) fd.set('bodyAr', values.bodyAr);
        fd.set('tagsRaw', values.tagsRaw);
        fd.set('status', values.status);
        startTransition(() => formAction(fd));
      })}
      className="flex flex-col gap-6"
      noValidate
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label={t('titleLabel')}
          {...register('titleEn')}
          error={errors.titleEn?.message ?? serverState?.fieldErrors?.titleEn}
          required
        />
        <Input
          label={`${t('titleLabel')} — العربيّة`}
          dir="rtl"
          {...register('titleAr')}
          error={errors.titleAr?.message}
        />
      </section>

      <Input
        label={t('coverLabel')}
        placeholder="https://images.example.com/cover.jpg"
        {...register('coverUrl')}
        error={errors.coverUrl?.message ?? serverState?.fieldErrors?.coverUrl}
      />

      <Field
        label={t('bodyLabel')}
        hint={t('bodyHint')}
        error={errors.bodyEn?.message ?? serverState?.fieldErrors?.bodyEn}
      >
        <textarea
          rows={16}
          {...register('bodyEn')}
          className="min-h-96 rounded-md border border-surface/15 bg-surface/5 px-3 py-2 text-base text-surface outline-none focus-visible:border-accent"
        />
      </Field>

      <Field
        label={`${t('bodyLabel')} — العربيّة`}
        hint={t('bodyHint')}
        error={errors.bodyAr?.message}
      >
        <textarea
          rows={12}
          dir="rtl"
          {...register('bodyAr')}
          className="min-h-72 rounded-md border border-surface/15 bg-surface/5 px-3 py-2 text-base text-surface outline-none focus-visible:border-accent"
        />
      </Field>

      <Input
        label={t('tagsLabel')}
        hint={t('tagsHint')}
        placeholder="lighting, weddings, gear"
        {...register('tagsRaw')}
        error={errors.tagsRaw?.message}
      />

      <Field label={t('statusLabel')} error={errors.status?.message}>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-surface/15 px-4 py-2 text-sm transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10"
            >
              <input
                type="radio"
                value={s}
                {...register('status')}
                className="h-3 w-3 accent-accent"
              />
              <span className="text-surface/80">{tStatus(s as 'DRAFT')}</span>
            </label>
          ))}
        </div>
      </Field>

      {serverState?.error && serverState.error !== 'INVALID_INPUT' ? (
        <p className="text-sm text-accent-secondary" role="alert">
          {serverState.error}
        </p>
      ) : null}

      <div className={cn('flex items-center gap-3')}>
        <Button type="submit" size="lg" isLoading={isPending}>
          {t('save')}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => router.push(`/${locale}/me/blog`)}
        >
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-sm font-medium text-surface/80 [lang=ar]:font-sansAr">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-accent-secondary">{error}</span>
      ) : hint ? (
        <span className="text-xs text-surface/50">{hint}</span>
      ) : null}
    </label>
  );
}
