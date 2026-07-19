import { useMemo } from 'react';
import { customerQuickAddConfig, ErpSearchableCombobox } from '../form';
import { useSalesCustomerPicker } from './SalesCustomerPickerContext';

export interface SalesCustomerSelectProps {
  value: string;
  onChange: (value: string) => void;
  fieldFocusKey?: string;
  error?: string;
  disabled?: boolean;
}

/** Searchable customer picker — options from GET /api/accounts/names?type=customer */
export function SalesCustomerSelect({
  value,
  onChange,
  fieldFocusKey = 'customer',
  error,
  disabled,
}: SalesCustomerSelectProps) {
  const { customers, loading, reload } = useSalesCustomerPicker();

  const options = useMemo(
    () =>
      customers.map((name) => ({
        value: name,
        label: name,
      })),
    [customers],
  );

  return (
    <ErpSearchableCombobox
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Search customer…"
      loading={loading}
      disabled={disabled}
      error={error}
      fieldFocusKey={fieldFocusKey}
      allowClear={false}
      quickAdd={customerQuickAddConfig}
      onQuickAddSuccess={() => {
        void reload();
      }}
      aria-label="Customer"
    />
  );
}
