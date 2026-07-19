import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { FIELD_FOCUS_KEY } from '../../keyboard/formKeyboardNavigation';
import { ErpQuickAddDialog } from './ErpQuickAddDialog';
import type { ErpSearchableComboboxProps, SearchableOption } from './searchableSelectTypes';
import './erp-searchable-combobox.scss';

const DEFAULT_DEBOUNCE_MS = 300;

function normalizeTerm(value: string): string {
  return value.trim().toLowerCase();
}

function optionSearchHaystack(option: SearchableOption): string {
  return normalizeTerm(option.searchText ?? option.label ?? option.value);
}

function filterOptions(options: readonly SearchableOption[], term: string): SearchableOption[] {
  const needle = normalizeTerm(term);
  if (!needle) return [...options];
  return options.filter((option) => optionSearchHaystack(option).includes(needle));
}

function findOptionLabel(options: readonly SearchableOption[], value: string): string {
  const hit = options.find((o) => o.value === value);
  return hit?.label ?? value;
}

export function ErpSearchableCombobox({
  value,
  onChange,
  options,
  placeholder = 'Type to search…',
  loading = false,
  disabled = false,
  error,
  fieldFocusKey,
  allowClear = true,
  onSearch,
  searchDebounceMs = DEFAULT_DEBOUNCE_MS,
  quickAdd,
  onQuickAddSuccess,
  className,
  id: idProp,
  'aria-label': ariaLabel,
}: ErpSearchableComboboxProps) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const listboxId = `${inputId}-listbox`;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);

  const selectedLabel = useMemo(() => findOptionLabel(options, value), [options, value]);

  const filteredOptions = useMemo(() => filterOptions(options, inputText), [inputText, options]);

  const showAddNew =
    !!quickAdd &&
    !loading &&
    inputText.trim().length > 0 &&
    filteredOptions.length === 0;

  const listItems = showAddNew ? [] : filteredOptions;

  useEffect(() => {
    if (!open) {
      setInputText(selectedLabel || value);
    }
  }, [open, selectedLabel, value]);

  useEffect(() => {
    if (!onSearch) return;
    const timer = window.setTimeout(() => {
      onSearch(inputText);
    }, searchDebounceMs);
    return () => window.clearTimeout(timer);
  }, [inputText, onSearch, searchDebounceMs]);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const selectOption = useCallback(
    (option: SearchableOption) => {
      onChange(option.value);
      setInputText(option.label);
      setOpen(false);
      setHighlightIndex(-1);
    },
    [onChange],
  );

  const clearSelection = useCallback(() => {
    onChange('');
    setInputText('');
    setOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const openQuickAdd = useCallback(() => {
    setQuickAddError(null);
    setQuickAddOpen(true);
    setOpen(false);
  }, []);

  const handleQuickAddSave = useCallback(
    async (formValues: Record<string, string>) => {
      if (!quickAdd) return;
      setQuickAddSaving(true);
      setQuickAddError(null);
      try {
        const created = await quickAdd.create(formValues);
        onChange(created.value);
        setInputText(created.label);
        setQuickAddOpen(false);
        onQuickAddSuccess?.(created);
      } catch (err) {
        setQuickAddError(err instanceof Error ? err.message : 'Could not create record.');
      } finally {
        setQuickAddSaving(false);
      }
    },
    [onChange, onQuickAddSuccess, quickAdd],
  );

  const onInputFocus = () => {
    setOpen(true);
    setInputText((prev) => (prev === selectedLabel ? '' : prev));
  };

  const onInputChange = (next: string) => {
    setInputText(next);
    setOpen(true);
    setHighlightIndex(-1);
    if (!next.trim() && allowClear) {
      onChange('');
    }
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((prev) => Math.min(prev + 1, listItems.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setInputText(selectedLabel || value);
      setHighlightIndex(-1);
      return;
    }
    if (event.key === 'Enter' && open) {
      if (highlightIndex >= 0 && listItems[highlightIndex]) {
        event.preventDefault();
        event.stopPropagation();
        selectOption(listItems[highlightIndex]);
        return;
      }
      if (showAddNew) {
        event.preventDefault();
        event.stopPropagation();
        openQuickAdd();
        return;
      }
      const exact = filteredOptions.find(
        (o) =>
          normalizeTerm(o.label) === normalizeTerm(inputText) ||
          normalizeTerm(o.value) === normalizeTerm(inputText),
      );
      if (exact) {
        event.preventDefault();
        event.stopPropagation();
        selectOption(exact);
      }
    }
  };

  const inputClassName = [
    'wpf-subpage-form-input',
    'erp-searchable-combobox__input',
    error ? 'si-input--error' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        ref={rootRef}
        className={`erp-searchable-combobox${disabled ? ' erp-searchable-combobox--disabled' : ''}`}
      >
        <div className="erp-searchable-combobox__control">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            className={inputClassName}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-invalid={!!error}
            aria-busy={loading}
            aria-label={ariaLabel}
            {...(fieldFocusKey ? { [FIELD_FOCUS_KEY]: fieldFocusKey } : {})}
            value={inputText}
            placeholder={loading ? 'Loading…' : placeholder}
            disabled={disabled || loading}
            autoComplete="off"
            onFocus={onInputFocus}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onInputKeyDown}
          />
          {allowClear && value && !disabled && !loading ? (
            <button
              type="button"
              className="erp-searchable-combobox__clear"
              aria-label="Clear selection"
              tabIndex={-1}
              onClick={clearSelection}
            >
              ×
            </button>
          ) : null}
        </div>

        {open && !disabled ? (
          <ul id={listboxId} className="erp-searchable-combobox__list" role="listbox">
            {loading ? (
              <li className="erp-searchable-combobox__status">Loading…</li>
            ) : listItems.length === 0 && !showAddNew ? (
              <li className="erp-searchable-combobox__status">
                {inputText.trim() ? 'No matches' : 'No options'}
              </li>
            ) : (
              listItems.map((option, index) => (
                <li
                  key={`${option.value}::${option.label}`}
                  role="option"
                  aria-selected={option.value === value}
                  className={[
                    'erp-searchable-combobox__option',
                    index === highlightIndex ? 'erp-searchable-combobox__option--highlight' : '',
                    option.value === value ? 'erp-searchable-combobox__option--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  {option.label}
                </li>
              ))
            )}
            {showAddNew && quickAdd ? (
              <li className="erp-searchable-combobox__add">
                <button
                  type="button"
                  className="erp-searchable-combobox__add-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={openQuickAdd}
                >
                  Add new &ldquo;{inputText.trim()}&rdquo;
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {error ? (
        <span className="si-field-error" role="alert">
          {error}
        </span>
      ) : null}

      {quickAdd ? (
        <ErpQuickAddDialog
          open={quickAddOpen}
          searchTerm={inputText}
          config={quickAdd}
          saving={quickAddSaving}
          error={quickAddError}
          onClose={() => {
            if (!quickAddSaving) setQuickAddOpen(false);
          }}
          onSave={(formValues) => {
            void handleQuickAddSave(formValues);
          }}
        />
      ) : null}
    </>
  );
}
