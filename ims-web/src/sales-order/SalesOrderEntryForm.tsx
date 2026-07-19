import { useCallback, useRef } from 'react';
import { SalesCustomerSelect } from '../components/transaction/SalesCustomerSelect';
import { LoadingHost } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import type { CorporateDataGridHandle } from '../components/datagrid/CorporateDataGrid';
import { useSalesOrderPrintActions } from '../document/hooks/useSalesOrderPrintActions';
import { useAppNavigation } from '../context/AppNavigationContext';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { FIELD_FOCUS_KEY, focusFirstErrorField } from '../keyboard/formKeyboardNavigation';
import { useDocumentShortcuts } from '../keyboard/useDocumentShortcuts';
import { NavKeys } from '../navigation/navKeys';
import { getAuthSession } from '../api/auth';
import { DELIVERY_PRIORITIES, PLACE_OF_SUPPLY } from './mockData';
import { normalizeSoPrefix } from './soDocumentNo';
import { SalesOrderLineItemsGrid } from './components/SalesOrderLineItemsGrid';
import { SalesOrderTotalsRail } from './components/SalesOrderTotalsRail';
import { useSalesOrderDocument } from './useSalesOrderDocument';
import { useSalesOrderWorkspace } from './workspace/SalesOrderWorkspaceProvider';
import '../sales-invoice/sales-invoice.scss';

