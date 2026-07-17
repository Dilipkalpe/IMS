import { useCallback, useEffect, useState } from 'react';
import {
  getCommunicationSettings,
  saveCommunicationSettings,
} from '../api/communicationSettings';
import { useMenuPermissionSession } from '../context/MenuPermissionContext';
import {
  DEFAULT_COMMUNICATION_SETTINGS,
  type CommunicationSettings,
} from '../types/communication';
import { SettingsFormRow, SettingsPanel } from './SettingsPanel';

const TEMPLATE_PLACEHOLDER =
  '{{CustomerName}}, {{InvoiceNumber}}, {{InvoiceDate}}, {{Amount}}, {{BalanceAmount}}, {{CompanyName}}, {{ContactDetails}}, {{SupplierName}}';

export function CommunicationSettingsPanel() {
  const { isAdministrator } = useMenuPermissionSession();
  const [settings, setSettings] = useState<CommunicationSettings>(DEFAULT_COMMUNICATION_SETTINGS);
  const [status, setStatus] = useState('Loading…');

  useEffect(() => {
    void getCommunicationSettings().then((s) => {
      setSettings(s);
      setStatus('Settings loaded from this browser.');
    });
  }, []);

  const patch = useCallback((updater: (prev: CommunicationSettings) => CommunicationSettings) => {
    if (!isAdministrator) {
      setStatus('Only administrators can change these settings.');
      return;
    }
    setSettings((prev) => {
      const next = updater(prev);
      saveCommunicationSettings(next);
      setStatus('Saved automatically.');
      return next;
    });
  }, [isAdministrator]);

  const setNone = useCallback(() => {
    patch((prev) => ({ ...prev, disableAll: true, whatsAppEnabled: false, smsEnabled: false, emailEnabled: false }));
    setStatus('All communication channels disabled.');
  }, [patch]);

  const resetTemplates = useCallback(() => {
    patch((prev) => ({
      ...prev,
      salesInvoiceTemplate: DEFAULT_COMMUNICATION_SETTINGS.salesInvoiceTemplate,
      purchaseInvoiceTemplate: DEFAULT_COMMUNICATION_SETTINGS.purchaseInvoiceTemplate,
    }));
    setStatus('Templates reset to defaults.');
  }, [patch]);

  const saveExplicit = useCallback(() => {
    if (!isAdministrator) return;
    saveCommunicationSettings(settings);
    setStatus('Communication settings saved.');
  }, [isAdministrator, settings]);

  const disabled = !isAdministrator;

  return (
    <SettingsPanel
      title="Communication settings"
      description="Configure WhatsApp, SMS, and email notifications for sales and purchase invoices. Credentials are stored in this browser (localStorage). Administrator access required to change values."
    >
      {!isAdministrator ? (
        <p className="settings-panel__admin-note">Only administrators can change these settings.</p>
      ) : null}

      <div className="settings-checkbox-list settings-checkbox-list--compact">
        <label className="settings-checkbox-item">
          <input
            type="checkbox"
            checked={settings.disableAll}
            disabled={disabled}
            onChange={(e) => patch((p) => ({ ...p, disableAll: e.target.checked }))}
          />
          <span>None — disable all communication services</span>
        </label>
        <label className="settings-checkbox-item">
          <input
            type="checkbox"
            checked={settings.whatsAppEnabled}
            disabled={disabled || settings.disableAll}
            onChange={(e) => patch((p) => ({ ...p, whatsAppEnabled: e.target.checked }))}
          />
          <span>Enable WhatsApp notifications</span>
        </label>
        <label className="settings-checkbox-item">
          <input
            type="checkbox"
            checked={settings.smsEnabled}
            disabled={disabled || settings.disableAll}
            onChange={(e) => patch((p) => ({ ...p, smsEnabled: e.target.checked }))}
          />
          <span>Enable SMS notifications</span>
        </label>
        <label className="settings-checkbox-item">
          <input
            type="checkbox"
            checked={settings.emailEnabled}
            disabled={disabled || settings.disableAll}
            onChange={(e) => patch((p) => ({ ...p, emailEnabled: e.target.checked }))}
          />
          <span>Enable email notifications</span>
        </label>
        <label className="settings-checkbox-item">
          <input
            type="checkbox"
            checked={settings.promptBeforeSend}
            disabled={disabled}
            onChange={(e) => patch((p) => ({ ...p, promptBeforeSend: e.target.checked }))}
          />
          <span>Prompt before sending after invoice save</span>
        </label>
        <label className="settings-checkbox-item">
          <input
            type="checkbox"
            checked={settings.sendAfterSaveByDefault}
            disabled={disabled}
            onChange={(e) => patch((p) => ({ ...p, sendAfterSaveByDefault: e.target.checked }))}
          />
          <span>Send notification after save (default when not prompting)</span>
        </label>
      </div>

      <h3 className="settings-subsection-title">WhatsApp</h3>
      <SettingsFormRow label="API URL">
        <input
          type="text"
          className="settings-input"
          disabled={disabled}
          value={settings.whatsApp.apiUrl}
          onChange={(e) => patch((p) => ({ ...p, whatsApp: { ...p.whatsApp, apiUrl: e.target.value } }))}
        />
      </SettingsFormRow>
      <SettingsFormRow label="API key / token">
        <input
          type="password"
          className="settings-input"
          disabled={disabled}
          value={settings.whatsApp.apiKey}
          onChange={(e) => patch((p) => ({ ...p, whatsApp: { ...p.whatsApp, apiKey: e.target.value } }))}
        />
      </SettingsFormRow>
      <SettingsFormRow label="Sender details">
        <input
          type="text"
          className="settings-input"
          disabled={disabled}
          value={settings.whatsApp.senderDetails}
          onChange={(e) => patch((p) => ({ ...p, whatsApp: { ...p.whatsApp, senderDetails: e.target.value } }))}
        />
      </SettingsFormRow>

      <h3 className="settings-subsection-title">SMS</h3>
      <SettingsFormRow label="Gateway URL">
        <input
          type="text"
          className="settings-input"
          disabled={disabled}
          value={settings.sms.gatewayUrl}
          onChange={(e) => patch((p) => ({ ...p, sms: { ...p.sms, gatewayUrl: e.target.value } }))}
        />
      </SettingsFormRow>
      <SettingsFormRow label="API key">
        <input
          type="password"
          className="settings-input"
          disabled={disabled}
          value={settings.sms.apiKey}
          onChange={(e) => patch((p) => ({ ...p, sms: { ...p.sms, apiKey: e.target.value } }))}
        />
      </SettingsFormRow>
      <SettingsFormRow label="Sender ID">
        <input
          type="text"
          className="settings-input"
          disabled={disabled}
          value={settings.sms.senderId}
          onChange={(e) => patch((p) => ({ ...p, sms: { ...p.sms, senderId: e.target.value } }))}
        />
      </SettingsFormRow>

      <h3 className="settings-subsection-title">Email (SMTP)</h3>
      <SettingsFormRow label="SMTP server">
        <input
          type="text"
          className="settings-input"
          disabled={disabled}
          value={settings.email.smtpServer}
          onChange={(e) => patch((p) => ({ ...p, email: { ...p.email, smtpServer: e.target.value } }))}
        />
      </SettingsFormRow>
      <SettingsFormRow label="SMTP port">
        <div className="settings-dimension-row">
          <input
            type="number"
            className="settings-input settings-input--narrow"
            disabled={disabled}
            value={settings.email.smtpPort}
            onChange={(e) =>
              patch((p) => ({ ...p, email: { ...p.email, smtpPort: Number(e.target.value) || 587 } }))
            }
          />
          <label className="settings-checkbox-item settings-checkbox-item--inline">
            <input
              type="checkbox"
              disabled={disabled}
              checked={settings.email.useSsl}
              onChange={(e) => patch((p) => ({ ...p, email: { ...p.email, useSsl: e.target.checked } }))}
            />
            <span>Use SSL/TLS</span>
          </label>
        </div>
      </SettingsFormRow>
      <SettingsFormRow label="Email address">
        <input
          type="email"
          className="settings-input"
          disabled={disabled}
          value={settings.email.emailAddress}
          onChange={(e) => patch((p) => ({ ...p, email: { ...p.email, emailAddress: e.target.value } }))}
        />
      </SettingsFormRow>
      <SettingsFormRow label="Password">
        <input
          type="password"
          className="settings-input"
          disabled={disabled}
          value={settings.email.password}
          onChange={(e) => patch((p) => ({ ...p, email: { ...p.email, password: e.target.value } }))}
        />
      </SettingsFormRow>

      <h3 className="settings-subsection-title">Message templates</h3>
      <p className="settings-form-row__hint">Placeholders: {TEMPLATE_PLACEHOLDER}</p>
      <SettingsFormRow label="Sales invoice template">
        <textarea
          className="settings-textarea"
          rows={5}
          disabled={disabled}
          value={settings.salesInvoiceTemplate}
          onChange={(e) => patch((p) => ({ ...p, salesInvoiceTemplate: e.target.value }))}
        />
      </SettingsFormRow>
      <SettingsFormRow label="Purchase invoice template">
        <textarea
          className="settings-textarea"
          rows={5}
          disabled={disabled}
          value={settings.purchaseInvoiceTemplate}
          onChange={(e) => patch((p) => ({ ...p, purchaseInvoiceTemplate: e.target.value }))}
        />
      </SettingsFormRow>

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--secondary" disabled={disabled} onClick={setNone}>
          Set None
        </button>
        <button type="button" className="settings-btn settings-btn--secondary" disabled={disabled} onClick={resetTemplates}>
          Reset templates
        </button>
        <button type="button" className="settings-btn settings-btn--primary" disabled={disabled} onClick={saveExplicit}>
          Save communication settings
        </button>
      </div>

      <p className="settings-panel__status" role="status">
        {status}
      </p>
      <p className="settings-form-row__hint">Delivery logs: browser localStorage (`ims.communicationLog`)</p>
    </SettingsPanel>
  );
}
