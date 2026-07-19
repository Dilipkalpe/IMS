import { useCallback, useRef } from 'react';
import { LoadingHost } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormGrid, ErpFormNarration, ErpFormSection } from '../components/form';
import type { CorporateDataGridHandle } from '../components/datagrid/CorporateDataGrid';
import { usePurchaseInvoicePrintActions } from '../document/hooks/usePurchaseInvoicePrintActions';
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
import { PurchaseSupplierSelect } from '../components/transaction/PurchaseSupplierSelect';
import { PAYMENT_MODES, PAYMENT_TYPES, PLACE_OF_SUPPLY } from './mockData';
import { PurchaseInvoiceLineItemsGrid } from './components/PurchaseInvoiceLineItemsGrid';
import { PurchaseInvoiceTotalsRail } from './components/PurchaseInvoiceTotalsRail';
import { usePurchaseInvoiceDocument } from './usePurchaseInvoiceDocument';
import { InvoicePaymentHistoryPanel } from '../components/finance/InvoicePaymentHistoryPanel';
import { usePaymentVoucherNavIntent } from '../payment-voucher/context/PaymentVoucherNavIntent';
import { usePurchaseInvoiceRecordPayment } from './usePurchaseInvoiceRecordPayment';
import { usePurchaseInvoiceWorkspace } from './workspace/PurchaseInvoiceWorkspaceProvider';
import '../sales-invoice/sales-invoice.scss';

const HEADER_FIELD_ORDER = [
  'entryDocPrefix',
  'billNo',
  'supplier',
  'invoiceDate',
  'grnReference',
  'dueDate',
  'companyGstin',
  'supplierGstin',
  'placeOfSupply',
  'paymentType',
  'paymentMode',
] as const;

