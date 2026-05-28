'use client';

import { Check, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState, useTransition } from 'react';

import { type Locale } from '@/i18n/config';
import { addImagesAction } from '@/lib/galleries/actions';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Props {
  locale: Locale;
  galleryId: string;
  /** Supabase Storage bucket. Defaults to `galleries`. */
  bucket?: string;
}

type FileState =
  | { status: 'queued'; file: File }
  | { status: 'uploading'; file: File; progress: number }
  | { status: 'done'; file: File; url: string }
  | { status: 'error'; file: File; message: string };

export function BulkUploadDropzone({ locale, galleryId, bucket = 'galleries' }: Props) {
  const t = useTranslations('gallery.bulkUpload');
  const [items, setItems] = useState<FileState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (incoming.length === 0) return;
      const queued: FileState[] = incoming.map((file) => ({ status: 'queued', file }));
      setItems((prev) => [...prev, ...queued]);

      const supabase = createSupabaseBrowserClient();

      void Promise.all(
        incoming.map(async (file, i) => {
          const idx = items.length + i;
          setItems((prev) => {
            const next = [...prev];
            next[idx] = { status: 'uploading', file, progress: 0 };
            return next;
          });
          const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
          const key = `${galleryId}/${Date.now()}-${i}.${ext}`;
          const { error } = await supabase.storage.from(bucket).upload(key, file, {
            upsert: false,
            contentType: file.type,
            cacheControl: '31536000',
          });
          if (error) {
            setItems((prev) => {
              const next = [...prev];
              next[idx] = { status: 'error', file, message: error.message };
              return next;
            });
            return null;
          }
          const { data } = supabase.storage.from(bucket).getPublicUrl(key);
          setItems((prev) => {
            const next = [...prev];
            next[idx] = { status: 'done', file, url: data.publicUrl };
            return next;
          });
          return data.publicUrl;
        }),
      );
    },
    [items.length, galleryId, bucket],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  };

  const onPickClick = () => inputRef.current?.click();
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const uploadedUrls = items
    .filter((i): i is Extract<FileState, { status: 'done' }> => i.status === 'done')
    .map((i) => i.url);
  const hasFailures = items.some((i) => i.status === 'error');
  const hasPending = items.some((i) => i.status === 'queued' || i.status === 'uploading');

  const saveToGallery = () => {
    setServerError(null);
    const formData = new FormData();
    formData.append('urls', uploadedUrls.join('\n'));
    startTransition(async () => {
      const result = await addImagesAction(locale, galleryId, null, formData);
      if (result.ok) {
        setItems([]);
      } else {
        setServerError(result.error ?? 'UNKNOWN');
      }
    });
  };

  const removeAt = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        onClick={onPickClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onPickClick();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-bg/40 px-6 py-10 text-center transition-colors',
          isDragging ? 'border-accent bg-accent/5' : 'border-line/80 hover:border-surface/40',
        )}
      >
        <Upload size={22} className="text-muted mb-2" />
        <p className="text-surface text-sm font-medium">{t('dropTitle')}</p>
        <p className="text-muted mt-1 text-xs">{t('dropBody')}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onChange}
        />
      </div>

      {items.length > 0 ? (
        <ul className="border-line/60 divide-line/60 divide-y rounded-xl border bg-bg/40">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-surface truncate text-sm">{item.file.name}</span>
              <span className="text-muted ms-auto shrink-0 text-xs">
                {item.status === 'uploading' ? t('uploading') : null}
                {item.status === 'done' ? <Check size={14} className="text-accent" /> : null}
                {item.status === 'error' ? (
                  <span className="text-orange">{t('error')}</span>
                ) : null}
              </span>
              {item.status !== 'uploading' ? (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Remove"
                  className="text-muted hover:text-surface shrink-0"
                >
                  <X size={14} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {serverError ? (
        <p className="text-orange text-xs" role="alert">
          {serverError}
        </p>
      ) : null}

      {uploadedUrls.length > 0 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveToGallery}
            disabled={isPending || hasPending}
            className="bg-surface text-bg disabled:opacity-50 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
          >
            {isPending ? t('saving') : t('saveCount', { count: uploadedUrls.length })}
          </button>
          {hasFailures ? <span className="text-orange text-xs">{t('someFailed')}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
