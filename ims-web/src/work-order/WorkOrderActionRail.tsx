import './work-order-action-rail.scss';

export interface WorkOrderActionRailProps {
  saving?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onSave: () => void;
  onPrint?: () => void;
  onClose: () => void;
}

/** Job work entry actions — Save, Print, and Close/Cancel, aligned with finance voucher rails. */
export function WorkOrderActionRail({
  saving = false,
  readOnly = false,
  disabled = false,
  onSave,
  onPrint,
  onClose,
}: WorkOrderActionRailProps) {
  const busy = saving || disabled;

  return (
    <div className="wo-action-rail" role="toolbar" aria-label="Job work actions">
      {!readOnly ? (
        <button type="button" className="wpf-primary-button" disabled={busy} onClick={onSave}>
          {saving ? 'Saving…' : 'Save & post stock'}
        </button>
      ) : null}
      {onPrint ? (
        <button type="button" className="wpf-secondary-button" disabled={saving} onClick={onPrint}>
          Print
        </button>
      ) : null}
      <button type="button" className="wpf-secondary-button" disabled={saving} onClick={onClose}>
        {readOnly ? 'Back to list' : 'Cancel'}
      </button>
    </div>
  );
}
