'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Props {
  /** Render-prop for the trigger. Receives `open` and `toggle`. */
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  /** Tailwind classes for the floating panel. */
  panelClassName?: string;
  /** Vertical placement relative to trigger. */
  placement?: 'top' | 'bottom';
  /** Horizontal alignment. */
  align?: 'start' | 'end';
}

export function Popover({
  trigger,
  children,
  panelClassName,
  placement = 'bottom',
  align = 'start',
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-30 min-w-[14rem]',
            'border-line/60 rounded-xl border bg-paper p-1.5 shadow-lg shadow-ink/10',
            placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
            align === 'end' ? 'end-0' : 'start-0',
            panelClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

interface ItemProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
}

export function PopoverItem({ icon, label, description, href, onClick, destructive }: ItemProps) {
  const className = cn(
    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors',
    'hover:bg-surface/[0.05]',
    destructive ? 'text-accent-secondary' : 'text-surface',
  );
  const body = (
    <>
      {icon ? <span className="text-muted shrink-0">{icon}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{label}</span>
        {description ? (
          <span className="text-muted truncate text-xs">{description}</span>
        ) : null}
      </span>
    </>
  );
  if (href) {
    return (
      <a href={href} className={className}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

export function PopoverSeparator({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="text-muted px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </div>
    );
  }
  return <div className="border-line/60 my-1 border-t" />;
}
