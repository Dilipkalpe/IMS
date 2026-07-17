import { useCallback, useState } from 'react';
import type { DocumentTypeKey } from '../../document/contracts/documentTypes';
import { fetchAllListRows } from './fetchAllListRows';
import {
  exportListToCsv,
  exportListToExcelCsv,
  openListPrintPreview,
  type ListExportColumn,
  type ListExportFormat,
} from './listExport';
import { resolveListExportRows } from './resolveListExportRows';
import type { TransactionListQueryBase } from './transactionListQuery';
import type { TransactionListFetchRepository } from './useTransactionListLoader';

export interface UseListExportActionsOptions<TRow> {
  title: string;
  documentType: DocumentTypeKey;
  docLabelPlural: string;
  canExport: boolean;
  columns: ListExportColumn[];
  rowToRecord: (row: TRow) => Record<string, string | number>;
  rows: TRow[];
  total: number;
  loading: boolean;
  repository?: TransactionListFetchRepository | null;
  mapRows: (items: unknown[], mode: 'http' | 'local') => TRow[];
  getExportQuery: () => Omit<TransactionListQueryBase, 'page' | 'limit'>;
  setStatusMessage: (message: string) => void;
}

export function useListExportActions<TRow>(options: UseListExportActionsOptions<TRow>) {
  const [exporting, setExporting] = useState(false);

  const resolveRows = useCallback(async (): Promise<TRow[]> => {
    const fetchAll = async () => {
      if (!options.repository) return options.rows;
      options.setStatusMessage('Fetching all matching rows for export…');
      return fetchAllListRows(
        options.repository,
        options.getExportQuery(),
        options.mapRows,
        (loaded, total) => {
          options.setStatusMessage(`Fetching export data… ${loaded.toLocaleString()} / ${total.toLocaleString()}`);
        },
      );
    };

    return resolveListExportRows({
      currentPageRows: options.rows,
      totalRecords: options.total,
      fetchAll,
      docLabelPlural: options.docLabelPlural,
    });
  }, [options]);

  const runExport = useCallback(
    async (format: ListExportFormat) => {
      if (!options.canExport) {
        options.setStatusMessage('You do not have permission to export this list.');
        return;
      }
      if (options.loading) return;
      if (options.rows.length === 0) {
        options.setStatusMessage('No rows to export.');
        return;
      }

      setExporting(true);
      try {
        const resolved = await resolveRows();
        if (resolved.length === 0) {
          options.setStatusMessage('Export cancelled.');
          return;
        }

        const records = resolved.map(options.rowToRecord);
        const subtitle = `${resolved.length.toLocaleString()} record(s) · ${options.documentType}`;

        if (format === 'excel') {
          const { fileName } = exportListToExcelCsv(options.title, options.columns, records);
          options.setStatusMessage(`Exported ${fileName} (${resolved.length} row(s)).`);
          return;
        }

        if (format === 'csv') {
          const { fileName } = exportListToCsv(options.title, options.columns, records);
          options.setStatusMessage(`Exported ${fileName} (${resolved.length} row(s)).`);
          return;
        }

        if (format === 'pdf') {
          const outcome = openListPrintPreview(options.title, subtitle, options.columns, records);
          options.setStatusMessage(outcome.message);
          return;
        }

        if (format === 'print') {
          const outcome = openListPrintPreview(options.title, subtitle, options.columns, records, {
            autoPrint: true,
          });
          options.setStatusMessage(outcome.message);
        }
      } catch (err) {
        options.setStatusMessage(err instanceof Error ? err.message : 'Export failed.');
      } finally {
        setExporting(false);
      }
    },
    [options, resolveRows],
  );

  return {
    exporting,
    runExport,
    exportDisabled: !options.canExport || options.loading || options.rows.length === 0 || exporting,
  };
}
