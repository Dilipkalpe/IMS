import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface MenuPermission {
  menuKey: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

const FULL_ACCESS: Omit<MenuPermission, 'menuKey'> = {
  canView: true,
  canAdd: true,
  canEdit: true,
  canDelete: true,
  canExport: true,
};

const STORAGE_KEY = 'ims.authSession';

interface StoredAuthSession {
  isAdministrator?: boolean;
  permissions?: MenuPermission[];
  user?: { role?: string };
}

function readStoredSession(): StoredAuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthSession;
    const isAdministrator =
      parsed.isAdministrator === true || /^administrator$/i.test(parsed.user?.role ?? '');
    return { ...parsed, isAdministrator };
  } catch {
    return null;
  }
}

function normalizePermission(raw: Partial<MenuPermission> & { menuKey: string }): MenuPermission {
  return {
    menuKey: raw.menuKey,
    canView: raw.canView === true,
    canAdd: raw.canAdd === true,
    canEdit: raw.canEdit === true,
    canDelete: raw.canDelete === true,
    canExport: raw.canExport === true,
  };
}

interface MenuPermissionContextValue {
  isAdministrator: boolean;
  setSession: (session: { isAdministrator?: boolean; permissions?: MenuPermission[] }) => void;
  clearSession: () => void;
  getPermission: (menuKey: string) => MenuPermission;
}

const MenuPermissionContext = createContext<MenuPermissionContextValue | null>(null);

/** WPF: MenuPermissionSession — defaults to full access when no login session is stored. */
export function MenuPermissionProvider({ children }: { children: ReactNode }) {
  const stored = readStoredSession();
  const [isAdministrator, setIsAdministrator] = useState(stored?.isAdministrator === true);
  const [byKey, setByKey] = useState(() => {
    const map = new Map<string, MenuPermission>();
    for (const p of stored?.permissions ?? []) {
      if (p?.menuKey) map.set(p.menuKey, normalizePermission(p));
    }
    return map;
  });

  const setSession = useCallback(
    (session: { isAdministrator?: boolean; permissions?: MenuPermission[] }) => {
      setIsAdministrator(session.isAdministrator === true);
      const map = new Map<string, MenuPermission>();
      for (const p of session.permissions ?? []) {
        if (p?.menuKey) map.set(p.menuKey, normalizePermission(p));
      }
      setByKey(map);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {
        // ignore
      }
    },
    [],
  );

  const clearSession = useCallback(() => {
    setIsAdministrator(false);
    setByKey(new Map());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const getPermission = useCallback(
    (menuKey: string): MenuPermission => {
      if (isAdministrator) {
        return { menuKey, ...FULL_ACCESS };
      }
      const hit = byKey.get(menuKey);
      if (hit) return hit;
      return { menuKey, ...FULL_ACCESS };
    },
    [byKey, isAdministrator],
  );

  const value = useMemo(
    () => ({ isAdministrator, setSession, clearSession, getPermission }),
    [clearSession, getPermission, isAdministrator, setSession],
  );

  return (
    <MenuPermissionContext.Provider value={value}>{children}</MenuPermissionContext.Provider>
  );
}

export function useMenuPermissions(menuKey: string) {
  const ctx = useContext(MenuPermissionContext);
  if (!ctx) {
    return { menuKey, ...FULL_ACCESS, isAdministrator: true };
  }
  return ctx.getPermission(menuKey);
}

export function useMenuPermissionSession() {
  const ctx = useContext(MenuPermissionContext);
  if (!ctx) throw new Error('MenuPermissionProvider is required.');
  return ctx;
}

/** WPF: MenuPermissionSession.CanManageRoles */
export function useCanManageRoles(): boolean {
  const { isAdministrator, getPermission } = useMenuPermissionSession();
  if (isAdministrator) return true;
  return getPermission('role-master').canEdit;
}
