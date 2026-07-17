import { useCallback, useState } from 'react';
import { ApiError, probeApiHealth } from '../api/client';
import {
  fetchPendingDeliveryLines,
  fetchPendingSalesOrdersForDelivery,
  type PendingSalesOrderHeader,
  type SalesOrderReference,
} from '../api/salesOrders';
import { SalesOrderMultiPickDialog } from '../components/transaction/SalesOrderMultiPickDialog';
import {
  buildSoReferenceText,
  mapPendingDeliveryLinesToDcLines,
} from './salesOrderConsolidation';
import type { useDeliveryChallanDocument } from './useDeliveryChallanDocument';
import { useDeliveryChallanWorkspace } from './workspace/DeliveryChallanWorkspaceProvider';

type Doc = ReturnType<typeof useDeliveryChallanDocument>;

export function useDeliveryChallanSalesOrderPick(tabId: string, doc: Doc) {
  const ws = useDeliveryChallanWorkspace();
  const [pickOpen, setPickOpen] = useState(false);
  const [pickOrders, setPickOrders] = useState<PendingSalesOrderHeader[]>([]);
  const [pickBusy, setPickBusy] = useState(false);

  const closePick = useCallback(() => {
    setPickOpen(false);
    setPickOrders([]);
  }, []);

  const applyLoadedLines = useCallback(
    (selected: SalesOrderReference[], lines: ReturnType<typeof mapPendingDeliveryLinesToDcLines>) => {
      const soReference = buildSoReferenceText(selected);
      ws.replaceLinesFromSalesOrders(tabId, lines, soReference);
      closePick();
    },
    [closePick, tabId, ws],
  );

  const loadLinesForOrders = useCallback(
    async (selected: SalesOrderReference[]) => {
      const customer = doc.header.customer.trim();
      setPickBusy(true);
      try {
        const response = await fetchPendingDeliveryLines(customer, selected);
        if (!response.lines?.length) {
          doc.setStatus('No pending lines found on selected sales orders.');
          return;
        }
        const lines = mapPendingDeliveryLinesToDcLines(response.lines, doc.header);
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
    async (selected: SalesOrderReference[]) => {
      if (doc.lines.length > 0) {
        const ok = window.confirm(
          'Replace current line items with pending lines from selected sales orders?',
        );
        if (!ok) return;
      }
      await loadLinesForOrders(selected);
    },
    [doc.lines.length, loadLinesForOrders],
  );

  const startLoadFromSalesOrders = useCallback(async () => {
    const customer = doc.header.customer?.trim();
    if (!customer) {
      doc.setStatus('Enter or select a customer before loading sales orders.');
      return;
    }

    setPickBusy(true);
    try {
      const healthy = await probeApiHealth();
      if (!healthy) {
        doc.setStatus('API is not available to load sales orders.');
        return;
      }

      const pending = await fetchPendingSalesOrdersForDelivery(customer);
      if (!pending.items?.length) {
        doc.setStatus(
          `No open or partially delivered sales orders with pending quantity for customer "${customer}".`,
        );
        return;
      }

      setPickOrders(pending.items);
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
    <SalesOrderMultiPickDialog
      open={pickOpen}
      customer={doc.header.customer}
      orders={pickOrders}
      isBusy={pickBusy}
      onClose={closePick}
      onConfirm={confirmPick}
    />
  );

  return {
    startLoadFromSalesOrders,
    pickBusy,
    pickDialog,
  };
}
