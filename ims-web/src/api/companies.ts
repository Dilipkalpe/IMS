import { apiFetch, probeApiHealth } from './client';
import { getApiBaseUrl } from './config';

export interface CompanyDto {
  _id?: string;
  code?: string;
  businessName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  state?: string;
  placeOfSupply?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankAccountHolder?: string;
  logoText?: string;
  logoImage?: string;
  logoUrl?: string;
  hasLogo?: boolean;
  terms?: string[];
  isDefault?: boolean;
  activeStatus?: boolean;
  updatedAt?: string;
}

export interface CompanyBrandingDto {
  businessName: string;
  logoText: string;
  hasLogo: boolean;
  logoUrl: string;
  updatedAt?: string;
}

const CACHE_TTL_MS = 60_000;
let cachedDefault: { company: CompanyDto; loadedAt: number } | null = null;
let cachedBranding: { branding: CompanyBrandingDto; loadedAt: number; yearDb?: string } | null = null;
let brandingRequestSeq = 0;

const MAX_LOGO_BYTES = 350_000;

export function resolveCompanyLogoUrl(logoRef?: string | null): string {
  const raw = logoRef?.trim() ?? '';
  if (!raw) return '';
  if (raw.startsWith('data:image/')) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export function hasCompanyLogoReference(logoRef?: string | null): boolean {
  const raw = logoRef?.trim() ?? '';
  return (
    raw.startsWith('data:image/') ||
    raw.startsWith('/api/companies/by-code/') ||
    raw.startsWith('http://') ||
    raw.startsWith('https://')
  );
}

/** Read a local image file as a base64 data URI for company logo upload. */
export function readImageFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose a PNG, JPEG, GIF, or WebP image.'));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      reject(new Error(`Image is too large (max ${Math.round(MAX_LOGO_BYTES / 1024)} KB).`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:image/')) {
        reject(new Error('Could not read the selected image.'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

/** Public branding for login/sidebar — no auth required. */
export async function fetchCompanyBranding(yearDb?: string): Promise<CompanyBrandingDto | null> {
  const seq = ++brandingRequestSeq;
  const normalizedYearDb = yearDb?.trim() || undefined;

  if (
    cachedBranding &&
    cachedBranding.yearDb === normalizedYearDb &&
    Date.now() - cachedBranding.loadedAt < CACHE_TTL_MS
  ) {
    return cachedBranding.branding;
  }

  try {
    if (!(await probeApiHealth())) return null;
    const query = normalizedYearDb ? `?yearDb=${encodeURIComponent(normalizedYearDb)}` : '';
    const branding = await apiFetch<CompanyBrandingDto>(`/api/companies/branding${query}`);
    if (seq !== brandingRequestSeq) return null;
    cachedBranding = { branding, loadedAt: Date.now(), yearDb: normalizedYearDb };
    return branding;
  } catch {
    return null;
  }
}

/** WPF: CompanyProfileService.RefreshAsync */
export async function fetchDefaultCompany(): Promise<CompanyDto | null> {
  if (cachedDefault && Date.now() - cachedDefault.loadedAt < CACHE_TTL_MS) {
    return cachedDefault.company;
  }

  try {
    if (!(await probeApiHealth())) return null;
    const company = await apiFetch<CompanyDto>('/api/companies/default');
    cachedDefault = { company, loadedAt: Date.now() };
    return company;
  } catch {
    return null;
  }
}

export async function fetchCompanyByCode(code: string): Promise<CompanyDto | null> {
  try {
    if (!(await probeApiHealth())) return null;
    return await apiFetch<CompanyDto>(`/api/companies/by-code/${encodeURIComponent(code.trim())}`);
  } catch {
    return null;
  }
}

export function invalidateDefaultCompanyCache(): void {
  cachedDefault = null;
  cachedBranding = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ims:company-branding-changed'));
  }
}
