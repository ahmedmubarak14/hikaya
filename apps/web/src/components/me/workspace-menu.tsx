'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { useTransition } from 'react';

import { setActiveRole } from '@/lib/auth/active-role-actions';
import { signOutAction } from '@/lib/auth/actions';
import type { MockUserRole } from '@/lib/auth/mock-store';

import { Popover, PopoverItem, PopoverSeparator } from './popover';

import { cn } from '@/lib/utils';

interface Props {
  locale: string;
  user: {
    displayName: string;
    avatarUrl: string | null;
  };
  workspaceLabel: string;
  currentRole: MockUserRole;
  availableRoles: MockUserRole[];
  labels: {
    dashboard: string;
    analytics: string;
    network: string;
    portfolio: string;
    settings: string;
    switchWorkspace: string;
    help: string;
    logOut: string;
    roleCreator: string;
    roleStudioOwner: string;
    roleClient: string;
    addWorkspace: string;
  };
}

const ROLE_ICONS: Record<MockUserRole, typeof Sparkles> = {
  CREATOR: Sparkles,
  STUDIO_OWNER: Building2,
  CLIENT: Briefcase,
};

const KNOWN_ROLES = new Set<MockUserRole>(['CREATOR', 'STUDIO_OWNER', 'CLIENT']);

export function WorkspaceMenu({
  locale,
  user,
  workspaceLabel,
  currentRole,
  availableRoles,
  labels,
}: Props) {
  const router = useRouter();
  const me = `/${locale}/me`;
  const initial = user.displayName.charAt(0).toUpperCase();
  const [isSigningOut, startSignOut] = useTransition();
  const [isSwitching, startSwitch] = useTransition();

  // The DB UserRole enum includes ADMIN / AGENCY / RENTAL_COMPANY which this
  // menu doesn't render. Filter them out so we never try to look up an icon
  // for an unknown role (which would crash with "<undefined /> is not a valid
  // React element").
  const renderableRoles = availableRoles.filter((r) => KNOWN_ROLES.has(r));
  const safeCurrentRole: MockUserRole = KNOWN_ROLES.has(currentRole) ? currentRole : 'CLIENT';

  const roleLabels: Record<MockUserRole, string> = {
    CREATOR: labels.roleCreator,
    STUDIO_OWNER: labels.roleStudioOwner,
    CLIENT: labels.roleClient,
  };

  const handleSignOut = () => {
    startSignOut(() => {
      void signOutAction(locale as 'en' | 'ar');
    });
  };

  const handleSwitchRole = (role: MockUserRole) => {
    if (role === currentRole) return;
    startSwitch(async () => {
      await setActiveRole(role);
      router.refresh();
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
            <span className="text-muted truncate text-[11px]">{roleLabels[safeCurrentRole]}</span>
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
      <PopoverItem icon={<Users size={16} />} label={labels.network} href={`${me}/inbox?tab=messages`} />
      <PopoverItem
        icon={<ImageIcon size={16} />}
        label={labels.portfolio}
        href={`${me}/portfolio`}
      />
      <PopoverItem icon={<Settings size={16} />} label={labels.settings} href={`${me}/settings`} />

      <PopoverSeparator label={labels.switchWorkspace} />
      {renderableRoles.length > 1
        ? renderableRoles.map((role) => {
            const Icon = ROLE_ICONS[role];
            const isCurrent = role === safeCurrentRole;
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleSwitchRole(role)}
                disabled={isSwitching || isCurrent}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm transition-colors',
                  'hover:bg-surface/[0.05] disabled:cursor-default',
                  'text-surface',
                )}
              >
                <Icon size={16} className="text-muted shrink-0" />
                <span className="flex-1 truncate">{roleLabels[role]}</span>
                {isCurrent ? <Check size={14} className="text-accent shrink-0" /> : null}
              </button>
            );
          })
        : null}
      <PopoverItem
        icon={<Plus size={16} />}
        label={labels.addWorkspace}
        href={`/${locale}/me/workspaces/new`}
      />
      <PopoverSeparator />

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
