import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CorporateDataGrid } from '../components/datagrid/CorporateDataGrid';
import {
  exportListToExcelCsv,
  openListPrintPreview,
  type ListExportColumn,
} from '../components/transaction/listExport';
import {
  defaultAsOnDate,
  defaultRegisterDateRange,
  defaultSalesAnalysisDateRange,
  formatMoney,
  formatNum,
} from '../components/reports/reportDateUtils';
import {
  buildReportGridColumns,
  REPORT_DATA_GRID_PROPS,
} from '../components/reports/reportGridColumns';
import { StandardReportShell } from '../components/reports/StandardReportShell';

export type ReportFilterType = 'text' | 'date' | 'select' | 'checkbox';

export interface ReportFilterDef {
  key: string;
  label: string;
  type: ReportFilterType;
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
  loadOptions?: () => Promise<Array<{ value: string; label: string }>>;
  placeholder?: string;
  width?: number;
}

export interface ReportColumnDef {
  id: string;
  header: string;
  width?: number | string;
  minWidth?: number;
  money?: boolean;
  pct?: boolean;
}

export interface ConfiguredReportConfig {
  title: string;
  autoLoad?: boolean;
  filters: ReportFilterDef[];
  columns: ReportColumnDef[];
  fetch: (values: Record<string, string>) => Promise<unknown>;
  mapRows: (data: unknown) => Array<Record<string, unknown>>;
  buildSummary: (data: unknown | null) => string;
}

function defaultFilterValues(filters: ReportFilterDef[]): Record<string, string> {
  const fy = defaultSalesAnalysisDateRange();
  const reg = defaultRegisterDateRange();
  const values: Record<string, string> = {};
  for (const f of filters) {
    if (f.defaultValue !== undefined) {
      values[f.key] = f.defaultValue;
    } else if (f.type === 'date') {
      if (f.key === 'asOnDate') values[f.key] = defaultAsOnDate();
      else if (f.key === 'dateFrom') values[f.key] = fy.from;
      else if (f.key === 'dateTo') values[f.key] = fy.to;
      else values[f.key] = reg.from;
    } else if (f.type === 'select' && f.options?.length) {
      values[f.key] = f.options[0].value;
    } else if (f.type === 'checkbox') {
      values[f.key] = 'false';
    } else {
      values[f.key] = '';
    }
  }
  return values;
}

function formatCell(col: ReportColumnDef, value: unknown): string {
  if (value == null || value === '') return '';
  if (col.money && typeof value === 'number') return formatMoney(value);
  if (col.pct && typeof value === 'number') return `${value.toFixed(1)}%`;
  if (typeof value === 'number') return formatNum(value);
  return String(value);
}

