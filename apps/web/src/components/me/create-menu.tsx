'use client';

import {
  CreditCard,
  FileText,
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  Sparkles,
} from 'lucide-react';

import { Popover, PopoverItem } from './popover';

interface Props {
  locale: string;
  labels: {
    create: string;
    post: string;
    project: string;
    product: string;
    service: string;
    paymentLink: string;
    invoice: string;
  };
}

export function CreateMenu({ locale, labels }: Props) {
  const me = `/${locale}/me`;
  return (
    <Popover
      align="start"
      panelClassName="w-56"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="bg-surface text-bg hover:bg-surface/90 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{labels.create}</span>
        </button>
      )}
    >
      <PopoverItem icon={<ImageIcon size={16} />} label={labels.post} href={`${me}/blog/new`} />
      <PopoverItem icon={<Sparkles size={16} />} label={labels.project} href={`${me}/studio`} />
      <PopoverItem icon={<Package size={16} />} label={labels.product} href={`${me}/store/new`} />
      <PopoverItem icon={<Layers size={16} />} label={labels.service} href={`${me}/services`} />
      <PopoverItem
        icon={<CreditCard size={16} />}
        label={labels.paymentLink}
        href={`${me}/quotes/new`}
      />
      <PopoverItem icon={<FileText size={16} />} label={labels.invoice} href={`${me}/quotes/new`} />
    </Popover>
  );
}
