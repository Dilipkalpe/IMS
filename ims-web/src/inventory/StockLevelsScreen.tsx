import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMasterPage } from '../api/masters';
import { CorporateDataGrid } from '../components/datagrid/CorporateDataGrid';
import {
  buildReportGridColumns,
  REPORT_DATA_GRID_PROPS,
} from '../components/reports/reportGridColumns';
import {
  exportListToExcelCsv,
  openListPrintPreview,
  type ListExportColumn,
} from '../components/transaction/listExport';
import { StandardReportShell } from '../components/reports/StandardReportShell';

interface StockLevelRow {
  id: string;
  code: string;
  name: string;
  unit: string;
  stockQty: string;
  reorderQty: string;
  status: string;
}

export function StockLevelsScreen() {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<StockLevelRow[]>([]);

  const columns = useMemo(
    () =>
      buildReportGridColumns<StockLevelRow>([
        { id: 'code', header: 'Code', width: 110 },
        { id: 'name', header: 'Product', minWidth: 180 },
        { id: 'unit', header: 'Unit', width: 70 },
        { id: 'stockQty', header: 'On Hand', width: 100 },
        { id: 'reorderQty', header: 'Reorder', width: 100 },
        { id: 'status', header: 'Status', width: 120 },
      ]),
    [],
  );

  const exportColumns = useMemo<ListExportColumn[]>(
    () => columns.map((c) => ({ id: c.id, header: c.header })),
    [columns],
  );

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const all: StockLevelRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;
      while (all.length < total) {
        const result = await fetchMasterPage('products', { page, limit: 500, search });
        total = result.total ?? 0;
        const items = result.items ?? [];
        if (!items.length) break;
        for (const item of items) {
          const onHand = Number(item.stockQty) || 0;
          const reorder = Number(item.reorderQty) || 0;
          const shortage = Math.max(0, reorder - onHand);
          all.push({
            id: String(item.code ?? item._id ?? all.length),
            code: String(item.code ?? ''),
            name: String(item.name ?? ''),
            unit: String(item.unit ?? ''),
            stockQty: onHand.toFixed(2),
            reorderQty: reorder.toFixed(2),
            status: shortage > 0 ? 'Below reorder' : reorder > 0 ? 'OK' : 'No reorder set',
          });
        }
        if (items.length < 500) break;
        page += 1;
      }
      setRows(all);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : 'Failed to load stock levels.');
    } finally {
      setBusy(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportRows = useMemo(
    () => rows.map((r) => ({ code: r.code, name: r.name, unit: r.unit, stockQty: r.stockQty, reorderQty: r.reorderQty, status: r.status })),
    [rows],
  );

  const printReport = useCallback(() => {
    if (!rows.length) return;
    openListPrintPreview('Stock Levels', `${rows.length} product(s)`, exportColumns, exportRows);
  }, [exportColumns, exportRows, rows.length]);

  const exportExcel = useCallback(() => {
    if (!rows.length) return;
    exportListToExcelCsv('Stock Levels', exportColumns, exportRows);
  }, [exportColumns, exportRows, rows.length]);

  const summary =
    rows.length > 0
      ? `${rows.length} product(s) · ${rows.filter((r) => r.status === 'Below reorder').length} below reorder`
      : 'Loading stock levels…';

  return (
    <StandardReportShell
      title="Stock Levels"
      summary={summary}
      busy={busy}
      error={error}
      filters={
        <>
          <div className="standard-report__field">
            <label htmlFor="stock-level-search">Search</label>
            <input
              id="stock-level-search"
              type="text"
              className="wpf-subpage-form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code or name…"
            />
          </div>
          <div className="standard-report__actions">
            <button type="button" className="wpf-action-button" disabled={busy} onClick={() => void load()}>
              Show
            </button>
            <button type="button" className="wpf-secondary-button" disabled={busy || !rows.length} onClick={printReport}>
              Print
            </button>
            <button type="button" className="wpf-secondary-button" disabled={busy || !rows.length} onClick={exportExcel}>
              Export Excel
            </button>
          </div>
        </>
      }
      grid={<CorporateDataGrid columns={columns} data={rows} {...REPORT_DATA_GRID_PROPS} />}
    />
  );
}
