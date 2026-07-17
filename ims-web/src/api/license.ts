import { apiFetch } from './client';

export interface SoftwareLicenseStatus {
  licenseType: 'trial' | 'permanent' | string;
  isPermanent: boolean;
  isActive: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  planDays?: number | null;
  activatedAt?: string;
  expiresAt?: string | null;
  daysRemaining?: number | null;
  message: string;
}

export async function fetchLicenseStatus(): Promise<SoftwareLicenseStatus | null> {
  try {
    return await apiFetch<SoftwareLicenseStatus>('/api/license/status');
  } catch {
    return null;
  }
}

export function buildLoginLicenseNotice(status: SoftwareLicenseStatus | null): string | null {
  if (!status || status.isPermanent) return null;
  if (status.isExpired) {
    return `${status.message} Only an administrator can sign in to renew or extend the license.`;
  }
  if (status.isExpiringSoon) return status.message;
  return null;
}

export interface LicenseExtensionEntry {
  days: number;
  extendedAt: string | null;
  extendedBy: string;
  note: string;
}

export interface LicenseAdminDetails extends SoftwareLicenseStatus {
  extensions?: LicenseExtensionEntry[];
}

export async function fetchLicenseAdminDetails(): Promise<LicenseAdminDetails> {
  return apiFetch<LicenseAdminDetails>('/api/license/admin');
}

export async function renewLicense(params: {
  licenseType: 'trial' | 'permanent';
  planDays?: number;
}): Promise<SoftwareLicenseStatus & { success?: boolean; message?: string }> {
  return apiFetch('/api/license/renew', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function extendLicense(params: {
  days: number;
  note?: string;
}): Promise<SoftwareLicenseStatus & { success?: boolean; message?: string }> {
  return apiFetch('/api/license/extend', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
