import { useCallback, useRef } from 'react';
import { SalesCustomerSelect } from '../components/transaction/SalesCustomerSelect';
import { LoadingHost } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import type { CorporateDataGridHandle } from '../components/datagrid/CorporateDataGrid';
import { useSalesInvoicePrintActions } from '../document';
import { useAppNavigation } from '../context/AppNavigationContext';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { FIELD_FOCUS_KEY, focusFirstErrorField } from '../keyboard/formKeyboardNavigation';
import { useDocumentShortcuts } from '../keyboard/useDocumentShortcuts';
import { NavKeys } from '../navigation/navKeys';
import { normalizeDocPrefix } from '../components/transaction/docPrefix';
import { PAYMENT_MODES, PAYMENT_TYPES, PLACE_OF_SUPPLY } from './mockData';
import { SalesInvoiceLineItemsGrid } from './components/SalesInvoiceLineItemsGrid';
import { SalesInvoiceTotalsRail } from './components/SalesInvoiceTotalsRail';
import { useSalesInvoiceDeliveryChallanPick } from './useSalesInvoiceDeliveryChallanPick';
import { useSalesInvoiceDocument } from './useSalesInvoiceDocument';
import { useSalesInvoiceRecordPayment } from './useSalesInvoiceRecordPayment';
import { InvoicePaymentHistoryPanel } from '../components/finance/InvoicePaymentHistoryPanel';
import { useReceiptVoucherNavIntent } from '../receipt-voucher/context/ReceiptVoucherNavIntent';
import { useSalesInvoiceWorkspace } from './workspace/SalesInvoiceWorkspaceProvider';
import './sales-invoice.scss';

const HEADER_FIELD_ORDER = [
  'entryDocPrefix',
  'billNo',
  'customer',
  'invoiceDate',
  'dcReference',
  'dueDate',
  'sellerGstin',
  'customerGstin',
  'placeOfSupply',
  'paymentType',
  'paymentMode',
  'ewayBillNo',
  'ewayBillDate',
  'vehicleNo',
  'transporter',
  'transporterId',
  'distanceKm',
] as const;

