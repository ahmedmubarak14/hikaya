'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';
import { createClient } from '@/lib/supabase/server';

import { sectionKeys, signContractSchema, updateSectionsSchema } from './schemas';

/**
 * Read the client IP address from request headers.
 */
async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  );
}

export type ContractErrorKey =
  | 'INVALID_INPUT'
  | 'NOT_AUTHENTICATED'
  | 'NO_CREATOR_PROFILE'
  | 'CONTRACT_NOT_FOUND'
  | 'NOT_OWNER'
  | 'WRONG_STATE'
  | 'ALREADY_SIGNED'
  | 'UNKNOWN';

export interface ContractFailure {
  ok: false;
  error: ContractErrorKey;
  fieldErrors?: Record<string, string>;
}
export interface ContractSuccess {
  ok: true;
  error?: undefined;
  fieldErrors?: undefined;
  message?: string;
}
export type ContractResult = ContractSuccess | ContractFailure;

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function requireOwnedCreator() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: 'NOT_AUTHENTICATED' as const };
  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) return { ok: false as const, error: 'NO_CREATOR_PROFILE' as const };
  return { ok: true as const, creator, session };
}

/* ----------------------------- creator actions ----------------------------- */

export async function updateContractSectionsAction(
  locale: Locale,
  contractId: string,
  _prev: ContractResult | null,
  formData: FormData,
): Promise<ContractResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: contract, error: fetchErr } = await supabase
    .from('Contract')
    .select('id, creatorId, status, shareSlug')
    .eq('id', contractId)
    .maybeSingle();

  if (fetchErr || !contract) return { ok: false, error: 'CONTRACT_NOT_FOUND' };
  if ((contract.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };
  if ((contract.status as string) === 'SIGNED' || (contract.status as string) === 'CANCELLED') {
    return { ok: false, error: 'WRONG_STATE' };
  }

  const parsed = updateSectionsSchema.safeParse({
    scopeOfWork: formData.get('scopeOfWork'),
    deliverables: formData.get('deliverables'),
    paymentTerms: formData.get('paymentTerms'),
    cancellationPolicy: formData.get('cancellationPolicy'),
    usageRights: formData.get('usageRights'),
    additionalTerms: formData.get('additionalTerms') || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const sections = sectionKeys.map((key) => ({ key, body: parsed.data[key] ?? '' }));

  const { error: updateErr } = await supabase
    .from('Contract')
    .update({ sections, updatedAt: new Date().toISOString() })
    .eq('id', contractId);

  if (updateErr) {
    console.error('[contracts/actions] updateContractSectionsAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/contracts/${contractId}`);
  if (contract.shareSlug) revalidatePath(`/${locale}/c/${contract.shareSlug as string}`);
  return { ok: true, message: 'SECTIONS_SAVED' };
}

export async function signAsCreatorAction(
  locale: Locale,
  contractId: string,
  _prev: ContractResult | null,
  formData: FormData,
): Promise<ContractResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: contract, error: fetchErr } = await supabase
    .from('Contract')
    .select('id, creatorId, status, shareSlug, creatorSignedAt, clientSignedAt, signatureAuditLog')
    .eq('id', contractId)
    .maybeSingle();

  if (fetchErr || !contract) return { ok: false, error: 'CONTRACT_NOT_FOUND' };
  if ((contract.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };
  if (contract.creatorSignedAt) return { ok: false, error: 'ALREADY_SIGNED' };
  if ((contract.status as string) === 'CANCELLED' || (contract.status as string) === 'DRAFT') {
    return { ok: false, error: 'WRONG_STATE' };
  }

  const parsed = signContractSchema.safeParse({
    typedName: formData.get('typedName'),
    acceptedTerms: formData.get('acceptedTerms') === 'on',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const now = new Date().toISOString();
  const ip = await getClientIp();
  const bothSigned = !!contract.clientSignedAt;
  const newStatus = bothSigned ? 'SIGNED' : 'CREATOR_SIGNED';

  // Build audit log entry
  const existingAudit = (contract as Record<string, unknown>).signatureAuditLog;
  const auditLog: Record<string, unknown>[] = Array.isArray(existingAudit)
    ? [...(existingAudit as Record<string, unknown>[])]
    : [];
  auditLog.push({
    side: 'creator',
    name: parsed.data.typedName,
    signedAt: now,
    ip,
  });

  const { error: updateErr } = await supabase
    .from('Contract')
    .update({
      creatorSignedName: parsed.data.typedName,
      creatorSignedAt: now,
      status: newStatus,
      signatureAuditLog: auditLog,
      updatedAt: now,
    })
    .eq('id', contractId);

  if (updateErr) {
    console.error('[contracts/actions] signAsCreatorAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/contracts/${contractId}`);
  if (contract.shareSlug) revalidatePath(`/${locale}/c/${contract.shareSlug as string}`);
  return { ok: true, message: 'SIGNED' };
}

export async function cancelContractAction(
  locale: Locale,
  contractId: string,
): Promise<ContractResult> {
  const auth = await requireOwnedCreator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = await createClient();

  const { data: contract, error: fetchErr } = await supabase
    .from('Contract')
    .select('id, creatorId, status')
    .eq('id', contractId)
    .maybeSingle();

  if (fetchErr || !contract) return { ok: false, error: 'CONTRACT_NOT_FOUND' };
  if ((contract.creatorId as string) !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };
  if ((contract.status as string) === 'SIGNED') return { ok: false, error: 'WRONG_STATE' };

  const { error: updateErr } = await supabase
    .from('Contract')
    .update({ status: 'CANCELLED', updatedAt: new Date().toISOString() })
    .eq('id', contractId);

  if (updateErr) {
    console.error('[contracts/actions] cancelContractAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/contracts`);
  redirect(`/${locale}/me/contracts`);
}

/* ------------------------------- public action ----------------------------- */

export async function signAsClientAction(
  locale: Locale,
  shareSlug: string,
  _prev: ContractResult | null,
  formData: FormData,
): Promise<ContractResult> {
  const supabase = await createClient();

  const { data: contract, error: fetchErr } = await supabase
    .from('Contract')
    .select('id, status, shareSlug, clientSignedAt, creatorSignedAt, signatureAuditLog')
    .eq('shareSlug', shareSlug)
    .maybeSingle();

  if (fetchErr || !contract) return { ok: false, error: 'CONTRACT_NOT_FOUND' };
  if (contract.clientSignedAt) return { ok: false, error: 'ALREADY_SIGNED' };
  if ((contract.status as string) === 'CANCELLED' || (contract.status as string) === 'DRAFT') {
    return { ok: false, error: 'WRONG_STATE' };
  }

  const parsed = signContractSchema.safeParse({
    typedName: formData.get('typedName'),
    acceptedTerms: formData.get('acceptedTerms') === 'on',
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'INVALID_INPUT',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const now = new Date().toISOString();
  const ip = await getClientIp();
  const bothSigned = !!contract.creatorSignedAt;
  const newStatus = bothSigned ? 'SIGNED' : 'CLIENT_SIGNED';

  // Build audit log entry
  const existingAudit = (contract as Record<string, unknown>).signatureAuditLog;
  const auditLog: Record<string, unknown>[] = Array.isArray(existingAudit)
    ? [...(existingAudit as Record<string, unknown>[])]
    : [];
  auditLog.push({
    side: 'client',
    name: parsed.data.typedName,
    signedAt: now,
    ip,
  });

  const { error: updateErr } = await supabase
    .from('Contract')
    .update({
      clientSignedName: parsed.data.typedName,
      clientSignedAt: now,
      status: newStatus,
      signatureAuditLog: auditLog,
      updatedAt: now,
    })
    .eq('id', contract.id as string);

  if (updateErr) {
    console.error('[contracts/actions] signAsClientAction error:', updateErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/c/${shareSlug}`);
  revalidatePath(`/${locale}/me/contracts/${contract.id as string}`);
  return { ok: true, message: 'SIGNED' };
}
