'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true } | { ok: false; error: string };

export interface DocumentTemplateRow {
  id: string;
  ownerUserId: string;
  kind: string;
  nameEn: string;
  nameAr: string | null;
  bodyHtml: string;
  isPlatform: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * List all templates belonging to the current user.
 */
export async function listTemplatesAction(): Promise<DocumentTemplateRow[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('DocumentTemplate')
    .select('*')
    .eq('ownerUserId', session.user.id)
    .order('updatedAt', { ascending: false });

  if (error) {
    console.error('[templates/actions] listTemplatesAction error:', error.message);
    return [];
  }

  return (data ?? []) as DocumentTemplateRow[];
}

/**
 * Get a single template by ID.
 */
export async function getTemplateAction(id: string): Promise<DocumentTemplateRow | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('DocumentTemplate')
    .select('*')
    .eq('id', id)
    .eq('ownerUserId', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('[templates/actions] getTemplateAction error:', error.message);
    return null;
  }

  return data as DocumentTemplateRow | null;
}

/**
 * Create a new document template.
 */
export async function createTemplateAction(input: {
  nameEn: string;
  nameAr?: string;
  kind: 'QUOTE' | 'CONTRACT';
  bodyHtml: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  if (!input.nameEn.trim()) return { ok: false, error: 'INVALID_INPUT' };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const id = `dt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const { error } = await supabase.from('DocumentTemplate').insert({
    id,
    ownerUserId: session.user.id,
    kind: input.kind,
    nameEn: input.nameEn,
    nameAr: input.nameAr || null,
    bodyHtml: input.bodyHtml,
    isPlatform: false,
    createdAt: now,
    updatedAt: now,
  });

  if (error) {
    console.error('[templates/actions] createTemplateAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/templates');
  return { ok: true };
}

/**
 * Update an existing document template.
 */
export async function updateTemplateAction(
  id: string,
  input: {
    nameEn: string;
    nameAr?: string;
    kind: 'QUOTE' | 'CONTRACT';
    bodyHtml: string;
  },
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  if (!input.nameEn.trim()) return { ok: false, error: 'INVALID_INPUT' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('DocumentTemplate')
    .update({
      nameEn: input.nameEn,
      nameAr: input.nameAr || null,
      kind: input.kind,
      bodyHtml: input.bodyHtml,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('ownerUserId', session.user.id);

  if (error) {
    console.error('[templates/actions] updateTemplateAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/templates');
  return { ok: true };
}

/**
 * Delete a document template.
 */
export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('DocumentTemplate')
    .delete()
    .eq('id', id)
    .eq('ownerUserId', session.user.id);

  if (error) {
    console.error('[templates/actions] deleteTemplateAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/templates');
  return { ok: true };
}
