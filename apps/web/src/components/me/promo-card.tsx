import Link from 'next/link';
import { Plus } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Props {
  visual?: ReactNode;
  body: string;
  cta: { href: string; label: string };
  className?: string;
}

export function PromoCard({ visual, body, cta, className }: Props) {
  return (
    <div
      className={cn(
        'border-line/60 flex flex-col items-center gap-3 rounded-2xl border bg-paper p-6 text-center',
        className,
      )}
    >
      {visual ? <div className="h-20">{visual}</div> : null}
      <p className="text-surface text-sm">{body}</p>
      <Link
        href={cta.href}
        className="border-line/80 text-surface hover:bg-surface/[0.04] inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
      >
        <Plus size={14} strokeWidth={2} />
        {cta.label}
      </Link>
    </div>
  );
}
