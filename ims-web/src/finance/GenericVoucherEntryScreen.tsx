import { useCallback, useEffect, useState } from 'react';
import { fetchAccounts, type AccountRecord } from '../api/accounts';
import { createVoucher, fetchNextVoucherNo } from '../api/financeVouchers';
import { probeApiHealth } from '../api/client';
import { useAppNavigation } from '../context/AppNavigationContext';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormGrid, ErpFormNarration, ErpFormSection, ErpSearchableCombobox, ErpStaticSearchableSelect, customerAccountQuickAddConfig, supplierAccountQuickAddConfig } from '../components/form';
import { parseMoney } from '../sales-invoice/invoicePayment';
import type { VoucherModuleConfig } from './voucherConfigs';
import { FinanceVoucherActionRail } from '../components/finance/FinanceVoucherActionRail';
import { openListPrintPreview } from '../components/transaction/listExport';
import './finance-voucher.scss';

const CASH_BANK_OPTIONS = ['CASH', 'BANK'] as const;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function GenericVoucherEntryScreen({ config }: { config: VoucherModuleConfig }) {
  const navigate = useAppNavigation();
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

  const resetForm = useCallback(async () => {
    setRefNo('');
    setAmount('0');
    setCashBank('CASH');
    setAccountCode('');
    setAccountName('');
    setNarration('');
    setVoucherDate(todayIso());
    if (apiReady) {
      const nextNo = await fetchNextVoucherNo(config.apiPath);
      if (nextNo != null) setVoucherNo(String(nextNo));
    }
  }, [apiReady, config.apiPath]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErrorMessage(null);
      setStatusMessage(null);
      const apiUp = await probeApiHealth();
      if (cancelled) return;
      setApiReady(apiUp);

      if (apiUp) {
        try {
          const result = await fetchAccounts({ type: config.accountType, limit: 500 });
          if (!cancelled) setAccounts(result.items ?? []);
        } catch {
          if (!cancelled) setAccounts([]);
        }
        const nextNo = await fetchNextVoucherNo(config.apiPath);
        if (!cancelled && nextNo != null) setVoucherNo(String(nextNo));
      } else {
        setVoucherNo('1');
        setAccounts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.accountType, config.apiPath]);

  const onAccountSelect = useCallback(
    (code: string) => {
      const hit = accounts.find((a) => a.code === code);
      setAccountCode(code);
      setAccountName(hit?.name ?? '');
      setErrorMessage(null);
    },
    [accounts],
  );

  const accountQuickAdd =
    config.accountType === 'customer' ? customerAccountQuickAddConfig : supplierAccountQuickAddConfig;

  const goBack = useCallback(() => {
    navigate(config.listNavKey);
  }, [config.listNavKey, navigate]);

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
      setErrorMessage('API is unavailable — cannot save voucher.');
      return;
    }

    setIsSaving(true);
    try {
      await createVoucher(config.apiPath, {
        voucherNo: parsedVoucherNo,
        voucherType: config.voucherType,
        refNo: refNo.trim(),
        voucherDate: new Date(voucherDate).toISOString(),
        cashBank,
        accountCode: accountCode.trim().toUpperCase(),
        accountName: accountName.trim(),
        amount: parsedAmount,
        narration: narration.trim(),
      });

      setStatusMessage(`${config.title} saved.`);
      await resetForm();
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
    config.apiPath,
    config.title,
    config.voucherType,
    narration,
    refNo,
    resetForm,
    voucherDate,
    voucherNo,
  ]);

  const printVoucher = useCallback(() => {
    openListPrintPreview(
      config.title,
      `Voucher ${voucherNo} · ${voucherDate}`,
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
  }, [accountCode, accountName, amount, cashBank, config.title, narration, voucherDate, voucherNo]);

  return (
    <TransactionEntryShell
      title={`Add ${config.title}`}
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
          <div className="erp-form-section__title">{config.accountLabel}</div>
          <ErpFormGrid columns={2}>
            <label className="si-field erp-form-field--span-2">
              <span className="wpf-subpage-form-label">Account</span>
              <ErpSearchableCombobox
                value={accountCode}
                onChange={onAccountSelect}
                options={accounts.map((a) => ({
                  value: a.code,
                  label: `${a.code} — ${a.name}`,
                  searchText: `${a.code} ${a.name}`,
                }))}
                placeholder={`Search ${config.accountType} account…`}
                quickAdd={accountQuickAdd}
                onQuickAddSuccess={(option) => {
                  const namePart = option.label.includes(' — ')
                    ? option.label.split(' — ').slice(1).join(' — ')
                    : option.label;
                  setAccounts((prev) => {
                    if (prev.some((a) => a.code === option.value)) return prev;
                    return [
                      ...prev,
                      {
                        code: option.value,
                        name: namePart,
                        accountType: config.accountType,
                      },
                    ];
                  });
                  onAccountSelect(option.value);
                }}
                aria-label={config.accountLabel}
              />
            </label>
          </ErpFormGrid>
          <ErpFormNarration value={narration} onChange={(e) => setNarration(e.target.value)} />
        </ErpFormSection>

        <FinanceVoucherActionRail
          saving={isSaving}
          disabled={!apiReady}
          onNew={() => void resetForm()}
          onSave={() => void save()}
          onSaveAndNext={() => void save()}
          onPrint={printVoucher}
          onClose={goBack}
        />
      </div>
    </TransactionEntryShell>
  );
}
