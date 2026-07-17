import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import {
  createReportFormat,
  ensureReportingDefaults,
  fetchReportFieldRegistry,
  getReportFormat,
  listReportFormats,
  updateReportFormat,
  type ReportFieldRegistryItem,
  type ReportFormatRecord,
  type ReportLayoutColumn,
  type ReportLayoutJson,
} from '../api/reporting';
import { probeApiHealth } from '../api/client';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import '../finance/finance-voucher.scss';
import './report-format-designer.scss';

interface FormatRow {
  id: string;
  name: string;
  code: string;
  transactionType: string;
  isDefault: string;
}

const TRANSACTION_TYPES = [
  'sales_invoice',
  'purchase_invoice',
  'sales_order',
  'purchase_order',
  'ledger_report',
  'stock_summary',
] as const;

function emptyLayout(): ReportLayoutJson {
  return {
    schemaVersion: 2,
    page: {
      paperSizeKey: 'A4_PORTRAIT',
      orientation: 'portrait',
      widthMm: 210,
      heightMm: 297,
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
    },
    columns: [],
    groupBy: [],
    sortBy: [],
    filters: [],
    totals: { enabled: true, fields: [] },
    subtotals: { enabled: false, groupField: '', fields: [] },
    header: { title: 'Report', showDate: true },
    footer: { showPageNumbers: true, text: '' },
    export: { pdf: true, excel: true },
  };
}

