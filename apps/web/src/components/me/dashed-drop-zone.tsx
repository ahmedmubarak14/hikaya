import { ImageIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Props {
  title: string;
  body?: string;
  icon?: ReactNode;
  /** Optional inline link (e.g. "browse") shown after the body. */
  action?: ReactNode;
  className?: string;
}

export function DashedDropZone({ title, body, action, icon, className }: Props) {
  return (
    <div
      className={cn(
        'border-line/80 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-bg/40 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="text-muted mb-3">{icon ?? <ImageIcon size={24} strokeWidth={1.5} />}</div>
      <p className="text-surface text-sm font-medium">{title}</p>
      {body || action ? (
        <p className="text-muted mt-1 text-xs">
          {body} {action}
        </p>
      ) : null}
    </div>
  );
}
