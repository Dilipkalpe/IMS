import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import {
  createPayrollEmployee,
  getPayrollEmployeeByCode,
  updatePayrollEmployeeByCode,
  validatePayrollEmployeeForm,
  type PayrollEmployeeRecord,
} from '../api/payrollEmployees';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useAppNavigation } from '../context/AppNavigationContext';
import { NavKeys } from '../navigation/navKeys';
import {
  PAYROLL_EMPLOYEE_TYPE_LABELS,
  PAYROLL_EMPLOYEE_TYPES,
  normalizePayrollEmployeeType,
} from './payrollEmployeeTypes';
import { usePayrollEmployeeNavIntent } from './context/PayrollEmployeeNavIntent';
import '../masters/master-form.scss';

const EMPTY: PayrollEmployeeRecord = {
  employeeCode: '',
  fullName: '',
  employeeType: 'permanent',
  monthlySalary: 0,
  dailyWage: 0,
  contractStartDate: '',
  contractEndDate: '',
  department: '',
  designation: '',
  panNo: '',
  hraPercent: 40,
  otherAllowances: 0,
  bonusPercent: 0,
  otherDeductions: 0,
  paidDaysPerMonth: 26,
  tdsPercent: 0,
  pfApplicable: true,
  esiApplicable: true,
  ptApplicable: true,
  activeStatus: true,
};

