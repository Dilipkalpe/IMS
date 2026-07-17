import { useCallback } from 'react';
import { useEditDeleteGuard } from '../../context/EditDeleteGuardContext';
import { useMenuPermissions } from '../../context/MenuPermissionContext';
import type { SalesModuleConfig } from './salesModuleConfig';

export function useProtectedSalesLineDelete(
  config: SalesModuleConfig,
  options: {
    billNo: string;
    deleteLine: (lineId: string) => void;
    setStatusMessage?: (message: string) => void;
  },
) {
  const permissions = useMenuPermissions(config.menuKey);
  const { authorizeDelete } = useEditDeleteGuard();

  const deleteLineProtected = useCallback(
    async (line: { id: string; sr: number; productRetailCode: string }) => {
      if (!permissions.canDelete) {
        options.setStatusMessage?.(`You do not have permission to delete lines in ${config.moduleTitle}.`);
        return false;
      }

      const recordKey = `${options.billNo}:${line.sr}`;
      const ok = await authorizeDelete(config.moduleTitle, recordKey, line.productRetailCode);
      if (!ok) {
        options.setStatusMessage?.('Line delete cancelled.');
        return false;
      }

      options.deleteLine(line.id);
      return true;
    },
    [authorizeDelete, config.moduleTitle, options, permissions.canDelete],
  );

  return { deleteLineProtected, canDeleteLine: permissions.canDelete };
}
