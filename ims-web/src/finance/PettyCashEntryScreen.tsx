import { useCallback, useEffect, useMemo, useState } from 'react';
import { createCashEntry, fetchNextCashEntryNo, type CashEntryLine } from '../api/pettyCash';
import { probeApiHealth } from '../api/client';
import { useAppNavigation } from '../context/AppNavigationContext';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { parseMoney } from '../sales-invoice/invoicePayment';
import './finance-voucher.scss';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyLine(srNo: number): CashEntryLine {
  return { srNo, particular: '', amount: 0 };
}

export function PettyCashEntryScreen() {
  const navigate = useAppNavigation();
  const [entryNo, setEntryNo] = useState('');
  const [entryDate, setEntryDate] = useState(todayIso());
  const [lines, setLines] = useState<CashEntryLine[]>([emptyLine(1)]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [apiReady, setApiReady] = useState(true);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0),
    [lines],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const apiUp = await probeApiHealth();
      if (cancelled) return;
      setApiReady(apiUp);
      if (apiUp) {
        const nextNo = await fetchNextCashEntryNo();
        if (!cancelled && nextNo != null) setEntryNo(String(nextNo));
      } else {
        setEntryNo('1');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateLine = useCallback((index: number, patch: Partial<CashEntryLine>) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch, srNo: i + 1 } : line)),
    );
  }, []);

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, emptyLine(prev.length + 1)]);
  }, []);

  const removeLine = useCallback((index: number) => {
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index).map((line, i) => ({ ...line, srNo: i + 1 }));
    });
  }, []);

  const goBack = useCallback(() => {
    navigate('petty-cash');
  }, [navigate]);

  const save = useCallback(async () => {
    setErrorMessage(null);

    const parsedEntryNo = parseInt(entryNo, 10);
    if (!Number.isFinite(parsedEntryNo) || parsedEntryNo <= 0) {
      setErrorMessage('Enter a valid entry number.');
      return;
    }

    const validLines = lines
      .map((line, i) => ({
        srNo: i + 1,
        particular: line.particular.trim(),
        amount: parseMoney(String(line.amount)),
      }))
      .filter((line) => line.particular || line.amount > 0);

    if (validLines.length === 0) {
      setErrorMessage('Add at least one line with an amount.');
      return;
    }

    if (validLines.some((line) => line.amount <= 0)) {
      setErrorMessage('Each line amount must be greater than zero.');
      return;
    }

    if (!apiReady) {
      setErrorMessage('API is unavailable — cannot save entry.');
      return;
    }

    setIsSaving(true);
    try {
      await createCashEntry({
        entryNo: parsedEntryNo,
        entryDate: new Date(entryDate).toISOString(),
        lines: validLines,
      });

      setStatusMessage('Petty cash entry saved.');
      setLines([emptyLine(1)]);
      setEntryDate(todayIso());
      const nextNo = await fetchNextCashEntryNo();
      if (nextNo != null) setEntryNo(String(nextNo));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }, [apiReady, entryDate, entryNo, lines]);

  return (
    <TransactionEntryShell
      title="Add Petty Cash Entry"
      titleRight={
        statusMessage || errorMessage || !apiReady ? (
          <span className="fv-entry__status" role="status">
            {!apiReady ? 'API offline — save disabled' : errorMessage ?? statusMessage}
          </span>
        ) : null
      }
    >
      <div className="fv-entry">
        <div className="fv-entry__grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Entry No *</span>
            <input
              className="wpf-subpage-form-input"
              value={entryNo}
              onChange={(e) => setEntryNo(e.target.value)}
            />
          </label>
          <label className="fv-entry__field">
            <span className="wpf-subpage-form-label">Date *</span>
            <input
              type="date"
              className="wpf-subpage-form-input"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </label>
        </div>

        <div className="fv-entry__section-title">Expense lines</div>
        <div className="fv-entry__lines">
          {lines.map((line, index) => (
            <div key={index} className="fv-entry__line-row">
              <span className="wpf-subpage-form-label">{index + 1}</span>
              <input
                className="wpf-subpage-form-input"
                placeholder="Particular"
                value={line.particular}
                onChange={(e) => updateLine(index, { particular: e.target.value })}
              />
              <input
                className="wpf-subpage-form-input"
                placeholder="Amount"
                inputMode="decimal"
                value={line.amount || ''}
                onChange={(e) => updateLine(index, { amount: parseMoney(e.target.value) })}
              />
              <button
                type="button"
                className="wpf-secondary-button"
                disabled={lines.length <= 1}
                onClick={() => removeLine(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="wpf-secondary-button" onClick={addLine}>
          Add line
        </button>

        <div className="fv-entry__total">
          Total: {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

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
