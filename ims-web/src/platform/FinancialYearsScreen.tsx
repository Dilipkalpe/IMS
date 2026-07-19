import { useCallback, useMemo, useState } from 'react';
import { getAuthSession, saveAuthSession, type FinancialYearOption } from '../api/auth';
import { deleteFinancialYear, fetchFinancialYearsList, runFinancialYearEnd } from '../api/financialYears';
import { MasterListScreen } from '../masters/MasterListScreen';
import { FINANCIAL_YEARS_CONFIG } from '../masters/masterConfigs';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import './financial-years.scss';

function formatDateInput(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function FinancialYearsScreen() {
  const session = getAuthSession();
  const activeYearId = session?.financialYear?.id ?? '';
  const isAdmin = session?.isAdministrator === true;
  const [years, setYears] = useState<FinancialYearOption[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [yearEndOpen, setYearEndOpen] = useState(false);
  const [fromYearId, setFromYearId] = useState('');
  const [toName, setToName] = useState('');
  const [toStart, setToStart] = useState('');
  const [toEnd, setToEnd] = useState('');
  const [busy, setBusy] = useState(false);

  const reloadYears = useCallback(async () => {
    try {
      const list = await fetchFinancialYearsList();
      setYears(list);
      if (!fromYearId && list.length) {
        const open = list.find((y) => !y.closed) ?? list[0];
        setFromYearId(open.id);
      }
    } catch {
      setYears([]);
    }
  }, [fromYearId]);

  const openYears = useMemo(() => years.filter((y) => !y.closed), [years]);

  const switchYear = useCallback(
    (year: FinancialYearOption) => {
      if (!session) {
        setStatus('Sign in again to switch fiscal year.');
        return;
      }
      if (year.id === activeYearId) {
        setStatus(`Already working in ${year.financialYearName}.`);
        return;
      }
      saveAuthSession({ ...session, financialYear: year });
      setStatus(`Switched to ${year.financialYearName}. Reloading…`);
      window.setTimeout(() => window.location.reload(), 400);
    },
    [activeYearId, session],
  );

  const submitYearEnd = useCallback(async () => {
    if (!fromYearId || !toName.trim() || !toStart || !toEnd) {
      setStatus('Fill all year-end fields.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await runFinancialYearEnd({
        fromYearId,
        toFinancialYearName: toName.trim(),
        toStartDate: toStart,
        toEndDate: toEnd,
      });
      setStatus('Year-end completed. New fiscal year created.');
      setYearEndOpen(false);
      await reloadYears();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Year-end failed.');
    } finally {
      setBusy(false);
    }
  }, [fromYearId, reloadYears, toEnd, toName, toStart]);

  const handleDeleteYear = useCallback(
    async (year: FinancialYearOption) => {
      if (!window.confirm(`Delete fiscal year "${year.financialYearName}"? This cannot be undone.`)) return;
      setBusy(true);
      try {
        await deleteFinancialYear(year.id);
        setStatus(`Deleted ${year.financialYearName}.`);
        await reloadYears();
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Delete failed.');
      } finally {
        setBusy(false);
      }
    },
    [reloadYears],
  );

  return (
    <RefinedScreenShell>
      <div className="fy-screen">
        <div className="fy-screen__toolbar">
          <p className="fy-screen__active">
            Active session: <strong>{session?.financialYear?.financialYearName ?? '—'}</strong>
          </p>
          {status ? (
            <p className="fy-screen__status" role="status">
              {status}
            </p>
          ) : null}
          {isAdmin ? (
            <div className="fy-screen__actions">
              <button
                type="button"
                className="wpf-action-button"
                disabled={busy || openYears.length === 0}
                onClick={() => {
                  void reloadYears();
                  setYearEndOpen(true);
                }}
              >
                Year-end closing…
              </button>
              <button type="button" className="wpf-secondary-button" disabled={busy} onClick={() => void reloadYears()}>
                Refresh years
              </button>
            </div>
          ) : null}
        </div>

        {years.length > 0 ? (
          <div className="fy-screen__switch">
            <span className="fy-screen__switch-label">Switch fiscal year (session):</span>
            {years.map((y) => (
              <button
                key={y.id}
                type="button"
                className={`wpf-secondary-button${y.id === activeYearId ? ' fy-screen__year-btn--active' : ''}`}
                disabled={y.closed === true && y.id !== activeYearId}
                title={y.closed ? 'Closed year' : 'Switch to this year'}
                onClick={() => switchYear(y)}
              >
                {y.financialYearName}
                {y.closed ? ' (closed)' : ''}
                {y.id === activeYearId ? ' ✓' : ''}
              </button>
            ))}
            {isAdmin
              ? years
                  .filter((y) => y.id !== activeYearId && !y.closed)
                  .map((y) => (
                    <button
                      key={`del-${y.id}`}
                      type="button"
                      className="wpf-secondary-button fy-screen__delete-btn"
                      disabled={busy}
                      onClick={() => void handleDeleteYear(y)}
                    >
                      Delete {y.financialYearName}
                    </button>
                  ))
              : null}
          </div>
        ) : null}

        <MasterListScreen config={FINANCIAL_YEARS_CONFIG} />
      </div>

      {yearEndOpen ? (
        <div className="fy-year-end-dialog" role="dialog" aria-modal="true" aria-labelledby="fy-year-end-title">
          <div className="fy-year-end-dialog__panel">
            <h2 id="fy-year-end-title">Year-end closing</h2>
            <p>Close the source year and create the next fiscal period with opening balances.</p>
            <label className="fy-year-end-dialog__field">
              <span>Close year</span>
              <select
                className="wpf-subpage-form-combo"
                value={fromYearId}
                onChange={(e) => setFromYearId(e.target.value)}
              >
                {openYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.financialYearName}
                  </option>
                ))}
              </select>
            </label>
            <label className="fy-year-end-dialog__field">
              <span>New year name</span>
              <input
                className="wpf-subpage-form-input"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="FY 2026-27"
              />
            </label>
            <label className="fy-year-end-dialog__field">
              <span>Start date</span>
              <input
                type="date"
                className="wpf-subpage-form-input"
                value={toStart}
                onChange={(e) => setToStart(e.target.value)}
              />
            </label>
            <label className="fy-year-end-dialog__field">
              <span>End date</span>
              <input
                type="date"
                className="wpf-subpage-form-input"
                value={toEnd}
                onChange={(e) => setToEnd(e.target.value)}
              />
            </label>
            <div className="fy-year-end-dialog__actions">
              <button type="button" className="wpf-action-button" disabled={busy} onClick={() => void submitYearEnd()}>
                Run year-end
              </button>
              <button type="button" className="wpf-secondary-button" disabled={busy} onClick={() => setYearEndOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </RefinedScreenShell>
  );
}

export function formatFinancialYearDefaultDates(year: FinancialYearOption): { start: string; end: string } {
  return { start: formatDateInput(year.endDate), end: '' };
}
