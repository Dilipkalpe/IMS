import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PRINT_SETTINGS,
  formatPrintSummary,
  loadPrintSettings,
  savePrintSettings,
  type PrintPaperFormat,
  type SalesOrderPrintSettings,
} from './printSettingsService';
import { SettingsFormRow, SettingsPanel } from './SettingsPanel';

const PAPER_OPTIONS: { value: PrintPaperFormat; label: string; description: string }[] = [
  { value: 'A4', label: 'A4', description: '210 × 297 mm — standard office paper.' },
  { value: 'A5', label: 'A5', description: '148 × 210 mm — half of A4.' },
  { value: 'A3', label: 'A3', description: '297 × 420 mm — large format.' },
  { value: 'Custom', label: 'Custom', description: 'Enter width and height in millimetres.' },
];

export function PrintFormatPanel() {
  const [settings, setSettings] = useState<SalesOrderPrintSettings>(DEFAULT_PRINT_SETTINGS);

  useEffect(() => {
    setSettings(loadPrintSettings());
  }, []);

  const apply = useCallback((patch: Partial<SalesOrderPrintSettings>) => {
    setSettings((prev) => {
      const next = savePrintSettings({ ...prev, ...patch });
      return next;
    });
  }, []);

  const selectedPaper = PAPER_OPTIONS.find((o) => o.value === settings.paperFormat) ?? PAPER_OPTIONS[0];

  return (
    <SettingsPanel
      title="Sales order bill — print format"
      description="Default paper size and margins for sales counter print when no Bill Format Master is configured. Saved automatically in this browser."
    >
      <SettingsFormRow label="Paper size">
        <select
          className="settings-select"
          value={settings.paperFormat}
          onChange={(e) => apply({ paperFormat: e.target.value as PrintPaperFormat })}
        >
          {PAPER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </SettingsFormRow>
      <p className="settings-form-row__hint settings-form-row__hint--offset">{selectedPaper.description}</p>

      {settings.paperFormat === 'Custom' ? (
        <>
          <SettingsFormRow label="Custom size">
            <div className="settings-dimension-row">
              <input
                type="number"
                className="settings-input settings-input--narrow"
                min={50}
                max={1200}
                value={settings.customWidthMm}
                onChange={(e) => apply({ customWidthMm: Number(e.target.value) })}
              />
              <span className="settings-dimension-row__unit">mm wide</span>
              <input
                type="number"
                className="settings-input settings-input--narrow"
                min={50}
                max={1200}
                value={settings.customHeightMm}
                onChange={(e) => apply({ customHeightMm: Number(e.target.value) })}
              />
              <span className="settings-dimension-row__unit">mm high</span>
            </div>
          </SettingsFormRow>
          <p className="settings-form-row__hint settings-form-row__hint--offset">
            Example: 80 × 200 mm for a narrow receipt, or 210 × 99 mm for a half-page bill.
          </p>
        </>
      ) : null}

      <SettingsFormRow label="Page margin">
        <div className="settings-dimension-row">
          <input
            type="number"
            className="settings-input settings-input--narrow"
            min={0}
            max={50}
            value={settings.marginMm}
            onChange={(e) => apply({ marginMm: Number(e.target.value) })}
          />
          <span className="settings-dimension-row__unit">mm (all sides)</span>
        </div>
      </SettingsFormRow>

      <div className="settings-highlight-box">
        <p className="settings-highlight-box__label">Active print layout</p>
        <p className="settings-highlight-box__value">{formatPrintSummary(settings)}</p>
        <p className="settings-highlight-box__note">
          Saved automatically. Sales counter print actions use this format immediately.
        </p>
      </div>
    </SettingsPanel>
  );
}
