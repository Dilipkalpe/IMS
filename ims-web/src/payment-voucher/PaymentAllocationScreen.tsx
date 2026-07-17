import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAccounts, type AccountRecord } from '../api/accounts';
import { probeApiHealth } from '../api/client';
import {
  createPaymentVoucher,
  fetchNextPaymentVoucherNo,
  fetchOutstandingPurchaseInvoices,
  fetchPaymentVoucherByNo,
  updatePaymentVoucher,
  type OutstandingPurchaseInvoice,
} from '../api/paymentVouchers';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useAppNavigation } from '../context/AppNavigationContext';
import {
  buildAllocationPayload,
  remainingPaymentBalance,
  sumAllocationAmounts,
  validateAllocationRows,
  type AllocationRow,
} from '../finance/paymentAllocation';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { parseMoney } from '../sales-invoice/invoicePayment';
import {
  usePaymentVoucherNavIntent,
  type PaymentVoucherOpenIntent,
} from './context/PaymentVoucherNavIntent';
import '../finance/finance-voucher.scss';
import './payment-allocation.scss';

const CASH_BANK_OPTIONS = ['CASH', 'BANK'] as const;

interface AllocationGridRow extends AllocationRow {
  id: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toGridRow(inv: OutstandingPurchaseInvoice, allocationAmount = 0): AllocationGridRow {
  return {
    id: inv.sourceDocId,
    sourceDocId: inv.sourceDocId,
    sourceFormattedDocNo: inv.sourceFormattedDocNo,
    invoiceDate: inv.invoiceDate ?? '',
    totalAmount: inv.totalAmount,
    paidAmount: inv.paidAmount,
    outstandingBalance: inv.outstandingBalance,
    allocationAmount,
  };
}

export function PaymentAllocationScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = usePaymentVoucherNavIntent();

