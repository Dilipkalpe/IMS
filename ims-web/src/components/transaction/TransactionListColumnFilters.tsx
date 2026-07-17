import type { TransactionListColumnFilters as ColumnFiltersState } from './transactionListQuery';

const FILTER_DEBOUNCE_MS = 350;

export interface TransactionListColumnFilterDef {
  key: keyof ColumnFiltersState;
  placeholder: string;
  width?: number | string;
}

export interface TransactionListColumnFiltersProps {
  columns: TransactionListColumnFilterDef[];
  values: ColumnFiltersState;
  gridTemplate: string;
  disabled?: boolean;
  onChange: (key: keyof ColumnFiltersState, value: string) => void;
}

export function TransactionListColumnFilters({
  columns,
  values,
  gridTemplate,
  disabled = false,
  onChange,
}: TransactionListColumnFiltersProps) {
  return (
    <div className="si-list-column-filters-scroll">
      <div
        className="si-list-column-filters"
        style={{ gridTemplateColumns: gridTemplate }}
        role="row"
      >
        <div className="si-list-column-filters__spacer" aria-hidden />
        {columns.map((col) => (
          <input
            key={col.key}
            type="search"
            className="wpf-sales-compact-input si-list-column-filters__input"
            style={col.width ? { width: col.width } : undefined}
            placeholder={col.placeholder}
            value={values[col.key]}
            disabled={disabled}
            onChange={(e) => onChange(col.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Debounce column filter changes in parent via useEffect on columnFilters state. */
export const COLUMN_FILTER_DEBOUNCE_MS = FILTER_DEBOUNCE_MS;
