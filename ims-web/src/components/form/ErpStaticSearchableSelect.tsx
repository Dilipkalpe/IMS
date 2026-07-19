import { useMemo } from 'react';
import { ErpSearchableCombobox } from './ErpSearchableCombobox';
import type { SearchableOption } from './searchableSelectTypes';

export interface ErpStaticSearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | readonly SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  fieldFocusKey?: string;
  allowClear?: boolean;
  className?: string;
  'aria-label'?: string;
}

function toSearchableOptions(options: readonly string[] | readonly SearchableOption[]): SearchableOption[] {
  return options.map((item) =>
    typeof item === 'string' ? { value: item, label: item } : item,
  );
}

/** Search/filter-only select for small static enums (no quick-add). */
export function ErpStaticSearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Type to filter…',
  disabled,
  error,
  fieldFocusKey,
  allowClear = false,
  className,
  'aria-label': ariaLabel,
}: ErpStaticSearchableSelectProps) {
  const searchableOptions = useMemo(() => toSearchableOptions(options), [options]);

  return (
    <ErpSearchableCombobox
      value={value}
      onChange={onChange}
      options={searchableOptions}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      fieldFocusKey={fieldFocusKey}
      allowClear={allowClear}
      className={className}
      aria-label={ariaLabel}
    />
  );
}
