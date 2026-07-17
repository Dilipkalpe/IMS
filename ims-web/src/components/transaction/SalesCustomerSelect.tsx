import { useMemo } from 'react';
import { FIELD_FOCUS_KEY } from '../../keyboard/FormKeyboardScope';
import { useSalesCustomerPicker } from './SalesCustomerPickerContext';

export interface SalesCustomerSelectProps {
  value: string;
  onChange: (value: string) => void;
  fieldFocusKey?: string;
  error?: string;
  disabled?: boolean;
}

/** WPF Customer Name combo — options from GET /api/accounts/names?type=customer */
export function SalesCustomerSelect({
  value,
  onChange,
  fieldFocusKey = 'customer',
  error,
  disabled,
}: SalesCustomerSelectProps) {
  const { customers, loading } = useSalesCustomerPicker();

  const options = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed || loading) return customers;
    const known = customers.some(
      (c) => c.localeCompare(trimmed, undefined, { sensitivity: 'accent' }) === 0,
    );
    return known ? customers : [...customers, trimmed];
  }, [customers, loading, value]);

  return (
    <>
      <select
        className={`wpf-subpage-form-combo${error ? ' si-input--error' : ''}`}
        {...{ [FIELD_FOCUS_KEY]: fieldFocusKey }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        disabled={disabled || loading}
        aria-busy={loading}
      >
        {loading ? (
          <option value={value || ''}>Loading customers…</option>
        ) : (
          <>
            {!value.trim() ? (
              <option value="">— Select customer —</option>
            ) : null}
            {options.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </>
        )}
      </select>
      {error && (
        <span className="si-field-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
