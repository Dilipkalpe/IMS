import { useMemo } from 'react';
import { ErpSearchableCombobox, supplierQuickAddConfig } from '../form';
import { usePurchaseSupplierPicker } from './PurchaseSupplierPickerContext';

export interface PurchaseSupplierSelectProps {
  value: string;
  onChange: (value: string) => void;
  fieldFocusKey?: string;
  error?: string;
  disabled?: boolean;
}

/** Searchable supplier picker — options from GET /api/accounts/names?type=supplier */
export function PurchaseSupplierSelect({
  value,
  onChange,
  fieldFocusKey = 'supplier',
  error,
  disabled,
}: PurchaseSupplierSelectProps) {
  const { suppliers, loading, reload } = usePurchaseSupplierPicker();

  const options = useMemo(
    () =>
      suppliers.map((name) => ({
        value: name,
        label: name,
      })),
    [suppliers],
  );

  return (
    <ErpSearchableCombobox
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Search supplier…"
      loading={loading}
      disabled={disabled}
      error={error}
      fieldFocusKey={fieldFocusKey}
      allowClear={false}
      quickAdd={supplierQuickAddConfig}
      onQuickAddSuccess={() => {
        void reload();
      }}
      aria-label="Supplier"
    />
  );
}
