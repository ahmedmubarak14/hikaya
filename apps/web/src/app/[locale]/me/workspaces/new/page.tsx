import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Building2, Sparkles } from 'lucide-react';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { addWorkspaceAction } from '@/lib/auth/workspace-actions';

import type { Metadata } from 'next';
import type { MockUserRole } from '@/lib/auth/mock-store';

interface Props {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'workspaces' });
  return { title: t('newTitle') };
}

export default async function AddWorkspacePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in?next=/${locale}/me/workspaces/new`);

  const t = await getTranslations('workspaces');
  const tAuth = await getTranslations('auth');

  const existing = new Set(session.user.roles);

  const options: Array<{
    role: MockUserRole;
    title: string;
    body: string;
    Icon: typeof Sparkles;
  }> = [
    {
      role: 'CREATOR',
      title: tAuth('roleCreator'),
      body: t('creatorBody'),
      Icon: Sparkles,
    },
    {
      role: 'STUDIO_OWNER',
      title: tAuth('roleStudioOwner'),
      body: t('studioBody'),
      Icon: Building2,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10">
      <Link
        href={`/${locale}/me`}
        className="text-muted hover:text-surface text-xs transition-colors"
      >
        ← {t('back')}
      </Link>

      <header className="mb-8 mt-4">
        <h1 className="text-surface text-3xl font-semibold tracking-tight">{t('newTitle')}</h1>
        <p className="text-muted mt-2 text-sm">{t('newBody')}</p>
      </header>

      {error ? (
        <p className="border-orange/30 bg-orange/10 text-orange mb-6 rounded-lg border px-4 py-3 text-sm">
          {t(`errors.${error}` as 'errors.INVALID_ROLE')}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {options.map(({ role, title, body, Icon }) => {
          const alreadyHas = existing.has(role);
          return (
            <li key={role}>
              <form action={addWorkspaceAction.bind(null, locale, role)}>
                <button
                  type="submit"
                  disabled={alreadyHas}
                  className="border-line/60 hover:border-surface/40 hover:bg-surface/[0.03] disabled:cursor-not-allowed group flex w-full items-center gap-4 rounded-xl border bg-paper p-5 text-start transition-colors disabled:opacity-60"
                >
                  <span className="bg-accent/15 text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
                    <Icon size={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-surface flex items-center gap-2 text-sm font-medium">
                      {title}
                      {alreadyHas ? (
                        <span className="text-muted text-xs">· {t('alreadyHave')}</span>
                      ) : null}
                    </span>
                    <span className="text-muted text-xs leading-relaxed">{body}</span>
                  </span>
                  {!alreadyHas ? (
                    <span className="text-muted group-hover:text-surface shrink-0 text-xs transition-colors">
                      →
                    </span>
                  ) : null}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
