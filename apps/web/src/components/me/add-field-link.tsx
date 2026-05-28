import Link from 'next/link';
import { Plus } from 'lucide-react';
import { type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type BaseProps = {
  label: string;
  className?: string;
};

type LinkProps = BaseProps & { href: string; onClick?: never };
type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & { href?: undefined };

export function AddFieldLink(props: LinkProps | ButtonProps) {
  const { label, className } = props;
  const classes = cn(
    'text-muted hover:text-surface inline-flex items-center gap-1.5 text-sm transition-colors',
    className,
  );
  const content = (
    <>
      <Plus size={14} strokeWidth={2} />
      <span>{label}</span>
    </>
  );

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const { href: _h, label: _l, className: _c, ...rest } = props as ButtonProps;
  void _h;
  void _l;
  void _c;
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
