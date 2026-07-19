import { useCallback } from 'react';
import { useEditDeleteGuard } from '../context/EditDeleteGuardContext';
import { useMenuPermissions } from '../context/MenuPermissionContext';
import type { MasterListConfig } from './masterConfigs';

function formatCellValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function recordLabel(record: Record<string, unknown>): { key: string; label: string } {
  const key = formatCellValue(record.code ?? record.employeeCode ?? record.username ?? record._id);
  const label = formatCellValue(record.name ?? record.fullName ?? record.businessName ?? key);
  return { key, label };
}

export function useProtectedMasterListActions(
  config: MasterListConfig,
  options: {
    setStatusMessage: (message: string) => void;
    onOpenNew: () => void;
    onOpenEdit: (record: Record<string, unknown>) => void;
  },
) {
  const permissions = useMenuPermissions(config.listNavKey);
  const { authorizeEdit, authorizeDelete } = useEditDeleteGuard();
  const moduleTitle = config.moduleTitle ?? config.title;

  const openNew = useCallback(() => {
    if (!permissions.canAdd) {
      options.setStatusMessage(`You do not have permission to add ${moduleTitle} records.`);
      return;
    }
    options.onOpenNew();
  }, [moduleTitle, options, permissions.canAdd]);

  const openEdit = useCallback(
    async (record: Record<string, unknown>) => {
      if (!permissions.canEdit) {
        options.setStatusMessage(`You do not have permission to edit ${moduleTitle} records.`);
        return;
      }

      const { key, label } = recordLabel(record);
      if (!key) return;

      const ok = await authorizeEdit(moduleTitle, key, label);
      if (!ok) {
        options.setStatusMessage('Edit cancelled.');
        return;
      }
      options.onOpenEdit(record);
    },
    [authorizeEdit, moduleTitle, options, permissions.canEdit],
  );

  const authorizeDeleteRecord = useCallback(
    async (record: Record<string, unknown>) => {
      if (!permissions.canDelete) {
        options.setStatusMessage(`You do not have permission to delete ${moduleTitle} records.`);
        return false;
      }

      const { key, label } = recordLabel(record);
      if (!key) return false;

      return authorizeDelete(moduleTitle, key, label);
    },
    [authorizeDelete, moduleTitle, options, permissions.canDelete],
  );

  return {
    canAdd: permissions.canAdd,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
    canExport: permissions.canExport,
    openNew,
    openEdit,
    authorizeDeleteRecord,
  };
}
