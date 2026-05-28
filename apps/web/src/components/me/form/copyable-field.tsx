'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface Props {
  value: string;
  copyLabel?: string;
  copiedLabel?: string;
  className?: string;
}

export function CopyableField({
  value,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked (older browsers, insecure contexts) — fail
      // silently rather than crashing.
    }
  };

  return (
    <div
      className={cn(
        'border-line/60 flex items-center overflow-hidden rounded-lg border bg-bg/60',
        className,
      )}
    >
      <span className="text-surface/80 flex-1 truncate px-3 py-2 font-mono text-sm">
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="border-line/60 text-muted hover:text-accent inline-flex h-9 shrink-0 items-center gap-1.5 border-s px-3 text-xs transition-colors"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  );
}
