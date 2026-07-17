import { apiFetch } from './client';

export interface ReportFormatRecord {
  id: string;
  formatCode: string;
  formatName: string;
  transactionType: string;
  paperSizeKey: string;
  orientation: string;
  isDefault: boolean;
  isActive: boolean;
  layoutJson: ReportLayoutJson;
  printSettings?: Record<string, unknown>;
  visibilityOptions?: Record<string, unknown>;
}

export interface ReportLayoutColumn {
  key: string;
  header: string;
  visible: boolean;
  width?: number;
  align?: string;
  total?: boolean;
}

export interface ReportLayoutJson {
  schemaVersion?: number;
  page?: {
    paperSizeKey?: string;
    orientation?: string;
    widthMm?: number;
    heightMm?: number;
    marginsMm?: { top: number; right: number; bottom: number; left: number };
  };
  columns?: ReportLayoutColumn[];
  groupBy?: string[];
  sortBy?: { key: string; direction: 'asc' | 'desc' }[];
  filters?: { key: string; operator: string; value: string }[];
  totals?: { enabled: boolean; fields: string[] };
  subtotals?: { enabled: boolean; groupField: string; fields: string[] };
  header?: { title?: string; subtitle?: string; showDate?: boolean };
  footer?: { text?: string; showPageNumbers?: boolean };
  export?: { pdf: boolean; excel: boolean };
}

export interface ReportFieldRegistryItem {
  key: string;
  label: string;
  dataType?: string;
  group?: string;
}

export async function listReportFormats(transactionType?: string): Promise<ReportFormatRecord[]> {
  const query = transactionType ? `?transactionType=${encodeURIComponent(transactionType)}` : '';
  return apiFetch<ReportFormatRecord[]>(`/api/reporting/report-formats${query}`);
}

export async function getReportFormat(id: string): Promise<ReportFormatRecord> {
  return apiFetch<ReportFormatRecord>(`/api/reporting/report-formats/${id}`);
}

export async function createReportFormat(input: Partial<ReportFormatRecord>): Promise<ReportFormatRecord> {
  return apiFetch<ReportFormatRecord>('/api/reporting/report-formats', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateReportFormat(
  id: string,
  input: Partial<ReportFormatRecord>,
): Promise<ReportFormatRecord> {
  return apiFetch<ReportFormatRecord>(`/api/reporting/report-formats/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function fetchReportFieldRegistry(transactionType: string): Promise<ReportFieldRegistryItem[]> {
  const result = await apiFetch<{
    fields?: Array<{ fieldKey: string; displayLabel: string; dataType?: string; category?: string }>;
  }>(`/api/reporting/field-registry?transactionType=${encodeURIComponent(transactionType)}`);
  return (result.fields ?? []).map((field) => ({
    key: field.fieldKey,
    label: field.displayLabel,
    dataType: field.dataType,
    group: field.category,
  }));
}

export async function ensureReportingDefaults(): Promise<unknown> {
  return apiFetch('/api/reporting/ensure-defaults', { method: 'POST' });
}