export function SalesOrderEntryForm({
  tabId,
  lineCount = 0,
  autoFocusFieldKey = 'entryDocPrefix',
}: {
  tabId: string;
  lineCount?: number;
  autoFocusFieldKey?: string;
}) {
  const navigate = useAppNavigation();
  const ws = useSalesOrderWorkspace();
  const doc = useSalesOrderDocument(tabId);
  const { print, savePrintNext } = useSalesOrderPrintActions();
  const scopeRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<CorporateDataGridHandle>(null);
  const narrationRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const focusValidationError = useCallback((firstField?: string) => {
    const root = scopeRef.current;
    if (!root) return;
    focusFirstErrorField(root, firstField, {
      focusFirstEditable: () => gridRef.current?.focusFirstEditable(),
      focusLineColumn: (lineId, columnId) => gridRef.current?.focusLineColumn(lineId, columnId),
    });
  }, []);

  const runPrintFlow = useCallback(
    async (label: 'Print' | 'Save, Print, Next (F12)') => {
      const v = doc.validateDocument();
      if (!v.ok) {
        requestAnimationFrame(() => focusValidationError(v.firstField));
        return;
      }
      const snapshot = doc.getUiSnapshot();
      if (label === 'Print') {
        const outcome = await print(snapshot, true);
        doc.setStatus(outcome.message);
        return;
      }
      const outcome = await savePrintNext(snapshot, async () => {
        const saved = await doc.save();
        return { ok: saved.ok, message: saved.message ?? (saved.ok ? 'Saved.' : 'Save failed.') };
      });
      doc.setStatus(outcome.message);
      if (outcome.ok) {
        if (doc.isEdit) {
          await ws.continueWithNextBill(tabId);
        } else {
          await ws.prepareNewBill(tabId);
        }
        requestAnimationFrame(() => saveButtonRef.current?.focus());
      }
    },
    [doc, focusValidationError, print, savePrintNext, tabId, ws],
  );

  const runAction = useCallback(
    async (label: string) => {
      if (label === 'Close' || label === 'Cancel') {
        if (!ws.requestCloseWorkspace()) return;
        navigate(NavKeys.SalesOrders);
        return;
      }
      if (label === 'Print' || label === 'Save, Print, Next (F12)') {
        await runPrintFlow(label);
        return;
      }
      const result = await doc.tryAction(label);
      if (!result.ok) {
        requestAnimationFrame(() => focusValidationError(result.firstField));
        return;
      }
      if (label === 'Save' && result.remainingTabs === 0) {
        navigate(NavKeys.SalesOrders);
        return;
      }
      if (label === 'Save' || label === 'Save, Next (F11)') {
        requestAnimationFrame(() => saveButtonRef.current?.focus());
      }
      if (label === 'New Bill') {
        requestAnimationFrame(() => focusValidationError('entryDocPrefix'));
      }
    },
    [doc, focusValidationError, navigate, runPrintFlow, ws],
  );

  useDocumentShortcuts({
    onCancel: () => void runAction('Cancel'),
    onSaveAndNext: () => void runAction('Save, Next (F11)'),
    onSavePrintNext: () => void runPrintFlow('Save, Print, Next (F12)'),
    onSave: () => void runAction('Save'),
  });

  const focusNarration = useCallback(() => {
    narrationRef.current?.focus();
  }, []);

  const h = doc.header;
  const isEdit = doc.isEdit;
  const defaultSalesMan = getAuthSession()?.user?.fullName ?? '';

  return (
    <TransactionEntryShell title="Sales Order">
      <LoadingHost loading={doc.isLoading} title="Loading document…" className="loading-host--entry">
      <FormKeyboardScope ref={scopeRef} className="si-entry-layout si-entry-layout--wide-totals" autoFocusFieldKey={autoFocusFieldKey}>
        <div className="si-entry-main">
          {doc.loadError && (
            <div className="si-load-error-banner" role="alert">
              {doc.loadError}
            </div>
          )}
          <section className="si-section">
            <div className="si-header-grid">
              <label className="si-field">
                <span className="wpf-subpage-form-label">SO Prefix</span>
                <input
                  className={`wpf-subpage-form-input${isEdit ? ' si-readonly' : ''}`}
                  {...{ [FIELD_FOCUS_KEY]: 'entryDocPrefix' }}
                  value={h.entryDocPrefix}
                  readOnly={isEdit}
                  onChange={(e) => doc.updateHeader('entryDocPrefix', normalizeSoPrefix(e.target.value))}
                  onBlur={() => {
                    if (!isEdit) void ws.commitPrefix(tabId);
                  }}
                  maxLength={12}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">SO No</span>
                <input
                  className={`wpf-subpage-form-input si-readonly${doc.fieldError('billNo') ? ' si-input--error' : ''}`}
                  {...{ [FIELD_FOCUS_KEY]: 'billNo' }}
                  value={h.billNo}
                  readOnly
                  tabIndex={0}
                  aria-invalid={!!doc.fieldError('billNo')}
                />
                {doc.fieldError('billNo') && (
                  <span className="si-field-error" role="alert">
                    {doc.fieldError('billNo')}
                  </span>
                )}
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">SO Date</span>
                <input
                  type="date"
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'orderDate' }}
                  value={h.orderDate}
                  onChange={(e) => doc.updateHeader('orderDate', e.target.value)}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Sales Person</span>
                <input
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'salesMan' }}
                  value={h.salesMan}
                  placeholder={defaultSalesMan || 'Sales person'}
                  onChange={(e) => doc.updateHeader('salesMan', e.target.value)}
                  list="sales-order-salesmen"
                />
                <datalist id="sales-order-salesmen">
                  {defaultSalesMan ? <option value={defaultSalesMan} /> : null}
                </datalist>
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Customer Name</span>
                <SalesCustomerSelect
                  value={h.customer}
                  onChange={(v) => doc.updateHeader('customer', v)}
                  error={doc.fieldError('customer')}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Payment Terms</span>
                <input
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'paymentTerms' }}
                  value={h.paymentTerms}
                  onChange={(e) => doc.updateHeader('paymentTerms', e.target.value)}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Delivery Priority</span>
                <select
                  className="wpf-subpage-form-combo"
                  {...{ [FIELD_FOCUS_KEY]: 'deliveryPriority' }}
                  value={h.deliveryPriority}
                  onChange={(e) => doc.updateHeader('deliveryPriority', e.target.value)}
                >
                  {DELIVERY_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Billing Address</span>
                <input
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'billingAddress' }}
                  value={h.billingAddress}
                  onChange={(e) => doc.updateHeader('billingAddress', e.target.value)}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Shipping Address</span>
                <input
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'shippingAddress' }}
                  value={h.shippingAddress}
                  onChange={(e) => doc.updateHeader('shippingAddress', e.target.value)}
                />
              </label>
            </div>
            <div className="si-gst-header-row">
              <label className="si-field">
                <span className="wpf-subpage-form-label">Seller GSTIN</span>
                <input
                  className="wpf-subpage-form-input si-readonly"
                  {...{ [FIELD_FOCUS_KEY]: 'sellerGstin' }}
                  value={h.sellerGstin}
                  readOnly
                  tabIndex={0}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Customer GSTIN</span>
                <input
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'customerGstin' }}
                  value={h.customerGstin}
                  onChange={(e) => doc.updateHeader('customerGstin', e.target.value)}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Place of Supply</span>
                <select
                  className="wpf-subpage-form-combo"
                  {...{ [FIELD_FOCUS_KEY]: 'placeOfSupply' }}
                  value={h.placeOfSupply}
                  onChange={(e) => doc.updateHeader('placeOfSupply', e.target.value)}
                >
                  {PLACE_OF_SUPPLY.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="si-section si-section--grow si-section--lines-panel">
            <SalesOrderLineItemsGrid doc={doc} gridRef={gridRef} onExitGridEnd={focusNarration} />
          </section>

          <section className="si-section si-bottom">
            <div className="si-bottom__narration">
              <span className="wpf-sales-field-label">Narration</span>
              <input
                ref={narrationRef}
                className="wpf-sales-compact-input"
                {...{ [FIELD_FOCUS_KEY]: 'narration' }}
                value={h.narration}
                onChange={(e) => doc.updateHeader('narration', e.target.value)}
              />
            </div>
            <div className="si-bottom__actions">
              <span className="wpf-section-header">Actions</span>
              <div className="si-action-rail" role="toolbar" aria-label="Document actions">
                {[
                  { icon: '\uE710', label: 'New', action: 'New Bill', variant: 'primary' as const, key: 'action-new' },
                  { icon: '\uE74E', label: 'Save', action: 'Save', variant: 'primary' as const, key: 'action-save', ref: saveButtonRef },
                  { icon: '\uE74E', label: 'Next', action: 'Save, Next (F11)', variant: 'secondary' as const, key: 'action-next' },
                  { icon: '\uE749', label: 'S+P', action: 'Save, Print, Next (F12)', variant: 'primary' as const, key: 'action-sp' },
                  { icon: '\uE749', label: 'Print', action: 'Print', variant: 'primary' as const, key: 'action-print' },
                  { icon: '\uE711', label: 'Close', action: 'Close', variant: 'secondary' as const, key: 'action-close' },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    ref={btn.ref}
                    type="button"
                    className={`si-action-btn si-action-btn--${btn.variant}`}
                    title={`${btn.action}${btn.action === 'Save, Next (F11)' ? ' (F11)' : btn.action === 'Save, Print, Next (F12)' ? ' (F12)' : ''}`}
                    {...{ [FIELD_FOCUS_KEY]: btn.key }}
                    onClick={() => void runAction(btn.action)}
                  >
                    <span className="icon-text">{btn.icon}</span>
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <SalesOrderTotalsRail displayTotals={doc.displayTotals} />
      </FormKeyboardScope>
      </LoadingHost>
    </TransactionEntryShell>
  );
}
