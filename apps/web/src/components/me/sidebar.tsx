'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Heart,
  Home,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutTemplate,
  MessageSquare,
  PenSquare,
  Receipt,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store as StoreIcon,
  Tag,
} from 'lucide-react';

import { Logo } from '@hikaya/ui';

import { cn } from '@/lib/utils';
import { type Locale } from '@/i18n/config';

import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  heading?: string;
  items: NavItem[];
};

interface Props {
  locale: Locale;
  labels: {
    home: string;
    portfolio: string;
    inquiries: string;
    messages: string;
    tools: string;
    blog: string;
    store: string;
    galleries: string;
    studio: string;
    services: string;
    jobs: string;
    quotes: string;
    contracts: string;
    templates: string;
    spaces: string;
    availability: string;
    discounts: string;
    settings: string;
    analytics: string;
    favorites: string;
    purchases: string;
    disputes: string;
  };
}

export function MeSidebar({ locale, labels }: Props) {
  const pathname = usePathname();
  const base = `/${locale}/me`;

  const groups: NavGroup[] = [
    {
      items: [
        { href: base, label: labels.home, icon: Home },
        { href: `${base}/portfolio`, label: labels.portfolio, icon: ImageIcon },
        { href: `${base}/inquiries`, label: labels.inquiries, icon: Inbox },
        { href: `${base}/messages`, label: labels.messages, icon: MessageSquare },
      ],
    },
    {
      heading: labels.tools,
      items: [
        { href: `${base}/studio`, label: labels.studio, icon: Building2 },
        { href: `${base}/services`, label: labels.services, icon: Layers },
        { href: `${base}/jobs`, label: labels.jobs, icon: Briefcase },
        { href: `${base}/quotes`, label: labels.quotes, icon: Receipt },
        { href: `${base}/contracts`, label: labels.contracts, icon: FileText },
        { href: `${base}/templates`, label: labels.templates, icon: LayoutTemplate },
        { href: `${base}/availability`, label: labels.availability, icon: Calendar },
        { href: `${base}/discounts`, label: labels.discounts, icon: Tag },
        { href: `${base}/blog`, label: labels.blog, icon: PenSquare },
        { href: `${base}/store`, label: labels.store, icon: StoreIcon },
        { href: `${base}/galleries`, label: labels.galleries, icon: ImageIcon },
        { href: `${base}/spaces`, label: labels.spaces, icon: Home },
      ],
    },
    {
      items: [
        { href: `${base}/analytics`, label: labels.analytics, icon: BarChart3 },
        { href: `${base}/favorites`, label: labels.favorites, icon: Heart },
        { href: `${base}/purchases`, label: labels.purchases, icon: ShoppingBag },
        { href: `${base}/disputes`, label: labels.disputes, icon: ShieldAlert },
        { href: `${base}/settings`, label: labels.settings, icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="border-line/60 hidden w-60 shrink-0 flex-col border-e bg-bg/40 lg:flex">
      <div className="px-6 py-5">
        <Link href={`/${locale}`} className="text-surface inline-flex items-center">
          <Logo className="h-6 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((group, gi) => (
          <div key={gi} className="mb-5">
            {group.heading ? (
              <p className="text-muted px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider">
                {group.heading}
              </p>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-surface/[0.06] text-surface font-medium'
                          : 'text-surface/70 hover:bg-surface/[0.04] hover:text-surface',
                      )}
                    >
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.25 : 2}
                        className={cn(
                          active ? 'text-accent' : 'text-surface/50 group-hover:text-surface/80',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
