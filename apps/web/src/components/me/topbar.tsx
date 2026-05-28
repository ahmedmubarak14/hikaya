import Image from 'next/image';
import Link from 'next/link';
import { Bell, HelpCircle } from 'lucide-react';

import { Logo } from '@hikaya/ui';

import { type Locale } from '@/i18n/config';

interface Props {
  locale: Locale;
  user: {
    displayName: string;
    email: string;
    avatarUrl: string | null;
    username: string | null;
  };
}

export function MeTopbar({ locale, user }: Props) {
  const initial = user.displayName.charAt(0).toUpperCase();
  const profileHref = user.username ? `/${locale}/${user.username}` : `/${locale}/me/portfolio`;

  return (
    <header className="border-line/60 flex h-14 items-center justify-between gap-4 border-b px-6">
      <Link href={`/${locale}/me`} className="text-surface inline-flex items-center lg:hidden">
        <Logo className="h-5 w-auto" />
      </Link>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Help"
          className="text-muted hover:text-surface hover:bg-surface/5 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        >
          <HelpCircle size={18} />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="text-muted hover:text-surface hover:bg-surface/5 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        >
          <Bell size={18} />
        </button>
        <Link
          href={profileHref}
          aria-label={user.displayName}
          className="ms-1 inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full"
        >
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="bg-accent/15 text-accent flex h-full w-full items-center justify-center text-sm font-semibold">
              {initial}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
