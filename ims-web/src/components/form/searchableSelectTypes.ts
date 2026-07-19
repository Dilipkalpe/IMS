/** Shared types for ErpSearchableCombobox and quick-add flows. */

export interface SearchableOption {
  /** Stored value (party name, account code, etc.) */
  value: string;
  /** Visible label in the dropdown */
  label: string;
  /** Extra text used for local filtering (defaults to label) */
  searchText?: string;
}

export type QuickAddFieldType = 'text' | 'number';

export interface QuickAddField {
  key: string;
  label: string;
  type?: QuickAddFieldType;
  required?: boolean;
  placeholder?: string;
  /** Pre-fill from the user's search term */
  prefillFromSearch?: boolean;
  readOnly?: boolean;
}

export interface QuickAddConfig {
  /** Singular entity label, e.g. "Customer" */
  entityLabel: string;
  fields: QuickAddField[];
  /** POST/create handler — return the option to select after save */
  create: (values: Record<string, string>) => Promise<SearchableOption>;
}

export interface ErpSearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SearchableOption[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  fieldFocusKey?: string;
  allowClear?: boolean;
  /** Debounced remote search; when omitted, options are filtered locally */
  onSearch?: (term: string) => void;
  searchDebounceMs?: number;
  quickAdd?: QuickAddConfig;
  /** Called after a quick-add record is created (e.g. reload picker lists) */
  onQuickAddSuccess?: (option: SearchableOption) => void;
  className?: string;
  id?: string;
  'aria-label'?: string;
}
