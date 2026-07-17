import { useCallback, useRef, useState } from 'react';
import { downloadImportTemplate, importExcelFile } from '../api/import';
import { useAppNavigation } from '../context/AppNavigationContext';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import './import-page.scss';

export interface ImportPageScreenProps {
  importType: string;
  entityLabel: string;
  targetNavKey: string;
  targetSectionTitle: string;
}

export function ImportPageScreen({
  importType,
  entityLabel,
  targetNavKey,
  targetSectionTitle,
}: ImportPageScreenProps) {
  const navigate = useAppNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [importSucceeded, setImportSucceeded] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    'Step 1: Download format · Step 2: Fill Excel · Step 3: Upload and import',
  );
  const [summaryText, setSummaryText] = useState('');
  const [logLines, setLogLines] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setLogLines((prev) => [line, ...prev]);
  }, []);

  const downloadTemplate = useCallback(async () => {
    setBusy(true);
    setStatusMessage('Downloading template…');
    try {
      await downloadImportTemplate(importType);
      setStatusMessage('Template downloaded. Fill the Excel file and import.');
      appendLog(`Template downloaded for ${entityLabel}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Template download failed.';
      setStatusMessage(msg);
      appendLog(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [appendLog, entityLabel, importType]);

  const browseFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback(
    (file: File | null) => {
      setSelectedFile(file);
      setImportSucceeded(false);
      if (file) {
        setStatusMessage(`Selected: ${file.name}`);
        appendLog(`File selected: ${file.name}`);
      }
    },
    [appendLog],
  );

  const runImport = useCallback(async () => {
    if (!selectedFile) return;
    setBusy(true);
    setImportSucceeded(false);
    setStatusMessage('Importing…');
    setSummaryText('');
    try {
      const result = await importExcelFile(importType, selectedFile);
      const summary = `Imported ${result.imported}, failed ${result.failed}.`;
      setSummaryText(summary);
      setStatusMessage(result.success ? 'Import completed.' : 'Import finished with errors.');
      setImportSucceeded(result.imported > 0);
      appendLog(summary);
      if (result.documents.length > 0) {
        appendLog(`Documents: ${result.documents.join(', ')}`);
      }
      for (const err of result.errors) {
        appendLog(`Row ${err.row}: ${err.message}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed.';
      setStatusMessage(msg);
      appendLog(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [appendLog, importType, selectedFile]);

  const goToSection = useCallback(() => {
    navigate(targetNavKey);
  }, [navigate, targetNavKey]);

  return (
    <RefinedScreenShell>
      <TransactionEntryShell
        title={`Import ${entityLabel}`}
        titleRight={<span role="status">{statusMessage}</span>}
      >
        <div className="import-page">
          <p className="import-page__desc">
            Download the Excel format, fill {entityLabel.toLowerCase()} data, upload the file, and
            import into the database.
          </p>

          <section className="import-page__card">
            <div className="import-page__actions">
              <button
                type="button"
                className="wpf-action-button"
                disabled={busy}
                onClick={() => void downloadTemplate()}
              >
                Download Excel Format
              </button>
              <button type="button" className="wpf-secondary-button" disabled={busy} onClick={browseFile}>
                Browse File…
              </button>
              <button
                type="button"
                className="wpf-action-button"
                disabled={busy || !selectedFile}
                onClick={() => void runImport()}
              >
                Import Data
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="import-page__file-input"
              onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
            />

            <div className="import-page__file-row">
              <span className="import-page__file-label">Selected file:</span>
              <input
                type="text"
                className="wpf-subpage-form-input import-page__file-display"
                value={selectedFile?.name ?? ''}
                readOnly
              />
              {importSucceeded ? (
                <button type="button" className="wpf-secondary-button" onClick={goToSection}>
                  Open {targetSectionTitle}
                </button>
              ) : null}
            </div>
          </section>

          {summaryText ? <p className="import-page__summary">{summaryText}</p> : null}

          <section className="import-page__card">
            <h3 className="import-page__log-title">Import log</h3>
            <div className="import-page__log">
              {logLines.length === 0 ? (
                <p className="import-page__log-empty">No activity yet.</p>
              ) : (
                logLines.map((line, idx) => (
                  <p key={`${idx}-${line}`} className="import-page__log-line">
                    {line}
                  </p>
                ))
              )}
            </div>
          </section>
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