  const [intent, setIntent] = useState<PaymentVoucherOpenIntent>({ type: 'allocation' });
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [refNo, setRefNo] = useState('');
  const [voucherDate, setVoucherDate] = useState(todayIso());
  const [cashBank, setCashBank] = useState<'CASH' | 'BANK'>('CASH');
  const [amount, setAmount] = useState('0');
  const [narration, setNarration] = useState('');
  const [rows, setRows] = useState<AllocationGridRow[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const handledIntentRef = useRef(false);

  const returnNavKey =
    intent.type === 'allocation'
      ? intent.returnNavKey ?? 'payment-voucher'
      : intent.type === 'invoicePayment'
        ? intent.returnNavKey
        : 'payment-voucher';

  const paymentAmount = parseMoney(amount);
  const allocatedTotal = sumAllocationAmounts(rows);
  const unallocated = remainingPaymentBalance(paymentAmount, rows);

  const columns = useMemo<DataGridColumn<AllocationGridRow>[]>(
    () => [
      { id: 'sourceFormattedDocNo', header: 'Invoice No', width: 120, readOnly: true },
      { id: 'invoiceDate', header: 'Date', width: 110, readOnly: true },
      {
        id: 'totalAmount',
        header: 'Total',
        width: 110,
        readOnly: true,
        getValue: (row) => formatMoney(row.totalAmount),
      },
      {
        id: 'paidAmount',
        header: 'Paid',
        width: 110,
        readOnly: true,
        getValue: (row) => formatMoney(row.paidAmount),
      },
      {
        id: 'outstandingBalance',
        header: 'Outstanding',
        width: 120,
        readOnly: true,
        getValue: (row) => formatMoney(row.outstandingBalance),
      },
      {
        id: 'allocationAmount',
        header: 'Allocation',
        width: 130,
        getValue: (row) => String(row.allocationAmount || ''),
        setValue: (row, value) => {
          const alloc = parseMoney(value);
          const capped = Math.min(Math.max(0, alloc), row.outstandingBalance);
          return { ...row, allocationAmount: capped };
        },
      },
    ],
    [],
  );

  const loadOutstanding = useCallback(async (name: string, code: string) => {
    if (!name.trim() && !code.trim()) {
      setRows([]);
      return;
    }
    setLoadingInvoices(true);
    setErrorMessage(null);
    try {
      const items = await fetchOutstandingPurchaseInvoices({
        accountName: name.trim() || undefined,
        accountCode: code.trim() || undefined,
        supplier: name.trim() || undefined,
      });
      setRows(items.map((inv) => toGridRow(inv)));
    } catch (err) {
      setRows([]);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load outstanding invoices.');
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const applyIntent = useCallback(
    async (next: PaymentVoucherOpenIntent) => {
      setIntent(next);
      setErrorMessage(null);
      setStatusMessage(null);

      const apiUp = await probeApiHealth();
      setApiReady(apiUp);

      let supplierAccounts: AccountRecord[] = [];
      if (apiUp) {
        try {
          const result = await fetchAccounts({ type: 'supplier', limit: 500 });
          supplierAccounts = result.items ?? [];
          setAccounts(supplierAccounts);
        } catch {
          setAccounts([]);
        }
      }

      if (next.type === 'allocation' && next.voucherNo) {
        setIsEditMode(true);
        try {
          const voucher = await fetchPaymentVoucherByNo(next.voucherNo);
          setVoucherNo(String(voucher.voucherNo));
          setRefNo(voucher.refNo ?? '');
          setVoucherDate(voucher.voucherDate?.slice(0, 10) ?? todayIso());
          setCashBank((voucher.cashBank?.toUpperCase() === 'BANK' ? 'BANK' : 'CASH') as 'CASH' | 'BANK');
          setAccountCode(voucher.accountCode ?? next.accountCode ?? '');
          setAccountName(voucher.accountName ?? next.accountName ?? '');
          setAmount(String(voucher.amount ?? 0));
          setNarration(voucher.narration ?? '');

          const outstanding = await fetchOutstandingPurchaseInvoices({
            accountName: voucher.accountName,
            accountCode: voucher.accountCode,
            supplier: voucher.accountName,
          });

          const allocMap = new Map(
            (voucher.invoiceAllocations ?? []).map((a) => [
              a.sourceDocId || a.sourceFormattedDocNo,
              parseMoney(a.amount),
            ]),
          );

          const merged = new Map<string, AllocationGridRow>();
          for (const inv of outstanding) {
            merged.set(inv.sourceDocId, toGridRow(inv, allocMap.get(inv.sourceDocId) ?? 0));
          }
          for (const alloc of voucher.invoiceAllocations ?? []) {
            const key = alloc.sourceDocId || alloc.sourceFormattedDocNo || '';
            if (!key || merged.has(key)) continue;
            merged.set(key, {
              id: key,
              sourceDocId: alloc.sourceDocId ?? '',
              sourceFormattedDocNo: alloc.sourceFormattedDocNo ?? '',
              invoiceDate: '',
              totalAmount: parseMoney(alloc.amount),
              paidAmount: 0,
              outstandingBalance: parseMoney(alloc.amount),
              allocationAmount: parseMoney(alloc.amount),
            });
          }
          setRows([...merged.values()]);
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load voucher.');
        }
        return;
      }

      setIsEditMode(false);
      const nextNo = apiUp ? await fetchNextPaymentVoucherNo() : null;
      setVoucherNo(nextNo ? String(nextNo) : '');
      setRefNo('');
      setVoucherDate(todayIso());
      setCashBank('CASH');
      setAmount('0');
      setNarration('');
      setRows([]);

      if (next.type === 'allocation') {
        const code = next.accountCode ?? '';
        const name = next.accountName ?? '';
        setAccountCode(code);
        setAccountName(name);
        if (name || code) await loadOutstanding(name, code);
      } else {
        setAccountCode('');
        setAccountName('');
      }
    },
    [loadOutstanding],
  );

  useEffect(() => {
    return consumeOpenIntent((next) => {
      handledIntentRef.current = true;
      void applyIntent(next);
    });
  }, [applyIntent, consumeOpenIntent]);

  useEffect(() => {
    if (handledIntentRef.current) return;
    void applyIntent({ type: 'allocation' });
  }, [applyIntent]);

  const onAccountChange = useCallback(
    (code: string) => {
      const hit = accounts.find((a) => a.code === code);
      const name = hit?.name ?? '';
      setAccountCode(code);
      setAccountName(name);
      void loadOutstanding(name, code);
    },
    [accounts, loadOutstanding],
  );

  const onRowChange = useCallback((row: AllocationGridRow) => {
    setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)));
  }, []);

  const fillOutstanding = useCallback(() => {
    let remaining = paymentAmount;
    setRows((prev) =>
      prev.map((row) => {
        if (remaining <= 0) return { ...row, allocationAmount: 0 };
        const alloc = Math.min(row.outstandingBalance, remaining);
        remaining -= alloc;
        return { ...row, allocationAmount: alloc };
      }),
    );
  }, [paymentAmount]);

  const handleSave = useCallback(async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    const validation = validateAllocationRows(paymentAmount, rows);
    if (!validation.ok) {
      setErrorMessage(validation.message);
      return;
    }

    if (!accountName.trim()) {
      setErrorMessage('Select a supplier account.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        voucherNo: voucherNo ? Number(voucherNo) : undefined,
        refNo,
        voucherDate,
        cashBank,
        accountCode,
        accountName,
        amount: paymentAmount,
        narration,
        sourceDocType: 'purchase_invoice',
        invoiceAllocations: buildAllocationPayload(rows),
      };

      if (isEditMode && voucherNo) {
        await updatePaymentVoucher(Number(voucherNo), payload);
        setStatusMessage(`Payment voucher ${voucherNo} updated.`);
      } else {
        const created = await createPaymentVoucher(payload);
        setVoucherNo(String(created.voucherNo));
        setIsEditMode(true);
        setStatusMessage(`Payment voucher ${created.voucherNo} saved.`);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }, [
    accountCode,
    accountName,
    cashBank,
    isEditMode,
    narration,
    paymentAmount,
    refNo,
    rows,
    voucherDate,
    voucherNo,
  ]);

  return (
    <RefinedScreenShell>
      <TransactionEntryShell
        title={isEditMode ? `Payment Allocation — PV-${voucherNo}` : 'Payment Voucher Allocation'}
        titleRight={
          statusMessage || errorMessage ? (
            <span className="fv-entry__status" role="status">
              {errorMessage ?? statusMessage}
            </span>
          ) : null
        }
      >
        <div className="palloc">
          {!apiReady && (
            <p className="fv-entry__banner fv-entry__banner--warn">API offline — save is unavailable.</p>
          )}

          <div className="palloc__header mf-form__grid mf-form__grid--3">
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Voucher No</span>
              <input className="wpf-subpage-form-input" value={voucherNo} readOnly />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Date</span>
              <input
                type="date"
                className="wpf-subpage-form-input"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Ref. No</span>
              <input
                className="wpf-subpage-form-input"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Supplier account</span>
              <select
                className="wpf-subpage-form-input"
                value={accountCode}
                onChange={(e) => onAccountChange(e.target.value)}
                disabled={isEditMode}
              >
                <option value="">Select supplier…</option>
                {accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Cash / Bank</span>
              <select
                className="wpf-subpage-form-input"
                value={cashBank}
                onChange={(e) => setCashBank(e.target.value as 'CASH' | 'BANK')}
              >
                {CASH_BANK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Payment amount</span>
              <input
                className="wpf-subpage-form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
          </div>

          <div className="palloc__summary">
            <span>Allocated: {formatMoney(allocatedTotal)}</span>
            <span>Unallocated: {formatMoney(unallocated)}</span>
            <button type="button" className="wpf-secondary-button" onClick={fillOutstanding}>
              Auto-allocate
            </button>
            <button
              type="button"
              className="wpf-secondary-button"
              onClick={() => void loadOutstanding(accountName, accountCode)}
              disabled={loadingInvoices || !accountName}
            >
              Refresh invoices
            </button>
          </div>

          {loadingInvoices ? (
            <p className="palloc__loading">Loading outstanding invoices…</p>
          ) : (
            <CorporateDataGrid
              columns={columns}
              data={rows}
              editableColumnIds={['allocationAmount']}
              onRowChange={onRowChange}
            />
          )}
          {!loadingInvoices && rows.length === 0 && (
            <p className="palloc__empty">
              {accountName ? 'No outstanding invoices for this supplier.' : 'Select a supplier to load invoices.'}
            </p>
          )}

          <div className="mf-form__actions palloc__actions">
            <label className="mf-form__field mf-form__field--wide">
              <span className="wpf-subpage-form-label">Narration</span>
              <input
                className="wpf-subpage-form-input"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="wpf-primary-button"
              disabled={isSaving || !apiReady}
              onClick={() => void handleSave()}
            >
              {isEditMode ? 'Update allocation' : 'Save payment'}
            </button>
            <button type="button" className="wpf-secondary-button" onClick={() => navigate(returnNavKey)}>
              Back to list
            </button>
          </div>
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