export function PurchaseInvoiceEntryForm({
  tabId,
  lineCount = 0,
  autoFocusFieldKey = 'entryDocPrefix',
}: {
  tabId: string;
  lineCount?: number;
  autoFocusFieldKey?: string;
}) {
  const navigate = useAppNavigation();
  const ws = usePurchaseInvoiceWorkspace();
  const doc = usePurchaseInvoiceDocument(tabId);
  const { startRecordPayment } = usePurchaseInvoiceRecordPayment(tabId);
  const { publishOpenIntent: openPaymentVoucher } = usePaymentVoucherNavIntent();
  const { print, savePrintNext } = usePurchaseInvoicePrintActions();
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
        if (outcome.ok) registerPrintPreviousSnapshot('purchase-invoice', snapshot);
        doc.setStatus(outcome.message);
        return;
      }
      const outcome = await savePrintNext(snapshot, async () => {
        const saved = await doc.save();
        return { ok: saved.ok, message: saved.message ?? (saved.ok ? 'Saved.' : 'Save failed.') };
      });
      if (outcome.ok) registerPrintPreviousSnapshot('purchase-invoice', snapshot);
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
        navigate(NavKeys.PurchaseInvoice);
        return;
      }
      if (label === 'Print' || label === 'Save, Print, Next (F12)') {
        await runPrintFlow(label);
        return;
      }
      if (label === 'Record Payment') {
        const payment = await startRecordPayment();
        if (!payment.ok) {
          doc.setStatus(payment.message ?? 'Cannot record payment.');
          if (payment.firstField) focusValidationError(payment.firstField);
        }
        return;
      }
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
    [doc, focusValidationError, navigate, runPrintFlow, startRecordPayment, ws],
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
    <TransactionEntryShell title="Purchase Invoice">
      <LoadingHost loading={doc.isLoading} title="Loading document…" className="loading-host--entry">
      <FormKeyboardScope
        ref={scopeRef}
        className="si-entry-layout si-entry-layout--wide-totals"
        autoFocusFieldKey={autoFocusFieldKey}
      >
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
                    onChange={(e) => doc.updateHeader('entryDocPrefix', normalizeDocPrefix(e.target.value, 'PI'))}
                    onBlur={() => {
                      if (!isEdit) void ws.commitPrefix(tabId);
                    }}
                    maxLength={12}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Invoice No</span>
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
                  <span className="wpf-subpage-form-label">Supplier Name</span>
                  <PurchaseSupplierSelect
                    value={h.supplier}
                    onChange={(v) => doc.updateHeader('supplier', v)}
                    error={doc.fieldError('supplier')}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Invoice Date</span>
                  <input
                    type="date"
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'invoiceDate' }}
                    value={h.invoiceDate}
                    onChange={(e) => doc.updateHeader('invoiceDate', e.target.value)}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">GRN Reference</span>
                  <input
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'grnReference' }}
                    value={h.grnReference}
                    onChange={(e) => doc.updateHeader('grnReference', e.target.value)}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Due Date</span>
                  <input
                    type="date"
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'dueDate' }}
                    value={h.dueDate}
                    onChange={(e) => doc.updateHeader('dueDate', e.target.value)}
                  />
                </label>
              </ErpFormGrid>
              <ErpFormGrid variant="gst">
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Company GSTIN</span>
                  <input
                    className="wpf-subpage-form-input si-readonly"
                    {...{ [FIELD_FOCUS_KEY]: 'companyGstin' }}
                    value={h.companyGstin}
                    readOnly
                    tabIndex={0}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Supplier GSTIN</span>
                  <input
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'supplierGstin' }}
                    value={h.supplierGstin}
                    onChange={(e) => doc.updateHeader('supplierGstin', e.target.value)}
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
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Payment Type</span>
                  <select
                    className="wpf-subpage-form-combo"
                    {...{ [FIELD_FOCUS_KEY]: 'paymentType' }}
                    value={h.paymentType}
                    onChange={(e) => doc.updateHeader('paymentType', e.target.value)}
                  >
                    {PAYMENT_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Payment Mode</span>
                  <select
                    className="wpf-subpage-form-combo"
                    {...{ [FIELD_FOCUS_KEY]: 'paymentMode' }}
                    value={h.paymentMode}
                    onChange={(e) => doc.updateHeader('paymentMode', e.target.value)}
                  >
                    {PAYMENT_MODES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </ErpFormGrid>
            </ErpFormSection>

            <section className="si-section si-section--grow si-section--lines-panel">
              <PurchaseInvoiceLineItemsGrid doc={doc} gridRef={gridRef} onExitGridEnd={focusNarration} />
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
                <div className="si-action-rail" role="toolbar" aria-label="Document actions">
                {[
                  { icon: '\uE710', label: 'New', action: 'New Bill', variant: 'primary' as const, key: 'action-new' },
                  { icon: '\uE74E', label: 'Save', action: 'Save', variant: 'primary' as const, key: 'action-save', ref: saveButtonRef },
                  { icon: '\uE74E', label: 'Next', action: 'Save, Next (F11)', variant: 'secondary' as const, key: 'action-next' },
                  { icon: '\uE749', label: 'S+P', action: 'Save, Print, Next (F12)', variant: 'primary' as const, key: 'action-sp' },
                  {
                    icon: '\uE8C7',
                    label: 'Pay',
                    action: 'Record Payment',
                    variant: 'primary' as const,
                    key: 'action-pay',
                    disabled: !doc.canRecordPayment,
                  },
                  { icon: '\uE749', label: 'Print', action: 'Print', variant: 'primary' as const, key: 'action-print' },
                  { icon: '\uE711', label: 'Close', action: 'Close', variant: 'secondary' as const, key: 'action-close' },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    ref={btn.ref}
                    type="button"
                    className={`si-action-btn si-action-btn--${btn.variant}`}
                      title={
                        btn.disabled && btn.action === 'Record Payment'
                          ? 'Save invoice with balance due to record payment'
                          : `${btn.action}${btn.action === 'Save, Next (F11)' ? ' (F11)' : btn.action === 'Save, Print, Next (F12)' ? ' (F12)' : ''}`
                      }
                      disabled={('disabled' in btn ? btn.disabled : false) || doc.isSaving || doc.isLoading}
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

        <aside className="si-entry-rail" aria-label="Totals and payment">
          <PurchaseInvoiceTotalsRail displayTotals={doc.displayTotals} />
          <InvoicePaymentHistoryPanel
            billAmount={doc.totals.invoiceTotal}
            paidAmount={doc.totals.paidAmount}
            balanceDue={doc.totals.balanceDue}
            paymentLinks={doc.paymentLinks}
            voucherKind="payment"
            onOpenVoucher={(voucherNo) => {
              openPaymentVoucher({
                type: 'allocation',
                voucherNo,
                returnNavKey: NavKeys.PurchaseInvoice,
              });
              navigate('payment-voucher-allocation');
            }}
          />
        </aside>
      </FormKeyboardScope>
      </LoadingHost>
    </TransactionEntryShell>
  );
}

/** Tab order keys for keyboard parity tests / docs */
export const PURCHASE_INVOICE_FIELD_TAB_ORDER = [
  ...HEADER_FIELD_ORDER,
  'barcode',
  '(line grid)',
  'narration',
  'action-new',
  'action-save',
  'action-next',
  'action-sp',
  'action-pay',
  'action-print',
  'action-close',
];
