'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@hikaya/ui';

interface Props {
  urls: string[];
  mine: boolean;
}

/** File extensions considered as images. */
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']);

/** Returns the file extension from a URL, lowercased. */
function getExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const dot = pathname.lastIndexOf('.');
    return dot >= 0 ? pathname.slice(dot + 1).toLowerCase() : '';
  } catch {
    return '';
  }
}

/** Extracts a filename from a URL. */
function getFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'file');
  } catch {
    return 'file';
  }
}

/**
 * Renders attached URLs inline within a message bubble:
 * - Images → inline thumbnail (click to open full size)
 * - PDFs → file icon + filename link
 * - Other → generic file link
 */
export function MessageAttachments({ urls, mine }: Props) {
  const t = useTranslations('messages.attachments');

  if (urls.length === 0) return null;

  return (
    <div className={cn('mt-1.5 flex flex-wrap gap-2', mine ? 'justify-end' : 'justify-start')}>
      {urls.map((url) => {
        const ext = getExtension(url);
        const isImage = IMAGE_EXTS.has(ext);
        const isPdf = ext === 'pdf';

        if (isImage) {
          return (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={t('imageAlt')}
                loading="lazy"
                className="max-h-48 max-w-[200px] rounded-lg object-cover transition-transform group-hover:scale-105"
              />
            </a>
          );
        }

        if (isPdf) {
          return (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                mine
                  ? 'border-ink/20 text-ink hover:bg-ink/10'
                  : 'border-surface/15 text-surface hover:bg-surface/10',
              )}
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              <span className="max-w-[160px] truncate">{getFilename(url)}</span>
            </a>
          );
        }

        // Generic file link
        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              mine
                ? 'border-ink/20 text-ink hover:bg-ink/10'
                : 'border-surface/15 text-surface hover:bg-surface/10',
            )}
          >
            <svg
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
              />
            </svg>
            <span className="max-w-[160px] truncate">{getFilename(url)}</span>
          </a>
        );
      })}
    </div>
  );
}
