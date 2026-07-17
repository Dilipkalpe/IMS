import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PendingSalesOrderHeader, SalesOrderReference } from '../../api/salesOrders';
import {
  formatSalesOrderDate,
  formatSalesOrderStatus,
} from '../../delivery-challan/salesOrderConsolidation';

export interface SalesOrderMultiPickDialogProps {
  open: boolean;
  customer: string;
  orders: PendingSalesOrderHeader[];
  isBusy?: boolean;
  onClose: () => void;
  onConfirm: (selected: SalesOrderReference[]) => void | Promise<void>;
}

export function SalesOrderMultiPickDialog({
  open,
  customer,
  orders,
  isBusy = false,
  onClose,
  onConfirm,
}: SalesOrderMultiPickDialogProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [statusMessage, setStatusMessage] = useState('');
  const [confirming, setConfirming] = useState(false);

  const orderKey = useCallback(
    (order: PendingSalesOrderHeader) =>
      `${order.soPrefix}|${order.docNo}`.toUpperCase(),
    [],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedKeys(new Set());
    setStatusMessage('');
  }, [open, orders]);

  const selectedCount = selectedKeys.size;

  const toggleRow = useCallback(
    (order: PendingSalesOrderHeader, checked: boolean) => {
      const key = orderKey(order);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (checked) next.add(key);
        else next.delete(key);
        return next;
      });
      setStatusMessage('');
    },
    [orderKey],
  );

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(orders.map((o) => orderKey(o))));
    setStatusMessage('');
  }, [orderKey, orders]);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    setStatusMessage('');
  }, []);

  const handleConfirm = useCallback(async () => {
    const selected = orders.filter((o) => selectedKeys.has(orderKey(o)));
    if (selected.length === 0) {
      setStatusMessage('Select at least one sales order.');
      return;
    }
    setConfirming(true);
    try {
      await onConfirm(
        selected.map((o) => ({
          soPrefix: o.soPrefix,
          docNo: o.docNo,
          formattedDocNo: o.formattedDocNo,
        })),
      );
    } finally {
      setConfirming(false);
    }
  }, [onConfirm, orderKey, orders, selectedKeys]);

  const helpText = useMemo(
    () =>
      'Select one or more Open / Partially Delivered sales orders with pending quantity.',
    [],
  );

  if (!open) return null;

  const busy = isBusy || confirming;

  return (
    <div className="si-so-pick-overlay" role="presentation" onClick={onClose}>
      <div
        className="si-so-pick"
        role="dialog"
        aria-modal="true"
        aria-labelledby="si-so-pick-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="si-so-pick-title" className="si-so-pick__title">
          Select Sales Orders
        </h2>
        <p className="si-so-pick__help">
          <strong>Customer:</strong> {customer}
          <br />
          {helpText}
        </p>

        <div className="si-so-pick__toolbar">
          <button type="button" className="wpf-secondary-button" disabled={busy} onClick={selectAll}>
            Select all
          </button>
          <button type="button" className="wpf-secondary-button" disabled={busy} onClick={clearSelection}>
            Clear
          </button>
          {selectedCount > 0 ? (
            <span className="si-so-pick__selected-count">{selectedCount} selected</span>
          ) : null}
        </div>

        <div className="si-so-pick__grid-wrap">
          <table className="si-so-pick__grid">
            <thead>
              <tr>
                <th className="si-so-pick__col-check">Select</th>
                <th>SO No</th>
                <th>Date</th>
                <th>Status</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const key = orderKey(order);
                const checked = selectedKeys.has(key);
                return (
                  <tr key={key}>
                    <td className="si-so-pick__col-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={(e) => toggleRow(order, e.target.checked)}
                        aria-label={`Select ${order.formattedDocNo}`}
                      />
                    </td>
                    <td>{order.formattedDocNo}</td>
                    <td>{formatSalesOrderDate(order.soDate)}</td>
                    <td>{formatSalesOrderStatus(order.status)}</td>
                    <td>{order.customer}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="si-so-pick__footer">
          {statusMessage ? <p className="si-so-pick__status">{statusMessage}</p> : <span />}
          <div className="si-so-pick__actions">
            <button
              type="button"
              className="wpf-action-button"
              disabled={busy}
              onClick={() => void handleConfirm()}
            >
              Load lines
            </button>
            <button type="button" className="wpf-secondary-button" disabled={busy} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
