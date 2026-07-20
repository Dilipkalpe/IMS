import { useCallback } from 'react';
import type { DocumentTypeKey } from '../../document/contracts/documentTypes';
import type { PrintableDocumentV1 } from '../../document/contracts/printableDocument';
import { useDocumentPrintService } from '../../document/context/DocumentPrintContext';
import { openDeferredPrintWindow } from '../../document/providers/stubPrintProvider';

export interface SalesListPrintRow {
  id: string;
  billNo: string;
}

interface SalesListPrintRepository {
  loadById(id: string): Promise<unknown>;
  loadByFormatted?(formatted: string): Promise<unknown>;
}

export function useSalesListRowPrint<TRow extends SalesListPrintRow, TRecord>({
  repository,
  documentType,
  recordToPrintable,
  loadRecord,
  setStatusMessage,
}: {
  repository: SalesListPrintRepository | null | undefined;
  documentType: DocumentTypeKey;
  recordToPrintable: (record: TRecord) => PrintableDocumentV1;
  loadRecord: (row: TRow) => Promise<TRecord>;
  setStatusMessage: (message: string) => void;
}) {
  const printService = useDocumentPrintService();

  return useCallback(
    async (row: TRow) => {
      if (!repository) return;
      const previewWin = openDeferredPrintWindow();
      setStatusMessage(`Loading ${row.billNo} for print…`);
      try {
        const record = await loadRecord(row);
        const printable = recordToPrintable(record);
        const outcome = await printService.print(documentType, printable, {
          showDialog: true,
          targetWindow: previewWin,
        });
        setStatusMessage(outcome.message ?? `Print preview: ${row.billNo}`);
        if (!outcome.ok) {
          previewWin?.close();
        }
      } catch (err) {
        previewWin?.close();
        setStatusMessage(err instanceof Error ? err.message : 'Print failed.');
      }
    },
    [documentType, loadRecord, printService, recordToPrintable, repository, setStatusMessage],
  );
}

export async function loadSalesListRecord<TRow extends SalesListPrintRow, TRecord>(
  repository: SalesListPrintRepository,
  row: TRow,
  docLabel: string,
): Promise<TRecord> {
  if (row.billNo?.trim() && repository.loadByFormatted) {
    try {
      return (await repository.loadByFormatted(row.billNo.trim())) as TRecord;
    } catch {
      /* fall through */
    }
  }
  if (row.id?.trim()) {
    return (await repository.loadById(row.id)) as TRecord;
  }
  throw new Error(`${docLabel} ${row.billNo || row.id} was not found.`);
}