export function SalesInvoiceEntryForm({
  tabId,
  lineCount = 0,
  autoFocusFieldKey = 'entryDocPrefix',
}: {
  tabId: string;
  lineCount?: number;
  autoFocusFieldKey?: string;
}) {
  const navigate = useAppNavigation();
  const ws = useSalesInvoiceWorkspace();
  const doc = useSalesInvoiceDocument(tabId);
  const { startLoadFromDeliveryChallans, pickBusy, pickDialog } =
    useSalesInvoiceDeliveryChallanPick(tabId, doc);
  const { startRecordPayment } = useSalesInvoiceRecordPayment(tabId);
  const { publishOpenIntent: openReceiptVoucher } = useReceiptVoucherNavIntent();
  const { print, savePrintNext } = useSalesInvoicePrintActions();
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
        if (saved.ok) {
          await doc.notifyAfterSave({
            header: ws.getDocument(tabId).header,
            invoiceTotal: doc.totals.invoiceTotal,
            balanceDue: doc.totals.balanceDue,
          });
        }
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
        navigate(NavKeys.SalesInvoice);
        return;
      }
      if (label === 'Print' || label === 'Save, Print, Next (F12)') {
        await runPrintFlow(label);
        return;
      }
      if (label === 'Record Payment') {
        const pay = await startRecordPayment();
        if (!pay.ok) {
          requestAnimationFrame(() => focusValidationError(pay.firstField));
          if (pay.message) doc.setStatus(pay.message);
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
    <TransactionEntryShell title="Sales Invoice">
      <LoadingHost loading={doc.isLoading} title="Loading document…" className="loading-host--entry">
      {pickDialog}
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
            <section className="si-section">
              <div className="si-header-grid">
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Prefix</span>
                  <input
                    className={`wpf-subpage-form-input${isEdit ? ' si-readonly' : ''}`}
                    {...{ [FIELD_FOCUS_KEY]: 'entryDocPrefix' }}
                    value={h.entryDocPrefix}
                    readOnly={isEdit}
                    onChange={(e) => doc.updateHeader('entryDocPrefix', normalizeDocPrefix(e.target.value, 'SI'))}
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
                  <span className="wpf-subpage-form-label">Customer Name</span>
                  <SalesCustomerSelect
                    value={h.customer}
                    onChange={(v) => doc.updateHeader('customer', v)}
                    error={doc.fieldError('customer')}
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
                <label className="si-field si-field--with-action">
                  <span className="wpf-subpage-form-label">DC Reference</span>
                  <div className="si-field-action-row">
                    <input
                      className="wpf-subpage-form-input si-readonly"
                      {...{ [FIELD_FOCUS_KEY]: 'dcReference' }}
                      value={h.dcReference}
                      readOnly
                      tabIndex={0}
                      title="Filled automatically from selected delivery challans"
                      placeholder="Load delivery challans to fill"
                    />
                    <button
                      type="button"
                      className="wpf-secondary-button si-field-action-row__btn"
                      disabled={pickBusy || doc.isLoading}
                      title="Select multiple delivery challans for this customer"
                      onClick={() => void startLoadFromDeliveryChallans()}
                    >
                      Load DCs
                    </button>
                  </div>
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
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Payment Type</span>
                  <select
                    className="wpf-subpage-form-combo"
                    {...{ [FIELD_FOCUS_KEY]: 'paymentType' }}
                    value={h.paymentType}
                    onChange={(e) => doc.updatePaymentType(e.target.value)}
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
                    disabled={!doc.paymentModeEnabled}
                    onChange={(e) => doc.updateHeader('paymentMode', e.target.value)}
                  >
                    {PAYMENT_MODES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="si-eway-header-row" aria-label="E-way Bill">
                <label className="si-field">
                  <span className="wpf-subpage-form-label">E-way Bill No</span>
                  <input
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'ewayBillNo' }}
                    value={h.ewayBillNo}
                    maxLength={24}
                    title="Enter E-way Bill number from the GST portal"
                    onChange={(e) => doc.updateHeader('ewayBillNo', e.target.value)}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">E-way Bill Date</span>
                  <input
                    type="date"
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'ewayBillDate' }}
                    value={h.ewayBillDate}
                    onChange={(e) => doc.updateHeader('ewayBillDate', e.target.value)}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Vehicle No</span>
                  <input
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'vehicleNo' }}
                    value={h.vehicleNo}
                    maxLength={20}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => doc.updateHeader('vehicleNo', e.target.value.toUpperCase())}
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
                  <span className="wpf-subpage-form-label">Transporter ID</span>
                  <input
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'transporterId' }}
                    value={h.transporterId}
                    maxLength={15}
                    style={{ textTransform: 'uppercase' }}
                    title="Transporter GSTIN / ID"
                    onChange={(e) => doc.updateHeader('transporterId', e.target.value.toUpperCase())}
                  />
                </label>
                <label className="si-field">
                  <span className="wpf-subpage-form-label">Distance (Km)</span>
                  <input
                    className="wpf-subpage-form-input"
                    {...{ [FIELD_FOCUS_KEY]: 'distanceKm' }}
                    value={h.distanceKm}
                    inputMode="decimal"
                    onChange={(e) => doc.updateHeader('distanceKm', e.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="si-section si-section--grow si-section--lines-panel">
              <SalesInvoiceLineItemsGrid doc={doc} gridRef={gridRef} onExitGridEnd={focusNarration} />
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
                      disabled={'disabled' in btn ? btn.disabled : doc.isSaving || doc.isLoading}
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
          <SalesInvoiceTotalsRail
            displayTotals={doc.displayTotals}
            isPartialPayment={doc.isPartialPayment}
            partialPaidAmount={doc.header.paidAmount}
            onPartialPaidChange={doc.updatePaidAmount}
          />
          <InvoicePaymentHistoryPanel
            billAmount={doc.totals.invoiceTotal}
            paidAmount={doc.totals.paidAmount}
            balanceDue={doc.totals.balanceDue}
            paymentLinks={doc.paymentLinks}
            voucherKind="receipt"
            onOpenVoucher={(voucherNo) => {
              openReceiptVoucher({
                type: 'view',
                voucherNo,
                returnNavKey: NavKeys.SalesInvoice,
              });
              navigate('receipt-voucher-entry');
            }}
          />
        </aside>
      </FormKeyboardScope>
      </LoadingHost>
    </TransactionEntryShell>
  );
}

/** Tab order keys for keyboard parity tests / docs */
export const SALES_INVOICE_FIELD_TAB_ORDER = [
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
