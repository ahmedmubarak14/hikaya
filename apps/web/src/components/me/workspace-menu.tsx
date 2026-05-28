'use client';

import Image from 'next/image';
import {
  BarChart3,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { useTransition } from 'react';

import { signOutAction } from '@/lib/auth/actions';

import { Popover, PopoverItem, PopoverSeparator } from './popover';

interface Props {
  locale: string;
  user: {
    displayName: string;
    avatarUrl: string | null;
  };
  workspaceLabel: string;
  labels: {
    dashboard: string;
    analytics: string;
    network: string;
    portfolio: string;
    settings: string;
    switchWorkspace: string;
    help: string;
    logOut: string;
  };
}

export function WorkspaceMenu({ locale, user, workspaceLabel, labels }: Props) {
  const me = `/${locale}/me`;
  const initial = user.displayName.charAt(0).toUpperCase();
  const [isSigningOut, startSignOut] = useTransition();

  const handleSignOut = () => {
    startSignOut(() => {
      void signOutAction(locale as 'en' | 'ar');
    });
  };

  return (
    <Popover
      align="start"
      panelClassName="w-64"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="border-line/60 hover:bg-surface/[0.03] flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors"
        >
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="bg-accent/20 text-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {initial}
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-muted truncate text-[11px]">{workspaceLabel}</span>
            <span className="text-surface truncate text-sm font-medium">{user.displayName}</span>
          </span>
          <ChevronRight size={14} className="text-muted shrink-0" />
        </button>
      )}
    >
      <PopoverItem icon={<LayoutDashboard size={16} />} label={labels.dashboard} href={me} />
      <PopoverItem
        icon={<BarChart3 size={16} />}
        label={labels.analytics}
        href={`${me}/analytics`}
      />
      <PopoverItem icon={<Users size={16} />} label={labels.network} href={`${me}/messages`} />
      <PopoverItem
        icon={<ImageIcon size={16} />}
        label={labels.portfolio}
        href={`${me}/portfolio`}
      />
      <PopoverItem icon={<Settings size={16} />} label={labels.settings} href={`${me}/settings`} />
      <PopoverSeparator label={labels.switchWorkspace} />
      <PopoverItem
        icon={<HelpCircle size={16} />}
        label={labels.help}
        href={`/${locale}/terms`}
      />
      <PopoverItem
        icon={<LogOut size={16} />}
        label={isSigningOut ? `${labels.logOut}…` : labels.logOut}
        onClick={handleSignOut}
        destructive
      />
    </Popover>
  );
}
