import { useCallback, useEffect, useState } from 'react';
import { fetchAccounts, type AccountRecord } from '../api/accounts';
import { createPaymentVoucher, fetchNextPaymentVoucherNo } from '../api/paymentVouchers';
import { probeApiHealth } from '../api/client';
import { useAppNavigation } from '../context/AppNavigationContext';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormGrid, ErpFormNarration, ErpFormSection, ErpSearchableCombobox, ErpStaticSearchableSelect, supplierAccountQuickAddConfig } from '../components/form';
import { parseMoney } from '../sales-invoice/invoicePayment';
import type { InvoicePaymentSeed } from '../types/invoicePaymentSeed';
import {
  usePaymentVoucherNavIntent,
  type PaymentVoucherOpenIntent,
} from './context/PaymentVoucherNavIntent';
import { FinanceVoucherActionRail } from '../components/finance/FinanceVoucherActionRail';
import { openListPrintPreview } from '../components/transaction/listExport';
import '../finance/finance-voucher.scss';

const CASH_BANK_OPTIONS = ['CASH', 'BANK'] as const;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolveAccountFromSeed(seed: InvoicePaymentSeed, accounts: AccountRecord[]) {
  if (seed.partyAccountCode) {
    const code = seed.partyAccountCode.trim().toUpperCase();
    const hit = accounts.find((a) => a.code.toUpperCase() === code);
    if (hit) return { code: hit.code, name: hit.name };
    return { code: seed.partyAccountCode, name: seed.partyName };
  }

  const byName = accounts.find(
    (a) => a.name.localeCompare(seed.partyName, undefined, { sensitivity: 'accent' }) === 0,
  );
  if (byName) return { code: byName.code, name: byName.name };
  return { code: '', name: seed.partyName };
}

