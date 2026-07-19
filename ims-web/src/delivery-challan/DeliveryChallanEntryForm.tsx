import { useCallback, useRef } from 'react';
import { SalesCustomerSelect } from '../components/transaction/SalesCustomerSelect';
import { LoadingHost } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormGrid, ErpFormNarration, ErpFormSection } from '../components/form';
import type { CorporateDataGridHandle } from '../components/datagrid/CorporateDataGrid';
import { useDeliveryChallanPrintActions } from '../document/hooks/useDeliveryChallanPrintActions';
import {
  buildDocumentEntryActions,
  DocumentEntryActionRail,
} from '../components/transaction/DocumentEntryActionRail';
import {
  handleDocumentSecondaryAction,
  registerPrintPreviousSnapshot,
} from '../components/transaction/documentSecondaryActions';
import { useAppNavigation } from '../context/AppNavigationContext';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { FIELD_FOCUS_KEY, focusFirstErrorField } from '../keyboard/formKeyboardNavigation';
import { useDocumentShortcuts } from '../keyboard/useDocumentShortcuts';
import { NavKeys } from '../navigation/navKeys';
import { normalizeDocPrefix } from '../components/transaction/docPrefix';
import { PLACE_OF_SUPPLY } from './mockData';
import { DeliveryChallanLineItemsGrid } from './components/DeliveryChallanLineItemsGrid';
import { DeliveryChallanTotalsRail } from './components/DeliveryChallanTotalsRail';
import { useDeliveryChallanDocument } from './useDeliveryChallanDocument';
import { useDeliveryChallanSalesOrderPick } from './useDeliveryChallanSalesOrderPick';
import { useDeliveryChallanWorkspace } from './workspace/DeliveryChallanWorkspaceProvider';
import '../sales-invoice/sales-invoice.scss';

