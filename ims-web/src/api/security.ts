import { apiFetch, probeApiHealth } from './client';

export interface EditDeletePolicy {
  confirmationRequired: boolean;
}

let cachedPolicy: EditDeletePolicy | null = null;
let cacheExpiresAt = 0;
const POLICY_TTL_MS = 30_000;

/** WPF: ImsApiClient.GetEditDeleteConfirmationPolicyAsync */
export async function fetchEditDeletePolicy(): Promise<EditDeletePolicy> {
  if (cachedPolicy && Date.now() < cacheExpiresAt) {
    return cachedPolicy;
  }

  try {
    const apiUp = await probeApiHealth();
    if (!apiUp) {
      cachedPolicy = { confirmationRequired: true };
      cacheExpiresAt = Date.now() + POLICY_TTL_MS;
      return cachedPolicy;
    }

    const policy = await apiFetch<EditDeletePolicy>('/api/security/edit-delete-password/policy');
    cachedPolicy = { confirmationRequired: policy.confirmationRequired !== false };
    cacheExpiresAt = Date.now() + POLICY_TTL_MS;
    return cachedPolicy;
  } catch {
    cachedPolicy = { confirmationRequired: true };
    cacheExpiresAt = Date.now() + POLICY_TTL_MS;
    return cachedPolicy;
  }
}

export function invalidateEditDeletePolicyCache(): void {
  cachedPolicy = null;
  cacheExpiresAt = 0;
}

export interface EditDeletePasswordStatus {
  configured: boolean;
  confirmationRequired: boolean;
  updatedAt: string | null;
  updatedBy: string;
}

export async function fetchEditDeletePasswordStatus(): Promise<EditDeletePasswordStatus> {
  return apiFetch<EditDeletePasswordStatus>('/api/security/edit-delete-password/status');
}

export async function updateEditDeleteSecuritySettings(params: {
  confirmationRequired?: boolean;
  newPassword?: string;
}): Promise<{ success?: boolean; message?: string }> {
  const result = await apiFetch<{ success?: boolean; message?: string }>(
    '/api/security/edit-delete-password',
    {
      method: 'PUT',
      body: JSON.stringify(params),
    },
  );
  invalidateEditDeletePolicyCache();
  return result;
}

/** WPF: ImsApiClient.VerifyEditDeletePasswordAsync */
export async function verifyEditDeletePassword(params: {
  password: string;
  action: 'edit' | 'delete';
  module: string;
  recordKey: string;
}): Promise<boolean> {
  try {
    const apiUp = await probeApiHealth();
    if (!apiUp) return false;

    const result = await apiFetch<{ authorized?: boolean }>('/api/security/edit-delete-password/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return result.authorized === true;
  } catch {
    return false;
  }
}
