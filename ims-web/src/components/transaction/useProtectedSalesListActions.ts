import { useCallback } from 'react';
import { useMenuPermissions } from '../../context/MenuPermissionContext';
import { useEditDeleteGuard } from '../../context/EditDeleteGuardContext';
import type { SalesModuleConfig } from './salesModuleConfig';

export function useProtectedSalesListActions<
  T extends { id: string; billNo: string; customer?: string; supplier?: string },
>(
  config: SalesModuleConfig,
  options: {
    onOpenNew: () => void;
    onOpenEdit: (row: T) => void;
    setStatusMessage: (message: string) => void;
    getPartyLabel?: (row: T) => string;
  },
) {
  const partyLabel = useCallback(
    (row: T) =>
      options.getPartyLabel?.(row) ??
      row.customer?.trim() ??
      row.supplier?.trim() ??
      row.billNo,
    [options],
  );
  const permissions = useMenuPermissions(config.menuKey);
  const { authorizeEdit, authorizeDelete } = useEditDeleteGuard();

  const openWorkspace = useCallback(
    async (row?: T) => {
      if (!row) {
        if (!permissions.canAdd) {
          options.setStatusMessage(`You do not have permission to add ${config.moduleTitle} records.`);
          return;
        }
        options.onOpenNew();
        return;
      }

      if (!permissions.canEdit) {
        options.setStatusMessage(`You do not have permission to edit ${config.moduleTitle} records.`);
        return;
      }

      const ok = await authorizeEdit(config.moduleTitle, row.billNo, partyLabel(row));
      if (!ok) {
        options.setStatusMessage('Edit cancelled.');
        return;
      }
      options.onOpenEdit(row);
    },
    [authorizeEdit, config.moduleTitle, options, partyLabel, permissions.canAdd, permissions.canEdit],
  );

  const authorizeDeleteRow = useCallback(
    async (row: T) => {
      if (!permissions.canDelete) {
        options.setStatusMessage(`You do not have permission to delete ${config.moduleTitle} records.`);
        return false;
      }
      const ok = await authorizeDelete(config.moduleTitle, row.billNo, partyLabel(row));
      if (!ok) {
        options.setStatusMessage('Delete cancelled.');
      }
      return ok;
    },
    [authorizeDelete, config.moduleTitle, options, partyLabel, permissions.canDelete],
  );

  return {
    canAdd: permissions.canAdd,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
    canExport: permissions.canExport,
    openWorkspace,
    authorizeDeleteRow,
  };
}