export function DeliveryChallanEntryForm({
  tabId,
  lineCount = 0,
  autoFocusFieldKey = 'entryDocPrefix',
}: {
  tabId: string;
  lineCount?: number;
  autoFocusFieldKey?: string;
}) {
  const navigate = useAppNavigation();
  const ws = useDeliveryChallanWorkspace();
  const doc = useDeliveryChallanDocument(tabId);
  const { startLoadFromSalesOrders, pickBusy, pickDialog } = useDeliveryChallanSalesOrderPick(tabId, doc);
  const { print, savePrintNext } = useDeliveryChallanPrintActions();
  const scopeRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<CorporateDataGridHandle>(null);
  const narrationRef = useRef<HTMLTextAreaElement>(null);
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
        if (outcome.ok) registerPrintPreviousSnapshot('delivery-challan', snapshot);
        doc.setStatus(outcome.message);
        return;
      }
      const outcome = await savePrintNext(snapshot, async () => {
        const saved = await doc.save();
        return { ok: saved.ok, message: saved.message ?? (saved.ok ? 'Saved.' : 'Save failed.') };
      });
      if (outcome.ok) registerPrintPreviousSnapshot('delivery-challan', snapshot);
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
        navigate(NavKeys.DeliveryChallan);
        return;
      }
      if (label === 'Print' || label === 'Save, Print, Next (F12)') {
        await runPrintFlow(label);
        return;
      }

      const handled = await handleDocumentSecondaryAction(label, {
        moduleKey: 'delivery-challan',
        setStatus: doc.setStatus,
        getUiSnapshot: doc.getUiSnapshot,
        printSnapshot: print,
        openByFormatted: async (formatted) => {
          await ws.openDocumentInNewTab({ type: 'editFormatted', formatted });
        },
        duplicateToNewTab: async () => {
          await ws.duplicateToNewTab(tabId);
        },
        currentFormatted: () => {
          const h = doc.header;
          return h.billNo ? `${h.entryDocPrefix}-${h.billNo}` : undefined;
        },
      });
      if (handled) return;

      const result = await doc.tryAction(label);
      if (!result.ok) {
        requestAnimationFrame(() => focusValidationError(result.firstField));
        return;
      }
      if (label === 'Save' || label === 'Save, Next (F11)') {
        requestAnimationFrame(() => saveButtonRef.current?.focus());
      }
      if (label === 'New Bill') {
        requestAnimationFrame(() => focusValidationError('entryDocPrefix'));
      }
    },
    [doc, focusValidationError, navigate, runPrintFlow, tabId, ws],
  );

  const entryActions = buildDocumentEntryActions({
    saveButtonRef,
    disabled: doc.isSaving || doc.isLoading,
  });

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

  return (
    <TransactionEntryShell title="DC">
      {pickDialog}
      <LoadingHost loading={doc.isLoading} title="Loading document…" className="loading-host--entry">
      <FormKeyboardScope ref={scopeRef} className="si-entry-layout si-entry-layout--wide-totals" autoFocusFieldKey={autoFocusFieldKey}>
        <div className="si-entry-main">
          {doc.loadError && (
            <div className="si-load-error-banner" role="alert">
              {doc.loadError}
            </div>
          )}
          <ErpFormSection>
            <ErpFormGrid>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Prefix</span>
                <input
                  className={`wpf-subpage-form-input${isEdit ? ' si-readonly' : ''}`}
                  {...{ [FIELD_FOCUS_KEY]: 'entryDocPrefix' }}
                  value={h.entryDocPrefix}
                  readOnly={isEdit}
                  onChange={(e) => doc.updateHeader('entryDocPrefix', normalizeDocPrefix(e.target.value, 'DC'))}
                  onBlur={() => {
                    if (!isEdit) void ws.commitPrefix(tabId);
                  }}
                  maxLength={12}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">DC No</span>
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
                <span className="wpf-subpage-form-label">DC Date</span>
                <input
                  type="date"
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'dcDate' }}
                  value={h.dcDate}
                  onChange={(e) => doc.updateHeader('dcDate', e.target.value)}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Customer Name</span>
                <SalesCustomerSelect
                  value={h.customer}
                  onChange={(v) => doc.updateHeader('customer', v)}
                  error={doc.fieldError('customer')}
                />
              </label>
              <label className="si-field si-field--with-action">
                <span className="wpf-subpage-form-label">SO Reference</span>
                <div className="si-field-action-row">
                  <input
                    className="wpf-subpage-form-input si-readonly"
                    {...{ [FIELD_FOCUS_KEY]: 'soReference' }}
                    value={h.soReference}
                    readOnly
                    tabIndex={0}
                    title="Filled automatically from selected sales orders"
                    placeholder="Load sales orders to fill"
                  />
                  <button
                    type="button"
                    className="wpf-secondary-button si-field-action-row__btn"
                    disabled={pickBusy || doc.isLoading}
                    title="Select multiple sales orders for this customer"
                    onClick={() => void startLoadFromSalesOrders()}
                  >
                    Load SOs
                  </button>
                </div>
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Warehouse</span>
                <select
                  className="wpf-subpage-form-combo"
                  {...{ [FIELD_FOCUS_KEY]: 'warehouse' }}
                  value={h.warehouse}
                  onChange={(e) => doc.updateHeader('warehouse', e.target.value)}
                >
                  {doc.warehouses.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Vehicle No</span>
                <input
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'vehicleNo' }}
                  value={h.vehicleNo}
                  onChange={(e) => doc.updateHeader('vehicleNo', e.target.value)}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Transporter</span>
                <input
                  className="wpf-subpage-form-input"
                  {...{ [FIELD_FOCUS_KEY]: 'transporter' }}
                  value={h.transporter}
                  onChange={(e) => doc.updateHeader('transporter', e.target.value)}
                />
              </label>
              <label className="si-field">
                <span className="wpf-subpage-form-label">Sales Man</span>
                <select
                  className="wpf-subpage-form-combo"
                  {...{ [FIELD_FOCUS_KEY]: 'salesMan' }}
                  value={h.salesMan}
                  onChange={(e) => doc.updateHeader('salesMan', e.target.value)}
                >
                  {doc.salesMans.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            </ErpFormGrid>
            <ErpFormGrid variant="gst">
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
            </ErpFormGrid>
          </ErpFormSection>

          <section className="si-section si-section--grow si-section--lines-panel">
            <DeliveryChallanLineItemsGrid doc={doc} gridRef={gridRef} onExitGridEnd={focusNarration} />
          </section>

          <section className="si-section si-bottom erp-form-bottom">
            <ErpFormNarration
              ref={narrationRef}
              {...{ [FIELD_FOCUS_KEY]: 'narration' }}
              value={h.narration}
              onChange={(e) => doc.updateHeader('narration', e.target.value)}
            />
            <div className="si-bottom__actions">
              <span className="erp-form-bottom__actions-label">Actions</span>
              <DocumentEntryActionRail actions={entryActions} onAction={(action) => void runAction(action)} />
            </div>
          </section>
        </div>

        <DeliveryChallanTotalsRail displayTotals={doc.displayTotals} />
      </FormKeyboardScope>
      </LoadingHost>
    </TransactionEntryShell>
  );
}
