import { useCallback, useEffect, useState } from 'react';
import { fetchAccounts, type AccountRecord } from '../api/accounts';
import { createVoucher, fetchNextVoucherNo } from '../api/financeVouchers';
import { probeApiHealth } from '../api/client';
import { useAppNavigation } from '../context/AppNavigationContext';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { parseMoney } from '../sales-invoice/invoicePayment';
import type { VoucherModuleConfig } from './voucherConfigs';
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

  const lookupAccount = useCallback(() => {
    const code = accountCode.trim();
    if (!code) {
      setErrorMessage('Enter an account code to look up.');
      return;
    }
    const hit = accounts.find((a) => a.code.toUpperCase() === code.toUpperCase());
    if (!hit) {
      setErrorMessage(`No ${config.accountType} account found for code "${accountCode}".`);
      setAccountName('');
      return;
    }
    setErrorMessage(null);
    setAccountCode(hit.code);
    setAccountName(hit.name);
  }, [accountCode, accounts, config.accountType]);

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
        <div className="fv-entry__section-title">Voucher details</div>
        <div className="fv-entry__grid">
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Voucher No *</span>
            <input
              className="wpf-subpage-form-input"
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
            />
          </label>
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Ref. No</span>
            <input
              className="wpf-subpage-form-input"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
            />
          </label>
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Date *</span>
            <input
              type="date"
              className="wpf-subpage-form-input"
              value={voucherDate}
              onChange={(e) => setVoucherDate(e.target.value)}
            />
          </label>
        </div>

        <div className="fv-entry__section-title">Payment details</div>
        <div className="fv-entry__grid">
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Cash / Bank *</span>
            <select
              className="wpf-subpage-form-combo"
              value={cashBank}
              onChange={(e) => setCashBank(e.target.value as 'CASH' | 'BANK')}
            >
              {CASH_BANK_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Amount *</span>
            <input
              className="wpf-subpage-form-input"
              value={amount}
              inputMode="decimal"
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
        </div>

        <div className="fv-entry__section-title">{config.accountLabel}</div>
        <div className="fv-entry__account-row">
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Account code</span>
            <input
              className="wpf-subpage-form-input"
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value)}
            />
          </label>
          <button type="button" className="wpf-secondary-button" onClick={lookupAccount}>
            Look up
          </button>
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Account name</span>
            <input
              className="wpf-subpage-form-input"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </label>
        </div>

        <label className="fv-entry__field">
          <span className="wpf-subpage-form-label">Narration</span>
          <input
            className="wpf-subpage-form-input"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
          />
        </label>

        <div className="fv-entry__actions">
          <button
            type="button"
            className="wpf-primary-button"
            disabled={isSaving || !apiReady}
            onClick={() => void save()}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="wpf-secondary-button" disabled={isSaving} onClick={goBack}>
            Cancel
          </button>
        </div>
      </div>
    </TransactionEntryShell>
  );
}
