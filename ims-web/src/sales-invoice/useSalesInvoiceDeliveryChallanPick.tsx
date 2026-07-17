import { useCallback, useState } from 'react';
import { ApiError, probeApiHealth } from '../api/client';
import {
  fetchPendingDeliveryChallansForInvoice,
  fetchPendingInvoiceLines,
  type DeliveryChallanReference,
  type PendingDeliveryChallanHeader,
} from '../api/deliveryChallans';
import { DeliveryChallanMultiPickDialog } from '../components/transaction/DeliveryChallanMultiPickDialog';
import {
  buildDcReferenceText,
  mapPendingInvoiceLinesToSiLines,
} from './deliveryChallanConsolidation';
import type { useSalesInvoiceDocument } from './useSalesInvoiceDocument';
import { useSalesInvoiceWorkspace } from './workspace/SalesInvoiceWorkspaceProvider';

type Doc = ReturnType<typeof useSalesInvoiceDocument>;

export function useSalesInvoiceDeliveryChallanPick(tabId: string, doc: Doc) {
  const ws = useSalesInvoiceWorkspace();
  const [pickOpen, setPickOpen] = useState(false);
  const [pickChallans, setPickChallans] = useState<PendingDeliveryChallanHeader[]>([]);
  const [pickBusy, setPickBusy] = useState(false);

  const closePick = useCallback(() => {
    setPickOpen(false);
    setPickChallans([]);
  }, []);

  const applyLoadedLines = useCallback(
    (selected: DeliveryChallanReference[], lines: ReturnType<typeof mapPendingInvoiceLinesToSiLines>) => {
      const dcReference = buildDcReferenceText(selected);
      ws.replaceLinesFromDeliveryChallans(tabId, lines, dcReference);
      closePick();
    },
    [closePick, tabId, ws],
  );

  const loadLinesForChallans = useCallback(
    async (selected: DeliveryChallanReference[]) => {
      const customer = doc.header.customer.trim();
      setPickBusy(true);
      try {
        const response = await fetchPendingInvoiceLines(customer, selected);
        if (!response.lines?.length) {
          doc.setStatus('No pending lines found on selected delivery challans.');
          return;
        }
        const lines = mapPendingInvoiceLinesToSiLines(response.lines, doc.header);
        applyLoadedLines(selected, lines);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Load failed.';
        doc.setStatus(message);
      } finally {
        setPickBusy(false);
      }
    },
    [applyLoadedLines, doc],
  );

  const confirmPick = useCallback(
    async (selected: DeliveryChallanReference[]) => {
      if (doc.lines.length > 0) {
        const ok = window.confirm(
          'Replace current line items with pending lines from selected delivery challans?',
        );
        if (!ok) return;
      }
      await loadLinesForChallans(selected);
    },
    [doc.lines.length, loadLinesForChallans],
  );

  const startLoadFromDeliveryChallans = useCallback(async () => {
    const customer = doc.header.customer?.trim();
    if (!customer) {
      doc.setStatus('Enter or select a customer before loading delivery challans.');
      return;
    }

    setPickBusy(true);
    try {
      const healthy = await probeApiHealth();
      if (!healthy) {
        doc.setStatus('API is not available to load delivery challans.');
        return;
      }

      const pending = await fetchPendingDeliveryChallansForInvoice(customer);
      if (!pending.items?.length) {
        doc.setStatus(`No uninvoiced delivery challans found for customer "${customer}".`);
        return;
      }

      setPickChallans(pending.items);
      setPickOpen(true);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Load failed.';
      doc.setStatus(message);
    } finally {
      setPickBusy(false);
    }
  }, [doc]);

  const pickDialog = (
    <DeliveryChallanMultiPickDialog
      open={pickOpen}
      customer={doc.header.customer}
      challans={pickChallans}
      isBusy={pickBusy}
      onClose={closePick}
      onConfirm={confirmPick}
    />
  );

  return {
    startLoadFromDeliveryChallans,
    pickBusy,
    pickDialog,
  };
}
