import type { ReactNode } from 'react';

interface SettingsPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  danger?: boolean;
}

export function SettingsPanel({ title, description, children, className, danger }: SettingsPanelProps) {
  return (
    <section
      className={[
        'settings-panel',
        danger ? 'settings-panel--danger' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <h2 className="settings-panel__title wpf-section-header">{title}</h2>
      {description ? <p className="settings-panel__desc">{description}</p> : null}
      {children}
    </section>
  );
}

interface SettingsFormRowProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function SettingsFormRow({ label, children, hint }: SettingsFormRowProps) {
  return (
    <div className="settings-form-row">
      <label className="settings-form-row__label">{label}</label>
      <div className="settings-form-row__control">
        {children}
        {hint ? <p className="settings-form-row__hint">{hint}</p> : null}
      </div>
    </div>
  );
}