export function PaymentVoucherEntryScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = usePaymentVoucherNavIntent();

  const [intent, setIntent] = useState<PaymentVoucherOpenIntent>({ type: 'new' });
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [voucherNo, setVoucherNo] = useState('');
  const [refNo, setRefNo] = useState('');
  const [voucherDate, setVoucherDate] = useState(todayIso());
  const [cashBank, setCashBank] = useState<'CASH' | 'BANK'>('CASH');
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('0');
  const [narration, setNarration] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [apiReady, setApiReady] = useState(true);

  const invoiceSeed = intent.type === 'invoicePayment' ? intent.seed : null;
  const returnNavKey =
    intent.type === 'invoicePayment'
      ? intent.returnNavKey
      : intent.returnNavKey ?? 'payment-voucher';

  const pageTitle = invoiceSeed
    ? `Payment — pay invoice ${invoiceSeed.formattedDocNo}`
    : 'Add Payment Voucher';

  const applyIntent = useCallback(async (next: PaymentVoucherOpenIntent) => {
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

    if (next.type === 'invoicePayment') {
      const seed = next.seed;
      const account = resolveAccountFromSeed(seed, supplierAccounts);
      setRefNo(seed.formattedDocNo);
      setAmount(seed.amountDue > 0 ? seed.amountDue.toFixed(2) : '0');
      setCashBank(seed.cashBank);
      setAccountCode(account.code);
      setAccountName(account.name);
      setNarration(`Payment against purchase invoice ${seed.formattedDocNo}`);
    } else {
      setRefNo('');
      setAmount('0');
      setCashBank('CASH');
      setAccountCode('');
      setAccountName('');
      setNarration('');
    }

    setVoucherDate(todayIso());

    if (apiUp) {
      const nextNo = await fetchNextPaymentVoucherNo();
      if (nextNo != null) setVoucherNo(String(nextNo));
    } else {
      setVoucherNo('1');
    }
  }, []);

  useEffect(() => consumeOpenIntent(applyIntent), [applyIntent, consumeOpenIntent]);

  const onAccountSelect = useCallback(
    (code: string) => {
      const hit = accounts.find((a) => a.code === code);
      setAccountCode(code);
      setAccountName(hit?.name ?? '');
      setErrorMessage(null);
    },
    [accounts],
  );

  const goBack = useCallback(() => {
    navigate(returnNavKey);
  }, [navigate, returnNavKey]);

  const save = useCallback(async () => {
    setErrorMessage(null);

    const parsedAmount = parseMoney(amount);
    if (parsedAmount <= 0) {
      setErrorMessage('Amount must be greater than zero.');
      return;
    }

    if (!accountCode.trim() && !accountName.trim()) {
      setErrorMessage('Select or look up an account.');
      return;
    }

    const parsedVoucherNo = parseInt(voucherNo, 10);
    if (!Number.isFinite(parsedVoucherNo) || parsedVoucherNo <= 0) {
      setErrorMessage('Enter a valid voucher number.');
      return;
    }

    if (!apiReady) {
      setErrorMessage('API is unavailable — cannot save payment voucher.');
      return;
    }

    setIsSaving(true);
    try {
      const allocation =
        invoiceSeed && parsedAmount > 0
          ? [
              {
                sourceDocType: invoiceSeed.sourceDocType,
                sourceDocId: invoiceSeed.sourceDocId,
                sourceFormattedDocNo: invoiceSeed.formattedDocNo,
                amount: parsedAmount,
              },
            ]
          : undefined;

      await createPaymentVoucher({
        voucherNo: parsedVoucherNo,
        refNo: refNo.trim() || invoiceSeed?.formattedDocNo,
        voucherDate: new Date(voucherDate).toISOString(),
        cashBank,
        accountCode: accountCode.trim().toUpperCase(),
        accountName: accountName.trim(),
        amount: parsedAmount,
        narration: narration.trim(),
        sourceDocType: invoiceSeed?.sourceDocType,
        sourceDocId: invoiceSeed?.sourceDocId,
        sourceFormattedDocNo: invoiceSeed?.formattedDocNo,
        invoiceAllocations: allocation,
      });

      if (intent.type === 'invoicePayment') {
        intent.onPaymentRecorded?.();
        setStatusMessage(`Payment saved and linked to invoice ${invoiceSeed?.formattedDocNo}.`);
        navigate(returnNavKey);
        return;
      }

      setStatusMessage('Payment voucher saved.');
      const nextNo = await fetchNextPaymentVoucherNo();
      if (nextNo != null) setVoucherNo(String(nextNo));
      setRefNo('');
      setAccountCode('');
      setAccountName('');
      setAmount('0');
      setNarration('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }, [
    accountCode,
    accountName,
    amount,
    apiReady,
    cashBank,
    intent,
    invoiceSeed,
    narration,
    navigate,
    refNo,
    returnNavKey,
    voucherDate,
    voucherNo,
  ]);

  const printVoucher = useCallback(() => {
    openListPrintPreview(
      pageTitle,
      `Payment voucher ${voucherNo}`,
      [
        { id: 'voucherNo', header: 'Voucher No' },
        { id: 'voucherDate', header: 'Date' },
        { id: 'cashBank', header: 'Cash/Bank' },
        { id: 'account', header: 'Account' },
        { id: 'amount', header: 'Amount' },
        { id: 'narration', header: 'Narration' },
      ],
      [
        {
          voucherNo,
          voucherDate,
          cashBank,
          account: accountCode ? `${accountCode} — ${accountName}` : accountName,
          amount,
          narration,
        },
      ],
    );
  }, [accountCode, accountName, amount, cashBank, narration, pageTitle, voucherDate, voucherNo]);

  return (
    <TransactionEntryShell
      title={pageTitle}
      titleRight={
        statusMessage || errorMessage || !apiReady ? (
          <span className="fv-entry__status" role="status">
            {!apiReady ? 'API offline — save disabled' : errorMessage ?? statusMessage}
          </span>
        ) : null
      }
    >
      <div className="fv-entry">
        <ErpFormSection>
          <div className="erp-form-section__title">Voucher details</div>
          <ErpFormGrid>
            <label className="si-field">
              <span className="wpf-subpage-form-label">Voucher No *</span>
              <input
                className="wpf-subpage-form-input"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
              />
            </label>
            <label className="si-field">
              <span className="wpf-subpage-form-label">Ref. No</span>
              <input
                className="wpf-subpage-form-input"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
              />
            </label>
            <label className="si-field">
              <span className="wpf-subpage-form-label">Date *</span>
              <input
                type="date"
                className="wpf-subpage-form-input"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
              />
            </label>
          </ErpFormGrid>
        </ErpFormSection>

        <ErpFormSection>
          <div className="erp-form-section__title">Payment details</div>
          <ErpFormGrid columns={2}>
            <label className="si-field">
              <span className="wpf-subpage-form-label">Cash / Bank *</span>
              <ErpStaticSearchableSelect
                value={cashBank}
                onChange={(v) => setCashBank(v as 'CASH' | 'BANK')}
                options={CASH_BANK_OPTIONS}
                placeholder="Cash or bank…"
                aria-label="Cash or bank"
              />
            </label>
            <label className="si-field">
              <span className="wpf-subpage-form-label">Amount *</span>
              <input
                className="wpf-subpage-form-input"
                value={amount}
                inputMode="decimal"
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
          </ErpFormGrid>
        </ErpFormSection>

        <ErpFormSection>
          <div className="erp-form-section__title">Supplier account</div>
          <ErpFormGrid columns={2}>
            <label className="si-field erp-form-field--span-2">
              <span className="wpf-subpage-form-label">Supplier account</span>
              <ErpSearchableCombobox
                value={accountCode}
                onChange={onAccountSelect}
                options={accounts.map((a) => ({
                  value: a.code,
                  label: `${a.code} — ${a.name}`,
                  searchText: `${a.code} ${a.name}`,
                }))}
                placeholder="Search supplier account…"
                quickAdd={supplierAccountQuickAddConfig}
                onQuickAddSuccess={(option) => {
                  const namePart = option.label.includes(' — ')
                    ? option.label.split(' — ').slice(1).join(' — ')
                    : option.label;
                  setAccounts((prev) => {
                    if (prev.some((a) => a.code === option.value)) return prev;
                    return [...prev, { code: option.value, name: namePart, accountType: 'supplier' }];
                  });
                  onAccountSelect(option.value);
                }}
                aria-label="Supplier account"
              />
            </label>
          </ErpFormGrid>
          <ErpFormNarration value={narration} onChange={(e) => setNarration(e.target.value)} />
        </ErpFormSection>

        <FinanceVoucherActionRail
          saving={isSaving}
          disabled={!apiReady}
          onSave={() => void save()}
          onSaveAndNext={() => void save()}
          onPrint={printVoucher}
          onClose={goBack}
        />
      </div>
    </TransactionEntryShell>
  );
}
