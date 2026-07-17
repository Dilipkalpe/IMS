import { useCallback, useEffect, useState } from 'react';
import {
  getSalesPurchaseSettings,
  updateSalesPurchaseSettings,
  type SalesRateSource,
  type SalesPurchaseSettings,
} from '../api/salesPurchaseSettings';
import { useMenuPermissionSession } from '../context/MenuPermissionContext';
import './settings.scss';

const SOURCE_LABELS: Record<SalesRateSource, string> = {
  product_master: 'Product Master',
  purchase_invoice: 'Purchase Invoice',
};

export function SalesPurchaseConfigPanel() {
  const { isAdministrator } = useMenuPermissionSession();
  const [settings, setSettings] = useState<SalesPurchaseSettings>({
    salesRateSource: 'product_master',
  });
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading settings…');

  useEffect(() => {
    void getSalesPurchaseSettings()
      .then((s) => {
        setSettings(s);
        setStatusMessage(`Active source: ${SOURCE_LABELS[s.salesRateSource]}.`);
      })
      .catch(() => setStatusMessage('Could not load settings from API — using local cache.'));
  }, []);

  const save = useCallback(
    async (source: SalesRateSource) => {
      if (!isAdministrator) {
        setStatusMessage('Only administrators can change this setting.');
        return;
      }
      setBusy(true);
      try {
        const saved = await updateSalesPurchaseSettings({ salesRateSource: source });
        setSettings(saved);
        setStatusMessage(`Saved. Active source: ${SOURCE_LABELS[saved.salesRateSource]}.`);
      } catch (err) {
        setStatusMessage(err instanceof Error ? err.message : 'Save failed.');
      } finally {
        setBusy(false);
      }
    },
    [isAdministrator],
  );

  return (
    <section className="settings-panel">
      <h2 className="settings-panel__title">Sales / Purchase configuration</h2>
      <p className="settings-panel__desc">
        Choose where the sales invoice line rate comes from when you add a product. Saved invoices
        keep their existing rates until you add or change lines.
      </p>
      {!isAdministrator ? (
        <p className="settings-panel__admin-note">Only administrators can change this setting.</p>
      ) : null}

      <p className="settings-panel__label">Sales rate source</p>

      <label className={`settings-panel__option${settings.salesRateSource === 'product_master' ? ' settings-panel__option--active' : ''}`}>
        <input
          type="radio"
          name="salesRateSource"
          value="product_master"
          checked={settings.salesRateSource === 'product_master'}
          disabled={!isAdministrator || busy}
          onChange={() => void save('product_master')}
        />
        <span>
          <strong>Product Master</strong>
          <span className="settings-panel__option-desc">
            Use the sale price from the product master when adding lines to a sales invoice.
          </span>
        </span>
      </label>

      <label className={`settings-panel__option${settings.salesRateSource === 'purchase_invoice' ? ' settings-panel__option--active' : ''}`}>
        <input
          type="radio"
          name="salesRateSource"
          value="purchase_invoice"
          checked={settings.salesRateSource === 'purchase_invoice'}
          disabled={!isAdministrator || busy}
          onChange={() => void save('purchase_invoice')}
        />
        <span>
          <strong>Purchase Invoice</strong>
          <span className="settings-panel__option-desc">
            Use the sale rate from the most recent purchase invoice line for that product.
          </span>
        </span>
      </label>

      <p className="settings-panel__active">
        Active source: {SOURCE_LABELS[settings.salesRateSource]}
      </p>
      <p className="settings-panel__status" role="status">
        {statusMessage}
      </p>
    </section>
  );
}
