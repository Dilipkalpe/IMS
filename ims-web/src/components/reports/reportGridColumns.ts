import type { DataGridColumn } from '../datagrid/CorporateDataGrid';

export interface ReportGridColumnDef {
  id: string;
  header: string;
  width?: number | string;
  minWidth?: number;
}

export const REPORT_DATA_GRID_PROPS = {
  minHeight: 280,
  rowHeight: 42,
  headerHeight: 44,
  variant: 'so-list' as const,
};

export function buildReportGridColumns<T extends { id: string }>(
  defs: ReportGridColumnDef[],
): DataGridColumn<T>[] {
  return defs.map((col) => ({
    id: col.id,
    header: col.header,
    width: col.width ?? (col.minWidth ? '*' : undefined),
    minWidth: col.minWidth,
    readOnly: true,
    getValue: (row) => {
      const value = (row as Record<string, unknown>)[col.id];
      if (value == null || value === '') return '';
      return typeof value === 'number' ? value : String(value);
    },
  }));
}
