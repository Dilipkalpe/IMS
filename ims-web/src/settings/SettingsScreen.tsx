import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { ApiConnectionPanel } from './ApiConnectionPanel';
import { BackupSettingsPanel } from './BackupSettingsPanel';
import { CommunicationSettingsPanel } from './CommunicationSettingsPanel';
import { DeleteAllDataPanel } from './DeleteAllDataPanel';
import { EditDeletePasswordPanel } from './EditDeletePasswordPanel';
import { GridColumnsPanel } from './GridColumnsPanel';
import { LicensePanel } from './LicensePanel';
import { PrintFormatPanel } from './PrintFormatPanel';
import { SalesPurchaseConfigPanel } from './SalesPurchaseConfigPanel';
import { ThemePickerPanel } from './ThemePickerPanel';
import { ThemePreviewsPanel } from './ThemePreviewsPanel';
import './settings.scss';

/** Full Preferences page — parity with WPF SettingsView sections. */
export function SettingsScreen() {
  return (
    <RefinedScreenShell>
      <div className="settings-screen">
        <header className="settings-screen__header">
          <h1 className="wpf-pagetitle">Settings</h1>
          <p className="settings-panel__desc">
            Application preferences, printing, appearance, and database maintenance.
          </p>
        </header>

        <ApiConnectionPanel />
        <PrintFormatPanel />
        <GridColumnsPanel />
        <ThemePickerPanel />
        <BackupSettingsPanel />
        <SalesPurchaseConfigPanel />
        <CommunicationSettingsPanel />
        <LicensePanel />
        <EditDeletePasswordPanel />
        <DeleteAllDataPanel />
        <ThemePreviewsPanel />
      </div>
    </RefinedScreenShell>
  );
}
