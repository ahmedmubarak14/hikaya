'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Ensure the current user owns the studio.
 * Returns the studioId or an error result.
 */
async function requireStudioOwner(): Promise<
  { ok: true; studioId: string; userId: string } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const { data: studio } = await supabase
    .from('StudioProfile')
    .select('id')
    .eq('userId', session.user.id)
    .maybeSingle();

  if (!studio) return { ok: false, error: 'NO_STUDIO' };

  return { ok: true, studioId: studio.id as string, userId: session.user.id };
}

/**
 * Invite a user to the studio by email.
 * Creates a StudioMember row linking the user to the studio.
 */
export async function inviteTeamMemberAction(
  email: string,
  role: 'admin' | 'photographer',
): Promise<ActionResult> {
  const auth = await requireStudioOwner();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!email || !email.includes('@')) return { ok: false, error: 'INVALID_EMAIL' };

  const supabase = await createClient();

  // Find the user by email
  const { data: user } = await supabase
    .from('User')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (!user) return { ok: false, error: 'USER_NOT_FOUND' };

  const userId = user.id as string;

  // Check not already a member
  const { data: existing } = await supabase
    .from('StudioMember')
    .select('id')
    .eq('studioId', auth.studioId)
    .eq('userId', userId)
    .maybeSingle();

  if (existing) return { ok: false, error: 'ALREADY_MEMBER' };

  // Look up their creator profile if they have one
  const { data: creatorProfile } = await supabase
    .from('CreatorProfile')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  const { error } = await supabase.from('StudioMember').insert({
    studioId: auth.studioId,
    userId,
    creatorProfileId: creatorProfile ? (creatorProfile.id as string) : null,
    isAdmin: role === 'admin',
    joinedAt: new Date().toISOString(),
  });

  if (error) {
    console.error('[studio/team-actions] inviteTeamMemberAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/studio');
  return { ok: true };
}

/**
 * Remove a team member from the studio.
 */
export async function removeTeamMemberAction(memberId: string): Promise<ActionResult> {
  const auth = await requireStudioOwner();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  // Verify the member belongs to this studio and is not the owner
  const { data: member } = await supabase
    .from('StudioMember')
    .select('id, userId, studioId')
    .eq('id', memberId)
    .maybeSingle();

  if (!member) return { ok: false, error: 'MEMBER_NOT_FOUND' };
  if ((member.studioId as string) !== auth.studioId) return { ok: false, error: 'NOT_OWNER' };
  if ((member.userId as string) === auth.userId) return { ok: false, error: 'CANNOT_REMOVE_SELF' };

  const { error } = await supabase.from('StudioMember').delete().eq('id', memberId);

  if (error) {
    console.error('[studio/team-actions] removeTeamMemberAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/studio');
  return { ok: true };
}

/**
 * Toggle a team member's admin/photographer role.
 */
export async function updateTeamMemberRoleAction(
  memberId: string,
  isAdmin: boolean,
): Promise<ActionResult> {
  const auth = await requireStudioOwner();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  // Verify the member belongs to this studio
  const { data: member } = await supabase
    .from('StudioMember')
    .select('id, userId, studioId')
    .eq('id', memberId)
    .maybeSingle();

  if (!member) return { ok: false, error: 'MEMBER_NOT_FOUND' };
  if ((member.studioId as string) !== auth.studioId) return { ok: false, error: 'NOT_OWNER' };

  const { error } = await supabase
    .from('StudioMember')
    .update({ isAdmin })
    .eq('id', memberId);

  if (error) {
    console.error('[studio/team-actions] updateTeamMemberRoleAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/studio');
  return { ok: true };
}
