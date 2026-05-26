'use server';

import { revalidatePath } from 'next/cache';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

import type { CreatorService } from './types';

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Replace the entire services array on the creator's profile.
 * Each service is validated minimally server-side.
 */
export async function saveServicesAction(
  locale: Locale,
  services: CreatorService[],
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) return { ok: false, error: 'NO_CREATOR_PROFILE' };

  // Basic validation
  for (const s of services) {
    if (!s.nameEn || s.nameEn.length < 1) return { ok: false, error: 'INVALID_INPUT' };
    if (typeof s.priceHalalas !== 'number' || s.priceHalalas < 0)
      return { ok: false, error: 'INVALID_INPUT' };
  }

  if (services.length > 20) return { ok: false, error: 'TOO_MANY_SERVICES' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('CreatorProfile')
    .update({
      services: services,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', creator.id);

  if (error) {
    console.error('[services/actions] saveServicesAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/${creator.username}`);
  revalidatePath(`/${locale}/me/services`);
  revalidatePath(`/${locale}/me/portfolio`);

  return { ok: true };
}
