import { useCallback, useEffect, useRef, useState } from 'react';
import './ConfirmationPasswordDialog.scss';

export interface ConfirmationPasswordDialogProps {
  open: boolean;
  title: string;
  description: string;
  errorMessage?: string | null;
  busy?: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

/** WPF: ConfirmationPasswordWindow */
export function ConfirmationPasswordDialog({
  open,
  title,
  description,
  errorMessage,
  busy = false,
  onSubmit,
  onCancel,
}: ConfirmationPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setPassword('');
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const submit = useCallback(() => {
    onSubmit(password);
  }, [onSubmit, password]);

  if (!open) return null;

  return (
    <div className="confirm-password-overlay" role="presentation" onClick={onCancel}>
      <div
        className="confirm-password-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-password-title" className="confirm-password-dialog__title">
          {title}
        </h2>
        <p className="confirm-password-dialog__desc">{description}</p>
        <label className="confirm-password-dialog__field">
          <span className="wpf-subpage-form-label">Confirmation password</span>
          <input
            ref={inputRef}
            type="password"
            className="wpf-subpage-form-input"
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onCancel();
            }}
          />
        </label>
        {errorMessage ? (
          <p className="confirm-password-dialog__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="confirm-password-dialog__actions">
          <button type="button" className="wpf-primary-button" disabled={busy} onClick={submit}>
            {busy ? 'Verifying…' : 'Confirm'}
          </button>
          <button type="button" className="wpf-secondary-button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
