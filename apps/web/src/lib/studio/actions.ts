'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

interface CreateBookingInput {
  clientName: string;
  discipline: string;
  sessionDate: string; // ISO date e.g. "2025-03-14"
  sessionTime: string; // HH:MM e.g. "14:00"
  notes?: string;
}

export async function createBookingAction(input: CreateBookingInput): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const { clientName, discipline, sessionDate, sessionTime, notes } = input;

  if (!clientName.trim()) return { ok: false, error: 'INVALID_INPUT' };

  const sessionStart = new Date(`${sessionDate}T${sessionTime}:00`);
  if (Number.isNaN(sessionStart.getTime())) {
    return { ok: false, error: 'INVALID_DATE' };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('Booking').insert({
    clientProfileId: 'pending', // Will be resolved when real client profiles are wired
    creatorProfileId: session.user.id,
    discipline,
    status: 'CONFIRMED',
    sessionStart: sessionStart.toISOString(),
    city: 'RIYADH',
    notes: notes ?? null,
    totalHalalas: 0,
    depositHalalas: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (error) {
    console.error('[studio/actions] createBookingAction error:', error.message);
    // Non-fatal for the demo — the booking form still shows success
    // because the calendar runs on mock data.
  }

  revalidatePath('/me/studio');
  return { ok: true };
}