export function PayrollEmployeeFormScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = usePayrollEmployeeNavIntent();
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [originalCode, setOriginalCode] = useState('');
  const [form, setForm] = useState<PayrollEmployeeRecord>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(true);

  const employeeType = normalizePayrollEmployeeType(form.employeeType);
  const showMonthlySalary = employeeType === 'permanent' || employeeType === 'temporary';
  const showDailyWage = employeeType === 'daily';
  const showContractDates = employeeType === 'temporary';

  const patch = useCallback(<K extends keyof PayrollEmployeeRecord>(key: K, value: PayrollEmployeeRecord[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadIntent = useCallback(async (intent: { type: 'new' } | { type: 'edit'; code: string }) => {
    setError(null);
    setStatus(null);
    const apiUp = await probeApiHealth();
    setApiReady(apiUp);

    if (intent.type === 'new') {
      setMode('new');
      setOriginalCode('');
      setForm({ ...EMPTY });
      return;
    }

    setMode('edit');
    setOriginalCode(intent.code);
    if (!apiUp) {
      setError('API offline — cannot load employee.');
      return;
    }

    setLoading(true);
    try {
      const record = await getPayrollEmployeeByCode(intent.code);
      setForm(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employee.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => consumeOpenIntent((intent) => void loadIntent(intent)), [consumeOpenIntent, loadIntent]);

  const title = useMemo(() => (mode === 'new' ? 'Add Payroll Employee' : 'Edit Payroll Employee'), [mode]);

  const handleSave = async () => {
    const validationError = validatePayrollEmployeeForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const payload: PayrollEmployeeRecord = {
        ...form,
        employeeType,
        employeeCode: form.employeeCode.trim().toUpperCase(),
      };
      if (mode === 'new') {
        await createPayrollEmployee(payload);
        setStatus('Employee created.');
      } else {
        await updatePayrollEmployeeByCode(originalCode, payload);
        setStatus('Employee updated.');
      }
      navigate(NavKeys.PayrollEmployees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TransactionEntryShell
      title={title}
      titleRight={
        loading || status || error || !apiReady ? (
          <span className="mf-form__status" role={error ? 'alert' : 'status'}>
            {loading ? 'Loading…' : !apiReady ? 'API offline' : error ?? status}
          </span>
        ) : null
      }
    >
      <div className="mf-form">
        <div className="mf-form__section-title">Employee profile</div>
        <div className="mf-form__grid mf-form__grid--2">
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Employee Code *</span>
            <input
              className="wpf-subpage-form-input"
              value={form.employeeCode}
              readOnly={mode === 'edit'}
              onChange={(e) => patch('employeeCode', e.target.value.toUpperCase())}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Full Name *</span>
            <input
              className="wpf-subpage-form-input"
              value={form.fullName}
              onChange={(e) => patch('fullName', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Employee Type *</span>
            <select
              className="wpf-subpage-form-input"
              value={employeeType}
              onChange={(e) => patch('employeeType', normalizePayrollEmployeeType(e.target.value))}
            >
              {PAYROLL_EMPLOYEE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PAYROLL_EMPLOYEE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Department</span>
            <input
              className="wpf-subpage-form-input"
              value={form.department}
              onChange={(e) => patch('department', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Designation</span>
            <input
              className="wpf-subpage-form-input"
              value={form.designation}
              onChange={(e) => patch('designation', e.target.value)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">PAN</span>
            <input
              className="wpf-subpage-form-input"
              value={form.panNo}
              onChange={(e) => patch('panNo', e.target.value.toUpperCase())}
            />
          </label>
        </div>

        <div className="mf-form__section-title">Compensation</div>
        <div className="mf-form__grid mf-form__grid--2">
          {showMonthlySalary && (
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Monthly Salary *</span>
              <input
                className="wpf-subpage-form-input"
                type="number"
                min={0}
                value={form.monthlySalary || ''}
                onChange={(e) => patch('monthlySalary', Number(e.target.value) || 0)}
              />
            </label>
          )}
          {showDailyWage && (
            <label className="mf-form__field">
              <span className="wpf-subpage-form-label">Daily Wage Rate *</span>
              <input
                className="wpf-subpage-form-input"
                type="number"
                min={0}
                value={form.dailyWage || ''}
                onChange={(e) => patch('dailyWage', Number(e.target.value) || 0)}
              />
            </label>
          )}
          {showContractDates && (
            <>
              <label className="mf-form__field">
                <span className="wpf-subpage-form-label">Contract Start Date *</span>
                <input
                  className="wpf-subpage-form-input"
                  type="date"
                  value={form.contractStartDate ?? ''}
                  onChange={(e) => patch('contractStartDate', e.target.value)}
                />
              </label>
              <label className="mf-form__field">
                <span className="wpf-subpage-form-label">Contract End Date *</span>
                <input
                  className="wpf-subpage-form-input"
                  type="date"
                  value={form.contractEndDate ?? ''}
                  onChange={(e) => patch('contractEndDate', e.target.value)}
                />
              </label>
            </>
          )}
          {employeeType !== 'daily' && (
            <>
              <label className="mf-form__field">
                <span className="wpf-subpage-form-label">HRA %</span>
                <input
                  className="wpf-subpage-form-input"
                  type="number"
                  min={0}
                  value={form.hraPercent}
                  onChange={(e) => patch('hraPercent', Number(e.target.value) || 0)}
                />
              </label>
              <label className="mf-form__field">
                <span className="wpf-subpage-form-label">Other Allowances</span>
                <input
                  className="wpf-subpage-form-input"
                  type="number"
                  min={0}
                  value={form.otherAllowances}
                  onChange={(e) => patch('otherAllowances', Number(e.target.value) || 0)}
                />
              </label>
              <label className="mf-form__field">
                <span className="wpf-subpage-form-label">Bonus %</span>
                <input
                  className="wpf-subpage-form-input"
                  type="number"
                  min={0}
                  value={form.bonusPercent}
                  onChange={(e) => patch('bonusPercent', Number(e.target.value) || 0)}
                />
              </label>
              <label className="mf-form__field">
                <span className="wpf-subpage-form-label">Paid Days / Month</span>
                <input
                  className="wpf-subpage-form-input"
                  type="number"
                  min={1}
                  value={form.paidDaysPerMonth}
                  onChange={(e) => patch('paidDaysPerMonth', Number(e.target.value) || 26)}
                />
              </label>
            </>
          )}
        </div>

        <div className="mf-form__section-title">Statutory &amp; deductions</div>
        <div className="mf-form__grid mf-form__grid--2">
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">TDS %</span>
            <input
              className="wpf-subpage-form-input"
              type="number"
              min={0}
              value={form.tdsPercent}
              onChange={(e) => patch('tdsPercent', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field">
            <span className="wpf-subpage-form-label">Other Deductions</span>
            <input
              className="wpf-subpage-form-input"
              type="number"
              min={0}
              value={form.otherDeductions}
              onChange={(e) => patch('otherDeductions', Number(e.target.value) || 0)}
            />
          </label>
          <label className="mf-form__field mf-form__field--check">
            <input
              type="checkbox"
              checked={form.pfApplicable}
              onChange={(e) => patch('pfApplicable', e.target.checked)}
            />
            <span>PF applicable</span>
          </label>
          <label className="mf-form__field mf-form__field--check">
            <input
              type="checkbox"
              checked={form.esiApplicable}
              onChange={(e) => patch('esiApplicable', e.target.checked)}
            />
            <span>ESI applicable</span>
          </label>
          <label className="mf-form__field mf-form__field--check">
            <input
              type="checkbox"
              checked={form.ptApplicable}
              onChange={(e) => patch('ptApplicable', e.target.checked)}
            />
            <span>Professional tax applicable</span>
          </label>
          <label className="mf-form__field mf-form__field--check">
            <input
              type="checkbox"
              checked={form.activeStatus}
              onChange={(e) => patch('activeStatus', e.target.checked)}
            />
            <span>Active</span>
          </label>
        </div>

        <div className="mf-form__actions">
          <button type="button" className="wpf-primary-button" disabled={saving || loading} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="wpf-secondary-button"
            onClick={() => navigate(NavKeys.PayrollEmployees)}
          >
            Back to list
          </button>
        </div>
      </div>
    </TransactionEntryShell>
  );
}
