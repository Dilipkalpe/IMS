import { apiFetch } from './client';

/** Full account record for master CRUD. */
export interface AccountRecord {
  _id?: string;
  code: string;
  name: string;
  accountType: 'customer' | 'supplier';
  contactPerson?: string;
  designation?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  address?: string;
  mobileNo?: string;
  contactNo?: string;
  fax?: string;
  cstNo?: string;
  tinNo?: string;
  panNo?: string;
  gstNo?: string;
  exciseNo?: string;
  creditLimit?: number;
  creditDays?: number;
  openingBalance?: number;
  openingBalanceType?: 'debit' | 'credit';
  customerType?: string;
  annualTurnover?: string;
  sourceEmployee?: string;
  activeStatus?: boolean;
  gstExempt?: boolean;
  billFormatAssignments?: Record<string, string>;
}

export interface AccountListResult {
  items: AccountRecord[];
  total: number;
  page: number;
  limit: number;
}

/** WPF: ImsApiClient.GetAccountNamesAsync("customer") → GET /api/accounts/names */
export async function fetchCustomerAccountNames(): Promise<string[]> {
  const names = await apiFetch<string[]>('/api/accounts/names?type=customer');
  return Array.isArray(names) ? names : [];
}

export async function fetchAccounts(params?: {
  type?: 'customer' | 'supplier';
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AccountListResult> {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const qs = q.toString();
  return apiFetch<AccountListResult>(`/api/accounts${qs ? `?${qs}` : ''}`);
}

export async function getAccountByCode(code: string): Promise<AccountRecord> {
  return apiFetch<AccountRecord>(`/api/accounts/by-code/${encodeURIComponent(code.trim())}`);
}

export async function createAccount(input: AccountRecord): Promise<AccountRecord> {
  return apiFetch<AccountRecord>('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAccountByCode(
  code: string,
  input: Partial<AccountRecord>,
): Promise<AccountRecord> {
  return apiFetch<AccountRecord>(`/api/accounts/by-code/${encodeURIComponent(code.trim())}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteAccountByCode(code: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/accounts/by-code/${encodeURIComponent(code.trim())}`, {
    method: 'DELETE',
  });
}

/** WPF: account lookup by party name for communication recipients. */
export async function findAccountByName(
  partyName: string,
  type: 'customer' | 'supplier',
): Promise<AccountRecord | null> {
  const needle = partyName.trim().toLowerCase();
  if (!needle) return null;

  let page = 1;
  const limit = 500;
  let total = Number.POSITIVE_INFINITY;

  while ((page - 1) * limit < total) {
    const result = await fetchAccounts({ type, page, limit, search: partyName });
    total = result.total;
    const match = result.items.find((a) => a.name.trim().toLowerCase() === needle);
    if (match) return match;
    if (result.items.length < limit) break;
    page += 1;
  }

  return null;
}
