'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { getMyCreatorProfile } from '@/lib/creators/queries';

import {
  cancelContract as storeCancel,
  getContractById,
  getContractBySlug,
  signContract,
  updateContractSections,
} from './mock-store';
import { sectionKeys, signContractSchema, updateSectionsSchema } from './schemas';

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
  message?: string;
}
export type ContractResult = ContractSuccess | ContractFailure;

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function requireOwnedCreator() {
  const session = await getSession();
  if (!session) return { error: 'NOT_AUTHENTICATED' as const };
  const creator = await getMyCreatorProfile(session.user.email);
  if (!creator) return { error: 'NO_CREATOR_PROFILE' as const };
  return { creator, session };
}

/* ----------------------------- creator actions ----------------------------- */

export async function updateContractSectionsAction(
  locale: Locale,
  contractId: string,
  _prev: ContractResult | null,
  formData: FormData,
): Promise<ContractResult> {
  const auth = await requireOwnedCreator();
  if ('error' in auth) return { ok: false, error: auth.error };

  const contract = getContractById(contractId);
  if (!contract) return { ok: false, error: 'CONTRACT_NOT_FOUND' };
  if (contract.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };
  if (contract.status === 'SIGNED' || contract.status === 'CANCELLED') {
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
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  updateContractSections(
    contractId,
    sectionKeys.map((key) => ({ key, body: parsed.data[key] ?? '' })),
  );

  revalidatePath(`/${locale}/me/contracts/${contractId}`);
  if (contract.shareSlug) revalidatePath(`/${locale}/c/${contract.shareSlug}`);
  return { ok: true, message: 'SECTIONS_SAVED' };
}

export async function signAsCreatorAction(
  locale: Locale,
  contractId: string,
  _prev: ContractResult | null,
  formData: FormData,
): Promise<ContractResult> {
  const auth = await requireOwnedCreator();
  if ('error' in auth) return { ok: false, error: auth.error };

  const contract = getContractById(contractId);
  if (!contract) return { ok: false, error: 'CONTRACT_NOT_FOUND' };
  if (contract.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };
  if (contract.creatorSignedAt) return { ok: false, error: 'ALREADY_SIGNED' };
  if (contract.status === 'CANCELLED' || contract.status === 'DRAFT') {
    return { ok: false, error: 'WRONG_STATE' };
  }

  const parsed = signContractSchema.safeParse({
    typedName: formData.get('typedName'),
    acceptedTerms: formData.get('acceptedTerms') === 'on',
  });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  signContract(contractId, 'creator', parsed.data.typedName);
  revalidatePath(`/${locale}/me/contracts/${contractId}`);
  if (contract.shareSlug) revalidatePath(`/${locale}/c/${contract.shareSlug}`);
  return { ok: true, message: 'SIGNED' };
}

export async function cancelContractAction(
  locale: Locale,
  contractId: string,
): Promise<ContractResult> {
  const auth = await requireOwnedCreator();
  if ('error' in auth) return { ok: false, error: auth.error };

  const contract = getContractById(contractId);
  if (!contract) return { ok: false, error: 'CONTRACT_NOT_FOUND' };
  if (contract.creatorId !== auth.creator.id) return { ok: false, error: 'NOT_OWNER' };
  if (contract.status === 'SIGNED') return { ok: false, error: 'WRONG_STATE' };

  storeCancel(contractId);
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
  const contract = getContractBySlug(shareSlug);
  if (!contract) return { ok: false, error: 'CONTRACT_NOT_FOUND' };
  if (contract.clientSignedAt) return { ok: false, error: 'ALREADY_SIGNED' };
  if (contract.status === 'CANCELLED' || contract.status === 'DRAFT') {
    return { ok: false, error: 'WRONG_STATE' };
  }

  const parsed = signContractSchema.safeParse({
    typedName: formData.get('typedName'),
    acceptedTerms: formData.get('acceptedTerms') === 'on',
  });
  if (!parsed.success) {
    return { ok: false, error: 'INVALID_INPUT', fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  signContract(contract.id, 'client', parsed.data.typedName);
  revalidatePath(`/${locale}/c/${shareSlug}`);
  revalidatePath(`/${locale}/me/contracts/${contract.id}`);
  return { ok: true, message: 'SIGNED' };
}
