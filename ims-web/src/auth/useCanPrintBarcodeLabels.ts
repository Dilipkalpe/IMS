import { getAuthSession } from '../api/auth';
import { useMenuPermissionSession } from '../context/MenuPermissionContext';

/** WPF: AuthSession.CanPrintBarcodeLabels */
export function useCanPrintBarcodeLabels(): boolean {
  const { isAdministrator } = useMenuPermissionSession();
  if (isAdministrator) return true;

  const session = getAuthSession();
  const user = session?.user as { canPrintBarcodeLabels?: boolean } | undefined;
  return user?.canPrintBarcodeLabels === true;
}
