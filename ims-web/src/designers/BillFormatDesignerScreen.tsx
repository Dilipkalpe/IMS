import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import {
  createBillFormat,
  deleteBillFormat,
  duplicateBillFormat,
  exportBillFormatJson,
  getBillFormatById,
  listBillFormats,
  updateBillFormat,
  updateBillFormatLayout,
  type BillFormatTemplate,
} from '../api/billFormats';
import { openHtmlPrintPreview } from '../utils/printPreview';
import { probeApiHealth } from '../api/client';
import type { BillLayoutJson } from '../document/contracts/billLayout';
import { BillLayoutCanvas } from './BillLayoutCanvas';
import '../finance/finance-voucher.scss';
import '../masters/master-form.scss';
import './bill-designer.scss';

interface TemplateRow {
  id: string;
  name: string;
  transactionType: string;
  formatCode: string;
  isDefault: string;
  isActive: string;
}

export function BillFormatDesignerScreen() {
  const [templates, setTemplates] = useState<BillFormatTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<BillFormatTemplate | null>(null);
  const [layoutText, setLayoutText] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
  const [layoutJson, setLayoutJson] = useState<BillLayoutJson | null>(null);

  const columns = useMemo<DataGridColumn<TemplateRow>[]>(
    () => [
      { id: 'name', header: 'Template', minWidth: 180 },
      { id: 'transactionType', header: 'Doc type', width: 140 },
      { id: 'formatCode', header: 'Code', width: 100 },
      { id: 'isDefault', header: 'Default', width: 80 },
      { id: 'isActive', header: 'Active', width: 80 },
    ],
    [],
  );

  const rows = useMemo<TemplateRow[]>(
    () =>
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        transactionType: t.transactionType,
        formatCode: t.formatCode,
        isDefault: t.isDefault ? 'Yes' : 'No',
        isActive: t.isActive ? 'Yes' : 'No',
      })),
    [templates],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setTemplates([]);
        setError('API offline — cannot load templates.');
        return;
      }
      const items = await listBillFormats({ includeInactive: true });
      setTemplates(items);
    } catch (err) {
      setTemplates([]);
      setError(err instanceof Error ? err.message : 'Failed to load templates.');
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
      const template = await getBillFormatById(id);
      setEditor(template);
      const parsed = (template.layoutJson ?? {}) as BillLayoutJson;
      setLayoutJson(parsed);
      setLayoutText(JSON.stringify(parsed, null, 2));
      setEditorMode('visual');
    } catch (err) {
      setEditor(null);
      setError(err instanceof Error ? err.message : 'Failed to load template.');
    }
  }, []);

  const saveMeta = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateBillFormat(editor.id, {
        name: editor.name,
        description: editor.description,
        isDefault: editor.isDefault,
        isActive: editor.isActive,
        printSettings: editor.printSettings,
      });
      setEditor(updated);
      setStatus('Template settings saved.');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [editor, reload]);

  const saveLayout = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    setError(null);
    try {
      const layoutJson = JSON.parse(layoutText) as BillFormatTemplate['layoutJson'];
      const updated = await updateBillFormatLayout(editor.id, layoutJson);
      setEditor(updated);
      setLayoutText(JSON.stringify(updated.layoutJson ?? {}, null, 2));
      setStatus('Layout saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid layout JSON or save failed.');
    } finally {
      setSaving(false);
    }
  }, [editor, layoutText]);

  const handleCreate = useCallback(async () => {
    const name = window.prompt('Template name');
    if (!name?.trim()) return;
    try {
      const created = await createBillFormat({
        name: name.trim(),
        transactionType: 'sales_invoice',
        description: 'Custom template',
      });
      await reload();
      await loadEditor(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    }
  }, [loadEditor, reload]);

  const handleDuplicate = useCallback(async () => {
    if (!editor) return;
    try {
      const copy = await duplicateBillFormat(editor.id);
      await reload();
      await loadEditor(copy.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duplicate failed.');
    }
  }, [editor, loadEditor, reload]);

  const handleDelete = useCallback(async () => {
    if (!editor || editor.isSystem) return;
    if (!window.confirm(`Delete template "${editor.name}"?`)) return;
    try {
      await deleteBillFormat(editor.id);
      setEditor(null);
      setSelectedId(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }, [editor, reload]);

  const handleExport = useCallback(async () => {
    if (!editor) return;
    try {
      const json = await exportBillFormatJson(editor.id);
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editor.formatCode || editor.templateKey}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    }
  }, [editor]);

  const openPrintPreview = useCallback(() => {
    if (!editor) return;
    const html = `<html><head><title>${editor.name} preview</title></head><body><h1>${editor.name}</h1><pre>${layoutText.replace(/</g, '&lt;')}</pre></body></html>`;
    openHtmlPrintPreview(html, { autoPrint: true, title: `${editor.name} preview` });
  }, [editor, layoutText]);

  return (
    <RefinedScreenShell>
      <TransactionEntryShell
        title="Bill Format Designer"
        titleRight={
          status || error ? (
            <span className="fv-entry__status" role="status">
              {error ?? status}
            </span>
          ) : null
        }
      >
        <div className="bdesigner">
          <div className="bdesigner__list">
            <div className="fv-list__toolbar si-list-toolbar__row">
              <button type="button" className="wpf-action-button" onClick={() => void handleCreate()}>
                New template
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
              emptyMessage="No templates found."
            />
          </div>

          {editor && (
            <div className="bdesigner__editor">
              <div className="mf-form__section-title">Template settings</div>
              <div className="mf-form__grid mf-form__grid--2">
                <label className="mf-form__field">
                  <span className="wpf-subpage-form-label">Name</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={editor.name}
                    onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                  />
                </label>
                <label className="mf-form__field">
                  <span className="wpf-subpage-form-label">Description</span>
                  <input
                    className="wpf-subpage-form-input"
                    value={editor.description ?? ''}
                    onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                  />
                </label>
                <label className="mf-form__field mf-form__field--check">
                  <input
                    type="checkbox"
                    checked={editor.isDefault}
                    onChange={(e) => setEditor({ ...editor, isDefault: e.target.checked })}
                  />
                  <span>Default for doc type</span>
                </label>
                <label className="mf-form__field mf-form__field--check">
                  <input
                    type="checkbox"
                    checked={editor.isActive}
                    onChange={(e) => setEditor({ ...editor, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="bdesigner__mode-tabs">
                <button
                  type="button"
                  className={editorMode === 'visual' ? 'wpf-primary-button' : 'wpf-secondary-button'}
                  onClick={() => setEditorMode('visual')}
                >
                  Visual designer
                </button>
                <button
                  type="button"
                  className={editorMode === 'json' ? 'wpf-primary-button' : 'wpf-secondary-button'}
                  onClick={() => setEditorMode('json')}
                >
                  JSON editor
                </button>
              </div>

              {editorMode === 'visual' && layoutJson ? (
                <BillLayoutCanvas
                  layout={layoutJson}
                  onChange={(next) => {
                    setLayoutJson(next);
                    setLayoutText(JSON.stringify(next, null, 2));
                  }}
                />
              ) : (
                <>
                  <div className="mf-form__section-title">Layout JSON</div>
                  <textarea
                    className="bdesigner__layout"
                    value={layoutText}
                    onChange={(e) => {
                      setLayoutText(e.target.value);
                      try {
                        setLayoutJson(JSON.parse(e.target.value) as BillLayoutJson);
                      } catch {
                        // keep previous parsed layout until valid JSON
                      }
                    }}
                    spellCheck={false}
                  />
                </>
              )}

              <div className="mf-form__actions">
                <button type="button" className="wpf-primary-button" disabled={saving} onClick={() => void saveMeta()}>
                  Save settings
                </button>
                <button type="button" className="wpf-primary-button" disabled={saving} onClick={() => void saveLayout()}>
                  Save layout
                </button>
                <button type="button" className="wpf-secondary-button" onClick={openPrintPreview}>
                  Print preview
                </button>
                <button type="button" className="wpf-secondary-button" onClick={() => void handleExport()}>
                  Export JSON
                </button>
                <button type="button" className="wpf-secondary-button" onClick={() => void handleDuplicate()}>
                  Duplicate
                </button>
                <button
                  type="button"
                  className="wpf-secondary-button"
                  disabled={editor.isSystem}
                  onClick={() => void handleDelete()}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
