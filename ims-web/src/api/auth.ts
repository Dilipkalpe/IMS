import { apiFetch } from './client';

const SESSION_KEY = 'ims.authSession';

export interface LoginMenuPermission {
  menuKey: string;
  canView?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

export interface FinancialYearOption {
  id: string;
  financialYearName: string;
  startDate?: string;
  endDate?: string;
  databaseName?: string;
  isActive?: boolean;
  closed?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department?: string;
  email?: string;
  canPrintBarcodeLabels?: boolean;
}

export interface AuthSession {
  token: string;
  expiresAt?: string;
  user: AuthUser;
  financialYear: FinancialYearOption;
  isAdministrator?: boolean;
  permissions?: LoginMenuPermission[];
}

export function getAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session?.token || !session?.user) return null;
    if (session.permissions != null && !Array.isArray(session.permissions)) {
      session.permissions = [];
    }
    return session;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Clears local session and optionally notifies the API (stateless JWT — client-side clear is sufficient). */
export async function logout(): Promise<void> {
  const session = getAuthSession();
  clearAuthSession();
  if (!session?.token) return;
  try {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
    });
  } catch {
    // Session already cleared locally; ignore network errors on sign-out.
  }
}

export async function fetchFinancialYears(): Promise<FinancialYearOption[]> {
  const years = await apiFetch<FinancialYearOption[]>('/api/financial-years');
  return Array.isArray(years) ? years : [];
}

export async function login(input: {
  loginId: string;
  password: string;
  financialYearId: string;
}): Promise<AuthSession> {
  const result = await apiFetch<{
    token: string;
    expiresAt?: string;
    user: AuthUser & { employeeId?: string; canPrintBarcodeLabels?: boolean };
    financialYear: FinancialYearOption;
    permissions?: LoginMenuPermission[];
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      loginId: input.loginId.trim(),
      password: input.password,
      financialYearId: input.financialYearId,
    }),
  });

  const isAdministrator = /^administrator$/i.test(result.user.role ?? '');
  const session: AuthSession = {
    token: result.token,
    expiresAt: result.expiresAt,
    user: {
      id: result.user.id,
      username: result.user.username,
      fullName: result.user.fullName,
      role: result.user.role,
      department: result.user.department,
      email: result.user.email,
      canPrintBarcodeLabels: result.user.canPrintBarcodeLabels === true || isAdministrator,
    },
    financialYear: result.financialYear,
    isAdministrator,
    permissions: Array.isArray(result.permissions) ? result.permissions : [],
  };
  saveAuthSession(session);
  return session;
}