export function ConfiguredReportScreen({ config }: { config: ConfiguredReportConfig }) {
  const [filterValues, setFilterValues] = useState(() => defaultFilterValues(config.filters));
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<unknown | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Record<string, Array<{ value: string; label: string }>> = {};
      for (const f of config.filters) {
        if (f.loadOptions) {
          try {
            next[f.key] = await f.loadOptions();
          } catch {
            next[f.key] = [];
          }
        }
      }
      if (!cancelled) setDynamicOptions(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [config.filters]);

  const rawRows = useMemo(
    () => (reportData ? config.mapRows(reportData) : []),
    [config, reportData],
  );

  const gridData = useMemo(() => {
    return rawRows.map((row, index) => {
      const id = String(row.id ?? row.serialNo ?? index);
      const mapped: { id: string } & Record<string, string | number> = { id };
      for (const col of config.columns) {
        const raw = row[col.id];
        mapped[col.id] = formatCell(col, raw);
      }
      return mapped;
    });
  }, [config.columns, rawRows]);

  const columns = useMemo(
    () => buildReportGridColumns<{ id: string } & Record<string, string | number>>(config.columns),
    [config.columns],
  );

  const exportColumns = useMemo<ListExportColumn[]>(
    () => config.columns.map((c) => ({ id: c.id, header: c.header })),
    [config.columns],
  );

  const exportRows = useMemo(
    () => gridData.map((r) => {
      const row: Record<string, string | number> = {};
      for (const col of config.columns) row[col.id] = r[col.id];
      return row;
    }),
    [config.columns, gridData],
  );

  const loadReport = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setBusy(true);
    setError(null);
    setEmptyMessage(null);
    try {
      const result = await config.fetch(filterValues);
      if (seq !== loadSeqRef.current) return;
      setReportData(result);
      const rows = config.mapRows(result);
      if (rows.length === 0) {
        setEmptyMessage('No records found for the selected period and filters.');
      }
    } catch (err) {
      if (seq !== loadSeqRef.current) return;
      setReportData(null);
      setError(err instanceof Error ? err.message : 'Failed to load report.');
    } finally {
      if (seq === loadSeqRef.current) setBusy(false);
    }
  }, [config, filterValues]);

  useEffect(() => {
    if (config.autoLoad) void loadReport();
  }, [config.autoLoad, config.title, loadReport]);

  const printReport = useCallback(() => {
    if (!reportData || rawRows.length === 0) return;
    openListPrintPreview(config.title, config.buildSummary(reportData), exportColumns, exportRows);
  }, [config, exportColumns, exportRows, rawRows.length, reportData]);

  const exportExcel = useCallback(() => {
    if (!reportData || rawRows.length === 0) return;
    exportListToExcelCsv(config.title, exportColumns, exportRows);
  }, [config.title, exportColumns, exportRows, reportData, rawRows.length]);

  const setFilter = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const filterFields: ReactNode = (
    <>
      {config.filters.map((f) => {
        const options = f.loadOptions ? dynamicOptions[f.key] ?? [] : f.options ?? [];
        if (f.type === 'checkbox') {
          return (
            <div key={f.key} className="standard-report__field standard-report__field--checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={filterValues[f.key] === 'true'}
                  onChange={(e) => setFilter(f.key, e.target.checked ? 'true' : 'false')}
                />
                {f.label}
              </label>
            </div>
          );
        }
        return (
          <div key={f.key} className="standard-report__field">
            <label htmlFor={`rf-${f.key}`}>{f.label}</label>
            {f.type === 'select' ? (
              <select
                id={`rf-${f.key}`}
                className="wpf-subpage-form-combo"
                value={filterValues[f.key] ?? ''}
                onChange={(e) => setFilter(f.key, e.target.value)}
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`rf-${f.key}`}
                type={f.type === 'date' ? 'date' : 'text'}
                className="wpf-subpage-form-input"
                style={f.width ? { width: f.width } : undefined}
                placeholder={f.placeholder}
                value={filterValues[f.key] ?? ''}
                onChange={(e) => setFilter(f.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
      <div className="standard-report__actions">
        <button type="button" className="wpf-action-button" disabled={busy} onClick={() => void loadReport()}>
          Show
        </button>
        <button
          type="button"
          className="wpf-secondary-button"
          disabled={busy || rawRows.length === 0}
          onClick={printReport}
        >
          Print
        </button>
        <button
          type="button"
          className="wpf-secondary-button"
          disabled={busy || rawRows.length === 0}
          onClick={exportExcel}
        >
          Export Excel
        </button>
      </div>
    </>
  );

  return (
    <StandardReportShell
      title={config.title}
      summary={config.buildSummary(reportData)}
      busy={busy}
      error={error}
      statusMessage={!error && !busy && emptyMessage ? emptyMessage : undefined}
      filters={filterFields}
      grid={<CorporateDataGrid columns={columns} data={gridData} {...REPORT_DATA_GRID_PROPS} />}
    />
  );
}

export function createConfiguredReportScreen(config: ConfiguredReportConfig) {
  return function ConfiguredReportRoute() {
    return <ConfiguredReportScreen config={config} />;
  };
}
