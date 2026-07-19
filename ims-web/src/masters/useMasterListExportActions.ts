import { useCallback, useMemo, useState } from 'react';
import { fetchMasterFlatArray, fetchMasterItemsArray, fetchMasterPage } from '../api/masters';
import {
  exportListToCsv,
  exportListToExcelCsv,
  openListPrintPreview,
  type ListExportColumn,
  type ListExportFormat,
} from '../components/transaction/listExport';
import type { MasterListConfig } from './masterConfigs';

const EXPORT_PAGE_SIZE = 500;

function formatCellValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-IN');
  }
  return String(value);
}

function recordToExportRow(
  record: Record<string, unknown>,
  columns: ListExportColumn[],
  fieldByColumnId: Map<string, string>,
): Record<string, string | number> {
  const row: Record<string, string | number> = {};
  for (const col of columns) {
    const field = fieldByColumnId.get(col.id) ?? col.id;
    let raw = record[field];
    if (field === 'activeStatus' && typeof raw === 'boolean') {
      row[col.id] = raw ? 'Active' : 'Inactive';
      continue;
    }
    row[col.id] = formatCellValue(raw);
  }
  return row;
}

async function fetchAllMasterRecords(
  config: MasterListConfig,
  search: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Record<string, unknown>[]> {
  if (config.fetchMode === 'items-array') {
    const items = await fetchMasterItemsArray(config.apiPath);
    return items;
  }
  if (config.fetchMode === 'flat-array') {
    return fetchMasterFlatArray(config.apiPath);
  }

  const all: Record<string, unknown>[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (all.length < total) {
    const result = await fetchMasterPage(config.apiPath, {
      page,
      limit: EXPORT_PAGE_SIZE,
      search,
      query: config.query,
    });
    total = result.total ?? 0;
    const items = result.items ?? [];
    if (!items.length) break;
    all.push(...items);
    onProgress?.(all.length, total);
    if (items.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

export function useMasterListExportActions(options: {
  config: MasterListConfig;
  canExport: boolean;
  search: string;
  rows: Record<string, unknown>[];
  total: number;
  loading: boolean;
  setStatusMessage: (message: string) => void;
}) {
  const [exporting, setExporting] = useState(false);
  const columns: ListExportColumn[] = options.config.columns.map((col) => ({
    id: col.id,
    header: col.header,
  }));
  const fieldByColumnId = useMemo(
    () => new Map(options.config.columns.map((col) => [col.id, col.field])),
    [options.config.columns],
  );

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
        let records = options.rows;
        if (options.total > options.rows.length) {
          options.setStatusMessage('Fetching all matching rows for export…');
          records = await fetchAllMasterRecords(options.config, options.search, (loaded, total) => {
            options.setStatusMessage(
              `Fetching export data… ${loaded.toLocaleString()} / ${total.toLocaleString()}`,
            );
          });
        }

        if (!records.length) {
          options.setStatusMessage('Export cancelled.');
          return;
        }

        const exportRows = records.map((record) =>
          recordToExportRow(record, columns, fieldByColumnId),
        );
        const subtitle = `${exportRows.length.toLocaleString()} record(s) · ${options.config.title}`;

        if (format === 'excel') {
          const { fileName } = exportListToExcelCsv(options.config.title, columns, exportRows);
          options.setStatusMessage(`Exported ${fileName} (${exportRows.length} row(s)).`);
          return;
        }

        if (format === 'csv') {
          const { fileName } = exportListToCsv(options.config.title, columns, exportRows);
          options.setStatusMessage(`Exported ${fileName} (${exportRows.length} row(s)).`);
          return;
        }

        if (format === 'pdf') {
          const outcome = openListPrintPreview(options.config.title, subtitle, columns, exportRows);
          options.setStatusMessage(outcome.message);
          return;
        }

        if (format === 'print') {
          const outcome = openListPrintPreview(options.config.title, subtitle, columns, exportRows, {
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
    [columns, fieldByColumnId, options],
  );

  return {
    exporting,
    runExport,
    exportDisabled:
      !options.canExport || options.loading || options.rows.length === 0 || exporting,
  };
}
