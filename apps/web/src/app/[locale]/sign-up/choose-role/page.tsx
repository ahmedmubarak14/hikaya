import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Briefcase, Building2, Sparkles } from 'lucide-react';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { chooseRoleAction } from '@/lib/auth/choose-role-actions';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('chooseRoleTitle') };
}

const OPTIONS = [
  { role: 'CLIENT', icon: Briefcase, labelKey: 'roleClient', hintKey: 'roleClientHint' },
  { role: 'CREATOR', icon: Sparkles, labelKey: 'roleCreator', hintKey: 'roleCreatorHint' },
  { role: 'STUDIO_OWNER', icon: Building2, labelKey: 'roleStudioOwner', hintKey: 'roleStudioOwnerHint' },
] as const;

export default async function ChooseRolePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('auth');

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <header className="mb-8 text-center">
        <h1 className="text-surface text-3xl font-semibold tracking-tight">{t('chooseRoleTitle')}</h1>
        <p className="text-muted mt-2 text-sm">{t('chooseRoleBody')}</p>
      </header>

      <ul className="flex flex-col gap-3">
        {OPTIONS.map(({ role, icon: Icon, labelKey, hintKey }) => (
          <li key={role}>
            <form action={chooseRoleAction.bind(null, locale, role)}>
              <button
                type="submit"
                className="border-line/60 hover:border-surface/40 hover:bg-surface/[0.03] group flex w-full items-center gap-4 rounded-xl border bg-paper p-5 text-start transition-colors"
              >
                <span className="bg-accent/15 text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
                  <Icon size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-surface text-sm font-medium">{t(labelKey)}</span>
                  <span className="text-muted text-xs leading-relaxed">{t(hintKey)}</span>
                </span>
                <span className="text-muted group-hover:text-surface shrink-0 text-xs transition-colors">
                  →
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
