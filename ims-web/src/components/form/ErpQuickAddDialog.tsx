import { useEffect, useState } from 'react';
import type { QuickAddConfig } from './searchableSelectTypes';
import { ErpFormGrid } from './ErpFormGrid';
import { ErpFormSection } from './ErpFormSection';
import './erp-searchable-combobox.scss';

export interface ErpQuickAddDialogProps {
  open: boolean;
  searchTerm: string;
  config: QuickAddConfig;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}

function buildInitialValues(config: QuickAddConfig, searchTerm: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of config.fields) {
    if (field.prefillFromSearch && searchTerm.trim()) {
      values[field.key] = searchTerm.trim();
    } else {
      values[field.key] = '';
    }
  }
  return values;
}

export function ErpQuickAddDialog({
  open,
  searchTerm,
  config,
  saving = false,
  error = null,
  onClose,
  onSave,
}: ErpQuickAddDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialValues(config, searchTerm),
  );

  useEffect(() => {
    if (open) setValues(buildInitialValues(config, searchTerm));
  }, [config, open, searchTerm]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(values);
  };

  return (
    <div className="erp-quick-add-dialog" role="dialog" aria-modal="true" aria-label={`Add ${config.entityLabel}`}>
      <button type="button" className="erp-quick-add-dialog__backdrop" aria-label="Close" onClick={onClose} />
      <form className="erp-quick-add-dialog__panel" onSubmit={handleSubmit}>
        <ErpFormSection>
          <div className="erp-form-section__title">Add {config.entityLabel}</div>
          {error && (
            <p className="erp-quick-add-dialog__error" role="alert">
              {error}
            </p>
          )}
          <ErpFormGrid columns={1}>
            {config.fields.map((field) => (
              <label key={field.key} className="erp-form-field">
                <span className="wpf-subpage-form-label">
                  {field.label}
                  {field.required ? ' *' : ''}
                </span>
                <input
                  className="wpf-subpage-form-input"
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={values[field.key] ?? ''}
                  readOnly={field.readOnly}
                  required={field.required}
                  placeholder={field.placeholder}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </label>
            ))}
          </ErpFormGrid>
          <div className="erp-quick-add-dialog__actions">
            <button type="submit" className="wpf-primary-button" disabled={saving}>
              {saving ? 'Saving…' : `Save ${config.entityLabel}`}
            </button>
            <button type="button" className="wpf-secondary-button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </ErpFormSection>
      </form>
    </div>
  );
}