export function ReportFormatDesignerScreen() {
  const [formats, setFormats] = useState<ReportFormatRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<ReportFormatRecord | null>(null);
  const [layout, setLayout] = useState<ReportLayoutJson>(emptyLayout());
  const [registry, setRegistry] = useState<ReportFieldRegistryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const rows = useMemo<FormatRow[]>(
    () =>
      formats.map((f) => ({
        id: f.id,
        name: f.formatName,
        code: f.formatCode,
        transactionType: f.transactionType,
        isDefault: f.isDefault ? 'Yes' : 'No',
      })),
    [formats],
  );

  const columns = useMemo<DataGridColumn<FormatRow>[]>(
    () => [
      { id: 'name', header: 'Format', minWidth: 180 },
      { id: 'code', header: 'Code', width: 120 },
      { id: 'transactionType', header: 'Type', width: 140 },
      { id: 'isDefault', header: 'Default', width: 80 },
    ],
    [],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setFormats([]);
        setError('API offline.');
        return;
      }
      await ensureReportingDefaults();
      setFormats(await listReportFormats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load formats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const loadEditor = useCallback(async (id: string) => {
    setSelectedId(id);
    setStatus(null);
    setError(null);
    try {
      const format = await getReportFormat(id);
      setEditor(format);
      setLayout({ ...emptyLayout(), ...(format.layoutJson ?? {}) });
      const fields = await fetchReportFieldRegistry(format.transactionType);
      setRegistry(fields);
    } catch (err) {
      setEditor(null);
      setError(err instanceof Error ? err.message : 'Failed to load format.');
    }
  }, []);

  const toggleColumn = useCallback(
    (field: ReportFieldRegistryItem) => {
      const existing = layout.columns ?? [];
      const hit = existing.find((c) => c.key === field.key);
      if (hit) {
        setLayout({
          ...layout,
          columns: existing.map((c) => (c.key === field.key ? { ...c, visible: !c.visible } : c)),
        });
        return;
      }
      const next: ReportLayoutColumn = {
        key: field.key,
        header: field.label,
        visible: true,
        width: 100,
        align: 'left',
      };
      setLayout({ ...layout, columns: [...existing, next] });
    },
    [layout],
  );

  const moveColumn = useCallback(
    (key: string, direction: -1 | 1) => {
      const cols = [...(layout.columns ?? [])];
      const index = cols.findIndex((c) => c.key === key);
      if (index < 0) return;
      const target = index + direction;
      if (target < 0 || target >= cols.length) return;
      const [item] = cols.splice(index, 1);
      cols.splice(target, 0, item);
      setLayout({ ...layout, columns: cols });
    },
    [layout],
  );

  const saveFormat = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateReportFormat(editor.id, {
        formatName: editor.formatName,
        transactionType: editor.transactionType,
        isDefault: editor.isDefault,
        isActive: editor.isActive,
        layoutJson: layout,
      });
      setEditor(updated);
      setStatus('Report format saved.');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [editor, layout, reload]);

  const handleCreate = useCallback(async () => {
    const name = window.prompt('Format name');
    if (!name?.trim()) return;
    try {
      const created = await createReportFormat({
        formatName: name.trim(),
        formatCode: name.trim().replace(/\s+/g, '_').toUpperCase().slice(0, 24),
        transactionType: 'sales_invoice',
        isDefault: false,
        isActive: true,
        layoutJson: emptyLayout(),
      });
      await reload();
      await loadEditor(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    }
  }, [loadEditor, reload]);

  const exportLayout = useCallback(
    (kind: 'pdf' | 'excel') => {
      const blob = new Blob([JSON.stringify(layout, null, 2)], {
        type: kind === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editor?.formatCode ?? 'report'}.${kind === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(`Exported ${kind.toUpperCase()} layout definition.`);
    },
    [editor?.formatCode, layout],
  );

  return (
    <RefinedScreenShell>
      <TransactionEntryShell
        title="Report Format Designer"
        titleRight={
          status || error ? (
            <span className="fv-entry__status" role="status">
              {error ?? status}
            </span>
          ) : null
        }
      >
        <div className="rfd">
          <div className="rfd__list">
            <div className="fv-list__toolbar si-list-toolbar__row">
              <button type="button" className="wpf-action-button" onClick={() => void handleCreate()}>
                New format
              </button>
              <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
                Refresh
              </button>
            </div>
            <CorporateDataGrid
              columns={columns}
              data={rows}
              loading={loading}
              selectedRowId={selectedId}
              onRowClick={(row) => void loadEditor(row.id)}
              emptyMessage="No report formats."
            />
          </div>

          {editor && (
            <div className="rfd__editor">
              <div className="mf-form__grid mf-form__grid--3">
                <label className="mf-form__field">
                  <span className="wpf-subpage-form-label">Name</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={editor.formatName}
                    onChange={(e) => setEditor({ ...editor, formatName: e.target.value })}
                  />
                </label>
                <label className="mf-form__field">
                  <span className="wpf-subpage-form-label">Transaction type</span>
                  <select
                    className="wpf-subpage-form-input"
                    value={editor.transactionType}
                    onChange={(e) => setEditor({ ...editor, transactionType: e.target.value })}
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mf-form__field mf-form__field--check">
                  <input
                    type="checkbox"
                    checked={editor.isDefault}
                    onChange={(e) => setEditor({ ...editor, isDefault: e.target.checked })}
                  />
                  <span>Default format</span>
                </label>
              </div>

              <div className="mf-form__section-title">Columns</div>
              <div className="rfd__columns">
                {registry.map((field) => {
                  const col = (layout.columns ?? []).find((c) => c.key === field.key);
                  return (
                    <label key={field.key} className="rfd__column-item">
                      <input type="checkbox" checked={Boolean(col?.visible)} onChange={() => toggleColumn(field)} />
                      <span>{field.label}</span>
                      {col && (
                        <span className="rfd__column-actions">
                          <button type="button" onClick={() => moveColumn(field.key, -1)}>
                            ↑
                          </button>
                          <button type="button" onClick={() => moveColumn(field.key, 1)}>
                            ↓
                          </button>
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="mf-form__section-title">Grouping & sorting</div>
              <div className="mf-form__grid mf-form__grid--2">
                <label className="mf-form__field">
                  <span className="wpf-subpage-form-label">Group by</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={(layout.groupBy ?? []).join(', ')}
                    onChange={(e) =>
                      setLayout({
                        ...layout,
                        groupBy: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
                <label className="mf-form__field">
                  <span className="wpf-subpage-form-label">Sort by (field:asc)</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={(layout.sortBy ?? []).map((s) => `${s.key}:${s.direction}`).join(', ')}
                    onChange={(e) =>
                      setLayout({
                        ...layout,
                        sortBy: e.target.value
                          .split(',')
                          .map((part) => part.trim())
                          .filter(Boolean)
                          .map((part) => {
                            const [key, direction] = part.split(':');
                            return { key: key.trim(), direction: direction === 'desc' ? 'desc' : 'asc' };
                          }),
                      })
                    }
                  />
                </label>
              </div>

              <div className="mf-form__section-title">Totals & page</div>
              <div className="mf-form__grid mf-form__grid--2">
                <label className="mf-form__field mf-form__field--check">
                  <input
                    type="checkbox"
                    checked={layout.totals?.enabled ?? false}
                    onChange={(e) =>
                      setLayout({
                        ...layout,
                        totals: {
                          enabled: e.target.checked,
                          fields: layout.totals?.fields ?? [],
                        },
                      })
                    }
                  />
                  <span>Show totals row</span>
                </label>
                <label className="mf-form__field mf-form__field--check">
                  <input
                    type="checkbox"
                    checked={layout.subtotals?.enabled ?? false}
                    onChange={(e) =>
                      setLayout({
                        ...layout,
                        subtotals: {
                          enabled: e.target.checked,
                          groupField: layout.subtotals?.groupField ?? '',
                          fields: layout.subtotals?.fields ?? [],
                        },
                      })
                    }
                  />
                  <span>Show subtotals</span>
                </label>
                <label className="mf-form__field">
                  <span className="wpf-subpage-form-label">Header title</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={layout.header?.title ?? ''}
                    onChange={(e) => setLayout({ ...layout, header: { ...layout.header, title: e.target.value } })}
                  />
                </label>
                <label className="mf-form__field">
                  <span className="wpf-subpage-form-label">Footer text</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={layout.footer?.text ?? ''}
                    onChange={(e) => setLayout({ ...layout, footer: { ...layout.footer, text: e.target.value } })}
                  />
                </label>
              </div>

              <div className="mf-form__actions">
                <button type="button" className="wpf-primary-button" disabled={saving} onClick={() => void saveFormat()}>
                  Save format
                </button>
                <button type="button" className="wpf-secondary-button" onClick={() => exportLayout('pdf')}>
                  Export PDF layout
                </button>
                <button type="button" className="wpf-secondary-button" onClick={() => exportLayout('excel')}>
                  Export Excel layout
                </button>
              </div>
            </div>
          )}
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
