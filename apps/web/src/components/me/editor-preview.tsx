import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Props {
  editor: ReactNode;
  preview: ReactNode;
  className?: string;
}

/**
 * Two-column shell for settings/editor pages that have a live preview. The
 * preview sticks to the top of the viewport while the editor scrolls.
 */
export function EditorPreview({ editor, preview, className }: Props) {
  return (
    <div className={cn('grid grid-cols-1 gap-8 px-8 py-8 lg:grid-cols-[1fr_360px]', className)}>
      <div className="min-w-0">{editor}</div>
      <aside className="hidden lg:block">
        <div className="border-line/60 sticky top-6 overflow-hidden rounded-xl border bg-bg/40 p-6">
          {preview}
        </div>
      </aside>
    </div>
  );
}
