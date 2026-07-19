import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { DataGridColumn } from '../datagrid/CorporateDataGrid';

export function useListRowSelection<T extends { id: string }>(rows: T[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !rows.some((r) => r.id === selectedId)) {
      setSelectedId(rows[0].id);
    }
  }, [rows, selectedId]);

  const selectedRow = rows.find((r) => r.id === selectedId) ?? null;
  return { selectedId, setSelectedId, selectedRow };
}

function listActionRowLabel<T extends { id: string }>(row: T, rowLabel?: (row: T) => string): string {
  if (rowLabel) return rowLabel(row);
  if ('billNo' in row && typeof (row as { billNo?: string }).billNo === 'string') {
    return (row as { billNo: string }).billNo;
  }
  return row.id;
}

export function createListActionColumn<T extends { id: string }>(handlers: {
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  onPrint?: (row: T) => void;
  onBarcodeLabel?: (row: T) => void;
  onBom?: (row: T) => void;
  rowLabel?: (row: T) => string;
  canEdit?: boolean;
  canDelete?: boolean;
  canPrint?: boolean;
  canBarcodeLabel?: boolean;
  canBom?: boolean;
  deleteTitle?: string;
}): DataGridColumn<T> {
  const canEdit = handlers.canEdit !== false;
  const canDelete = handlers.canDelete !== false;
  const canPrint = handlers.onPrint != null && handlers.canPrint !== false;
  const canBarcodeLabel = handlers.onBarcodeLabel != null && handlers.canBarcodeLabel !== false;
  const canBom = handlers.onBom != null && handlers.canBom !== false;
  const deleteTitle = handlers.deleteTitle ?? 'Delete';
  const actionCount =
    (canBom ? 1 : 0) +
    (canBarcodeLabel ? 1 : 0) +
    (canPrint ? 1 : 0) +
    (canEdit ? 1 : 0) +
    (canDelete ? 1 : 0);
  const actionWidth = Math.max(88, actionCount * 32 + (actionCount - 1) * 4);
  return {
    id: 'actions',
    header: 'Action',
    width: actionWidth,
    minWidth: actionWidth,
    readOnly: true,
    render: (row): ReactNode => {
      const label = listActionRowLabel(row, handlers.rowLabel);
      return (
      <div className="si-list-row-actions">
        {canBom ? (
          <button
            type="button"
            className="si-list-row-actions__btn"
            title="BOM - Bill of Material"
            aria-label={`BOM ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              handlers.onBom?.(row);
            }}
          >
            &#xE8F1;
          </button>
        ) : null}
        {canBarcodeLabel ? (
          <button
            type="button"
            className="si-list-row-actions__btn"
            title="Barcode Label Print"
            aria-label={`Barcode label print ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              handlers.onBarcodeLabel?.(row);
            }}
          >
            &#xE963;
          </button>
        ) : null}
        {canPrint ? (
          <button
            type="button"
            className="si-list-row-actions__btn"
            title="Print"
            aria-label={`Print ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              handlers.onPrint?.(row);
            }}
          >
            &#xE749;
          </button>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            className="si-list-row-actions__btn"
            title="Edit"
            aria-label={`Edit ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              handlers.onEdit(row);
            }}
          >
            &#xE70F;
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            className="si-list-row-actions__btn si-list-row-actions__btn--danger"
            title={deleteTitle}
            aria-label={`${deleteTitle} ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              handlers.onDelete(row);
            }}
          >
            &#xE74D;
          </button>
        ) : null}
      </div>
      );
    },
  };
}

export async function confirmDeleteDocument(
  repository: { deleteById: (id: string) => Promise<void> },
  row: { id: string; billNo: string },
  docLabel: string,
  options?: { skipConfirm?: boolean },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!options?.skipConfirm) {
    const confirmed = window.confirm(`Delete ${docLabel} ${row.billNo}? This cannot be undone.`);
    if (!confirmed) return { ok: false, message: 'Delete cancelled.' };
  }
  try {
    await repository.deleteById(row.id);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Delete failed.' };
  }
}

export function useDocumentListDelete<T extends { id: string; billNo: string }>(options: {
  repository: { deleteById: (id: string) => Promise<void> } | null | undefined;
  docLabel: string;
  invalidateList: () => void;
  reload: () => Promise<void>;
  setStatusMessage: (message: string) => void;
  authorizeDelete?: (row: T) => Promise<boolean>;
}) {
  const { repository, docLabel, invalidateList, reload, setStatusMessage, authorizeDelete } = options;

  return useCallback(
    async (row: T) => {
      if (!repository) return;
      if (authorizeDelete) {
        const allowed = await authorizeDelete(row);
        if (!allowed) return;
      }
      const result = await confirmDeleteDocument(repository, row, docLabel, {
        skipConfirm: Boolean(authorizeDelete),
      });
      if (!result.ok) {
        setStatusMessage(result.message);
        return;
      }
      invalidateList();
      await reload();
      setStatusMessage(`Deleted ${row.billNo}.`);
    },
    [authorizeDelete, docLabel, invalidateList, reload, repository, setStatusMessage],
  );
}
