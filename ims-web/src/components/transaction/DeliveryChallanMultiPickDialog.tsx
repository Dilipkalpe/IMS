import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DeliveryChallanReference,
  PendingDeliveryChallanHeader,
} from '../../api/deliveryChallans';
import {
  formatDeliveryChallanDate,
  formatDeliveryChallanStatus,
} from '../../sales-invoice/deliveryChallanConsolidation';

export interface DeliveryChallanMultiPickDialogProps {
  open: boolean;
  customer: string;
  challans: PendingDeliveryChallanHeader[];
  isBusy?: boolean;
  onClose: () => void;
  onConfirm: (selected: DeliveryChallanReference[]) => void | Promise<void>;
}

export function DeliveryChallanMultiPickDialog({
  open,
  customer,
  challans,
  isBusy = false,
  onClose,
  onConfirm,
}: DeliveryChallanMultiPickDialogProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [statusMessage, setStatusMessage] = useState('');
  const [confirming, setConfirming] = useState(false);

  const challanKey = useCallback(
    (challan: PendingDeliveryChallanHeader) =>
      `${challan.docPrefix}|${challan.docNo}`.toUpperCase(),
    [],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedKeys(new Set());
    setStatusMessage('');
  }, [open, challans]);

  const selectedCount = selectedKeys.size;

  const toggleRow = useCallback(
    (challan: PendingDeliveryChallanHeader, checked: boolean) => {
      const key = challanKey(challan);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (checked) next.add(key);
        else next.delete(key);
        return next;
      });
      setStatusMessage('');
    },
    [challanKey],
  );

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(challans.map((c) => challanKey(c))));
    setStatusMessage('');
  }, [challanKey, challans]);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    setStatusMessage('');
  }, []);

  const handleConfirm = useCallback(async () => {
    const selected = challans.filter((c) => selectedKeys.has(challanKey(c)));
    if (selected.length === 0) {
      setStatusMessage('Select at least one delivery challan.');
      return;
    }
    setConfirming(true);
    try {
      await onConfirm(
        selected.map((c) => ({
          docPrefix: c.docPrefix,
          docNo: c.docNo,
          formattedDocNo: c.formattedDocNo,
        })),
      );
    } finally {
      setConfirming(false);
    }
  }, [challanKey, challans, onConfirm, selectedKeys]);

  const helpText = useMemo(
    () => 'Select one or more delivery challans with pending invoice quantity.',
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
        aria-labelledby="si-dc-pick-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="si-dc-pick-title" className="si-so-pick__title">
          Select Delivery Challans
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
                <th>DC No</th>
                <th>Date</th>
                <th>Status</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((challan) => {
                const key = challanKey(challan);
                const checked = selectedKeys.has(key);
                return (
                  <tr key={key}>
                    <td className="si-so-pick__col-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={(e) => toggleRow(challan, e.target.checked)}
                        aria-label={`Select ${challan.formattedDocNo}`}
                      />
                    </td>
                    <td>{challan.formattedDocNo}</td>
                    <td>{formatDeliveryChallanDate(challan.dcDate)}</td>
                    <td>{formatDeliveryChallanStatus(challan.status)}</td>
                    <td>{challan.customer}</td>
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
