'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Badge, Button, Input } from '@hikaya/ui';

import {
  inviteTeamMemberAction,
  removeTeamMemberAction,
  updateTeamMemberRoleAction,
} from '@/lib/studio/team-actions';

export interface TeamMember {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  joinedAt: string;
}

interface Props {
  members: TeamMember[];
  isOwner: boolean;
}

export function TeamManager({ members, isOwner }: Props) {
  const t = useTranslations('studioTeam');
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'photographer'>('photographer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInvite = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await inviteTeamMemberAction(email, role);
      if (result.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(result.error);
      }
    });
  };

  const handleRemove = (memberId: string) => {
    startTransition(async () => {
      await removeTeamMemberAction(memberId);
    });
  };

  const handleToggleRole = (memberId: string, currentIsAdmin: boolean) => {
    startTransition(async () => {
      await updateTeamMemberRoleAction(memberId, !currentIsAdmin);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-surface text-2xl">{t('title')}</h2>
        <span className="text-2xs text-surface/40">
          {t('count', { count: members.length })}
        </span>
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="border-surface/10 bg-surface/[0.03] rounded-lg border p-6 text-center">
          <p className="text-surface/60 text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="border-surface/10 divide-surface/10 overflow-hidden rounded-xl border divide-y">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-surface text-sm font-medium">{member.displayName}</span>
                  <Badge tone={member.isAdmin ? 'accent' : 'neutral'}>
                    {member.isAdmin ? t('roleAdmin') : t('rolePhotographer')}
                  </Badge>
                </div>
                <span className="text-surface/50 text-xs">{member.email}</span>
                <span className="text-surface/30 text-2xs">
                  {t('joinedAt', { date: new Date(member.joinedAt).toLocaleDateString() })}
                </span>
              </div>

              {isOwner ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleRole(member.id, member.isAdmin)}
                    disabled={isPending}
                    className="text-accent-secondary hover:text-accent-secondary/80 text-xs disabled:opacity-50"
                  >
                    {member.isAdmin ? t('makePhotographer') : t('makeAdmin')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(member.id)}
                    disabled={isPending}
                    className="text-accent-secondary hover:text-accent-secondary/80 text-xs disabled:opacity-50"
                  >
                    {t('remove')}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      {isOwner ? (
        <div className="border-surface/10 bg-surface/[0.02] rounded-xl border p-5">
          <h3 className="text-surface mb-4 text-lg">{t('inviteTitle')}</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label={t('emailLabel')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
              />
            </div>
            <div className="w-full sm:w-40">
              <label className="text-surface/70 mb-1 block text-xs">{t('roleLabel')}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'photographer')}
                className="border-surface/15 bg-bg text-surface w-full rounded-lg border px-3 py-2.5 text-sm"
              >
                <option value="photographer">{t('rolePhotographer')}</option>
                <option value="admin">{t('roleAdmin')}</option>
              </select>
            </div>
            <Button type="button" size="md" onClick={handleInvite} isLoading={isPending}>
              {t('inviteCta')}
            </Button>
          </div>
          {error ? (
            <p className="text-accent-secondary mt-2 text-xs">{t(`errors.${error}` as 'errors.USER_NOT_FOUND')}</p>
          ) : null}
          {success ? (
            <p className="text-sage mt-2 text-xs">{t('inviteSuccess')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
