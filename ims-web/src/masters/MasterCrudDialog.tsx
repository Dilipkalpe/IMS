import { useEffect, useState } from 'react';
import type { MasterCrudField } from './masterConfigs';
import { readImageFileAsDataUri, resolveCompanyLogoUrl, hasCompanyLogoReference } from '../api/companies';
import './master-form.scss';

export interface MasterCrudDialogProps {
  title: string;
  open: boolean;
  mode: 'new' | 'edit';
  fields: MasterCrudField[];
  initialValues: Record<string, unknown>;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => void;
}

function fieldValue(values: Record<string, unknown>, key: string): string {
  const value = values[key];
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function MasterCrudDialog({
  title,
  open,
  mode,
  fields,
  initialValues,
  saving = false,
  error = null,
  onClose,
  onSave,
}: MasterCrudDialogProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  useEffect(() => {
    if (open) setValues(initialValues);
  }, [initialValues, open]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: Record<string, unknown> = { ...values };
    for (const field of fields) {
      if (field.type === 'boolean') {
        payload[field.key] = fieldValue(values, field.key) === 'true';
      } else if (field.type === 'number') {
        payload[field.key] = Number(fieldValue(values, field.key) || 0);
      } else if (field.type === 'password') {
        const raw = fieldValue(values, field.key);
        if (raw) payload.password = raw;
      } else {
        payload[field.key] = fieldValue(values, field.key);
      }
    }
    onSave(payload);
  };

  return (
    <div className="master-crud-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="master-crud-dialog__backdrop" aria-label="Close" onClick={onClose} />
      <form className="master-crud-dialog__panel" onSubmit={handleSubmit}>
        <div className="mf-form__section-title">{mode === 'new' ? `New ${title}` : `Edit ${title}`}</div>
        {error && (
          <p className="fv-entry__status" role="alert">
            {error}
          </p>
        )}
        <div className="mf-form__grid mf-form__grid--2">
          {fields.map((field) => {
            if (field.type === 'boolean') {
              return (
                <label key={field.key} className="mf-form__field mf-form__field--check">
                  <input
                    type="checkbox"
                    checked={fieldValue(values, field.key) === 'true'}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.checked }))}
                    disabled={field.readOnly}
                  />
                  <span>{field.label}</span>
                </label>
              );
            }
            if (field.type === 'image') {
              const preview = fieldValue(values, field.key);
              const previewSrc = resolveCompanyLogoUrl(preview);
              return (
                <div key={field.key} className="mf-form__field mf-form__field--image">
                  <span className="wpf-subpage-form-label">{field.label}</span>
                  <div className="mf-form__image-preview">
                    {hasCompanyLogoReference(preview) ? (
                      <img src={previewSrc} alt="Company logo preview" />
                    ) : (
                      <span className="mf-form__image-placeholder">No logo uploaded</span>
                    )}
                  </div>
                  <div className="mf-form__image-actions">
                    <label className="wpf-secondary-button mf-form__image-upload">
                      Upload image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        hidden
                        disabled={field.readOnly || saving}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          try {
                            const dataUri = await readImageFileAsDataUri(file);
                            setValues((prev) => ({ ...prev, [field.key]: dataUri }));
                          } catch (err) {
                            window.alert(err instanceof Error ? err.message : 'Could not upload image.');
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="wpf-secondary-button"
                      disabled={field.readOnly || saving || !preview}
                      onClick={() => setValues((prev) => ({ ...prev, [field.key]: '' }))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <label key={field.key} className="mf-form__field">
                <span className="wpf-subpage-form-label">{field.label}</span>
                <input
                  className="wpf-subpage-form-input"
                  type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                  value={fieldValue(values, field.key)}
                  readOnly={field.readOnly}
                  required={field.required}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </label>
            );
          })}
        </div>
        <div className="mf-form__actions">
          <button type="submit" className="wpf-primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="wpf-secondary-button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
