import { useCallback, useEffect, useState } from 'react';
import { probeApiHealth } from '../api/client';
import {
  createAccount,
  getAccountByCode,
  updateAccountByCode,
  type AccountRecord,
} from '../api/accounts';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormGrid, ErpFormSection } from '../components/form';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useAccountMasterNavIntent } from './context/AccountMasterNavIntent';
import './master-form.scss';

const PAGE_DESCRIPTION =
  'Customer / ledger master — contact, tax IDs, credit terms, and address.';

const EMPTY: AccountRecord = {
  code: '',
  name: '',
  accountType: 'customer',
  activeStatus: true,
  gstExempt: false,
  creditLimit: 0,
  creditDays: 0,
  openingBalance: 0,
  openingBalanceType: 'debit',
  billFormatAssignments: {},
};

function validate(form: AccountRecord): string | null {
  if (!form.code.trim()) return 'Account code is required.';
  if (!form.name.trim()) return 'Account name is required.';
  if (form.gstNo?.trim() && form.gstNo.trim().length < 15) {
    return 'GST number should be 15 characters when provided.';
  }
  return null;
}

export function AccountMasterFormScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = useAccountMasterNavIntent();
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [originalCode, setOriginalCode] = useState('');
  const [form, setForm] = useState<AccountRecord>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(true);

  const patch = useCallback(<K extends keyof AccountRecord>(key: K, value: AccountRecord[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadIntent = useCallback(
    async (intent: { type: 'new'; accountType?: 'customer' | 'supplier' } | { type: 'edit'; code: string }) => {
      setError(null);
      setStatus(null);
      const apiUp = await probeApiHealth();
      setApiReady(apiUp);

      if (intent.type === 'new') {
        setMode('new');
        setOriginalCode('');
        setForm({
          ...EMPTY,
          accountType: intent.accountType ?? 'customer',
        });
        return;
      }

      setMode('edit');
      setOriginalCode(intent.code);
      if (!apiUp) {
        setError('API offline — cannot load account.');
        return;
      }

      setLoading(true);
      try {
        const record = await getAccountByCode(intent.code);
        setForm({ ...EMPTY, ...record, code: record.code ?? intent.code });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => consumeOpenIntent(loadIntent), [consumeOpenIntent, loadIntent]);

  const listNavKey = form.accountType === 'supplier' ? 'suppliers' : 'account-ledger';
  const goBack = useCallback(() => navigate(listNavKey), [listNavKey, navigate]);

  const save = useCallback(async () => {
    setError(null);
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!apiReady) {
      setError('API offline — cannot save.');
      return;
    }

    setSaving(true);
    try {
      const payload: AccountRecord = {
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        gstNo: form.gstNo?.trim().toUpperCase() ?? '',
      };
      if (mode === 'new') {
        await createAccount(payload);
        setStatus('Account created.');
        setMode('edit');
        setOriginalCode(payload.code);
      } else {
        await updateAccountByCode(originalCode || payload.code, payload);
        setOriginalCode(payload.code);
        setStatus('Account saved.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [apiReady, form, mode, originalCode]);

  const title =
    mode === 'new'
      ? `Add ${form.accountType === 'supplier' ? 'Supplier' : 'Account'}`
      : `Edit Account — ${originalCode || form.code}`;

  return (
    <TransactionEntryShell
      title={title}
      titleRight={
        loading || status || error || !apiReady ? (
          <span className="mf-form__status" role="status">
            {loading ? 'Loading…' : !apiReady ? 'API offline' : error ?? status}
          </span>
        ) : null
      }
    >
      <div className="mf-form">
        <p className="mf-form__subtitle">{PAGE_DESCRIPTION}</p>

        <ErpFormSection className="mf-form__panel" aria-label="Account master form">
          <div className="erp-form-section__title">Account &amp; contact</div>
          <ErpFormGrid>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Type *</span>
              <select
                className="wpf-subpage-form-combo"
                value={form.accountType}
                disabled={mode === 'edit'}
                onChange={(e) => patch('accountType', e.target.value as 'customer' | 'supplier')}
              >
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
              </select>
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Code *</span>
              <input
                className="wpf-subpage-form-input"
                value={form.code}
                disabled={mode === 'edit'}
                onChange={(e) => patch('code', e.target.value.toUpperCase())}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Name *</span>
              <input
                className="wpf-subpage-form-input"
                value={form.name}
                onChange={(e) => patch('name', e.target.value)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Customer type</span>
              <input
                className="wpf-subpage-form-input"
                value={form.customerType ?? ''}
                onChange={(e) => patch('customerType', e.target.value)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Contact person</span>
              <input
                className="wpf-subpage-form-input"
                value={form.contactPerson ?? ''}
                onChange={(e) => patch('contactPerson', e.target.value)}
              />
            </label>
          </ErpFormGrid>

          <div className="erp-form-section__title">Communication</div>
          <ErpFormGrid columns={2}>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Email</span>
              <input
                className="wpf-subpage-form-input"
                value={form.email ?? ''}
                onChange={(e) => patch('email', e.target.value)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Mobile</span>
              <input
                className="wpf-subpage-form-input"
                value={form.mobileNo ?? ''}
                onChange={(e) => patch('mobileNo', e.target.value)}
              />
            </label>
          </ErpFormGrid>

          <div className="erp-form-section__title">Tax &amp; registration</div>
          <ErpFormGrid columns={2}>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">GST No</span>
              <input
                className="wpf-subpage-form-input"
                value={form.gstNo ?? ''}
                onChange={(e) => patch('gstNo', e.target.value.toUpperCase())}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">PAN</span>
              <input
                className="wpf-subpage-form-input"
                value={form.panNo ?? ''}
                onChange={(e) => patch('panNo', e.target.value.toUpperCase())}
              />
            </label>
          </ErpFormGrid>

          <ErpFormGrid columns={2} className="mf-form__checks-row">
            <label className="mf-form__field mf-form__field--check">
              <input
                type="checkbox"
                checked={form.gstExempt === true}
                onChange={(e) => patch('gstExempt', e.target.checked)}
              />
              <span>GST exempt</span>
            </label>
            <label className="mf-form__field mf-form__field--check">
              <input
                type="checkbox"
                checked={form.activeStatus !== false}
                onChange={(e) => patch('activeStatus', e.target.checked)}
              />
              <span>Active</span>
            </label>
          </ErpFormGrid>

          <div className="erp-form-section__title">Address &amp; location</div>
          <label className="mf-form__field mf-form__field--wide mf-form__field--textarea">
            <span className="wpf-subpage-form-label">Address</span>
            <textarea
              className="wpf-subpage-form-input"
              rows={3}
              value={form.address ?? ''}
              onChange={(e) => patch('address', e.target.value)}
            />
          </label>
          <ErpFormGrid>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">City</span>
              <input
                className="wpf-subpage-form-input"
                value={form.city ?? ''}
                onChange={(e) => patch('city', e.target.value)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">State</span>
              <input
                className="wpf-subpage-form-input"
                value={form.state ?? ''}
                onChange={(e) => patch('state', e.target.value)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Pincode</span>
              <input
                className="wpf-subpage-form-input"
                value={form.pincode ?? ''}
                onChange={(e) => patch('pincode', e.target.value)}
              />
            </label>
          </ErpFormGrid>

          <div className="erp-form-section__title">Credit &amp; turnover</div>
          <ErpFormGrid>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Credit limit</span>
              <input
                className="wpf-subpage-form-input"
                inputMode="decimal"
                value={form.creditLimit ?? 0}
                onChange={(e) => patch('creditLimit', Number(e.target.value) || 0)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Credit days</span>
              <input
                className="wpf-subpage-form-input"
                inputMode="numeric"
                value={form.creditDays ?? 0}
                onChange={(e) => patch('creditDays', Number(e.target.value) || 0)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Opening balance</span>
              <input
                className="wpf-subpage-form-input"
                inputMode="decimal"
                value={form.openingBalance ?? 0}
                onChange={(e) => patch('openingBalance', Number(e.target.value) || 0)}
              />
            </label>
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Balance type</span>
              <select
                className="wpf-subpage-form-combo"
                value={form.openingBalanceType ?? 'debit'}
                onChange={(e) => patch('openingBalanceType', e.target.value as 'debit' | 'credit')}
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </label>
          </ErpFormGrid>

          <div className="mf-form__actions mf-form__actions--end">
            <button type="button" className="wpf-secondary-button" disabled={saving} onClick={goBack}>
              Cancel
            </button>
            <button
              type="button"
              className="wpf-primary-button"
              disabled={saving || loading || !apiReady}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : 'Save account'}
            </button>
          </div>
          <p className="mf-form__footer-note">Save returns to the list. Required fields are marked with *.</p>
        </ErpFormSection>
      </div>
    </TransactionEntryShell>
  );
}
