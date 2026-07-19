import { getAuthSession } from '../api/auth';
import { useMenuPermissionSession } from '../context/MenuPermissionContext';

/** WPF: AuthSession.CanManageBom */
export function useCanManageBom(): boolean {
  const { isAdministrator } = useMenuPermissionSession();
  if (isAdministrator) return true;

  const session = getAuthSession();
  const role = session?.user?.role?.trim() ?? '';
  if (!role) return false;

  return (
    /^administrator$/i.test(role) ||
    /^manager$/i.test(role) ||
    /^store$/i.test(role)
  );
}
