import { type Locale } from '@/i18n/config';
import { formatDateTime } from '@/lib/format';
import type { SignatureAuditEntry } from '@/lib/contracts/mock-data';

interface Props {
  entries: SignatureAuditEntry[];
  locale: Locale;
  title: string;
  creatorLabel: string;
  clientLabel: string;
  signedAtLabel: string;
  ipLabel: string;
}

export function SignatureAuditLog({
  entries,
  locale,
  title,
  creatorLabel,
  clientLabel,
  signedAtLabel,
  ipLabel,
}: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-surface/50 text-sm font-medium">{title}</h3>
      <div className="border-surface/10 relative flex flex-col gap-0 border-l-2 pl-4">
        {entries.map((entry, i) => (
          <div key={i} className="relative pb-4 last:pb-0">
            {/* Timeline dot */}
            <div className="bg-accent-secondary absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full" />
            <div className="flex flex-col gap-0.5">
              <span className="text-surface text-sm font-medium">
                {entry.side === 'creator' ? creatorLabel : clientLabel}
                {' — '}
                {entry.name}
              </span>
              <span className="text-surface/50 text-xs">
                {signedAtLabel} {formatDateTime(entry.signedAt, locale)}
              </span>
              <span className="text-surface/40 font-mono text-xs">
                {ipLabel} {entry.ip}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
