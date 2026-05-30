'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  ChevronDown,
  Compass,
  CreditCard,
  Home,
  Inbox,
  User,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

import { Logo } from '@hikaya/ui';

import { cn } from '@/lib/utils';
import { type Locale } from '@/i18n/config';

import { CreateMenu } from './create-menu';
import { ProfileCompletion } from './profile-completion';
import { WorkspaceMenu } from './workspace-menu';

import type { MockUserRole } from '@/lib/auth/mock-store';
import type { LucideIcon } from 'lucide-react';

type SimpleItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  trailing?: string;
};

type GroupItem = {
  label: string;
  icon: LucideIcon;
  children: SimpleItem[];
};

type NavEntry = SimpleItem | GroupItem;

function isGroup(entry: NavEntry): entry is GroupItem {
  return 'children' in entry;
}

interface Props {
  locale: Locale;
  user: {
    displayName: string;
    avatarUrl: string | null;
  };
  workspaceLabel: string;
  currentRole: MockUserRole;
  availableRoles: MockUserRole[];
  completionPercent: number;
  unreadNotifications: number;
  labels: {
    completeProfile: string;
    create: string;
    home: string;
    profile: string;
    inbox: string;
    inquiries: string;
    messages: string;
    notifications: string;
    wallet: string;
    payments: string;
    discover: string;
    jobs: string;
    // Children
    portfolio: string;
    studio: string;
    quotes: string;
    contracts: string;
    purchases: string;
    billing: string;
    discounts: string;
    people: string;
    studios: string;
    services: string;
    promoTitle: string;
    promoCta: string;
    // Popover labels
    create_post: string;
    create_project: string;
    create_product: string;
    create_service: string;
    create_paymentLink: string;
    create_invoice: string;
    ws_dashboard: string;
    ws_analytics: string;
    ws_network: string;
    ws_portfolio: string;
    ws_settings: string;
    ws_switchWorkspace: string;
    ws_help: string;
    ws_logOut: string;
    ws_roleCreator: string;
    ws_roleStudioOwner: string;
    ws_roleClient: string;
    ws_addWorkspace: string;
  };
}

export function MeSidebar({
  locale,
  user,
  workspaceLabel,
  currentRole,
  availableRoles,
  completionPercent,
  unreadNotifications,
  labels,
}: Props) {
  const pathname = usePathname();
  const base = `/${locale}/me`;

  const entries: NavEntry[] = [
    { href: base, label: labels.home, icon: Home },
    { href: `${base}/portfolio`, label: labels.profile, icon: User },
    {
      href: `${base}/inbox`,
      label: labels.inbox,
      icon: Inbox,
      trailing: unreadNotifications > 0 ? String(unreadNotifications) : undefined,
    },
    { href: `${base}/purchases`, label: labels.wallet, icon: Wallet },
    {
      label: labels.payments,
      icon: CreditCard,
      children: [
        { href: `${base}/quotes`, label: labels.quotes, icon: CreditCard },
        { href: `${base}/contracts`, label: labels.contracts, icon: CreditCard },
        { href: `${base}/discounts`, label: labels.discounts, icon: CreditCard },
        { href: `${base}/billing`, label: labels.billing, icon: CreditCard },
      ],
    },
    { href: `${base}/discover`, label: labels.discover, icon: Compass },
    { href: `${base}/jobs`, label: labels.jobs, icon: Briefcase },
  ];

  const initialOpen: Record<string, boolean> = {};
  for (const e of entries) {
    if (isGroup(e)) {
      initialOpen[e.label] = e.children.some(
        (c) => pathname === c.href || pathname.startsWith(`${c.href}/`),
      );
    }
  }
  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);

  const isActive = (href: string) => {
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="bg-paper hidden w-60 shrink-0 flex-col lg:flex">
      <div className="px-6 py-5">
        <Link href={`/${locale}`} className="text-surface inline-flex items-center">
          <Logo className="h-5 w-auto" />
        </Link>
      </div>

      <div className="px-3">
        <WorkspaceMenu
          locale={locale}
          user={user}
          workspaceLabel={workspaceLabel}
          currentRole={currentRole}
          availableRoles={availableRoles}
          labels={{
            dashboard: labels.ws_dashboard,
            analytics: labels.ws_analytics,
            network: labels.ws_network,
            portfolio: labels.ws_portfolio,
            settings: labels.ws_settings,
            switchWorkspace: labels.ws_switchWorkspace,
            help: labels.ws_help,
            logOut: labels.ws_logOut,
            roleCreator: labels.ws_roleCreator,
            roleStudioOwner: labels.ws_roleStudioOwner,
            roleClient: labels.ws_roleClient,
            addWorkspace: labels.ws_addWorkspace,
          }}
        />

        <div className="mt-3">
          <ProfileCompletion
            percent={completionPercent}
            label={labels.completeProfile}
            href={`${base}/portfolio`}
          />
        </div>

        <div className="mt-3">
          <CreateMenu
            locale={locale}
            labels={{
              create: labels.create,
              post: labels.create_post,
              project: labels.create_project,
              product: labels.create_product,
              service: labels.create_service,
              paymentLink: labels.create_paymentLink,
              invoice: labels.create_invoice,
            }}
          />
        </div>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-6">
        <ul className="flex flex-col gap-0.5">
          {entries.map((entry, i) => {
            if (isGroup(entry)) {
              const Icon = entry.icon;
              const isOpen = open[entry.label];
              const groupActive = entry.children.some((c) => isActive(c.href));
              return (
                <li key={`g-${i}`}>
                  <button
                    type="button"
                    onClick={() => setOpen((o) => ({ ...o, [entry.label]: !o[entry.label] }))}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      groupActive
                        ? 'text-surface font-medium'
                        : 'text-surface/70 hover:text-surface',
                    )}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className={cn(groupActive ? 'text-surface' : 'text-surface/60')}
                    />
                    <span className="flex-1 text-start">{entry.label}</span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-muted transition-transform',
                        isOpen ? 'rotate-0' : '-rotate-90 rtl:rotate-90',
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <ul className="ms-7 mt-0.5 flex flex-col gap-0.5">
                      {entry.children.map((c) => {
                        const active = isActive(c.href);
                        return (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              className={cn(
                                'block rounded-md px-3 py-1.5 text-sm transition-colors',
                                active
                                  ? 'bg-surface/[0.05] text-surface font-medium'
                                  : 'text-surface/70 hover:text-surface',
                              )}
                            >
                              {c.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            }

            const Icon = entry.icon;
            const active = isActive(entry.href);
            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'text-surface font-medium'
                      : 'text-surface/70 hover:text-surface',
                  )}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.75}
                    className={cn(active ? 'text-surface' : 'text-surface/60')}
                  />
                  <span className="flex-1">{entry.label}</span>
                  {entry.trailing ? (
                    <span className="text-muted text-xs">{entry.trailing}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-4">
        <Link
          href={`/${locale}/me/portfolio`}
          className="bg-accent/15 border-accent/20 hover:bg-accent/20 flex items-center gap-3 rounded-xl border p-3 transition-colors"
        >
          <div className="bg-accent/30 text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm">
            ✦
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-surface truncate text-xs font-medium">{labels.promoTitle}</span>
            <span className="text-muted truncate text-[11px]">{labels.promoCta} →</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
