import './finance-voucher-action-rail.scss';

export interface FinanceVoucherActionRailProps {
  saving?: boolean;
  disabled?: boolean;
  onSave: () => void;
  onSaveAndNext?: () => void;
  onPrint?: () => void;
  onNew?: () => void;
  onClose: () => void;
}

/** Desktop finance voucher toolbar parity — Save, Save & Next, Print, New, Close. */
export function FinanceVoucherActionRail({
  saving = false,
  disabled = false,
  onSave,
  onSaveAndNext,
  onPrint,
  onNew,
  onClose,
}: FinanceVoucherActionRailProps) {
  const busy = saving || disabled;
  return (
    <div className="fv-action-rail" role="toolbar" aria-label="Voucher actions">
      {onNew ? (
        <button type="button" className="wpf-action-button" disabled={busy} onClick={onNew}>
          New
        </button>
      ) : null}
      <button type="button" className="wpf-action-button" disabled={busy} onClick={onSave}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      {onSaveAndNext ? (
        <button type="button" className="wpf-secondary-button" disabled={busy} onClick={onSaveAndNext}>
          Save, Next
        </button>
      ) : null}
      {onPrint ? (
        <button type="button" className="wpf-secondary-button" disabled={busy} onClick={onPrint}>
          Print
        </button>
      ) : null}
      <button type="button" className="wpf-secondary-button" disabled={saving} onClick={onClose}>
        Close
      </button>
    </div>
  );
}
